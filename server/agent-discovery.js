const fs = require("fs");
const path = require("path");

const SITE_ORIGIN = (process.env.SETAD_PUBLIC_ORIGIN || "https://setad.org.br").replace(/\/$/, "");

function aceitaMarkdown(req) {
  var accept = String(req.headers.accept || "").toLowerCase();
  if (!accept) return false;
  if (accept.indexOf("text/markdown") >= 0) return true;
  if (accept.indexOf("text/x-markdown") >= 0) return true;
  return false;
}

function linkHeadersAgentes() {
  return [
    "<" + SITE_ORIGIN + "/llms.txt>; rel=\"describedby\"",
    "<" + SITE_ORIGIN + "/index.md>; rel=\"alternate\"; type=\"text/markdown\"",
    "<" + SITE_ORIGIN + "/.well-known/mcp/server-card.json>; rel=\"service-desc\"; type=\"application/json\""
  ].join(", ");
}

function registrarRotasAgentes(app, root) {
  app.get("/", function (req, res, next) {
    if (aceitaMarkdown(req)) {
      return res
        .type("text/markdown; charset=utf-8")
        .sendFile(path.join(root, "index.md"));
    }
    res.setHeader("Link", linkHeadersAgentes());
    next();
  });

  app.get("/index.html", function (req, res, next) {
    if (aceitaMarkdown(req)) {
      return res
        .type("text/markdown; charset=utf-8")
        .sendFile(path.join(root, "index.md"));
    }
    res.setHeader("Link", linkHeadersAgentes());
    next();
  });

  var mdPages = [
    { route: "/sobre.html", file: "content/sobre.md" },
    { route: "/contato.html", file: "content/contato.md" }
  ];

  mdPages.forEach(function (item) {
    app.get(item.route, function (req, res, next) {
      var mdPath = path.join(root, item.file);
      if (aceitaMarkdown(req) && fs.existsSync(mdPath)) {
        return res.type("text/markdown; charset=utf-8").sendFile(mdPath);
      }
      next();
    });
  });
}

function resolverArquivoEstatico(root, urlPath) {
  var decoded = decodeURIComponent(urlPath.split("?")[0]);
  if (!decoded || decoded === "/") return null;

  var semBarra = decoded.replace(/\/$/, "") || "/";
  var candidatos = [
    path.join(root, semBarra),
    path.join(root, semBarra + ".html"),
    path.join(root, semBarra, "index.html")
  ];

  for (var i = 0; i < candidatos.length; i++) {
    var alvo = path.normalize(candidatos[i]);
    if (!alvo.startsWith(root)) continue;
    try {
      if (fs.existsSync(alvo) && fs.statSync(alvo).isFile()) {
        return alvo;
      }
    } catch (_e) {
      /* ignorar */
    }
  }
  return null;
}

function registrarFallback404(app, root) {
  app.get("*", function (req, res, next) {
    if (req.method !== "GET" && req.method !== "HEAD") return next();
    if (req.path.startsWith("/api/")) return next();

    var arquivo = resolverArquivoEstatico(root, req.path);
    if (arquivo) {
      return res.sendFile(arquivo);
    }

    res.status(404);
    res.setHeader("Cache-Control", "no-store");
    if (req.method === "HEAD") {
      return res.end();
    }
    res.sendFile(path.join(root, "404.html"));
  });
}

module.exports = {
  registrarRotasAgentes: registrarRotasAgentes,
  registrarFallback404: registrarFallback404,
  linkHeadersAgentes: linkHeadersAgentes
};
