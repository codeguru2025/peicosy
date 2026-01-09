import { useQuery, useMutation } from "@tanstack/react-query";
import { api } from "@shared/routes";

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
