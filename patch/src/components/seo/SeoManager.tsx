import { useEffect } from "react";
import { useLocation } from "react-router-dom";

const SITE_URL = "https://soniaferraz.com";
const DEFAULT_IMAGE = `${SITE_URL}/og-image.png`;

type SeoConfig = {
  title: string;
  description: string;
  path: string;
  robots?: string;
};

const seoByPath: Record<string, SeoConfig> = {
  "/": {
    title: "Sonia Ferraz | Patchwork e peças artesanais",
    description:
      "Peças artesanais em patchwork feitas sob encomenda em Getúlio Vargas, RS. Decoração em tecido produzida com carinho e atenção aos detalhes.",
    path: "/",
  },
  "/sobre": {
    title: "Sobre a Sonia Ferraz | Arte em tecidos",
    description:
      "Conheça a história da Sonia Ferraz, seu trabalho com patchwork, costura criativa e peças artesanais feitas à mão.",
    path: "/sobre",
  },
  "/login": {
    title: "Entrar | Sonia Ferraz",
    description: "Acesse sua conta para acompanhar pedidos e continuar suas compras.",
    path: "/login",
    robots: "noindex, nofollow",
  },
  "/signup": {
    title: "Criar conta | Sonia Ferraz",
    description: "Crie sua conta na loja Sonia Ferraz.",
    path: "/signup",
    robots: "noindex, nofollow",
  },
  "/minha-conta": {
    title: "Minha conta | Sonia Ferraz",
    description: "Gerencie seus dados e endereços.",
    path: "/minha-conta",
    robots: "noindex, nofollow",
  },
  "/meus-pedidos": {
    title: "Meus pedidos | Sonia Ferraz",
    description: "Acompanhe seus pedidos.",
    path: "/meus-pedidos",
    robots: "noindex, nofollow",
  },
  "/checkout": {
    title: "Finalizar compra | Sonia Ferraz",
    description: "Finalize sua compra com segurança.",
    path: "/checkout",
    robots: "noindex, nofollow",
  },
  "/admin": {
    title: "Painel administrativo | Sonia Ferraz",
    description: "Área administrativa.",
    path: "/admin",
    robots: "noindex, nofollow",
  },
  "/admin/produtos": {
    title: "Gerenciar produtos | Sonia Ferraz",
    description: "Área administrativa de produtos.",
    path: "/admin/produtos",
    robots: "noindex, nofollow",
  },
};

function setMeta(name: string, content: string) {
  let el = document.head.querySelector<HTMLMetaElement>(`meta[name="${name}"]`);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute("name", name);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
}

function setProperty(property: string, content: string) {
  let el = document.head.querySelector<HTMLMetaElement>(
    `meta[property="${property}"]`,
  );
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute("property", property);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
}

function setCanonical(url: string) {
  let el = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
  if (!el) {
    el = document.createElement("link");
    el.setAttribute("rel", "canonical");
    document.head.appendChild(el);
  }
  el.setAttribute("href", url);
}

function setStructuredData() {
  const id = "sonia-ferraz-structured-data";
  document.getElementById(id)?.remove();

  const script = document.createElement("script");
  script.id = id;
  script.type = "application/ld+json";
  script.textContent = JSON.stringify({
    "@context": "https://schema.org",
    "@type": "Store",
    name: "Sonia Ferraz",
    url: SITE_URL,
    image: DEFAULT_IMAGE,
    logo: `${SITE_URL}/favicon.svg`,
    description:
      "Peças artesanais em patchwork e decoração em tecido feitas sob encomenda.",
    telephone: "+55 54 99178-1286",
    email: "sonia.ferraz28@gmail.com",
    address: {
      "@type": "PostalAddress",
      addressLocality: "Getúlio Vargas",
      addressRegion: "RS",
      addressCountry: "BR",
    },
    sameAs: ["https://www.instagram.com/sonia_ferraz/"],
  });

  document.head.appendChild(script);
}

export default function SeoManager() {
  const location = useLocation();

  useEffect(() => {
    const config = seoByPath[location.pathname] ?? {
      title: "Página não encontrada | Sonia Ferraz",
      description: "A página solicitada não foi encontrada.",
      path: location.pathname,
      robots: "noindex, nofollow",
    };

    const canonicalUrl = `${SITE_URL}${config.path}`;

    document.title = config.title;
    setMeta("description", config.description);
    setMeta("robots", config.robots ?? "index, follow, max-image-preview:large");
    setCanonical(canonicalUrl);

    setProperty("og:type", "website");
    setProperty("og:locale", "pt_BR");
    setProperty("og:site_name", "Sonia Ferraz");
    setProperty("og:title", config.title);
    setProperty("og:description", config.description);
    setProperty("og:url", canonicalUrl);
    setProperty("og:image", DEFAULT_IMAGE);
    setProperty("og:image:alt", "Sonia Ferraz — arte em tecidos e patchwork");

    setMeta("twitter:card", "summary_large_image");
    setMeta("twitter:title", config.title);
    setMeta("twitter:description", config.description);
    setMeta("twitter:image", DEFAULT_IMAGE);

    setStructuredData();
  }, [location.pathname]);

  return null;
}
