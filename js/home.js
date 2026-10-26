(function () {
  const L = window.Loja;

  function renderVitrine(node, items) {
    const layout = node.dataset.layout || "grid";
    if (!items.length) {
      node.innerHTML = "<p class='loading'>Nada nesta vitrine agora.</p>";
      return;
    }
    if (layout === "editorial") {
      const [first, ...rest] = items;
      const side = rest.slice(0, 2).map((item) => L.cardHTML(item)).join("");
      const more = rest.slice(2);
      node.innerHTML = `<article class="feature">
        <a class="feature-media" href="${L.productHref(first.id)}">
          <img src="${L.foto(first.imagens[0].id, 1200)}" alt="${L.esc(first.imagens[0].alt)}" width="900" height="1120">
        </a>
        <div class="feature-copy">
          <p class="eyebrow">Mais escolhido</p>
          <h3>${L.esc(first.nome)}</h3>
          <p class="headline">${L.esc(first.headline)}</p>
          <p class="rating">${L.stars(first.avaliacao, first.avaliacoes)}</p>
          ${L.priceBlock(L.precoDe(first, L.variacaoPadrao(first)), L.mostrarDe(first, L.variacaoPadrao(first)) ? first.precoDe : null)}
          <div class="feature-actions">
            <a class="btn" href="${L.productHref(first.id)}">Ver produto</a>
            ${L.temCor(first)
              ? `<a class="btn btn-ghost" href="${L.productHref(first.id)}#comprar">Escolher tom</a>`
              : `<button type="button" class="btn btn-ghost" data-add="${L.esc(first.id)}">Adicionar</button>`}
          </div>
        </div>
      </article>
      <div class="feature-side">${side}</div>
      ${more.length ? `<div class="grid">${more.map((item) => L.cardHTML(item)).join("")}</div>` : ""}`;
      return;
    }
    node.innerHTML = items.map((item) => L.cardHTML(item)).join("");
  }

  function renderQuotes(node, quotes) {
    node.innerHTML = quotes.map((item) => `<figure class="quote">
      ${L.stars(item.nota)}
      <p>“${L.esc(item.texto)}”</p>
      <footer>${L.esc(item.nome)} · ${L.esc(item.cidade)}<br>${L.esc(item.produto)}</footer>
    </figure>`).join("");
  }

  function hero() {
    const root = document.querySelector("[data-hero]");
    if (!root) return;
    const slides = [...root.querySelectorAll(".hero-slide")];
    const indexEl = root.querySelector("[data-hero-index]");
    const pauseBtn = root.querySelector("[data-hero-pause]");
    let index = 0;
    let timer = 0;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let paused = reduce;

    function show(next) {
      index = (next + slides.length) % slides.length;
      slides.forEach((slide, i) => {
        const on = i === index;
        slide.classList.toggle("is-active", on);
        slide.setAttribute("aria-hidden", on ? "false" : "true");
        slide.toggleAttribute("inert", !on);
      });
      if (indexEl) indexEl.textContent = `${String(index + 1).padStart(2, "0")} / ${String(slides.length).padStart(2, "0")}`;
    }

    function play() {
      clearInterval(timer);
      if (paused) return;
      timer = setInterval(() => show(index + 1), 6800);
    }

    root.querySelector("[data-hero-next]")?.addEventListener("click", () => { show(index + 1); play(); });
    root.querySelector("[data-hero-prev]")?.addEventListener("click", () => { show(index - 1); play(); });
    pauseBtn?.addEventListener("click", () => {
      paused = !paused;
      pauseBtn.setAttribute("aria-pressed", paused ? "true" : "false");
      pauseBtn.textContent = paused ? "Reproduzir" : "Pausar";
      play();
    });
    root.addEventListener("mouseenter", () => clearInterval(timer));
    root.addEventListener("mouseleave", play);
    if (reduce && pauseBtn) {
      pauseBtn.setAttribute("aria-pressed", "true");
      pauseBtn.textContent = "Reproduzir";
    }
    show(0);
    play();
  }

  L.onReady(() => {
    hero();
    L.ready.then(() => {
      if (L.failed()) {
        document.querySelectorAll("[data-vitrine], [data-quotes]").forEach((node) => {
          node.innerHTML = "<p class='loading'>Não foi possível carregar a vitrine.</p>";
        });
        return;
      }
      document.querySelectorAll("[data-vitrine]").forEach((node) => {
        const key = node.dataset.vitrine;
        let items = L.produtos().filter((item) => (item.vitrines || []).includes(key));
        items.sort((a, b) => (b.semana || 0) - (a.semana || 0));
        if (key === "vendidos") items = items.slice(0, 5);
        renderVitrine(node, items);
        if (key === "vendidos") node.querySelectorAll(".badge").forEach((el) => el.remove());
      });
      const quotes = document.querySelector("[data-quotes]");
      if (quotes) renderQuotes(quotes, L.depoimentos());
    });
  });
})();
