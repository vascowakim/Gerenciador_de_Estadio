import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Upload, Eye, Trash2, CheckCircle, Clock, XCircle, AlertCircle } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { InternshipDocument } from "@shared/schema";

interface DocumentUploadProps {
  internshipId: string;
  internshipType: "mandatory" | "non_mandatory";
  canUpload?: boolean;
  canReview?: boolean;
}

const documentTypeLabels: Record<string, string> = {
  enrollment_certificate: "Certificado de Matrícula",
  insurance_policy: "Seguro de Acidentes Pessoais",
  internship_plan: "Plano de Estágio",
  activity_report: "Relatório de Atividades",
  final_report: "Relatório Final",
  company_evaluation: "Avaliação da Empresa",
  student_evaluation: "Avaliação do Estudante",
  attendance_sheet: "Folha de Frequência",
  other: "Outro",
};

const statusLabels: Record<string, { label: string; color: string; icon: React.ComponentType<any> }> = {
  pending: { label: "Pendente", color: "bg-yellow-100 text-yellow-800", icon: Clock },
  approved: { label: "Aprovado", color: "bg-green-100 text-green-800", icon: CheckCircle },
  rejected: { label: "Rejeitado", color: "bg-red-100 text-red-800", icon: XCircle },
  needs_revision: { label: "Precisa Revisão", color: "bg-orange-100 text-orange-800", icon: AlertCircle },
};

export default function DocumentUpload({ 
  internshipId, 
  internshipType, 
  canUpload = true, 
  canReview = false 
}: DocumentUploadProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedDocumentType, setSelectedDocumentType] = useState<string>("");

  // Buscar documentos existentes
  const { data: documents, isLoading } = useQuery({
    queryKey: ["/api/documents", internshipId, internshipType],
    queryFn: () => apiRequest(`/api/documents?internshipId=${internshipId}&internshipType=${internshipType}`),
  });

  // Mutation para obter URL de upload
  const getUploadUrlMutation = useMutation({
    mutationFn: () => apiRequest("/api/objects/upload", { method: "POST" }),
  });

  // Mutation para salvar documento no banco
  const saveDocumentMutation = useMutation({
    mutationFn: (documentData: any) => apiRequest("/api/documents", {
      method: "POST",
      body: JSON.stringify(documentData),
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/documents", internshipId, internshipType] });
      toast({
        title: "Sucesso",
        description: "Documento enviado com sucesso!",
      });
      setSelectedDocumentType("");
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Erro ao salvar documento. Tente novamente.",
        variant: "destructive",
      });
    },
  });

  // Mutation para atualizar status do documento
  const updateDocumentStatusMutation = useMutation({
    mutationFn: ({ id, status, comments }: { id: string; status: string; comments?: string }) =>
      apiRequest(`/api/documents/${id}`, {
        method: "PUT",
        body: JSON.stringify({ 
          status, 
          reviewComments: comments,
          reviewedBy: true // Indica que foi revisado
        }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/documents", internshipId, internshipType] });
      toast({
        title: "Sucesso",
        description: "Status do documento atualizado!",
      });
    },
  });

  // Mutation para deletar documento
  const deleteDocumentMutation = useMutation({
    mutationFn: (id: string) => apiRequest(`/api/documents/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/documents", internshipId, internshipType] });
      toast({
        title: "Sucesso",
        description: "Documento excluído com sucesso!",
      });
    },
  });

  const handleGetUploadParameters = async () => {
    const response = await getUploadUrlMutation.mutateAsync();
    return {
      method: "PUT" as const,
      url: response.uploadURL,
    };
  };

  const handleUploadComplete = (result: any) => {
    if (result.successful.length > 0 && selectedDocumentType) {
      const file = result.successful[0];
      const documentData = {
        internshipId,
        internshipType,
        documentType: selectedDocumentType,
        fileName: file.name,
        originalName: file.name,
        filePath: file.uploadURL,
        fileSize: file.size || 0,
        mimeType: file.type || "application/octet-stream",
        status: "pending",
      };

      saveDocumentMutation.mutate(documentData);
    }
  };

  const handleStatusUpdate = (documentId: string, newStatus: string) => {
    const comments = newStatus === "rejected" || newStatus === "needs_revision" 
      ? prompt("Comentários sobre a revisão (opcional):") || ""
      : "";
    
    updateDocumentStatusMutation.mutate({ 
      id: documentId, 
      status: newStatus, 
      comments 
    });
  };

  const handleDeleteDocument = (documentId: string) => {
    if (confirm("Tem certeza que deseja excluir este documento?")) {
      deleteDocumentMutation.mutate(documentId);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("pt-BR");
  };

  if (isLoading) {
    return <div>Carregando documentos...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Upload de novos documentos */}
      {canUpload && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Upload className="mr-2 h-5 w-5" />
              Enviar Documento
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Tipo de Documento
                </label>
                <Select value={selectedDocumentType} onValueChange={setSelectedDocumentType}>
                  <SelectTrigger data-testid="select-document-type">
                    <SelectValue placeholder="Selecione o tipo de documento" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(documentTypeLabels).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedDocumentType && (
                <div className="space-y-2">
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        try {
                          // Obter URL de upload
                          const uploadParams = await handleGetUploadParameters();
                          
                          // Upload do arquivo
                          const uploadResponse = await fetch(uploadParams.url, {
                            method: uploadParams.method,
                            body: file,
                            headers: {
                              'Content-Type': file.type,
                            },
                          });

                          if (uploadResponse.ok) {
                            // Simular resultado do Uppy para compatibilidade
                            const result = {
                              successful: [{
                                name: file.name,
                                size: file.size,
                                type: file.type,
                                uploadURL: uploadParams.url.split('?')[0], // Remove query params
                              }],
                              failed: []
                            };
                            handleUploadComplete(result as any);
                          } else {
                            toast({
                              title: "Erro",
                              description: "Erro ao enviar arquivo. Tente novamente.",
                              variant: "destructive",
                            });
                          }
                        } catch (error) {
                          toast({
                            title: "Erro",
                            description: "Erro ao enviar arquivo. Tente novamente.",
                            variant: "destructive",
                          });
                        }
                      }
                    }}
                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                    data-testid="input-file-upload"
                  />
                  <p className="text-xs text-gray-500">
                    Formatos aceitos: PDF, DOC, DOCX, JPG, JPEG, PNG (máx. 10MB)
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Lista de documentos */}
      <Card>
        <CardHeader>
          <CardTitle>Documentos do Estágio</CardTitle>
        </CardHeader>
        <CardContent>
          {documents && documents.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Nome do Arquivo</TableHead>
                  <TableHead>Tamanho</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Data de Upload</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {documents.map((doc: InternshipDocument) => {
                  const StatusIcon = statusLabels[doc.status]?.icon || Clock;
                  return (
                    <TableRow key={doc.id}>
                      <TableCell>{documentTypeLabels[doc.documentType] || doc.documentType}</TableCell>
                      <TableCell>{doc.originalName}</TableCell>
                      <TableCell>{formatFileSize(doc.fileSize)}</TableCell>
                      <TableCell>
                        <Badge className={statusLabels[doc.status]?.color || "bg-gray-100 text-gray-800"}>
                          <StatusIcon className="w-3 h-3 mr-1" />
                          {statusLabels[doc.status]?.label || doc.status}
                        </Badge>
                      </TableCell>
                      <TableCell>{formatDate(doc.createdAt)}</TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => window.open(doc.filePath, "_blank")}
                            data-testid={`button-view-${doc.id}`}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          
                          {canReview && doc.status === "pending" && (
                            <>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleStatusUpdate(doc.id, "approved")}
                                className="text-green-600 hover:text-green-700"
                                data-testid={`button-approve-${doc.id}`}
                              >
                                <CheckCircle className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleStatusUpdate(doc.id, "rejected")}
                                className="text-red-600 hover:text-red-700"
                                data-testid={`button-reject-${doc.id}`}
                              >
                                <XCircle className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                          
                          {canUpload && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDeleteDocument(doc.id)}
                              className="text-red-600 hover:text-red-700"
                              data-testid={`button-delete-${doc.id}`}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8 text-gray-500">
              Nenhum documento enviado ainda.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}