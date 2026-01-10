declare module 'paynow' {
  interface PaynowPayment {
    add(name: string, amount: number): void;
  }

  interface PaynowResponse {
    success: boolean;
    error?: string;
    redirectUrl?: string;
    pollUrl?: string;
    instructions?: string;
  }

  interface PaynowStatus {
    paid: boolean;
    status: string;
    amount?: number;
    reference?: string;
  }

  export class Paynow {
    resultUrl: string;
    returnUrl: string;
    
    constructor(integrationId: string, integrationKey: string);
    createPayment(reference: string, email: string): PaynowPayment;
    send(payment: PaynowPayment): Promise<PaynowResponse>;
    sendMobile(payment: PaynowPayment, phone: string, method: 'ecocash' | 'onemoney'): Promise<PaynowResponse>;
    pollTransaction(pollUrl: string): Promise<PaynowStatus>;
  }
}
