import "dotenv/config";
import nodemailer from "nodemailer";
import type { Spacefarer } from "./types";

const transport = nodemailer.createTransport({
  host: process.env.SMTP_HOST ?? "localhost",
  port: parseInt(process.env.SMTP_PORT ?? "587", 10),
  secure: process.env.SMTP_SECURE === "true",
  auth: process.env.SMTP_USER
    ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
    : undefined,
});

export async function sendWelcomeEmail(sf: Spacefarer): Promise<void> {
  if (!sf.email) return;
  try {
    const info = await transport.sendMail({
      from: process.env.SMTP_FROM ?? '"Galactic HQ" <noreply@galactic.space>',
      to: sf.email,
      subject: `🚀 Welcome to the Stars, ${sf.name}!`,
      html: `
        <h2>Congratulations, Spacefarer ${sf.name}!</h2>
        <p>You have officially embarked on your cosmic journey from
        <strong>${sf.origin_planet}</strong>.</p>
        <table>
          <tr><td><strong>Stardust Collection:</strong></td><td>${sf.stardust_collection}</td></tr>
          <tr><td><strong>Wormhole Navigation Skill:</strong></td><td>${sf.wormhole_navigation_skill} / 10</td></tr>
          <tr><td><strong>Spacesuit Color:</strong></td><td>${sf.spacesuit_color}</td></tr>
        </table>
        <p>May the stars guide your path. Good luck on your Galactic Adventure!</p>
        <hr/><small>Galactic Spacefarer Headquarters</small>
      `,
    });
    console.info(
      `[mailer] Welcome email sent to ${sf.email} — ${info.messageId}`,
    );
  } catch (err) {
    console.warn(
      `[mailer] Could not send email to ${sf.email}: ${(err as Error).message}`,
    );
  }
}
