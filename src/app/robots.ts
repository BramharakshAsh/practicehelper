import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
    return {
        rules: {
            userAgent: '*',
            allow: [
                '/',
                '/pricing',
                '/guides',
                '/templates',
                '/tools',
                '/calendar',
                '/compare',
                '/blog',
            ],
            disallow: [
                '/app',
                '/dashboard',
                '/clients',
                '/tasks',
                '/settings',
                '/reports',
                '/api',
                '/auth',
            ],
        },
        sitemap: 'https://app.cacontrol.online/sitemap.xml',
    }
}
