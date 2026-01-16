import { useState, useMemo } from "react";
import { useSales, useSalesMonths, useTriggerScraper } from "@/hooks/use-sales";
import { CarCard } from "@/components/CarCard";
import { FilterBar } from "@/components/FilterBar";
import { DashboardStats } from "@/components/DashboardStats";
import { Button } from "@/components/ui/button";
import { RefreshCw, LayoutGrid, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function Dashboard() {
  // Local state for filters
  const [selectedMonth, setSelectedMonth] = useState<string>("");
  const [selectedNation, setSelectedNation] = useState<'domestic' | 'export' | undefined>(undefined);
  const [minSales, setMinSales] = useState(300);
  const [excludeNew, setExcludeNew] = useState(false);

  // Queries
  const { data: months = [], isLoading: monthsLoading } = useSalesMonths();
  
  // Set default month once data is loaded
  useMemo(() => {
    if (months.length > 0 && !selectedMonth) {
      setSelectedMonth(months[0]);
    }
  }, [months, selectedMonth]);

  const { data: sales = [], isLoading: salesLoading, isFetching } = useSales({
    month: selectedMonth,
    nation: selectedNation,
    minSales,
    excludeNew,
    sortBy: 'score', // Default sort by heat score
  });

  // Mutation
  const triggerScraper = useTriggerScraper();

  const handleRefresh = () => {
    triggerScraper.mutate({ month: selectedMonth });
  };

  const isRefreshing = triggerScraper.isPending || isFetching;

  return (
    <div className="min-h-screen bg-muted/20 pb-20">
      {/* Header */}
      <div className="bg-white border-b border-border sticky top-0 z-30 shadow-sm backdrop-blur-md bg-white/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-tr from-primary to-blue-600 p-2.5 rounded-xl shadow-lg shadow-blue-500/20">
              <LayoutGrid className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-display font-bold text-foreground leading-none">Market Radar</h1>
              <p className="text-xs text-muted-foreground mt-1 font-medium">Automotive Sales Analytics</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
             {/* Last Updated Indicator could go here */}
            <Button 
              onClick={handleRefresh} 
              disabled={isRefreshing}
              variant="outline"
              className={isRefreshing ? "opacity-80" : ""}
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`} />
              {isRefreshing ? "Updating..." : "Refresh Data"}
            </Button>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Loading Initial State */}
        {monthsLoading && !months.length ? (
           <div className="flex flex-col items-center justify-center h-64 space-y-4">
             <Loader2 className="w-10 h-10 text-primary animate-spin" />
             <p className="text-muted-foreground font-medium">Loading market data...</p>
           </div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <FilterBar 
              months={months}
              selectedMonth={selectedMonth}
              onMonthChange={setSelectedMonth}
              selectedNation={selectedNation}
              onNationChange={setSelectedNation}
              minSales={minSales}
              onMinSalesChange={setMinSales}
              excludeNew={excludeNew}
              onExcludeNewChange={setExcludeNew}
            />

            <DashboardStats data={sales} />

            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-display font-bold text-foreground">
                Market Movers 
                <span className="ml-2 text-sm font-normal text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                  {sales.length} models
                </span>
              </h2>
            </div>

            {salesLoading ? (
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                 {[...Array(8)].map((_, i) => (
                   <div key={i} className="h-64 bg-muted/50 rounded-xl animate-pulse" />
                 ))}
               </div>
            ) : sales.length === 0 ? (
               <div className="text-center py-20 bg-card rounded-2xl border border-dashed border-border">
                 <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
                   <Filter className="w-8 h-8 text-muted-foreground opacity-50" />
                 </div>
                 <h3 className="text-lg font-bold text-foreground">No records found</h3>
                 <p className="text-muted-foreground">Try adjusting your filters or refreshing the data.</p>
               </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                <AnimatePresence mode="popLayout">
                  {sales.map((car, index) => (
                    <CarCard key={`${car.modelName}-${car.month}`} car={car} index={index} />
                  ))}
                </AnimatePresence>
              </div>
            )}
          </motion.div>
        )}
      </main>
    </div>
  );
}

// Importing Filter icon only for empty state
import { Filter } from "lucide-react";
