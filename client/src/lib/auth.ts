import { apiRequest } from "./queryClient";

export interface AuthUser {
  id: string;
  username: string;
  name: string;
  email: string;
  role: "administrator" | "professor";
}

export interface LoginCredentials {
  username: string;
  password: string;
}

export class AuthService {
  // Verifica se está rodando em iframe (para Wix)
  static isInIframe(): boolean {
    try {
      // Verifica se está em iframe
      const inIframe = window.self !== window.top;
      
      // Verificações adicionais para Wix
      const isWix = window.location.href.includes('wix.com') || 
                    window.parent?.location?.hostname?.includes('wix.com') ||
                    document.referrer.includes('wix.com');
      
      console.log('🔍 Detecção de iframe:', { inIframe, isWix, href: window.location.href });
      
      return inIframe || isWix;
    } catch (e) {
      console.log('🔍 Erro na detecção de iframe, assumindo que está em iframe');
      return true;
    }
  }

  // Salva token para uso em iframes
  static saveToken(token: string): void {
    // Sempre salvar token para garantir funcionamento em iframes
    localStorage.setItem('auth-token', token);
    console.log('💾 Token JWT salvo no localStorage');
  }

  // Obtém token salvo
  static getToken(): string | null {
    return localStorage.getItem('auth-token');
  }

  // Remove token
  static removeToken(): void {
    localStorage.removeItem('auth-token');
  }

  static async login(credentials: LoginCredentials): Promise<AuthUser> {
    const response = await apiRequest("POST", "/api/auth/login", credentials);
    const data = await response.json();
    
    // Verificar se login foi bem-sucedido
    if (!data.success) {
      throw new Error(data.message || "Falha na autenticação");
    }
    
    // Salvar token JWT para uso em iframes/produção
    if (data.token) {
      this.saveToken(data.token);
    }
    
    return data.user;
  }

  static async logout(): Promise<void> {
    await apiRequest("POST", "/api/auth/logout");
    this.removeToken(); // Limpar token salvo
  }

  static async getCurrentUser(): Promise<AuthUser | null> {
    try {
      const response = await apiRequest("GET", "/api/auth/me");
      const data = await response.json();
      
      if (data.success && data.user) {
        return data.user;
      }
      
      return null;
    } catch (error) {
      // Limpar token inválido se houver
      this.removeToken();
      return null;
    }
  }
}
