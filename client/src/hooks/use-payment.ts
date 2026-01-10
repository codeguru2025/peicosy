import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";

export interface PaymentMethods {
  payfast: boolean;
  paynow: boolean;
  manual: boolean;
}

export function usePaymentMethods() {
  return useQuery<PaymentMethods>({
    queryKey: ['/api/payment/status'],
  });
}

export function usePaynowWebPayment() {
  return useMutation({
    mutationFn: async (orderId: number) => {
      const res = await apiRequest('POST', '/api/payment/paynow/initiate', { orderId });
      return res.json();
    },
  });
}

export function usePaynowMobilePayment() {
  return useMutation({
    mutationFn: async ({ orderId, phone, method }: { orderId: number; phone: string; method: 'ecocash' | 'onemoney' }) => {
      const res = await apiRequest('POST', '/api/payment/paynow/mobile', { orderId, phone, method });
      return res.json();
    },
  });
}

export function usePaynowStatus(orderId: number | null) {
  return useQuery({
    queryKey: ['/api/payment/paynow/status', orderId],
    enabled: !!orderId,
    refetchInterval: 5000,
  });
}

export function usePayFastPayment() {
  return useMutation({
    mutationFn: async (orderId: number) => {
      const res = await apiRequest('POST', '/api/payment/payfast/initiate', { orderId });
      return res.json();
    },
  });
}
