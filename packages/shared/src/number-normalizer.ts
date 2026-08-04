export interface NormalizedNumberResult {
  originalNumber: string;
  countryCode: string;
  normalizedNumber: string; // e.g., "919876543210"
  recipientId: string;      // e.g., "919876543210@c.us"
  isValid: boolean;
  errorMessage?: string;
}

/**
 * Normalizes a mobile number, applying India (+91) default country code,
 * stripping whitespace/formatting, and formatting as a WhatsApp recipient ID (@c.us).
 */
export function normalizeMobileNumber(rawNumber: string, defaultCountryCode: string = "+91"): NormalizedNumberResult {
  const originalNumber = (rawNumber || "").trim();
  if (!originalNumber) {
    return {
      originalNumber,
      countryCode: defaultCountryCode,
      normalizedNumber: "",
      recipientId: "",
      isValid: false,
      errorMessage: "Mobile number is empty",
    };
  }

  // Remove spaces, hyphens, brackets, parentheses, dots, and non-numeric characters except leading +
  let cleaned = originalNumber.replace(/[^\d+]/g, "");

  // If number starts with 00, replace with +
  if (cleaned.startsWith("00")) {
    cleaned = "+" + cleaned.slice(2);
  }

  let digitsOnly = "";
  let countryCode = defaultCountryCode;

  if (cleaned.startsWith("+")) {
    digitsOnly = cleaned.slice(1);
    // Determine country code prefix if possible, default to existing or India
    if (digitsOnly.startsWith("91")) {
      countryCode = "+91";
    } else if (digitsOnly.length > 10) {
      // Guess country code (first 1-3 digits)
      const diff = digitsOnly.length - 10;
      countryCode = "+" + digitsOnly.slice(0, Math.min(diff, 4));
    }
  } else {
    // No leading plus
    digitsOnly = cleaned.replace(/\D/g, "");
    if (digitsOnly.length === 10) {
      // Standard 10 digit Indian mobile number
      countryCode = "+91";
      digitsOnly = "91" + digitsOnly;
    } else if (digitsOnly.length === 11 && digitsOnly.startsWith("0")) {
      // Leading zero for Indian number
      countryCode = "+91";
      digitsOnly = "91" + digitsOnly.slice(1);
    } else if (digitsOnly.length === 12 && digitsOnly.startsWith("91")) {
      countryCode = "+91";
    } else if (digitsOnly.length < 10 || digitsOnly.length > 15) {
      return {
        originalNumber,
        countryCode,
        normalizedNumber: digitsOnly,
        recipientId: `${digitsOnly}@c.us`,
        isValid: false,
        errorMessage: `Invalid mobile number digit length (${digitsOnly.length} digits)`,
      };
    }
  }

  // Final validation on digitsOnly length (E.164 supports up to 15 digits)
  if (digitsOnly.length < 10 || digitsOnly.length > 15 || !/^\d+$/.test(digitsOnly)) {
    return {
      originalNumber,
      countryCode,
      normalizedNumber: digitsOnly,
      recipientId: `${digitsOnly}@c.us`,
      isValid: false,
      errorMessage: `Invalid mobile number format (${digitsOnly})`,
    };
  }

  return {
    originalNumber,
    countryCode,
    normalizedNumber: digitsOnly,
    recipientId: `${digitsOnly}@c.us`,
    isValid: true,
  };
}
