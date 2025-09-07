import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { FileText, GraduationCap, BookOpen, Users } from "lucide-react";

export default function Reports() {
  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Central de Relatórios</h1>
          <p className="text-muted-foreground">
            Selecione o tipo de relatório que deseja gerar
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Relatório de Orientação por Professores */}
        <Card className="hover:shadow-lg transition-shadow cursor-pointer group">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center group-hover:bg-blue-200 transition-colors">
              <Users className="h-8 w-8 text-blue-600" />
            </div>
            <CardTitle className="text-lg">Orientação por Professores</CardTitle>
            <CardDescription>
              Relatório de orientadores e seus estudantes por semestre
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <ul className="text-sm text-muted-foreground mb-4 space-y-1">
              <li>• Lista todos os orientadores</li>
              <li>• Nome e SIAPE dos professores</li>
              <li>• Estudantes supervisionados</li>
              <li>• Empresas e tipos de estágio</li>
            </ul>
            <Link href="/advisor-reports">
              <Button className="w-full" data-testid="button-advisor-reports">
                <FileText className="w-4 h-4 mr-2" />
                Gerar Relatório
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Relatório de Estágios Obrigatórios */}
        <Card className="hover:shadow-lg transition-shadow cursor-pointer group">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center group-hover:bg-green-200 transition-colors">
              <BookOpen className="h-8 w-8 text-green-600" />
            </div>
            <CardTitle className="text-lg">Estágios Obrigatórios</CardTitle>
            <CardDescription>
              Relatório de estudantes em estágios obrigatórios por semestre
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <ul className="text-sm text-muted-foreground mb-4 space-y-1">
              <li>• Estudantes em estágio obrigatório</li>
              <li>• Dados de matrícula e curso</li>
              <li>• Empresas e orientadores</li>
              <li>• Status dos relatórios (R1-R10)</li>
            </ul>
            <Link href="/mandatory-student-reports">
              <Button className="w-full" data-testid="button-mandatory-reports">
                <FileText className="w-4 h-4 mr-2" />
                Gerar Relatório
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Relatório de Estágios Não Obrigatórios */}
        <Card className="hover:shadow-lg transition-shadow cursor-pointer group">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center group-hover:bg-orange-200 transition-colors">
              <GraduationCap className="h-8 w-8 text-orange-600" />
            </div>
            <CardTitle className="text-lg">Estágios Não Obrigatórios</CardTitle>
            <CardDescription>
              Relatório de estudantes em estágios não obrigatórios por semestre
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <ul className="text-sm text-muted-foreground mb-4 space-y-1">
              <li>• Estudantes em estágio não obrigatório</li>
              <li>• Dados de matrícula e curso</li>
              <li>• Empresas e orientadores</li>
              <li>• Carga horária e período</li>
            </ul>
            <Link href="/non-mandatory-student-reports">
              <Button className="w-full" data-testid="button-non-mandatory-reports">
                <FileText className="w-4 h-4 mr-2" />
                Gerar Relatório
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      <div className="mt-8 p-6 bg-muted rounded-lg">
        <h3 className="text-lg font-semibold mb-2">Informações Importantes:</h3>
        <ul className="text-sm text-muted-foreground space-y-1">
          <li>• Todos os relatórios incluem a logo oficial da UFVJM</li>
          <li>• Os dados são organizados por semestre acadêmico</li>
          <li>• Os arquivos são gerados em formato PDF para download</li>
          <li>• As informações são extraídas em tempo real do banco de dados</li>
        </ul>
      </div>
    </div>
  );
}