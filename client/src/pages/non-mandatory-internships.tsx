import { useState } from "react";
import { Plus, Edit2, Trash2, Search, CheckCircle, XCircle, Calendar, FileText, Users, Building } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertNonMandatoryInternshipSchema, type NonMandatoryInternship, type Student, type Advisor, type Company } from "@shared/schema";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";

const formSchema = insertNonMandatoryInternshipSchema.extend({
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

export default function NonMandatoryInternshipsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingInternship, setEditingInternship] = useState<NonMandatoryInternship | null>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      studentId: "",
      advisorId: "",
      companyId: "",
      supervisor: "",
      crc: "",
      status: "pending",
      startDate: undefined,
      endDate: undefined,
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

  // Queries
  const { data: internships = [], isLoading: internshipsLoading } = useQuery<NonMandatoryInternship[]>({
    queryKey: ["/api/non-mandatory-internships"],
  });

  const { data: students = [] } = useQuery<Student[]>({
    queryKey: ["/api/students"],
  });

  const { data: advisors = [] } = useQuery<Advisor[]>({
    queryKey: ["/api/advisors"],
  });

  const { data: companies = [] } = useQuery<Company[]>({
    queryKey: ["/api/companies"],
  });

  const { data: currentUser } = useQuery<{ id: string; role: string }>({
    queryKey: ["/api/auth/me"],
  });

  // Mutations
  const createMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const payload = {
        ...data,
        startDate: data.startDate ? new Date(data.startDate) : null,
        endDate: data.endDate ? new Date(data.endDate) : null,
      };
      const response = await fetch("/api/non-mandatory-internships", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!response.ok) throw new Error("Falha ao criar estágio");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/non-mandatory-internships"] });
      setIsDialogOpen(false);
      form.reset();
      toast({ title: "Estágio não obrigatório criado com sucesso!" });
    },
    onError: (error) => {
      console.error("Erro ao criar estágio não obrigatório:", error);
      toast({ title: "Erro ao criar estágio não obrigatório", variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: FormData }) => {
      const payload = {
        ...data,
        startDate: data.startDate ? new Date(data.startDate) : null,
        endDate: data.endDate ? new Date(data.endDate) : null,
      };
      const response = await fetch(`/api/non-mandatory-internships/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!response.ok) throw new Error("Falha ao atualizar estágio");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/non-mandatory-internships"] });
      setIsDialogOpen(false);
      setEditingInternship(null);
      form.reset();
      toast({ title: "Estágio não obrigatório atualizado com sucesso!" });
    },
    onError: (error) => {
      console.error("Erro ao atualizar estágio não obrigatório:", error);
      toast({ title: "Erro ao atualizar estágio não obrigatório", variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/non-mandatory-internships/${id}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Falha ao excluir estágio");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/non-mandatory-internships"] });
      toast({ title: "Estágio não obrigatório excluído com sucesso!" });
    },
    onError: (error) => {
      console.error("Erro ao excluir estágio não obrigatório:", error);
      toast({ title: "Erro ao excluir estágio não obrigatório", variant: "destructive" });
    },
  });

  const onSubmit = (data: FormData) => {
    if (editingInternship) {
      updateMutation.mutate({ id: editingInternship.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleEdit = (internship: NonMandatoryInternship) => {
    setEditingInternship(internship);
    
    const student = students.find((s: Student) => s.id === internship.studentId);
    const advisor = advisors.find((a: Advisor) => a.id === internship.advisorId);
    const company = companies.find((c: Company) => c.id === internship.companyId);

    form.reset({
      studentId: internship.studentId,
      advisorId: internship.advisorId,
      companyId: internship.companyId || "",
      supervisor: internship.supervisor || "",
      crc: internship.crc || "",
      workload: internship.workload || "",
      startDate: internship.startDate ? new Date(internship.startDate).toISOString().split('T')[0] : "",
      endDate: internship.endDate ? new Date(internship.endDate).toISOString().split('T')[0] : "",
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
    if (window.confirm("Tem certeza que deseja excluir este estágio não obrigatório?")) {
      deleteMutation.mutate(id);
    }
  };

  const handleOpenDialog = () => {
    setEditingInternship(null);
    form.reset();
    
    // Se for professor, preencher automaticamente o orientador
    if (currentUser?.role === "professor") {
      form.setValue("advisorId", currentUser.id);
    }
    
    setIsDialogOpen(true);
  };

  const filteredInternships = internships.filter((internship: NonMandatoryInternship) => {
    const student = students.find((s: Student) => s.id === internship.studentId);
    const advisor = advisors.find((a: Advisor) => a.id === internship.advisorId);
    const company = companies.find((c: Company) => c.id === internship.companyId);
    
    const searchLower = searchTerm.toLowerCase();
    return (
      student?.name.toLowerCase().includes(searchLower) ||
      student?.registrationNumber.toLowerCase().includes(searchLower) ||
      advisor?.name.toLowerCase().includes(searchLower) ||
      company?.name.toLowerCase().includes(searchLower) ||
      internship.supervisor?.toLowerCase().includes(searchLower) ||
      internship.status.toLowerCase().includes(searchLower)
    );
  });

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { label: "Pendente", variant: "secondary" as const },
      approved: { label: "Aprovado", variant: "default" as const },
      rejected: { label: "Rejeitado", variant: "destructive" as const },
      completed: { label: "Concluído", variant: "default" as const },
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getCompletedReportsCount = (internship: NonMandatoryInternship) => {
    const reports = [internship.r1, internship.r2, internship.r3, internship.r4, internship.r5, 
                   internship.r6, internship.r7, internship.r8, internship.r9, internship.r10];
    return reports.filter(Boolean).length;
  };

  if (internshipsLoading) {
    return (
      <div className="p-6">
        <div className="text-center">Carregando estágios não obrigatórios...</div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="bg-blue-600 text-white p-6 rounded-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <FileText className="h-8 w-8" />
            <div>
              <h1 className="text-2xl font-bold">Estágios Não Obrigatórios</h1>
              <p className="text-blue-100">Gerenciar estágios não obrigatórios e acompanhamento de relatórios</p>
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
                <p className="text-sm text-gray-600">Pendentes</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {internships.filter((i: NonMandatoryInternship) => i.status === "pending").length}
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
                  {internships.filter((i: NonMandatoryInternship) => i.status === "approved").length}
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
                  {internships.filter((i: NonMandatoryInternship) => i.status === "completed").length}
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
                  {internships.reduce((acc: number, i: NonMandatoryInternship) => acc + (10 - getCompletedReportsCount(i)), 0)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Actions */}
      <div className="flex justify-between items-center">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Buscar por aluno, orientador, empresa..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
            data-testid="input-search-internships"
          />
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={handleOpenDialog} data-testid="button-add-internship">
              <Plus className="h-4 w-4 mr-2" />
              Novo Estágio Não Obrigatório
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingInternship ? "Editar Estágio Não Obrigatório" : "Novo Estágio Não Obrigatório"}
              </DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="studentId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Aluno</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione um aluno" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {students.map((student: Student) => (
                              <SelectItem key={student.id} value={student.id}>
                                {student.name} - {student.registrationNumber}
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
                    name="advisorId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Orientador</FormLabel>
                        <Select 
                          onValueChange={field.onChange} 
                          value={field.value}
                          disabled={currentUser?.role === "professor"}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione um orientador" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {advisors.map((advisor: Advisor) => (
                              <SelectItem key={advisor.id} value={advisor.id}>
                                {advisor.name}
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
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione uma empresa" />
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
                          <Input placeholder="Nome do supervisor" {...field} value={field.value || ""} />
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
                          <Input placeholder="Número do CRC" {...field} value={field.value || ""} />
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
                          <Input type="date" {...field} />
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
                          <Input type="date" {...field} />
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
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione o status" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="pending">Pendente</SelectItem>
                            <SelectItem value="approved">Aprovado</SelectItem>
                            <SelectItem value="rejected">Rejeitado</SelectItem>
                            <SelectItem value="completed">Concluído</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Controle de Relatórios */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Controle de Relatórios</h3>
                  <div className="grid grid-cols-5 gap-4">
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                      <FormField
                        key={num}
                        control={form.control}
                        name={`r${num}` as keyof FormData}
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                            <FormControl>
                              <Checkbox
                                checked={field.value as boolean}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                            <FormLabel className="text-sm font-normal">
                              R{num}
                            </FormLabel>
                          </FormItem>
                        )}
                      />
                    ))}
                  </div>
                </div>

                <div className="flex justify-end space-x-2 pt-4">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button 
                    type="submit"
                    disabled={createMutation.isPending || updateMutation.isPending}
                    data-testid="button-submit-internship"
                  >
                    {createMutation.isPending || updateMutation.isPending ? "Salvando..." : 
                     editingInternship ? "Atualizar" : "Criar"}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Internships Grid */}
      <div className="grid grid-cols-1 gap-4">
        {filteredInternships.map((internship: NonMandatoryInternship) => {
          const student = students.find((s: Student) => s.id === internship.studentId);
          const advisor = advisors.find((a: Advisor) => a.id === internship.advisorId);
          const company = companies.find((c: Company) => c.id === internship.companyId);
          const completedReports = getCompletedReportsCount(internship);
          
          return (
            <Card key={internship.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <Users className="h-4 w-4 text-gray-500" />
                          <span className="font-semibold">Aluno</span>
                        </div>
                        <p className="text-sm">{student?.name || "N/A"}</p>
                        <p className="text-xs text-gray-500">{student?.registrationNumber || "N/A"}</p>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <Users className="h-4 w-4 text-gray-500" />
                          <span className="font-semibold">Orientador</span>
                        </div>
                        <p className="text-sm">{advisor?.name || "N/A"}</p>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <Building className="h-4 w-4 text-gray-500" />
                          <span className="font-semibold">Empresa</span>
                        </div>
                        <p className="text-sm">{company?.name || "N/A"}</p>
                        {internship.supervisor && (
                          <p className="text-xs text-gray-500">Supervisor: {internship.supervisor}</p>
                        )}
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <FileText className="h-4 w-4 text-gray-500" />
                          <span className="font-semibold">Progresso</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          {getStatusBadge(internship.status)}
                        </div>
                        <p className="text-xs text-gray-500">
                          Relatórios: {completedReports}/10
                        </p>
                        
                        {/* Indicadores de relatórios */}
                        <div className="flex space-x-1 mt-2">
                          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => {
                            const isCompleted = internship[`r${num}` as keyof NonMandatoryInternship] as boolean;
                            return (
                              <div
                                key={num}
                                className={`w-3 h-3 rounded-full text-xs flex items-center justify-center border ${
                                  isCompleted 
                                    ? 'bg-green-500 border-green-500 text-white' 
                                    : 'bg-gray-200 border-gray-300 text-gray-600'
                                }`}
                                title={`Relatório R${num} ${isCompleted ? 'entregue' : 'pendente'}`}
                              >
                                {num}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                    
                    {/* Informações adicionais */}
                    <div className="mt-4 pt-4 border-t flex flex-wrap gap-4 text-sm text-gray-600">
                      {internship.crc && (
                        <span>CRC: {internship.crc}</span>
                      )}
                      {internship.workload && (
                        <span>Carga: {internship.workload}</span>
                      )}
                      {internship.startDate && (
                        <span>Início: {new Date(internship.startDate).toLocaleDateString()}</span>
                      )}
                      {internship.endDate && (
                        <span>Término: {new Date(internship.endDate).toLocaleDateString()}</span>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex space-x-2 ml-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(internship)}
                      data-testid={`button-edit-internship-${internship.id}`}
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    {currentUser?.role === "administrator" && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(internship.id)}
                        className="text-red-600 hover:text-red-700"
                        data-testid={`button-delete-internship-${internship.id}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {filteredInternships.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">
              {searchTerm ? "Nenhum estágio não obrigatório encontrado com os critérios de busca." : "Nenhum estágio não obrigatório cadastrado ainda."}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}