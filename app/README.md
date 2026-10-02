# Allivia — app

App mobile (Expo + TypeScript + Expo Router) do projeto Allivia — Etec de Taboão da Serra.

## Como rodar

1. Instale as dependências: `npm install`
2. Copie `.env.example` para `.env` e preencha as variáveis:

   | Variável                        | Obrigatória | O que é                                                                                                                                                                                      |
   | ------------------------------- | ----------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
   | `EXPO_PUBLIC_SUPABASE_URL`      | sim         | URL do projeto no Supabase (Project Settings → API)                                                                                                                                          |
   | `EXPO_PUBLIC_SUPABASE_ANON_KEY` | sim         | Chave pública do Supabase (anon/publishable). Nunca use a chave `service_role`                                                                                                               |
   | `EXPO_PUBLIC_GOOGLE_MAPS_KEY`   | não         | Chave do Google Maps para o mapa de restaurantes. Só é necessária em builds de desenvolvimento ou de produção; no Expo Go o mapa funciona sem ela. Restrinja a chave ao pacote/bundle do app |

   Variáveis `EXPO_PUBLIC_*` ficam visíveis no app final: use só chaves públicas e com restrição de uso. O `.env` nunca vai para o Git.

3. Inicie: `npx expo start` e abra no Expo Go (leia o QR code) ou num emulador.

## Scripts

| Comando                              | O que faz                                                                             |
| ------------------------------------ | ------------------------------------------------------------------------------------- |
| `npm run lint`                       | ESLint (eslint-config-expo + Prettier)                                                |
| `npm run typecheck`                  | Verificação de tipos (TypeScript estrito)                                             |
| `npm test`                           | Testes (Jest + React Native Testing Library)                                          |
| `npm run format`                     | Formata o código com Prettier                                                         |
| `npm run verificar:receitas`         | Confere, só com leitura, se a tabela de receitas e a busca estão no banco             |
| `node scripts/seed-restaurantes.mjs` | Valida `supabase/seed/restaurantes.seed.json` e gera `supabase/seed/restaurantes.sql` |

## Banco de dados

`supabase/schema.sql` cria todas as tabelas, regras de acesso (RLS), funções e dados iniciais do catálogo de alergênicos, já com as mudanças das migrações.

Os arquivos SQL são executados no SQL Editor do Supabase:

- **Banco novo:** rode `supabase/schema.sql` e depois os seeds de `supabase/seed/`. As migrações não são necessárias, porque o `schema.sql` já as inclui.
- **Banco existente:** aplique só as migrações de `supabase/migrations/` que ainda faltam, em ordem numérica. Nunca rode o `schema.sql` de novo.
- **Seeds:** `receitas-iniciais.sql` e `receitas-complementares.sql` trazem as receitas do app (entram sem publicar, até a conferência dos alergênicos). Os restaurantes reais vêm de `restaurantes.seed.json` (gerar o SQL com o script acima). Rode cada seed uma vez só.
- **Dados de teste:** `receitas-teste.sql` e `restaurantes-teste.sql` são fictícios e marcados com `[TESTE]`. Apague-os antes da apresentação:

  ```sql
  delete from public.recipes where title like '[TESTE]%';
  delete from public.restaurants where name like '[TESTE]%';
  ```
