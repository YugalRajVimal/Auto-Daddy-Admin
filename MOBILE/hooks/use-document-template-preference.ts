import {
  DUMMY_INVOICE_TEMPLATES,
  DUMMY_JOB_CARD_TEMPLATES,
  type DocumentTemplateKind,
} from "@/lib/document-templates";
import { useCallback, useSyncExternalStore } from "react";

type Preference = {
  savedId: string;
  isActive: boolean;
};

type PreferenceState = Record<DocumentTemplateKind, Preference>;

const listeners = new Set<() => void>();

let state: PreferenceState = {
  invoice: {
    savedId: DUMMY_INVOICE_TEMPLATES[0]?.id ?? "",
    isActive: true,
  },
  jobcard: {
    savedId: DUMMY_JOB_CARD_TEMPLATES[0]?.id ?? "",
    isActive: true,
  },
};

function emit() {
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSnapshot() {
  return state;
}

export function useDocumentTemplatePreference(kind: DocumentTemplateKind) {
  const snapshot = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
  const preference = snapshot[kind];

  const setSavedId = useCallback(
    (savedId: string) => {
      state = {
        ...state,
        [kind]: {
          ...state[kind],
          savedId,
        },
      };
      emit();
    },
    [kind]
  );

  const setIsActive = useCallback(
    (isActive: boolean) => {
      state = {
        ...state,
        [kind]: {
          ...state[kind],
          isActive,
        },
      };
      emit();
    },
    [kind]
  );

  return {
    savedId: preference.savedId,
    isActive: preference.isActive,
    setSavedId,
    setIsActive,
  };
}
