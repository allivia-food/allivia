insert into public.recipes
  (title, description, meal_types, ready_in_minutes, servings, ingredients, steps,
   allergens, diets, calories_kcal, protein_g, carbs_g, fat_g, tip,
   allergens_reviewed, published, featured)
values
  ('[TESTE] Salada de grão-de-bico', 'Rápida e leve.', '{lunch,dinner}', 15, 2,
   '{"1 lata de grão-de-bico cozido","1 tomate picado","1/2 cebola roxa","azeite e limão a gosto"}',
   '{"Escorra o grão-de-bico.","Misture com o tomate e a cebola.","Tempere com azeite e limão."}',
   '{}', '{vegan,vegetarian,lactose_free,gluten_free}', 280, 12, 35, 9, null,
   true, true, true),

  ('[TESTE] Panqueca de banana', 'Com aveia.', '{breakfast,snack}', 10, 1,
   '{"1 banana madura","1 ovo","2 colheres de sopa de aveia"}',
   '{"Amasse a banana.","Misture o ovo e a aveia.","Doure em frigideira antiaderente."}',
   '{egg,gluten}', '{vegetarian,lactose_free}', 250, 9, 38, 6, null,
   true, true, false),

  ('[TESTE] Frango grelhado com legumes', null, '{lunch}', 30, 2,
   '{"400 g de peito de frango","1 cenoura em cubos","1 abobrinha em cubos","sal e azeite"}',
   '{"Tempere o frango.","Grelhe por 8 minutos de cada lado.","Refogue os legumes e sirva."}',
   '{}', '{lactose_free,gluten_free}', 320, 38, 12, 11, null,
   true, true, false),

  ('[TESTE] Macarrão ao molho de tomate', null, '{dinner}', 25, 4,
   '{"400 g de macarrão de trigo","2 xícaras de molho de tomate","manjericão"}',
   '{"Cozinhe o macarrão.","Aqueça o molho.","Misture e sirva com manjericão."}',
   '{gluten}', '{vegan,vegetarian,lactose_free}', 410, 13, 80, 3, null,
   true, true, false),

  ('[TESTE] Arroz com manteiga', 'Caso de teste: manteiga sem marcar leite.', '{lunch,dinner}', 20, 2,
   '{"1 xícara de arroz","1 colher de sopa de manteiga","sal"}',
   '{"Refogue o arroz na manteiga.","Cozinhe com água e sal."}',
   '{}', '{gluten_free}', 300, 5, 55, 6, null,
   true, true, false),

  ('[TESTE] Iogurte com frutas', null, '{breakfast,dessert}', 5, 1,
   '{"1 pote de iogurte natural","1/2 xícara de frutas picadas","1 colher de mel"}',
   '{"Coloque o iogurte numa tigela.","Cubra com as frutas e o mel."}',
   '{milk}', '{vegetarian,gluten_free}', 210, 8, 30, 6, null,
   true, true, false),

  ('[TESTE] Peixe assado com batatas', null, '{dinner}', 45, 3,
   '{"500 g de filé de tilápia","3 batatas em rodelas","limão, alho e azeite"}',
   '{"Tempere o peixe.","Monte com as batatas numa assadeira.","Asse por 35 minutos."}',
   '{fish}', '{lactose_free,gluten_free}', 350, 32, 30, 10, null,
   true, true, false),

  ('[TESTE] Bolo de cenoura', null, '{dessert,snack}', 60, 8,
   '{"3 cenouras","3 ovos","2 xícaras de farinha de trigo","1 xícara de açúcar","1/2 xícara de óleo"}',
   '{"Bata cenoura, ovos e óleo.","Misture farinha e açúcar.","Asse por 40 minutos."}',
   '{egg,gluten}', '{vegetarian,lactose_free}', 290, 5, 45, 11, null,
   true, true, false),

  ('[TESTE] Pasta de amendoim com maçã', null, '{snack}', 5, 1,
   '{"1 maçã em fatias","2 colheres de pasta de amendoim"}',
   '{"Corte a maçã.","Sirva com a pasta de amendoim."}',
   '{peanut}', '{vegan,vegetarian,lactose_free,gluten_free}', 260, 7, 25, 16, null,
   true, true, false),

  ('[TESTE] Sopa de legumes', null, '{lunch,dinner}', 30, 4,
   '{"2 batatas","1 cenoura","1 chuchu","cheiro-verde","sal"}',
   '{"Corte os legumes.","Cozinhe por 25 minutos.","Finalize com cheiro-verde."}',
   '{}', '{vegan,vegetarian,lactose_free,gluten_free}', 150, 4, 30, 1, null,
   true, true, false);
