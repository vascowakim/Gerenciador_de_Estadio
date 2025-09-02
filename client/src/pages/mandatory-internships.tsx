import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Sidebar } from "@/components/layout/sidebar";
import { Plus, Pencil, Trash2, Search } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertMandatoryInternshipSchema, type MandatoryInternship, type Student, type Advisor, type Company } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

export default function MandatoryInternships() {
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingInternship, setEditingInternship] = useState<MandatoryInternship | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  // Check authentication
  const { data: user, isLoading: authLoading } = useQuery({
    queryKey: ["/api/auth/me"],
  });

  const form = useForm({
    resolver: zodResolver(insertMandatoryInternshipSchema),
    defaultValues: {
      studentId: "",
      advisorId: "",
      companyId: "",
      supervisor: "",
      crc: "",
      workload: "",
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

  // Fetch mandatory internships
  const { data: mandatoryInternships, isLoading } = useQuery({
    queryKey: ["/api/mandatory-internships"],
    enabled: !!user,
  });

  // Fetch students, advisors, and companies for form
  const { data: students } = useQuery({
    queryKey: ["/api/students"],
    enabled: !!user,
  });

  const { data: advisors } = useQuery({
    queryKey: ["/api/advisors"],
    enabled: !!user,
  });

  const { data: companies } = useQuery({
    queryKey: ["/api/companies"],
    enabled: !!user,
  });

  // Auto-set advisor if user is a professor
  useEffect(() => {
    if (user?.role === "professor" && !editingInternship) {
      form.setValue("advisorId", user.id);
    }
  }, [user, editingInternship, form]);

  // Create mandatory internship mutation
  const createMutation = useMutation({
    mutationFn: (data: any) => apiRequest("/api/mandatory-internships", {
      method: "POST",
      body: JSON.stringify(data),
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/mandatory-internships"] });
      setIsDialogOpen(false);
      form.reset();
      toast({
        title: "Sucesso",
        description: "Estágio obrigatório criado com sucesso!",
      });
    },
    onError: (error) => {
      console.error("Erro ao criar estágio obrigatório:", error);
      toast({
        title: "Erro",
        description: "Erro ao criar estágio obrigatório",
        variant: "destructive",
      });
    },
  });

  // Update mandatory internship mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => 
      apiRequest(`/api/mandatory-internships/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      }),
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
    onError: (error) => {
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
    mutationFn: (id: string) => apiRequest(`/api/mandatory-internships/${id}`, {
      method: "DELETE",
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/mandatory-internships"] });
      toast({
        title: "Sucesso",
        description: "Estágio obrigatório excluído com sucesso!",
      });
    },
    onError: (error) => {
      console.error("Erro ao excluir estágio obrigatório:", error);
      toast({
        title: "Erro",
        description: "Erro ao excluir estágio obrigatório",
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
    console.log("Dados do formulário:", data);
    if (editingInternship) {
      updateMutation.mutate({ id: editingInternship.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleEdit = (internship: MandatoryInternship) => {
    setEditingInternship(internship);
    form.reset({
      ...internship,
      startDate: internship.startDate ? new Date(internship.startDate) : undefined,
      endDate: internship.endDate ? new Date(internship.endDate) : undefined,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm("Tem certeza que deseja excluir este estágio obrigatório?")) {
      deleteMutation.mutate(id);
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

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="flex">
        <Sidebar user={user} />
        <main className="flex-1">
          {/* Top Header Bar */}
          <div className="bg-blue-600 text-white px-6 py-3 flex justify-between items-center">
            <h1 className="text-xl font-semibold" data-testid="text-mandatory-internships-title">Gestão de Estágio Obrigatório</h1>
            <div className="flex items-center space-x-4 text-sm">
              <span>🧑‍💼 Administrador</span>
            </div>
          </div>

          <div className="p-6">
            {/* Action Buttons */}
            <div className="flex items-center space-x-4 mb-6">
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button 
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded flex items-center"
                    onClick={() => {
                      setEditingInternship(null);
                      form.reset({
                        studentId: "",
                        advisorId: "",
                        companyId: "",
                        supervisor: "",
                        crc: "",
                        workload: "",
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
                    data-testid="button-add-mandatory-internship"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Novo Estágio
                  </Button>
                </DialogTrigger>

                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle className="text-center text-lg font-semibold text-blue-700">
                      📋 Cadastro de Estágio Obrigatório
                    </DialogTitle>
                  </DialogHeader>

                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        {/* Estudante */}
                        <FormField
                          control={form.control}
                          name="studentId"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Estudante *</FormLabel>
                              <div className="flex space-x-2">
                                <Select onValueChange={field.onChange} value={field.value}>
                                  <FormControl>
                                    <SelectTrigger data-testid="select-student" className="flex-1">
                                      <SelectValue placeholder="Selecione estudante..." />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    {students?.map((student: Student) => (
                                      <SelectItem key={student.id} value={student.id}>
                                        {student.name} - {student.registrationNumber}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                <Button type="button" size="sm" className="bg-blue-600 hover:bg-blue-700">
                                  🔍
                                </Button>
                              </div>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        {/* Data de Término */}
                        <FormField
                          control={form.control}
                          name="endDate"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Data de Término *</FormLabel>
                              <FormControl>
                                <Input 
                                  type="date" 
                                  {...field}
                                  value={field.value ? format(new Date(field.value), "yyyy-MM-dd") : ""}
                                  onChange={(e) => field.onChange(e.target.value ? new Date(e.target.value) : undefined)}
                                  data-testid="input-end-date"
                                  placeholder="DD/MM/AAAA"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        {/* Orientador */}
                        <FormField
                          control={form.control}
                          name="advisorId"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Orientador *</FormLabel>
                              <div className="flex space-x-2">
                                <Select 
                                  onValueChange={field.onChange} 
                                  value={field.value}
                                  disabled={user?.role === "professor"}
                                >
                                  <FormControl>
                                    <SelectTrigger data-testid="select-advisor" className="flex-1">
                                      <SelectValue placeholder={
                                        user?.role === "professor" ? user.name : "Selecione orientador..."
                                      } />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    {advisors?.map((advisor: Advisor) => (
                                      <SelectItem key={advisor.id} value={advisor.id}>
                                        {advisor.name}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                <Button type="button" size="sm" className="bg-blue-600 hover:bg-blue-700">
                                  🔍
                                </Button>
                              </div>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        {/* Nome do Supervisor */}
                        <FormField
                          control={form.control}
                          name="supervisor"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Nome do Supervisor *</FormLabel>
                              <FormControl>
                                <Input 
                                  placeholder="Digite nome do supervisor"
                                  {...field} 
                                  data-testid="input-supervisor" 
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        {/* Empresa */}
                        <FormField
                          control={form.control}
                          name="companyId"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Empresa *</FormLabel>
                              <div className="flex space-x-2">
                                <Select onValueChange={field.onChange} value={field.value || ""}>
                                  <FormControl>
                                    <SelectTrigger data-testid="select-company" className="flex-1">
                                      <SelectValue placeholder="Selecione empresa..." />
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
                                <Button type="button" size="sm" className="bg-blue-600 hover:bg-blue-700">
                                  🔍
                                </Button>
                              </div>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        {/* Registro CRC */}
                        <FormField
                          control={form.control}
                          name="crc"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Registro CRC *</FormLabel>
                              <FormControl>
                                <Input 
                                  placeholder="Digite registro do CRC"
                                  {...field} 
                                  data-testid="input-crc" 
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        {/* Data de Início */}
                        <FormField
                          control={form.control}
                          name="startDate"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Data de Início *</FormLabel>
                              <FormControl>
                                <Input 
                                  type="date" 
                                  {...field}
                                  value={field.value ? format(new Date(field.value), "yyyy-MM-dd") : ""}
                                  onChange={(e) => field.onChange(e.target.value ? new Date(e.target.value) : undefined)}
                                  data-testid="input-start-date"
                                  placeholder="DD/MM/AAAA"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        {/* Carga Horária */}
                        <FormField
                          control={form.control}
                          name="workload"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Carga Horária *</FormLabel>
                              <FormControl>
                                <Input 
                                  placeholder="480"
                                  {...field} 
                                  data-testid="input-workload" 
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      {/* Message */}
                      <div className="bg-blue-500 text-white p-3 rounded text-sm text-center">
                        ⚠️ Campo obrigatório não é item obrigatório, mas é utilizado para outros controles adicionais, selecione a empresa como padrão selecionando ela na empresa cadastrada.
                      </div>

                      <div className="flex justify-center space-x-4 pt-4">
                        <Button 
                          type="submit" 
                          disabled={createMutation.isPending || updateMutation.isPending}
                          className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-2"
                          data-testid="button-save-mandatory-internship"
                        >
                          💾 Salvar
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setIsDialogOpen(false)}
                          className="px-8 py-2"
                          data-testid="button-cancel"
                        >
                          ❌ Cancelar
                        </Button>
                      </div>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
              
              <Button className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded flex items-center">
                <Pencil className="w-4 h-4 mr-2" />
                Editar
              </Button>
              
              <Button className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded flex items-center">
                <Trash2 className="w-4 h-4 mr-2" />
                Excluir
              </Button>
            </div>

            {/* Table */}
            <div className="bg-white rounded-lg border overflow-x-auto">
              {/* Search Bar */}
              <div className="flex justify-between items-center p-4 border-b bg-blue-50">
                <h3 className="text-lg font-semibold text-blue-800">Lista de Estágios Obrigatórios</h3>
                <div className="flex items-center space-x-2">
                  <Input 
                    placeholder="Busque por estudante, orientador ou empresa..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-80"
                    data-testid="input-search"
                  />
                  <Button className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded flex items-center">
                    <Search className="w-4 h-4 mr-2" />
                    Localizar
                  </Button>
                </div>
              </div>

              {/* Table with horizontal scroll */}
              {isLoading ? (
                <div className="text-center py-8">
                  <p>Carregando estágios obrigatórios...</p>
                </div>
              ) : !mandatoryInternships || mandatoryInternships.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500" data-testid="text-no-mandatory-internships">Nenhum estágio obrigatório cadastrado</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table className="min-w-[1400px]">
                    <TableHeader>
                      <TableRow className="bg-blue-600 hover:bg-blue-600">
                        <TableHead className="text-white font-semibold text-center w-12">ID</TableHead>
                        <TableHead className="text-white font-semibold text-center w-48">Estudante</TableHead>
                        <TableHead className="text-white font-semibold text-center w-48">Orientador</TableHead>
                        <TableHead className="text-white font-semibold text-center w-48">Empresa</TableHead>
                        <TableHead className="text-white font-semibold text-center w-32">Data Início</TableHead>
                        <TableHead className="text-white font-semibold text-center w-32">Data Término</TableHead>
                        <TableHead className="text-white font-semibold text-center w-32">Supervisor</TableHead>
                        <TableHead className="text-white font-semibold text-center w-20">CRC</TableHead>
                        <TableHead className="text-white font-semibold text-center w-32">Carga Horária</TableHead>
                        <TableHead className="text-white font-semibold text-center w-24">Status</TableHead>
                        <TableHead className="text-white font-semibold text-center w-12">R1</TableHead>
                        <TableHead className="text-white font-semibold text-center w-12">R2</TableHead>
                        <TableHead className="text-white font-semibold text-center w-12">R3</TableHead>
                        <TableHead className="text-white font-semibold text-center w-12">R4</TableHead>
                        <TableHead className="text-white font-semibold text-center w-12">R5</TableHead>
                        <TableHead className="text-white font-semibold text-center w-12">R6</TableHead>
                        <TableHead className="text-white font-semibold text-center w-12">R7</TableHead>
                        <TableHead className="text-white font-semibold text-center w-12">R8</TableHead>
                        <TableHead className="text-white font-semibold text-center w-12">R9</TableHead>
                        <TableHead className="text-white font-semibold text-center w-12">R10</TableHead>
                        <TableHead className="text-white font-semibold text-center w-24">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {mandatoryInternships
                        .filter((internship: MandatoryInternship) => {
                          const studentName = getStudentName(internship.studentId).toLowerCase();
                          const advisorName = getAdvisorName(internship.advisorId).toLowerCase();
                          const companyName = getCompanyName(internship.companyId).toLowerCase();
                          const search = searchTerm.toLowerCase();
                          return studentName.includes(search) || advisorName.includes(search) || companyName.includes(search);
                        })
                        .map((internship: MandatoryInternship, index: number) => (
                          <TableRow 
                            key={internship.id} 
                            data-testid={`row-mandatory-internship-${internship.id}`} 
                            className="hover:bg-gray-50"
                          >
                            <TableCell className="text-center font-medium" data-testid={`text-internship-id-${internship.id}`}>
                              {index + 1}
                            </TableCell>
                            <TableCell className="text-center" data-testid={`text-internship-student-${internship.id}`}>
                              {getStudentName(internship.studentId)}
                            </TableCell>
                            <TableCell className="text-center" data-testid={`text-internship-advisor-${internship.id}`}>
                              {getAdvisorName(internship.advisorId)}
                            </TableCell>
                            <TableCell className="text-center" data-testid={`text-internship-company-${internship.id}`}>
                              {getCompanyName(internship.companyId)}
                            </TableCell>
                            <TableCell className="text-center" data-testid={`text-internship-start-date-${internship.id}`}>
                              {internship.startDate ? format(new Date(internship.startDate), "dd/MM/yyyy") : "-"}
                            </TableCell>
                            <TableCell className="text-center" data-testid={`text-internship-end-date-${internship.id}`}>
                              {internship.endDate ? format(new Date(internship.endDate), "dd/MM/yyyy") : "-"}
                            </TableCell>
                            <TableCell className="text-center" data-testid={`text-internship-supervisor-${internship.id}`}>
                              {internship.supervisor || "-"}
                            </TableCell>
                            <TableCell className="text-center" data-testid={`text-internship-crc-${internship.id}`}>
                              {internship.crc || "-"}
                            </TableCell>
                            <TableCell className="text-center" data-testid={`text-internship-workload-${internship.id}`}>
                              {internship.workload || "-"}
                            </TableCell>
                            <TableCell className="text-center" data-testid={`text-internship-status-${internship.id}`}>
                              <span className={`px-2 py-1 rounded text-xs ${
                                internship.status === "active" ? "bg-green-100 text-green-800" :
                                internship.status === "completed" ? "bg-blue-100 text-blue-800" :
                                internship.status === "cancelled" ? "bg-red-100 text-red-800" :
                                "bg-yellow-100 text-yellow-800"
                              }`}>
                                {internship.status === "active" ? "Ativo" :
                                 internship.status === "completed" ? "Concluído" :
                                 internship.status === "cancelled" ? "Cancelado" : "Pendente"}
                              </span>
                            </TableCell>
                            {/* R1-R10 columns */}
                            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                              <TableCell key={`r${num}`} className="text-center" data-testid={`text-internship-r${num}-${internship.id}`}>
                                {internship[`r${num}` as keyof MandatoryInternship] ? "✓" : "✗"}
                              </TableCell>
                            ))}
                            <TableCell className="text-center">
                              <div className="flex justify-center space-x-1">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => window.location.href = `/mandatory-internship-control/${internship.id}`}
                                  className="text-blue-600 hover:text-blue-700"
                                  data-testid={`button-control-mandatory-internship-${internship.id}`}
                                  title="Controle do Estágio"
                                >
                                  <FileText className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleEdit(internship)}
                                  data-testid={`button-edit-mandatory-internship-${internship.id}`}
                                >
                                  <Edit2 className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleDelete(internship.id)}
                                  className="text-red-600 hover:text-red-700"
                                  data-testid={`button-delete-mandatory-internship-${internship.id}`}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}