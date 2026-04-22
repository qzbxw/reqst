import Link from "next/link";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Blog | Reqst",
  description: "Insights, technical deep-dives, and updates on crypto payments infrastructure.",
  openGraph: {
    title: "Blog | Reqst",
    description: "Insights, technical deep-dives, and updates on crypto payments infrastructure.",
  },
};

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8080";

async function getPosts() {
  try {
    const res = await fetch(`${API_BASE}/api/public/blog`, { 
      next: { revalidate: 60 } // Revalidate every minute
    });
    if (!res.ok) {
      return [];
    }
    const data = await res.json();
    return data.items || [];
  } catch (error) {
    console.error("Failed to fetch blog posts", error);
    return [];
  }
}

export default async function BlogIndex() {
  const posts = await getPosts();

  return (
    <main className="lend-page" style={{ minHeight: "100vh" }}>
      <div className="lend-backdrop lend-backdrop--grid" />
      <div className="lend-backdrop lend-backdrop--glow lend-backdrop--left" />
      <div className="lend-backdrop lend-backdrop--glow lend-backdrop--right" />

      <div className="lend-shell">
        <header className="lend-topbar">
          <div className="lend-topbar-main">
            <Link className="lend-brand" href="/">
              <strong>reqst</strong>
            </Link>
            <div className="lend-topbar-actions">
              <Link className="lend-nav-link" href="/">/home</Link>
            </div>
          </div>
        </header>

        <section className="lend-hero lend-hero--centered">
          <div className="lend-hero-copy" style={{ maxWidth: "800px" }}>
            <span className="lend-section-kicker">BLOG</span>
            <h1>Engineering & Updates</h1>
            <p>Protocol insights, technical deep-dives, and platform updates from the core team.</p>
          </div>
        </section>

        <section className="lend-split-section">
          {posts.length === 0 ? (
            <div style={{ textAlign: "center", color: "var(--muted)", padding: "4rem" }}>
              <p>No posts available yet.</p>
            </div>
          ) : (
            <div style={{ display: "grid", gap: "2rem", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))" }}>
              {posts.map((post: any) => (
                <Link key={post.slug} href={`/blog/${post.slug}`} className="lend-card" style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                  {post.cover_image_url && (
                    <div style={{ 
                      width: "100%", 
                      height: "180px", 
                      borderRadius: "12px", 
                      backgroundImage: `url(${post.cover_image_url})`, 
                      backgroundSize: "cover", 
                      backgroundPosition: "center" 
                    }} />
                  )}
                  <h3 style={{ margin: 0, fontSize: "1.25rem", color: "var(--ink)" }}>{post.title}</h3>
                  {post.excerpt && <p style={{ margin: 0, color: "var(--muted)", fontSize: "0.95rem" }}>{post.excerpt}</p>}
                  <div style={{ marginTop: "auto", display: "flex", justifyContent: "space-between", fontSize: "0.8rem", color: "var(--muted)" }}>
                    <span>{post.author || "Reqst Team"}</span>
                    <span>{new Date(post.published_at).toLocaleDateString()}</span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
