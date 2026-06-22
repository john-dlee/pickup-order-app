export function categorySlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/\s+/g, "-");
}

export function assignCategorySlug(name: string, id: string, usedSlugs: Set<string>): string {
  let slug = categorySlug(name);
  const idFallback = id.slice(0, 8);

  if (!slug) {
    slug = idFallback;
  }

  if (usedSlugs.has(slug)) {
    slug = `${slug}-${idFallback}`;
  }

  usedSlugs.add(slug);
  return slug;
}