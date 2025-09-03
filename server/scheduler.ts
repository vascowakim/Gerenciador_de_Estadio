import { alertService } from "./alertService";

export class AlertScheduler {
  private intervalId: NodeJS.Timeout | null = null;
  private readonly CHECK_INTERVAL = 24 * 60 * 60 * 1000; // 24 horas em milissegundos

  start(): void {
    console.log("🕒 Iniciando scheduler de alertas...");
    
    // Executar verificação inicial após 1 minuto
    setTimeout(() => {
      this.runAlertCheck();
    }, 60 * 1000);

    // Configurar verificação diária
    this.intervalId = setInterval(() => {
      this.runAlertCheck();
    }, this.CHECK_INTERVAL);

    console.log("✅ Scheduler de alertas iniciado com sucesso. Verificação a cada 24 horas.");
  }

  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      console.log("⏹️ Scheduler de alertas parado.");
    }
  }

  private async runAlertCheck(): Promise<void> {
    try {
      console.log("🔍 Executando verificação automática de alertas...");
      const result = await alertService.runManualCheck();
      console.log(`✅ Verificação concluída: ${result.message}`);
      
      if (result.alertsCreated > 0) {
        console.log(`📱 ${result.alertsCreated} novos alertas criados e notificações WhatsApp enviadas.`);
      }
    } catch (error) {
      console.error("❌ Erro na verificação automática de alertas:", error);
    }
  }

  // Método para executar verificação manual via API
  async runManualCheck(): Promise<{ message: string; alertsCreated: number }> {
    return await this.runAlertCheck() as any;
  }
}

export const alertScheduler = new AlertScheduler();