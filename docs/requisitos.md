# Requisitos do Sistema – Allivia

**Instituição:** Etec de Taboão da Serra
**Curso:** Técnico em Desenvolvimento de Sistemas
**Integrantes:** Lavínia Manzan, Mirella Ferreira, Rihana Ferreira, Sophia Félix e Vicente da Silva
**Contato:** alliviafood@gmail.com

---

## 1 Introdução

Este documento descreve o que o aplicativo Allivia deve fazer (requisitos funcionais), com que qualidade deve fazê-lo (requisitos não funcionais) e quais regras de negócio orientam seu comportamento. Os requisitos aqui listados correspondem ao que está implementado no código-fonte deste repositório.

## 2 Visão geral do produto

### 2.1 Problema

Pessoas com alergias e restrições alimentares precisam conferir ingredientes o tempo todo: ao escolher uma receita, ao comprar um produto e ao comer fora de casa. Essas informações estão espalhadas em rótulos, sites e conversas com estabelecimentos.

### 2.2 Proposta

O Allivia centraliza o perfil alimentar do usuário e o utiliza para filtrar receitas, analisar produtos pelo código de barras e indicar restaurantes adequados. O objetivo é tornar a rotina alimentar mais tranquila e segura.

### 2.3 Público-alvo

Pessoas com alergias ou intolerâncias alimentares, como leite, ovo, amendoim, castanhas, glúten, soja, peixes e frutos do mar, além de outras informadas livremente pelo usuário, e pessoas com preferências alimentares (sem lactose, sem glúten, vegetariana e vegana).

### 2.4 Escopo

**Incluído:** cadastro e autenticação, perfil alimentar, receitas próprias com filtros e favoritos, scanner de código de barras com histórico, restaurantes com mapa e rota, gestão de perfil e conta, e plano Premium com pagamento simulado.

**Não incluído:** diagnóstico ou prescrição alimentar; garantia de ausência de contaminação cruzada; cobrança financeira real; leitura de rótulo por foto (OCR); login social; notificações; modo offline completo; publicação nas lojas de aplicativos.

## 3 Atores

| Ator | Descrição |
| --- | --- |
| Visitante | Pessoa sem sessão ativa; acessa apenas as telas de boas-vindas, login, cadastro e recuperação de senha |
| Usuário | Pessoa autenticada que concluiu o cadastro de preferências; acessa receitas, restaurantes e perfil |
| Usuário Premium | Usuário com assinatura (simulada) ativa; acessa também o scanner e o histórico de produtos |
| Equipe Allivia | Cadastra e revisa receitas e restaurantes diretamente no banco de dados (não há painel no aplicativo) |

## 4 Requisitos funcionais

### 4.1 Acesso e cadastro

| ID | Requisito | Prioridade |
| --- | --- | --- |
| RF01 | O sistema deve permitir o cadastro com e-mail, senha e confirmação de senha. | Alta |
| RF02 | O sistema deve exigir o aceite dos Termos de Uso e da Política de Privacidade, em caixas separadas e não pré-marcadas, e registrar as versões aceitas e a data. | Alta |
| RF03 | O sistema deve confirmar o e-mail do cadastro por meio de um código de 6 dígitos enviado ao endereço informado. | Alta |
| RF04 | O sistema deve permitir reenviar o código somente após o intervalo de 60 segundos. | Média |
| RF05 | O sistema deve permitir o login com e-mail e senha e exibir mensagem compreensível em caso de credenciais inválidas. | Alta |
| RF06 | O sistema deve permitir a recuperação de senha por código de 6 dígitos, validando o código antes de gravar a nova senha. | Alta |
| RF07 | O sistema deve manter a sessão do usuário ao fechar e reabrir o aplicativo. | Alta |

### 4.2 Cadastro de preferências (onboarding)

| ID | Requisito | Prioridade |
| --- | --- | --- |
| RF08 | O sistema deve solicitar o nome ou apelido do usuário (2 a 30 caracteres; letras, espaços, hífen e apóstrofo). | Alta |
| RF09 | O sistema deve permitir selecionar alergias do catálogo de 8 alergênicos: Leite, Ovo, Amendoim, Castanhas, Glúten, Soja, Peixes e Frutos do mar. | Alta |
| RF10 | O sistema deve permitir adicionar até 5 alergias personalizadas (2 a 40 caracteres, sem duplicidade). | Alta |
| RF11 | O sistema deve permitir escolher preferências alimentares: sem lactose, sem glúten, vegetariana, vegana ou nenhuma. | Média |
| RF12 | O sistema deve salvar o progresso de cada passo, permitindo retomar o cadastro de onde parou. | Média |
| RF13 | O sistema deve apresentar a tela de permissões (câmera e localização) ao final do cadastro de preferências. | Baixa |

### 4.3 Telas principais

| ID | Requisito | Prioridade |
| --- | --- | --- |
| RF14 | O sistema deve exibir uma tela inicial com atalhos para o scanner, restrições do perfil, receitas sugeridas, restaurantes e itens salvos. | Alta |
| RF15 | O sistema deve oferecer navegação por abas: Início, Receitas, Scanner, Restaurantes e Perfil. | Alta |
| RF16 | Toda tela que consulta dados deve tratar os estados de carregamento, vazio, erro com opção "Tentar novamente" e falta de conexão. | Alta |

### 4.4 Receitas e favoritos

| ID | Requisito | Prioridade |
| --- | --- | --- |
| RF17 | O sistema deve listar, em páginas de 10 itens, apenas receitas publicadas e compatíveis com as alergias do perfil. | Alta |
| RF18 | O sistema deve permitir filtrar receitas por tipo de refeição, tempo de preparo e dieta, com as preferências do perfil pré-selecionadas. | Alta |
| RF19 | O sistema deve permitir incluir e excluir até 5 ingredientes na busca (2 a 30 caracteres cada). | Média |
| RF20 | O sistema deve exibir a receita com foto, rendimento, tempo, ingredientes, modo de preparo, dica e aviso de segurança alimentar. | Alta |
| RF21 | O sistema deve permitir salvar e remover receitas dos favoritos e listá-las na tela de salvos. | Média |

### 4.5 Scanner de alimentos

| ID | Requisito | Prioridade |
| --- | --- | --- |
| RF22 | O sistema deve ler códigos de barras EAN-13, EAN-8, UPC-A e UPC-E pela câmera. | Alta |
| RF23 | O sistema deve permitir digitar o código manualmente (somente números, 8 a 14 dígitos), inclusive quando a câmera não estiver autorizada. | Alta |
| RF24 | O sistema deve consultar o produto na Open Food Facts e exibir nome, foto, fabricante, categoria e ingredientes. | Alta |
| RF25 | O sistema deve classificar o produto em "Contém restrições", "Atenção", "Sem alertas identificados" ou "Produto não encontrado", indicando os alergênicos e traços encontrados. | Alta |
| RF26 | O sistema deve manter o histórico de produtos escaneados, com foto, e mover para o topo um produto lido novamente, sem duplicá-lo. | Média |
| RF27 | O scanner deve estar disponível apenas para usuários Premium; usuários sem assinatura devem ver a apresentação do plano. | Alta |

### 4.6 Restaurantes

| ID | Requisito | Prioridade |
| --- | --- | --- |
| RF28 | O sistema deve permitir definir a localização pelo GPS do aparelho ou pela busca de um endereço. | Alta |
| RF29 | O sistema deve listar os restaurantes cadastrados em um raio de 15 km, ordenados pela distância e pela cobertura das alergias do perfil. | Alta |
| RF30 | O sistema deve permitir buscar restaurantes por texto e filtrar por categoria (Saudáveis, Vegetariano, Lanches e Outros). | Média |
| RF31 | O sistema deve exibir os restaurantes em um mapa OpenStreetMap, com marcadores e créditos do provedor. | Média |
| RF32 | O sistema deve exibir os detalhes do restaurante (fotos em carrossel, endereço, opções sem os alergênicos do usuário e aviso) e abrir a rota em um aplicativo de mapas. | Média |
| RF33 | O sistema deve permitir salvar e remover restaurantes dos favoritos. | Baixa |

### 4.7 Perfil e conta

| ID | Requisito | Prioridade |
| --- | --- | --- |
| RF34 | O sistema deve permitir editar nome e foto de perfil. | Média |
| RF35 | O sistema deve exigir a senha atual antes de alterar o e-mail ou a senha, e verificar a troca de senha com código enviado por e-mail. | Alta |
| RF36 | O sistema deve permitir editar alergias e preferências, perguntando se o usuário deseja descartar alterações não salvas. | Alta |
| RF37 | O sistema deve exibir os Termos de Uso, a Política de Privacidade e a tela de Ajuda e Suporte. | Média |
| RF38 | O sistema deve permitir sair da conta. | Alta |
| RF39 | O sistema deve permitir excluir a conta mediante confirmação e senha, apagando perfil, favoritos e histórico. | Alta |

### 4.8 Premium (simulado)

| ID | Requisito | Prioridade |
| --- | --- | --- |
| RF40 | O sistema deve apresentar os planos Mensal (R$ 14,90/mês) e Anual (R$ 149,90/ano, aprox. R$ 12,50/mês). | Média |
| RF41 | O sistema deve simular a assinatura com cartão de crédito, cartão de débito ou Pix, exibindo o aviso "Ambiente de demonstração". | Média |
| RF42 | O sistema deve exibir no perfil o estado da assinatura e liberar o scanner após a adesão. | Média |

## 5 Requisitos não funcionais

| ID | Categoria | Requisito |
| --- | --- | --- |
| RNF01 | Plataforma | O aplicativo deve funcionar em Android e iOS, desenvolvido com React Native e Expo. |
| RNF02 | Usabilidade | A interface deve ser em português do Brasil e seguir o protótipo do Figma. |
| RNF03 | Acessibilidade | Ícones tocáveis devem ter rótulo de acessibilidade, área de toque mínima de 44 × 44 pontos, contraste mínimo de 4,5:1 e suporte a fonte ampliada. |
| RNF04 | Android | Os controles devem permanecer acima da barra de navegação do sistema (três botões ou gestos) e visíveis com o teclado aberto. |
| RNF05 | Segurança | Cada usuário deve ler e gravar somente os próprios dados, garantido por regras de acesso por linha (RLS) no banco. |
| RNF06 | Segurança | Senhas devem ter no mínimo 8 caracteres, com letras e números, e ficar armazenadas somente no Supabase Auth. |
| RNF07 | Segurança | Chaves e credenciais não podem ser versionadas; o aplicativo usa somente a chave pública do Supabase. |
| RNF08 | Privacidade (LGPD) | Alergias são dados de saúde: o aplicativo coleta o mínimo necessário, pede consentimento explícito e permite apagar a conta. |
| RNF09 | Privacidade | A localização é usada apenas no aparelho para calcular distâncias e nunca é gravada no banco. |
| RNF10 | Privacidade | O scanner envia à fonte de produtos apenas o código de barras; nenhuma imagem da câmera é gravada. |
| RNF11 | Pagamento | Nenhum dado de cartão pode ser armazenado, registrado em log ou enviado; não há integração com gateway de pagamento. |
| RNF12 | Desempenho | Produtos consultados ficam em cache por 30 dias (24 horas quando não encontrados), reduzindo chamadas externas. |
| RNF13 | Manutenibilidade | O código deve ser escrito em TypeScript estrito, sem `any`, verificado por ESLint, Prettier e testes automatizados. |
| RNF14 | Confiabilidade | Mensagens de erro não devem exibir códigos técnicos ao usuário. |

## 6 Regras de negócio

| ID | Regra |
| --- | --- |
| RN01 | Em caso de dúvida, o resultado é "atenção", nunca "seguro". Dados incompletos, traços ("pode conter") e alergias personalizadas sempre geram "atenção". |
| RN02 | Toda análise de alergia exibe o aviso de que não substitui a leitura do rótulo nem a orientação de profissionais de saúde. |
| RN03 | Os rótulos de alergênicos vêm de um catálogo único com IDs fixos (`milk`, `egg`, `peanut`, `tree_nuts`, `gluten`, `soy`, `fish`, `shellfish`); nenhuma tela cria rótulos próprios ("Glúten", não "Trigo"). |
| RN04 | Uma receita só pode ser publicada depois que seus alergênicos forem revisados (`allergens_reviewed`). |
| RN05 | O banco recusa combinações incoerentes, como receita "sem glúten" com glúten ou "vegana" com leite, ovo, peixe ou frutos do mar. |
| RN06 | A busca de receitas exclui as que contêm alergênicos do perfil, sinônimos desses alergênicos nos ingredientes ou termos das alergias personalizadas. |
| RN07 | Um restaurante só é apresentado como adequado quando cobre todas as alergias do perfil; caso contrário, o aplicativo mostra os mais próximos com aviso de aproximação. |
| RN08 | Informações de restaurantes são cadastradas pela equipe com a fonte registrada e devem ser confirmadas pelo usuário com o estabelecimento. |
| RN09 | O pagamento é fictício: o aplicativo exibe "Ambiente de demonstração" e não realiza cobrança. |
| RN10 | Receitas incompatíveis com o perfil ficam ocultas também em favoritos e links diretos, sem serem apagadas. |

## 7 Rastreabilidade com os testes

Os requisitos funcionais estão cobertos pelos casos de teste descritos em [testes.md](testes.md):

| Módulo de teste | Requisitos |
| --- | --- |
| M01 – Acesso e cadastro | RF01 a RF07 |
| M02 – Cadastro de preferências | RF08 a RF13 |
| M03 – Telas principais | RF14 a RF16 |
| M04 – Receitas e favoritos | RF17 a RF21 |
| M05 – Scanner de alimentos | RF22 a RF27 |
| M06 – Restaurantes | RF28 a RF33 |
| M07 – Perfil e conta | RF34 a RF39 |
| M08 – Premium | RF40 a RF42 |
| M09 – Segurança e Android | RNF04 a RNF07 |
| M10 – Verificações técnicas | RNF13 |
