import multer from "multer";

const TIPOS_PERMITIDOS = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/avif",
]);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    files: 10,
    fileSize: 8 * 1024 * 1024,
  },
  fileFilter(req, file, callback) {
    if (!TIPOS_PERMITIDOS.has(file.mimetype)) {
      callback(
        new Error(
          "Formato inválido. Envie JPG, PNG, WEBP, GIF ou AVIF.",
        ),
      );
      return;
    }

    callback(null, true);
  },
});

export function receberImagensProduto(
  req,
  res,
  next,
) {
  upload.array("imagens", 10)(
    req,
    res,
    (error) => {
      if (!error) {
        next();
        return;
      }

      if (
        error instanceof multer.MulterError
      ) {
        if (error.code === "LIMIT_FILE_SIZE") {
          return res.status(400).json({
            erro:
              "Cada imagem pode ter no máximo 8 MB.",
          });
        }

        if (error.code === "LIMIT_FILE_COUNT") {
          return res.status(400).json({
            erro:
              "Envie no máximo 10 imagens por vez.",
          });
        }
      }

      return res.status(400).json({
        erro:
          error?.message ||
          "Não foi possível receber as imagens.",
      });
    },
  );
}
