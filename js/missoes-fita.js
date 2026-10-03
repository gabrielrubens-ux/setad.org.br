/**
 * Área Missões: rolagem contínua só com 3+ parceiros; 2 ficam lado a lado.
 */
(function () {
  var fita = document.querySelector("[data-missoes-fita]");
  if (!fita) return;

  var trilha = fita.querySelector(".missoes__trilha");
  if (!trilha) return;

  var cards = trilha.querySelectorAll(".missoes__card");
  if (cards.length === 0) return;

  if (cards.length < 3) {
    fita.classList.add("missoes__fita--grade");
    return;
  }

  var fragment = document.createDocumentFragment();
  cards.forEach(function (card) {
    fragment.appendChild(card.cloneNode(true));
  });
  trilha.appendChild(fragment);
  fita.classList.add("missoes__fita--animada");
})();
