import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Navbar } from "@/components/layout/navbar";
import { Sidebar } from "@/components/layout/sidebar";
import { Plus, Pencil, Trash2, UserCheck } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertAdvisorSchema, type Advisor } from "@shared/schema";
import { AuthService } from "@/lib/auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";

export default function Advisors() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingAdvisor, setEditingAdvisor] = useState<Advisor | null>(null);

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

  const { data: advisors, isLoading } = useQuery({
    queryKey: ["/api/advisors"],
    enabled: !!user,
  });

  const form = useForm({
    resolver: zodResolver(insertAdvisorSchema),
    defaultValues: {
      name: "",
      email: "",
      department: "",
      phone: "",
      isActive: true,
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", "/api/advisors", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/advisors"] });
      setIsDialogOpen(false);
      form.reset();
      toast({
        title: "Orientador criado",
        description: "Orientador criado com sucesso.",
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Erro ao criar orientador.",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const response = await apiRequest("PUT", `/api/advisors/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/advisors"] });
      setIsDialogOpen(false);
      setEditingAdvisor(null);
      form.reset();
      toast({
        title: "Orientador atualizado",
        description: "Orientador atualizado com sucesso.",
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Erro ao atualizar orientador.",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/advisors/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/advisors"] });
      toast({
        title: "Orientador excluído",
        description: "Orientador excluído com sucesso.",
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Erro ao excluir orientador.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: any) => {
    if (editingAdvisor) {
      updateMutation.mutate({ id: editingAdvisor.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleEdit = (advisor: Advisor) => {
    setEditingAdvisor(advisor);
    form.reset(advisor);
    setIsDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm("Tem certeza que deseja excluir este orientador?")) {
      deleteMutation.mutate(id);
    }
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar user={user} />
      <div className="flex">
        <Sidebar user={user} />
        <main className="flex-1 p-8">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2" data-testid="text-advisors-title">
                  Orientadores
                </h1>
                <p className="text-gray-600">Gerencie os orientadores do sistema</p>
              </div>

              {user.role === "administrator" && (
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                  <DialogTrigger asChild>
                    <Button 
                      className="ufvjm-light-blue hover:bg-blue-700"
                      onClick={() => {
                        setEditingAdvisor(null);
                        form.reset({
                          name: "",
                          email: "",
                          department: "",
                          phone: "",
                          isActive: true,
                        });
                      }}
                      data-testid="button-add-advisor"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Novo Orientador
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>
                        {editingAdvisor ? "Editar Orientador" : "Novo Orientador"}
                      </DialogTitle>
                      <DialogDescription>
                        {editingAdvisor 
                          ? "Edite as informações do orientador"
                          : "Adicione um novo orientador ao sistema"
                        }
                      </DialogDescription>
                    </DialogHeader>

                    <Form {...form}>
                      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                          control={form.control}
                          name="name"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Nome Completo</FormLabel>
                              <FormControl>
                                <Input placeholder="Digite o nome completo" {...field} data-testid="input-advisor-name" />
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
                                <Input type="email" placeholder="orientador@ufvjm.edu.br" {...field} data-testid="input-advisor-email" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="department"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Departamento</FormLabel>
                              <FormControl>
                                <Input placeholder="Digite o departamento" {...field} data-testid="input-advisor-department" />
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
                                <Input placeholder="(XX) XXXXX-XXXX" {...field} data-testid="input-advisor-phone" />
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
                            data-testid="button-cancel-advisor"
                          >
                            Cancelar
                          </Button>
                          <Button 
                            type="submit" 
                            disabled={createMutation.isPending || updateMutation.isPending}
                            data-testid="button-save-advisor"
                          >
                            {createMutation.isPending || updateMutation.isPending ? "Salvando..." : "Salvar"}
                          </Button>
                        </div>
                      </form>
                    </Form>
                  </DialogContent>
                </Dialog>
              )}
            </div>

            {/* Advisors Table */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <UserCheck className="w-5 h-5 mr-2" />
                  Lista de Orientadores
                </CardTitle>
                <CardDescription>
                  Todos os orientadores cadastrados no sistema
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="text-center py-8">
                    <p>Carregando orientadores...</p>
                  </div>
                ) : !advisors || advisors.length === 0 ? (
                  <div className="text-center py-8">
                    <UserCheck className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500" data-testid="text-no-advisors">Nenhum orientador cadastrado</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nome</TableHead>
                        <TableHead>Departamento</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Telefone</TableHead>
                        {user.role === "administrator" && <TableHead>Ações</TableHead>}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {advisors.map((advisor: Advisor) => (
                        <TableRow key={advisor.id} data-testid={`row-advisor-${advisor.id}`}>
                          <TableCell className="font-medium" data-testid={`text-advisor-name-${advisor.id}`}>
                            {advisor.name}
                          </TableCell>
                          <TableCell data-testid={`text-advisor-department-${advisor.id}`}>
                            {advisor.department}
                          </TableCell>
                          <TableCell data-testid={`text-advisor-email-${advisor.id}`}>
                            {advisor.email}
                          </TableCell>
                          <TableCell data-testid={`text-advisor-phone-${advisor.id}`}>
                            {advisor.phone || "-"}
                          </TableCell>
                          {user.role === "administrator" && (
                            <TableCell>
                              <div className="flex space-x-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleEdit(advisor)}
                                  data-testid={`button-edit-advisor-${advisor.id}`}
                                >
                                  <Pencil className="w-4 h-4" />
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleDelete(advisor.id)}
                                  data-testid={`button-delete-advisor-${advisor.id}`}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </TableCell>
                          )}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
}
