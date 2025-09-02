import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Edit2, Trash2, Search, Users, Eye, EyeOff } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertAdvisorSchema, type Advisor } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";
import { Badge } from "@/components/ui/badge";

// Schema para o formulário de registro completo
const registerAdvisorSchema = insertAdvisorSchema.extend({
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "Senha deve ter pelo menos 6 caracteres"),
  role: z.enum(["administrator", "professor"], {
    required_error: "Selecione um perfil",
  }),
  isSystemAdmin: z.boolean(),
  isInternshipCoordinator: z.boolean(),
  isProfessor: z.boolean(),
});

type RegisterAdvisorData = z.infer<typeof registerAdvisorSchema>;

export default function Advisors() {
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingAdvisor, setEditingAdvisor] = useState<Advisor | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const form = useForm<RegisterAdvisorData>({
    resolver: zodResolver(registerAdvisorSchema),
    defaultValues: {
      name: "",
      position: "",
      siape: "",
      phone: "",
      cpf: "",
      email: "",
      department: "",
      password: "",
      role: "professor",
      isSystemAdmin: false,
      isInternshipCoordinator: false,
      isProfessor: false,
      isActive: true,
    },
  });

  // Queries
  const { data: advisors = [], isLoading } = useQuery<Advisor[]>({
    queryKey: ["/api/advisors"],
  });

  const { data: currentUser } = useQuery<{ id: string; role: string }>({
    queryKey: ["/api/auth/me"],
  });

  // Mutations
  const registerMutation = useMutation({
    mutationFn: async (data: RegisterAdvisorData) => {
      // Determinar o role baseado nos checkboxes
      let role = "professor";
      if (data.isSystemAdmin) {
        role = "administrator";
      } else if (data.isInternshipCoordinator) {
        role = "professor"; // Coordenador também é um tipo de professor
      } else if (data.isProfessor) {
        role = "professor";
      }

      const payload = {
        ...data,
        role,
      };

      const response = await fetch("/api/advisors/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Erro ao registrar orientador");
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/advisors"] });
      setIsDialogOpen(false);
      form.reset();
      toast({
        title: "Orientador registrado com sucesso!",
        description: "Orientador e usuário de login criados.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao registrar orientador",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Advisor> }) => {
      const response = await fetch(`/api/advisors/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Falha ao atualizar orientador");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/advisors"] });
      setIsDialogOpen(false);
      setEditingAdvisor(null);
      form.reset();
      toast({ title: "Orientador atualizado com sucesso!" });
    },
    onError: (error) => {
      toast({ title: "Erro ao atualizar orientador", variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/advisors/${id}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Falha ao excluir orientador");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/advisors"] });
      toast({ title: "Orientador excluído com sucesso!" });
    },
    onError: (error) => {
      toast({ title: "Erro ao excluir orientador", variant: "destructive" });
    },
  });

  const onSubmit = (data: RegisterAdvisorData) => {
    if (editingAdvisor) {
      updateMutation.mutate({ id: editingAdvisor.id, data });
    } else {
      registerMutation.mutate(data);
    }
  };

  const handleEdit = (advisor: Advisor) => {
    setEditingAdvisor(advisor);
    form.reset({
      name: advisor.name,
      position: advisor.position || "",
      siape: advisor.siape || "",
      phone: advisor.phone || "",
      cpf: advisor.cpf || "",
      email: advisor.email || "",
      department: advisor.department || "",
      password: "",
      role: "professor",
      isSystemAdmin: advisor.isSystemAdmin || false,
      isInternshipCoordinator: advisor.isInternshipCoordinator || false,
      isProfessor: (!advisor.isSystemAdmin && !advisor.isInternshipCoordinator) || false,
      isActive: advisor.isActive,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    if (window.confirm("Tem certeza que deseja excluir este orientador?")) {
      deleteMutation.mutate(id);
    }
  };

  const handleOpenDialog = () => {
    setEditingAdvisor(null);
    form.reset();
    setIsDialogOpen(true);
  };

  const filteredAdvisors = advisors.filter((advisor) =>
    advisor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    advisor.siape?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    advisor.department?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="text-center">Carregando orientadores...</div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="bg-blue-600 text-white p-6 rounded-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Users className="h-8 w-8" />
            <div>
              <h1 className="text-2xl font-bold">Gestão de Orientadores</h1>
              <p className="text-blue-100">Cadastro e gerenciamento de orientadores do sistema</p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold">{filteredAdvisors.length}</div>
            <div className="text-blue-100">Total de Orientadores</div>
          </div>
        </div>
      </div>

      {/* Search and Actions */}
      <div className="flex justify-between items-center">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Buscar por nome, SIAPE, CPF ou email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
            data-testid="input-search-advisors"
          />
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={handleOpenDialog} data-testid="button-add-advisor">
              <Plus className="h-4 w-4 mr-2" />
              Novo Orientador
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-center text-lg font-bold text-blue-600">
                📝 Cadastro de Orientador
              </DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nome Completo *</FormLabel>
                        <FormControl>
                          <Input placeholder="Nome completo" {...field} />
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
                          <Input placeholder="Cargo" {...field} value={field.value || ""} />
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
                          <Input placeholder="SIAPE" {...field} value={field.value || ""} />
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
                          <Input placeholder="Telefone" {...field} value={field.value || ""} />
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
                          <Input placeholder="CPF" {...field} value={field.value || ""} />
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
                          <Input type="email" placeholder="email@ufvjm.edu.br" {...field} />
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
                          <Input placeholder="Departamento" {...field} value={field.value || ""} />
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
                          <div className="relative">
                            <Input 
                              type={showPassword ? "text" : "password"} 
                              placeholder="Senha para acesso ao sistema" 
                              {...field} 
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                              onClick={() => setShowPassword(!showPassword)}
                            >
                              {showPassword ? (
                                <EyeOff className="h-4 w-4" />
                              ) : (
                                <Eye className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Perfil Section */}
                {!editingAdvisor && (
                  <div className="space-y-4 border-t pt-4">
                    <h3 className="text-lg font-semibold">Perfil de Acesso</h3>
                    <div className="space-y-3">
                      <FormField
                        control={form.control}
                        name="isSystemAdmin"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                            <FormControl>
                              <Checkbox
                                checked={field.value}
                                onCheckedChange={(checked) => {
                                  field.onChange(checked);
                                  if (checked) {
                                    form.setValue("isInternshipCoordinator", false);
                                    form.setValue("isProfessor", false);
                                  }
                                }}
                              />
                            </FormControl>
                            <FormLabel className="text-sm font-normal">
                              ☑️ Administrador do Sistema - Acesso total ao sistema
                            </FormLabel>
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
                                onCheckedChange={(checked) => {
                                  field.onChange(checked);
                                  if (checked) {
                                    form.setValue("isSystemAdmin", false);
                                    form.setValue("isProfessor", false);
                                  }
                                }}
                              />
                            </FormControl>
                            <FormLabel className="text-sm font-normal text-blue-600">
                              📋 Coordenador do Estágio - Apenas para inserir em relatórios
                            </FormLabel>
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="isProfessor"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                            <FormControl>
                              <Checkbox
                                checked={field.value}
                                onCheckedChange={(checked) => {
                                  field.onChange(checked);
                                  if (checked) {
                                    form.setValue("isSystemAdmin", false);
                                    form.setValue("isInternshipCoordinator", false);
                                  }
                                }}
                              />
                            </FormControl>
                            <FormLabel className="text-sm font-normal text-orange-600">
                              👨‍🏫 Professor - Acesso limitado ao sistema
                            </FormLabel>
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                )}

                <div className="flex justify-end space-x-2 pt-4">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    ❌ Cancelar
                  </Button>
                  <Button 
                    type="submit"
                    disabled={registerMutation.isPending || updateMutation.isPending}
                    className="bg-blue-600 hover:bg-blue-700"
                    data-testid="button-submit-advisor"
                  >
                    {registerMutation.isPending || updateMutation.isPending ? "Salvando..." : 
                     editingAdvisor ? "💾 Atualizar" : "💾 Salvar"}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Advisors Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Users className="h-5 w-5" />
            <span>Lista de Orientadores</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow className="bg-blue-50">
                  <TableHead className="font-semibold">ID</TableHead>
                  <TableHead className="font-semibold">Nome</TableHead>
                  <TableHead className="font-semibold">Cargo</TableHead>
                  <TableHead className="font-semibold">SIAPE</TableHead>
                  <TableHead className="font-semibold">Departamento</TableHead>
                  <TableHead className="font-semibold">Email</TableHead>
                  <TableHead className="font-semibold">Perfil</TableHead>
                  <TableHead className="font-semibold">Status</TableHead>
                  <TableHead className="font-semibold text-center">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAdvisors.map((advisor, index) => (
                  <TableRow key={advisor.id} className="hover:bg-gray-50">
                    <TableCell className="font-mono text-sm">
                      {index + 1}
                    </TableCell>
                    <TableCell className="font-medium">
                      {advisor.name}
                    </TableCell>
                    <TableCell>
                      {advisor.position || "N/A"}
                    </TableCell>
                    <TableCell className="font-mono">
                      {advisor.siape || "N/A"}
                    </TableCell>
                    <TableCell>
                      {advisor.department || "N/A"}
                    </TableCell>
                    <TableCell>
                      {advisor.email || "N/A"}
                    </TableCell>
                    <TableCell>
                      {advisor.isSystemAdmin && (
                        <Badge variant="destructive" className="mr-1">
                          Administrador do Sistema
                        </Badge>
                      )}
                      {advisor.isInternshipCoordinator && (
                        <Badge variant="secondary" className="mr-1">
                          Coordenador do Estágio
                        </Badge>
                      )}
                      {!advisor.isSystemAdmin && !advisor.isInternshipCoordinator && (
                        <Badge variant="outline">
                          Professor
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={advisor.isActive ? "default" : "secondary"}>
                        {advisor.isActive ? "Ativo" : "Inativo"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(advisor)}
                          data-testid={`button-edit-advisor-${advisor.id}`}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        {currentUser?.role === "administrator" && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDelete(advisor.id)}
                            className="text-red-600 hover:text-red-700"
                            data-testid={`button-delete-advisor-${advisor.id}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {filteredAdvisors.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                {searchTerm ? "Nenhum orientador encontrado com os critérios de busca." : "Nenhum orientador cadastrado ainda."}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}