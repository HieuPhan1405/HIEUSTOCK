const GOC = "https://www.cloudstock.id.vn";

export default function robots() {
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/api/", "/quan-tri"] },
    sitemap: `${GOC}/sitemap.xml`,
  };
}
