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
  Award,
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
      professorAccess: true,
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
      icon: Award,
      adminOnly: false,
      professorAccess: true,
    },
    {
      title: "Relatorios",
      href: "/reports",
      icon: BarChart3,
      adminOnly: false,
      professorAccess: false,
    },
    {
      title: "Configuracoes",
      href: "/settings",
      icon: Settings,
      adminOnly: true,
      professorAccess: false,
    },
  ];

  const filteredItems = navigationItems.filter(item => {
    if (user?.role === "administrator") {
      return true; // Administradores veem tudo
    }
    if (user?.role === "professor") {
      return item.professorAccess; // Professores só veem itens permitidos
    }
    return false;
  });

  return (
    <div className="w-64 bg-blue-600 text-white h-full">
      <div className="p-4">
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

        <nav className="space-y-1">
          {filteredItems.map((item) => {
            const Icon = item.icon;
            const isActive = location === item.href;
            
            return (
              <Link key={item.href} href={item.href}>
                <div
                  className={cn(
                    "flex items-center space-x-3 px-3 py-2 rounded text-sm hover:bg-blue-700 cursor-pointer",
                    isActive && "bg-blue-700 font-semibold"
                  )}
                  data-testid={`link-${item.title.toLowerCase()}`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.title}</span>
                </div>
              </Link>
            );
          })}
        </nav>
        
        {/* Bottom Section */}
        <div className="absolute bottom-4 left-4 right-4">
          <Link href="/profile">
            <Button
              className="w-full bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded text-center text-sm font-semibold mb-2"
              data-testid="button-profile"
            >
              <UserCog className="w-4 h-4 mr-2" />
              Meu Perfil
            </Button>
          </Link>
          <Button
            onClick={handleLogout}
            className="w-full bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded text-center text-sm font-semibold"
            data-testid="button-logout"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Sair
          </Button>
        </div>
      </div>
    </div>
  );
}
