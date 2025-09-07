import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { Award, ArrowLeft, Users } from "lucide-react";

export default function AdvisorCertificates() {
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
            <h1 className="text-3xl font-bold tracking-tight">Certificados de Orientador</h1>
            <p className="text-muted-foreground">
              Certificados para professores orientadores
            </p>
          </div>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Certificados de Orientação
          </CardTitle>
          <CardDescription>
            Esta funcionalidade estará disponível em breve
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center py-8">
            <Award className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">Em Desenvolvimento</h3>
            <p className="text-muted-foreground mb-4">
              Os certificados para orientadores estão sendo desenvolvidos e estarão disponíveis em breve.
            </p>
            <div className="p-4 bg-muted rounded-lg">
              <h4 className="font-medium mb-2">Funcionalidades previstas:</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Certificados de orientação de estágios</li>
                <li>• Validação de supervisão acadêmica</li>
                <li>• Relatórios de atividades de orientação</li>
                <li>• Histórico de orientações realizadas</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}