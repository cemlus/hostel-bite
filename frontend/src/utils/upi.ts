/**
 * UPI Deep Link Generator
 * Creates UPI payment deep links for mobile payments
 */

interface UpiPaymentParams {
  vpa: string;           // Virtual Payment Address (e.g., merchant@upi)
  name: string;          // Payee name
  amount: number;        // Amount in INR
  transactionNote?: string;
  transactionRef?: string;
  currency?: string;
}

/**
 * Creates a UPI deep link URL
 * Format: upi://pay?pa=<vpa>&pn=<name>&am=<amount>&tn=<note>&tr=<ref>&cu=<currency>
 */
export function createUpiDeepLink({
  vpa,
  name,
  amount,
  transactionNote = 'HostelBite Order',
  transactionRef,
  currency = 'INR',
}: UpiPaymentParams): string {
  const params = new URLSearchParams({
    pa: vpa,
    pn: name,
    am: amount.toFixed(2),
    cu: currency,
  });

  if (transactionNote) {
    params.set('tn', transactionNote);
  }

  if (transactionRef) {
    params.set('tr', transactionRef);
  }

  return `upi://pay?${params.toString()}`;
}

/**
 * Opens UPI payment link
 * On mobile, this will open the UPI app
 * On desktop, it will open in a new tab (may not work)
 */
export function openUpiPayment(params: UpiPaymentParams): void {
  const link = createUpiDeepLink(params);
  window.open(link, '_blank');
}

/**
 * Check if the device likely supports UPI deep links (mobile)
 */
export function isUpiSupported(): boolean {
  const userAgent = navigator.userAgent.toLowerCase();
  return /android|iphone|ipad|ipod/.test(userAgent);
}

/**
 * Format amount in Indian Rupees
 */
export function formatINR(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}
