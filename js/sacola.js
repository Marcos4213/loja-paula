(function () {
  const L = window.Loja;
  const NOTE_KEY = "loja-paula-recado";

  function render() {
    const root = document.getElementById("cart-root");
    if (!root) return;
    if (L.failed() && !L.produtos().length) {
      root.innerHTML = "<p class='loading'>Não foi possível carregar a sacola.</p>";
      return;
    }
    const rows = L.lines();
    const total = L.subtotal(rows);
    const frete = L.freteEstado(total);
    if (!rows.length) {
      root.innerHTML = `<div class="sheet">${L.lineItemsHTML(rows)}</div>`;
      return;
    }
    const freteLabel = frete.gratis ? "Grátis" : "A confirmar no WhatsApp";
    const recado = sessionStorage.getItem(NOTE_KEY) || "";
    root.innerHTML = `${L.shipHTML(total)}
      <div class="cart-grid">
        <div class="sheet">
          ${L.lineItemsHTML(rows)}
          ${L.upsellHTML(L.sugestoes(rows))}
        </div>
        <aside class="summary">
          <h2>Resumo</h2>
          <p class="total-row"><span>Subtotal</span><strong>${L.money(total)}</strong></p>
          <p class="total-row"><span>Frete</span><strong>${freteLabel}</strong></p>
          <p class="total-row"><span>Total dos produtos</span><strong>${L.money(total)}</strong></p>
          <p class="meta">Pedido enviado para ${L.esc(L.config.whatsappDisplay)}. A Paula confirma pagamento e entrega na conversa.</p>
          <label for="recado">Recado para a Paula (opcional)</label>
          <textarea id="recado" class="recado" data-recado maxlength="400" placeholder="Presente, endereço, tom de pele…">${L.esc(recado)}</textarea>
          <button type="button" class="btn btn-block" data-wa>Finalizar pedido no WhatsApp</button>
          <a class="text-link center" href="catalogo.html">Continuar escolhendo</a>
        </aside>
      </div>`;
    root.querySelector("[data-recado]")?.addEventListener("input", (event) => {
      sessionStorage.setItem(NOTE_KEY, event.target.value);
    });
  }

  L.onReady(() => {
    L.ready.then(render);
    document.addEventListener("loja:cart", render);
    L.subscribe(render);
  });
})();
