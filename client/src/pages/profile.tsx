import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { AuthUser } from "@/lib/auth";
import { Lock, User, Mail, Shield, GraduationCap, Building2 } from "lucide-react";

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

  // Buscar estágios obrigatórios e não obrigatórios para todos os usuários
  const { data: mandatoryInternships = [] } = useQuery<any[]>({
    queryKey: ["/api/mandatory-internships"],
    enabled: !!user,
  });

  const { data: nonMandatoryInternships = [] } = useQuery<any[]>({
    queryKey: ["/api/non-mandatory-internships"],
    enabled: !!user,
  });

  const { data: students = [] } = useQuery<any[]>({
    queryKey: ["/api/students"],
    enabled: !!user,
  });

  const { data: companies = [] } = useQuery<any[]>({
    queryKey: ["/api/companies"],
    enabled: !!user,
  });

  // Filtrar estágios criados por administradores
  const internshipsCreatedByAdmins = user ? [
    ...mandatoryInternships.filter((i: any) => i.createdByUser && i.createdByUser.role === "administrator"),
    ...nonMandatoryInternships.filter((i: any) => i.createdByUser && i.createdByUser.role === "administrator")
  ] : [];

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

        {/* Estágios criados por administradores - visível para todos */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <GraduationCap className="w-5 h-5" />
              Estágios Criados por Administradores
            </CardTitle>
            <CardDescription>
              {user?.user?.role === "professor" 
                ? "Estágios onde você é orientador e foram criados por administradores"
                : "Estágios que foram criados por administradores"
              }
            </CardDescription>
          </CardHeader>
            <CardContent>
              {internshipsCreatedByAdmins.length === 0 ? (
                <div className="text-center py-6">
                  <GraduationCap className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">
                    {user?.user?.role === "professor" 
                      ? "Nenhum estágio foi atribuído a você por administradores ainda."
                      : "Nenhum estágio foi criado por administradores ainda."
                    }
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {internshipsCreatedByAdmins.map((internship: any) => {
                    const student = students.find((s: any) => s.id === internship.studentId);
                    const company = companies.find((c: any) => c.id === internship.companyId);
                    
                    return (
                      <div
                        key={internship.id}
                        className="border rounded-lg p-4 bg-gray-50"
                        data-testid={`internship-created-by-admin-${internship.id}`}
                      >
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex items-center gap-2">
                            <User className="w-4 h-4 text-blue-600" />
                            <span className="font-medium text-gray-900">
                              {student?.name || "Estudante não encontrado"}
                            </span>
                            {internship.type && (
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                internship.type === "mandatory" 
                                  ? "bg-blue-100 text-blue-700" 
                                  : "bg-green-100 text-green-700"
                              }`}>
                                {internship.type === "mandatory" ? "Obrigatório" : "Não Obrigatório"}
                              </span>
                            )}
                          </div>
                          <span className="text-xs text-gray-500">
                            Criado por: {internship.createdByUser?.name}
                          </span>
                        </div>
                        
                        <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                          <Building2 className="w-4 h-4" />
                          <span>{company?.name || "Empresa não encontrada"}</span>
                        </div>
                        
                        {internship.supervisor && (
                          <div className="text-sm text-gray-600">
                            <span className="font-medium">Supervisor:</span> {internship.supervisor}
                          </div>
                        )}
                        
                        <div className="text-xs text-gray-500 mt-2">
                          Período: {new Date(internship.startDate).toLocaleDateString('pt-BR')} - {new Date(internship.endDate).toLocaleDateString('pt-BR')}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
        </Card>

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