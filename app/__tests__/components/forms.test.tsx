import { fireEvent, render, screen } from '@testing-library/react-native';

import { Checkbox, Input, ProgressSteps, SelectableTile } from '@/components/ui';

describe('Input', () => {
  it('shows the error message below the field', async () => {
    await render(<Input placeholder="Email" error="Informe um e-mail válido." />);
    expect(screen.getByText('Informe um e-mail válido.')).toBeTruthy();
  });

  it('toggles password visibility with the eye button', async () => {
    await render(<Input placeholder="Senha" secure />);
    const field = screen.getByLabelText('Senha');
    expect(field.props.secureTextEntry).toBe(true);
    await fireEvent.press(screen.getByRole('button', { name: 'Mostrar senha' }));
    expect(screen.getByLabelText('Senha').props.secureTextEntry).toBe(false);
    expect(screen.getByRole('button', { name: 'Ocultar senha' })).toBeTruthy();
  });

  it('is not editable when disabled', async () => {
    await render(<Input placeholder="Email" disabled />);
    expect(screen.getByLabelText('Email').props.editable).toBe(false);
  });

  it('forwards text changes', async () => {
    const onChangeText = jest.fn();
    await render(<Input placeholder="Email" onChangeText={onChangeText} />);
    await fireEvent.changeText(screen.getByLabelText('Email'), 'a@b.com');
    expect(onChangeText).toHaveBeenCalledWith('a@b.com');
  });
});

describe('Checkbox', () => {
  it('toggles when the box is pressed', async () => {
    const onToggle = jest.fn();
    await render(
      <Checkbox
        checked={false}
        onToggle={onToggle}
        label="Li e aceito os "
        linkText="Termos de uso"
        testID="terms"
      />,
    );
    const box = screen.getByTestId('terms');
    expect(box).not.toBeChecked();
    await fireEvent.press(box);
    expect(onToggle).toHaveBeenCalledTimes(1);
  });

  it('pressing the link opens it without toggling', async () => {
    const onToggle = jest.fn();
    const onLinkPress = jest.fn();
    await render(
      <Checkbox
        checked
        onToggle={onToggle}
        label="Li e aceito os "
        linkText="Termos de uso"
        onLinkPress={onLinkPress}
        testID="terms"
      />,
    );
    expect(screen.getByTestId('terms')).toBeChecked();
    await fireEvent.press(screen.getByTestId('terms-link'));
    expect(onLinkPress).toHaveBeenCalledTimes(1);
    expect(onToggle).not.toHaveBeenCalled();
  });
});

describe('SelectableTile', () => {
  it('reports selected and disabled states', async () => {
    const onPress = jest.fn();
    await render(
      <>
        <SelectableTile label="Leite" icon="allergenMilk" selected onPress={onPress} />
        <SelectableTile
          label="Soja"
          icon="allergenSoy"
          selected={false}
          disabled
          onPress={onPress}
        />
      </>,
    );
    expect(screen.getByRole('checkbox', { name: 'Leite' })).toBeChecked();
    const soy = screen.getByRole('checkbox', { name: 'Soja' });
    expect(soy).toBeDisabled();
    await fireEvent.press(soy);
    expect(onPress).not.toHaveBeenCalled();
    await fireEvent.press(screen.getByRole('checkbox', { name: 'Leite' }));
    expect(onPress).toHaveBeenCalledTimes(1);
  });
});

describe('ProgressSteps', () => {
  it('fills the current step and the previous ones', async () => {
    await render(<ProgressSteps total={3} current={2} />);
    expect(screen.getByLabelText('Passo 2 de 3')).toBeTruthy();
    expect(screen.getAllByTestId(/progress-step-/)).toHaveLength(3);
  });
});
