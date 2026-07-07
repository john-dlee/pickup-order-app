import type { ModifierSelections } from "@/lib/menu_types";

export const EMPTY_SELECTIONS: ModifierSelections = {};

export function normaliseSelections(selections?: ModifierSelections): ModifierSelections {
  return selections ?? EMPTY_SELECTIONS;
}

export function cartLineKey(menuItemId: string, selections?: ModifierSelections): string {
  const s = normaliseSelections(selections);
  const pairs = Object.entries(s).sort(([a], [b]) => a.localeCompare(b));
  if (pairs.length === 0) return menuItemId;
  return `${menuItemId}|${pairs.map(([g, o]) => `${g}:${o}`).join("|")}`;
}

export function sameCartLine(
  a: { id: string; selections?: ModifierSelections },
  b: { id: string; selections?: ModifierSelections }
): boolean {
  return cartLineKey(a.id, a.selections) === cartLineKey(b.id, b.selections);
}