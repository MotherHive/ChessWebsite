// Archived blog feature. See archive/blog/README.md before restoring.
export default function BlogPostHeader({ post }) {
  return (
    <header className="blog-post-header">
      <div className="blog-meta">
        <span>{post.category}</span>
        <time dateTime={post.dateTime}>{post.date}</time>
        <span>{post.readTime}</span>
      </div>
      <h1>{post.title}</h1>
      <p>{post.excerpt}</p>
    </header>
  )
}
