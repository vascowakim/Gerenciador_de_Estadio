import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { AuthUser } from "@/lib/auth";
import { Lock, User, Mail, Shield, Award, Download, BookOpen, FileText } from "lucide-react";
import jsPDF from 'jspdf';

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Senha atual é obrigatória"),
  newPassword: z.string().min(6, "Nova senha deve ter pelo menos 6 caracteres"),
  confirmPassword: z.string().min(1, "Confirmação de senha é obrigatória"),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Senhas não coincidem",
  path: ["confirmPassword"],
});

type ChangePasswordFormData = z.infer<typeof changePasswordSchema>;

export default function ProfilePage() {
  const { toast } = useToast();
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  const { data: user, isLoading } = useQuery<{ user: AuthUser }>({
    queryKey: ["/api", "auth", "me"],
  });

  // Buscar dados do orientador se o usuário for professor
  const { data: advisorData, isLoading: isAdvisorDataLoading } = useQuery({
    queryKey: ["/api/profile/advisor-data"],
    enabled: user?.user?.role === "professor",
  });

  const generateCertificatePDF = (internship: any) => {
    try {
      const doc = new jsPDF();
      
      // Configurar página
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      
      // Margens
      const margin = 30;
      
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
      const text1 = `regularmente matriculado no curso de Ciências Contábeis da UFVJM cumpriu com`;
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
      doc.text(advisorData?.advisor?.name?.toUpperCase() || 'ORIENTADOR', pageWidth / 2, yPosition, { align: "center" });
      
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

  const form = useForm<ChangePasswordFormData>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  const changePasswordMutation = useMutation({
    mutationFn: async (data: ChangePasswordFormData) => {
      // Verificar se está em iframe e usar token JWT
      const headers: HeadersInit = {
        "Content-Type": "application/json",
      };
      
      const isInIframe = () => {
        try {
          return window.self !== window.top;
        } catch (e) {
          return true;
        }
      };

      if (isInIframe()) {
        const token = localStorage.getItem('auth-token');
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }
      }

      const response = await fetch("/api/auth/change-password", {
        method: "PUT",
        headers,
        credentials: "include",
        body: JSON.stringify({
          currentPassword: data.currentPassword,
          newPassword: data.newPassword,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Erro ao alterar senha");
      }

      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Senha alterada",
        description: "Sua senha foi alterada com sucesso!",
      });
      form.reset();
      setIsChangingPassword(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: ChangePasswordFormData) => {
    changePasswordMutation.mutate(data);
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-8"></div>
          <div className="space-y-4">
            <div className="h-32 bg-gray-200 rounded"></div>
            <div className="h-32 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Meu Perfil</h1>
        <p className="text-gray-600 mt-2">
          Gerencie suas informações pessoais e configurações de conta
        </p>
      </div>

      <div className="grid gap-6">
        {/* Informações do Usuário */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              Informações Pessoais
            </CardTitle>
            <CardDescription>
              Suas informações básicas de perfil
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nome
                </label>
                <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-md">
                  <User className="w-4 h-4 text-gray-500" />
                  <span className="text-gray-900">{user?.user?.name || "Não informado"}</span>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  E-mail
                </label>
                <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-md">
                  <Mail className="w-4 h-4 text-gray-500" />
                  <span className="text-gray-900">{user?.user?.email || "Não informado"}</span>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Usuário
                </label>
                <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-md">
                  <User className="w-4 h-4 text-gray-500" />
                  <span className="text-gray-900">{user?.user?.username || "Não informado"}</span>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Função
                </label>
                <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-md">
                  <Shield className="w-4 h-4 text-gray-500" />
                  <span className="text-gray-900">
                    {user?.user?.role === "administrator" ? "Administrador" : "Professor"}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Dados do Orientador - só para professores */}
        {user?.user?.role === "professor" && (
          <>
            {/* Estágios Supervisionados */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="w-5 h-5" />
                  Estágios Supervisionados
                </CardTitle>
                <CardDescription>
                  Lista de todos os estágios sob sua supervisão
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isAdvisorDataLoading ? (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">Carregando estágios...</p>
                  </div>
                ) : !advisorData?.internships || advisorData.internships.total === 0 ? (
                  <div className="text-center py-8">
                    <BookOpen className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium mb-2">Nenhum Estágio Cadastrado</h3>
                    <p className="text-muted-foreground">
                      Você ainda não possui estágios cadastrados sob sua supervisão.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {/* Estatísticas */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="bg-blue-50 p-4 rounded-lg">
                        <div className="flex items-center gap-2">
                          <BookOpen className="h-5 w-5 text-blue-600" />
                          <span className="font-medium">Obrigatórios</span>
                        </div>
                        <p className="text-2xl font-bold text-blue-600">
                          {advisorData.internships.mandatory?.length || 0}
                        </p>
                      </div>
                      <div className="bg-orange-50 p-4 rounded-lg">
                        <div className="flex items-center gap-2">
                          <FileText className="h-5 w-5 text-orange-600" />
                          <span className="font-medium">Não Obrigatórios</span>
                        </div>
                        <p className="text-2xl font-bold text-orange-600">
                          {advisorData.internships.nonMandatory?.length || 0}
                        </p>
                      </div>
                      <div className="bg-green-50 p-4 rounded-lg">
                        <div className="flex items-center gap-2">
                          <Award className="h-5 w-5 text-green-600" />
                          <span className="font-medium">Total</span>
                        </div>
                        <p className="text-2xl font-bold text-green-600">
                          {advisorData.internships.total}
                        </p>
                      </div>
                    </div>

                    {/* Lista de Estágios */}
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Estudante</TableHead>
                          <TableHead>Tipo</TableHead>
                          <TableHead>Empresa</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Período</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {[
                          ...(advisorData.internships.mandatory || []),
                          ...(advisorData.internships.nonMandatory || [])
                        ].map((internship: any) => (
                          <TableRow key={internship.id}>
                            <TableCell>
                              <div>
                                <p className="font-medium">{internship.studentName}</p>
                                <p className="text-sm text-muted-foreground">{internship.studentRegistration}</p>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant={internship.type === 'mandatory' ? 'default' : 'secondary'}>
                                {internship.type === 'mandatory' ? 'Obrigatório' : 'Não Obrigatório'}
                              </Badge>
                            </TableCell>
                            <TableCell>{internship.company}</TableCell>
                            <TableCell>
                              <Badge 
                                variant={internship.status === 'concluido' ? 'default' : 'outline'}
                                className={internship.status === 'concluido' ? 'bg-green-100 text-green-800' : ''}
                              >
                                {internship.status || 'Pendente'}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {internship.startDate && internship.endDate ? (
                                `${new Date(internship.startDate).toLocaleDateString('pt-BR')} - ${new Date(internship.endDate).toLocaleDateString('pt-BR')}`
                              ) : 'Não informado'}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Certificados Disponíveis */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="w-5 h-5" />
                  Certificados Disponíveis
                </CardTitle>
                <CardDescription>
                  Certificados prontos para download dos estágios não obrigatórios concluídos
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isAdvisorDataLoading ? (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">Carregando certificados...</p>
                  </div>
                ) : !advisorData?.certificates?.available || advisorData.certificates.count === 0 ? (
                  <div className="text-center py-8">
                    <Award className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium mb-2">Nenhum Certificado Disponível</h3>
                    <p className="text-muted-foreground">
                      Não há estágios não obrigatórios concluídos para certificação no momento.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="p-4 bg-green-50 rounded-lg">
                      <p className="text-green-800 font-medium">
                        {advisorData.certificates.count} certificado(s) pronto(s) para download
                      </p>
                    </div>
                    
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Estudante</TableHead>
                          <TableHead>Empresa</TableHead>
                          <TableHead>Período</TableHead>
                          <TableHead>Ação</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {advisorData.certificates.available.map((internship: any) => (
                          <TableRow key={internship.id}>
                            <TableCell>
                              <div>
                                <p className="font-medium">{internship.studentName}</p>
                                <p className="text-sm text-muted-foreground">{internship.studentRegistration}</p>
                              </div>
                            </TableCell>
                            <TableCell>{internship.company}</TableCell>
                            <TableCell>
                              {new Date(internship.startDate).toLocaleDateString('pt-BR')} a{' '}
                              {new Date(internship.endDate).toLocaleDateString('pt-BR')}
                            </TableCell>
                            <TableCell>
                              <Button
                                size="sm"
                                onClick={() => generateCertificatePDF(internship)}
                                className="flex items-center gap-2"
                                data-testid={`button-download-cert-${internship.id}`}
                              >
                                <Download className="h-4 w-4" />
                                Baixar
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}

        {/* Alteração de Senha */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="w-5 h-5" />
              Segurança
            </CardTitle>
            <CardDescription>
              Altere sua senha para manter sua conta segura
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!isChangingPassword ? (
              <div className="text-center py-6">
                <Lock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 mb-4">
                  Mantenha sua conta segura alterando sua senha regularmente
                </p>
                <Button
                  onClick={() => setIsChangingPassword(true)}
                  className="bg-blue-600 hover:bg-blue-700"
                  data-testid="button-change-password"
                >
                  <Lock className="w-4 h-4 mr-2" />
                  Alterar Senha
                </Button>
              </div>
            ) : (
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="currentPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Senha Atual</FormLabel>
                        <FormControl>
                          <Input
                            type="password"
                            placeholder="Digite sua senha atual"
                            {...field}
                            data-testid="input-current-password"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="newPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nova Senha</FormLabel>
                        <FormControl>
                          <Input
                            type="password"
                            placeholder="Digite sua nova senha (mín. 6 caracteres)"
                            {...field}
                            data-testid="input-new-password"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="confirmPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Confirmar Nova Senha</FormLabel>
                        <FormControl>
                          <Input
                            type="password"
                            placeholder="Confirme sua nova senha"
                            {...field}
                            data-testid="input-confirm-password"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex gap-3 pt-4">
                    <Button
                      type="submit"
                      disabled={changePasswordMutation.isPending}
                      className="bg-green-600 hover:bg-green-700"
                      data-testid="button-save-password"
                    >
                      {changePasswordMutation.isPending ? "Alterando..." : "Salvar Senha"}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setIsChangingPassword(false);
                        form.reset();
                      }}
                      data-testid="button-cancel-password"
                    >
                      Cancelar
                    </Button>
                  </div>
                </form>
              </Form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}