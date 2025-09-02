import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Navbar } from "@/components/layout/navbar";
import { Plus, Pencil, Trash2, BookOpen, Calendar } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertInternshipSchema, type Internship } from "@shared/schema";
import { AuthService } from "@/lib/auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";

export default function Internships() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingInternship, setEditingInternship] = useState<Internship | null>(null);

  const { data: user } = useQuery({
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

  const { data: internships, isLoading } = useQuery({
    queryKey: ["/api/internships"],
    enabled: !!user,
  });

  const { data: students } = useQuery({
    queryKey: ["/api/students"],
    enabled: !!user,
  });

  const { data: advisors } = useQuery({
    queryKey: ["/api/advisors"],
    enabled: !!user,
  });

  const form = useForm({
    resolver: zodResolver(insertInternshipSchema),
    defaultValues: {
      studentId: "",
      advisorId: "",
      company: "",
      position: "",
      type: "mandatory" as const,
      status: "pending" as const,
      startDate: undefined,
      endDate: undefined,
      workload: "",
      description: "",
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", "/api/internships", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/internships"] });
      setIsDialogOpen(false);
      form.reset();
      toast({
        title: "Estágio criado",
        description: "Estágio criado com sucesso.",
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Erro ao criar estágio.",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const response = await apiRequest("PUT", `/api/internships/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/internships"] });
      setIsDialogOpen(false);
      setEditingInternship(null);
      form.reset();
      toast({
        title: "Estágio atualizado",
        description: "Estágio atualizado com sucesso.",
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Erro ao atualizar estágio.",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/internships/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/internships"] });
      toast({
        title: "Estágio excluído",
        description: "Estágio excluído com sucesso.",
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Erro ao excluir estágio.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: any) => {
    if (editingInternship) {
      updateMutation.mutate({ id: editingInternship.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleEdit = (internship: Internship) => {
    setEditingInternship(internship);
    form.reset({
      ...internship,
      startDate: internship.startDate ? new Date(internship.startDate).toISOString().split('T')[0] : undefined,
      endDate: internship.endDate ? new Date(internship.endDate).toISOString().split('T')[0] : undefined,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm("Tem certeza que deseja excluir este estágio?")) {
      deleteMutation.mutate(id);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusMap = {
      pending: { label: "Pendente", variant: "secondary" as const },
      approved: { label: "Aprovado", variant: "default" as const },
      rejected: { label: "Rejeitado", variant: "destructive" as const },
      completed: { label: "Concluído", variant: "outline" as const },
    };
    
    return statusMap[status as keyof typeof statusMap] || statusMap.pending;
  };

  const getTypeBadge = (type: string) => {
    return type === "mandatory" ? "Obrigatório" : "Não Obrigatório";
  };

  if (!user) return null;

  return (
        <main className="p-8">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2" data-testid="text-internships-title">
                  Estágios
                </h1>
                <p className="text-gray-600">Gerencie os estágios do sistema</p>
              </div>

              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button 
                    className="ufvjm-light-blue hover:bg-blue-700"
                    onClick={() => {
                      setEditingInternship(null);
                      form.reset({
                        studentId: "",
                        advisorId: "",
                        company: "",
                        position: "",
                        type: "mandatory",
                        status: "pending",
                        startDate: undefined,
                        endDate: undefined,
                        workload: "",
                        description: "",
                      });
                    }}
                    data-testid="button-add-internship"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Novo Estágio
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>
                      {editingInternship ? "Editar Estágio" : "Novo Estágio"}
                    </DialogTitle>
                    <DialogDescription>
                      {editingInternship 
                        ? "Edite as informações do estágio"
                        : "Adicione um novo estágio ao sistema"
                      }
                    </DialogDescription>
                  </DialogHeader>

                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="studentId"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Estudante</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger data-testid="select-student">
                                    <SelectValue placeholder="Selecione o estudante" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {students?.map((student: any) => (
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
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger data-testid="select-advisor">
                                    <SelectValue placeholder="Selecione o orientador" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {advisors?.map((advisor: any) => (
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
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="company"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Empresa</FormLabel>
                              <FormControl>
                                <Input placeholder="Nome da empresa" {...field} data-testid="input-company" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="position"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Cargo</FormLabel>
                              <FormControl>
                                <Input placeholder="Cargo/função" {...field} data-testid="input-position" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="type"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Tipo</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger data-testid="select-type">
                                    <SelectValue />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="mandatory">Obrigatório</SelectItem>
                                  <SelectItem value="non_mandatory">Não Obrigatório</SelectItem>
                                </SelectContent>
                              </Select>
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
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger data-testid="select-status">
                                    <SelectValue />
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

                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="startDate"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Data de Início</FormLabel>
                              <FormControl>
                                <Input type="date" {...field} data-testid="input-start-date" />
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
                                <Input type="date" {...field} data-testid="input-end-date" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <FormField
                        control={form.control}
                        name="workload"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Carga Horária</FormLabel>
                            <FormControl>
                              <Input placeholder="Ex: 30 horas semanais" {...field} data-testid="input-workload" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="description"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Descrição</FormLabel>
                            <FormControl>
                              <Textarea 
                                placeholder="Descreva as atividades do estágio" 
                                {...field} 
                                data-testid="textarea-description"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="flex justify-end space-x-2">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setIsDialogOpen(false)}
                          data-testid="button-cancel-internship"
                        >
                          Cancelar
                        </Button>
                        <Button 
                          type="submit" 
                          disabled={createMutation.isPending || updateMutation.isPending}
                          data-testid="button-save-internship"
                        >
                          {createMutation.isPending || updateMutation.isPending ? "Salvando..." : "Salvar"}
                        </Button>
                      </div>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
            </div>

            {/* Internships Table */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <BookOpen className="w-5 h-5 mr-2" />
                  Lista de Estágios
                </CardTitle>
                <CardDescription>
                  Todos os estágios cadastrados no sistema
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="text-center py-8">
                    <p>Carregando estágios...</p>
                  </div>
                ) : !internships || internships.length === 0 ? (
                  <div className="text-center py-8">
                    <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500" data-testid="text-no-internships">Nenhum estágio cadastrado</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Estudante</TableHead>
                        <TableHead>Empresa</TableHead>
                        <TableHead>Cargo</TableHead>
                        <TableHead>Tipo</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Orientador</TableHead>
                        <TableHead>Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {internships.map((internship: any) => {
                        const statusInfo = getStatusBadge(internship.status);
                        return (
                          <TableRow key={internship.id} data-testid={`row-internship-${internship.id}`}>
                            <TableCell className="font-medium" data-testid={`text-internship-student-${internship.id}`}>
                              {students?.find((s: any) => s.id === internship.studentId)?.name || "N/A"}
                            </TableCell>
                            <TableCell data-testid={`text-internship-company-${internship.id}`}>
                              {internship.company}
                            </TableCell>
                            <TableCell data-testid={`text-internship-position-${internship.id}`}>
                              {internship.position}
                            </TableCell>
                            <TableCell data-testid={`text-internship-type-${internship.id}`}>
                              {getTypeBadge(internship.type)}
                            </TableCell>
                            <TableCell data-testid={`badge-internship-status-${internship.id}`}>
                              <Badge variant={statusInfo.variant}>
                                {statusInfo.label}
                              </Badge>
                            </TableCell>
                            <TableCell data-testid={`text-internship-advisor-${internship.id}`}>
                              {advisors?.find((a: any) => a.id === internship.advisorId)?.name || "N/A"}
                            </TableCell>
                            <TableCell>
                              <div className="flex space-x-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleEdit(internship)}
                                  data-testid={`button-edit-internship-${internship.id}`}
                                >
                                  <Pencil className="w-4 h-4" />
                                </Button>
                                {user.role === "administrator" && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleDelete(internship.id)}
                                    data-testid={`button-delete-internship-${internship.id}`}
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </div>
        </main>
  );
}
