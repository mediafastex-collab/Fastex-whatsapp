import { EventEmitter } from "events";

export class MockWhatsAppClient extends EventEmitter {
  public info = {
    wid: { user: "919876543210" },
    pushname: "Fastex Enterprise Account",
  };
  public isConnected = false;
  public shouldFailAuth = false;
  public registeredNumbers = new Set(["919876543210@c.us", "919999999999@c.us"]);
  public messageLog: Array<{ to: string; content: string; id: string }> = [];

  public async initialize(): Promise<void> {
    setTimeout(() => {
      if (this.shouldFailAuth) {
        this.emit("auth_failure", "Simulated authentication failure");
      } else {
        this.emit("qr", "mock_qr_code_token_12345");
      }
    }, 50);
  }

  public simulateQrScanSuccess(): void {
    this.emit("authenticated");
    setTimeout(() => {
      this.isConnected = true;
      this.emit("ready");
    }, 50);
  }

  public simulateSessionRestore(): void {
    setTimeout(() => {
      this.isConnected = true;
      this.emit("ready");
    }, 50);
  }

  public simulateDisconnect(reason: string = "NAVIGATION"): void {
    this.isConnected = false;
    this.emit("disconnected", reason);
  }

  public simulateMessageAck(msgId: string, ackCode: number): void {
    this.emit("message_ack", { id: { _serialized: msgId } }, ackCode);
  }

  public async isRegisteredUser(recipientId: string): Promise<boolean> {
    return this.registeredNumbers.has(recipientId);
  }

  public async sendMessage(to: string, content: string): Promise<any> {
    if (!this.isConnected) {
      throw new Error("Client is not connected");
    }
    const msgId = `mock_msg_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    this.messageLog.push({ to, content, id: msgId });
    return {
      id: { _serialized: msgId },
      body: content,
      to,
      from: "919876543210@c.us",
      timestamp: Math.floor(Date.now() / 1000),
    };
  }

  public async logout(): Promise<void> {
    this.isConnected = false;
    this.messageLog = [];
  }

  public async destroy(): Promise<void> {
    this.isConnected = false;
    this.removeAllListeners();
  }
}
