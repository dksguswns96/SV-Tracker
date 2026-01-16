import { CarSale } from "@shared/schema";
import { TrendingUp, Award, Activity } from "lucide-react";

export function DashboardStats({ data }: { data: CarSale[] }) {
  if (!data.length) return null;

  const topGainer = [...data].sort((a, b) => b.momPct - a.momPct)[0];
  const topVolume = [...data].sort((a, b) => b.sales - a.sales)[0];
  const totalVolume = data.reduce((acc, curr) => acc + curr.sales, 0);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      {/* Total Volume */}
      <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-6 text-white shadow-lg shadow-blue-200/50">
        <div className="flex justify-between items-start mb-4">
          <div className="bg-white/20 p-2 rounded-lg">
            <Activity className="w-5 h-5 text-white" />
          </div>
          <span className="text-xs font-medium bg-white/10 px-2 py-1 rounded-full text-blue-50">Total Market</span>
        </div>
        <div>
          <h3 className="text-3xl font-display font-bold mb-1">{totalVolume.toLocaleString()}</h3>
          <p className="text-sm text-blue-100 font-medium">Units Sold This Month</p>
        </div>
      </div>

      {/* Top Gainer */}
      {topGainer && (
        <div className="bg-card rounded-2xl p-6 border border-border/50 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <TrendingUp className="w-24 h-24 text-green-500" />
          </div>
          <div className="flex justify-between items-start mb-4">
            <div className="bg-green-100 p-2 rounded-lg">
              <TrendingUp className="w-5 h-5 text-green-600" />
            </div>
            <span className="text-xs font-medium bg-green-50 text-green-700 px-2 py-1 rounded-full border border-green-100">Top Growth</span>
          </div>
          <div>
            <h3 className="text-xl font-display font-bold mb-1 truncate text-foreground">{topGainer.modelName}</h3>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold text-green-600">+{topGainer.momPct.toFixed(1)}%</span>
              <span className="text-sm text-muted-foreground">growth</span>
            </div>
          </div>
        </div>
      )}

      {/* Top Volume */}
      {topVolume && (
        <div className="bg-card rounded-2xl p-6 border border-border/50 shadow-sm relative overflow-hidden group">
           <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <Award className="w-24 h-24 text-amber-500" />
          </div>
          <div className="flex justify-between items-start mb-4">
            <div className="bg-amber-100 p-2 rounded-lg">
              <Award className="w-5 h-5 text-amber-600" />
            </div>
            <span className="text-xs font-medium bg-amber-50 text-amber-700 px-2 py-1 rounded-full border border-amber-100">Best Seller</span>
          </div>
          <div>
            <h3 className="text-xl font-display font-bold mb-1 truncate text-foreground">{topVolume.modelName}</h3>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold text-foreground">{topVolume.sales.toLocaleString()}</span>
              <span className="text-sm text-muted-foreground">units</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
