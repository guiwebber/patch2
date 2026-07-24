export function autorizarAdministrador(
  req,
  res,
  next,
) {
  if (!req.usuario?.administrador) {
    return res.status(403).json({
      erro:
        "Acesso permitido somente para administradores.",
    });
  }

  next();
}
