import { users, advisors, students, companies, internships, mandatoryInternships, type User, type InsertUser, type Advisor, type InsertAdvisor, type Student, type InsertStudent, type Company, type InsertCompany, type Internship, type InsertInternship, type MandatoryInternship, type InsertMandatoryInternship } from "@shared/schema";
import { db } from "./db";
import { eq, and } from "drizzle-orm";

export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getAllUsers(): Promise<User[]>;
  updateUser(id: string, user: Partial<InsertUser>): Promise<User | undefined>;
  deleteUser(id: string): Promise<boolean>;

  // Advisor operations
  getAdvisor(id: string): Promise<Advisor | undefined>;
  getAllAdvisors(): Promise<Advisor[]>;
  createAdvisor(advisor: InsertAdvisor): Promise<Advisor>;
  updateAdvisor(id: string, advisor: Partial<InsertAdvisor>): Promise<Advisor | undefined>;
  deleteAdvisor(id: string): Promise<boolean>;

  // Student operations
  getStudent(id: string): Promise<Student | undefined>;
  getAllStudents(): Promise<Student[]>;
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
}

export const storage = new DatabaseStorage();
