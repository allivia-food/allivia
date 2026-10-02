import { useState } from 'react';
import {
  Modal as NativeModal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button, Chip, Icon, IconButton } from '@/components/ui';
import type { PreferenceId } from '@/constants/preferences';
import { strings } from '@/constants/strings';
import {
  defaultFilters,
  DIET_FILTERS,
  MEAL_TYPES,
  TIME_RANGES,
  toggleDiet,
  validateIngredient,
  type RecipeFilters,
} from '@/features/recipes/filters';
import { colors, layout, radius, shadows, sizes, spacing, typography } from '@/theme';

export interface FilterSheetProps {
  filters: RecipeFilters;
  profilePreferences: readonly PreferenceId[];
  onApply: (filters: RecipeFilters) => void;
  onClose: () => void;
}

const t = strings.recipeFilters;
const r = layout.recipes;

export function FilterSheet({ filters, profilePreferences, onApply, onClose }: FilterSheetProps) {
  const [draft, setDraft] = useState<RecipeFilters>(filters);
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const k = width / layout.frameWidth;

  return (
    <NativeModal
      visible
      transparent
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={styles.overlay}>
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel={t.close}
          testID="filters-backdrop"
        />
        <View
          style={[
            styles.card,
            {
              width: Math.min(r.filterSheetWidth * k, width - spacing.lg),
              marginTop: r.filterSheetTop * k,
              marginBottom: insets.bottom + spacing.lg,
            },
          ]}
          accessibilityViewIsModal
          testID="filters-sheet"
        >
          <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
            <View style={styles.header}>
              <IconButton icon="arrowBack" onPress={onClose} accessibilityLabel={t.close} />
              <Text style={styles.title} accessibilityRole="header">
                {t.title}
              </Text>
            </View>

            <Section title={t.meal}>
              <Chip
                variant="filter"
                label={strings.recipes.all}
                active={draft.mealType === null}
                onPress={() => setDraft({ ...draft, mealType: null })}
              />
              {MEAL_TYPES.map((m) => (
                <Chip
                  key={m.id}
                  variant="filter"
                  label={m.label}
                  active={draft.mealType === m.id}
                  onPress={() => setDraft({ ...draft, mealType: m.id })}
                  testID={`filter-meal-${m.id}`}
                />
              ))}
            </Section>

            <Section title={t.time}>
              {TIME_RANGES.map((range) => (
                <Chip
                  key={range.id}
                  variant="filter"
                  label={range.label}
                  active={draft.time === range.id}
                  onPress={() =>
                    setDraft({ ...draft, time: draft.time === range.id ? null : range.id })
                  }
                  testID={`filter-time-${range.id}`}
                />
              ))}
            </Section>

            <Section title={t.diets}>
              {DIET_FILTERS.map((diet) => (
                <Chip
                  key={diet.id}
                  variant="filter"
                  label={diet.label}
                  active={draft.diets.includes(diet.id)}
                  onPress={() => setDraft({ ...draft, diets: toggleDiet(draft.diets, diet.id) })}
                  testID={`filter-diet-${diet.id}`}
                />
              ))}
            </Section>

            <Text style={typography.sectionTitle}>{t.ingredients}</Text>
            <IngredientField
              label={t.include}
              icon="plus"
              values={draft.include}
              onChange={(include) => setDraft({ ...draft, include })}
              testID="filter-include"
            />
            <IngredientField
              label={t.exclude}
              icon="minus"
              values={draft.exclude}
              onChange={(exclude) => setDraft({ ...draft, exclude })}
              testID="filter-exclude"
            />

            <Text style={styles.note}>{t.allergiesNote}</Text>

            <View style={styles.actions}>
              <View style={styles.action}>
                <Button
                  label={t.clear}
                  variant="secondary"
                  size="small"
                  onPress={() => setDraft(defaultFilters(profilePreferences))}
                  testID="filters-clear"
                />
              </View>
              <View style={styles.action}>
                <Button
                  label={t.apply}
                  size="small"
                  onPress={() => onApply(draft)}
                  testID="filters-apply"
                />
              </View>
            </View>
          </ScrollView>
        </View>
      </View>
    </NativeModal>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={typography.sectionTitle}>{title}</Text>
      <View style={styles.chips}>{children}</View>
    </View>
  );
}

interface IngredientFieldProps {
  label: string;
  icon: 'plus' | 'minus';
  values: string[];
  onChange: (values: string[]) => void;
  testID: string;
}

function IngredientField({ label, icon, values, onChange, testID }: IngredientFieldProps) {
  const [text, setText] = useState('');
  const [touched, setTouched] = useState(false);
  const error = text.length > 0 || touched ? validateIngredient(text, values) : null;

  function add() {
    setTouched(true);
    if (validateIngredient(text, values)) return;
    onChange([...values, text.trim().replace(/\s+/g, ' ')]);
    setText('');
    setTouched(false);
  }

  return (
    <View style={styles.ingredient}>
      <Text style={styles.ingredientLabel}>{label}</Text>
      <View style={styles.inputBox}>
        <Pressable
          onPress={add}
          accessibilityRole="button"
          accessibilityLabel={t.add(text || label)}
          hitSlop={spacing.md}
          testID={`${testID}-add`}
        >
          {icon === 'plus' ? (
            <Icon name="plus" size={sizes.iconSmall} color={colors.textPlaceholder} />
          ) : (
            <View style={styles.minus} />
          )}
        </Pressable>
        <TextInput
          value={text}
          onChangeText={setText}
          placeholder={label}
          placeholderTextColor={colors.textPlaceholder}
          style={styles.input}
          returnKeyType="done"
          onSubmitEditing={add}
          maxLength={40}
          accessibilityLabel={label}
          testID={`${testID}-input`}
        />
      </View>
      {error && touched ? <Text style={styles.error}>{t.errors[error]}</Text> : null}
      {values.length > 0 ? (
        <View style={styles.chips}>
          {values.map((v) => (
            <Pressable
              key={v}
              onPress={() => onChange(values.filter((x) => x !== v))}
              accessibilityRole="button"
              accessibilityLabel={t.remove(v)}
              style={styles.termChip}
              testID={`${testID}-chip-${v}`}
            >
              <Text style={[typography.chip, styles.termText]}>{v} ×</Text>
            </Pressable>
          ))}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: colors.overlay, alignItems: 'flex-end' },
  card: {
    flexShrink: 1,
    backgroundColor: colors.surface,
    borderWidth: sizes.border,
    borderColor: colors.primary,
    borderTopLeftRadius: radius.card,
    borderBottomLeftRadius: radius.card,
    ...shadows.card,
  },
  content: { padding: spacing.lg, gap: spacing.lg },
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  title: { ...typography.headerTitle, color: colors.primary, flex: 1 },
  section: { gap: spacing.sm },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  ingredient: { gap: spacing.sm },
  ingredientLabel: { ...typography.bannerTitle, color: colors.textSecondary },
  inputBox: {
    minHeight: r.ingredientInputHeight,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    borderWidth: sizes.border,
    borderStyle: 'dashed',
    borderColor: colors.primary,
    borderRadius: radius.image,
  },
  minus: {
    width: sizes.iconSmall,
    height: sizes.progressHeight - 2,
    borderRadius: radius.progress,
    backgroundColor: colors.textPlaceholder,
  },
  input: { flex: 1, ...typography.bodySmall, outlineWidth: 0 },
  error: { ...typography.fieldError },
  termChip: {
    minHeight: sizes.chipHeight,
    paddingHorizontal: spacing.md,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceOrange,
    justifyContent: 'center',
  },
  termText: { color: colors.primary },
  note: { ...typography.bannerTitle, color: colors.secondary, textAlign: 'center' },
  actions: { flexDirection: 'row', gap: spacing.sm },
  action: { flex: 1 },
});
