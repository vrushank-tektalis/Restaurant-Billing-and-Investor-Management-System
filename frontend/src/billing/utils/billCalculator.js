/**
 * Pure calculation functions for restaurant billing
 */

export function calcLineTotal(qty, price) {
  const q = Number(qty) || 0;
  const p = Number(price) || 0;
  return Number((q * p).toFixed(2));
}

export function calcSubtotal(items = []) {
  const sum = items.reduce((acc, item) => {
    const qty = Number(item.quantity) || 0;
    const price = Number(item.price) || 0;
    return acc + calcLineTotal(qty, price);
  }, 0);
  return Number(sum.toFixed(2));
}

export function calcTaxAmount(subtotal, taxPercent) {
  const sub = Number(subtotal) || 0;
  const tax = Number(taxPercent) || 0;
  return Number(((sub * tax) / 100).toFixed(2));
}

export function calcTotal(subtotal, discount, taxAmount) {
  const sub = Number(subtotal) || 0;
  const disc = Number(discount) || 0;
  const tax = Number(taxAmount) || 0;
  const total = sub - disc + tax;
  return Number(Math.max(0, total).toFixed(2));
}
