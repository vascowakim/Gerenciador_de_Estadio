import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Navbar } from "@/components/layout/navbar";
import { Sidebar } from "@/components/layout/sidebar";
import { Users, GraduationCap, UserCheck, BookOpen, TrendingUp, Clock } from "lucide-react";
import { AuthService } from "@/lib/auth";
import { useLocation } from "wouter";
import { useEffect } from "react";

export default function Dashboard() {
  const [, setLocation] = useLocation();

  const { data: user, isLoading: userLoading } = useQuery({
    queryKey: ["/api/auth/me"],
    queryFn: async () => {
      const user = await AuthService.getCurrentUser();
      if (!user) {
        setLocation("/");
        return null;
      }
      return user;
    },
  });

  const { data: stats } = useQuery({
    queryKey: ["/api/stats"],
    queryFn: async () => {
      // This would normally fetch dashboard statistics
      return {
        totalStudents: 0,
        totalAdvisors: 0,
        totalInternships: 0,
        pendingInternships: 0,
      };
    },
    enabled: !!user,
  });

  if (userLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 ufvjm-green rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-sm font-bold text-white">U</span>
          </div>
          <p>Carregando...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar user={user} />
      <div className="flex">
        <Sidebar user={user} />
        <main className="flex-1 p-8">
          <div className="max-w-7xl mx-auto">
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-2" data-testid="text-dashboard-title">
                Dashboard
              </h1>
              <p className="text-gray-600">
                Bem-vindo ao sistema de controle de estágio, {user.name}
              </p>
            </div>

            {/* Statistics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total de Estudantes</CardTitle>
                  <GraduationCap className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold" data-testid="text-students-count">
                    {stats?.totalStudents || 0}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    estudantes ativos
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Orientadores</CardTitle>
                  <UserCheck className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold" data-testid="text-advisors-count">
                    {stats?.totalAdvisors || 0}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    orientadores cadastrados
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Estágios</CardTitle>
                  <BookOpen className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold" data-testid="text-internships-count">
                    {stats?.totalInternships || 0}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    estágios cadastrados
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Pendentes</CardTitle>
                  <Clock className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold" data-testid="text-pending-count">
                    {stats?.pendingInternships || 0}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    aguardando aprovação
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Ações Rápidas</CardTitle>
                  <CardDescription>
                    Acesse rapidamente as funcionalidades mais utilizadas
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {user.role === "administrator" && (
                      <Link href="/students">
                        <Button className="w-full justify-start" variant="outline" data-testid="button-manage-students">
                          <GraduationCap className="w-4 h-4 mr-3" />
                          Gerenciar Estudantes
                        </Button>
                      </Link>
                    )}
                    <Link href="/internships">
                      <Button className="w-full justify-start" variant="outline" data-testid="button-manage-internships">
                        <BookOpen className="w-4 h-4 mr-3" />
                        Gerenciar Estágios
                      </Button>
                    </Link>
                    <Link href="/advisors">
                      <Button className="w-full justify-start" variant="outline" data-testid="button-manage-advisors">
                        <UserCheck className="w-4 h-4 mr-3" />
                        Orientadores
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Estatísticas Recentes</CardTitle>
                  <CardDescription>
                    Visão geral das atividades do sistema
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Estágios este mês</span>
                      <span className="font-bold" data-testid="text-monthly-internships">0</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Novos estudantes</span>
                      <span className="font-bold" data-testid="text-new-students">0</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Taxa de aprovação</span>
                      <span className="font-bold" data-testid="text-approval-rate">100%</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
