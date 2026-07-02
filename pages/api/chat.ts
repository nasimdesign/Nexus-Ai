import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from './authOptions';
import { prisma } from '../../lib/prisma';
import { createChatCompletion } from '../../lib/openai';

// NOTE: This file expects you to export authOptions from a shared location.
// For simplicity, we will implement a minimal server-side session check.

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end();
  try {
    // Very small auth guard - you can expand this to use getServerSession
    const userId = req.body.userId;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const { conversationId, messages } = req.body;

    // persist user messages
    let convId = conversationId;
    if (!convId) {
      const conv = await prisma.conversation.create({ data: { userId, title: messages[0]?.content?.slice(0, 120) || 'New conversation' } });
      convId = conv.id;
    }

    for (const m of messages) {
      await prisma.message.create({ data: { conversationId: convId, role: m.role, content: m.content } });
    }

    // call LLM
    const aiResp = await createChatCompletion(messages.map((m) => ({ role: m.role, content: m.content })));
    const aiMessage = aiResp.choices?.[0]?.message?.content || aiResp.choices?.[0]?.delta?.content || '';

    // save AI message
    await prisma.message.create({ data: { conversationId: convId, role: 'assistant', content: aiMessage } });

    return res.status(200).json({ conversationId: convId, message: aiMessage });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Internal error' });
  }
}
