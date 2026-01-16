import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";

// Types derived from schema
type SalesQueryParams = z.infer<typeof api.sales.list.input>;
type ScraperTriggerParams = z.infer<typeof api.scraper.trigger.input>;

export function useSales(params: SalesQueryParams = {}) {
  // Filter out undefined values to keep query key clean
  const cleanParams = Object.fromEntries(
    Object.entries(params).filter(([_, v]) => v !== undefined)
  );

  return useQuery({
    queryKey: [api.sales.list.path, cleanParams],
    queryFn: async () => {
      // Manual query string construction since input is optional
      const queryParams = new URLSearchParams();
      if (params.month) queryParams.set("month", params.month);
      if (params.nation) queryParams.set("nation", params.nation);
      if (params.minSales) queryParams.set("minSales", params.minSales.toString());
      if (params.excludeNew !== undefined) queryParams.set("excludeNew", String(params.excludeNew));
      if (params.sortBy) queryParams.set("sortBy", params.sortBy);

      const url = `${api.sales.list.path}?${queryParams.toString()}`;
      
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch sales data");
      return api.sales.list.responses[200].parse(await res.json());
    },
  });
}

export function useSalesMonths() {
  return useQuery({
    queryKey: [api.sales.getMonths.path],
    queryFn: async () => {
      const res = await fetch(api.sales.getMonths.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch available months");
      return api.sales.getMonths.responses[200].parse(await res.json());
    },
  });
}

export function useTriggerScraper() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (params: ScraperTriggerParams = {}) => {
      const res = await fetch(api.scraper.trigger.path, {
        method: api.scraper.trigger.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(params),
        credentials: "include",
      });

      if (!res.ok) {
        // Attempt to parse error message
        try {
          const errorData = await res.json();
          throw new Error(errorData.message || "Scraper failed");
        } catch (e) {
          throw new Error("Scraper failed to start");
        }
      }
      return api.scraper.trigger.responses[200].parse(await res.json());
    },
    onSuccess: (data) => {
      toast({
        title: "Update Complete",
        description: `Processed ${data.stats.processed} records for ${data.stats.month}.`,
        variant: "default",
      });
      // Invalidate all sales queries to refresh UI
      queryClient.invalidateQueries({ queryKey: [api.sales.list.path] });
      queryClient.invalidateQueries({ queryKey: [api.sales.getMonths.path] });
    },
    onError: (error) => {
      toast({
        title: "Update Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}
