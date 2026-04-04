import { Category } from "@prisma/client";

export default function Categories({ categories = [] }: { categories?: Category[] }) {
  const getCount = (slug: string) => {
    const cat = categories.find((c) => c.slug === slug);
    return cat ? cat.toolCount : 0;
  };

  return (
    <section className="section" id="categories">
      <div className="section-inner">
        <div className="section-header">
          <h2 className="section-title">Explore by category</h2>
          <a href="#" className="section-link">View all {categories.length || 18} categories &rarr;</a>
        </div>
        <div className="bento-grid">
          <a href="#" className="bento-card bento-card--teal bento-card--wide" id="cat-mcps">
            <div className="bento-icon">
              <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/>
              </svg>
            </div>
            <h3 className="bento-title">MCPs</h3>
            <p className="bento-desc">Model Context Protocol servers extending AI capabilities</p>
            <span className="bento-count">{getCount("mcps")} tools</span>
          </a>
          <a href="#" className="bento-card bento-card--gold" id="cat-skills">
            <div className="bento-icon">
              <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
              </svg>
            </div>
            <h3 className="bento-title">Agent Skills</h3>
            <p className="bento-desc">Reusable capabilities for AI agents</p>
            <span className="bento-count">{getCount("agent-skills")} skills</span>
          </a>
          <a href="#" className="bento-card bento-card--olive" id="cat-code">
            <div className="bento-icon">
              <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/>
              </svg>
            </div>
            <h3 className="bento-title">Code & CLI</h3>
            <p className="bento-desc">Terminal tools and developer utilities</p>
            <span className="bento-count">{getCount("code-cli")} tools</span>
          </a>
          <a href="#" className="bento-card bento-card--terracotta" id="cat-ides">
            <div className="bento-icon">
              <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8"/><path d="M12 17v4"/>
              </svg>
            </div>
            <h3 className="bento-title">Agentic IDEs</h3>
            <p className="bento-desc">AI-native development environments</p>
            <span className="bento-count">{getCount("agentic-ides")} IDEs</span>
          </a>
          <a href="#" className="bento-card bento-card--purple" id="cat-audio">
            <div className="bento-icon">
              <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/>
              </svg>
            </div>
            <h3 className="bento-title">Audio & Voice</h3>
            <p className="bento-desc">TTS, music, voice cloning</p>
            <span className="bento-count">{getCount("audio-voice")} tools</span>
          </a>
          <a href="#" className="bento-card bento-card--brown bento-card--wide" id="cat-writing">
            <div className="bento-icon">
              <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/>
              </svg>
            </div>
            <h3 className="bento-title">Writing & Docs</h3>
            <p className="bento-desc">Content creation, documentation, copywriting</p>
            <span className="bento-count">{getCount("writing-docs")} tools</span>
          </a>
        </div>
      </div>
    </section>
  );
}
