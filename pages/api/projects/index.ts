import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '../../../lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const method = req.method;
  try {
    if (method === 'GET') {
      const { userId } = req.query as any;
      if (!userId) return res.status(401).json({ error: 'Unauthorized' });
      const projects = await prisma.project.findMany({ where: { ownerId: userId } });
      return res.status(200).json(projects);
    }
    if (method === 'POST') {
      const { userId, title, description } = req.body;
      if (!userId) return res.status(401).json({ error: 'Unauthorized' });
      const p = await prisma.project.create({ data: { ownerId: userId, title: title || 'Untitled', description } });
      return res.status(201).json(p);
    }
    return res.status(405).end();
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Internal error' });
  }
}
