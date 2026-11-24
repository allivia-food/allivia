-- Allivia: remover somente os oito restaurantes fictícios do seed antigo.
-- Executar no SQL Editor do Supabase.
-- Favoritos ligados a esses restaurantes são removidos por ON DELETE CASCADE.
BEGIN;
DELETE FROM public.restaurants
WHERE name IN (
  '[TESTE] Cantinho Verde',
  '[TESTE] Sabor Sem Glúten',
  '[TESTE] Lanches da Praça',
  '[TESTE] Bistrô Livre',
  '[TESTE] Açaí e Saladas',
  '[TESTE] Hambúrguer do Bairro',
  '[TESTE] Peixaria do Porto',
  '[TESTE] Restaurante Distante'
)
AND allergen_source LIKE 'Dados fictícios para teste%'
RETURNING id, name;
COMMIT;

-- Conferência: deve retornar zero linhas.
SELECT id, name FROM public.restaurants
WHERE name IN (
  '[TESTE] Cantinho Verde',
  '[TESTE] Sabor Sem Glúten',
  '[TESTE] Lanches da Praça',
  '[TESTE] Bistrô Livre',
  '[TESTE] Açaí e Saladas',
  '[TESTE] Hambúrguer do Bairro',
  '[TESTE] Peixaria do Porto',
  '[TESTE] Restaurante Distante'
)
AND allergen_source LIKE 'Dados fictícios para teste%';
