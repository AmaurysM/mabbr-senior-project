import { Suspense } from 'react';
import RedeemPageContent from './RedeemPageContent/RedeemPageContent';

export const dynamic = 'force-dynamic';

export default function Page() {
  return (
    <Suspense fallback={<div>Loading page...</div>}>
      <RedeemPageContent />
    </Suspense>
  );
}
