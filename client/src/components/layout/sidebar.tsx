import React, { useState, useCallback, useMemo } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Link, useLocation } from "wouter";
import { 
  Home, 
  Users, 
  GraduationCap, 
  UserCheck, 
  BookOpen,
  BarChart3,
  Settings,
  FileSpreadsheet,
  Building2,
  FileText,
  Briefcase,
  Shield,
  Archive,
  LogOut,
  UserCog,
  Bell
} from "lucide-react";
import ufvjmLogo from "@assets/ufvjm_1756831174700.png";

interface SidebarProps {
  user: any;
}

export function Sidebar({ user }: SidebarProps) {
  const [location, setLocation] = useLocation();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  
  // Garantir que sempre temos um objeto user válido
  const safeUser = useMemo(() => 
    user || { role: 'professor', name: 'Usuário', username: 'user' }, [user]
  );

  const handleLogout = useCallback(() => {
    if (isLoggingOut) return;
    
    setIsLoggingOut(true);
    
    try {
      // Limpar dados locais de autenticação se houver
      localStorage.removeItem('auth-token');
      sessionStorage.clear();
      
      // Redirecionar para a página de login
      window.location.href = '/';
    } catch (error) {
      console.error('Erro durante logout:', error);
      setIsLoggingOut(false);
    }
  }, [isLoggingOut]);

  const navigationItems = [
    {
      title: "Dashboard",
      href: "/dashboard",
      icon: Home,
      adminOnly: false,
      professorAccess: true,
    },
    {
      title: "Central de Alertas",
      href: "/alerts",
      icon: Bell,
      adminOnly: true,
      professorAccess: false,
    },
    {
      title: "Estudantes",
      href: "/students",
      icon: GraduationCap,
      adminOnly: false,
      professorAccess: false,
    },
    {
      title: "Empresas",
      href: "/companies",
      icon: Building2,
      adminOnly: false,
      professorAccess: false,
    },
    {
      title: "Estagio Obrigatorio",
      href: "/mandatory-internships",
      icon: BookOpen,
      adminOnly: false,
      professorAccess: true,
    },
    {
      title: "Estagio Nao Obrigatorio",
      href: "/non-mandatory-internships",
      icon: FileText,
      adminOnly: false,
      professorAccess: true,
    },
    {
      title: "Orientadores",
      href: "/advisors",
      icon: UserCheck,
      adminOnly: false,
      professorAccess: false,
    },
    {
      title: "Certificados",
      href: "/certificates",
      icon: FileSpreadsheet,
      adminOnly: false,
      professorAccess: true,
    },
    {
      title: "Central de Relatórios",
      href: "/reports",
      icon: BarChart3,
      adminOnly: false,
      professorAccess: true,
    },
    {
      title: "Configurações",
      href: "/settings",
      icon: Settings,
      adminOnly: true,
      professorAccess: false,
    },
  ];

  const filteredItems = useMemo(() => {
    return navigationItems.filter(item => {
      if (safeUser.role === "administrator") {
        return true; // Administradores veem tudo
      }
      if (safeUser.role === "professor") {
        // Professores só veem: Dashboard, Estágio Obrigatório, Não Obrigatório e Certificados
        const allowedRoutes = ["/dashboard", "/mandatory-internships", "/non-mandatory-internships", "/certificates"];
        return allowedRoutes.includes(item.href);
      }
      return false;
    });
  }, [safeUser.role]);

  // Renderizar componente de navegação
  const renderNavigationItem = useCallback((item: any) => {
    const Icon = item.icon;
    const isActive = location === item.href;
    
    return (
      <Link key={item.href} href={item.href}>
        <div
          className={cn(
            "flex items-center space-x-3 px-3 py-2 rounded text-sm hover:bg-blue-700 cursor-pointer transition-all duration-200",
            isActive && "bg-blue-700 font-semibold shadow-md"
          )}
          data-testid={`link-${item.title.toLowerCase().replace(/\s+/g, '-')}`}
        >
          <Icon className="w-4 h-4 flex-shrink-0" />
          <span className="truncate select-none">{item.title}</span>
        </div>
      </Link>
    );
  }, [location]);

  return (
    <aside className="w-64 bg-blue-600 text-white h-screen flex flex-col fixed top-0 left-0 z-40 shadow-lg">
      {/* Header Section */}
      <header className="p-4 flex-shrink-0">
        <div className="bg-blue-700 rounded-lg p-4 mb-6 text-center shadow-md">
          <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mx-auto mb-2">
            <img 
              src={ufvjmLogo} 
              alt="UFVJM Logo" 
              className="w-8 h-8 object-contain"
              loading="lazy"
            />
          </div>
          <h2 className="text-sm font-bold select-none">UFVJM</h2>
          <p className="text-xs text-blue-200 select-none">Ciências Contábeis</p>
        </div>
      </header>

      {/* Navigation Section - Scrollable */}
      <nav className="flex-1 px-4 overflow-y-auto scrollbar-thin scrollbar-thumb-blue-800 scrollbar-track-blue-600">
        <div className="space-y-1 pb-4">
          {filteredItems.map(renderNavigationItem)}
        </div>
      </nav>
        
      {/* Bottom Section - Fixed */}
      <footer className="p-4 flex-shrink-0 border-t border-blue-500">
        <div className="space-y-2">
          <Link href="/profile">
            <Button
              className="w-full bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded text-center text-sm font-semibold transition-all duration-200 shadow-sm hover:shadow-md"
              data-testid="button-profile"
              type="button"
            >
              <UserCog className="w-4 h-4 mr-2 flex-shrink-0" />
              <span className="select-none">Meu Perfil</span>
            </Button>
          </Link>
          <Button
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="w-full bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white px-3 py-2 rounded text-center text-sm font-semibold transition-all duration-200 shadow-sm hover:shadow-md"
            data-testid="button-logout"
            type="button"
          >
            <LogOut className="w-4 h-4 mr-2 flex-shrink-0" />
            <span className="select-none">{isLoggingOut ? 'Saindo...' : 'Sair'}</span>
          </Button>
        </div>
      </footer>
    </aside>
  );
}
