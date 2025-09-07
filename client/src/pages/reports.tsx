import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileText, Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import ufvjmLogo from "@assets/ufvjm_1757276310462.png";

// Interface para dados do relatório
interface ReportData {
  id: string;
  name: string;
  siape: string;
  students: {
    name: string;
    registrationNumber: string;
    company: string;
    type: string;
  }[];
}

function generateSemesters(): { value: string; label: string }[] {
  const currentYear = new Date().getFullYear();
  const semesters = [];
  
  // Gerar semestres dos últimos 2 anos até próximo ano
  for (let year = currentYear - 2; year <= currentYear + 1; year++) {
    semesters.push({
      value: `${year}-1`,
      label: `${year}/1 (Janeiro - Junho)`
    });
    semesters.push({
      value: `${year}-2`, 
      label: `${year}/2 (Julho - Dezembro)`
    });
  }
  
  return semesters.reverse(); // Mais recentes primeiro
}

function getSemesterDateRange(semester: string): { start: Date; end: Date } {
  const [year, sem] = semester.split('-');
  const yearNum = parseInt(year);
  
  if (sem === '1') {
    return {
      start: new Date(yearNum, 0, 1), // Janeiro
      end: new Date(yearNum, 5, 30)   // Junho
    };
  } else {
    return {
      start: new Date(yearNum, 6, 1),  // Julho
      end: new Date(yearNum, 11, 31)   // Dezembro
    };
  }
}

export default function Reports() {
  const [selectedSemester, setSelectedSemester] = useState<string>("");
  const { toast } = useToast();

  const { data: reportData, isLoading } = useQuery<ReportData[]>({
    queryKey: ['/api/reports/orientation', selectedSemester],
    enabled: !!selectedSemester,
  });

  const generatePDF = async () => {
    if (!reportData || !selectedSemester) {
      toast({
        title: "Erro",
        description: "Selecione um semestre para gerar o relatório",
        variant: "destructive"
      });
      return;
    }

    try {
      const doc = new jsPDF();
      
      // Adicionar logo UFVJM centralizada no topo
      const pageWidth = doc.internal.pageSize.getWidth();
      const logoWidth = 30;
      const logoHeight = 20;
      const logoX = (pageWidth - logoWidth) / 2;
      
      // Carregar e adicionar a imagem
      doc.addImage(ufvjmLogo, 'PNG', logoX, 10, logoWidth, logoHeight);
      
      // Nome da universidade
      doc.setFontSize(16);
      doc.setFont("helvetica", "bold");
      doc.text("UNIVERSIDADE FEDERAL DOS VALES DO JEQUITINHONHA E MUCURI", pageWidth / 2, 40, { align: "center" });
      doc.text("UFVJM", pageWidth / 2, 50, { align: "center" });
      
      // Título do relatório
      doc.setFontSize(14);
      doc.text("RELATÓRIO DE ORIENTAÇÃO DE ESTÁGIOS", pageWidth / 2, 70, { align: "center" });
      
      const [year, sem] = selectedSemester.split('-');
      doc.setFontSize(12);
      doc.text(`${year}/${sem}º Semestre`, pageWidth / 2, 80, { align: "center"});
      
      let yPosition = 100;
      
      // Para cada orientador
      reportData.forEach((advisor: ReportData) => {
        // Verificar se precisa de nova página
        if (yPosition > 250) {
          doc.addPage();
          yPosition = 30;
        }
        
        // Nome e SIAPE do professor (negrito, alinhado à esquerda)
        doc.setFont("helvetica", "bold");
        doc.setFontSize(12);
        doc.text(`Professor: ${advisor.name}`, 20, yPosition);
        doc.text(`SIAPE: ${advisor.siape}`, 20, yPosition + 10);
        
        yPosition += 25;
        
        // Lista de estudantes
        if (advisor.students && advisor.students.length > 0) {
          doc.setFont("helvetica", "normal");
          doc.setFontSize(11);
          doc.text("Estudantes sob orientação:", 20, yPosition);
          yPosition += 10;
          
          const tableData = advisor.students.map(student => [
            student.name,
            student.registrationNumber,
            student.company || "Não informada",
            student.type || "Não informado"
          ]);
          
          autoTable(doc, {
            head: [['Nome do Estudante', 'Matrícula', 'Empresa', 'Tipo de Estágio']],
            body: tableData,
            startY: yPosition,
            margin: { left: 20, right: 20 },
            styles: { fontSize: 9 },
            headStyles: { fillColor: [41, 128, 185], fontSize: 9 },
            columnStyles: {
              0: { cellWidth: 50 }, // Nome
              1: { cellWidth: 30 }, // Matrícula  
              2: { cellWidth: 45 }, // Empresa
              3: { cellWidth: 35 }  // Tipo
            },
            theme: 'striped'
          });
          
          yPosition = (doc as any).lastAutoTable.finalY + 20;
        } else {
          doc.setFont("helvetica", "italic");
          doc.text("Nenhum estudante sob orientação neste período.", 25, yPosition);
          yPosition += 20;
        }
        
        yPosition += 10; // Espaço entre orientadores
      });
      
      // Salvar o arquivo
      const fileName = `orientacao_estagio_${selectedSemester.replace('-', '_')}semestre.pdf`;
      doc.save(fileName);
      
      toast({
        title: "Sucesso",
        description: `Relatório ${fileName} gerado com sucesso!`
      });
      
    } catch (error) {
      console.error('Erro ao gerar PDF:', error);
      toast({
        title: "Erro",
        description: "Erro ao gerar o relatório PDF",
        variant: "destructive"
      });
    }
  };

  const semesters = generateSemesters();
  
  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Relatórios</h1>
          <p className="text-muted-foreground">
            Gere relatórios de orientação de estágios por semestre
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Relatório de Orientação de Professores
          </CardTitle>
          <CardDescription>
            Selecione o semestre para gerar o relatório de todos os orientadores e seus respectivos estudantes
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <Select value={selectedSemester} onValueChange={setSelectedSemester} data-testid="select-semester">
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o semestre" />
                </SelectTrigger>
                <SelectContent>
                  {semesters.map((semester) => (
                    <SelectItem key={semester.value} value={semester.value}>
                      {semester.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button
              onClick={generatePDF}
              disabled={!selectedSemester || isLoading}
              className="flex items-center gap-2"
              data-testid="button-generate-report"
            >
              <Download className="h-4 w-4" />
              Orientação Professor
            </Button>
          </div>
          
          {selectedSemester && (
            <div className="p-4 bg-muted rounded-lg">
              <h3 className="font-medium mb-2">Informações do Relatório:</h3>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Nome do arquivo: orientacao_estagio_{selectedSemester.replace('-', '_')}semestre.pdf</li>
                <li>• Inclui logo da UFVJM e nome da universidade</li>
                <li>• Lista todos os orientadores com nome e SIAPE em negrito</li>
                <li>• Mostra estudantes supervisionados com nome, matrícula, empresa e tipo de estágio</li>
                <li>• Diferencia entre estágios obrigatórios e não obrigatórios</li>
              </ul>
            </div>
          )}
          
          {isLoading && (
            <div className="text-center py-4">
              <p className="text-muted-foreground">Carregando dados do relatório...</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}