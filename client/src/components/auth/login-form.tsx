import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { LogIn, Star, Shield, BarChart3, Settings, UserPlus } from "lucide-react";
import { AuthService } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import ufvjmLogo from "@assets/ufvjm_1756831174700.png";

const loginSchema = z.object({
  username: z.string().min(1, "Usuário é obrigatório"),
  password: z.string().min(1, "Senha é obrigatória"),
});

type LoginFormData = z.infer<typeof loginSchema>;

interface LoginFormProps {
  onLoginSuccess: (user: any) => void;
}

export function LoginForm({ onLoginSuccess }: LoginFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    try {
      const user = await AuthService.login(data);
      onLoginSuccess(user);
      toast({
        title: "Login realizado com sucesso",
        description: `Bem-vindo, ${user.name}!`,
      });
    } catch (error: any) {
      toast({
        title: "Erro no login",
        description: error.message || "Credenciais inválidas",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="window-frame bg-white rounded-lg overflow-hidden max-w-4xl w-full h-[600px] flex">
        {/* Window Title Bar */}
        <div className="absolute top-0 left-0 right-0 bg-gray-50 h-10 flex items-center justify-between px-4 border-b border-gray-200 z-10">
          <div className="flex items-center space-x-2">
            <LogIn className="w-4 h-4 text-blue-600" />
            <span className="text-sm text-gray-700 font-medium">EstagioPro - Sistema de Controle de Estágio</span>
          </div>
          <div className="flex items-center space-x-1">
            <button className="w-3 h-3 bg-gray-300 rounded-full hover:bg-gray-400" data-testid="button-minimize"></button>
            <button className="w-3 h-3 bg-gray-300 rounded-full hover:bg-gray-400" data-testid="button-maximize"></button>
            <button className="w-3 h-3 bg-red-400 rounded-full hover:bg-red-500" data-testid="button-close"></button>
          </div>
        </div>

        {/* Left Panel - Branding */}
        <div className="ufvjm-blue w-1/2 flex flex-col justify-center items-center p-8 text-white relative mt-10">
          {/* UFVJM Logo and Branding */}
          <div className="text-center mb-8">
            <div className="mb-6">
              <div className="w-20 h-20 mx-auto mb-4 bg-white rounded-full flex items-center justify-center p-2">
                <img 
                  src={ufvjmLogo} 
                  alt="UFVJM Logo" 
                  className="w-full h-full object-contain"
                  data-testid="img-ufvjm-logo"
                />
              </div>
              <h2 className="text-xl font-bold tracking-wide mb-2" data-testid="text-university-name">UFVJM</h2>
            </div>
            
            <h1 className="text-3xl font-bold mb-4" data-testid="text-system-name">EstagioPro</h1>
            <p className="text-lg mb-2 font-medium">Sistema Profissional de</p>
            <p className="text-lg mb-6 font-medium">Controle de Estágio</p>
            <p className="text-sm text-blue-200 mb-8">
              Universidade Federal dos Vales<br />
              do Jequitinhonha e Mucuri
            </p>
          </div>

          {/* Features List */}
          <div className="space-y-4 w-full max-w-xs">
            <div className="flex items-center space-x-3">
              <Star className="w-4 h-4 text-blue-300" />
              <span className="text-sm">Interface Moderna</span>
            </div>
            <div className="flex items-center space-x-3">
              <Shield className="w-4 h-4 text-blue-300" />
              <span className="text-sm">Login Seguro</span>
            </div>
            <div className="flex items-center space-x-3">
              <BarChart3 className="w-4 h-4 text-blue-300" />
              <span className="text-sm">Relatórios Completos</span>
            </div>
            <div className="flex items-center space-x-3">
              <Settings className="w-4 h-4 text-blue-300" />
              <span className="text-sm">Controle Total</span>
            </div>
          </div>
        </div>

        {/* Right Panel - Login Form */}
        <div className="bg-gray-50 w-1/2 flex flex-col justify-center p-12 mt-10">
          <div className="max-w-sm mx-auto w-full">
            <h2 className="text-2xl font-bold text-gray-900 mb-2" data-testid="text-access-title">Acesso ao Sistema</h2>
            <p className="text-gray-600 mb-8">Entre com suas credenciais para continuar</p>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="username"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Usuário</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            placeholder="Digite seu usuário"
                            {...field}
                            data-testid="input-username"
                          />
                          <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm">
                            @ufvjm.edu.br
                          </span>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Senha</FormLabel>
                      <FormControl>
                        <Input
                          type="password"
                          placeholder="Digite sua senha (letras, números e símbolos)"
                          {...field}
                          data-testid="input-password"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button 
                  type="submit" 
                  className="w-full ufvjm-light-blue hover:bg-blue-700 text-white font-medium"
                  disabled={isLoading}
                  data-testid="button-login"
                >
                  <LogIn className="w-4 h-4 mr-2" />
                  {isLoading ? "Entrando..." : "Entrar no Sistema"}
                </Button>

                {/* Botão Primeiro Acesso */}
                <div className="mt-4">
                  <Button 
                    type="button"
                    variant="outline"
                    className="w-full border-blue-300 text-blue-600 hover:bg-blue-50 font-medium"
                    onClick={() => setLocation("/register")}
                    data-testid="button-first-access"
                  >
                    <UserPlus className="w-4 h-4 mr-2" />
                    Primeiro Acesso - Cadastrar Usuário
                  </Button>
                </div>
              </form>
            </Form>

            {/* Access Profiles */}
            <div className="mt-8">
              <h3 className="text-sm font-medium text-gray-700 mb-4 text-center">Perfis de Acesso</h3>
              <div className="flex justify-center space-x-8">
                <div className="text-center">
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-2 mx-auto">
                    <Shield className="w-5 h-5 text-green-600" />
                  </div>
                  <span className="text-xs text-gray-600">Administrador</span>
                </div>
                <div className="text-center">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-2 mx-auto">
                    <Settings className="w-5 h-5 text-blue-600" />
                  </div>
                  <span className="text-xs text-gray-600">Professor</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
