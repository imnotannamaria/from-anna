# design — discovery

Chegou um comp de design em `docs/design/from anna.local.html` (fora do git, bundle de 8.4MB). Isto é a análise: o que ele faz, o que dá pra construir como está desenhado, o que conflita com decisões já tomadas, e o que precisa ser respondido antes de valer a pena começar.

Responda nas linhas `→`. O que for fechado vira um `DECISIONS.md` aqui, e as fases lá embaixo passam a valer.

---

## O que o comp faz

Três seções, uma rolagem contínua.

**1. Barra fixa no topo.** Wordmark à esquerda, metadado da carta no centro (`LETTER 07 · ONE PAGE · NOT STARTED`), e a legenda dos grifos à direita — três chips com amostra de cor, `important` / `note` / `ask`.

**2. Hero.** Título em display à esquerda (`A letter, written by hand.`), a foto à direita, girada `-1.6deg` e sangrando pra fora da borda direita. Uma legenda vertical em `writing-mode: vertical-rl` sobe pela lateral esquerda da foto: `PAGE 01 · AS PHOTOGRAPHED`. Um `READ ↓` embaixo.

**3. A página dupla de leitura.** A foto vira `position: sticky` à esquerda enquanto a transcrição rola ao lado. E aí:

- Os trechos começam com opacidade baixa e `translateY(18px)`, e assentam conforme entram na tela. Ler pra frente revela a carta.
- **A foto dá zoom e se desloca pra acompanhar o trecho que você está lendo.** Cada trecho mapeia pra um recorte normalizado da foto (`{top: 0.19, bottom: 0.31}`), a imagem escala pra ~1.75 e translada pra centralizar aquela região, e uma faixa translúcida marca ela. A legenda muda de `page 01 · full sheet` pra `detail · lines 1–2`.
- Um botão `full page` / `follow the line` liga e desliga esse comportamento.
- Clicar num chip da legenda apaga todos os grifos que não são daquela tag pra `rgba(63,48,33,0.05)`, então dá pra ler uma cor por vez.
- A barra do topo conta: `passage 2 of 4`, mais uma porcentagem de progresso da rolagem.

**4. Fecho.** Uma faixa rosada, `THE END OF THE PAGE`, as linhas de encerramento em serifa grande, dois botões (`WRITE BACK →`, `READ IT AGAIN`), e uma linha de privacidade: *read to the end · counted once · nothing else is stored*.

---

## O veredito

**O comp é uma melhora de verdade e a maior parte dá pra construir.** Ele usa as mesmas três fontes que já estão carregadas, os mesmos tokens, e os mesmos keyframes `rise` / `draw` / `sweep` que já estão no `globals.css` — foi construído em cima do que existe, não contra.

Duas ideias dele são genuinamente melhores que o que existe hoje, e valem o trabalho sozinhas:

- **A foto grudada com a transcrição rolando ao lado.** Substitui a navegação por virada de página por algo que lê como sentar com a carta, e elimina o problema de a foto retrato e a transcrição brigarem pela mesma tela.
- **A linha de privacidade no fecho.** Dizer *counted once, nothing else is stored* em voz alta transforma a analytics de coisa escondida em coisa declarada. É a versão honesta de uma decisão que já estava tomada, e custa zero.

O que vem abaixo é o que não é de graça.

---

## Problemas que travam

### 1. Não existe layout mobile. Nenhum.

O comp inteiro tem **uma** media query, e é `prefers-reduced-motion`. Nem um breakpoint.

Renderizado a 390px a grade de duas colunas não colapsa: a foto continua uma miniatura na coluna da esquerda e a transcrição fica espremida numa coluna de mais ou menos uma palavra de largura. O wordmark da barra quebra em duas linhas e o metadado trunca pra `LET…`.

Isso pesa mais aqui do que pesaria em outro projeto, porque já ficou decidido que a carta abre no celular, com a foto primeiro, e que a foto ser legível a 375px é a suposição em que a view de leitura inteira se apoia. Então o design mobile não é uma adaptação desse comp — é um design que ainda não existe.

**1.** A ideia da foto grudada sobrevive no celular, ou o mobile mantém o toggle que existe hoje (foto primeiro, um toque pra transcrição)?
→ mantém o toggle que existe hoje (foto primeiro, um toque pra transcrição)

**2.** Se o mobile mantém o toggle, o zoom que segue o trecho acontece lá também, ou é só desktop?
→ só desktop

### 2. O zoom que segue o trecho precisa de dado que não existe

É a peça central e a parte mais difícil. No comp as regiões são **hardcoded**:

```js
const REGIONS = [
  { top: 0.19, bottom: 0.31, label: 'detail · lines 1–2' },
  ...
]
```

Nada no sistema sabe qual pedaço da foto corresponde a qual parágrafo da transcrição. O modelo devolve texto, não coordenadas.

Três saídas, com quantidades de trabalho bem diferentes:

- **(a) Marcar as regiões à mão.** Um seletor de região no editor: arrasta uma caixa na foto, amarra a um trecho. Preciso, e é mais uma coisa pra fazer em toda carta — num projeto cuja reclamação original era custo por carta.
- **(b) Derivar.** Divide a foto em partes iguais pela quantidade de trechos. Manuscrito corre de cima pra baixo, então o trecho 2 de 4 é mais ou menos o segundo quarto da folha. De graça, automático, e errado sempre que a página tiver um desenho, uma margem larga ou espaçamento irregular.
- **(c) Tirar o zoom.** Mantém a folha grudada em tamanho cheio e desce uma faixa translúcida por ela proporcionalmente. Quase todo o efeito, nenhum problema de dado, e nunca mente sobre onde um trecho está.

**3.** Qual das três? (b) e (c) saem esta semana; (a) é uma feature própria.
→

**4.** Se for (a) ou (b): o que acontece numa carta em que a região derivada fica visivelmente errada — o botão `full page` é a saída de emergência, ou região errada precisa ser corrigível?
→

### 3. O zoom conflita com como as fotos são guardadas

Ficou decidido guardar só uma imagem processada, com teto de 1500px no lado maior, porque essa versão é a que as pessoas veem e a original de 4MB não tem consumidor.

O `scale(1.75)` cria esse consumidor. Uma foto de 1500px exibida a 1.75× está sendo cobrada por ~2600px de detalhe que ela não tem, e manuscrito é exatamente o assunto onde falta de nitidez lê como borrão, não como textura.

**5.** Subir o teto (2400px? 3000px?) e aceitar arquivos maiores e leitura mais lenta do blob privado, ou manter 1500px e limitar o zoom ao que a resolução aguenta (~1.25×)?
→

**6.** Se o teto subir: as fotos já enviadas continuam em 1500px. Subir de novo, ou aceitar que cartas antigas dão zoom pior?
→

### 4. Trecho não lido a 12% de opacidade

Texto a 12% de opacidade sobre papel é ilegível por qualquer medida, e o comp aplica isso em tudo abaixo da dobra até um observer disparar.

Leitor de tela ignora opacidade, então essa metade está ok. O risco é um leitor enxergando cuja observer nunca dispara — navegador antigo, script que falhou, container de rolagem incomum — ficar com uma carta que parece em branco. E quem tem baixa visão pega os estados intermediários da transição.

O grifo que já existe resolve esse mesmo formato de problema: o estado final é o padrão, e o JavaScript adiciona a animação. A mesma regra tem que valer aqui.

**7.** Confirma que o reveal degrada pra totalmente visível sem JavaScript e sob `prefers-reduced-motion`? (Recomendado: sim, e é um bloco `@media (scripting: none)` mais o bloco de reduced-motion, os dois já existem pros grifos.)
→

---

## Perguntas menores

**8.** O comp chama a carta de `LETTER 07`. Numerar conta pro leitor quantas existem e onde aquela está na sequência. Tira o número, mantém, ou troca por algo não sequencial?
→

**9.** A barra do topo mostra pro leitor o progresso dele mesmo (`not started` → `passage 2 of 4`). Junto com a linha de privacidade do fecho isso lê como honestidade deliberada em vez de vigilância, o que é uma escolha forte. Mantém?
→

**10.** O `WRITE BACK →` precisa de destino. `mailto:`, um formulário, ou um link definido por carta?
→

**11.** O comp mostra uma folha só. Numa carta de três folhas — cada página fotografada vira sua própria seção grudada empilhada na rolagem, ou a virada de página atual sobrevive junto?
→

**12.** O texto do comp é lorem ipsum dimensionado pra uma carta longa, quatro trechos. A carta de teste real tem três linhas. Vale julgar o layout contra uma carta do tamanho que você escreve de verdade antes de fixar as proporções — quanto tem uma típica?
→

**13.** Os chips filtram grifo por tag. O estado do filtro precisa sobreviver a um reload (`?tag=note` na URL), ou é coisa momentânea?
→

---

## O que dá pra construir como está desenhado, depois que o acima fechar

Ordem aproximada, do mais barato e menos arriscado pro resto.

**Fase 1 — Chrome e hero.** Barra fixa, wordmark, metadado, chips da legenda. Hero assimétrico com a foto girada sangrando e a legenda vertical. Nenhum dado novo, nenhuma dependência nova, nenhuma interação além de hover.

**Fase 2 — A página dupla grudada.** Foto sticky, transcrição rolando ao lado. Reveal por trecho com os fallbacks de sem-JS e reduced-motion da pergunta 7. É a parte que muda como a carta lê, e **não depende de nada do trabalho de regiões**.

**Fase 3 — Filtro da legenda.** Chips apagam os grifos que não casam. É troca de custom property, custa quase nada e é totalmente reversível.

**Fase 4 — Seguir a linha.** O que ganhar a pergunta 3 entre (a)/(b)/(c), mais o toggle `full page`. A versão só-faixa (c) é um dia; o seletor de região (a) é uma feature própria com mudança de schema junto.

**Fase 5 — Fecho.** Faixa rosada, linhas de encerramento, os dois botões, a linha de privacidade.

**Fase 6 — Mobile.** Não é adaptação. Está por último porque depende de todas as respostas acima, e é o primeiro em importância porque é onde a carta é lida.

Já fechado pelas respostas 1 e 2: o mobile mantém o toggle atual (foto primeiro, um toque pra transcrição) e o zoom que segue o trecho é só desktop. Isso simplifica bastante a fase 6 — ela vira "não quebrar o que já funciona a 390px" em vez de "desenhar uma segunda experiência".

---

## O que já existe e não deve ser reconstruído

- O `remark-scanned-page` renderiza a transcrição no servidor, com `<mark data-c>` e blocos `<aside>` temáticos. A marcação do comp bate com essa saída.
- A varredura do grifo, os keyframes `rise`, `draw` e `sweep`, o fundo de papel, o grão e a paleta estão no `app/globals.css`. O comp reaproveita.
- `--hl-important: #f7b9cf`, `--hl-note: #f6d488`, `--hl-ask: #c9c2f4` são os mesmos valores que o comp deixa hardcoded nos chips. Eles vêm do `lib/theme/palette.test.ts` e são medidos contra a tinta nos dois modos — **os chips têm que ler dos tokens em vez de repetir o hex**, senão o teste para de proteger.
