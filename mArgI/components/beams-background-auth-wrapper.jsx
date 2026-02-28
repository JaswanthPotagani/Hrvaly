"use client";

import dynamic from 'next/dynamic';

const BeamsBackground = dynamic(
    () => import('@/components/ui/beams-background').then(mod => ({ default: mod.BeamsBackground })),
    { 
        ssr: false,
        loading: () => (
            <div className="fixed inset-0 z-50 min-h-screen w-full bg-neutral-950" />
        )
    }
);

export default BeamsBackground;
