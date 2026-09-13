import { OPS_EMAIL } from './ops'

/** Every admin + super admin address that should receive internal alerts. */
export async function opsRecipients(): Promise<string[]> {
  const out = new Set<string>([OPS_EMAIL])
  try {
    const { supabaseAdmin } = await import('@/integrations/supabase/client.server')
    const { data: roles } = await supabaseAdmin
      .from('user_roles')
      .select('user_id, role')
      .in('role', ['admin', 'super_admin'])
    const ids = Array.from(new Set((roles ?? []).map((r) => r.user_id as string)))
    if (ids.length) {
      const { data: profiles } = await supabaseAdmin.from('profiles').select('email').in('id', ids)
      for (const p of profiles ?? []) if (p.email) out.add((p.email as string).trim().toLowerCase())
    }
    // Invited admins who haven't signed up yet still get alerts.
    const { data: invites } = await supabaseAdmin
      .from('admin_invites')
      .select('email, role')
      .in('role', ['admin', 'super_admin'])
    for (const i of invites ?? []) if (i.email) out.add((i.email as string).trim().toLowerCase())
  } catch (e) {
    console.error('opsRecipients lookup failed', e)
  }
  return Array.from(out)
}

/** Fan an internal alert out to every admin. Best-effort; never throws. */
export async function sendOpsAlert(
  template: string,
  opts: { idempotencyKey: string; templateData: Record<string, unknown> },
): Promise<void> {
  const { sendTemplateEmail } = await import('./send-email')
  const recipients = await opsRecipients()
  await Promise.all(
    recipients.map(async (to) => {
      try {
        await sendTemplateEmail(template, to, {
          idempotencyKey: `${opts.idempotencyKey}-${to}`,
          templateData: opts.templateData,
        })
      } catch (e) {
        console.error('ops alert failed', to, e)
      }
    }),
  )
}
