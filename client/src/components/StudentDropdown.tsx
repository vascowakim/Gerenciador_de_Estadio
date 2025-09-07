import { useQuery } from "@tanstack/react-query";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FormControl } from "@/components/ui/form";
import { User } from "lucide-react";

interface Student {
  id: string;
  name: string;
  registrationNumber: string;
  email: string;
  course: string;
  isActive: boolean;
}

interface StudentDropdownProps {
  value?: string;
  onChange: (studentId: string) => void;
  placeholder?: string;
  disabled?: boolean;
}

export function StudentDropdown({ 
  value, 
  onChange, 
  placeholder = "Selecione um estudante...",
  disabled = false 
}: StudentDropdownProps) {
  const { data: students, isLoading } = useQuery<Student[]>({
    queryKey: ["/api/students"],
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const selectedStudent = students?.find(student => student.id === value);

  return (
    <div className="space-y-2">
      <FormControl>
        <Select 
          value={value || ""} 
          onValueChange={onChange}
          disabled={disabled || isLoading}
        >
          <SelectTrigger className="w-full" data-testid="select-student">
            <SelectValue placeholder={isLoading ? "Carregando estudantes..." : placeholder} />
          </SelectTrigger>
          <SelectContent>
            {students && students.length > 0 ? (
              students.map((student) => (
                <SelectItem 
                  key={student.id} 
                  value={student.id}
                  data-testid={`student-option-${student.id}`}
                >
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-gray-500" />
                    <div className="flex flex-col">
                      <span className="font-medium">{student.name}</span>
                      <span className="text-xs text-gray-500">
                        {student.registrationNumber} - {student.course}
                      </span>
                    </div>
                  </div>
                </SelectItem>
              ))
            ) : (
              <SelectItem value="" disabled>
                {isLoading ? "Carregando..." : "Nenhum estudante cadastrado"}
              </SelectItem>
            )}
          </SelectContent>
        </Select>
      </FormControl>

      {selectedStudent && (
        <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-md">
          <div className="flex items-start gap-2">
            <User className="h-4 w-4 text-blue-600 mt-0.5" />
            <div className="flex-1 text-sm">
              <p className="font-medium text-blue-900">{selectedStudent.name}</p>
              <p className="text-blue-700">
                <strong>Matrícula:</strong> {selectedStudent.registrationNumber}
              </p>
              <p className="text-blue-700">
                <strong>Curso:</strong> {selectedStudent.course}
              </p>
              <p className="text-blue-700">
                <strong>Email:</strong> {selectedStudent.email}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}