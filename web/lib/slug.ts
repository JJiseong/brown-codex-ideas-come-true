export function slugify(input: string, fallback = "ideas-come-true"): string {
  const ascii = input
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 72);

  if (ascii) return ascii;

  const hash = Array.from(input).reduce((acc, char) => {
    return (acc * 31 + char.charCodeAt(0)) >>> 0;
  }, 7);

  return `${fallback}-${hash.toString(16)}`;
}
