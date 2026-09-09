# design — discovery

Registro de como o comp de design virou plano. Fechado em 09/09/2026.

O comp veio em `docs/design/from anna.local.html` (fora do git, bundle de 8.4MB). O plano que saiu disto está em `IMPLEMENTATION.md`, em inglês como todo doc de implementação.

---

## O que o comp faz

Três seções, uma rolagem contínua.

**1. Barra fixa no topo.** Wordmark à esquerda, metadado da carta no centro (`LETTER 07 · ONE PAGE · NOT STARTED`), legenda dos grifos à direita — três chips com amostra de cor.

**2. Hero.** Título em display à esquerda, foto à direita girada `-1.6deg` e sangrando pra fora da borda. Legenda vertical em `writing-mode: vertical-rl` subindo pela lateral da foto. Um `READ ↓` embaixo.

**3. A página dupla de leitura.** A foto vira `position: sticky` à esquerda enquanto a transcrição rola ao lado:

- Trechos começam com opacidade baixa e `translateY(18px)`, e assentam ao entrar na tela.
- **A foto dá zoom e se desloca pra acompanhar o trecho que você lê.** Cada trecho mapeia pra um recorte normalizado (`{top: 0.19, bottom: 0.31}`), a imagem escala pra ~1.75 e translada pra centralizar. Uma faixa translúcida marca a região.
- Botão `full page` / `follow the line` liga e desliga isso.
- Clicar num chip apaga os grifos das outras tags.
- A barra conta `passage 2 of 4` mais porcentagem de rolagem.

**4. Fecho.** Faixa rosada, linhas de encerramento em serifa grande, `WRITE BACK →` e `READ IT AGAIN`, e a linha *read to the end · counted once · nothing else is stored*.

---

## O veredito

**O comp é uma melhora de verdade e a maior parte dá pra construir.** Usa as mesmas três fontes já carregadas, os mesmos tokens, e os mesmos keyframes `rise` / `draw` / `sweep` que já estão no `globals.css` — foi construído em cima do que existe, não contra.

Duas ideias dele são melhores que o que existia e valem o trabalho sozinhas:

- **A foto grudada com a transcrição rolando ao lado.** Elimina a briga entre foto retrato e transcrição pela mesma tela.
- **A linha de privacidade no fecho.** Dizer *counted once, nothing else is stored* em voz alta transforma a analytics de coisa escondida em coisa declarada.

---

## Problemas que travavam, e as perguntas

### 1. Não existia layout mobile. Nenhum.

O comp inteiro tem **uma** media query, e é `prefers-reduced-motion`. Nem um breakpoint. A 390px a grade não colapsa: a transcrição fica numa coluna de mais ou menos uma palavra de largura, o wordmark quebra em duas linhas e o metadado trunca pra `LET…`.

Pesa mais aqui do que pesaria em outro projeto, porque já estava decidido que a carta abre no celular.

**1.** A foto grudada sobrevive no celular, ou o mobile mantém o toggle de hoje (foto primeiro, um toque pra transcrição)?
→ mantém o toggle que existe hoje (foto primeiro, um toque pra transcrição)

**2.** Se mantém o toggle, o zoom que segue o trecho acontece lá também?
→ só desktop

### 2. O zoom precisava de dado que não existe

No comp as regiões são **hardcoded**. Nada no sistema sabe qual pedaço da foto corresponde a qual parágrafo — o modelo devolve texto, não coordenadas.

Três saídas: **(a)** marcar à mão no editor, **(b)** derivar dividindo a foto em partes iguais, **(c)** tirar o zoom e descer só uma faixa proporcional.

**3.** Qual das três?
→ seria legal ter uma feature dessa, se não for o zoom ou a ou b, acho que a, mas se for MUITO difícil c

**4.** Se for (a) ou (b): o que acontece numa carta em que a região fica visivelmente errada?
→ pense na melhor solução

**A resposta que saiu daí: não escolher entre (a) e (c).** Região é opcional; trecho sem região cai na faixa proporcional, que é a (c). Marcar é upgrade que se faz quando a página merece, não imposto que toda carta paga.

Isso resolve três coisas juntas: o custo por carta não sobe, que era a reclamação que originou o projeto; região errada por derivação deixa de existir, porque não existe derivação; e a (c) para de ser alternativa rejeitada e vira o padrão.

E as regiões moram **no markdown**, como `:::passage{at="0.19 0.31"}`, não numa tabela — mesma razão que manteve o grifo fora do banco.

### 3. O zoom conflitava com como as fotos são guardadas

**5.** Sobe o teto da imagem, ou limita o zoom ao que 1500px aguenta?
→ agora que vai ter a opção (a) de cima, esse ainda é um problema?

**6.** Se o teto subir, e as fotos já enviadas?
→ mesma pergunta

**Sim, ainda é problema, e é independente.** A opção (a) decide *onde* dar zoom; a resolução decide se existe pixel *pra* dar zoom. Escolher a região à mão não acrescenta detalhe.

Medido no comp: a foto grudada ocupa 616px a 1440 e 728px a 1920.

| tela | zoom | precisa | 1125px cobre |
|---|---|---|---|
| 1440 retina | 1.0 | 1232px | **91%** |
| 1440 retina | 1.5 | 1848px | 61% |
| 1440 retina | 1.75 | 2156px | 52% |
| 1920 retina | 1.75 | 2548px | 44% |

A primeira linha é a que importa: **em retina a foto de hoje já está levemente mole antes de qualquer zoom.**

Decidido: teto de 1500 pra **2400px**, zoom máximo de 1.75 pra **1.5**. Fica 97% a 1440 retina. Custo: arquivo de ~300KB pra ~700KB–1MB, o que ainda dá mais de mil páginas no Hobby.

Sobre as fotos antigas: existe uma carta de teste, é só subir de novo. Se um dia houver acervo, carta antiga dá zoom pior — reprocessar exigiria a original, e a original não é guardada de propósito.

### 4. Trecho não lido a 12% de opacidade

Ilegível por qualquer medida, aplicado em tudo abaixo da dobra até um observer disparar. Leitor de tela ignora opacidade, então essa metade está ok; o risco é quem enxerga e cuja observer nunca dispara ficar com uma carta que parece em branco.

**7.** Confirma que o reveal degrada pra totalmente visível sem JavaScript e sob `prefers-reduced-motion`?
→ faz o recomendado

---

## Perguntas menores

**8.** Tira o número da carta (`LETTER 07`)? Numerar conta pro leitor quantas existem.
→ tira o número, bota alguma coisa legal
→ ficou: **as três palavras do slug**, `AUTUMN · BUREAU · COVE`. Não é sequencial, já é a identidade da carta, e amarra a URL à página de graça

**9.** Mantém o progresso visível pro leitor?
→ mantém

**10.** Destino do `WRITE BACK →`?
→ `mailto:` por agora

**11.** Carta de várias folhas?
→ cada folha vira sua própria seção grudada, empilhada na rolagem

**12.** Tamanho típico de uma carta?
→ uma folha completa

**13.** O filtro da legenda sobrevive a um reload?
→ momentâneo
