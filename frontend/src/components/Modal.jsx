import { useCallback, useEffect, useRef, useState } from 'react';
export default function Modal({ title, onClose, children, side = 'right', wide = false }) {
  const ref = useRef(null);
  const timer = useRef(null);
  const [closing, setClosing] = useState(false);
  const close = useCallback(() => {
    if (timer.current !== null) return;
    setClosing(true);
    const duration = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 220;
    timer.current = window.setTimeout(onClose, duration);
  }, [onClose]);
  useEffect(() => {
    const previous = document.activeElement;
    const scroll = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    (ref.current.querySelector('[autofocus], input') || ref.current).focus();
    function onKey(event) {
      if (event.key === 'Escape') {
        event.preventDefault();
        close();
      }
      if (event.key !== 'Tab') return;
      const nodes = [
        ...ref.current.querySelectorAll(
          'button:not(:disabled), a[href], input, textarea, select, [tabindex="0"]',
        ),
      ];
      const first = nodes[0],
        last = nodes.at(-1);
      if (
        event.shiftKey &&
        (document.activeElement === first || document.activeElement === ref.current)
      ) {
        event.preventDefault();
        last?.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first?.focus();
      }
    }
    document.addEventListener('keydown', onKey);
    return () => {
      window.clearTimeout(timer.current);
      timer.current = null;
      document.body.style.overflow = scroll;
      document.removeEventListener('keydown', onKey);
      window.requestAnimationFrame(() => {
        if (document.querySelector('[role="dialog"]')) return;
        if (previous?.isConnected && !previous.closest('[inert]')) previous.focus();
        else document.querySelector('.floating-actions button')?.focus();
      });
    };
  }, [close]);
  return (
    <div
      className={`modal-backdrop drawer-backdrop ${side} ${closing ? 'closing' : ''}`}
      onClick={(e) => e.target === e.currentTarget && close()}
    >
      <section
        ref={ref}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        className={`modal drawer ${wide ? 'drawer-wide' : ''}`}
      >
        <header>
          <h2 id="modal-title">{title}</h2>
          <button className="icon shine-button" onClick={close} aria-label="Close panel">
            ×
          </button>
        </header>
        {children}
      </section>
    </div>
  );
}
