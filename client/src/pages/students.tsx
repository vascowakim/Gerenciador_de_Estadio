import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Sidebar } from "@/components/layout/sidebar";
import { Plus, Pencil, Trash2, Search, Edit2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertStudentSchema, type Student } from "@shared/schema";
import { AuthService } from "@/lib/auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";

export default function Students() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);

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

  const { data: students, isLoading } = useQuery({
    queryKey: ["/api/students"],
    enabled: !!user,
  });

  const [searchTerm, setSearchTerm] = useState("");

  const form = useForm({
    resolver: zodResolver(insertStudentSchema),
    defaultValues: {
      name: "",
      email: "",
      registrationNumber: "",
      course: "",
      phone: "",
      cpf: "",
      address: "",
      isActive: true,
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", "/api/students", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/students"] });
      setIsDialogOpen(false);
      form.reset();
      toast({
        title: "Estudante criado",
        description: "Estudante criado com sucesso.",
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Erro ao criar estudante.",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const response = await apiRequest("PUT", `/api/students/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/students"] });
      setIsDialogOpen(false);
      setEditingStudent(null);
      form.reset();
      toast({
        title: "Estudante atualizado",
        description: "Estudante atualizado com sucesso.",
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Erro ao atualizar estudante.",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/students/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/students"] });
      toast({
        title: "Estudante excluído",
        description: "Estudante excluído com sucesso.",
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Erro ao excluir estudante.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: any) => {
    if (editingStudent) {
      updateMutation.mutate({ id: editingStudent.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleEdit = (student: Student) => {
    setEditingStudent(student);
    form.reset({
      ...student,
      cpf: student.cpf || "",
      address: student.address || ""
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm("Tem certeza que deseja excluir este estudante?")) {
      deleteMutation.mutate(id);
    }
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="flex">
        <Sidebar user={user} />
        <main className="flex-1">
          {/* Top Header Bar */}
          <div className="bg-blue-600 text-white px-6 py-3 flex justify-between items-center">
            <h1 className="text-xl font-semibold" data-testid="text-students-title">Gestão de Estudantes</h1>
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
                      setEditingStudent(null);
                      form.reset({
                        name: "",
                        email: "",
                        registrationNumber: "",
                        course: "",
                        phone: "",
                        cpf: "",
                        address: "",
                        isActive: true,
                      });
                    }}
                    data-testid="button-add-student"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Novo Cadastro
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-3xl">
                  <DialogHeader>
                    <DialogTitle>
                      {editingStudent ? "Editar Estudante" : "Novo Estudante"}
                    </DialogTitle>
                    <DialogDescription>
                      {editingStudent 
                        ? "Edite as informações do estudante"
                        : "Adicione um novo estudante ao sistema"
                      }
                    </DialogDescription>
                  </DialogHeader>

                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="name"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Nome Completo</FormLabel>
                              <FormControl>
                                <Input placeholder="Digite o nome completo" {...field} data-testid="input-student-name" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="email"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Email</FormLabel>
                              <FormControl>
                                <Input type="email" placeholder="estudante@ufvjm.edu.br" {...field} data-testid="input-student-email" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="registrationNumber"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Matrícula</FormLabel>
                              <FormControl>
                                <Input placeholder="Digite a matrícula" {...field} data-testid="input-student-registration" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="course"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Curso</FormLabel>
                              <FormControl>
                                <Input placeholder="Digite o curso" {...field} data-testid="input-student-course" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="phone"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Telefone</FormLabel>
                              <FormControl>
                                <Input placeholder="(XX) XXXXX-XXXX" {...field} data-testid="input-student-phone" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="cpf"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>CPF</FormLabel>
                              <FormControl>
                                <Input placeholder="000.000.000-00" {...field} data-testid="input-student-cpf" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <FormField
                        control={form.control}
                        name="address"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Endereço</FormLabel>
                            <FormControl>
                              <Textarea placeholder="Digite o endereço completo" {...field} data-testid="input-student-address" />
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
                          data-testid="button-cancel"
                        >
                          Cancelar
                        </Button>
                        <Button 
                          type="submit" 
                          disabled={createMutation.isPending || updateMutation.isPending}
                          data-testid="button-save-student"
                        >
                          {createMutation.isPending || updateMutation.isPending ? "Salvando..." : "Salvar"}
                        </Button>
                      </div>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
              
              <Button className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded flex items-center">
                <Pencil className="w-4 h-4 mr-2" />
                Editar
              </Button>
              
              <Button className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded flex items-center">
                <Trash2 className="w-4 h-4 mr-2" />
                Excluir
              </Button>
            </div>

            {/* Students Table with Search */}
            <div className="bg-white rounded-lg border">
              {/* Search Bar */}
              <div className="flex justify-between items-center p-4 border-b bg-blue-50">
                <h3 className="text-lg font-semibold text-blue-800">Lista de Estudantes</h3>
                <div className="flex items-center space-x-2">
                  <Input 
                    placeholder="Busque por nome, matrícula ou CPF..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-64"
                    data-testid="input-search"
                  />
                  <Button className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded flex items-center">
                    <Search className="w-4 h-4 mr-2" />
                    Localizar
                  </Button>
                </div>
              </div>

              {/* Table */}
              {isLoading ? (
                <div className="text-center py-8">
                  <p>Carregando estudantes...</p>
                </div>
              ) : !students || students.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500" data-testid="text-no-students">Nenhum estudante cadastrado</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="bg-blue-600 hover:bg-blue-600">
                      <TableHead className="text-white font-semibold">ID</TableHead>
                      <TableHead className="text-white font-semibold">Nome</TableHead>
                      <TableHead className="text-white font-semibold">Email</TableHead>
                      <TableHead className="text-white font-semibold">Curso</TableHead>
                      <TableHead className="text-white font-semibold">Matrícula</TableHead>
                      <TableHead className="text-white font-semibold">Telefone</TableHead>
                      <TableHead className="text-white font-semibold">CPF</TableHead>
                      <TableHead className="text-white font-semibold">Endereço</TableHead>
                      <TableHead className="text-white font-semibold">Data Ingresso</TableHead>
                      <TableHead className="text-white font-semibold">Status</TableHead>
                      <TableHead className="text-white font-semibold text-center">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {students.filter((student: Student) => 
                      student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                      student.registrationNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                      (student.cpf && student.cpf.toLowerCase().includes(searchTerm.toLowerCase()))
                    ).map((student: Student, index: number) => (
                      <TableRow key={student.id} data-testid={`row-student-${student.id}`} className="hover:bg-gray-50">
                        <TableCell className="font-medium" data-testid={`text-student-id-${student.id}`}>
                          {index + 1}
                        </TableCell>
                        <TableCell className="font-medium" data-testid={`text-student-name-${student.id}`}>
                          {student.name}
                        </TableCell>
                        <TableCell data-testid={`text-student-email-${student.id}`}>
                          {student.email}
                        </TableCell>
                        <TableCell data-testid={`text-student-course-${student.id}`}>
                          {student.course}
                        </TableCell>
                        <TableCell data-testid={`text-student-registration-${student.id}`}>
                          {student.registrationNumber}
                        </TableCell>
                        <TableCell data-testid={`text-student-phone-${student.id}`}>
                          {student.phone || "-"}
                        </TableCell>
                        <TableCell data-testid={`text-student-cpf-${student.id}`}>
                          {student.cpf || "-"}
                        </TableCell>
                        <TableCell data-testid={`text-student-address-${student.id}`}>
                          {student.address || "-"}
                        </TableCell>
                        <TableCell data-testid={`text-student-created-${student.id}`}>
                          {new Date(student.createdAt).toLocaleDateString('pt-BR')}
                        </TableCell>
                        <TableCell data-testid={`text-student-status-${student.id}`}>
                          <span className={`px-2 py-1 rounded text-xs ${
                            student.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {student.isActive ? 'Ativo' : 'Inativo'}
                          </span>
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="flex justify-center space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEdit(student)}
                              data-testid={`button-edit-student-${student.id}`}
                            >
                              <Edit2 className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDelete(student.id)}
                              className="text-red-600 hover:text-red-700"
                              data-testid={`button-delete-student-${student.id}`}
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
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
