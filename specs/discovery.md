# Discovery — Aplicação de Previsão do Tempo

## Contexto

A empresa solicitou uma aplicação para que usuários consultem informações
meteorológicas de cidades. O briefing estabelece busca por cidade, consulta do
clima atual, previsão de cinco dias, alternância entre Celsius e Fahrenheit e
uso em dispositivos móveis.

Esta análise organiza os requisitos de negócio conhecidos e destaca decisões
que ainda precisam ser confirmadas antes da especificação detalhada.

## Decisões

| Decisão | Justificativa | Perguntas em aberto resolvidas |
|---|---|---|
| **Fonte de dados: Open-Meteo, sem API key.** | Evita exigir uma chave de API para a integração inicial e define o fornecedor meteorológico da especificação. | Define qual serviço fornecerá os dados. Cobertura, limites de uso, disponibilidade, atribuição, licença e condições de uso ainda precisam ser confirmados. |
| **“5 dias” = hoje + os quatro dias seguintes.** | Torna explícito o intervalo do período exibido. | Resolve se o dia atual está incluído. A granularidade (diária ou horária), os campos e a definição de “hoje” em relação ao fuso horário continuam em aberto. |
| **Unidade padrão: Celsius.** | Estabelece um padrão inicial coerente para a experiência em pt-BR. | Resolve qual unidade será selecionada inicialmente. A alternância para Fahrenheit continua disponível; persistência da preferência no dispositivo ainda não foi decidida. |
| **Sem autenticação e sem persistência de servidor.** | Mantém a primeira versão sem contas e sem armazenamento de dados de usuário no servidor. | Resolve se é necessário criar conta e se dados ou preferências devem ser persistidos no servidor. Persistência local no navegador, como cidade recente ou unidade escolhida, continua em aberto. |
| **Idioma da UI: pt-BR.** | Define o idioma inicial da interface. | Resolve em qual idioma a interface será apresentada. Localização de nomes de cidades e condições, formato de datas e horas e tratamento de localidades fora do Brasil ainda precisam ser definidos. |

## Personas (hipóteses)

As personas abaixo são perfis provisórios derivados das funções do briefing,
não resultado de pesquisa com usuários. Validar objetivos e métricas com
entrevistas ou testes antes de tratá-los como representativos do público real.

### 1. Pessoa em deslocamento

- **Objetivo principal:** verificar rapidamente o clima da cidade onde está
  para decidir como se vestir ou se preparar para o trajeto.
- **Contexto de uso:** principalmente mobile, em sessões curtas e possivelmente
  com conexão instável.
- **Métrica de sucesso:** consegue consultar o clima da cidade correta e
  identificar a temperatura e a condição atual em até 30 segundos, sem precisar
  repetir a busca. A meta de tempo é uma hipótese a validar.

### 2. Planejador(a) de viagem

- **Objetivo principal:** consultar a previsão de cinco dias para um destino e
  planejar roupas e atividades antes de viajar.
- **Contexto de uso:** principalmente desktop durante o planejamento; pode
  voltar a consultar pelo mobile durante a viagem.
- **Métrica de sucesso:** encontra o destino correto e compreende a previsão
  para os cinco dias em uma sessão, com a unidade de temperatura que prefere.
  Validar a tarefa e o intervalo de previsão com usuários.

### 3. Pessoa organizando atividades ao ar livre

- **Objetivo principal:** avaliar as condições previstas para escolher quando
  realizar uma atividade externa.
- **Contexto de uso:** mobile para consultas rápidas e desktop quando planeja
  com antecedência.
- **Métrica de sucesso:** consegue encontrar e interpretar a previsão de cinco
  dias para sua cidade sem confundir a data, a condição ou a unidade exibida.
  A taxa de conclusão em testes de usabilidade pode medir essa tarefa.

## Revisão da Classificação

| Item do briefing ou da lista | Classificação | Justificativa |
|---|---|---|
| Buscar cidades | Funcional | Descreve uma capacidade oferecida ao usuário. |
| Ver o clima atual | Funcional | Descreve a informação que o sistema deve apresentar. |
| Ver a previsão de cinco dias | Funcional | Descreve a informação que o sistema deve apresentar. |
| Alternar entre Celsius e Fahrenheit | Funcional | Descreve uma interação e o comportamento esperado da aplicação. |
| Usar em dispositivos móveis | Não-funcional | Define uma restrição de compatibilidade e qualidade da experiência, não uma função de negócio. |
| Responsividade | Não-funcional | Define como a interface deve se adaptar a diferentes telas. |
| Usabilidade | Não-funcional | Define a qualidade da interação. |
| Desempenho | Não-funcional | Define a rapidez esperada para apresentar resultados. |
| Acessibilidade | Não-funcional | Define a qualidade de uso por pessoas com diferentes necessidades. |
| Informar que os dados estão indisponíveis | Funcional | É um comportamento observável que a aplicação deve executar. |
| Confiabilidade | Não-funcional | É uma qualidade do serviço; não deve substituir a descrição do comportamento de erro. |

O item “Usar em dispositivos móveis” estava listado como funcional e foi
reclassificado como não-funcional. A lista também tratava o aviso de falha como
parte da confiabilidade; o aviso foi separado como requisito funcional, enquanto
a confiabilidade permanece como atributo de qualidade.

## Requisitos Funcionais

- **RF-01 — Buscar cidades:** permitir que o usuário informe o nome de uma
  cidade e encontre a cidade desejada.
- **RF-02 — Consultar clima atual:** apresentar as condições meteorológicas
  atuais da cidade selecionada.
- **RF-03 — Consultar previsão:** apresentar a previsão do tempo para cinco
  dias da cidade selecionada.
- **RF-04 — Alternar unidade de temperatura:** permitir alternar entre Celsius
  e Fahrenheit e apresentar as temperaturas na unidade escolhida.
- **RF-05 — Informar indisponibilidade:** informar ao usuário quando não for
  possível obter os dados meteorológicos, sem apresentá-los como atuais sem
  confirmação.

## Requisitos Não-Funcionais

- **RNF-01 — Responsividade e compatibilidade móvel:** a interface deve se
  adaptar a telas móveis sem exigir rolagem horizontal para buscar cidades ou
  consultar as informações principais. Validar o suporte mínimo de largura de
  tela e navegadores antes de fechar a especificação.
- **RNF-02 — Usabilidade:** busca, consulta da cidade e alternância de unidade
  devem ser compreensíveis e fáceis de usar.
- **RNF-03 — Desempenho:** como meta inicial a validar, apresentar os
  resultados em até 2,5 segundos no percentil 95 das consultas, considerando
  separadamente o tempo do serviço externo e as condições de rede.
- **RNF-04 — Confiabilidade e disponibilidade:** não apresentar dados
  indisponíveis ou desatualizados como atuais. Definir e validar uma meta de
  disponibilidade mensal (por exemplo, 99,5%) e como ela considera falhas do
  provedor meteorológico externo.
- **RNF-05 — Acessibilidade:** atender ao nível AA das diretrizes WCAG 2.2,
  incluindo operação por teclado, foco visível, rótulos acessíveis e contraste
  adequado.
- **RNF-06 — Compatibilidade:** definir e testar a matriz mínima de navegadores
  e dispositivos móveis suportados.

As metas numéricas e o nível de conformidade acima são sugestões iniciais para
discussão, não compromissos já aprovados. Os requisitos de desempenho,
acessibilidade e responsividade já estavam presentes na lista; faltavam
critérios verificáveis. Disponibilidade foi acrescentada como atributo
importante para um serviço de consulta meteorológica.

## Riscos

As classificações abaixo são estimativas iniciais, sem dados de uso ou SLA do
fornecedor; devem ser revistas quando esses dados estiverem disponíveis.

| Risco | Probabilidade | Impacto | Mitigação |
|---|---|---|---|
| **Rate limiting da API:** o volume de consultas ultrapassa a cota do provedor, bloqueando ou atrasando resultados. | Média | Alto | Confirmar limites e cotas do Open-Meteo; limitar e agrupar chamadas, aplicar cache com validade adequada, controlar tentativas e informar indisponibilidade temporária. |
| **Dados de localização incorretos:** geocodificação ambígua ou imprecisa seleciona a cidade errada. | Média | Alto | Exibir cidade junto de região/estado e país para desambiguar; exigir seleção quando houver homônimos; validar coordenadas e permitir corrigir a cidade. |
| **Inconsistência da UI entre dispositivos:** diferenças de tela, navegador ou método de entrada prejudicam leitura e operação. | Média | Médio | Definir matriz de dispositivos e navegadores suportados; usar layout responsivo e controles acessíveis; testar em tamanhos reais e automatizar verificações nos breakpoints principais. |
| **Falha de rede do usuário:** conexão ausente ou instável impede buscas e atualização dos dados. | Alta | Médio | Exibir estado de erro e ação de nova tentativa; preservar a cidade selecionada; indicar claramente a idade dos dados em cache e não apresentá-los como atuais. |
| **Latência elevada:** rede ou provedor demora a responder, levando a espera excessiva ou abandono. | Média | Alto | Medir tempos ponta a ponta e por dependência; definir metas e timeout; otimizar consultas, usar cache quando permitido e apresentar estado de carregamento com recuperação explícita. |
| **Indisponibilidade ou alteração do provedor:** falha externa, mudança de API ou cobertura insuficiente interrompe as consultas. | Média | Alto | Avaliar SLA, cobertura e política de mudanças; monitorar erros; encapsular a integração para facilitar manutenção; definir fallback viável ou comunicar indisponibilidade sem inventar dados. |
| **Dados meteorológicos desatualizados ou imprecisos:** a observação ou previsão não representa as condições atuais do local. | Média | Alto | Exibir fonte e horário de atualização quando disponíveis; definir limite de validade; sinalizar dados vencidos ou ausentes; validar cobertura e qualidade do fornecedor. |
| **Ambiguidade de detalhamento da previsão:** interpretações diferentes sobre granularidade diária/horária, campos ou fuso horário causam entrega inadequada. | Média | Médio | O intervalo já foi definido como hoje + quatro dias; documentar granularidade, campos e regra de fuso antes da implementação e validar com critérios de aceite. |
| **Conversão de unidades inconsistente:** valores e rótulos não correspondem à unidade selecionada. | Baixa | Médio | Centralizar conversões; identificar a unidade em cada valor; testar conversão, arredondamento e alternância em todos os componentes de clima e previsão. |

## Perguntas em Aberto (Open Questions)

O briefing informa capacidades em alto nível, mas não define público, prioridades,
regras de negócio, critérios de aceitação ou metas mensuráveis. Antes de estimar
ou aprovar o escopo, esclarecer:

### Objetivo e público

- Qual problema do usuário ou da empresa a aplicação deve resolver? Por que é
  necessária em vez de uma solução já existente?
- Quem são os usuários-alvo (público geral, viajantes, agricultores, equipes
  internas)? Há necessidades ou contextos de uso prioritários?
- Qual é o objetivo principal da primeira versão e o que explicitamente fica
  fora do escopo?
- Quais métricas indicarão sucesso (por exemplo, buscas concluídas, retorno de
  usuários, tempo para encontrar uma cidade, satisfação)? Qual é a linha de base
  e a meta?
- Há prazo, orçamento, restrições comerciais, plano de monetização ou
  patrocinador de produto que limite as decisões?

### Cidades e busca

- A busca deve aceitar apenas nomes de cidades ou também estados, países,
  códigos postais e coordenadas? Quais países e localidades devem ser cobertos?
- A busca ocorre após envio explícito ou enquanto o usuário digita? Como lidar
  com erros de digitação, acentos, nomes em outros alfabetos, abreviações e
  respostas sem resultados?
- Qual quantidade de resultados deve ser exibida e como ordenar ou limitar os
  resultados?
- Como o usuário deve escolher quando houver cidades com o mesmo nome? Que
  contexto (estado, região, país ou coordenadas) deve distinguir os resultados?
- Selecionar uma cidade inicia imediatamente a consulta? A cidade selecionada
  permanece visível ou pode ser trocada sem repetir a busca?
- A localização atual do usuário deve ser solicitada? Em caso afirmativo, é
  opcional, qual permissão é necessária e qual alternativa existe se for
  negada ou indisponível?
- Usuários poderão favoritar, fixar, comparar ou remover cidades? Quantas?
  Essa função exige conta ou deve funcionar localmente sem conta?

### Clima e previsão

- O que significa “clima atual”: quais campos devem ser exibidos (temperatura,
  sensação térmica, condição, umidade, vento, precipitação, pressão, índice UV,
  visibilidade)? Quais são obrigatórios?
- **Resolvido:** o intervalo compreende hoje e os quatro dias seguintes. A
  previsão será diária, horária ou ambas? Qual período representa um resumo
  diário?
- Quais campos são necessários na previsão (mínima/máxima, condição,
  precipitação e probabilidade, entre outros)? O que é essencial versus
  opcional?
- Como identificar visualmente observações atuais e previsões? A que instante
  cada dado se refere e quando foi atualizado?
- Que nível de precisão e arredondamento é esperado? Como mostrar valores
  ausentes ou não suportados para uma localidade?
- Temperaturas são os únicos valores com unidade alternável? Como unidades de
  vento, precipitação, pressão e distância serão escolhidas ou apresentadas?
- **Resolvido:** a unidade inicial é Celsius. A escolha de Fahrenheit deve
  persistir localmente no navegador ou apenas durante a sessão?

### Dados, localidades e integração

- **Resolvido:** Open-Meteo será a fonte de dados, sem API key. É aceitável
  depender de um único fornecedor?
- A fonte cobre todas as regiões e localidades desejadas? Qual precisão
  geográfica e meteorológica é necessária?
- Quais são a frequência de atualização, latência típica, limites de uso,
  custos, condições de atribuição, licença e restrições de redistribuição?
- O produto deve exibir fonte, horário da última atualização ou aviso de
  qualidade/limitação dos dados?
- Como serão tratados dados atrasados, indisponibilidade parcial (por exemplo,
  clima atual sem previsão), erros do provedor, limite de requisições e
  resposta inconsistente?
- É permitido armazenar respostas em cache? Por quanto tempo, e como evitar
  apresentar informação vencida como atual?

### Experiência, plataforma e localização

- “Usar em dispositivos móveis” significa site responsivo, PWA instalável,
  aplicativo nativo ou alguma combinação? Desktop também é obrigatório?
- Quais larguras, orientações, navegadores, versões e dispositivos precisam
  ser suportados? Há suporte a conexões lentas ou dispositivos de baixo custo?
- **Resolvido:** o idioma inicial da UI é pt-BR. Em que idioma serão mostrados
  nomes de condições meteorológicas e localidades, especialmente fora do
  Brasil? Há necessidade de outros idiomas?
- Como datas, horas, calendário, números, separadores decimais e unidades
  devem ser localizados?
- Qual fuso horário deve reger os dias da previsão (o da cidade consultada ou
  o do dispositivo), considerando que o intervalo inclui hoje e os quatro dias
  seguintes? Como representar localidades em fusos diferentes?
- Há padrões de marca, identidade visual ou conteúdo editorial obrigatórios?
- O que é requisito de acessibilidade: qual padrão e nível de conformidade,
  tecnologias assistivas, navegação por teclado e suporte a leitores de tela?

### Falhas e estados do produto

- O que a interface deve fazer em carregamento, busca vazia, cidade não
  encontrada, erro de rede, falha do provedor, limite excedido e dados parciais?
- Deve permitir nova tentativa, manter a última cidade ou apresentar dados
  armazenados? Em quais condições os dados armazenados podem ser exibidos?
- O produto precisa funcionar offline ou degradar de forma útil sem conexão?
- Existem limites para consultas repetidas, abuso automatizado ou uso anônimo?

### Qualidade, operação e governança

- Quais são as metas aprovadas de desempenho, disponibilidade e recuperação?
  Como medi-las e quais dependências externas entram no cálculo?
- Que volume de usuários e consultas simultâneas deve ser suportado? Há picos
  sazonais ou eventos que mudem a demanda?
- **Resolvido:** não haverá autenticação nem persistência de servidor. A
  aplicação coletará ou transmitirá dados pessoais (por exemplo, localização
  precisa, buscas ou identificadores) para outros fins? Quais requisitos de
  privacidade e conformidade se aplicam?
- Haverá analytics, cookies, publicidade ou compartilhamento com terceiros?
  Que controles de consentimento e opção de recusa são necessários?
- Como detectar e comunicar incidentes, erros ou degradação? Quem mantém o
  serviço e qual suporte será oferecido aos usuários?
- Quais critérios verificáveis definem “pronto” para cada capacidade? Quem
  valida os resultados e aprova a publicação?
- Quais ambientes, estratégia de lançamento, monitoramento e processo de
  atualização/correção são esperados?

## Suposições (Assumptions)

- A busca é feita pelo usuário por meio do nome de uma cidade; localização
  automática não é necessária para atender ao briefing.
- O clima atual e a previsão são obtidos do Open-Meteo, conforme a decisão
  registrada nesta análise.
- A alternância de unidade afeta os valores de temperatura exibidos, sem
  alterar as demais informações meteorológicas.
- A unidade inicial é Celsius, e o idioma da interface é pt-BR, conforme as
  decisões registradas nesta análise.
- “Previsão de 5 dias” significa hoje e os quatro dias seguintes; a
  granularidade permanece pendente de confirmação.
- “Usar em dispositivos móveis” implica uma interface web responsiva; o
  briefing não especifica aplicativos nativos.
- Não haverá autenticação nem persistência de servidor. Persistência local de
  preferências ou de dados no navegador não está definida.
