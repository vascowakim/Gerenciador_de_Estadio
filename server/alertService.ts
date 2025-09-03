import { db } from "./db";
import { internshipAlerts, mandatoryInternships, nonMandatoryInternships, students, advisors, users } from "@shared/schema";
import { eq, and, lte, gte, isNull } from "drizzle-orm";
import type { InsertInternshipAlert } from "@shared/schema";
import twilio from "twilio";

// Função para obter cliente Twilio
function getTwilioClient() {
  if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN || !process.env.TWILIO_PHONE_NUMBER) {
    throw new Error("Credenciais do Twilio não configuradas. Configure TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN e TWILIO_PHONE_NUMBER");
  }
  return twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
}

export class AlertService {
  // Verificar estágios próximos ao vencimento (30 dias)
  async checkExpiringInternships(): Promise<void> {
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

    // Verificar estágios obrigatórios
    await this.checkExpiringMandatoryInternships(thirtyDaysFromNow);
    
    // Verificar estágios não obrigatórios
    await this.checkExpiringNonMandatoryInternships(thirtyDaysFromNow);
  }

  private async checkExpiringMandatoryInternships(thirtyDaysFromNow: Date): Promise<void> {
    const expiringInternships = await db
      .select({
        id: mandatoryInternships.id,
        studentId: mandatoryInternships.studentId,
        advisorId: mandatoryInternships.advisorId,
        endDate: mandatoryInternships.endDate,
        student: students,
        advisor: advisors
      })
      .from(mandatoryInternships)
      .innerJoin(students, eq(mandatoryInternships.studentId, students.id))
      .innerJoin(advisors, eq(mandatoryInternships.advisorId, advisors.id))
      .where(
        and(
          lte(mandatoryInternships.endDate, thirtyDaysFromNow),
          gte(mandatoryInternships.endDate, new Date())
        )
      );

    for (const internship of expiringInternships) {
      await this.createExpirationAlert(
        internship.id,
        "mandatory",
        internship.endDate!,
        internship.student,
        internship.advisor
      );
    }
  }

  private async checkExpiringNonMandatoryInternships(thirtyDaysFromNow: Date): Promise<void> {
    const expiringInternships = await db
      .select({
        id: nonMandatoryInternships.id,
        studentId: nonMandatoryInternships.studentId,
        advisorId: nonMandatoryInternships.advisorId,
        endDate: nonMandatoryInternships.endDate,
        student: students,
        advisor: advisors
      })
      .from(nonMandatoryInternships)
      .innerJoin(students, eq(nonMandatoryInternships.studentId, students.id))
      .innerJoin(advisors, eq(nonMandatoryInternships.advisorId, advisors.id))
      .where(
        and(
          lte(nonMandatoryInternships.endDate, thirtyDaysFromNow),
          gte(nonMandatoryInternships.endDate, new Date())
        )
      );

    for (const internship of expiringInternships) {
      await this.createExpirationAlert(
        internship.id,
        "non_mandatory",
        internship.endDate!,
        internship.student,
        internship.advisor
      );
    }
  }

  private async createExpirationAlert(
    internshipId: string,
    internshipType: "mandatory" | "non_mandatory",
    endDate: Date,
    student: any,
    advisor: any
  ): Promise<void> {
    const daysUntilExpiration = Math.ceil(
      (endDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
    );

    // Verificar se já existe alerta para este estágio
    const existingAlert = await db
      .select()
      .from(internshipAlerts)
      .where(
        and(
          eq(internshipAlerts.internshipId, internshipId),
          eq(internshipAlerts.internshipType, internshipType),
          eq(internshipAlerts.alertType, "expiration_warning"),
          isNull(internshipAlerts.sentAt)
        )
      );

    if (existingAlert.length > 0) {
      return; // Alerta já existe
    }

    const alertData: InsertInternshipAlert = {
      internshipId,
      internshipType,
      alertType: "expiration_warning",
      title: `Estágio ${internshipType === "mandatory" ? "Obrigatório" : "Não Obrigatório"} Próximo ao Vencimento`,
      message: `O estágio do estudante ${student.name} (${student.registrationNumber}) está próximo ao vencimento. Data de término: ${endDate.toLocaleDateString('pt-BR')}. Restam ${daysUntilExpiration} dias.`,
      daysUntilExpiration,
      targetUsers: JSON.stringify([advisor.id]), // Notificar o orientador
      status: "pending"
    };

    const [alert] = await db
      .insert(internshipAlerts)
      .values(alertData)
      .returning();

    // Enviar notificação WhatsApp
    await this.sendWhatsAppNotification(alert, advisor, student);
  }

  private async sendWhatsAppNotification(alert: any, advisor: any, student: any): Promise<void> {
    try {
      if (!advisor.phone) {
        console.log(`Orientador ${advisor.name} não possui telefone cadastrado`);
        return;
      }

      // Formatar número de telefone para WhatsApp (deve incluir código do país)
      let phoneNumber = advisor.phone.replace(/\D/g, ''); // Remove caracteres não numéricos
      if (!phoneNumber.startsWith('55')) {
        phoneNumber = '55' + phoneNumber; // Adiciona código do Brasil
      }

      const twilioClient = getTwilioClient();
      const message = await twilioClient.messages.create({
        from: `whatsapp:${process.env.TWILIO_PHONE_NUMBER}`,
        to: `whatsapp:+${phoneNumber}`,
        body: `🚨 *Alerta EstagioPro UFVJM*\n\n${alert.title}\n\n${alert.message}\n\nPor favor, tome as medidas necessárias.`
      });

      // Atualizar alerta com ID da mensagem e marcar como enviado
      await db
        .update(internshipAlerts)
        .set({
          sentAt: new Date(),
          whatsappMessageId: message.sid,
          status: "sent"
        })
        .where(eq(internshipAlerts.id, alert.id));

      console.log(`WhatsApp enviado para ${advisor.name}: ${message.sid}`);
    } catch (error) {
      console.error(`Erro ao enviar WhatsApp para ${advisor.name}:`, error);
      
      // Marcar alerta como erro (manter como pending para retry)
      console.error(`Falha no envio de WhatsApp para alerta ${alert.id}`);
    }
  }

  // Buscar alertas ativos
  async getActiveAlerts(userId?: string): Promise<any[]> {
    let query = db
      .select({
        id: internshipAlerts.id,
        internshipId: internshipAlerts.internshipId,
        internshipType: internshipAlerts.internshipType,
        alertType: internshipAlerts.alertType,
        status: internshipAlerts.status,
        title: internshipAlerts.title,
        message: internshipAlerts.message,
        daysUntilExpiration: internshipAlerts.daysUntilExpiration,
        targetUsers: internshipAlerts.targetUsers,
        sentAt: internshipAlerts.sentAt,
        readAt: internshipAlerts.readAt,
        dismissedAt: internshipAlerts.dismissedAt,
        createdAt: internshipAlerts.createdAt,
      })
      .from(internshipAlerts)
      .where(
        and(
          eq(internshipAlerts.isActive, true),
          isNull(internshipAlerts.dismissedAt)
        )
      );

    const alerts = await query;

    // Se um userId foi fornecido, filtrar pelos alertas direcionados a esse usuário
    if (userId) {
      return alerts.filter(alert => {
        const targetUsers = JSON.parse(alert.targetUsers || '[]');
        return targetUsers.includes(userId);
      });
    }

    return alerts;
  }

  // Marcar alerta como lido
  async markAlertAsRead(alertId: string, userId: string): Promise<void> {
    await db
      .update(internshipAlerts)
      .set({ readAt: new Date() })
      .where(eq(internshipAlerts.id, alertId));
  }

  // Dispensar alerta
  async dismissAlert(alertId: string, userId: string): Promise<void> {
    await db
      .update(internshipAlerts)
      .set({ dismissedAt: new Date() })
      .where(eq(internshipAlerts.id, alertId));
  }

  // Verificação manual para teste
  async runManualCheck(): Promise<{ message: string; alertsCreated: number }> {
    console.log("Executando verificação manual de alertas...");
    
    const initialAlerts = await this.getActiveAlerts();
    const initialCount = initialAlerts.length;
    
    await this.checkExpiringInternships();
    
    const finalAlerts = await this.getActiveAlerts();
    const finalCount = finalAlerts.length;
    
    const alertsCreated = finalCount - initialCount;
    
    return {
      message: `Verificação concluída. ${alertsCreated} novos alertas criados.`,
      alertsCreated
    };
  }
}

export const alertService = new AlertService();