import { useState, useEffect } from "react";

type Options = {
  enabled?: boolean;
  offsetPx?: number;
};

export function useActiveCategory(slugs: string[], options: Options = {}) {
  const { enabled = true, offsetPx = 56 } = options;
  const [activeSlug, setActiveSlug] = useState(slugs[0] ?? "");
  const serialisedSlugs = slugs.join(",");

  useEffect(() => {
    const slugList = serialisedSlugs.split(",").filter(Boolean);
    if (!slugList.length || !enabled) return;

    const visibility = new Map<Element, boolean>();

    // Locate matching DOM elements for tracking
    const sections = slugList
      .map((slug) => document.getElementById(`section-${slug}`))
      .filter((el): el is HTMLElement => el !== null);

    if (!sections.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        // Record latest visibility state for entry variants
        entries.forEach((entry) => {
          visibility.set(entry.target, entry.isIntersecting);
        });

        // Filter for intersecting elements, then sort by proximity to viewport top
        const visibleSections = sections
          .filter((el) => visibility.get(el) === true)
          .sort((a, b) => a.getBoundingClientRect().top - b.getBoundingClientRect().top);

        const topSection = visibleSections[0];
        if (topSection) {
          const slug = topSection.id.replace("section-", "");
          setActiveSlug(slug);
        }
      },
      {
        root: null,
        rootMargin: `-${offsetPx + 1}px 0px -80% 0px`,
        threshold: 0,
      }
    );

    // Initialise tracking listeners
    sections.forEach((el) => observer.observe(el));

    // Teardown observer instance on dependency updates or unmount
    return () => observer.disconnect();
  }, [serialisedSlugs, offsetPx, enabled]);

  return activeSlug;
}