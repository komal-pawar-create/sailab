// Generates the public sitemap before Vite dev/build runs.

import { mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { blogPosts } from "../src/lib/blogData";

const BASE_URL = "https://labflow.mywebz.in";
const TODAY = new Date().toISOString().slice(0, 10);

type ChangeFrequency =
  | "always"
  | "hourly"
  | "daily"
  | "weekly"
  | "monthly"
  | "yearly"
  | "never";

interface SitemapEntry {
  path: string;
  lastmod?: string;
  changefreq: ChangeFrequency;
  priority: string;
}

const publicRoutes: SitemapEntry[] = [
  { path: "/", lastmod: TODAY, changefreq: "weekly", priority: "1.0" },
  { path: "/product-tour", lastmod: TODAY, changefreq: "weekly", priority: "0.9" },
  { path: "/blog", lastmod: TODAY, changefreq: "weekly", priority: "0.9" },
  { path: "/auth", lastmod: TODAY, changefreq: "monthly", priority: "0.7" },
  { path: "/feedback", lastmod: TODAY, changefreq: "weekly", priority: "0.6" },
  { path: "/privacy-policy", lastmod: TODAY, changefreq: "monthly", priority: "0.5" },
  { path: "/terms-of-service", lastmod: TODAY, changefreq: "monthly", priority: "0.5" },
  { path: "/refund-policy", lastmod: TODAY, changefreq: "monthly", priority: "0.5" },
  { path: "/forgot-password", lastmod: TODAY, changefreq: "monthly", priority: "0.4" },
];

const blogRoutes: SitemapEntry[] = blogPosts.map((post) => ({
  path: `/blog/${post.slug}`,
  lastmod: post.dateModified || post.datePublished,
  changefreq: "monthly",
  priority: "0.8",
}));

const entries = [...publicRoutes, ...blogRoutes];

const escapeXml = (value: string) =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");

const urls = entries.map((entry) =>
  [
    "  <url>",
    `    <loc>${escapeXml(`${BASE_URL}${entry.path}`)}</loc>`,
    entry.lastmod ? `    <lastmod>${entry.lastmod}</lastmod>` : null,
    `    <changefreq>${entry.changefreq}</changefreq>`,
    `    <priority>${entry.priority}</priority>`,
    "  </url>",
  ]
    .filter((line): line is string => Boolean(line))
    .join("\n"),
);

const sitemap = [
  '<?xml version="1.0" encoding="UTF-8"?>',
  '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
  ...urls,
  "</urlset>",
  "",
].join("\n");

const outputDirectory = resolve("public");
mkdirSync(outputDirectory, { recursive: true });
writeFileSync(resolve(outputDirectory, "sitemap.xml"), sitemap, "utf8");

console.log(
  `sitemap.xml written (${publicRoutes.length} public routes, ${blogRoutes.length} blog posts)`,
);