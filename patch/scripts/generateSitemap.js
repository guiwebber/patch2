import { createClient } from "@supabase/supabase-js";
import { writeFileSync } from "fs";

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

const { data: produtos } = await supabase
  .from("produtos")
  .select("id,nome")
  .eq("ativo", true);

const urls = [
  {
    loc: "https://soniaferraz.com/",
    changefreq: "weekly",
    priority: "1.0",
  },
  {
    loc: "https://soniaferraz.com/sobre",
    changefreq: "monthly",
    priority: "0.7",
  },
];

for (const produto of produtos ?? []) {
  const slug = produto.nome
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

  urls.push({
    loc: `https://soniaferraz.com/produtos/${produto.id}/${slug}`,
    changefreq: "weekly",
    priority: "0.9",
  });
}

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map(
    (u) => `
<url>
<loc>${u.loc}</loc>
<changefreq>${u.changefreq}</changefreq>
<priority>${u.priority}</priority>
</url>`
  )
  .join("")}
</urlset>`;

writeFileSync("./public/sitemap.xml", xml);

console.log("Sitemap gerado.");