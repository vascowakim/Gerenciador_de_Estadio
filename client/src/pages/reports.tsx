import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
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
  Clock,
  Filter
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
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
  const { toast } = useToast();
  const [selectedSemester, setSelectedSemester] = useState<string>("all");
  const [selectedAdvisor, setSelectedAdvisor] = useState<string>("all");
  const [selectedYear, setSelectedYear] = useState<string>(new Date().getFullYear().toString());

  // Gerar lista de semestres automaticamente
  const availableSemesters = useMemo(() => {
    const currentYear = new Date().getFullYear();
    const startYear = 2020; // Ano de início do sistema
    const semesters = [];
    
    for (let year = startYear; year <= currentYear; year++) {
      semesters.push(
        { value: `${year}-1`, label: `${year}.1 (Jan-Jun)` },
        { value: `${year}-2`, label: `${year}.2 (Jul-Dez)` }
      );
    }
    
    return semesters.reverse(); // Mais recentes primeiro
  }, []);

  // Função para filtrar dados por semestre
  const filterBySemester = (data: any[], dateField: string) => {
    if (selectedSemester === "all") return data;
    
    const [year, semester] = selectedSemester.split("-");
    const yearNum = parseInt(year);
    const semesterNum = parseInt(semester);
    
    return data.filter((item: any) => {
      const date = new Date(item[dateField]);
      const itemYear = date.getFullYear();
      const itemMonth = date.getMonth() + 1; // 0-based to 1-based
      
      if (itemYear !== yearNum) return false;
      
      if (semesterNum === 1) {
        return itemMonth >= 1 && itemMonth <= 6; // Jan-Jun
      } else {
        return itemMonth >= 7 && itemMonth <= 12; // Jul-Dez
      }
    });
  };

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

  // Buscar configurações do sistema
  const { data: settings = [] } = useQuery({
    queryKey: ["/api/settings"],
  });

  // Extrair nomes dos coordenadores das configurações
  const settingsMap: Record<string, string> = {};
  if (Array.isArray(settings)) {
    settings.forEach((setting: any) => {
      settingsMap[setting.key] = setting.value;
    });
  }
  
  const courseCoordinatorName = settingsMap['course_coordinator_name'] || 'Prof. Dr. Nome do Coordenador';
  const internshipCoordinatorName = settingsMap['internship_coordinator_name'] || 'Profa. Dra. Nome da Coordenadora';

  // Filtrar dados por semestre
  const filteredMandatory = filterBySemester(mandatoryInternships, 'createdAt');
  const filteredNonMandatory = filterBySemester(nonMandatoryInternships, 'createdAt');
  
  // Filtrar por orientador se selecionado
  const finalMandatory = selectedAdvisor === "all" ? filteredMandatory : filteredMandatory.filter(i => i.advisorId === selectedAdvisor);
  const finalNonMandatory = selectedAdvisor === "all" ? filteredNonMandatory : filteredNonMandatory.filter(i => i.advisorId === selectedAdvisor);

  // Estatísticas baseadas nos filtros
  const stats = {
    totalMandatory: finalMandatory.length,
    totalNonMandatory: finalNonMandatory.length,
    totalStudents: students.length,
    totalAdvisors: advisors.length,
    totalCompanies: companies.length,
    totalAlerts: Array.isArray(alerts) ? alerts.length : 0,
    activeMandatory: finalMandatory.filter(i => i.status === "approved" || i.status === "pending").length,
    activeNonMandatory: finalNonMandatory.filter(i => i.status === "approved" || i.status === "pending").length,
    completedMandatory: finalMandatory.filter(i => i.status === "completed").length,
    completedNonMandatory: finalNonMandatory.filter(i => i.status === "completed").length,
  };

  const generateReport = (reportType: string, format: string = "view") => {
    let data: any[] = [];
    let reportTitle = "";
    
    switch (reportType) {
      case "mandatory-internships":
        data = finalMandatory;
        reportTitle = "Estágios Obrigatórios";
        break;
      case "non-mandatory-internships":
        data = finalNonMandatory;
        reportTitle = "Estágios Não Obrigatórios";
        break;
      case "students-report":
        data = students;
        reportTitle = "Estudantes";
        break;
      case "advisors-report":
        data = advisors;
        reportTitle = "Orientadores";
        break;
      case "companies-report":
        data = companies;
        reportTitle = "Empresas";
        break;
      case "advisors-orientees":
        data = generateAdvisorsOrienteesReport();
        reportTitle = "Orientados por Orientadores";
        break;
      default:
        data = [];
    }
    
    if (format === "view") {
      showReportPreview(reportTitle, data, reportType);
    } else if (format === "csv") {
      exportToCSV(reportTitle, data);
    } else {
      toast({
        title: "Funcionalidade em desenvolvimento",
        description: `Exportação em ${format.toUpperCase()} será implementada em breve.`,
      });
    }
  };
  
  const generateAdvisorsOrienteesReport = () => {
    return advisors.map(advisor => {
      const mandatoryOrientees = finalMandatory.filter(i => i.advisorId === advisor.id);
      const nonMandatoryOrientees = finalNonMandatory.filter(i => i.advisorId === advisor.id);
      
      return {
        advisorName: advisor.name,
        siape: advisor.siape || 'Não informado',
        department: advisor.department,
        semester: selectedSemester === "all" ? "Todos" : availableSemesters.find(s => s.value === selectedSemester)?.label || selectedSemester,
        mandatoryCount: mandatoryOrientees.length,
        nonMandatoryCount: nonMandatoryOrientees.length,
        totalOrientees: mandatoryOrientees.length + nonMandatoryOrientees.length,
        mandatoryOrientees: mandatoryOrientees.map(i => {
          const student = students.find(s => s.id === i.studentId);
          return student ? `${student.name} (${student.registrationNumber})` : 'Estudante não encontrado';
        }),
        nonMandatoryOrientees: nonMandatoryOrientees.map(i => {
          const student = students.find(s => s.id === i.studentId);
          return student ? `${student.name} (${student.registrationNumber})` : 'Estudante não encontrado';
        })
      };
    }).filter(advisor => advisor.totalOrientees > 0);
  };
  
  const showReportPreview = (title: string, data: any[], reportType: string) => {
    const reportWindow = window.open('', '_blank', 'width=1000,height=700');
    if (!reportWindow) {
      toast({
        title: "Erro",
        description: "Não foi possível abrir a janela do relatório. Verifique se o bloqueador de pop-ups está desabilitado.",
        variant: "destructive"
      });
      return;
    }
    
    // Obter informações do semestre selecionado
    const selectedSemesterInfo = selectedSemester === "all" ? "Todos os Semestres" : 
      availableSemesters.find(s => s.value === selectedSemester)?.label || selectedSemester;
    
    let tableHTML = "";
    
    if (reportType === "advisors-orientees") {
      tableHTML = `
        <table style="border-collapse: collapse; width: 100%; margin-top: 30px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
          <thead>
            <tr style="background: linear-gradient(135deg, #1e40af, #059669); color: white;">
              <th style="padding: 15px; text-align: left; border: 1px solid #ddd; font-weight: 600;">Nome do Professor</th>
              <th style="padding: 15px; text-align: left; border: 1px solid #ddd; font-weight: 600;">SIAPE</th>
              <th style="padding: 15px; text-align: left; border: 1px solid #ddd; font-weight: 600;">Departamento</th>
              <th style="padding: 15px; text-align: center; border: 1px solid #ddd; font-weight: 600;">Semestre</th>
              <th style="padding: 15px; text-align: center; border: 1px solid #ddd; font-weight: 600;">Est. Obrigatórios</th>
              <th style="padding: 15px; text-align: center; border: 1px solid #ddd; font-weight: 600;">Est. Não Obrig.</th>
              <th style="padding: 15px; text-align: center; border: 1px solid #ddd; font-weight: 600;">Total</th>
            </tr>
          </thead>
          <tbody>
            ${data.map((item, index) => `
              <tr style="background-color: ${index % 2 === 0 ? '#f8fafc' : '#ffffff'}; transition: background-color 0.2s;">
                <td style="padding: 12px; border: 1px solid #e5e7eb; font-weight: 500;">${item.advisorName}</td>
                <td style="padding: 12px; border: 1px solid #e5e7eb;">${item.siape}</td>
                <td style="padding: 12px; border: 1px solid #e5e7eb;">${item.department}</td>
                <td style="padding: 12px; border: 1px solid #e5e7eb; text-align: center;">${item.semester}</td>
                <td style="padding: 12px; border: 1px solid #e5e7eb; text-align: center; color: #1e40af; font-weight: 600;">${item.mandatoryCount}</td>
                <td style="padding: 12px; border: 1px solid #e5e7eb; text-align: center; color: #059669; font-weight: 600;">${item.nonMandatoryCount}</td>
                <td style="padding: 12px; border: 1px solid #e5e7eb; text-align: center; font-weight: bold; color: #dc2626; background-color: #fef2f2;">${item.totalOrientees}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      `;
    } else {
      // Tabela genérica para outros relatórios
      const headers = data.length > 0 ? Object.keys(data[0]) : [];
      tableHTML = `
        <table style="border-collapse: collapse; width: 100%; margin-top: 30px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
          <thead>
            <tr style="background: linear-gradient(135deg, #1e40af, #059669); color: white;">
              ${headers.map(header => `<th style="padding: 15px; text-align: left; border: 1px solid #ddd; font-weight: 600;">${header}</th>`).join('')}
            </tr>
          </thead>
          <tbody>
            ${data.map((item, index) => `
              <tr style="background-color: ${index % 2 === 0 ? '#f8fafc' : '#ffffff'}; transition: background-color 0.2s;">
                ${headers.map(header => `<td style="padding: 12px; border: 1px solid #e5e7eb;">${item[header] || ''}</td>`).join('')}
              </tr>
            `).join('')}
          </tbody>
        </table>
      `;
    }
    
    reportWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Relatório - ${title}</title>
          <meta charset="utf-8">
          <style>
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            
            body { 
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
              line-height: 1.6;
              color: #2d3748;
              background: #f7fafc;
              padding: 20px;
            }
            
            .report-container {
              max-width: 1200px;
              margin: 0 auto;
              background: white;
              padding: 40px;
              border-radius: 12px;
              box-shadow: 0 4px 20px rgba(0,0,0,0.1);
            }
            
            .header {
              text-align: center;
              margin-bottom: 40px;
              border-bottom: 3px solid #e2e8f0;
              padding-bottom: 30px;
            }
            
            .logo-section {
              margin-bottom: 20px;
            }
            
            .logo-placeholder {
              width: 120px;
              height: 120px;
              margin: 0 auto 20px;
              background: linear-gradient(135deg, #1e40af, #059669);
              border-radius: 50%;
              display: flex;
              align-items: center;
              justify-content: center;
              color: white;
              font-size: 48px;
              font-weight: bold;
              box-shadow: 0 8px 25px rgba(30, 64, 175, 0.3);
            }
            
            .ministry {
              font-size: 16px;
              font-weight: 600;
              color: #4a5568;
              text-transform: uppercase;
              letter-spacing: 1px;
              margin-bottom: 8px;
            }
            
            .university {
              font-size: 20px;
              font-weight: 700;
              color: #1e40af;
              margin-bottom: 15px;
              text-shadow: 0 2px 4px rgba(0,0,0,0.1);
              white-space: nowrap;
              text-align: center;
            }
            
            .report-title {
              font-size: 24px;
              font-weight: 600;
              color: #059669;
              margin-bottom: 10px;
            }
            
            .semester-info {
              font-size: 18px;
              color: #4a5568;
              background: linear-gradient(135deg, #e6fffa, #f0f9ff);
              padding: 12px 24px;
              border-radius: 8px;
              border-left: 4px solid #059669;
              display: inline-block;
            }
            
            .report-info {
              background: linear-gradient(135deg, #f7fafc, #edf2f7);
              padding: 25px;
              border-radius: 12px;
              margin: 30px 0;
              border: 1px solid #e2e8f0;
            }
            
            .info-grid {
              display: grid;
              grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
              gap: 20px;
            }
            
            .info-item {
              background: white;
              padding: 15px;
              border-radius: 8px;
              border-left: 4px solid #1e40af;
              box-shadow: 0 2px 4px rgba(0,0,0,0.05);
            }
            
            .info-label {
              font-weight: 600;
              color: #2d3748;
              font-size: 14px;
              margin-bottom: 5px;
            }
            
            .info-value {
              color: #4a5568;
              font-size: 16px;
            }
            
            .actions {
              text-align: center;
              margin-bottom: 30px;
              padding: 20px;
              background: #f8fafc;
              border-radius: 8px;
            }
            
            .btn {
              padding: 12px 24px;
              margin: 0 8px;
              border: none;
              border-radius: 8px;
              cursor: pointer;
              font-weight: 600;
              font-size: 16px;
              transition: all 0.3s ease;
              text-decoration: none;
              display: inline-block;
            }
            
            .btn-primary {
              background: linear-gradient(135deg, #1e40af, #3b82f6);
              color: white;
              box-shadow: 0 4px 12px rgba(30, 64, 175, 0.3);
            }
            
            .btn-secondary {
              background: linear-gradient(135deg, #6b7280, #9ca3af);
              color: white;
              box-shadow: 0 4px 12px rgba(107, 114, 128, 0.3);
            }
            
            .btn:hover {
              transform: translateY(-2px);
              box-shadow: 0 6px 20px rgba(0,0,0,0.2);
            }
            
            .stats-summary {
              background: linear-gradient(135deg, #1e40af, #059669);
              color: white;
              padding: 20px;
              border-radius: 12px;
              margin-bottom: 30px;
              text-align: center;
            }
            
            .stats-grid {
              display: grid;
              grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
              gap: 20px;
              margin-top: 15px;
            }
            
            .stat-item {
              background: rgba(255,255,255,0.1);
              padding: 15px;
              border-radius: 8px;
              backdrop-filter: blur(10px);
            }
            
            .stat-number {
              font-size: 28px;
              font-weight: bold;
              margin-bottom: 5px;
            }
            
            .stat-label {
              font-size: 14px;
              opacity: 0.9;
            }
            
            @media print {
              .no-print { display: none !important; }
              body { background: white; padding: 0; }
              .report-container { box-shadow: none; padding: 20px; }
              .btn:hover { transform: none; }
            }
            
            @media (max-width: 768px) {
              .report-container { padding: 20px; }
              .university { font-size: 24px; }
              .report-title { font-size: 20px; }
              .info-grid { grid-template-columns: 1fr; }
            }
          </style>
        </head>
        <body>
          <div class="report-container">
            <div class="header">
              <div class="logo-section">
                <div class="logo-placeholder">UFVJM</div>
                <div class="ministry">MINISTÉRIO DA EDUCAÇÃO</div>
                <div class="university">UNIVERSIDADE FEDERAL DOS VALES DO JEQUITINHONHA E MUCURI</div>
                <div class="report-title">${title}</div>
                <div class="semester-info">📅 ${selectedSemesterInfo}</div>
              </div>
            </div>
            
            <div class="stats-summary">
              <h3 style="margin-bottom: 15px; font-size: 20px;">📊 Resumo Estatístico</h3>
              <div class="stats-grid">
                <div class="stat-item">
                  <div class="stat-number">${data.length}</div>
                  <div class="stat-label">Total de Registros</div>
                </div>
                <div class="stat-item">
                  <div class="stat-number">${format(new Date(), "dd/MM/yyyy", { locale: ptBR })}</div>
                  <div class="stat-label">Data de Geração</div>
                </div>
                <div class="stat-item">
                  <div class="stat-number">${format(new Date(), "HH:mm", { locale: ptBR })}</div>
                  <div class="stat-label">Horário</div>
                </div>
              </div>
            </div>
            
            <div class="report-info">
              <div class="info-grid">
                <div class="info-item">
                  <div class="info-label">🗓️ Período Selecionado</div>
                  <div class="info-value">${selectedSemesterInfo}</div>
                </div>
                <div class="info-item">
                  <div class="info-label">👨‍🏫 Filtro de Orientador</div>
                  <div class="info-value">${selectedAdvisor !== "all" ? advisors.find(a => a.id === selectedAdvisor)?.name || 'Não encontrado' : 'Todos os Orientadores'}</div>
                </div>
                <div class="info-item">
                  <div class="info-label">📋 Tipo de Relatório</div>
                  <div class="info-value">${title}</div>
                </div>
                <div class="info-item">
                  <div class="info-label">🔢 Registros Encontrados</div>
                  <div class="info-value">${data.length} ${data.length === 1 ? 'registro' : 'registros'}</div>
                </div>
              </div>
            </div>
            
            <div class="actions no-print">
              <button onclick="window.print()" class="btn btn-primary">
                🖨️ Imprimir Relatório
              </button>
              <button onclick="window.close()" class="btn btn-secondary">
                ❌ Fechar Janela
              </button>
            </div>
            
            ${tableHTML}
            
            <div style="margin-top: 40px; padding-top: 20px; border-top: 2px solid #e2e8f0; text-align: center; color: #718096; font-size: 14px;">
              <p><strong>EstagioPro UFVJM</strong> - Sistema de Gerenciamento de Estágios</p>
              <p>Relatório gerado automaticamente em ${format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}</p>
              <p style="margin-top: 10px; font-style: italic;">Este documento possui validade institucional e pode ser utilizado para fins acadêmicos e administrativos.</p>
              
              <!-- Seção de Coordenadores -->
              <div style="margin-top: 40px; display: grid; grid-template-columns: 1fr 1fr; gap: 40px; max-width: 800px; margin-left: auto; margin-right: auto;">
                <div style="text-align: center; padding: 20px; border-top: 2px solid #1e40af;">
                  <p style="margin-top: 15px; font-weight: 600; color: #1e40af; font-size: 16px;">Coordenador de Curso</p>
                  <p style="color: #4a5568; font-size: 14px; margin-top: 5px;">${courseCoordinatorName}</p>
                  <p style="color: #6b7280; font-size: 12px;">Ciências Contábeis - UFVJM</p>
                </div>
                <div style="text-align: center; padding: 20px; border-top: 2px solid #059669;">
                  <p style="margin-top: 15px; font-weight: 600; color: #059669; font-size: 16px;">Coordenadora de Estágio</p>
                  <p style="color: #4a5568; font-size: 14px; margin-top: 5px;">${internshipCoordinatorName}</p>
                  <p style="color: #6b7280; font-size: 12px;">Coordenação de Estágios - UFVJM</p>
                </div>
              </div>
            </div>
          </div>
        </body>
      </html>
    `);
    reportWindow.document.close();
  };
  
  const exportToCSV = (title: string, data: any[]) => {
    if (data.length === 0) {
      toast({
        title: "Aviso",
        description: "Não há dados para exportar com os filtros selecionados.",
      });
      return;
    }
    
    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.join(','),
      ...data.map(row => headers.map(header => `"${row[header] || ''}"`).join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${title.replace(/\s+/g, '_')}_${selectedSemester}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast({
      title: "Sucesso",
      description: `Relatório ${title} exportado com sucesso!`,
    });
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
      active: Array.isArray(alerts) ? alerts.filter((a: any) => a.status === "sent").length : 0,
      completed: Array.isArray(alerts) ? alerts.filter((a: any) => a.status === "pending").length : 0,
    },
    {
      id: "advisors-orientees",
      title: "Relatório de Orientados por Orientadores",
      description: "Lista de orientadores com seus orientados por semestre, incluindo SIAPE",
      icon: Users,
      color: "text-indigo-600",
      bgColor: "bg-indigo-50",
      count: advisors.length,
      active: generateAdvisorsOrienteesReport().length,
      completed: 0,
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

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtros de Relatório
          </CardTitle>
          <CardDescription>
            Configure os filtros para personalizar seus relatórios
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Semestre</Label>
              <Select value={selectedSemester} onValueChange={setSelectedSemester}>
                <SelectTrigger data-testid="select-semester">
                  <SelectValue placeholder="Selecione o semestre" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os Semestres</SelectItem>
                  {availableSemesters.map((semester) => (
                    <SelectItem key={semester.value} value={semester.value}>
                      {semester.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Orientador</Label>
              <Select value={selectedAdvisor} onValueChange={setSelectedAdvisor}>
                <SelectTrigger data-testid="select-advisor">
                  <SelectValue placeholder="Selecione o orientador" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os Orientadores</SelectItem>
                  {advisors.map((advisor) => (
                    <SelectItem key={advisor.id} value={advisor.id}>
                      {advisor.name} - {advisor.department}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Ações Rápidas</Label>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSelectedSemester("all");
                    setSelectedAdvisor("all");
                  }}
                  data-testid="button-clear-filters"
                >
                  Limpar Filtros
                </Button>
                <Button
                  variant="outline" 
                  size="sm"
                  onClick={() => {
                    const currentDate = new Date();
                    const currentYear = currentDate.getFullYear();
                    const currentMonth = currentDate.getMonth() + 1;
                    const currentSemester = currentMonth <= 6 ? 1 : 2;
                    setSelectedSemester(`${currentYear}-${currentSemester}`);
                  }}
                  data-testid="button-current-semester"
                >
                  Semestre Atual
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

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
                    onClick={() => generateReport(report.id, "view")}
                    data-testid={`button-generate-${report.id}`}
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    Visualizar
                  </Button>
                  
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => generateReport(report.id, "pdf")}
                    data-testid={`button-pdf-${report.id}`}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    PDF
                  </Button>
                  
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => generateReport(report.id, "csv")}
                    data-testid={`button-export-${report.id}`}
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    CSV
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