import { useEffect } from 'react';

const SEL = '.fade-up, .fade-left, .fade-right, .scale-in';

// Instantly neutralizes the fade/scale-in classes' hidden starting state
// (opacity:0 + transform) instead of animating them in on scroll - used
// when the reveal-on-scroll effect should be skipped entirely.
function revealInstantly(node) {
  if (!node || node.nodeType !== 1) return;
  const apply = (el) => {
    el.style.transition = 'none';
    el.style.opacity = '1';
    el.style.transform = 'none';
  };
  if (node.matches?.(SEL)) apply(node);
  node.querySelectorAll?.(SEL).forEach(apply);
}

// Adds the `.visible` class to reveal elements as they enter the viewport,
// including elements rendered later (async data) via a MutationObserver.
// Pass `disabled: true` to skip the scroll-triggered animation altogether
// (e.g. the logged-in mobile app views, where it reads as sluggish rather
// than polished) - content still appears, just without the fade-in.
export function useScrollReveal(rootRef, disabled = false) {
  useEffect(() => {
    const root = rootRef.current || document.body;

    if (disabled) {
      revealInstantly(root);
      const mo = new MutationObserver((muts) => {
        muts.forEach((m) => m.addedNodes.forEach(revealInstantly));
      });
      mo.observe(root, { childList: true, subtree: true });
      return () => mo.disconnect();
    }

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
      if (node.matches?.(SEL)) io.observe(node);
      node.querySelectorAll?.(SEL).forEach((el) => io.observe(el));
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
  }, [rootRef, disabled]);
}
