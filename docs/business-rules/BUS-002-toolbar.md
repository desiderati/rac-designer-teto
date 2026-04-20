# Regras da Toolbar

## Objetivo

Definir como os menus e comandos do editor devem funcionar de forma simples e previsível.

## Papel da toolbar

1. Ser o ponto principal de ações do usuário no editor.
2. Organizar comandos por contexto (casa, elementos, linhas, ações gerais).
3. Mostrar claramente estado ativo e opções disponíveis.

## Estrutura de menus

1. Menu principal
    - Acesso aos comandos de casa, elementos, linhas e mais opções.

2. Submenus
    - Devem abrir/fechar de forma clara, sem conflito entre si.

3. Overflow (mais opções)
    - Reúne ações de projeto e utilidades gerais.

## Regras por grupo de comando

1. Casa
    - Inserção de vistas respeita tipo de casa e limites permitidos.
    - Se necessário, pede escolha de lado/instância antes de inserir.

2. Elementos
    - Inserção cria objeto no canvas com comportamento padrão esperado.

3. Linhas e medidas
    - Inserção de linha, seta e distância deve manter consistência de edição posterior.

4. Ações gerais
    - Importar, exportar, PDF, abrir 3D, configurações, reinício e dicas.

## Regras de segurança

1. Ações destrutivas devem pedir confirmação.
2. Ações bloqueadas por regra devem informar motivo de forma explícita.
3. Importação deve reconstruir estado da casa sem deixar dados inconsistentes.

## Regras de feedback

1. Botões no limite devem indicar indisponibilidade.
2. Ações importantes devem mostrar confirmação de sucesso/erro.
3. Dicas contextuais devem aparecer sem interromper o fluxo principal.

## Regras de consistência com o editor

1. Toolbar e canvas devem permanecer sincronizados no estado das ferramentas.
2. Mudanças de configuração devem refletir imediatamente na experiência.
3. Fluxos de seleção de tipo/lado devem manter continuidade até completar ou cancelar.
