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
      return window.self !== window.top;
    } catch (e) {
      return true;
    }
  }

  // Salva token para uso em iframes
  static saveToken(token: string): void {
    if (this.isInIframe()) {
      localStorage.setItem('auth-token', token);
    }
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
    
    // Se recebeu token, salvar para uso em iframes
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
      return data.user;
    } catch (error) {
      return null;
    }
  }
}
