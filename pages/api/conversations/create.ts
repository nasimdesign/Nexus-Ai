import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '../../../lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end();
  try {
    const { userId } = req.body;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    // Prevent spamming: reject if the user created a conversation in the last 7 seconds
    const threshold = new Date(Date.now() - 7 * 1000);
    const recent = await prisma.conversation.findFirst({ where: { userId, createdAt: { gt: threshold } } });
    if (recent) return res.status(429).json({ error: 'Please wait before creating another conversation' });

    const conv = await prisma.conversation.create({ data: { userId, title: 'New conversation' } });
    return res.status(201).json({ id: conv.id });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Internal error' });
  }
}
