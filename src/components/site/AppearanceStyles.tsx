import { useSite } from "@/lib/site-context";

/** Applies admin-configured appearance settings as CSS custom properties. */
export function AppearanceStyles() {
  const { appearance } = useSite();
  const rules: string[] = [];
  if (appearance.primary) rules.push(`--primary: ${appearance.primary};`);
  if (appearance.accent) rules.push(`--accent: ${appearance.accent};--ring: ${appearance.accent};`);
  if (appearance.radius) rules.push(`--radius: ${appearance.radius};`);
  if (appearance.button_style === "pill") rules.push(`--radius: 9999px;`);
  if (rules.length === 0) return null;
  return <style>{`:root{${rules.join("")}}`}</style>;
}
