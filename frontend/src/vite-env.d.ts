/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL?: string;
  readonly VITE_GA_MEASUREMENT_ID?: string;
  readonly VITE_GSC_VERIFICATION_CODE?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

declare global {
  interface Window {
    dataLayer?: any[];
    gtag?: (...args: any[]) => void;
    __GA_MEASUREMENT_ID__?: string;
  }
}
