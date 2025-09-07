import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Award, ArrowLeft, Download, GraduationCap } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";
import jsPDF from 'jspdf';

interface CompletedInternship {
  id: string;
  studentName: string;
  studentRegistration: string;
  course: string;
  startDate: string;
  endDate: string;
  advisorName: string;
  company: string;
}

export default function NonMandatoryStudentCertificates() {
  const { toast } = useToast();

  const { data: completedInternships, isLoading } = useQuery<CompletedInternship[]>({
    queryKey: ['/api/certificates/non-mandatory-completed'],
  });

  const generateCertificatePDF = (internship: CompletedInternship) => {
    try {
      const doc = new jsPDF();
      
      // Configurar página
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      
      // Margens
      const margin = 30;
      const contentWidth = pageWidth - 2 * margin;
      
      // Título principal - CERTIFICADO
      doc.setFontSize(24);
      doc.setFont("helvetica", "bold");
      doc.text("CERTIFICADO", pageWidth / 2, 40, { align: "center" });
      
      // Subtítulo
      doc.setFontSize(16);
      doc.text("DE ESTÁGIO NÃO OBRIGATÓRIO", pageWidth / 2, 55, { align: "center" });
      
      // Espaçamento
      let yPosition = 90;
      
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
      const text1 = `regularmente matriculado no curso de ${internship.course} da UFVJM cumpriu com`;
      doc.text(text1, pageWidth / 2, yPosition, { align: "center" });
      
      yPosition += 15;
      
      // Formatação das datas
      const startDate = new Date(internship.startDate).toLocaleDateString('pt-BR');
      const endDate = new Date(internship.endDate).toLocaleDateString('pt-BR');
      
      const text2 = `satisfação o Estágio Supervisionado Não Obrigatório no período de ${startDate} a`;
      doc.text(text2, pageWidth / 2, yPosition, { align: "center" });
      
      yPosition += 15;
      
      const text3 = `${endDate}. O estágio foi supervisionado pelo professor`;
      doc.text(text3, pageWidth / 2, yPosition, { align: "center" });
      
      yPosition += 15;
      
      // Nome do orientador (destacado)
      doc.setFont("helvetica", "bold");
      doc.text(internship.advisorName.toUpperCase(), pageWidth / 2, yPosition, { align: "center" });
      
      yPosition += 15;
      
      // Texto final
      doc.setFont("helvetica", "normal");
      const text4 = "e desenvolvido em conformidade com";
      doc.text(text4, pageWidth / 2, yPosition, { align: "center" });
      
      yPosition += 15;
      
      const text5 = "as diretrizes curriculares do curso e a Lei de Estágios nº 11.788/2008";
      doc.text(text5, pageWidth / 2, yPosition, { align: "center" });
      
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
      doc.setFontSize(8);
      doc.text(`Emitido em: ${currentDate}`, pageWidth - margin, pageHeight - 20, { align: "right" });
      
      // Salvar o arquivo
      const fileName = `certificado_${internship.studentName.replace(/\s+/g, '_').toLowerCase()}_${internship.id.slice(0, 8)}.pdf`;
      doc.save(fileName);
      
      toast({
        title: "Sucesso",
        description: `Certificado ${fileName} gerado com sucesso!`
      });
      
    } catch (error) {
      console.error('Erro ao gerar certificado:', error);
      toast({
        title: "Erro",
        description: "Erro ao gerar o certificado PDF",
        variant: "destructive"
      });
    }
  };

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
            <h1 className="text-3xl font-bold tracking-tight">Certificados - Estágios Não Obrigatórios</h1>
            <p className="text-muted-foreground">
              Gere certificados para seus orientados com estágios concluídos
            </p>
          </div>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <GraduationCap className="h-5 w-5" />
            Estágios Não Obrigatórios Concluídos
          </CardTitle>
          <CardDescription>
            Lista de seus orientados com estágios não obrigatórios concluídos prontos para certificação
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">Carregando estágios concluídos...</p>
            </div>
          ) : !completedInternships || completedInternships.length === 0 ? (
            <div className="text-center py-8">
              <Award className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">Nenhum Estágio Concluído</h3>
              <p className="text-muted-foreground">
                Você não possui orientados com estágios não obrigatórios concluídos no momento.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Aluno</TableHead>
                    <TableHead>Matrícula</TableHead>
                    <TableHead>Curso</TableHead>
                    <TableHead>Empresa</TableHead>
                    <TableHead>Período</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Ação</TableHead>
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
                        {new Date(internship.startDate).toLocaleDateString('pt-BR')} a{' '}
                        {new Date(internship.endDate).toLocaleDateString('pt-BR')}
                      </TableCell>
                      <TableCell>
                        <Badge variant="default" className="bg-green-100 text-green-800">
                          Concluído
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          onClick={() => generateCertificatePDF(internship)}
                          className="flex items-center gap-2"
                          data-testid={`button-download-${internship.id}`}
                        >
                          <Download className="h-4 w-4" />
                          Certificado
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              
              <div className="mt-6 p-4 bg-muted rounded-lg">
                <h4 className="font-medium mb-2">Informações sobre os Certificados:</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• <strong>Modelo Oficial</strong>: Baseado no template oficial da UFVJM</li>
                  <li>• <strong>Dados Inclusos</strong>: Nome do aluno, curso, período do estágio, orientador</li>
                  <li>• <strong>Assinatura</strong>: Prof. Dr. Vasconcelos R. Wakim (conforme modelo)</li>
                  <li>• <strong>Validação</strong>: Lei de Estágios nº 11.788/2008</li>
                </ul>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}