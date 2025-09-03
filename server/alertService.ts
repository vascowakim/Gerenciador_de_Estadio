import { db } from "./db";
import { internshipAlerts, mandatoryInternships, nonMandatoryInternships, students, advisors, users } from "@shared/schema";
import { eq, and, lte, gte, isNull } from "drizzle-orm";
import type { InsertInternshipAlert } from "@shared/schema";
import twilio from "twilio";

// Função para gerar link do WhatsApp (não precisa mais do Twilio)
function generateWhatsAppLink(phoneNumber: string, message: string): string {
  // Formatar número de telefone para WhatsApp
  let formattedPhone = phoneNumber.replace(/\D/g, '');
  if (!formattedPhone.startsWith('55')) {
    formattedPhone = '55' + formattedPhone;
  }
  
  return `https://api.whatsapp.com/send?phone=${formattedPhone}&text=${encodeURIComponent(message)}`;
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

      // Criar mensagem para orientador
      const message = `🚨 *Alerta EstagioPro UFVJM*\n\n${alert.title}\n\n${alert.message}\n\nPor favor, tome as medidas necessárias.`;
      
      // Gerar link do WhatsApp Web
      const whatsappUrl = `https://api.whatsapp.com/send?phone=${phoneNumber}&text=${encodeURIComponent(message)}`;
      
      // Atualizar alerta como enviado (link gerado)
      await db
        .update(internshipAlerts)
        .set({
          sentAt: new Date(),
          whatsappMessageId: whatsappUrl,
          status: "sent"
        })
        .where(eq(internshipAlerts.id, alert.id));

      console.log(`✅ Link WhatsApp gerado para orientador ${advisor.name}: ${whatsappUrl}`);
      console.log(`📱 Telefone: +${phoneNumber}`);
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

  // Send WhatsApp for specific alert manually
  async sendWhatsAppForAlert(alertId: string, recipient: 'student' | 'advisor' | 'both'): Promise<{ message: string; sent: string[] }> {
    try {
      // Buscar o alerta
      const [alert] = await db.select().from(internshipAlerts).where(eq(internshipAlerts.id, alertId));
      if (!alert) {
        throw new Error('Alerta não encontrado');
      }

      // Buscar dados do estágio
      let internship: any;
      let student: any;
      let advisor: any;

      if (alert.internshipType === 'mandatory') {
        [internship] = await db.select().from(mandatoryInternships).where(eq(mandatoryInternships.id, alert.internshipId));
      } else {
        [internship] = await db.select().from(nonMandatoryInternships).where(eq(nonMandatoryInternships.id, alert.internshipId));
      }

      if (!internship) {
        throw new Error('Estágio não encontrado');
      }

      // Buscar estudante e orientador
      [student] = await db.select().from(students).where(eq(students.id, internship.studentId));
      [advisor] = await db.select().from(advisors).where(eq(advisors.id, internship.advisorId));

      const sentTo: string[] = [];

      // Enviar para estudante
      if (recipient === 'student' || recipient === 'both') {
        if (student?.phone) {
          try {
            await this.sendWhatsAppToStudent(alert, student);
            sentTo.push(`Estudante: ${student.name}`);
          } catch (error) {
            console.error(`Erro ao enviar WhatsApp para estudante ${student.name}:`, error);
          }
        } else {
          console.log(`Estudante ${student?.name} não possui telefone cadastrado`);
        }
      }

      // Enviar para orientador
      if (recipient === 'advisor' || recipient === 'both') {
        if (advisor?.phone) {
          try {
            await this.sendWhatsAppNotification(alert, advisor, student);
            sentTo.push(`Orientador: ${advisor.name}`);
          } catch (error) {
            console.error(`Erro ao enviar WhatsApp para orientador ${advisor.name}:`, error);
          }
        } else {
          console.log(`Orientador ${advisor?.name} não possui telefone cadastrado`);
        }
      }

      return {
        message: sentTo.length > 0 ? 'Links WhatsApp gerados com sucesso' : 'Nenhum link foi gerado (telefones não cadastrados)',
        sent: sentTo
      };

    } catch (error) {
      console.error('Erro ao enviar WhatsApp:', error);
      throw error;
    }
  }

  // Generate WhatsApp link for student
  private async sendWhatsAppToStudent(alert: any, student: any): Promise<void> {
    try {
      // Formatar número de telefone para WhatsApp
      let phoneNumber = student.phone.replace(/\D/g, '');
      if (!phoneNumber.startsWith('55')) {
        phoneNumber = '55' + phoneNumber;
      }

      // Criar mensagem
      const message = `🎓 *EstagioPro UFVJM*\n\n${alert.title}\n\n${alert.message}\n\nPor favor, entre em contato com seu orientador para esclarecimentos.`;
      
      // Usar função auxiliar para gerar link
      const whatsappUrl = generateWhatsAppLink(student.phone, message);
      
      console.log(`✅ Link WhatsApp gerado para estudante ${student.name}: ${whatsappUrl}`);
      console.log(`📱 Telefone: ${student.phone}`);
      
      // Retornar URL para uso no frontend
      return Promise.resolve();
    } catch (error) {
      console.error(`Erro ao gerar link WhatsApp para estudante ${student.name}:`, error);
      throw error;
    }
  }
}

export const alertService = new AlertService();