import { screen } from '@testing-library/react-native';
import { renderWithClient } from '../../test-utils/renderWithClient';
import ScannerHistory from '@/app/(tabs)/scanner';

jest.mock('@/hooks/usePremium', () => ({ usePremium: () => ({ isPremium: true }) }));
jest.mock('@/store/profile', () => ({
  useProfileStore: (selector: (state: unknown) => unknown) => selector({ profile: { id: 'u1' } }),
}));
jest.mock('expo-router', () => ({
  router: { push: jest.fn() },
  useFocusEffect: jest.fn(),
}));

const mockSelect = jest.fn();
const mockOrder = jest.fn();
const mockRange = jest.fn();
const mockPhotos = jest.fn();
jest.mock('@/services/supabase', () => ({
  getSupabase: () => ({
    from: (table: string) =>
      table === 'products_cache'
        ? {
            select: () => ({ in: mockPhotos }),
          }
        : {
            select: mockSelect,
          },
  }),
}));

it('loads history using the scan timestamp defined in the database', async () => {
  mockPhotos.mockResolvedValue({
    data: [{ barcode: '7891000100103', image_url: 'https://example.com/leite.jpg' }],
    error: null,
  });
  const query = { eq: jest.fn().mockReturnThis(), order: mockOrder, range: mockRange };
  mockSelect.mockImplementation((columns: string) => {
    expect(columns).toBe('id,barcode,product_name,scanned_at,verdict');
    return query;
  });
  mockOrder.mockReturnValue(query);
  const scannedAt = '2026-11-24T12:00:00Z';
  mockRange.mockResolvedValue({
    data: [
      {
        id: 'scan1',
        barcode: '7891000100103',
        product_name: 'Leite',
        scanned_at: scannedAt,
        verdict: 'safe',
      },
      {
        id: 'scan-old',
        barcode: '7891000100103',
        product_name: 'Leite antigo',
        scanned_at: '2026-11-23T12:00:00Z',
        verdict: 'warning',
      },
    ],
    error: null,
  });

  await renderWithClient(<ScannerHistory />);

  expect(await screen.findByText('Leite')).toBeTruthy();
  expect(screen.getByLabelText('Foto de Leite').props.source).toEqual([
    {
      uri: 'https://example.com/leite.jpg',
    },
  ]);
  expect(screen.queryByText('Leite antigo')).toBeNull();
  expect(
    screen.getByText(`7891000100103 · ${new Date(scannedAt).toLocaleString('pt-BR')}`),
  ).toBeTruthy();
  expect(mockOrder).toHaveBeenCalledWith('scanned_at', { ascending: false });
  expect(mockRange).toHaveBeenCalledWith(0, 19);
});
