import { fireEvent, render, screen } from '@testing-library/react-native';
import { RestaurantPhotoCarousel } from '@/components/restaurants/RestaurantPhotoCarousel';
import { getRestaurantPhotos } from '@/constants/restaurantPhotos';

it.each([
  ['Miga Vegana', 3],
  ['Cajuveg Queijaria Artesanal', 2],
  ['Shanti Buffet', 2],
  ['Della Santa', 4],
  ['Pandan', 3],
  ['Avidità Trattoria Senza Glutine', 2],
  ['Pop Vegan Food', 2],
])('includes the supplied photos for %s', (name, count) => {
  expect(getRestaurantPhotos(name as string)).toHaveLength(count as number);
});

it('navigates by buttons, indicators and swipe', async () => {
  await render(<RestaurantPhotoCarousel name="Pandan" image={null} />);
  // The viewport measures the available width inside the restaurant sheet.
  await fireEvent(screen.getByTestId('restaurant-photo-viewport'), 'layout', {
    nativeEvent: { layout: { width: 300, height: 180 } },
  });
  expect(screen.getByLabelText('Foto 1 de 3 de Pandan')).toBeTruthy();
  await fireEvent.press(screen.getByLabelText('Próxima foto'));
  expect(screen.getByText('2/3')).toBeTruthy();
  await fireEvent.press(screen.getByLabelText('Mostrar foto 3'));
  expect(screen.getByText('3/3')).toBeTruthy();
  await fireEvent.press(screen.getByLabelText('Foto anterior'));
  expect(screen.getByText('2/3')).toBeTruthy();
  await fireEvent(screen.getByTestId('restaurant-photo-carousel'), 'momentumScrollEnd', {
    nativeEvent: { contentOffset: { x: 0 } },
  });
  expect(screen.getByText('1/3')).toBeTruthy();
});

it('keeps a fallback for restaurants without supplied photos', async () => {
  await render(<RestaurantPhotoCarousel name="Outro restaurante" image={null} />);
  expect(screen.queryByLabelText('Próxima foto')).toBeNull();
});
