export type DocumentTemplateKind = "invoice" | "jobcard";

export type DocumentTemplate = {
  id: string;
  name: string;
  description: string;
};

export const DUMMY_INVOICE_TEMPLATES: DocumentTemplate[] = [
  {
    id: "inv-1",
    name: "Invoice Template - 1",
    description: "Classic layout with HST breakdown and payment status chip.",
  },
  {
    id: "inv-2",
    name: "Invoice Template - 2",
    description: "Compact single-page invoice with service line items.",
  },
  {
    id: "inv-3",
    name: "Invoice Template - 3",
    description: "Detailed invoice with customer address and round-off row.",
  },
];

export const DUMMY_JOB_CARD_TEMPLATES: DocumentTemplate[] = [
  {
    id: "jc-1",
    name: "Job Card Template - 1",
    description: "Standard work order with vehicle details and labour rows.",
  },
  {
    id: "jc-2",
    name: "Job Card Template - 2",
    description: "Compact job card with service checklist layout.",
  },
  {
    id: "jc-3",
    name: "Job Card Template - 3",
    description: "Job card with vehicle photo strip and terms block.",
  },
];

export function templatesForKind(kind: DocumentTemplateKind): DocumentTemplate[] {
  return kind === "invoice" ? DUMMY_INVOICE_TEMPLATES : DUMMY_JOB_CARD_TEMPLATES;
}

export function templateKindLabel(kind: DocumentTemplateKind) {
  return kind === "invoice" ? "Invoice Template" : "Job Card Template";
}

export function templateKindTitle(kind: DocumentTemplateKind) {
  return kind === "invoice" ? "Invoice Templates" : "Job Card Templates";
}
