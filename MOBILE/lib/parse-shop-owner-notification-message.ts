import { formatStoredNationalPhone } from "@/lib/dial-countries";

export type ShopOwnerNotificationSummary = {
  /** e.g. "Example Service one requested by 781 708 9765" */
  collapsedText: string;
  serviceText: string;
  phoneText: string | null;
  hasPhone: boolean;
};

const INDIAN_PHONE_RE = /(?:\+91[\s.-]?)?([6-9]\d{9})\b/;
const GENERIC_PHONE_RE = /\b(\d{10})\b/;
const PLATE_RE = /\b([A-Z]{2}\s?[0-9]{1,2}\s?[A-Z]{1,3}\s?[0-9]{4})\b/i;

/** API bodies like "User details:\n- Phone No.: …\n- Service: …" */
const STRUCTURED_PHONE_RE = /(?:^|\n)\s*-\s*Phone\s*No\.?\s*:\s*([+\d\s.-]+)/im;
const STRUCTURED_SERVICE_RE = /(?:^|\n)\s*-\s*Service\s*:\s*(.+?)\s*$/im;

const SERVICE_PATTERNS: RegExp[] = [
  /^(.+?)\s+service\s+requested\b/i,
  /\bservice\s+request(?:ed)?[:\s-]+(.+?)(?:\s+by\b|\s+from\b|[,.]|$)/i,
  /\brequested\s+(.+?)\s+by\b/i,
  /\b(.+?)\s+requested\s+by\b/i,
  /\bhas\s+requested\s+(.+?)(?:\s+by\b|\s+for\b|[,.]|$)/i,
  /\bbooked\s+(.+?)(?:\s+by\b|\s+for\b|[,.]|$)/i,
  /\bscheduled\s+(.+?)(?:\s+for\b|\s+on\b|[,.]|$)/i,
];

function cleanFragment(value: string): string {
  return value.replace(/\s+/g, " ").replace(/^[-:,\s]+|[-:,\s]+$/g, "").trim();
}

function isMostlyDigits(value: string): boolean {
  const digits = value.replace(/\D/g, "");
  return digits.length >= 8 && digits.length / Math.max(value.length, 1) > 0.55;
}

function normalizePhoneDigits(raw: string): string | null {
  const digits = raw.replace(/\D/g, "");
  if (digits.length >= 10) return digits.slice(-10);
  if (digits.length >= 8) return digits;
  return null;
}

function extractStructuredPhone(message: string): string | null {
  const match = message.match(STRUCTURED_PHONE_RE);
  if (!match?.[1]) return null;
  return normalizePhoneDigits(match[1]);
}

function extractStructuredService(message: string): string | null {
  const match = message.match(STRUCTURED_SERVICE_RE);
  if (!match?.[1]) return null;
  const service = cleanFragment(match[1]);
  return service || null;
}

function isStructuredServiceRequest(message: string): boolean {
  return /wants this service|Phone\s*No\.|-\s*Service\s*:/i.test(message);
}

function extractPhone(message: string): string | null {
  const structured = extractStructuredPhone(message);
  if (structured) return structured;

  const indian = message.match(INDIAN_PHONE_RE);
  if (indian?.[1]) return indian[1];

  const generic = message.match(GENERIC_PHONE_RE);
  return generic?.[1] ?? null;
}

function extractPlate(message: string): string | null {
  const match = message.match(PLATE_RE);
  return match?.[1] ? cleanFragment(match[1].toUpperCase()) : null;
}

function extractService(message: string): string | null {
  const structured = extractStructuredService(message);
  if (structured) return structured;

  for (const pattern of SERVICE_PATTERNS) {
    const match = message.match(pattern);
    const fragment = match?.[1] ? cleanFragment(match[1]) : "";
    if (!fragment || isMostlyDigits(fragment)) continue;
    if (fragment.length > 80) continue;
    return fragment;
  }
  return null;
}

function formatPhoneLabel(phone: string): string {
  return formatStoredNationalPhone(phone) || phone;
}

function serviceRequestedLabel(service: string, originalMessage: string): string {
  const normalized = cleanFragment(service);
  if (!normalized) return "Service requested";
  if (/\brequested\b/i.test(normalized)) return normalized;
  if (/\brequested\b/i.test(originalMessage) || /wants this service/i.test(originalMessage)) {
    if (/\bservice\s+requested\b/i.test(originalMessage) && !/\bservice\b/i.test(normalized)) {
      return `${normalized} service requested`;
    }
    return `${normalized} requested`;
  }
  if (/\bservice\b/i.test(normalized)) return `${normalized} requested`;
  return `${normalized} requested`;
}

function fallbackLabel(message: string): string {
  const first = cleanFragment(message.split(/\n|\.(?=\s)|,(?=\s)/)[0] ?? message);
  if (!first) return "Shop update";
  if (first.length <= 72) return first;
  return `${first.slice(0, 69)}…`;
}

function buildSummary(serviceLabel: string, phone: string | null): ShopOwnerNotificationSummary {
  const serviceText = serviceLabel.trim() || "Service requested";
  const phoneText = phone ? formatPhoneLabel(phone) : null;
  return {
    serviceText,
    phoneText,
    collapsedText: phoneText ? `${serviceText} by ${phoneText}` : serviceText,
    hasPhone: phone != null,
  };
}

/** Compact one-line summary: "{service requested} by {phone}". */
export function parseShopOwnerNotificationMessage(message: string): ShopOwnerNotificationSummary {
  const trimmed = message.trim();
  if (!trimmed) {
    return {
      collapsedText: "Notification",
      serviceText: "Notification",
      phoneText: null,
      hasPhone: false,
    };
  }

  const phone = extractPhone(trimmed);
  const hasPhone = phone != null;
  const lower = trimmed.toLowerCase();

  if (isStructuredServiceRequest(trimmed)) {
    const service = extractStructuredService(trimmed);
    const label = service ? serviceRequestedLabel(service, trimmed) : "Service requested";
    return buildSummary(label, phone);
  }

  const plate = extractPlate(trimmed);

  if (/job\s*card|work\s*order/.test(lower)) {
    const label = plate ? `Job card · ${plate}` : "New job card";
    return buildSummary(label, phone);
  }

  const service = extractService(trimmed);
  if (service) {
    return buildSummary(serviceRequestedLabel(service, trimmed), phone);
  }

  if (/payment|wallet|invoice|bill|subscription/.test(lower)) {
    return buildSummary("Billing update", phone);
  }

  if (/customer|vehicle|car\s*owner|registered/.test(lower)) {
    return buildSummary("Customer update", phone);
  }

  return buildSummary(fallbackLabel(trimmed), phone);
}
