import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";

interface SemesterSelectorProps {
  value?: string;
  onValueChange: (value: string) => void;
  className?: string;
  label?: string;
}

export function SemesterSelector({ value, onValueChange, className, label = "Semestre" }: SemesterSelectorProps) {
  // Gerar lista de semestres baseado no ano atual
  const generateSemesters = () => {
    const currentYear = new Date().getFullYear();
    const semesters: { value: string; label: string }[] = [];
    
    // Incluir semestres dos últimos 5 anos e próximos 2 anos
    for (let year = currentYear - 5; year <= currentYear + 2; year++) {
      semesters.push(
        { value: `${year}-1`, label: `${year}.1` },
        { value: `${year}-2`, label: `${year}.2` }
      );
    }
    
    // Ordenar do mais recente para o mais antigo
    return semesters.reverse();
  };

  const semesters = generateSemesters();

  return (
    <div className={className}>
      <Label htmlFor="semester-selector" className="text-sm font-medium">
        {label}
      </Label>
      <Select value={value} onValueChange={onValueChange}>
        <SelectTrigger id="semester-selector" className="w-full">
          <SelectValue placeholder="Selecione o semestre" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todos os Semestres</SelectItem>
          {semesters.map((semester) => (
            <SelectItem key={semester.value} value={semester.value}>
              {semester.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}