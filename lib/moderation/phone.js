// Basic phone-number detector (Nigeria + international-ish)
// Later you can replace this with AI, but keep the same function signature.

export function containsPhoneNumber(text = "") {
  const s = String(text);

  // very common patterns: +234..., 080..., 070..., 090..., 081..., 091..., and long digit sequences
  const ngLocal = /\b(0[78901]\d{9})\b/g; // 11-digit Nigeria local
  const intl = /\b(\+?\d{1,3}[\s-]?)?(\(?\d{2,4}\)?[\s-]?)?\d{3,4}[\s-]?\d{4}\b/g;
  const longDigits = /\b\d{9,}\b/g;

  return ngLocal.test(s) || longDigits.test(s) || intl.test(s);
}