import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertUserSchema, insertAdvisorSchema, insertStudentSchema, insertCompanySchema, insertInternshipSchema } from "@shared/schema";
import bcrypt from "bcrypt";
import session from "express-session";

export async function registerRoutes(app: Express): Promise<Server> {
  // Session configuration
  app.use(session({
    secret: process.env.SESSION_SECRET || 'your-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: { 
      secure: false, // Set to true in production with HTTPS
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
  }));

  // Authentication middleware
  const requireAuth = (req: any, res: any, next: any) => {
    if (!req.session.user) {
      return res.status(401).json({ message: "Não autorizado" });
    }
    next();
  };

  const requireAdmin = (req: any, res: any, next: any) => {
    if (!req.session.user || req.session.user.role !== "administrator") {
      return res.status(403).json({ message: "Acesso negado" });
    }
    next();
  };

  // Auth routes
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { username, password } = req.body;
      
      if (!username || !password) {
        return res.status(400).json({ message: "Usuário e senha são obrigatórios" });
      }

      const user = await storage.getUserByUsername(username);
      if (!user) {
        return res.status(401).json({ message: "Credenciais inválidas" });
      }

      const isValidPassword = await bcrypt.compare(password, user.password);
      if (!isValidPassword) {
        return res.status(401).json({ message: "Credenciais inválidas" });
      }

      req.session.user = {
        id: user.id,
        username: user.username,
        name: user.name,
        email: user.email,
        role: user.role
      };

      res.json({ 
        user: {
          id: user.id,
          username: user.username,
          name: user.name,
          email: user.email,
          role: user.role
        }
      });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  app.post("/api/auth/logout", (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ message: "Erro ao fazer logout" });
      }
      res.json({ message: "Logout realizado com sucesso" });
    });
  });

  app.get("/api/auth/me", (req: any, res) => {
    if (req.session.user) {
      res.json({ user: req.session.user });
    } else {
      res.status(401).json({ message: "Não autenticado" });
    }
  });

  // User routes
  app.get("/api/users", requireAuth, requireAdmin, async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      res.json(users.map(user => ({ ...user, password: undefined })));
    } catch (error) {
      res.status(500).json({ message: "Erro ao buscar usuários" });
    }
  });

  app.post("/api/users", requireAuth, requireAdmin, async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      const hashedPassword = await bcrypt.hash(userData.password, 10);
      const user = await storage.createUser({
        ...userData,
        password: hashedPassword
      });
      res.json({ ...user, password: undefined });
    } catch (error) {
      res.status(400).json({ message: "Dados inválidos" });
    }
  });

  app.put("/api/users/:id", requireAuth, requireAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const userData = insertUserSchema.partial().parse(req.body);
      
      if (userData.password) {
        userData.password = await bcrypt.hash(userData.password, 10);
      }

      const user = await storage.updateUser(id, userData);
      if (!user) {
        return res.status(404).json({ message: "Usuário não encontrado" });
      }
      res.json({ ...user, password: undefined });
    } catch (error) {
      res.status(400).json({ message: "Dados inválidos" });
    }
  });

  app.delete("/api/users/:id", requireAuth, requireAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const success = await storage.deleteUser(id);
      if (!success) {
        return res.status(404).json({ message: "Usuário não encontrado" });
      }
      res.json({ message: "Usuário excluído com sucesso" });
    } catch (error) {
      res.status(500).json({ message: "Erro ao excluir usuário" });
    }
  });

  // Advisor routes
  app.get("/api/advisors", requireAuth, async (req, res) => {
    try {
      const advisors = await storage.getAllAdvisors();
      res.json(advisors);
    } catch (error) {
      res.status(500).json({ message: "Erro ao buscar orientadores" });
    }
  });

  app.post("/api/advisors", requireAuth, requireAdmin, async (req, res) => {
    try {
      const advisorData = insertAdvisorSchema.parse(req.body);
      const advisor = await storage.createAdvisor(advisorData);
      res.json(advisor);
    } catch (error) {
      res.status(400).json({ message: "Dados inválidos" });
    }
  });

  app.put("/api/advisors/:id", requireAuth, requireAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const advisorData = insertAdvisorSchema.partial().parse(req.body);
      const advisor = await storage.updateAdvisor(id, advisorData);
      if (!advisor) {
        return res.status(404).json({ message: "Orientador não encontrado" });
      }
      res.json(advisor);
    } catch (error) {
      res.status(400).json({ message: "Dados inválidos" });
    }
  });

  app.delete("/api/advisors/:id", requireAuth, requireAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const success = await storage.deleteAdvisor(id);
      if (!success) {
        return res.status(404).json({ message: "Orientador não encontrado" });
      }
      res.json({ message: "Orientador excluído com sucesso" });
    } catch (error) {
      res.status(500).json({ message: "Erro ao excluir orientador" });
    }
  });

  // Student routes
  app.get("/api/students", requireAuth, async (req, res) => {
    try {
      const students = await storage.getAllStudents();
      res.json(students);
    } catch (error) {
      res.status(500).json({ message: "Erro ao buscar estudantes" });
    }
  });

  app.post("/api/students", requireAuth, async (req, res) => {
    try {
      const studentData = insertStudentSchema.parse(req.body);
      const student = await storage.createStudent(studentData);
      res.json(student);
    } catch (error) {
      res.status(400).json({ message: "Dados inválidos" });
    }
  });

  app.put("/api/students/:id", requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const studentData = insertStudentSchema.partial().parse(req.body);
      const student = await storage.updateStudent(id, studentData);
      if (!student) {
        return res.status(404).json({ message: "Estudante não encontrado" });
      }
      res.json(student);
    } catch (error) {
      res.status(400).json({ message: "Dados inválidos" });
    }
  });

  app.delete("/api/students/:id", requireAuth, requireAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const success = await storage.deleteStudent(id);
      if (!success) {
        return res.status(404).json({ message: "Estudante não encontrado" });
      }
      res.json({ message: "Estudante excluído com sucesso" });
    } catch (error) {
      res.status(500).json({ message: "Erro ao excluir estudante" });
    }
  });

  // Company routes
  app.get("/api/companies", requireAuth, async (req, res) => {
    try {
      const companies = await storage.getAllCompanies();
      res.json(companies);
    } catch (error) {
      res.status(500).json({ message: "Erro ao buscar empresas" });
    }
  });

  app.post("/api/companies", requireAuth, async (req, res) => {
    try {
      const companyData = insertCompanySchema.parse(req.body);
      const company = await storage.createCompany(companyData);
      res.json(company);
    } catch (error) {
      res.status(400).json({ message: "Dados inválidos" });
    }
  });

  app.put("/api/companies/:id", requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const companyData = insertCompanySchema.partial().parse(req.body);
      const company = await storage.updateCompany(id, companyData);
      if (!company) {
        return res.status(404).json({ message: "Empresa não encontrada" });
      }
      res.json(company);
    } catch (error) {
      res.status(400).json({ message: "Dados inválidos" });
    }
  });

  app.delete("/api/companies/:id", requireAuth, requireAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const success = await storage.deleteCompany(id);
      if (!success) {
        return res.status(404).json({ message: "Empresa não encontrada" });
      }
      res.json({ message: "Empresa excluída com sucesso" });
    } catch (error) {
      res.status(500).json({ message: "Erro ao excluir empresa" });
    }
  });

  // Internship routes
  app.get("/api/internships", requireAuth, async (req: any, res) => {
    try {
      let internships;
      if (req.session.user.role === "administrator") {
        internships = await storage.getAllInternships();
      } else {
        // Professors can only see internships they supervise
        internships = await storage.getInternshipsByAdvisor(req.session.user.id);
      }
      res.json(internships);
    } catch (error) {
      res.status(500).json({ message: "Erro ao buscar estágios" });
    }
  });

  app.post("/api/internships", requireAuth, async (req, res) => {
    try {
      const internshipData = insertInternshipSchema.parse(req.body);
      const internship = await storage.createInternship(internshipData);
      res.json(internship);
    } catch (error) {
      res.status(400).json({ message: "Dados inválidos" });
    }
  });

  app.put("/api/internships/:id", requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const internshipData = insertInternshipSchema.partial().parse(req.body);
      const internship = await storage.updateInternship(id, internshipData);
      if (!internship) {
        return res.status(404).json({ message: "Estágio não encontrado" });
      }
      res.json(internship);
    } catch (error) {
      res.status(400).json({ message: "Dados inválidos" });
    }
  });

  app.delete("/api/internships/:id", requireAuth, requireAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const success = await storage.deleteInternship(id);
      if (!success) {
        return res.status(404).json({ message: "Estágio não encontrado" });
      }
      res.json({ message: "Estágio excluído com sucesso" });
    } catch (error) {
      res.status(500).json({ message: "Erro ao excluir estágio" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
