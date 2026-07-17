// Archived blog feature. See archive/blog/README.md before restoring.
import { Link } from "react-router-dom"
import BlogPostContent from "./blog/BlogPostContent"
import BlogPostHeader from "./blog/BlogPostHeader"
import PgnChessboard from "./blog/PgnChessboard"

export default function BlogPost({ post }) {
  if (!post) {
    return (
      <section className="blog-post-section">
        <div className="blog-post-shell">
          <Link className="blog-back-link" to="/blog">Back to blog</Link>
          <h1>Post not found</h1>
          <p>That blog post does not exist yet.</p>
        </div>
      </section>
    )
  }

  return (
    <article className="blog-post-section">
      <div className="blog-post-shell">
        <Link className="blog-back-link" to="/blog">Back to blog</Link>

        <BlogPostHeader post={post} />
        <BlogPostContent content={post.content} />
        <PgnChessboard pgn={post.pgn} />
      </div>
    </article>
  )
}
