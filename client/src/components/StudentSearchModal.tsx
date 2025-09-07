import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Search, User, UserCheck } from "lucide-react";

interface Student {
  id: string;
  name: string;
  registrationNumber: string;
  email: string;
  course: string;
  isActive: boolean;
}

interface StudentSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectStudent: (student: Student) => void;
  selectedStudentId?: string;
}

export function StudentSearchModal({ 
  isOpen, 
  onClose, 
  onSelectStudent, 
  selectedStudentId 
}: StudentSearchModalProps) {
  const [searchTerm, setSearchTerm] = useState("");

  const { data: students, isLoading, error, refetch } = useQuery<Student[]>({
    queryKey: ["/api/students"],
    enabled: isOpen,
    retry: 3,
    staleTime: 0, // Always fresh data in production
    cacheTime: 5 * 60 * 1000, // Keep in cache for 5 minutes
    refetchOnMount: true,
    refetchOnWindowFocus: false,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 5000),
  });

  // Force refetch when modal opens if no data
  useEffect(() => {
    if (isOpen && !students && !isLoading) {
      refetch();
    }
  }, [isOpen, students, isLoading, refetch]);

  // Filtrar estudantes baseado no termo de busca
  // Se não há termo de busca, mostra todos os estudantes
  const filteredStudents = searchTerm.trim() === "" 
    ? students 
    : students?.filter(student =>
        student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.registrationNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.course.toLowerCase().includes(searchTerm.toLowerCase())
      );

  const handleSelectStudent = (student: Student) => {
    onSelectStudent(student);
    onClose();
    setSearchTerm(""); // Limpar busca quando fechar
  };

  const handleClose = () => {
    onClose();
    setSearchTerm(""); // Limpar busca quando fechar
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Buscar Estudante
          </DialogTitle>
          <DialogDescription>
            Pesquise e selecione um estudante para cadastrar no estágio
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Campo de busca */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Buscar por nome, matrícula, email ou curso..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
              data-testid="input-search-students"
            />
          </div>

          {/* Lista de estudantes */}
          <ScrollArea className="h-[400px] border rounded-md p-2">
            {isLoading ? (
              <div className="text-center p-8">
                <div className="animate-pulse">
                  <User className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                  <p className="text-gray-500">Carregando estudantes...</p>
                </div>
              </div>
            ) : filteredStudents && filteredStudents.length > 0 ? (
              <div className="space-y-2">
                {filteredStudents.map((student) => (
                  <div
                    key={student.id}
                    className={`p-4 border rounded-lg cursor-pointer transition-all hover:bg-gray-50 ${
                      selectedStudentId === student.id 
                        ? "border-blue-500 bg-blue-50" 
                        : "border-gray-200"
                    }`}
                    onClick={() => handleSelectStudent(student)}
                    data-testid={`student-item-${student.id}`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-gray-500" />
                          <h4 className="font-medium">{student.name}</h4>
                          {selectedStudentId === student.id && (
                            <UserCheck className="h-4 w-4 text-blue-600" />
                          )}
                        </div>
                        <div className="mt-1 space-y-1">
                          <p className="text-sm text-gray-600">
                            <strong>Matrícula:</strong> {student.registrationNumber}
                          </p>
                          <p className="text-sm text-gray-600">
                            <strong>Email:</strong> {student.email}
                          </p>
                          <p className="text-sm text-gray-600">
                            <strong>Curso:</strong> {student.course}
                          </p>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <Badge variant={student.isActive ? "default" : "secondary"}>
                          {student.isActive ? "Ativo" : "Inativo"}
                        </Badge>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : error ? (
              <div className="text-center p-8">
                <User className="h-12 w-12 mx-auto mb-4 text-red-400" />
                <p className="text-red-500 mb-2">Erro ao carregar estudantes</p>
                <p className="text-sm text-gray-500">{error.message}</p>
              </div>
            ) : filteredStudents && filteredStudents.length === 0 ? (
              <div className="text-center p-8">
                <User className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <p className="text-gray-500">
                  {searchTerm.trim() !== ""
                    ? `Nenhum estudante encontrado para "${searchTerm}"`
                    : "Nenhum estudante cadastrado no sistema"
                  }
                </p>
                {searchTerm.trim() === "" && (
                  <Button 
                    variant="outline" 
                    onClick={() => refetch()}
                    className="mt-4"
                  >
                    Tentar novamente
                  </Button>
                )}
              </div>
            ) : null}
          </ScrollArea>

          {/* Rodapé com informações */}
          <div className="flex items-center justify-between text-sm text-gray-500 pt-2 border-t">
            <span>
              {filteredStudents?.length || 0} estudante(s)
              {searchTerm.trim() !== "" && ` encontrado(s) para "${searchTerm}"`}
            </span>
            <Button variant="outline" onClick={handleClose}>
              Cancelar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}