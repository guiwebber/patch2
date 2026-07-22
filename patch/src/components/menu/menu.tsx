import { useState } from "react";
import { Menu, X, Search, User, Heart } from "lucide-react";
import { useNavigate } from "react-router-dom";
import "./menu.css";
function MenuBar() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  return (
    <header>
      <div className="container">
        <div className="logo">PatchWork</div>

        <div className="rightSide">
          <nav>
            <a href="">Home</a>
            <a href="">Produtos</a>
            <a href="">Categorias</a>
            <a href="">Novidades</a>
            <a href="">Sobre Nós</a>
            <a href="">Contato</a>
          </nav>

          <div className="icons">
            <Search className="icon" />

            <Heart className="icon" />
            <User className="icon" onClick={() => navigate("/login")} />
          </div>
        </div>

        <div className="menuButton" onClick={() => setOpen(!open)}>
          {open ? <X size={30} /> : <Menu size={30} />}
        </div>
      </div>

      {open && (
        <div className="mobileMenu">
          <a href="">Home</a>
          <a href="">Produtos</a>
          <a href="">Categorias</a>
          <a href="">Novidades</a>
          <a href="">Sobre Nós</a>
          <a href="">Contato</a>
        </div>
      )}
    </header>
  );
}

export default MenuBar;
