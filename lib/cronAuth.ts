/** Vercel Cron automatically sends `Authorization: Bearer $CRON_SECRET` when CRON_SECRET is set as an env var. */
export function isAuthorizedCronRequest(req: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  return req.headers.get("authorization") === `Bearer ${secret}`;
}
