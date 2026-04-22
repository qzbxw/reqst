package http

import (
	"errors"
	"net/http"

	"reqst/backend/internal/store"

	"github.com/gin-gonic/gin"
)

func (s *Server) handlePublicListBlogPosts(c *gin.Context) {
	page := parseIntDefault(c.Query("page"), 1)
	pageSize := parseIntDefault(c.Query("page_size"), 20)

	posts, total, err := s.store.ListBlogPosts(c.Request.Context(), page, pageSize, true)
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

func (s *Server) handlePublicGetBlogPost(c *gin.Context) {
	slug := c.Param("slug")
	if slug == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "slug is required"})
		return
	}

	post, err := s.store.GetBlogPostBySlug(c.Request.Context(), slug)
	if err != nil {
		if errors.Is(err, store.ErrNotFound) {
			c.JSON(http.StatusNotFound, gin.H{"error": "blog post not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	if !post.IsPublished {
		c.JSON(http.StatusNotFound, gin.H{"error": "blog post not found"})
		return
	}

	c.JSON(http.StatusOK, post)
}
