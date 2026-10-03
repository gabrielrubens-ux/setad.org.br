/* Verificação DNS pública para entrega de e-mail (SPF / DKIM / DMARC) */

const dns = require("dns").promises;

function achaTxtSpf(registros) {
  if (!registros || !registros.length) return false;
  return registros.some(function (partes) {
    const texto = partes.join("");
    return /v=spf1/i.test(texto);
  });
}

async function verificarDnsEmailDominio(dominio) {
  const base = (dominio || "setad.org.br").replace(/^https?:\/\//, "").split("/")[0];
  const resultado = {
    dominio: base,
    spf: false,
    dkim: false,
    dmarc: false,
    mx: false,
    erros: []
  };

  try {
    const txtRaiz = await dns.resolveTxt(base);
    resultado.spf = achaTxtSpf(txtRaiz);
  } catch (erro) {
    resultado.erros.push("SPF: " + erro.code);
  }

  try {
    await dns.resolveCname("hostingermail-a._domainkey." + base);
    resultado.dkim = true;
  } catch (_erro) {
    try {
      const txtDkim = await dns.resolveTxt("hostingermail-a._domainkey." + base);
      resultado.dkim = txtDkim && txtDkim.length > 0;
    } catch (erro2) {
      resultado.erros.push("DKIM: " + erro2.code);
    }
  }

  try {
    const dmarc = await dns.resolveTxt("_dmarc." + base);
    resultado.dmarc = dmarc && dmarc.length > 0;
  } catch (erro) {
    resultado.erros.push("DMARC: " + erro.code);
  }

  try {
    const mx = await dns.resolveMx(base);
    resultado.mx = mx && mx.length > 0;
  } catch (erro) {
    resultado.erros.push("MX: " + erro.code);
  }

  resultado.okEntrega = resultado.spf && resultado.dkim && resultado.mx;
  return resultado;
}

module.exports = {
  verificarDnsEmailDominio
};
