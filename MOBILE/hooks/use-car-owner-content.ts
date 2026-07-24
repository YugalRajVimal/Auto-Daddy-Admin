import { useAuth } from "@/context/auth-provider";
import {
  fetchCarOwnerFaqs,
  fetchCarOwnerPrivacy,
  fetchCarOwnerProductFeatures,
  parseCarOwnerFaqItems,
  parseCarOwnerPrivacy,
  parseCarOwnerProductFeatures,
  type CarOwnerFaqItem,
} from "@/lib/car-owner-home-api";
import type { CarOwnerContentBlock } from "@/types/car-owner-dashboard";
import { useCallback, useEffect, useState } from "react";

export function useCarOwnerFaqs(role = "carowner") {
  const { token } = useAuth();
  const [items, setItems] = useState<CarOwnerFaqItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!token) {
      setItems([]);
      setLoading(false);
      setError(null);
      return;
    }
    setLoading(true);
    setError(null);
    const res = await fetchCarOwnerFaqs(token, role);
    if (!res.ok) {
      setItems([]);
      setError("Could not load FAQs.");
      setLoading(false);
      return;
    }
    setItems(parseCarOwnerFaqItems(res.data));
    setLoading(false);
  }, [role, token]);

  useEffect(() => {
    void load();
  }, [load]);

  return { items, loading, error, refresh: load };
}

export function useCarOwnerPrivacyDoc(type: "privacy" | "disclaimer" = "privacy") {
  const { token } = useAuth();
  const [heading, setHeading] = useState(
    type === "disclaimer" ? "Disclaimer" : "Privacy Policy"
  );
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!token) {
      setDescription("");
      setLoading(false);
      setError(null);
      return;
    }
    setLoading(true);
    setError(null);
    const res = await fetchCarOwnerPrivacy(token, { type });
    if (!res.ok) {
      setDescription("");
      setError(type === "disclaimer" ? "Could not load disclaimer." : "Could not load privacy policy.");
      setLoading(false);
      return;
    }
    const parsed = parseCarOwnerPrivacy(res.data);
    setHeading(parsed.heading || (type === "disclaimer" ? "Disclaimer" : "Privacy Policy"));
    setDescription(parsed.description);
    setLoading(false);
  }, [token, type]);

  useEffect(() => {
    void load();
  }, [load]);

  return { heading, description, loading, error, refresh: load };
}

export function useCarOwnerProductFeatures() {
  const { token } = useAuth();
  const [items, setItems] = useState<CarOwnerContentBlock[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!token) {
      setItems([]);
      setLoading(false);
      setError(null);
      return;
    }
    setLoading(true);
    setError(null);
    const res = await fetchCarOwnerProductFeatures(token);
    if (!res.ok) {
      setItems([]);
      setError("Could not load features.");
      setLoading(false);
      return;
    }
    setItems(parseCarOwnerProductFeatures(res.data));
    setLoading(false);
  }, [token]);

  useEffect(() => {
    void load();
  }, [load]);

  return { items, loading, error, refresh: load };
}
