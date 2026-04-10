export default function UseCases() {
  const useCaseLinks = [
    { label: "build a website with AI", href: "/tools?q=website" },
    { label: "generate voiceovers", href: "/tools?q=voice" },
    { label: "make slides from a prompt", href: "/tools?q=slides" },
    { label: "find a free ChatGPT alternative", href: "/tools?q=chatbot" },
    { label: "connect AI to my codebase", href: "/tools?q=mcp" },
    { label: "compare LLM models", href: "/benchmarks" },
    { label: "create music with AI", href: "/tools?q=music" },
  ];

  return (
    <section className="use-cases-strip" id="use-cases">
      <div className="strip-inner">
        <span className="strip-label">I want to...</span>
        <div className="strip-pills">
          {useCaseLinks.map((item) => (
            <a key={item.label} href={item.href} className="strip-pill">
              {item.label}
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
