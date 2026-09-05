/**
 * Charges a stored Kesher (קשר סליקה) token via the SendTransaction API and
 * records the donation. There is no prepaid wallet - every donation charges
 * the card for the exact amount tapped, right when it is tapped.
 *
 * Deploy:
 *   supabase functions deploy kesher-charge
 *   supabase secrets set KESHER_API_USERNAME=... KESHER_API_PASSWORD=...
 *
 * JWT verification stays ON: the caller must be a logged-in user, and the
 * token charged is read from *their* profile - never accepted from the
 * request body. That is what stops one user from charging another user's card.
 *
 * `project_number` is not a secret - it is read from the public
 * `kesher_settings` table (same row the app reads `tokenization_page_id`
 * from). Only the API username/password are Edge Function secrets.
 *
 * RESPONSE SHAPE - confirmed from live traffic, NOT from Kesher's written
 * docs (which described a different `RequestResult.{Status,Code,...}`
 * envelope that this endpoint does not actually use):
 *   - Failure: a flat `{ status: "error", error: "faultcode: ... faultstring: ..." }`.
 *   - Success: a flat object with card/transaction fields (CardType,
 *     CompanyTranId, ...) and, when a receipt was issued, `DocumentsDetails
 *     .DocumentDetails[0].PdfLink` - which we use directly as the donation's
 *     receipt, since Kesher already generates a proper tax document per
 *     charge. There is no boolean success flag: the absence of `error` IS
 *     the success signal.
 */

import { createClient } from 'jsr:@supabase/supabase-js@2';

type ChargeBody = {
  amount?: number;
  category?: string;
  dedication?: string | null;
  /** 'manual' (coin tap) or 'auto' (auto-pilot scheduler). */
  source?: 'manual' | 'auto';
};

type KesherResponse = {
  /** Present only on failure - a fault string, not meant for end users as-is. */
  error?: string;
  /** Present on success when Kesher issued a tax document for the charge. */
  CompanyTranId?: string;
  DocumentsDetails?: {
    DocumentDetails?: { DocNumber?: string; PdfLink?: string }[];
  };
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

/** Kesher requires <= 19 chars; this stays well under that with room to spare. */
function uniqNum(): string {
  return `TX${Date.now()}${Math.random().toString(36).slice(2, 6)}`.slice(0, 19);
}

/** Strips the "faultcode: a:X faultstring: " wrapper down to the readable part. */
function readableFault(raw: string): string {
  const match = /faultstring:\s*(.+)$/i.exec(raw);
  return match ? match[1].trim() : raw;
}

async function sendTransaction(args: {
  token: string;
  amountAgorot: number;
  projectNumber: string;
  /** Same Supabase user id sent as `customerRef` when the token was created -
   *  this is what lets Kesher match the charge to that existing customer
   *  instead of minting a new one every time. */
  customerRef: string;
  contact: { fullName: string | null; email: string | null; phone: string | null; idNumber: string | null };
}): Promise<KesherResponse> {
  const requestBody = {
    Json: {
      userName: Deno.env.get('KESHER_API_USERNAME'),
      password: Deno.env.get('KESHER_API_PASSWORD'),
      func: 'SendTransaction',
      format: 'json',
      tran: {
        Token: args.token,
        Total: args.amountAgorot,
        Currency: 1,
        CreditType: 1,
        TransactionType: 'debit',
        ParamJ: 'J4',
        ProjectNumber: args.projectNumber,
        UniqNum: uniqNum(),
        // Confirmed field names from Kesher's full `tran` schema table -
        // `Id` is the ID-number field (not `Tz`, which faulted).
        // `ClientApiIdentity` is "מזהה לקוח בתוכנה חיצונית" - the bridge to
        // the customer created at tokenization time.
        ClientApiIdentity: args.customerRef,
        FirstName: args.contact.fullName ?? undefined,
        Phone: args.contact.phone ?? undefined,
        Mail: args.contact.email ?? undefined,
        Id: args.contact.idNumber ?? undefined,
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

  try {
    return JSON.parse(text) as KesherResponse;
  } catch {
    // Wrong API credentials come back as an HTML error page, not JSON.
    console.error('kesher returned non-JSON response', text.slice(0, 500));
    throw new Error('קשר החזירה תשובה לא צפויה - ייתכן שפרטי הגישה שגויים');
  }
}

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

  let body: ChargeBody;
  try {
    body = (await request.json()) as ChargeBody;
  } catch {
    return json({ error: 'invalid json' }, 400);
  }

  const amount = Number(body.amount);
  const source = body.source ?? 'manual';

  if (!Number.isFinite(amount) || amount <= 0 || amount > 5000) {
    return json({ error: 'סכום החיוב אינו תקין' }, 400);
  }
  // Mirrors AUTO_PILOT_MAX_AMOUNT in src/services/wallet.ts - enforced here
  // too since this is the only place that can't be bypassed by a stale or
  // tampered client.
  if (source === 'auto' && amount > 50) {
    return json({ error: 'סכום הטייס האוטומטי גבוה מהמותר' }, 400);
  }
  if (!body.category) {
    return json({ error: 'חסר ייעוד לתרומה' }, 400);
  }

  const admin = createClient(supabaseUrl, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, {
    auth: { persistSession: false },
  });

  // The real fix for auto-pilot double-charging: no client-side lock can
  // protect against a second app launch (or second device) racing the
  // first, but the card must never be charged twice for one day regardless.
  if (source === 'auto') {
    const { data: alreadyDonated, error: guardError } = await admin.rpc('has_auto_donation_today', {
      p_user_id: auth.user.id,
    });

    if (guardError) {
      console.error('auto-pilot daily guard check failed', guardError);
      return json({ error: 'לא ניתן לאמת את מצב הטייס האוטומטי' }, 500);
    }
    if (alreadyDonated) {
      return json({ error: 'התרומה האוטומטית של היום כבר בוצעה' }, 409);
    }
  }

  const [{ data: profile, error: profileError }, { data: settings, error: settingsError }] =
    await Promise.all([
      admin
        .from('profiles')
        .select('kesher_token, full_name, phone, receipt_email, receipt_id_number')
        .eq('id', auth.user.id)
        .single(),
      admin.from('kesher_settings').select('project_number').eq('id', 'default').single(),
    ]);

  if (profileError || !profile?.kesher_token) {
    return json({ error: 'לא נמצא כרטיס שמור' }, 400);
  }
  if (settingsError || !settings?.project_number) {
    console.error('kesher_settings.project_number missing', settingsError);
    return json({ error: 'תצורת הסליקה לא הוגדרה במערכת' }, 500);
  }

  let result: KesherResponse;

  try {
    result = await sendTransaction({
      token: profile.kesher_token,
      amountAgorot: Math.round(amount * 100),
      projectNumber: settings.project_number,
      customerRef: auth.user.id,
      contact: {
        fullName: profile.full_name,
        phone: profile.phone,
        email: profile.receipt_email,
        idNumber: profile.receipt_id_number,
      },
    });
  } catch (error) {
    console.error('kesher charge request failed', error);
    return json({ error: 'החיוב נכשל מול חברת הסליקה' }, 502);
  }

  if (result.error) {
    console.warn('kesher charge declined', result.error);
    return json({ error: readableFault(result.error) }, 402);
  }

  const transactionId = result.CompanyTranId ?? null;
  const receiptUrl = result.DocumentsDetails?.DocumentDetails?.[0]?.PdfLink ?? null;

  const { data: donation, error: donationError } = await admin.rpc('apply_direct_donation', {
    p_user_id: auth.user.id,
    p_amount: amount,
    p_category: body.category,
    p_dedication: body.dedication ?? null,
    p_kesher_transaction_id: transactionId,
    p_source: source,
  });

  if (donationError) {
    // The card was charged but the donation did not get recorded - must be
    // reconciled manually.
    console.error('CRITICAL: charged but failed to record donation', auth.user.id, transactionId, donationError);
    return json({ error: 'החיוב בוצע אך התרומה לא נרשמה. פנו לתמיכה.' }, 500);
  }

  if (receiptUrl && donation) {
    await admin.from('donations').update({ receipt_url: receiptUrl }).eq('id', donation.id);
    donation.receipt_url = receiptUrl;
  }

  return json({ ok: true, transactionId, donation });
});
