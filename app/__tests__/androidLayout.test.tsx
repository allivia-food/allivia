import { render, screen } from '@testing-library/react-native';
import { Platform, StyleSheet, Text } from 'react-native';
import * as SafeArea from 'react-native-safe-area-context';

import { Button, Input, Modal, TabBar } from '@/components/ui';
import { SearchPill } from '@/components/restaurants/SearchPill';
import { sizes, spacing } from '@/theme';

beforeEach(() => {
  jest.replaceProperty(Platform, 'OS', 'android');
});
afterEach(() => jest.restoreAllMocks());

it.each([0, 24, 48])(
  'reserves navigation inset %i plus breathing room below the tabs',
  async (bottom) => {
    jest
      .spyOn(SafeArea, 'useSafeAreaInsets')
      .mockReturnValue({ top: 24, bottom, left: 0, right: 0 });
    await render(<TabBar active="home" onTabPress={jest.fn()} />);
    const style = StyleSheet.flatten(screen.getByTestId('app-tab-bar').props.style);
    expect(style.paddingBottom).toBe(bottom + spacing.md);
    expect(style.minHeight).toBe(sizes.tabBarHeight + bottom);
    expect(screen.getAllByRole('tab')).toHaveLength(5);
  },
);

it('keeps a sheet clear of both Android system bars', async () => {
  jest
    .spyOn(SafeArea, 'useSafeAreaInsets')
    .mockReturnValue({ top: 24, bottom: 48, left: 0, right: 0 });
  await render(
    <Modal visible onClose={jest.fn()} variant="sheet">
      <Text>Conteúdo</Text>
    </Modal>,
  );
  const style = StyleSheet.flatten(screen.getByTestId('modal-safe-area').props.style);
  expect(style.paddingTop).toBeGreaterThanOrEqual(24);
  expect(style.paddingBottom).toBeGreaterThanOrEqual(48);
});

it('bounds input length and control font scaling without disabling font accessibility', async () => {
  await render(
    <>
      <Input placeholder="Email" />
      <Input placeholder="Senha" secure />
      <SearchPill placeholder="Endereço" />
      <Button label="Continuar" onPress={jest.fn()} />
    </>,
  );
  expect(screen.getByLabelText('Email').props.maxLength).toBe(254);
  expect(screen.getByLabelText('Senha').props.maxLength).toBe(1024);
  expect(screen.getByLabelText('Senha').props.autoCorrect).toBe(false);
  expect(screen.getByLabelText('Endereço').props.maxLength).toBe(200);
  expect(screen.getByLabelText('Email').props.maxFontSizeMultiplier).toBe(1.3);
  expect(screen.getByText('Continuar').props.maxFontSizeMultiplier).toBe(1.3);
  expect(screen.getByText('Continuar').props.allowFontScaling).not.toBe(false);
});
