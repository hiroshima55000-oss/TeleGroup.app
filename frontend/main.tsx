import React from "react";
import ReactDOM from "react-dom/client";
import AppRotas from "./app.rotas";
import { obterOuCriarUsuario, registrarVisitaNoBackend } from "./servicos/usuario";
import "./index.css";

// Garante que todo visitante sem login receba seu ID anônimo persistente no primeiro milissegundo de acesso
obterOuCriarUsuario();
registrarVisitaNoBackend();

ReactDOM.createRoot(
  document.getElementById("root")!
).render(
  <React.StrictMode>
    <AppRotas />
  </React.StrictMode>
);
