import type { MetadataRoute } from 'next';

const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3108';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/', '/privacy', '/terms'],
        disallow: [
          '/dashboard',
          '/words',
          '/categories',
          '/review',
          '/grammar',
          '/idioms',
          '/text-scanner',
          '/stats',
          '/settings',
          '/api/',
          '/monitoring',
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
