/**
 * Clause 46 (סעיף 46) tax-deductible receipts.
 *
 * In production Kesher issues the official receipt and returns a hosted PDF
 * URL. Until credentials are wired in (or when a receipt needs to be re-issued
 * offline) we render an RTL HTML receipt locally with expo-print.
 */

import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

import { kesher } from '@/services/kesher';
import { appText, categoryLabel } from '@/store/app-store';
import type { Donation } from '@/types';
import { formatCurrency, formatDateTime } from '@/utils/format';

/** Reads the current admin-edited association/tax-receipt details. */
export function association() {
  return {
    name: appText('association_name'),
    number: appText('association_number'),
    clause46: appText('association_clause46'),
    address: appText('association_address'),
  };
}

const escapeHtml = (value: string) =>
  value.replace(/[&<>"]/g, (char) => `&${{ '&': 'amp', '<': 'lt', '>': 'gt', '"': 'quot' }[char]};`);

function receiptHtml(donation: Donation): string {
  const org = association();
  const dedication = donation.dedication
    ? `<tr><th>הקדשה</th><td>${escapeHtml(donation.dedication)}</td></tr>`
    : '';

  return `<!DOCTYPE html>
<html lang="he" dir="rtl">
  <head>
    <meta charset="utf-8" />
    <style>
      body { font-family: -apple-system, "Helvetica Neue", Arial, sans-serif; direction: rtl;
             color: #222222; padding: 48px; background: #FDFBF7; }
      .head { border-bottom: 3px solid #D4AF37; padding-bottom: 16px; margin-bottom: 28px; }
      h1 { color: #1A2B4C; font-size: 26px; margin: 0 0 6px; }
      .sub { color: #8A8578; font-size: 13px; }
      table { width: 100%; border-collapse: collapse; margin-top: 12px; }
      th, td { text-align: right; padding: 12px 8px; border-bottom: 1px solid #E3DCCD; font-size: 15px; }
      th { color: #8A8578; font-weight: 600; width: 34%; }
      .total { margin-top: 28px; background: #1A2B4C; color: #FDFBF7; padding: 18px 20px;
               border-radius: 14px; display: flex; justify-content: space-between; font-size: 20px; }
      .total b { color: #D4AF37; }
      footer { margin-top: 36px; font-size: 12px; color: #8A8578; line-height: 1.7; }
    </style>
  </head>
  <body>
    <div class="head">
      <h1>קבלה על תרומה</h1>
      <div class="sub">${org.name} · ע.ר. ${org.number}</div>
      <div class="sub">${org.clause46}</div>
    </div>

    <table>
      <tr><th>מספר קבלה</th><td>${escapeHtml(donation.id)}</td></tr>
      <tr><th>תאריך</th><td>${formatDateTime(donation.createdAt)}</td></tr>
      <tr><th>ייעוד התרומה</th><td>${categoryLabel(donation.categoryId)}</td></tr>
      ${dedication}
      <tr><th>אמצעי תשלום</th><td>ארנק החסד (נטען בכרטיס אשראי)</td></tr>
    </table>

    <div class="total"><span>סה״כ נתרם</span><b>${formatCurrency(donation.amount)}</b></div>

    <footer>
      קבלה זו מוכרת לצורכי החזר מס לפי סעיף 46 לפקודת מס הכנסה.<br />
      ${org.address}
    </footer>
  </body>
</html>`;
}

/** Generates the PDF and returns its local file URI. */
export async function generateReceipt(donation: Donation): Promise<string> {
  const { uri } = await Print.printToFileAsync({ html: receiptHtml(donation) });
  return uri;
}

export async function shareReceipt(donation: Donation): Promise<void> {
  const uri = await generateReceipt(donation);
  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(uri, { mimeType: 'application/pdf', UTI: 'com.adobe.pdf' });
  }
}

/**
 * Prefers the official Kesher receipt when the donation carries a live
 * transaction id, and falls back to the locally rendered PDF.
 */
export async function resolveReceiptUrl(donation: Donation): Promise<string> {
  if (donation.receiptUrl && !donation.receiptUrl.startsWith('local://')) {
    return donation.receiptUrl;
  }

  if (donation.receiptUrl?.startsWith('local://')) {
    const transactionId = donation.receiptUrl.replace('local://receipt/', '');
    const hosted = await kesher.fetchReceiptUrl(transactionId).catch(() => null);
    if (hosted && !hosted.startsWith('local://')) return hosted;
  }

  return generateReceipt(donation);
}
