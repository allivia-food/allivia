# Supabase

## Estrutura

- `schema.sql`: estrutura inicial, funções e políticas de acesso. Use somente em banco novo.
- `migrations/`: alterações incrementais. Preserve os arquivos já aplicados para manter o histórico dos ambientes existentes.
- `seed/conteudo-pdf.json`: fonte do catálogo atual, com 35 receitas e sete restaurantes.
- `seed/receitas-iniciais.sql` e `seed/receitas-complementares.sql`: dados históricos; não importar junto do catálogo atual.
- `seed/restaurantes-teste.sql`: limpeza dos restaurantes antigos, utilizada pelo gerador do catálogo.

## Instalação e atualização

Os arquivos atuais são destinados à execução manual no SQL Editor. O diretório não contém configuração local da CLI; não execute `supabase db push` como substituto dessa sequência.

Em banco novo, execute `schema.sql`, o pacote completo `migrations/005_conteudo_pdf.sql` e depois `migrations/007_profile_avatars.sql` e `migrations/009_remove_frango_com_legumes.sql`. O pacote 005 já inclui a 006, a limpeza de restaurantes de teste e a 008.

Em banco existente, confira o que já foi aplicado e execute somente o que falta. Não repita `schema.sql` ou a migração 004: eles não são uma rotina de atualização idempotente. Faça backup antes de executar SQL que modifica dados. As migrações 008 e 009 excluem receitas e seus favoritos associados.

Para atualizar o catálogo, edite `seed/conteudo-pdf.json` e execute, na raiz do app:

```powershell
npm.cmd run gerar:conteudo
npm.cmd run verificar:conteudo
```

O arquivo 005 é uma saída gerada. Trechos de SQL repetidos nele e nas migrações de origem são necessários para o pacote completo; edite as fontes e regenere. Não apague migrações para eliminar essa repetição. A importação preserva IDs e favoritos e interrompe a transação quando encontra nomes ambíguos.

## Autenticação e e-mails

Configure `EXPO_PUBLIC_SUPABASE_URL` e `EXPO_PUBLIC_SUPABASE_ANON_KEY` no aplicativo e nos ambientes EAS utilizados. Use somente a chave pública; a chave administrativa não pertence ao aplicativo.

Execute `node scripts/gerar-emails.mjs` para gerar os três modelos em `supabase/email-templates/`. No painel de Auth do Supabase, configure os modelos correspondentes de confirmação de cadastro, recuperação de senha e magic link. Preserve `{{ .Token }}`: os fluxos do aplicativo usam código digitado pelo usuário. Para gerar os modelos em outro diretório, passe o caminho como primeiro argumento.

## Build Android

O aplicativo acessa o Supabase remotamente; os arquivos SQL e scripts administrativos não precisam integrar o pacote enviado ao EAS. O `.easignore` exclui esses arquivos, testes, caches e credenciais locais. As configurações de build e os recursos do aplicativo continuam no pacote.

Tipos, lint e testes locais não verificam as políticas nem executam migrações no banco remoto. Valide cadastro, confirmação do e-mail, recuperação de senha, perfil, fotos e favoritos no ambiente de destino antes da distribuição.
