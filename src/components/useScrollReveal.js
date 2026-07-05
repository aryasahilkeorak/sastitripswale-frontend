import { useEffect } from 'react';

// Adds the `.visible` class to reveal elements as they enter the viewport,
// including elements rendered later (async data) via a MutationObserver.
export function useScrollReveal(rootRef) {
  useEffect(() => {
    const root = rootRef.current || document.body;
    const sel = '.fade-up, .fade-left, .fade-right, .scale-in';

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add('visible');
            io.unobserve(e.target);
          }
        });
      },
      { threshold: 0.12 }
    );

    const observeAll = (node) => {
      if (!node || node.nodeType !== 1) return;
      if (node.matches?.(sel)) io.observe(node);
      node.querySelectorAll?.(sel).forEach((el) => io.observe(el));
    };

    observeAll(root);

    const mo = new MutationObserver((muts) => {
      muts.forEach((m) => m.addedNodes.forEach(observeAll));
    });
    mo.observe(root, { childList: true, subtree: true });

    return () => {
      io.disconnect();
      mo.disconnect();
    };
  }, [rootRef]);
}
