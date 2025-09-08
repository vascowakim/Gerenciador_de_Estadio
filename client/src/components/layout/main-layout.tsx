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
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar fixa */}
      <div className="w-64 fixed inset-y-0 left-0 z-50">
        <Sidebar user={user || { role: 'professor' }} />
      </div>
      
      {/* Área de conteúdo principal */}
      <div className="flex-1 ml-64">
        <main className="h-full">
          {isLoading && !user ? (
            <div className="min-h-screen flex items-center justify-center">
              <div className="text-center">Carregando...</div>
            </div>
          ) : (
            children
          )}
        </main>
      </div>
    </div>
  );
}