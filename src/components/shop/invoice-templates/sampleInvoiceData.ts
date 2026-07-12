export type InvoiceLineItem = {
  id: string;
  name: string;
  description?: string;
  price: number;
  quantity: number;
};

export type InvoicePreviewShop = {
  name: string;
  slogan?: string;
  address: string;
  phone: string;
  email: string;
  logoUrl?: string | null;
};

export type InvoicePreviewCustomer = {
  name: string;
  title?: string;
  phone: string;
  email: string;
  address?: string;
};

export type InvoicePreviewData = {
  invoiceNo: string;
  invoiceDate: string;
  paymentMethod: string;
  accountId: string;
  accountName: string;
  shop: InvoicePreviewShop;
  customer: InvoicePreviewCustomer;
  items: InvoiceLineItem[];
  taxPercent: number;
  discountPercent: number;
  currency: string;
  terms: string;
  signerName: string;
  signerTitle: string;
  /** When set (e.g. from job card API totals), used instead of recalculating from line items. */
  totalsOverride?: {
    subTotal: number;
    discount?: number;
    tax: number;
    total: number;
  };
};

export const DEFAULT_INVOICE_PREVIEW: InvoicePreviewData = {
  invoiceNo: "INV-10428",
  invoiceDate: "July 12, 2026",
  paymentMethod: "Bank Transfer",
  accountId: "AD-88210",
  accountName: "Auto Daddy Shop",
  shop: {
    name: "Auto Daddy Shop",
    slogan: "Care that drives further",
    address: "214 Garage Lane, Toronto, ON M5V 2T6",
    phone: "+1 (416) 555-0198",
    email: "billing@autodaddy.shop",
  },
  customer: {
    name: "Jordan Blake",
    title: "Vehicle Owner",
    phone: "+1 (647) 555-0142",
    email: "jordan.blake@email.com",
    address: "88 King St W, Toronto, ON",
  },
  items: [
    {
      id: "1",
      name: "Oil Change Service",
      description: "Full synthetic oil change with filter replacement",
      price: 89,
      quantity: 1,
    },
    {
      id: "2",
      name: "Brake Pad Replacement",
      description: "Front axle ceramic brake pads labour + parts",
      price: 220,
      quantity: 1,
    },
    {
      id: "3",
      name: "Wheel Alignment",
      description: "Four-wheel computer alignment",
      price: 95,
      quantity: 1,
    },
    {
      id: "4",
      name: "Cabin Air Filter",
      description: "OEM cabin filter replacement",
      price: 45,
      quantity: 1,
    },
  ],
  taxPercent: 13,
  discountPercent: 2,
  currency: "CAD",
  terms:
    "Payment is due within 15 days of the invoice date. A late charge may apply after the due date. All work is guaranteed for 90 days on labour.",
  signerName: "Alex Rivera",
  signerTitle: "Shop Manager",
};

export function mergeInvoicePreviewShop(
  base: InvoicePreviewData,
  shop?: Partial<InvoicePreviewShop> | null,
): InvoicePreviewData {
  if (!shop) return base;
  return {
    ...base,
    shop: {
      ...base.shop,
      name: shop.name?.trim() || base.shop.name,
      slogan: shop.slogan?.trim() || base.shop.slogan,
      address: shop.address?.trim() || base.shop.address,
      phone: shop.phone?.trim() || base.shop.phone,
      email: shop.email?.trim() || base.shop.email,
      logoUrl: shop.logoUrl ?? base.shop.logoUrl,
    },
    accountName: shop.name?.trim() || base.accountName,
  };
}

export function calcInvoiceTotals(data: InvoicePreviewData) {
  if (data.totalsOverride) {
    return {
      subTotal: data.totalsOverride.subTotal,
      discount: data.totalsOverride.discount ?? 0,
      tax: data.totalsOverride.tax,
      total: data.totalsOverride.total,
    };
  }
  const subTotal = data.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const discount = (subTotal * data.discountPercent) / 100;
  const taxable = Math.max(0, subTotal - discount);
  const tax = (taxable * data.taxPercent) / 100;
  const total = taxable + tax;
  return { subTotal, discount, tax, total };
}

export function formatInvoiceMoney(amount: number, currency = "CAD") {
  try {
    return new Intl.NumberFormat("en-CA", {
      style: "currency",
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `${currency} ${amount.toFixed(2)}`;
  }
}

export function currencyCodeFromCallingCode(callingCode: string | null | undefined): string {
  const code = (callingCode ?? "").trim();
  if (code === "+91") return "INR";
  if (code === "+44") return "GBP";
  if (code === "+61") return "AUD";
  return "CAD";
}
