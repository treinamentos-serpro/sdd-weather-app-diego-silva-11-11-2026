# Tarefas de Implementação — Aplicação de Previsão do Tempo

Derivado do [plano técnico](../plans/weather-app-plan.md) e rastreável à
[especificação do produto](../specs/weather-app-spec.md). As tarefas estão
ordenadas por entrega e dependência; dependências indicam IDs obrigatórios. As
tarefas foram divididas para manter cada unidade focada em um tipo e em até dois
arquivos relevantes sempre que possível.

**Prioridade:** P0 bloqueia a primeira fatia utilizável ou o release; P1 deve ser
concluída antes da validação/release geral; P2 é validação ou operação que pode
ser agendada após a entrega funcional, sem remover requisito da spec.
**Tamanho relativo:** P (pequeno), M (médio) ou G (grande), considerando esforço,
incerteza e abrangência da tarefa.

## Entrega 1 — Tipos e contratos

### T-01 — Definir os contratos compartilhados

- **Prioridade:** P0
- **Tamanho:** P

- **Descrição:** Criar os tipos de domínio para cidade, dados atuais, previsão,
  unidade, estados de operação e erros.
- **Critérios de aceite:**
  - `City`, `CurrentWeather`, `ForecastDay`, `WeatherData` e `Unit` são
    exportados com os campos e a nulabilidade descritos no plano.
  - `OperationState<T>` permite exatamente `idle`, `loading`, `success`, `empty`
    e `error`; `QueryError` permite exatamente `timeout`, `network`, `http` e
    `invalid-response`.
  - O TypeScript strict aceita exemplos de cada variante e rejeita estados ou
    erros fora dos unions.
- **Dependências:** Nenhuma.
- **Arquivos prováveis:** `src/types/weather.ts`
- **Tipo:** Data
- **Requisitos:** RF-01 a RF-05.
- **Rastreabilidade:** CA-01.7, CA-05.1 a CA-05.6; contratos de RF-01 a RF-05.

## Entrega 2 — Funções puras de domínio

### T-02 — Implementar o mapeamento de códigos WMO

- **Prioridade:** P0
- **Tamanho:** P

- **Descrição:** Criar função pura que mapeia códigos WMO para descrições em
  pt-BR.
- **Critérios de aceite:**
  - Cada código da tabela WMO da spec retorna exatamente a descrição pt-BR
    correspondente.
  - Código desconhecido retorna o marcador de indisponibilidade sem alterar ou
    descartar os demais campos meteorológicos.
- **Dependências:** T-01.
- **Arquivos prováveis:** `src/lib/weatherCode.ts`
- **Tipo:** Data
- **Requisitos:** RF-02, RF-03, RF-05.
- **Rastreabilidade:** CA-02.1, CA-02.2, CA-03.1, CA-03.3.

### T-03 — Implementar formatação e validação temporal

- **Prioridade:** P0
- **Tamanho:** M

- **Descrição:** Criar funções puras para datas, horários no fuso da cidade e
  validade temporal da observação.
- **Critérios de aceite:**
  - Datas usam `dd/MM` e horários usam 24 horas no fuso informado, sem depender
    do fuso do dispositivo.
  - Timestamp ausente, não parseável, futuro ou com idade maior que 120 minutos
    é inválido; timestamp com idade exatamente 120 minutos é válido.
- **Dependências:** T-01.
- **Arquivos prováveis:** `src/lib/dateTime.ts`
- **Tipo:** Data
- **Requisitos:** RF-02, RF-03, RNF-07.
- **Rastreabilidade:** CA-02.1, CA-02.3, CA-03.2, CA-03.3, RNF-07.

### T-04 — Implementar conversão de temperatura

- **Prioridade:** P0
- **Tamanho:** P

- **Descrição:** Criar função pura que converte valores Celsius para a unidade
  solicitada e arredonda ao inteiro mais próximo.
- **Critérios de aceite:**
  - Fahrenheit usa `°F = (°C × 9/5) + 32`.
  - O resultado é arredondado ao inteiro mais próximo, incluindo empate positivo
    e negativo afastando-se de zero.
  - Duas conversões com a mesma entrada Celsius produzem o mesmo resultado; a
    função não modifica o valor de entrada.
- **Dependências:** T-01.
- **Arquivos prováveis:** `src/lib/temperature.ts`
- **Tipo:** Data
- **Requisitos:** RF-04.
- **Rastreabilidade:** CA-04.1 a CA-04.4.

## Entrega 3 — Services Open-Meteo

### T-08 — Implementar o serviço de geocodificação

- **Prioridade:** P0
- **Tamanho:** M

- **Descrição:** Consultar o Open-Meteo por HTTPS e normalizar resultados para o
  contrato de cidade.
- **Critérios de aceite:**
  - Para entrada com espaços externos e Unicode, faz exatamente uma requisição
    HTTPS com `name` trimado, `count=5` e `language=pt`; caracteres internos são
    preservados e parâmetros são codificados.
  - Para resposta com mais de cinco resultados retorna os cinco primeiros na
    ordem recebida; região e país ausentes ficam nulos e coordenadas/IDs
    inválidos não geram cidades válidas.
  - Após 10 segundos aborta a chamada e classifica o erro como timeout; falhas de
    rede, status HTTP não exitoso e payload inválido geram os erros
    correspondentes. Não há retry nem cache.
- **Dependências:** T-01.
- **Arquivos prováveis:** `src/services/geocodingService.ts`
- **Tipo:** Data
- **Requisitos:** RF-01, RF-05.
- **Rastreabilidade:** CA-01.1 a CA-01.3, CA-05.2, CA-05.3, CA-05.6.

### T-10 — Implementar o serviço de previsão meteorológica

- **Prioridade:** P0
- **Tamanho:** M

- **Descrição:** Buscar previsão para as coordenadas escolhidas e normalizar os
  dados atuais e diários.
- **Critérios de aceite:**
  - Requisição usa as coordenadas recebidas e inclui `current`,
    `daily`, `timezone=auto`, `temperature_unit=celsius` e
    `forecast_days=5`.
  - Temperaturas não numéricas/não finitas, códigos e timestamps inválidos e
    campos ausentes são normalizados como indisponíveis sem invalidar campos
    independentes válidos.
  - Normaliza umidade, vento, precipitação, pressão e probabilidade máxima
    diária de precipitação conforme os intervalos do plano.
  - Com fuso e cinco datas diárias válidas retorna exatamente cinco dias locais
    consecutivos; sem fuso ou sem previsão diária válida retorna `forecast:
    null`.
  - Após 10 segundos aborta e reporta timeout; erros de rede, HTTP e
    JSON/payload inválido são classificados explicitamente. Não há retry nem
    cache.
- **Dependências:** T-01.
- **Arquivos prováveis:** `src/services/forecastService.ts`
- **Tipo:** Data
- **Requisitos:** RF-02, RF-03, RF-05.
- **Rastreabilidade:** CA-02.1 a CA-02.3, CA-03.1 a CA-03.4, CA-05.2, CA-05.3,
  CA-05.5.

## Entrega 4 — Orquestração do hook

### T-15 — Orquestrar busca e consulta meteorológica

- **Prioridade:** P0
- **Tamanho:** G

- **Descrição:** Implementar hook para coordenar texto, busca, seleção, consulta
  meteorológica, unidade e estados.
- **Critérios de aceite:**
  - A busca e a meteorologia expõem estados independentes `idle`, `loading`,
    `success`, `empty` ou `error`; busca bem-sucedida vazia usa `empty`.
  - Selecionar uma cidade chama forecast uma vez com suas coordenadas; não
    seleciona nem consulta os demais resultados. Em erro, cidade selecionada
    permanece disponível para retry.
  - Ao começar forecast de outra cidade, dados meteorológicos anteriores são
    limpos antes de resolver a nova chamada; enquanto a operação está em
    `loading`, nova chamada duplicada é ignorada.
  - Retry da busca reutiliza o texto da busca; retry meteorológico reutiliza a
    cidade selecionada. Busca sem falha não é repetida junto ao retry do clima,
    nem o contrário.
  - Unidade começa em Celsius e sua alteração não aciona geocodificação nem
    forecast.
  - Nenhum estado é gravado em `localStorage`, `sessionStorage`, cookie, URL ou
    backend.
- **Dependências:** T-08, T-10.
- **Arquivos prováveis:** `src/hooks/useWeatherSearch.ts`
- **Tipo:** Data
- **Requisitos:** RF-01, RF-04, RF-05, RNF-08.
- **Rastreabilidade:** CA-01.1, CA-01.6, CA-01.7, CA-04.1, CA-04.4,
  CA-05.1 a CA-05.6, RNF-08.

## Entrega 5 — Componentes de interface

### T-12 — Criar o formulário de busca

- **Prioridade:** P0
- **Tamanho:** P

- **Descrição:** Implementar entrada e submissão explícita da busca, sem acesso
  HTTP no componente.
- **Critérios de aceite:**
  - Para string vazia ou somente espaços, exibe validação de campo obrigatório e
    não chama a ação de busca; para texto válido, chama uma vez com somente os
    espaços externos removidos e mantém os caracteres internos.
  - Um submit é acionável por Enter e por botão; com `loading=true`, o submit
    fica desabilitado e um segundo submit não chama a ação.
  - Um aviso visível informa que o nome será transmitido ao Open-Meteo.
- **Dependências:** T-01, T-15.
- **Arquivos prováveis:** `src/components/SearchForm.tsx`
- **Tipo:** UI
- **Requisitos:** RF-01, RNF-05, RNF-08.
- **Rastreabilidade:** CA-01.1, CA-01.5, CA-01.8, RNF-05, RNF-08.

### T-13 — Criar a lista de resultados de cidades

- **Prioridade:** P0
- **Tamanho:** P

- **Descrição:** Exibir resultados de geocodificação e permitir escolha
  explícita da localidade.
- **Critérios de aceite:**
  - Para cada resultado fixture, apresenta nome e cada campo de região/país
    presente; resultados homônimos sem esses campos exibem suas coordenadas.
  - Renderiza no máximo cinco itens na mesma ordem da entrada e nenhum item é
    selecionado antes de interação.
  - Cada item possui nome acessível com contexto suficiente para distingui-lo e
    pode ser selecionado com teclado.
- **Dependências:** T-01, T-15.
- **Arquivos prováveis:** `src/components/CityResults.tsx`
- **Tipo:** UI
- **Requisitos:** RF-01, RNF-05.
- **Rastreabilidade:** CA-01.2 a CA-01.4, CA-01.7, RNF-05.

### T-14 — Criar a apresentação dos estados de consulta

- **Prioridade:** P0
- **Tamanho:** P

- **Descrição:** Exibir estados de carregamento, vazio, falha e indisponibilidade
  com recuperação manual.
- **Critérios de aceite:**
  - Para cada estado `loading`, `empty` e `error` de busca ou meteorologia, exibe
    a mensagem correspondente; loading usa região `role=status` e falha usa
    `role=alert`, sem misturar os estados das duas operações.
  - Estado `empty` da busca exibe “Cidade não encontrada” e não exibe mensagem
    de erro técnico.
  - Para timeout, rede, HTTP e resposta inválida, exibe mensagem própria e
    controle de retry; o controle chama somente a operação indicada.
- **Dependências:** T-01, T-15.
- **Arquivos prováveis:** `src/components/QueryStatus.tsx`
- **Tipo:** UI
- **Requisitos:** RF-05, RNF-05.
- **Rastreabilidade:** CA-01.6, CA-05.1 a CA-05.6, RNF-05.

### T-17 — Exibir condições meteorológicas atuais

- **Prioridade:** P0
- **Tamanho:** M

- **Descrição:** Criar componente para cidade, temperatura, condição, horário e
  atribuição do provedor, além de umidade, vento, precipitação e pressão.
- **Critérios de aceite:**
  - Com uma fixture de cidade e observação válida, renderiza nome da cidade,
    temperatura em °C, descrição WMO, horário local em 24 horas e atribuição
    Open-Meteo.
  - Com timestamp ausente, inválido, futuro ou acima de 120 minutos, não renderiza
    temperatura/condição como atuais e apresenta indisponibilidade; campos
    ausentes ou códigos desconhecidos também exibem indisponibilidade.
  - Ao receber dados para outra cidade, não exibe cidade ou valores da fixture
    anterior.
  - Métricas ausentes ou inválidas são identificadas como indisponíveis.
- **Dependências:** T-01, T-02, T-03, T-10, T-15.
- **Arquivos prováveis:** `src/components/CurrentWeather.tsx`
- **Tipo:** UI
- **Requisitos:** RF-02, RF-05, RNF-07.
- **Rastreabilidade:** CA-02.1 a CA-02.3, CA-05.5, RNF-07.

### T-18 — Exibir a previsão diária de cinco dias

- **Prioridade:** P0
- **Tamanho:** M

- **Descrição:** Criar cartões diários para datas locais, condições,
  temperaturas mínima e máxima e probabilidade de precipitação.
- **Critérios de aceite:**
  - Para fixture válida, renderiza exatamente cinco cartões em ordem cronológica
    com as datas fornecidas, condição e mínima/máxima; datas são as do fuso
    retornado, não as do dispositivo.
  - Campo/dia ausente nos dados da fixture mostra indisponibilidade e não copia
    valor de outro dia; `forecast: null` exibe mensagem de previsão indisponível
    sem cartões válidos.
  - Atribuição Open-Meteo é visível junto à previsão.
- **Dependências:** T-01, T-02, T-10, T-15.
- **Arquivos prováveis:** `src/components/ForecastList.tsx`
- **Tipo:** UI
- **Requisitos:** RF-03, RF-05, RNF-07.
- **Rastreabilidade:** CA-03.1 a CA-03.4, CA-05.5, RNF-07.

### T-19 — Criar alternância acessível de unidade

- **Prioridade:** P0
- **Tamanho:** M

- **Descrição:** Implementar controle de Celsius/Fahrenheit conectado à função
  pura de conversão.
- **Critérios de aceite:**
  - Ao iniciar sessão, Celsius está selecionado e todos os valores são rotulados
    `°C`; o controle expõe nome e seleção por role/estado acessível.
  - Selecionar Fahrenheit atualiza as temperaturas atuais e todas as mínimas e
    máximas para `°F`; demais campos permanecem iguais e nenhum serviço é chamado.
  - Selecionar Celsius restaura valores calculados dos Celsius originais; valores
    nulos permanecem indisponíveis em ambas as unidades.
  - Após recarregar a página, a unidade volta a Celsius.
- **Dependências:** T-04, T-15.
- **Arquivos prováveis:** `src/components/TemperatureUnitToggle.tsx`
- **Tipo:** UI
- **Requisitos:** RF-04, RNF-05.
- **Rastreabilidade:** CA-04.1 a CA-04.5, RNF-05.

## Entrega 6 — Integração da aplicação

### Protótipo navegável com dados simulados

- Montar a tela com os componentes, cinco dias fictícios, controle de unidade e
  estados demonstráveis de busca. Identificar claramente que não há chamada à
  API e que os valores não são observações reais.
- Preservar a integração real e a seleção explícita de cidade para T-36/T-20;
  o protótipo não conclui essas tarefas.

### T-36 — Integrar a primeira fatia vertical de busca e clima atual

- **Prioridade:** P0
- **Tamanho:** M
- **Descrição:** Integrar busca, seleção explícita, estados e clima atual para
  disponibilizar uma jornada utilizável antes da previsão completa.
- **Critérios de aceite:**
  - A pessoa consegue submeter uma busca, escolher uma localidade e visualizar
    seu clima atual ou um estado loading/erro/vazio com recuperação.
  - Cidade e clima apresentados pertencem ao resultado explicitamente
    selecionado; retry da busca ou do clima repete somente a operação falha.
  - A primeira fatia não restaura busca ou clima após recarregar e funciona em
    viewport desktop e mobile de 390 × 844 CSS px sem rolagem horizontal.
- **Dependências:** T-12, T-13, T-14, T-15, T-17.
- **Arquivos prováveis:** `src/App.tsx`
- **Tipo:** UI
- **Requisitos:** RF-01, RF-02, RF-05, RNF-01, RNF-08.
- **Rastreabilidade:** CA-01.1 a CA-01.8, CA-02.1 a CA-02.3, CA-05.1 a CA-05.6,
  RNF-01, RNF-08.

### T-20 — Integrar os componentes na página principal

- **Prioridade:** P0
- **Tamanho:** M

- **Descrição:** Compor os componentes e o hook no fluxo principal da aplicação.
- **Critérios de aceite:**
  - Uma interação de busca chega à lista de resultados; selecionar um item
    dispara consulta para essa cidade e os componentes atuais/previstos recebem
    apenas o estado dessa consulta.
  - A página conecta controles e mensagens de sucesso, vazio, loading e erro com
    ações de retry apropriadas.
  - Textos de interface e mensagens estão em pt-BR; aviso de transmissão da
    busca e atribuição Open-Meteo estão visíveis no fluxo.
  - Recarregar a página inicia estado sem cidade e com Celsius, sem restaurar
    busca nem dados meteorológicos.
- **Dependências:** T-18, T-19, T-36.
- **Arquivos prováveis:** `src/App.tsx`
- **Tipo:** UI
- **Requisitos:** RF-01 a RF-05, RNF-07, RNF-08.
- **Rastreabilidade:** CA-01.1 a CA-01.8, CA-02.1 a CA-02.3, CA-03.1 a CA-03.4,
  CA-04.1 a CA-04.5, CA-05.1 a CA-05.6, RNF-07, RNF-08.

## Entrega 7 — Testes unitários, de componentes e E2E

### T-05 — Testar o mapeamento WMO

- **Prioridade:** P1
- **Tamanho:** P

- **Descrição:** Testar os códigos conhecidos e desconhecidos.
- **Critérios de aceite:**
  - Há ao menos uma asserção para cada código WMO da tabela da spec e a descrição
    esperada correspondente.
  - Uma asserção para código fora da tabela verifica o marcador de
    indisponibilidade.
- **Dependências:** T-02.
- **Arquivos prováveis:** `tests/unit/lib/weatherCode.test.ts`
- **Tipo:** Test
- **Requisitos:** RF-02, RF-03, RF-05.
- **Rastreabilidade:** CA-02.1, CA-02.2, CA-03.1, CA-03.3.

### T-06 — Testar formatação e validade temporal

- **Prioridade:** P1
- **Tamanho:** M

- **Descrição:** Testar formatação local, fuso e limites de validade da
  observação.
- **Critérios de aceite:**
  - Asserções verificam data `dd/MM` e horário de 24 horas com fuso de cidade
    diferente do fuso configurado no ambiente de teste.
  - Casos separados verificam timestamp ausente, inválido, futuro, com 120
    minutos e com mais de 120 minutos de idade.
- **Dependências:** T-03.
- **Arquivos prováveis:** `tests/unit/lib/dateTime.test.ts`
- **Tipo:** Test
- **Requisitos:** RF-02, RF-03, RNF-07.
- **Rastreabilidade:** CA-02.1, CA-02.3, CA-03.2, CA-03.3, RNF-07.

### T-07 — Testar unitariamente a conversão de unidade

- **Prioridade:** P0
- **Tamanho:** P

- **Descrição:** Testar conversões e regra de arredondamento.
- **Critérios de aceite:**
  - Testes unitários Vitest verificam Celsius sem conversão e Fahrenheit pela
    fórmula da spec, com valores positivos e negativos.
  - Casos de empate positivo e negativo confirmam arredondamento afastando-se de
    zero; conversões repetidas usam o Celsius original e retornam o mesmo
    resultado.
  - A suíte roda isoladamente com `pnpm exec vitest run tests/unit/lib/temperature.test.ts`.
- **Dependências:** T-04.
- **Arquivos prováveis:** `tests/unit/lib/temperature.test.ts`
- **Tipo:** Test
- **Requisitos:** RF-04.
- **Rastreabilidade:** CA-04.1 a CA-04.4.

### T-09 — Testar o serviço de geocodificação

- **Prioridade:** P0
- **Tamanho:** M

- **Descrição:** Verificar parâmetros, normalização e respostas simuladas do
  serviço.
- **Critérios de aceite:**
  - Testes unitários Vitest substituem `globalThis.fetch` por mock e verificam
    trim/Unicode, parâmetros, campos geográficos opcionais e que seis resultados
    produzem exatamente os cinco primeiros na ordem original; resposta vazia
    resulta em lista vazia.
  - O mock de fetch cobre timeout aos 10 segundos (verificando `AbortSignal`
    abortado), rejeição de rede, status HTTP não exitoso e JSON/payload inválido,
    verificando o erro retornado.
  - Cada invocação testada chama o mock de fetch exatamente uma vez, sem retry.
- **Dependências:** T-08.
- **Arquivos prováveis:** `tests/unit/services/geocodingService.test.ts`
- **Tipo:** Test
- **Requisitos:** RF-01, RF-05.
- **Rastreabilidade:** CA-01.1 a CA-01.3, CA-01.6, CA-05.2, CA-05.3, CA-05.6.

### T-11 — Testar o serviço de previsão meteorológica

- **Prioridade:** P0
- **Tamanho:** M

- **Descrição:** Validar parâmetros e normalização de respostas meteorológicas
  simuladas.
- **Critérios de aceite:**
  - Testes unitários Vitest substituem `globalThis.fetch` por mock e verificam
    coordenadas/parâmetros, cinco datas sequenciais, fuso ausente e campos
    parciais.
  - Quando um campo da resposta mockada é inválido, ele fica indisponível e os
    campos válidos independentes mantêm os valores esperados da fixture.
  - O mock de fetch cobre timeout aos 10 segundos (verificando `AbortSignal`
    abortado), rejeição de rede, status HTTP não exitoso e JSON/payload inválido;
    cada invocação chama fetch uma vez.
- **Dependências:** T-10.
- **Arquivos prováveis:** `tests/unit/services/forecastService.test.ts`
- **Tipo:** Test
- **Requisitos:** RF-02, RF-03, RF-05.
- **Rastreabilidade:** CA-02.1 a CA-02.3, CA-03.1 a CA-03.4, CA-05.2, CA-05.3,
  CA-05.5.

### T-16 — Testar a orquestração do hook

- **Prioridade:** P0
- **Tamanho:** M

- **Descrição:** Cobrir transições de estado, seleção, retry e isolamento dos
  dados entre consultas.
- **Critérios de aceite:**
  - Testes controlados verificam transições de busca e clima por `loading`,
    `success`, `empty` e `error`, incluindo retries que acionam apenas o serviço
    que falhou.
  - Asserções verificam cidade selecionada preservada em erro e dados da cidade
    anterior ausentes antes de resolver a nova consulta.
  - Com promessas pendentes, submits duplicados não criam nova chamada; sem ação
    explícita de retry não ocorre outra chamada.
  - Testes confirmam que unidade começa em Celsius e sua mudança não chama
    geocodificação nem forecast.
- **Dependências:** T-15.
- **Arquivos prováveis:** `tests/unit/hooks/useWeatherSearch.test.ts`
- **Tipo:** Test
- **Requisitos:** RF-01, RF-04, RF-05.
- **Rastreabilidade:** CA-01.1, CA-01.6, CA-01.7, CA-04.1, CA-04.4,
  CA-05.1 a CA-05.6.

### T-21 — Testar o formulário de busca

- **Prioridade:** P1
- **Tamanho:** P

- **Descrição:** Testar validação, submissão e acessibilidade do formulário.
- **Critérios de aceite:**
  - Testes verificam que string vazia e somente espaços mostram validação e
    resultam em zero chamadas; texto como ` São Luís ` chama uma vez com
    `São Luís`, preservando caracteres internos.
  - Teste de submit por Enter e botão verifica uma chamada; com loading ativo,
    botão fica desabilitado e novo submit não aumenta a contagem.
  - Campo e botão são localizáveis por label/role e operáveis por teclado.
- **Dependências:** T-12.
- **Arquivos prováveis:** `tests/unit/components/SearchForm.test.tsx`
- **Tipo:** Test
- **Requisitos:** RF-01, RNF-05.
- **Rastreabilidade:** CA-01.1, CA-01.5, RNF-05.

### T-22 — Testar a lista de resultados de cidades

- **Prioridade:** P1
- **Tamanho:** P

- **Descrição:** Testar exibição, distinção e seleção acessível dos resultados.
- **Critérios de aceite:**
  - Fixture com seis resultados renderiza exatamente cinco na mesma ordem e
    exibe cada nome, região e país fornecidos; homônimos sem região/país mostram
    as coordenadas correspondentes.
  - Antes da interação, nenhuma cidade está selecionada nem callback foi chamado;
    ativar um resultado por teclado chama callback uma vez com aquele objeto.
- **Dependências:** T-13.
- **Arquivos prováveis:** `tests/unit/components/CityResults.test.tsx`
- **Tipo:** Test
- **Requisitos:** RF-01, RNF-05.
- **Rastreabilidade:** CA-01.2 a CA-01.4, CA-01.7, RNF-05.

### T-23 — Testar apresentação dos estados de consulta

- **Prioridade:** P0
- **Tamanho:** P

- **Descrição:** Testar estados vazios, de carregamento e de erro, incluindo
  comunicação acessível e retry.
- **Critérios de aceite:**
  - Testes de componente renderizam explicitamente os estados `loading`,
    `empty` e `error`: loading mostra progresso; empty da busca mostra “Cidade
    não encontrada” sem erro técnico; error cobre timeout, rede, HTTP e resposta
    inválida com mensagem e retry.
  - Loading é encontrado por `role=status` e erro por `role=alert`; buscar cada
    estado por role retorna exatamente a região esperada.
  - Retry acionado por Enter e Space chama o callback uma vez; estado `empty`
    não apresenta controle de retry de erro técnico.
- **Dependências:** T-14.
- **Arquivos prováveis:** `tests/unit/components/QueryStatus.test.tsx`
- **Tipo:** Test
- **Requisitos:** RF-05, RNF-05.
- **Rastreabilidade:** CA-01.6, CA-05.1 a CA-05.3, RNF-05.

### T-24 — Testar a apresentação do clima atual

- **Prioridade:** P1
- **Tamanho:** P

- **Descrição:** Verificar conteúdo, atribuição e dados indisponíveis do clima
  atual.
- **Critérios de aceite:**
  - Fixture válida verifica texto da cidade, valor/`°C`, descrição WMO,
    horário formatado e atribuição Open-Meteo.
  - Fixtures com temperatura/condição ausente e timestamp ausente, inválido,
    futuro ou acima de 120 minutos verificam estado indisponível e ausência de
    valores da fixture anterior.
- **Dependências:** T-17.
- **Arquivos prováveis:** `tests/unit/components/CurrentWeather.test.tsx`
- **Tipo:** Test
- **Requisitos:** RF-02, RF-05, RNF-07.
- **Rastreabilidade:** CA-02.1 a CA-02.3, CA-05.5, RNF-07.

### T-25 — Testar a apresentação da previsão diária

- **Prioridade:** P1
- **Tamanho:** P

- **Descrição:** Verificar cartões, datas locais e indisponibilidade dos campos.
- **Critérios de aceite:**
  - Fixture de cinco dias verifica exatamente cinco cartões em ordem, data,
    condição, mínima, máxima e atribuição Open-Meteo.
  - Fixtures de campo/data ausente verificam marcador indisponível sem cópia de
    valor de outro dia; `forecast: null` verifica mensagem de indisponibilidade
    sem cartão apresentado como válido.
- **Dependências:** T-18.
- **Arquivos prováveis:** `tests/unit/components/ForecastList.test.tsx`
- **Tipo:** Test
- **Requisitos:** RF-03, RF-05, RNF-07.
- **Rastreabilidade:** CA-03.1 a CA-03.4, CA-05.5, RNF-07.

### T-26 — Testar a alternância de unidade

- **Prioridade:** P1
- **Tamanho:** P

- **Descrição:** Verificar seleção de unidade e atualização das temperaturas.
- **Critérios de aceite:**
  - No estado inicial, todos os valores e controle exibem Celsius; selecionar
    Fahrenheit verifica valores e rótulos atuais e diários.
  - Selecionar Celsius novamente verifica valores originais arredondados; estado
    da cidade, condição, datas e disponibilidade permanece idêntico, e spies
    dos serviços continuam com contagem de chamadas inalterada.
  - Estado `null` continua indisponível nas duas unidades e ao recarregar a
    unidade inicial é Celsius.
- **Dependências:** T-19.
- **Arquivos prováveis:** `tests/unit/components/TemperatureUnitToggle.test.tsx`
- **Tipo:** Test
- **Requisitos:** RF-04, RNF-05.
- **Rastreabilidade:** CA-04.1 a CA-04.5, RNF-05.

### T-27 — Testar o fluxo feliz ponta a ponta

- **Prioridade:** P0
- **Tamanho:** M

- **Descrição:** Cobrir a jornada de busca até a previsão com APIs simuladas.
- **Critérios de aceite:**
  - Com respostas fixas interceptadas, executa o fluxo completo — busca,
    seleção explícita, clima atual, cinco dias e alternância para Fahrenheit —
    nos viewports desktop `1366×768` e mobile `390×844`.
  - Em ambos os viewports, verifica cidade/condições/horário, exatamente cinco
    dias e todas as temperaturas/unidades; no mobile também verifica
    `scrollWidth <= clientWidth`.
  - Interceptações verificam que geocoding é chamado uma vez e forecast recebe
    as coordenadas selecionadas; nenhuma chamada real ao Open-Meteo é feita.
- **Dependências:** T-20.
- **Arquivos prováveis:** `tests/e2e/weather-search.spec.ts`
- **Tipo:** Test
- **Requisitos:** RF-01, RF-02, RF-03, RF-04, RNF-01.
- **Rastreabilidade:** CA-01.1 a CA-01.3, CA-01.7, CA-02.1, CA-03.1, CA-04.1 a
  CA-04.4, RNF-01.

### T-28 — Testar falhas e isolamento ponta a ponta

- **Prioridade:** P1
- **Tamanho:** M

- **Descrição:** Cobrir recuperação e garantir que dados não vazem entre
  consultas.
- **Critérios de aceite:**
  - Cenários interceptados verificam busca vazia sem erro técnico; timeout e
    falha recuperável mostram retry e uma nova tentativa com o mesmo texto ou
    cidade selecionada, respectivamente; cada retry produz exatamente uma
    chamada. Resposta parcial marca campos ausentes como indisponíveis.
  - No cenário A→B, após iniciar a consulta de B e antes de sua resposta, não há
    valores atuais/previstos de A na página; após resposta, cidade e valores de B
    são exibidos.
  - As chamadas aos endpoints permanecem simuladas em todos os cenários.
- **Dependências:** T-20.
- **Arquivos prováveis:** `tests/e2e/weather-errors.spec.ts`
- **Tipo:** Test
- **Requisitos:** RF-01, RF-02, RF-03, RF-05.
- **Rastreabilidade:** CA-01.6, CA-05.2 a CA-05.5, CA-02.2, CA-03.3.

### T-37 — Testar a primeira fatia vertical em desktop e mobile

- **Prioridade:** P0
- **Tamanho:** M

- **Descrição:** Verificar ponta a ponta a primeira jornada integrada antes de
  adicionar previsão diária e alternância de unidade.
- **Critérios de aceite:**
  - Com APIs interceptadas, o cenário submete busca, seleciona um resultado e
    exibe a cidade e o clima atual correspondentes; verifica também loading e
    pelo menos um caminho de falha/recuperação.
  - O cenário passa em viewports desktop 1366 × 768 e mobile 390 × 844; no
    mobile, `scrollWidth <= clientWidth`.
  - Nenhuma chamada real ao Open-Meteo é feita.
- **Dependências:** T-36.
- **Arquivos prováveis:** `tests/e2e/weather-search-slice.spec.ts`
- **Tipo:** Test
- **Requisitos:** RF-01, RF-02, RF-05, RNF-01.
- **Rastreabilidade:** CA-01.1, CA-01.7, CA-02.1, CA-05.1, CA-05.3, RNF-01.

## Entrega 8 — Hardening e validação não funcional

### T-29 — Validar responsividade

- **Prioridade:** P1
- **Tamanho:** M

- **Descrição:** Verificar o layout em larguras e orientações suportadas.
- **Critérios de aceite:**
  - Testes varrem cada largura inteira de 320 a 1920 CSS px e verificam
    `scrollWidth <= clientWidth` e presença da busca, seleção e todos os campos
    meteorológicos.
  - Em retrato e paisagem, cada controle pode ser focado e acionado, sem clipping
    ou sobreposição que impeça a interação.
- **Dependências:** T-20, T-27.
- **Arquivos prováveis:** `tests/e2e/responsive.spec.ts`
- **Tipo:** Test
- **Requisitos:** RNF-01.
- **Rastreabilidade:** RNF-01.

### T-30 — Validar acessibilidade dos fluxos

- **Prioridade:** P1
- **Tamanho:** G

- **Descrição:** Executar verificações automatizadas e revisão manual de
  acessibilidade.
- **Critérios de aceite:**
  - Busca, seleção, retry e alternância são completáveis somente por teclado; o
    foco visível e o nome acessível de cada controle são verificados.
  - Loading e erro são encontrados por leitores de tela em regiões anunciáveis.
  - A varredura automatizada dos fluxos cobertos retorna zero violações WCAG 2.2
    nível A/AA; revisão manual registra resultado de cada critério avaliado.
- **Dependências:** T-21, T-22, T-23, T-24, T-25, T-26, T-27.
- **Arquivos prováveis:** `tests/e2e/accessibility.spec.ts`
- **Tipo:** Test
- **Requisitos:** RNF-05.
- **Rastreabilidade:** RNF-05.

### T-31 — Validar compatibilidade entre navegadores

- **Prioridade:** P1
- **Tamanho:** G

- **Descrição:** Executar os fluxos principais nos navegadores e dispositivos
  alvo.
- **Critérios de aceite:**
  - A matriz de execução registra resultado do fluxo principal nas duas versões
    estáveis mais recentes, na data da execução, de Chrome, Firefox, Safari e
    Edge desktop.
  - A matriz registra resultado em Chrome Android e Safari iOS a 320 CSS px;
    falhas de execução ou incompatibilidades são registradas, não ignoradas.
- **Dependências:** T-27, T-28.
- **Arquivos prováveis:** `playwright.config.ts`
- **Tipo:** Test
- **Requisitos:** RNF-06.
- **Rastreabilidade:** RNF-06.

### T-32 — Medir o desempenho do fluxo de consulta

- **Prioridade:** P1
- **Tamanho:** G

- **Descrição:** Medir a latência de ponta a ponta em condições controladas.
- **Critérios de aceite:**
  - São registradas 100 consultas bem-sucedidas com viewport 1366 × 768 CSS px,
    RTT de 50 ms e latência do provedor de até 1,5 s; consultas fora dessas
    condições não contam na amostra.
  - O relatório calcula p95 do intervalo entre envio e renderização do clima e
    registra separadamente latência do provedor; o p95 da aplicação não excede
    2,5 s.
- **Dependências:** T-27.
- **Arquivos prováveis:** `tests/performance/weather-query.ts`
- **Tipo:** Test
- **Requisitos:** RNF-03.
- **Rastreabilidade:** RNF-03.

### T-33 — Validar usabilidade com participantes

- **Prioridade:** P2
- **Tamanho:** M

- **Descrição:** Conduzir teste moderado da tarefa principal sem ajuda do
  moderador.
- **Critérios de aceite:**
  - Cinco participantes sem experiência prévia com a aplicação executam o mesmo
    roteiro e o tempo começa no início da tarefa.
  - Sucesso exige encontrar cidade, consultar dados e identificar temperatura e
    condição em até 30 segundos, sem intervenção; pelo menos quatro de cinco
    atendem ao critério.
  - Registro anonimizado contém tempo, conclusão e problemas observados por
    participante, sem identificadores pessoais.
- **Dependências:** T-20.
- **Arquivos prováveis:** `tests/usability/weather-app.md`
- **Tipo:** Test
- **Requisitos:** RNF-02.
- **Rastreabilidade:** RNF-02.

### T-34 — Configurar monitoramento sintético de confiabilidade

- **Prioridade:** P1
- **Tamanho:** G

- **Descrição:** Preparar verificações periódicas do fluxo de consulta em
  produção, sem dados de usuário.
- **Critérios de aceite:**
  - O monitor executa uma verificação por minuto e registra sucesso somente se
    uma busca e uma consulta meteorológica de teste retornarem dados válidos;
    falha de qualquer etapa conta como indisponibilidade.
  - O relatório mensal calcula `sucessos / verificações totais × 100` e mostra
    explicitamente se o resultado é pelo menos 99,5%.
  - Inspeção da configuração confirma que payloads não contêm dados de usuário,
    identificadores ou persistência e que não há analytics ou cookies de
    rastreamento.
- **Dependências:** T-27.
- **Arquivos prováveis:** configuração do monitoramento sintético no ambiente de
  publicação.
- **Tipo:** Infra
- **Requisitos:** RNF-04, RNF-08.
- **Rastreabilidade:** RNF-04, RNF-08.

### T-35 — Revisar termos e atribuição do provedor para release

- **Prioridade:** P0
- **Tamanho:** P

- **Descrição:** Confirmar a compatibilidade dos termos vigentes do Open-Meteo e
  dos requisitos de atribuição antes da publicação.
- **Critérios de aceite:**
  - Registro de release identifica os termos vigentes consultados, data da
    revisão, requisitos de atribuição e decisão de compatibilidade.
  - Se a revisão identificar incompatibilidade, a checklist de release permanece
    bloqueada; publicação só é liberada após compatibilidade confirmada.
- **Dependências:** T-20.
- **Arquivos prováveis:** documentação de release do projeto.
- **Tipo:** Infra
- **Requisitos:** RF-02, RF-03.
- **Rastreabilidade:** CA-02.1, CA-03.1 (atribuição exigida).

## Matriz de cobertura — Requisitos funcionais

“Implementação” lista as tarefas que entregam comportamento ou código para o
requisito; “Verificação” lista testes que validam esse comportamento.

| Requisito da spec | Tarefas de implementação | Tarefas de verificação | Cobertura |
|---|---|---|---|
| **RF-01 — Buscar cidade** | T-08, T-12, T-13, T-15, T-20, T-36 | T-09, T-16, T-21, T-22, T-27, T-28, T-37 | Coberto |
| **RF-02 — Consultar clima atual** | T-02, T-03, T-10, T-17, T-20, T-36 | T-05, T-06, T-11, T-24, T-27, T-28, T-35, T-37 | Coberto |
| **RF-03 — Consultar previsão de cinco dias** | T-02, T-03, T-10, T-18, T-20 | T-05, T-06, T-11, T-25, T-27, T-28, T-35 | Coberto |
| **RF-04 — Alternar unidade de temperatura** | T-04, T-15, T-19, T-20 | T-07, T-16, T-26, T-27 | Coberto |
| **RF-05 — Comunicar estados de consulta** | T-02, T-08, T-10, T-14, T-15, T-17, T-18, T-20, T-36 | T-09, T-11, T-16, T-23, T-24, T-25, T-28, T-37 | Coberto |

**Lacunas:** Nenhum requisito funcional RF-01 a RF-05 está sem tarefa
correspondente. A cobertura inclui tarefas de implementação e verificação;
requisitos não funcionais são rastreados separadamente nas próprias tarefas.

## Sequência sugerida — Fatias verticais

Entregue e valide cada fatia antes de ampliar o escopo. A ordem abaixo intercala
implementação e testes para que cada marco resulte em comportamento observável;
T-20 completa a integração depois que a primeira fatia já está utilizável.

1. **Busca → seleção → clima atual (primeiro incremento visível):** T-01, T-02,
   T-03, T-08, T-10, T-12, T-13, T-14, T-15, T-17, T-36; validar com T-05, T-06,
   T-09, T-11, T-16, T-21, T-22, T-23, T-24 e T-37. Resultado: consulta atual
   utilizável em desktop/mobile, com busca e recuperação de estados.
2. **Completar previsão e alternância de unidade:** T-04, T-18, T-19, T-20;
   validar com T-07, T-25, T-26 e T-27. Resultado: produto funcional completo,
   do fluxo de busca à previsão de cinco dias e alternância Celsius/Fahrenheit.
3. **Endurecer e preparar release:** T-28 a T-35. Resultado: cobertura de falhas,
   responsividade, acessibilidade, compatibilidade, desempenho, usabilidade,
   monitoramento e revisão dos termos do provedor.

**Leitura de prioridade:** conclua P0 para ter a primeira fatia utilizável e
respeite gates P0 antes do release; P1 cobre hardening necessário antes do
release geral; P2 agenda avaliação de usabilidade após o fluxo estar estável.
Tamanho P/M/G é estimativa relativa, não duração nem critério de prioridade.
