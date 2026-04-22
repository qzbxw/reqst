package http

import (
	"errors"
	"net/http"
	"strconv"
	"time"

	"reqst/backend/internal/store"

	"github.com/gin-gonic/gin"
)

type createBlogPostInput struct {
	Slug          string  `json:"slug" binding:"required"`
	Title         string  `json:"title" binding:"required"`
	ContentMD     string  `json:"content_md" binding:"required"`
	Excerpt       *string `json:"excerpt"`
	CoverImageURL *string `json:"cover_image_url"`
	Author        *string `json:"author"`
	IsPublished   bool    `json:"is_published"`
}

func (s *Server) handleAdminCreateBlogPost(c *gin.Context) {
	var input createBlogPostInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var publishedAt *time.Time
	if input.IsPublished {
		now := time.Now()
		publishedAt = &now
	}

	post := store.BlogPost{
		Slug:          input.Slug,
		Title:         input.Title,
		ContentMD:     input.ContentMD,
		Excerpt:       input.Excerpt,
		CoverImageURL: input.CoverImageURL,
		Author:        input.Author,
		IsPublished:   input.IsPublished,
		PublishedAt:   publishedAt,
	}

	createdPost, err := s.store.CreateBlogPost(c.Request.Context(), post)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, createdPost)
}

func (s *Server) handleAdminUpdateBlogPost(c *gin.Context) {
	id, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid post id"})
		return
	}

	var input createBlogPostInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var publishedAt *time.Time
	if input.IsPublished {
		now := time.Now()
		publishedAt = &now
	}

	post := store.BlogPost{
		Slug:          input.Slug,
		Title:         input.Title,
		ContentMD:     input.ContentMD,
		Excerpt:       input.Excerpt,
		CoverImageURL: input.CoverImageURL,
		Author:        input.Author,
		IsPublished:   input.IsPublished,
		PublishedAt:   publishedAt,
	}

	updatedPost, err := s.store.UpdateBlogPost(c.Request.Context(), id, post)
	if err != nil {
		if errors.Is(err, store.ErrNotFound) {
			c.JSON(http.StatusNotFound, gin.H{"error": "blog post not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, updatedPost)
}

func (s *Server) handleAdminDeleteBlogPost(c *gin.Context) {
	id, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid post id"})
		return
	}

	err = s.store.DeleteBlogPost(c.Request.Context(), id)
	if err != nil {
		if errors.Is(err, store.ErrNotFound) {
			c.JSON(http.StatusNotFound, gin.H{"error": "blog post not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.Status(http.StatusNoContent)
}

func (s *Server) handleAdminListBlogPosts(c *gin.Context) {
	page := parseIntDefault(c.Query("page"), 1)
	pageSize := parseIntDefault(c.Query("page_size"), 20)

	posts, total, err := s.store.ListBlogPosts(c.Request.Context(), page, pageSize, false)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"items": posts,
		"total": total,
		"page":  page,
		"size":  pageSize,
	})
}
