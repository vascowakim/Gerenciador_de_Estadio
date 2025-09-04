import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { UserPlus, ArrowLeft, User, Mail, Lock, Building, Phone, FileText } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import ufvjmLogo from "@assets/ufvjm_1756831174700.png";

// Schema de validação para registro público
const registerSchema = z.object({
  name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  email: z.string().email("Email inválido").endsWith("@ufvjm.edu.br", "Email deve ser @ufvjm.edu.br"),
  password: z.string().min(6, "Senha deve ter pelo menos 6 caracteres"),
  confirmPassword: z.string(),
  department: z.string().min(2, "Departamento é obrigatório"),
  phone: z.string().min(10, "Telefone deve ter pelo menos 10 dígitos"),
  registration: z.string().optional(),
  isProfessor: z.boolean().default(true),
  isInternshipCoordinator: z.boolean().default(false),
  isSystemAdmin: z.boolean().default(false),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Senhas não coincidem",
  path: ["confirmPassword"],
});

type RegisterFormData = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const form = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
      department: "",
      phone: "",
      registration: "",
      isProfessor: true,
      isInternshipCoordinator: false,
      isSystemAdmin: false,
    },
  });

  const onSubmit = async (data: RegisterFormData) => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/public/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Erro ao registrar usuário");
      }

      toast({
        title: "Cadastro realizado com sucesso!",
        description: "Seu usuário foi criado. Aguarde aprovação do administrador.",
      });

      // Redirecionar para login após alguns segundos
      setTimeout(() => {
        setLocation("/");
      }, 3000);

    } catch (error: any) {
      toast({
        title: "Erro no cadastro",
        description: error.message || "Erro ao criar usuário",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 mx-auto mb-4 bg-white rounded-full flex items-center justify-center p-2 shadow-lg">
            <img 
              src={ufvjmLogo} 
              alt="UFVJM Logo" 
              className="w-full h-full object-contain"
              data-testid="img-ufvjm-logo"
            />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2" data-testid="text-register-title">Primeiro Acesso</h1>
          <p className="text-gray-600">Sistema EstagioPro - UFVJM</p>
        </div>

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center">
              <UserPlus className="w-5 h-5 mr-2 text-blue-600" />
              Cadastro de Novo Usuário
            </CardTitle>
            <CardDescription>
              Preencha os dados abaixo para solicitar acesso ao sistema
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                
                {/* Dados Pessoais */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-gray-900 flex items-center">
                    <User className="w-4 h-4 mr-2" />
                    Dados Pessoais
                  </h3>
                  
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nome Completo</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Digite seu nome completo"
                            {...field}
                            data-testid="input-name"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email Institucional</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                              <Input
                                placeholder="seu.nome@ufvjm.edu.br"
                                className="pl-10"
                                {...field}
                                data-testid="input-email"
                              />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Telefone</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                              <Input
                                placeholder="(00) 00000-0000"
                                className="pl-10"
                                {...field}
                                data-testid="input-phone"
                              />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                {/* Dados Profissionais */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-gray-900 flex items-center">
                    <Building className="w-4 h-4 mr-2" />
                    Dados Profissionais
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="department"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Departamento</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Ex: Engenharia e Tecnologia"
                              {...field}
                              data-testid="input-department"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="registration"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Matrícula/SIAPE (Opcional)</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Número de matrícula"
                              {...field}
                              data-testid="input-registration"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                {/* Dados de Acesso */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-gray-900 flex items-center">
                    <Lock className="w-4 h-4 mr-2" />
                    Dados de Acesso
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Senha</FormLabel>
                          <FormControl>
                            <Input
                              type="password"
                              placeholder="Mínimo 6 caracteres"
                              {...field}
                              data-testid="input-password"
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
                          <FormLabel>Confirmar Senha</FormLabel>
                          <FormControl>
                            <Input
                              type="password"
                              placeholder="Digite a senha novamente"
                              {...field}
                              data-testid="input-confirm-password"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                {/* Perfil de Acesso */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-gray-900 flex items-center">
                    <FileText className="w-4 h-4 mr-2" />
                    Perfil de Acesso Solicitado
                  </h3>
                  
                  <div className="space-y-3">
                    <FormField
                      control={form.control}
                      name="isProfessor"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                              data-testid="checkbox-professor"
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel>Professor/Orientador</FormLabel>
                            <p className="text-sm text-gray-600">
                              Acesso para orientar estágios e gerenciar estudantes
                            </p>
                          </div>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="isInternshipCoordinator"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                              data-testid="checkbox-coordinator"
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel>Coordenador de Estágios</FormLabel>
                            <p className="text-sm text-gray-600">
                              Acesso para coordenar programa de estágios
                            </p>
                          </div>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="isSystemAdmin"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                              data-testid="checkbox-admin"
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel>Administrador do Sistema</FormLabel>
                            <p className="text-sm text-gray-600">
                              Acesso total ao sistema (necessário justificativa)
                            </p>
                          </div>
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                {/* Botões */}
                <div className="flex flex-col sm:flex-row gap-4 pt-6">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setLocation("/")}
                    className="flex items-center"
                    data-testid="button-back"
                  >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Voltar ao Login
                  </Button>
                  
                  <Button
                    type="submit"
                    className="flex-1 ufvjm-light-blue hover:bg-blue-700 text-white font-medium"
                    disabled={isLoading}
                    data-testid="button-register"
                  >
                    <UserPlus className="w-4 h-4 mr-2" />
                    {isLoading ? "Cadastrando..." : "Solicitar Cadastro"}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>

        {/* Informações Adicionais */}
        <div className="mt-6 text-center text-sm text-gray-600">
          <p>
            Após o cadastro, seu acesso será analisado pelo administrador do sistema.
            <br />
            Você receberá um email de confirmação quando o acesso for aprovado.
          </p>
        </div>
      </div>
    </div>
  );
}