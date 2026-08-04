export type ConnectionStatusType =
  | "NOT_CONNECTED"
  | "INITIALIZING"
  | "QR_CODE_REQUIRED"
  | "QR_CODE_GENERATED"
  | "AUTHENTICATING"
  | "CONNECTED"
  | "DISCONNECTED"
  | "AUTHENTICATION_FAILED"
  | "RECONNECTING";

export type MessageStatusType =
  | "PENDING"
  | "QUEUED"
  | "PROCESSING"
  | "SENT"
  | "ACKNOWLEDGED"
  | "DELIVERED"
  | "READ"
  | "FAILED"
  | "CANCELLED";

export interface WorkerStatusPayload {
  connectionStatus: ConnectionStatusType;
  phoneNumber?: string | null;
  profileName?: string | null;
  lastConnectedAt?: string | null;
  lastDisconnectedAt?: string | null;
  lastQrGeneratedAt?: string | null;
  lastSuccessfulMsgAt?: string | null;
  authStatus: string;
  workerInstanceId: string;
  authError?: string | null;
  qrCode?: string | null;
}

export interface OutgoingJobData {
  messageId: string;
  leadId?: string | null;
  recipientNumber: string;
  recipientId: string;
  messageContent: string;
  messageType: string;
  idempotencyKey: string;
  attemptCount: number;
  scheduledAt: string;
}

export interface SendMessageResult {
  success: boolean;
  whatsappMessageId?: string;
  status: MessageStatusType;
  errorCode?: string;
  errorMessage?: string;
}
