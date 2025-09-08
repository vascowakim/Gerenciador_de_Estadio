import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Checkbox } from "@/components/ui/checkbox";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Pencil, Trash2, Search, Edit2, GraduationCap, Eye, Settings, Calendar, CheckCircle, XCircle, FileText } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertMandatoryInternshipSchema, type MandatoryInternship, type Student, type Advisor, type Company } from "@shared/schema";
import { AuthService } from "@/lib/auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useLocation, Link } from "wouter";
import { format } from "date-fns";
import { ObjectUploader } from "@/components/ObjectUploader";
import { StudentCombobox } from "@/components/StudentCombobox";
import type { UploadResult } from "@uppy/core";

export default function MandatoryInternships() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingInternship, setEditingInternship] = useState<MandatoryInternship | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedAdvisorId, setSelectedAdvisorId] = useState("");
  const [isManagementDialogOpen, setIsManagementDialogOpen] = useState(false);
  const [managingInternship, setManagingInternship] = useState<MandatoryInternship | null>(null);
  const [partialWorkload, setPartialWorkload] = useState(0);
  const [reports, setReports] = useState({
    r1: false, r2: false, r3: false, r4: false, r5: false,
    r6: false, r7: false, r8: false, r9: false, r10: false
  });
  const [newlyCreatedId, setNewlyCreatedId] = useState<string | null>(null);

  const form = useForm({
    resolver: zodResolver(insertMandatoryInternshipSchema),
    defaultValues: {
      studentId: "",
      advisorId: "",
      companyId: "",
      supervisor: "",
      crc: "",
      workload: "390",
      startDate: undefined,
      endDate: undefined,
      status: "pending",
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
    },
  });

  // Check authentication
  const { data: user, isLoading: authLoading } = useQuery({
    queryKey: ["/api/auth/me"],
    queryFn: async () => {
      const user = await AuthService.getCurrentUser();
      if (!user) {
        setLocation("/");
        return null;
      }
      return user;
    },
  });

  // Fetch mandatory internships with enhanced cache strategy
  const { data: mandatoryInternships = [], isLoading, refetch } = useQuery<MandatoryInternship[]>({
    queryKey: ["/api/mandatory-internships"],
    enabled: !!user,
    refetchOnMount: true,
  });

  // Fetch students, advisors, and companies for form
  const { data: students = [] } = useQuery<Student[]>({
    queryKey: ["/api/students"],
    enabled: !!user,
  });

  const { data: advisors = [] } = useQuery<Advisor[]>({
    queryKey: ["/api/advisors"],
    enabled: !!user,
  });

  const { data: companies = [] } = useQuery<Company[]>({
    queryKey: ["/api/companies"],
    enabled: !!user,
  });

  // Create mandatory internship mutation
  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", "/api/mandatory-internships", data);
      return response.json();
    },
    onSuccess: async (responseData) => {
      // Invalidar cache e forçar refetch imediato
      queryClient.removeQueries({ queryKey: ["/api/mandatory-internships"] });
      await queryClient.invalidateQueries({ queryKey: ["/api/mandatory-internships"] });
      await refetch();
      
      setIsDialogOpen(false);
      form.reset({
        studentId: "",
        advisorId: "",
        companyId: "",
        supervisor: "",
        crc: "",
        workload: "390",
        startDate: undefined,
        endDate: undefined,
        status: "pending",
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
      });
      
      if (responseData.data?.id) {
        setNewlyCreatedId(responseData.data.id);
        // Remove destaque após 3 segundos
        setTimeout(() => setNewlyCreatedId(null), 3000);
      }
      
      toast({
        title: "Sucesso",
        description: responseData.message || "Estágio obrigatório criado com sucesso!",
      });
    },
    onError: (error: Error) => {
      console.error("Erro ao criar estágio obrigatório:", error);
      // Extrair mensagem de erro detalhada do servidor
      let errorMessage = "Erro ao criar estágio obrigatório";
      try {
        const errorText = error.message;
        if (errorText.includes("409:")) {
          errorMessage = "O estudante já possui um estágio obrigatório ativo. Complete ou cancele o estágio atual primeiro.";
        } else if (errorText.includes("400:")) {
          errorMessage = "Dados inválidos. Verifique se todos os campos obrigatórios estão preenchidos corretamente.";
        } else if (errorText.includes("INVALID_REFERENCES")) {
          errorMessage = "Estudante, orientador ou empresa não encontrados.";
        }
      } catch (e) {
        // Use mensagem padrão se não conseguir parsear o erro
      }
      
      toast({
        title: "Erro",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  // Update mandatory internship mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const response = await apiRequest("PUT", `/api/mandatory-internships/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/mandatory-internships"] });
      setIsDialogOpen(false);
      setEditingInternship(null);
      form.reset();
      toast({
        title: "Sucesso",
        description: "Estágio obrigatório atualizado com sucesso!",
      });
    },
    onError: (error: Error) => {
      console.error("Erro ao atualizar estágio obrigatório:", error);
      toast({
        title: "Erro",
        description: "Erro ao atualizar estágio obrigatório",
        variant: "destructive",
      });
    },
  });

  // Delete mandatory internship mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest("DELETE", `/api/mandatory-internships/${id}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/mandatory-internships"] });
      toast({
        title: "Sucesso",
        description: "Estágio obrigatório excluído com sucesso!",
      });
    },
    onError: (error: Error) => {
      console.error("Erro ao excluir estágio obrigatório:", error);
      toast({
        title: "Erro",
        description: "Erro ao excluir estágio obrigatório",
        variant: "destructive",
      });
    },
  });

  // Update workload mutation
  const updateWorkloadMutation = useMutation({
    mutationFn: async ({ id, partialWorkload, notes }: { id: string; partialWorkload: number; notes?: string }) => {
      const response = await apiRequest("PUT", `/api/mandatory-internships/${id}/workload`, { partialWorkload, notes });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/mandatory-internships"] });
      setIsManagementDialogOpen(false);
      setManagingInternship(null);
      toast({
        title: "Sucesso",
        description: "Carga horária atualizada com sucesso!",
      });
    },
    onError: (error: Error) => {
      console.error("Erro ao atualizar carga horária:", error);
      toast({
        title: "Erro",
        description: "Erro ao atualizar carga horária",
        variant: "destructive",
      });
    },
  });

  // Upload report mutation
  const uploadReportMutation = useMutation({
    mutationFn: async ({ internshipId, reportNumber, fileUrl }: { internshipId: string; reportNumber: number; fileUrl: string }) => {
      const response = await apiRequest("POST", `/api/mandatory-internships/${internshipId}/reports/${reportNumber}/upload`, { fileUrl });
      return response.json();
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/mandatory-internships"] });
      toast({
        title: "Sucesso",
        description: `Relatório R${variables.reportNumber} enviado com sucesso!`,
      });
    },
    onError: (error: Error) => {
      console.error("Erro ao enviar relatório:", error);
      toast({
        title: "Erro",
        description: "Erro ao enviar relatório",
        variant: "destructive",
      });
    },
  });

  if (authLoading) {
    return <div>Carregando...</div>;
  }

  if (!user) {
    return <div>Redirecionando...</div>;
  }

  const onSubmit = (data: any) => {
    if (editingInternship) {
      updateMutation.mutate({ id: editingInternship.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleEdit = (internship: MandatoryInternship) => {
    setEditingInternship(internship);
    form.reset({
      studentId: internship.studentId,
      advisorId: internship.advisorId,
      companyId: internship.companyId || "",
      supervisor: internship.supervisor || "",
      crc: internship.crc || "",
      workload: internship.workload || "390",
      startDate: internship.startDate ? new Date(internship.startDate).toISOString().split('T')[0] : undefined,
      endDate: internship.endDate ? new Date(internship.endDate).toISOString().split('T')[0] : undefined,
      status: internship.status,
      r1: internship.r1,
      r2: internship.r2,
      r3: internship.r3,
      r4: internship.r4,
      r5: internship.r5,
      r6: internship.r6,
      r7: internship.r7,
      r8: internship.r8,
      r9: internship.r9,
      r10: internship.r10,
      isActive: internship.isActive,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm("Tem certeza que deseja excluir este estágio obrigatório?")) {
      deleteMutation.mutate(id);
    }
  };

  const handleManage = (internship: MandatoryInternship) => {
    setManagingInternship(internship);
    setPartialWorkload(internship.partialWorkload || 0);
    setReports({
      r1: internship.r1 || false,
      r2: internship.r2 || false,
      r3: internship.r3 || false,
      r4: internship.r4 || false,
      r5: internship.r5 || false,
      r6: internship.r6 || false,
      r7: internship.r7 || false,
      r8: internship.r8 || false,
      r9: internship.r9 || false,
      r10: internship.r10 || false,
    });
    setIsManagementDialogOpen(true);
  };

  const handleSaveWorkload = () => {
    if (managingInternship) {
      updateWorkloadMutation.mutate({ 
        id: managingInternship.id, 
        partialWorkload 
      });
    }
  };

  const handleSaveReports = () => {
    if (managingInternship) {
      updateMutation.mutate({
        id: managingInternship.id,
        data: reports
      });
    }
  };

  const handleReportChange = (reportNumber: number, checked: boolean) => {
    setReports(prev => ({
      ...prev,
      [`r${reportNumber}`]: checked
    }));
  };

  // Upload handlers
  const handleGetUploadParameters = async () => {
    const response = await apiRequest("POST", "/api/objects/upload");
    const data = await response.json();
    return {
      method: "PUT" as const,
      url: data.uploadURL,
    };
  };

  const handleUploadComplete = (reportNumber: number) => async (result: UploadResult<Record<string, unknown>, Record<string, unknown>>) => {
    if (result.successful && result.successful[0] && managingInternship) {
      const uploadURL = result.successful[0].uploadURL;
      if (uploadURL) {
        uploadReportMutation.mutate({
          internshipId: managingInternship.id,
          reportNumber,
          fileUrl: uploadURL
        });
      }
    }
  };

  const getStudentName = (studentId: string) => {
    const student = students?.find((s: Student) => s.id === studentId);
    return student ? student.name : "Estudante não encontrado";
  };

  const getAdvisorName = (advisorId: string) => {
    const advisor = advisors?.find((a: Advisor) => a.id === advisorId);
    return advisor ? advisor.name : "Orientador não encontrado";
  };

  const getCompanyName = (companyId: string | null) => {
    if (!companyId) return "-";
    const company = companies?.find((c: Company) => c.id === companyId);
    return company ? company.name : "Empresa não encontrada";
  };

  const filteredInternships = mandatoryInternships.filter((internship: MandatoryInternship) => {
    // Filtrar por termo de busca
    let matchesSearch = true;
    if (searchTerm) {
      const studentName = getStudentName(internship.studentId);
      const advisorName = getAdvisorName(internship.advisorId);
      const companyName = getCompanyName(internship.companyId);
      
      matchesSearch = studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
             advisorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
             companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
             (internship.supervisor && internship.supervisor.toLowerCase().includes(searchTerm.toLowerCase()));
    }
    
    // Filtrar por orientador selecionado
    let matchesAdvisor = true;
    if (selectedAdvisorId) {
      matchesAdvisor = internship.advisorId === selectedAdvisorId;
    }
    
    return matchesSearch && matchesAdvisor;
  });

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="bg-blue-600 text-white p-6 rounded-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <GraduationCap className="h-8 w-8" />
            <div>
              <h1 className="text-2xl font-bold" data-testid="text-mandatory-internships-title">Gestão de Estágio Obrigatório</h1>
              <p className="text-blue-100">Cadastro e gerenciamento de estágios obrigatórios</p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold">{filteredInternships.length}</div>
            <div className="text-blue-100">Total de Estágios</div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Calendar className="h-5 w-5 text-yellow-600" />
              <div>
                <p className="text-sm text-gray-600">Ativos</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {mandatoryInternships.filter((i: MandatoryInternship) => i.status === "pending").length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm text-gray-600">Aprovados</p>
                <p className="text-2xl font-bold text-green-600">
                  {mandatoryInternships.filter((i: MandatoryInternship) => i.status === "approved").length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <XCircle className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm text-gray-600">Concluídos</p>
                <p className="text-2xl font-bold text-blue-600">
                  {mandatoryInternships.filter((i: MandatoryInternship) => i.status === "completed").length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <FileText className="h-5 w-5 text-purple-600" />
              <div>
                <p className="text-sm text-gray-600">Relatórios Pendentes</p>
                <p className="text-2xl font-bold text-purple-600">
                  0
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Actions */}
      <div className="flex justify-between items-center gap-4">
        <div className="flex gap-4 flex-1">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Buscar por estudante, orientador ou empresa..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
              data-testid="input-search"
            />
          </div>
          
          <Select value={selectedAdvisorId} onValueChange={setSelectedAdvisorId}>
            <SelectTrigger className="w-64">
              <SelectValue placeholder="Filtrar por orientador" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Todos os orientadores</SelectItem>
              {advisors?.map((advisor: Advisor) => (
                <SelectItem key={advisor.id} value={advisor.id}>
                  {advisor.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button 
              onClick={() => {
                setEditingInternship(null);
                form.reset({
                  studentId: "",
                  advisorId: "",
                  companyId: "",
                  supervisor: "",
                  crc: "",
                  workload: "390",
                  startDate: undefined,
                  endDate: undefined,
                  status: "pending",
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
                });
              }}
              data-testid="button-add-internship"
            >
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
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="studentId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Estudante</FormLabel>
                        <FormControl>
                          <StudentCombobox
                            value={field.value}
                            onValueChange={field.onChange}
                            placeholder="Digite para buscar o estudante..."
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="advisorId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Orientador</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-advisor">
                              <SelectValue placeholder="Selecione o orientador" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {advisors?.map((advisor: Advisor) => (
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
                            {companies?.map((company: Company) => (
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
                          <Input placeholder="Nome do supervisor" {...field} data-testid="input-supervisor" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="crc"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>CRC</FormLabel>
                        <FormControl>
                          <Input placeholder="Número do CRC" {...field} data-testid="input-crc" />
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
                        <FormLabel>Carga Horária Total</FormLabel>
                        <FormControl>
                          <Input placeholder="Ex: 390" {...field} data-testid="input-workload" />
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
                            value={field.value ? new Date(field.value).toISOString().split('T')[0] : ''}
                            onChange={(e) => field.onChange(e.target.value ? new Date(e.target.value) : undefined)}
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
                            value={field.value ? new Date(field.value).toISOString().split('T')[0] : ''}
                            onChange={(e) => field.onChange(e.target.value ? new Date(e.target.value) : undefined)}
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
                        <FormLabel>Status</FormLabel>
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

                <div className="flex justify-end space-x-2">
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
                    disabled={createMutation.isPending || updateMutation.isPending}
                    data-testid="button-submit"
                  >
                    {editingInternship ? "Atualizar" : "Criar"}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>

        {/* Management Dialog */}
        <Dialog open={isManagementDialogOpen} onOpenChange={setIsManagementDialogOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Gestão do Estágio Obrigatório</DialogTitle>
              <DialogDescription>
                Visualize todos os dados do estágio e controle a carga horária
              </DialogDescription>
            </DialogHeader>
            {managingInternship && (
              <div className="space-y-6">
                {/* Dados do Estágio */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-lg mb-4">Dados do Estágio</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium text-gray-700">Estudante</Label>
                      <p className="mt-1 text-sm">{getStudentName(managingInternship.studentId)}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-700">Orientador</Label>
                      <p className="mt-1 text-sm">{getAdvisorName(managingInternship.advisorId)}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-700">Empresa</Label>
                      <p className="mt-1 text-sm">{getCompanyName(managingInternship.companyId)}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-700">Supervisor</Label>
                      <p className="mt-1 text-sm">{managingInternship.supervisor || "-"}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-700">CRC</Label>
                      <p className="mt-1 text-sm">{managingInternship.crc || "-"}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-700">Status</Label>
                      <p className="mt-1 text-sm">
                        {managingInternship.status === "approved" ? "Aprovado" :
                         managingInternship.status === "completed" ? "Concluído" :
                         managingInternship.status === "rejected" ? "Rejeitado" :
                         "Ativo"}
                      </p>
                    </div>
                    {managingInternship.startDate && (
                      <div>
                        <Label className="text-sm font-medium text-gray-700">Data de Início</Label>
                        <p className="mt-1 text-sm">{format(new Date(managingInternship.startDate), "dd/MM/yyyy")}</p>
                      </div>
                    )}
                    {managingInternship.endDate && (
                      <div>
                        <Label className="text-sm font-medium text-gray-700">Data de Término</Label>
                        <p className="mt-1 text-sm">{format(new Date(managingInternship.endDate), "dd/MM/yyyy")}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Controle de Carga Horária */}
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-lg mb-4">Controle de Carga Horária</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label className="text-sm font-medium text-gray-700">CH Total</Label>
                      <p className="mt-1 text-lg font-semibold text-blue-600">{managingInternship.workload || "390"} horas</p>
                    </div>
                    <div>
                      <Label htmlFor="partialWorkload" className="text-sm font-medium text-gray-700">CH Parcial</Label>
                      <Input
                        id="partialWorkload"
                        type="number"
                        value={partialWorkload}
                        onChange={(e) => setPartialWorkload(Number(e.target.value))}
                        className="mt-1"
                        min="0"
                        max={Number(managingInternship.workload) || 390}
                        data-testid="input-partial-workload"
                      />
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-700">CH Restante</Label>
                      <p className="mt-1 text-lg font-semibold text-orange-600">
                        {(Number(managingInternship.workload) || 390) - partialWorkload} horas
                      </p>
                    </div>
                  </div>
                </div>

                {/* Controle de Relatórios */}
                <div className="bg-green-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-lg mb-4">Controle de Relatórios</h3>
                  <div className="grid grid-cols-5 gap-4">
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => {
                      const reportKey = `r${num}` as keyof typeof reports;
                      const isChecked = reports[reportKey];
                      
                      return (
                        <div key={num} className="flex flex-col items-center space-y-2">
                          <Label className="text-sm font-medium text-gray-700">R{num}</Label>
                          <div className="flex flex-col items-center space-y-2">
                            <div className="flex items-center justify-center w-12 h-12 border-2 rounded-lg transition-colors">
                              {isChecked ? (
                                <Checkbox
                                  checked={true}
                                  onCheckedChange={(checked) => handleReportChange(num, checked as boolean)}
                                  className="w-6 h-6"
                                  data-testid={`checkbox-report-${num}`}
                                />
                              ) : (
                                <div 
                                  className="w-8 h-8 border-2 border-red-300 rounded flex items-center justify-center cursor-pointer hover:border-red-400 transition-colors"
                                  onClick={() => handleReportChange(num, true)}
                                  data-testid={`missing-report-${num}`}
                                >
                                  <span className="text-red-500 font-bold text-lg">✗</span>
                                </div>
                              )}
                            </div>
                            <ObjectUploader
                              maxNumberOfFiles={1}
                              maxFileSize={10485760}
                              onGetUploadParameters={handleGetUploadParameters}
                              onComplete={handleUploadComplete(num)}
                              buttonClassName="h-8 px-2 text-xs"
                              allowedFileTypes={['.pdf', '.doc', '.docx']}
                            >
                              📁 Upload
                            </ObjectUploader>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <div className="mt-4 flex justify-end">
                    <Button 
                      onClick={handleSaveReports}
                      disabled={updateMutation.isPending}
                      variant="outline"
                      data-testid="button-save-reports"
                    >
                      {updateMutation.isPending ? "Salvando..." : "Salvar Relatórios"}
                    </Button>
                  </div>
                </div>

                {/* Ações */}
                <div className="flex justify-end space-x-2 pt-4">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setIsManagementDialogOpen(false)}
                  >
                    Cancelar
                  </Button>
                  <Button 
                    onClick={handleSaveWorkload}
                    disabled={updateWorkloadMutation.isPending}
                    data-testid="button-save-workload"
                  >
                    {updateWorkloadMutation.isPending ? "Salvando..." : "Salvar Carga Horária"}
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle>Estágios Obrigatórios</CardTitle>
          <CardDescription>
            Lista de todos os estágios obrigatórios cadastrados no sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">Carregando estágios obrigatórios...</div>
          ) : filteredInternships.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              {mandatoryInternships.length === 0 
                ? "Nenhum estágio obrigatório cadastrado." 
                : "Nenhum estágio obrigatório encontrado para os critérios de busca."}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Estudante</TableHead>
                  <TableHead>Orientador</TableHead>
                  <TableHead>Empresa</TableHead>
                  <TableHead>Supervisor</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredInternships.map((internship: MandatoryInternship) => (
                  <TableRow 
                    key={internship.id}
                    className={newlyCreatedId === internship.id ? "bg-green-50 border-l-4 border-green-400" : ""}
                  >
                    <TableCell>{getStudentName(internship.studentId)}</TableCell>
                    <TableCell>{getAdvisorName(internship.advisorId)}</TableCell>
                    <TableCell>{getCompanyName(internship.companyId)}</TableCell>
                    <TableCell>{internship.supervisor || "-"}</TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        internship.status === "approved" ? "bg-green-100 text-green-800" :
                        internship.status === "completed" ? "bg-blue-100 text-blue-800" :
                        internship.status === "rejected" ? "bg-red-100 text-red-800" :
                        "bg-yellow-100 text-yellow-800"
                      }`}>
                        {internship.status === "approved" ? "Aprovado" :
                         internship.status === "completed" ? "Concluído" :
                         internship.status === "rejected" ? "Rejeitado" :
                         "Ativo"}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Link href={`/mandatory-internship-control/${internship.id}`}>
                          <Button
                            variant="outline"
                            size="sm"
                            data-testid={`button-view-${internship.id}`}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </Link>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleManage(internship)}
                          data-testid={`button-manage-${internship.id}`}
                        >
                          <Settings className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(internship)}
                          data-testid={`button-edit-${internship.id}`}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(internship.id)}
                          className="text-red-600 hover:text-red-700"
                          data-testid={`button-delete-${internship.id}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}