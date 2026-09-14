/**
 * Converts a YouTube/Google Drive share link into its embeddable iframe
 * URL, so a rabbi's video approval plays inside a WebView instead of
 * handing off to the YouTube/Drive app or an external browser.
 */
export function toEmbedUrl(url: string): string {
  const youtube = url.match(/(?:youtube\.com\/(?:watch\?v=|shorts\/)|youtu\.be\/)([\w-]{6,})/);
  if (youtube) return `https://www.youtube.com/embed/${youtube[1]}`;

  const drive = url.match(/drive\.google\.com\/file\/d\/([\w-]+)/);
  if (drive) return `https://drive.google.com/file/d/${drive[1]}/preview`;

  return url;
}

/**
 * YouTube's thumbnail image, so a card can show the video's own cover
 * instead of an unrelated letter scan. No equivalent public thumbnail
 * exists for Google Drive links, so those (and anything else) return null.
 */
export function toVideoThumbnailUrl(url: string): string | null {
  const youtube = url.match(/(?:youtube\.com\/(?:watch\?v=|shorts\/)|youtu\.be\/)([\w-]{6,})/);
  return youtube ? `https://img.youtube.com/vi/${youtube[1]}/hqdefault.jpg` : null;
}
