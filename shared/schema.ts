import { pgTable, text, serial, integer, real, timestamp, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const carSales = pgTable("car_sales", {
  id: serial("id").primaryKey(),
  month: text("month").notNull(), // Format: YYYY-MM
  nation: text("nation").notNull(), // 'domestic' or 'export'
  modelName: text("model_name").notNull(),
  sales: integer("sales").notNull(),
  prevSales: integer("prev_sales").notNull().default(0),
  rank: integer("rank").notNull(),
  rankChange: integer("rank_change").notNull().default(0),
  momAbs: integer("mom_abs").notNull().default(0), // Month-over-Month absolute change
  momPct: real("mom_pct").notNull().default(0), // Month-over-Month percentage change
  score: real("score").notNull().default(0), // Rapid rise score
  imageUrl: text("image_url"),
  linkUrl: text("link_url"),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertCarSalesSchema = createInsertSchema(carSales).omit({ 
  id: true, 
  updatedAt: true 
});

export type CarSale = typeof carSales.$inferSelect;
export type InsertCarSale = z.infer<typeof insertCarSalesSchema>;

// Request Types
export type ScrapeRequest = {
  month?: string; // Optional, defaults to current
  nation?: 'domestic' | 'export'; // Optional, defaults to both or sequential
};

export type SalesQueryParams = {
  month?: string;
  nation?: 'domestic' | 'export';
  minSales?: number;
  excludeNew?: boolean; // If true, exclude prevSales === 0
  sortBy?: 'score' | 'sales' | 'rank';
};
