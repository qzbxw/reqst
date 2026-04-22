import { useEffect, useState, FormEvent } from "react";
import { Navigate } from "react-router-dom";
import MDEditor from "@uiw/react-md-editor";
import {
  getStoredAdminToken,
  fetchAdminBlogPosts,
  createAdminBlogPost,
  updateAdminBlogPost,
} from "../lib/api";
import type { AdminBlogPost } from "../lib/types";

export function AdminBlogPage() {
  const token = getStoredAdminToken();
  const [posts, setPosts] = useState<AdminBlogPost[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  
  // Editor state
  const [editingPost, setEditingPost] = useState<Partial<AdminBlogPost> | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!token) return;
    loadPosts();
  }, [token]);

  async function loadPosts() {
    setLoading(true);
    try {
      const data = await fetchAdminBlogPosts(token!);
      if (Array.isArray(data)) {
        setPosts(data);
      } else if (data && typeof data === "object" && "items" in data) {
        setPosts(data.items || []);
      }
      setError("");
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  async function handleSave(e: FormEvent) {
    e.preventDefault();
    if (!token || !editingPost) return;

    setIsSaving(true);
    try {
      if (editingPost.id) {
        await updateAdminBlogPost(token, editingPost.id, editingPost);
      } else {
        await createAdminBlogPost(token, editingPost);
      }
      setEditingPost(null);
      await loadPosts();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsSaving(false);
    }
  }

  if (!token) {
    return <Navigate replace to="/admin" />;
  }

  if (editingPost) {
    return (
      <main className="admin-shell">
        <div className="admin-noise" />
        <section className="admin-dashboard">
          <header className="admin-topbar">
            <div>
              <span className="admin-eyebrow">Reqst Admin</span>
              <h1>{editingPost.id ? "Edit Post" : "New Post"}</h1>
            </div>
            <div className="admin-topbar-actions">
              <button
                type="button"
                className="admin-ghost-button"
                onClick={() => setEditingPost(null)}
              >
                Back to list
              </button>
            </div>
          </header>

          <section className="admin-sales-board">
            {error && <div className="admin-error admin-error--inline">{error}</div>}
            
            <form onSubmit={handleSave} style={{ display: "flex", flexDirection: "column", gap: "1rem", padding: "1rem" }}>
              <label style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                <span>Title</span>
                <input
                  required
                  value={editingPost.title || ""}
                  onChange={(e) => setEditingPost({ ...editingPost, title: e.target.value })}
                  style={{ background: "transparent", border: "1px solid rgba(255,255,255,0.1)", color: "#fff", padding: "0.5rem", borderRadius: "4px" }}
                />
              </label>

              <label style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                <span>Slug</span>
                <input
                  required
                  value={editingPost.slug || ""}
                  onChange={(e) => setEditingPost({ ...editingPost, slug: e.target.value })}
                  style={{ background: "transparent", border: "1px solid rgba(255,255,255,0.1)", color: "#fff", padding: "0.5rem", borderRadius: "4px" }}
                />
              </label>

              <label style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                <span>Excerpt</span>
                <textarea
                  required
                  value={editingPost.excerpt || ""}
                  onChange={(e) => setEditingPost({ ...editingPost, excerpt: e.target.value })}
                  style={{ background: "transparent", border: "1px solid rgba(255,255,255,0.1)", color: "#fff", padding: "0.5rem", borderRadius: "4px", minHeight: "80px" }}
                />
              </label>

              <label style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                <span>Cover Image URL</span>
                <input
                  value={editingPost.cover_image_url || ""}
                  onChange={(e) => setEditingPost({ ...editingPost, cover_image_url: e.target.value })}
                  style={{ background: "transparent", border: "1px solid rgba(255,255,255,0.1)", color: "#fff", padding: "0.5rem", borderRadius: "4px" }}
                />
              </label>

              <label style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                <span>Author</span>
                <input
                  required
                  value={editingPost.author || ""}
                  onChange={(e) => setEditingPost({ ...editingPost, author: e.target.value })}
                  style={{ background: "transparent", border: "1px solid rgba(255,255,255,0.1)", color: "#fff", padding: "0.5rem", borderRadius: "4px" }}
                />
              </label>

              <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginTop: "0.5rem" }}>
                <input
                  type="checkbox"
                  checked={editingPost.is_published || false}
                  onChange={(e) => setEditingPost({ ...editingPost, is_published: e.target.checked })}
                />
                <span>Is Published</span>
              </label>

              <div style={{ marginTop: "1rem" }} data-color-mode="dark">
                <span style={{ display: "block", marginBottom: "0.5rem" }}>Content (Markdown)</span>
                <MDEditor
                  value={editingPost.content_md || ""}
                  onChange={(val) => setEditingPost({ ...editingPost, content_md: val || "" })}
                  height={400}
                />
              </div>

              <div style={{ marginTop: "1rem" }}>
                <button
                  type="submit"
                  className="admin-login-button"
                  style={{ width: "auto", padding: "0.5rem 2rem" }}
                  disabled={isSaving}
                >
                  {isSaving ? "Saving..." : "Save Post"}
                </button>
              </div>
            </form>
          </section>
        </section>
      </main>
    );
  }

  return (
    <main className="admin-shell">
      <div className="admin-noise" />
      <section className="admin-dashboard">
        <header className="admin-topbar">
          <div>
            <span className="admin-eyebrow">Reqst Admin</span>
            <h1>Blog Management</h1>
          </div>
          <div className="admin-topbar-actions">
            <button
              type="button"
              className="admin-ghost-button"
              onClick={loadPosts}
              disabled={loading}
            >
              Refresh
            </button>
            <button
              type="button"
              className="admin-ghost-button"
              onClick={() => setEditingPost({
                title: "",
                slug: "",
                excerpt: "",
                content_md: "",
                cover_image_url: "",
                author: "Reqst Team",
                is_published: false
              })}
            >
              New Post
            </button>
          </div>
        </header>

        {error && <div className="admin-error admin-error--inline">{error}</div>}

        <section className="admin-sales-board">
          <div className="admin-table-wrap">
            <table className="admin-sales-table">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Slug</th>
                  <th>Author</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading && posts.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="admin-table-empty">Loading posts...</td>
                  </tr>
                ) : posts.length > 0 ? (
                  posts.map((post) => (
                    <tr key={post.id}>
                      <td>
                        <div className="admin-table-primary">
                          <strong>{post.title}</strong>
                        </div>
                      </td>
                      <td>{post.slug}</td>
                      <td>{post.author}</td>
                      <td>
                        <span className={`admin-status-pill ${post.is_published ? "status-paid" : "status-draft"}`}>
                          {post.is_published ? "Published" : "Draft"}
                        </span>
                      </td>
                      <td>
                        <button
                          type="button"
                          className="admin-ghost-button"
                          onClick={() => setEditingPost(post)}
                        >
                          Edit
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="admin-table-empty">No posts found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </section>
    </main>
  );
}
