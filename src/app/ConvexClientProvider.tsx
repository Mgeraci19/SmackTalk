"use client";

import { ReactNode, useState, useEffect } from "react";
import { ConvexProvider, ConvexReactClient } from "convex/react";

const convex = new ConvexReactClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export default function ConvexClientProvider({
    children,
}: {
    children: ReactNode;
}) {
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    // Prevent hydration mismatch by not rendering Convex-dependent content during SSR/static export
    if (!isMounted) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-100">
                <div className="text-center">Loading...</div>
            </div>
        );
    }

    return <ConvexProvider client={convex}>{children}</ConvexProvider>;
}
