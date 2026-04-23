import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/admin/",
          "/dashboard/",
          "/api/",
          "/auth/",
          "/login",
          "/register/",
          "/unlock",
          "/kunde/",
        ],
      },
      // Block bad bots explicitly
      {
        userAgent: [
          "Scrapy",
          "AhrefsBot",
          "SemrushBot",
          "MJ12bot",
          "DotBot",
          "BLEXBot",
          "PetalBot",
          "Bytespider",
          "GPTBot",
          "CCBot",
          "DataForSeoBot",
        ],
        disallow: "/",
      },
    ],
    sitemap: "https://redlightad.com/sitemap.xml",
  };
}
