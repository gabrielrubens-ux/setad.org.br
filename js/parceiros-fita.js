/**
 * Fita de sites parceiros: duplica itens para rolagem contínua quando houver 2+ parceiros.
 */
(function () {
  var fita = document.querySelector("[data-parceiros-fita]");
  if (!fita) return;

  var trilha = fita.querySelector(".parceiros__trilha");
  if (!trilha) return;

  var cards = trilha.querySelectorAll(".parceiros__card");
  if (cards.length === 0) return;

  if (cards.length === 1) {
    fita.classList.add("parceiros__fita--unico");
    return;
  }

  var fragment = document.createDocumentFragment();
  cards.forEach(function (card) {
    fragment.appendChild(card.cloneNode(true));
  });
  trilha.appendChild(fragment);
  fita.classList.add("parceiros__fita--animada");
})();
