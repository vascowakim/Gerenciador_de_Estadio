import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Navbar } from "@/components/layout/navbar";
import { Sidebar } from "@/components/layout/sidebar";
import { Users, GraduationCap, UserCheck, BookOpen, TrendingUp, Clock, FileText, Building2, Users2 } from "lucide-react";
import { AuthService } from "@/lib/auth";
import { useLocation, Link } from "wouter";
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
        totalStudents: 1,
        totalAdvisors: 1,
        totalInternships: 0,
        pendingInternships: 0,
      };
    },
    enabled: !!user,
  });

  // Get current date and time
  const now = new Date();
  const currentDate = now.toLocaleDateString('pt-BR');
  const currentTime = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

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
    <div className="min-h-screen bg-gray-100">
      <div className="flex">
        <Sidebar user={user} />
        <main className="flex-1">
          {/* Top Header Bar */}
          <div className="bg-blue-600 text-white px-6 py-3 flex justify-between items-center">
            <h1 className="text-xl font-semibold" data-testid="text-dashboard-title">Dashboard</h1>
            <div className="flex items-center space-x-4 text-sm">
              <span>👤 Administrador</span>
            </div>
          </div>

          {/* Date and Time Bar */}
          <div className="bg-blue-50 px-6 py-2 border-b flex justify-between items-center text-sm text-blue-800">
            <div className="flex space-x-4">
              <span>📅 {currentDate}</span>
              <span>🕐 {currentTime}</span>
              <span>🏢 Retratos</span>
            </div>
            <div className="flex items-center space-x-2">
              <span>👤 Administrador do Sistema</span>
              <span className="text-blue-600">administrador</span>
              <span className="bg-red-500 text-white px-2 py-1 rounded text-xs">Sair</span>
            </div>
          </div>

          <div className="p-6">
            {/* Welcome Section */}
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-blue-600 mb-2">
                📝 Bem-vindo, Administrador!
              </h2>
              <p className="text-gray-600 mb-1">
                Você tem acesso completo ao sistema como Administrador
              </p>
              <p className="text-sm text-gray-500">
                ou Centro de Ciências Contábeis - UFVJM
              </p>
            </div>

            {/* Statistics Section */}
            <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-8">
              <h3 className="text-lg font-semibold text-green-700 mb-4 flex items-center">
                📊 Estatísticas do Sistema
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-white rounded-lg p-4 text-center border border-gray-200">
                  <div className="text-3xl mb-2">📄</div>
                  <div className="text-2xl font-bold text-gray-800" data-testid="text-students-count">
                    {stats?.totalStudents || 1}
                  </div>
                  <p className="text-sm text-gray-600">Estágios Obrigatórios</p>
                </div>
                
                <div className="bg-white rounded-lg p-4 text-center border border-gray-200">
                  <div className="text-3xl mb-2">📋</div>
                  <div className="text-2xl font-bold text-gray-800" data-testid="text-advisors-count">
                    {stats?.totalAdvisors || 1}
                  </div>
                  <p className="text-sm text-gray-600">Estágios Não Obrigatórios</p>
                </div>
                
                <div className="bg-white rounded-lg p-4 text-center border border-gray-200">
                  <div className="text-3xl mb-2">🎓</div>
                  <div className="text-2xl font-bold text-gray-800" data-testid="text-internships-count">
                    {stats?.totalInternships || 0}
                  </div>
                  <p className="text-sm text-gray-600">Estudantes ativos</p>
                </div>
                
                <div className="bg-white rounded-lg p-4 text-center border border-gray-200">
                  <div className="text-3xl mb-2">👥</div>
                  <div className="text-2xl font-bold text-gray-800" data-testid="text-pending-count">
                    {stats?.pendingInternships || 0}
                  </div>
                  <p className="text-sm text-gray-600">Orientadores</p>
                </div>
              </div>
            </div>

            {/* Beta Version Section */}
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-orange-700 mb-4 flex items-center">
                🚀 Versão Beta
              </h3>
              <div className="text-center">
                <p className="text-gray-600 mb-2">Desenvolvido e mantido por:</p>
                <p className="text-lg font-semibold text-blue-600 mb-1">
                  Prof. Dr. Vasconcelos Reis Wakim
                </p>
                <p className="text-sm text-gray-500 mb-2">
                  📧 vasconcelos.wakim@ufvjm.edu.br
                </p>
                <p className="text-lg font-semibold text-blue-600 mb-1">
                  Prof. Dr. Vasconcelos Reis Wakim
                </p>
                <p className="text-sm text-gray-500">
                  Diretor Pro Temp. Departamento de Ciências Contábeis da UFVJM
                </p>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
