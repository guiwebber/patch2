import cachorro from "../assets/avatars/cachorro.png";
import coala from "../assets/avatars/coala.png";
import gato from "../assets/avatars/gato.png";
import girafa from "../assets/avatars/girafa.png";
import porco from "../assets/avatars/porco.png";
import urso from "../assets/avatars/urso.png";
import raposa from "../assets/avatars/raposa.png";
import panda from "../assets/avatars/panda.png";
import guaxinim from "../assets/avatars/guaxinim.png";
import leao from "../assets/avatars/leao.png";
import preguica from "../assets/avatars/preguica.png";
import coelho from "../assets/avatars/coelho.png";

const avatares = [
  cachorro,
  coala,
  gato,
  girafa,
  porco,
  urso,
  raposa,
  panda,
  guaxinim,
  leao,
  preguica,
  coelho,
];

export function avatarPadrao(usuarioId?: number, email?: string) {
  const texto = `${usuarioId ?? ""}${email ?? ""}`;

  let hash = 0;

  for (let i = 0; i < texto.length; i++) {
    hash = texto.charCodeAt(i) + ((hash << 5) - hash);
  }

  return avatares[Math.abs(hash) % avatares.length];
}