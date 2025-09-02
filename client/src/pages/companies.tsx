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
import { Plus, Pencil, Trash2, Search } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertCompanySchema, type Company } from "@shared/schema";
import { AuthService } from "@/lib/auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";

export default function Companies() {
  const [location, setLocation] = useLocation();
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCompany, setEditingCompany] = useState<Company | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  const form = useForm({
    resolver: zodResolver(insertCompanySchema),
    defaultValues: {
      name: "",
      cnpj: "",
      email: "",
      phone: "",
      address: "",
      city: "",
      state: "",
      sector: "",
      contactPerson: "",
      website: "",
      isActive: true,
    },
  });

  // Check authentication
  const { data: user, isLoading: authLoading } = useQuery({
    queryKey: ["/api/auth/me"],
  });

  // Fetch companies
  const { data: companies, isLoading } = useQuery({
    queryKey: ["/api/companies"],
    enabled: !!user,
  });

  // Create company mutation
  const createMutation = useMutation({
    mutationFn: (data: any) => apiRequest("/api/companies", {
      method: "POST",
      body: JSON.stringify(data),
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/companies"] });
      setIsDialogOpen(false);
      form.reset();
      toast({
        title: "Sucesso",
        description: "Empresa criada com sucesso!",
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Erro ao criar empresa",
        variant: "destructive",
      });
    },
  });

  // Update company mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => 
      apiRequest(`/api/companies/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/companies"] });
      setIsDialogOpen(false);
      setEditingCompany(null);
      form.reset();
      toast({
        title: "Sucesso",
        description: "Empresa atualizada com sucesso!",
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Erro ao atualizar empresa",
        variant: "destructive",
      });
    },
  });

  // Delete company mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiRequest(`/api/companies/${id}`, {
      method: "DELETE",
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/companies"] });
      toast({
        title: "Sucesso",
        description: "Empresa excluída com sucesso!",
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Erro ao excluir empresa",
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
    if (editingCompany) {
      updateMutation.mutate({ id: editingCompany.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleEdit = (company: Company) => {
    setEditingCompany(company);
    form.reset({
      ...company,
      cnpj: company.cnpj || "",
      phone: company.phone || "",
      address: company.address || "",
      city: company.city || "",
      state: company.state || "",
      sector: company.sector || "",
      contactPerson: company.contactPerson || "",
      website: company.website || ""
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm("Tem certeza que deseja excluir esta empresa?")) {
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
            <h1 className="text-xl font-semibold" data-testid="text-companies-title">Gestão de Empresas</h1>
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
                      setEditingCompany(null);
                      form.reset({
                        name: "",
                        cnpj: "",
                        email: "",
                        phone: "",
                        address: "",
                        city: "",
                        state: "",
                        sector: "",
                        contactPerson: "",
                        website: "",
                        isActive: true,
                      });
                    }}
                    data-testid="button-add-company"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Novo Cadastro
                  </Button>
                </DialogTrigger>

                <DialogContent className="max-w-4xl">
                  <DialogHeader>
                    <DialogTitle>
                      {editingCompany ? "Editar Empresa" : "Nova Empresa"}
                    </DialogTitle>
                    <DialogDescription>
                      {editingCompany 
                        ? "Edite as informações da empresa"
                        : "Adicione uma nova empresa ao sistema"
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
                              <FormLabel>Nome da Empresa</FormLabel>
                              <FormControl>
                                <Input placeholder="Digite o nome da empresa" {...field} data-testid="input-company-name" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="cnpj"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>CNPJ</FormLabel>
                              <FormControl>
                                <Input placeholder="00.000.000/0000-00" {...field} data-testid="input-company-cnpj" />
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
                                <Input type="email" placeholder="contato@empresa.com" {...field} data-testid="input-company-email" />
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
                                <Input placeholder="(XX) XXXXX-XXXX" {...field} data-testid="input-company-phone" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="city"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Cidade</FormLabel>
                              <FormControl>
                                <Input placeholder="Digite a cidade" {...field} data-testid="input-company-city" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="state"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Estado</FormLabel>
                              <FormControl>
                                <Input placeholder="Digite o estado" {...field} data-testid="input-company-state" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="sector"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Setor</FormLabel>
                              <FormControl>
                                <Input placeholder="Ex: Tecnologia, Saúde, Educação" {...field} data-testid="input-company-sector" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="contactPerson"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Pessoa de Contato</FormLabel>
                              <FormControl>
                                <Input placeholder="Nome do responsável" {...field} data-testid="input-company-contact" />
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
                              <Textarea placeholder="Digite o endereço completo" {...field} data-testid="input-company-address" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="website"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Website</FormLabel>
                            <FormControl>
                              <Input placeholder="https://www.empresa.com" {...field} data-testid="input-company-website" />
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
                          data-testid="button-save-company"
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

            {/* Companies Table with Search */}
            <div className="bg-white rounded-lg border">
              {/* Search Bar */}
              <div className="flex justify-between items-center p-4 border-b bg-blue-50">
                <h3 className="text-lg font-semibold text-blue-800">Lista de Empresas</h3>
                <div className="flex items-center space-x-2">
                  <Input 
                    placeholder="Busque por nome, CNPJ ou setor..."
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
                  <p>Carregando empresas...</p>
                </div>
              ) : !companies || companies.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500" data-testid="text-no-companies">Nenhuma empresa cadastrada</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="bg-blue-600 hover:bg-blue-600">
                      <TableHead className="text-white font-semibold">ID</TableHead>
                      <TableHead className="text-white font-semibold">Nome</TableHead>
                      <TableHead className="text-white font-semibold">CNPJ</TableHead>
                      <TableHead className="text-white font-semibold">Email</TableHead>
                      <TableHead className="text-white font-semibold">Telefone</TableHead>
                      <TableHead className="text-white font-semibold">Cidade</TableHead>
                      <TableHead className="text-white font-semibold">Setor</TableHead>
                      <TableHead className="text-white font-semibold">Contato</TableHead>
                      <TableHead className="text-white font-semibold">Data Cadastro</TableHead>
                      <TableHead className="text-white font-semibold">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {companies.filter((company: Company) => 
                      company.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                      (company.cnpj && company.cnpj.toLowerCase().includes(searchTerm.toLowerCase())) ||
                      (company.sector && company.sector.toLowerCase().includes(searchTerm.toLowerCase()))
                    ).map((company: Company, index: number) => (
                      <TableRow key={company.id} data-testid={`row-company-${company.id}`} className="hover:bg-gray-50">
                        <TableCell className="font-medium" data-testid={`text-company-id-${company.id}`}>
                          {index + 1}
                        </TableCell>
                        <TableCell className="font-medium" data-testid={`text-company-name-${company.id}`}>
                          {company.name}
                        </TableCell>
                        <TableCell data-testid={`text-company-cnpj-${company.id}`}>
                          {company.cnpj || "-"}
                        </TableCell>
                        <TableCell data-testid={`text-company-email-${company.id}`}>
                          {company.email}
                        </TableCell>
                        <TableCell data-testid={`text-company-phone-${company.id}`}>
                          {company.phone || "-"}
                        </TableCell>
                        <TableCell data-testid={`text-company-city-${company.id}`}>
                          {company.city || "-"}
                        </TableCell>
                        <TableCell data-testid={`text-company-sector-${company.id}`}>
                          {company.sector || "-"}
                        </TableCell>
                        <TableCell data-testid={`text-company-contact-${company.id}`}>
                          {company.contactPerson || "-"}
                        </TableCell>
                        <TableCell data-testid={`text-company-created-${company.id}`}>
                          {new Date(company.createdAt).toLocaleDateString('pt-BR')}
                        </TableCell>
                        <TableCell data-testid={`text-company-status-${company.id}`}>
                          <span className={`px-2 py-1 rounded text-xs ${
                            company.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {company.isActive ? 'Ativo' : 'Inativo'}
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