import axios from 'axios';
import * as cheerio from 'cheerio';
import { storage } from './storage';
import { type InsertCarSale } from '@shared/schema';

// Helper to calculate Z-score
function calculateZScores(values: number[]): number[] {
  if (values.length === 0) return [];
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const stdDev = Math.sqrt(values.map(x => Math.pow(x - mean, 2)).reduce((a, b) => a + b, 0) / values.length) || 1; // Avoid divide by zero
  return values.map(x => (x - mean) / stdDev);
}

// Function to fetch and parse Danawa
export async function scrapeDanawa(month: string, nation: 'domestic' | 'export') {
  // Format month YYYY-MM to YYYY-MM-00 for URL
  const urlMonth = `${month}-00`;
  const url = `https://auto.danawa.com/auto/?Month=${urlMonth}&Nation=${nation}&Tab=Model&Work=record`;
  
  console.log(`Scraping ${url}...`);
  
  try {
    const { data } = await axios.get(url);
    const $ = cheerio.load(data);
    
    const records: Partial<InsertCarSale>[] = [];
    
    // Check if the page has data. The table selector might vary.
    // Based on inspection (simulated): look for table rows in the ranking table.
    // Usually table.recordTable tbody tr
    
    // Note: The structure is tricky. We need to be flexible.
    // Assuming a standard table structure based on similar sites.
    // Row usually has: Rank, Model Name (link), Sales, Share, Diff (Month), Diff (Year)
    
    $('table.recordTable tbody tr').each((i, el) => {
        // Skip "trim" rows if they exist (usually have different class or no rank)
        // Check for rank column
        const rankText = $(el).find('td.rank').text().trim();
        if (!rankText || isNaN(parseInt(rankText))) return; // Skip if no rank

        const rank = parseInt(rankText);
        const modelName = $(el).find('td.title a').text().trim();
        const linkUrl = $(el).find('td.title a').attr('href') || '';
        const fullLink = linkUrl.startsWith('http') ? linkUrl : `https://auto.danawa.com${linkUrl}`;
        
        // Sales is usually in a specific column. Let's guess indices or classes.
        // Assuming: Rank, Title, Sales, ...
        // Danawa structure might be: Rank, Model, Sales, Share, MoM, YoY
        
        const salesText = $(el).find('td.record').first().text().trim().replace(/,/g, '');
        const sales = parseInt(salesText) || 0;
        
        // MoM Diff is usually next.
        // The page usually shows the *difference*.
        // We need Prev Sales. Prev Sales = Sales - Diff.
        // Or sometimes the page shows Prev Sales directly? 
        // User requirements said: "Page already shows Sales ... Prev Month(Diff)".
        // Let's assume we can get the Diff.
        
        const diffText = $(el).find('td.updown').first().text().trim().replace(/,/g, '');
        // diffText might be "+ 100" or "- 50" or "0"
        // Need to parse "+" or "-"
        let diff = 0;
        // Simple parser for signed integers
        // Remove spaces
        const cleanDiff = diffText.replace(/\s/g, '');
        if (cleanDiff) {
            diff = parseInt(cleanDiff) || 0;
        }

        const prevSales = sales - diff;
        
        // Store basics
        records.push({
            month,
            nation,
            modelName,
            sales,
            prevSales,
            rank,
            rankChange: 0, // Will calculate later
            momAbs: diff,
            momPct: 0, // Will calculate
            score: 0, // Will calculate
            linkUrl: fullLink,
            imageUrl: '' // Placeholder
        });
    });

    if (records.length === 0) {
        console.log("No records found. Selectors might be wrong or no data.");
        return [];
    }

    // Process Metrics
    const processed: InsertCarSale[] = records.map(r => {
        const prevSales = r.prevSales || 0;
        const sales = r.sales || 0;
        const momAbs = r.momAbs || 0;
        
        // Cap max prev sales for pct calc to avoid division by zero
        const safePrev = Math.max(prevSales, 1);
        let momPct = momAbs / safePrev;
        
        // Cap momPct if it's new entry (prevSales=0 or very small)
        // User suggested: if prev_sales=0, cap mom_pct.
        if (prevSales === 0) {
            momPct = Math.min(momPct, 5.0); // 500% cap
        }

        return {
            ...r,
            month: r.month!,
            nation: r.nation!,
            modelName: r.modelName!,
            sales,
            prevSales,
            rank: r.rank!,
            rankChange: 0, // Placeholder
            momAbs,
            momPct,
            score: 0,
            linkUrl: r.linkUrl,
            imageUrl: r.imageUrl
        };
    });

    // 2. Fetch Previous Month Data from DB to calculate Rank Change
    // We need to know what the previous month string is.
    const [y, m] = month.split('-').map(Number);
    const prevDate = new Date(y, m - 1 - 1, 1); // Month is 0-indexed in Date
    const prevMonthStr = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, '0')}`;
    
    const prevMonthData = await storage.getCarSalesByMonth(prevMonthStr, nation);
    const prevRankMap = new Map<string, number>();
    prevMonthData.forEach(p => prevRankMap.set(p.modelName, p.rank));

    // Calculate Rank Change
    processed.forEach(r => {
        const prevRank = prevRankMap.get(r.modelName);
        if (prevRank) {
            r.rankChange = prevRank - r.rank; // Positive means rank improved (lower number)
        } else {
            r.rankChange = 0; // New entry or unknown
        }
    });

    // 3. Calculate Scores
    // score = 0.55 * z(mom_abs) + 0.35 * z(mom_pct) + 0.10 * z(rank_change)
    const momAbsVals = processed.map(r => r.momAbs);
    const momPctVals = processed.map(r => r.momPct);
    const rankChangeVals = processed.map(r => r.rankChange);

    const zMomAbs = calculateZScores(momAbsVals);
    const zMomPct = calculateZScores(momPctVals);
    const zRankChange = calculateZScores(rankChangeVals);

    processed.forEach((r, i) => {
        r.score = (0.55 * zMomAbs[i]) + (0.35 * zMomPct[i]) + (0.10 * zRankChange[i]);
    });

    // Save to DB
    await storage.saveCarSales(processed);
    
    return processed;

  } catch (err) {
    console.error("Scraping failed:", err);
    throw err;
  }
}
