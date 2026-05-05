export type UnsplashPhoto = {
  id: string;
  urls: { small: string; regular: string };
  alt_description: string | null;
  user: { name: string; links: { html: string } };
  links: { download_location: string };
};

export async function searchUnsplash(
  query: string,
  userId?: string
): Promise<UnsplashPhoto[]> {
  if (userId) {
    const { recordApiUsage } = await import('@/lib/admin/apiUsage');
    void recordApiUsage('unsplash', userId);
  }
  const key = process.env.UNSPLASH_ACCESS_KEY;
  if (!key) return [];

  try {
    const res = await fetch(
      `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=8&orientation=landscape`,
      {
        headers: { Authorization: `Client-ID ${key}` },
        next: { revalidate: 3600 },
      }
    );
    if (!res.ok) return [];
    const data = await res.json();
    return data.results ?? [];
  } catch {
    return [];
  }
}
