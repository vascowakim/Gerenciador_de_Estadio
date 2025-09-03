import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertUserSchema, insertAdvisorSchema, insertStudentSchema, insertCompanySchema, insertInternshipSchema, insertMandatoryInternshipSchema, insertNonMandatoryInternshipSchema, insertInternshipDocumentSchema, insertInternshipAlertSchema } from "@shared/schema";
import { alertService } from "./alertService";
import bcrypt from "bcrypt";
import session from "express-session";
import jwt from "jsonwebtoken";
import {
  ObjectStorageService,
  ObjectNotFoundError,
} from "./objectStorage";
import { ObjectPermission } from "./objectAcl";

// Interface para estender o tipo de sessão
interface AuthenticatedRequest extends Request {
  session: {
    user?: {
      id: string;
      username: string;
      name: string;
      email: string;
      role: string;
    };
  } & session.Session;
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Configuração profissional de sessão
  const isProduction = process.env.NODE_ENV === 'production';
  
  app.use(session({
    secret: process.env.SESSION_SECRET || 'fallback-secret-key',
    resave: false,
    saveUninitialized: false, // Melhor segurança - só criar sessão quando necessário
    rolling: true, // Reset expiration com atividade
    cookie: { 
      secure: isProduction, // HTTPS obrigatório em produção
      maxAge: 24 * 60 * 60 * 1000, // 24 horas
      sameSite: isProduction ? 'none' : 'lax', // 'none' para iframe em produção
      httpOnly: !isProduction, // Permitir JS em dev, bloquear em produção por segurança
      domain: undefined // Detecção automática do domínio
    },
    name: isProduction ? '__Host-sid' : 'connect.sid' // Nome seguro em produção
  }));

  // Configuração JWT segura
  const JWT_SECRET = process.env.JWT_SECRET;
  if (!JWT_SECRET) {
    throw new Error('JWT_SECRET é obrigatório para funcionamento seguro');
  }

  // Middleware de autenticação robusto
  const requireAuth = (req: AuthenticatedRequest, res: Response, next: any) => {
    try {
      // Primeiro: Verificar sessão ativa
      if (req.session?.user) {
        return next();
      }
      
      // Segundo: Verificar JWT token (essencial para produção/iframe)
      const authHeader = req.headers.authorization;
      if (authHeader?.startsWith('Bearer ')) {
        const token = authHeader.substring(7);
        
        if (token && token !== 'null' && token !== 'undefined') {
          try {
            const decoded = jwt.verify(token, JWT_SECRET) as any;
            
            // Validar estrutura do token
            if (decoded?.id && decoded?.username && decoded?.role) {
              req.session.user = decoded;
              return next();
            }
          } catch (jwtError) {
            // Token inválido - continuar para rejeição
          }
        }
      }
      
      // Rejeitar acesso não autorizado
      return res.status(401).json({ 
        message: "Acesso não autorizado",
        code: "UNAUTHORIZED"
      });
      
    } catch (error) {
      console.error('Erro no middleware de autenticação:', error);
      return res.status(500).json({ 
        message: "Erro interno de autenticação",
        code: "AUTH_ERROR"
      });
    }
  };

  const requireAdmin = (req: AuthenticatedRequest, res: Response, next: any) => {
    try {
      const user = req.session?.user;
      
      if (!user) {
        return res.status(401).json({ 
          message: "Usuário não autenticado",
          code: "NOT_AUTHENTICATED"
        });
      }
      
      if (user.role !== "administrator") {
        return res.status(403).json({ 
          message: "Acesso restrito a administradores",
          code: "INSUFFICIENT_PRIVILEGES"
        });
      }
      
      next();
    } catch (error) {
      console.error('Erro no middleware de admin:', error);
      return res.status(500).json({ 
        message: "Erro interno de autorização",
        code: "AUTHZ_ERROR"
      });
    }
  };

  // Dashboard statistics route
  app.get("/api/stats", requireAuth, async (req, res) => {
    try {
      const students = await storage.getAllStudents();
      const advisors = await storage.getAllAdvisors();
      const mandatoryInternships = await storage.getAllMandatoryInternships();
      const nonMandatoryInternships = await storage.getAllNonMandatoryInternships();
      
      const totalStudents = students.length;
      const totalAdvisors = advisors.length;
      const totalMandatoryInternships = mandatoryInternships.length;
      const totalNonMandatoryInternships = nonMandatoryInternships.length;
      
      // Count active students (students with active internships)
      const activeStudentIds = new Set([
        ...mandatoryInternships.filter(i => i.isActive).map(i => i.studentId),
        ...nonMandatoryInternships.filter(i => i.isActive).map(i => i.studentId)
      ]);
      const activeStudents = activeStudentIds.size;
      
      res.json({
        totalStudents,
        totalAdvisors,
        totalMandatoryInternships,
        totalNonMandatoryInternships,
        activeStudents,
        totalInternships: totalMandatoryInternships + totalNonMandatoryInternships
      });
    } catch (error) {
      console.error("Error fetching stats:", error);
      res.status(500).json({ message: "Erro ao buscar estatísticas" });
    }
  });

  // Health check profissional para monitoramento
  app.get("/api/health", (req, res) => {
    const healthData = {
      status: "healthy",
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      version: "1.0.0",
      uptime: process.uptime(),
      domain: req.get('host'),
      secure: req.secure,
      protocol: req.protocol,
      sessionStore: req.session ? 'active' : 'inactive'
    };
    
    res.set({
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    });
    
    res.json(healthData);
  });

  // Endpoint de login profissional e seguro
  app.post("/api/auth/login", async (req, res) => {
    const startTime = Date.now();
    const clientIP = req.ip || req.connection.remoteAddress || 'unknown';
    
    try {
      const { username, password } = req.body;
      
      // Validação de entrada
      if (!username || !password) {
        return res.status(400).json({ 
          success: false,
          message: "Usuário e senha são obrigatórios",
          code: "MISSING_CREDENTIALS"
        });
      }

      if (typeof username !== 'string' || typeof password !== 'string') {
        return res.status(400).json({ 
          success: false,
          message: "Formato de credenciais inválido",
          code: "INVALID_FORMAT"
        });
      }

      console.log(`🔐 Login attempt: ${username} from ${clientIP}`);

      // Buscar usuário
      const user = await storage.getUserByUsername(username.trim());
      if (!user) {
        console.log(`❌ User not found: ${username}`);
        // Delay consistente para evitar timing attacks
        await new Promise(resolve => setTimeout(resolve, 200));
        return res.status(401).json({ 
          success: false,
          message: "Credenciais inválidas",
          code: "INVALID_CREDENTIALS"
        });
      }

      // Verificar senha
      const isValidPassword = await bcrypt.compare(password, user.password);
      if (!isValidPassword) {
        console.log(`❌ Invalid password for user: ${username}`);
        return res.status(401).json({ 
          success: false,
          message: "Credenciais inválidas",
          code: "INVALID_CREDENTIALS"
        });
      }

      // Dados do usuário seguros
      const userData = {
        id: user.id,
        username: user.username,
        name: user.name,
        email: user.email,
        role: user.role
      };

      // Regenerar ID da sessão por segurança
      req.session.regenerate((err) => {
        if (err) {
          console.error('Session regeneration error:', err);
          // Continuar mesmo com erro de regeneração
        }
        
        // Configurar sessão do usuário
        req.session.user = userData;
        req.session.loginTime = new Date().toISOString();
        req.session.clientIP = clientIP;

        // Gerar JWT token seguro
        const tokenPayload = {
          ...userData,
          iat: Math.floor(Date.now() / 1000),
          loginTime: req.session.loginTime
        };
        
        const token = jwt.sign(tokenPayload, JWT_SECRET, {
          expiresIn: '24h',
          issuer: 'estagiopro-ufvjm',
          audience: req.get('host') || 'localhost'
        });
        
        const duration = Date.now() - startTime;
        console.log(`✅ Login successful: ${userData.username} (${userData.role}) in ${duration}ms`);

        // Resposta de sucesso
        res.json({ 
          success: true,
          user: userData,
          token: token,
          sessionId: req.sessionID,
          expiresIn: 24 * 60 * 60, // 24 horas em segundos
          message: "Autenticação realizada com sucesso"
        });
      });
      
    } catch (error) {
      const duration = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : 'Erro interno';
      
      console.error(`❌ Login error (${duration}ms):`, errorMessage);
      
      res.status(500).json({ 
        success: false,
        message: "Erro interno do servidor",
        code: "INTERNAL_ERROR"
      });
    }
  });

  app.post("/api/auth/logout", (req: AuthenticatedRequest, res) => {
    try {
      const username = req.session?.user?.username || 'unknown';
      const sessionId = req.sessionID;
      
      console.log(`🚪 Logout request: ${username} (session: ${sessionId})`);
      
      req.session.destroy((err) => {
        if (err) {
          console.error('Session destruction error:', err);
          return res.status(500).json({ 
            success: false,
            message: "Erro ao encerrar sessão",
            code: "LOGOUT_ERROR"
          });
        }
        
        // Limpar cookies de sessão
        const cookieName = isProduction ? '__Host-sid' : 'connect.sid';
        res.clearCookie(cookieName);
        
        console.log(`✅ Logout successful: ${username}`);
        
        res.json({ 
          success: true,
          message: "Logout realizado com sucesso"
        });
      });
      
    } catch (error) {
      console.error('Logout error:', error);
      res.status(500).json({ 
        success: false,
        message: "Erro interno no logout",
        code: "INTERNAL_ERROR"
      });
    }
  });

  app.get("/api/auth/me", requireAuth, (req: AuthenticatedRequest, res) => {
    try {
      const user = req.session.user;
      
      if (!user) {
        return res.status(401).json({ 
          success: false,
          message: "Sessão não encontrada",
          code: "NO_SESSION"
        });
      }
      
      // Informações seguras do usuário
      const safeUserData = {
        id: user.id,
        username: user.username,
        name: user.name,
        email: user.email,
        role: user.role,
        sessionActive: true,
        loginTime: req.session.loginTime || null
      };
      
      res.json({ 
        success: true,
        user: safeUserData,
        sessionId: req.sessionID
      });
      
    } catch (error) {
      console.error('Error in /api/auth/me:', error);
      res.status(500).json({ 
        success: false,
        message: "Erro interno",
        code: "INTERNAL_ERROR"
      });
    }
  });

  // Rota para alterar senha do usuário logado
  app.put("/api/auth/change-password", requireAuth, async (req: any, res) => {
    try {
      const { currentPassword, newPassword } = req.body;
      // O req.session.user já foi definido pelo middleware requireAuth
      const userId = req.session.user.id;

      if (!currentPassword || !newPassword) {
        return res.status(400).json({ message: "Senha atual e nova senha são obrigatórias" });
      }

      if (newPassword.length < 6) {
        return res.status(400).json({ message: "Nova senha deve ter pelo menos 6 caracteres" });
      }

      // Buscar usuário atual
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "Usuário não encontrado" });
      }

      // Verificar senha atual
      const isValidPassword = await bcrypt.compare(currentPassword, user.password);
      if (!isValidPassword) {
        return res.status(401).json({ message: "Senha atual incorreta" });
      }

      // Hash da nova senha
      const hashedPassword = await bcrypt.hash(newPassword, 10);

      // Atualizar senha
      await storage.updateUserPassword(userId, hashedPassword);

      res.json({ message: "Senha alterada com sucesso" });
    } catch (error) {
      console.error("Error changing password:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
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

  app.post("/api/advisors/register", requireAuth, requireAdmin, async (req, res) => {
    try {
      const { password, role, ...advisorData } = req.body;
      
      // Validar dados do orientador (incluindo email)
      const validatedAdvisorData = insertAdvisorSchema.parse(advisorData);
      
      // Verificar se o email já existe
      const existingUser = await storage.getUserByEmail(validatedAdvisorData.email);
      if (existingUser) {
        return res.status(400).json({ message: "Email já está em uso" });
      }
      
      // Criar orientador com usuário
      const result = await storage.createAdvisorWithUser(validatedAdvisorData, { 
        email: validatedAdvisorData.email, 
        password, 
        role 
      });
      
      res.status(201).json({
        advisor: result.advisor,
        message: "Orientador e usuário criados com sucesso"
      });
    } catch (error) {
      console.error("Erro ao registrar orientador:", error);
      res.status(400).json({ message: "Erro ao criar orientador e usuário" });
    }
  });

  // Student routes
  app.get("/api/students", requireAuth, async (req: any, res) => {
    try {
      let students;
      if (req.session.user.role === "administrator") {
        students = await storage.getAllStudents();
      } else {
        // Professors can only see students they supervise
        students = await storage.getStudentsByAdvisor(req.session.user.id);
      }
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
    } catch (error: any) {
      console.error("Erro ao criar estudante:", error);
      
      // Verificar se é erro de email duplicado
      if (error?.code === '23505' && error?.constraint === 'students_email_unique') {
        return res.status(400).json({ message: "Este email já está cadastrado para outro estudante" });
      }
      
      // Verificar se é erro de matrícula duplicada
      if (error?.code === '23505' && error?.constraint === 'students_registration_number_unique') {
        return res.status(400).json({ message: "Este número de matrícula já está cadastrado" });
      }
      
      // Outros erros de validação
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
    } catch (error: any) {
      console.error("Erro ao atualizar estudante:", error);
      
      // Verificar se é erro de email duplicado
      if (error?.code === '23505' && error?.constraint === 'students_email_unique') {
        return res.status(400).json({ message: "Este email já está cadastrado para outro estudante" });
      }
      
      // Verificar se é erro de matrícula duplicada
      if (error?.code === '23505' && error?.constraint === 'students_registration_number_unique') {
        return res.status(400).json({ message: "Este número de matrícula já está cadastrado" });
      }
      
      // Outros erros de validação
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

  // Mandatory Internships routes
  app.get("/api/mandatory-internships", requireAuth, async (req: any, res) => {
    try {
      let mandatoryInternships;
      if (req.session.user.role === "administrator") {
        mandatoryInternships = await storage.getAllMandatoryInternships();
      } else {
        // Professors can only see mandatory internships they supervise
        mandatoryInternships = await storage.getMandatoryInternshipsByAdvisor(req.session.user.id);
      }
      res.json(mandatoryInternships);
    } catch (error) {
      res.status(500).json({ message: "Erro ao buscar estágios obrigatórios" });
    }
  });

  app.post("/api/mandatory-internships", requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      // Converter strings de data para objetos Date
      const processedBody = {
        ...req.body,
        startDate: req.body.startDate ? new Date(req.body.startDate) : null,
        endDate: req.body.endDate ? new Date(req.body.endDate) : null,
      };
      
      const mandatoryInternshipData = insertMandatoryInternshipSchema.parse(processedBody);
      
      // Verificar se já existe estágio obrigatório ativo para o mesmo estudante
      const existingInternships = await storage.getMandatoryInternshipsByStudent(mandatoryInternshipData.studentId);
      const activeInternship = existingInternships.find(internship => 
        internship.isActive && 
        internship.status !== 'completed' && 
        internship.status !== 'cancelled'
      );
      
      if (activeInternship) {
        return res.status(409).json({ 
          success: false,
          message: "O estudante já possui um estágio obrigatório ativo. Complete ou cancele o estágio atual antes de criar um novo.",
          code: "DUPLICATE_ACTIVE_INTERNSHIP",
          existingInternship: {
            id: activeInternship.id,
            status: activeInternship.status,
            startDate: activeInternship.startDate,
            endDate: activeInternship.endDate
          }
        });
      }
      
      const mandatoryInternship = await storage.createMandatoryInternship(mandatoryInternshipData);
      res.status(201).json({
        success: true,
        data: mandatoryInternship,
        message: "Estágio obrigatório criado com sucesso"
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      console.error("Error creating mandatory internship:", errorMessage);
      
      // Tratar erros específicos
      if (error instanceof Error && error.message.includes('foreign key')) {
        return res.status(400).json({ 
          success: false,
          message: "Estudante, orientador ou empresa não encontrados",
          code: "INVALID_REFERENCES"
        });
      }
      
      res.status(400).json({ 
        success: false,
        message: "Dados inválidos para criação do estágio",
        code: "VALIDATION_ERROR"
      });
    }
  });

  app.put("/api/mandatory-internships/:id", requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      
      // Converter strings de data para objetos Date
      const processedBody = {
        ...req.body,
        startDate: req.body.startDate ? new Date(req.body.startDate) : null,
        endDate: req.body.endDate ? new Date(req.body.endDate) : null,
      };
      
      const mandatoryInternshipData = insertMandatoryInternshipSchema.partial().parse(processedBody);
      const mandatoryInternship = await storage.updateMandatoryInternship(id, mandatoryInternshipData);
      if (!mandatoryInternship) {
        return res.status(404).json({ message: "Estágio obrigatório não encontrado" });
      }
      res.json(mandatoryInternship);
    } catch (error) {
      console.error("Error updating mandatory internship:", error);
      res.status(400).json({ message: "Dados inválidos", error: error.message });
    }
  });

  app.delete("/api/mandatory-internships/:id", requireAuth, requireAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const success = await storage.deleteMandatoryInternship(id);
      if (!success) {
        return res.status(404).json({ message: "Estágio obrigatório não encontrado" });
      }
      res.json({ message: "Estágio obrigatório excluído com sucesso" });
    } catch (error) {
      res.status(500).json({ message: "Erro ao excluir estágio obrigatório" });
    }
  });

  // Rota específica para buscar um estágio obrigatório
  app.get("/api/mandatory-internships/:id", requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const mandatoryInternship = await storage.getMandatoryInternshipById(id);
      if (!mandatoryInternship) {
        return res.status(404).json({ message: "Estágio obrigatório não encontrado" });
      }
      res.json(mandatoryInternship);
    } catch (error) {
      res.status(500).json({ message: "Erro ao buscar estágio obrigatório" });
    }
  });

  // Rota para atualizar carga horária
  app.put("/api/mandatory-internships/:id/workload", requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const { partialWorkload, notes } = req.body;
      
      const mandatoryInternship = await storage.updateMandatoryInternshipWorkload(id, {
        partialWorkload,
        workloadNotes: notes
      });
      
      if (!mandatoryInternship) {
        return res.status(404).json({ message: "Estágio obrigatório não encontrado" });
      }
      
      res.json(mandatoryInternship);
    } catch (error) {
      console.error("Erro ao atualizar carga horária:", error);
      res.status(400).json({ message: "Erro ao atualizar carga horária" });
    }
  });

  // Rota para upload de relatórios
  app.post("/api/mandatory-internships/:id/reports", requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      // Por enquanto, apenas marcar o relatório como entregue
      // Em uma implementação completa, usaríamos multer para fazer upload real
      const { reportType, reportNumber } = req.body;
      
      const updateData: any = {};
      updateData[`r${reportNumber}`] = true;
      
      const mandatoryInternship = await storage.updateMandatoryInternship(id, updateData);
      
      if (!mandatoryInternship) {
        return res.status(404).json({ message: "Estágio obrigatório não encontrado" });
      }
      
      res.json({ message: "Relatório enviado com sucesso", mandatoryInternship });
    } catch (error) {
      console.error("Erro ao enviar relatório:", error);
      res.status(400).json({ message: "Erro ao enviar relatório" });
    }
  });

  // Non-Mandatory Internships routes
  app.get("/api/non-mandatory-internships", requireAuth, async (req: any, res) => {
    try {
      let nonMandatoryInternships;
      if (req.session.user.role === "administrator") {
        nonMandatoryInternships = await storage.getAllNonMandatoryInternships();
      } else {
        // Professors can only see non-mandatory internships they supervise
        nonMandatoryInternships = await storage.getNonMandatoryInternshipsByAdvisor(req.session.user.id);
      }
      res.json(nonMandatoryInternships);
    } catch (error) {
      res.status(500).json({ message: "Erro ao buscar estágios não obrigatórios" });
    }
  });

  app.post("/api/non-mandatory-internships", requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      // Converter strings de data para objetos Date
      const processedBody = {
        ...req.body,
        startDate: req.body.startDate ? new Date(req.body.startDate) : null,
        endDate: req.body.endDate ? new Date(req.body.endDate) : null,
      };
      
      const nonMandatoryInternshipData = insertNonMandatoryInternshipSchema.parse(processedBody);
      
      // Verificar se já existe estágio não obrigatório ativo para o mesmo estudante na mesma empresa
      const existingInternships = await storage.getNonMandatoryInternshipsByStudent(nonMandatoryInternshipData.studentId);
      const conflictingInternship = existingInternships.find(internship => 
        internship.isActive && 
        internship.status !== 'completed' && 
        internship.status !== 'cancelled' &&
        internship.companyId === nonMandatoryInternshipData.companyId
      );
      
      if (conflictingInternship) {
        return res.status(409).json({ 
          success: false,
          message: "O estudante já possui um estágio não obrigatório ativo na mesma empresa. Complete ou cancele o estágio atual antes de criar um novo.",
          code: "DUPLICATE_ACTIVE_INTERNSHIP_SAME_COMPANY",
          existingInternship: {
            id: conflictingInternship.id,
            status: conflictingInternship.status,
            startDate: conflictingInternship.startDate,
            endDate: conflictingInternship.endDate
          }
        });
      }
      
      const nonMandatoryInternship = await storage.createNonMandatoryInternship(nonMandatoryInternshipData);
      res.status(201).json({
        success: true,
        data: nonMandatoryInternship,
        message: "Estágio não obrigatório criado com sucesso"
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      console.error("Error creating non-mandatory internship:", errorMessage);
      
      // Tratar erros específicos
      if (error instanceof Error && error.message.includes('foreign key')) {
        return res.status(400).json({ 
          success: false,
          message: "Estudante, orientador ou empresa não encontrados",
          code: "INVALID_REFERENCES"
        });
      }
      
      res.status(400).json({ 
        success: false,
        message: "Dados inválidos para criação do estágio",
        code: "VALIDATION_ERROR"
      });
    }
  });

  app.put("/api/non-mandatory-internships/:id", requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      
      // Converter strings de data para objetos Date
      const processedBody = {
        ...req.body,
        startDate: req.body.startDate ? new Date(req.body.startDate) : null,
        endDate: req.body.endDate ? new Date(req.body.endDate) : null,
      };
      
      const nonMandatoryInternshipData = insertNonMandatoryInternshipSchema.partial().parse(processedBody);
      const nonMandatoryInternship = await storage.updateNonMandatoryInternship(id, nonMandatoryInternshipData);
      if (!nonMandatoryInternship) {
        return res.status(404).json({ message: "Estágio não obrigatório não encontrado" });
      }
      res.json(nonMandatoryInternship);
    } catch (error) {
      console.error("Error updating non-mandatory internship:", error);
      res.status(400).json({ message: "Dados inválidos", error: error.message });
    }
  });

  app.delete("/api/non-mandatory-internships/:id", requireAuth, requireAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const success = await storage.deleteNonMandatoryInternship(id);
      if (!success) {
        return res.status(404).json({ message: "Estágio não obrigatório não encontrado" });
      }
      res.json({ message: "Estágio não obrigatório excluído com sucesso" });
    } catch (error) {
      res.status(500).json({ message: "Erro ao excluir estágio não obrigatório" });
    }
  });

  // Object Storage routes
  app.get("/objects/:objectPath(*)", requireAuth, async (req, res) => {
    const userId = req.session.user?.id;
    const objectStorageService = new ObjectStorageService();
    try {
      const objectFile = await objectStorageService.getObjectEntityFile(
        req.path,
      );
      const canAccess = await objectStorageService.canAccessObjectEntity({
        objectFile,
        userId: userId,
        requestedPermission: ObjectPermission.READ,
      });
      if (!canAccess) {
        return res.sendStatus(401);
      }
      objectStorageService.downloadObject(objectFile, res);
    } catch (error) {
      console.error("Error checking object access:", error);
      if (error instanceof ObjectNotFoundError) {
        return res.sendStatus(404);
      }
      return res.sendStatus(500);
    }
  });

  app.post("/api/objects/upload", requireAuth, async (req, res) => {
    const objectStorageService = new ObjectStorageService();
    const uploadURL = await objectStorageService.getObjectEntityUploadURL();
    res.json({ uploadURL });
  });

  // Upload de relatório de estágio obrigatório
  app.post("/api/mandatory-internships/:id/reports/:reportNumber/upload", requireAuth, async (req, res) => {
    try {
      const { id, reportNumber } = req.params;
      const { fileUrl } = req.body;
      const userId = req.session.user?.id;

      if (!userId) {
        return res.status(401).json({ message: "Usuário não autenticado" });
      }

      if (!fileUrl) {
        return res.status(400).json({ message: "URL do arquivo é obrigatória" });
      }

      const reportNum = parseInt(reportNumber);
      if (reportNum < 1 || reportNum > 10) {
        return res.status(400).json({ message: "Número de relatório inválido" });
      }

      // Configurar ACL do objeto
      const objectStorageService = new ObjectStorageService();
      const normalizedPath = await objectStorageService.trySetObjectEntityAclPolicy(
        fileUrl,
        {
          owner: userId,
          visibility: "private",
        },
      );

      // Atualizar o estágio com a URL e marcar como entregue
      const reportUrlField = `r${reportNum}Url`;
      const reportField = `r${reportNum}`;
      
      const updateData = {
        [reportUrlField]: normalizedPath,
        [reportField]: true,
        updatedAt: new Date()
      };

      const updatedInternship = await storage.updateMandatoryInternship(id, updateData);
      
      if (!updatedInternship) {
        return res.status(404).json({ message: "Estágio não encontrado" });
      }

      res.json({ 
        message: "Relatório enviado com sucesso",
        reportUrl: normalizedPath,
        internship: updatedInternship
      });
    } catch (error) {
      console.error("Erro ao fazer upload do relatório:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // Document management routes
  app.get("/api/documents", requireAuth, async (req, res) => {
    try {
      const { internshipId, internshipType } = req.query;
      const documents = await storage.getDocuments(
        internshipId as string, 
        internshipType as "mandatory" | "non_mandatory"
      );
      res.json(documents);
    } catch (error) {
      console.error("Error fetching documents:", error);
      res.status(500).json({ message: "Erro ao buscar documentos" });
    }
  });

  app.post("/api/documents", requireAuth, async (req, res) => {
    try {
      const userId = req.session.user?.id;
      if (!userId) {
        return res.status(401).json({ message: "Usuário não autenticado" });
      }

      const documentData = {
        ...req.body,
        uploadedBy: userId
      };

      const validatedData = insertInternshipDocumentSchema.parse(documentData);
      
      // Se há um arquivo anexado, normalizar o path
      let finalDocumentData = validatedData;
      
      if (validatedData.filePath) {
        try {
          const objectStorageService = new ObjectStorageService();
          const normalizedPath = await objectStorageService.trySetObjectEntityAclPolicy(
            validatedData.filePath,
            {
              owner: userId,
              visibility: "private",
            },
          );
          
          finalDocumentData = {
            ...validatedData,
            filePath: normalizedPath,
          };
        } catch (error) {
          console.error("Erro ao configurar ACL do arquivo:", error);
          // Continuar sem normalização se não for possível
          finalDocumentData = validatedData;
        }
      }

      const document = await storage.createDocument(finalDocumentData);
      res.status(201).json(document);
    } catch (error) {
      console.error("Error creating document:", error);
      if (error.message.includes('validation')) {
        res.status(400).json({ message: "Dados inválidos para o documento" });
      } else {
        res.status(500).json({ message: "Erro interno do servidor" });
      }
    }
  });

  app.put("/api/documents/:id", requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const userId = req.session.user?.id;
      
      const documentData = req.body;
      if (documentData.reviewedBy) {
        documentData.reviewedBy = userId;
        documentData.reviewedAt = new Date();
      }

      const validatedData = insertInternshipDocumentSchema.partial().parse(documentData);
      const document = await storage.updateDocument(id, validatedData);
      
      if (!document) {
        return res.status(404).json({ message: "Documento não encontrado" });
      }
      res.json(document);
    } catch (error) {
      console.error("Error updating document:", error);
      res.status(400).json({ message: "Dados inválidos" });
    }
  });

  app.delete("/api/documents/:id", requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const success = await storage.deleteDocument(id);
      if (!success) {
        return res.status(404).json({ message: "Documento não encontrado" });
      }
      res.json({ message: "Documento excluído com sucesso" });
    } catch (error) {
      console.error("Error deleting document:", error);
      res.status(500).json({ message: "Erro ao excluir documento" });
    }
  });

  // Alert routes
  app.get("/api/alerts", requireAuth, requireAdmin, async (req: any, res) => {
    try {
      // Apenas administradores podem acessar a Central de Alertas
      const alerts = await alertService.getActiveAlerts();
      res.json(alerts);
    } catch (error) {
      res.status(500).json({ message: "Erro ao buscar alertas" });
    }
  });

  app.put("/api/alerts/:id/read", requireAuth, requireAdmin, async (req: any, res) => {
    try {
      const { id } = req.params;
      await alertService.markAlertAsRead(id, req.session.user.id);
      res.json({ message: "Alerta marcado como lido" });
    } catch (error) {
      res.status(500).json({ message: "Erro ao marcar alerta como lido" });
    }
  });

  app.put("/api/alerts/:id/dismiss", requireAuth, requireAdmin, async (req: any, res) => {
    try {
      const { id } = req.params;
      await alertService.dismissAlert(id, req.session.user.id);
      res.json({ message: "Alerta dispensado" });
    } catch (error) {
      res.status(500).json({ message: "Erro ao dispensar alerta" });
    }
  });

  app.post("/api/alerts/check", requireAuth, async (req: any, res) => {
    try {
      // Apenas administradores podem executar verificação manual
      if (req.session.user.role !== "administrator") {
        return res.status(403).json({ message: "Acesso negado" });
      }
      
      const result = await alertService.runManualCheck();
      res.json(result);
    } catch (error) {
      console.error("Erro na verificação de alertas:", error);
      res.status(500).json({ message: "Erro ao executar verificação de alertas" });
    }
  });

  // Send WhatsApp notification for specific alert
  app.post("/api/alerts/:id/send-whatsapp", requireAuth, requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id } = req.params;
      const { recipient } = req.body; // 'student', 'advisor', or 'both'
      
      if (!recipient || !['student', 'advisor', 'both'].includes(recipient)) {
        return res.status(400).json({ message: "Destinatário inválido. Use 'student', 'advisor' ou 'both'" });
      }

      const result = await alertService.sendWhatsAppForAlert(id, recipient);
      res.json(result);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro ao enviar WhatsApp';
      console.error("Error sending WhatsApp:", errorMessage);
      res.status(500).json({ message: "Erro ao enviar WhatsApp", details: errorMessage });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
