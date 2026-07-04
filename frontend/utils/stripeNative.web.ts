import type { ReactNode } from 'react';

// Web build: Stripe's React Native SDK is native-only and must never be bundled
// for web (it references native-only APIs at import time). Metro automatically
// picks this file over stripeNative.native.ts when bundling for web.
export function StripeProvider({ children }: { children: ReactNode }) {
  return children;
}

export function useStripeNative() {
  return {
    initPaymentSheet: async () => ({ error: { message: 'Not supported on web' } }),
    presentPaymentSheet: async () => ({ error: { message: 'Not supported on web' } }),
  };
}
