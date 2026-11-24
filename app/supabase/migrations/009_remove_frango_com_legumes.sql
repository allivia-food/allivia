-- No photo was supplied for this legacy recipe; remove it from the catalog.
-- Saved references are removed by the existing ON DELETE CASCADE constraint.
DELETE FROM public.recipes
WHERE lower(btrim(title)) = 'frango com legumes'
RETURNING id, title;
