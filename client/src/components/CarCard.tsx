import { CarSale } from "@shared/schema";
import { ArrowUp, ArrowDown, Minus, ExternalLink, Trophy } from "lucide-react";
import { motion } from "framer-motion";
import { clsx } from "clsx";

interface CarCardProps {
  car: CarSale;
  index: number;
}

export function CarCard({ car, index }: CarCardProps) {
  // Calculate trend colors
  const isPositive = car.momAbs > 0;
  const isNeutral = car.momAbs === 0;
  const isNegative = car.momAbs < 0;

  const trendColor = isPositive 
    ? "text-green-600 bg-green-50 border-green-200" 
    : isNegative 
      ? "text-red-600 bg-red-50 border-red-200" 
      : "text-gray-500 bg-gray-50 border-gray-200";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      className="group relative flex flex-col bg-card rounded-xl border border-border/60 shadow-sm hover:shadow-lg hover:border-primary/20 transition-all duration-300 overflow-hidden"
    >
      {/* Rapid Rise Badge */}
      {car.score > 2 && (
        <div className="absolute top-0 right-0 z-10">
          <div className="bg-gradient-to-bl from-accent to-purple-600 text-white text-[10px] font-bold px-3 py-1 rounded-bl-xl shadow-sm">
            RAPID RISE
          </div>
        </div>
      )}

      <div className="p-5 flex-grow">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="flex items-center gap-3">
            <div className={clsx(
              "flex items-center justify-center w-10 h-10 rounded-lg font-display font-bold text-lg shadow-inner",
              car.rank <= 3 ? "bg-amber-100 text-amber-700 border border-amber-200" : "bg-muted text-muted-foreground border border-border"
            )}>
              {car.rank}
            </div>
            <div>
              <h3 className="font-display font-bold text-lg leading-tight text-foreground group-hover:text-primary transition-colors">
                {car.modelName}
              </h3>
              <div className="flex items-center gap-2 mt-1">
                <span className={clsx(
                  "text-xs font-medium px-2 py-0.5 rounded-full border",
                  car.rankChange > 0 ? "bg-green-100 text-green-700 border-green-200" : 
                  car.rankChange < 0 ? "bg-red-50 text-red-600 border-red-100" : 
                  "bg-gray-50 text-gray-500 border-gray-100"
                )}>
                  {car.rankChange > 0 ? (
                    <span className="flex items-center gap-1"><ArrowUp className="w-3 h-3" /> {Math.abs(car.rankChange)}</span>
                  ) : car.rankChange < 0 ? (
                    <span className="flex items-center gap-1"><ArrowDown className="w-3 h-3" /> {Math.abs(car.rankChange)}</span>
                  ) : (
                    <span className="flex items-center gap-1"><Minus className="w-3 h-3" /> Same</span>
                  )}
                </span>
                <span className="text-xs text-muted-foreground capitalize">{car.nation === 'domestic' ? 'Domestic' : 'Import'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3 mt-4">
          <div className="bg-muted/30 p-3 rounded-lg border border-border/50">
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider mb-1">Sales</p>
            <p className="font-display font-bold text-xl text-foreground tabular-nums">
              {car.sales.toLocaleString()}
            </p>
          </div>
          
          <div className={clsx("p-3 rounded-lg border", trendColor)}>
            <p className="text-xs opacity-80 font-medium uppercase tracking-wider mb-1">Growth</p>
            <div className="flex items-baseline gap-1">
              <span className="font-display font-bold text-xl tabular-nums">
                {isPositive ? "+" : ""}{car.momPct.toFixed(1)}%
              </span>
              <span className="text-xs opacity-75 tabular-nums">
                ({isPositive ? "+" : ""}{car.momAbs})
              </span>
            </div>
          </div>
        </div>
        
        {/* Score Bar */}
        <div className="mt-4">
          <div className="flex justify-between items-end mb-1">
            <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Heat Score</span>
            <span className="text-xs font-bold text-primary">{car.score.toFixed(1)}</span>
          </div>
          <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${Math.min((car.score / 5) * 100, 100)}%` }}
              transition={{ duration: 1, delay: 0.5 }}
              className="h-full bg-gradient-to-r from-primary to-accent rounded-full" 
            />
          </div>
        </div>
      </div>

      <div className="bg-muted/20 p-3 border-t border-border flex justify-between items-center">
        <span className="text-xs text-muted-foreground">
          vs Last Month: <span className="font-medium text-foreground">{car.prevSales.toLocaleString()}</span>
        </span>
        
        {car.linkUrl && (
          <a 
            href={car.linkUrl} 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-xs font-semibold text-primary hover:text-primary/80 transition-colors"
          >
            Danawa <ExternalLink className="w-3 h-3" />
          </a>
        )}
      </div>
    </motion.div>
  );
}
