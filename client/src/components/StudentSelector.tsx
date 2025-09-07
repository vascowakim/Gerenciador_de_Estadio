import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormControl } from "@/components/ui/form";
import { Search, User, X } from "lucide-react";
import { StudentSearchModal } from "./StudentSearchModal";

interface Student {
  id: string;
  name: string;
  registrationNumber: string;
  email: string;
  course: string;
  isActive: boolean;
}

interface StudentSelectorProps {
  value?: string;
  onChange: (studentId: string) => void;
  placeholder?: string;
  disabled?: boolean;
}

export function StudentSelector({ 
  value, 
  onChange, 
  placeholder = "Selecione um estudante",
  disabled = false 
}: StudentSelectorProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);

  const handleSelectStudent = (student: Student) => {
    setSelectedStudent(student);
    onChange(student.id);
  };

  const handleClearSelection = () => {
    setSelectedStudent(null);
    onChange("");
  };

  const handleOpenModal = () => {
    if (!disabled) {
      setIsModalOpen(true);
    }
  };

  return (
    <>
      <div className="flex gap-2">
        <FormControl>
          <div className="relative flex-1">
            <Input
              value={selectedStudent ? `${selectedStudent.name} - ${selectedStudent.registrationNumber}` : ""}
              placeholder={placeholder}
              readOnly
              className={`pr-20 ${selectedStudent ? "bg-blue-50 border-blue-200" : ""}`}
              data-testid="input-selected-student"
            />
            {selectedStudent && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-12 top-1/2 -translate-y-1/2 h-6 w-6 p-0 hover:bg-red-100"
                onClick={handleClearSelection}
                data-testid="button-clear-student"
              >
                <X className="h-3 w-3 text-red-500" />
              </Button>
            )}
          </div>
        </FormControl>
        
        <Button
          type="button"
          variant="outline"
          onClick={handleOpenModal}
          disabled={disabled}
          className="flex items-center gap-2 whitespace-nowrap"
          data-testid="button-search-student"
        >
          <Search className="h-4 w-4" />
          Buscar
        </Button>
      </div>

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

      <StudentSearchModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSelectStudent={handleSelectStudent}
        selectedStudentId={value}
      />
    </>
  );
}