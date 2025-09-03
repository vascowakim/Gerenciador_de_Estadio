import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["/api/stats"],
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
            <div className="text-2xl font-bold text-gray-800" data-testid="text-mandatory-internships-count">
              {statsLoading ? "..." : (stats?.totalMandatoryInternships || 0)}
            </div>
            <p className="text-sm text-gray-600">Estágios Obrigatórios</p>
          </div>
          
          <div className="bg-white rounded-lg p-4 text-center border border-gray-200">
            <div className="text-3xl mb-2">📋</div>
            <div className="text-2xl font-bold text-gray-800" data-testid="text-non-mandatory-internships-count">
              {statsLoading ? "..." : (stats?.totalNonMandatoryInternships || 0)}
            </div>
            <p className="text-sm text-gray-600">Estágios Não Obrigatórios</p>
          </div>
          
          <div className="bg-white rounded-lg p-4 text-center border border-gray-200">
            <div className="text-3xl mb-2">🎓</div>
            <div className="text-2xl font-bold text-gray-800" data-testid="text-active-students-count">
              {statsLoading ? "..." : (stats?.activeStudents || 0)}
            </div>
            <p className="text-sm text-gray-600">Estudantes ativos</p>
          </div>
          
          <div className="bg-white rounded-lg p-4 text-center border border-gray-200">
            <div className="text-3xl mb-2">👥</div>
            <div className="text-2xl font-bold text-gray-800" data-testid="text-advisors-count">
              {statsLoading ? "..." : (stats?.totalAdvisors || 0)}
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
  );
}