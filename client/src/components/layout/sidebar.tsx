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
  Settings
} from "lucide-react";

interface SidebarProps {
  user: any;
}

export function Sidebar({ user }: SidebarProps) {
  const [location] = useLocation();

  const navigationItems = [
    {
      title: "Dashboard",
      href: "/dashboard",
      icon: Home,
      adminOnly: false,
    },
    {
      title: "Usuários",
      href: "/users",
      icon: Users,
      adminOnly: true,
    },
    {
      title: "Estudantes",
      href: "/students",
      icon: GraduationCap,
      adminOnly: false,
    },
    {
      title: "Orientadores",
      href: "/advisors",
      icon: UserCheck,
      adminOnly: false,
    },
    {
      title: "Estágios",
      href: "/internships",
      icon: BookOpen,
      adminOnly: false,
    },
    {
      title: "Relatórios",
      href: "/reports",
      icon: BarChart3,
      adminOnly: false,
    },
    {
      title: "Configurações",
      href: "/settings",
      icon: Settings,
      adminOnly: true,
    },
  ];

  const filteredItems = navigationItems.filter(item => 
    !item.adminOnly || user?.role === "administrator"
  );

  return (
    <div className="w-64 bg-white border-r border-gray-200 h-full">
      <div className="p-6">
        <div className="flex items-center space-x-3 mb-8">
          <div className="w-10 h-10 ufvjm-green rounded-full flex items-center justify-center">
            <span className="text-sm font-bold text-white">U</span>
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900">UFVJM</h2>
            <p className="text-xs text-gray-500">EstagioPro</p>
          </div>
        </div>

        <nav className="space-y-2">
          {filteredItems.map((item) => {
            const Icon = item.icon;
            const isActive = location === item.href;
            
            return (
              <Link key={item.href} href={item.href}>
                <Button
                  variant={isActive ? "default" : "ghost"}
                  className={cn(
                    "w-full justify-start",
                    isActive && "ufvjm-light-blue text-white"
                  )}
                  data-testid={`link-${item.title.toLowerCase()}`}
                >
                  <Icon className="w-4 h-4 mr-3" />
                  {item.title}
                </Button>
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
