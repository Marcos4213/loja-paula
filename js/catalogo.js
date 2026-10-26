(function () {
  const L = window.Loja;

  function paramsFromUI() {
    const root = document.getElementById("filtros");
    const preco = [...root.querySelectorAll("input[name=preco]:checked")].map((el) => el.value);
    const tag = [...root.querySelectorAll("input[name=tag]:checked")].map((el) => el.value);
    const nota = root.querySelector("input[name=nota]:checked");
    const cat = root.querySelector("input[name=cat]:checked");
    const q = document.getElementById("busca-catalogo").value.trim();
    const ordem = document.getElementById("ordem").value;
    const data = new URLSearchParams();
    if (q) data.set("q", q);
    if (cat && cat.value) data.set("cat", cat.value);
    if (preco.length) data.set("preco", preco.join(","));
    if (tag.length) data.set("tag", tag.join(","));
    if (nota) data.set("nota", "4");
    if (ordem && ordem !== "destaque") data.set("ordem", ordem);
    return data;
  }

  function applyToUI(data) {
    const root = document.getElementById("filtros");
    const cat = data.get("cat") || "";
    root.querySelectorAll("input[name=cat]").forEach((el) => { el.checked = el.value === cat; });
    const precos = (data.get("preco") || "").split(",").filter(Boolean);
    root.querySelectorAll("input[name=preco]").forEach((el) => { el.checked = precos.includes(el.value); });
    const tags = (data.get("tag") || "").split(",").filter(Boolean);
    root.querySelectorAll("input[name=tag]").forEach((el) => { el.checked = tags.includes(el.value); });
    const nota = root.querySelector("input[name=nota]");
    if (nota) nota.checked = data.get("nota") === "4";
    document.getElementById("busca-catalogo").value = data.get("q") || "";
    document.getElementById("ordem").value = data.get("ordem") || "destaque";
    document.querySelectorAll("[data-cat-link]").forEach((link) => {
      link.classList.toggle("is-on", (link.dataset.catLink || "") === cat);
    });
  }

  function precoOk(valor, buckets) {
    if (!buckets.length) return true;
    return buckets.some((bucket) => {
      if (bucket === "ate100") return valor <= 100;
      if (bucket === "100a180") return valor > 100 && valor <= 180;
      return valor > 180;
    });
  }

  function score(produto) {
    let value = produto.avaliacao * 10 + (produto.semana || 0) / 20;
    if ((produto.vitrines || []).includes("vendidos")) value += 40;
    return value;
  }

  function filtrar(data) {
    const q = L.norm(data.get("q") || "");
    const cat = data.get("cat") || "";
    const precos = (data.get("preco") || "").split(",").filter(Boolean);
    const tags = (data.get("tag") || "").split(",").filter(Boolean);
    const nota = data.get("nota") === "4";
    let items = L.produtos().filter((produto) => {
      if (cat && produto.categoria !== cat) return false;
      const valor = L.precoDe(produto, L.variacaoPadrao(produto));
      if (!precoOk(valor, precos)) return false;
      if (tags.length && !tags.some((tag) => (produto.tags || []).includes(tag))) return false;
      if (nota && produto.avaliacao < 4) return false;
      if (q) {
        const blob = L.norm([
          produto.nome,
          produto.headline,
          L.catNome(produto.categoria),
          produto.ingredientes,
          ...(produto.tags || []),
          ...(produto.pecas || [])
        ].join(" "));
        if (!blob.includes(q)) return false;
      }
      return true;
    });
    const ordem = data.get("ordem") || "destaque";
    const byPreco = (a, b) => L.precoDe(a, L.variacaoPadrao(a)) - L.precoDe(b, L.variacaoPadrao(b));
    if (ordem === "preco-asc") items.sort(byPreco);
    else if (ordem === "preco-desc") items.sort((a, b) => byPreco(b, a));
    else if (ordem === "vendidos") items.sort((a, b) => (b.semana || 0) - (a.semana || 0));
    else if (ordem === "avaliacao") items.sort((a, b) => b.avaliacao - a.avaliacao || b.avaliacoes - a.avaliacoes);
    else if (ordem === "novos") items.sort((a, b) => (b.ordem || 0) - (a.ordem || 0));
    else items.sort((a, b) => score(b) - score(a));
    return items;
  }

  function titulo(data, total) {
    const q = data.get("q");
    const cat = data.get("cat");
    const meta = cat && L.categorias[cat] ? L.categorias[cat] : null;
    document.getElementById("cat-kicker").textContent = q ? "Busca" : (meta ? "Categoria" : "Catálogo");
    document.getElementById("cat-title").textContent = q
      ? `Resultados para “${q}”`
      : (meta ? meta.nome : "O catálogo");
    document.getElementById("cat-lead").textContent = q
      ? "Tudo que combina com o que você escreveu."
      : (meta ? meta.lead : "Skincare, maquiagem, cabelo, corpo e perfume. Poucas fórmulas, bem editadas.");
    document.title = `${q ? `Busca: ${q}` : (meta ? meta.nome : "Catálogo")} — Loja Paula`;
    const n = `${total} ${total === 1 ? "produto" : "produtos"}`;
    document.getElementById("resultado").textContent = n;
  }

  function render() {
    const data = new URLSearchParams(location.search);
    applyToUI(data);
    const grade = document.getElementById("grade");
    if (L.failed()) {
      grade.innerHTML = "<p class='loading'>Não foi possível carregar o catálogo.</p>";
      return;
    }
    const items = filtrar(data);
    titulo(data, items.length);
    const ativos = ["preco", "tag", "nota"].reduce((sum, key) => sum + (data.get(key) ? data.get(key).split(",").filter(Boolean).length : 0), 0);
    const toggle = document.querySelector("[data-open-filters]");
    if (toggle) toggle.textContent = ativos ? `Filtrar (${ativos})` : "Filtrar";
    if (!items.length) {
      grade.innerHTML = `<div class="empty-bag"><p class="empty-title">Nada com esses filtros.</p><p><a href="catalogo.html">Limpar e ver o catálogo</a></p></div>`;
      return;
    }
    grade.className = "grid";
    grade.innerHTML = items.map((item) => L.cardHTML(item)).join("");
  }

  function writeURL(push) {
    const data = paramsFromUI();
    const next = `${location.pathname}${data.toString() ? `?${data}` : ""}`;
    if (push) history.pushState(null, "", next);
    else history.replaceState(null, "", next);
    render();
  }

  function setFilters(open) {
    document.body.classList.toggle("filters-open", open);
    const backdrop = document.querySelector("[data-filters-backdrop]");
    const btn = document.querySelector("[data-open-filters]");
    if (backdrop) backdrop.hidden = !open;
    if (btn) btn.setAttribute("aria-expanded", open ? "true" : "false");
  }

  L.onReady(() => {
    L.ready.then(render);
    document.getElementById("filtros").addEventListener("change", () => writeURL(false));
    document.getElementById("ordem").addEventListener("change", () => writeURL(false));
    document.getElementById("busca-catalogo-form").addEventListener("submit", (event) => {
      event.preventDefault();
      writeURL(true);
    });
    document.querySelector("[data-open-filters]")?.addEventListener("click", () => {
      setFilters(!document.body.classList.contains("filters-open"));
    });
    document.querySelectorAll("[data-close-filters]").forEach((el) => {
      el.addEventListener("click", () => setFilters(false));
    });
    document.querySelectorAll("[data-cat-link]").forEach((link) => {
      link.addEventListener("click", (event) => {
        event.preventDefault();
        const input = document.querySelector(`input[name=cat][value="${link.dataset.catLink}"]`);
        if (input) input.checked = true;
        writeURL(true);
      });
    });
    window.addEventListener("popstate", render);
    window.addEventListener("resize", () => {
      if (window.innerWidth >= 980) setFilters(false);
    });
  });
})();
