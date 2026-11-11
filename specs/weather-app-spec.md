# Especificação do Produto — Aplicação de Previsão do Tempo

## Overview

Aplicação web para consultar o clima de cidades por meio de busca textual,
visualizar as condições atuais e a previsão para cinco dias, e alternar a
unidade de temperatura entre Celsius e Fahrenheit. A interface inicial será em
pt-BR e deverá funcionar em dispositivos móveis e desktop.

O produto atende principalmente pessoas que precisam de uma consulta rápida
durante um deslocamento, que planejam uma viagem ou que organizam atividades ao
ar livre. Essas personas são hipóteses iniciais; o teste de usabilidade definido
em RNF-02 verifica a tarefa principal sem tornar pesquisa adicional um bloqueio
de implementação.

O serviço meteorológico definido para a primeira versão é o Open-Meteo, sem
exigir chave de API do usuário. A aplicação não terá autenticação nem
persistência de dados em servidor. A especificação não presume persistência
local, funcionamento offline ou localização automática.

## Functional Requirements

- **RF-01 — Buscar cidade:** permitir que a pessoa usuária pesquise uma cidade
  pelo nome, enviando a busca explicitamente. Remover espaços no início e no fim,
  preservar os caracteres restantes, exibir no máximo cinco resultados na ordem
  de relevância fornecida pelo Open-Meteo e permitir escolher a cidade. Cada
  resultado deve exibir nome da cidade, região administrativa e país quando
  disponíveis. Se resultados homônimos não tiverem região ou país, exibir suas
  coordenadas. Informar junto à busca que o nome digitado será enviado ao
  Open-Meteo. A seleção inicia a consulta meteorológica.
- **RF-02 — Consultar clima atual:** permitir a consulta das condições atuais
  para uma cidade selecionada e identificar claramente a cidade a que os dados
  pertencem. Exibir temperatura atual em Celsius ou Fahrenheit e uma descrição
  textual da condição meteorológica em pt-BR, o horário local da observação e
  atribuição ao Open-Meteo. Não exibir como atual uma observação com mais de
  duas horas de idade, sem horário válido ou com horário futuro. Exibir também
  umidade relativa (%), velocidade do vento (km/h), precipitação (mm) e pressão
  atmosférica (hPa), identificando campos ausentes como indisponíveis.
- **RF-03 — Consultar previsão de cinco dias:** apresentar a previsão da cidade
  selecionada em granularidade diária: data local, condição textual e
  temperaturas mínima e máxima para hoje e os quatro dias seguintes, conforme
  as datas fornecidas pelo Open-Meteo no fuso horário da cidade, com atribuição
  ao provedor. Exibir a probabilidade máxima diária de precipitação em percentual,
  ou indisponibilidade quando ausente. Localidades sem fuso horário retornado não
  têm previsão exibida.
- **RF-04 — Alternar unidade de temperatura:** permitir alternar entre Celsius
  e Fahrenheit. A unidade inicial deve ser Celsius, e a unidade escolhida deve
  ser aplicada a todas as temperaturas atuais e previstas. Converter usando
  °F = (°C × 9/5) + 32 e arredondar ao inteiro mais próximo, com empates
  afastando-se de zero. A escolha dura somente até a sessão da página terminar.
- **RF-05 — Comunicar estados de consulta:** comunicar carregamento, ausência de
  resultados, falhas de busca ou consulta, e indisponibilidade de dados. Quando
  houver falha recuperável, oferecer nova tentativa e preservar a cidade
  selecionada. Cada chamada ao provedor tem timeout de 10 segundos; não há
  repetição automática nem cache de dados meteorológicos. Dados ausentes,
  inválidos ou desatualizados não podem ser apresentados como atuais.

As descrições de condição usam os códigos WMO retornados pelo Open-Meteo,
traduzidos conforme esta tabela:

| Código WMO | Descrição em pt-BR |
|---|---|
| 0 | Céu limpo |
| 1 | Predominantemente limpo |
| 2 | Parcialmente nublado |
| 3 | Nublado |
| 45, 48 | Neblina |
| 51, 53, 55 | Garoa |
| 56, 57 | Garoa congelante |
| 61, 63, 65 | Chuva |
| 66, 67 | Chuva congelante |
| 71, 73, 75 | Neve |
| 77 | Grãos de neve |
| 80, 81, 82 | Pancadas de chuva |
| 85, 86 | Pancadas de neve |
| 95 | Trovoada |
| 96, 99 | Trovoada com granizo |

## User Stories

### US-01 — Encontrar uma cidade

Como pessoa em deslocamento, quero buscar pelo nome de uma cidade e identificar
a localidade correta para consultar o clima sem confundi-la com outra cidade de
mesmo nome.

### US-02 — Consultar as condições atuais

Como pessoa em deslocamento, quero ver a temperatura e a condição atual da
cidade escolhida para decidir como me preparar para o trajeto.

### US-03 — Planejar os próximos dias

Como planejador(a) de viagem ou pessoa organizando atividades ao ar livre, quero
consultar a previsão de hoje e dos quatro dias seguintes para planejar roupas e
atividades.

### US-04 — Escolher unidade de temperatura

Como pessoa usuária, quero alternar entre Celsius e Fahrenheit para interpretar
as temperaturas na unidade que prefiro.

### US-05 — Entender e recuperar uma consulta

Como pessoa usuária, quero saber quando uma busca ou consulta está carregando,
não encontrou dados ou falhou, e poder tentar novamente para entender o estado
do serviço sem ser induzida a confiar em informação indisponível.

## Acceptance Criteria

Cada critério usa **Given/When/Then** e está vinculado ao requisito funcional.

### US-01 — Encontrar uma cidade (RF-01)

- **CA-01.1**
  - **Given:** o campo de busca contém um nome com pelo menos um caractere não
    branco.
  - **When:** a pessoa envia o formulário.
  - **Then:** uma única consulta de geocodificação é feita com espaços externos
    removidos e caracteres internos preservados.
- **CA-01.2**
  - **Given:** a geocodificação retorna mais de cinco resultados.
  - **When:** os resultados são exibidos.
  - **Then:** são exibidos somente os cinco primeiros na ordem de relevância
    retornada pelo provedor.
- **CA-01.3**
  - **Given:** um resultado contém nome de cidade, região administrativa ou país.
  - **When:** a lista é exibida.
  - **Then:** o nome da cidade e cada campo geográfico retornado são exibidos
    nesse resultado.
- **CA-01.4**
  - **Given:** dois resultados têm o mesmo nome e nenhum contém região
    administrativa ou país.
  - **When:** a lista é exibida.
  - **Then:** cada resultado exibe suas coordenadas retornadas pelo provedor.
- **CA-01.5**
  - **Given:** o campo de busca contém somente espaços ou está vazio.
  - **When:** a pessoa envia o formulário.
  - **Then:** a aplicação exibe a mensagem de campo obrigatório e não faz chamada
    de geocodificação.
- **CA-01.6**
  - **Given:** a geocodificação termina com sucesso e retorna zero resultados.
  - **When:** a aplicação processa a resposta.
  - **Then:** exibe a mensagem de cidade não encontrada, sem exibir erro de API,
    e permite editar e reenviar a busca.
- **CA-01.7**
  - **Given:** a lista contém um ou mais resultados.
  - **When:** a pessoa seleciona um resultado.
  - **Then:** a aplicação identifica esse resultado como cidade selecionada e
    inicia uma consulta meteorológica para as coordenadas desse resultado;
    nenhum outro resultado é consultado.
- **CA-01.8**
  - **Given:** o formulário de busca está visível.
  - **When:** a pessoa visualiza o campo de busca.
  - **Then:** há um aviso visível de que o nome da cidade enviado será
    transmitido ao Open-Meteo.

### US-02 — Consultar as condições atuais (RF-02)

- **CA-02.1**
  - **Given:** a resposta meteorológica contém temperatura finita, código de
    condição reconhecido e horário de observação válido não futuro com idade
    máxima de duas horas.
  - **When:** a consulta termina.
  - **Then:** a interface exibe temperatura em °C, descrição correspondente ao
    código em pt-BR, horário local da observação, nome da cidade selecionada e
    atribuição da fonte Open-Meteo.
- **CA-02.2**
  - **Given:** a resposta atual contém temperatura ou condição ausente, não
    finita ou não reconhecida.
  - **When:** a consulta termina.
  - **Then:** o campo correspondente é exibido como indisponível e nenhum valor
    anterior ou inventado é exibido como atual.
- **CA-02.3**
  - **Given:** a observação atual tem mais de duas horas, não tem timestamp
    válido ou seu timestamp está no futuro.
  - **When:** a resposta é processada.
  - **Then:** a temperatura e a condição não são exibidas como atuais e a
    interface informa que os dados atuais estão desatualizados ou indisponíveis.
- **CA-02.4**
  - **Given:** uma observação atual válida contém métricas adicionais.
  - **When:** o clima atual é exibido.
  - **Then:** umidade, vento, precipitação e pressão são mostrados com suas
    unidades; cada valor ausente ou inválido é identificado como indisponível.

### US-03 — Planejar os próximos dias (RF-03)

- **CA-03.1**
  - **Given:** a resposta inclui fuso horário e previsões diárias completas para
    cinco datas consecutivas a partir da data local da cidade.
  - **When:** a consulta termina.
  - **Then:** a interface exibe cinco cartões, um por data, em ordem cronológica,
    com data, descrição de condição conforme a tabela WMO, mínima, máxima e
    probabilidade máxima de precipitação em cada cartão, e atribui os dados ao
    Open-Meteo.
- **CA-03.2**
  - **Given:** o fuso horário retornado para a cidade difere do fuso do
    dispositivo.
  - **When:** a interface determina as datas da previsão.
  - **Then:** as cinco datas correspondem ao calendário local da cidade
    retornado pelo provedor, não ao calendário do dispositivo.
- **CA-03.3**
  - **Given:** a resposta não contém uma ou mais datas ou campos de previsão.
  - **When:** a previsão é exibida.
  - **Then:** os cinco cartões continuam associados às cinco datas do intervalo;
    campo ou data ausente é identificado como indisponível e nenhum valor é
    reutilizado ou inventado.
- **CA-03.4**
  - **Given:** a resposta não contém fuso horário da cidade ou não contém nenhuma
    previsão diária válida.
  - **When:** a consulta termina.
  - **Then:** nenhum cartão de previsão é apresentado como válido e a interface
    informa que a previsão está indisponível.

### US-04 — Escolher unidade de temperatura (RF-04)

- **CA-04.1**
  - **Given:** uma sessão da página começa.
  - **When:** uma temperatura é exibida antes de qualquer alternância.
  - **Then:** a unidade é Celsius e o valor é arredondado ao inteiro mais
    próximo, com empate afastando-se de zero.
- **CA-04.2**
  - **Given:** o clima atual e a previsão contêm temperaturas em Celsius.
  - **When:** a pessoa seleciona Fahrenheit.
  - **Then:** todas as temperaturas são calculadas pela fórmula
    °F = (°C × 9/5) + 32, arredondadas ao inteiro mais próximo com empate
    afastando-se de zero e rotuladas °F.
- **CA-04.3**
  - **Given:** temperaturas estão sendo exibidas em Fahrenheit.
  - **When:** a pessoa seleciona Celsius.
  - **Then:** todos os valores retornam ao valor Celsius original arredondado
    segundo CA-04.1 e são rotulados °C.
- **CA-04.4**
  - **Given:** cidade, datas e condições estão visíveis.
  - **When:** a unidade é alternada.
  - **Then:** cidade, datas, condições e estados de disponibilidade permanecem
    iguais; somente os números de temperatura e seus rótulos mudam.
- **CA-04.5**
  - **Given:** a unidade foi alterada durante a sessão.
  - **When:** a página é recarregada ou uma nova sessão é iniciada.
  - **Then:** a unidade inicial volta a ser Celsius.

### US-05 — Entender e recuperar uma consulta (RF-05)

- **CA-05.1**
  - **Given:** uma chamada de geocodificação ou meteorologia está em andamento.
  - **When:** a resposta ainda não foi recebida.
  - **Then:** a interface exibe o estado de carregamento para a operação.
- **CA-05.2**
  - **Given:** uma chamada ao provedor não retorna em 10 segundos.
  - **When:** o limite de tempo é atingido.
  - **Then:** a chamada é encerrada, o carregamento desaparece, uma mensagem de
    timeout e uma ação de nova tentativa são exibidas, sem repetição automática.
- **CA-05.3**
  - **Given:** uma chamada falha por rede, resposta HTTP de erro, limite excedido
    ou conteúdo inválido.
  - **When:** a falha é processada.
  - **Then:** a interface informa que não foi possível concluir a operação,
    oferece nova tentativa e não apresenta dados inventados.
- **CA-05.4**
  - **Given:** uma consulta meteorológica falhou para uma cidade selecionada.
  - **When:** a pessoa aciona nova tentativa.
  - **Then:** uma nova chamada é feita para a mesma cidade; durante a chamada,
    carregamento é exibido e, ao terminar, são exibidos os dados válidos ou uma
    nova mensagem de erro.
- **CA-05.5**
  - **Given:** há resposta meteorológica parcial.
  - **When:** a interface apresenta os dados.
  - **Then:** cada campo válido é exibido, cada campo ausente é identificado
    como indisponível e nenhum dado de uma consulta anterior é reutilizado.
- **CA-05.6**
  - **Given:** uma busca falhou por timeout, erro de rede, erro HTTP ou resposta
    inválida.
  - **When:** a pessoa aciona nova tentativa.
  - **Then:** uma única nova chamada de geocodificação é feita com o mesmo texto
    de busca e a interface exibe os resultados ou o estado de erro atualizado.

## Non-Functional Requirements

- **RNF-01 — Responsividade:** entre 320 e 1920 CSS px de largura, a busca, a
  cidade selecionada e todos os campos meteorológicos devem estar disponíveis
  sem rolagem horizontal. Os controles devem permanecer utilizáveis em
  orientação retrato e paisagem.
- **RNF-02 — Usabilidade:** em teste moderado com cinco participantes que não
  conheçam a aplicação, pelo menos quatro devem encontrar uma cidade, consultar
  os dados e identificar temperatura e condição em até 30 segundos, sem ajuda
  do moderador.
- **RNF-03 — Desempenho:** em teste com 100 consultas bem-sucedidas, viewport de
  1366 × 768 CSS px, RTT de rede de 50 ms e resposta do provedor em até 1,5 s,
  o intervalo entre envio da busca e renderização do clima atual deve ser de no
  máximo 2,5 s no percentil 95. Registrar separadamente a latência do provedor.
- **RNF-04 — Confiabilidade e atualidade:** disponibilidade mensal do fluxo de
  consulta de pelo menos 99,5%, incluindo falhas do Open-Meteo no cálculo. Uma
  consulta é considerada disponível somente se busca e consulta meteorológica
  retornarem dados válidos; estados de erro não contam como sucesso. Aplicam-se
  também os limites de validade e timeout definidos nos RF-02 e RF-05. Medir a
  disponibilidade por verificações sintéticas a cada minuto, agregadas por mês.
- **RNF-05 — Acessibilidade:** atender WCAG 2.2 nível AA nos fluxos de busca,
  seleção, leitura de resultados e alternância de unidade. Os fluxos devem
  funcionar por teclado, apresentar foco visível, nomes acessíveis e estados de
  carregamento/erro anunciáveis por tecnologia assistiva; não deve haver
  violações de nível A ou AA nos fluxos avaliados.
- **RNF-06 — Compatibilidade:** suportar as duas versões estáveis principais
  mais recentes, disponíveis na data de cada release, de Chrome, Firefox,
  Safari e Edge em desktop; Chrome no Android e Safari no iOS. A largura mínima
  suportada é 320 CSS px.
- **RNF-07 — Idioma e formatos:** todos os textos da interface, descrições de
  condições, números e nomes de dias devem estar em pt-BR. Datas devem usar
  `dd/MM` e horários de observação devem usar formato de 24 horas no fuso da
  cidade. O nome próprio da localidade permanece conforme retornado pela fonte.
- **RNF-08 — Privacidade:** não criar conta, não solicitar localização do
  dispositivo e não usar analytics, publicidade, cookies de rastreamento ou
  identificadores de usuário. Informar que o nome de cidade enviado na busca é
  transmitido ao Open-Meteo. Não persistir buscas ou dados meteorológicos após
  o encerramento da sessão.

## Edge Cases

- **String vazia ou espaços:** para `""` ou qualquer sequência de espaços, não
  chamar geocodificação; exibir validação de campo obrigatório.
- **Cidade inexistente ou zero resultados:** diante de resposta HTTP bem
  sucedida com lista vazia, informar “Cidade não encontrada”, sem mensagem de
  falha técnica, e manter o campo editável.
- **Caracteres especiais:** enviar `São Luís`, `L'Aquila`, `Zürich` e texto
  Unicode equivalente preservando os caracteres após remover espaços externos.
  Se a fonte não encontrar correspondência, tratar como zero resultados.
- **Resultados homônimos:** exibir nome, região administrativa e país quando
  fornecidos; nunca selecionar automaticamente um resultado entre homônimos.
- **Falha de API ou rede:** em erro HTTP, erro de rede, resposta não JSON ou
  estrutura incompatível com o contrato esperado, encerrar carregamento,
  exibir erro e nova tentativa. Preservar a cidade selecionada e não exibir
  dados de uma consulta anterior.
- **Timeout:** após 10 segundos sem resposta para cada chamada, encerrar essa
  chamada e exibir estado de timeout e ação manual de nova tentativa.
- **Resposta parcial:** exibir apenas campos válidos da resposta; apresentar
  “Indisponível” em cada campo ausente. Manter as cinco datas da previsão se o
  fuso e o intervalo forem conhecidos, mesmo que alguns campos ou datas não
  tenham valores.
- **Dados atuais vencidos ou timestamp inválido:** se o horário da observação
  tiver mais de duas horas, for futuro ou inválido, não exibir seus valores como
  atuais e informar indisponibilidade de dados atuais.
- **Temperatura ausente ou não finita:** substituir somente o valor ausente por
  “Indisponível”; não remover a unidade dos demais valores.
- **Código de condição desconhecido:** exibir “Condição indisponível” sem
  ocultar temperaturas válidas.
- **Mudança de unidade:** recalcular todas as temperaturas atuais e previstas
  a partir dos valores Celsius originais; não converter um valor já convertido.
- **Fuso ausente:** exibir clima atual apenas se houver horário utilizável;
  não apresentar previsão diária sem fuso retornado pela fonte.
- **Cobertura meteorológica insuficiente:** manter a cidade identificada e
  indicar os campos ou período indisponíveis; não substituir por dados de outra
  localidade.
- **Múltiplos envios durante uma chamada:** ignorar envios adicionais enquanto
  o controle da operação estiver em carregamento, evitando consultas
  simultâneas duplicadas.

## Assumptions

- O objetivo da primeira versão é permitir consulta rápida de cidade, clima
  atual e previsão para apoiar deslocamentos, viagens e atividades ao ar livre;
  as personas são hipóteses de produto, não segmentos comprovados por pesquisa.
- A aplicação é web responsiva para desktop e dispositivos móveis, sem app
  nativo ou localização automática.
- A busca aceita nomes de cidades em texto livre; não promete suporte a
  abreviações, códigos postais, coordenadas, tolerância a erros ou sinônimos.
  Usa envio explícito e os resultados retornados pela geocodificação do
  Open-Meteo.
- O Open-Meteo é a única fonte da primeira versão para geocodificação, clima
  atual e previsão; não é necessário que a pessoa usuária forneça chave de API.
- A interface usa os campos especificados nos RF-02 e RF-03; previsão é diária
  e inclui a data local de hoje e quatro datas seguintes.
- Os códigos de condição do provedor são apresentados como descrições em
  pt-BR; códigos não mapeados são indisponíveis.
- Celsius é a unidade inicial e Fahrenheit a única alternativa. A preferência
  não é persistida além da sessão da página.
- Não há autenticação, histórico, armazenamento de dados em servidor, analytics
  nem persistência de buscas ou preferências no navegador.
- A aplicação não guarda cache meteorológico; novas consultas e tentativas
  solicitadas pela pessoa fazem novas chamadas ao provedor.
- A publicação depende de o uso do Open-Meteo estar de acordo com os termos
  vigentes do serviço. A interface atribui os dados ao Open-Meteo e informa que
  o nome da cidade é enviado à fonte para geocodificação.
- As metas dos RNF são os critérios de qualidade desta versão inicial e não
  dependem de aprovação adicional para orientar desenvolvimento e testes.

## Risks

| Risco | Impacto potencial | Mitigação |
|---|---|---|
| Limites de uso ou rate limiting do Open-Meteo | Buscas ou consultas atrasadas ou indisponíveis | Evitar chamadas duplicadas, não repetir automaticamente, tratar respostas de limite excedido como erro recuperável e exibir nova tentativa manual. |
| Geocodificação ambígua ou imprecisa | Exibição do clima da cidade errada | Mostrar contexto geográfico, exigir escolha entre homônimos e permitir corrigir a cidade selecionada. |
| Falha de rede da pessoa usuária | Impossibilidade de obter dados | Mostrar erro e nova tentativa, preservando a cidade selecionada; não apresentar dados antigos como atuais. |
| Indisponibilidade, mudança ou cobertura insuficiente do provedor | Interrupção ou degradação do serviço | Exibir indisponibilidade sem inventar valores; monitorar falhas e revisar compatibilidade quando o contrato da API mudar. |
| Latência elevada | Abandono ou dificuldade em consulta rápida | Exibir carregamento, aplicar timeout de 10 segundos e medir o desempenho segundo RNF-03. |
| Dados desatualizados ou imprecisos | Decisões baseadas em condições incorretas | Validar idade máxima de duas horas para observação atual, exibir o horário da observação e omitir dados atuais vencidos. |
| Geocodificação ambígua ou imprecisa | Exibição do clima da cidade errada | Mostrar contexto geográfico retornado, não selecionar automaticamente homônimos e consultar somente a localidade explicitamente selecionada. |
| Conversão ou rótulo de unidade inconsistente | Interpretação incorreta de temperaturas | Testar a fórmula e o arredondamento definidos em RF-04 para clima atual e todos os dias da previsão. |
| Diferenças entre navegadores, telas ou métodos de entrada | Dificuldade de leitura ou operação | Executar os fluxos de aceite na matriz de navegadores e larguras definida em RNF-01 e RNF-06. |
| Condições de uso ou atribuição do provedor incompatíveis | Risco de descumprimento das regras do provedor | Antes da publicação, verificar os termos vigentes, exibir atribuição e não publicar se o uso definido não for permitido. |

## Out of Scope

- Aplicativos nativos para iOS ou Android; a primeira versão é assumida como web responsiva.
- Autenticação, contas de usuário ou persistência de dados em servidor.
- Localização automática por GPS ou endereço IP.
- Favoritar, fixar, comparar ou gerenciar listas de cidades.
- Alertas meteorológicos, notificações ou recomendações personalizadas.
- Funcionamento offline ou acesso a dados meteorológicos em cache.
- Métricas diferentes das definidas nos RF-02 e RF-03, incluindo sensação
  térmica e índice UV.
- Suporte a idiomas além de pt-BR nesta especificação inicial.

## Open Questions

Não há perguntas em aberto que bloqueiem o desenvolvimento da primeira versão.
As decisões e limites desta especificação são o baseline adotado para
implementação. Mudanças de escopo — como novos campos, outro fornecedor,
persistência, idiomas ou localização automática — devem ser tratadas como
revisões da spec. A única condição externa para publicação é a compatibilidade
do uso do Open-Meteo com seus termos vigentes, conforme indicado em Assumptions
e Risks.
