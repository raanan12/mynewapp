/**
 * Attaches contact details (email, phone, ID number) to the customer record
 * Kesher (קשר סליקה) auto-creates the moment a token is issued for a given
 * `customerRef`. Once this is set, Kesher emails the auto-generated receipt
 * (see kesher-charge's `DocumentsDetails.PdfLink`) to that address on every
 * future charge against that customerRef - no per-charge field needed.
 *
 * API: POST https://kesherhk.info/ConnectToKesher/ConnectToKesher
 *   func: 'UpdateCustomer', customerDetails: { ApiIdentity, CustomerInput: {...} }
 * `ApiIdentity` is Kesher's name for the same external id we call
 * `customerRef` when creating the token - it must be the caller's own
 * Supabase user id, which is why this function reads it from the verified
 * JWT rather than trusting the request body.
 *
 * Deploy:
 *   supabase functions deploy kesher-update-customer
 *   (reuses the KESHER_API_USERNAME / KESHER_API_PASSWORD secrets already
 *   set for kesher-charge)
 *
 * JWT verification stays ON - see kesher-charge for why.
 */

import { createClient } from 'jsr:@supabase/supabase-js@2';

type UpdateBody = {
  email?: string | null;
  phone?: string | null;
  idNumber?: string | null;
  fullName?: string | null;
};

type KesherResponse = {
  /** Confirmed from live traffic - the written docs describe `Succeeded` /
   *  `Message` / `Entity`, but the real response uses these instead. */
  Status?: boolean;
  Code?: number;
  Description?: string;
  Data?: unknown;
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

Deno.serve(async (request) => {
  if (request.method !== 'POST') {
    return json({ error: 'method not allowed' }, 405);
  }

  const authHeader = request.headers.get('Authorization') ?? '';
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;

  const asUser = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!, {
    global: { headers: { Authorization: authHeader } },
    auth: { persistSession: false },
  });

  const { data: auth } = await asUser.auth.getUser();
  if (!auth.user) {
    return json({ error: 'unauthorized' }, 401);
  }

  let body: UpdateBody;
  try {
    body = (await request.json()) as UpdateBody;
  } catch {
    return json({ error: 'invalid json' }, 400);
  }

  if (!body.email && !body.phone && !body.idNumber && !body.fullName) {
    return json({ error: 'לא סופקו פרטים לעדכון' }, 400);
  }

  const admin = createClient(supabaseUrl, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, {
    auth: { persistSession: false },
  });

  const mirrorLocally = () =>
    admin
      .from('profiles')
      .update({
        receipt_email: body.email ?? undefined,
        receipt_id_number: body.idNumber ?? undefined,
        phone: body.phone ?? undefined,
        full_name: body.fullName ?? undefined,
      })
      .eq('id', auth.user.id);

  const { data: profile } = await admin
    .from('profiles')
    .select('kesher_token')
    .eq('id', auth.user.id)
    .maybeSingle();

  // No card yet means no Kesher customer exists to update either - just
  // remember the details locally so they get sent along the next time a
  // token is created (see buildHostedUrl in kesher-hosted.ts).
  if (!profile?.kesher_token) {
    const { error } = await mirrorLocally();
    if (error) {
      console.error('failed to save contact details locally', error);
      return json({ error: 'שמירת הפרטים נכשלה' }, 500);
    }
    return json({ ok: true, syncedToKesher: false });
  }

  const requestBody = {
    Json: {
      userName: Deno.env.get('KESHER_API_USERNAME'),
      password: Deno.env.get('KESHER_API_PASSWORD'),
      func: 'UpdateCustomer',
      format: 'json',
      customerDetails: {
        ApiIdentity: auth.user.id,
        CustomerInput: {
          FirstName: body.fullName ?? undefined,
          Tz: body.idNumber ?? undefined,
          Phone: body.phone ?? undefined,
          Mail: body.email ?? undefined,
        },
      },
    },
    format: 'json',
  };

  const response = await fetch('https://kesherhk.info/ConnectToKesher/ConnectToKesher', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(requestBody),
  });

  const text = await response.text();
  // Temporary - remove once this response shape is confirmed, same lesson as
  // kesher-charge: Kesher's written docs did not match its actual response.
  console.log('kesher update-customer raw response', response.status, text.slice(0, 1000));

  let result: KesherResponse;
  try {
    result = JSON.parse(text) as KesherResponse;
  } catch {
    console.error('kesher returned non-JSON response', text.slice(0, 500));
    return json({ error: 'קשר החזירה תשובה לא צפויה' }, 502);
  }

  if (result.Status === false) {
    console.warn('kesher update-customer declined', JSON.stringify(result));
    return json({ error: result.Description ?? 'עדכון הפרטים נכשל', code: result.Code }, 402);
  }

  const { error: updateError } = await mirrorLocally();

  if (updateError) {
    console.error('failed to mirror contact details locally', updateError);
    // Kesher already has the details - do not fail the request over this.
  }

  return json({ ok: true, syncedToKesher: true });
});
