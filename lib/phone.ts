export function normaliseAuMobile(phone: string): string | null {
  let digits = phone.replace(/\D/g, "");

  if (digits.startsWith("0")) {
    digits = "61" + digits.slice(1);
  }

  if (!/^614\d{8}$/.test(digits)) {
    return null;
  }
  
  return `+${digits}`;
}
