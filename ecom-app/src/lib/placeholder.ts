// Self-contained placeholder image using data URI SVG - no external service dependency
export function getPlaceholderImage(text: string = "No Image"): string {
  const encoded = encodeURIComponent(text);
  return `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='200'%3E%3Crect fill='%23f1f5f9' width='300' height='200'/%3E%3Ctext fill='%2394a3b8' font-family='Arial,sans-serif' font-size='14' text-anchor='middle' dominant-baseline='central' x='150' y='100'%3E${encoded}%3C/text%3E%3C/svg%3E`;
}

export const PLACEHOLDER_IMAGE = getPlaceholderImage();
