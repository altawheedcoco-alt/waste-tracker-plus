const LOVABLE_PREVIEW_HOST = /--[a-z0-9-]+\.lovable\.app$/i;

export const isPreviewRuntime = () => {
  if (typeof window === 'undefined') return false;

  const { hostname } = window.location;

  return (
    hostname === 'localhost' ||
    hostname === '127.0.0.1' ||
    hostname.endsWith('.lovable.dev') ||
    LOVABLE_PREVIEW_HOST.test(hostname)
  );
};

export const shouldEnablePWA = () => !isPreviewRuntime();