import { useQuery, useMutation } from "@tanstack/react-query";
import { api } from "@shared/routes";
import { queryClient, apiRequest } from "@/lib/queryClient";

export function useShippingRates() {
  return useQuery({
    queryKey: [api.shipping.rates.path],
    queryFn: async () => {
      const res = await fetch(api.shipping.rates.path);
      if (!res.ok) throw new Error("Failed to fetch shipping rates");
      return api.shipping.rates.responses[200].parse(await res.json());
    },
  });
}

export function useCalculateLandedCost() {
  return useMutation({
    mutationFn: async (data: { subtotal: number; method: 'air' | 'sea'; category?: string }) => {
      const res = await fetch(api.shipping.calculate.path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to calculate costs");
      return api.shipping.calculate.responses[200].parse(await res.json());
    },
  });
}

export function useExchangeRate() {
  return useQuery({
    queryKey: [api.exchangeRate.get.path],
    queryFn: async () => {
      const res = await fetch(api.exchangeRate.get.path);
      if (!res.ok) throw new Error("Failed to fetch exchange rate");
      return api.exchangeRate.get.responses[200].parse(await res.json());
    },
  });
}

export function useUpdateExchangeRate() {
  return useMutation({
    mutationFn: async (rate: number) => {
      const res = await apiRequest("PUT", api.exchangeRate.update.path, { rate });
      return api.exchangeRate.update.responses[200].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.exchangeRate.get.path] });
    },
  });
}

// Helper to format ZAR currency
export function formatZAR(amount: number): string {
  return `R${amount.toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

// Helper to format GBP currency
export function formatGBP(amount: number): string {
  return `£${amount.toFixed(2)}`;
}
