# Allivia — app

App mobile (Expo + TypeScript + Expo Router) do projeto Allivia — Etec de Taboão da Serra.

## Como rodar

1. Instale as dependências: `npm install`
2. Copie `.env.example` para `.env` e preencha as variáveis:

   | Variável                        | Obrigatória | O que é                                                                        |
   | ------------------------------- | ----------- | ------------------------------------------------------------------------------ |
   | `EXPO_PUBLIC_SUPABASE_URL`      | sim         | URL do projeto no Supabase (Project Settings → API)                            |
   | `EXPO_PUBLIC_SUPABASE_ANON_KEY` | sim         | Chave pública do Supabase (anon/publishable). Nunca use a chave `service_role` |

   Variáveis `EXPO_PUBLIC_*` ficam visíveis no app final: use só chaves públicas e com restrição de uso. O `.env` nunca vai para o Git.

3. Inicie: `npx expo start` e abra no Expo Go (leia o QR code) ou num emulador.

## Scripts

| Comando                      | O que faz                                                                 |
| ---------------------------- | ------------------------------------------------------------------------- |
| `npm run lint`               | ESLint em código, testes, scripts e configurações                         |
| `npm run typecheck`          | Verificação de tipos (TypeScript estrito)                                 |
| `npm test`                   | Testes (Jest + React Native Testing Library)                              |
| `npm run format`             | Formata o código com Prettier                                             |
| `npm run verificar:receitas` | Confere, só com leitura, se a tabela de receitas e a busca estão no banco |
| `npm run gerar:conteudo`     | Gera a importação a partir de supabase/seed/conteudo-pdf.json             |
| `npm run verificar:conteudo` | Confere se o SQL gerado corresponde ao catálogo                           |

## Autenticação por código de e-mail

O aplicativo usa Supabase Auth para cadastro, confirmação do e-mail, recuperação de senha e verificação de identidade antes de alterar a senha no perfil. Configure o projeto seguindo o [manual de autenticação](docs/supabase-auth.txt). Os [modelos de e-mail](supabase/email-templates/) e a [galeria de prévia](supabase/email-templates/preview.html) usam a paleta do Allivia. Para regerar: `node scripts/gerar-emails.mjs`.

## Banco de dados

O pacote atual está em [supabase/migrations/005_conteudo_pdf.sql](supabase/migrations/005_conteudo_pdf.sql), pronto para o SQL Editor. Inclui 35 receitas publicadas, sete restaurantes do PDF, a migração 006 e a exclusão dos oito restaurantes fictícios antigos. Esta é a única saída de `npm run gerar:conteudo`.

- Banco novo: execute primeiro supabase/schema.sql e depois o pacote 005 completo. A migração 007 adiciona o armazenamento de avatares e deve ser aplicada quando ausente.
- Banco existente com a estrutura atual do Allivia: execute somente o pacote 005 e a migração 007 quando ausente. Não execute novamente o schema nem migrações antigas já aplicadas; a 004 recria uma tabela de favoritos.
- Execute o SQL antes de abrir o app atualizado, que consulta os novos campos.
- Para regerar, edite supabase/seed/conteudo-pdf.json e execute npm run gerar:conteudo. Edições editoriais feitas somente no banco podem ser sobrescritas.
- Reexecutar atualiza os campos editoriais importados sem trocar os IDs ou favoritos. Se houver nomes duplicados no banco, a transação para com diagnóstico.
- Os seeds receitas-iniciais.sql e receitas-complementares.sql contêm receitas históricas únicas e foram preservados; não os execute junto do catálogo atual. Os dados antigos diferentes são preservados. restaurantes-teste.sql é uma dependência do gerador e apenas exclui os oito testes antigos e seus favoritos.

Antes de importar, mantenha um backup do banco. Execute o pacote inteiro e confira os resultados finais: 35 receitas do catálogo publicadas, zero rascunhos e sete restaurantes. Filtros do perfil podem reduzir o total exibido no app. Em caso de duplicação ambígua, resolva o conflito antes de reexecutar, preservando IDs e favoritos.

Restaurantes sem coordenadas aparecem na lista e nos favoritos, com rota pelo endereço textual. Preferências representam opções informadas no PDF; confirme ingredientes e contaminação cruzada com o estabelecimento.

O catálogo atual publica o bolo de fubá com 200 ml de óleo. A estimativa calórica permanece ausente; a validação técnica não substitui a revisão culinária.

O endereço de Pandan foi conferido em https://pandan.deliveryvip.app/about; os demais contatos mantêm a origem do PDF. Confirme contatos e funcionamento, inclusive o número do endereço de Cajuveg, antes de atualizar o catálogo. Preencha latitude e longitude em par, após confirmar a entrada do estabelecimento.

## Expo Go no Windows

O projeto usa o Expo SDK 58. Atualize o Expo Go no celular para uma versão compatível.

No PowerShell, execute `npm.cmd install` e depois `npm.cmd start -- --clear`. O sufixo `.cmd` evita o bloqueio de scripts `npm.ps1` sem alterar a política do Windows.

Mantenha computador e celular na mesma rede Wi-Fi e leia o QR code no terminal (no iPhone, use a Câmera). Se a rede bloquear a conexão local, use `npm.cmd start -- --tunnel`.

Configure as variáveis públicas do Supabase em `.env` para login e acesso aos dados. Use `.env.example` como referência.

## Build Android

Os perfis em `eas.json` geram APK instalável (`preview`) e AAB para Google Play (`production`). O identificador inicial é `com.allivia.app`; configure `ANDROID_APP_ID` se já houver outro identificador publicado. A versão Android de produção é incrementada no EAS.

Configure `EXPO_PUBLIC_SUPABASE_URL` e `EXPO_PUBLIC_SUPABASE_ANON_KEY` nos ambientes `preview` e `production` do projeto Expo. O `.env` local não é enviado pelo Git. O mapa usa OpenStreetMap com Leaflet e não precisa de chave do Google, cadastro de faturamento ou SHA-1 para autorizar o mapa.

Depois de configurar as variáveis e conectar a conta/projeto Expo:

```powershell
npx.cmd eas-cli@latest login
npx.cmd eas-cli@latest build --platform android --profile preview
# Para gerar o AAB de publicação:
npx.cmd eas-cli@latest build --platform android --profile production
```

As builds usam assinatura Android gerenciada pelo EAS. Gerar a build não publica o aplicativo. Consulte a [documentação de APKs do Expo](https://docs.expo.dev/build-reference/apk/).

O Leaflet 1.9.4 está incluído em `assets/maps/leaflet.json`, com licença no mesmo diretório. Para regerar esses arquivos após instalar dependências, execute `node scripts/prepare-map-assets.mjs`. Android e iOS usam `react-native-webview`; a versão web usa um iframe. É preciso uma nova build nativa após a troca de biblioteca; atualizar apenas o JavaScript de um APK antigo não instala o WebView.

As imagens do mapa vêm de `tile.openstreetmap.org`, com cache HTTP padrão, identificação do aplicativo e créditos visíveis. Não há download antecipado nem mapas offline. O serviço público tem capacidade limitada e não oferece garantia de disponibilidade; para grande volume, escolha outro servidor compatível com OSM ou hospedagem própria, conforme a [política de uso](https://operations.osmfoundation.org/policies/tiles/). Consultar o mapa transmite ao provedor a região visualizada. Localização e busca de endereços continuam usando os serviços do aparelho. O botão de rotas abre o aplicativo/site de mapas por um link gratuito, sem API paga.

Antes da distribuição, confira o APK em um Android com navegação por três botões e com gestos; telas de 320–360 dp de largura; fonte padrão e ampliada; e teclado aberto em login, cadastro, edição do perfil, busca de endereço, filtros e código de barras. Confira os botões finais dos modais, acesso a câmera, localização, mapa e fotos. Exportar o JavaScript não substitui compilar e testar o APK em aparelho ou emulador.

## Validação antes de entregar

- `npm run check`: verifica tipos, lint e executa todos os testes em sequência.
- `npm run format:check`: confere a formatação sem alterar arquivos.
- `npx expo export --platform web`: gera a versão web em `dist/`.

Os testes com React Query compartilham `test-utils/renderWithClient.tsx`, que desativa tentativas automáticas e limpa os clientes ao final de cada teste.

## Fotos e bloqueio de receitas

A migração 006, já incluída no pacote 005, protege a leitura das receitas por alergias também em favoritos e links diretos. Quem já importou o catálogo pode aplicar somente a 006 quando ausente. O cache do app é separado por conta e perfil alimentar. Favoritos incompatíveis ficam ocultos, sem exclusão automática.

As 35 fotos disponíveis estão integradas ao app; as 13 receitas sem arquivo mantêm o ícone padrão. Veja [assets/recipe-photos/README.md](assets/recipe-photos/README.md). Os comandos são npm run fotos:verificar (local) e npm run fotos:enviar (upload administrativo opcional). A importação preserva imagens já cadastradas.

## Pendências e validação no aparelho

Recuperação de senha ainda precisa do retorno autenticado e da tela de nova senha. Premium usa assinatura simulada. A validação local não comprova migrações, permissões ou integração no Supabase remoto.

No aparelho, confira login, onboarding e persistência da sessão; busca, filtros, fotos, favoritos e bloqueio de receitas também por link direto; restaurantes e rotas com localização aceita e negada; scanner com câmera aceita e negada, código desconhecido e entrada manual; perfil, teclado, rolagem, textos grandes e reconexão de rede. Não use dados reais de cartão na demonstração.

Compatibilidade online do Expo e exportação nativa ainda precisam de conferência; uma execução anterior de hermesc.exe falhou por permissão no ambiente Windows. Registre problemas com passos e resultado esperado/obtido, sem credenciais.
