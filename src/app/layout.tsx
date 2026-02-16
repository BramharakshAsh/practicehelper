import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "../index.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
    title: "CAControl - Workflow Under Control",
    description: "The all-in-one practice management hub for CA practitioners and finance professionals.",
    openGraph: {
        title: "CAControl",
        description: "Streamline your firm's workflow",
        images: ["/logo.svg"],
    },
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
