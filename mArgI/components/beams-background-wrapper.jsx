"use client";

import dynamic from 'next/dynamic';

const BeamsBackground = dynamic(
    () => import('@/components/ui/beams-background').then(mod => ({ default: mod.BeamsBackground })),
    { 
        ssr: false,
        loading: () => (
            <div className="min-h-screen w-full bg-neutral-950">
                {/* Minimal loading state - content renders immediately */}
            </div>
        )
    }
);

export default BeamsBackground;
