import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { Bell, Clock, AlertTriangle, CheckCircle2, X, RefreshCw } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

interface InternshipAlert {
  id: string;
  internshipId: string;
  internshipType: "mandatory" | "non_mandatory";
  alertType: "expiration_warning" | "document_missing" | "system_alert";
  status: "pending" | "sent" | "read" | "dismissed";
  title: string;
  message: string;
  daysUntilExpiration?: number;
  sentAt?: string;
  readAt?: string;
  dismissedAt?: string;
  createdAt: string;
}

interface CheckResult {
  message: string;
  alertsCreated: number;
}

export default function AlertsPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedAlert, setSelectedAlert] = useState<InternshipAlert | null>(null);

  const { data: alerts = [], isLoading, error } = useQuery<InternshipAlert[]>({
    queryKey: ["/api/alerts"],
    refetchInterval: 30000, // Atualizar a cada 30 segundos
  });

  const markAsReadMutation = useMutation({
    mutationFn: async (alertId: string) => {
      await apiRequest(`/api/alerts/${alertId}/read`, { method: "POST" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/alerts"] });
      toast({
        title: "Sucesso",
        description: "Alerta marcado como lido",
      });
    },
  });

  const dismissAlertMutation = useMutation({
    mutationFn: async (alertId: string) => {
      await apiRequest(`/api/alerts/${alertId}/dismiss`, { method: "POST" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/alerts"] });
      setSelectedAlert(null);
      toast({
        title: "Sucesso",
        description: "Alerta dispensado",
      });
    },
  });

  const runCheckMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("/api/alerts/check", { method: "POST" });
      return response as CheckResult;
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["/api/alerts"] });
      toast({
        title: "Verificação Concluída",
        description: `${result.message}`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message || "Erro ao executar verificação",
        variant: "destructive",
      });
    },
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800 border-yellow-300";
      case "sent":
        return "bg-blue-100 text-blue-800 border-blue-300";
      case "read":
        return "bg-green-100 text-green-800 border-green-300";
      case "dismissed":
        return "bg-gray-100 text-gray-800 border-gray-300";
      default:
        return "bg-gray-100 text-gray-800 border-gray-300";
    }
  };

  const getAlertIcon = (alertType: string, status: string) => {
    if (status === "read") return <CheckCircle2 className="h-5 w-5 text-green-600" />;
    if (alertType === "expiration_warning") return <AlertTriangle className="h-5 w-5 text-red-600" />;
    return <Bell className="h-5 w-5 text-blue-600" />;
  };

  const getPriorityColor = (daysUntilExpiration?: number) => {
    if (!daysUntilExpiration) return "";
    if (daysUntilExpiration <= 7) return "border-l-4 border-l-red-500";
    if (daysUntilExpiration <= 15) return "border-l-4 border-l-yellow-500";
    return "border-l-4 border-l-blue-500";
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">Carregando alertas...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Erro ao carregar alertas. Tente novamente mais tarde.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2" data-testid="page-title">
            Central de Alertas
          </h1>
          <p className="text-gray-600">
            Gerencie alertas sobre estágios próximos ao vencimento e outras notificações importantes
          </p>
        </div>
        <Button
          onClick={() => runCheckMutation.mutate()}
          disabled={runCheckMutation.isPending}
          data-testid="button-run-check"
          className="bg-blue-600 hover:bg-blue-700"
        >
          {runCheckMutation.isPending ? (
            <RefreshCw className="h-4 w-4 animate-spin mr-2" />
          ) : (
            <RefreshCw className="h-4 w-4 mr-2" />
          )}
          Verificar Alertas
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Lista de Alertas */}
        <div className="lg:col-span-2 space-y-4">
          {alerts.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Bell className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Nenhum alerta ativo
                </h3>
                <p className="text-gray-500">
                  Não há alertas pendentes no momento. Os alertas aparecerão aqui quando estágios estiverem próximos ao vencimento.
                </p>
              </CardContent>
            </Card>
          ) : (
            alerts.map((alert) => (
              <Card
                key={alert.id}
                className={`cursor-pointer transition-all hover:shadow-md ${
                  selectedAlert?.id === alert.id ? "ring-2 ring-blue-500" : ""
                } ${getPriorityColor(alert.daysUntilExpiration)}`}
                onClick={() => setSelectedAlert(alert)}
                data-testid={`alert-card-${alert.id}`}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3">
                      {getAlertIcon(alert.alertType, alert.status)}
                      <div>
                        <CardTitle className="text-lg">{alert.title}</CardTitle>
                        <CardDescription className="flex items-center space-x-2 mt-1">
                          <Badge
                            variant="outline"
                            className={getStatusColor(alert.status)}
                          >
                            {alert.status === "pending" && "Pendente"}
                            {alert.status === "sent" && "Enviado"}
                            {alert.status === "read" && "Lido"}
                            {alert.status === "dismissed" && "Dispensado"}
                          </Badge>
                          <span className="text-sm text-gray-500">
                            <Clock className="h-3 w-3 inline mr-1" />
                            {formatDistanceToNow(new Date(alert.createdAt), {
                              addSuffix: true,
                              locale: ptBR,
                            })}
                          </span>
                        </CardDescription>
                      </div>
                    </div>
                    {alert.daysUntilExpiration && (
                      <div className="text-right">
                        <div className="text-2xl font-bold text-red-600">
                          {alert.daysUntilExpiration}
                        </div>
                        <div className="text-xs text-gray-500">dias restantes</div>
                      </div>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-700 line-clamp-2">{alert.message}</p>
                  {alert.internshipType && (
                    <Badge variant="secondary" className="mt-2">
                      {alert.internshipType === "mandatory" ? "Obrigatório" : "Não Obrigatório"}
                    </Badge>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Detalhes do Alerta Selecionado */}
        <div className="lg:col-span-1">
          {selectedAlert ? (
            <Card className="sticky top-6">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <CardTitle className="text-lg">Detalhes do Alerta</CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedAlert(null)}
                    data-testid="button-close-details"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Título</h4>
                  <p className="text-gray-700">{selectedAlert.title}</p>
                </div>

                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Mensagem</h4>
                  <p className="text-gray-700">{selectedAlert.message}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-1">Status</h4>
                    <Badge className={getStatusColor(selectedAlert.status)}>
                      {selectedAlert.status === "pending" && "Pendente"}
                      {selectedAlert.status === "sent" && "Enviado"}
                      {selectedAlert.status === "read" && "Lido"}
                      {selectedAlert.status === "dismissed" && "Dispensado"}
                    </Badge>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 mb-1">Tipo</h4>
                    <Badge variant="secondary">
                      {selectedAlert.internshipType === "mandatory" ? "Obrigatório" : "Não Obrigatório"}
                    </Badge>
                  </div>
                </div>

                {selectedAlert.daysUntilExpiration && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-1">Dias Restantes</h4>
                    <div className="text-2xl font-bold text-red-600">
                      {selectedAlert.daysUntilExpiration} dias
                    </div>
                  </div>
                )}

                <div>
                  <h4 className="font-medium text-gray-900 mb-1">Criado em</h4>
                  <p className="text-gray-700">
                    {new Date(selectedAlert.createdAt).toLocaleString("pt-BR")}
                  </p>
                </div>

                {selectedAlert.sentAt && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-1">Enviado em</h4>
                    <p className="text-gray-700">
                      {new Date(selectedAlert.sentAt).toLocaleString("pt-BR")}
                    </p>
                  </div>
                )}

                <div className="flex space-x-2 pt-4">
                  {selectedAlert.status !== "read" && (
                    <Button
                      onClick={() => markAsReadMutation.mutate(selectedAlert.id)}
                      disabled={markAsReadMutation.isPending}
                      data-testid="button-mark-read"
                      variant="outline"
                      className="flex-1"
                    >
                      <CheckCircle2 className="h-4 w-4 mr-2" />
                      Marcar como Lido
                    </Button>
                  )}
                  {selectedAlert.status !== "dismissed" && (
                    <Button
                      onClick={() => dismissAlertMutation.mutate(selectedAlert.id)}
                      disabled={dismissAlertMutation.isPending}
                      data-testid="button-dismiss"
                      variant="outline"
                      className="flex-1"
                    >
                      <X className="h-4 w-4 mr-2" />
                      Dispensar
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="sticky top-6">
              <CardContent className="p-8 text-center">
                <Bell className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Selecione um Alerta
                </h3>
                <p className="text-gray-500">
                  Clique em um alerta na lista para ver mais detalhes e opções de ação.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}