/**
 * Cliente HTTP da API SETAD — web, PWA e Capacitor.
 */
(function () {
  "use strict";

  function resolveApiBase() {
    if (window.SETADNative && typeof SETADNative.getApiBase === "function") {
      var nativeBase = SETADNative.getApiBase();
      if (nativeBase) {
        return nativeBase.replace(/\/$/, "");
      }
    }
    return "/api";
  }

  function buildUrl(path) {
    var base = resolveApiBase();
    if (base.startsWith("http")) {
      return base + path;
    }
    return base + path;
  }

  function request(method, path, body) {
    var options = {
      method: method,
      credentials: "include",
      headers: {}
    };

    if (window.SETADNative && SETADNative.getToken()) {
      options.headers.Authorization = "Bearer " + SETADNative.getToken();
    }

    if (body !== undefined) {
      options.headers["Content-Type"] = "application/json";
      options.body = JSON.stringify(body);
    }

    return fetch(buildUrl(path), options).then(function (response) {
      return response.json().catch(function () {
        return { ok: false, erro: "Resposta inválida do servidor." };
      }).then(function (data) {
        if (!response.ok && data && !data.erro) {
          data.erro = "Erro " + response.status;
        }
        data._status = response.status;
        return data;
      });
    });
  }

  window.SETADApi = {
    getBase: resolveApiBase,
    get: function (path) { return request("GET", path); },
    post: function (path, body) { return request("POST", path, body); },
    put: function (path, body) { return request("PUT", path, body); },
    delete: function (path) { return request("DELETE", path); },
    health: function () { return request("GET", "/health"); },
    login: function (email, senha) { return request("POST", "/auth/login", { email: email, senha: senha }); },
    logout: function () {
      if (window.SETADNative) SETADNative.setToken(null);
      return request("POST", "/auth/logout");
    },
    me: function () { return request("GET", "/auth/me"); },
    snapshot: function () { return request("GET", "/snapshot"); },
    checkEmailMatricula: function (email) {
      return request("GET", "/public/matriculas/check-email?email=" + encodeURIComponent(email));
    },
    obterMatriculaPublica: function (matriculaId, email) {
      return request(
        "GET",
        "/public/matriculas/" + encodeURIComponent(matriculaId) +
        "?email=" + encodeURIComponent(email)
      );
    },
    criarMatriculaPublica: function (dados) {
      return request("POST", "/public/matriculas", dados);
    },
    registerAluno: function (email, senha) {
      return request("POST", "/auth/aluno/register", { email: email, senha: senha });
    },
    verifyAluno: function (email, codigo) {
      return request("POST", "/auth/aluno/verify", { email: email, codigo: codigo });
    },
    resendCodeAluno: function (email) {
      return request("POST", "/auth/aluno/resend-code", { email: email });
    },
    verificacaoPendente: function (email) {
      return request("GET", "/auth/aluno/verificacao-pendente?email=" + encodeURIComponent(email));
    },
    syncCollection: function (nome, items) {
      return request("PUT", "/" + nome, items);
    },
    salvarFotoAluno: function (email, dataUrl) {
      return request("PUT", "/fotos/alunos/" + encodeURIComponent(email), { dataUrl: dataUrl });
    },
    salvarFotoStaff: function (email, dataUrl) {
      return request("PUT", "/fotos/staff/" + encodeURIComponent(email), { dataUrl: dataUrl });
    },
    salvarToken: function (token) {
      if (window.SETADNative && token) {
        SETADNative.setToken(token);
      }
    }
  };
})();
