import { useState, useEffect } from "react";
import { useParams } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import { 
  ArrowLeft, 
  Clock, 
  FileText, 
  Upload, 
  Check, 
  X,
  Users,
  Building,
  Calendar,
  User as UserIcon
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";

import type { User, MandatoryInternship, Student, Advisor, Company } from "@shared/schema";

const workloadSchema = z.object({
  partialWorkload: z.number().min(0, "Carga horária parcial deve ser positiva"),
  notes: z.string().optional(),
});

type WorkloadForm = z.infer<typeof workloadSchema>;

const reportSchema = z.object({
  reportType: z.enum(["partial", "final"]),
  reportNumber: z.number().min(1).max(10),
  file: z.any().optional(),
  notes: z.string().optional(),
});

type ReportForm = z.infer<typeof reportSchema>;

export default function MandatoryInternshipControl() {
  const { id } = useParams();
  const { toast } = useToast();
  const [uploadedReports, setUploadedReports] = useState<{[key: string]: boolean}>({});

  // Auth check
  const { data: user, isLoading: authLoading } = useQuery({
    queryKey: ["/api/auth/me"],
  });

  // Fetch internship data
  const { data: internship, isLoading: internshipLoading } = useQuery({
    queryKey: [`/api/mandatory-internships/${id}`],
    enabled: !!user && !!id,
  });

  // Fetch related data
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

  // Workload form
  const workloadForm = useForm<WorkloadForm>({
    resolver: zodResolver(workloadSchema),
    defaultValues: {
      partialWorkload: 0,
      notes: "",
    },
  });

  // Update workload mutation
  const updateWorkloadMutation = useMutation({
    mutationFn: async (data: WorkloadForm) => {
      const response = await apiRequest("PUT", `/api/mandatory-internships/${id}/workload`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/mandatory-internships/${id}`] });
      toast({
        title: "Sucesso",
        description: "Carga horária atualizada com sucesso!",
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Erro ao atualizar carga horária",
        variant: "destructive",
      });
    },
  });

  // Report upload mutation
  const uploadReportMutation = useMutation({
    mutationFn: async ({ reportType, reportNumber, file }: { reportType: string; reportNumber: number; file: File }) => {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("reportType", reportType);
      formData.append("reportNumber", reportNumber.toString());
      
      const response = await fetch(`/api/mandatory-internships/${id}/reports`, {
        method: "POST",
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error("Erro ao fazer upload do relatório");
      }
      
      return response.json();
    },
    onSuccess: (_, variables) => {
      setUploadedReports(prev => ({
        ...prev,
        [`${variables.reportType}-${variables.reportNumber}`]: true
      }));
      queryClient.invalidateQueries({ queryKey: [`/api/mandatory-internships/${id}`] });
      toast({
        title: "Sucesso",
        description: "Relatório enviado com sucesso!",
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Erro ao enviar relatório",
        variant: "destructive",
      });
    },
  });

  if (authLoading || internshipLoading) {
    return <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <p>Carregando...</p>
    </div>;
  }

  if (!user) {
    return <div>Redirecionando...</div>;
  }

  if (!internship) {
    return <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <p>Estágio não encontrado</p>
    </div>;
  }

  const student = students?.find((s: Student) => s.id === internship.studentId);
  const advisor = advisors?.find((a: Advisor) => a.id === internship.advisorId);
  const company = companies?.find((c: Company) => c.id === internship.companyId);

  const totalWorkload = 390; // Default para estágio obrigatório
  const partialWorkload = internship.partialWorkload || 0;
  const remainingWorkload = totalWorkload - partialWorkload;

  const onSubmitWorkload = (data: WorkloadForm) => {
    updateWorkloadMutation.mutate(data);
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>, reportType: string, reportNumber: number) => {
    const file = event.target.files?.[0];
    if (file) {
      uploadReportMutation.mutate({ reportType, reportNumber, file });
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="flex">
        <Sidebar user={user} />
        <main className="flex-1">
          {/* Top Header Bar */}
          <div className="bg-blue-600 text-white px-6 py-3 flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => window.history.back()}
                className="text-white hover:bg-blue-700"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar
              </Button>
              <h1 className="text-xl font-semibold">Controle de Estágio Obrigatório</h1>
            </div>
            <div className="flex items-center space-x-4 text-sm">
              <span>🧑‍💼 {user.role === "administrator" ? "Administrador" : "Professor"}</span>
            </div>
          </div>

          <div className="p-6 space-y-6">
            {/* Informações do Estágio */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <FileText className="h-5 w-5" />
                  <span>Informações do Estágio</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <UserIcon className="h-4 w-4 text-gray-500" />
                      <span className="font-semibold">Estudante</span>
                    </div>
                    <p className="text-sm">{student?.name || "N/A"}</p>
                    <p className="text-xs text-gray-500">Matrícula: {student?.registrationNumber || "N/A"}</p>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Users className="h-4 w-4 text-gray-500" />
                      <span className="font-semibold">Orientador</span>
                    </div>
                    <p className="text-sm">{advisor?.name || "N/A"}</p>
                    <p className="text-xs text-gray-500">SIAPE: {advisor?.siape || "N/A"}</p>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Building className="h-4 w-4 text-gray-500" />
                      <span className="font-semibold">Empresa</span>
                    </div>
                    <p className="text-sm">{company?.name || "N/A"}</p>
                    <p className="text-xs text-gray-500">Supervisor: {internship.supervisor || "N/A"}</p>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Calendar className="h-4 w-4 text-gray-500" />
                      <span className="font-semibold">Período</span>
                    </div>
                    <p className="text-sm">
                      {internship.startDate ? format(new Date(internship.startDate), "dd/MM/yyyy") : "N/A"}
                      {" - "}
                      {internship.endDate ? format(new Date(internship.endDate), "dd/MM/yyyy") : "N/A"}
                    </p>
                    <Badge variant={internship.status === "active" ? "default" : "secondary"}>
                      {internship.status === "active" ? "Ativo" : 
                       internship.status === "completed" ? "Concluído" : 
                       internship.status === "cancelled" ? "Cancelado" : "Pendente"}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Controle de Carga Horária */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Clock className="h-5 w-5" />
                  <span>Controle de Carga Horária</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <h3 className="font-semibold text-blue-800">CH Total</h3>
                    <p className="text-2xl font-bold text-blue-600">{totalWorkload}h</p>
                  </div>
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <h3 className="font-semibold text-green-800">CH Parcial</h3>
                    <p className="text-2xl font-bold text-green-600">{partialWorkload}h</p>
                  </div>
                  <div className="text-center p-4 bg-orange-50 rounded-lg">
                    <h3 className="font-semibold text-orange-800">CH Restante</h3>
                    <p className="text-2xl font-bold text-orange-600">{remainingWorkload}h</p>
                  </div>
                </div>

                <form onSubmit={workloadForm.handleSubmit(onSubmitWorkload)} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="partialWorkload">Atualizar CH Parcial (horas)</Label>
                      <Input
                        id="partialWorkload"
                        type="number"
                        min="0"
                        max={totalWorkload}
                        {...workloadForm.register("partialWorkload", { valueAsNumber: true })}
                        placeholder="Digite as horas cumpridas"
                      />
                      {workloadForm.formState.errors.partialWorkload && (
                        <p className="text-red-500 text-sm">{workloadForm.formState.errors.partialWorkload.message}</p>
                      )}
                    </div>
                    <div>
                      <Label htmlFor="notes">Observações (opcional)</Label>
                      <Input
                        id="notes"
                        {...workloadForm.register("notes")}
                        placeholder="Observações sobre a carga horária"
                      />
                    </div>
                  </div>
                  <Button 
                    type="submit" 
                    disabled={updateWorkloadMutation.isPending}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    {updateWorkloadMutation.isPending ? "Salvando..." : "Salvar CH Parcial"}
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Controle de Relatórios */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Upload className="h-5 w-5" />
                  <span>Controle de Relatórios</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {/* Relatórios Parciais */}
                  <div>
                    <h3 className="font-semibold mb-4">Relatórios Parciais (R1-R9)</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => {
                        const isUploaded = uploadedReports[`partial-${num}`] || internship[`r${num}` as keyof MandatoryInternship];
                        return (
                          <div key={num} className="p-4 border rounded-lg">
                            <div className="flex items-center justify-between mb-2">
                              <span className="font-medium">Relatório R{num}</span>
                              {isUploaded ? (
                                <Check className="h-5 w-5 text-green-600" />
                              ) : (
                                <X className="h-5 w-5 text-red-600" />
                              )}
                            </div>
                            <div className="space-y-2">
                              <input
                                type="file"
                                accept=".pdf,.doc,.docx"
                                onChange={(e) => handleFileUpload(e, "partial", num)}
                                className="text-sm"
                                disabled={uploadReportMutation.isPending}
                              />
                              <div className="flex items-center space-x-2">
                                <Checkbox 
                                  checked={!!isUploaded}
                                  disabled
                                />
                                <span className="text-sm text-gray-600">
                                  {isUploaded ? "Anexado" : "Pendente"}
                                </span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Relatório Final */}
                  <div>
                    <h3 className="font-semibold mb-4">Relatório Final (R10)</h3>
                    <div className="p-4 border rounded-lg bg-yellow-50">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium">Relatório Final R10</span>
                        {uploadedReports["final-10"] || internship.r10 ? (
                          <Check className="h-5 w-5 text-green-600" />
                        ) : (
                          <X className="h-5 w-5 text-red-600" />
                        )}
                      </div>
                      <div className="space-y-2">
                        <input
                          type="file"
                          accept=".pdf,.doc,.docx"
                          onChange={(e) => handleFileUpload(e, "final", 10)}
                          className="text-sm"
                          disabled={uploadReportMutation.isPending}
                        />
                        <div className="flex items-center space-x-2">
                          <Checkbox 
                            checked={!!(uploadedReports["final-10"] || internship.r10)}
                            disabled
                          />
                          <span className="text-sm text-gray-600">
                            {uploadedReports["final-10"] || internship.r10 ? "Anexado" : "Pendente"}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
}