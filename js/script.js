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
const headerInner = document.querySelector(".header__inner");

function syncSetadHeaderHeight() {
  if (!headerInner) return;
  const altura = Math.ceil(headerInner.getBoundingClientRect().height);
  document.documentElement.style.setProperty("--setad-header-height", altura + "px");
}

function setMenuAberto(aberto) {
  if (!nav) return;
  nav.classList.toggle("nav--open", aberto);
  if (menuToggle) {
    menuToggle.setAttribute("aria-expanded", aberto ? "true" : "false");
    menuToggle.setAttribute(
      "aria-label",
      aberto ? "Fechar menu de navegação" : "Abrir menu de navegação"
    );
  }
}

syncSetadHeaderHeight();
window.addEventListener("resize", syncSetadHeaderHeight);

if (menuToggle && nav) {
  menuToggle.addEventListener("click", function () {
    setMenuAberto(!nav.classList.contains("nav--open"));
  });
}

const navLinks = document.querySelectorAll(".nav__link");
navLinks.forEach(function (link) {
  link.addEventListener("click", function () {
    setMenuAberto(false);
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
let navScrollTicking = false;

function atualizarNavAtivo() {
  navScrollTicking = false;
  let currentSection = "";

  sections.forEach(function (section) {
    const sectionTop = section.offsetTop - 100;
    if (window.scrollY >= sectionTop) {
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
}

window.addEventListener(
  "scroll",
  function () {
    if (navScrollTicking) return;
    navScrollTicking = true;
    window.requestAnimationFrame(atualizarNavAtivo);
  },
  { passive: true }
);

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
