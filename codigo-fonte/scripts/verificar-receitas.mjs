import { createClient } from '@supabase/supabase-js';

import { loadEnv } from './_env.mjs';

const env = loadEnv();
const url = env.EXPO_PUBLIC_SUPABASE_URL;
const anonKey = env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
if (!url || !anonKey) {
  console.error('Preencha EXPO_PUBLIC_SUPABASE_URL e EXPO_PUBLIC_SUPABASE_ANON_KEY em app/.env');
  process.exit(1);
}

const results = [];
function record(check, expected, got, ok) {
  results.push({ check, expected, got, ok });
  console.log(`${ok ? 'OK  ' : 'FALHA'} | ${check} | esperado: ${expected} | obtido: ${got}`);
}
const describe = (error, data) =>
  error ? `erro ${error.code ?? '-'} (${error.message})` : `${data?.length ?? 0} linha(s)`;

const anon = createClient(url, anonKey, { auth: { persistSession: false } });

{
  const { data, error } = await anon.from('recipes').select('id').limit(1);
  record(
    'anon: tabela recipes existe e leitura anônima é negada',
    '0 linhas (RLS) ou erro 42501, nunca PGRST205',
    describe(error, data),
    error ? error.code === '42501' : data.length === 0,
  );
}
{
  const { data, error } = await anon.rpc('search_recipes', {});
  record(
    'anon: função search_recipes existe e execução anônima é negada',
    'erro 42501 (permissão negada), não PGRST202',
    describe(error, data),
    error?.code === '42501',
  );
}
{
  const { data, error } = await anon.from('recipes_cache').select('*').limit(1);
  record(
    'anon: tabela recipes_cache foi removida',
    'erro PGRST205 (tabela não encontrada)',
    describe(error, data),
    error?.code === 'PGRST205',
  );
}

const email = process.env.TEST_EMAIL;
const password = process.env.TEST_PASSWORD;
if (email && password) {
  const user = createClient(url, anonKey, { auth: { persistSession: false } });
  const { error: loginError } = await user.auth.signInWithPassword({ email, password });
  record(
    'login do usuário de teste',
    'sem erro',
    loginError ? loginError.message : 'ok',
    !loginError,
  );
  if (!loginError) {
    const table = await user.from('recipes').select('id, title, published').limit(5);
    record(
      'logado: select em recipes responde (só publicadas)',
      'sem erro; toda linha com published = true',
      describe(table.error, table.data),
      !table.error && (table.data ?? []).every((r) => r.published),
    );
    const search = await user.rpc('search_recipes', { p_limit: 5 });
    record(
      'logado: search_recipes responde',
      'sem erro (0 linhas é válido enquanto não houver receitas publicadas)',
      describe(search.error, search.data),
      !search.error,
    );
    await user.auth.signOut();
  }
} else {
  console.log(
    '\n(Checagens logadas puladas: defina TEST_EMAIL e TEST_PASSWORD na linha de comando.)',
  );
}

const failed = results.filter((r) => !r.ok).length;
console.log(`\n${results.length - failed}/${results.length} checagens OK`);
process.exit(failed ? 1 : 0);
