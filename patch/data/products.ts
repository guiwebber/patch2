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
    peso: 0.6,
    altura: 8,
    largura: 35,
    comprimento: 35,
    producaoMinDias: 5,
    producaoMaxDias: 8,
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
    peso: 0.2,
    altura: 4,
    largura: 25,
    comprimento: 30,
    producaoMinDias: 3,
    producaoMaxDias: 5,
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
    peso: 0.7,
    altura: 8,
    largura: 32,
    comprimento: 42,
    producaoMinDias: 5,
    producaoMaxDias: 8,
  },
  {
    id: 4,
    name: "Almofada Patchwork",
    category: "Decoração",
    description:
      "Capa de almofada artesanal com combinação de tecidos.",
    price: 54.9,
    image:
      "https://images.unsplash.com/photo-1584100936595-c0654b55a2e2?auto=format&fit=crop&w=900&q=80",
    featured: true,
    peso: 0.5,
    altura: 12,
    largura: 40,
    comprimento: 40,
    producaoMinDias: 5,
    producaoMaxDias: 9,
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
    peso: 0.9,
    altura: 12,
    largura: 32,
    comprimento: 40,
    producaoMinDias: 7,
    producaoMaxDias: 12,
  },
  {
    id: 6,
    name: "Necessaire Floral",
    category: "Bolsas",
    description:
      "Necessaire compacta com forro interno e fechamento em zíper.",
    price: 44.9,
    oldPrice: 52.9,
    image:
      "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=900&q=80",
    peso: 0.25,
    altura: 8,
    largura: 15,
    comprimento: 24,
    producaoMinDias: 4,
    producaoMaxDias: 6,
  },
  {
    id: 7,
    name: "Coelho Decorativo",
    category: "Páscoa",
    description:
      "Coelho decorativo artesanal para mesas, estantes e cestas.",
    price: 64.9,
    image:
      "https://images.unsplash.com/photo-1524498250077-390f9e378fc0?auto=format&fit=crop&w=900&q=80",
    featured: true,
    peso: 0.45,
    altura: 28,
    largura: 16,
    comprimento: 18,
    producaoMinDias: 5,
    producaoMaxDias: 8,
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
    peso: 0.65,
    altura: 8,
    largura: 20,
    comprimento: 45,
    producaoMinDias: 6,
    producaoMaxDias: 10,
  },
  {
    id: 9,
    name: "Enfeite de Natal",
    category: "Natal",
    description:
      "Enfeite natalino artesanal feito com tecidos temáticos.",
    price: 0.14,
    image:
      "https://images.unsplash.com/photo-1482638591678-a11589a805f2?auto=format&fit=crop&w=900&q=80",
    peso: 0.15,
    altura: 5,
    largura: 15,
    comprimento: 18,
    producaoMinDias: 3,
    producaoMaxDias: 5,
  },
  {
    id: 10,
    name: "Jogo de Banheiro",
    category: "Banheiro",
    description:
      "Conjunto decorativo com detalhes em tecido e acabamento artesanal.",
    price: 0.11,
    oldPrice: 149.9,
    image:
      "https://images.unsplash.com/photo-1620626011761-996317b8d101?auto=format&fit=crop&w=900&q=80",
    peso: 1.2,
    altura: 14,
    largura: 38,
    comprimento: 45,
    producaoMinDias: 8,
    producaoMaxDias: 14,
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
