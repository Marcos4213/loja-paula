# Loja Paula

Vitrine estática de beleza e cosméticos (pt-BR, preços em R$). O pedido é fechado no WhatsApp: não há backend nem pagamento no site.

Publicação: [https://marcos4213.github.io/loja-paula/](https://marcos4213.github.io/loja-paula/)

## WhatsApp

O número fica **somente** em [`js/config.js`](js/config.js).

```js
window.LOJA_PAULA_CONFIG = {
  whatsapp: "5511947102630",       // só dígitos, com DDI 55 — usado no wa.me
  whatsappDisplay: "+55 11 94710-2630", // como aparece no site
  freteGratisMinimo: 199,
  parcelas: 3
};
```

Para trocar o atendimento, edite esses dois campos e publique de novo. O botão **Finalizar no WhatsApp** (sacola e mini-carrinho) monta a mensagem com itens, variação, quantidade, preço unitário, subtotal e total, e abre `https://wa.me/<número>`.

## Produtos de exemplo

O catálogo, as avaliações e os depoimentos estão em [`data/loja.json`](data/loja.json). São **dados fictícios** de demonstração (preços, estoque, notas e comentários). As fotos vêm do Unsplash, por ID estável.

Cada produto aceita, entre outros campos:

- `categoria`: `skincare`, `maquiagem`, `cabelos`, `corpo`, `perfumaria`, `kits`
- `preco`, `precoDe`, `avaliacao`, `avaliacoes`, `badge`, `tags`, `estoque`
- `vitrines`: `vendidos`, `escolhidos`, `lancamentos`
- `variacoes`: tamanho (`preco` próprio) ou cor (`hex`)
- `imagens`: `{ "id": "<id-unsplash>", "alt": "..." }`
- `relacionados`, `beneficios`, `modoDeUso`, `comentarios`

Depois de editar o JSON, abra o site de novo. Não precisa de build.

## Rodar localmente

Na raiz do repositório:

```bash
python3 -m http.server 4173
```

Abra `http://127.0.0.1:4173/`. Use um servidor HTTP: abrir o HTML direto no disco quebra o carregamento de `data/loja.json`.

## GitHub Pages

O workflow [`.github/workflows/pages.yml`](.github/workflows/pages.yml) publica a branch `main` com GitHub Actions. Os caminhos são relativos para funcionar no subpath `/loja-paula/`.

No repositório, a origem do Pages precisa ser **GitHub Actions** (Settings → Pages).

## O que o site faz

- Início com hero, campanhas, mais vendidos, mais escolhidos, lançamentos, categorias, benefícios, depoimentos e newsletter (o e-mail fica só no navegador).
- Catálogo com busca, filtros e ordenação.
- Página de produto com galeria, tom ou tamanho, avaliações, produtos do ritual e barra fixa de compra no celular.
- Sacola em `localStorage`: adicionar, quantidade, remover, subtotal, mini-carrinho e frete grátis progressivo a partir do valor definido na config.
