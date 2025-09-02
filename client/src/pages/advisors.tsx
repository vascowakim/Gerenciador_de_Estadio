import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Sidebar } from "@/components/layout/sidebar";
import { Plus, Pencil, Trash2, Search } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertAdvisorSchema, type Advisor } from "@shared/schema";
import { AuthService } from "@/lib/auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";

export default function Advisors() {
  const [location, setLocation] = useLocation();
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingAdvisor, setEditingAdvisor] = useState<Advisor | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  const form = useForm({
    resolver: zodResolver(insertAdvisorSchema),
    defaultValues: {
      name: "",
      position: "",
      siape: "",
      phone: "",
      cpf: "",
      email: "",
      department: "",
      password: "",
      isSystemAdmin: false,
      isInternshipCoordinator: false,
      isActive: true,
    },
  });

  // Check authentication
  const { data: user, isLoading: authLoading } = useQuery({
    queryKey: ["/api/auth/me"],
  });

  // Fetch advisors
  const { data: advisors, isLoading } = useQuery({
    queryKey: ["/api/advisors"],
    enabled: !!user,
  });

  // Create advisor mutation
  const createMutation = useMutation({
    mutationFn: (data: any) => apiRequest("/api/advisors", {
      method: "POST",
      body: JSON.stringify(data),
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/advisors"] });
      setIsDialogOpen(false);
      form.reset();
      toast({
        title: "Sucesso",
        description: "Orientador criado com sucesso!",
      });
    },
    onError: (error) => {
      console.error("Erro ao criar orientador:", error);
      toast({
        title: "Erro",
        description: "Erro ao criar orientador",
        variant: "destructive",
      });
    },
  });

  // Update advisor mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => 
      apiRequest(`/api/advisors/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/advisors"] });
      setIsDialogOpen(false);
      setEditingAdvisor(null);
      form.reset();
      toast({
        title: "Sucesso",
        description: "Orientador atualizado com sucesso!",
      });
    },
    onError: (error) => {
      console.error("Erro ao atualizar orientador:", error);
      toast({
        title: "Erro",
        description: "Erro ao atualizar orientador",
        variant: "destructive",
      });
    },
  });

  // Delete advisor mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiRequest(`/api/advisors/${id}`, {
      method: "DELETE",
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/advisors"] });
      toast({
        title: "Sucesso",
        description: "Orientador excluído com sucesso!",
      });
    },
    onError: (error) => {
      console.error("Erro ao excluir orientador:", error);
      toast({
        title: "Erro",
        description: "Erro ao excluir orientador",
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
    if (editingAdvisor) {
      updateMutation.mutate({ id: editingAdvisor.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleEdit = (advisor: Advisor) => {
    setEditingAdvisor(advisor);
    form.reset({
      ...advisor,
      position: advisor.position || "",
      siape: advisor.siape || "",
      phone: advisor.phone || "",
      cpf: advisor.cpf || "",
      password: advisor.password || "",
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm("Tem certeza que deseja excluir este orientador?")) {
      deleteMutation.mutate(id);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="flex">
        <Sidebar user={user} />
        <main className="flex-1">
          {/* Top Header Bar */}
          <div className="bg-blue-600 text-white px-6 py-3 flex justify-between items-center">
            <h1 className="text-xl font-semibold" data-testid="text-advisors-title">Gestão de Orientadores</h1>
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
                      setEditingAdvisor(null);
                      form.reset({
                        name: "",
                        position: "",
                        siape: "",
                        phone: "",
                        cpf: "",
                        email: "",
                        department: "",
                        password: "",
                        isSystemAdmin: false,
                        isInternshipCoordinator: false,
                        isActive: true,
                      });
                    }}
                    data-testid="button-add-advisor"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Novo Orientador
                  </Button>
                </DialogTrigger>

                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle className="text-center text-lg font-semibold text-blue-700">
                      📋 Cadastro de Orientador
                    </DialogTitle>
                  </DialogHeader>

                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="name"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Nome Completo *</FormLabel>
                              <FormControl>
                                <Input placeholder="Digite o nome completo" {...field} data-testid="input-advisor-name" />
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
                              <FormLabel>Cargo *</FormLabel>
                              <FormControl>
                                <Input placeholder="Digite o cargo" {...field} data-testid="input-advisor-position" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="siape"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>SIAPE *</FormLabel>
                              <FormControl>
                                <Input placeholder="Digite o SIAPE" {...field} data-testid="input-advisor-siape" />
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
                              <FormLabel>Telefone *</FormLabel>
                              <FormControl>
                                <Input placeholder="(XX) XXXXX-XXXX" {...field} data-testid="input-advisor-phone" />
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
                              <FormLabel>CPF *</FormLabel>
                              <FormControl>
                                <Input placeholder="000.000.000-00" {...field} data-testid="input-advisor-cpf" />
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
                              <FormLabel>Email Institucional *</FormLabel>
                              <FormControl>
                                <Input type="email" placeholder="nome@ufvjm.edu.br" {...field} data-testid="input-advisor-email" />
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
                              <FormLabel>Departamento *</FormLabel>
                              <FormControl>
                                <Input placeholder="Digite o departamento" {...field} data-testid="input-advisor-department" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="password"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Senha *</FormLabel>
                              <FormControl>
                                <Input type="password" placeholder="Digite a senha" {...field} data-testid="input-advisor-password" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      {/* Perfis Section */}
                      <div className="border-t pt-4">
                        <Label className="text-base font-medium mb-3 block">Perfil</Label>
                        <div className="space-y-3">
                          <FormField
                            control={form.control}
                            name="isSystemAdmin"
                            render={({ field }) => (
                              <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                                <FormControl>
                                  <Checkbox
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                    data-testid="checkbox-system-admin"
                                  />
                                </FormControl>
                                <div className="space-y-1 leading-none">
                                  <FormLabel>
                                    🔧 Administrador do Sistema
                                  </FormLabel>
                                </div>
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name="isInternshipCoordinator"
                            render={({ field }) => (
                              <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                                <FormControl>
                                  <Checkbox
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                    data-testid="checkbox-internship-coordinator"
                                  />
                                </FormControl>
                                <div className="space-y-1 leading-none">
                                  <FormLabel className="text-orange-600">
                                    📊 Coordenador de Estágio - Estágios Obrigatórios
                                  </FormLabel>
                                </div>
                              </FormItem>
                            )}
                          />
                        </div>
                      </div>

                      {/* Verification Button */}
                      <div className="flex justify-center py-2">
                        <Button 
                          type="button"
                          className="bg-blue-500 hover:bg-blue-600 text-white px-8 py-2"
                        >
                          🔄 Confirmar Informações Únicas Cadastrais
                        </Button>
                      </div>

                      <div className="flex justify-center space-x-4 pt-4">
                        <Button 
                          type="submit" 
                          disabled={createMutation.isPending || updateMutation.isPending}
                          className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-2"
                          data-testid="button-save-advisor"
                        >
                          💾 {createMutation.isPending || updateMutation.isPending ? "Salvando..." : "Salvar"}
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
              
              <Button className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded flex items-center">
                <Pencil className="w-4 h-4 mr-2" />
                Editar
              </Button>
              
              <Button className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded flex items-center">
                <Trash2 className="w-4 h-4 mr-2" />
                Excluir
              </Button>

              <div className="flex items-center bg-red-100 border border-red-300 px-3 py-2 rounded text-sm">
                📋 Cadastro de Orientador
              </div>
            </div>

            {/* Advisors Table with Search */}
            <div className="bg-white rounded-lg border">
              {/* Search Bar */}
              <div className="flex justify-between items-center p-4 border-b bg-blue-50">
                <h3 className="text-lg font-semibold text-blue-800">Lista de Orientadores</h3>
                <div className="flex items-center space-x-2">
                  <Input 
                    placeholder="Busque por nome, SIAPE ou email..."
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
                  <p>Carregando orientadores...</p>
                </div>
              ) : !advisors || advisors.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500" data-testid="text-no-advisors">Nenhum orientador cadastrado</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="bg-blue-600 hover:bg-blue-600">
                      <TableHead className="text-white font-semibold">ID</TableHead>
                      <TableHead className="text-white font-semibold">Nome</TableHead>
                      <TableHead className="text-white font-semibold">Cargo</TableHead>
                      <TableHead className="text-white font-semibold">SIAPE</TableHead>
                      <TableHead className="text-white font-semibold">Email</TableHead>
                      <TableHead className="text-white font-semibold">Telefone</TableHead>
                      <TableHead className="text-white font-semibold">Departamento</TableHead>
                      <TableHead className="text-white font-semibold">Administrador</TableHead>
                      <TableHead className="text-white font-semibold">Coordenador</TableHead>
                      <TableHead className="text-white font-semibold">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {advisors.filter((advisor: Advisor) => 
                      advisor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                      (advisor.siape && advisor.siape.toLowerCase().includes(searchTerm.toLowerCase())) ||
                      advisor.email.toLowerCase().includes(searchTerm.toLowerCase())
                    ).map((advisor: Advisor, index: number) => (
                      <TableRow key={advisor.id} data-testid={`row-advisor-${advisor.id}`} className="hover:bg-gray-50">
                        <TableCell className="font-medium" data-testid={`text-advisor-id-${advisor.id}`}>
                          {index + 1}
                        </TableCell>
                        <TableCell className="font-medium" data-testid={`text-advisor-name-${advisor.id}`}>
                          {advisor.name}
                        </TableCell>
                        <TableCell data-testid={`text-advisor-position-${advisor.id}`}>
                          {advisor.position || "-"}
                        </TableCell>
                        <TableCell data-testid={`text-advisor-siape-${advisor.id}`}>
                          {advisor.siape || "-"}
                        </TableCell>
                        <TableCell data-testid={`text-advisor-email-${advisor.id}`}>
                          {advisor.email}
                        </TableCell>
                        <TableCell data-testid={`text-advisor-phone-${advisor.id}`}>
                          {advisor.phone || "-"}
                        </TableCell>
                        <TableCell data-testid={`text-advisor-department-${advisor.id}`}>
                          {advisor.department}
                        </TableCell>
                        <TableCell data-testid={`text-advisor-admin-${advisor.id}`}>
                          <span className={`px-2 py-1 rounded text-xs ${
                            advisor.isSystemAdmin ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-600'
                          }`}>
                            {advisor.isSystemAdmin ? 'Sim' : 'Não'}
                          </span>
                        </TableCell>
                        <TableCell data-testid={`text-advisor-coordinator-${advisor.id}`}>
                          <span className={`px-2 py-1 rounded text-xs ${
                            advisor.isInternshipCoordinator ? 'bg-orange-100 text-orange-800' : 'bg-gray-100 text-gray-600'
                          }`}>
                            {advisor.isInternshipCoordinator ? 'Sim' : 'Não'}
                          </span>
                        </TableCell>
                        <TableCell data-testid={`text-advisor-status-${advisor.id}`}>
                          <span className={`px-2 py-1 rounded text-xs ${
                            advisor.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {advisor.isActive ? 'Ativo' : 'Inativo'}
                          </span>
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