

## Unificar identidade visual dos modais

Aplicar a mesma estrutura visual dos editores (PilotiEditor, GenericEditor) aos modais de Configuracoes, Reiniciar Canvas e Desagrupar Casa.

### Estrutura padrao para todos

1. **Cabecalho**: Icone a esquerda + titulo centralizado (text-2xl font-bold) + botao X circular a direita
2. **Corpo**: Cartao branco (`bg-white rounded-xl p-4`) com o conteudo
3. **Rodape**: Botoes "Cancelar" (outline bg-white) e "Confirmar" (primary) lado a lado

### 1. SettingsModal.tsx

**Antes:** DialogHeader com titulo simples, conteudo direto, sem botoes de acao.

**Depois:**
- Cabecalho: Icone `faGear` (FontAwesome) a esquerda + "Configuracoes" centralizado + botao X circular
- Corpo: Cartao branco contendo os dois toggles com suas labels
- Rodape: Botoes "Cancelar" e "Confirmar"
- Ao clicar "Confirmar", aplica as alteracoes e fecha. "Cancelar" reverte ao estado anterior e fecha.
- O estado dos switches so sera persistido ao clicar "Confirmar" (comportamento atual salva imediatamente; sera ajustado para salvar apenas na confirmacao)

### 2. Reiniciar Canvas (em RACEditor.tsx)

**Antes:** DialogHeader com titulo e descricao, DialogFooter com botoes.

**Depois:**
- Cabecalho: Icone `faRotateLeft` (FontAwesome) a esquerda + "Reiniciar Canvas" centralizado + botao X circular
- Corpo: Cartao branco contendo o texto de confirmacao
- Rodape: Botoes "Cancelar" e "Confirmar" no padrao estabelecido

### 3. Desagrupar Casa (em RACEditor.tsx)

**Antes:** Mesmo formato antigo do Reiniciar Canvas.

**Depois:**
- Cabecalho: Icone `faObjectUngroup` (FontAwesome) a esquerda + "Desagrupar Casa" centralizado + botao X circular
- Corpo: Cartao branco contendo o texto de confirmacao
- Rodape: Botoes "Cancelar" e "Desagrupar" no padrao estabelecido

### Detalhes tecnicos

**Arquivos modificados:**
- `src/components/rac-editor/SettingsModal.tsx` - Redesign completo com cabecalho, cartao branco e botoes
- `src/components/rac-editor/RACEditor.tsx` - Redesign dos dialogos de Reiniciar Canvas e Desagrupar Casa

**Padrao de referencia (GenericEditor):**
```text
+-------------------------------------+
| [icone]    Titulo        [X]        |  <- cabecalho
+-------------------------------------+
| +------ bg-white rounded-xl ------+ |
| |                                 | |  <- corpo
| |    conteudo do modal            | |
| |                                 | |
| +---------------------------------+ |
|                                     |
|  [ Cancelar ]    [ Confirmar ]      |  <- rodape
+-------------------------------------+
```

**Dependencias FontAwesome ja instaladas:** `faGear`, `faRotateLeft`, `faObjectUngroup` do `@fortawesome/free-solid-svg-icons`.

