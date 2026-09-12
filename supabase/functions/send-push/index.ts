// ════════════════════════════════════════════════════════════════
//  RoutineFlow — send-push Edge Function (Supabase / Deno)
//
//  Sends a Web Push notification to every device registered for a user.
//  Deploy:  supabase functions deploy send-push
//  Secrets: supabase secrets set VAPID_PUBLIC_KEY=... VAPID_PRIVATE_KEY=... VAPID_SUBJECT=mailto:you@example.com
//
//  Invoke (from client, a DB webhook, or a scheduled cron):
//    POST { userId, title, body, url }
// ════════════════════════════════════════════════════════════════
import { createClient } from 'jsr:@supabase/supabase-js@2'
import webpush from 'npm:web-push@3.6.7'

const VAPID_PUBLIC_KEY = Deno.env.get('VAPID_PUBLIC_KEY')!
const VAPID_PRIVATE_KEY = Deno.env.get('VAPID_PRIVATE_KEY')!
const VAPID_SUBJECT = Deno.env.get('VAPID_SUBJECT') ?? 'mailto:admin@routineflow.app'

webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY)

const admin = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
)

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })

  try {
    const { userId, title, body, url } = await req.json()
    if (!userId) return json({ error: 'userId required' }, 400)

    const { data: subs, error } = await admin
      .from('push_subscriptions')
      .select('*')
      .eq('user_id', userId)
    if (error) return json({ error: error.message }, 500)

    const payload = JSON.stringify({ title: title ?? 'RoutineFlow', body: body ?? '', url: url ?? '/' })

    let sent = 0
    await Promise.all(
      (subs ?? []).map(async (s: { id: string; endpoint: string; keys: Record<string, string> }) => {
        try {
          await webpush.sendNotification({ endpoint: s.endpoint, keys: s.keys }, payload)
          sent++
        } catch (err) {
          // 404/410 → subscription is gone; clean it up.
          const status = (err as { statusCode?: number }).statusCode
          if (status === 404 || status === 410) {
            await admin.from('push_subscriptions').delete().eq('id', s.id)
          }
        }
      }),
    )

    return json({ ok: true, sent })
  } catch (err) {
    return json({ error: String(err) }, 500)
  }
})

function json(obj: unknown, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { ...cors, 'Content-Type': 'application/json' },
  })
}
