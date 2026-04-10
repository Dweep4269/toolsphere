import { Category } from "@prisma/client";
import Link from "next/link";

export default function Categories({ categories = [] }: { categories?: Category[] }) {
  return (
    <section className="section" id="categories">
      <div className="section-inner">
        <div className="section-header">
          <h2 className="section-title">Explore by category</h2>
          <Link href="/categories" className="section-link">View all {categories.length || 18} categories &rarr;</Link>
        </div>
        <div className="bento-grid">
          {categories.map((category) => (
            <Link
              key={category.id}
              href={`/categories/${category.slug}`}
              className="bento-card"
              id={`cat-${category.slug}`}
              style={{ borderColor: category.color || '#C8A87C' } as React.CSSProperties}
            >
              <div className="bento-icon" style={{ color: category.color || '#C8A87C' }}>
                <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <rect x="3" y="3" width="18" height="18" rx="4" />
                  <path d="M8 12h8" />
                </svg>
              </div>
              <h3 className="bento-title">{category.name}</h3>
              <p className="bento-desc">{category.description || "Explore curated tools in this category."}</p>
              <span className="bento-count">{category.toolCount} tools</span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
