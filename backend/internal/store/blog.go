package store

import (
	"context"
	"errors"
	"fmt"

	"github.com/jackc/pgx/v5"
)

const blogPostSelectColumns = `
	id,
	slug,
	title,
	content_md,
	excerpt,
	cover_image_url,
	author,
	is_published,
	published_at,
	created_at,
	updated_at
`

func scanBlogPost(row pgx.Row) (BlogPost, error) {
	var p BlogPost
	err := row.Scan(
		&p.ID,
		&p.Slug,
		&p.Title,
		&p.ContentMD,
		&p.Excerpt,
		&p.CoverImageURL,
		&p.Author,
		&p.IsPublished,
		&p.PublishedAt,
		&p.CreatedAt,
		&p.UpdatedAt,
	)
	if errors.Is(err, pgx.ErrNoRows) {
		return BlogPost{}, ErrNotFound
	}
	if err != nil {
		return BlogPost{}, fmt.Errorf("scan blog post: %w", err)
	}
	return p, nil
}

func (s *Store) CreateBlogPost(ctx context.Context, post BlogPost) (BlogPost, error) {
	row := s.pool.QueryRow(ctx, `
		INSERT INTO blog_posts (
			slug, title, content_md, excerpt, cover_image_url, author, is_published, published_at
		)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
		RETURNING `+blogPostSelectColumns+`
	`, post.Slug, post.Title, post.ContentMD, post.Excerpt, post.CoverImageURL, post.Author, post.IsPublished, post.PublishedAt)
	return scanBlogPost(row)
}

func (s *Store) UpdateBlogPost(ctx context.Context, id int64, post BlogPost) (BlogPost, error) {
	row := s.pool.QueryRow(ctx, `
		UPDATE blog_posts
		SET slug = $1,
		    title = $2,
		    content_md = $3,
		    excerpt = $4,
		    cover_image_url = $5,
		    author = $6,
		    is_published = $7,
		    published_at = $8,
		    updated_at = NOW()
		WHERE id = $9
		RETURNING `+blogPostSelectColumns+`
	`, post.Slug, post.Title, post.ContentMD, post.Excerpt, post.CoverImageURL, post.Author, post.IsPublished, post.PublishedAt, id)
	return scanBlogPost(row)
}

func (s *Store) DeleteBlogPost(ctx context.Context, id int64) error {
	tag, err := s.pool.Exec(ctx, `DELETE FROM blog_posts WHERE id = $1`, id)
	if err != nil {
		return fmt.Errorf("delete blog post: %w", err)
	}
	if tag.RowsAffected() == 0 {
		return ErrNotFound
	}
	return nil
}

func (s *Store) GetBlogPostBySlug(ctx context.Context, slug string) (BlogPost, error) {
	row := s.pool.QueryRow(ctx, `
		SELECT `+blogPostSelectColumns+`
		FROM blog_posts
		WHERE slug = $1
	`, slug)
	return scanBlogPost(row)
}

func (s *Store) ListBlogPosts(ctx context.Context, page, pageSize int, onlyPublished bool) ([]BlogPost, int, error) {
	var total int
	countQuery := `SELECT COUNT(1) FROM blog_posts`
	if onlyPublished {
		countQuery += ` WHERE is_published = TRUE`
	}
	if err := s.pool.QueryRow(ctx, countQuery).Scan(&total); err != nil {
		return nil, 0, fmt.Errorf("count blog posts: %w", err)
	}

	query := `SELECT ` + blogPostSelectColumns + ` FROM blog_posts`
	if onlyPublished {
		query += ` WHERE is_published = TRUE`
	}
	query += ` ORDER BY created_at DESC LIMIT $1 OFFSET $2`

	offset := (page - 1) * pageSize
	if offset < 0 {
		offset = 0
	}

	rows, err := s.pool.Query(ctx, query, pageSize, offset)
	if err != nil {
		return nil, 0, fmt.Errorf("list blog posts: %w", err)
	}
	defer rows.Close()

	var posts []BlogPost
	for rows.Next() {
		post, err := scanBlogPost(rows)
		if err != nil {
			return nil, 0, err
		}
		posts = append(posts, post)
	}
	if err := rows.Err(); err != nil {
		return nil, 0, err
	}
	return posts, total, nil
}
