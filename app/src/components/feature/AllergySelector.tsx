import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Button, Icon, Input, Modal, SelectableTile } from '@/components/ui';
import { ALLERGENS, type AllergenId } from '@/constants/allergens';
import { allergenIcons, CUSTOM_ALLERGY_ICON } from '@/constants/icons';
import { strings } from '@/constants/strings';
import {
  MAX_CUSTOM_ALLERGIES,
  toggleAllergy,
  validateCustomAllergy,
} from '@/features/onboarding/selection';
import { colors, layout, opacity, radius, sizes, spacing, typography } from '@/theme';
import { normalizeDisplayName } from '@/utils/validators';

export interface AllergySelectorProps {
  allergies: AllergenId[];
  customAllergies: string[];
  onChange: (allergies: AllergenId[], customAllergies: string[]) => void;
}

const t = strings.onboarding;
const o = layout.onboarding;

type Tile = { kind: 'catalog'; id: AllergenId; label: string } | { kind: 'custom'; label: string };

export function AllergySelector({ allergies, customAllergies, onChange }: AllergySelectorProps) {
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState('');
  const [draftTouched, setDraftTouched] = useState(false);

  const tiles: Tile[] = [
    ...ALLERGENS.map((a) => ({ kind: 'catalog' as const, id: a.id, label: a.label })),
    ...customAllergies.map((label) => ({ kind: 'custom' as const, label })),
  ];
  const rows: Tile[][] = [];
  for (let i = 0; i < tiles.length; i += 2) rows.push(tiles.slice(i, i + 2));

  const draftError = validateCustomAllergy(draft, customAllergies);
  const atLimit = customAllergies.length >= MAX_CUSTOM_ALLERGIES;

  function closeModal() {
    setAdding(false);
    setDraft('');
    setDraftTouched(false);
  }

  function confirmDraft() {
    setDraftTouched(true);
    if (draftError) return;
    onChange(allergies, [...customAllergies, normalizeDisplayName(draft)]);
    closeModal();
  }

  return (
    <View style={styles.grid}>
      {rows.map((row) => (
        <View key={row.map((r) => r.label).join('|')} style={styles.row}>
          {row.map((tile) =>
            tile.kind === 'catalog' ? (
              <SelectableTile
                key={tile.id}
                label={tile.label}
                icon={allergenIcons[tile.id]}
                selected={allergies.includes(tile.id)}
                onPress={() => onChange(toggleAllergy(allergies, tile.id), customAllergies)}
                testID={`allergy-${tile.id}`}
              />
            ) : (
              <SelectableTile
                key={`custom-${tile.label}`}
                label={tile.label}
                icon={CUSTOM_ALLERGY_ICON}
                selected
                onPress={() => {}}
                onRemove={() =>
                  onChange(
                    allergies,
                    customAllergies.filter((c) => c !== tile.label),
                  )
                }
                removeLabel={t.removeAllergy(tile.label)}
                testID={`allergy-custom-${tile.label}`}
              />
            ),
          )}
          {row.length === 1 ? <View style={styles.spacer} /> : null}
        </View>
      ))}

      <Pressable
        onPress={() => setAdding(true)}
        disabled={atLimit}
        accessibilityRole="button"
        accessibilityLabel={t.addAllergy}
        accessibilityState={{ disabled: atLimit }}
        testID="allergy-add"
        style={({ pressed }) => [styles.add, pressed && styles.pressed, atLimit && styles.disabled]}
      >
        <Icon name="plus" size={sizes.iconSmall} color={colors.textPlaceholder} />
        <Text style={styles.addText}>{t.addAllergy}</Text>
      </Pressable>
      {atLimit ? <Text style={styles.limit}>{strings.customAllergyErrors.limit}</Text> : null}

      <Modal visible={adding} onClose={closeModal} title={t.addAllergyTitle} testID="allergy-modal">
        <Input
          placeholder={t.addAllergyPlaceholder}
          value={draft}
          onChangeText={setDraft}
          onBlur={() => setDraftTouched(true)}
          error={draftTouched && draftError ? strings.customAllergyErrors[draftError] : undefined}
          maxLength={60}
          autoFocus
          returnKeyType="done"
          onSubmitEditing={confirmDraft}
          testID="allergy-modal-input"
        />
        <Button
          label={t.addAllergyConfirm}
          onPress={confirmDraft}
          disabled={Boolean(draftError)}
          testID="allergy-modal-confirm"
        />
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  grid: { gap: o.tileRowGap },
  row: { flexDirection: 'row', gap: spacing.tileGap },
  spacer: { flex: 1 },
  add: {
    minHeight: o.addAllergyHeight,
    marginTop: spacing.md,
    borderWidth: sizes.border,
    borderStyle: 'dashed',
    borderColor: colors.primary,
    borderRadius: radius.card,
    backgroundColor: colors.surface,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.xl,
  },
  addText: { ...typography.input, color: colors.textPlaceholder },
  pressed: { opacity: opacity.pressed },
  disabled: { opacity: opacity.disabled },
  limit: { ...typography.caption, color: colors.textSecondary },
});
