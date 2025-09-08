import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, boolean, integer, pgEnum } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const userRoleEnum = pgEnum("user_role", ["administrator", "professor"]);
export const internshipTypeEnum = pgEnum("internship_type", ["mandatory", "non_mandatory"]);
export const internshipStatusEnum = pgEnum("internship_status", ["pending", "approved", "rejected", "completed"]);
export const documentTypeEnum = pgEnum("document_type", [
  "enrollment_certificate", 
  "insurance_policy", 
  "internship_plan",
  "activity_report",
  "final_report",
  "company_evaluation",
  "student_evaluation",
  "attendance_sheet",
  "other"
]);
export const documentStatusEnum = pgEnum("document_status", ["pending", "approved", "rejected", "needs_revision"]);
export const alertTypeEnum = pgEnum("alert_type", ["expiration_warning", "document_missing", "system_alert"]);
export const alertStatusEnum = pgEnum("alert_status", ["pending", "sent", "read", "dismissed"]);

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  role: userRoleEnum("role").notNull().default("professor"),
  name: text("name").notNull(),
  email: text("email").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const advisors = pgTable("advisors", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  position: text("position"),
  siape: text("siape"),
  phone: text("phone"),
  cpf: text("cpf"),
  email: text("email").notNull(),
  department: text("department").notNull(),
  isSystemAdmin: boolean("is_system_admin").default(false).notNull(),
  isInternshipCoordinator: boolean("is_internship_coordinator").default(false).notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const students = pgTable("students", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  email: text("email").notNull(),
  registrationNumber: text("registration_number").notNull(),
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
  // URLs dos relatórios
  r1Url: text("r1_url"),
  r2Url: text("r2_url"),
  r3Url: text("r3_url"),
  r4Url: text("r4_url"),
  r5Url: text("r5_url"),
  r6Url: text("r6_url"),
  r7Url: text("r7_url"),
  r8Url: text("r8_url"),
  r9Url: text("r9_url"),
  r10Url: text("r10_url"),
  // Campos de carga horária
  partialWorkload: integer("partial_workload").default(0),
  workloadNotes: text("workload_notes"),
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

export const internshipDocuments = pgTable("internship_documents", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  internshipId: varchar("internship_id").notNull(),
  internshipType: internshipTypeEnum("internship_type").notNull(),
  documentType: documentTypeEnum("document_type").notNull(),
  fileName: text("file_name").notNull(),
  originalName: text("original_name").notNull(),
  filePath: text("file_path").notNull(),
  fileSize: integer("file_size").notNull(),
  mimeType: text("mime_type").notNull(),
  status: documentStatusEnum("status").default("pending").notNull(),
  uploadedBy: varchar("uploaded_by").notNull().references(() => users.id),
  reviewedBy: varchar("reviewed_by").references(() => users.id),
  reviewComments: text("review_comments"),
  reviewedAt: timestamp("reviewed_at"),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const internshipAlerts = pgTable("internship_alerts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  internshipId: varchar("internship_id").notNull(),
  internshipType: internshipTypeEnum("internship_type").notNull(),
  alertType: alertTypeEnum("alert_type").notNull(),
  status: alertStatusEnum("status").default("pending").notNull(),
  title: text("title").notNull(),
  message: text("message").notNull(),
  daysUntilExpiration: integer("days_until_expiration"),
  targetUsers: text("target_users").notNull(), // JSON array of user IDs to notify
  sentAt: timestamp("sent_at"),
  readAt: timestamp("read_at"),
  dismissedAt: timestamp("dismissed_at"),
  whatsappMessageId: text("whatsapp_message_id"), // Para rastrear mensagens enviadas
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  uploadedDocuments: many(internshipDocuments, { relationName: "uploadedBy" }),
  reviewedDocuments: many(internshipDocuments, { relationName: "reviewedBy" }),
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

export const mandatoryInternshipsRelations = relations(mandatoryInternships, ({ one, many }) => ({
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
  documents: many(internshipDocuments),
}));

export const nonMandatoryInternshipsRelations = relations(nonMandatoryInternships, ({ one, many }) => ({
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
  documents: many(internshipDocuments),
}));

export const internshipDocumentsRelations = relations(internshipDocuments, ({ one }) => ({
  uploadedByUser: one(users, {
    fields: [internshipDocuments.uploadedBy],
    references: [users.id],
    relationName: "uploadedBy",
  }),
  reviewedByUser: one(users, {
    fields: [internshipDocuments.reviewedBy],
    references: [users.id],
    relationName: "reviewedBy",
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

export const insertInternshipDocumentSchema = createInsertSchema(internshipDocuments).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertInternshipAlertSchema = createInsertSchema(internshipAlerts).omit({
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

export type InternshipDocument = typeof internshipDocuments.$inferSelect;
export type InsertInternshipDocument = z.infer<typeof insertInternshipDocumentSchema>;

export type InternshipAlert = typeof internshipAlerts.$inferSelect;
export type InsertInternshipAlert = z.infer<typeof insertInternshipAlertSchema>;
