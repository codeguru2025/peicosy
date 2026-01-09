import crypto from "crypto";

export interface PayFastConfig {
  merchantId: string;
  merchantKey: string;
  passphrase: string;
  sandbox: boolean;
}

export interface PayFastPaymentData {
  orderId: number;
  amount: number; // In ZAR (cents will be calculated)
  itemName: string;
  itemDescription?: string;
  customerEmail: string;
  customerFirstName?: string;
  customerLastName?: string;
}

const PAYFAST_SANDBOX_URL = "https://sandbox.payfast.co.za/eng/process";
const PAYFAST_LIVE_URL = "https://www.payfast.co.za/eng/process";

export function getPayFastConfig(): PayFastConfig | null {
  const merchantId = process.env.PAYFAST_MERCHANT_ID;
  const merchantKey = process.env.PAYFAST_MERCHANT_KEY;
  const passphrase = process.env.PAYFAST_PASSPHRASE || "";
  const sandbox = process.env.PAYFAST_SANDBOX === "true";
  
  // Return null if not configured - allows app to run without PayFast
  if (!merchantId || !merchantKey) {
    return null;
  }
  
  return {
    merchantId,
    merchantKey,
    passphrase,
    sandbox,
  };
}

export function isPayFastConfigured(): boolean {
  return getPayFastConfig() !== null;
}

export function requirePayFastConfig(): PayFastConfig {
  const config = getPayFastConfig();
  if (!config) {
    throw new Error("PayFast is not configured. Please set PAYFAST_MERCHANT_ID and PAYFAST_MERCHANT_KEY environment variables.");
  }
  return config;
}

export function generatePayFastForm(
  data: PayFastPaymentData,
  returnUrl: string,
  cancelUrl: string,
  notifyUrl: string
): { url: string; fields: Record<string, string> } {
  const config = requirePayFastConfig();
  
  const fields: Record<string, string> = {
    merchant_id: config.merchantId,
    merchant_key: config.merchantKey,
    return_url: returnUrl,
    cancel_url: cancelUrl,
    notify_url: notifyUrl,
    m_payment_id: String(data.orderId),
    amount: data.amount.toFixed(2),
    item_name: data.itemName.substring(0, 100),
  };

  if (data.itemDescription) {
    fields.item_description = data.itemDescription.substring(0, 255);
  }
  
  if (data.customerEmail) {
    fields.email_address = data.customerEmail;
  }
  
  if (data.customerFirstName) {
    fields.name_first = data.customerFirstName;
  }
  
  if (data.customerLastName) {
    fields.name_last = data.customerLastName;
  }

  // Generate signature
  const signature = generateSignature(fields, config.passphrase);
  fields.signature = signature;

  return {
    url: config.sandbox ? PAYFAST_SANDBOX_URL : PAYFAST_LIVE_URL,
    fields,
  };
}

function generateSignature(data: Record<string, string>, passphrase: string): string {
  // Create parameter string
  let pfOutput = "";
  for (const key of Object.keys(data).sort()) {
    if (data[key] !== "" && key !== "signature") {
      pfOutput += `${key}=${encodeURIComponent(data[key].trim()).replace(/%20/g, "+")}&`;
    }
  }
  
  // Remove last ampersand
  pfOutput = pfOutput.slice(0, -1);
  
  // Add passphrase if set
  if (passphrase) {
    pfOutput += `&passphrase=${encodeURIComponent(passphrase.trim()).replace(/%20/g, "+")}`;
  }
  
  return crypto.createHash("md5").update(pfOutput).digest("hex");
}

export function verifyPayFastSignature(
  data: Record<string, string>,
  passphrase: string
): boolean {
  const receivedSignature = data.signature;
  const dataWithoutSignature = { ...data };
  delete dataWithoutSignature.signature;
  
  const calculatedSignature = generateSignature(dataWithoutSignature, passphrase);
  return receivedSignature === calculatedSignature;
}

export function validatePayFastITN(data: Record<string, string>): {
  valid: boolean;
  orderId: number;
  paymentStatus: string;
  amount: number;
} {
  const config = requirePayFastConfig();
  
  // Verify signature
  const signatureValid = verifyPayFastSignature(data, config.passphrase);
  
  if (!signatureValid) {
    console.error("PayFast ITN: Invalid signature");
    return { valid: false, orderId: 0, paymentStatus: "", amount: 0 };
  }
  
  return {
    valid: true,
    orderId: parseInt(data.m_payment_id) || 0,
    paymentStatus: data.payment_status,
    amount: parseFloat(data.amount_gross) || 0,
  };
}
