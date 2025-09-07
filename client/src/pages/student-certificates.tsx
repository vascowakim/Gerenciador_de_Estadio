import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { Award, BookOpen, GraduationCap, ArrowLeft } from "lucide-react";

export default function StudentCertificates() {
  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/certificates">
            <Button variant="outline" size="sm" className="flex items-center gap-2" data-testid="button-back">
              <ArrowLeft className="h-4 w-4" />
              Voltar
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Certificados de Alunos</h1>
            <p className="text-muted-foreground">
              Escolha o tipo de estágio para gerar certificados
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Certificados de Estágios Obrigatórios */}
        <Card className="hover:shadow-lg transition-shadow cursor-pointer group">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center group-hover:bg-green-200 transition-colors">
              <BookOpen className="h-8 w-8 text-green-600" />
            </div>
            <CardTitle className="text-lg">Estágios Obrigatórios</CardTitle>
            <CardDescription>
              Certificados para estudantes em estágios obrigatórios concluídos
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <ul className="text-sm text-muted-foreground mb-4 space-y-1">
              <li>• Certificados de conclusão</li>
              <li>• Status: concluído</li>
              <li>• Validação de cumprimento</li>
            </ul>
            <Link href="/mandatory-student-certificates">
              <Button className="w-full" data-testid="button-mandatory-certificates">
                <Award className="w-4 h-4 mr-2" />
                Gerar Certificados
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Certificados de Estágios Não Obrigatórios */}
        <Card className="hover:shadow-lg transition-shadow cursor-pointer group">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center group-hover:bg-orange-200 transition-colors">
              <GraduationCap className="h-8 w-8 text-orange-600" />
            </div>
            <CardTitle className="text-lg">Estágios Não Obrigatórios</CardTitle>
            <CardDescription>
              Certificados para estudantes em estágios não obrigatórios concluídos
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <ul className="text-sm text-muted-foreground mb-4 space-y-1">
              <li>• Certificados personalizados</li>
              <li>• Modelo oficial UFVJM</li>
              <li>• Apenas orientados concluídos</li>
            </ul>
            <Link href="/non-mandatory-student-certificates">
              <Button className="w-full" data-testid="button-non-mandatory-certificates">
                <Award className="w-4 h-4 mr-2" />
                Gerar Certificados
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      <div className="mt-8 p-6 bg-muted rounded-lg">
        <h3 className="text-lg font-semibold mb-2">Regras para Certificados de Alunos:</h3>
        <ul className="text-sm text-muted-foreground space-y-1">
          <li>• <strong>Orientadores</strong>: Podem baixar certificados apenas de seus orientados</li>
          <li>• <strong>Status obrigatório</strong>: Estágio deve estar marcado como "concluído"</li>
          <li>• <strong>Dados inclusos</strong>: Nome do aluno, período do estágio, nome do orientador</li>
          <li>• <strong>Formato</strong>: PDF com modelo oficial da universidade</li>
        </ul>
      </div>
    </div>
  );
}