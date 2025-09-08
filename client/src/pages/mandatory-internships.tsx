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
import { StudentDropdown } from "@/components/StudentDropdown";
import type { UploadResult } from "@uppy/core";

export default function MandatoryInternships() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingInternship, setEditingInternship] = useState<MandatoryInternship | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [isManagementDialogOpen, setIsManagementDialogOpen] = useState(false);
  const [managingInternship, setManagingInternship] = useState<MandatoryInternship | null>(null);
  const [partialWorkload, setPartialWorkload] = useState(0);
  const [reports, setReports] = useState({
    r1: false, r2: false, r3: false, r4: false, r5: false,
    r6: false, r7: false, r8: false, r9: false, r10: false
  });

  const form = useForm<any>({
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

  // Create mutation
  const createMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/mandatory-internships", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/mandatory-internships"] });
      setIsDialogOpen(false);
      form.reset();
      toast({
        title: "Sucesso",
        description: "Estágio obrigatório criado com sucesso!",
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Erro ao criar estágio obrigatório",
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
      setEditingInternship(null);
      form.reset();
      toast({
        title: "Sucesso",
        description: "Estágio obrigatório atualizado com sucesso!",
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Erro ao atualizar estágio obrigatório",
        variant: "destructive",
      });
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/mandatory-internships/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/mandatory-internships"] });
      toast({
        title: "Sucesso",
        description: "Estágio obrigatório excluído com sucesso!",
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Erro ao excluir estágio obrigatório",
        variant: "destructive",
      });
    },
  });

  // Queries
  const { data: internships = [], isLoading: internshipsLoading } = useQuery<MandatoryInternship[]>({
    queryKey: ["/api/mandatory-internships"],
    enabled: !!user,
  });

  const { data: students = [], isLoading: studentsLoading } = useQuery<Student[]>({
    queryKey: ["/api/students"],
    enabled: !!user,
  });

  const { data: advisors = [], isLoading: advisorsLoading } = useQuery<Advisor[]>({
    queryKey: ["/api/advisors"],
    enabled: !!user,
  });

  const { data: companies = [], isLoading: companiesLoading } = useQuery<Company[]>({
    queryKey: ["/api/companies"],
    enabled: !!user,
  });

  const onSubmit = async (data: any) => {
    console.log('📝 Dados do formulário:', data);
    console.log('👤 Usuário atual:', user);
    
    // Validação básica dos campos obrigatórios
    if (!data.studentId || data.studentId.trim() === '') {
      toast({
        title: "Erro de validação",
        description: "Por favor, selecione um estudante.",
        variant: "destructive",
      });
      return;
    }

    if (!data.advisorId || data.advisorId.trim() === '') {
      toast({
        title: "Erro de validação", 
        description: "Por favor, selecione um orientador.",
        variant: "destructive",
      });
      return;
    }

    if (!data.workload || data.workload.trim() === '') {
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

      console.log('📤 Dados sendo enviados:', submitData);

      if (editingInternship) {
        await updateMutation.mutateAsync({
          id: editingInternship.id,
          data: submitData,
        });
        toast({
          title: "✅ Estágio atualizado",
          description: "Estágio obrigatório atualizado com sucesso!",
        });
      } else {
        await createMutation.mutateAsync(submitData);
        toast({
          title: "✅ Estágio criado",
          description: "Estágio obrigatório criado com sucesso!",
        });
      }
      
      setIsDialogOpen(false);
      form.reset({
        studentId: "",
        advisorId: "",
        companyId: "",
        supervisor: "",
        crc: "",
        workload: "390",
        startDate: "",
        endDate: "",
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
    } catch (error) {
      console.error("❌ Erro no submit:", error);
    }
  };

  const handleEdit = (internship: MandatoryInternship) => {
    setEditingInternship(internship);
    form.reset({
      studentId: internship.studentId || "",
      advisorId: internship.advisorId || "",
      companyId: internship.companyId || "",
      supervisor: internship.supervisor || "",
      crc: internship.crc || "",
      workload: internship.workload || "390",
      startDate: internship.startDate ? new Date(internship.startDate).toISOString().split('T')[0] : "",
      endDate: internship.endDate ? new Date(internship.endDate).toISOString().split('T')[0] : "",
      status: internship.status || "pending",
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
      isActive: internship.isActive !== false,
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
    setIsManagementDialogOpen(true);
    setPartialWorkload(0);
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
  };

  // Helper functions
  const getStudentName = (studentId: string) => {
    const student = students.find((s: Student) => s.id === studentId);
    return student ? student.name : "Estudante não encontrado";
  };

  const getAdvisorName = (advisorId: string) => {
    const advisor = advisors.find((a: Advisor) => a.id === advisorId);
    return advisor ? advisor.name : "Orientador não encontrado";
  };

  const getCompanyName = (companyId: string) => {
    const company = companies.find((c: Company) => c.id === companyId);
    return company ? company.name : "Empresa não encontrada";
  };

  // Filter internships
  const filteredInternships = internships.filter((internship: MandatoryInternship) => {
    const studentName = getStudentName(internship.studentId);
    const advisorName = getAdvisorName(internship.advisorId);
    const searchString = `${studentName} ${advisorName} ${internship.supervisor || ""} ${internship.crc || ""}`.toLowerCase();
    return searchString.includes(searchTerm.toLowerCase());
  });

  if (!user) return null;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="bg-blue-600 text-white p-6 rounded-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <GraduationCap className="h-8 w-8" />
            <div>
              <h1 className="text-2xl font-bold" data-testid="text-mandatory-internships-title">
                Estágios Obrigatórios
              </h1>
              <p className="text-blue-100">Gestão de estágios obrigatórios do curso</p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold">{filteredInternships.length}</div>
            <div className="text-blue-100">Total de Estágios</div>
          </div>
        </div>
      </div>

      {/* Search and Actions */}
      <div className="flex justify-between items-center">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Buscar por estudante, orientador ou empresa..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
            data-testid="input-search"
          />
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button 
              onClick={() => {
                setEditingInternship(null);
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
                      disabled={createMutation.isPending || updateMutation.isPending}
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
      </div>

      {/* Internships Table */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Estágios Obrigatórios</CardTitle>
          <CardDescription>
            Visualize e gerencie todos os estágios obrigatórios cadastrados
          </CardDescription>
        </CardHeader>
        <CardContent>
          {internshipsLoading ? (
            <div className="flex items-center justify-center p-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : filteredInternships.length === 0 ? (
            <div className="text-center p-8 text-gray-500">
              <GraduationCap className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>Nenhum estágio obrigatório encontrado</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Estudante</TableHead>
                  <TableHead>Orientador</TableHead>
                  <TableHead>Empresa</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Carga Horária</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredInternships.map((internship: MandatoryInternship) => (
                  <TableRow key={internship.id}>
                    <TableCell>
                      <div className="font-medium">{getStudentName(internship.studentId)}</div>
                    </TableCell>
                    <TableCell>{getAdvisorName(internship.advisorId)}</TableCell>
                    <TableCell>{internship.companyId ? getCompanyName(internship.companyId) : "-"}</TableCell>
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
                    <TableCell>{internship.workload || "390"} horas</TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
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