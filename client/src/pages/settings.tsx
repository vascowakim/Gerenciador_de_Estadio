import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Settings, Save, User, GraduationCap, Building } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { AuthService } from "@/lib/auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";

const settingsSchema = z.object({
  internshipCoordinatorName: z.string().min(3, "Nome do coordenador de estágio deve ter pelo menos 3 caracteres"),
  courseCoordinatorName: z.string().min(3, "Nome do coordenador do curso deve ter pelo menos 3 caracteres"),
});

type SettingsForm = z.infer<typeof settingsSchema>;

interface SystemSettings {
  id: string;
  internshipCoordinatorName: string;
  courseCoordinatorName: string;
  courseName: string;
  universityName: string;
  universityAbbreviation: string;
  updatedAt: string;
  updatedBy: string;
}

export default function SystemSettings() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const form = useForm<SettingsForm>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      internshipCoordinatorName: "",
      courseCoordinatorName: "",
    },
  });

  // Check authentication - only administrators can access
  const { data: user, isLoading: authLoading } = useQuery({
    queryKey: ["/api/auth/me"],
    queryFn: async () => {
      const user = await AuthService.getCurrentUser();
      if (!user || user.role !== "administrator") {
        setLocation("/");
        return null;
      }
      return user;
    },
  });

  // Fetch current settings
  const { data: settings, isLoading: settingsLoading } = useQuery<SystemSettings>({
    queryKey: ["/api/settings"],
    enabled: !!user,
  });

  // Update form when settings are loaded
  useEffect(() => {
    if (settings) {
      form.reset({
        internshipCoordinatorName: settings.internshipCoordinatorName,
        courseCoordinatorName: settings.courseCoordinatorName,
      });
    }
  }, [settings, form]);

  // Update settings mutation
  const updateMutation = useMutation({
    mutationFn: (data: SettingsForm) => 
      apiRequest("PUT", "/api/settings", data),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ["/api/settings"] });
      toast({
        title: "Sucesso",
        description: "Configurações atualizadas com sucesso!",
      });
      console.log("✅ Configurações salvas:", response.settings);
    },
    onError: (error: any) => {
      console.error("❌ Erro ao salvar configurações:", error);
      toast({
        title: "Erro",
        description: error?.message || "Erro ao atualizar configurações",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: SettingsForm) => {
    updateMutation.mutate(data);
  };

  if (authLoading || settingsLoading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <div className="text-center">
          <Settings className="h-12 w-12 mx-auto mb-4 animate-spin" />
          <p>Carregando configurações do sistema...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <div>Redirecionando...</div>;
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="bg-slate-900 text-white p-6 rounded-lg">
        <div className="flex items-center space-x-3">
          <Settings className="h-8 w-8" />
          <div>
            <h1 className="text-2xl font-bold" data-testid="text-settings-title">
              Configurações do Sistema
            </h1>
            <p className="text-slate-300">
              Gerencie as configurações institucionais do sistema EstagioPro
            </p>
          </div>
        </div>
      </div>

      {/* Settings Form */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Configuration Panel */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Coordenadores Institucionais
              </CardTitle>
              <CardDescription>
                Configure os nomes dos coordenadores que aparecerão nos relatórios e certificados
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="internshipCoordinatorName" className="text-sm font-medium">
                      Coordenador de Estágio
                    </Label>
                    <Input
                      id="internshipCoordinatorName"
                      placeholder="Ex: Prof. Dr. João Silva"
                      {...form.register("internshipCoordinatorName")}
                      data-testid="input-internship-coordinator"
                    />
                    {form.formState.errors.internshipCoordinatorName && (
                      <p className="text-sm text-red-500">
                        {form.formState.errors.internshipCoordinatorName.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="courseCoordinatorName" className="text-sm font-medium">
                      Coordenador do Curso
                    </Label>
                    <Input
                      id="courseCoordinatorName"
                      placeholder="Ex: Prof. Dr. Maria Santos"
                      {...form.register("courseCoordinatorName")}
                      data-testid="input-course-coordinator"
                    />
                    {form.formState.errors.courseCoordinatorName && (
                      <p className="text-sm text-red-500">
                        {form.formState.errors.courseCoordinatorName.message}
                      </p>
                    )}
                  </div>
                </div>

                <Separator />

                <div className="flex justify-end">
                  <Button 
                    type="submit" 
                    disabled={updateMutation.isPending}
                    className="flex items-center gap-2"
                    data-testid="button-save-settings"
                  >
                    <Save className="h-4 w-4" />
                    {updateMutation.isPending ? "Salvando..." : "Salvar Configurações"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Information Panel */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <GraduationCap className="h-5 w-5" />
                Informações Institucionais
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-sm font-medium text-gray-600">Curso</Label>
                <p className="font-medium">{settings?.courseName}</p>
              </div>
              
              <div>
                <Label className="text-sm font-medium text-gray-600">Universidade</Label>
                <p className="font-medium">{settings?.universityName}</p>
                <p className="text-sm text-gray-500">({settings?.universityAbbreviation})</p>
              </div>

              {settings?.updatedAt && (
                <div>
                  <Label className="text-sm font-medium text-gray-600">Última Atualização</Label>
                  <p className="text-sm text-gray-500">
                    {new Date(settings.updatedAt).toLocaleString('pt-BR')}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building className="h-5 w-5" />
                Uso nos Documentos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-gray-600 space-y-2">
                <p>
                  <strong>Coordenador de Estágio:</strong> Aparecerá em todos os certificados de estágio como responsável pela supervisão.
                </p>
                <p>
                  <strong>Coordenador do Curso:</strong> Será mencionado nos relatórios institucionais e documentos oficiais do curso.
                </p>
                <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                  <p className="text-xs text-blue-800">
                    💡 <strong>Dica:</strong> Mantenha os nomes atualizados para garantir a precisão dos documentos gerados.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}