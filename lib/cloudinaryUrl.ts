/**
 * Transform Cloudinary URL to high-quality version
 * Adds quality=auto:best and format=auto for optimal quality + delivery
 */
export function highQualityUrl(url: string, width?: number): string {
  if (!url || !url.includes("cloudinary.com")) return url;

  // Insert transformation after /upload/
  const transforms = ["q_auto:best", "f_auto"];
  if (width) transforms.push(`w_${width}`);

  return url.replace(
    "/upload/",
    `/upload/${transforms.join(",")}/`
  );
}

/**
 * Get responsive Cloudinary URLs for different sizes
 */
export function responsiveUrls(url: string): { small: string; medium: string; large: string; full: string } {
  if (!url || !url.includes("cloudinary.com")) {
    return { small: url, medium: url, large: url, full: url };
  }

  return {
    small: url.replace("/upload/", "/upload/q_auto:good,f_auto,w_400/"),
    medium: url.replace("/upload/", "/upload/q_auto:best,f_auto,w_800/"),
    large: url.replace("/upload/", "/upload/q_auto:best,f_auto,w_1200/"),
    full: url.replace("/upload/", "/upload/q_auto:best,f_auto/"),
  };
}
