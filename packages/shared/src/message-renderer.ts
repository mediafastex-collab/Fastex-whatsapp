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

/**
 * Returns the Dhanera Business Group - Monsoon Edit 2026 WhatsApp template.
 */
export function getMonsoonEditMessage(customerName?: string, flyerUrl?: string): string {
  const nameGreeting = customerName ? `Hi *${customerName}*,\n\n` : "";
  const flyerSection = flyerUrl ? `\n\n📄 *Our Exhibition Flyer & Details:*\n${flyerUrl}` : "";

  return `${nameGreeting}*🙏 Thank You for Visiting Fastex Media!*

Thank you for visiting *Fastex Media* at *Stall No. 68* during the *Dhanera Business Group – Monsoon Edit 2026*. It was a pleasure connecting with you and learning more about your business. 🤝

I'm *Aagam Shah*, Founder of *Fastex Media*. We help businesses generate quality leads, build a stronger online presence, and achieve measurable growth through result-driven digital marketing. 🚀

*Our Services:*
• 📱 Facebook & Instagram Ads
• 📲 Social Media Management
• 🎥 Video Ad Creation & UGC Videos
• 💬 WhatsApp Marketing
• 💼 LinkedIn Lead Generation
• 📧 Email Marketing

*Interested in growing your business?*

Simply *reply to this message* if you're looking for any of the above services, and I'd be happy to discuss how we can help your business grow.

Looking forward to working with you! 😊

*Aagam Shah*
Founder | *Fastex Media*
📞 *93286 80929 | 99131 66462*${flyerSection}`;
}

