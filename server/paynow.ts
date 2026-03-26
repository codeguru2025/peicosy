import { Paynow } from "paynow";
import crypto from "crypto";

export interface PaynowConfig {
  integrationId: string;
  integrationKey: string;
  resultUrl: string;
  returnUrl: string;
}

export interface PaynowPaymentData {
  orderId: number;
  amount: number;
  email: string;
  reference: string;
  items: Array<{ name: string; amount: number }>;
}

export interface PaynowMobilePaymentData extends PaynowPaymentData {
  phone: string;
  method: 'ecocash' | 'onemoney';
}

export function getPaynowConfig(): PaynowConfig | null {
  // Trim whitespace from credentials - common issue when copying from dashboard
  const integrationId = process.env.PAYNOW_INTEGRATION_ID?.trim();
  const integrationKey = process.env.PAYNOW_INTEGRATION_KEY?.trim();
  
  if (!integrationId || !integrationKey) {
    return null;
  }
  
  const baseUrl = process.env.APP_BASE_URL || 'http://localhost:5000';
  
  return {
    integrationId,
    integrationKey,
    resultUrl: `${baseUrl}/api/payments/paynow/callback`,
    returnUrl: `${baseUrl}/orders`,
  };
}

export function isPaynowConfigured(): boolean {
  return getPaynowConfig() !== null;
}

export function createPaynowInstance(): Paynow | null {
  const config = getPaynowConfig();
  if (!config) {
    return null;
  }
  
  const paynow = new Paynow(config.integrationId, config.integrationKey);
  paynow.resultUrl = config.resultUrl;
  paynow.returnUrl = config.returnUrl;
  
  return paynow;
}

export async function initiateWebPayment(data: PaynowPaymentData): Promise<{
  success: boolean;
  redirectUrl?: string;
  pollUrl?: string;
  error?: string;
}> {
  const paynow = createPaynowInstance();
  
  if (!paynow) {
    return { success: false, error: "Paynow is not configured" };
  }
  
  try {
    const payment = paynow.createPayment(data.reference, data.email);
    
    for (const item of data.items) {
      payment.add(item.name, item.amount);
    }
    
    const response = await paynow.send(payment);
    
    if (response.success) {
      return {
        success: true,
        redirectUrl: response.redirectUrl,
        pollUrl: response.pollUrl,
      };
    } else {
      return {
        success: false,
        error: response.error || "Payment initiation failed",
      };
    }
  } catch (err) {
    console.error("Paynow payment error:", err);
    return {
      success: false,
      error: err instanceof Error ? err.message : "Payment request failed",
    };
  }
}

export async function initiateMobilePayment(data: PaynowMobilePaymentData): Promise<{
  success: boolean;
  pollUrl?: string;
  instructions?: string;
  error?: string;
}> {
  const config = getPaynowConfig();
  const paynow = createPaynowInstance();
  
  if (!paynow || !config) {
    return { success: false, error: "Paynow is not configured" };
  }
  
  try {
    const payment = paynow.createPayment(data.reference, data.email);
    
    for (const item of data.items) {
      payment.add(item.name, item.amount);
    }
    
    const response = await paynow.sendMobile(payment, data.phone, data.method);
    
    if (response.success) {
      return {
        success: true,
        pollUrl: response.pollUrl,
        instructions: response.instructions,
      };
    } else {
      return {
        success: false,
        error: response.error || "Mobile payment initiation failed",
      };
    }
  } catch (err) {
    console.error("Paynow mobile payment error:", err);
    return {
      success: false,
      error: err instanceof Error ? err.message : "Mobile payment request failed",
    };
  }
}

export async function checkPaymentStatus(pollUrl: string): Promise<{
  paid: boolean;
  status: string;
  amount?: number;
  reference?: string;
}> {
  const paynow = createPaynowInstance();
  
  if (!paynow) {
    return { paid: false, status: "not_configured" };
  }
  
  try {
    const status = await paynow.pollTransaction(pollUrl);
    
    return {
      paid: status.paid,
      status: status.status,
      amount: status.amount,
      reference: status.reference,
    };
  } catch (err) {
    console.error("Paynow status check error:", err);
    return { paid: false, status: "error" };
  }
}

export function validatePaynowHash(body: Record<string, string>): boolean {
  const config = getPaynowConfig();
  if (!config) {
    return false;
  }

  const receivedHash = body.hash;
  if (!receivedHash) {
    console.warn("Paynow callback: no hash provided");
    return false;
  }

  // Build the hash string by joining all values except hash, in the order received
  // The order matters - Paynow sends fields in a specific order
  const hashFields = ['reference', 'paynowreference', 'amount', 'status', 'pollurl'];
  let hashString = '';
  
  for (const field of hashFields) {
    if (body[field] !== undefined) {
      // URL decode the value before adding to string
      hashString += decodeURIComponent(body[field] || '');
    }
  }
  
  // Append integration key
  hashString += config.integrationKey;
  
  // Create SHA512 hash and convert to uppercase hex
  const computedHash = crypto
    .createHash('sha512')
    .update(hashString)
    .digest('hex')
    .toUpperCase();
  
  const isValid = computedHash === receivedHash.toUpperCase();
  
  if (!isValid) {
    console.warn("Paynow callback: hash mismatch", {
      received: receivedHash,
      computed: computedHash,
    });
  }
  
  return isValid;
}
