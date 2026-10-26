(function () {
  const CFG = window.LOJA_PAULA_CONFIG;
  const CART_KEY = "loja-paula-sacola-v1";
  const NEWS_KEY = "loja-paula-newsletter";
  const NOTE_KEY = "loja-paula-recado";
  const moneyFmt = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

  const CATEGORIAS = {
    skincare: {
      nome: "Skincare",
      lead: "Texturas leves para o clima daqui. Rotinas curtas, de manhã e à noite."
    },
    maquiagem: {
      nome: "Maquiagem",
      lead: "Cor que parece sua. Poucos tons, todos usáveis, nenhum neon."
    },
    cabelos: {
      nome: "Cabelos",
      lead: "Raiz leve, comprimento cuidado. Menos produto, mais jeito de usar."
    },
    corpo: {
      nome: "Corpo & Banho",
      lead: "O banho como ritual. Óleos, sais e manteigas com perfume baixo."
    },
    perfumaria: {
      nome: "Perfumaria",
      lead: "Flor de laranjeira, chá branco, madeira clara. Perfume de pele."
    },
    kits: {
      nome: "Kits",
      lead: "Rituais prontos e presentes que já conversam entre si."
    }
  };

  const state = { produtos: [], depoimentos: [], aviso: "", failed: false };
  const listeners = new Set();
  let booted = false;
  let lastFocus = null;

  const ready = fetch("data/loja.json", { cache: "no-cache" })
    .then((res) => {
      if (!res.ok) throw new Error("vitrine");
      return res.json();
    })
    .then((data) => {
      state.produtos = Array.isArray(data.produtos) ? data.produtos : [];
      state.depoimentos = Array.isArray(data.depoimentos) ? data.depoimentos : [];
      state.aviso = data.aviso || "";
      return state;
    })
    .catch(() => {
      state.failed = true;
      return state;
    });

  function onReady(fn) {
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", fn);
    else fn();
  }

  function esc(value) {
    return String(value ?? "").replace(/[&<>"']/g, (ch) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;"
    }[ch]));
  }

  function money(value) {
    return moneyFmt.format(Number(value) || 0);
  }

  function norm(value) {
    return String(value || "")
      .toLowerCase()
      .normalize("NFD")
      .replace(/\p{Diacritic}/gu, "");
  }

  function foto(id, width) {
    return `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${width}&q=75`;
  }

  function byId(id) {
    return state.produtos.find((item) => item.id === id) || null;
  }

  function variacaoPadrao(produto) {
    const lista = produto.variacoes || [];
    if (!lista.length) return null;
    return lista.find((item) => item.padrao) || lista[0];
  }

  function acharVariacao(produto, id) {
    if (!produto || !id) return variacaoPadrao(produto);
    return (produto.variacoes || []).find((item) => item.id === id) || variacaoPadrao(produto);
  }

  function precoDe(produto, variacao) {
    if (variacao && typeof variacao.preco === "number") return variacao.preco;
    return produto.preco;
  }

  function mostrarDe(produto, variacao) {
    if (!produto.precoDe || produto.precoDe <= precoDe(produto, variacao)) return false;
    if (!variacao || typeof variacao.preco !== "number") return true;
    return variacao.preco === produto.preco;
  }

  function temCor(produto) {
    return (produto.variacoes || []).some((item) => item.tipo === "cor");
  }

  function catNome(id) {
    return CATEGORIAS[id] ? CATEGORIAS[id].nome : id;
  }

  function stars(nota, count) {
    const valor = Number(nota) || 0;
    const pct = Math.max(0, Math.min(100, (valor / 5) * 100));
    const notaTxt = valor.toFixed(1).replace(".", ",");
    const extra = count != null ? `, ${count} avaliações` : "";
    return `<span class="stars" style="--p:${pct.toFixed(1)}%" role="img" aria-label="${esc(notaTxt + " de 5 estrelas" + extra)}"><span class="stars-bg" aria-hidden="true">★★★★★</span><span class="stars-fg" aria-hidden="true">★★★★★</span></span>`;
  }

  function priceBlock(preco, de) {
    const antigo = de && de > preco ? `<s>${money(de)}</s>` : "";
    const inst = preco >= 60
      ? `<span class="inst">${CFG.parcelas}x de ${money(preco / CFG.parcelas)} sem juros</span>`
      : "";
    return `<p class="price"><span class="now">${money(preco)}</span>${antigo}</p>${inst}`;
  }

  function productHref(id) {
    return `produto.html?id=${encodeURIComponent(id)}`;
  }

  function cardHTML(produto) {
    const variacao = variacaoPadrao(produto);
    const preco = precoDe(produto, variacao);
    const de = mostrarDe(produto, variacao) ? produto.precoDe : null;
    const img = produto.imagens[0];
    const acao = temCor(produto)
      ? `<a class="card-add" href="${productHref(produto.id)}#comprar">Escolher tom</a>`
      : `<button type="button" class="card-add" data-add="${esc(produto.id)}">Adicionar à sacola</button>`;
    const badge = produto.badge ? `<span class="badge">${esc(produto.badge)}</span>` : "";
    return `<article class="card">
      <a class="card-media" href="${productHref(produto.id)}">
        ${badge}
        <img src="${foto(img.id, 800)}" alt="${esc(img.alt)}" width="800" height="1000" loading="lazy" decoding="async">
      </a>
      <div class="card-body">
        <p class="card-cat">${esc(catNome(produto.categoria))}</p>
        <h3><a href="${productHref(produto.id)}">${esc(produto.nome)}</a></h3>
        <p class="headline">${esc(produto.headline)}</p>
        <p class="rating">${stars(produto.avaliacao, produto.avaliacoes)}</p>
        ${priceBlock(preco, de)}
        ${acao}
      </div>
    </article>`;
  }

  function readCart() {
    try {
      const data = JSON.parse(localStorage.getItem(CART_KEY) || "[]");
      if (!Array.isArray(data)) return [];
      return data
        .map((item) => ({
          id: String(item.id || ""),
          variacao: item.variacao ? String(item.variacao) : "",
          qtd: Math.max(1, Math.min(10, parseInt(item.qtd, 10) || 1))
        }))
        .filter((item) => item.id);
    } catch (err) {
      return [];
    }
  }

  function writeCart(items) {
    localStorage.setItem(CART_KEY, JSON.stringify(items));
    listeners.forEach((fn) => fn());
    renderCartCount();
    if (document.body.classList.contains("drawer-open")) renderDrawer();
  }

  function lineKey(id, variacao) {
    return `${id}::${variacao || "unico"}`;
  }

  function lines() {
    return readCart()
      .map((item) => {
        const produto = byId(item.id);
        if (!produto) return null;
        const variacao = item.variacao ? acharVariacao(produto, item.variacao) : null;
        const unit = precoDe(produto, variacao);
        const max = Math.max(1, Math.min(10, produto.estoque || 10));
        const qtd = Math.min(item.qtd, max);
        const img = produto.imagens[0];
        return {
          key: lineKey(item.id, variacao ? variacao.id : ""),
          id: produto.id,
          nome: produto.nome,
          variacaoId: variacao ? variacao.id : "",
          variacaoNome: variacao ? variacao.nome : "",
          qtd,
          unit,
          total: Math.round(unit * qtd * 100) / 100,
          imagem: img.id,
          alt: img.alt,
          estoque: max,
          href: productHref(produto.id)
        };
      })
      .filter(Boolean);
  }

  function subtotal(list) {
    const rows = list || lines();
    return Math.round(rows.reduce((sum, row) => sum + row.unit * row.qtd, 0) * 100) / 100;
  }

  function count() {
    return readCart().reduce((sum, item) => sum + item.qtd, 0);
  }

  function add(id, variacaoId, qtd) {
    const produto = byId(id);
    if (!produto) return { ok: false, reason: "missing" };
    const variacao = acharVariacao(produto, variacaoId);
    const vid = variacao ? variacao.id : "";
    const max = Math.max(1, Math.min(10, produto.estoque || 10));
    const items = readCart();
    const found = items.find((item) => item.id === id && (item.variacao || "") === vid);
    const addQtd = Math.max(1, qtd || 1);
    if (found) {
      const next = Math.min(max, found.qtd + addQtd);
      const capped = next === found.qtd;
      found.qtd = next;
      writeCart(items);
      return { ok: true, capped, nome: produto.nome, variacao: variacao ? variacao.nome : "" };
    }
    items.push({ id, variacao: vid, qtd: Math.min(max, addQtd) });
    writeCart(items);
    return { ok: true, capped: addQtd > max, nome: produto.nome, variacao: variacao ? variacao.nome : "" };
  }

  function setQty(id, variacaoId, qtd) {
    const produto = byId(id);
    if (!produto) return;
    const max = Math.max(1, Math.min(10, produto.estoque || 10));
    const items = readCart();
    const vid = variacaoId || "";
    const found = items.find((item) => item.id === id && (item.variacao || "") === vid);
    if (!found) return;
    const next = parseInt(qtd, 10);
    if (!next || next < 1) {
      writeCart(items.filter((item) => item !== found));
      return;
    }
    found.qtd = Math.min(max, next);
    writeCart(items);
  }

  function remove(id, variacaoId) {
    const vid = variacaoId || "";
    writeCart(readCart().filter((item) => !(item.id === id && (item.variacao || "") === vid)));
  }

  function subscribe(fn) {
    listeners.add(fn);
    return () => listeners.delete(fn);
  }

  function freteEstado(total) {
    const meta = CFG.freteGratisMinimo;
    const falta = Math.max(0, Math.round((meta - total) * 100) / 100);
    const pct = Math.max(0, Math.min(100, (total / meta) * 100));
    return { meta, falta, pct, gratis: total >= meta && total > 0 };
  }

  function shipHTML(total) {
    const frete = freteEstado(total);
    if (total <= 0) return "";
    const label = frete.gratis
      ? "Frete grátis garantido neste pedido"
      : `Faltam ${money(frete.falta)} para frete grátis`;
    return `<div class="ship-bar">
      <p>${label}</p>
      <div class="track" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${Math.round(frete.pct)}" aria-label="${esc(label)}">
        <span style="width:${frete.pct}%"></span>
      </div>
    </div>`;
  }

  function sugestoes(rows) {
    const ids = new Set(rows.map((row) => row.id));
    const total = subtotal(rows);
    const falta = Math.max(0, CFG.freteGratisMinimo - total);
    const pool = state.produtos.filter((item) => !ids.has(item.id));
    if (falta > 0 && rows.length) {
      const ranked = pool
        .map((item) => ({ item, preco: precoDe(item, variacaoPadrao(item)) }))
        .filter((entry) => entry.preco <= falta + 40)
        .sort((a, b) => Math.abs(a.preco - falta) - Math.abs(b.preco - falta));
      if (ranked.length) return ranked.slice(0, 2).map((entry) => entry.item);
    }
    const kits = pool.filter((item) => item.categoria === "kits");
    const vendidos = pool.filter((item) => (item.vitrines || []).includes("vendidos"));
    return [...kits, ...vendidos, ...pool].filter((item, index, arr) => arr.indexOf(item) === index).slice(0, 2);
  }

  function upsellHTML(produtos) {
    if (!produtos.length) return "";
    const cards = produtos.map((produto) => {
      const img = produto.imagens[0];
      const preco = precoDe(produto, variacaoPadrao(produto));
      const acao = temCor(produto)
        ? `<a href="${productHref(produto.id)}#comprar">Escolher</a>`
        : `<button type="button" data-add="${esc(produto.id)}">Adicionar</button>`;
      return `<article class="upsell">
        <a href="${productHref(produto.id)}"><img src="${foto(img.id, 240)}" alt="${esc(img.alt)}" width="88" height="110"></a>
        <div>
          <h3><a href="${productHref(produto.id)}">${esc(produto.nome)}</a></h3>
          <p>${money(preco)}</p>
          ${acao}
        </div>
      </article>`;
    }).join("");
    return `<div class="upsell-block"><p class="eyebrow">Complete o pedido</p><div class="upsell-row">${cards}</div></div>`;
  }

  function mensagemPedido(rows, total, recado) {
    const corpo = rows.map((row) => {
      const variacao = row.variacaoNome ? ` (${row.variacaoNome})` : "";
      return `• ${row.nome}${variacao} — ${row.qtd} × ${money(row.unit)} = ${money(row.total)}`;
    }).join("\n");
    const frete = freteEstado(total);
    const freteTxt = frete.gratis
      ? "Grátis"
      : `A confirmar (faltam ${money(frete.falta)} para frete grátis)`;
    const linhas = [
      `Olá, Paula! Quero finalizar meu pedido na ${CFG.nome}.`,
      "",
      corpo,
      "",
      `Subtotal: ${money(total)}`,
      `Frete: ${freteTxt}`,
      `Total dos produtos: ${money(total)}`
    ];
    if (recado) {
      linhas.push("", `Recado: ${recado}`);
    }
    linhas.push("", "Pode me confirmar a entrega e o pagamento?");
    return linhas.join("\n");
  }

  function whatsappUrl(text) {
    const phone = String(CFG.whatsapp || "").replace(/\D/g, "");
    return `https://wa.me/${phone}?text=${encodeURIComponent(text)}`;
  }

  function openWhatsApp(rows, total, recado) {
    const url = whatsappUrl(mensagemPedido(rows, total, recado));
    window.open(url, "_blank", "noopener,noreferrer");
  }

  function toast(message) {
    const el = document.querySelector("[data-toast]");
    if (!el) return;
    el.textContent = message;
    el.classList.add("is-on");
    clearTimeout(toast._t);
    toast._t = setTimeout(() => el.classList.remove("is-on"), 2600);
  }

  function renderCartCount() {
    const n = count();
    document.querySelectorAll("[data-cart-count]").forEach((el) => {
      el.textContent = String(n);
      el.hidden = n < 1;
    });
  }

  function lineItemsHTML(rows) {
    if (!rows.length) {
      const seeds = state.produtos.filter((item) => (item.vitrines || []).includes("vendidos")).slice(0, 3);
      return `<div class="empty-bag">
        <p class="empty-title">Sua sacola está vazia, e a pele continua podendo começar por um clássico.</p>
        <div class="empty-links">${seeds.map((item) => `<a href="${productHref(item.id)}">${esc(item.nome)}</a>`).join("")}</div>
      </div>`;
    }
    return rows.map((row) => `<article class="line">
      <a class="line-media" href="${row.href}"><img src="${foto(row.imagem, 240)}" alt="${esc(row.alt)}" width="88" height="110"></a>
      <div class="line-copy">
        <h3><a href="${row.href}">${esc(row.nome)}</a></h3>
        ${row.variacaoNome ? `<p class="line-var">${esc(row.variacaoNome)}</p>` : ""}
        <p class="line-unit">${money(row.unit)}</p>
        <div class="qty" role="group" aria-label="Quantidade de ${esc(row.nome)}">
          <button type="button" data-qty="${esc(row.id)}" data-var="${esc(row.variacaoId)}" data-delta="-1" aria-label="Diminuir quantidade">−</button>
          <span>${row.qtd}</span>
          <button type="button" data-qty="${esc(row.id)}" data-var="${esc(row.variacaoId)}" data-delta="1" aria-label="Aumentar quantidade">+</button>
        </div>
        <button type="button" class="linkish" data-remove="${esc(row.id)}" data-var="${esc(row.variacaoId)}">Remover</button>
      </div>
      <p class="line-total">${money(row.total)}</p>
    </article>`).join("");
  }

  function renderDrawer() {
    const root = document.querySelector("[data-drawer-body]");
    const foot = document.querySelector("[data-drawer-foot]");
    const ship = document.querySelector("[data-ship]");
    if (!root || !foot || !ship) return;
    const rows = lines();
    const total = subtotal(rows);
    const title = document.getElementById("drawer-title");
    if (title) title.textContent = rows.length ? `Sua sacola (${count()})` : "Sua sacola";
    ship.innerHTML = shipHTML(total);
    root.innerHTML = lineItemsHTML(rows) + (rows.length ? upsellHTML(sugestoes(rows)) : "");
    if (!rows.length) {
      foot.innerHTML = `<a class="btn btn-block" href="catalogo.html">Ver o catálogo</a>`;
      return;
    }
    foot.innerHTML = `<p class="subtotal"><span>Subtotal</span><strong>${money(total)}</strong></p>
      <button type="button" class="btn btn-block" data-wa>Finalizar no WhatsApp</button>
      <a class="text-link center" href="carrinho.html">Ver sacola completa</a>`;
  }

  function openDrawer() {
    const root = document.querySelector("[data-drawer]");
    if (!root) return;
    lastFocus = document.activeElement;
    renderDrawer();
    root.hidden = false;
    document.body.classList.add("drawer-open");
    const dialog = root.querySelector(".drawer");
    dialog?.focus();
  }

  function closeDrawer() {
    const root = document.querySelector("[data-drawer]");
    if (!root || root.hidden) return;
    root.hidden = true;
    document.body.classList.remove("drawer-open");
    if (lastFocus && typeof lastFocus.focus === "function") lastFocus.focus();
  }

  function setMenu(open) {
    document.body.classList.toggle("menu-open", open);
    const btn = document.querySelector("[data-open-menu]");
    const backdrop = document.querySelector("[data-menu-backdrop]");
    if (btn) btn.setAttribute("aria-expanded", open ? "true" : "false");
    if (backdrop) backdrop.hidden = !open;
  }

  function setSearch(open) {
    const pop = document.querySelector("[data-search-pop]");
    const btn = document.querySelector("[data-open-search]");
    if (!pop) return;
    pop.hidden = !open;
    if (btn) btn.setAttribute("aria-expanded", open ? "true" : "false");
    if (open) pop.querySelector("input")?.focus();
  }

  function focusables(container) {
    return [...container.querySelectorAll('a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])')]
      .filter((el) => !el.closest("[hidden]") && el.getClientRects().length);
  }

  function bindChrome() {
    if (booted) return;
    booted = true;

    document.querySelectorAll("[data-frete-min]").forEach((el) => {
      el.textContent = money(CFG.freteGratisMinimo);
    });
    document.querySelectorAll("[data-whatsapp-display]").forEach((el) => {
      el.textContent = CFG.whatsappDisplay;
    });
    document.querySelectorAll("[data-whatsapp-link]").forEach((el) => {
      const text = el.getAttribute("data-wa-text") || "Olá, Paula! Vim pelo site da Loja Paula.";
      el.href = whatsappUrl(text);
      el.target = "_blank";
      el.rel = "noopener noreferrer";
    });

    renderCartCount();

    document.addEventListener("click", (event) => {
      const addBtn = event.target.closest("[data-add]");
      if (addBtn && addBtn.tagName === "BUTTON") {
        event.preventDefault();
        ready.then(() => {
          const result = add(addBtn.getAttribute("data-add"), "", 1);
          if (!result.ok) return;
          const detalhe = result.variacao ? ` (${result.variacao})` : "";
          toast(result.capped
            ? `Quantidade máxima de ${result.nome} na sacola`
            : `${result.nome}${detalhe} entrou na sacola`);
          if (!document.body.classList.contains("page-cart")) openDrawer();
          else document.dispatchEvent(new CustomEvent("loja:cart"));
        });
        return;
      }

      const qtyBtn = event.target.closest("[data-qty]");
      if (qtyBtn) {
        const id = qtyBtn.getAttribute("data-qty");
        const variacao = qtyBtn.getAttribute("data-var") || "";
        const delta = parseInt(qtyBtn.getAttribute("data-delta"), 10) || 0;
        const current = lines().find((row) => row.id === id && row.variacaoId === variacao);
        if (current) setQty(id, variacao, current.qtd + delta);
        document.dispatchEvent(new CustomEvent("loja:cart"));
        return;
      }

      const removeBtn = event.target.closest("[data-remove]");
      if (removeBtn) {
        remove(removeBtn.getAttribute("data-remove"), removeBtn.getAttribute("data-var") || "");
        document.dispatchEvent(new CustomEvent("loja:cart"));
        return;
      }

      if (event.target.closest("[data-wa]")) {
        const rows = lines();
        if (!rows.length) return;
        const recado = document.querySelector("[data-recado]")?.value.trim() || sessionStorage.getItem(NOTE_KEY) || "";
        openWhatsApp(rows, subtotal(rows), recado);
        return;
      }

      if (event.target.closest("[data-open-cart]")) {
        openDrawer();
        return;
      }
      if (event.target.closest("[data-close-cart]")) {
        closeDrawer();
        return;
      }
      if (event.target.closest("[data-open-menu]")) {
        setMenu(!document.body.classList.contains("menu-open"));
        return;
      }
      if (event.target.closest("[data-close-menu]")) {
        setMenu(false);
        return;
      }
      if (event.target.closest("[data-open-search]")) {
        const pop = document.querySelector("[data-search-pop]");
        setSearch(pop?.hidden !== false);
      }
    });

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") {
        closeDrawer();
        setMenu(false);
        setSearch(false);
      }
      const drawer = document.querySelector("[data-drawer]");
      if (event.key === "Tab" && drawer && !drawer.hidden) {
        const nodes = focusables(drawer);
        if (!nodes.length) return;
        const first = nodes[0];
        const last = nodes[nodes.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    });

    document.querySelector("[data-search-pop]")?.addEventListener("submit", () => {
      setSearch(false);
    });

    window.addEventListener("resize", () => {
      if (window.innerWidth >= 980) setMenu(false);
    });

    window.addEventListener("storage", (event) => {
      if (event.key === CART_KEY) {
        renderCartCount();
        renderDrawer();
        document.dispatchEvent(new CustomEvent("loja:cart"));
      }
    });

    const news = document.querySelector("[data-news]");
    if (news) {
      const form = news.querySelector("form");
      const ok = news.querySelector("[data-news-ok]");
      const err = news.querySelector("[data-news-err]");
      if (localStorage.getItem(NEWS_KEY)) {
        form.hidden = true;
        ok.hidden = false;
      }
      form?.addEventListener("submit", (event) => {
        event.preventDefault();
        const input = form.querySelector("input[type=email]");
        const email = input.value.trim();
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
          err.hidden = false;
          err.textContent = "Digite um e-mail válido.";
          input.setAttribute("aria-invalid", "true");
          return;
        }
        localStorage.setItem(NEWS_KEY, email);
        err.hidden = true;
        form.hidden = true;
        ok.hidden = false;
      });
    }

    document.querySelectorAll("#menu-principal a").forEach((link) => {
      link.addEventListener("click", () => setMenu(false));
    });
  }

  window.Loja = {
    config: CFG,
    ready,
    produtos: () => state.produtos,
    depoimentos: () => state.depoimentos,
    failed: () => state.failed,
    categorias: CATEGORIAS,
    onReady,
    esc,
    money,
    norm,
    foto,
    byId,
    variacaoPadrao,
    acharVariacao,
    precoDe,
    mostrarDe,
    temCor,
    catNome,
    stars,
    priceBlock,
    productHref,
    cardHTML,
    lines,
    subtotal,
    count,
    add,
    setQty,
    remove,
    subscribe,
    freteEstado,
    shipHTML,
    sugestoes,
    upsellHTML,
    lineItemsHTML,
    mensagemPedido,
    whatsappUrl,
    openWhatsApp,
    toast,
    openDrawer,
    closeDrawer,
    renderDrawer,
    boot() {
      onReady(bindChrome);
    }
  };

  window.Loja.boot();
})();
