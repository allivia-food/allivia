-- Remove only the 13 PDF recipes without supplied photos.
-- Related saved_recipes are removed by ON DELETE CASCADE.
BEGIN;

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
