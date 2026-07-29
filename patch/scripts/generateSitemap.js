import { createClient } from "@supabase/supabase-js";
import { writeFileSync } from "node:fs";
import { loadEnv } from "vite";

const env = loadEnv("production", process.cwd(), "");

const supabaseUrl = env.VITE_SUPABASE_URL;
const supabaseAnonKey = env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error(
    "Não encontrei VITE_SUPABASE_URL ou VITE_SUPABASE_ANON_KEY no arquivo .env"
  );
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

const { data: produtos, error } = await supabase
  .from("produtos")
  .select("id,nome")
  .eq("ativo", true);

if (error) {
  console.error("Erro ao buscar produtos:", error.message);
  process.exit(1);
}

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
    (url) => `  <url>
    <loc>${url.loc}</loc>
    <changefreq>${url.changefreq}</changefreq>
    <priority>${url.priority}</priority>
  </url>`
  )
  .join("\n")}
</urlset>
`;

writeFileSync("./public/sitemap.xml", xml, "utf8");

console.log(`${produtos?.length ?? 0} produtos encontrados.`);
console.log("Sitemap gerado em public/sitemap.xml.");