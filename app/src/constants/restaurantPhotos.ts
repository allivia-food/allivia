// Static imports let Metro include these photos in the app, including offline.
const photos: Record<string, readonly number[]> = {
  'miga vegana': [
    require('../../assets/restaurants-photos/Restaurante Miga Vegana 1.png'),
    require('../../assets/restaurants-photos/Restaurante Miga Vegana 2.png'),
    require('../../assets/restaurants-photos/Restaurante Miga Vegana 3.png'),
  ],
  'cajuveg queijaria artesanal': [
    require('../../assets/restaurants-photos/Cajuveg 1.png'),
    require('../../assets/restaurants-photos/Cajuveg2.png'),
  ],
  'shanti buffet': [
    require('../../assets/restaurants-photos/Shanti Buffet 1.png'),
    require('../../assets/restaurants-photos/Shanti Buffet3.png'),
  ],
  'della santa': [
    require('../../assets/restaurants-photos/Casa-Della-Santa1.png'),
    require('../../assets/restaurants-photos/Della Santa2.png'),
    require('../../assets/restaurants-photos/Della Santa3.png'),
    require('../../assets/restaurants-photos/Della Santa4.png'),
  ],
  pandan: [
    require('../../assets/restaurants-photos/Pandan1.png'),
    require('../../assets/restaurants-photos/Pandan2.png'),
    require('../../assets/restaurants-photos/Pandan3.png'),
  ],
  'avidita trattoria senza glutine': [
    require('../../assets/restaurants-photos/Avidita1.png'),
    require('../../assets/restaurants-photos/Avidita2.png'),
  ],
  'pop vegan food': [
    require('../../assets/restaurants-photos/Pop Vegan Food1.png'),
    require('../../assets/restaurants-photos/Pop Vegan Food2.png'),
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
