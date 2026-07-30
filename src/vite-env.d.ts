/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL: string;
  readonly VITE_UPLOADS_URL?: string;
  readonly VITE_STRIPE_PUBLISHABLE_KEY?: string;
  readonly VITE_IMAGE_URL?: string;
  /** Dev-only: `"true"` | `"false"` to force shop subscription active/inactive. */
  readonly VITE_DEV_SIMULATE_SUBSCRIPTION_ACTIVE?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
