import { users, advisors, students, companies, internships, mandatoryInternships, nonMandatoryInternships, internshipDocuments, type User, type InsertUser, type Advisor, type InsertAdvisor, type Student, type InsertStudent, type Company, type InsertCompany, type Internship, type InsertInternship, type MandatoryInternship, type InsertMandatoryInternship, type NonMandatoryInternship, type InsertNonMandatoryInternship, type InternshipDocument, type InsertInternshipDocument } from "@shared/schema";
import { db } from "./db";
import { eq, and, inArray } from "drizzle-orm";
import bcrypt from "bcrypt";

export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getAllUsers(): Promise<User[]>;
  updateUser(id: string, user: Partial<InsertUser>): Promise<User | undefined>;
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
  getMandatoryInternshipsByAdvisor(advisorId: string): Promise<MandatoryInternship[]>;
  getMandatoryInternshipsByStudent(studentId: string): Promise<MandatoryInternship[]>;
  createMandatoryInternship(mandatoryInternship: InsertMandatoryInternship): Promise<MandatoryInternship>;
  updateMandatoryInternship(id: string, mandatoryInternship: Partial<InsertMandatoryInternship>): Promise<MandatoryInternship | undefined>;
  deleteMandatoryInternship(id: string): Promise<boolean>;

  // Non-Mandatory Internship operations
  getNonMandatoryInternship(id: string): Promise<NonMandatoryInternship | undefined>;
  getAllNonMandatoryInternships(): Promise<NonMandatoryInternship[]>;
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

  async deleteUser(id: string): Promise<boolean> {
    const result = await db.delete(users).where(eq(users.id, id));
    return result.rowCount > 0;
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
    // Usar transação para garantir que ambos sejam criados ou nenhum
    return await db.transaction(async (tx) => {
      // Criar usuário primeiro
      const hashedPassword = await bcrypt.hash(userData.password, 10);
      // Gerar username baseado no email (parte antes do @)
      const username = userData.email.split('@')[0];
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

  async updateAdvisor(id: string, advisorUpdate: Partial<InsertAdvisor>): Promise<Advisor | undefined> {
    const [advisor] = await db
      .update(advisors)
      .set(advisorUpdate)
      .where(eq(advisors.id, id))
      .returning();
    return advisor || undefined;
  }

  async deleteAdvisor(id: string): Promise<boolean> {
    const result = await db
      .update(advisors)
      .set({ isActive: false })
      .where(eq(advisors.id, id));
    return result.rowCount > 0;
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
      .selectDistinct({ studentId: mandatoryInternships.studentId })
      .from(mandatoryInternships)
      .where(eq(mandatoryInternships.advisorId, advisorId));

    const nonMandatoryStudentIds = await db
      .selectDistinct({ studentId: nonMandatoryInternships.studentId })
      .from(nonMandatoryInternships)
      .where(eq(nonMandatoryInternships.advisorId, advisorId));

    // Combinar os IDs dos estudantes
    const allStudentIds = [
      ...mandatoryStudentIds.map(item => item.studentId),
      ...nonMandatoryStudentIds.map(item => item.studentId)
    ];

    // Remover duplicatas
    const uniqueStudentIds = [...new Set(allStudentIds)];

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
    return result.rowCount > 0;
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
    return result.rowCount > 0;
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
    return result.rowCount > 0;
  }

  // Mandatory Internship operations
  async getMandatoryInternship(id: string): Promise<MandatoryInternship | undefined> {
    const [mandatoryInternship] = await db.select().from(mandatoryInternships).where(eq(mandatoryInternships.id, id));
    return mandatoryInternship || undefined;
  }

  async getAllMandatoryInternships(): Promise<MandatoryInternship[]> {
    return await db.select().from(mandatoryInternships);
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
    return result.rowCount > 0;
  }

  // Non-Mandatory Internship operations
  async getNonMandatoryInternship(id: string): Promise<NonMandatoryInternship | undefined> {
    const [nonMandatoryInternship] = await db.select().from(nonMandatoryInternships).where(eq(nonMandatoryInternships.id, id));
    return nonMandatoryInternship || undefined;
  }

  async getAllNonMandatoryInternships(): Promise<NonMandatoryInternship[]> {
    return await db.select().from(nonMandatoryInternships);
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
    return result.rowCount > 0;
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
    return result.rowCount > 0;
  }
}

export const storage = new DatabaseStorage();
