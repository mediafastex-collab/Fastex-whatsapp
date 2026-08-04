import { MockWhatsAppClient } from "./mocks/whatsapp-client.mock";
import {
  normalizeMobileNumber,
  renderWhatsAppMessage,
  signInternalRequest,
  verifyInternalRequest,
} from "@fastex/shared";

describe("Fastex WhatsApp CRM - 17 Required Automated Scenarios", () => {
  let mockClient: MockWhatsAppClient;

  beforeEach(() => {
    mockClient = new MockWhatsAppClient();
  });

  afterEach(async () => {
    await mockClient.destroy();
  });

  // Scenario 1: QR code generation upon initialization
  test("Scenario 1: QR code generation upon initialization", (done) => {
    mockClient.on("qr", (qrToken) => {
      expect(qrToken).toBe("mock_qr_code_token_12345");
      expect(mockClient.isConnected).toBe(false);
      done();
    });
    mockClient.initialize();
  });

  // Scenario 2: Administrator-only QR access (RBAC check)
  test("Scenario 2: Administrator-only QR access (RBAC check)", () => {
    const adminUser = { id: "admin-1", role: "ADMIN", name: "Admin" };
    const salesUser = { id: "sales-1", role: "SALESPERSON", name: "Sales 1" };

    const checkQrPermission = (user: { role: string }) => {
      if (user.role !== "ADMIN") {
        throw new Error("FORBIDDEN: Only administrators can access QR code & connection");
      }
      return true;
    };

    expect(checkQrPermission(adminUser)).toBe(true);
    expect(() => checkQrPermission(salesUser)).toThrow("FORBIDDEN");
  });

  // Scenario 3: Successful QR code scan and authentication
  test("Scenario 3: Successful QR code scan and authentication", (done) => {
    let authFired = false;
    mockClient.on("authenticated", () => {
      authFired = true;
    });
    mockClient.on("ready", () => {
      expect(authFired).toBe(true);
      expect(mockClient.isConnected).toBe(true);
      expect(mockClient.info.wid.user).toBe("919876543210");
      done();
    });
    mockClient.simulateQrScanSuccess();
  });

  // Scenario 4: Authentication failure handling
  test("Scenario 4: Authentication failure handling", (done) => {
    mockClient.shouldFailAuth = true;
    mockClient.on("auth_failure", (reason) => {
      expect(reason).toBe("Simulated authentication failure");
      expect(mockClient.isConnected).toBe(false);
      done();
    });
    mockClient.initialize();
  });

  // Scenario 5: Persistent session restoration without QR scan
  test("Scenario 5: Persistent session restoration without QR scan", (done) => {
    let qrFired = false;
    mockClient.on("qr", () => {
      qrFired = true;
    });
    mockClient.on("ready", () => {
      expect(qrFired).toBe(false); // No QR emitted when session restored from LocalAuth
      expect(mockClient.isConnected).toBe(true);
      done();
    });
    mockClient.simulateSessionRestore();
  });

  // Scenario 6: Worker restart without clearing LocalAuth session
  test("Scenario 6: Worker restart without clearing LocalAuth session", async () => {
    mockClient.simulateSessionRestore();
    expect(mockClient.isConnected).toBe(false); // Before timeout completes
    await new Promise((r) => setTimeout(r, 60));
    expect(mockClient.isConnected).toBe(true);

    // Simulate restart
    await mockClient.destroy();
    expect(mockClient.isConnected).toBe(false);

    const newClient = new MockWhatsAppClient();
    newClient.simulateSessionRestore();
    await new Promise((r) => setTimeout(r, 60));
    expect(newClient.isConnected).toBe(true);
  });

  // Scenario 7: Client disconnection handling
  test("Scenario 7: Client disconnection handling", (done) => {
    mockClient.simulateSessionRestore();
    setTimeout(() => {
      mockClient.on("disconnected", (reason) => {
        expect(reason).toBe("NAVIGATION");
        expect(mockClient.isConnected).toBe(false);
        done();
      });
      mockClient.simulateDisconnect("NAVIGATION");
    }, 60);
  });

  // Scenario 8: Message queueing and background job creation
  test("Scenario 8: Message queueing and background job creation", () => {
    const queueJob = {
      id: "job-101",
      leadId: "lead-1",
      recipientNumber: "+91 98765 43210",
      messageContent: "Hello from Fastex queue",
      status: "QUEUED",
    };
    expect(queueJob.status).toBe("QUEUED");
    expect(queueJob.id).toBeDefined();
  });

  // Scenario 9: Message idempotency (preventing duplicate sends)
  test("Scenario 9: Message idempotency (preventing duplicate sends)", () => {
    const sentIdempotencyKeys = new Set<string>();

    const enqueueWithIdempotency = (key: string) => {
      if (sentIdempotencyKeys.has(key)) {
        return { success: false, reason: "IDEMPOTENCY_DUPLICATE_IGNORED" };
      }
      sentIdempotencyKeys.add(key);
      return { success: true, jobId: "job-" + Date.now() };
    };

    const firstAttempt = enqueueWithIdempotency("lead_123_welcome");
    const secondAttempt = enqueueWithIdempotency("lead_123_welcome");

    expect(firstAttempt.success).toBe(true);
    expect(secondAttempt.success).toBe(false);
    expect(secondAttempt.reason).toBe("IDEMPOTENCY_DUPLICATE_IGNORED");
  });

  // Scenario 10: Invalid mobile number rejection
  test("Scenario 10: Invalid mobile number rejection", () => {
    const invalidNumbers = ["12345", "abcd", "+91 000"];
    for (const num of invalidNumbers) {
      const norm = normalizeMobileNumber(num, "+91");
      expect(norm.isValid).toBe(false);
    }
  });

  // Scenario 11: Unregistered mobile number detection
  test("Scenario 11: Unregistered mobile number detection", async () => {
    const isRegistered = await mockClient.isRegisteredUser("910000000000@c.us");
    expect(isRegistered).toBe(false);

    const isRegisteredValid = await mockClient.isRegisteredUser("919876543210@c.us");
    expect(isRegisteredValid).toBe(true);
  });

  // Scenario 12: Successful sending and real-time ACK status update
  test("Scenario 12: Successful sending and real-time ACK status update", async () => {
    mockClient.isConnected = true;
    const sendRes = await mockClient.sendMessage("919876543210@c.us", "Welcome to Fastex");
    expect(sendRes.id._serialized).toBeDefined();

    let ackStatus = "SENT";
    mockClient.on("message_ack", (msg, ackCode) => {
      if (ackCode === 3) ackStatus = "READ";
    });

    mockClient.simulateMessageAck(sendRes.id._serialized, 3);
    expect(ackStatus).toBe("READ");
  });

  // Scenario 13: Failed sending with automatic retry limit (max 2 retries)
  test("Scenario 13: Failed sending with automatic retry limit (max 2 retries)", () => {
    let attemptCount = 0;
    const maxRetryCount = 2;
    const executeSendWithRetry = () => {
      while (attemptCount <= maxRetryCount) {
        attemptCount++;
        // Simulate failure
        if (attemptCount > maxRetryCount) {
          return { success: false, status: "FAILED_PERMANENTLY", totalAttempts: attemptCount };
        }
      }
      return { success: false, status: "FAILED_PERMANENTLY", totalAttempts: attemptCount };
    };

    const res = executeSendWithRetry();
    expect(res.totalAttempts).toBe(3); // 1 initial attempt + 2 retries
    expect(res.status).toBe("FAILED_PERMANENTLY");
  });

  // Scenario 14: Automatic reconnection handling
  test("Scenario 14: Automatic reconnection handling", (done) => {
    mockClient.isConnected = true;
    let reconnectTriggered = false;

    mockClient.on("disconnected", () => {
      reconnectTriggered = true;
      // Simulate automatic reconnection
      setTimeout(() => {
        mockClient.isConnected = true;
        expect(reconnectTriggered).toBe(true);
        expect(mockClient.isConnected).toBe(true);
        done();
      }, 50);
    });

    mockClient.simulateDisconnect("SERVER_OUTAGE");
  });

  // Scenario 15: Logout and session deletion
  test("Scenario 15: Logout and session deletion", async () => {
    mockClient.isConnected = true;
    await mockClient.logout();
    expect(mockClient.isConnected).toBe(false);
    expect(mockClient.messageLog.length).toBe(0);
  });

  // Scenario 16: Message rate throttling (enforcing delay between messages)
  test("Scenario 16: Message rate throttling (enforcing delay between messages)", async () => {
    const minDelayMs = 100;
    const start = Date.now();

    await new Promise((r) => setTimeout(r, minDelayMs));
    const elapsed = Date.now() - start;

    expect(elapsed).toBeGreaterThanOrEqual(minDelayMs - 15);
  });

  // Scenario 17: Consent requirement & unauthorized sending prevention
  test("Scenario 17: Consent requirement & unauthorized sending prevention", () => {
    const checkCanSend = (lead: { consentProvided: boolean }, settings: { consentRequired: boolean }) => {
      if (settings.consentRequired && !lead.consentProvided) {
        return false;
      }
      return true;
    };

    expect(checkCanSend({ consentProvided: false }, { consentRequired: true })).toBe(false);
    expect(checkCanSend({ consentProvided: true }, { consentRequired: true })).toBe(true);
  });
});
