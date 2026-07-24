export const produtos = [
  {
    id: 1,
    nome: "Guirlanda Floral",
    categoria: "Guirlandas",
    preco: 89.9,
    imagem:
      "https://images.unsplash.com/photo-1518709594023-6eab9bab7b23?auto=format&fit=crop&w=900&q=80",
    peso: 0.6,
    altura: 8,
    largura: 35,
    comprimento: 35,
  },
  {
    id: 2,
    nome: "Pano de Prato Bordado",
    categoria: "Cozinha",
    preco: 34.9,
    imagem:
      "https://images.unsplash.com/photo-1556911220-bff31c812dba?auto=format&fit=crop&w=900&q=80",
    peso: 0.2,
    altura: 4,
    largura: 25,
    comprimento: 30,
  },
  {
    id: 3,
    nome: "Kit Americano Floral",
    categoria: "Cozinha",
    preco: 79.9,
    imagem:
      "https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e?auto=format&fit=crop&w=900&q=80",
    peso: 0.7,
    altura: 8,
    largura: 32,
    comprimento: 42,
  },
  {
    id: 4,
    nome: "Almofada Patchwork",
    categoria: "Decoração",
    preco: 54.9,
    imagem:
      "https://images.unsplash.com/photo-1584100936595-c0654b55a2e2?auto=format&fit=crop&w=900&q=80",
    peso: 0.5,
    altura: 12,
    largura: 40,
    comprimento: 40,
  },
  {
    id: 5,
    nome: "Bolsa Artesanal",
    categoria: "Bolsas",
    preco: 119.9,
    imagem:
      "https://images.unsplash.com/photo-1559563458-527698bf5295?auto=format&fit=crop&w=900&q=80",
    peso: 0.9,
    altura: 12,
    largura: 32,
    comprimento: 40,
  },
  {
    id: 6,
    nome: "Necessaire Floral",
    categoria: "Bolsas",
    preco: 44.9,
    imagem:
      "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=900&q=80",
    peso: 0.25,
    altura: 8,
    largura: 15,
    comprimento: 24,
  },
  {
    id: 7,
    nome: "Coelho Decorativo",
    categoria: "Páscoa",
    preco: 0.11,
    imagem:
      "https://images.unsplash.com/photo-1524498250077-390f9e378fc0?auto=format&fit=crop&w=900&q=80",
    peso: 0.45,
    altura: 28,
    largura: 16,
    comprimento: 18,
  },
  {
    id: 8,
    nome: "Caminho de Mesa",
    categoria: "Decoração",
    preco: 0.1,
    imagem:
      "https://images.unsplash.com/photo-1600566753051-f0b89df2dd90?auto=format&fit=crop&w=900&q=80",
    peso: 0.65,
    altura: 8,
    largura: 20,
    comprimento: 45,
  },
  {
    id: 9,
    nome: "Enfeite de Natal",
    categoria: "Natal",
    preco: 0.11,
    imagem:
      "https://images.unsplash.com/photo-1482638591678-a11589a805f2?auto=format&fit=crop&w=900&q=80",
    peso: 0.15,
    altura: 5,
    largura: 15,
    comprimento: 18,
  },
  {
    id: 10,
    nome: "Jogo de Banheiro",
    categoria: "Banheiro",
    preco: 0.11,
    imagem:
      "https://images.unsplash.com/photo-1620626011761-996317b8d101?auto=format&fit=crop&w=900&q=80",
    peso: 1.2,
    altura: 14,
    largura: 38,
    comprimento: 45,
  },
];

export function buscarProduto(produtoId) {
  return produtos.find(
    (produto) => produto.id === Number(produtoId),
  );
}
