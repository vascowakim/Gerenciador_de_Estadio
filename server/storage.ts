import { users, advisors, students, companies, internships, mandatoryInternships, nonMandatoryInternships, internshipDocuments, internshipAlerts, systemSettings, type User, type InsertUser, type Advisor, type InsertAdvisor, type Student, type InsertStudent, type Company, type InsertCompany, type Internship, type InsertInternship, type MandatoryInternship, type InsertMandatoryInternship, type NonMandatoryInternship, type InsertNonMandatoryInternship, type InternshipDocument, type InsertInternshipDocument, type InternshipAlert, type InsertInternshipAlert, type SystemSetting, type InsertSystemSetting } from "@shared/schema";
import { db } from "./db";
import { eq, and, inArray, sql } from "drizzle-orm";
import bcrypt from "bcrypt";

export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getAllUsers(): Promise<User[]>;
  updateUser(id: string, user: Partial<InsertUser>): Promise<User | undefined>;
  updateUserPassword(id: string, hashedPassword: string): Promise<void>;
  deleteUser(id: string): Promise<boolean>;

  // Advisor operations
  getAdvisor(id: string): Promise<Advisor | undefined>;
  getAllAdvisors(): Promise<Advisor[]>;
  createAdvisor(advisor: InsertAdvisor): Promise<Advisor>;
  createAdvisorWithUser(advisor: InsertAdvisor, userData: { email: string; password: string; role: string }): Promise<{ advisor: Advisor; user: User }>;
  updateAdvisor(id: string, advisor: Partial<InsertAdvisor>): Promise<Advisor | undefined>;
  deleteAdvisor(id: string): Promise<boolean>;

  // Student operations
  getStudent(id: string): Promise<Student | undefined>;
  getAllStudents(): Promise<Student[]>;
  getStudentsByAdvisor(advisorId: string): Promise<Student[]>;
  createStudent(student: InsertStudent): Promise<Student>;
  updateStudent(id: string, student: Partial<InsertStudent>): Promise<Student | undefined>;
  deleteStudent(id: string): Promise<boolean>;

  // Company operations
  getCompany(id: string): Promise<Company | undefined>;
  getAllCompanies(): Promise<Company[]>;
  createCompany(company: InsertCompany): Promise<Company>;
  updateCompany(id: string, company: Partial<InsertCompany>): Promise<Company | undefined>;
  deleteCompany(id: string): Promise<boolean>;

  // Internship operations
  getInternship(id: string): Promise<Internship | undefined>;
  getAllInternships(): Promise<Internship[]>;
  getInternshipsByAdvisor(advisorId: string): Promise<Internship[]>;
  getInternshipsByStudent(studentId: string): Promise<Internship[]>;
  createInternship(internship: InsertInternship): Promise<Internship>;
  updateInternship(id: string, internship: Partial<InsertInternship>): Promise<Internship | undefined>;
  deleteInternship(id: string): Promise<boolean>;

  // Mandatory Internship operations
  getMandatoryInternship(id: string): Promise<MandatoryInternship | undefined>;
  getAllMandatoryInternships(): Promise<MandatoryInternship[]>;
  getAllMandatoryInternshipsWithCreator(): Promise<(MandatoryInternship & { createdByUser?: { name: string; email: string; role: string } })[]>;
  getMandatoryInternshipsByAdvisor(advisorId: string): Promise<MandatoryInternship[]>;
  getMandatoryInternshipsByStudent(studentId: string): Promise<MandatoryInternship[]>;
  createMandatoryInternship(mandatoryInternship: InsertMandatoryInternship): Promise<MandatoryInternship>;
  updateMandatoryInternship(id: string, mandatoryInternship: Partial<InsertMandatoryInternship>): Promise<MandatoryInternship | undefined>;
  deleteMandatoryInternship(id: string): Promise<boolean>;

  // Non-Mandatory Internship operations
  getNonMandatoryInternship(id: string): Promise<NonMandatoryInternship | undefined>;
  getAllNonMandatoryInternships(): Promise<NonMandatoryInternship[]>;
  getAllNonMandatoryInternshipsWithCreator(): Promise<(NonMandatoryInternship & { createdByUser?: { name: string; email: string; role: string } })[]>;
  getNonMandatoryInternshipsByAdvisor(advisorId: string): Promise<NonMandatoryInternship[]>;
  getNonMandatoryInternshipsByStudent(studentId: string): Promise<NonMandatoryInternship[]>;
  createNonMandatoryInternship(nonMandatoryInternship: InsertNonMandatoryInternship): Promise<NonMandatoryInternship>;
  updateNonMandatoryInternship(id: string, nonMandatoryInternship: Partial<InsertNonMandatoryInternship>): Promise<NonMandatoryInternship | undefined>;
  deleteNonMandatoryInternship(id: string): Promise<boolean>;

  // Document operations
  getDocument(id: string): Promise<InternshipDocument | undefined>;
  getDocuments(internshipId: string, internshipType: "mandatory" | "non_mandatory"): Promise<InternshipDocument[]>;
  createDocument(document: InsertInternshipDocument): Promise<InternshipDocument>;
  updateDocument(id: string, document: Partial<InsertInternshipDocument>): Promise<InternshipDocument | undefined>;
  deleteDocument(id: string): Promise<boolean>;

  // System Settings operations
  getSystemSetting(key: string): Promise<SystemSetting | undefined>;
  getAllSystemSettings(): Promise<SystemSetting[]>;
  createOrUpdateSystemSetting(setting: InsertSystemSetting): Promise<SystemSetting>;
  deleteSystemSetting(key: string): Promise<boolean>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users);
  }

  async updateUser(id: string, userUpdate: Partial<InsertUser>): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set(userUpdate)
      .where(eq(users.id, id))
      .returning();
    return user || undefined;
  }

  async updateUserPassword(id: string, hashedPassword: string): Promise<void> {
    await db
      .update(users)
      .set({ password: hashedPassword })
      .where(eq(users.id, id));
  }

  async deleteUser(id: string): Promise<boolean> {
    const result = await db.delete(users).where(eq(users.id, id));
    return (result.rowCount || 0) > 0;
  }

  // Advisor operations
  async getAdvisor(id: string): Promise<Advisor | undefined> {
    const [advisor] = await db.select().from(advisors).where(eq(advisors.id, id));
    return advisor || undefined;
  }

  async getAllAdvisors(): Promise<Advisor[]> {
    return await db.select().from(advisors).where(eq(advisors.isActive, true));
  }

  async createAdvisor(insertAdvisor: InsertAdvisor): Promise<Advisor> {
    const [advisor] = await db
      .insert(advisors)
      .values(insertAdvisor)
      .returning();
    return advisor;
  }

  async createAdvisorWithUser(insertAdvisor: InsertAdvisor, userData: { email: string; password: string; role: string }): Promise<{ advisor: Advisor; user: User }> {
    // Verificar se existe orientador inativo com mesmo email
    const [existingAdvisor] = await db
      .select()
      .from(advisors)
      .where(eq(advisors.email, insertAdvisor.email));

    // Se existe orientador inativo, reativar em vez de criar novo
    if (existingAdvisor && !existingAdvisor.isActive) {
      return await this.reactivateAdvisorWithUser(existingAdvisor.id, insertAdvisor, userData);
    }

    // Usar transação para garantir que ambos sejam criados ou nenhum
    return await db.transaction(async (tx) => {
      // Criar usuário primeiro
      const hashedPassword = await bcrypt.hash(userData.password, 10);
      // Gerar username único baseado no email
      const baseUsername = userData.email.split('@')[0];
      let username = baseUsername;
      let counter = 1;
      
      // Verificar se username já existe e gerar alternativa
      while (await this.getUserByUsername(username)) {
        username = `${baseUsername}${counter}`;
        counter++;
      }
      
      const [user] = await tx
        .insert(users)
        .values({
          username: username,
          email: userData.email,
          password: hashedPassword,
          role: userData.role as "administrator" | "professor",
          name: insertAdvisor.name,
        })
        .returning();

      // Criar orientador vinculado ao usuário
      const [advisor] = await tx
        .insert(advisors)
        .values({
          ...insertAdvisor,
          id: user.id, // Usar o mesmo ID do usuário
        })
        .returning();

      return { advisor, user };
    });
  }

  async reactivateAdvisorWithUser(advisorId: string, newAdvisorData: InsertAdvisor, userData: { email: string; password: string; role: string }): Promise<{ advisor: Advisor; user: User }> {
    return await db.transaction(async (tx) => {
      // Recriar usuário
      const hashedPassword = await bcrypt.hash(userData.password, 10);
      const username = userData.email.split('@')[0];
      const [user] = await tx
        .insert(users)
        .values({
          id: advisorId, // Usar o mesmo ID do orientador
          username: username,
          email: userData.email,
          password: hashedPassword,
          role: userData.role as "administrator" | "professor",
          name: newAdvisorData.name,
        })
        .returning();

      // Atualizar e reativar orientador
      const [advisor] = await tx
        .update(advisors)
        .set({
          ...newAdvisorData,
          isActive: true
        })
        .where(eq(advisors.id, advisorId))
        .returning();

      return { advisor, user };
    });
  }

  async updateAdvisor(id: string, advisorUpdate: Partial<InsertAdvisor>): Promise<Advisor | undefined> {
    const [advisor] = await db
      .update(advisors)
      .set(advisorUpdate)
      .where(eq(advisors.id, id))
      .returning();
    return advisor || undefined;
  }

  async deleteAdvisor(id: string): Promise<boolean> {
    // Usar transação para desativar tanto orientador quanto usuário
    return await db.transaction(async (tx) => {
      // Desativar orientador
      const advisorResult = await tx
        .update(advisors)
        .set({ isActive: false })
        .where(eq(advisors.id, id));
      
      // Desativar usuário associado (mesmo ID)
      await tx
        .delete(users)
        .where(eq(users.id, id));
      
      return (advisorResult.rowCount || 0) > 0;
    });
  }

  // Student operations
  async getStudent(id: string): Promise<Student | undefined> {
    const [student] = await db.select().from(students).where(eq(students.id, id));
    return student || undefined;
  }

  async getAllStudents(): Promise<Student[]> {
    return await db.select().from(students).where(eq(students.isActive, true));
  }

  async getStudentsByAdvisor(advisorId: string): Promise<Student[]> {
    // Buscar estudantes que têm estágios obrigatórios ou não obrigatórios com este orientador
    const mandatoryStudentIds = await db
      .select({ studentId: mandatoryInternships.studentId })
      .from(mandatoryInternships)
      .where(eq(mandatoryInternships.advisorId, advisorId));

    const nonMandatoryStudentIds = await db
      .select({ studentId: nonMandatoryInternships.studentId })
      .from(nonMandatoryInternships)
      .where(eq(nonMandatoryInternships.advisorId, advisorId));

    // Combinar os IDs dos estudantes
    const allStudentIds = [
      ...mandatoryStudentIds.map(item => item.studentId),
      ...nonMandatoryStudentIds.map(item => item.studentId)
    ];

    // Remover duplicatas
    const uniqueStudentIds = Array.from(new Set(allStudentIds));

    if (uniqueStudentIds.length === 0) {
      return [];
    }

    // Buscar os estudantes pelos IDs
    return await db
      .select()
      .from(students)
      .where(
        and(
          eq(students.isActive, true),
          inArray(students.id, uniqueStudentIds)
        )
      );
  }

  async createStudent(insertStudent: InsertStudent): Promise<Student> {
    const [student] = await db
      .insert(students)
      .values(insertStudent)
      .returning();
    return student;
  }

  async updateStudent(id: string, studentUpdate: Partial<InsertStudent>): Promise<Student | undefined> {
    const [student] = await db
      .update(students)
      .set(studentUpdate)
      .where(eq(students.id, id))
      .returning();
    return student || undefined;
  }

  async deleteStudent(id: string): Promise<boolean> {
    const result = await db
      .update(students)
      .set({ isActive: false })
      .where(eq(students.id, id));
    return (result.rowCount || 0) > 0;
  }

  // Company operations
  async getCompany(id: string): Promise<Company | undefined> {
    const [company] = await db.select().from(companies).where(eq(companies.id, id));
    return company || undefined;
  }

  async getAllCompanies(): Promise<Company[]> {
    return await db.select().from(companies).where(eq(companies.isActive, true));
  }

  async createCompany(insertCompany: InsertCompany): Promise<Company> {
    const [company] = await db
      .insert(companies)
      .values(insertCompany)
      .returning();
    return company;
  }

  async updateCompany(id: string, companyUpdate: Partial<InsertCompany>): Promise<Company | undefined> {
    const [company] = await db
      .update(companies)
      .set(companyUpdate)
      .where(eq(companies.id, id))
      .returning();
    return company || undefined;
  }

  async deleteCompany(id: string): Promise<boolean> {
    const result = await db
      .update(companies)
      .set({ isActive: false })
      .where(eq(companies.id, id));
    return (result.rowCount || 0) > 0;
  }

  // Internship operations
  async getInternship(id: string): Promise<Internship | undefined> {
    const [internship] = await db.select().from(internships).where(eq(internships.id, id));
    return internship || undefined;
  }

  async getAllInternships(): Promise<Internship[]> {
    return await db.select().from(internships);
  }

  async getInternshipsByAdvisor(advisorId: string): Promise<Internship[]> {
    return await db.select().from(internships).where(eq(internships.advisorId, advisorId));
  }

  async getInternshipsByStudent(studentId: string): Promise<Internship[]> {
    return await db.select().from(internships).where(eq(internships.studentId, studentId));
  }

  async createInternship(insertInternship: InsertInternship): Promise<Internship> {
    const [internship] = await db
      .insert(internships)
      .values(insertInternship)
      .returning();
    return internship;
  }

  async updateInternship(id: string, internshipUpdate: Partial<InsertInternship>): Promise<Internship | undefined> {
    const [internship] = await db
      .update(internships)
      .set({ ...internshipUpdate, updatedAt: new Date() })
      .where(eq(internships.id, id))
      .returning();
    return internship || undefined;
  }

  async deleteInternship(id: string): Promise<boolean> {
    const result = await db.delete(internships).where(eq(internships.id, id));
    return (result.rowCount || 0) > 0;
  }

  // Mandatory Internship operations
  async getMandatoryInternship(id: string): Promise<MandatoryInternship | undefined> {
    const [mandatoryInternship] = await db.select().from(mandatoryInternships).where(eq(mandatoryInternships.id, id));
    return mandatoryInternship || undefined;
  }

  async getAllMandatoryInternships(): Promise<MandatoryInternship[]> {
    return await db.select().from(mandatoryInternships);
  }

  async getAllMandatoryInternshipsWithCreator(): Promise<(MandatoryInternship & { createdByUser?: { name: string; email: string; role: string } })[]> {
    const result = await db
      .select({
        internship: mandatoryInternships,
        createdByUser: {
          name: users.name,
          email: users.email,
          role: users.role,
        },
      })
      .from(mandatoryInternships)
      .leftJoin(users, eq(mandatoryInternships.createdBy, users.id));
    
    return result.map(row => ({
      ...row.internship,
      createdByUser: row.createdByUser,
    }));
  }

  async getMandatoryInternshipsByAdvisor(advisorId: string): Promise<MandatoryInternship[]> {
    return await db.select().from(mandatoryInternships).where(eq(mandatoryInternships.advisorId, advisorId));
  }

  async getMandatoryInternshipsByStudent(studentId: string): Promise<MandatoryInternship[]> {
    return await db.select().from(mandatoryInternships).where(eq(mandatoryInternships.studentId, studentId));
  }

  async createMandatoryInternship(insertMandatoryInternship: InsertMandatoryInternship): Promise<MandatoryInternship> {
    const [mandatoryInternship] = await db
      .insert(mandatoryInternships)
      .values(insertMandatoryInternship)
      .returning();
    return mandatoryInternship;
  }

  async updateMandatoryInternship(id: string, mandatoryInternshipUpdate: Partial<InsertMandatoryInternship>): Promise<MandatoryInternship | undefined> {
    const [mandatoryInternship] = await db
      .update(mandatoryInternships)
      .set({ ...mandatoryInternshipUpdate, updatedAt: new Date() })
      .where(eq(mandatoryInternships.id, id))
      .returning();
    return mandatoryInternship || undefined;
  }

  async deleteMandatoryInternship(id: string): Promise<boolean> {
    const result = await db.delete(mandatoryInternships).where(eq(mandatoryInternships.id, id));
    return (result.rowCount || 0) > 0;
  }

  // Non-Mandatory Internship operations
  async getNonMandatoryInternship(id: string): Promise<NonMandatoryInternship | undefined> {
    const [nonMandatoryInternship] = await db.select().from(nonMandatoryInternships).where(eq(nonMandatoryInternships.id, id));
    return nonMandatoryInternship || undefined;
  }

  async getAllNonMandatoryInternships(): Promise<NonMandatoryInternship[]> {
    return await db.select().from(nonMandatoryInternships);
  }

  async getAllNonMandatoryInternshipsWithCreator(): Promise<(NonMandatoryInternship & { createdByUser?: { name: string; email: string; role: string } })[]> {
    const result = await db
      .select({
        internship: nonMandatoryInternships,
        createdByUser: {
          name: users.name,
          email: users.email,
          role: users.role,
        },
      })
      .from(nonMandatoryInternships)
      .leftJoin(users, eq(nonMandatoryInternships.createdBy, users.id));
    
    return result.map(row => ({
      ...row.internship,
      createdByUser: row.createdByUser,
    }));
  }

  async getNonMandatoryInternshipsByAdvisor(advisorId: string): Promise<NonMandatoryInternship[]> {
    return await db.select().from(nonMandatoryInternships).where(eq(nonMandatoryInternships.advisorId, advisorId));
  }

  async getNonMandatoryInternshipsByStudent(studentId: string): Promise<NonMandatoryInternship[]> {
    return await db.select().from(nonMandatoryInternships).where(eq(nonMandatoryInternships.studentId, studentId));
  }

  async createNonMandatoryInternship(insertNonMandatoryInternship: InsertNonMandatoryInternship): Promise<NonMandatoryInternship> {
    const [nonMandatoryInternship] = await db
      .insert(nonMandatoryInternships)
      .values(insertNonMandatoryInternship)
      .returning();
    return nonMandatoryInternship;
  }

  async updateNonMandatoryInternship(id: string, nonMandatoryInternshipUpdate: Partial<InsertNonMandatoryInternship>): Promise<NonMandatoryInternship | undefined> {
    const [nonMandatoryInternship] = await db
      .update(nonMandatoryInternships)
      .set({ ...nonMandatoryInternshipUpdate, updatedAt: new Date() })
      .where(eq(nonMandatoryInternships.id, id))
      .returning();
    return nonMandatoryInternship || undefined;
  }

  async deleteNonMandatoryInternship(id: string): Promise<boolean> {
    const result = await db.delete(nonMandatoryInternships).where(eq(nonMandatoryInternships.id, id));
    return (result.rowCount || 0) > 0;
  }

  // Alert operations
  async getAlert(id: string): Promise<InternshipAlert | undefined> {
    const [alert] = await db.select().from(internshipAlerts).where(eq(internshipAlerts.id, id));
    return alert || undefined;
  }

  async getAllAlerts(): Promise<InternshipAlert[]> {
    return await db.select().from(internshipAlerts).where(eq(internshipAlerts.isActive, true));
  }

  async getAlertsByUser(userId: string): Promise<InternshipAlert[]> {
    const alerts = await db.select().from(internshipAlerts).where(eq(internshipAlerts.isActive, true));
    return alerts.filter(alert => {
      const targetUsers = JSON.parse(alert.targetUsers || '[]');
      return targetUsers.includes(userId);
    });
  }

  async createAlert(insertAlert: InsertInternshipAlert): Promise<InternshipAlert> {
    const [alert] = await db
      .insert(internshipAlerts)
      .values(insertAlert)
      .returning();
    return alert;
  }

  async updateAlert(id: string, alertUpdate: Partial<InsertInternshipAlert>): Promise<InternshipAlert | undefined> {
    const [alert] = await db
      .update(internshipAlerts)
      .set({ ...alertUpdate, updatedAt: new Date() })
      .where(eq(internshipAlerts.id, id))
      .returning();
    return alert || undefined;
  }

  async deleteAlert(id: string): Promise<boolean> {
    const result = await db
      .update(internshipAlerts)
      .set({ isActive: false })
      .where(eq(internshipAlerts.id, id));
    return (result.rowCount || 0) > 0;
  }

  // Métodos específicos para controle de estágio obrigatório
  async getMandatoryInternshipById(id: string): Promise<MandatoryInternship | undefined> {
    const [mandatoryInternship] = await db
      .select()
      .from(mandatoryInternships)
      .where(eq(mandatoryInternships.id, id));
    return mandatoryInternship || undefined;
  }

  async updateMandatoryInternshipWorkload(id: string, workloadData: { partialWorkload: number; workloadNotes?: string }): Promise<MandatoryInternship | undefined> {
    const [mandatoryInternship] = await db
      .update(mandatoryInternships)
      .set({ 
        partialWorkload: workloadData.partialWorkload,
        workloadNotes: workloadData.workloadNotes,
        updatedAt: new Date() 
      })
      .where(eq(mandatoryInternships.id, id))
      .returning();
    return mandatoryInternship || undefined;
  }

  // Document operations
  async getDocument(id: string): Promise<InternshipDocument | undefined> {
    const [document] = await db.select().from(internshipDocuments).where(eq(internshipDocuments.id, id));
    return document || undefined;
  }

  async getDocuments(internshipId: string, internshipType: "mandatory" | "non_mandatory"): Promise<InternshipDocument[]> {
    return await db
      .select()
      .from(internshipDocuments)
      .where(
        and(
          eq(internshipDocuments.internshipId, internshipId),
          eq(internshipDocuments.internshipType, internshipType)
        )
      );
  }

  async createDocument(insertDocument: InsertInternshipDocument): Promise<InternshipDocument> {
    const [document] = await db
      .insert(internshipDocuments)
      .values(insertDocument)
      .returning();
    return document;
  }

  async updateDocument(id: string, documentUpdate: Partial<InsertInternshipDocument>): Promise<InternshipDocument | undefined> {
    const [document] = await db
      .update(internshipDocuments)
      .set({ ...documentUpdate, updatedAt: new Date() })
      .where(eq(internshipDocuments.id, id))
      .returning();
    return document || undefined;
  }

  async deleteDocument(id: string): Promise<boolean> {
    const result = await db.delete(internshipDocuments).where(eq(internshipDocuments.id, id));
    return (result.rowCount || 0) > 0;
  }

  // System Settings operations
  async getSystemSetting(key: string): Promise<SystemSetting | undefined> {
    const [setting] = await db
      .select()
      .from(systemSettings)
      .where(eq(systemSettings.key, key));
    return setting || undefined;
  }

  async getAllSystemSettings(): Promise<SystemSetting[]> {
    return await db.select().from(systemSettings).orderBy(systemSettings.key);
  }

  async createOrUpdateSystemSetting(insertSetting: InsertSystemSetting): Promise<SystemSetting> {
    // Verificar se já existe
    const existing = await this.getSystemSetting(insertSetting.key);
    
    if (existing) {
      // Atualizar existente
      const [setting] = await db
        .update(systemSettings)
        .set({
          value: insertSetting.value,
          description: insertSetting.description,
          updatedBy: insertSetting.updatedBy,
          updatedAt: sql`now()`,
        })
        .where(eq(systemSettings.key, insertSetting.key))
        .returning();
      return setting;
    } else {
      // Criar novo
      const [setting] = await db
        .insert(systemSettings)
        .values(insertSetting)
        .returning();
      return setting;
    }
  }

  async deleteSystemSetting(key: string): Promise<boolean> {
    const result = await db.delete(systemSettings).where(eq(systemSettings.key, key));
    return (result.rowCount || 0) > 0;
  }
}

export const storage = new DatabaseStorage();
