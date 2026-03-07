# CORE ENGINEERING PRINCIPLES

<ruleset name="Core Principles">

<description>
Estes são os princípios fundamentais que guiam TODAS as decisões de desenvolvimento. Eles são a base da nossa filosofia de engenharia e devem ser seguidos sem exceção, representando a mentalidade de um desenvolvedor sênior com mais de 20 anos de experiência.
</description>

<rule name="Principle 1: Reuse Before Build">
  <description>
    Antes de criar qualquer novo componente, hook, ou função, você DEVE auditar a base de código existente em busca de uma solução reutilizável. A duplicação de código é o principal inimigo a ser combatido. A criação de algo novo é o último recurso, não o primeiro.
  </description>
</rule>

<rule name="Principle 2: Mandatory Decision Flow">
  <description>
    Você deve seguir este fluxo de decisão ANTES de escrever qualquer código de feature ou refatoração. A falha em seguir este fluxo resultará em uma revisão obrigatória.

    1. **Define Problem:** Descreva o problema a ser resolvido em uma única frase (sintoma + impacto no negócio).
    2. **Inventory Existing Code:** Use a busca global (ex: `rg -n "termoDoComportamento" src`) para encontrar funcionalidades ou componentes com nomes, props ou propósitos similares. A evidência da busca deve ser registrada.
    3. **Classify Logic:** Analise o código encontrado e separe a lógica em duas categorias: 'comum' (lógica de UI, estado, fluxo, que pode ser compartilhada) e 'específica' (regras de negócio que pertencem a um domínio particular).
    4. **Apply Decision Matrix:** Com base na classificação, aplique a Matriz de Decisão (ver próxima regra) para determinar a ação correta.
    5. **Implement:** Somente após os passos 1-4 serem concluídos, inicie a implementação.
  </description>
</rule>

<rule name="Principle 3: The Decision Matrix">
  <description>
    Esta matriz determina a ação correta após o inventário e classificação do código.

    - **WHEN TO REUSE:**
      - O comportamento desejado já existe e a diferença é apenas em dados, texto, estilo ou props simples.
      - O contrato de interação (ex: abrir/editar/confirmar/cancelar) é idêntico.
      - **ACTION:** Estenda a API do componente/hook existente com a menor superfície de mudança possível. NÃO crie um novo módulo paralelo.

    - **WHEN TO EXTRACT:**
      - Existe duplicação de lógica ou estrutura em 2 ou mais pontos do código.
      - Há uma chance concreta e imediata de um terceiro uso.
      - O fluxo base é o mesmo, mudando apenas a regra de domínio aplicada no final.
      - **ACTION:** Extraia a lógica/estrutura comum para um novo componente ou hook compartilhado. Mantenha a regra de negócio específica no consumidor, injetando-a como uma prop ou callback.

    - **WHEN TO CREATE:**
      - A auditoria (passo 2 do fluxo) comprova que não existe implementação equivalente.
      - A natureza da interação ou do domínio é fundamentalmente diferente.
      - Tentar reutilizar forçaria um acoplamento prejudicial ou uma abstração excessivamente complexa.
      - **ACTION:** Crie um novo módulo, mas você DEVE documentar a justificativa de por que a reutilização ou extração não foram possíveis.
  </description>
</rule>

<rule name="Principle 4: Small, Incremental, Validated Steps">
  <description>
    Toda mudança deve ser a menor unidade de trabalho lógica possível. Após cada passo (ex: extrair um hook, refatorar um componente), execute as validações relevantes (testes, lint, type-check) para garantir que nada foi quebrado. Não agrupe múltiplas refatorações ou features em um único passo gigante.
  </description>
</rule>

<rule name="Principle 5: Clarity Over Premature Abstraction">
  <description>
    Escreva código que seja, acima de tudo, fácil de ler e entender.  Uma abstração só é justificada se atender a pelo menos DOIS dos seguintes critérios IMEDIATAMENTE:
    1. Elimina duplicação de lógica crítica já existente.
    2. Reduz acoplamento problemático já existente.
    3. Permite uma troca REAL de implementação necessária no curto/médio prazo.
    4. Melhora significativamente a testabilidade de um comportamento central.
    Se não atender, mantenha a solução direta e simples.
  </description>
</rule>

<rule name="Principle 6: One Source of Truth">
  <description>
    Regras de negócio, constantes, configurações de escala, mapeamentos e qualquer outra informação compartilhada devem viver em um único arquivo e ser importados de lá. Espalhar constantes e valores padrão em múltiplos arquivos é estritamente proibido.
  </description>
</rule>

<rule name="Principle 7: Incremental Compatibility">
  <description>
    Ao refatorar código que lida com estruturas de dados (tipos, serialização), você deve garantir a compatibilidade com o formato legado durante o período de transição. A leitura deve suportar tanto o formato novo quanto o antigo. A escrita deve ser sempre no novo formato. Breaking changes silenciosos em dados existentes são inaceitáveis.
  </description>
</rule>

<rule name="Forbidden Anti-Patterns">
  <description>
    As seguintes ações são estritamente proibidas e serão consideradas falhas graves:
    - Criar um novo componente/hook sem realizar e documentar a auditoria de reutilização prévia.
    - Copiar e colar lógica de UI ou de fluxo para "acelerar" a entrega.
    - Introduzir uma abstração complexa por uma necessidade hipotética futura.
    - Espalhar constantes, defaults ou regras de negócio em múltiplos arquivos.
    - Corrigir um problema visual (UI) sem antes validar que o contrato funcional e de interação (UX) permanece intacto.
  </description>
</rule>

</ruleset>
