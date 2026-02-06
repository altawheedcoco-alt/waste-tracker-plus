/**
 * تحويل الأرقام إلى كلمات عربية
 * مثال: 60000 → "ستون ألف جنيه مصري"
 */

const ones = ['', 'واحد', 'اثنان', 'ثلاثة', 'أربعة', 'خمسة', 'ستة', 'سبعة', 'ثمانية', 'تسعة'];
const tens = ['', 'عشرة', 'عشرون', 'ثلاثون', 'أربعون', 'خمسون', 'ستون', 'سبعون', 'ثمانون', 'تسعون'];
const teens = ['عشرة', 'أحد عشر', 'اثنا عشر', 'ثلاثة عشر', 'أربعة عشر', 'خمسة عشر', 'ستة عشر', 'سبعة عشر', 'ثمانية عشر', 'تسعة عشر'];
const hundreds = ['', 'مائة', 'مائتان', 'ثلاثمائة', 'أربعمائة', 'خمسمائة', 'ستمائة', 'سبعمائة', 'ثمانمائة', 'تسعمائة'];

// أسماء الأعداد الكبيرة
const scales = [
  { value: 1000000000000, singular: 'تريليون', dual: 'تريليونان', plural: 'تريليونات' },
  { value: 1000000000, singular: 'مليار', dual: 'ملياران', plural: 'مليارات' },
  { value: 1000000, singular: 'مليون', dual: 'مليونان', plural: 'ملايين' },
  { value: 1000, singular: 'ألف', dual: 'ألفان', plural: 'آلاف' },
];

function getScaleWord(count: number, scale: { singular: string; dual: string; plural: string }): string {
  if (count === 1) return scale.singular;
  if (count === 2) return scale.dual;
  if (count >= 3 && count <= 10) return scale.plural;
  return scale.singular; // للأعداد أكبر من 10
}

function convertHundreds(num: number): string {
  if (num === 0) return '';
  
  const parts: string[] = [];
  
  // المئات
  const h = Math.floor(num / 100);
  if (h > 0) {
    parts.push(hundreds[h]);
  }
  
  const remainder = num % 100;
  
  if (remainder === 0) {
    return parts.join(' و ');
  }
  
  // الأرقام من 1-9
  if (remainder < 10) {
    parts.push(ones[remainder]);
  }
  // الأرقام من 10-19
  else if (remainder < 20) {
    parts.push(teens[remainder - 10]);
  }
  // الأرقام من 20-99
  else {
    const t = Math.floor(remainder / 10);
    const o = remainder % 10;
    
    if (o > 0) {
      parts.push(ones[o] + ' و ' + tens[t]);
    } else {
      parts.push(tens[t]);
    }
  }
  
  return parts.join(' و ');
}

export function numberToArabicWords(num: number, includeCurrency: boolean = true): string {
  if (num === 0) return includeCurrency ? 'صفر جنيه مصري' : 'صفر';
  if (num < 0) return 'سالب ' + numberToArabicWords(Math.abs(num), includeCurrency);
  
  // التعامل مع الكسور العشرية (القروش)
  const intPart = Math.floor(num);
  const decimalPart = Math.round((num - intPart) * 100);
  
  const parts: string[] = [];
  let remaining = intPart;
  
  // معالجة الأعداد الكبيرة
  for (const scale of scales) {
    const count = Math.floor(remaining / scale.value);
    if (count > 0) {
      remaining = remaining % scale.value;
      
      if (count === 1) {
        parts.push(scale.singular);
      } else if (count === 2) {
        parts.push(scale.dual);
      } else if (count <= 10) {
        parts.push(convertHundreds(count) + ' ' + scale.plural);
      } else {
        parts.push(convertHundreds(count) + ' ' + scale.singular);
      }
    }
  }
  
  // المئات والعشرات والآحاد المتبقية
  if (remaining > 0) {
    parts.push(convertHundreds(remaining));
  }
  
  let result = parts.join(' و ');
  
  // إضافة العملة
  if (includeCurrency) {
    result += ' جنيه مصري';
    
    // إضافة القروش إن وجدت
    if (decimalPart > 0) {
      result += ' و ' + convertHundreds(decimalPart) + ' قرش';
    }
  }
  
  return result;
}

/**
 * تنسيق الأرقام مع الفواصل المصرية
 * مثال: 60000 → "60,000"
 */
export function formatEgyptianNumber(num: number): string {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(num);
}

/**
 * تحويل وعرض المبلغ بالأرقام والكلمات
 */
export function formatAmountWithWords(amount: number): {
  formatted: string;
  words: string;
  display: string;
} {
  const formatted = formatEgyptianNumber(amount);
  const words = numberToArabicWords(amount);
  
  return {
    formatted,
    words,
    display: `${formatted} (${words})`,
  };
}
