import Link from "next/link";
import { Metadata, ResolvingMetadata } from "next";
import ReactMarkdown from "react-markdown";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8080";

async function getPost(slug: string) {
  try {
    const res = await fetch(`${API_BASE}/api/public/blog/${slug}`, { 
      next: { revalidate: 60 } 
    });
    if (!res.ok) {
      return null;
    }
    return await res.json();
  } catch (error) {
    console.error("Failed to fetch blog post", error);
    return null;
  }
}

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata(
  props: Props,
  parent: ResolvingMetadata
): Promise<Metadata> {
  const params = await props.params;
  const post = await getPost(params.slug);

  if (!post) {
    return { title: "Post Not Found" };
  }

  return {
    title: `${post.title} | Reqst Blog`,
    description: post.excerpt || "Read the latest updates and engineering insights from Reqst.",
    openGraph: {
      title: post.title,
      description: post.excerpt,
      images: post.cover_image_url ? [post.cover_image_url] : [],
    },
  };
}

export default async function BlogPost(props: Props) {
  const params = await props.params;
  const post = await getPost(params.slug);

  if (!post) {
    return (
      <main className="lend-page" style={{ minHeight: "100vh", display: "grid", placeItems: "center" }}>
        <div style={{ textAlign: "center" }}>
          <h1 style={{ color: "var(--ink)", fontSize: "2rem", marginBottom: "1rem" }}>Post Not Found</h1>
          <Link href="/blog" style={{ color: "var(--accent)" }}>&larr; Back to Blog</Link>
        </div>
      </main>
    );
  }

  return (
    <main className="lend-page" style={{ minHeight: "100vh" }}>
      <div className="lend-backdrop lend-backdrop--grid" />
      <div className="lend-backdrop lend-backdrop--glow lend-backdrop--left" />
      <div className="lend-shell">
        <header className="lend-topbar">
          <div className="lend-topbar-main">
            <Link className="lend-brand" href="/">
              <strong>reqst</strong>
            </Link>
            <div className="lend-topbar-actions">
              <Link className="lend-nav-link" href="/blog">&larr; Back</Link>
            </div>
          </div>
        </header>

        <article style={{ maxWidth: "768px", margin: "4rem auto 8rem", padding: "0 1.5rem" }}>
          <header style={{ marginBottom: "3rem", textAlign: "center" }}>
            <h1 style={{ fontSize: "clamp(2rem, 5vw, 3.5rem)", color: "var(--ink)", lineHeight: 1.1, marginBottom: "1.5rem", letterSpacing: "-0.03em" }}>
              {post.title}
            </h1>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "1rem", color: "var(--muted)", fontSize: "0.9rem" }}>
              <span>{post.author || "Reqst Core Team"}</span>
              <span>&bull;</span>
              <time dateTime={post.published_at}>{new Date(post.published_at).toLocaleDateString("en-US", { year: 'numeric', month: 'long', day: 'numeric' })}</time>
            </div>
          </header>

          {post.cover_image_url && (
            <img src={post.cover_image_url} alt={post.title} style={{ width: "100%", height: "auto", borderRadius: "16px", marginBottom: "3rem", border: "1px solid var(--line)" }} />
          )}

          <div className="markdown-body" style={{ 
            color: "rgba(255, 255, 255, 0.8)", 
            lineHeight: 1.8, 
            fontSize: "1.05rem"
          }}>
            <ReactMarkdown
              components={{
                h2: ({node, ...props}) => <h2 style={{ color: "var(--ink)", marginTop: "2.5rem", marginBottom: "1rem", fontSize: "1.75rem", letterSpacing: "-0.02em" }} {...props} />,
                h3: ({node, ...props}) => <h3 style={{ color: "var(--ink)", marginTop: "2rem", marginBottom: "1rem", fontSize: "1.3rem" }} {...props} />,
                p: ({node, ...props}) => <p style={{ marginBottom: "1.25rem" }} {...props} />,
                a: ({node, ...props}) => <a style={{ color: "var(--accent)", textDecoration: "underline", textUnderlineOffset: "4px" }} {...props} />,
                code: ({node, inline, ...props}: any) => 
                  inline ? <code style={{ background: "rgba(255,255,255,0.1)", padding: "0.2em 0.4em", borderRadius: "4px", fontSize: "0.9em", fontFamily: "monospace" }} {...props} />
                         : <pre style={{ background: "#0a0a0c", padding: "1.25rem", borderRadius: "12px", overflowX: "auto", border: "1px solid var(--line)", marginBottom: "1.5rem" }}><code style={{ fontFamily: "monospace", fontSize: "0.9em" }} {...props} /></pre>,
                blockquote: ({node, ...props}) => <blockquote style={{ borderLeft: "4px solid var(--accent)", paddingLeft: "1rem", color: "var(--muted)", fontStyle: "italic", margin: "1.5rem 0" }} {...props} />,
                ul: ({node, ...props}) => <ul style={{ marginBottom: "1.5rem", paddingLeft: "1.5rem" }} {...props} />,
                ol: ({node, ...props}) => <ol style={{ marginBottom: "1.5rem", paddingLeft: "1.5rem" }} {...props} />,
                li: ({node, ...props}) => <li style={{ marginBottom: "0.5rem" }} {...props} />
              }}
            >
              {post.content_md}
            </ReactMarkdown>
          </div>
        </article>
      </div>
    </main>
  );
}
