// Runs before `vite dev` and `vite build` (predev/prebuild hooks); writes public/sitemap.xml.

import { writeFileSync } from "fs";
import { resolve } from "path";

const BASE_URL = "https://fiscal-explorer-bharat.lovable.app";

interface SitemapEntry {
  path: string;
  lastmod?: string;
  changefreq?: "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never";
  priority?: string;
}

const today = new Date().toISOString().slice(0, 10);

const entries: SitemapEntry[] = [
  { path: "/", lastmod: today, changefreq: "weekly", priority: "1.0" },
  { path: "/explorer", lastmod: today, changefreq: "weekly", priority: "0.9" },
  { path: "/findings", lastmod: today, changefreq: "weekly", priority: "0.8" },
  { path: "/methodology", lastmod: today, changefreq: "monthly", priority: "0.7" },
  { path: "/about", lastmod: today, changefreq: "monthly", priority: "0.6" },
  { path: "/builder", lastmod: today, changefreq: "weekly", priority: "0.7" },
  { path: "/explorer/ministry/magri", lastmod: today, changefreq: "monthly", priority: "0.6" },
  { path: "/explorer/ministry/agriculture", lastmod: today, changefreq: "monthly", priority: "0.6" },
  { path: "/agri-journey", lastmod: today, changefreq: "monthly", priority: "0.6" },
];

function generateSitemap(entries: SitemapEntry[]) {
  const urls = entries.map((e) =>
    [
      `  <url>`,
      `    <loc>${BASE_URL}${e.path}</loc>`,
      e.lastmod ? `    <lastmod>${e.lastmod}</lastmod>` : null,
      e.changefreq ? `    <changefreq>${e.changefreq}</changefreq>` : null,
      e.priority ? `    <priority>${e.priority}</priority>` : null,
      `  </url>`,
    ]
      .filter(Boolean)
      .join("\n"),
  );

  return [
    `<?xml version="1.0" encoding="UTF-8"?>`,
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`,
    ...urls,
    `</urlset>`,
  ].join("\n");
}

writeFileSync(resolve("public/sitemap.xml"), generateSitemap(entries));
console.log(`sitemap.xml written (${entries.length} entries)`);
