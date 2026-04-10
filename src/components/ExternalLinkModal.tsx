"use client";

import { useState } from "react";

type Props = {
  url: string;
  toolName: string;
  children: React.ReactNode;
  className?: string;
};

export default function ExternalLinkModal({ url, toolName, children, className }: Props) {
  const [isOpen, setIsOpen] = useState(false);

  function handleClick(event: React.MouseEvent) {
    event.preventDefault();
    setIsOpen(true);
  }

  function handleConfirm() {
    window.open(url, "_blank", "noopener,noreferrer");
    setIsOpen(false);
  }

  return (
    <>
      <a href={url} onClick={handleClick} className={className}>
        {children}
      </a>

      {isOpen ? (
        <div className="modal-overlay" onClick={() => setIsOpen(false)}>
          <div className="modal-content" onClick={(event) => event.stopPropagation()}>
            <h3>Leaving ToolSphere</h3>
            <p>
              You are about to visit <strong>{toolName}</strong> at:
            </p>
            <p className="modal-url">{url}</p>
            <p>ToolSphere is not affiliated with this external website.</p>
            <div className="modal-actions">
              <button className="btn btn-secondary" type="button" onClick={() => setIsOpen(false)}>
                Cancel
              </button>
              <button className="btn btn-primary" type="button" onClick={handleConfirm}>
                Continue to site →
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
