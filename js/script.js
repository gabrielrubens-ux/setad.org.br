/* ============================================================
   script.js — JavaScript do site SETAD
   Este arquivo adiciona interatividade à landing page.
   É carregado no HTML via: <script src="js/script.js" defer></script>

   defer = o navegador baixa o script em paralelo, mas só executa
   depois que o HTML estiver pronto (não bloqueia a renderização).
   ============================================================ */

/*
  JavaScript (JS) roda no navegador do visitante.
  Aqui controlamos: menu mobile, animações ao rolar, fechar menu ao clicar.
*/

// --- Referências aos elementos do DOM ---
// document.getElementById busca um elemento pelo atributo id=""
const menuToggle = document.getElementById("menuToggle");
const nav = document.getElementById("nav");
const navLinks = document.querySelectorAll(".nav__link");
// querySelectorAll retorna TODOS os elementos que correspondem ao seletor CSS

// --- Menu mobile: abrir/fechar ao clicar no hambúrguer ---
menuToggle.addEventListener("click", function () {
  // addEventListener escuta eventos (click, scroll, etc.) no elemento
  // classList.toggle adiciona a classe se não existir, remove se existir
  nav.classList.toggle("nav--open");
});

// --- Fechar menu ao clicar em um link (melhor UX no mobile) ---
navLinks.forEach(function (link) {
  // forEach percorre cada item de uma lista (NodeList)
  link.addEventListener("click", function () {
    nav.classList.remove("nav--open"); // remove a classe, escondendo o menu
  });
});

// --- Animação fade-in ao rolar a página ---
const fadeElements = document.querySelectorAll(".fade-in");

// Intersection Observer: API moderna que detecta quando um elemento
// entra ou sai da área visível da tela (viewport)
const observerOptions = {
  threshold: 0.15 // dispara quando 15% do elemento está visível
};

const fadeObserver = new IntersectionObserver(function (entries) {
  // "entries" é a lista de elementos observados que mudaram de visibilidade
  entries.forEach(function (entry) {
    if (entry.isIntersecting) {
      // isIntersecting = true quando o elemento está visível na tela
      entry.target.classList.add("visible");
      // Para de observar após animar (performance: não re-anima ao rolar de volta)
      fadeObserver.unobserve(entry.target);
    }
  });
}, observerOptions);

// Inicia a observação de cada elemento com classe .fade-in
fadeElements.forEach(function (element) {
  fadeObserver.observe(element);
});

// --- Destaque do link ativo no menu conforme a seção visível ---
const sections = document.querySelectorAll("section[id]");

window.addEventListener("scroll", function () {
  // Executa a cada pixel de rolagem (pode ser otimizado com throttle, mas
  // para uma landing page simples, funciona bem assim)

  let currentSection = "";

  sections.forEach(function (section) {
    const sectionTop = section.offsetTop - 100;
    // offsetTop = distância do topo da página até a seção
    // -100 compensa a altura do header fixo

    if (window.scrollY >= sectionTop) {
      // scrollY = quantos pixels o usuário rolou para baixo
      currentSection = section.getAttribute("id");
    }
  });

      navLinks.forEach(function (link) {
        link.style.color = "";
        link.style.fontWeight = "";
        if (link.getAttribute("href") === "#" + currentSection) {
          link.style.color = "var(--cor-secundaria)";
          link.style.fontWeight = "600";
        }
      });
});

// --- Fundo interativo da seção "Nossa sede" (grade + parallax discreto) ---
(function inicializarFundoLocalizacao() {
  const section = document.getElementById("localizacao");
  if (!section) return;

  const bg = section.querySelector(".localizacao__bg");
  const layers = section.querySelectorAll("[data-parallax]");
  const reduzirMovimento = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  if (!bg || reduzirMovimento) return;

  let alvoX = 50;
  let alvoY = 38;
  let atualX = 50;
  let atualY = 38;
  let dentro = false;

  function animarGlow() {
    atualX += (alvoX - atualX) * 0.06;
    atualY += (alvoY - atualY) * 0.06;
    bg.style.setProperty("--localizacao-glow-x", atualX + "%");
    bg.style.setProperty("--localizacao-glow-y", atualY + "%");
    requestAnimationFrame(animarGlow);
  }

  requestAnimationFrame(animarGlow);

  section.addEventListener("mouseenter", function () {
    dentro = true;
  });

  section.addEventListener("mouseleave", function () {
    dentro = false;
    alvoX = 50;
    alvoY = 38;

    layers.forEach(function (layer) {
      layer.style.transform = "";
    });
  });

  section.addEventListener("mousemove", function (evento) {
    if (!dentro) return;

    const rect = section.getBoundingClientRect();
    const relX = (evento.clientX - rect.left) / rect.width;
    const relY = (evento.clientY - rect.top) / rect.height;
    const offsetX = relX - 0.5;
    const offsetY = relY - 0.5;

    alvoX = 28 + relX * 44;
    alvoY = 22 + relY * 48;

    layers.forEach(function (layer) {
      const profundidade = parseFloat(layer.getAttribute("data-parallax")) || 8;
      const moveX = offsetX * profundidade;
      const moveY = offsetY * (profundidade * 0.65);
      layer.style.transform = "translate3d(" + moveX + "px, " + moveY + "px, 0)";
    });
  });
})();
