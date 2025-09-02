import { Button } from "@/components/ui/button";
import { LogOut, User } from "lucide-react";
import { AuthService } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";

interface NavbarProps {
  user: any;
}

export function Navbar({ user }: NavbarProps) {
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const handleLogout = async () => {
    try {
      await AuthService.logout();
      setLocation("/");
      toast({
        title: "Logout realizado",
        description: "Você foi desconectado do sistema.",
      });
    } catch (error) {
      toast({
        title: "Erro no logout",
        description: "Erro ao desconectar do sistema.",
        variant: "destructive",
      });
    }
  };

  return (
    <nav className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="w-8 h-8 ufvjm-green rounded-full flex items-center justify-center">
            <span className="text-sm font-bold text-white">U</span>
          </div>
          <div>
            <h1 className="text-lg font-bold text-gray-900" data-testid="text-navbar-title">EstagioPro</h1>
            <p className="text-xs text-gray-500">Sistema de Controle de Estágio</p>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <User className="w-4 h-4 text-gray-500" />
            <div className="text-right">
              <p className="text-sm font-medium text-gray-900" data-testid="text-user-name">{user.name}</p>
              <p className="text-xs text-gray-500" data-testid="text-user-role">
                {user.role === "administrator" ? "Administrador" : "Professor"}
              </p>
            </div>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleLogout}
            data-testid="button-logout"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Sair
          </Button>
        </div>
      </div>
    </nav>
  );
}
