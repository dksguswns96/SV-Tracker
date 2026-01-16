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
    const { data } = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });
    const $ = cheerio.load(data);
    
    const records: Partial<InsertCarSale>[] = [];
    
    // Updated selector for Danawa auto record table
    // Based on the provided template and typical Danawa structure
    $('.recordTable tbody tr').each((i, el) => {
        // Skip "trim" rows (usually have specific class or structure)
        if ($(el).hasClass('trim')) return;

        const rankText = $(el).find('td.rank').text().trim();
        if (!rankText || isNaN(parseInt(rankText))) return;

        const rank = parseInt(rankText);
        const titleLink = $(el).find('td.title a').first();
        const modelName = titleLink.text().trim();
        const linkUrl = titleLink.attr('href') || '';
        const fullLink = linkUrl.startsWith('http') ? linkUrl : `https://auto.danawa.com${linkUrl}`;
        
        // Sales volume
        const salesText = $(el).find('td.record').first().text().trim().replace(/,/g, '');
        const sales = parseInt(salesText) || 0;
        
        // MoM Difference
        const diffText = $(el).find('td.updown').first().text().trim().replace(/,/g, '');
        let diff = 0;
        const cleanDiff = diffText.replace(/\s/g, '');
        if (cleanDiff) {
            // Handle ▲/▼ icons or +/- text
            const hasUp = cleanDiff.includes('▲') || cleanDiff.includes('+');
            const hasDown = cleanDiff.includes('▼') || cleanDiff.includes('-');
            const val = parseInt(cleanDiff.replace(/[^0-9]/g, '')) || 0;
            diff = hasDown ? -val : val;
        }

        const prevSales = sales - diff;
        
        records.push({
            month,
            nation,
            modelName,
            sales,
            prevSales,
            rank,
            rankChange: 0,
            momAbs: diff,
            momPct: 0,
            score: 0,
            linkUrl: fullLink,
            imageUrl: ''
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
