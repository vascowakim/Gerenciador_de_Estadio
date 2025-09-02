import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, boolean, pgEnum } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const userRoleEnum = pgEnum("user_role", ["administrator", "professor"]);
export const internshipTypeEnum = pgEnum("internship_type", ["mandatory", "non_mandatory"]);
export const internshipStatusEnum = pgEnum("internship_status", ["pending", "approved", "rejected", "completed"]);

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  role: userRoleEnum("role").notNull().default("professor"),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const advisors = pgTable("advisors", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  position: text("position"),
  siape: text("siape").unique(),
  phone: text("phone"),
  cpf: text("cpf"),
  email: text("email").notNull().unique(),
  department: text("department").notNull(),
  password: text("password"),
  isSystemAdmin: boolean("is_system_admin").default(false).notNull(),
  isInternshipCoordinator: boolean("is_internship_coordinator").default(false).notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const students = pgTable("students", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  registrationNumber: text("registration_number").notNull().unique(),
  course: text("course").notNull(),
  phone: text("phone"),
  cpf: text("cpf"),
  address: text("address"),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const companies = pgTable("companies", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  cnpj: text("cnpj").unique(),
  email: text("email").notNull(),
  phone: text("phone"),
  address: text("address"),
  city: text("city"),
  state: text("state"),
  sector: text("sector"),
  contactPerson: text("contact_person"),
  website: text("website"),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const internships = pgTable("internships", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  studentId: varchar("student_id").notNull().references(() => students.id),
  advisorId: varchar("advisor_id").notNull().references(() => advisors.id),
  companyId: varchar("company_id").references(() => companies.id),
  company: text("company").notNull(),
  position: text("position").notNull(),
  type: internshipTypeEnum("type").notNull(),
  status: internshipStatusEnum("status").default("pending").notNull(),
  startDate: timestamp("start_date"),
  endDate: timestamp("end_date"),
  workload: text("workload"),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const mandatoryInternships = pgTable("mandatory_internships", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  studentId: varchar("student_id").notNull().references(() => students.id),
  advisorId: varchar("advisor_id").notNull().references(() => advisors.id),
  companyId: varchar("company_id").references(() => companies.id),
  supervisor: text("supervisor"),
  crc: text("crc"),
  workload: text("workload"),
  startDate: timestamp("start_date"),
  endDate: timestamp("end_date"),
  status: internshipStatusEnum("status").default("pending").notNull(),
  // Controle de relatórios R1-R10
  r1: boolean("r1").default(false).notNull(),
  r2: boolean("r2").default(false).notNull(),
  r3: boolean("r3").default(false).notNull(),
  r4: boolean("r4").default(false).notNull(),
  r5: boolean("r5").default(false).notNull(),
  r6: boolean("r6").default(false).notNull(),
  r7: boolean("r7").default(false).notNull(),
  r8: boolean("r8").default(false).notNull(),
  r9: boolean("r9").default(false).notNull(),
  r10: boolean("r10").default(false).notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const nonMandatoryInternships = pgTable("non_mandatory_internships", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  studentId: varchar("student_id").notNull().references(() => students.id),
  advisorId: varchar("advisor_id").notNull().references(() => advisors.id),
  companyId: varchar("company_id").references(() => companies.id),
  supervisor: text("supervisor"),
  crc: text("crc"),
  workload: text("workload"),
  startDate: timestamp("start_date"),
  endDate: timestamp("end_date"),
  status: internshipStatusEnum("status").default("pending").notNull(),
  // Controle de relatórios R1-R10
  r1: boolean("r1").default(false).notNull(),
  r2: boolean("r2").default(false).notNull(),
  r3: boolean("r3").default(false).notNull(),
  r4: boolean("r4").default(false).notNull(),
  r5: boolean("r5").default(false).notNull(),
  r6: boolean("r6").default(false).notNull(),
  r7: boolean("r7").default(false).notNull(),
  r8: boolean("r8").default(false).notNull(),
  r9: boolean("r9").default(false).notNull(),
  r10: boolean("r10").default(false).notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  // Users don't have direct relations to other entities in this system
}));

export const advisorsRelations = relations(advisors, ({ many }) => ({
  internships: many(internships),
  mandatoryInternships: many(mandatoryInternships),
  nonMandatoryInternships: many(nonMandatoryInternships),
}));

export const studentsRelations = relations(students, ({ many }) => ({
  internships: many(internships),
  mandatoryInternships: many(mandatoryInternships),
  nonMandatoryInternships: many(nonMandatoryInternships),
}));

export const companiesRelations = relations(companies, ({ many }) => ({
  internships: many(internships),
  mandatoryInternships: many(mandatoryInternships),
  nonMandatoryInternships: many(nonMandatoryInternships),
}));

export const internshipsRelations = relations(internships, ({ one }) => ({
  student: one(students, {
    fields: [internships.studentId],
    references: [students.id],
  }),
  advisor: one(advisors, {
    fields: [internships.advisorId],
    references: [advisors.id],
  }),
  company: one(companies, {
    fields: [internships.companyId],
    references: [companies.id],
  }),
}));

export const mandatoryInternshipsRelations = relations(mandatoryInternships, ({ one }) => ({
  student: one(students, {
    fields: [mandatoryInternships.studentId],
    references: [students.id],
  }),
  advisor: one(advisors, {
    fields: [mandatoryInternships.advisorId],
    references: [advisors.id],
  }),
  company: one(companies, {
    fields: [mandatoryInternships.companyId],
    references: [companies.id],
  }),
}));

export const nonMandatoryInternshipsRelations = relations(nonMandatoryInternships, ({ one }) => ({
  student: one(students, {
    fields: [nonMandatoryInternships.studentId],
    references: [students.id],
  }),
  advisor: one(advisors, {
    fields: [nonMandatoryInternships.advisorId],
    references: [advisors.id],
  }),
  company: one(companies, {
    fields: [nonMandatoryInternships.companyId],
    references: [companies.id],
  }),
}));

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
});

export const insertAdvisorSchema = createInsertSchema(advisors).omit({
  id: true,
  createdAt: true,
});

export const insertStudentSchema = createInsertSchema(students).omit({
  id: true,
  createdAt: true,
});

export const insertCompanySchema = createInsertSchema(companies).omit({
  id: true,
  createdAt: true,
});

export const insertInternshipSchema = createInsertSchema(internships).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertMandatoryInternshipSchema = createInsertSchema(mandatoryInternships).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertNonMandatoryInternshipSchema = createInsertSchema(nonMandatoryInternships).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Advisor = typeof advisors.$inferSelect;
export type InsertAdvisor = z.infer<typeof insertAdvisorSchema>;

export type Student = typeof students.$inferSelect;
export type InsertStudent = z.infer<typeof insertStudentSchema>;

export type Company = typeof companies.$inferSelect;
export type InsertCompany = z.infer<typeof insertCompanySchema>;

export type Internship = typeof internships.$inferSelect;
export type InsertInternship = z.infer<typeof insertInternshipSchema>;

export type MandatoryInternship = typeof mandatoryInternships.$inferSelect;
export type InsertMandatoryInternship = z.infer<typeof insertMandatoryInternshipSchema>;

export type NonMandatoryInternship = typeof nonMandatoryInternships.$inferSelect;
export type InsertNonMandatoryInternship = z.infer<typeof insertNonMandatoryInternshipSchema>;
