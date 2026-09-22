/* Rodapé institucional SETAD — injetado em todas as páginas */
(function () {
  "use strict";

  var script = document.currentScript;
  if (!script || document.getElementById("contato")) return;

  if (document.querySelector(".painel")) return;

  var src = script.getAttribute("src") || "";
  var match = src.match(/^(\.\.\/)+/);
  var base = match ? match[0] : "";
  var home = base + "index.html";

  function deveMostrarMidiaPublica() {
    var body = document.body;
    if (!body || body.classList.contains("login-page")) return false;

    if (
      body.classList.contains("painel-direcao") ||
      body.classList.contains("painel-contador") ||
      body.classList.contains("painel-secretaria")
    ) {
      return false;
    }

    return !document.querySelector(".painel");
  }

  var wppSvg =
    '<svg viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.435 9.884-9.882 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>';

  var html =
    '<section class="contato-setad" id="contato" aria-label="Rodapé institucional SETAD">' +
      '<div class="container container--wide">' +
        '<div class="contato-setad__bar">' +
          '<div class="contato-setad__marca"><p class="contato-setad__nome">SETAD</p></div>' +
          '<a href="https://wa.me/5591980852801" class="contato-setad__wpp" target="_blank" rel="noopener noreferrer" aria-label="Falar com o SETAD no WhatsApp: (91) 98085-2801">' +
            '<span class="contato-setad__wpp-icone" aria-hidden="true">' + wppSvg + "</span>" +
            '<span class="contato-setad__wpp-conteudo">' +
              '<span class="contato-setad__wpp-label">Contato/WhatsApp</span>' +
              '<span class="contato-setad__wpp-numero">(91) 98085-2801</span>' +
            "</span>" +
          "</a>" +
        "</div>" +
        '<div class="contato-setad__corpo">' +
          '<div class="contato-setad__colunas">' +
            '<div class="contato-setad__col">' +
              '<h3 class="contato-setad__titulo">Institucional</h3>' +
              '<ul class="contato-setad__lista">' +
                '<li><a href="' + home + '#sobre">Sobre o SETAD</a></li>' +
                '<li><a href="' + base + 'polos/">Nossos polos</a></li>' +
                '<li><a href="' + home + '#localizacao">Onde estamos</a></li>' +
                '<li><a href="' + home + '#informacoes">Informações do seminário</a></li>' +
              "</ul>" +
              '<h3 class="contato-setad__titulo">Comunicação</h3>' +
              '<ul class="contato-setad__lista">' +
                '<li><a href="' + base + 'culto-ao-vivo.html">Culto ao vivo</a></li>' +
                '<li><a href="' + home + '#midias">Redes sociais</a></li>' +
                '<li><a href="https://www.instagram.com/setad.adbelem?igsh=cmVxZTA1MTZldmRx" target="_blank" rel="noopener noreferrer">Instagram</a></li>' +
                '<li><a href="https://www.youtube.com/@SETAD-BELEM" target="_blank" rel="noopener noreferrer">YouTube</a></li>' +
                '<li><a href="https://open.spotify.com/playlist/0MqaKOIFA0Fs5Wsqf4zCem?si=d9c0d34a443d4b56" target="_blank" rel="noopener noreferrer">Spotify</a></li>' +
              "</ul>" +
            "</div>" +
            '<div class="contato-setad__col">' +
              '<h3 class="contato-setad__titulo">Cursos</h3>' +
              '<ul class="contato-setad__lista">' +
                '<li><a href="' + base + 'matricula/">Matrícula online</a></li>' +
                '<li><a href="' + base + 'matricula/#informacoes">Curso Médio em Teologia</a></li>' +
                '<li><a href="' + base + 'matricula/#informacoes">Curso Avançado em Teologia</a></li>' +
                '<li><a href="' + base + 'matricula/teologia/">Bacharelado em Teologia</a></li>' +
              "</ul>" +
              '<h3 class="contato-setad__titulo">Formação teológica</h3>' +
              '<ul class="contato-setad__lista">' +
                '<li><a href="' + home + '#programa">Programa teológico</a></li>' +
                '<li><a href="' + home + '#campus">Campus e polos</a></li>' +
                '<li><a href="' + home + '#inscricao">Inscrição</a></li>' +
              "</ul>" +
            "</div>" +
            '<div class="contato-setad__col">' +
              '<h3 class="contato-setad__titulo">Portal acadêmico</h3>' +
              '<ul class="contato-setad__lista">' +
                '<li><a href="' + base + 'login-aluno.html">Área do aluno</a></li>' +
                '<li><a href="' + base + 'login-professor.html">Área do professor</a></li>' +
                '<li><a href="' + base + 'login-direcao.html">Direção / Contabilidade</a></li>' +
                '<li><a href="' + base + 'login-direcao.html#secretaria">Secretaria</a></li>' +
              "</ul>" +
              '<h3 class="contato-setad__titulo">Atendimento</h3>' +
              '<ul class="contato-setad__lista">' +
                '<li><a href="https://wa.me/5591980852801" target="_blank" rel="noopener noreferrer">WhatsApp</a></li>' +
                '<li><a href="' + home + '#localizacao">Sede em Belém</a></li>' +
              "</ul>" +
            "</div>" +
          "</div>" +
          '<aside class="contato-setad__arte" aria-label="Educação para o futuro — tradição que se renova">' +
            '<img src="' + base + 'assets/images/setad-educacao-futuro.jpg" alt="Educação para o futuro — tradição que se renova" class="contato-setad__arte-img" width="352" height="440" loading="lazy">' +
          "</aside>" +
        "</div>" +
        '<div class="contato-setad__rodape">' +
          '<p class="contato-setad__copyright">&copy; 2026 SETAD — Seminário Teológico. Todos os direitos reservados.</p>' +
          '<a href="' + home + '#inicio" class="contato-setad__topo">Voltar ao topo &uarr;</a>' +
        "</div>" +
      "</div>" +
    "</section>";

  var ocultarWppFloat =
    document.body.classList.contains("login-page--direcao") ||
    document.body.classList.contains("painel-direcao") ||
    document.body.classList.contains("painel-contador") ||
    document.body.classList.contains("painel-secretaria");

  if (!ocultarWppFloat) {
    html +=
      '<div class="wpp-float" id="wppFloat">' +
        '<button type="button" class="wpp-float__btn" id="wppFloatBtn" aria-expanded="false" aria-label="Falar com o SETAD no WhatsApp">' +
          '<span class="wpp-float__icone" aria-hidden="true">' + wppSvg + "</span>" +
          '<span class="wpp-float__texto">QUERO ATENDIMENTO!</span>' +
        "</button>" +
      "</div>";
  }

  if (deveMostrarMidiaPublica() && !document.body.classList.contains("pagina-culto-ao-vivo")) {
    html +=
      '<div class="culto-janela culto-janela--mini" id="cultoJanela" hidden aria-live="polite" aria-expanded="false">' +
        '<div class="culto-janela__painel" id="cultoJanelaPainel">' +
          '<header class="culto-janela__cabecalho">' +
            '<span class="culto-janela__badge"><span class="culto-janela__dot" aria-hidden="true"></span> AO VIVO</span>' +
            '<span class="culto-janela__titulo">Culto ao Vivo</span>' +
            '<div class="culto-janela__acoes">' +
              '<button type="button" class="culto-janela__btn" id="cultoJanelaExpandir" aria-label="Expandir ou recolher janela">' +
                '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/></svg>' +
              "</button>" +
              '<button type="button" class="culto-janela__btn culto-janela__btn--fechar" id="cultoJanelaFechar" aria-label="Fechar janela ao vivo">' +
                '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M18 6L6 18M6 6l12 12"/></svg>' +
              "</button>" +
            "</div>" +
          "</header>" +
          '<div class="culto-janela__corpo">' +
            '<video id="cultoJanelaVideo" class="culto-janela__video" playsinline autoplay controls title="Transmissão ao vivo — Culto SETAD"></video>' +
            '<button type="button" class="culto-janela__btn-play" id="cultoJanelaPlayPause" aria-label="Pausar culto ao vivo e ouvir a rádio">' +
              '<svg class="culto-janela__icone-pause" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>' +
              '<svg class="culto-janela__icone-play" viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5v14l11-7z"/></svg>' +
            "</button>" +
          "</div>" +
          '<footer class="culto-janela__rodape">' +
            '<a href="' + base + 'culto-ao-vivo.html" class="culto-janela__link" id="cultoJanelaTelaCheia">Abrir em tela cheia</a>' +
          "</footer>" +
        "</div>" +
      "</div>";
  }

  var holder = document.createElement("div");
  holder.innerHTML = html;

  while (holder.firstChild) {
    document.body.insertBefore(holder.firstChild, script);
  }

  function deveMostrarRadioPlayer() {
    var body = document.body;
    if (!body || body.classList.contains("login-page")) return false;

    if (
      body.classList.contains("painel-direcao") ||
      body.classList.contains("painel-contador") ||
      body.classList.contains("painel-secretaria")
    ) {
      return false;
    }

    return !document.querySelector(".painel");
  }

  function carregarScriptSequencial(scripts) {
    if (!scripts.length) return;

    var atual = scripts.shift();
    if (document.getElementById(atual.id)) {
      carregarScriptSequencial(scripts);
      return;
    }

    var tag = document.createElement("script");
    tag.id = atual.id;
    tag.src = base + atual.src;
    tag.onload = function () {
      carregarScriptSequencial(scripts);
    };
    document.body.appendChild(tag);
  }

  if (deveMostrarMidiaPublica()) {
    var midiaScripts = [
      { id: "setadAudioCoordinatorLoader", src: "js/audio-coordinator.js" },
      { id: "setadCultoLiveLoader", src: "js/culto-live.js" }
    ];

    if (deveMostrarRadioPlayer()) {
      midiaScripts.push({ id: "setadRadioPlayerLoader", src: "js/radio-player.js" });
    }

    if (document.getElementById("cultoJanela")) {
      midiaScripts.push({ id: "setadCultoJanelaLoader", src: "js/culto-janela.js" });
    }

    carregarScriptSequencial(midiaScripts);
  }
})();
