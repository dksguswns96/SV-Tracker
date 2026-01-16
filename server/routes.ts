import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import { scrapeDanawa } from "./scraper";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
  // List Sales
  app.get(api.sales.list.path, async (req, res) => {
    try {
      // Parse params manually since they are query params
      const month = req.query.month as string | undefined;
      const nation = req.query.nation as 'domestic' | 'export' | undefined;
      const minSales = req.query.minSales ? Number(req.query.minSales) : undefined;
      const excludeNew = req.query.excludeNew === 'true';
      const sortBy = req.query.sortBy as 'score' | 'sales' | 'rank' | undefined;

      const results = await storage.getCarSales(month, nation, minSales, excludeNew, sortBy);
      res.json(results);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Internal Server Error" });
    }
  });

  // Get Available Months
  app.get(api.sales.getMonths.path, async (req, res) => {
    try {
      const months = await storage.getAvailableMonths();
      res.json(months);
    } catch (err) {
      res.status(500).json({ message: "Failed to fetch months" });
    }
  });

  // Trigger Scraper
  app.post(api.scraper.trigger.path, async (req, res) => {
    try {
      const input = api.scraper.trigger.input?.parse(req.body) || {};
      
      // Default to current month if not provided
      let targetMonth = input.month;
      if (!targetMonth) {
        const now = new Date();
        // Usually data is for previous month if early in month, or current if late?
        // Let's just default to current YYYY-MM
        targetMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
      }

      // If nation not specified, do both (scrape sequentially)
      let processedCount = 0;
      if (input.nation) {
        const results = await scrapeDanawa(targetMonth, input.nation);
        processedCount += results.length;
      } else {
        const r1 = await scrapeDanawa(targetMonth, 'domestic');
        const r2 = await scrapeDanawa(targetMonth, 'export');
        processedCount += r1.length + r2.length;
      }

      res.json({
        message: "Scraping completed successfully",
        stats: {
          processed: processedCount,
          month: targetMonth
        }
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Scraping failed. See logs." });
    }
  });

  // Seed Data (if empty)
  // We can't really seed real data without scraping. 
  // Let's just try to run a scrape for the current month on startup if DB is empty?
  // Or just leave it empty and let user click 'Refresh'.
  // I'll add a simple check and log.

  const existing = await storage.getAvailableMonths();
  if (existing.length === 0) {
      console.log("Database empty. You might want to trigger scraping via POST /api/scraper/trigger");
  }

  return httpServer;
}
