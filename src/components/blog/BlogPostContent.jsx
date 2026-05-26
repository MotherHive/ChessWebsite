function BlogPostSection({ section }) {
  return (
    <section>
      <h2>{section.heading}</h2>
      {section.paragraphs.map((paragraph) => (
        <p key={paragraph}>{paragraph}</p>
      ))}
    </section>
  )
}

export default function BlogPostContent({ content }) {
  return (
    <div className="blog-post-content">
      {content.map((section) => (
        <BlogPostSection key={section.heading} section={section} />
      ))}
    </div>
  )
}
