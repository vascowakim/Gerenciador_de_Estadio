import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Settings, Save, RotateCcw } from "lucide-react";

const settingsSchema = z.object({
  courseCoordinatorName: z.string().min(1, "Nome do coordenador do curso é obrigatório"),
  internshipCoordinatorName: z.string().min(1, "Nome do coordenador de estágio é obrigatório"),
  institutionName: z.string().min(1, "Nome da instituição é obrigatório"),
  departmentName: z.string().min(1, "Nome do departamento é obrigatório"),
});

type SettingsFormData = z.infer<typeof settingsSchema>;

export default function SettingsPage() {
  const { toast } = useToast();

  const form = useForm<SettingsFormData>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      courseCoordinatorName: "",
      internshipCoordinatorName: "",
      institutionName: "",
      departmentName: "",
    },
  });

  // Buscar configurações existentes
  const { data: settings, isLoading } = useQuery({
    queryKey: ['/api/settings'],
  });

  // Carregar dados no formulário quando as configurações chegarem
  useEffect(() => {
    if (settings && settings.length > 0) {
      const settingsMap: Record<string, string> = {};
      settings.forEach((setting: any) => {
        settingsMap[setting.key] = setting.value;
      });

      form.reset({
        courseCoordinatorName: settingsMap['course_coordinator_name'] || "",
        internshipCoordinatorName: settingsMap['internship_coordinator_name'] || "",
        institutionName: settingsMap['institution_name'] || "",
        departmentName: settingsMap['department_name'] || "",
      });
    }
  }, [settings, form]);

  const updateMutation = useMutation({
    mutationFn: async (data: SettingsFormData) => {
      // Salvar cada configuração individualmente
      const promises = [
        apiRequest('/api/settings', 'POST', {
          key: 'course_coordinator_name',
          value: data.courseCoordinatorName,
          description: 'Nome do coordenador do curso para relatórios e certificados'
        }),
        apiRequest('/api/settings', 'POST', {
          key: 'internship_coordinator_name',
          value: data.internshipCoordinatorName,
          description: 'Nome do coordenador de estágio para relatórios e certificados'
        }),
        apiRequest('/api/settings', 'POST', {
          key: 'institution_name',
          value: data.institutionName,
          description: 'Nome oficial da instituição'
        }),
        apiRequest('/api/settings', 'POST', {
          key: 'department_name',
          value: data.departmentName,
          description: 'Nome do departamento'
        }),
      ];

      await Promise.all(promises);
    },
    onSuccess: () => {
      toast({
        title: "Configurações salvas",
        description: "As configurações do sistema foram atualizadas com sucesso.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/settings'] });
    },
    onError: (error: any) => {
      console.error("Erro ao salvar configurações:", error);
      toast({
        title: "Erro",
        description: "Ocorreu um erro ao salvar as configurações. Tente novamente.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: SettingsFormData) => {
    updateMutation.mutate(data);
  };

  const resetForm = () => {
    form.reset({
      courseCoordinatorName: "",
      internshipCoordinatorName: "",
      institutionName: "",
      departmentName: "",
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Settings className="h-8 w-8 text-blue-600" />
          <div>
            <h1 className="text-3xl font-bold">Configurações do Sistema</h1>
            <p className="text-gray-600">Carregando configurações...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="flex items-center gap-3">
        <Settings className="h-8 w-8 text-blue-600" />
        <div>
          <h1 className="text-3xl font-bold">Configurações do Sistema</h1>
          <p className="text-gray-600">Configure informações institucionais para relatórios e certificados</p>
        </div>
      </div>

      {/* Formulário de Configurações */}
      <Card>
        <CardHeader>
          <CardTitle>Informações Institucionais</CardTitle>
          <CardDescription>
            Configure os nomes que aparecerão nos relatórios e certificados emitidos pelo sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="institutionName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome da Instituição</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Ex: Universidade Federal dos Vales do Jequitinhonha e Mucuri" 
                          {...field} 
                          data-testid="input-institution-name"
                        />
                      </FormControl>
                      <FormDescription>
                        Nome oficial da instituição de ensino
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="departmentName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome do Departamento</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Ex: Instituto de Ciências Exatas e Tecnológicas" 
                          {...field} 
                          data-testid="input-department-name"
                        />
                      </FormControl>
                      <FormDescription>
                        Nome do departamento responsável pelos estágios
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="courseCoordinatorName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome do Coordenador do Curso</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Prof. Dr. João Silva" 
                          {...field} 
                          data-testid="input-course-coordinator"
                        />
                      </FormControl>
                      <FormDescription>
                        Nome que aparecerá nos certificados como coordenador do curso
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="internshipCoordinatorName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome do Coordenador de Estágio</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Prof. Dr. Maria Santos" 
                          {...field} 
                          data-testid="input-internship-coordinator"
                        />
                      </FormControl>
                      <FormDescription>
                        Nome que aparecerá nos certificados como coordenador de estágio
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Botões de ação */}
              <div className="flex gap-4 pt-4">
                <Button 
                  type="submit" 
                  disabled={updateMutation.isPending}
                  data-testid="button-save-settings"
                >
                  <Save className="h-4 w-4 mr-2" />
                  {updateMutation.isPending ? "Salvando..." : "Salvar Configurações"}
                </Button>
                
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={resetForm}
                  data-testid="button-reset-form"
                >
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Limpar Formulário
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}