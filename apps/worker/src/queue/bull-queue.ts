import { Queue, Worker, Job } from "bullmq";
import { config } from "../config/env";
import { processMessageJob } from "./message-processor";
import { OutgoingJobData } from "@fastex/shared";

export const QUEUE_NAME = "whatsapp-outgoing-messages";

export const messageQueue = new Queue<OutgoingJobData>(QUEUE_NAME, {
  connection: {
    url: config.redisUrl,
  },
  defaultJobOptions: {
    attempts: 2,
    backoff: {
      type: "exponential",
      delay: 5000,
    },
    removeOnComplete: false,
    removeOnFail: false,
  },
});

let workerInstance: Worker<OutgoingJobData> | null = null;

export function startMessageWorker(): Worker<OutgoingJobData> {
  if (workerInstance) {
    return workerInstance;
  }

  workerInstance = new Worker<OutgoingJobData>(
    QUEUE_NAME,
    async (job: Job<OutgoingJobData>) => {
      return await processMessageJob(job);
    },
    {
      connection: {
        url: config.redisUrl,
      },
      concurrency: 1, // Process sequentially to respect throttling and safety
      limiter: {
        max: 10, // Default max per minute safety limit
        duration: 60000,
      },
    }
  );

  workerInstance.on("completed", (job) => {
    console.log(`Job completed: ${job.id} (Message ID: ${job.data.messageId})`);
  });

  workerInstance.on("failed", (job, err) => {
    console.error(`Job failed: ${job?.id} - Error: ${err.message}`);
  });

  workerInstance.on("error", () => {
    // Suppress noisy redis connection errors in standalone local dev mode
  });

  return workerInstance;
}

messageQueue.on("error", () => {
  // Suppress noisy redis connection errors in standalone local dev mode
});
