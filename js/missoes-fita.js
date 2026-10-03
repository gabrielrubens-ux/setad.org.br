/**
 * Área Missões: duplica logos para rolagem contínua quando houver 2+ links.
 */
(function () {
  var fita = document.querySelector("[data-missoes-fita]");
  if (!fita) return;

  var trilha = fita.querySelector(".missoes__trilha");
  if (!trilha) return;

  var cards = trilha.querySelectorAll(".missoes__card");
  if (cards.length === 0) return;

  if (cards.length === 1) {
    fita.classList.add("missoes__fita--unico");
    return;
  }

  var fragment = document.createDocumentFragment();
  cards.forEach(function (card) {
    fragment.appendChild(card.cloneNode(true));
  });
  trilha.appendChild(fragment);
  fita.classList.add("missoes__fita--animada");
})();
