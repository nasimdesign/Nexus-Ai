import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '../../../lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const method = req.method;
  try {
    if (method === 'GET') {
      const { projectId } = req.query as any;
      if (!projectId) return res.status(400).json({ error: 'projectId required' });
      const tasks = await prisma.task.findMany({ where: { projectId } });
      return res.status(200).json(tasks);
    }
    if (method === 'POST') {
      const { projectId, title, description } = req.body;
      if (!projectId) return res.status(400).json({ error: 'projectId required' });
      const t = await prisma.task.create({ data: { projectId, title: title || 'Untitled task', description } });
      return res.status(201).json(t);
    }
    return res.status(405).end();
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Internal error' });
  }
}
