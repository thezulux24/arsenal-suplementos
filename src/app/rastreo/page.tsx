import type { Metadata } from 'next';
import { TrackView } from '@/components/OrderViews';

export const metadata: Metadata = { title: 'Rastrear pedido' };

export default function Page() {
  return <TrackView />;
}
