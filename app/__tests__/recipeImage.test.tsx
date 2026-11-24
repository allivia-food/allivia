import { fireEvent, render, screen } from '@testing-library/react-native';

import { RecipeImage } from '@/components/recipes/RecipeImage';
import { getRecipePhoto } from '@/constants/recipePhotos';
import { getRestaurantPhotos } from '@/constants/restaurantPhotos';

jest.mock('expo-image', () => ({ Image: jest.requireActual('react-native').Image }));

it('prefers the first supplied restaurant photo over the old remote image', async () => {
  const firstPhoto = getRestaurantPhotos('Della Santa')[0];
  await render(<RecipeImage uri="https://example.com/old.jpg" localSource={firstPhoto} />);
  expect(screen.getByLabelText('Foto').props.source).toEqual(firstPhoto);
});

it('uses the bundled photo when no remote URL is registered', async () => {
  await render(<RecipeImage uri={null} recipeTitle="Panqueca de banana e aveia" />);
  expect(screen.getByLabelText('Foto').props.source).toEqual(
    getRecipePhoto('Panqueca de banana e aveia'),
  );
});

it('uses the local photo after a remote failure and handles a local failure', async () => {
  await render(
    <RecipeImage uri="https://example.com/missing.jpg" recipeTitle="Panqueca de banana e aveia" />,
  );
  await fireEvent(screen.getByLabelText('Foto'), 'error');
  expect(screen.getByLabelText('Foto').props.source).toEqual(
    getRecipePhoto('Panqueca de banana e aveia'),
  );
  await fireEvent(screen.getByLabelText('Foto'), 'error');
  expect(screen.queryByLabelText('Foto')).toBeNull();
});

it('keeps the placeholder for a recipe without a supplied photo', async () => {
  await render(<RecipeImage uri={null} recipeTitle="Omelete de espinafre e tomate" />);
  expect(screen.queryByLabelText('Foto')).toBeNull();
});

it('falls back on an image error and retries when the URI changes', async () => {
  const view = await render(<RecipeImage uri="https://example.com/missing.jpg" />);
  await fireEvent(screen.getByLabelText('Foto'), 'error');
  expect(screen.queryByLabelText('Foto')).toBeNull();
  await view.rerender(<RecipeImage uri="https://example.com/new.jpg" />);
  expect(screen.getByLabelText('Foto')).toBeTruthy();
});
