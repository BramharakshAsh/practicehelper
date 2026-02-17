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
    const isAppPath = typeof window !== 'undefined' && (
        window.location.pathname.startsWith('/app') ||
        window.location.hostname.startsWith('app.') ||
        window.location.hostname.includes('firmflow')
    );

    let finalHref = linkHref;
    const isExternal = linkHref.startsWith('http');

    // If we are on the landing page (cacontrol.online) and pointing to the app,
    // use the absolute subdomain URL to avoid redirects.
    if (!isAppPath && !isExternal && linkHref.startsWith('/app/')) {
        if (typeof window !== 'undefined' && window.location.hostname === 'cacontrol.online') {
            finalHref = `https://app.cacontrol.online${linkHref.replace('/app', '')}`;
        }
    }

    if (isAppPath) {
        // If we are already on the subdomain, and the link starts with /app, strip it
        if (typeof window !== 'undefined' && (window.location.hostname.startsWith('app.') || window.location.hostname.includes('firmflow'))) {
            if (finalHref.startsWith('/app/')) {
                finalHref = finalHref.replace('/app', '');
            }
        }

        return (
            <RouterLink to={finalHref} className={className} onClick={onClick}>
                {children}
            </RouterLink>
        );
    }

    return (
        <Link href={finalHref} className={className} onClick={onClick}>
            {children}
        </Link>
    );
}
