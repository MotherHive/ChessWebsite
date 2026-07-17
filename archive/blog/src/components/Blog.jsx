// Archived blog feature. See archive/blog/README.md before restoring.
import { blogPosts } from "../data/blogPosts"
import useScrollVisibility from "../hooks/useScrollVisibility"
import BlogArticleCard from "./blog/BlogArticleCard"
import BlogFeaturedArticle from "./blog/BlogFeaturedArticle"

export default function Blog() {
  const [sectionRef, isVisible] = useScrollVisibility({ threshold: 0.18 })
  const [featuredArticle, ...moreArticles] = blogPosts

  return (
    <section
      id="blog"
      ref={sectionRef}
      className={`blog-section${isVisible ? " is-visible" : ""}`}
      aria-labelledby="blog-heading"
    >
      <div className="blog-shell">
        <header className="blog-header">
          <h1 id="blog-heading">LATEST FROM SCRANTON CHESS CLUB</h1>
        </header>

        <BlogFeaturedArticle article={featuredArticle} />

        <div className="blog-list-heading">
          <h2>More Articles</h2>
          <span>Newest first</span>
        </div>

        <div className="blog-article-list" aria-label="More blog articles">
          {moreArticles.map((article, index) => (
            <BlogArticleCard article={article} index={index} key={article.slug} />
          ))}
        </div>
      </div>
    </section>
  )
}
