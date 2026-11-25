# Testes – Allivia

**Instituição:** Etec de Taboão da Serra
**Integrantes:** Lavínia Manzan, Mirella Ferreira, Rihana Ferreira, Sophia Félix e Vicente da Silva

---

Este documento resume a **Política de Testes** e a **Planilha de Casos de Teste** do Allivia. Os arquivos originais estão em [`anexos/`](anexos/):

- [Política de Testes – Allivia (.docx)](anexos/Politica%20de%20Testes%20-%20Allivia.docx)
- [Planilha de Casos de Teste – Allivia (.xlsx)](anexos/Planilha%20de%20Casos%20de%20Teste%20-%20Allivia.xlsx)

## 1 Resumo

| Indicador | Valor |
| --- | --- |
| Casos planejados | 57 |
| Casos executados | 57 (100%) |
| Aprovados (Passe) | 55 |
| Reprovados (Falha) | 2 |
| Bloqueados | 0 |
| Rodada manual | 21 a 31/10/2026 |
| Rodada técnica | 24/11/2026 |

## 2 Plano do projeto

### 2.1 Objetivo

Verificar se o Allivia centraliza preferências alimentares, receitas, favoritos, histórico de produtos escaneados e consulta de restaurantes, oferecendo navegação clara e informações compatíveis com o perfil do usuário.

### 2.2 Escopo

Aplicativo React Native com Expo e TypeScript; autenticação e persistência no Supabase; consulta à Open Food Facts; mapas com OpenStreetMap. O plano contempla cadastro, preferências, receitas, scanner, restaurantes, perfil e fluxo Premium.

### 2.3 Exclusões e limitações

- O aplicativo não fornece diagnóstico, garantia de ausência de contaminação cruzada ou prescrição alimentar.
- A exportação Android valida o empacotamento e não equivale à publicação na loja nem à homologação em todos os aparelhos.
- Não há cobrança real: o fluxo Premium é simulado.
- A qualidade dos dados públicos, a rede, as permissões e o hardware influenciam o scanner e a localização.
- Testes automatizados com simulações (*mocks*) não comprovam a entrega real de e-mails nem a segurança do banco em produção.

### 2.4 Restrições

Proteger credenciais e dados pessoais; usar consentimento e as regras de acesso do projeto; impedir o salvamento de campos inválidos; respeitar as limitações das fontes de informação alimentar.

## 3 Planejamento

Os testes combinam três níveis, com cenários positivos, negativos, limites de entrada, tratamento de erro e persistência. Um caso é aprovado quando o resultado real coincide com o esperado; impedimentos de ambiente são registrados como **Bloqueado**, sem assumir aprovação.

| Tipo | O que cobre |
| --- | --- |
| Unidade | Validadores de campos, regras de análise alimentar, filtros, preços, códigos de barras e componentes |
| Integração | Serviços de autenticação, sessão, persistência e mapas; ferramentas de verificação (TypeScript, ESLint, Jest, exportação Android) |
| Sistema | Fluxos completos de acesso, preferências, receitas, scanner e histórico, restaurantes, perfil e Premium; navegação e comportamento no Android |

### 3.1 Legenda

- **Passe:** o resultado real coincidiu com o esperado.
- **Falha:** o resultado real divergiu do esperado (registrada na seção 6).
- **Bloqueado:** o passo não pôde ser executado.
- **Prioridade:** Alta (funcionalidade central ou segurança), Média e Baixa.
- **Gravidade das falhas:** Crítica (impede o uso ou expõe dados), Alta (funcionalidade principal incorreta), Média (funciona com contorno) e Baixa (detalhe visual ou de texto).

## 4 Casos de uso

Ator principal: usuário do Allivia (no caso de uso 10, o responsável pela validação técnica). Pré-condições: aplicativo disponível, sessão e conectividade quando exigidas pelo recurso, dados fictícios e contas próprias de teste. Fluxo alternativo comum: entradas inválidas e indisponibilidade devem produzir bloqueio ou mensagem compreensível, sem operação indevida.

| Caso de uso | Fluxo básico |
| --- | --- |
| 1 – Acesso e cadastro | Login válido; login inválido; cadastro; confirmação de e-mail; código inválido; reenvio; recuperação; senhas divergentes; campos obrigatórios |
| 2 – Cadastro de preferências | Nome; alergias; alergias personalizadas; preferências alimentares; conclusão |
| 3 – Telas principais | Home; navegação; estados vazios; conectividade |
| 4 – Receitas e favoritos | Listagem; filtros; ingredientes; segurança alimentar; detalhes; favoritos |
| 5 – Scanner de alimentos | Código manual; câmera; permissão negada; produto encontrado; produto inexistente; análise; histórico; leitura repetida |
| 6 – Restaurantes | Listagem e busca; localização; mapa; detalhes e fotos; carregamento do mapa |
| 7 – Perfil e conta | Editar nome; alterar e-mail; alterar senha; foto; restrições; documentos; sair; excluir conta |
| 8 – Premium | Preços; fluxo de adesão; acesso por plano; plano no perfil |
| 9 – Segurança e Android | Isolamento de sessão; teclado e campos; área inferior do Android; texto ampliado |
| 10 – Verificações técnicas | TypeScript; ESLint; Jest; exportação Android |

## 5 Casos de teste e execução

Os resultados manuais (M01 a M09) foram executados e informados por Lavínia Manzan; não há capturas de tela disponibilizadas. As verificações técnicas (M10) foram executadas por agente automatizado sobre o commit `a2a930a` com alterações locais.

### 5.1 – Acesso e cadastro

| ID | Tela / funcionalidade | Tipo | Prioridade | Resultado esperado | Data | Resultado | Executado por |
| --- | --- | --- | --- | --- | --- | --- | --- |
| M01-01 | Login válido | Sistema | Alto | Acessar a Home com e-mail e senha corretos. | 21 a 31/10/2026 | ✅ Passe | Lavínia Manzan |
| M01-02 | Login inválido | Sistema | Alto | Bloquear senha incorreta e apresentar mensagem. | 21 a 31/10/2026 | ✅ Passe | Lavínia Manzan |
| M01-03 | Cadastro | Sistema | Alto | Solicitar consentimento e criar conta com e-mail e senha válidos. | 21 a 31/10/2026 | ✅ Passe | Lavínia Manzan |
| M01-04 | Confirmação de e-mail | Sistema | Alto | Confirmar cadastro com código de seis dígitos. | 21 a 31/10/2026 | ✅ Passe | Lavínia Manzan |
| M01-05 | Código inválido | Sistema | Alto | Bloquear código incorreto ou expirado. | 21 a 31/10/2026 | ✅ Passe | Lavínia Manzan |
| M01-06 | Reenvio | Sistema | Alto | Respeitar o intervalo de reenvio do código. | 21 a 31/10/2026 | ✅ Passe | Lavínia Manzan |
| M01-07 | Recuperação | Sistema | Alto | Verificar código de recuperação antes de salvar nova senha. | 21 a 31/10/2026 | ✅ Passe | Lavínia Manzan |
| M01-08 | Senhas divergentes | Sistema | Alto | Bloquear confirmação diferente da nova senha. | 21 a 31/10/2026 | ✅ Passe | Lavínia Manzan |
| M01-09 | Campos obrigatórios | Sistema | Alto | Impedir envio de campos vazios ou e-mail inválido. | 21 a 31/10/2026 | ✅ Passe | Lavínia Manzan |

### 5.2 – Cadastro de preferências

| ID | Tela / funcionalidade | Tipo | Prioridade | Resultado esperado | Data | Resultado | Executado por |
| --- | --- | --- | --- | --- | --- | --- | --- |
| M02-01 | Nome | Sistema | Alto | Aceitar letras acentuadas e bloquear números e símbolos indevidos. | 21 a 31/10/2026 | ✅ Passe | Lavínia Manzan |
| M02-02 | Alergias | Sistema | Alto | Selecionar e remover alergias do catálogo. | 21 a 31/10/2026 | ✅ Passe | Lavínia Manzan |
| M02-03 | Alergias personalizadas | Sistema | Alto | Validar tamanho, duplicidade e limite de cinco itens. | 21 a 31/10/2026 | ✅ Passe | Lavínia Manzan |
| M02-04 | Preferências alimentares | Sistema | Alto | Salvar escolhas e respeitar opções incompatíveis. | 21 a 31/10/2026 | ✅ Passe | Lavínia Manzan |
| M02-05 | Conclusão | Sistema | Alto | Concluir as etapas e preservar o perfil. | 21 a 31/10/2026 | ✅ Passe | Lavínia Manzan |

### 5.3 – Telas principais

| ID | Tela / funcionalidade | Tipo | Prioridade | Resultado esperado | Data | Resultado | Executado por |
| --- | --- | --- | --- | --- | --- | --- | --- |
| M03-01 | Home | Sistema | Alto | Exibir conteúdo e atalhos do aplicativo. | 21 a 31/10/2026 | ✅ Passe | Lavínia Manzan |
| M03-02 | Navegação | Sistema | Alto | Abrir Home, Receitas, Scanner, Restaurantes e Perfil. | 21 a 31/10/2026 | ✅ Passe | Lavínia Manzan |
| M03-03 | Estados vazios | Sistema | Alto | Apresentar orientação quando não houver dados. | 21 a 31/10/2026 | ✅ Passe | Lavínia Manzan |
| M03-04 | Conectividade | Sistema | Alto | Exibir mensagem compreensível em falhas de conexão. | 21 a 31/10/2026 | ✅ Passe | Lavínia Manzan |

### 5.4 – Receitas e favoritos

| ID | Tela / funcionalidade | Tipo | Prioridade | Resultado esperado | Data | Resultado | Executado por |
| --- | --- | --- | --- | --- | --- | --- | --- |
| M04-01 | Listagem | Sistema | Alto | Carregar receitas e paginação. | 21 a 31/10/2026 | ✅ Passe | Lavínia Manzan |
| M04-02 | Filtros | Sistema | Alto | Filtrar por refeição, tempo e dieta. | 21 a 31/10/2026 | ✅ Passe | Lavínia Manzan |
| M04-03 | Ingredientes | Sistema | Alto | Incluir e excluir ingredientes com limites e validação. | 21 a 31/10/2026 | ✅ Passe | Lavínia Manzan |
| M04-04 | Segurança alimentar | Sistema | Alto | Considerar alergias e preferências na apresentação das receitas. | 21 a 31/10/2026 | ✅ Passe | Lavínia Manzan |
| M04-05 | Detalhes | Sistema | Alto | Mostrar foto, ingredientes e preparo. | 21 a 31/10/2026 | ✅ Passe | Lavínia Manzan |
| M04-06 | Favoritos | Sistema | Alto | Salvar e remover receitas dos favoritos. | 21 a 31/10/2026 | ✅ Passe | Lavínia Manzan |

### 5.5 – Scanner de alimentos

| ID | Tela / funcionalidade | Tipo | Prioridade | Resultado esperado | Data | Resultado | Executado por |
| --- | --- | --- | --- | --- | --- | --- | --- |
| M05-01 | Código manual | Sistema | Alto | Aceitar somente dígitos e validar o código de barras. | 21 a 31/10/2026 | ✅ Passe | Lavínia Manzan |
| M05-02 | Câmera | Sistema | Alto | Ler código de barras de produto pela câmera. | 21 a 31/10/2026 | ✅ Passe | Lavínia Manzan |
| M05-03 | Permissão negada | Sistema | Alto | Permitir alternativa manual quando a câmera não estiver autorizada. | 21 a 31/10/2026 | ✅ Passe | Lavínia Manzan |
| M05-04 | Produto encontrado | Sistema | Alto | Mostrar dados consultados na Open Food Facts. | 21 a 31/10/2026 | ✅ Passe | Lavínia Manzan |
| M05-05 | Produto inexistente | Sistema | Alto | Exibir estado de produto não encontrado. | 21 a 31/10/2026 | ✅ Passe | Lavínia Manzan |
| M05-06 | Análise | Sistema | Alto | Informar alergênicos, traços e compatibilidade com o perfil. | 21 a 31/10/2026 | ✅ Passe | Lavínia Manzan |
| M05-07 | Histórico | Sistema | Alto | Exibir histórico com foto do produto. | 21 a 31/10/2026 | ✅ Passe | Lavínia Manzan |
| M05-08 | Leitura repetida | Sistema | Alto | Mover produto já escaneado ao topo sem duplicá-lo. | 21 a 31/10/2026 | ✅ Passe | Lavínia Manzan |

### 5.6 – Restaurantes

| ID | Tela / funcionalidade | Tipo | Prioridade | Resultado esperado | Data | Resultado | Executado por |
| --- | --- | --- | --- | --- | --- | --- | --- |
| M06-01 | Listagem e busca | Sistema | Alto | Buscar restaurantes com texto e limite de tamanho. | 21 a 31/10/2026 | ✅ Passe | Lavínia Manzan |
| M06-02 | Localização | Sistema | Alto | Escolher localização do aparelho ou pesquisar endereço. | 21 a 31/10/2026 | ✅ Passe | Lavínia Manzan |
| M06-03 | Mapa | Sistema | Alto | Exibir marcadores e atribuição do OpenStreetMap. | 21 a 31/10/2026 | ✅ Passe | Lavínia Manzan |
| M06-04 | Detalhes e fotos | Sistema | Alto | Mostrar primeira foto no card e carrossel na descrição. | 21 a 31/10/2026 | ✅ Passe | Lavínia Manzan |
| M06-05 | Carregamento do mapa | Sistema | Alto | Carregar o mapa sem travamento perceptível. | 21 a 31/10/2026 | ❌ Falha | Lavínia Manzan |

### 5.7 – Perfil e conta

| ID | Tela / funcionalidade | Tipo | Prioridade | Resultado esperado | Data | Resultado | Executado por |
| --- | --- | --- | --- | --- | --- | --- | --- |
| M07-01 | Editar nome | Sistema | Alto | Salvar nome válido e bloquear caracteres indevidos. | 21 a 31/10/2026 | ✅ Passe | Lavínia Manzan |
| M07-02 | Alterar e-mail | Sistema | Alto | Revalidar credenciais antes da alteração. | 21 a 31/10/2026 | ✅ Passe | Lavínia Manzan |
| M07-03 | Alterar senha | Sistema | Alto | Enviar código e salvar nova senha somente após verificação. | 21 a 31/10/2026 | ✅ Passe | Lavínia Manzan |
| M07-04 | Foto | Sistema | Alto | Selecionar e atualizar foto do perfil. | 21 a 31/10/2026 | ✅ Passe | Lavínia Manzan |
| M07-05 | Restrições | Sistema | Alto | Atualizar alergias e preferências. | 21 a 31/10/2026 | ✅ Passe | Lavínia Manzan |
| M07-06 | Documentos | Sistema | Alto | Abrir termos, privacidade e ajuda. | 21 a 31/10/2026 | ✅ Passe | Lavínia Manzan |
| M07-07 | Sair | Sistema | Alto | Encerrar sessão e voltar ao acesso. | 21 a 31/10/2026 | ✅ Passe | Lavínia Manzan |
| M07-08 | Excluir conta | Sistema | Alto | Exigir confirmação e excluir apenas a conta autenticada. | 21 a 31/10/2026 | ✅ Passe | Lavínia Manzan |

### 5.8 – Premium

| ID | Tela / funcionalidade | Tipo | Prioridade | Resultado esperado | Data | Resultado | Executado por |
| --- | --- | --- | --- | --- | --- | --- | --- |
| M08-01 | Preços | Sistema | Alto | Exibir R$14,90 mensal e R$149,90 anual, aproximadamente R$12,50/mês. | 21 a 31/10/2026 | ✅ Passe | Lavínia Manzan |
| M08-02 | Fluxo de adesão | Sistema | Alto | Percorrer o fluxo implementado sem afirmar cobrança real não integrada. | 21 a 31/10/2026 | ✅ Passe | Lavínia Manzan |
| M08-03 | Acesso por plano | Sistema | Alto | Respeitar as regras Free e Premium. | 21 a 31/10/2026 | ✅ Passe | Lavínia Manzan |
| M08-04 | Plano no perfil | Sistema | Alto | Exibir o estado da assinatura. | 21 a 31/10/2026 | ✅ Passe | Lavínia Manzan |

### 5.9 – Segurança e Android

| ID | Tela / funcionalidade | Tipo | Prioridade | Resultado esperado | Data | Resultado | Executado por |
| --- | --- | --- | --- | --- | --- | --- | --- |
| M09-01 | Isolamento de sessão | Sistema | Alto | Manter a prova de recuperação separada da sessão normal. | 21 a 31/10/2026 | ✅ Passe | Lavínia Manzan |
| M09-02 | Teclado e campos | Sistema | Alto | Validar colagem, limites e caracteres conforme cada entrada. | 21 a 31/10/2026 | ✅ Passe | Lavínia Manzan |
| M09-03 | Área inferior Android | Sistema | Alto | Manter controles acima da navegação do sistema. | 21 a 31/10/2026 | ✅ Passe | Lavínia Manzan |
| M09-04 | Texto ampliado | Sistema | Alto | Manter campos e controles utilizáveis em tamanhos de fonte ampliados. | 21 a 31/10/2026 | ✅ Passe | Lavínia Manzan |

### 5.10 – Verificações técnicas

| ID | Tela / funcionalidade | Tipo | Prioridade | Resultado esperado | Data | Resultado | Executado por |
| --- | --- | --- | --- | --- | --- | --- | --- |
| M10-01 | TypeScript | Integração | Alto | Executar npm run typecheck sem erros. | 24/11/2026 | ✅ Passe | Agente automatizado |
| M10-02 | ESLint | Integração | Alto | Executar npm run lint sem erros. | 24/11/2026 | ✅ Passe | Agente automatizado |
| M10-03 | Jest | Integração | Alto | Executar a suíte automatizada completa. | 24/11/2026 | ❌ Falha | Agente automatizado |
| M10-04 | Exportação Android | Integração | Alto | Gerar o pacote de exportação Android com Hermes. | 24/11/2026 | ✅ Passe | Agente automatizado |
## 6 Resultados por módulo

| Módulo | Planejados | Executados | Passe | Falha | Bloqueado |
| --- | --- | --- | --- | --- | --- |
| Acesso e cadastro | 9 | 9 | 9 | 0 | 0 |
| Cadastro de preferências | 5 | 5 | 5 | 0 | 0 |
| Telas principais | 4 | 4 | 4 | 0 | 0 |
| Receitas e favoritos | 6 | 6 | 6 | 0 | 0 |
| Scanner de alimentos | 8 | 8 | 8 | 0 | 0 |
| Restaurantes | 5 | 5 | 4 | 1 | 0 |
| Perfil e conta | 8 | 8 | 8 | 0 | 0 |
| Premium | 4 | 4 | 4 | 0 | 0 |
| Segurança e Android | 4 | 4 | 4 | 0 | 0 |
| Verificações técnicas | 4 | 4 | 3 | 1 | 0 |
| **Total** | **57** | **57** | **55** | **2** | **0** |

## 7 Falhas registradas

| ID | Caso | Descrição | Gravidade | Data | Encontrada por | Status |
| --- | --- | --- | --- | --- | --- | --- |
| F1 | M06-05 | Travamento transitório ao carregar o mapa; as demais funções de restaurantes passaram. Sem medição de duração. | Média | 21 a 31/10/2026 | Lavínia Manzan | Aberta; não corrigida nesta rodada; reteste não realizado |
| F2 | M10-03 | Jest: 405 testes passaram e 3 falharam (408 no total; 34 suítes aprovadas e 1 reprovada). Ausentes `confirm-signup.html`, `reset-password.html` e `magic-link.html` em `supabase/email-templates`. | Alta | 24/11/2026 | Agente automatizado | Aberta; não corrigida nesta rodada; reteste não realizado |

Os modelos de e-mail citados em F2 são gerados pelo comando `node scripts/gerar-emails.mjs` (ver [`codigo-fonte/supabase/README.md`](../codigo-fonte/supabase/README.md)). Nenhum reteste foi registrado após a rodada de 24/11/2026.

### 7.1 Reverificação técnica antes da publicação

Em 25/11/2026, antes da publicação deste repositório, as verificações técnicas foram executadas novamente sobre o código mais recente (commit `93383f0`), com dependências instaladas por `npm ci`. Essa rodada encontrou duas novas falhas, introduzidas pelo último commit e corrigidas antes da publicação:

| ID | Caso | Descrição | Gravidade | Correção | Reteste |
| --- | --- | --- | --- | --- | --- |
| F3 | M10-02 | ESLint apontou 2 erros de formatação (Prettier) em `src/components/ui/Chip.tsx` e `src/components/ui/TabBar.tsx` | Baixa | Arquivos formatados com o Prettier, sem alteração de comportamento | 25/11/2026 – Passe |
| F4 | M10-03 | Jest: 1 teste da tela de pagamento procurava o rodapé "Não digite dados de cartão reais", removido da tela; 410 de 411 testes passaram | Média | Teste ajustado para conferir o aviso "Ambiente de demonstração: a confirmação será simulada.", que continua na tela junto do aviso no topo | 25/11/2026 – Passe |

Resultado após as correções:

| Verificação | Resultado |
| --- | --- |
| `npm run typecheck` | Sem erros |
| `npm run lint` | Sem erros |
| `npm run format:check` | Todos os arquivos no padrão do Prettier |
| `npx jest --runInBand` | 35 suítes e 411 testes aprovados |
| `npx expo export --platform android` | Pacote Hermes gerado com sucesso |

A falha F2 permanece registrada como encontrada na rodada de 24/11/2026; a reverificação acima é informada como evidência complementar. A falha F1 (mapa) depende de teste manual em aparelho e não foi reavaliada.

## 8 Análise dos resultados

Os fluxos manuais foram informados como aprovados, exceto pelo travamento transitório no carregamento do mapa, para o qual não houve medição de tempo. Nas verificações técnicas, TypeScript e ESLint passaram sem erros e a exportação Android com Hermes foi gerada com sucesso; a suíte Jest apresentou 3 falhas por ausência dos modelos de e-mail. A aprovação do empacotamento Android não comprova a execução em aparelho físico.

## 9 Ambiente de testes

| Componente | Configuração |
| --- | --- |
| Aplicativo | Allivia; React Native, Expo e TypeScript; commit `a2a930a` com alterações locais |
| Computador | Windows; dependências do projeto instaladas; TypeScript, ESLint, Jest e Expo CLI |
| Dispositivo manual | Execução informada pela responsável; modelo, versão do Android e do Expo Go não informados |
| Back-end e fontes | Supabase Auth e banco; Open Food Facts; OpenStreetMap |
| Evidências | Resultados manuais sem capturas; saídas dos comandos e artefato de exportação na rodada técnica |

### 9.1 Dados de teste

E-mails válidos e inválidos; senhas curtas, fortes e divergentes; nomes acentuados e entradas numéricas; códigos de seis dígitos válidos e inválidos; códigos de barras com zeros iniciais; ingredientes e alergias duplicados ou acima do limite; endereços com números; estados Free e Premium. Foram usadas contas descartáveis e dados fictícios, sem publicar senhas, chaves ou códigos de e-mail.

### 9.2 Ferramentas

| Ferramenta | Uso |
| --- | --- |
| TypeScript | Análise de tipos com `tsc --noEmit` |
| ESLint | Análise estática de padrões e erros |
| Jest e Testing Library | Suíte automatizada de regras, serviços e telas, com simulações explícitas nos testes |
| Expo CLI e Hermes | Exportação do pacote Android |
| Planilha | Registro, rastreabilidade, falhas e consolidação automática |

As ferramentas já fazem parte do projeto e permitem verificações reproduzíveis sem custo adicional. A automação complementa o teste manual, mas não substitui a observação da câmera, da localização, do recebimento de e-mail e do comportamento em hardware real.

### 9.3 Como reproduzir as verificações técnicas

Na pasta `codigo-fonte/`, com as dependências instaladas:

```bash
npm run typecheck   # M10-01 – TypeScript
npm run lint        # M10-02 – ESLint
npm test            # M10-03 – Jest
npx expo export --platform android   # M10-04 – exportação Android (Hermes)
```

## 10 Referências

BRASIL. Lei nº 13.709, de 14 de agosto de 2018. Lei Geral de Proteção de Dados Pessoais (LGPD).

BRASIL. Lei nº 12.965, de 23 de abril de 2014. Marco Civil da Internet.

CASTRO, Nathane. **Qualidade e Teste de Software**: 3º MTEC. Taboão da Serra: Etec de Taboão da Serra. Material de aula.
