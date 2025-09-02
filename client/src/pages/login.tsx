import { LoginForm } from "@/components/auth/login-form";
import { useLocation } from "wouter";

export default function Login() {
  const [, setLocation] = useLocation();

  const handleLoginSuccess = (user: any) => {
    setLocation("/dashboard");
  };

  return <LoginForm onLoginSuccess={handleLoginSuccess} />;
}
