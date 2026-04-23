/**
 * Image Protection Utilities
 * Prevents easy scraping and theft of images
 */

/**
 * Generate a Cloudinary URL with watermark overlay
 * This adds a semi-transparent watermark to all images
 */
export function getProtectedImageUrl(
  originalUrl: string,
  options?: {
    watermarkText?: string;
    watermarkOpacity?: number;
    preventRightClick?: boolean;
  }
): string {
  const {
    watermarkText = "RedLightAD",
    watermarkOpacity = 30,
  } = options || {};

  // If it's already a Cloudinary URL, add watermark transformation
  if (originalUrl.includes("res.cloudinary.com")) {
    // Insert watermark transformation before /upload/
    const parts = originalUrl.split("/upload/");
    if (parts.length === 2) {
      // l_text: adds text overlay
      // o_XX: opacity percentage
      // g_south_east: gravity (position)
      const watermarkTransform = `l_text:Arial_20_bold:${encodeURIComponent(watermarkText)},o_${watermarkOpacity},g_south_east,x_10,y_10`;
      return `${parts[0]}/upload/${watermarkTransform}/${parts[1]}`;
    }
  }

  return originalUrl;
}

/**
 * Generate a blurred preview URL (for locked content)
 */
export function getBlurredImageUrl(originalUrl: string): string {
  if (originalUrl.includes("res.cloudinary.com")) {
    const parts = originalUrl.split("/upload/");
    if (parts.length === 2) {
      // e_blur:1000 creates a strong blur effect
      const blurTransform = "e_blur:1000,q_auto:low";
      return `${parts[0]}/upload/${blurTransform}/${parts[1]}`;
    }
  }
  return originalUrl;
}

/**
 * Generate low-quality preview (for public listings)
 */
export function getLowQualityPreviewUrl(originalUrl: string): string {
  if (originalUrl.includes("res.cloudinary.com")) {
    const parts = originalUrl.split("/upload/");
    if (parts.length === 2) {
      // q_auto:low reduces quality significantly
      // w_400 limits width
      const previewTransform = "q_auto:low,w_400,f_auto";
      return `${parts[0]}/upload/${previewTransform}/${parts[1]}`;
    }
  }
  return originalUrl;
}

/**
 * CSS styles to prevent easy image saving
 * Note: Determined users can still save, but this deters casual theft
 */
export const imageProtectionStyles = `
  /* Prevent right-click context menu on images */
  .protected-image {
    pointer-events: none;
    user-select: none;
    -webkit-user-select: none;
    -webkit-touch-callout: none;
  }

  /* Overlay to prevent drag-and-drop saving */
  .image-container {
    position: relative;
  }

  .image-container::after {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: transparent;
    pointer-events: auto;
  }
`;

/**
 * Client-side script to disable right-click on images
 */
export const imageProtectionScript = `
  // Disable right-click on protected images
  document.addEventListener('contextmenu', function(e) {
    if (e.target.classList.contains('protected-image') || 
        e.target.closest('.protected-image')) {
      e.preventDefault();
      return false;
    }
  });

  // Disable drag on protected images
  document.addEventListener('dragstart', function(e) {
    if (e.target.classList.contains('protected-image') ||
        e.target.closest('.protected-image')) {
      e.preventDefault();
      return false;
    }
  });
`;
