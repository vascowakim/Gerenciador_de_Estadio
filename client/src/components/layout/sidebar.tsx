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
  
  // Garantir que sempre temos um objeto user válido
  const safeUser = user || { role: 'professor', name: 'Usuário', username: 'user' };

  const handleLogout = () => {
    // Limpar dados locais de autenticação se houver
    localStorage.removeItem('auth-token');
    sessionStorage.clear();
    
    // Redirecionar para a página de login
    window.location.href = '/';
  };

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

  const filteredItems = navigationItems.filter(item => {
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

  return (
    <div className="w-64 bg-blue-600 text-white h-full flex flex-col relative">
      {/* Header Section */}
      <div className="p-4 flex-shrink-0">
        <div className="bg-blue-700 rounded-lg p-4 mb-6 text-center">
          <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mx-auto mb-2">
            <img 
              src={ufvjmLogo} 
              alt="UFVJM Logo" 
              className="w-8 h-8 object-contain"
            />
          </div>
          <h2 className="text-sm font-bold">UFVJM</h2>
          <p className="text-xs text-blue-200">Ciências Contábeis</p>
        </div>
      </div>

      {/* Navigation Section - Scrollable */}
      <div className="flex-1 px-4 overflow-y-auto">
        <nav className="space-y-1 pb-4">
          {filteredItems.map((item) => {
            const Icon = item.icon;
            const isActive = location === item.href;
            
            return (
              <Link key={item.href} href={item.href}>
                <div
                  className={cn(
                    "flex items-center space-x-3 px-3 py-2 rounded text-sm hover:bg-blue-700 cursor-pointer transition-colors duration-200",
                    isActive && "bg-blue-700 font-semibold"
                  )}
                  data-testid={`link-${item.title.toLowerCase()}`}
                >
                  <Icon className="w-4 h-4 flex-shrink-0" />
                  <span className="truncate">{item.title}</span>
                </div>
              </Link>
            );
          })}
        </nav>
      </div>
        
      {/* Bottom Section - Fixed */}
      <div className="p-4 flex-shrink-0 border-t border-blue-500">
        <Link href="/profile">
          <Button
            className="w-full bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded text-center text-sm font-semibold mb-2 transition-colors duration-200"
            data-testid="button-profile"
          >
            <UserCog className="w-4 h-4 mr-2" />
            Meu Perfil
          </Button>
        </Link>
        <Button
          onClick={handleLogout}
          className="w-full bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded text-center text-sm font-semibold transition-colors duration-200"
          data-testid="button-logout"
        >
          <LogOut className="w-4 h-4 mr-2" />
          Sair
        </Button>
      </div>
    </div>
  );
}
