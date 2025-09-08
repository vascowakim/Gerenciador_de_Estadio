import { useState } from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useQuery } from "@tanstack/react-query";

type Student = {
  id: string;
  name: string;
  registrationNumber: string;
  course: string;
};

interface StudentComboboxProps {
  value?: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
}

export function StudentCombobox({ 
  value, 
  onValueChange, 
  placeholder = "Selecione um estudante...",
  disabled = false 
}: StudentComboboxProps) {
  const [open, setOpen] = useState(false);

  const { data: students = [] } = useQuery<Student[]>({
    queryKey: ['/api/students'],
  });

  const selectedStudent = students.find((student) => student.id === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
          disabled={disabled}
          data-testid="select-student"
        >
          {selectedStudent
            ? `${selectedStudent.name} - ${selectedStudent.registrationNumber}`
            : placeholder}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0" align="start">
        <Command>
          <CommandInput 
            placeholder="Digite o nome do estudante..." 
            className="h-9"
          />
          <CommandEmpty>Nenhum estudante encontrado.</CommandEmpty>
          <CommandGroup className="max-h-[200px] overflow-y-auto">
            {students.map((student) => (
              <CommandItem
                key={student.id}
                value={`${student.name} ${student.registrationNumber} ${student.course}`}
                onSelect={() => {
                  onValueChange(student.id);
                  setOpen(false);
                }}
                data-testid={`option-student-${student.id}`}
              >
                <Check
                  className={cn(
                    "mr-2 h-4 w-4",
                    value === student.id ? "opacity-100" : "opacity-0"
                  )}
                />
                <div className="flex flex-col">
                  <span className="font-medium">{student.name}</span>
                  <span className="text-sm text-muted-foreground">
                    {student.registrationNumber} • {student.course}
                  </span>
                </div>
              </CommandItem>
            ))}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  );
}