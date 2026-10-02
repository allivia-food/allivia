import { StyleSheet, View } from 'react-native';

import { SelectableTile } from '@/components/ui';
import { preferenceIcons } from '@/constants/icons';
import { PREFERENCES } from '@/constants/preferences';
import { strings } from '@/constants/strings';
import { togglePreference, type PreferenceOption } from '@/features/onboarding/selection';
import { layout } from '@/theme';

export interface PreferenceSelectorProps {
  selected: PreferenceOption[];
  onChange: (selected: PreferenceOption[]) => void;
}

const OPTIONS: readonly { id: PreferenceOption; label: string }[] = [
  ...PREFERENCES,
  { id: 'none', label: strings.onboarding.none },
];

export function PreferenceSelector({ selected, onChange }: PreferenceSelectorProps) {
  return (
    <View style={styles.list}>
      {OPTIONS.map((option) => (
        <View key={option.id} style={styles.row}>
          <SelectableTile
            label={option.label}
            icon={preferenceIcons[option.id]}
            selected={selected.includes(option.id)}
            onPress={() => onChange(togglePreference(selected, option.id))}
            testID={`preference-${option.id}`}
          />
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  list: { gap: layout.onboarding.tileRowGap },
  row: { flexDirection: 'row' },
});
