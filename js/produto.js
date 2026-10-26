(function () {
  const L = window.Loja;

  L.onReady(() => {
    const root = document.getElementById("pdp-root");
    L.ready.then(() => {
      if (L.failed()) {
        root.innerHTML = "<p class='loading'>Não foi possível carregar o produto.</p>";
        root.removeAttribute("aria-busy");
        return;
      }
      const id = new URLSearchParams(location.search).get("id");
      const produto = L.byId(id);
      if (!produto) {
        root.removeAttribute("aria-busy");
        root.innerHTML = `<div class="missing wrap"><p class="eyebrow">Produto</p><h1>Esse item saiu da vitrine.</h1><p><a class="btn" href="catalogo.html">Voltar ao catálogo</a></p></div>`;
        document.title = "Produto não encontrado — Loja Paula";
        return;
      }
      document.title = `${produto.nome} — Loja Paula`;
      const desc = document.querySelector('meta[name="description"]');
      if (desc) desc.setAttribute("content", produto.headline);
      root.removeAttribute("aria-busy");
      root.innerHTML = montar(produto);
      ligar(produto);
    });
  });

  function montar(produto) {
    const variacao = L.variacaoPadrao(produto);
    const imgs = produto.imagens.map((img, i) => `<button type="button" data-thumb="${i}" aria-pressed="${i === 0 ? "true" : "false"}" aria-label="Foto ${i + 1} de ${produto.imagens.length}"><img src="${L.foto(img.id, 160)}" alt="" width="128" height="128" loading="lazy" decoding="async"></button>`).join("");
    return `<article class="wrap pdp">
      <div class="gallery">
        <nav class="crumbs" aria-label="Trilha">
          <a href="index.html">Início</a> / <a href="catalogo.html?cat=${L.esc(produto.categoria)}">${L.esc(L.catNome(produto.categoria))}</a> / <span aria-current="page">${L.esc(produto.nome)}</span>
        </nav>
        <div class="gallery-main" data-gallery tabindex="0" aria-label="Galeria de fotos">
          <img src="${L.foto(produto.imagens[0].id, 960)}" alt="${L.esc(produto.imagens[0].alt)}" width="960" height="960" data-main>
        </div>
        <div class="thumbs">${imgs}</div>
      </div>
      <div class="buy" id="comprar">
        <p class="eyebrow">${L.esc(L.catNome(produto.categoria))}</p>
        <h1>${L.esc(produto.nome)}</h1>
        <p class="headline">${L.esc(produto.headline)}</p>
        <p class="rating"><a href="#avaliacoes">${L.stars(produto.avaliacao, produto.avaliacoes)} <span class="inst">${produto.avaliacoes} avaliações</span></a></p>
        <div data-price></div>
        <div data-options></div>
        ${produto.pecas ? `<div><p class="eyebrow">Dentro do kit</p><ul class="pieces">${produto.pecas.map((peca) => `<li>${L.esc(peca)}</li>`).join("")}</ul></div>` : ""}
        <div class="pdp-qty">
          <span id="qtd-label">Quantidade</span>
          <div class="qty" role="group" aria-labelledby="qtd-label">
            <button type="button" data-step="-1" aria-label="Diminuir quantidade">−</button>
            <span data-qtd>1</span>
            <button type="button" data-step="1" aria-label="Aumentar quantidade">+</button>
          </div>
        </div>
        <div class="buy-actions">
          <button type="button" class="btn btn-block" data-comprar>Comprar agora</button>
          <button type="button" class="btn btn-ghost btn-block" data-adicionar>Adicionar à sacola</button>
        </div>
        <p class="trust">Envio de São Paulo · troca em até 30 dias<br>Pix ou cartão, combinados no WhatsApp ${L.esc(L.config.whatsappDisplay)}</p>
        <p class="low-stock" data-stock hidden></p>
        <p class="social-proof" data-social hidden></p>
        <div data-kit></div>
      </div>
    </article>
    <div class="wrap story">
      <section>
        <h2>O que ele faz</h2>
        <p>${L.esc(produto.descricao)}</p>
      </section>
      <div class="benefit-grid">
        ${produto.beneficios.map((item) => `<article><h3>${L.esc(item.titulo)}</h3><p>${L.esc(item.texto)}</p></article>`).join("")}
      </div>
      <section>
        <h2>Modo de uso</h2>
        <ol class="steps">${produto.modoDeUso.map((passo) => `<li>${L.esc(passo)}</li>`).join("")}</ol>
      </section>
      <details>
        <summary>Ingredientes</summary>
        <p>${L.esc(produto.ingredientes)}</p>
      </details>
      <details>
        <summary>Frete e troca</summary>
        <p>Frete grátis acima de ${L.money(L.config.freteGratisMinimo)} para todo o Brasil. Abaixo disso, a Paula confirma o valor no WhatsApp. Troca em até 30 dias para produto sem uso, na embalagem original.</p>
      </details>
    </div>
    <section class="wrap story" id="avaliacoes" aria-labelledby="titulo-avaliacoes">
      <header class="reviews">
        <div>
          <p class="eyebrow">Avaliações</p>
          <h2 id="titulo-avaliacoes">Quem já usou</h2>
        </div>
        <p class="score">${Number(produto.avaliacao).toFixed(1).replace(".", ",")}</p>
      </header>
      <p class="rating">${L.stars(produto.avaliacao, produto.avaliacoes)}</p>
      ${produto.comentarios.map((item) => `<article class="review">
        <h3>${L.esc(item.nome)} · ${L.esc(item.cidade)}</h3>
        <p class="rating">${L.stars(item.nota)} <span class="inst">${L.esc(item.data)}</span></p>
        <p>${L.esc(item.texto)}</p>
      </article>`).join("")}
    </section>
    <section class="wrap section" aria-labelledby="ritual">
      <div class="section-head">
        <div>
          <p class="eyebrow">Ritual</p>
          <h2 id="ritual">${produto.categoria === "kits" ? "As peças, também avulsas" : "Complete o ritual"}</h2>
        </div>
      </div>
      <div class="grid" data-related></div>
    </section>
    <div class="buy-sticky" data-sticky hidden>
      <div>
        <strong>${L.esc(produto.nome)}</strong>
        <span data-sticky-meta></span>
      </div>
      <button type="button" class="btn" data-adicionar>Adicionar</button>
    </div>`;
  }

  function ligar(produto) {
    let foto = 0;
    let qtd = 1;
    let variacao = L.variacaoPadrao(produto);
    const max = Math.max(1, Math.min(10, produto.estoque || 10));
    const main = document.querySelector("[data-main]");
    const gallery = document.querySelector("[data-gallery]");

    function desenharPreco() {
      const preco = L.precoDe(produto, variacao);
      const de = L.mostrarDe(produto, variacao) ? produto.precoDe : null;
      const save = de ? `<p class="save">Você economiza ${L.money(de - preco)}</p>` : "";
      document.querySelector("[data-price]").innerHTML = L.priceBlock(preco, de) + save;
      const meta = document.querySelector("[data-sticky-meta]");
      const nomeVar = variacao ? variacao.nome : "";
      if (meta) meta.textContent = `${nomeVar ? nomeVar + " · " : ""}${L.money(preco)}`;
    }

    function desenharOpcoes() {
      const lista = produto.variacoes || [];
      const box = document.querySelector("[data-options]");
      if (!lista.length) {
        box.innerHTML = "";
        return;
      }
      const tipo = lista[0].tipo;
      const label = tipo === "cor" ? "Tom" : "Tamanho";
      const botoes = lista.map((item) => {
        const on = variacao && item.id === variacao.id;
        if (tipo === "cor") {
          return `<button type="button" role="radio" aria-checked="${on}" data-var="${L.esc(item.id)}"><span class="dot" style="background:${L.esc(item.hex)}"></span>${L.esc(item.nome)}</button>`;
        }
        return `<button type="button" class="size-pill" role="radio" aria-checked="${on}" data-var="${L.esc(item.id)}">${L.esc(item.nome)}</button>`;
      }).join("");
      box.innerHTML = `<p class="eyebrow" id="var-label">${label}${variacao ? `: ${L.esc(variacao.nome)}` : ""}</p><div class="${tipo === "cor" ? "swatches" : "sizes"}" role="radiogroup" aria-labelledby="var-label">${botoes}</div>`;
    }

    function mostrarFoto(index) {
      const imgs = produto.imagens;
      foto = (index + imgs.length) % imgs.length;
      main.src = L.foto(imgs[foto].id, 960);
      main.alt = imgs[foto].alt;
      document.querySelectorAll("[data-thumb]").forEach((btn) => {
        btn.setAttribute("aria-pressed", Number(btn.dataset.thumb) === foto ? "true" : "false");
      });
    }

    function extras() {
      const stock = document.querySelector("[data-stock]");
      if (produto.estoque <= 8) {
        stock.hidden = false;
        stock.textContent = `Restam poucas unidades — ${produto.estoque} em estoque.`;
      }
      const social = document.querySelector("[data-social]");
      if (produto.semana >= 12) {
        social.hidden = false;
        social.textContent = `${produto.semana} pessoas levaram nesta semana.`;
      }
      const kit = (produto.relacionados || []).map(L.byId).find((item) => item && item.categoria === "kits");
      const slot = document.querySelector("[data-kit]");
      if (kit && produto.categoria !== "kits") {
        const economia = kit.precoDe && kit.precoDe > kit.preco ? ` Você economiza ${L.money(kit.precoDe - kit.preco)}.` : "";
        slot.innerHTML = `<aside class="kit-banner"><p class="eyebrow">Leve o ritual pronto</p><h2 class="serif">${L.esc(kit.nome)}</h2><p>${L.esc(kit.headline)}${economia}</p><p><a class="text-link" href="${L.productHref(kit.id)}">Ver o kit · ${L.money(kit.preco)}</a></p></aside>`;
      }
      const related = (produto.relacionados || []).map(L.byId).filter(Boolean);
      document.querySelector("[data-related]").innerHTML = related.map((item) => L.cardHTML(item)).join("");
    }

    function entrar(irParaSacola) {
      const result = L.add(produto.id, variacao ? variacao.id : "", qtd);
      const detalhe = result.variacao ? ` (${result.variacao})` : "";
      if (irParaSacola) {
        location.href = "carrinho.html";
        return;
      }
      L.toast(result.capped ? `Quantidade máxima de ${result.nome} na sacola` : `${qtd} × ${result.nome}${detalhe} na sacola`);
      L.openDrawer();
    }

    document.querySelector("[data-options]").addEventListener("click", (event) => {
      const btn = event.target.closest("[data-var]");
      if (!btn) return;
      variacao = L.acharVariacao(produto, btn.dataset.var);
      desenharOpcoes();
      desenharPreco();
    });

    document.querySelector("[data-options]").addEventListener("keydown", (event) => {
      if (!["ArrowRight", "ArrowLeft", "ArrowUp", "ArrowDown"].includes(event.key)) return;
      const buttons = [...document.querySelectorAll("[data-options] [data-var]")];
      const current = buttons.findIndex((btn) => btn.getAttribute("aria-checked") === "true");
      const dir = event.key === "ArrowRight" || event.key === "ArrowDown" ? 1 : -1;
      const next = buttons[(current + dir + buttons.length) % buttons.length];
      if (!next) return;
      event.preventDefault();
      variacao = L.acharVariacao(produto, next.dataset.var);
      desenharOpcoes();
      desenharPreco();
      document.querySelector(`[data-options] [data-var="${next.dataset.var}"]`)?.focus();
    });

    document.querySelector(".thumbs").addEventListener("click", (event) => {
      const btn = event.target.closest("[data-thumb]");
      if (btn) mostrarFoto(Number(btn.dataset.thumb));
    });

    gallery.addEventListener("keydown", (event) => {
      if (event.key === "ArrowRight") mostrarFoto(foto + 1);
      if (event.key === "ArrowLeft") mostrarFoto(foto - 1);
    });

    let toque = null;
    gallery.addEventListener("touchstart", (event) => { toque = event.changedTouches[0].clientX; }, { passive: true });
    gallery.addEventListener("touchend", (event) => {
      if (toque == null) return;
      const dx = event.changedTouches[0].clientX - toque;
      if (Math.abs(dx) > 40) mostrarFoto(foto + (dx < 0 ? 1 : -1));
      toque = null;
    }, { passive: true });

    document.querySelectorAll("[data-step]").forEach((btn) => {
      btn.addEventListener("click", () => {
        qtd = Math.max(1, Math.min(max, qtd + Number(btn.dataset.step)));
        document.querySelector("[data-qtd]").textContent = String(qtd);
      });
    });

    document.querySelector("[data-comprar]").addEventListener("click", () => entrar(true));
    document.querySelectorAll("[data-adicionar]").forEach((btn) => {
      btn.addEventListener("click", () => entrar(false));
    });

    const alvo = document.querySelector(".buy-actions");
    const sticky = document.querySelector("[data-sticky]");
    const mobile = window.matchMedia("(max-width: 979px)");
    if (alvo && sticky && "IntersectionObserver" in window) {
      const sync = (visible) => {
        sticky.hidden = !mobile.matches || visible;
      };
      const io = new IntersectionObserver(([entry]) => sync(entry.isIntersecting), { threshold: 0.15 });
      io.observe(alvo);
      mobile.addEventListener?.("change", () => sync(false));
    }

    desenharOpcoes();
    desenharPreco();
    extras();
  }
})();
