import { Platform } from 'react-native';
import type { ReactNode } from 'react';

let impl: {
  StripeProvider: (props: { publishableKey: string; children: ReactNode }) => any;
  useStripeNative: () => {
    initPaymentSheet: (options: any) => Promise<{ error?: { code?: string; message?: string } }>;
    presentPaymentSheet: () => Promise<{ error?: { code?: string; message?: string } }>;
  };
};

if (Platform.OS === 'web') {
  impl = require('./stripeNative.web');
} else {
  impl = require('./stripeNative.native');
}

export const StripeProvider = impl.StripeProvider;
export const useStripeNative = impl.useStripeNative;
