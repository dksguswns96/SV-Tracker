import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Filter, Calendar, Globe, BarChart3 } from "lucide-react";

interface FilterBarProps {
  months: string[];
  selectedMonth: string;
  onMonthChange: (val: string) => void;
  
  selectedNation: 'domestic' | 'export' | undefined;
  onNationChange: (val: 'domestic' | 'export' | undefined) => void;
  
  minSales: number;
  onMinSalesChange: (val: number) => void;
  
  excludeNew: boolean;
  onExcludeNewChange: (val: boolean) => void;
}

export function FilterBar({
  months,
  selectedMonth,
  onMonthChange,
  selectedNation,
  onNationChange,
  minSales,
  onMinSalesChange,
  excludeNew,
  onExcludeNewChange
}: FilterBarProps) {
  return (
    <div className="glass-card rounded-2xl p-6 mb-8 flex flex-col lg:flex-row gap-6 lg:items-center justify-between">
      <div className="flex flex-col sm:flex-row gap-6 flex-1">
        
        {/* Month Selector */}
        <div className="space-y-2 min-w-[180px]">
          <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
            <Calendar className="w-3 h-3" /> Period
          </Label>
          <Select value={selectedMonth} onValueChange={onMonthChange}>
            <SelectTrigger className="w-full bg-background border-border/50 shadow-sm">
              <SelectValue placeholder="Select month" />
            </SelectTrigger>
            <SelectContent>
              {months.map((month) => (
                <SelectItem key={month} value={month}>{month}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Nation Toggle */}
        <div className="space-y-2 min-w-[180px]">
          <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
            <Globe className="w-3 h-3" /> Market
          </Label>
          <div className="flex bg-muted/50 p-1 rounded-lg border border-border/50">
            <button
              onClick={() => onNationChange(undefined)}
              className={`flex-1 text-xs font-medium py-1.5 rounded-md transition-all ${
                !selectedNation ? "bg-white text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              All
            </button>
            <button
              onClick={() => onNationChange('domestic')}
              className={`flex-1 text-xs font-medium py-1.5 rounded-md transition-all ${
                selectedNation === 'domestic' ? "bg-white text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Domestic
            </button>
            <button
              onClick={() => onNationChange('export')}
              className={`flex-1 text-xs font-medium py-1.5 rounded-md transition-all ${
                selectedNation === 'export' ? "bg-white text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Import
            </button>
          </div>
        </div>

        {/* Min Sales Slider */}
        <div className="space-y-3 flex-1 min-w-[200px]">
          <div className="flex justify-between items-center">
            <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
              <BarChart3 className="w-3 h-3" /> Min Sales
            </Label>
            <span className="text-xs font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-md">
              {minSales}+ units
            </span>
          </div>
          <Slider
            value={[minSales]}
            min={0}
            max={5000}
            step={100}
            onValueChange={(vals) => onMinSalesChange(vals[0])}
            className="py-1"
          />
        </div>
      </div>

      <div className="h-px lg:w-px bg-border lg:h-12 w-full" />

      {/* New Entry Toggle */}
      <div className="flex items-center gap-3">
        <Switch 
          id="exclude-new" 
          checked={excludeNew} 
          onCheckedChange={onExcludeNewChange} 
        />
        <div className="grid gap-0.5">
          <Label htmlFor="exclude-new" className="font-medium text-sm">Consistent Models Only</Label>
          <p className="text-xs text-muted-foreground">Exclude new entries (prev sales = 0)</p>
        </div>
      </div>
    </div>
  );
}
