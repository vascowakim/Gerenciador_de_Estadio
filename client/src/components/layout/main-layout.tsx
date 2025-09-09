import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Sidebar } from "./sidebar";
import { AuthService } from "@/lib/auth";

interface MainLayoutProps {
  children: React.ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  const [, setLocation] = useLocation();

  const { data: user, isLoading } = useQuery({
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

  // Sempre renderiza o layout, mesmo durante carregamento
  // Se user for null após carregamento, o AuthService já redireciona

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar fixa com classe específica */}
      <div className="sidebar-container">
        <Sidebar user={user || { role: 'professor' }} />
      </div>
      
      {/* Área de conteúdo principal com classe específica */}
      <div className="main-content">
        <main className="min-h-screen p-0">
          {isLoading && !user ? (
            <div className="min-h-screen flex items-center justify-center">
              <div className="text-center text-gray-600">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                Carregando...
              </div>
            </div>
          ) : (
            <div className="w-full h-full">
              {children}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}