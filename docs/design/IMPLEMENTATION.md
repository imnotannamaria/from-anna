# design — plano

Discovery fechado em 09/09/2026. O comp veio em `docs/design/from anna.local.html` (fora do git, bundle de 8.4MB).

Em português porque guarda o registro do discovery — as perguntas e as respostas ficam no fim do arquivo, e é lá que se vê por que cada fase é do jeito que é.

---

## O que ficou decidido

| | |
|---|---|
| Foto grudada, transcrição rolando ao lado | Sim, no desktop |
| Mobile | Mantém o toggle de hoje: foto primeiro, um toque pra transcrição |
| Zoom que segue o trecho | Só desktop |
| Como a região é definida | **Marcada à mão**, com a faixa proporcional como padrão |
| Carta de várias folhas | Cada folha vira sua própria seção grudada, empilhada na rolagem |
| Nome da carta na barra | As três palavras do slug, sem número |
| Progresso visível pro leitor | Mantém, junto com a linha de privacidade |
| `WRITE BACK` | `mailto:` por enquanto |
| Filtro da legenda | Momentâneo, não vai pra URL |
| Reveal por trecho | Degrada pra totalmente visível sem JS e sob reduced-motion |

---

## As duas perguntas que voltaram pra mim

### "Agora que vai ter a opção (a), a resolução ainda é problema?"

**É, e são coisas independentes.** A opção (a) decide *onde* dar zoom. A resolução decide se existe pixel *pra* dar zoom. Escolher a região à mão não acrescenta detalhe nenhum à foto.

Medi no comp: a foto grudada ocupa 616px de largura a 1440, e 728px a 1920. Com a fonte de hoje (1125×1500, teto de 1500):

| tela | zoom | precisa | 1125px cobre |
|---|---|---|---|
| 1440 retina | 1.0 | 1232px | **91%** |
| 1440 retina | 1.5 | 1848px | 61% |
| 1440 retina | 1.75 | 2156px | 52% |
| 1920 retina | 1.75 | 2548px | 44% |

Repara na primeira linha: **em tela retina a foto de hoje já está levemente mole antes de qualquer zoom.** A 1.75× cada pixel da fonte é esticado sobre dois de tela, e manuscrito é justamente onde isso lê como borrão e não como textura.

**Decisão: o teto sobe de 1500 pra 2400px, e o zoom máximo cai de 1.75 pra 1.5.** Com fonte de 1800×2400 fica 100% a zoom 1, 97% a 1.5 em 1440 retina, e 82% a 1.5 em 1920 retina. Nítido onde importa.

O custo é tamanho de arquivo: de ~300KB pra algo entre 700KB e 1MB. No plano Hobby do Blob (1GB) isso ainda dá mais de mil páginas, e cada leitura passa por função com `Cache-Control` de uma hora. É pagável.

Isso reverte parcialmente uma decisão de `photo-transcription/DECISIONS.md` — "1500px porque essa versão é a que as pessoas veem". O motivo continua válido; o que mudou é que agora existe um segundo consumidor da mesma imagem, que é o zoom. Vai registrado lá.

### "As fotos já enviadas continuam em 1500px?"

Existe **uma** carta de teste. Não há migração: é subir a foto de novo. Se um dia houver acervo, a regra é aceitar que carta antiga dá zoom pior — reprocessar exigiria a original, e a original não é guardada de propósito.

### Pergunta 4, "pense na melhor solução"

A melhor solução é **não escolher entre (a) e (c)**.

Região é **opcional**. Trecho sem região marcada cai na faixa proporcional — que é exatamente a opção (c). Marcar a região é um upgrade que você faz quando a página merece, não um imposto que toda carta paga.

Isso resolve as três coisas de uma vez:

- O custo por carta não sobe, que era a reclamação que originou o projeto inteiro.
- Região errada por derivação deixa de existir, porque não existe derivação.
- A opção (c) para de ser alternativa rejeitada e vira o estado padrão.

**E as regiões moram no markdown**, como diretiva, não numa tabela:

```md
:::passage{at="0.19 0.31"}
Oi — testando, e depois testing in English now.
:::
```

É a mesma decisão central do projeto: o `.md` carrega tudo, sem join e sem sincronização. Uma tabela de regiões teria o mesmo problema que a tabela de grifos teria tido — ponteiro pra texto mutável.

E tem um argumento a mais: o pacote se chama "página escaneada com **transcrição sincronizada**". Região por trecho *é* a sincronização. Ela pertence ao pacote, não ao app.

---

## Fases

Cada fase tem **Pronto quando** e **Checagens**. As checagens são convite pra olhar, não caixinha pra marcar.

### Fase 1 — Chrome e hero

Barra fixa: wordmark à esquerda, nome da carta no centro, chips da legenda à direita. Hero assimétrico, foto girada `-1.6deg` sangrando pra direita, legenda vertical em `writing-mode: vertical-rl`, `READ ↓` embaixo.

O nome da carta são **as três palavras do slug**, sem o token: `AUTUMN · BUREAU · COVE`. Não é sequencial, não conta quantas cartas existem, já é a identidade da carta, e amarra a URL à página de graça.

**Pronto quando**

- [ ] Nada no `<head>` nem na barra revela conteúdo da carta
- [ ] Os chips leem `--hl-important` / `--hl-note` / `--hl-ask` dos tokens, nunca hex repetido
- [ ] A barra não cobre conteúdo quando se pula por âncora
- [ ] Em 390px o wordmark não quebra em duas linhas e o nome não trunca

**Checagens**

- **Acessibilidade** — a legenda vertical é decorativa e precisa de `aria-hidden`, senão leitor de tela soletra ela de lado. A barra fixa precisa de `scroll-margin-top` no alvo de qualquer âncora.
- **Responsivo** — a barra tem três regiões e uma largura. Decidir agora o que some primeiro em 390px, em vez de descobrir.
- **Performance** — a rotação é `transform`, nunca margem negativa animada.

### Fase 2 — A página dupla grudada

Foto `position: sticky` à esquerda, transcrição rolando ao lado. Trecho entra com `translateY` e assenta.

**É a fase de maior ganho e não depende de nada das regiões.** Constrói primeiro.

Cada folha fotografada vira sua própria seção grudada, empilhada na rolagem. O `mdContent` continua fatiado por `---` pra separar folha; trecho é parágrafo dentro da folha.

**Consequência que precisa ser dita:** isso **substitui a virada de página no desktop**. Os botões `Previous` / `Next` e os pontinhos saem de lá. No mobile continuam, porque lá o toggle é que manda.

**Pronto quando**

- [ ] O texto de todas as folhas está no HTML do servidor, como já está hoje
- [ ] Sem JavaScript, tudo aparece legível — bloco `@media (scripting: none)`, igual ao grifo
- [ ] Sob `prefers-reduced-motion`, o estado final é o padrão e nada translada
- [ ] Nenhum trecho fica abaixo de contraste AA em nenhum momento da transição
- [ ] A carta de três linhas não deixa a folha grudada sozinha numa tela vazia

**Checagens**

- **Acessibilidade** — 12% de opacidade é ilegível. O estado de partida precisa ser alto o bastante pra passar AA sozinho, ou a transição precisa ser só `translateY` sem mexer em opacidade. **Medir, não estimar.**
- **Bugs** — `position: sticky` morre em silêncio se qualquer ancestral tiver `overflow` diferente de `visible`. É o modo de falha clássico dessa técnica.
- **Performance** — o observer olha os trechos, não a rolagem. Handler de `scroll` a cada frame recalculando posição é o que faz sticky engasgar.
- **Responsivo** — abaixo do breakpoint o sticky é desligado, não adaptado.

### Fase 3 — Filtro da legenda

Clicar num chip apaga os grifos que não são daquela tag. Troca de custom property, momentâneo, não vai pra URL.

**Pronto quando**

- [ ] Os chips são `<button>` com `aria-pressed`, não `<div>` com clique
- [ ] Clicar de novo no chip ativo limpa o filtro
- [ ] O grifo apagado continua legível como texto — o que sai é a cor, nunca a palavra
- [ ] Sem JavaScript os chips não aparecem, em vez de aparecerem quebrados

**Checagens**

- **Acessibilidade** — apagar por cor tira justamente o canal que WCAG 1.4.1 já disse que não pode ser o único. O sublinhado por tag continua lá e é o que segura essa interação de pé.
- **Reuso** — o valor apagado é token, não `rgba(63,48,33,0.05)` hardcoded como no comp.

### Fase 4 — Seguir a linha

Diretiva `:::passage{at="0.19 0.31"}` no pacote, seletor de região no editor, e o toggle `full page` / `follow the line`.

Trecho sem `at` cai na faixa proporcional. **A faixa é o padrão, a região é o upgrade.**

Teto da imagem sobe pra 2400px e o zoom máximo é 1.5.

**Pronto quando**

- [ ] Trecho sem região marcada funciona, com a faixa proporcional
- [ ] `at` fora de 0–1, invertido, ou com um valor só, degrada pra faixa em vez de quebrar
- [ ] O seletor de região escreve a diretiva no markdown, e o markdown continua sendo a fonte da verdade
- [ ] O toggle `full page` é alcançável por teclado e o estado é anunciado
- [ ] A 1440 retina, zoom 1.5 numa foto de 2400px está nítido — **olhar, não calcular**
- [ ] Reprocessar a transcrição não apaga as regiões já marcadas

**Checagens**

- **Segurança** — `at` vem do markdown, que vem de modelo de visão. É número que entra em `transform`: parsear e limitar, nunca interpolar direto.
- **Bugs** — o zoom é `transform` sobre a imagem, e o teto de altura da folha já existe no CSS. Os dois brigam se a origem não for explícita.
- **Performance** — 2400px por folha, até 5 folhas, todas no DOM: fora da primeira, tudo `loading="lazy"`.
- **Acessibilidade** — a foto que se move é decorativa; a transcrição é o conteúdo e não pode depender do zoom pra ser lida.

### Fase 5 — Fecho

Faixa rosada, `THE END OF THE PAGE`, as linhas de encerramento, `WRITE BACK →` e `READ IT AGAIN`, e a linha de privacidade.

`WRITE BACK` é `mailto:` por enquanto. **O endereço vem de env var, não do repositório** — e vale saber que endereço em página pública é colhido por robô. Se virar incômodo, a troca é por formulário.

A linha *read to the end · counted once · nothing else is stored* é literal e precisa continuar verdadeira. Hoje é: uma linha por abertura, dedupe por sessão, sem IP. Se um dia a medição mudar, essa frase muda junto.

**Pronto quando**

- [ ] A frase de privacidade bate exatamente com o que a tabela `View` guarda
- [ ] O evento de fim de leitura dispara nessa seção, e continua sendo um só
- [ ] `READ IT AGAIN` volta ao topo sem recarregar e sem contar abertura nova
- [ ] O `mailto:` traz assunto preenchido com o nome da carta

**Checagens**

- **Privacidade** — é a única frase do produto que promete alguma coisa. Ela é a checagem.
- **Acessibilidade** — a faixa rosada muda o fundo, então o contraste do texto e dos botões é outro par. Medir contra o rosa, não contra o papel.

### Fase 6 — Mobile

Não é adaptação. Mas ficou muito menor com as respostas 1 e 2: o mobile **mantém o que já funciona hoje** — foto primeiro, um toque pra transcrição, sem sticky e sem zoom.

Então a fase é: não quebrar o que existe, e cortar o que não se aplica.

**Pronto quando**

- [ ] Sticky, zoom e legenda vertical estão desligados abaixo do breakpoint, não encolhidos
- [ ] O toggle foto/transcrição continua funcionando, inclusive em carta de uma folha só
- [ ] A letra continua legível a 390px — já verificado uma vez, verificar de novo depois do hero
- [ ] Nenhuma linha rola de lado
- [ ] A navegação entre folhas continua existindo, já que o sticky não está lá pra substituí-la

**Checagens**

- **Responsivo** — raciocinar sobre 390px de verdade. O Chrome não redimensiona abaixo de ~550px: usar a barra de dispositivo.
- **Performance** — não baixar foto de 2400px pra tela de 390px sem necessidade. `sizes` na imagem ou uma segunda saída.

---

## O que já existe e não deve ser reconstruído

- O `remark-scanned-page` renderiza a transcrição no servidor, com `<mark data-c>` e `<aside>` temático. A marcação do comp bate com essa saída.
- A varredura do grifo, os keyframes `rise` / `draw` / `sweep`, o fundo de papel, o grão e a paleta estão no `app/globals.css`. O comp reaproveita, não substitui.
- `--hl-important: #f7b9cf`, `--hl-note: #f6d488`, `--hl-ask: #c9c2f4` vêm dos tokens e são medidos contra a tinta por `lib/theme/palette.test.ts`. **Os chips leem dos tokens.** Repetir o hex, como o comp faz, é o que faria o teste parar de proteger.
- O evento de fim de leitura, o filtro de bot e a dedupe por sessão já existem. A fase 5 muda onde o evento dispara, não como ele funciona.

## O que muda em decisões já registradas

- **`photo-transcription/DECISIONS.md`** — o teto de 1500px vira 2400px. O motivo original continua de pé; o que mudou é que o zoom virou um segundo consumidor da mesma imagem.
- **`share/DECISIONS.md`** — a virada de página deixa de existir no desktop, substituída pelas seções grudadas. No mobile continua.
- **`markdown-hightlight/DECISIONS.md`** — o pacote ganha uma segunda diretiva, `:::passage{at}`. Cabe no escopo dele: "transcrição sincronizada" é literalmente isso.

---

## O discovery, como foi respondido

Registro de como se chegou nas decisões do topo.

**1.** A foto grudada sobrevive no celular, ou o mobile mantém o toggle de hoje?
→ mantém o toggle que existe hoje (foto primeiro, um toque pra transcrição)

**2.** O zoom que segue o trecho acontece no mobile também?
→ só desktop

**3.** Região marcada à mão (a), derivada (b), ou sem zoom (c)?
→ seria legal ter uma feature dessa; (a) se der, (c) se (a) for muito difícil
→ **fechado como (a) com (c) de padrão**: região é opcional, trecho sem região cai na faixa proporcional

**4.** O que acontece quando a região fica errada?
→ pensar na melhor solução
→ **não existe região errada por derivação, porque não existe derivação.** O `full page` continua sendo a saída pra quando a foto não ajuda

**5.** Sobe o teto da imagem ou limita o zoom?
→ isso ainda é problema com a opção (a)?
→ **sim, e é independente.** Teto vai pra 2400px, zoom máximo pra 1.5. Números medidos acima

**6.** As fotos já enviadas?
→ mesma pergunta
→ **existe uma carta de teste, é só subir de novo**

**7.** O reveal degrada sem JS e sob reduced-motion?
→ faz o recomendado

**8.** Tira o número da carta?
→ tira, bota alguma coisa legal
→ **as três palavras do slug**: `AUTUMN · BUREAU · COVE`

**9.** Mantém o progresso visível pro leitor?
→ mantém

**10.** Destino do `WRITE BACK`?
→ `mailto:` por agora

**11.** Carta de várias folhas?
→ cada folha vira sua própria seção grudada, empilhada na rolagem

**12.** Tamanho típico de uma carta?
→ uma folha completa

**13.** O filtro da legenda sobrevive a reload?
→ momentâneo
