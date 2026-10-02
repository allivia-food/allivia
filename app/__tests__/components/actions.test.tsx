import { fireEvent, render, screen } from '@testing-library/react-native';

import { Button, Card, Chip, IconButton } from '@/components/ui';

describe('Button', () => {
  it('calls onPress in the default state', async () => {
    const onPress = jest.fn();
    await render(<Button label="Entrar" onPress={onPress} />);
    await fireEvent.press(screen.getByRole('button', { name: 'Entrar' }));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('does not call onPress when disabled', async () => {
    const onPress = jest.fn();
    await render(<Button label="Entrar" onPress={onPress} disabled />);
    const button = screen.getByRole('button', { name: 'Entrar' });
    expect(button).toBeDisabled();
    await fireEvent.press(button);
    expect(onPress).not.toHaveBeenCalled();
  });

  it('shows a spinner and blocks double taps while loading', async () => {
    const onPress = jest.fn();
    await render(<Button label="Entrar" onPress={onPress} loading testID="submit" />);
    expect(screen.getByTestId('submit-loading')).toBeTruthy();
    expect(screen.queryByText('Entrar')).toBeNull();
    await fireEvent.press(screen.getByTestId('submit'));
    expect(onPress).not.toHaveBeenCalled();
  });

  it('renders the text variant', async () => {
    await render(<Button label="Voltar para Home" variant="text" onPress={jest.fn()} />);
    expect(screen.getByText('Voltar para Home')).toBeTruthy();
  });
});

describe('IconButton', () => {
  it('exposes its accessibility label and the badge count', async () => {
    const onPress = jest.fn();
    await render(
      <IconButton icon="filter" accessibilityLabel="Filtros" badge={2} onPress={onPress} />,
    );
    await fireEvent.press(screen.getByRole('button', { name: 'Filtros (2)' }));
    expect(onPress).toHaveBeenCalled();
  });
});

describe('Chip', () => {
  it('filter chip reports its selected state and is pressable', async () => {
    const onPress = jest.fn();
    await render(<Chip variant="filter" label="Almoço" active onPress={onPress} />);
    const chip = screen.getByRole('button', { name: 'Almoço' });
    expect(chip).toBeSelected();
    await fireEvent.press(chip);
    expect(onPress).toHaveBeenCalled();
  });

  it('tag and time chips are read-only text', async () => {
    await render(
      <>
        <Chip label="Sem lactose" tone="orange" />
        <Chip label="15 min" variant="time" />
      </>,
    );
    expect(screen.getByText('Sem lactose')).toBeTruthy();
    expect(screen.queryByRole('button')).toBeNull();
  });
});

describe('Card', () => {
  it('is pressable only when onPress is given', async () => {
    const onPress = jest.fn();
    await render(
      <Card variant="green" onPress={onPress} accessibilityLabel="Suas restrições">
        <></>
      </Card>,
    );
    await fireEvent.press(screen.getByRole('button', { name: 'Suas restrições' }));
    expect(onPress).toHaveBeenCalled();
  });
});
