import { MetadataRoute } from "next";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = "https://reqst.com";
  const locales = ["en", "ru"];

  const routes = [
    "", 
    "/dev", 
    "/enterprise", 
    "/privacy", 
    "/terms", 
    "/blog"
  ];

  const staticRoutes: MetadataRoute.Sitemap = locales.flatMap((locale) => 
    routes.map((route) => ({
      url: `${baseUrl}/${locale}${route}`,
      lastModified: new Date(),
      changeFrequency: "daily" as const,
      priority: route === "" ? 1.0 : 0.8,
    }))
  );

  let blogRoutes: MetadataRoute.Sitemap = [];
  try {
    // Use the API URL from environment if available, otherwise fallback
    const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://api:8080";
    const res = await fetch(`${apiBase}/api/public/blog`, { next: { revalidate: 3600 } });
    if (res.ok) {
      const data = await res.json();
      if (data.items) {
        blogRoutes = locales.flatMap((locale) => 
          data.items.map((post: any) => ({
            url: `${baseUrl}/${locale}/blog/${post.slug}`,
            lastModified: new Date(post.updated_at),
            changeFrequency: "weekly" as const,
            priority: 0.7,
          }))
        );
      }
    }
  } catch (err) {
    console.error("Failed to fetch blog posts for sitemap", err);
  }

  return [...staticRoutes, ...blogRoutes];
}
