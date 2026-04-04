export default function ProSection() {
  return (
    <section className="section section--pro" id="pro">
      <div className="section-inner">
        <div className="pro-banner">
          <div className="pro-banner-content">
            <span className="pro-badge">For Pros</span>
            <h2 className="pro-title">
              Deep-dive comparison tables, API pricing calculators, and integration guides
            </h2>
            <p className="pro-desc">
              ToolSphere isn&apos;t just for discovery — it&apos;s for making the right technical decision.
              Compare context windows, token pricing, latency benchmarks, and supported features side
              by side.
            </p>
            <div className="pro-features">
              <div className="pro-feature">
                <span className="pro-feature-icon">◆</span>
                <span>Head-to-head comparisons</span>
              </div>
              <div className="pro-feature">
                <span className="pro-feature-icon">◆</span>
                <span>API pricing calculator</span>
              </div>
              <div className="pro-feature">
                <span className="pro-feature-icon">◆</span>
                <span>Integration complexity scores</span>
              </div>
              <div className="pro-feature">
                <span className="pro-feature-icon">◆</span>
                <span>Weekly changelog digest</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
