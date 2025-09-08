import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  BarChart3, 
  FileText, 
  Users, 
  GraduationCap, 
  Building2, 
  Calendar,
  TrendingUp,
  Download,
  Eye,
  BookOpen,
  UserCheck,
  AlertTriangle,
  Clock
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { 
  MandatoryInternship, 
  NonMandatoryInternship, 
  Student, 
  Advisor, 
  Company
} from "@shared/schema";

export default function ReportsPage() {
  const [selectedPeriod, setSelectedPeriod] = useState<string>("all");

  // Buscar dados para relatórios
  const { data: mandatoryInternships = [] } = useQuery<MandatoryInternship[]>({
    queryKey: ["/api/mandatory-internships"],
  });

  const { data: nonMandatoryInternships = [] } = useQuery<NonMandatoryInternship[]>({
    queryKey: ["/api/non-mandatory-internships"],
  });

  const { data: students = [] } = useQuery<Student[]>({
    queryKey: ["/api/students"],
  });

  const { data: advisors = [] } = useQuery<Advisor[]>({
    queryKey: ["/api/advisors"],
  });

  const { data: companies = [] } = useQuery<Company[]>({
    queryKey: ["/api/companies"],
  });

  const { data: alerts = [] } = useQuery({
    queryKey: ["/api/alerts"],
  });

  // Estatísticas gerais
  const stats = {
    totalMandatory: mandatoryInternships.length,
    totalNonMandatory: nonMandatoryInternships.length,
    totalStudents: students.length,
    totalAdvisors: advisors.length,
    totalCompanies: companies.length,
    totalAlerts: alerts.length,
    activeMandatory: mandatoryInternships.filter(i => i.status === "approved" || i.status === "pending").length,
    activeNonMandatory: nonMandatoryInternships.filter(i => i.status === "approved" || i.status === "pending").length,
    completedMandatory: mandatoryInternships.filter(i => i.status === "completed").length,
    completedNonMandatory: nonMandatoryInternships.filter(i => i.status === "completed").length,
  };

  const generateReport = (reportType: string) => {
    console.log(`Gerando relatório: ${reportType}`);
    // TODO: Implementar geração de relatórios em PDF/Excel
  };

  const exportData = (dataType: string) => {
    console.log(`Exportando dados: ${dataType}`);
    // TODO: Implementar exportação de dados
  };

  const reports = [
    {
      id: "mandatory-internships",
      title: "Relatório de Estágios Obrigatórios",
      description: "Lista completa de todos os estágios obrigatórios com status, orientadores e empresas",
      icon: BookOpen,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
      count: stats.totalMandatory,
      active: stats.activeMandatory,
      completed: stats.completedMandatory,
    },
    {
      id: "non-mandatory-internships", 
      title: "Relatório de Estágios Não Obrigatórios",
      description: "Lista completa de todos os estágios não obrigatórios com progresso e relatórios",
      icon: FileText,
      color: "text-green-600",
      bgColor: "bg-green-50",
      count: stats.totalNonMandatory,
      active: stats.activeNonMandatory,
      completed: stats.completedNonMandatory,
    },
    {
      id: "students-report",
      title: "Relatório de Estudantes",
      description: "Lista de todos os estudantes cadastrados com informações de matrícula e curso",
      icon: GraduationCap,
      color: "text-purple-600", 
      bgColor: "bg-purple-50",
      count: stats.totalStudents,
      active: students.filter(s => s.isActive).length,
      completed: students.filter(s => !s.isActive).length,
    },
    {
      id: "advisors-report",
      title: "Relatório de Orientadores",
      description: "Lista de professores orientadores com departamentos e estatísticas de orientação",
      icon: UserCheck,
      color: "text-orange-600",
      bgColor: "bg-orange-50", 
      count: stats.totalAdvisors,
      active: advisors.filter(a => a.isActive).length,
      completed: 0,
    },
    {
      id: "companies-report",
      title: "Relatório de Empresas",
      description: "Lista de empresas parceiras cadastradas com informações de contato",
      icon: Building2,
      color: "text-teal-600",
      bgColor: "bg-teal-50",
      count: stats.totalCompanies,
      active: companies.filter(c => c.isActive).length,
      completed: 0,
    },
    {
      id: "alerts-report",
      title: "Relatório de Alertas e Notificações",
      description: "Histórico de alertas enviados e notificações do sistema",
      icon: AlertTriangle,
      color: "text-red-600",
      bgColor: "bg-red-50",
      count: stats.totalAlerts,
      active: alerts.filter((a: any) => a.status === "sent").length,
      completed: alerts.filter((a: any) => a.status === "pending").length,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="flex items-center gap-3">
        <BarChart3 className="h-8 w-8 text-blue-600" />
        <div>
          <h1 className="text-3xl font-bold">Central de Relatórios</h1>
          <p className="text-gray-600">Gere relatórios completos e exporte dados do sistema</p>
        </div>
      </div>

      {/* Estatísticas Gerais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total de Estágios</p>
                <p className="text-2xl font-bold text-blue-600">
                  {stats.totalMandatory + stats.totalNonMandatory}
                </p>
              </div>
              <FileText className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Estudantes Ativos</p>
                <p className="text-2xl font-bold text-green-600">{students.filter(s => s.isActive).length}</p>
              </div>
              <GraduationCap className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Orientadores</p>
                <p className="text-2xl font-bold text-purple-600">{stats.totalAdvisors}</p>
              </div>
              <Users className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Empresas Parceiras</p>
                <p className="text-2xl font-bold text-orange-600">{stats.totalCompanies}</p>
              </div>
              <Building2 className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Lista de Relatórios */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {reports.map((report) => {
          const Icon = report.icon;
          return (
            <Card key={report.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${report.bgColor}`}>
                      <Icon className={`h-6 w-6 ${report.color}`} />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{report.title}</CardTitle>
                      <CardDescription className="mt-1">
                        {report.description}
                      </CardDescription>
                    </div>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent>
                {/* Estatísticas do Relatório */}
                <div className="flex gap-4 mb-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold">{report.count}</p>
                    <p className="text-xs text-gray-500">Total</p>
                  </div>
                  {report.active > 0 && (
                    <div className="text-center">
                      <p className="text-2xl font-bold text-green-600">{report.active}</p>
                      <p className="text-xs text-gray-500">Ativo</p>
                    </div>
                  )}
                  {report.completed > 0 && (
                    <div className="text-center">
                      <p className="text-2xl font-bold text-blue-600">{report.completed}</p>
                      <p className="text-xs text-gray-500">Concluído</p>
                    </div>
                  )}
                </div>

                <Separator className="my-4" />

                {/* Ações do Relatório */}
                <div className="flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    onClick={() => generateReport(report.id)}
                    data-testid={`button-generate-${report.id}`}
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    Visualizar
                  </Button>
                  
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => generateReport(`${report.id}-pdf`)}
                    data-testid={`button-pdf-${report.id}`}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    PDF
                  </Button>
                  
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => exportData(report.id)}
                    data-testid={`button-export-${report.id}`}
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    Excel
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Relatórios Especiais */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Relatórios Analíticos
          </CardTitle>
          <CardDescription>
            Relatórios com análises estatísticas e gráficos
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button 
              variant="outline" 
              className="p-4 h-auto flex-col items-start"
              onClick={() => generateReport("performance-analysis")}
              data-testid="button-performance-analysis"
            >
              <div className="flex items-center gap-2 mb-2">
                <BarChart3 className="h-4 w-4" />
                <span className="font-semibold">Análise de Performance</span>
              </div>
              <p className="text-xs text-gray-500 text-left">
                Gráficos e estatísticas sobre o desempenho dos estágios
              </p>
            </Button>

            <Button 
              variant="outline" 
              className="p-4 h-auto flex-col items-start"
              onClick={() => generateReport("workload-distribution")}
              data-testid="button-workload-distribution"
            >
              <div className="flex items-center gap-2 mb-2">
                <Clock className="h-4 w-4" />
                <span className="font-semibold">Distribuição de Carga</span>
              </div>
              <p className="text-xs text-gray-500 text-left">
                Análise da distribuição de orientações por professor
              </p>
            </Button>

            <Button 
              variant="outline" 
              className="p-4 h-auto flex-col items-start"
              onClick={() => generateReport("monthly-summary")}
              data-testid="button-monthly-summary"
            >
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="h-4 w-4" />
                <span className="font-semibold">Resumo Mensal</span>
              </div>
              <p className="text-xs text-gray-500 text-left">
                Relatório consolidado das atividades do mês
              </p>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Rodapé com informações */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between text-sm text-gray-500">
            <div>
              <p>Última atualização: {format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}</p>
            </div>
            <div className="flex items-center gap-4">
              <Badge variant="outline">
                {stats.totalMandatory + stats.totalNonMandatory} Total de Estágios
              </Badge>
              <Badge variant="outline">
                {students.filter(s => s.isActive).length} Estudantes Ativos
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}