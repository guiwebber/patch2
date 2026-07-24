import {
  Clock3,
  Mail,
  MapPin,
  Phone,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import Logo from "../../assets/logo.png";
import "./footer.css";

export default function Footer() {
  const navigate = useNavigate();

  function goToProducts() {
    navigate("/");

    window.setTimeout(() => {
      document
        .getElementById("produtos")
        ?.scrollIntoView({
          behavior: "smooth",
        });
    }, 100);
  }

  return (
    <footer className="site-footer" id="contato">
      <div className="footer-content">
        <div className="footer-brand">
          <button
            type="button"
            onClick={() => navigate("/")}
          >
            <img className="footer-logo" src={Logo} alt="PatchWork" />
          </button>

          <p>
            Peças artesanais feitas com carinho para
            deixar sua casa mais bonita e acolhedora.
          </p>
        </div>

        <div className="footer-column">
          <h3>Navegação</h3>

          <button
            type="button"
            onClick={() => navigate("/")}
          >
            Home
          </button>

          <button type="button" onClick={goToProducts}>
            Produtos
          </button>

          <button
            type="button"
            onClick={() => navigate("/sobre")}
          >
            Sobre Nós
          </button>
        </div>

        <div className="footer-column">
          <h3>Contato</h3>

          <a href="tel:+5554999999999">
            <Phone size={18} />
            (54) 99999-9999
          </a>

          <a href="mailto:contato@patchwork.com.br">
            <Mail size={18} />
            contato@patchwork.com.br
          </a>

        </div>

        <div className="footer-column">
          <h3>Atendimento</h3>

          <p>
            <MapPin size={18} />
            Rio Grande do Sul, Brasil
          </p>

          <p>
            <Clock3 size={18} />
            Segunda a sexta, das 9h às 18h
          </p>
        </div>
      </div>

      <div className="footer-bottom">
        <span>
          © {new Date().getFullYear()} PatchWork. Todos
          os direitos reservados.
        </span>
      </div>
    </footer>
  );
}
