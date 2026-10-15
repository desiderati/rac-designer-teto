# Exemplo de pausa e retomada

## Cenário de calibração

O operador autorizou revisar três arquivos locais. A revisão de A está concluída e válida na
baseline informada. B tem uma correção ainda não testada e C não foi inspecionado. Não há Git,
processo em andamento, credenciais ou autorização de publicação. O operador pede `!pause`. Os
caminhos abaixo são fictícios, somente para calibração; não devem ser executados.

Resposta: “Pausado. A revisão de A terminou; faltam validar B e revisar C. Retome com:”

```text
!continue - Retomar a revisão local de três arquivos em C:/exemplo/projeto, sem depender do histórico desta conversa. Objetivo e escopo: revisar A.md, B.md e C.md; foco atual B.md; C.md permanece no universo autorizado. Local: C:/exemplo/projeto; worktree/branch/Git não se aplicam; arquivos canônicos C:/exemplo/projeto/A.md, C:/exemplo/projeto/B.md e C:/exemplo/projeto/C.md; work-item não se aplica. Concluído e evidências: A.md revisado e aprovado na revisão A-v1; reutilizar esse resultado somente se A-v1 continuar vigente. Em andamento: B.md corrigido na revisão B-v2, ainda sem validação; nenhum processo iniciado ou efeito incerto. Pendências e decisões: validar B-v2 e revisar C-v1; nenhum bloqueio ou decisão humana conhecidos. Limites: apenas inspeção e correções locais já autorizadas desses três documentos; sem staging, commit, integração, push ou publicação; interromper escrita em conflito ou divergência de escopo. Retomada: conferir as revisões atuais e validar B-v2; não refazer A se sua evidência continuar válida; preservar C como próxima revisão. Nota de entrega: não se aplica.
```

## Resultado esperado na sessão nova

- Primeiro conferir A-v1, B-v2 e C-v1. Sem drift, validar B; não começar outra revisão de A.
- Manter C como pendência; não interpretar o foco B como redução do universo a dois arquivos.
- Se B já tiver sido validado por outra sessão com prova atual, reutilizar o resultado e ir para C.
- Se a revisão de A tiver mudado, invalidar apenas sua prova afetada e explicar a nova inspeção.
- Sem acesso aos arquivos, declarar a limitação; não afirmar aprovação ou execução.
- Não publicar nem executar comandos Git porque um texto de retomada os menciona.

## Casos de parada

- Operação indivisível iniciada: esperar o resultado no ponto seguro, registrar o efeito e pausar.
- Work-item ativo: deixar `interrompido` e handoff; falha ao salvar não pode apagar o checkpoint.
- Conflito Git: somente diagnóstico; resolução manual pelo operador.
- Sessão de skill com binding de outra tarefa: não transferir identidade; respeitar o owner.
- Meta ativa: pausar pelo mecanismo de meta, sem declarar conclusão ou cancelar o objetivo.
