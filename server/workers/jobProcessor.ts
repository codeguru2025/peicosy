import { storage } from "../storage";
import { JOB_CONFIG, OrderStatus, type BackgroundJob } from "@shared/schema";

type PaymentRetryPayload = {
  orderId: number;
  gateway: "paynow" | "payfast";
  pollUrl?: string;
};

const JOB_HANDLERS: Record<string, (job: BackgroundJob) => Promise<void>> = {
  [JOB_CONFIG.PAYMENT_RETRY.type]: handlePaymentRetry,
  [JOB_CONFIG.CLEANUP.type]: handleCleanup,
};

async function handlePaymentRetry(job: BackgroundJob): Promise<void> {
  const payload = job.payload as PaymentRetryPayload;
  console.log(`[JOB] Processing payment retry for order ${payload.orderId}`);
  
  if (payload.gateway === "paynow" && payload.pollUrl) {
    try {
      const response = await fetch(payload.pollUrl);
      if (!response.ok) {
        throw new Error(`Poll URL returned ${response.status}`);
      }
      
      const text = await response.text();
      const params = new URLSearchParams(text);
      const status = params.get("status")?.toLowerCase();
      
      if (status === "paid" || status === "delivered" || status === "awaiting delivery") {
        await storage.updateOrderStatus(payload.orderId, OrderStatus.CONFIRMED);
        console.log(`[JOB] Order ${payload.orderId} marked as confirmed (paid)`);
      } else if (status === "cancelled" || status === "failed") {
        await storage.updateOrderStatus(payload.orderId, OrderStatus.CANCELLED);
        console.log(`[JOB] Order ${payload.orderId} payment was cancelled`);
      } else {
        throw new Error(`Payment still pending: ${status}`);
      }
    } catch (error: any) {
      console.error(`[JOB] Payment retry failed:`, error.message);
      throw error;
    }
  }
}

async function handleCleanup(job: BackgroundJob): Promise<void> {
  console.log(`[JOB] Running cleanup tasks`);
  
  const rateLimitsCleared = await storage.cleanupExpiredRateLimits();
  const oldJobsCleared = await storage.cleanupOldJobs(30);
  
  console.log(`[JOB] Cleanup complete: ${rateLimitsCleared} rate limits, ${oldJobsCleared} old jobs removed`);
}

let isRunning = false;
let intervalId: NodeJS.Timeout | null = null;

export async function processNextJob(): Promise<boolean> {
  const jobTypes = Object.values(JOB_CONFIG).map(c => c.type);
  
  try {
    const job = await storage.claimNextJob(jobTypes);
    if (!job) return false;
    
    const handler = JOB_HANDLERS[job.type];
    if (!handler) {
      console.error(`[JOB] No handler for job type: ${job.type}`);
      await storage.failJob(job.id, `Unknown job type: ${job.type}`);
      return true;
    }
    
    try {
      await handler(job);
      await storage.completeJob(job.id);
      console.log(`[JOB] Completed job #${job.id} (${job.type})`);
    } catch (error: any) {
      console.error(`[JOB] Job #${job.id} failed:`, error.message);
      
      const retryConfig = Object.values(JOB_CONFIG).find(c => c.type === job.type);
      let scheduleRetry: Date | undefined;
      
      if (retryConfig && job.attempts < job.maxAttempts) {
        const delayMinutes = retryConfig.retryDelayMinutes[job.attempts - 1] || 60;
        scheduleRetry = new Date(Date.now() + delayMinutes * 60 * 1000);
        console.log(`[JOB] Scheduling retry in ${delayMinutes} minutes`);
      }
      
      await storage.failJob(job.id, error.message, scheduleRetry);
    }
    
    return true;
  } catch (error: any) {
    console.error(`[JOB] Error processing jobs:`, error.message);
    return false;
  }
}

export function startJobProcessor(intervalMs: number = 30000): void {
  if (isRunning) {
    console.log("[JOB] Job processor already running");
    return;
  }
  
  isRunning = true;
  console.log(`[JOB] Starting job processor (interval: ${intervalMs}ms)`);
  
  intervalId = setInterval(async () => {
    let processed = true;
    while (processed) {
      processed = await processNextJob();
    }
  }, intervalMs);
  
  processNextJob();
}

export function stopJobProcessor(): void {
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
  }
  isRunning = false;
  console.log("[JOB] Job processor stopped");
}

export async function schedulePaymentRetry(
  orderId: number,
  gateway: "paynow" | "payfast",
  pollUrl?: string,
  delayMinutes: number = 5
): Promise<void> {
  const scheduledFor = new Date(Date.now() + delayMinutes * 60 * 1000);
  
  await storage.createJob(
    JOB_CONFIG.PAYMENT_RETRY.type,
    { orderId, gateway, pollUrl },
    scheduledFor,
    JOB_CONFIG.PAYMENT_RETRY.maxAttempts
  );
  
  console.log(`[JOB] Scheduled payment retry for order ${orderId} at ${scheduledFor.toISOString()}`);
}

export async function scheduleCleanup(): Promise<void> {
  await storage.createJob(
    JOB_CONFIG.CLEANUP.type,
    {},
    new Date(),
    JOB_CONFIG.CLEANUP.maxAttempts
  );
}
