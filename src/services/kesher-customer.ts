/**
 * Attaches contact details (email, phone, ID number) to the Kesher customer
 * record so future charge receipts are emailed automatically - see
 * supabase/functions/kesher-update-customer for the mechanism.
 *
 * A no-op when there is nothing to charge yet (no card/no Supabase) makes
 * little sense here since the details are useful even before a card exists,
 * so this only requires Supabase, not a saved card.
 */

import { invokeEdgeFunction } from '@/lib/edge-functions';
import { useAppStore, type ContactDetails } from '@/store/app-store';

export type UpdateContactResult = { ok: true } | { ok: false; message: string };

export async function updateContactDetails(
  contact: Partial<ContactDetails>
): Promise<UpdateContactResult> {
  const result = await invokeEdgeFunction<{ ok: true }>('kesher-update-customer', {
    email: contact.email ?? undefined,
    phone: contact.phone ?? undefined,
    idNumber: contact.idNumber ?? undefined,
    fullName: contact.fullName ?? undefined,
  });

  if (!result.ok) {
    return result;
  }

  useAppStore.getState().setContact({ ...useAppStore.getState().contact, ...contact });
  return { ok: true };
}
