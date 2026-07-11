import {
  getJsonAutoshopowner,
  postJsonAutoshopowner,
  putJsonAutoshopowner,
} from "../api/autoshopownerHttp";
import type { ApiEnvelope } from "./autoshopownerApi";

export type DomainDetailsInput = {
  domainName: string;
  expiryDate: string;
  provider: string;
  status: string;
};

export type EditDomainDetailsInput = {
  index?: number;
  domainName?: string;
  expiryDate?: string;
  provider?: string;
  status?: string;
};

/** GET /api/autoshopowner/domain-details/get */
export function fetchDomainDetails(token: string) {
  return getJsonAutoshopowner<unknown>("/api/autoshopowner/domain-details/get", token);
}

/** POST /api/autoshopowner/domain-details/add */
export function addDomainDetails(token: string, body: DomainDetailsInput) {
  return postJsonAutoshopowner<ApiEnvelope>("/api/autoshopowner/domain-details/add", body, token);
}

/** PUT /api/autoshopowner/domain-details/edit */
export function editDomainDetails(token: string, body: EditDomainDetailsInput) {
  return putJsonAutoshopowner<ApiEnvelope>("/api/autoshopowner/domain-details/edit", body, token);
}

function obj(v: unknown): Record<string, unknown> | null {
  return v && typeof v === "object" ? (v as Record<string, unknown>) : null;
}

function toDomainForm(raw: unknown): DomainDetailsInput | null {
  const o = obj(raw);
  if (!o) return null;
  const domainName =
    typeof o.domainName === "string"
      ? o.domainName.trim()
      : typeof o.domain === "string"
        ? o.domain.trim()
        : "";
  if (!domainName) return null;
  const expiryDate =
    typeof o.expiryDate === "string"
      ? o.expiryDate.slice(0, 10)
      : typeof o.expiry === "string"
        ? o.expiry.slice(0, 10)
        : "";
  const provider = typeof o.provider === "string" ? o.provider.trim() : "";
  const rawStatus =
    typeof o.status === "string"
      ? o.status.trim().toLowerCase()
      : typeof o.domainType === "string"
        ? o.domainType.trim().toLowerCase()
        : "";
  const status = rawStatus === "new" ? "New" : "Existing";
  return { domainName, expiryDate, provider, status };
}

/** Parses GET /api/autoshopowner/domain-details/get response shapes. */
export function parseDomainDetailsResponse(payload: unknown): DomainDetailsInput | null {
  const envelope = obj(payload);
  if (!envelope) return null;

  const nested = envelope.data;
  if (Array.isArray(nested) && nested.length > 0) {
    const parsed = toDomainForm(nested[0]);
    if (parsed) return parsed;
  }

  const nestedObj = obj(nested);
  if (nestedObj) {
    const list =
      (Array.isArray(nestedObj.domainDetails) && nestedObj.domainDetails) ||
      (Array.isArray(nestedObj.domains) && nestedObj.domains) ||
      null;
    if (list && list.length > 0) {
      const parsed = toDomainForm(list[0]);
      if (parsed) return parsed;
    }
    const fromNested =
      toDomainForm(nestedObj.domainDetails) ||
      toDomainForm(nestedObj.domain) ||
      toDomainForm(nestedObj);
    if (fromNested) return fromNested;
  }

  if (Array.isArray(envelope.domainDetails) && envelope.domainDetails.length > 0) {
    const parsed = toDomainForm(envelope.domainDetails[0]);
    if (parsed) return parsed;
  }

  return toDomainForm(envelope.domainDetails) || toDomainForm(envelope);
}

/** Reads the first saved domain from business profile payload shapes. */
export function parseDomainDetailsFromProfile(business: unknown): DomainDetailsInput | null {
  const b = obj(business);
  if (!b) return null;

  const details = b.domainDetails;
  if (Array.isArray(details) && details.length > 0) {
    const parsed = toDomainForm(details[0]);
    if (parsed) return parsed;
  }

  return toDomainForm(b);
}

export function formatDomainApiError(data: ApiEnvelope | null, fallback: string): string {
  const msg = data?.message?.trim();
  return msg || fallback;
}
