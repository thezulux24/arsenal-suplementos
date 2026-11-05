import type { Metadata } from 'next';
import { OrderConfirmation } from '@/components/OrderViews';

export const metadata: Metadata = { title: 'Pedido', robots: { index: false } };

export default function Page() {
  return <OrderConfirmation />;
}
