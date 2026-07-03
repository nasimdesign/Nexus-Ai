import type { NextApiRequest, NextApiResponse } from "next";
import nodemailer from "nodemailer";
import { createChatCompletion } from "../../lib/openai";

type EmailRequest = {
  to: string;
  subject: string;
  useAI?: boolean;
  promptData?: { name?: string; reason?: string };
  body?: string;
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).end();
  const data: EmailRequest = req.body;
  if (!data.to || !data.subject) return res.status(400).json({ error: "to and subject required" });

  try {
    let finalBody = data.body || "";
    if (data.useAI) {
      // Simple prompt to generate a short welcome/notification email
      const prompt = `Write a friendly ${data.promptData?.reason || "welcome"} email to ${data.promptData?.name || data.to}. Keep it concise and professional.`;
      const aiResp = await createChatCompletion([
        { role: "system", content: "You are a helpful assistant that writes emails." },
        { role: "user", content: prompt },
      ] as any);
      finalBody = aiResp?.choices?.[0]?.message?.content || aiResp?.choices?.[0]?.delta?.content || finalBody;
    }

    // Create transporter from EMAIL_SERVER env (supports SMTP url)
    const transporter = nodemailer.createTransport(process.env.EMAIL_SERVER as string || "");

    await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to: data.to,
      subject: data.subject,
      html: finalBody,
    });

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Failed to send email" });
  }
}
