"use client";

import Link from "next/link";
import { Link as RouterLink } from "react-router-dom";
import { useEffect, useState } from "react";

export interface UniversalLinkProps {
    to?: string;
    href?: string;
    children: React.ReactNode;
    className?: string;
    onClick?: () => void;
}

export function UniversalLink({ to, href, children, className, onClick }: UniversalLinkProps) {
    const [isClient, setIsClient] = useState(false);

    useEffect(() => {
        setIsClient(true);
    }, []);

    const linkHref = href || to || "#";

    // During SSR or before hydration, use a standard anchor tag
    // to avoid react-router-dom context issues.
    if (!isClient) {
        return (
            <a href={linkHref} className={className} onClick={onClick}>
                {children}
            </a>
        );
    }

    // On the client, we can determine if we are in the Next.js app or the legacy SPA
    // For now, if we are in the Next.js pages (handled by App Router), next/link is preferred.
    // If we are inside the mounted SPA, RouterLink is preferred.
    const isAppPath = typeof window !== 'undefined' && window.location.pathname.startsWith('/app');

    if (isAppPath) {
        return (
            <RouterLink to={linkHref} className={className} onClick={onClick}>
                {children}
            </RouterLink>
        );
    }

    return (
        <Link href={linkHref} className={className} onClick={onClick}>
            {children}
        </Link>
    );
}
