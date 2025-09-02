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
  static async login(credentials: LoginCredentials): Promise<AuthUser> {
    const response = await apiRequest("POST", "/api/auth/login", credentials);
    const data = await response.json();
    return data.user;
  }

  static async logout(): Promise<void> {
    await apiRequest("POST", "/api/auth/logout");
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
