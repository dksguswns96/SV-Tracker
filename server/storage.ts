import { db } from "./db";
import { carSales, type CarSale, type InsertCarSale } from "@shared/schema";
import { eq, and, desc, sql } from "drizzle-orm";

export interface IStorage {
  getCarSales(month?: string, nation?: 'domestic' | 'export', minSales?: number, excludeNew?: boolean, sortBy?: 'score' | 'sales' | 'rank'): Promise<CarSale[]>;
  getAvailableMonths(): Promise<string[]>;
  saveCarSales(sales: InsertCarSale[]): Promise<void>;
  getCarSalesByMonth(month: string, nation?: 'domestic' | 'export'): Promise<CarSale[]>;
}

export class DatabaseStorage implements IStorage {
  async getCarSales(month?: string, nation?: 'domestic' | 'export', minSales = 0, excludeNew = false, sortBy: 'score' | 'sales' | 'rank' = 'score'): Promise<CarSale[]> {
    const conditions = [];
    
    if (month) {
      conditions.push(eq(carSales.month, month));
    }
    
    if (nation) {
      conditions.push(eq(carSales.nation, nation));
    }
    
    if (minSales > 0) {
      conditions.push(sql`${carSales.sales} >= ${minSales}`);
    }
    
    if (excludeNew) {
      conditions.push(sql`${carSales.prevSales} > 0`);
    }

    let orderBy;
    switch (sortBy) {
      case 'sales':
        orderBy = desc(carSales.sales);
        break;
      case 'rank':
        orderBy = sql`${carSales.rank} ASC`;
        break;
      case 'score':
      default:
        orderBy = desc(carSales.score);
        break;
    }

    return await db.select()
      .from(carSales)
      .where(and(...conditions))
      .orderBy(orderBy);
  }

  async getAvailableMonths(): Promise<string[]> {
    const result = await db.selectDistinct({ month: carSales.month })
      .from(carSales)
      .orderBy(desc(carSales.month));
    return result.map(r => r.month);
  }

  async saveCarSales(sales: InsertCarSale[]): Promise<void> {
    if (sales.length === 0) return;
    
    // Upsert logic: Delete existing for that month/nation and insert new?
    // Or simpler: just delete everything for that month/nation before inserting.
    // Let's go with delete-then-insert for safety to avoid duplicates.
    const sample = sales[0];
    await db.delete(carSales)
      .where(and(
        eq(carSales.month, sample.month),
        eq(carSales.nation, sample.nation)
      ));
      
    await db.insert(carSales).values(sales);
  }

  async getCarSalesByMonth(month: string, nation?: 'domestic' | 'export'): Promise<CarSale[]> {
    const conditions = [eq(carSales.month, month)];
    if (nation) conditions.push(eq(carSales.nation, nation));
    return await db.select().from(carSales).where(and(...conditions));
  }
}

export const storage = new DatabaseStorage();
