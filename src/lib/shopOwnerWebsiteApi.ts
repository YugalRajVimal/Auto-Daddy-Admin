import {
  getJsonAutoshopowner,
  postJsonAutoshopowner,
} from "../api/autoshopownerHttp";
import type { ApiEnvelope } from "./autoshopownerApi";

export type WebsiteTemplate = {
  id: string;
  name: string;
  desc?: string;
  templateLink?: string;
};

function obj(v: unknown): Record<string, unknown> | null {
  return v && typeof v === "object" ? (v as Record<string, unknown>) : null;
}

function toTemplate(raw: unknown): WebsiteTemplate | null {
  const o = obj(raw);
  if (!o) return null;
  const id =
    typeof o._id === "string" ? o._id : typeof o.id === "string" ? o.id : "";
  const name =
    typeof o.name === "string"
      ? o.name
      : typeof o.templateName === "string"
        ? o.templateName
        : "Template";
  const templateLink =
    typeof o.templateLink === "string"
      ? o.templateLink
      : typeof o.previewUrl === "string"
        ? o.previewUrl
        : undefined;
  const desc =
    typeof o.desc === "string"
      ? o.desc
      : typeof o.description === "string"
        ? o.description
        : undefined;
  if (!id && !name) return null;
  return { id: id || name, name, desc, templateLink };
}

const TEMPLATE_LIST_KEYS = ["templates", "websiteTemplates", "data", "items", "rows"] as const;

function extractTemplateList(source: Record<string, unknown>): unknown[] {
  for (const key of TEMPLATE_LIST_KEYS) {
    const value = source[key];
    if (Array.isArray(value)) return value;
  }
  return [];
}

export function parseWebsiteTemplatesResponse(payload: unknown): {
  hasPurchasedTemplate: boolean | null;
  templates: WebsiteTemplate[];
} {
  const envelope = obj(payload);
  if (!envelope) return { hasPurchasedTemplate: null, templates: [] };

  const hasPurchasedTemplate =
    typeof envelope.hasPurchasedTemplate === "boolean" ? envelope.hasPurchasedTemplate : null;

  let rawList: unknown[] = [];
  const nested = envelope.data;
  if (Array.isArray(nested)) {
    rawList = nested;
  } else if (nested && typeof nested === "object") {
    rawList = extractTemplateList(nested as Record<string, unknown>);
  }
  if (rawList.length === 0) {
    rawList = extractTemplateList(envelope);
  }

  const selected = toTemplate(envelope.selectedTemplate ?? envelope.template);
  const parsedList = rawList.map(toTemplate).filter(Boolean) as WebsiteTemplate[];
  const templates = selected
    ? [selected, ...parsedList.filter((t) => t.id !== selected.id)]
    : parsedList;

  return { hasPurchasedTemplate, templates };
}

/** GET /api/autoshopowner/website-template */
export function fetchWebsiteTemplates(token: string) {
  return getJsonAutoshopowner<unknown>("/api/autoshopowner/website-template", token);
}

/** POST /api/autoshopowner/website-template/select */
export function selectWebsiteTemplate(token: string, templateId: string) {
  return postJsonAutoshopowner<ApiEnvelope>(
    "/api/autoshopowner/website-template/select",
    { templateId },
    token,
  );
}
