# Archived blog

The blog was removed from the live site on July 17, 2026. This directory is
intentionally outside `src`, is ignored by ESLint, and is not included in the
Vite bundle.

## Contents

- `src/components/Blog.jsx` and `BlogPost.jsx`: page-level components
- `src/components/blog/`: article cards, article content, and PGN replay UI
- `src/data/blogPosts.js`: all archived post content
- `blog.css`: base, responsive, and reduced-motion styles removed from
  `src/index.css`

The featured image remains at `assets/Board.jpg` because the live home page
also uses it.

## Restore

1. Move the archived `src` files back to their matching paths under the
   project's `src` directory and remove the archive comments at their tops.
2. Restore `blog.css` to `src/index.css`. Put the base rules at top level and
   merge the three media-query blocks into the matching existing queries.
3. Reinstall the PGN viewer dependencies:

   ```sh
   npm install chess.js react-chessboard
   ```

4. In `src/App.jsx`, import `Blog`, `BlogPost`, and `getBlogPostBySlug`; import
   `useParams` from `react-router-dom`; restore the `BlogPostRoute` helper; and
   add these routes:

   ```jsx
   <Route path="/blog" element={<Blog />} />
   <Route path="/blog/:postSlug" element={<BlogPostRoute />} />
   ```

5. Add the `/blog` links back to `src/components/Header.jsx` and
   `src/components/End.jsx`.
6. Restore the blog URLs in `public/sitemap.xml`, review their dates, then run
   `npm run lint` and `npm run build`.

The repository's Git history is the second line of recovery and preserves the
original integration context.
