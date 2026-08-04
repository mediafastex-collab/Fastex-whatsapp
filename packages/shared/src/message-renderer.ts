export interface MessagePlaceholders {
  customer_name?: string;
  customer_mobile?: string;
  business_name?: string;
  customer_business_name?: string;
  business_category?: string;
  salesperson_name?: string;
  note?: string;
  date?: string;
  follow_up_date?: string;
  [key: string]: string | undefined;
}

/**
 * Replaces placeholders in the template string with provided values.
 * e.g. "Hello {{customer_name}}, thank you for visiting {{business_name}}."
 */
export function renderWhatsAppMessage(template: string, placeholders: MessagePlaceholders): string {
  if (!template) return "";

  return template.replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (match, key) => {
    const value = placeholders[key];
    if (value !== undefined && value !== null) {
      return String(value);
    }
    return "";
  });
}

/**
 * Generates sample placeholders for live preview in the Admin Settings dashboard.
 */
export function getSamplePlaceholders(): MessagePlaceholders {
  const today = new Date().toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  const nextWeek = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  return {
    customer_name: "Aarav Sharma",
    customer_mobile: "+91 98765 43210",
    business_name: "Fastex Collaborations",
    customer_business_name: "Sharma Enterprises",
    business_category: "Event Production",
    salesperson_name: "Rohan Verma",
    note: "Interested in premium WhatsApp integration suite",
    date: today,
    follow_up_date: nextWeek,
  };
}
