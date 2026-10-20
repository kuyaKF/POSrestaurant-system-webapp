import { ReactNode, useEffect } from "react";
import { createPortal } from "react-dom";

// Reference-counted so two modals open at once (e.g. the header's PIN
// prompt over a page-level modal) don't have the first one to close
// re-enable scrolling while the second is still open.
let openModalCount = 0;

function lockBodyScroll() {
  openModalCount++;
  if (openModalCount === 1) {
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
    document.body.style.overflow = "hidden";
    if (scrollbarWidth > 0) {
      document.body.style.paddingRight = `${scrollbarWidth}px`;
    }
  }
}

function unlockBodyScroll() {
  openModalCount = Math.max(0, openModalCount - 1);
  if (openModalCount === 0) {
    document.body.style.overflow = "";
    document.body.style.paddingRight = "";
  }
}

export function Modal({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
}) {
  useEffect(() => {
    lockBodyScroll();
    return unlockBodyScroll;
  }, []);

  // Portalled straight to <body> — some ancestors (e.g. the sticky, z-indexed
  // app header) establish their own stacking context, which would otherwise
  // trap a modal's z-index below content rendered outside that ancestor no
  // matter how high the value is set. Portaling sidesteps that entirely and
  // makes "most recently opened" naturally paint on top.
  return createPortal(
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h2>{title}</h2>
        {children}
      </div>
    </div>,
    document.body
  );
}
