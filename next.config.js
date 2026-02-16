/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    // Set output directory to 'dist' to match Vercel project settings
    distDir: 'dist',
    // Ensure we can use CSS modules and Tailwind
    transpilePackages: ['lucide-react'],
    // Rewrites to handle the App Surface (SPA) catch-all
    async redirects() {
        return [
            {
                source: '/login',
                destination: '/app/login',
                permanent: true,
            },
            {
                source: '/forgot-password',
                destination: '/app/forgot-password',
                permanent: true,
            },
            {
                source: '/reset-password',
                destination: '/app/reset-password',
                permanent: true,
            },
        ];
    },
    // Rewrites to handle the App Surface (SPA) catch-all
    async rewrites() {
        return [];
    },
};

export default nextConfig;
