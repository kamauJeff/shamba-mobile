import { Tabs } from 'expo-router';
import { useTheme } from '../../src/lib/theme';

export default function TabsLayout() {
  const theme = useTheme();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.colors.navActive,
        tabBarInactiveTintColor: theme.colors.navInactive,
        tabBarStyle: {
          backgroundColor: theme.colors.navBg,
          borderTopColor: theme.colors.border,
          borderTopWidth: 0.5,
          paddingBottom: 16,
          paddingTop: 8,
          height: 62,
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '500',
          marginTop: 2,
        },
      }}
    >
      <Tabs.Screen
        name="dashboard"
        options={{ title: 'Home', tabBarIcon: ({ color }) => <TabIcon emoji="🏠" color={color} /> }}
      />
      <Tabs.Screen
        name="market"
        options={{ title: 'Market', tabBarIcon: ({ color }) => <TabIcon emoji="🛒" color={color} /> }}
      />
      <Tabs.Screen
        name="loans"
        options={{ title: 'Loans', tabBarIcon: ({ color }) => <TabIcon emoji="💳" color={color} /> }}
      />
      <Tabs.Screen
        name="groups"
        options={{ title: 'Groups', tabBarIcon: ({ color }) => <TabIcon emoji="👥" color={color} /> }}
      />
      <Tabs.Screen
        name="profile"
        options={{ title: 'Profile', tabBarIcon: ({ color }) => <TabIcon emoji="👤" color={color} /> }}
      />
    </Tabs>
  );
}

function TabIcon({ emoji, color }: { emoji: string; color: string }) {
  const { Text } = require('react-native');
  return <Text style={{ fontSize: 20, opacity: color === '#888' ? 0.5 : 1 }}>{emoji}</Text>;
}
