/**
 * Kesher (קשר סליקה) tokenization callback.
 *
 * Flow, per Kesher's "עמוד ליצירת טוקן" docs:
 *   1. The app sends the user's browser to
 *        https://ultra.kesherhk.info/external/paymentPage/{tokenization_page_id}
 *        ?customerRef={userId}&successurl=dailychesed://add-card/done?status=success
 *        &failedurl=dailychesed://add-card/done?status=error
 *      (see buildHostedUrl in src/services/kesher-hosted.ts).
 *   2. The user enters their card on Kesher's own page - it never touches us.
 *   3. Kesher's SERVER calls this function directly with POST, carrying
 *      `token`, `cardMask`, `cardType`, `customerRef` - independently of the
 *      user's browser. This is registered once as a fixed URL in Kesher's
 *      merchant admin panel ("נתיב לקבלת טוקן" on the token page's settings),
 *      not passed per-request.
 *   4. In parallel, Kesher's page redirects the user's OWN browser to
 *      `successurl`/`failedurl` - which is what lets
 *      `WebBrowser.openAuthSessionAsync` on the client detect completion and
 *      close the in-app browser. That redirect carries no card data; the
 *      client instead waits (Realtime + poll) for this function's write to
 *      land on the profile - see `waitForToken` in kesher-hosted.ts.
 *
 * Because this is a server-to-server call, no page redirect is returned here -
 * just a JSON acknowledgement.
 *
 * Deploy:
 *   supabase functions deploy token-callback --no-verify-jwt
 *
 * `--no-verify-jwt` is required: Kesher's server calls this, not an
 * authenticated app session.
 *
 * SECURITY NOTE: Kesher's docs do not describe a shared secret or signature on
 * this callback, so anyone who knows this URL could in principle POST a
 * `customerRef` + `token` of their choosing. The practical mitigation is that
 * `customerRef` is a random Supabase auth UUID that is never displayed or
 * exposed anywhere in the app's UI or APIs - guessing one is infeasible. If
 * Kesher's merchant admin panel offers an IP allow-list for callback URLs,
 * enabling it closes this gap further.
 */

import { createClient } from 'jsr:@supabase/supabase-js@2';

type TokenPayload = {
  token?: string;
  cardMask?: string;
  cardType?: string;
  customerRef?: string;
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

async function extractPayload(request: Request): Promise<TokenPayload> {
  const url = new URL(request.url);
  const fromQuery: TokenPayload = {
    token: url.searchParams.get('token') ?? undefined,
    cardMask: url.searchParams.get('cardMask') ?? undefined,
    cardType: url.searchParams.get('cardType') ?? undefined,
    customerRef: url.searchParams.get('customerRef') ?? undefined,
  };

  if (fromQuery.token && fromQuery.customerRef) {
    return fromQuery;
  }

  const contentType = request.headers.get('content-type') ?? '';

  if (contentType.includes('application/json')) {
    try {
      const body = (await request.json()) as TokenPayload;
      return { ...fromQuery, ...body };
    } catch {
      return fromQuery;
    }
  }

  // Kesher's own POST form example (see docs) uses this by default.
  if (contentType.includes('application/x-www-form-urlencoded') || contentType.includes('multipart/form-data')) {
    const form = await request.formData();
    return {
      token: (form.get('token') as string) ?? fromQuery.token,
      cardMask: (form.get('cardMask') as string) ?? fromQuery.cardMask,
      cardType: (form.get('cardType') as string) ?? fromQuery.cardType,
      customerRef: (form.get('customerRef') as string) ?? fromQuery.customerRef,
    };
  }

  return fromQuery;
}

Deno.serve(async (request) => {
  const payload = await extractPayload(request);

  if (!payload.token || !payload.customerRef) {
    return json({ error: 'missing token or customerRef' }, 400);
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    { auth: { persistSession: false } }
  );

  const { error } = await supabase
    .from('profiles')
    .update({
      kesher_token: payload.token,
      kesher_card_last4: payload.cardMask ?? null,
      kesher_card_brand: payload.cardType ?? null,
      kesher_card_expiry: null,
    })
    .eq('id', payload.customerRef);

  if (error) {
    console.error('failed to store kesher token', error);
    return json({ error: 'failed to store token' }, 500);
  }

  return json({ ok: true });
});
