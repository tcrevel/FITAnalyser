import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { relations } from "drizzle-orm";

export const users = pgTable("users", {
  id: text("id").primaryKey(), // Changed to text for Firebase UID
  email: text("email").unique().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const datasets = pgTable("datasets", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  userId: text("user_id").references(() => users.id, { onDelete: 'cascade' }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  shareToken: text("share_token"), // Remove unique constraint temporarily
});

export const fitFiles = pgTable("fit_files", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  datasetId: uuid("dataset_id")
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