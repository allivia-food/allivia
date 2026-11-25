// Static imports let Metro include these photos in the app, including offline.
const photos: Record<string, readonly number[]> = {
  'miga vegana': [
    require('../../assets/restaurants-photos/Restaurante Miga Vegana 1.jpg'),
    require('../../assets/restaurants-photos/Restaurante Miga Vegana 2.jpg'),
    require('../../assets/restaurants-photos/Restaurante Miga Vegana 3.jpg'),
  ],
  'cajuveg queijaria artesanal': [
    require('../../assets/restaurants-photos/Cajuveg 1.webp'),
    require('../../assets/restaurants-photos/Cajuveg2.webp'),
  ],
  'shanti buffet': [
    require('../../assets/restaurants-photos/Shanti Buffet 1.webp'),
    require('../../assets/restaurants-photos/Shanti Buffet3.webp'),
  ],
  'della santa': [
    require('../../assets/restaurants-photos/Casa-Della-Santa1.jpg'),
    require('../../assets/restaurants-photos/Della Santa2.jpg'),
    require('../../assets/restaurants-photos/Della Santa3.jpg'),
    require('../../assets/restaurants-photos/Della Santa4.jpg'),
  ],
  pandan: [
    require('../../assets/restaurants-photos/Pandan1.png'),
    require('../../assets/restaurants-photos/Pandan2.jpg'),
    require('../../assets/restaurants-photos/Pandan3.jpg'),
  ],
  'avidita trattoria senza glutine': [
    require('../../assets/restaurants-photos/Avidita1.jpg'),
    require('../../assets/restaurants-photos/Avidita2.webp'),
  ],
  'pop vegan food': [
    require('../../assets/restaurants-photos/Pop Vegan Food1.jpg'),
    require('../../assets/restaurants-photos/Pop Vegan Food2.jpg'),
  ],
};

export function getRestaurantPhotos(name: string): readonly number[] {
  const normalized = name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase();
  return photos[normalized] ?? [];
}
