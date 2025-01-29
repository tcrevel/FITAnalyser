import { pgTable, text, serial, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { relations } from "drizzle-orm";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").unique().notNull(),
  password: text("password").notNull(),
});

export const datasets = pgTable("datasets", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  userId: integer("user_id").references(() => users.id).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const fitFiles = pgTable("fit_files", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  datasetId: integer("dataset_id")
    .references(() => datasets.id, { onDelete: 'cascade' })
    .notNull(),
  filePath: text("file_path").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Define relations
export const usersRelations = relations(users, ({ many }) => ({
  datasets: many(datasets),
}));

export const datasetsRelations = relations(datasets, ({ one, many }) => ({
  user: one(users, {
    fields: [datasets.userId],
    references: [users.id],
  }),
  fitFiles: many(fitFiles),
}));

export const fitFilesRelations = relations(fitFiles, ({ one }) => ({
  dataset: one(datasets, {
    fields: [fitFiles.datasetId],
    references: [datasets.id],
  }),
}));

// Schemas for validation
export const insertUserSchema = createInsertSchema(users);
export const selectUserSchema = createSelectSchema(users);

export const insertDatasetSchema = createInsertSchema(datasets);
export const selectDatasetSchema = createSelectSchema(datasets);

export const insertFitFileSchema = createInsertSchema(fitFiles);
export const selectFitFileSchema = createSelectSchema(fitFiles);

// Types
export type InsertUser = typeof users.$inferInsert;
export type SelectUser = typeof users.$inferSelect;
export type InsertDataset = typeof datasets.$inferInsert;
export type SelectDataset = typeof datasets.$inferSelect;
export type InsertFitFile = typeof fitFiles.$inferInsert;
export type SelectFitFile = typeof fitFiles.$inferSelect;