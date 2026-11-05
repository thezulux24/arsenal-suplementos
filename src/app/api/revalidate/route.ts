import { revalidateTag } from 'next/cache';
import { CMS_SLUG } from '@/lib/site';

// Project.webhookUrl = https://<tienda>/api/revalidate y el mismo secreto en CMS_WEBHOOK_SECRET.
export async function POST(req: Request) {
  if (!process.env.CMS_WEBHOOK_SECRET || req.headers.get('x-cms-webhook-secret') !== process.env.CMS_WEBHOOK_SECRET) {
    return Response.json({ ok: false }, { status: 401 });
  }
  const body = (await req.json().catch(() => ({}))) as { projectSlug?: string };
  revalidateTag(`cms:${body.projectSlug || CMS_SLUG}`);
  return Response.json({ ok: true });
}
