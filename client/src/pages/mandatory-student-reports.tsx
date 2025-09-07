import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BookOpen, Download, ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import ufvjmLogo from "@assets/ufvjm_1757276310462.png";

function generateSemesters(): { value: string; label: string }[] {
  const currentYear = new Date().getFullYear();
  const semesters = [];
  
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
  
  return semesters.reverse();
}

export default function MandatoryStudentReports() {
  const [selectedSemester, setSelectedSemester] = useState<string>("");
  const { toast } = useToast();

  const { data: reportData, isLoading } = useQuery({
    queryKey: ['/api/reports/mandatory-students', selectedSemester],
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
      
      // Cabeçalho com logo
      const pageWidth = doc.internal.pageSize.getWidth();
      const logoWidth = 30;
      const logoHeight = 20;
      const logoX = (pageWidth - logoWidth) / 2;
      
      doc.addImage(ufvjmLogo, 'PNG', logoX, 10, logoWidth, logoHeight);
      
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.text("MINISTÉRIO DA EDUCAÇÃO", pageWidth / 2, 35, { align: "center" });
      
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.text("UNIVERSIDADE FEDERAL DOS VALES DO JEQUITINHONHA E MUCURI", pageWidth / 2, 45, { align: "center" });
      doc.text("UFVJM", pageWidth / 2, 55, { align: "center" });
      
      doc.setFontSize(14);
      doc.text("RELATÓRIO DE ESTUDANTES EM ESTÁGIOS OBRIGATÓRIOS", pageWidth / 2, 70, { align: "center" });
      
      const [year, sem] = selectedSemester.split('-');
      doc.setFontSize(12);
      doc.text(`Semestre ${year}/${sem}º`, pageWidth / 2, 80, { align: "center"});
      
      let yPosition = 100;
      
      // Tabela com dados dos estudantes
      if (reportData && reportData.length > 0) {
        const tableData = reportData.map((student: any) => [
          student.name || 'N/A',
          student.registrationNumber || 'N/A',
          student.course || 'N/A',
          student.company || 'N/A',
          student.advisor || 'N/A',
          student.status || 'N/A'
        ]);
        
        autoTable(doc, {
          head: [['Nome do Estudante', 'Matrícula', 'Curso', 'Empresa', 'Orientador', 'Status']],
          body: tableData,
          startY: yPosition,
          margin: { left: 10, right: 10 },
          styles: { fontSize: 8 },
          headStyles: { fillColor: [34, 139, 34], fontSize: 8 },
          columnStyles: {
            0: { cellWidth: 35 }, // Nome
            1: { cellWidth: 25 }, // Matrícula  
            2: { cellWidth: 30 }, // Curso
            3: { cellWidth: 35 }, // Empresa
            4: { cellWidth: 35 }, // Orientador
            5: { cellWidth: 25 }  // Status
          },
          theme: 'striped'
        });
      } else {
        doc.setFont("helvetica", "italic");
        doc.text("Nenhum estudante em estágio obrigatório encontrado para este período.", 20, yPosition);
      }
      
      const fileName = `estudantes_estagio_obrigatorio_${selectedSemester.replace('-', '_')}semestre.pdf`;
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
        <div className="flex items-center gap-4">
          <Link href="/reports">
            <Button variant="outline" size="sm" className="flex items-center gap-2" data-testid="button-back">
              <ArrowLeft className="h-4 w-4" />
              Voltar
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Estudantes em Estágios Obrigatórios</h1>
            <p className="text-muted-foreground">
              Relatório de estudantes em estágios obrigatórios por semestre
            </p>
          </div>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            Relatório de Estágios Obrigatórios
          </CardTitle>
          <CardDescription>
            Selecione o semestre para gerar o relatório de estudantes em estágios obrigatórios
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
              Gerar Relatório PDF
            </Button>
          </div>
          
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