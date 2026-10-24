import express from "express";
import path from "path";
import fs from "fs";
import {
  PORT,
  HOST,
  NOME_SERVIDOR,
  IS_PRODUCAO,
} from "./configuracao/variaveis";
import { iniciarBancoDeDados, pool } from "./banco.dados";
import rotasBackend from "./rotas.backend";
import rotasAdm, { rotasAdmUsuario, rotasAdmArrecadacao, rotasAdmDivulgacoes, rotasAdmRankingCampanhas, rotasAdmRankings, rotasAdmSaldo } from "./rotas/rotas.adm";
import { ServidorControle } from "./controles/c.servidor";

import { LoggerInformativo, extrairIp } from "./servicos/s.comunicacao";

const app = express();

app.use(express.json({ limit: "25mb" }));
app.use(express.urlencoded({ extended: true, limit: "25mb" }));

// Middleware de registro informativo de requisições e eventos HTTP reais
app.use((req, res, next) => {
  if (
    req.path.startsWith("/@") ||
    req.path.startsWith("/node_modules") ||
    (req.path.includes(".") && !req.path.startsWith("/api"))
  ) {
    return next();
  }
  const inicio = Date.now();
  const clientIp = extrairIp(req);

  res.on("finish", () => {
    // Se o controller específico já realizou o log detalhado, evita duplicidade
    if (res.locals._logRegistrado) {
      return;
    }

    const duracao = Date.now() - inicio;
    const metodo = req.method;
    const rota = req.originalUrl || req.url;

    if (res.statusCode >= 400) {
      const motivo =
        res.statusCode === 401
          ? "Chave secreta inválida"
          : res.statusCode === 403
          ? "Acesso não autorizado"
          : res.statusCode === 404
          ? "Rota não encontrada"
          : "Falha na requisição";

      LoggerInformativo.requisicaoBloqueada(metodo, rota, motivo, res.statusCode, clientIp, duracao);
    } else if (
      req.path.startsWith("/api") ||
      req.path.startsWith("/adm") ||
      req.path.startsWith("/admin") ||
      req.path.startsWith("/webhook")
    ) {
      LoggerInformativo.requisicaoPermitida(metodo, rota, "Requisição atendida", res.statusCode, clientIp, duracao);
    }
  });
  next();
});

// Retorna JSON apenas quando explicitamente solicitado por clientes de API
app.get("/", (req, res, next) => {
  const querJson =
    req.query.json === "true" ||
    (req.headers.accept?.includes("application/json") &&
      !req.headers.accept?.includes("text/html"));

  if (querJson) {
    return ServidorControle.obterStatusServidor(req, res);
  }
  next();
});

// Otimização de Desempenho: Carregamento instantâneo com tempo de resposta de 0 ms (stale-while-revalidate)
app.use("/api", (req, res, next) => {
  if (req.method === "GET") {
    res.setHeader("Cache-Control", "public, max-age=0, stale-while-revalidate=120");
  }
  next();
});

// Todas as rotas de API do backend (campanhas, publicações, usuário, banco, webhook, dados, etc.)
app.use("/api", rotasBackend);

// Módulos dedicados para facilitação do Painel
app.use(["/adm.usuario", "/adm/usuario"], rotasAdmUsuario);
app.use(
  ["/adm.arrecadacao", "/adm.arrecadação", encodeURI("/adm.arrecadação"), "/adm/arrecadacao", "/adm/arrecadação", encodeURI("/adm/arrecadação")],
  rotasAdmArrecadacao
);
app.use(
  ["/adm.divulgacoes", "/adm.divulgações", encodeURI("/adm.divulgações"), "/adm/divulgacoes", "/adm/divulgações", encodeURI("/adm/divulgações")],
  rotasAdmDivulgacoes
);
app.use(
  ["/adm.campanhas-ativas", "/adm/campanhas-ativas", "/adm.campanhas", "/adm/campanhas", "/adm.ranking-campanhas", "/adm/ranking-campanhas"],
  rotasAdmRankingCampanhas
);
app.use(
  ["/adm.rankings", "/adm/rankings", "/adm.rank", "/adm/rank"],
  rotasAdmRankings
);
app.use(
  ["/adm.saldo", "/adm/saldo", "/api/adm/saldo", "/api/adm.saldo", "/api/saldo"],
  rotasAdmSaldo
);

// Rotas administrativas diretas (/adm, /adm/usuarios, /admin, /admin/usuarios, /webhook)
app.use("/adm", rotasAdm);
app.use("/admin", rotasAdm);
app.use("/webhook", rotasAdm);

/**
 * Inicialização do Servidor HTTP com Vite para exibição do Frontend SPA
 */
async function iniciarServidor() {
  if (!IS_PRODUCAO) {
    // Modo Desenvolvimento: Conecta os middlewares do Vite para servir React e Tailwind
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);

    app.use("*", async (req, res, next) => {
      if (
        req.originalUrl.startsWith("/api") ||
        req.originalUrl.startsWith("/adm") ||
        req.originalUrl.startsWith("/admin") ||
        req.originalUrl.startsWith("/webhook")
      ) {
        return next();
      }
      try {
        const indexPath = path.resolve(process.cwd(), "index.html");
        let template = fs.readFileSync(indexPath, "utf-8");
        template = await vite.transformIndexHtml(req.originalUrl, template);
        res.status(200).set({ "Content-Type": "text/html" }).end(template);
      } catch (e) {
        vite.ssrFixStacktrace(e as Error);
        next(e);
      }
    });
  } else {
    // Modo Produção: Serve arquivos estáticos da pasta dist
    const distPath = path.resolve(process.cwd(), "dist");
    if (fs.existsSync(distPath)) {
      app.use(express.static(distPath));
    }
    app.get("*", (req, res, next) => {
      if (
        req.originalUrl.startsWith("/api") ||
        req.originalUrl.startsWith("/adm") ||
        req.originalUrl.startsWith("/admin") ||
        req.originalUrl.startsWith("/webhook")
      ) {
        return next();
      }
      const indexPath = fs.existsSync(path.resolve(distPath, "index.html"))
        ? path.resolve(distPath, "index.html")
        : path.resolve(process.cwd(), "index.html");
      res.sendFile(indexPath);
    });
  }

  // Inicia o servidor HTTP e conecta ao banco de dados PostgreSQL
  app.listen(PORT, HOST, async () => {
    console.log(`🚀 ${NOME_SERVIDOR} rodando em http://${HOST}:${PORT}`);
    console.log("🐘 Iniciando banco de dados PostgreSQL...");
    await iniciarBancoDeDados();
  });
}

// Inicia a aplicação
iniciarServidor().catch((erro) => {
  console.error("❌ Falha fatal ao iniciar servidor:", erro);
});

// Finalização graciosa de conexões aos sinais do sistema operacional
process.on("SIGTERM", async () => {
  console.log("Recebido SIGTERM, encerrando pool do PostgreSQL...");
  await pool.end().catch(() => {});
  process.exit(0);
});

process.on("SIGINT", async () => {
  console.log("Recebido SIGINT, encerrando pool do PostgreSQL...");
  await pool.end().catch(() => {});
  process.exit(0);
});

export default app;
