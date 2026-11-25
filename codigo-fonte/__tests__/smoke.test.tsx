import { render, screen } from '@testing-library/react-native';
import { Text } from 'react-native';

import { typography } from '@/theme';

describe('smoke test', () => {
  it('renders a text with the theme typography', async () => {
    await render(<Text style={typography.screenTitle}>Allivia</Text>);
    expect(screen.getByText('Allivia')).toBeTruthy();
  });
});
