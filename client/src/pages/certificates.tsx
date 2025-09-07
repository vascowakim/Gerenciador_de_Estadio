import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { Award, Users, GraduationCap, BookOpen } from "lucide-react";

export default function Certificates() {
  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Central de Certificados</h1>
          <p className="text-muted-foreground">
            Selecione o tipo de certificado que deseja gerar
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Certificados de Orientador */}
        <Card className="hover:shadow-lg transition-shadow cursor-pointer group">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center group-hover:bg-purple-200 transition-colors">
              <Users className="h-8 w-8 text-purple-600" />
            </div>
            <CardTitle className="text-lg">Certificados de Orientador</CardTitle>
            <CardDescription>
              Certificados para professores orientadores de estágios
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <ul className="text-sm text-muted-foreground mb-4 space-y-1">
              <li>• Certificados de orientação</li>
              <li>• Validação de supervisão</li>
              <li>• Histórico de orientações</li>
            </ul>
            <Link href="/advisor-certificates">
              <Button className="w-full" data-testid="button-advisor-certificates">
                <Award className="w-4 h-4 mr-2" />
                Acessar Certificados
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Certificados de Alunos */}
        <Card className="hover:shadow-lg transition-shadow cursor-pointer group">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center group-hover:bg-emerald-200 transition-colors">
              <GraduationCap className="h-8 w-8 text-emerald-600" />
            </div>
            <CardTitle className="text-lg">Certificados de Alunos</CardTitle>
            <CardDescription>
              Certificados para estudantes em estágios obrigatórios e não obrigatórios
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <ul className="text-sm text-muted-foreground mb-4 space-y-1">
              <li>• Estágios obrigatórios</li>
              <li>• Estágios não obrigatórios</li>
              <li>• Certificados de conclusão</li>
            </ul>
            <Link href="/student-certificates">
              <Button className="w-full" data-testid="button-student-certificates">
                <Award className="w-4 h-4 mr-2" />
                Acessar Certificados
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      <div className="mt-8 p-6 bg-muted rounded-lg">
        <h3 className="text-lg font-semibold mb-2">Informações Importantes:</h3>
        <ul className="text-sm text-muted-foreground space-y-1">
          <li>• Certificados são gerados automaticamente com base nos dados do sistema</li>
          <li>• Orientadores podem baixar certificados de seus orientados com status "concluído"</li>
          <li>• Os certificados seguem o modelo oficial da UFVJM</li>
          <li>• Apenas estágios finalizados geram certificados válidos</li>
        </ul>
      </div>
    </div>
  );
}