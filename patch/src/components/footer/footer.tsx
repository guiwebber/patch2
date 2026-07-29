import {
  Clock3,
  Instagram,
  Mail,
  MapPin,
  Phone,
} from "lucide-react";
import {
  useLocation,
  useNavigate,
} from "react-router-dom";

import Logo from "../../assets/logo.png";

import "./footer.css";

export default function Footer() {
  const navigate = useNavigate();
  const location = useLocation();

  const currentYear =
    new Date().getFullYear();

  function goToHome() {
    if (location.pathname === "/") {
      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });

      return;
    }

    navigate("/");

    window.setTimeout(() => {
      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    }, 100);
  }

  function goToProducts() {
    if (location.pathname !== "/") {
      navigate("/");
    }

    window.setTimeout(() => {
      document
        .getElementById("produtos")
        ?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
    }, 150);
  }

  function goToAbout() {
    navigate("/sobre");

    window.setTimeout(() => {
      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    }, 100);
  }

  return (
    <footer
      className="site-footer"
      id="contato"
    >
      <div className="footer-content">
        <section className="footer-brand">
          <button
            type="button"
            className="footer-logo-button"
            onClick={goToHome}
            aria-label="Ir para o início"
          >
            <img
              className="footer-logo"
              src={Logo}
              alt="Sonia Ferraz — Arte em Tecidos"
            />
          </button>

          <p>
            Peças artesanais feitas com carinho,
            cuidado e atenção aos detalhes para
            deixar sua casa ainda mais bonita e
            acolhedora.
          </p>

          <span className="footer-brand-detail">
            Arte em tecidos feita à mão
          </span>
        </section>

        <nav
          className="footer-column"
          aria-label="Navegação do rodapé"
        >
          <h3>Navegação</h3>

          <button
            type="button"
            onClick={goToHome}
          >
            Home
          </button>

          <button
            type="button"
            onClick={goToProducts}
          >
            Produtos
          </button>

          <button
            type="button"
            onClick={goToAbout}
          >
            Sobre nós
          </button>
        </nav>

        <section className="footer-column">
          <h3>Contato</h3>

          <a
            className="footer-contact-link"
            href="tel:+5554991781286"
            aria-label="Ligar para Sonia Ferraz"
          >
            <span className="footer-icon">
              <Phone size={17} />
            </span>

            <span>
              <small>Telefone</small>
              (54) 99178-1286
            </span>
          </a>

          <a
            className="footer-contact-link"
            href="mailto:contato@patchwork.com.br"
            aria-label="Enviar e-mail para Sonia Ferraz"
          >
            <span className="footer-icon">
              <Mail size={17} />
            </span>

            <span>
              <small>E-mail</small>
              contato@patchwork.com.br
            </span>
          </a>

          <a
            className="footer-contact-link"
            href="https://www.instagram.com/SEU_USUARIO"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Instagram da Sonia Ferraz"
          >
            <span className="footer-icon">
              <Instagram size={17} />
            </span>

            <span>
              <small>Instagram</small>
              @SEU_USUARIO
            </span>
          </a>
        </section>

        <section className="footer-column">
          <h3>Atendimento</h3>

          <div className="footer-info-item">
            <span className="footer-icon">
              <MapPin size={17} />
            </span>

            <span>
              <small>Localização</small>
              Getúlio Vargas, Rio Grande do Sul,
              Brasil
            </span>
          </div>

          <div className="footer-info-item">
            <span className="footer-icon">
              <Clock3 size={17} />
            </span>

            <span>
              <small>Horário</small>
              Segunda a sexta, das 8h às 18h
            </span>
          </div>
        </section>
      </div>

      <div className="footer-bottom">
        <span>
          © {currentYear} Sonia Ferraz — Arte em
          Tecidos. Todos os direitos reservados.
        </span>
      </div>
    </footer>
  );
}