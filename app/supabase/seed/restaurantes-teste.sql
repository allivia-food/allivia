insert into public.restaurants
  (name, address, lat, lng, cuisine, allergen_friendly, rating, image, allergen_source)
values
  ('[TESTE] Cantinho Verde',       'Endereço fictício A — Taboão da Serra', -23.6205, -46.7905, 'vegetarian', '{gluten,milk,egg}',      4.8, null, 'Dados fictícios para teste'),
  ('[TESTE] Sabor Sem Glúten',      'Endereço fictício B — Taboão da Serra', -23.6320, -46.7850, 'healthy',    '{gluten,milk}',          4.6, null, 'Dados fictícios para teste'),
  ('[TESTE] Lanches da Praça',      'Endereço fictício C — Taboão da Serra', -23.6250, -46.7950, 'snacks',     '{gluten}',               4.1, null, 'Dados fictícios para teste'),
  ('[TESTE] Bistrô Livre',          'Endereço fictício D — Taboão da Serra', -23.6100, -46.7700, 'other',      '{milk,egg,peanut,soy}',  4.4, null, 'Dados fictícios para teste'),
  ('[TESTE] Açaí e Saladas',        'Endereço fictício E — Taboão da Serra', -23.6400, -46.8000, 'healthy',    '{gluten,milk,peanut,tree_nuts}', 4.9, null, 'Dados fictícios para teste'),
  ('[TESTE] Hambúrguer do Bairro',  'Endereço fictício F — Taboão da Serra', -23.6150, -46.8050, 'snacks',     '{}',                     3.9, null, 'Dados fictícios para teste'),
  ('[TESTE] Peixaria do Porto',     'Endereço fictício G — Taboão da Serra', -23.6050, -46.7800, 'other',      '{gluten,milk,egg}',      4.2, null, 'Dados fictícios para teste'),
  ('[TESTE] Restaurante Distante',  'Endereço fictício H — Santos',          -23.9608, -46.3336, 'healthy',    '{gluten,milk,egg,soy}',  4.7, null, 'Dados fictícios para teste (fora do raio de 15 km)');
