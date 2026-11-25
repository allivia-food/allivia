import { router } from 'expo-router';
import { useState, type ReactNode } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  Banner,
  BottomSheet,
  Button,
  Card,
  Checkbox,
  Chip,
  ChipGroup,
  IconBadge,
  IconButton,
  Input,
  LargeTitleHeader,
  Modal,
  ProgressSteps,
  ScreenHeader,
  SelectableTile,
  StateView,
  TabBar,
  Toast,
  type TabKey,
} from '@/components/ui';
import { retrySession } from '@/features/auth/sessionListener';
import { useSessionStore } from '@/store/session';
import { colors, layout, radius, spacing, typography, sizes } from '@/theme';

export default function ComponentCatalogScreen() {
  const [checked, setChecked] = useState(false);
  const [tiles, setTiles] = useState<Record<string, boolean>>({ leite: true, amendoim: false });
  const [chip, setChip] = useState('Todas');
  const [tab, setTab] = useState<TabKey>('home');
  const [modal, setModal] = useState(false);
  const [toast, setToast] = useState(false);
  const status = useSessionStore((s) => s.status);
  const simulate = useSessionStore((s) => s.simulate);

  return (
    <SafeAreaView style={styles.screen} edges={['bottom']}>
      <ScreenHeader title="Componentes" onBack={() => router.back()} />
      <ScrollView contentContainerStyle={styles.content}>
        <Section title={`Roteamento (estado atual: ${status})`}>
          <Button
            label="Simular: deslogado"
            variant="secondary"
            size="small"
            onPress={() => go('signedOut')}
          />
          <Button
            label="Simular: onboarding (passo 2)"
            variant="secondary"
            size="small"
            onPress={() => go('onboarding', 1)}
          />
          <Button
            label="Simular: onboarding completo"
            variant="secondary"
            size="small"
            onPress={() => go('ready')}
          />
          <Button
            label="Usar sessão real"
            variant="text"
            onPress={() => {
              simulate(null);
              void retrySession();
              router.replace('/');
            }}
          />
        </Section>

        <Section title="Button">
          <Button label="Entrar" onPress={noop} />
          <Button label="Fazer Login" variant="accent" onPress={noop} />
          <Button label="Avançar (3 selecionadas)" rightIcon="arrowRightWhite" onPress={noop} />
          <Button label="Secundário (contorno)" variant="secondary" onPress={noop} />
          <Button label="Voltar para Home" variant="text" onPress={noop} />
          <Button label="Desabilitado" disabled onPress={noop} />
          <Button label="Carregando" loading onPress={noop} />
          <Button
            label="Ver receita"
            variant="accent"
            size="small"
            rightIcon="chevronRightWhite"
            onPress={noop}
          />
        </Section>

        <Section title="Input">
          <Input icon="mail" placeholder="Email" keyboardType="email-address" />
          <Input icon="lock" placeholder="Senha" secure />
          <Input
            icon="mail"
            placeholder="Email"
            defaultValue="joana@exemplo"
            error="Informe um e-mail válido."
          />
          <Input icon="mail" placeholder="Desabilitado" disabled />
        </Section>

        <Section title="Checkbox" dark>
          <Checkbox
            checked={checked}
            onToggle={() => setChecked((c) => !c)}
            label="Li e aceito os "
            linkText="Termos de uso"
            onLinkPress={() => setModal(true)}
            textColor={colors.textOnPrimary}
          />
          <Checkbox
            checked={false}
            onToggle={noop}
            label="Com erro"
            error
            textColor={colors.textOnPrimary}
          />
        </Section>

        <Section title="Chip">
          <ChipGroup inset={0}>
            {['Todas', 'Café da manhã', 'Almoço', 'Jantar', 'Lanche'].map((label) => (
              <Chip
                key={label}
                variant="filter"
                label={label}
                active={chip === label}
                onPress={() => setChip(label)}
              />
            ))}
          </ChipGroup>
          <View style={styles.row}>
            <Chip label="Café da manhã" />
            <Chip label="Sem lactose" tone="orange" />
            <Chip label="15 min" variant="time" />
          </View>
        </Section>

        <Section title="SelectableTile">
          <View style={styles.row}>
            <SelectableTile
              label="Leite"
              icon="allergenMilk"
              selected={tiles.leite}
              onPress={() => setTiles((s) => ({ ...s, leite: !s.leite }))}
            />
            <SelectableTile
              label="Amendoim"
              icon="allergenPeanut"
              selected={tiles.amendoim}
              onPress={() => setTiles((s) => ({ ...s, amendoim: !s.amendoim }))}
            />
          </View>
          <View style={styles.row}>
            <SelectableTile
              label="Frutos do mar"
              icon="allergenShellfish"
              selected={false}
              onPress={noop}
            />
            <SelectableTile
              label="Desabilitado"
              icon="allergenSoy"
              selected={false}
              disabled
              onPress={noop}
            />
          </View>
        </Section>

        <Section title="Card e IconBadge">
          <Card style={styles.cardBody}>
            <Text style={typography.sectionTitle}>Card padrão</Text>
          </Card>
          <Card variant="green" style={styles.cardBody}>
            <Text style={typography.sectionTitle}>Suas restrições</Text>
            <View style={styles.row}>
              <IconBadge icon="allergenMilk" accessibilityLabel="Leite" />
              <IconBadge icon="allergenGluten" accessibilityLabel="Glúten" />
              <IconBadge icon="allergenEgg" size="small" accessibilityLabel="Ovo" />
            </View>
          </Card>
          <Card variant="orange" style={styles.cardBody}>
            <Text style={[typography.buttonLarge, { color: colors.primary }]}>Scanner Allivia</Text>
            <IconBadge icon="barcodeLarge" size="large" />
          </Card>
        </Section>

        <Section title="Cabeçalhos e IconButton">
          <View style={styles.framed}>
            <LargeTitleHeader
              title="Receitas"
              subtitle="Encontre receitas seguras e deliciosas para o seu dia a dia"
              right={
                <IconButton
                  icon="filter"
                  variant="circle"
                  badge={2}
                  onPress={noop}
                  accessibilityLabel="Filtros"
                />
              }
            />
          </View>
        </Section>

        <Section title="ProgressSteps">
          <ProgressSteps total={3} current={1} />
          <ProgressSteps total={3} current={2} />
          <ProgressSteps total={3} current={3} />
        </Section>

        <Section title="Banner">
          <Banner variant="error" title="Atenção! Possíveis alergênicos para você:">
            Leite, Trigo, Ovo
          </Banner>
          <Banner variant="success" title="Segura para você!">
            Esta receita não contém ingredientes que causam suas alergias.
          </Banner>
          <Banner variant="warning" title="Confira os ingredientes.">
            Não conseguimos verificar automaticamente: castanhas.
          </Banner>
          <Banner variant="info" title="Dica Allivia">
            Você pode variar os ingredientes de acordo com sua preferência.
          </Banner>
        </Section>

        <Section title="StateView">
          {(['loading', 'empty', 'error', 'offline'] as const).map((v) => (
            <View key={v} style={styles.stateBox}>
              <StateView variant={v} onRetry={noop} actionLabel="Limpar filtros" onAction={noop} />
            </View>
          ))}
        </Section>

        <Section title="Modal e Toast">
          <Button label="Abrir pop-up" variant="secondary" onPress={() => setModal(true)} />
          <Button label="Mostrar toast" variant="secondary" onPress={() => setToast(true)} />
        </Section>

        <Section title="TabBar">
          <TabBar active={tab} onTabPress={setTab} />
        </Section>

        <Section title="BottomSheet">
          <View style={styles.sheetBox}>
            <BottomSheet minHeight="35%" maxHeight="90%" accessibilityLabel="Expandir lista">
              <Text style={[typography.sectionTitle, styles.sheetText]}>Perto de você</Text>
            </BottomSheet>
          </View>
        </Section>
      </ScrollView>

      <Modal visible={modal} onClose={() => setModal(false)} title="Termos de Uso">
        <Text style={typography.subtitle}>
          O Allivia é uma ferramenta de apoio e não substitui orientação de profissionais de saúde.
        </Text>
      </Modal>
      <Toast
        visible={toast}
        message="Receita removida"
        actionLabel="Desfazer"
        onAction={noop}
        onHide={() => setToast(false)}
      />
    </SafeAreaView>
  );

  function go(next: 'signedOut' | 'onboarding' | 'ready', step = 0) {
    simulate(next, step);
    router.replace('/');
  }
}

function noop() {}

function Section({
  title,
  children,
  dark = false,
}: {
  title: string;
  children: ReactNode;
  dark?: boolean;
}) {
  return (
    <View style={[styles.section, dark && styles.sectionDark]}>
      <Text style={[typography.sectionTitle, dark && { color: colors.textOnPrimary }]}>
        {title}
      </Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: {
    paddingHorizontal: spacing.screenHorizontal,
    paddingBottom: spacing.xxl,
    gap: spacing.xxl,
  },
  section: { gap: spacing.md },
  sectionDark: { backgroundColor: colors.primary, padding: spacing.lg, borderRadius: radius.card },
  row: { flexDirection: 'row', gap: spacing.tileGap, alignItems: 'center' },
  cardBody: { padding: spacing.md, gap: spacing.md },
  framed: {
    borderWidth: sizes.border,
    borderColor: colors.chipInactive,
    paddingBottom: spacing.md,
  },
  stateBox: {
    height: layout.devCatalog.stateHeight,
    borderWidth: sizes.border,
    borderColor: colors.chipInactive,
  },
  sheetBox: {
    height: layout.devCatalog.sheetHeight,
    backgroundColor: colors.chipInactive,
    overflow: 'hidden',
  },
  sheetText: { paddingHorizontal: spacing.lg },
});
