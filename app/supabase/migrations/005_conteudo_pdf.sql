-- ALLIVIA: conteúdo do PDF, incremental e repetível.
-- Banco existente: execute este arquivo inteiro no SQL Editor.
-- Banco novo: execute primeiro app/supabase/schema.sql. Não rode os seeds antigos.
-- Preserve um backup antes de atualizar conteúdo editorial já existente.
BEGIN;
DO $$ BEGIN
  IF to_regclass('public.recipes') IS NULL OR to_regclass('public.restaurants') IS NULL OR to_regclass('public.profiles') IS NULL THEN
    RAISE EXCEPTION 'Estrutura Allivia ausente. Execute schema.sql apenas em banco novo.';
  END IF;
END $$;
ALTER TABLE public.recipes
  ADD COLUMN IF NOT EXISTS import_pending text,
  ADD COLUMN IF NOT EXISTS source_reference text,
  ADD COLUMN IF NOT EXISTS yield_label text,
  ADD COLUMN IF NOT EXISTS calorie_basis text,
  ADD COLUMN IF NOT EXISTS difficulty text,
  ADD COLUMN IF NOT EXISTS source_key text;
CREATE UNIQUE INDEX IF NOT EXISTS recipes_source_key_idx ON public.recipes(source_key);
ALTER TABLE public.restaurants
  ADD COLUMN IF NOT EXISTS description text,
  ADD COLUMN IF NOT EXISTS phone text,
  ADD COLUMN IF NOT EXISTS diets text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS source_key text;
CREATE UNIQUE INDEX IF NOT EXISTS restaurants_source_key_idx ON public.restaurants(source_key);
ALTER TABLE public.restaurants ALTER COLUMN lat DROP NOT NULL, ALTER COLUMN lng DROP NOT NULL;
ALTER TABLE public.restaurants DROP CONSTRAINT IF EXISTS restaurants_coordinate_pair_check;
ALTER TABLE public.restaurants ADD CONSTRAINT restaurants_coordinate_pair_check CHECK ((lat IS NULL) = (lng IS NULL));
ALTER TABLE public.restaurants DROP CONSTRAINT IF EXISTS restaurants_diets_check;
ALTER TABLE public.restaurants ADD CONSTRAINT restaurants_diets_check CHECK (diets <@ ARRAY['lactose_free','gluten_free','vegetarian','vegan']::text[]);
DO $$ BEGIN
    IF (SELECT count(*) FROM public.recipes WHERE lower(extensions.unaccent(title)) = lower(extensions.unaccent('Panqueca de banana e aveia'))) > 1 THEN
      RAISE EXCEPTION 'Mais de um registro corresponde a %; resolva a duplicação antes de importar', 'Panqueca de banana e aveia';
    END IF;
    UPDATE public.recipes SET source_key = 'pdf:recipe:3' WHERE source_key IS NULL AND lower(extensions.unaccent(title)) = lower(extensions.unaccent('Panqueca de banana e aveia'));
  END $$;
INSERT INTO public.recipes(id,source_key,title,meal_types,ready_in_minutes,servings,ingredients,steps,allergens,diets,calories_kcal,tip,import_pending,allergens_reviewed,published,source_reference,yield_label,calorie_basis,difficulty) VALUES ('517ae19f-e094-4d09-a3cf-37deb1025755','pdf:recipe:3','Panqueca de banana e aveia',ARRAY['breakfast']::text[],15,2,ARRAY['1 banana madura','1 ovo','4 colheres de sopa de aveia em flocos','1 colher de chá de canela em pó','1 colher de chá de óleo para untar a frigideira']::text[],ARRAY['Amasse a banana em um recipiente.','Acrescente o ovo, a aveia e a canela, misturando até formar uma massa  homogênea.','Aqueça uma frigideira antiaderente e unte levemente.','Coloque pequenas porções da massa e cozinhe em fogo baixo.','Vire as panquecas quando a parte inferior estiver firme e doure o outro  lado.']::text[],ARRAY['egg','gluten']::text[],ARRAY['vegetarian','lactose_free']::text[],180,'Rendimento: 2 porções.
Tempo de preparo: 15 minutos
Receitas Nestlé  receitas sem lactose.
Observação:  Contém ovo e aveia. Para pessoas com doença celíaca, utilize
aveia certificada sem glúten e verifique o risco de contaminação cruzada. Não
é adequada para quem tem alergia a ovo.',null,true,true,'Receitas Nestlé receitas sem lactose. — Conteúdo_Allivia.pdf, página 3','2 porções','por porção','Fácil') ON CONFLICT(source_key) DO UPDATE SET title=excluded.title,meal_types=excluded.meal_types,ready_in_minutes=excluded.ready_in_minutes,servings=excluded.servings,ingredients=excluded.ingredients,steps=excluded.steps,allergens=excluded.allergens,diets=excluded.diets,calories_kcal=excluded.calories_kcal,tip=excluded.tip,import_pending=excluded.import_pending,allergens_reviewed=excluded.allergens_reviewed,published=excluded.published,source_reference=excluded.source_reference,yield_label=excluded.yield_label,calorie_basis=excluded.calorie_basis,difficulty=excluded.difficulty;
DO $$ BEGIN
    IF (SELECT count(*) FROM public.recipes WHERE lower(extensions.unaccent(title)) = lower(extensions.unaccent('Cuscuz de milho com legumes'))) > 1 THEN
      RAISE EXCEPTION 'Mais de um registro corresponde a %; resolva a duplicação antes de importar', 'Cuscuz de milho com legumes';
    END IF;
    UPDATE public.recipes SET source_key = 'pdf:recipe:4' WHERE source_key IS NULL AND lower(extensions.unaccent(title)) = lower(extensions.unaccent('Cuscuz de milho com legumes'));
  END $$;
INSERT INTO public.recipes(id,source_key,title,meal_types,ready_in_minutes,servings,ingredients,steps,allergens,diets,calories_kcal,tip,import_pending,allergens_reviewed,published,source_reference,yield_label,calorie_basis,difficulty) VALUES ('3d92620e-3751-4125-a920-8c7997b5cedd','pdf:recipe:4','Cuscuz de milho com legumes',ARRAY['breakfast']::text[],20,2,ARRAY['1 xícara de flocão de milho','½ xícara de água','1 tomate pequeno picado','2 colheres de sopa de cenoura ralada','1 colher de sopa de cheiro-verde picado','1 colher de chá de azeite','1 colher de sopa de azeitona a gosto','Sal a gosto']::text[],ARRAY['Coloque o flocão em uma tigela e adicione a água aos poucos.','Deixe hidratar por aproximadamente 5 minutos.','Misture uma pequena quantidade de sal e transfira para a cuscuzeira.','Cozinhe no vapor por cerca de 10 minutos, até ficar macio.','Misture o tomate, azeitona, cenoura e o cheiro-verde com o azeite e  sirva com o cuscuz.']::text[],ARRAY[]::text[],ARRAY['vegetarian','vegan','lactose_free','gluten_free']::text[],190,'Rendimento: 2 porções
Tempo de preparo: 20 minutos
Receitas Nestlé  receitas sem glúten.
Observação: confira a composição do flocão de milho e os avisos de
alergênicos no rótulo. Esta preparação não leva leite nem ovo na receita
proposta.',null,true,true,'Receitas Nestlé receitas sem glúten. — Conteúdo_Allivia.pdf, página 4','2 porções','por porção','Fácil') ON CONFLICT(source_key) DO UPDATE SET title=excluded.title,meal_types=excluded.meal_types,ready_in_minutes=excluded.ready_in_minutes,servings=excluded.servings,ingredients=excluded.ingredients,steps=excluded.steps,allergens=excluded.allergens,diets=excluded.diets,calories_kcal=excluded.calories_kcal,tip=excluded.tip,import_pending=excluded.import_pending,allergens_reviewed=excluded.allergens_reviewed,published=excluded.published,source_reference=excluded.source_reference,yield_label=excluded.yield_label,calorie_basis=excluded.calorie_basis,difficulty=excluded.difficulty;
DO $$ BEGIN
    IF (SELECT count(*) FROM public.recipes WHERE lower(extensions.unaccent(title)) = lower(extensions.unaccent('Tapioca com tomate'))) > 1 THEN
      RAISE EXCEPTION 'Mais de um registro corresponde a %; resolva a duplicação antes de importar', 'Tapioca com tomate';
    END IF;
    UPDATE public.recipes SET source_key = 'pdf:recipe:5' WHERE source_key IS NULL AND lower(extensions.unaccent(title)) = lower(extensions.unaccent('Tapioca com tomate'));
  END $$;
INSERT INTO public.recipes(id,source_key,title,meal_types,ready_in_minutes,servings,ingredients,steps,allergens,diets,calories_kcal,tip,import_pending,allergens_reviewed,published,source_reference,yield_label,calorie_basis,difficulty) VALUES ('7421d16a-395b-48cc-a41f-819a52507b41','pdf:recipe:5','Tapioca com tomate',ARRAY['breakfast']::text[],10,1,ARRAY['4 colheres de sopa de goma de tapioca hidratada','½ tomate pequeno picado','1 colher de chá de azeite','1 folha de alface.','Orégano a gosto','Uma pitada de sal']::text[],ARRAY['Aqueça uma frigideira antiaderente.','Espalhe a goma de tapioca, formando um disco uniforme.','Aguarde até que os grãos se unam e a massa fique firme.','Distribua o tomate, alface, azeite e o orégano sobre metade do disco.','Dobre a tapioca ao meio e aqueça por mais um minuto antes de servir.']::text[],ARRAY[]::text[],ARRAY['vegetarian','vegan','lactose_free','gluten_free']::text[],170,'Rendimento: 1 porção
Tempo de preparo: 10 minutos
Receitas Nestlé  receitas sem glúten.
Atenção aos alérgenos: verifique o rótulo da goma de tapioca e dos temperos.
A receita não contém ingredientes de origem animal na formulação proposta.',null,true,true,'Receitas Nestlé receitas sem glúten. — Conteúdo_Allivia.pdf, página 5','1 porção','por porção','Fácil') ON CONFLICT(source_key) DO UPDATE SET title=excluded.title,meal_types=excluded.meal_types,ready_in_minutes=excluded.ready_in_minutes,servings=excluded.servings,ingredients=excluded.ingredients,steps=excluded.steps,allergens=excluded.allergens,diets=excluded.diets,calories_kcal=excluded.calories_kcal,tip=excluded.tip,import_pending=excluded.import_pending,allergens_reviewed=excluded.allergens_reviewed,published=excluded.published,source_reference=excluded.source_reference,yield_label=excluded.yield_label,calorie_basis=excluded.calorie_basis,difficulty=excluded.difficulty;
DO $$ BEGIN
    IF (SELECT count(*) FROM public.recipes WHERE lower(extensions.unaccent(title)) = lower(extensions.unaccent('Bolo de banana com aveia'))) > 1 THEN
      RAISE EXCEPTION 'Mais de um registro corresponde a %; resolva a duplicação antes de importar', 'Bolo de banana com aveia';
    END IF;
    UPDATE public.recipes SET source_key = 'pdf:recipe:6' WHERE source_key IS NULL AND lower(extensions.unaccent(title)) = lower(extensions.unaccent('Bolo de banana com aveia'));
  END $$;
INSERT INTO public.recipes(id,source_key,title,meal_types,ready_in_minutes,servings,ingredients,steps,allergens,diets,calories_kcal,tip,import_pending,allergens_reviewed,published,source_reference,yield_label,calorie_basis,difficulty) VALUES ('8a0b7b87-cd9c-44a3-acb7-6c0c4eadbd99','pdf:recipe:6','Bolo de banana com aveia',ARRAY['breakfast']::text[],35,6,ARRAY['3 bananas maduras','2 ovos','1 xícara de aveia em flocos','1 colher de chá de canela','1 colher de sopa de fermento químico','1 colher de chá de óleo para untar']::text[],ARRAY['Preaqueça o forno a 180 °C.','Amasse as bananas e misture com os ovos.','Acrescente a aveia e a canela, mexendo até incorporar.','Adicione o fermento e misture delicadamente.','Despeje em uma forma pequena untada e asse por aproximadamente  25 a 30 minutos.','Espere amornar antes de cortar.']::text[],ARRAY['egg','gluten']::text[],ARRAY['vegetarian','lactose_free']::text[],160,'Rendimento: 6 porções
Tempo de preparo: 35 minutos
Receitas Nestlé  receitas sem lactose.
Atenção aos alérgenos: contém ovo e aveia. Sem ingredientes lácteos
adicionados na formulação proposta; isso não significa que seja segura para
todas as alergias.',null,true,true,'Receitas Nestlé receitas sem lactose. — Conteúdo_Allivia.pdf, página 6','6 porções','por porção','Fácil') ON CONFLICT(source_key) DO UPDATE SET title=excluded.title,meal_types=excluded.meal_types,ready_in_minutes=excluded.ready_in_minutes,servings=excluded.servings,ingredients=excluded.ingredients,steps=excluded.steps,allergens=excluded.allergens,diets=excluded.diets,calories_kcal=excluded.calories_kcal,tip=excluded.tip,import_pending=excluded.import_pending,allergens_reviewed=excluded.allergens_reviewed,published=excluded.published,source_reference=excluded.source_reference,yield_label=excluded.yield_label,calorie_basis=excluded.calorie_basis,difficulty=excluded.difficulty;
DO $$ BEGIN
    IF (SELECT count(*) FROM public.recipes WHERE lower(extensions.unaccent(title)) = lower(extensions.unaccent('Vitamina de morango e banana'))) > 1 THEN
      RAISE EXCEPTION 'Mais de um registro corresponde a %; resolva a duplicação antes de importar', 'Vitamina de morango e banana';
    END IF;
    UPDATE public.recipes SET source_key = 'pdf:recipe:7' WHERE source_key IS NULL AND lower(extensions.unaccent(title)) = lower(extensions.unaccent('Vitamina de morango e banana'));
  END $$;
INSERT INTO public.recipes(id,source_key,title,meal_types,ready_in_minutes,servings,ingredients,steps,allergens,diets,calories_kcal,tip,import_pending,allergens_reviewed,published,source_reference,yield_label,calorie_basis,difficulty) VALUES ('7240cb5f-31c2-4da2-a173-77250b69c8b1','pdf:recipe:7','Vitamina de morango e banana',ARRAY['breakfast']::text[],5,2,ARRAY['1 banana média','1 xícara de morangos higienizados','250 ml de água gelada','1 colher de chá de açúcar, opcional']::text[],ARRAY['Lave os morangos e retire as folhas.','Corte a banana em pedaços.','Coloque as frutas e a água no liquidificador.','Bata até obter uma bebida homogênea.','Sirva imediatamente.']::text[],ARRAY[]::text[],ARRAY['vegetarian','vegan','lactose_free','gluten_free']::text[],120,'Rendimento: 2 porções
Tempo de preparo: 5 minutos
Receitas Nestlé  receitas sem lactose.
Atenção aos alérgenos: a receita não utiliza leite nem bebida vegetal
industrializada. Pessoas com alergia a morango devem evitar esta preparação.',null,true,true,'Receitas Nestlé receitas sem lactose. — Conteúdo_Allivia.pdf, página 7','2 porções','por porção','Fácil') ON CONFLICT(source_key) DO UPDATE SET title=excluded.title,meal_types=excluded.meal_types,ready_in_minutes=excluded.ready_in_minutes,servings=excluded.servings,ingredients=excluded.ingredients,steps=excluded.steps,allergens=excluded.allergens,diets=excluded.diets,calories_kcal=excluded.calories_kcal,tip=excluded.tip,import_pending=excluded.import_pending,allergens_reviewed=excluded.allergens_reviewed,published=excluded.published,source_reference=excluded.source_reference,yield_label=excluded.yield_label,calorie_basis=excluded.calorie_basis,difficulty=excluded.difficulty;
DO $$ BEGIN
    IF (SELECT count(*) FROM public.recipes WHERE lower(extensions.unaccent(title)) = lower(extensions.unaccent('Bolo de fubá'))) > 1 THEN
      RAISE EXCEPTION 'Mais de um registro corresponde a %; resolva a duplicação antes de importar', 'Bolo de fubá';
    END IF;
    UPDATE public.recipes SET source_key = 'pdf:recipe:8' WHERE source_key IS NULL AND lower(extensions.unaccent(title)) = lower(extensions.unaccent('Bolo de fubá'));
  END $$;
INSERT INTO public.recipes(id,source_key,title,meal_types,ready_in_minutes,servings,ingredients,steps,allergens,diets,calories_kcal,tip,import_pending,allergens_reviewed,published,source_reference,yield_label,calorie_basis,difficulty) VALUES ('f2587d37-06d3-4c32-acf6-7e79e0d27690','pdf:recipe:8','Bolo de fubá',ARRAY['breakfast']::text[],45,8,ARRAY['1 xícara de fubá','1 xícara de farinha de arroz','1 xícara de açúcar','200 ml de leite de coco','200 ml de óleo','2 ovos','1 colher de sopa de fermento químico']::text[],ARRAY['Pré-aqueça o forno a 180 °C.','Misture o fubá, a farinha de arroz e o açúcar.','Acrescente o leite de coco, o óleo e os ovos.','Misture até obter uma massa uniforme e incorpore o fermento.','Despeje em uma forma untada e asse por aproximadamente 30 a 35  minutos.','Espere esfriar um pouco antes de desenformar.']::text[],ARRAY['egg']::text[],ARRAY['vegetarian','lactose_free','gluten_free']::text[],null,'Rendimento: 8 por??es
Tempo: 45 minutos
Adapta??o Allivia com 200 ml de ?leo. Teste culin?rio aprovado pela respons?vel em 17/11/2026. Cont?m ovo e coco. Confira os r?tulos dos ingredientes e poss?vel contamina??o cruzada. Calorias aguardam rec?lculo.',null,true,true,'Receitas Nestlé bolo de fubá sem glúten e sem lactose — Conteúdo_Allivia.pdf, página 8','8 porções','por porção','Fácil') ON CONFLICT(source_key) DO UPDATE SET title=excluded.title,meal_types=excluded.meal_types,ready_in_minutes=excluded.ready_in_minutes,servings=excluded.servings,ingredients=excluded.ingredients,steps=excluded.steps,allergens=excluded.allergens,diets=excluded.diets,calories_kcal=excluded.calories_kcal,tip=excluded.tip,import_pending=excluded.import_pending,allergens_reviewed=excluded.allergens_reviewed,published=excluded.published,source_reference=excluded.source_reference,yield_label=excluded.yield_label,calorie_basis=excluded.calorie_basis,difficulty=excluded.difficulty;
DO $$ BEGIN
    IF (SELECT count(*) FROM public.recipes WHERE lower(extensions.unaccent(title)) = lower(extensions.unaccent('Biscoito de banana e coco'))) > 1 THEN
      RAISE EXCEPTION 'Mais de um registro corresponde a %; resolva a duplicação antes de importar', 'Biscoito de banana e coco';
    END IF;
    UPDATE public.recipes SET source_key = 'pdf:recipe:9' WHERE source_key IS NULL AND lower(extensions.unaccent(title)) = lower(extensions.unaccent('Biscoito de banana e coco'));
  END $$;
INSERT INTO public.recipes(id,source_key,title,meal_types,ready_in_minutes,servings,ingredients,steps,allergens,diets,calories_kcal,tip,import_pending,allergens_reviewed,published,source_reference,yield_label,calorie_basis,difficulty) VALUES ('4721a75b-3a9d-415e-a205-337085a0600e','pdf:recipe:9','Biscoito de banana e coco',ARRAY['breakfast']::text[],30,20,ARRAY['1 banana madura amassada','1 xícara de coco seco ralado sem açúcar','2 colheres de sopa de uvas-passas','1 colher de chá de canela, opcional']::text[],ARRAY['Pré-aqueça o forno a 180 °C.','Misture a banana amassada, o coco e as uvas-passas.','Modele pequenas porções em formato de biscoito.','Distribua em uma assadeira forrada com papel-manteiga.','Asse por aproximadamente 15 a 20 minutos, até firmarem e dourarem  levemente.']::text[],ARRAY[]::text[],ARRAY['vegetarian','vegan','lactose_free','gluten_free']::text[],35,'Rendimento: aproximadamente 20 unidades
Tempo de preparo: 30 minutos
Receitas Nestlé  biscoitinho de banana e coco
Atenção aos alérgenos: contém coco. A receita proposta não utiliza trigo, leite ou
ovo, mas os ingredientes e o ambiente de preparo precisam ser verificados.',null,true,true,'Receitas Nestlé biscoitinho de banana e coco — Conteúdo_Allivia.pdf, página 9','aproximadamente 20 unidades','por unidade','Fácil') ON CONFLICT(source_key) DO UPDATE SET title=excluded.title,meal_types=excluded.meal_types,ready_in_minutes=excluded.ready_in_minutes,servings=excluded.servings,ingredients=excluded.ingredients,steps=excluded.steps,allergens=excluded.allergens,diets=excluded.diets,calories_kcal=excluded.calories_kcal,tip=excluded.tip,import_pending=excluded.import_pending,allergens_reviewed=excluded.allergens_reviewed,published=excluded.published,source_reference=excluded.source_reference,yield_label=excluded.yield_label,calorie_basis=excluded.calorie_basis,difficulty=excluded.difficulty;
DO $$ BEGIN
    IF (SELECT count(*) FROM public.recipes WHERE lower(extensions.unaccent(title)) = lower(extensions.unaccent('Pão de queijo caseiro'))) > 1 THEN
      RAISE EXCEPTION 'Mais de um registro corresponde a %; resolva a duplicação antes de importar', 'Pão de queijo caseiro';
    END IF;
    UPDATE public.recipes SET source_key = 'pdf:recipe:10' WHERE source_key IS NULL AND lower(extensions.unaccent(title)) = lower(extensions.unaccent('Pão de queijo caseiro'));
  END $$;
INSERT INTO public.recipes(id,source_key,title,meal_types,ready_in_minutes,servings,ingredients,steps,allergens,diets,calories_kcal,tip,import_pending,allergens_reviewed,published,source_reference,yield_label,calorie_basis,difficulty) VALUES ('7093f9eb-d2ff-4819-a251-2188906e401b','pdf:recipe:10','Pão de queijo caseiro',ARRAY['breakfast']::text[],35,15,ARRAY['2 xícaras de polvilho doce','1 xícara de queijo minas meia-cura ralado','1 ovo','½ xícara de leite','2 colheres de sopa de óleo','Sal a gosto']::text[],ARRAY['Aqueça o leite com o óleo até começar a ferver.','Despeje sobre o polvilho e misture cuidadosamente.','Espere amornar e acrescente o ovo e o queijo.','Misture até obter uma massa que possa ser modelada.','Forme pequenas bolas e distribua em uma assadeira.','Asse em forno preaquecido a 180 °C por cerca de 25 minutos, até  dourar.']::text[],ARRAY['milk','egg']::text[],ARRAY['vegetarian','gluten_free']::text[],85,'Rendimento: 15 unidades
Tempo de preparo: 35 minutos
Embrapa  receitas sem glúten
Alergênicos: contém leite e ovo. Não é adequada para pessoas alérgicas a esses
ingredientes.',null,true,true,'Embrapa receitas sem glúten — Conteúdo_Allivia.pdf, página 10','15 unidades','por unidade','Fácil') ON CONFLICT(source_key) DO UPDATE SET title=excluded.title,meal_types=excluded.meal_types,ready_in_minutes=excluded.ready_in_minutes,servings=excluded.servings,ingredients=excluded.ingredients,steps=excluded.steps,allergens=excluded.allergens,diets=excluded.diets,calories_kcal=excluded.calories_kcal,tip=excluded.tip,import_pending=excluded.import_pending,allergens_reviewed=excluded.allergens_reviewed,published=excluded.published,source_reference=excluded.source_reference,yield_label=excluded.yield_label,calorie_basis=excluded.calorie_basis,difficulty=excluded.difficulty;
DO $$ BEGIN
    IF (SELECT count(*) FROM public.recipes WHERE lower(extensions.unaccent(title)) = lower(extensions.unaccent('Bolo de laranja com farinha de arroz'))) > 1 THEN
      RAISE EXCEPTION 'Mais de um registro corresponde a %; resolva a duplicação antes de importar', 'Bolo de laranja com farinha de arroz';
    END IF;
    UPDATE public.recipes SET source_key = 'pdf:recipe:12' WHERE source_key IS NULL AND lower(extensions.unaccent(title)) = lower(extensions.unaccent('Bolo de laranja com farinha de arroz'));
  END $$;
INSERT INTO public.recipes(id,source_key,title,meal_types,ready_in_minutes,servings,ingredients,steps,allergens,diets,calories_kcal,tip,import_pending,allergens_reviewed,published,source_reference,yield_label,calorie_basis,difficulty) VALUES ('52c733c9-a1fd-4643-aea4-2e5cb8504c03','pdf:recipe:12','Bolo de laranja com farinha de arroz',ARRAY['breakfast']::text[],45,10,ARRAY['2 xícaras de farinha de arroz','3 ovos','1 xícara de açúcar','½ xícara de óleo','1 xícara de suco de laranja natural','1 colher de sopa de fermento químico']::text[],ARRAY['Pré-aqueça o forno a 180 °C.','Misture os ovos, o açúcar e o óleo.','Acrescente o suco de laranja e a farinha de arroz.','Misture até obter uma massa uniforme.','Incorpore o fermento delicadamente.','Despeje em uma forma untada e asse por aproximadamente 30 a 35  minutos.']::text[],ARRAY['egg']::text[],ARRAY['vegetarian','lactose_free','gluten_free']::text[],190,'Rendimento: 10 fatias
Tempo: 45 minutos
Embrapa  pães, bolos e biscoitos sem glúten
Alergênicos: contém ovo. Verifique a farinha de arroz, o fermento e os demais
ingredientes quanto a possíveis advertências de contaminação cruzada.',null,true,true,'Embrapa pães, bolos e biscoitos sem glúten — Conteúdo_Allivia.pdf, página 12','10 fatias','por fatia','Fácil') ON CONFLICT(source_key) DO UPDATE SET title=excluded.title,meal_types=excluded.meal_types,ready_in_minutes=excluded.ready_in_minutes,servings=excluded.servings,ingredients=excluded.ingredients,steps=excluded.steps,allergens=excluded.allergens,diets=excluded.diets,calories_kcal=excluded.calories_kcal,tip=excluded.tip,import_pending=excluded.import_pending,allergens_reviewed=excluded.allergens_reviewed,published=excluded.published,source_reference=excluded.source_reference,yield_label=excluded.yield_label,calorie_basis=excluded.calorie_basis,difficulty=excluded.difficulty;
DO $$ BEGIN
    IF (SELECT count(*) FROM public.recipes WHERE lower(extensions.unaccent(title)) = lower(extensions.unaccent('Smoothie bowl de banana e morango'))) > 1 THEN
      RAISE EXCEPTION 'Mais de um registro corresponde a %; resolva a duplicação antes de importar', 'Smoothie bowl de banana e morango';
    END IF;
    UPDATE public.recipes SET source_key = 'pdf:recipe:13' WHERE source_key IS NULL AND lower(extensions.unaccent(title)) = lower(extensions.unaccent('Smoothie bowl de banana e morango'));
  END $$;
INSERT INTO public.recipes(id,source_key,title,meal_types,ready_in_minutes,servings,ingredients,steps,allergens,diets,calories_kcal,tip,import_pending,allergens_reviewed,published,source_reference,yield_label,calorie_basis,difficulty) VALUES ('cd36666c-3a74-4c4c-ab25-d3cf5ca66e22','pdf:recipe:13','Smoothie bowl de banana e morango',ARRAY['breakfast']::text[],10,1,ARRAY['1 banana congelada','½ xícara de morangos','1 colher de sopa de chia','2 colheres de sopa de água','Coco em flocos para finalizar, opcional']::text[],ARRAY['Corte a banana congelada em pedaços.','Bata com os morangos, a chia e a água.','Utilize pouca água para manter a consistência cremosa.','Transfira para uma tigela.','Finalize com os flocos de coco, caso sejam adequados às alergias do  usuário.']::text[],ARRAY[]::text[],ARRAY['vegetarian','vegan','lactose_free','gluten_free']::text[],250,'Rendimento: 1 porção
Tempo de preparo: 10 minutos
Receitas Nestlé  smoothie bowl vegano.
Atenção aos alérgenos: a versão proposta não utiliza bebida de amêndoas, ao
contrário da receita de referência. Contém coco se utilizado na finalização. Verifique
os ingredientes e a contaminação cruzada.',null,true,true,'Receitas Nestlé smoothie bowl vegano. — Conteúdo_Allivia.pdf, página 13','1 porção','por porção','Fácil') ON CONFLICT(source_key) DO UPDATE SET title=excluded.title,meal_types=excluded.meal_types,ready_in_minutes=excluded.ready_in_minutes,servings=excluded.servings,ingredients=excluded.ingredients,steps=excluded.steps,allergens=excluded.allergens,diets=excluded.diets,calories_kcal=excluded.calories_kcal,tip=excluded.tip,import_pending=excluded.import_pending,allergens_reviewed=excluded.allergens_reviewed,published=excluded.published,source_reference=excluded.source_reference,yield_label=excluded.yield_label,calorie_basis=excluded.calorie_basis,difficulty=excluded.difficulty;
DO $$ BEGIN
    IF (SELECT count(*) FROM public.recipes WHERE lower(extensions.unaccent(title)) = lower(extensions.unaccent('Muffin salgado de legumes'))) > 1 THEN
      RAISE EXCEPTION 'Mais de um registro corresponde a %; resolva a duplicação antes de importar', 'Muffin salgado de legumes';
    END IF;
    UPDATE public.recipes SET source_key = 'pdf:recipe:14' WHERE source_key IS NULL AND lower(extensions.unaccent(title)) = lower(extensions.unaccent('Muffin salgado de legumes'));
  END $$;
INSERT INTO public.recipes(id,source_key,title,meal_types,ready_in_minutes,servings,ingredients,steps,allergens,diets,calories_kcal,tip,import_pending,allergens_reviewed,published,source_reference,yield_label,calorie_basis,difficulty) VALUES ('19be77b0-aa8b-4521-a75b-8f0fbc187e58','pdf:recipe:14','Muffin salgado de legumes',ARRAY['snack']::text[],35,6,ARRAY['2 ovos','½ xícara de leite','1 xícara de farinha de trigo','1 cenoura pequena ralada','½ xícara de milho-verde','2 colheres de sopa de queijo ralado','1 colher de sopa de óleo','1 colher de chá de fermento químico','Sal e orégano a gosto.']::text[],ARRAY['Preaqueça o forno a 180 °C.','Em uma tigela, misture os ovos, o leite e o óleo.','Acrescente a farinha de trigo e mexa até obter uma massa uniforme.','Adicione a cenoura, o milho, o queijo e os temperos.','Incorpore o fermento delicadamente.','Distribua a massa em forminhas untadas.','Asse por aproximadamente 20 a 25 minutos, até dourar.']::text[],ARRAY['milk','egg','gluten']::text[],ARRAY['vegetarian']::text[],null,'Rendimento: 6 unidades
Tempo de preparo: 35 minutos
Receita adaptada de preparações vegetarianas do
portal Receitas Nestlé.
Aviso sobre alergênicos: contém leite, derivados, ovos e trigo (glúten). Verifique
os rótulos dos ingredientes e possíveis avisos de contaminação cruzada.',null,true,true,'Receita adaptada de preparações vegetarianas do portal Receitas Nestlé. — Conteúdo_Allivia.pdf, página 14','6 unidades','por porção','Fácil') ON CONFLICT(source_key) DO UPDATE SET title=excluded.title,meal_types=excluded.meal_types,ready_in_minutes=excluded.ready_in_minutes,servings=excluded.servings,ingredients=excluded.ingredients,steps=excluded.steps,allergens=excluded.allergens,diets=excluded.diets,calories_kcal=excluded.calories_kcal,tip=excluded.tip,import_pending=excluded.import_pending,allergens_reviewed=excluded.allergens_reviewed,published=excluded.published,source_reference=excluded.source_reference,yield_label=excluded.yield_label,calorie_basis=excluded.calorie_basis,difficulty=excluded.difficulty;
DO $$ BEGIN
    IF (SELECT count(*) FROM public.recipes WHERE lower(extensions.unaccent(title)) = lower(extensions.unaccent('Sanduíche natural de ricota e cenoura'))) > 1 THEN
      RAISE EXCEPTION 'Mais de um registro corresponde a %; resolva a duplicação antes de importar', 'Sanduíche natural de ricota e cenoura';
    END IF;
    UPDATE public.recipes SET source_key = 'pdf:recipe:15' WHERE source_key IS NULL AND lower(extensions.unaccent(title)) = lower(extensions.unaccent('Sanduíche natural de ricota e cenoura'));
  END $$;
INSERT INTO public.recipes(id,source_key,title,meal_types,ready_in_minutes,servings,ingredients,steps,allergens,diets,calories_kcal,tip,import_pending,allergens_reviewed,published,source_reference,yield_label,calorie_basis,difficulty) VALUES ('d856c277-53fe-42eb-ae15-2d6118946fa0','pdf:recipe:15','Sanduíche natural de ricota e cenoura',ARRAY['snack']::text[],15,2,ARRAY['4 fatias de pão de forma','100 g de ricota','½ cenoura pequena ralada','1 colher de sopa de azeite','1 colher de sopa de cheiro-verde picado','2 folhas de alface','Sal a gosto.']::text[],ARRAY['Amasse a ricota com um garfo.','Acrescente a cenoura, o azeite, o cheiro-verde e o sal.','Misture até formar um recheio homogêneo.','Distribua o recheio sobre duas fatias de pão.','Acrescente as folhas de alface e cubra com as outras fatias.','Corte os sanduíches ao meio e sirva.']::text[],ARRAY['milk','gluten']::text[],ARRAY['vegetarian']::text[],null,'Rendimento: 2 porções
Tempo de preparo: 15 minutos
Receita adaptada de preparações vegetarianas do
portal Receitas Nestlé.
Aviso sobre alergênicos: contém leite e derivados devido à ricota e trigo (glúten)
no pão. Verifique a composição do pão e dos demais ingredientes.',null,true,true,'Receita adaptada de preparações vegetarianas do portal Receitas Nestlé. — Conteúdo_Allivia.pdf, página 15','2 porções','por porção','Fácil') ON CONFLICT(source_key) DO UPDATE SET title=excluded.title,meal_types=excluded.meal_types,ready_in_minutes=excluded.ready_in_minutes,servings=excluded.servings,ingredients=excluded.ingredients,steps=excluded.steps,allergens=excluded.allergens,diets=excluded.diets,calories_kcal=excluded.calories_kcal,tip=excluded.tip,import_pending=excluded.import_pending,allergens_reviewed=excluded.allergens_reviewed,published=excluded.published,source_reference=excluded.source_reference,yield_label=excluded.yield_label,calorie_basis=excluded.calorie_basis,difficulty=excluded.difficulty;
DO $$ BEGIN
    IF (SELECT count(*) FROM public.recipes WHERE lower(extensions.unaccent(title)) = lower(extensions.unaccent('Bolinho assado de batata com queijo'))) > 1 THEN
      RAISE EXCEPTION 'Mais de um registro corresponde a %; resolva a duplicação antes de importar', 'Bolinho assado de batata com queijo';
    END IF;
    UPDATE public.recipes SET source_key = 'pdf:recipe:16' WHERE source_key IS NULL AND lower(extensions.unaccent(title)) = lower(extensions.unaccent('Bolinho assado de batata com queijo'));
  END $$;
INSERT INTO public.recipes(id,source_key,title,meal_types,ready_in_minutes,servings,ingredients,steps,allergens,diets,calories_kcal,tip,import_pending,allergens_reviewed,published,source_reference,yield_label,calorie_basis,difficulty) VALUES ('673dcad3-4da3-4c88-aa75-6a55ecddba0c','pdf:recipe:16','Bolinho assado de batata com queijo',ARRAY['snack']::text[],40,10,ARRAY['3 batatas médias','½ xícara de queijo muçarela ralado','1 ovo','3 colheres de sopa de farinha de trigo','1 colher de sopa de cheiro-verde','Sal e orégano a gosto.']::text[],ARRAY['Cozinhe as batatas até ficarem macias.','Escorra a água e amasse-as ainda mornas.','Acrescente o queijo, o ovo, a farinha e os temperos.','Misture até formar uma massa que possa ser modelada.','Faça pequenas bolinhas e coloque-as em uma assadeira untada.','Asse em forno preaquecido a 200 °C por aproximadamente 20 a 25 minutos,  virando na metade do tempo.']::text[],ARRAY['milk','egg','gluten']::text[],ARRAY['vegetarian']::text[],null,'Rendimento: 10 unidades
Tempo de preparo: 40 minutos
Receita adaptada de preparações vegetarianas do
portal Receitas Nestlé.
Aviso sobre alergênicos: contém leite e derivados, ovos e trigo (glúten). Não é
adequada para pessoas alérgicas a esses ingredientes.',null,true,true,'Receita adaptada de preparações vegetarianas do portal Receitas Nestlé. — Conteúdo_Allivia.pdf, página 16','10 unidades','por unidade','Fácil') ON CONFLICT(source_key) DO UPDATE SET title=excluded.title,meal_types=excluded.meal_types,ready_in_minutes=excluded.ready_in_minutes,servings=excluded.servings,ingredients=excluded.ingredients,steps=excluded.steps,allergens=excluded.allergens,diets=excluded.diets,calories_kcal=excluded.calories_kcal,tip=excluded.tip,import_pending=excluded.import_pending,allergens_reviewed=excluded.allergens_reviewed,published=excluded.published,source_reference=excluded.source_reference,yield_label=excluded.yield_label,calorie_basis=excluded.calorie_basis,difficulty=excluded.difficulty;
DO $$ BEGIN
    IF (SELECT count(*) FROM public.recipes WHERE lower(extensions.unaccent(title)) = lower(extensions.unaccent('Pão de frigideira com ervas'))) > 1 THEN
      RAISE EXCEPTION 'Mais de um registro corresponde a %; resolva a duplicação antes de importar', 'Pão de frigideira com ervas';
    END IF;
    UPDATE public.recipes SET source_key = 'pdf:recipe:17' WHERE source_key IS NULL AND lower(extensions.unaccent(title)) = lower(extensions.unaccent('Pão de frigideira com ervas'));
  END $$;
INSERT INTO public.recipes(id,source_key,title,meal_types,ready_in_minutes,servings,ingredients,steps,allergens,diets,calories_kcal,tip,import_pending,allergens_reviewed,published,source_reference,yield_label,calorie_basis,difficulty) VALUES ('50174924-221a-4bb2-a44d-6268b8dfc81e','pdf:recipe:17','Pão de frigideira com ervas',ARRAY['snack']::text[],15,1,ARRAY['1 ovo','3 colheres de sopa de farinha de trigo','2 colheres de sopa de água','1 colher de chá de azeite','½ colher de chá de fermento químico','Orégano e sal a gosto.']::text[],ARRAY['Em um recipiente, misture o ovo, a água e o azeite.','Acrescente a farinha, o sal e o orégano.','Misture até obter uma massa homogênea.','Adicione o fermento e mexa delicadamente.','Despeje a massa em uma frigideira antiaderente levemente untada.','Cozinhe em fogo baixo, com a frigideira tampada, por aproximadamente 3 a 4  minutos de cada lado.']::text[],ARRAY['egg','gluten']::text[],ARRAY['vegetarian','lactose_free']::text[],null,'Rendimento: 1 porção
Tempo de preparo: 15 minutos
Receita adaptada de preparações sem lactose do
portal Receitas Nestlé.
Aviso sobre alergênicos: não contém leite ou derivados na formulação proposta.
Contém ovo e trigo (glúten). Confira os rótulos dos ingredientes.',null,true,true,'Receita adaptada de preparações sem lactose do portal Receitas Nestlé. — Conteúdo_Allivia.pdf, página 17','1 porção','por porção','Fácil') ON CONFLICT(source_key) DO UPDATE SET title=excluded.title,meal_types=excluded.meal_types,ready_in_minutes=excluded.ready_in_minutes,servings=excluded.servings,ingredients=excluded.ingredients,steps=excluded.steps,allergens=excluded.allergens,diets=excluded.diets,calories_kcal=excluded.calories_kcal,tip=excluded.tip,import_pending=excluded.import_pending,allergens_reviewed=excluded.allergens_reviewed,published=excluded.published,source_reference=excluded.source_reference,yield_label=excluded.yield_label,calorie_basis=excluded.calorie_basis,difficulty=excluded.difficulty;
DO $$ BEGIN
    IF (SELECT count(*) FROM public.recipes WHERE lower(extensions.unaccent(title)) = lower(extensions.unaccent('Bolinho de maçã e canela'))) > 1 THEN
      RAISE EXCEPTION 'Mais de um registro corresponde a %; resolva a duplicação antes de importar', 'Bolinho de maçã e canela';
    END IF;
    UPDATE public.recipes SET source_key = 'pdf:recipe:18' WHERE source_key IS NULL AND lower(extensions.unaccent(title)) = lower(extensions.unaccent('Bolinho de maçã e canela'));
  END $$;
INSERT INTO public.recipes(id,source_key,title,meal_types,ready_in_minutes,servings,ingredients,steps,allergens,diets,calories_kcal,tip,import_pending,allergens_reviewed,published,source_reference,yield_label,calorie_basis,difficulty) VALUES ('ae5d3d04-66d7-4e2e-acd1-9c2b03d02378','pdf:recipe:18','Bolinho de maçã e canela',ARRAY['snack']::text[],30,6,ARRAY['1 maçã média ralada','1 ovo','½ xícara de farinha de trigo','¼ de xícara de açúcar','2 colheres de sopa de óleo vegetal','½ colher de chá de canela em pó','1 colher de chá de fermento químico.']::text[],ARRAY['Preaqueça o forno a 180 °C.','Misture o ovo, o açúcar e o óleo em uma tigela.','Acrescente a maçã ralada, a farinha e a canela.','Misture até incorporar os ingredientes.','Adicione o fermento e mexa delicadamente.','Distribua a massa em forminhas untadas.','Asse por aproximadamente 18 a 20 minutos.']::text[],ARRAY['egg','gluten']::text[],ARRAY['vegetarian','lactose_free']::text[],null,'Rendimento: 6 unidades
Tempo de preparo: 30 minutos
Receita adaptada de preparações sem lactose do
portal Receitas Nestlé.
Aviso sobre alergênicos: não contém leite ou derivados adicionados. Contém ovo
e trigo (glúten). Verifique os rótulos dos ingredientes utilizados.',null,true,true,'Receita adaptada de preparações sem lactose do portal Receitas Nestlé. — Conteúdo_Allivia.pdf, página 18','6 unidades','por porção','Fácil') ON CONFLICT(source_key) DO UPDATE SET title=excluded.title,meal_types=excluded.meal_types,ready_in_minutes=excluded.ready_in_minutes,servings=excluded.servings,ingredients=excluded.ingredients,steps=excluded.steps,allergens=excluded.allergens,diets=excluded.diets,calories_kcal=excluded.calories_kcal,tip=excluded.tip,import_pending=excluded.import_pending,allergens_reviewed=excluded.allergens_reviewed,published=excluded.published,source_reference=excluded.source_reference,yield_label=excluded.yield_label,calorie_basis=excluded.calorie_basis,difficulty=excluded.difficulty;
DO $$ BEGIN
    IF (SELECT count(*) FROM public.recipes WHERE lower(extensions.unaccent(title)) = lower(extensions.unaccent('Chips de batata-doce assados'))) > 1 THEN
      RAISE EXCEPTION 'Mais de um registro corresponde a %; resolva a duplicação antes de importar', 'Chips de batata-doce assados';
    END IF;
    UPDATE public.recipes SET source_key = 'pdf:recipe:19' WHERE source_key IS NULL AND lower(extensions.unaccent(title)) = lower(extensions.unaccent('Chips de batata-doce assados'));
  END $$;
INSERT INTO public.recipes(id,source_key,title,meal_types,ready_in_minutes,servings,ingredients,steps,allergens,diets,calories_kcal,tip,import_pending,allergens_reviewed,published,source_reference,yield_label,calorie_basis,difficulty) VALUES ('219d8250-4e46-4c5f-a51e-0bca04367882','pdf:recipe:19','Chips de batata-doce assados',ARRAY['snack']::text[],35,2,ARRAY['1 batata-doce média','1 colher de sopa de azeite','Sal a gosto','Páprica doce ou ervas secas a gosto.']::text[],ARRAY['Preaqueça o forno a 200 °C.','Lave bem a batata-doce e corte-a em fatias finas.','Coloque as fatias em uma tigela e misture com o azeite e os temperos.','Distribua em uma assadeira, sem sobrepor as fatias.','Asse por aproximadamente 20 a 25 minutos, virando na metade do tempo.','Retire quando estiverem douradas e crocantes.']::text[],ARRAY[]::text[],ARRAY['vegetarian','vegan','lactose_free','gluten_free']::text[],null,'Rendimento: 2 porções
Tempo de preparo: 35 minutos
Receita adaptada de preparações sem lactose do
portal Receitas Nestlé.
Aviso sobre alergênicos: a formulação proposta não utiliza leite, ovos ou trigo.
Confira os rótulos dos temperos e evite contaminação cruzada durante o preparo.',null,true,true,'Receita adaptada de preparações sem lactose do portal Receitas Nestlé. — Conteúdo_Allivia.pdf, página 19','2 porções','por porção','Fácil') ON CONFLICT(source_key) DO UPDATE SET title=excluded.title,meal_types=excluded.meal_types,ready_in_minutes=excluded.ready_in_minutes,servings=excluded.servings,ingredients=excluded.ingredients,steps=excluded.steps,allergens=excluded.allergens,diets=excluded.diets,calories_kcal=excluded.calories_kcal,tip=excluded.tip,import_pending=excluded.import_pending,allergens_reviewed=excluded.allergens_reviewed,published=excluded.published,source_reference=excluded.source_reference,yield_label=excluded.yield_label,calorie_basis=excluded.calorie_basis,difficulty=excluded.difficulty;
DO $$ BEGIN
    IF (SELECT count(*) FROM public.recipes WHERE lower(extensions.unaccent(title)) = lower(extensions.unaccent('Bolinho de arroz assado'))) > 1 THEN
      RAISE EXCEPTION 'Mais de um registro corresponde a %; resolva a duplicação antes de importar', 'Bolinho de arroz assado';
    END IF;
    UPDATE public.recipes SET source_key = 'pdf:recipe:20' WHERE source_key IS NULL AND lower(extensions.unaccent(title)) = lower(extensions.unaccent('Bolinho de arroz assado'));
  END $$;
INSERT INTO public.recipes(id,source_key,title,meal_types,ready_in_minutes,servings,ingredients,steps,allergens,diets,calories_kcal,tip,import_pending,allergens_reviewed,published,source_reference,yield_label,calorie_basis,difficulty) VALUES ('91deadd4-b36e-4cef-a1e5-a85f0462d684','pdf:recipe:20','Bolinho de arroz assado',ARRAY['snack']::text[],35,10,ARRAY['1 xícara de arroz cozido','1 ovo','½ cenoura ralada','3 colheres de sopa de farinha de arroz','2 colheres de sopa de cheiro-verde','1 colher de sopa de azeite','Sal a gosto.']::text[],ARRAY['Preaqueça o forno a 180 °C.','Em uma tigela, misture o arroz, o ovo e a cenoura.','Acrescente a farinha de arroz, o cheiro-verde, o azeite e o sal.','Misture até obter uma massa consistente.','Modele pequenos bolinhos e coloque-os em uma assadeira untada.','Asse por aproximadamente 20 a 25 minutos, até dourarem.']::text[],ARRAY['egg']::text[],ARRAY['vegetarian','lactose_free','gluten_free']::text[],null,'Rendimento: 10 unidades
Tempo de preparo: 35 minutos
Receita adaptada de preparações sem glúten do portal
Receitas Nestlé.
Aviso sobre alergênicos: contém ovo. A receita não utiliza trigo ou outros
ingredientes com glúten na formulação proposta. Utilize farinha de arroz e demais
ingredientes identificados como sem glúten e evite contaminação cruzada.',null,true,true,'Receita adaptada de preparações sem glúten do portal Receitas Nestlé. — Conteúdo_Allivia.pdf, página 20','10 unidades','por unidade','Fácil') ON CONFLICT(source_key) DO UPDATE SET title=excluded.title,meal_types=excluded.meal_types,ready_in_minutes=excluded.ready_in_minutes,servings=excluded.servings,ingredients=excluded.ingredients,steps=excluded.steps,allergens=excluded.allergens,diets=excluded.diets,calories_kcal=excluded.calories_kcal,tip=excluded.tip,import_pending=excluded.import_pending,allergens_reviewed=excluded.allergens_reviewed,published=excluded.published,source_reference=excluded.source_reference,yield_label=excluded.yield_label,calorie_basis=excluded.calorie_basis,difficulty=excluded.difficulty;
DO $$ BEGIN
    IF (SELECT count(*) FROM public.recipes WHERE lower(extensions.unaccent(title)) = lower(extensions.unaccent('Pão de queijo de frigideira'))) > 1 THEN
      RAISE EXCEPTION 'Mais de um registro corresponde a %; resolva a duplicação antes de importar', 'Pão de queijo de frigideira';
    END IF;
    UPDATE public.recipes SET source_key = 'pdf:recipe:21' WHERE source_key IS NULL AND lower(extensions.unaccent(title)) = lower(extensions.unaccent('Pão de queijo de frigideira'));
  END $$;
INSERT INTO public.recipes(id,source_key,title,meal_types,ready_in_minutes,servings,ingredients,steps,allergens,diets,calories_kcal,tip,import_pending,allergens_reviewed,published,source_reference,yield_label,calorie_basis,difficulty) VALUES ('65a8ffaf-1c62-4fbb-a981-7c51c587e4c7','pdf:recipe:21','Pão de queijo de frigideira',ARRAY['snack']::text[],10,1,ARRAY['1 ovo','2 colheres de sopa de polvilho doce','2 colheres de sopa de queijo muçarela ralado','1 colher de sopa de leite','1 pitada de sal.']::text[],ARRAY['Em uma tigela, misture o ovo, o polvilho, o queijo e o leite.','Acrescente o sal e mexa até formar uma massa uniforme.','Aqueça uma frigideira antiaderente em fogo baixo.','Despeje a massa e espalhe delicadamente.','Cozinhe até a parte inferior ficar firme.','Vire e doure o outro lado antes de servir.']::text[],ARRAY['milk','egg']::text[],ARRAY['vegetarian','gluten_free']::text[],null,'Rendimento: 1 porção
Tempo de preparo: 10 minutos
Receita adaptada de preparações com polvilho,
ingrediente naturalmente sem glúten; referência complementar: Embrapa
publicações sobre preparações sem glúten.
Aviso sobre alergênicos: contém leite e derivados e ovo. Não contém ingredientes
com glúten na formulação proposta, mas é necessário verificar os rótulos e evitar
contaminação cruzada.',null,true,true,'Receita adaptada de preparações com polvilho, ingrediente naturalmente sem glúten; referência complementar: Embrapa publicações sobre preparações sem glúten. — Conteúdo_Allivia.pdf, página 21','1 porção','por porção','Fácil') ON CONFLICT(source_key) DO UPDATE SET title=excluded.title,meal_types=excluded.meal_types,ready_in_minutes=excluded.ready_in_minutes,servings=excluded.servings,ingredients=excluded.ingredients,steps=excluded.steps,allergens=excluded.allergens,diets=excluded.diets,calories_kcal=excluded.calories_kcal,tip=excluded.tip,import_pending=excluded.import_pending,allergens_reviewed=excluded.allergens_reviewed,published=excluded.published,source_reference=excluded.source_reference,yield_label=excluded.yield_label,calorie_basis=excluded.calorie_basis,difficulty=excluded.difficulty;
DO $$ BEGIN
    IF (SELECT count(*) FROM public.recipes WHERE lower(extensions.unaccent(title)) = lower(extensions.unaccent('Panqueca de farinha de arroz com legumes'))) > 1 THEN
      RAISE EXCEPTION 'Mais de um registro corresponde a %; resolva a duplicação antes de importar', 'Panqueca de farinha de arroz com legumes';
    END IF;
    UPDATE public.recipes SET source_key = 'pdf:recipe:22' WHERE source_key IS NULL AND lower(extensions.unaccent(title)) = lower(extensions.unaccent('Panqueca de farinha de arroz com legumes'));
  END $$;
INSERT INTO public.recipes(id,source_key,title,meal_types,ready_in_minutes,servings,ingredients,steps,allergens,diets,calories_kcal,tip,import_pending,allergens_reviewed,published,source_reference,yield_label,calorie_basis,difficulty) VALUES ('67c7e343-794e-4f58-aeb0-5177c93430a9','pdf:recipe:22','Panqueca de farinha de arroz com legumes',ARRAY['snack']::text[],25,4,ARRAY['1 ovo','½ xícara de farinha de arroz','½ xícara de água','1 colher de sopa de azeite','½ cenoura pequena ralada','2 colheres de sopa de cheiro-verde','Sal a gosto.']::text[],ARRAY['Bata o ovo, a farinha de arroz, a água e o azeite até obter uma massa lisa.','Acrescente a cenoura, o cheiro-verde e o sal.','Aqueça uma frigideira antiaderente.','Coloque pequenas porções da massa e espalhe formando discos.','Cozinhe em fogo baixo até firmar e vire para dourar o outro lado.','Repita o processo até terminar a massa.']::text[],ARRAY['egg']::text[],ARRAY['vegetarian','lactose_free','gluten_free']::text[],null,'Rendimento: 4 unidades
Tempo de preparo: 25 minutos
Receita adaptada de preparações sem glúten do portal
Receitas Nestlé.
Aviso sobre alergênicos: contém ovo. A receita não utiliza trigo ou ingredientes
com glúten na formulação proposta. Verifique os rótulos e a possibilidade de
contaminação cruzada.',null,true,true,'Receita adaptada de preparações sem glúten do portal Receitas Nestlé. — Conteúdo_Allivia.pdf, página 22','4 unidades','por unidade','Fácil') ON CONFLICT(source_key) DO UPDATE SET title=excluded.title,meal_types=excluded.meal_types,ready_in_minutes=excluded.ready_in_minutes,servings=excluded.servings,ingredients=excluded.ingredients,steps=excluded.steps,allergens=excluded.allergens,diets=excluded.diets,calories_kcal=excluded.calories_kcal,tip=excluded.tip,import_pending=excluded.import_pending,allergens_reviewed=excluded.allergens_reviewed,published=excluded.published,source_reference=excluded.source_reference,yield_label=excluded.yield_label,calorie_basis=excluded.calorie_basis,difficulty=excluded.difficulty;
DO $$ BEGIN
    IF (SELECT count(*) FROM public.recipes WHERE lower(extensions.unaccent(title)) = lower(extensions.unaccent('Homus com palitos de cenoura e pepino'))) > 1 THEN
      RAISE EXCEPTION 'Mais de um registro corresponde a %; resolva a duplicação antes de importar', 'Homus com palitos de cenoura e pepino';
    END IF;
    UPDATE public.recipes SET source_key = 'pdf:recipe:24' WHERE source_key IS NULL AND lower(extensions.unaccent(title)) = lower(extensions.unaccent('Homus com palitos de cenoura e pepino'));
  END $$;
INSERT INTO public.recipes(id,source_key,title,meal_types,ready_in_minutes,servings,ingredients,steps,allergens,diets,calories_kcal,tip,import_pending,allergens_reviewed,published,source_reference,yield_label,calorie_basis,difficulty) VALUES ('151cdf3f-6ddd-4e97-a988-332ff52d310d','pdf:recipe:24','Homus com palitos de cenoura e pepino',ARRAY['snack']::text[],15,2,ARRAY['1 xícara de grão-de-bico cozido','1 colher de sopa de azeite','Suco de ½ limão','1 dente pequeno de alho','2 a 4 colheres de sopa de água','Sal a gosto','1 cenoura cortada em palitos','½ pepino cortado em palitos.']::text[],ARRAY['Coloque o grão-de-bico, o azeite, o limão e o alho no processador.','Acrescente a água aos poucos e bata até obter uma pasta cremosa.','Tempere com sal a gosto.','Transfira o homus para um recipiente.','Sirva acompanhado dos palitos de cenoura e pepino.']::text[],ARRAY[]::text[],ARRAY['vegetarian','vegan','lactose_free','gluten_free']::text[],null,'Rendimento: 2 porções
Tempo de preparo: 15 minutos
Receita adaptada de preparações vegetais do portal
Receitas Nestlé.
Aviso sobre alergênicos: contém grão-de-bico, uma leguminosa que pode
provocar reações em pessoas sensíveis. A formulação não utiliza ingredientes de
origem animal, mas os rótulos devem ser verificados.',null,true,true,'Receita adaptada de preparações vegetais do portal Receitas Nestlé. — Conteúdo_Allivia.pdf, página 24','2 porções','por porção','Fácil') ON CONFLICT(source_key) DO UPDATE SET title=excluded.title,meal_types=excluded.meal_types,ready_in_minutes=excluded.ready_in_minutes,servings=excluded.servings,ingredients=excluded.ingredients,steps=excluded.steps,allergens=excluded.allergens,diets=excluded.diets,calories_kcal=excluded.calories_kcal,tip=excluded.tip,import_pending=excluded.import_pending,allergens_reviewed=excluded.allergens_reviewed,published=excluded.published,source_reference=excluded.source_reference,yield_label=excluded.yield_label,calorie_basis=excluded.calorie_basis,difficulty=excluded.difficulty;
DO $$ BEGIN
    IF (SELECT count(*) FROM public.recipes WHERE lower(extensions.unaccent(title)) = lower(extensions.unaccent('Torrada com pasta de abacate e tomate'))) > 1 THEN
      RAISE EXCEPTION 'Mais de um registro corresponde a %; resolva a duplicação antes de importar', 'Torrada com pasta de abacate e tomate';
    END IF;
    UPDATE public.recipes SET source_key = 'pdf:recipe:27' WHERE source_key IS NULL AND lower(extensions.unaccent(title)) = lower(extensions.unaccent('Torrada com pasta de abacate e tomate'));
  END $$;
INSERT INTO public.recipes(id,source_key,title,meal_types,ready_in_minutes,servings,ingredients,steps,allergens,diets,calories_kcal,tip,import_pending,allergens_reviewed,published,source_reference,yield_label,calorie_basis,difficulty) VALUES ('ca5ab89b-7a9c-4792-a52d-5352d328dc19','pdf:recipe:27','Torrada com pasta de abacate e tomate',ARRAY['snack']::text[],10,2,ARRAY['2 fatias de pão vegano','½ abacate pequeno','1 tomate pequeno picado','Suco de ½ limão','1 colher de chá de azeite','Sal e orégano a gosto.']::text[],ARRAY['Amasse o abacate com um garfo.','Acrescente o suco de limão, o azeite, o sal e o orégano.','Misture até formar uma pasta cremosa.','Torre levemente as fatias de pão.','Espalhe a pasta de abacate sobre as torradas.','Finalize com o tomate picado e sirva.']::text[],ARRAY['gluten']::text[],ARRAY['vegetarian','vegan','lactose_free']::text[],null,'Rendimento: 2 porções
Tempo de preparo: 10 minutos
Receita adaptada de preparações vegetais do portal
Receitas Nestlé.
Aviso sobre alergênicos: contém abacate. Verifique se o pão é realmente vegano
e confira os rótulos para identificar possíveis alergênicos e contaminação cruzada.',null,true,true,'Receita adaptada de preparações vegetais do portal Receitas Nestlé. — Conteúdo_Allivia.pdf, página 27','2 porções','por porção','Fácil') ON CONFLICT(source_key) DO UPDATE SET title=excluded.title,meal_types=excluded.meal_types,ready_in_minutes=excluded.ready_in_minutes,servings=excluded.servings,ingredients=excluded.ingredients,steps=excluded.steps,allergens=excluded.allergens,diets=excluded.diets,calories_kcal=excluded.calories_kcal,tip=excluded.tip,import_pending=excluded.import_pending,allergens_reviewed=excluded.allergens_reviewed,published=excluded.published,source_reference=excluded.source_reference,yield_label=excluded.yield_label,calorie_basis=excluded.calorie_basis,difficulty=excluded.difficulty;
DO $$ BEGIN
    IF (SELECT count(*) FROM public.recipes WHERE lower(extensions.unaccent(title)) = lower(extensions.unaccent('Lasanha de abobrinha e beringela'))) > 1 THEN
      RAISE EXCEPTION 'Mais de um registro corresponde a %; resolva a duplicação antes de importar', 'Lasanha de abobrinha e beringela';
    END IF;
    UPDATE public.recipes SET source_key = 'pdf:recipe:28' WHERE source_key IS NULL AND lower(extensions.unaccent(title)) = lower(extensions.unaccent('Lasanha de abobrinha e beringela'));
  END $$;
INSERT INTO public.recipes(id,source_key,title,meal_types,ready_in_minutes,servings,ingredients,steps,allergens,diets,calories_kcal,tip,import_pending,allergens_reviewed,published,source_reference,yield_label,calorie_basis,difficulty) VALUES ('e5976cb5-c9cd-4843-aaef-b4c813e05c65','pdf:recipe:28','Lasanha de abobrinha e beringela',ARRAY['lunch']::text[],50,4,ARRAY['1 abobrinha média','1 berinjela média','2 xícaras de molho de tomate','150 g de queijo muçarela ralado','1 colher de sopa de azeite','1 dente de alho picado','Sal, orégano e manjericão a gosto.']::text[],ARRAY['Corte a abobrinha e a berinjela em fatias finas.','Refogue o alho no azeite e acrescente o molho de tomate.','Em um refratário, monte camadas alternadas de legumes, molho e  muçarela.','Leve ao forno preaquecido a 200 °C por aproximadamente 30 minutos,  até os legumes ficarem macios e o queijo derretido.']::text[],ARRAY['milk']::text[],ARRAY['vegetarian','gluten_free']::text[],230,'Rendimento: 4 porções
Tempo: 50 minutos
Receitas Nestlé  Receitas vegetarianas e veganas.
Aviso sobre alergênicos: contém leite e derivados devido à muçarela. Não é
adequada para pessoas com alergia à proteína do leite. Verifique os rótulos do
molho e dos demais ingredientes.',null,true,true,'Receitas Nestlé Receitas vegetarianas e veganas. — Conteúdo_Allivia.pdf, página 28','4 porções','por porção','Média') ON CONFLICT(source_key) DO UPDATE SET title=excluded.title,meal_types=excluded.meal_types,ready_in_minutes=excluded.ready_in_minutes,servings=excluded.servings,ingredients=excluded.ingredients,steps=excluded.steps,allergens=excluded.allergens,diets=excluded.diets,calories_kcal=excluded.calories_kcal,tip=excluded.tip,import_pending=excluded.import_pending,allergens_reviewed=excluded.allergens_reviewed,published=excluded.published,source_reference=excluded.source_reference,yield_label=excluded.yield_label,calorie_basis=excluded.calorie_basis,difficulty=excluded.difficulty;
DO $$ BEGIN
    IF (SELECT count(*) FROM public.recipes WHERE lower(extensions.unaccent(title)) = lower(extensions.unaccent('Strogonoff de palmito e cogumelo'))) > 1 THEN
      RAISE EXCEPTION 'Mais de um registro corresponde a %; resolva a duplicação antes de importar', 'Strogonoff de palmito e cogumelo';
    END IF;
    UPDATE public.recipes SET source_key = 'pdf:recipe:29' WHERE source_key IS NULL AND lower(extensions.unaccent(title)) = lower(extensions.unaccent('Strogonoff de palmito e cogumelo'));
  END $$;
INSERT INTO public.recipes(id,source_key,title,meal_types,ready_in_minutes,servings,ingredients,steps,allergens,diets,calories_kcal,tip,import_pending,allergens_reviewed,published,source_reference,yield_label,calorie_basis,difficulty) VALUES ('11cf7bfe-2de6-45c0-a949-acf4bb964522','pdf:recipe:29','Strogonoff de palmito e cogumelo',ARRAY['lunch']::text[],30,4,ARRAY['2 xícaras de palmito picado','200 g de cogumelos fatiados','1 cebola pequena picada','1 dente de alho picado','2 tomates picados','1 colher de sopa de azeite','200 g de creme de leite','1 colher de sopa de mostarda','Sal e pimenta a gosto.']::text[],ARRAY['Refogue a cebola e o alho no azeite.','Acrescente os cogumelos e o palmito e refogue por alguns minutos.','Adicione os tomates e a mostarda e cozinhe até formar um molho.','Misture o creme de leite, aqueça sem deixar ferver e sirva.']::text[],ARRAY['milk']::text[],ARRAY['vegetarian','gluten_free']::text[],null,'Rendimento: 4 porções
Tempo de preparo: 30 minutos
Receitas Nestlé  Receitas vegetarianas e veganas.
Aviso sobre alergênicos: contém leite e derivados devido ao creme de leite. A
mostarda também pode provocar reações em pessoas sensíveis a esse ingrediente.
Confira os rótulos dos produtos utilizados.',null,true,true,'Receitas Nestlé Receitas vegetarianas e veganas. — Conteúdo_Allivia.pdf, página 29','4 porções','por porção','Fácil') ON CONFLICT(source_key) DO UPDATE SET title=excluded.title,meal_types=excluded.meal_types,ready_in_minutes=excluded.ready_in_minutes,servings=excluded.servings,ingredients=excluded.ingredients,steps=excluded.steps,allergens=excluded.allergens,diets=excluded.diets,calories_kcal=excluded.calories_kcal,tip=excluded.tip,import_pending=excluded.import_pending,allergens_reviewed=excluded.allergens_reviewed,published=excluded.published,source_reference=excluded.source_reference,yield_label=excluded.yield_label,calorie_basis=excluded.calorie_basis,difficulty=excluded.difficulty;
DO $$ BEGIN
    IF (SELECT count(*) FROM public.recipes WHERE lower(extensions.unaccent(title)) = lower(extensions.unaccent('Abobrinha recheada com ricota e espinafre'))) > 1 THEN
      RAISE EXCEPTION 'Mais de um registro corresponde a %; resolva a duplicação antes de importar', 'Abobrinha recheada com ricota e espinafre';
    END IF;
    UPDATE public.recipes SET source_key = 'pdf:recipe:30' WHERE source_key IS NULL AND lower(extensions.unaccent(title)) = lower(extensions.unaccent('Abobrinha recheada com ricota e espinafre'));
  END $$;
INSERT INTO public.recipes(id,source_key,title,meal_types,ready_in_minutes,servings,ingredients,steps,allergens,diets,calories_kcal,tip,import_pending,allergens_reviewed,published,source_reference,yield_label,calorie_basis,difficulty) VALUES ('300f05fa-79a7-41b8-ae2c-142c13a9de21','pdf:recipe:30','Abobrinha recheada com ricota e espinafre',ARRAY['lunch']::text[],40,4,ARRAY['2 abobrinhas médias','200 g de cogumelos fatiados','200 g de ricota','1 xícara de espinafre picado','1 tomate picado','1 dente de alho','1 colher (sopa) de azeite','Sal e orégano a gosto']::text[],ARRAY['Corte as abobrinhas ao meio no sentido do comprimento e retire parte  do miolo.','Refogue o alho e o espinafre no azeite. Misture com a ricota, o tomate,  cogumelo e os temperos.','Recheie as abobrinhas e coloque em uma assadeira.','Asse a 180 °C por cerca de 25 minutos, até ficarem macias.']::text[],ARRAY['milk']::text[],ARRAY['vegetarian','gluten_free']::text[],null,'Rendimento: 4 porções
Tempo de preparo:40 min
Receitas Nestlé  Receitas vegetarianas e veganas.
Aviso sobre alergênicos: contém leite devido à ricota. Não é indicada para
pessoas com alergia à proteína do leite.',null,true,true,'Receitas Nestlé Receitas vegetarianas e veganas. — Conteúdo_Allivia.pdf, página 30','4 porções','por porção','fácil') ON CONFLICT(source_key) DO UPDATE SET title=excluded.title,meal_types=excluded.meal_types,ready_in_minutes=excluded.ready_in_minutes,servings=excluded.servings,ingredients=excluded.ingredients,steps=excluded.steps,allergens=excluded.allergens,diets=excluded.diets,calories_kcal=excluded.calories_kcal,tip=excluded.tip,import_pending=excluded.import_pending,allergens_reviewed=excluded.allergens_reviewed,published=excluded.published,source_reference=excluded.source_reference,yield_label=excluded.yield_label,calorie_basis=excluded.calorie_basis,difficulty=excluded.difficulty;
DO $$ BEGIN
    IF (SELECT count(*) FROM public.recipes WHERE lower(extensions.unaccent(title)) = lower(extensions.unaccent('Torta de legumes no liquidificador'))) > 1 THEN
      RAISE EXCEPTION 'Mais de um registro corresponde a %; resolva a duplicação antes de importar', 'Torta de legumes no liquidificador';
    END IF;
    UPDATE public.recipes SET source_key = 'pdf:recipe:31' WHERE source_key IS NULL AND lower(extensions.unaccent(title)) = lower(extensions.unaccent('Torta de legumes no liquidificador'));
  END $$;
INSERT INTO public.recipes(id,source_key,title,meal_types,ready_in_minutes,servings,ingredients,steps,allergens,diets,calories_kcal,tip,import_pending,allergens_reviewed,published,source_reference,yield_label,calorie_basis,difficulty) VALUES ('89758e60-d86f-432a-a56f-c7920515a283','pdf:recipe:31','Torta de legumes no liquidificador',ARRAY['lunch']::text[],45,6,ARRAY['2 ovos','1 xícara de leite','1½ xícara de farinha de trigo','4 colheres de sopa de óleo','1 colher de sopa de fermento químico','1 xícara de brócolis picado','½ lata de milho verde','½ lata de ervilha','1 tomate picado','½ cenoura ralada','100 g de queijo muçarela','Sal e orégano a gosto.']::text[],ARRAY['Bata os ovos, o leite, o óleo e a farinha no liquidificador até obter uma  massa homogênea.','Acrescente o fermento e misture delicadamente.','Coloque metade da massa em uma forma untada, distribua os  legumes e o queijo e cubra com o restante da massa.','Leve ao forno preaquecido a 180 °C por aproximadamente 35 a 40  minutos, até dourar.']::text[],ARRAY['milk','egg','gluten']::text[],ARRAY['vegetarian']::text[],null,'Rendimento: 6 porções
Tempo de preparo: 45 minutos
Receitas Nestlé  Receitas vegetarianas e veganas.
Aviso sobre alergênicos: contém ovo, leite e trigo, que contém glúten. Não é
adequada para pessoas alérgicas a esses ingredientes. Verifique também a
composição do fermento químico.',null,true,true,'Receitas Nestlé Receitas vegetarianas e veganas. — Conteúdo_Allivia.pdf, página 31','6 porções','por porção','Fácil') ON CONFLICT(source_key) DO UPDATE SET title=excluded.title,meal_types=excluded.meal_types,ready_in_minutes=excluded.ready_in_minutes,servings=excluded.servings,ingredients=excluded.ingredients,steps=excluded.steps,allergens=excluded.allergens,diets=excluded.diets,calories_kcal=excluded.calories_kcal,tip=excluded.tip,import_pending=excluded.import_pending,allergens_reviewed=excluded.allergens_reviewed,published=excluded.published,source_reference=excluded.source_reference,yield_label=excluded.yield_label,calorie_basis=excluded.calorie_basis,difficulty=excluded.difficulty;
DO $$ BEGIN
    IF (SELECT count(*) FROM public.recipes WHERE lower(extensions.unaccent(title)) = lower(extensions.unaccent('Escondidinho de carne moída com batata'))) > 1 THEN
      RAISE EXCEPTION 'Mais de um registro corresponde a %; resolva a duplicação antes de importar', 'Escondidinho de carne moída com batata';
    END IF;
    UPDATE public.recipes SET source_key = 'pdf:recipe:32' WHERE source_key IS NULL AND lower(extensions.unaccent(title)) = lower(extensions.unaccent('Escondidinho de carne moída com batata'));
  END $$;
INSERT INTO public.recipes(id,source_key,title,meal_types,ready_in_minutes,servings,ingredients,steps,allergens,diets,calories_kcal,tip,import_pending,allergens_reviewed,published,source_reference,yield_label,calorie_basis,difficulty) VALUES ('4b911d7c-79e1-409a-aff0-0a34bd958b5e','pdf:recipe:32','Escondidinho de carne moída com batata',ARRAY['lunch']::text[],50,4,ARRAY['500 g de batatas','300 g de carne moída','1 tomate picado','½ cebola picada','1 dente de alho','2 colheres de sopa de azeite','½ xícara de água','Sal, pimenta e cheiro-verde a gosto.']::text[],ARRAY['Cozinhe as batatas até ficarem macias e amasse-as com um pouco da  água do cozimento.','Refogue a cebola e o alho com uma colher de azeite e acrescente a  carne moída.','Adicione o tomate, a água e os temperos. Cozinhe até a carne estar  completamente cozida.','Em um refratário, espalhe a carne e cubra com o purê de batatas.','Regue com o restante do azeite e leve ao forno preaquecido a 200 °C  por aproximadamente 15 minutos.']::text[],ARRAY[]::text[],ARRAY['lactose_free','gluten_free']::text[],null,'Rendimento: 4 porções
Tempo de preparo: 50 minutos
Receitas Nestlé  Receitas sem lactose.
Aviso sobre alergênicos: a receita não contém leite ou derivados adicionados.
Verifique os temperos industrializados e os demais ingredientes para evitar
possíveis fontes de alergênicos e contaminação cruzada.',null,true,true,'Receitas Nestlé Receitas sem lactose. — Conteúdo_Allivia.pdf, página 32','4 porções','por porção','Médio') ON CONFLICT(source_key) DO UPDATE SET title=excluded.title,meal_types=excluded.meal_types,ready_in_minutes=excluded.ready_in_minutes,servings=excluded.servings,ingredients=excluded.ingredients,steps=excluded.steps,allergens=excluded.allergens,diets=excluded.diets,calories_kcal=excluded.calories_kcal,tip=excluded.tip,import_pending=excluded.import_pending,allergens_reviewed=excluded.allergens_reviewed,published=excluded.published,source_reference=excluded.source_reference,yield_label=excluded.yield_label,calorie_basis=excluded.calorie_basis,difficulty=excluded.difficulty;
DO $$ BEGIN
    IF (SELECT count(*) FROM public.recipes WHERE lower(extensions.unaccent(title)) = lower(extensions.unaccent('Ratatouille de legumes'))) > 1 THEN
      RAISE EXCEPTION 'Mais de um registro corresponde a %; resolva a duplicação antes de importar', 'Ratatouille de legumes';
    END IF;
    UPDATE public.recipes SET source_key = 'pdf:recipe:33' WHERE source_key IS NULL AND lower(extensions.unaccent(title)) = lower(extensions.unaccent('Ratatouille de legumes'));
  END $$;
INSERT INTO public.recipes(id,source_key,title,meal_types,ready_in_minutes,servings,ingredients,steps,allergens,diets,calories_kcal,tip,import_pending,allergens_reviewed,published,source_reference,yield_label,calorie_basis,difficulty) VALUES ('f0839230-c6bf-4d4c-a997-722486cefa50','pdf:recipe:33','Ratatouille de legumes',ARRAY['lunch']::text[],50,4,ARRAY['1 berinjela média','1 abobrinha média','2 tomates','1 pimentão','½ cebola','2 colheres de sopa de azeite','1 dente de alho','Orégano e sal a gosto']::text[],ARRAY['Preaqueça o forno a 200 °C.','Lave os legumes e corte-os em rodelas ou cubos.','Distribua os legumes em um refratário.','Acrescente a cebola, o alho, o azeite e os temperos.','Misture delicadamente e cubra o refratário com papel-alumínio.','Asse por cerca de 30 minutos. Retire o papel e asse por mais 10 a 15  minutos, até os legumes ficarem macios.']::text[],ARRAY[]::text[],ARRAY['vegetarian','vegan','lactose_free','gluten_free']::text[],120,'Rendimento: 4 porções
Tempo: 50 minutos
Receitas Nestlé  preparações vegetarianas e
veganas
Alergênicos: não há ingredientes dos principais alérgenos alimentares
intencionalmente adicionados nesta formulação. Isso não exclui alergias individuais
aos próprios vegetais nem a possibilidade de contaminação cruzada.',null,true,true,'Receitas Nestlé preparações vegetarianas e veganas — Conteúdo_Allivia.pdf, página 33','4 porções','por porção','Fácil') ON CONFLICT(source_key) DO UPDATE SET title=excluded.title,meal_types=excluded.meal_types,ready_in_minutes=excluded.ready_in_minutes,servings=excluded.servings,ingredients=excluded.ingredients,steps=excluded.steps,allergens=excluded.allergens,diets=excluded.diets,calories_kcal=excluded.calories_kcal,tip=excluded.tip,import_pending=excluded.import_pending,allergens_reviewed=excluded.allergens_reviewed,published=excluded.published,source_reference=excluded.source_reference,yield_label=excluded.yield_label,calorie_basis=excluded.calorie_basis,difficulty=excluded.difficulty;
DO $$ BEGIN
    IF (SELECT count(*) FROM public.recipes WHERE lower(extensions.unaccent(title)) = lower(extensions.unaccent('Paella vegana'))) > 1 THEN
      RAISE EXCEPTION 'Mais de um registro corresponde a %; resolva a duplicação antes de importar', 'Paella vegana';
    END IF;
    UPDATE public.recipes SET source_key = 'pdf:recipe:34' WHERE source_key IS NULL AND lower(extensions.unaccent(title)) = lower(extensions.unaccent('Paella vegana'));
  END $$;
INSERT INTO public.recipes(id,source_key,title,meal_types,ready_in_minutes,servings,ingredients,steps,allergens,diets,calories_kcal,tip,import_pending,allergens_reviewed,published,source_reference,yield_label,calorie_basis,difficulty) VALUES ('9465a1dd-6af7-4515-af0d-902d6b508e9a','pdf:recipe:34','Paella vegana',ARRAY['lunch']::text[],45,4,ARRAY['1 xícara de arroz','1 xícara de proteína texturizada de soja hidratada','1 cebola pequena','2 dentes de alho','1 pimentão vermelho','1 pimentão amarelo','2 tomates picados','½ xícara de ervilha','1 colher de sopa de azeite','Páprica, açafrão e sal a gosto','Aproximadamente 3 xícaras de água ou caldo de legumes adequado.']::text[],ARRAY['Hidrate a proteína de soja conforme as instruções da embalagem e  escorra bem.','Refogue a cebola, o alho, os pimentões e a proteína de soja no  azeite.','Acrescente o arroz, os tomates, a ervilha e os temperos.','Adicione a água quente e cozinhe em fogo baixo até o arroz ficar  macio e o líquido ser absorvido.']::text[],ARRAY['soy']::text[],ARRAY['vegetarian','vegan','lactose_free','gluten_free']::text[],null,'Rendimento: 4 porções
Tempo de preparo: 45 minutos
Receitas Nestlé  Receitas vegetarianas e veganas.
Aviso sobre alergênicos: contém soja. Não é adequada para pessoas com alergia
à soja. Verifique o caldo de legumes e os demais produtos utilizados para confirmar
que são veganos e adequados às alergias cadastradas.',null,true,true,'Receitas Nestlé Receitas vegetarianas e veganas. — Conteúdo_Allivia.pdf, página 34','4 porções','por porção','Médio') ON CONFLICT(source_key) DO UPDATE SET title=excluded.title,meal_types=excluded.meal_types,ready_in_minutes=excluded.ready_in_minutes,servings=excluded.servings,ingredients=excluded.ingredients,steps=excluded.steps,allergens=excluded.allergens,diets=excluded.diets,calories_kcal=excluded.calories_kcal,tip=excluded.tip,import_pending=excluded.import_pending,allergens_reviewed=excluded.allergens_reviewed,published=excluded.published,source_reference=excluded.source_reference,yield_label=excluded.yield_label,calorie_basis=excluded.calorie_basis,difficulty=excluded.difficulty;
DO $$ BEGIN
    IF (SELECT count(*) FROM public.recipes WHERE lower(extensions.unaccent(title)) = lower(extensions.unaccent('Mousse de maracujá'))) > 1 THEN
      RAISE EXCEPTION 'Mais de um registro corresponde a %; resolva a duplicação antes de importar', 'Mousse de maracujá';
    END IF;
    UPDATE public.recipes SET source_key = 'pdf:recipe:48' WHERE source_key IS NULL AND lower(extensions.unaccent(title)) = lower(extensions.unaccent('Mousse de maracujá'));
  END $$;
INSERT INTO public.recipes(id,source_key,title,meal_types,ready_in_minutes,servings,ingredients,steps,allergens,diets,calories_kcal,tip,import_pending,allergens_reviewed,published,source_reference,yield_label,calorie_basis,difficulty) VALUES ('ec5b42ec-009c-4d4f-a575-c541eb0c49fb','pdf:recipe:48','Mousse de maracujá',ARRAY['dessert']::text[],195,6,ARRAY['1 lata de leite condensado (395 g)','1 caixa de creme de leite (200 g)','200 ml de suco concentrado de maracujá','Polpa de 1 maracujá para decorar (opcional)']::text[],ARRAY['Coloque o leite condensado, o creme de leite e o suco de maracujá no  liquidificador.','Bata por aproximadamente 2 minutos, até obter uma mistura cremosa.','Distribua em potinhos individuais.','Leve à geladeira por pelo menos 3 horas.','Decore com a polpa do maracujá antes de servir.']::text[],ARRAY['milk']::text[],ARRAY['vegetarian','gluten_free']::text[],230,'Rendimento: 6 porções
Tempo de preparo: 15 minutos + 3 horas de geladeira
Receitas de sobremesas  Receitas Nestlé.
Aviso sobre alergênicos: contém leite e derivados. Verifique os rótulos dos
ingredientes utilizados.',null,true,true,'Receitas de sobremesas Receitas Nestlé. — Conteúdo_Allivia.pdf, página 48','6 porções','por porção','fácil') ON CONFLICT(source_key) DO UPDATE SET title=excluded.title,meal_types=excluded.meal_types,ready_in_minutes=excluded.ready_in_minutes,servings=excluded.servings,ingredients=excluded.ingredients,steps=excluded.steps,allergens=excluded.allergens,diets=excluded.diets,calories_kcal=excluded.calories_kcal,tip=excluded.tip,import_pending=excluded.import_pending,allergens_reviewed=excluded.allergens_reviewed,published=excluded.published,source_reference=excluded.source_reference,yield_label=excluded.yield_label,calorie_basis=excluded.calorie_basis,difficulty=excluded.difficulty;
DO $$ BEGIN
    IF (SELECT count(*) FROM public.recipes WHERE lower(extensions.unaccent(title)) = lower(extensions.unaccent('Brownie de chocolate'))) > 1 THEN
      RAISE EXCEPTION 'Mais de um registro corresponde a %; resolva a duplicação antes de importar', 'Brownie de chocolate';
    END IF;
    UPDATE public.recipes SET source_key = 'pdf:recipe:49' WHERE source_key IS NULL AND lower(extensions.unaccent(title)) = lower(extensions.unaccent('Brownie de chocolate'));
  END $$;
INSERT INTO public.recipes(id,source_key,title,meal_types,ready_in_minutes,servings,ingredients,steps,allergens,diets,calories_kcal,tip,import_pending,allergens_reviewed,published,source_reference,yield_label,calorie_basis,difficulty) VALUES ('88797b6b-b2db-4b6a-a078-766408c6825c','pdf:recipe:49','Brownie de chocolate',ARRAY['dessert']::text[],40,9,ARRAY['150 g de chocolate meio amargo','100 g de manteiga','3 ovos','3/4 de xícara de açúcar','1/2 xícara de farinha de trigo','2 colheres (sopa) de chocolate em pó']::text[],ARRAY['Derreta o chocolate com a manteiga em banho-maria ou no micro- ondas.','Em outro recipiente, misture os ovos e o açúcar.','Acrescente o chocolate derretido e mexa bem.','Adicione a farinha e o chocolate em pó, misturando até formar uma  massa homogênea.','Despeje em uma forma pequena untada.','Asse em forno preaquecido a 180 °C por aproximadamente 20 a 25  minutos.','Espere esfriar antes de cortar.']::text[],ARRAY['milk','egg','gluten']::text[],ARRAY['vegetarian']::text[],250,'Rendimento: 9 porções
Tempo de preparo: 40 minutos
Receitas de sobremesas  Receitas Nestlé.
Aviso sobre alergênicos: contém leite, ovos e trigo (glúten). O chocolate também
pode conter outros alergênicos, conforme o fabricante.',null,true,true,'Receitas de sobremesas Receitas Nestlé. — Conteúdo_Allivia.pdf, página 49','9 porções','por porção','fácil') ON CONFLICT(source_key) DO UPDATE SET title=excluded.title,meal_types=excluded.meal_types,ready_in_minutes=excluded.ready_in_minutes,servings=excluded.servings,ingredients=excluded.ingredients,steps=excluded.steps,allergens=excluded.allergens,diets=excluded.diets,calories_kcal=excluded.calories_kcal,tip=excluded.tip,import_pending=excluded.import_pending,allergens_reviewed=excluded.allergens_reviewed,published=excluded.published,source_reference=excluded.source_reference,yield_label=excluded.yield_label,calorie_basis=excluded.calorie_basis,difficulty=excluded.difficulty;
DO $$ BEGIN
    IF (SELECT count(*) FROM public.recipes WHERE lower(extensions.unaccent(title)) = lower(extensions.unaccent('Pudim de leite condensado'))) > 1 THEN
      RAISE EXCEPTION 'Mais de um registro corresponde a %; resolva a duplicação antes de importar', 'Pudim de leite condensado';
    END IF;
    UPDATE public.recipes SET source_key = 'pdf:recipe:50' WHERE source_key IS NULL AND lower(extensions.unaccent(title)) = lower(extensions.unaccent('Pudim de leite condensado'));
  END $$;
INSERT INTO public.recipes(id,source_key,title,meal_types,ready_in_minutes,servings,ingredients,steps,allergens,diets,calories_kcal,tip,import_pending,allergens_reviewed,published,source_reference,yield_label,calorie_basis,difficulty) VALUES ('0d39e5fa-75c8-4ae1-a9dc-f70eccf12a70','pdf:recipe:50','Pudim de leite condensado',ARRAY['dessert']::text[],240,10,ARRAY['1 lata de leite condensado (395 g)','2 medidas da lata de leite','3 ovos','1 xícara de açúcar','1/2 xícara de água quente']::text[],ARRAY['Derreta o açúcar em uma panela até formar um caramelo dourado.','Adicione a água quente cuidadosamente e mexa até dissolver os  torrões.','Despeje a calda em uma forma de pudim.','Bata o leite condensado, o leite e os ovos no liquidificador.','Coloque a mistura na forma caramelizada.','Asse em banho-maria, a 180 °C, por aproximadamente 50 a 60  minutos, até firmar.','Deixe esfriar e leve à geladeira por pelo menos 3 horas antes de  desenformar.']::text[],ARRAY['milk','egg']::text[],ARRAY['vegetarian','gluten_free']::text[],280,'Rendimento: 10 porções
Tempo de preparo: 1 hora + 3 horas de geladeira
Receitas de sobremesas  Receitas Nestlé.
Aviso sobre alergênicos: contém leite e ovos. Não é indicado para pessoas com
alergia a esses ingredientes.',null,true,true,'Receitas de sobremesas Receitas Nestlé. — Conteúdo_Allivia.pdf, página 50','10 porções','por porção','média') ON CONFLICT(source_key) DO UPDATE SET title=excluded.title,meal_types=excluded.meal_types,ready_in_minutes=excluded.ready_in_minutes,servings=excluded.servings,ingredients=excluded.ingredients,steps=excluded.steps,allergens=excluded.allergens,diets=excluded.diets,calories_kcal=excluded.calories_kcal,tip=excluded.tip,import_pending=excluded.import_pending,allergens_reviewed=excluded.allergens_reviewed,published=excluded.published,source_reference=excluded.source_reference,yield_label=excluded.yield_label,calorie_basis=excluded.calorie_basis,difficulty=excluded.difficulty;
DO $$ BEGIN
    IF (SELECT count(*) FROM public.recipes WHERE lower(extensions.unaccent(title)) = lower(extensions.unaccent('Mousse de chocolate'))) > 1 THEN
      RAISE EXCEPTION 'Mais de um registro corresponde a %; resolva a duplicação antes de importar', 'Mousse de chocolate';
    END IF;
    UPDATE public.recipes SET source_key = 'pdf:recipe:51' WHERE source_key IS NULL AND lower(extensions.unaccent(title)) = lower(extensions.unaccent('Mousse de chocolate'));
  END $$;
INSERT INTO public.recipes(id,source_key,title,meal_types,ready_in_minutes,servings,ingredients,steps,allergens,diets,calories_kcal,tip,import_pending,allergens_reviewed,published,source_reference,yield_label,calorie_basis,difficulty) VALUES ('5e83c34b-3bab-41da-ad96-38a29c932559','pdf:recipe:51','Mousse de chocolate',ARRAY['dessert']::text[],200,4,ARRAY['200 g de chocolate amargo sem lactose','200 ml de creme vegetal para bater, certificado sem lactose','2 claras de ovo','2 colheres (sopa) de açúcar']::text[],ARRAY['Derreta o chocolate e deixe amornar.','Bata o creme vegetal conforme as instruções da embalagem.','Em outro recipiente, bata as claras até formar picos firmes e adicione o  açúcar aos poucos.','Misture delicadamente o chocolate ao creme vegetal.','Incorpore as claras em movimentos suaves.','Distribua em potinhos e leve à geladeira por pelo menos 3 horas.']::text[],ARRAY['egg','milk']::text[],ARRAY['vegetarian','lactose_free','gluten_free']::text[],220,'Rendimento: 4 porções
Tempo de preparo: 20 minutos + 3 horas de geladeira
Receitas sem lactose  Receitas Nestlé.
Aviso sobre alergênicos: a receita é elaborada sem lactose, mas pode conter ovo.
Confira os rótulos do chocolate e do creme vegetal. Produtos sem lactose não são
necessariamente seguros para pessoas com alergia à proteína do leite. Utilize
claras pasteurizadas quando apropriado para preparações sem cocção.',null,true,true,'Receitas sem lactose Receitas Nestlé. — Conteúdo_Allivia.pdf, página 51','4 porções','por porção','fácil') ON CONFLICT(source_key) DO UPDATE SET title=excluded.title,meal_types=excluded.meal_types,ready_in_minutes=excluded.ready_in_minutes,servings=excluded.servings,ingredients=excluded.ingredients,steps=excluded.steps,allergens=excluded.allergens,diets=excluded.diets,calories_kcal=excluded.calories_kcal,tip=excluded.tip,import_pending=excluded.import_pending,allergens_reviewed=excluded.allergens_reviewed,published=excluded.published,source_reference=excluded.source_reference,yield_label=excluded.yield_label,calorie_basis=excluded.calorie_basis,difficulty=excluded.difficulty;
DO $$ BEGIN
    IF (SELECT count(*) FROM public.recipes WHERE lower(extensions.unaccent(title)) = lower(extensions.unaccent('Brigadeiro sem lactose'))) > 1 THEN
      RAISE EXCEPTION 'Mais de um registro corresponde a %; resolva a duplicação antes de importar', 'Brigadeiro sem lactose';
    END IF;
    UPDATE public.recipes SET source_key = 'pdf:recipe:52' WHERE source_key IS NULL AND lower(extensions.unaccent(title)) = lower(extensions.unaccent('Brigadeiro sem lactose'));
  END $$;
INSERT INTO public.recipes(id,source_key,title,meal_types,ready_in_minutes,servings,ingredients,steps,allergens,diets,calories_kcal,tip,import_pending,allergens_reviewed,published,source_reference,yield_label,calorie_basis,difficulty) VALUES ('6ed70168-59e1-4879-ae72-282fb92ce5b2','pdf:recipe:52','Brigadeiro sem lactose',ARRAY['dessert']::text[],25,15,ARRAY['1 lata de leite condensado sem lactose (395 g)','2 colheres (sopa) de chocolate em pó','1 colher (sopa) de creme vegetal sem lactose','Chocolate granulado sem lactose para finalizar']::text[],ARRAY['Em uma panela, misture o leite condensado, o chocolate em pó e o  creme vegetal.','Cozinhe em fogo baixo, mexendo continuamente.','Quando a mistura desgrudar do fundo da panela, desligue o fogo.','Transfira para um prato untado e espere esfriar.','Unte as mãos, modele pequenas bolinhas e passe no granulado.']::text[],ARRAY['milk']::text[],ARRAY['vegetarian','lactose_free','gluten_free']::text[],85,'Rendimento: 15 unidades
Tempo de preparo: 25 minutos
Receitas sem lactose  Receitas Nestlé.
Aviso sobre alergênicos: confira os rótulos do leite condensado, do creme vegetal,
do chocolate e do granulado. A versão sem lactose ainda pode conter proteínas do
leite e não é automaticamente indicada para pessoas com alergia à proteína do
leite.',null,true,true,'Receitas sem lactose Receitas Nestlé. — Conteúdo_Allivia.pdf, página 52','15 unidades','por unidade','fácil') ON CONFLICT(source_key) DO UPDATE SET title=excluded.title,meal_types=excluded.meal_types,ready_in_minutes=excluded.ready_in_minutes,servings=excluded.servings,ingredients=excluded.ingredients,steps=excluded.steps,allergens=excluded.allergens,diets=excluded.diets,calories_kcal=excluded.calories_kcal,tip=excluded.tip,import_pending=excluded.import_pending,allergens_reviewed=excluded.allergens_reviewed,published=excluded.published,source_reference=excluded.source_reference,yield_label=excluded.yield_label,calorie_basis=excluded.calorie_basis,difficulty=excluded.difficulty;
DO $$ BEGIN
    IF (SELECT count(*) FROM public.recipes WHERE lower(extensions.unaccent(title)) = lower(extensions.unaccent('Sorvete de banana e morango'))) > 1 THEN
      RAISE EXCEPTION 'Mais de um registro corresponde a %; resolva a duplicação antes de importar', 'Sorvete de banana e morango';
    END IF;
    UPDATE public.recipes SET source_key = 'pdf:recipe:53' WHERE source_key IS NULL AND lower(extensions.unaccent(title)) = lower(extensions.unaccent('Sorvete de banana e morango'));
  END $$;
INSERT INTO public.recipes(id,source_key,title,meal_types,ready_in_minutes,servings,ingredients,steps,allergens,diets,calories_kcal,tip,import_pending,allergens_reviewed,published,source_reference,yield_label,calorie_basis,difficulty) VALUES ('9b46822d-f3fa-4c33-a959-e56fb88cb3df','pdf:recipe:53','Sorvete de banana e morango',ARRAY['dessert']::text[],130,4,ARRAY['3 bananas maduras congeladas','1 xícara de morangos congelados','2 a 4 colheres (sopa) de água, se necessário']::text[],ARRAY['Corte as bananas e os morangos em pedaços antes de congelar.','Coloque as frutas congeladas no processador ou liquidificador potente.','Bata até obter uma consistência cremosa, adicionando pouca água apenas  se necessário.','Sirva imediatamente como sorvete cremoso ou leve ao congelador por mais 2  horas para uma consistência firme.']::text[],ARRAY[]::text[],ARRAY['vegetarian','vegan','lactose_free','gluten_free']::text[],100,'Rendimento: 4 porções
Tempo de preparo: 10 minutos + 2 horas de congelamento
Receitas sem lactose  Receitas Nestlé.
Aviso sobre alergênicos: a receita não leva leite ou derivados entre os
ingredientes descritos. Confira possíveis advertências de contaminação cruzada nos
produtos utilizados. Contém banana e morango, que podem provocar reações
individuais.',null,true,true,'Receitas sem lactose Receitas Nestlé. — Conteúdo_Allivia.pdf, página 53','4 porções','por porção','fácil') ON CONFLICT(source_key) DO UPDATE SET title=excluded.title,meal_types=excluded.meal_types,ready_in_minutes=excluded.ready_in_minutes,servings=excluded.servings,ingredients=excluded.ingredients,steps=excluded.steps,allergens=excluded.allergens,diets=excluded.diets,calories_kcal=excluded.calories_kcal,tip=excluded.tip,import_pending=excluded.import_pending,allergens_reviewed=excluded.allergens_reviewed,published=excluded.published,source_reference=excluded.source_reference,yield_label=excluded.yield_label,calorie_basis=excluded.calorie_basis,difficulty=excluded.difficulty;
DO $$ BEGIN
    IF (SELECT count(*) FROM public.recipes WHERE lower(extensions.unaccent(title)) = lower(extensions.unaccent('Cocada de forno'))) > 1 THEN
      RAISE EXCEPTION 'Mais de um registro corresponde a %; resolva a duplicação antes de importar', 'Cocada de forno';
    END IF;
    UPDATE public.recipes SET source_key = 'pdf:recipe:54' WHERE source_key IS NULL AND lower(extensions.unaccent(title)) = lower(extensions.unaccent('Cocada de forno'));
  END $$;
INSERT INTO public.recipes(id,source_key,title,meal_types,ready_in_minutes,servings,ingredients,steps,allergens,diets,calories_kcal,tip,import_pending,allergens_reviewed,published,source_reference,yield_label,calorie_basis,difficulty) VALUES ('80887b45-33b0-4578-a65a-c2519fac57e6','pdf:recipe:54','Cocada de forno',ARRAY['dessert']::text[],35,8,ARRAY['2 xícaras de coco ralado','1/2 xícara de açúcar','3 ovos','200 ml de leite de coco','1 colher (sopa) de óleo de coco']::text[],ARRAY['Em uma tigela, misture o coco ralado, o açúcar, os ovos e o leite de  coco.','Unte pequenos refratários com óleo de coco.','Distribua a mistura nos recipientes.','Asse em forno preaquecido a 180 °C por aproximadamente 25  minutos, até dourar.','Espere amornar antes de servir.']::text[],ARRAY['egg']::text[],ARRAY['vegetarian','lactose_free','gluten_free']::text[],210,'Rendimento: 8 porções
Tempo de preparo: 35 minutos
Receitas sem glúten  Receitas Nestlé.
Aviso sobre alergênicos: contém ovos e coco. Embora não leve ingredientes com
glúten, confira os rótulos e evite contaminação cruzada durante o preparo.',null,true,true,'Receitas sem glúten Receitas Nestlé. — Conteúdo_Allivia.pdf, página 54','8 porções','por porção','fácil') ON CONFLICT(source_key) DO UPDATE SET title=excluded.title,meal_types=excluded.meal_types,ready_in_minutes=excluded.ready_in_minutes,servings=excluded.servings,ingredients=excluded.ingredients,steps=excluded.steps,allergens=excluded.allergens,diets=excluded.diets,calories_kcal=excluded.calories_kcal,tip=excluded.tip,import_pending=excluded.import_pending,allergens_reviewed=excluded.allergens_reviewed,published=excluded.published,source_reference=excluded.source_reference,yield_label=excluded.yield_label,calorie_basis=excluded.calorie_basis,difficulty=excluded.difficulty;
DO $$ BEGIN
    IF (SELECT count(*) FROM public.restaurants WHERE lower(extensions.unaccent(name)) = lower(extensions.unaccent('Miga Vegana'))) > 1 THEN
      RAISE EXCEPTION 'Mais de um registro corresponde a %; resolva a duplicação antes de importar', 'Miga Vegana';
    END IF;
    UPDATE public.restaurants SET source_key = 'pdf:restaurant:miga vegana' WHERE source_key IS NULL AND lower(extensions.unaccent(name)) = lower(extensions.unaccent('Miga Vegana'));
  END $$;
INSERT INTO public.restaurants(id,source_key,name,address,cuisine,description,phone,diets,allergen_friendly,allergen_source,active) VALUES ('01003329-9605-0799-4be5-1382a26577a6','pdf:restaurant:miga vegana','Miga Vegana','Rua Naokiti Yamahata, nº 50 Jardim Clementino, Taboão da Serra SP, CEP 06770-060.','vegetarian','A Miga Vegana é um estabelecimento especializado em alimentos de origem vegetal. Trabalha com opções como marmitas, refeições congeladas, tortas, salgados e sobremesas veganas. Pode ser uma alternativa para pessoas que não consomem ingredientes de origem animal. Entretanto, o fato de o estabelecimento ser vegano não significa que todos os produtos sejam livres de soja, oleaginosas ou outros alergênicos. É importante consultar a equipe sobre os ingredientes de cada preparação e os cuidados adotados para evitar a contaminação cruzada.','(11) 97777-3778',ARRAY['vegan','vegetarian','lactose_free']::text[],ARRAY[]::text[],'Conteúdo_Allivia.pdf: declaração do estabelecimento reproduzida no documento; confirmar ingredientes e contaminação cruzada diretamente com a equipe.',true) ON CONFLICT(source_key) DO UPDATE SET name=excluded.name,address=excluded.address,cuisine=excluded.cuisine,description=excluded.description,phone=excluded.phone,diets=excluded.diets,allergen_friendly=excluded.allergen_friendly,allergen_source=excluded.allergen_source,active=excluded.active;
DO $$ BEGIN
    IF (SELECT count(*) FROM public.restaurants WHERE lower(extensions.unaccent(name)) = lower(extensions.unaccent('Cajuveg Queijaria Artesanal'))) > 1 THEN
      RAISE EXCEPTION 'Mais de um registro corresponde a %; resolva a duplicação antes de importar', 'Cajuveg Queijaria Artesanal';
    END IF;
    UPDATE public.restaurants SET source_key = 'pdf:restaurant:cajuveg queijaria artesanal' WHERE source_key IS NULL AND lower(extensions.unaccent(name)) = lower(extensions.unaccent('Cajuveg Queijaria Artesanal'));
  END $$;
INSERT INTO public.restaurants(id,source_key,name,address,cuisine,description,phone,diets,allergen_friendly,allergen_source,active) VALUES ('5902b5fd-be05-05b0-fd62-fa8f7e864103','pdf:restaurant:cajuveg queijaria artesanal','Cajuveg Queijaria Artesanal','Rua Etiópia, Jardim Monte Alegre, Taboão da Serra SP, CEP 06856-080.','vegetarian','A Cajuveg é uma queijaria artesanal especializada em alternativas vegetais aos produtos lácteos. Entre os produtos oferecidos estão opções semelhantes a queijos, requeijão, manteiga e cream cheese, elaboradas com ingredientes de origem vegetal. Pode ser uma alternativa para pessoas que buscam substituir produtos lácteos, mas é necessário observar a composição de cada produto. Como utiliza castanha-de-caju em suas preparações, não é indicada para pessoas com alergia a esse ingrediente. Pessoas com outras alergias devem consultar a empresa sobre os ingredientes e os riscos de contaminação cruzada.','(11) 98259-9991',ARRAY['vegan','vegetarian','lactose_free']::text[],ARRAY[]::text[],'Conteúdo_Allivia.pdf: declaração do estabelecimento reproduzida no documento; confirmar ingredientes e contaminação cruzada diretamente com a equipe.',true) ON CONFLICT(source_key) DO UPDATE SET name=excluded.name,address=excluded.address,cuisine=excluded.cuisine,description=excluded.description,phone=excluded.phone,diets=excluded.diets,allergen_friendly=excluded.allergen_friendly,allergen_source=excluded.allergen_source,active=excluded.active;
DO $$ BEGIN
    IF (SELECT count(*) FROM public.restaurants WHERE lower(extensions.unaccent(name)) = lower(extensions.unaccent('Shanti Buffet'))) > 1 THEN
      RAISE EXCEPTION 'Mais de um registro corresponde a %; resolva a duplicação antes de importar', 'Shanti Buffet';
    END IF;
    UPDATE public.restaurants SET source_key = 'pdf:restaurant:shanti buffet' WHERE source_key IS NULL AND lower(extensions.unaccent(name)) = lower(extensions.unaccent('Shanti Buffet'));
  END $$;
INSERT INTO public.restaurants(id,source_key,name,address,cuisine,description,phone,diets,allergen_friendly,allergen_source,active) VALUES ('f0003c7a-4458-9323-6517-f29195567d39','pdf:restaurant:shanti buffet','Shanti Buffet','Rua São José, nº 121 Parque Monte Alegre, Taboão da Serra SP, CEP 06756-070.','vegetarian','O Shanti Buffet trabalha com preparações vegetarianas e veganas e apresenta opções que podem atender pessoas que procuram refeições sem determinados ingredientes, incluindo alternativas sem glúten. O estabelecimento também trabalha com serviços de buffet e eventos, sendo importante consultar previamente a disponibilidade das preparações. A empresa informa a existência de possibilidade de contaminação cruzada, portanto pessoas com doença celíaca ou alergias alimentares precisam confirmar diretamente com o estabelecimento quais cuidados são adotados em cada preparo.','(11) 98779-1799',ARRAY['vegan','vegetarian','lactose_free','gluten_free']::text[],ARRAY[]::text[],'Conteúdo_Allivia.pdf: declaração do estabelecimento reproduzida no documento; confirmar ingredientes e contaminação cruzada diretamente com a equipe.',true) ON CONFLICT(source_key) DO UPDATE SET name=excluded.name,address=excluded.address,cuisine=excluded.cuisine,description=excluded.description,phone=excluded.phone,diets=excluded.diets,allergen_friendly=excluded.allergen_friendly,allergen_source=excluded.allergen_source,active=excluded.active;
DO $$ BEGIN
    IF (SELECT count(*) FROM public.restaurants WHERE lower(extensions.unaccent(name)) = lower(extensions.unaccent('Della Santa'))) > 1 THEN
      RAISE EXCEPTION 'Mais de um registro corresponde a %; resolva a duplicação antes de importar', 'Della Santa';
    END IF;
    UPDATE public.restaurants SET source_key = 'pdf:restaurant:della santa' WHERE source_key IS NULL AND lower(extensions.unaccent(name)) = lower(extensions.unaccent('Della Santa'));
  END $$;
INSERT INTO public.restaurants(id,source_key,name,address,cuisine,description,phone,diets,allergen_friendly,allergen_source,active) VALUES ('9a6472b9-3a6d-fa89-ad76-023636e4fc19','pdf:restaurant:della santa','Della Santa','Avenida Bosque da Saúde, nº 368 Vila da Saúde, São Paulo SP, CEP 04142-080.','other','A Della Santa é especializada em alimentação sem glúten e sem leite de origem animal. De acordo com as informações divulgadas pelo próprio estabelecimento, suas preparações são produzidas em ambiente dedicado, sem contaminação cruzada por esses ingredientes. É uma opção especialmente relevante para pessoas com doença celíaca e para quem precisa evitar leite de origem animal. Mesmo assim, pessoas com outras alergias alimentares devem consultar a equipe sobre a composição dos produtos e os procedimentos de segurança adotados.','(11) 98109-2612',ARRAY['gluten_free','lactose_free']::text[],ARRAY['gluten','milk']::text[],'Conteúdo_Allivia.pdf: declaração do estabelecimento reproduzida no documento; confirmar ingredientes e contaminação cruzada diretamente com a equipe.',true) ON CONFLICT(source_key) DO UPDATE SET name=excluded.name,address=excluded.address,cuisine=excluded.cuisine,description=excluded.description,phone=excluded.phone,diets=excluded.diets,allergen_friendly=excluded.allergen_friendly,allergen_source=excluded.allergen_source,active=excluded.active;
DO $$ BEGIN
    IF (SELECT count(*) FROM public.restaurants WHERE lower(extensions.unaccent(name)) = lower(extensions.unaccent('Pandan'))) > 1 THEN
      RAISE EXCEPTION 'Mais de um registro corresponde a %; resolva a duplicação antes de importar', 'Pandan';
    END IF;
    UPDATE public.restaurants SET source_key = 'pdf:restaurant:pandan' WHERE source_key IS NULL AND lower(extensions.unaccent(name)) = lower(extensions.unaccent('Pandan'));
  END $$;
INSERT INTO public.restaurants(id,source_key,name,address,cuisine,description,phone,diets,allergen_friendly,allergen_source,active) VALUES ('f2dbc94d-782c-7bfd-b849-8d75481a1a54','pdf:restaurant:pandan','Pandan','Rua Ferreira de Araújo, nº 369 Pinheiros, São Paulo SP, CEP 05428- 000.','other','A Pandan é um estabelecimento especializado em produtos e preparações sem glúten, com opções de alimentação e confeitaria. Pode ser uma alternativa para pessoas com doença celíaca ou que precisam evitar o consumo de glúten. Entretanto, a especialização em alimentação sem glúten não significa que todos os produtos sejam livres de leite, ovos, soja, castanhas ou outros alergênicos. É importante verificar os ingredientes de cada produto e consultar a equipe sobre os cuidados com a contaminação cruzada.','(11) 2729-3922',ARRAY['gluten_free']::text[],ARRAY['gluten']::text[],'Conteúdo_Allivia.pdf: declaração do estabelecimento reproduzida no documento; confirmar ingredientes e contaminação cruzada diretamente com a equipe.',true) ON CONFLICT(source_key) DO UPDATE SET name=excluded.name,address=excluded.address,cuisine=excluded.cuisine,description=excluded.description,phone=excluded.phone,diets=excluded.diets,allergen_friendly=excluded.allergen_friendly,allergen_source=excluded.allergen_source,active=excluded.active;
DO $$ BEGIN
    IF (SELECT count(*) FROM public.restaurants WHERE lower(extensions.unaccent(name)) = lower(extensions.unaccent('Avidità Trattoria Senza Glutine'))) > 1 THEN
      RAISE EXCEPTION 'Mais de um registro corresponde a %; resolva a duplicação antes de importar', 'Avidità Trattoria Senza Glutine';
    END IF;
    UPDATE public.restaurants SET source_key = 'pdf:restaurant:avidita trattoria senza glutine' WHERE source_key IS NULL AND lower(extensions.unaccent(name)) = lower(extensions.unaccent('Avidità Trattoria Senza Glutine'));
  END $$;
INSERT INTO public.restaurants(id,source_key,name,address,cuisine,description,phone,diets,allergen_friendly,allergen_source,active) VALUES ('fdd16272-179a-d842-e946-99323a3e288a','pdf:restaurant:avidita trattoria senza glutine','Avidità Trattoria Senza Glutine','Rua Luís Góis, nº 1665 Mirandópolis, São Paulo SP, CEP 04043-350.','other','A Avidità é uma trattoria italiana especializada em alimentação sem glúten. O estabelecimento oferece preparações inspiradas na culinária italiana, sendo uma alternativa para pessoas com doença celíaca ou que precisam evitar o glúten. Apesar dessa especialização, é necessário consultar a equipe sobre a presença de outros alergênicos, como leite, ovos e oleaginosas, além dos procedimentos utilizados para evitar a contaminação cruzada por esses ingredientes.','(11) 5581-5478',ARRAY['gluten_free']::text[],ARRAY['gluten']::text[],'Conteúdo_Allivia.pdf: declaração do estabelecimento reproduzida no documento; confirmar ingredientes e contaminação cruzada diretamente com a equipe.',true) ON CONFLICT(source_key) DO UPDATE SET name=excluded.name,address=excluded.address,cuisine=excluded.cuisine,description=excluded.description,phone=excluded.phone,diets=excluded.diets,allergen_friendly=excluded.allergen_friendly,allergen_source=excluded.allergen_source,active=excluded.active;
DO $$ BEGIN
    IF (SELECT count(*) FROM public.restaurants WHERE lower(extensions.unaccent(name)) = lower(extensions.unaccent('Pop Vegan Food'))) > 1 THEN
      RAISE EXCEPTION 'Mais de um registro corresponde a %; resolva a duplicação antes de importar', 'Pop Vegan Food';
    END IF;
    UPDATE public.restaurants SET source_key = 'pdf:restaurant:pop vegan food' WHERE source_key IS NULL AND lower(extensions.unaccent(name)) = lower(extensions.unaccent('Pop Vegan Food'));
  END $$;
INSERT INTO public.restaurants(id,source_key,name,address,cuisine,description,phone,diets,allergen_friendly,allergen_source,active) VALUES ('11998fbc-4645-829b-eba5-73faa88a28e6','pdf:restaurant:pop vegan food','Pop Vegan Food','Rua Fernando de Albuquerque, nº 142/144 Consolação, São Paulo SP, CEP 01309-030.','vegetarian','A Pop Vegan Food é um restaurante especializado em alimentação vegana, oferecendo preparações elaboradas sem ingredientes de origem animal. É uma alternativa para pessoas que procuram refeições sem carne, leite, ovos e outros ingredientes de origem animal. Entretanto, a alimentação vegana não garante ausência de todos os alergênicos, pois os pratos podem conter ingredientes como soja, castanhas, amendoim e outros alimentos capazes de provocar reações alérgicas. É fundamental consultar o estabelecimento sobre a composição dos pratos e os riscos de contaminação cruzada.','(11) 2157-4358',ARRAY['vegan','vegetarian','lactose_free']::text[],ARRAY[]::text[],'Conteúdo_Allivia.pdf: declaração do estabelecimento reproduzida no documento; confirmar ingredientes e contaminação cruzada diretamente com a equipe.',true) ON CONFLICT(source_key) DO UPDATE SET name=excluded.name,address=excluded.address,cuisine=excluded.cuisine,description=excluded.description,phone=excluded.phone,diets=excluded.diets,allergen_friendly=excluded.allergen_friendly,allergen_source=excluded.allergen_source,active=excluded.active;

create or replace function public.search_recipes(
  p_meal_type    text    default null,
  p_min_minutes  integer default null,
  p_max_minutes  integer default null,
  p_diets        text[]  default '{}',
  p_include      text[]  default '{}',
  p_exclude      text[]  default '{}',
  p_limit        integer default 10,
  p_offset       integer default 0
)
returns setof public.recipes
language sql
stable
security invoker
set search_path = ''
as $$
  with me as (
    select coalesce(p.allergies, '{}') as allergies,
           coalesce(p.custom_allergies, '{}') as custom_allergies
    from public.profiles p
    where p.id = auth.uid()
  ),
  blocked_terms as (
    select extensions.unaccent(lower(s.term)) as term
    from public.allergens a, unnest(a.synonyms) as s(term)
    where a.id = any (coalesce((select allergies from me), '{}'))
    union
    select extensions.unaccent(lower(c.term))
    from unnest(coalesce((select custom_allergies from me), '{}')) as c(term)
  ),
  candidates as (
    select r.*,
           extensions.unaccent(lower(array_to_string(r.ingredients, ' '))) as ingredients_text
    from public.recipes r
    where r.published
      and not (r.allergens && coalesce((select allergies from me), '{}'))
      and (p_meal_type is null or p_meal_type = any (r.meal_types))
      and (p_min_minutes is null or r.ready_in_minutes > p_min_minutes)
      and (p_max_minutes is null or r.ready_in_minutes <= p_max_minutes)
      and r.diets @> coalesce(p_diets, '{}')
  )
  select r.*
  from candidates c join public.recipes r on r.id = c.id
  where not exists (select 1 from blocked_terms b where c.ingredients_text like '%' || b.term || '%')
    and not exists (
      select 1 from unnest(coalesce(p_include, '{}')) as i(term)
      where c.ingredients_text not like '%' || extensions.unaccent(lower(i.term)) || '%'
    )
    and not exists (
      select 1 from unnest(coalesce(p_exclude, '{}')) as e(term)
      where c.ingredients_text like '%' || extensions.unaccent(lower(e.term)) || '%'
    )
  order by c.featured desc, c.created_at desc, c.id
  limit least(greatest(p_limit, 1), 50)
  offset greatest(p_offset, 0);
$$;

revoke execute on function public.search_recipes(text, integer, integer, text[], text[], text[], integer, integer) from public, anon;
grant execute on function public.search_recipes(text, integer, integer, text[], text[], text[], integer, integer) to authenticated;


ALTER TABLE public.recipes
  ADD COLUMN IF NOT EXISTS image_credit text,
  ADD COLUMN IF NOT EXISTS image_source_url text;

-- Executa com as permissões do usuário: o perfil continua protegido por RLS.
create or replace function public.recipe_matches_profile(
  p_allergens text[], p_ingredients text[]
)
returns boolean
language sql
stable
security invoker
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = (select auth.uid())
      and not (coalesce(p_allergens, '{}') && p.allergies)
      and not exists (
        select 1
        from (
          select s.term
          from public.allergens a,
               unnest(a.synonyms || array[a.label]) as s(term)
          where a.id = any(p.allergies)
          union
          select unnest(p.custom_allergies)
        ) blocked
        where length(btrim(blocked.term)) > 0
          and exists (
            select 1 from unnest(coalesce(p_ingredients, '{}')) i(ingredient)
            where strpos(
              regexp_replace(extensions.unaccent(lower(i.ingredient)), '\s+', ' ', 'g'),
              regexp_replace(extensions.unaccent(lower(btrim(blocked.term))), '\s+', ' ', 'g')
            ) > 0
          )
      )
  );
$$;
revoke execute on function public.recipe_matches_profile(text[], text[]) from public, anon;
grant execute on function public.recipe_matches_profile(text[], text[]) to authenticated;

-- Restritiva: também limita outras políticas permissivas de leitura existentes.
drop policy if exists recipes_profile_allergies on public.recipes;
create policy recipes_profile_allergies on public.recipes
  as restrictive for select to authenticated
  using (published and allergens_reviewed and public.recipe_matches_profile(allergens, ingredients));

-- Os favoritos são preservados se o perfil mudar. Inserir um favorito novo exige
-- que a receita esteja visível para o usuário naquele momento.
drop policy if exists saved_recipes_compatible_write on public.saved_recipes;
create policy saved_recipes_compatible_write on public.saved_recipes
  as restrictive for all to authenticated
  using (true)
  with check (exists (select 1 from public.recipes r where r.id = saved_recipes.recipe_id));

DO $$ BEGIN
  IF to_regclass('storage.buckets') IS NOT NULL THEN
    INSERT INTO storage.buckets(id, name, public, file_size_limit, allowed_mime_types)
    VALUES ('recipe-images', 'recipe-images', true, 10485760,
            array['image/jpeg','image/png','image/webp'])
    ON CONFLICT(id) DO UPDATE SET public = true,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;
  END IF;
END $$;
-- Uploads administrativos são feitos pelo script, sem conceder escrita pública.

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

DELETE FROM public.recipes
WHERE source_key IN (
  'pdf:recipe:26',
  'pdf:recipe:36',
  'pdf:recipe:37',
  'pdf:recipe:38',
  'pdf:recipe:39',
  'pdf:recipe:40',
  'pdf:recipe:41',
  'pdf:recipe:42',
  'pdf:recipe:43',
  'pdf:recipe:44',
  'pdf:recipe:45',
  'pdf:recipe:46',
  'pdf:recipe:47'
)
OR id IN (
  '2826fea1-a5cb-4ca0-a335-f006f518e302'::uuid,
  '0b22754d-b054-4191-acaa-99e9ccb85fca'::uuid,
  'b7b33e77-18e1-474a-aa5c-187fd45664d2'::uuid,
  '6d643ae4-cd38-4626-a7c5-41dddfb4935a'::uuid,
  'f3102ecc-d93a-42c9-afe7-97c55d9a05fd'::uuid,
  'df59a04b-9606-4f17-a0ed-8b9f1e26d26f'::uuid,
  'a51208d3-bbac-4281-aea3-49033d28d752'::uuid,
  '0d6a4dcc-92ef-4c77-a8f7-40821c396419'::uuid,
  'e360a69d-f508-41e5-aece-5301851076c6'::uuid,
  '7ea195a4-ce8d-452c-aa57-27c1fdf4eed0'::uuid,
  '2d6ec1e1-e8a9-4c5d-a9ea-8612be598714'::uuid,
  'eca14986-a6d6-4a68-a577-4518a585ee6b'::uuid,
  '80ec02fb-c06e-4f03-a09a-6c10a9d7c606'::uuid
)
RETURNING id, title;


COMMIT;
SELECT count(*) AS receitas_importadas, count(*) FILTER (WHERE published) AS publicadas, count(*) FILTER (WHERE NOT published) AS rascunhos FROM public.recipes WHERE source_key LIKE 'pdf:recipe:%';
SELECT name, address, lat, lng FROM public.restaurants WHERE source_key LIKE 'pdf:restaurant:%' ORDER BY name;
SELECT title,import_pending FROM public.recipes WHERE source_key LIKE 'pdf:recipe:%' AND NOT published;
