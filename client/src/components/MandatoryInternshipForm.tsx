import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { StudentDropdown } from "@/components/StudentDropdown";
import { useToast } from "@/hooks/use-toast";
import { Plus } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import type { MandatoryInternship, Student, Advisor, Company } from "@shared/schema";

interface MandatoryInternshipFormProps {
  editingInternship?: MandatoryInternship | null;
  onSuccess?: () => void;
}

export function MandatoryInternshipForm({ editingInternship, onSuccess }: MandatoryInternshipFormProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Form setup
  const form = useForm({
    mode: "onChange",
    defaultValues: {
      studentId: "",
      advisorId: "",
      companyId: "",
      supervisor: "",
      crc: "",
      workload: "390",
      startDate: "",
      endDate: "",
      status: "pending",
      isActive: true,
    },
  });

  // Data queries
  const { data: students = [], isLoading: studentsLoading, isError: studentsError } = useQuery<Student[]>({
    queryKey: ["/api/students"],
    staleTime: 5 * 60 * 1000,
  });

  const { data: advisors = [], isLoading: advisorsLoading, isError: advisorsError } = useQuery<Advisor[]>({
    queryKey: ["/api/advisors"], 
    staleTime: 5 * 60 * 1000,
  });

  const { data: companies = [], isLoading: companiesLoading, isError: companiesError } = useQuery<Company[]>({
    queryKey: ["/api/companies"],
    staleTime: 5 * 60 * 1000,
  });

  // Authentication check
  const { data: user, isLoading: authLoading, isError: authError } = useQuery({
    queryKey: ["/api/auth/me"],
    staleTime: 2 * 60 * 1000,
  });

  // Create mutation
  const createMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/mandatory-internships", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/mandatory-internships"] });
      setIsDialogOpen(false);
      form.reset();
      toast({
        title: "✅ Sucesso",
        description: "Estágio obrigatório criado com sucesso!",
      });
      onSuccess?.();
    },
    onError: (error: any) => {
      console.error("❌ Erro ao criar estágio:", error);
      toast({
        title: "Erro",
        description: "Erro ao criar estágio obrigatório. Tente novamente.",
        variant: "destructive",
      });
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => 
      apiRequest("PUT", `/api/mandatory-internships/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/mandatory-internships"] });
      setIsDialogOpen(false);
      form.reset();
      toast({
        title: "✅ Sucesso",
        description: "Estágio obrigatório atualizado com sucesso!",
      });
      onSuccess?.();
    },
    onError: (error: any) => {
      console.error("❌ Erro ao atualizar estágio:", error);
      toast({
        title: "Erro",
        description: "Erro ao atualizar estágio obrigatório. Tente novamente.",
        variant: "destructive",
      });
    },
  });

  // Check if all data is ready
  useEffect(() => {
    const dataLoading = studentsLoading || advisorsLoading || companiesLoading || authLoading;
    const dataError = studentsError || advisorsError || companiesError || authError;
    
    if (!dataLoading && !dataError && user && students && advisors && companies) {
      setIsReady(true);
    } else {
      setIsReady(false);
    }
  }, [studentsLoading, advisorsLoading, companiesLoading, authLoading, studentsError, advisorsError, companiesError, authError, user, students, advisors, companies]);

  // Setup form when editing
  useEffect(() => {
    if (editingInternship && isReady) {
      form.reset({
        studentId: editingInternship.studentId || "",
        advisorId: editingInternship.advisorId || "",
        companyId: editingInternship.companyId || "",
        supervisor: editingInternship.supervisor || "",
        crc: editingInternship.crc || "",
        workload: editingInternship.workload || "390",
        startDate: editingInternship.startDate ? 
          new Date(editingInternship.startDate).toISOString().split('T')[0] : "",
        endDate: editingInternship.endDate ? 
          new Date(editingInternship.endDate).toISOString().split('T')[0] : "",
        status: editingInternship.status || "pending",
        isActive: editingInternship.isActive !== false,
      });
    }
  }, [editingInternship, isReady, form]);

  // Form submission
  const onSubmit = async (data: any) => {
    if (!isReady) {
      toast({
        title: "Erro",
        description: "Aguarde o carregamento dos dados.",
        variant: "destructive",
      });
      return;
    }

    console.log("📝 Dados do formulário:", data);

    // Validações
    if (!data.studentId?.trim()) {
      toast({
        title: "Erro de validação",
        description: "Por favor, selecione um estudante.",
        variant: "destructive",
      });
      return;
    }

    if (!data.advisorId?.trim()) {
      toast({
        title: "Erro de validação",
        description: "Por favor, selecione um orientador.",
        variant: "destructive",
      });
      return;
    }

    if (!data.workload?.trim()) {
      toast({
        title: "Erro de validação",
        description: "Por favor, informe a carga horária total.",
        variant: "destructive",
      });
      return;
    }

    try {
      const submitData = {
        studentId: data.studentId,
        advisorId: data.advisorId,
        companyId: data.companyId || null,
        supervisor: data.supervisor || null,
        crc: data.crc || null,
        workload: data.workload,
        startDate: data.startDate || null,
        endDate: data.endDate || null,
        status: data.status || "pending",
        r1: false,
        r2: false,
        r3: false,
        r4: false,
        r5: false,
        r6: false,
        r7: false,
        r8: false,
        r9: false,
        r10: false,
        isActive: true,
      };

      console.log("📤 Dados sendo enviados:", submitData);

      if (editingInternship) {
        await updateMutation.mutateAsync({
          id: editingInternship.id,
          data: submitData,
        });
      } else {
        await createMutation.mutateAsync(submitData);
      }
    } catch (error) {
      console.error("❌ Erro no submit:", error);
    }
  };

  const handleOpenDialog = () => {
    if (!isReady) {
      toast({
        title: "Carregando",
        description: "Aguarde o carregamento dos dados necessários.",
        variant: "default",
      });
      return;
    }

    if (!editingInternship) {
      form.reset({
        studentId: "",
        advisorId: (user?.role === "professor" && user?.id) ? user.id : "",
        companyId: "",
        supervisor: "",
        crc: "",
        workload: "390",
        startDate: "",
        endDate: "",
        status: "pending",
        isActive: true,
      });
    }
    setIsDialogOpen(true);
  };

  // Loading state
  if (!isReady) {
    return (
      <Button disabled className="opacity-50">
        <Plus className="h-4 w-4 mr-2" />
        Carregando...
      </Button>
    );
  }

  // Error state
  if (studentsError || advisorsError || companiesError || authError) {
    return (
      <Button 
        variant="destructive" 
        onClick={() => window.location.reload()}
      >
        <Plus className="h-4 w-4 mr-2" />
        Erro - Recarregar
      </Button>
    );
  }

  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogTrigger asChild>
        <Button onClick={handleOpenDialog} data-testid="button-add-internship">
          <Plus className="h-4 w-4 mr-2" />
          Novo Estágio Obrigatório
        </Button>
      </DialogTrigger>
      
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {editingInternship ? "Editar Estágio Obrigatório" : "Novo Estágio Obrigatório"}
          </DialogTitle>
          <DialogDescription>
            Preencha os dados do estágio obrigatório
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Seção Principal */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Informações Básicas</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="studentId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Estudante *</FormLabel>
                      <StudentDropdown
                        value={field.value}
                        onChange={field.onChange}
                        placeholder="Selecione um estudante..."
                      />
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="advisorId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Orientador *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-advisor">
                            <SelectValue placeholder="Selecione o orientador" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {advisors.map((advisor: Advisor) => (
                            <SelectItem key={advisor.id} value={advisor.id}>
                              {advisor.name} - {advisor.department}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="companyId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Empresa</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value || ""}>
                        <FormControl>
                          <SelectTrigger data-testid="select-company">
                            <SelectValue placeholder="Selecione a empresa" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {companies.map((company: Company) => (
                            <SelectItem key={company.id} value={company.id}>
                              {company.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="supervisor"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Supervisor</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Nome do supervisor na empresa" 
                          {...field} 
                          data-testid="input-supervisor" 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Seção de Detalhes */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Detalhes do Estágio</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="crc"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>CRC</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Número do CRC (se aplicável)" 
                          {...field} 
                          data-testid="input-crc" 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="workload"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Carga Horária Total *</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Ex: 390 horas" 
                          {...field} 
                          data-testid="input-workload" 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="startDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Data de Início</FormLabel>
                      <FormControl>
                        <Input 
                          type="date" 
                          {...field}
                          data-testid="input-start-date" 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="endDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Data de Término</FormLabel>
                      <FormControl>
                        <Input 
                          type="date" 
                          {...field}
                          data-testid="input-end-date" 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-status">
                            <SelectValue placeholder="Selecione o status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="pending">Ativo</SelectItem>
                          <SelectItem value="approved">Aprovado</SelectItem>
                          <SelectItem value="completed">Concluído</SelectItem>
                          <SelectItem value="rejected">Rejeitado</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <div className="border-t pt-4">
              <div className="flex justify-end space-x-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                  data-testid="button-cancel"
                >
                  Cancelar
                </Button>
                <Button 
                  type="submit" 
                  disabled={createMutation.isPending || updateMutation.isPending || !isReady}
                  data-testid="button-submit"
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {createMutation.isPending || updateMutation.isPending ? (
                    <>
                      <span className="animate-spin mr-2">⏳</span>
                      Salvando...
                    </>
                  ) : (
                    editingInternship ? "Atualizar Estágio" : "Criar Estágio"
                  )}
                </Button>
              </div>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}