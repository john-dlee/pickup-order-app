export function scrollToSection(slug: string, offsetPx = 56): void {
  const el = document.getElementById(`section-${slug}`);
  if (!el) return;

  const top = el.getBoundingClientRect().top + window.scrollY - offsetPx;
  
  window.scrollTo({ 
    top: Math.max(0, top), 
    behavior: "smooth"
  });
}