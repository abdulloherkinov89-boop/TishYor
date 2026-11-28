export const PHONE_PREFIX = '+998 ';

/**
 * Kiritilgan matndan O'zbekiston mahalliy 9 xonali telefon raqamini ajratib oladi.
 * +998 prefiksini o'chirishga urinishda ham kursor/backspace xatolarisiz ishlaydi.
 */
export function extractLocalUzDigits(text) {
  if (typeof text !== 'string') return '';
  const trimmed = text.trim();
  if (!trimmed || /^\+?9{0,2}8?$/.test(trimmed)) {
    return '';
  }

  let raw = '';
  if (text.startsWith('+998')) {
    raw = text.slice(4);
  } else if (text.startsWith('+99 ')) {
    raw = text.slice(4);
  } else {
    const digits = text.replace(/\D/g, '');
    if (digits.startsWith('998') && digits.length > 3) {
      raw = digits.slice(3);
    } else {
      raw = digits;
    }
  }

  return raw.replace(/\D/g, '').slice(0, 9);
}

/**
 * Raqamni `+998 90 123 45 67` ko'rinishida formatlaydi.
 * Bo'sh joylar faqat keyingi guruh boshlanganda qo'shiladi, shuning uchun backspace tiqilib qolmaydi.
 */
export function formatUzPhone(text) {
  const digits = extractLocalUzDigits(text);
  let formatted = '+998';

  if (digits.length === 0) {
    return PHONE_PREFIX;
  }
  if (digits.length > 0) {
    formatted += ` ${digits.slice(0, 2)}`;
  }
  if (digits.length > 2) {
    formatted += ` ${digits.slice(2, 5)}`;
  }
  if (digits.length > 5) {
    formatted += ` ${digits.slice(5, 7)}`;
  }
  if (digits.length > 7) {
    formatted += ` ${digits.slice(7, 9)}`;
  }

  return formatted;
}

export function isValidUzPhone(text) {
  return extractLocalUzDigits(text).length === 9;
}

export function toApiUzPhone(text) {
  const digits = extractLocalUzDigits(text);
  if (digits.length !== 9) return null;
  return `+998${digits}`;
}

export function parseApiError(detail, fallback = "So'rovni bajarishda xatolik yuz berdi") {
  let message = '';

  if (typeof detail === 'string') {
    message = detail;
  } else if (Array.isArray(detail)) {
    message = detail
      .map((item) => (typeof item === 'string' ? item : item?.msg || ''))
      .filter(Boolean)
      .join(' ');
  } else if (detail && typeof detail === 'object') {
    message = Object.values(detail)
      .flat()
      .map((item) => (typeof item === 'string' ? item : item?.msg || ''))
      .filter(Boolean)
      .join(' ');
  }

  if (/all[a-z]*\s+ro['’]?yxatdan|already\s+registered|telefon.*mavjud/i.test(message)) {
    return "Bu telefon raqam bilan allaqachon ro'yxatdan o'tilgan";
  }

  return message || fallback;
}
