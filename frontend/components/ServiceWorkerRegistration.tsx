'use client';

import { useEffect } from 'react';
import { registerServiceWorker } from '@/lib/serviceWorker';

export default function ServiceWorkerRegistration() {
  useEffect(() => {
    console.log('[SW] ServiceWorkerRegistration component mounted');
    registerServiceWorker();
  }, []);

  return null;
}
