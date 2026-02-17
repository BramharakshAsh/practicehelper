import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "../index.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
    metadataBase: new URL("https://app.cacontrol.online"),
    title: {
        default: "CAControl - Workflow Under Control",
        template: "%s | CAControl",
    },
    description: "The all-in-one practice management hub for CA practitioners and finance professionals. Centralize clients, staff, tasks, and compliance.",
    alternates: {
        canonical: "/",
    },
    openGraph: {
        title: "CAControl",
        description: "Streamline your firm's workflow",
        url: "https://app.cacontrol.online",
        siteName: "CAControl",
        images: [
            {
                url: "/logo.svg",
                width: 800,
                height: 600,
            },
        ],
        locale: "en_US",
        type: "website",
    },
    robots: {
        index: true,
        follow: true,
    }
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en">
            <body className={inter.className}>{children}</body>
        </html>
    );
}
