/* Histórico de pagamentos/notas e recibo institucional — secretaria e contabilidade dos polos. */

var SETADHistoricoRecibo = {
  cssExtra: function () {
    return (
      ".setad-hist-meta{margin:0 0 1rem;font-size:0.95rem}" +
      ".setad-hist-meta dt{display:inline;font-weight:600}" +
      ".setad-hist-meta dd{display:inline;margin:0 0.5rem 0 0}" +
      ".setad-hist-sec{margin-top:1.25rem}" +
      ".setad-hist-sec h3{margin:0 0 0.5rem;font-size:1.05rem;color:#23406b}" +
      ".setad-hist-tabela{width:100%;border-collapse:collapse;font-size:0.85rem;margin-top:0.35rem}" +
      ".setad-hist-tabela th,.setad-hist-tabela td{border:1px solid #ccc;padding:0.35rem 0.5rem;text-align:left;vertical-align:top}" +
      ".setad-hist-tabela th{background:#f0f4fa}" +
      ".setad-hist-vazio{color:#666;font-style:italic}" +
      ".setad-recibo{max-width:520px;margin:0 auto}" +
      ".setad-recibo h2{margin:0 0 0.5rem;font-size:1.2rem;text-align:center}" +
      ".setad-recibo__id{text-align:center;font-size:0.85rem;color:#444;margin-bottom:1rem}" +
      ".setad-recibo__corpo{margin:1rem 0;line-height:1.5}" +
      ".setad-recibo__valor{font-size:1.15rem;font-weight:700;margin:0.75rem 0}" +
      ".setad-recibo__aviso{font-size:0.8rem;color:#333;border:1px solid #ccc;padding:0.5rem;background:#fafafa;margin:1rem 0}" +
      ".setad-recibo__assin{margin-top:2rem;text-align:center;font-size:0.9rem}"
    );
  },

  esc: function (s) {
    if (typeof escaparHtml === "function") return escaparHtml(s == null ? "" : String(s));
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  },

  moeda: function (v) {
    if (typeof formatarMoeda === "function") return formatarMoeda(v);
    return "R$ " + Number(v || 0).toFixed(2).replace(".", ",");
  },

  data: function (iso) {
    if (!iso) return "—";
    if (typeof formatarData === "function") return formatarData(iso);
    try {
      return new Date(iso).toLocaleDateString("pt-BR");
    } catch (e) {
      return "—";
    }
  },

  dataHora: function (iso) {
    if (!iso) return "—";
    try {
      return new Date(iso).toLocaleString("pt-BR");
    } catch (e) {
      return "—";
    }
  },

  labelTipoCobranca: function (tipo) {
    if (tipo === "matricula") return "Taxa de matrícula";
    if (tipo === "mensalidade") return "Mensalidade";
    if (tipo === "outro") return "Outro recebimento";
    return tipo || "Recebimento";
  },

  labelStatusPagamento: function (status) {
    var map = {
      pago: "Pago",
      pendente: "Pendente",
      agendado: "Agendado",
      cancelado: "Cancelado"
    };
    return map[status] || status || "—";
  },

  obterPagamentosDoAluno: function (matricula) {
    if (!matricula) return [];
    var lista = [];
    if (typeof obterPagamentosPorMatriculaId === "function" && matricula.id) {
      lista = obterPagamentosPorMatriculaId(matricula.id);
    } else if (typeof obterPagamentosAlunos === "function") {
      var email = (matricula.email || "").trim().toLowerCase();
      lista = obterPagamentosAlunos().filter(function (p) {
        return (
          (matricula.id && p.matriculaId === matricula.id) ||
          (email && (p.alunoEmail || "").toLowerCase() === email)
        );
      });
    }
    return lista.slice().sort(function (a, b) {
      var da = a.dataPagamento || a.vencimento || a.criadoEm || "";
      var db = b.dataPagamento || b.vencimento || b.criadoEm || "";
      return String(db).localeCompare(String(da));
    });
  },

  montarMetaAlunoHtml: function (matricula) {
    var mod =
      typeof MODULOS_CURSO !== "undefined" && MODULOS_CURSO[matricula.modulo]
        ? MODULOS_CURSO[matricula.modulo].nome
        : matricula.modulo || "—";
    var dir =
      typeof formatarDirecionamentoAluno === "function"
        ? formatarDirecionamentoAluno(matricula)
        : matricula.poloNome || "—";
    return (
      '<dl class="setad-hist-meta">' +
      "<dt>Aluno:</dt> <dd>" +
      this.esc(matricula.nomeCompleto) +
      "</dd> " +
      "<dt>E-mail:</dt> <dd>" +
      this.esc(matricula.email) +
      "</dd> " +
      "<dt>Módulo:</dt> <dd>" +
      this.esc(mod) +
      "</dd> " +
      "<dt>Polo / turma:</dt> <dd>" +
      this.esc(dir) +
      "</dd>" +
      "</dl>"
    );
  },

  montarTabelaPagamentosHtml: function (lista) {
    var self = this;
    if (!lista || !lista.length) {
      return '<p class="setad-hist-vazio">Nenhum pagamento registrado para este aluno.</p>';
    }
    var linhas = lista
      .map(function (p) {
        return (
          "<tr>" +
          "<td>" +
          self.esc(p.referencia || self.labelTipoCobranca(p.tipo)) +
          "</td>" +
          "<td>" +
          self.esc(self.labelTipoCobranca(p.tipo)) +
          "</td>" +
          "<td>" +
          self.esc(self.moeda(p.valor)) +
          "</td>" +
          "<td>" +
          self.esc(self.labelStatusPagamento(p.status)) +
          "</td>" +
          "<td>" +
          self.esc(p.formaPagamento || "—") +
          "</td>" +
          "<td>" +
          self.esc(self.data(p.dataPagamento || p.vencimento)) +
          "</td>" +
          "<td>" +
          self.esc(p.observacoes || "—") +
          "</td>" +
          "</tr>"
        );
      })
      .join("");
    return (
      '<table class="setad-hist-tabela"><thead><tr>' +
      "<th>Referência</th><th>Tipo</th><th>Valor</th><th>Situação</th><th>Forma</th><th>Data</th><th>Obs.</th>" +
      "</tr></thead><tbody>" +
      linhas +
      "</tbody></table>"
    );
  },

  montarTabelaNotasHtml: function (matricula) {
    var self = this;
    var notas =
      typeof obterNotasDaMatricula === "function" ? obterNotasDaMatricula(matricula) : [];
    if (!notas.length) {
      return '<p class="setad-hist-vazio">Nenhuma nota lançada para este aluno.</p>';
    }
    var formatarNota =
      typeof formatarNotaValor === "function"
        ? formatarNotaValor
        : function (v) {
            return v == null ? "—" : String(v);
          };
    notas.sort(function (a, b) {
      var pa = (a.periodo || "") + (a.disciplina || "");
      var pb = (b.periodo || "") + (b.disciplina || "");
      return pa.localeCompare(pb, "pt-BR");
    });
    var linhas = notas
      .map(function (n) {
        return (
          "<tr>" +
          "<td>" +
          self.esc(n.periodo || "—") +
          "</td>" +
          "<td>" +
          self.esc(n.disciplina || "—") +
          "</td>" +
          "<td>" +
          self.esc(n.avaliacao || n.tipo || "—") +
          "</td>" +
          "<td>" +
          self.esc(formatarNota(n.valor)) +
          "</td>" +
          "<td>" +
          self.esc(n.observacoes || "—") +
          "</td>" +
          "</tr>"
        );
      })
      .join("");
    return (
      '<table class="setad-hist-tabela"><thead><tr>' +
      "<th>Período</th><th>Disciplina</th><th>Avaliação</th><th>Nota</th><th>Obs.</th>" +
      "</tr></thead><tbody>" +
      linhas +
      "</tbody></table>"
    );
  },

  resolverMatricula: function (matriculaOuId) {
    if (matriculaOuId && typeof matriculaOuId === "object" && matriculaOuId.id) {
      return matriculaOuId;
    }
    var id = String(matriculaOuId || "").trim();
    if (!id) return null;
    if (typeof obterMatriculaPorId === "function") {
      var m = obterMatriculaPorId(id);
      if (m) return m;
    }
    if (typeof obterMatriculas === "function") {
      return (
        obterMatriculas().find(function (item) {
          return item.id === id;
        }) || null
      );
    }
    return null;
  },

  prepararDadosHistorico: function () {
    try {
      if (typeof inicializarDadosFinanceiros === "function") {
        inicializarDadosFinanceiros();
      }
    } catch (e1) {
      /* ignorar */
    }
  },

  exibirResultadoImpressao: function (resultado, elementoBotao) {
    if (!resultado || resultado.ok) {
      if (resultado && resultado.aviso && typeof alert === "function") {
        alert(resultado.aviso);
      }
      return;
    }
    var msg = resultado.erro || "Não foi possível imprimir o histórico.";
    if (typeof alert === "function") {
      alert(msg);
    }
    if (elementoBotao && elementoBotao.dataset) {
      elementoBotao.title = msg;
    }
  },

  acionarImpressaoHistorico: function (matriculaOuId, opcoes) {
    opcoes = opcoes || {};
    var btn = opcoes.botao || null;
    var self = this;

    if (!window.SETADHistoricoRecibo || !window.SETADImpressao) {
      if (typeof alert === "function") {
        alert(
          "Módulo de impressão não carregou. Atualize a página (Ctrl+F5) e tente novamente."
        );
      }
      return Promise.resolve({ ok: false, erro: "Módulo indisponível." });
    }

    var matricula = self.resolverMatricula(matriculaOuId);
    if (!matricula) {
      var semAluno = { ok: false, erro: "Aluno não encontrado para imprimir o histórico." };
      self.exibirResultadoImpressao(semAluno, btn);
      return Promise.resolve(semAluno);
    }

    var textoOriginal = btn ? btn.textContent : "";
    if (btn) {
      btn.disabled = true;
      btn.setAttribute("aria-busy", "true");
      btn.textContent = "Abrindo…";
    }

    return self
      .imprimirHistorico(matricula, opcoes)
      .then(function (res) {
        if (btn) {
          btn.disabled = false;
          btn.removeAttribute("aria-busy");
          btn.textContent = textoOriginal || "Histórico";
        }
        self.exibirResultadoImpressao(res, btn);
        return res;
      })
      .catch(function (err) {
        if (btn) {
          btn.disabled = false;
          btn.removeAttribute("aria-busy");
          btn.textContent = textoOriginal || "Histórico";
        }
        var falha = {
          ok: false,
          erro: (err && err.message) || "Erro inesperado ao imprimir."
        };
        self.exibirResultadoImpressao(falha, btn);
        return falha;
      });
  },

  montarHtmlHistorico: function (matricula) {
    var pagamentos = this.obterPagamentosDoAluno(matricula);
    return (
      '<style>' +
      this.cssExtra() +
      "</style>" +
      this.montarMetaAlunoHtml(matricula) +
      '<section class="setad-hist-sec"><h3>Histórico de pagamentos</h3>' +
      this.montarTabelaPagamentosHtml(pagamentos) +
      "</section>" +
      '<section class="setad-hist-sec"><h3>Histórico de notas</h3>' +
      this.montarTabelaNotasHtml(matricula) +
      "</section>"
    );
  },

  imprimirHistorico: function (matricula, opcoes) {
    opcoes = opcoes || {};
    matricula = this.resolverMatricula(matricula);
    if (!matricula) {
      return Promise.resolve({ ok: false, erro: "Aluno não encontrado." });
    }
    if (!window.SETADImpressao) {
      return Promise.resolve({ ok: false, erro: "Módulo de impressão indisponível." });
    }

    this.prepararDadosHistorico();

    var titulo = "Histórico — " + (matricula.nomeCompleto || "Aluno");
    var corpo;
    try {
      corpo = this.montarHtmlHistorico(matricula);
    } catch (errMontagem) {
      return Promise.resolve({
        ok: false,
        erro:
          "Erro ao montar o histórico: " +
          (errMontagem && errMontagem.message ? errMontagem.message : "dados inválidos")
      });
    }

    var completo =
      typeof corpo === "string" && corpo.indexOf("<!DOCTYPE") !== -1
        ? corpo
        : SETADImpressao.montarDocumentoImpressao(corpo, titulo);

    return SETADImpressao.imprimirHtml(corpo, { titulo: titulo }).then(function (res) {
      if (res && res.ok) return res;
      if (typeof SETADImpressao.imprimirHtmlEmIframe === "function") {
        return SETADImpressao.imprimirHtmlEmIframe(completo, titulo);
      }
      return res || { ok: false, erro: "Falha na impressão." };
    });
  },

  montarHtmlRecibo: function (matricula, pagamento, contexto) {
    contexto = contexto || {};
    var self = this;
    var ref = pagamento.referencia || self.labelTipoCobranca(pagamento.tipo);
    var atendente =
      (contexto.sessao && contexto.sessao.email) ||
      pagamento.registradoPor ||
      pagamento.pagoPor ||
      "Secretaria SETAD";
    var polo = contexto.poloNome || matricula.poloNome || "";
    var dataRecibo = self.dataHora(pagamento.dataPagamento || new Date().toISOString());
    var forma = pagamento.formaPagamento || "—";
    var obs = (pagamento.observacoes || "").trim();

    return (
      '<style>' +
      this.cssExtra() +
      "</style>" +
      '<div class="setad-recibo">' +
      "<h2>Recibo de pagamento</h2>" +
      '<p class="setad-recibo__id">Nº ' +
      self.esc((pagamento.id || "").slice(-12).toUpperCase()) +
      " · " +
      self.esc(dataRecibo) +
      "</p>" +
      '<p class="setad-recibo__corpo">Recebemos de <strong>' +
      self.esc(matricula.nomeCompleto) +
      "</strong>" +
      (matricula.email ? " (" + self.esc(matricula.email) + ")" : "") +
      ", a quantia abaixo referente a <strong>" +
      self.esc(ref) +
      "</strong> (" +
      self.esc(self.labelTipoCobranca(pagamento.tipo)) +
      ").</p>" +
      '<p class="setad-recibo__valor">Valor: ' +
      self.esc(self.moeda(pagamento.valor)) +
      "</p>" +
      "<p><strong>Forma de pagamento:</strong> " +
      self.esc(forma) +
      "</p>" +
      (obs
        ? "<p><strong>Observações:</strong> " + self.esc(obs) + "</p>"
        : "") +
      (polo ? "<p><strong>Polo:</strong> " + self.esc(polo) + "</p>" : "") +
      '<p class="setad-recibo__aviso">' +
      "Comprovante institucional do SETAD. " +
      "Quando o pagamento for feito com cartão ou PIX na maquininha, entregue também o <strong>cupom fiscal</strong> impresso pelo equipamento. " +
      "Em pagamento em espécie, este recibo serve como comprovante de recebimento junto ao atendimento da secretaria ou do polo." +
      "</p>" +
      "<p>Registro atendido por: " +
      self.esc(atendente) +
      "</p>" +
      '<p class="setad-recibo__assin">SETAD — Seminário Teológico<br>______________________________</p>' +
      "</div>"
    );
  },

  imprimirRecibo: function (matricula, pagamento, contexto) {
    if (!matricula || !pagamento) {
      return Promise.resolve({ ok: false, erro: "Dados insuficientes para o recibo." });
    }
    if (!window.SETADImpressao) {
      return Promise.resolve({ ok: false, erro: "Módulo de impressão indisponível." });
    }
    var titulo = "Recibo — " + (matricula.nomeCompleto || "Aluno");
    return SETADImpressao.imprimirHtml(
      this.montarHtmlRecibo(matricula, pagamento, contexto),
      { titulo: titulo }
    );
  },

  aposPagamentoRealizado: function (matricula, resultadoPagamento, sessao, opcoes) {
    opcoes = opcoes || {};
    if (opcoes.emitirRecibo === false) return;
    if (!resultadoPagamento || !resultadoPagamento.ok || !resultadoPagamento.pagamento) return;
    var pag = resultadoPagamento.pagamento;
    if (pag.status !== "pago") return;

    var self = this;
    var ctx = { sessao: sessao, poloNome: opcoes.poloNome };

    var disparar = function () {
      if (opcoes.imprimirReciboSemConfirmar) {
        self.imprimirRecibo(matricula, pag, ctx);
        return;
      }
      if (
        window.confirm(
          "Emitir recibo para o aluno? Entregue junto com o cupom fiscal da maquininha, quando houver."
        )
      ) {
        self.imprimirRecibo(matricula, pag, ctx);
      }
    };

    setTimeout(disparar, opcoes.delayMs != null ? opcoes.delayMs : 350);
  }
};

function configurarCliquesImpressaoHistoricoGlobal() {
  if (typeof document === "undefined" || !document.body) return;
  if (document.body.dataset.setadHistoricoPrintGlobal === "1") return;
  document.body.dataset.setadHistoricoPrintGlobal = "1";

  document.addEventListener(
    "click",
    function (ev) {
      var btnLista = ev.target.closest(".btn-imprimir-historico-aluno");
      var btnContab = ev.target.closest("[data-contab-historico]");
      var alvo = btnLista || btnContab;
      if (!alvo) return;
      if (alvo.disabled) return;

      ev.preventDefault();
      ev.stopPropagation();

      var id =
        alvo.getAttribute("data-matricula-id") ||
        alvo.getAttribute("data-contab-historico");
      if (!id) return;

      if (typeof SETADHistoricoRecibo === "undefined") {
        if (typeof alert === "function") {
          alert("Módulo de impressão não carregou. Atualize a página (Ctrl+F5).");
        }
        return;
      }
      SETADHistoricoRecibo.acionarImpressaoHistorico(id, { botao: alvo });
    },
    true
  );
}

if (typeof window !== "undefined") {
  window.SETADHistoricoRecibo = SETADHistoricoRecibo;
  if (typeof document !== "undefined") {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", configurarCliquesImpressaoHistoricoGlobal);
    } else {
      configurarCliquesImpressaoHistoricoGlobal();
    }
  }
}
