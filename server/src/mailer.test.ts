import { describe, it, expect, vi, beforeEach } from "vitest";
import type { Spacefarer } from "./types";

const { sendMailMock } = vi.hoisted(() => ({ sendMailMock: vi.fn() }));

vi.mock("nodemailer", () => ({
  default: {
    createTransport: vi.fn(() => ({ sendMail: sendMailMock })),
  },
}));

import { sendWelcomeEmail } from "./mailer";

const SF: Spacefarer = {
  id: "S1",
  name: "Alice Starborn",
  email: "alice@galactic.space",
  origin_planet: "PlanetX",
  spacesuit_color: "Silver",
  stardust_collection: 500,
  wormhole_navigation_skill: 8,
  status: "ACTIVE",
  launch_date: "2024-01-15T09:00:00Z",
  department_id: "D1",
  position_id: "P3",
  created_at: "2024-01-15T09:00:00Z",
  modified_at: "2024-01-15T09:00:00Z",
};

describe("sendWelcomeEmail", () => {
  beforeEach(() => vi.clearAllMocks());

  it("calls transport.sendMail with correct recipient and subject", async () => {
    sendMailMock.mockResolvedValue({ messageId: "test-id" });

    await sendWelcomeEmail(SF);

    expect(sendMailMock).toHaveBeenCalledOnce();
    const call = sendMailMock.mock.calls[0][0] as {
      to: string;
      subject: string;
    };
    expect(call.to).toBe("alice@galactic.space");
    expect(call.subject).toContain("Alice Starborn");
  });

  it("does not throw when sendMail rejects — swallows the error", async () => {
    sendMailMock.mockRejectedValue(new Error("SMTP connection refused"));

    await expect(sendWelcomeEmail(SF)).resolves.toBeUndefined();
  });

  it("does nothing when email is empty string", async () => {
    await sendWelcomeEmail({ ...SF, email: "" });
    expect(sendMailMock).not.toHaveBeenCalled();
  });
});
