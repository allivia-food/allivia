import { Tabs } from 'expo-router';

import { TabBar, TABS, type TabKey } from '@/components/ui';

const isTabKey = (name: string): name is TabKey => TABS.some((t) => t.key === name);

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{ headerShown: false }}
      tabBar={({ state, navigation }) => {
        const current = state.routes[state.index]?.name ?? 'home';
        return (
          <TabBar
            active={isTabKey(current) ? current : 'home'}
            onTabPress={(key) => navigation.navigate(key)}
          />
        );
      }}
    >
      {TABS.map((tab) => (
        <Tabs.Screen key={tab.key} name={tab.key} options={{ title: tab.label }} />
      ))}
    </Tabs>
  );
}
