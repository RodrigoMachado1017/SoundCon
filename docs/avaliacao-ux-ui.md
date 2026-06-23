# Avaliação de UX/UI — SoundCon

Data: 2026-06-09 · Escopo: frontend React (auth, conversão, pitch, mixer/DAW, perfil) e a experiência ponta a ponta com o backend.

Este documento avalia a interface segundo heurísticas de usabilidade (Nielsen), acessibilidade (WCAG 2.1 AA) e performance percebida, lista os **gargalos atuais e futuros**, e registra as **correções priorizadas** (as de maior impacto/menor custo já aplicadas neste ciclo estão marcadas ✅).

---

## 1. Heurísticas de usabilidade (Nielsen)

| Heurística | Situação | Observação |
|---|---|---|
| Visibilidade do estado | Boa | Estados de loading/sucesso/erro padronizados em `.sc-feedback-*`; transporte da DAW mostra tempo corrente. |
| Correspondência com o mundo real | Boa | DAW usa metáforas conhecidas (faixas, knobs, VU, FX chain). Badges *live/render* comunicam o que é ouvido vs. renderizado. |
| Controle e liberdade | Médio→Bom | DAW tem undo/redo de parâmetros. Falta undo para add/remove de faixa/efeito (ver gargalos). |
| Consistência e padrões | Boa | Tokens CSS (`.sc-*`) reutilizados; AppLayout unifica navegação. |
| Prevenção de erros | Médio | Validação de senha no cadastro; clamps no backend. Conversão não tem cancelamento nem limite de tamanho de upload exibido. |
| Reconhecer > lembrar | Boa | Efeitos com rótulos e unidades; orientação de qualidade no Pitch. |
| Flexibilidade/eficiência | Médio | Sem atalhos de teclado globais (play/pause/espaço) na DAW. |
| Estética e minimalismo | Boa | Layout limpo, tema coerente. |
| Ajuda a reconhecer/recuperar de erros | Médio | Mensagens de erro existem, mas algumas são genéricas ("Erro de conexão"). |
| Ajuda e documentação | Baixo | Sem tooltips/onboarding na DAW (curva de aprendizado alta). |

---

## 2. Acessibilidade (WCAG 2.1 AA)

**Pontos fortes**
- Tema escuro com bom contraste de texto (`--text #f7f2ff` sobre fundos ~`#1a0e3b`): razão > 12:1 (AAA).
- Knobs com `role="slider"` + `aria-valuemin/max/now` e navegação por seta.
- Inputs com `<label>` visível na maioria dos formulários.

**Problemas encontrados**
1. **Botões só com ícone** sem nome acessível na DAW (`↑ ↓ ✕ ↶ ↷`, mute "M") — leitores de tela leem o glifo. → ✅ corrigido com `aria-label`/`title`.
2. **Formulários de auth liam campos por posição** (`form[0].value`) — frágil e sem associação `label/for`. → ✅ migrado para `name`/`id` + `htmlFor`.
3. **Contraste de texto secundário**: `--muted #c0a5ec` sobre `--card-700 #24144e` ≈ 4.7:1 (passa AA para texto normal, no limite). Aceitável; evitar usar `--muted` em fontes < 14px.
4. **Foco visível** inconsistente fora dos knobs. → ✅ adicionado `:focus-visible` global.
5. **Movimento**: barra de progresso animada e medidores podem incomodar usuários sensíveis. → ✅ `prefers-reduced-motion` respeitado para animações decorativas.
6. **`<audio>`** nativo: acessível por padrão (controles do browser). OK.

---

## 3. Responsividade

- Breakpoints atuais: 1100px (grid da DAW e shell) e 680/720px (formulários e faixas viram coluna única). Funciona em tablets/desktop.
- **Gargalo**: a DAW é densa; em telas < 680px a faixa fica utilizável mas apertada (knobs e EQ de 18 bandas exigem scroll horizontal — já tratado com `overflow-x` nas bandas). Mobile real é uso secundário esperado.

---

## 4. Gargalos de performance

### Atuais
- **Re-render do React fora do hot path**: durante playback, cursor/medidores/espectro desenham no canvas via um único loop RAF, sem `setState` — bom. Knobs usam estado local e só commitam no pointer-up. **Sem gargalo no caminho de áudio.**
- **Decode de arquivos grandes**: `decodeAudioData` é assíncrono mas pode travar a UI por uma fração de segundo em arquivos longos; os picos da waveform já são calculados em Web Worker (transferable, zero-copy).
- **Bundle**: ~480 kB (137 kB gzip) — supabase-js é a maior parte. Aceitável; pode ser code-split (a DAW e o supabase poderiam ser carregados sob demanda).
- **Conversão**: sem indicador de progresso real (só "Processando…") nem cancelamento; uploads grandes podem parecer travados.

### Futuros (à medida que escala)
- **Multitrack pesado**: muitas faixas (>8) multiplicam AnalyserNodes e draws. Mitigações já previstas: throttle adaptativo do RAF (cai p/ 30fps), `dpr` limitado a 1.5. Falta **virtualização das lanes** fora da viewport (desenho), planejada.
- **`AudioBufferSourceNode` one-shot**: recriados a cada play/seek — correto, mas sem object pooling ainda (GC pode causar micro-glitches em máquinas fracas com muitas faixas).
- **Render server-side**: `/audio/mix` é síncrono com timeout de 180s; mixagens longas/muitas faixas podem estourar. Futuro: fila/worker e progresso via polling/websocket.
- **Sem limite de upload explícito** no multer → risco de exaustão de disco/memória. Recomendado `limits.fileSize` + validação de mimetype.

---

## 5. Correções priorizadas

| # | Correção | Impacto | Custo | Status |
|---|---|---|---|---|
| 1 | Nomes acessíveis em botões-ícone (DAW) | Alto | Baixo | ✅ |
| 2 | Auth forms com `label/for` + `name` (sem leitura posicional) | Alto | Baixo | ✅ |
| 3 | `:focus-visible` global consistente | Médio | Baixo | ✅ |
| 4 | `prefers-reduced-motion` para animações decorativas | Médio | Baixo | ✅ |
| 5 | Atalho de teclado **espaço = play/pause** na DAW | Médio | Baixo | ✅ |
| 6 | Limite de tamanho de upload no backend (multer) | Médio | Baixo | ✅ |
| 7 | Virtualização das lanes da DAW | Médio | Médio | ⏳ futuro |
| 8 | Progresso/cancelamento de conversão e mixagem | Médio | Médio | ⏳ futuro |
| 9 | Code-splitting (DAW/supabase sob demanda) | Baixo | Médio | ⏳ futuro |
| 10 | Onboarding/tooltips na DAW | Médio | Médio | ⏳ futuro |

---

## 6. Recomendações de continuidade
- Adotar testes de acessibilidade automatizados (axe) no CI do frontend.
- Medir performance real com CPU throttling 6× (DevTools) ao crescer o número de faixas; acionar virtualização quando > ~8 lanes.
- Mover render de mixagem para processamento assíncrono com progresso quando durações/faixas crescerem.
