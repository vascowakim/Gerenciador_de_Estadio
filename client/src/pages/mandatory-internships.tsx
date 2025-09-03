import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Pencil, Trash2, Search, Edit2, GraduationCap, Eye } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertMandatoryInternshipSchema, type MandatoryInternship, type Student, type Advisor, type Company } from "@shared/schema";
import { AuthService } from "@/lib/auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useLocation, Link } from "wouter";
import { format } from "date-fns";

export default function MandatoryInternships() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingInternship, setEditingInternship] = useState<MandatoryInternship | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

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

  // Create mandatory internship mutation
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

  // Update mandatory internship mutation
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

  // Delete mandatory internship mutation
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

  const filteredInternships = mandatoryInternships ? mandatoryInternships.filter((internship: MandatoryInternship) => {
    const studentName = getStudentName(internship.studentId);
    const advisorName = getAdvisorName(internship.advisorId);
    const companyName = getCompanyName(internship.companyId);
    
    return studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
           advisorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
           companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
           (internship.supervisor && internship.supervisor.toLowerCase().includes(searchTerm.toLowerCase()));
  }) : [];

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
                  advisorId: user?.role === "professor" ? user.id : "",
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
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-student">
                              <SelectValue placeholder="Selecione o estudante" />
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
                            <SelectItem value="pending">Pendente</SelectItem>
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
            <div className="text-center py-8">Carregando...</div>
          ) : filteredInternships.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              Nenhum estágio obrigatório encontrado.
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
                  <TableRow key={internship.id}>
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
                         "Pendente"}
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