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
  User as UserIcon,
  CheckCircle
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import DocumentUpload from "@/components/DocumentUpload";

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
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="bg-blue-600 text-white p-6 rounded-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <FileText className="h-8 w-8" />
            <div>
              <h1 className="text-2xl font-bold">Controle de Estágio Obrigatório</h1>
              <p className="text-blue-100">
                Estudante: {student?.name} - {internship.companyName}
              </p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold">{Math.round((partialWorkload / totalWorkload) * 100)}%</div>
            <div className="text-blue-100">Progresso</div>
          </div>
        </div>
      </div>

      {/* Workload and Progress Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Clock className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm text-gray-600">Carga Horária Total</p>
                <p className="text-2xl font-bold text-blue-600">{totalWorkload}h</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm text-gray-600">Horas Cumpridas</p>
                <p className="text-2xl font-bold text-green-600">{partialWorkload}h</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Calendar className="h-5 w-5 text-orange-600" />
              <div>
                <p className="text-sm text-gray-600">Horas Restantes</p>
                <p className="text-2xl font-bold text-orange-600">{remainingWorkload}h</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Workload Update Form */}
      <Card>
        <CardHeader>
          <CardTitle>Atualizar Carga Horária</CardTitle>
          <CardDescription>
            Registre as horas cumpridas pelo estudante
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...workloadForm}>
            <form onSubmit={workloadForm.handleSubmit(onSubmitWorkload)} className="space-y-4">
              <div className="flex items-end space-x-4">
                <FormField
                  control={workloadForm.control}
                  name="hoursWorked"
                  render={({ field }) => (
                    <FormItem className="flex-1">
                      <FormLabel>Horas Trabalhadas</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          placeholder="0" 
                          {...field}
                          onChange={(e) => field.onChange(Number(e.target.value))}
                          data-testid="input-hours-worked"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button 
                  type="submit" 
                  disabled={updateWorkloadMutation.isPending}
                  data-testid="button-update-workload"
                >
                  {updateWorkloadMutation.isPending ? "Atualizando..." : "Atualizar"}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>

      {/* Document Management Section */}
      {internshipData && (
        <DocumentUpload
          internshipId={internshipData.id}
          internshipType="mandatory"
          canUpload={true}
          canReview={user?.role === "administrator"}
        />
      )}
    </div>
  );
}
