import { HeartHandshake, PackageCheck, Scissors, Sparkles } from "lucide-react";

import "./about.css";

export default function About() {
  return (
    <main className="about-page">
      <section className="about-hero">
        <img
          src="/about2.png"
          alt="Ateliê Sonia Ferraz"
          className="about-hero-image"
        />

        <div className="about-hero-overlay"></div>

        <div className="about-hero-content">
          <span>Sobre o ateliê</span>

          <h1>Artes que transformam tecido em afeto</h1>

          <p>
            Nosso ateliê nasceu da vontade de criar peças que deixem a casa mais
            acolhedora, bonita e cheia de personalidade.
          </p>
        </div>
      </section>

      <section className="about-story">
        <div className="about-story-image" />

        <div className="about-story-content">
          <span className="about-label">Nossa história</span>

          <h2>Quem somos</h2>

          <p>
            Somos um ateliê apaixonado por patchwork, costura criativa e
            decoração artesanal. Cada produto é planejado com atenção, desde a
            escolha dos tecidos até o acabamento final.
          </p>

          <p>
            Nosso trabalho une técnicas tradicionais a ideias modernas para
            produzir peças úteis, delicadas e únicas. Acreditamos que objetos
            feitos à mão carregam histórias e tornam cada ambiente mais
            especial.
          </p>
        </div>
      </section>

      <section className="about-values">
        <div className="about-section-header">
          <span className="about-label">O que nos move</span>
          <h2>Nossos valores</h2>
        </div>

        <div className="about-values-grid">
          <article>
            <Scissors size={30} />
            <h3>Produção artesanal</h3>
            <p>
              Cada peça passa por um processo cuidadoso e recebe atenção em
              todos os detalhes.
            </p>
          </article>

          <article>
            <Sparkles size={30} />
            <h3>Originalidade</h3>
            <p>
              Criamos combinações de cores, estampas e acabamentos para oferecer
              produtos especiais.
            </p>
          </article>

          <article>
            <HeartHandshake size={30} />
            <h3>Atendimento próximo</h3>
            <p>
              Gostamos de ouvir cada cliente e acompanhar sua experiência do
              pedido à entrega.
            </p>
          </article>

          <article>
            <PackageCheck size={30} />
            <h3>Cuidado na entrega</h3>
            <p>
              Preparamos cada pedido com carinho para que ele chegue protegido e
              pronto para encantar.
            </p>
          </article>
        </div>
      </section>
    </main>
  );
}
