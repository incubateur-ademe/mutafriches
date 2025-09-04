declare global {
  interface Window {
    dsfr?: {
      start?: () => void;
      stop?: () => void;
      verbose?: boolean;
      mode?: string;
      production?: boolean;
    };
  }
}

export {};
