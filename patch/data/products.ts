import type { Product } from "../types/product";

export const products: Product[] = [
  {
    id: 1,
    name: "Guirlanda Floral",
    category: "Guirlandas",
    description:
      "Guirlanda artesanal em tecido, com detalhes florais e acabamento delicado.",
    price: 89.9,
    oldPrice: 109.9,
    image:
      "https://images.unsplash.com/photo-1518709594023-6eab9bab7b23?auto=format&fit=crop&w=900&q=80",
    featured: true,
  },
  {
    id: 2,
    name: "Pano de Prato Bordado",
    category: "Cozinha",
    description:
      "Pano de prato artesanal com barra em patchwork e bordado decorativo.",
    price: 34.9,
    image:
      "https://images.unsplash.com/photo-1556911220-bff31c812dba?auto=format&fit=crop&w=900&q=80",
  },
  {
    id: 3,
    name: "Kit Americano Floral",
    category: "Cozinha",
    description:
      "Kit com quatro lugares americanos produzidos em tecido estampado.",
    price: 79.9,
    oldPrice: 94.9,
    image:
      "https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e?auto=format&fit=crop&w=900&q=80",
  },
  {
    id: 4,
    name: "Almofada Patchwork",
    category: "Decoração",
    description: "Capa de almofada artesanal com combinação de tecidos.",
    price: 54.9,
    image:
      "https://images.unsplash.com/photo-1584100936595-c0654b55a2e2?auto=format&fit=crop&w=900&q=80",
    featured: true,
  },
  {
    id: 5,
    name: "Bolsa Artesanal",
    category: "Bolsas",
    description:
      "Bolsa estruturada com tecido floral, bolso interno e alças reforçadas.",
    price: 119.9,
    image:
      "https://images.unsplash.com/photo-1559563458-527698bf5295?auto=format&fit=crop&w=900&q=80",
  },
  {
    id: 6,
    name: "Necessaire Floral",
    category: "Bolsas",
    description: "Necessaire compacta com forro interno e fechamento em zíper.",
    price: 44.9,
    oldPrice: 52.9,
    image:
      "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=900&q=80",
  },
  {
    id: 7,
    name: "Coelho Decorativo",
    category: "Páscoa",
    description: "Coelho decorativo artesanal para mesas, estantes e cestas.",
    price: 64.9,
    image:
      "https://images.unsplash.com/photo-1524498250077-390f9e378fc0?auto=format&fit=crop&w=900&q=80",
    featured: true,
  },
  {
    id: 8,
    name: "Caminho de Mesa",
    category: "Decoração",
    description:
      "Caminho de mesa acolchoado com composição geométrica em patchwork.",
    price: 98.9,
    image:
      "https://images.unsplash.com/photo-1600566753051-f0b89df2dd90?auto=format&fit=crop&w=900&q=80",
  },
  {
    id: 9,
    name: "Enfeite de Natal",
    category: "Natal",
    description: "Enfeite natalino artesanal feito com tecidos temáticos.",
    price: 29.9,
    image:
      "https://images.unsplash.com/photo-1482638591678-a11589a805f2?auto=format&fit=crop&w=900&q=80",
  },
  {
    id: 10,
    name: "Jogo de Banheiro",
    category: "Banheiro",
    description:
      "Conjunto decorativo com detalhes em tecido e acabamento artesanal.",
    price: 129.9,
    oldPrice: 149.9,
    image:
      "https://images.unsplash.com/photo-1620626011761-996317b8d101?auto=format&fit=crop&w=900&q=80",
  },
];

export const categories = [
  "Todos",
  "Cozinha",
  "Decoração",
  "Bolsas",
  "Guirlandas",
  "Páscoa",
  "Natal",
  "Banheiro",
];
