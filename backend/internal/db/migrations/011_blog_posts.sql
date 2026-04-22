CREATE TABLE blog_posts (
    id BIGSERIAL PRIMARY KEY,
    slug VARCHAR(255) UNIQUE NOT NULL,
    title VARCHAR(255) NOT NULL,
    content_md TEXT NOT NULL,
    excerpt TEXT,
    cover_image_url VARCHAR(500),
    author VARCHAR(100),
    is_published BOOLEAN DEFAULT FALSE,
    published_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_blog_posts_slug ON blog_posts(slug);
