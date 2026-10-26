(function () {
  const L = window.Loja;
  L.onReady(() => {
    const form = document.getElementById("contato-form");
    if (!form) return;
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      const texto = String(new FormData(form).get("mensagem") || "").trim();
      if (!texto) return;
      window.open(L.whatsappUrl(texto), "_blank", "noopener,noreferrer");
    });
  });
})();
