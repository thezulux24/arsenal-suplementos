import type { Metadata } from 'next';
import { CheckoutView } from '@/components/CheckoutView';

export const metadata: Metadata = { title: 'Pago', robots: { index: false } };

export default function Page() {
  return <CheckoutView />;
}
