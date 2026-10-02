import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { Text } from 'react-native';

import {
  Banner,
  BottomSheet,
  IconBadge,
  LargeTitleHeader,
  Modal,
  ScreenHeader,
  StateView,
  TabBar,
  Toast,
} from '@/components/ui';

describe('Banner', () => {
  it.each(['success', 'warning', 'error', 'info'] as const)(
    'renders the %s variant',
    async (variant) => {
      await render(
        <Banner variant={variant} title="Título">
          Mensagem
        </Banner>,
      );
      expect(screen.getByText('Título')).toBeTruthy();
      expect(screen.getByText('Mensagem')).toBeTruthy();
    },
  );
});

describe('StateView', () => {
  it('shows the default message of each state', async () => {
    await render(<StateView variant="offline" />);
    expect(screen.getByText(/sem conexão/)).toBeTruthy();
  });

  it('offers "Tentar novamente" on error', async () => {
    const onRetry = jest.fn();
    await render(<StateView variant="error" onRetry={onRetry} />);
    await fireEvent.press(screen.getByRole('button', { name: 'Tentar novamente' }));
    expect(onRetry).toHaveBeenCalled();
  });

  it('shows the empty action', async () => {
    const onAction = jest.fn();
    await render(<StateView variant="empty" actionLabel="Limpar filtros" onAction={onAction} />);
    await fireEvent.press(screen.getByRole('button', { name: 'Limpar filtros' }));
    expect(onAction).toHaveBeenCalled();
  });

  it('shows a spinner while loading', async () => {
    await render(<StateView variant="loading" />);
    expect(screen.getByTestId('state-loading')).toBeTruthy();
  });
});

describe('Toast', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  it('hides itself after 3 seconds', async () => {
    const onHide = jest.fn();
    await render(<Toast visible message="Receita removida" onHide={onHide} />);
    expect(screen.getByText('Receita removida')).toBeTruthy();
    await act(async () => {
      jest.advanceTimersByTime(2999);
    });
    expect(onHide).not.toHaveBeenCalled();
    await act(async () => {
      jest.advanceTimersByTime(1);
    });
    expect(onHide).toHaveBeenCalledTimes(1);
  });

  it('renders nothing when not visible', async () => {
    await render(<Toast visible={false} message="Oculto" onHide={jest.fn()} />);
    expect(screen.queryByText('Oculto')).toBeNull();
  });
});

describe('Modal', () => {
  it('closes with the close button and the backdrop', async () => {
    const onClose = jest.fn();
    await render(
      <Modal visible onClose={onClose} title="Termos de Uso" testID="terms">
        <Text>Conteúdo</Text>
      </Modal>,
    );
    expect(screen.getByText('Termos de Uso')).toBeTruthy();
    await fireEvent.press(screen.getByTestId('terms-close'));
    await fireEvent.press(screen.getByTestId('terms-backdrop', { includeHiddenElements: true }));
    expect(onClose).toHaveBeenCalledTimes(2);
  });
});

describe('BottomSheet', () => {
  it('toggles between collapsed and expanded with the handle', async () => {
    await render(
      <BottomSheet minHeight="30%" maxHeight="90%" accessibilityLabel="Expandir lista">
        <Text>Perto de você</Text>
      </BottomSheet>,
    );
    const handle = screen.getByTestId('bottom-sheet-handle');
    expect(handle).not.toBeExpanded();
    await fireEvent.press(handle);
    expect(screen.getByTestId('bottom-sheet-handle')).toBeExpanded();
  });
});

describe('TabBar', () => {
  it('marks the active tab and reports presses', async () => {
    const onTabPress = jest.fn();
    await render(<TabBar active="recipes" onTabPress={onTabPress} />);
    expect(screen.getByRole('tab', { name: 'Receitas' })).toBeSelected();
    expect(screen.getByRole('tab', { name: 'Início' })).not.toBeSelected();
    await fireEvent.press(screen.getByRole('tab', { name: 'Perfil' }));
    expect(onTabPress).toHaveBeenCalledWith('profile');
  });

  it('has the 5 tabs of the Figma', async () => {
    await render(<TabBar active="home" onTabPress={jest.fn()} />);
    expect(screen.getAllByRole('tab')).toHaveLength(5);
  });
});

describe('Headers', () => {
  it('ScreenHeader shows the back arrow only with onBack', async () => {
    const onBack = jest.fn();
    await render(<ScreenHeader title="Fazer login" onBack={onBack} />);
    await fireEvent.press(screen.getByRole('button', { name: 'Voltar' }));
    expect(onBack).toHaveBeenCalled();
    expect(screen.getByRole('header', { name: 'Fazer login' })).toBeTruthy();
  });

  it('ScreenHeader without onBack has no back button', async () => {
    await render(<ScreenHeader title="Resultado da análise" />);
    expect(screen.queryByRole('button', { name: 'Voltar' })).toBeNull();
  });

  it('LargeTitleHeader shows title and subtitle', async () => {
    await render(<LargeTitleHeader title="Receitas" subtitle="Encontre receitas seguras" />);
    expect(screen.getByRole('header', { name: 'Receitas' })).toBeTruthy();
    expect(screen.getByText('Encontre receitas seguras')).toBeTruthy();
  });
});

describe('IconBadge', () => {
  it('is announced only when labelled', async () => {
    await render(<IconBadge icon="allergenMilk" accessibilityLabel="Leite" />);
    expect(screen.getByLabelText('Leite')).toBeTruthy();
  });
});
