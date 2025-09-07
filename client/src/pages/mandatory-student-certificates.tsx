import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Award, ArrowLeft, Download, GraduationCap } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";
import { SemesterSelector } from "@/components/SemesterSelector";
import jsPDF from 'jspdf';
import ufvjmLogo from "@assets/ufvjm_1757276310462.png";

interface CompletedMandatoryInternship {
  id: string;
  studentName: string;
  studentRegistration: string;
  course: string;
  startDate: string;
  endDate: string;
  advisorName: string;
  company: string;
  workload: number;
  crc: string;
}

export default function MandatoryStudentCertificates() {
  const { toast } = useToast();
  const [selectedSemester, setSelectedSemester] = useState<string>("all");

  const { data: completedInternships, isLoading } = useQuery<CompletedMandatoryInternship[]>({
    queryKey: ['/api/certificates/mandatory-completed', selectedSemester],
    enabled: !!selectedSemester,
  });

  const generateCertificatePDF = (internship: CompletedMandatoryInternship) => {
    try {
      const doc = new jsPDF();
      
      // Configurar página
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      
      // Adicionar logo UFVJM centralizada no topo
      const logoWidth = 30;
      const logoHeight = 20;
      const logoX = (pageWidth - logoWidth) / 2;
      
      // Carregar e adicionar a imagem
      doc.addImage(ufvjmLogo, 'PNG', logoX, 10, logoWidth, logoHeight);
      
      // Ministério da Educação
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.text("MINISTÉRIO DA EDUCAÇÃO", pageWidth / 2, 35, { align: "center" });
      
      // Nome da universidade
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.text("UNIVERSIDADE FEDERAL DOS VALES DO JEQUITINHONHA E MUCURI", pageWidth / 2, 45, { align: "center" });
      doc.text("UFVJM", pageWidth / 2, 55, { align: "center" });
      
      // Título principal - CERTIFICADO
      doc.setFontSize(24);
      doc.setFont("helvetica", "bold");
      doc.text("CERTIFICADO", pageWidth / 2, 75, { align: "center" });
      
      // Subtítulo
      doc.setFontSize(16);
      doc.text("DE ESTÁGIO OBRIGATÓRIO", pageWidth / 2, 90, { align: "center" });
      
      // Espaçamento
      let yPosition = 115;
      
      // Texto principal - CERTIFICAMOS QUE
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text("CERTIFICAMOS QUE", pageWidth / 2, yPosition, { align: "center" });
      
      yPosition += 25;
      
      // Nome do aluno (destacado)
      doc.setFontSize(16);
      doc.setFont("helvetica", "bold");
      doc.text(internship.studentName.toUpperCase(), pageWidth / 2, yPosition, { align: "center" });
      
      yPosition += 20;
      
      // Texto do certificado
      doc.setFontSize(12);
      doc.setFont("helvetica", "normal");
      
      // Quebrar texto em múltiplas linhas
      const text1 = `regularmente matriculado(a) no curso de ${internship.course} da UFVJM, matrícula`;
      doc.text(text1, pageWidth / 2, yPosition, { align: "center" });
      
      yPosition += 15;
      
      // Matrícula destacada
      doc.setFont("helvetica", "bold");
      doc.text(internship.studentRegistration, pageWidth / 2, yPosition, { align: "center" });
      
      yPosition += 15;
      
      // Continuação do texto
      doc.setFont("helvetica", "normal");
      const text2 = "cumpriu com satisfação o Estágio Supervisionado Obrigatório com carga horária total de";
      doc.text(text2, pageWidth / 2, yPosition, { align: "center" });
      
      yPosition += 15;
      
      // Carga horária destacada
      doc.setFont("helvetica", "bold");
      doc.text(`${internship.workload} (${numberToWords(internship.workload)}) horas`, pageWidth / 2, yPosition, { align: "center" });
      
      yPosition += 15;
      
      // Formatação das datas
      const startDate = new Date(internship.startDate).toLocaleDateString('pt-BR');
      const endDate = new Date(internship.endDate).toLocaleDateString('pt-BR');
      
      doc.setFont("helvetica", "normal");
      const text3 = `no período de ${startDate} a ${endDate}, na empresa ${internship.company}.`;
      doc.text(text3, pageWidth / 2, yPosition, { align: "center" });
      
      yPosition += 15;
      
      const text4 = "O estágio foi supervisionado pelo professor";
      doc.text(text4, pageWidth / 2, yPosition, { align: "center" });
      
      yPosition += 15;
      
      // Nome do orientador (destacado)
      doc.setFont("helvetica", "bold");
      doc.text(internship.advisorName.toUpperCase(), pageWidth / 2, yPosition, { align: "center" });
      
      yPosition += 15;
      
      // Texto final
      doc.setFont("helvetica", "normal");
      const text5 = "e desenvolvido em conformidade com as diretrizes curriculares do curso";
      doc.text(text5, pageWidth / 2, yPosition, { align: "center" });
      
      yPosition += 15;
      
      const text6 = "e a Lei de Estágios nº 11.788/2008.";
      doc.text(text6, pageWidth / 2, yPosition, { align: "center" });
      
      // CRC se disponível
      if (internship.crc) {
        yPosition += 15;
        const text7 = `CRC: ${internship.crc}`;
        doc.text(text7, pageWidth / 2, yPosition, { align: "center" });
      }
      
      // Assinatura no final da página
      yPosition = pageHeight - 80;
      
      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.text("PROF. DR. VASCONCELOS R. WAKIM", pageWidth / 2, yPosition, { align: "center" });
      
      yPosition += 10;
      
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.text("PERITO CONTADOR CRCMG 082870/O-8", pageWidth / 2, yPosition, { align: "center" });
      
      // Data de emissão no canto inferior direito
      const currentDate = new Date().toLocaleDateString('pt-BR');
      doc.setFontSize(9);
      doc.text(`Diamantina, ${currentDate}`, pageWidth - 30, pageHeight - 20);
      
      // Salvar o arquivo
      const fileName = `certificado_estagio_obrigatorio_${internship.studentName.replace(/\s+/g, '_')}.pdf`;
      doc.save(fileName);
      
      toast({
        title: "Sucesso",
        description: `Certificado de ${internship.studentName} gerado com sucesso!`
      });
      
    } catch (error) {
      console.error('Erro ao gerar certificado:', error);
      toast({
        title: "Erro",
        description: "Erro ao gerar certificado PDF",
        variant: "destructive"
      });
    }
  };

  // Função auxiliar para converter números em palavras (simplificada)
  const numberToWords = (num: number): string => {
    const numbers: { [key: number]: string } = {
      390: "trezentas e noventa",
      400: "quatrocentas",
      450: "quatrocentas e cinquenta",
      500: "quinhentas"
    };
    return numbers[num] || num.toString();
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <div className="text-center">
          <GraduationCap className="h-12 w-12 mx-auto mb-4 animate-pulse" />
          <p>Carregando estágios obrigatórios concluídos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/student-certificates">
            <Button variant="outline" size="sm" className="flex items-center gap-2" data-testid="button-back">
              <ArrowLeft className="h-4 w-4" />
              Voltar
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Certificados - Estágios Obrigatórios</h1>
            <p className="text-muted-foreground">
              Certificados para estudantes em estágios obrigatórios concluídos
            </p>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <SemesterSelector 
          value={selectedSemester} 
          onValueChange={setSelectedSemester}
          includeAll={true}
        />
        <Badge variant="secondary">
          {completedInternships?.length || 0} estágios concluídos
        </Badge>
      </div>

      {!completedInternships || completedInternships.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Award className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">Nenhum estágio obrigatório concluído encontrado</h3>
            <p className="text-muted-foreground mb-4">
              {selectedSemester === 'all' 
                ? 'Não há estágios obrigatórios concluídos para gerar certificados.'
                : `Não há estágios obrigatórios concluídos no semestre selecionado.`
              }
            </p>
            <div className="p-4 bg-muted rounded-lg">
              <h4 className="font-medium mb-2">Para um estágio ser elegível para certificado:</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Status deve ser "Concluído"</li>
                <li>• Carga horária de 390h deve estar completa</li>
                <li>• Todos os relatórios devem estar aprovados</li>
                <li>• Deve ter orientador vinculado</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5" />
              Estágios Obrigatórios Concluídos
            </CardTitle>
            <CardDescription>
              Clique em "Gerar Certificado" para baixar o certificado em PDF
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Estudante</TableHead>
                  <TableHead>Matrícula</TableHead>
                  <TableHead>Curso</TableHead>
                  <TableHead>Empresa</TableHead>
                  <TableHead>Período</TableHead>
                  <TableHead>Carga Horária</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {completedInternships.map((internship) => (
                  <TableRow key={internship.id}>
                    <TableCell className="font-medium">{internship.studentName}</TableCell>
                    <TableCell>{internship.studentRegistration}</TableCell>
                    <TableCell>{internship.course}</TableCell>
                    <TableCell>{internship.company}</TableCell>
                    <TableCell>
                      {new Date(internship.startDate).toLocaleDateString('pt-BR')} - {' '}
                      {new Date(internship.endDate).toLocaleDateString('pt-BR')}
                    </TableCell>
                    <TableCell>
                      <Badge variant={internship.workload >= 390 ? "default" : "secondary"}>
                        {internship.workload}h
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button
                        size="sm"
                        onClick={() => generateCertificatePDF(internship)}
                        className="flex items-center gap-2"
                        data-testid={`button-certificate-${internship.id}`}
                      >
                        <Download className="h-4 w-4" />
                        Gerar Certificado
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}