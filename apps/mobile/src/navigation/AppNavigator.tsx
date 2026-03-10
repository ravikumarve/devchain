import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { useAuthStore } from '../store/authStore';

import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import HomeScreen from '../screens/HomeScreen';
import JobsScreen from '../screens/JobsScreen';
import ProfileScreen from '../screens/ProfileScreen';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

function AuthStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
    </Stack.Navigator>
  );
}

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#111',
          borderTopColor: '#1e1e1e',
          paddingBottom: 8,
          height: 60,
        },
        tabBarActiveTintColor: '#7C3AED',
        tabBarInactiveTintColor: '#555',
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{ tabBarLabel: 'Marketplace', tabBarIcon: ({ color }) => <TabIcon icon="🛍️" color={color} /> }}
      />
      <Tab.Screen
        name="Jobs"
        component={JobsScreen}
        options={{ tabBarLabel: 'Jobs', tabBarIcon: ({ color }) => <TabIcon icon="💼" color={color} /> }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{ tabBarLabel: 'Profile', tabBarIcon: ({ color }) => <TabIcon icon="👤" color={color} /> }}
      />
    </Tab.Navigator>
  );
}

function TabIcon({ icon, color }: { icon: string; color: string }) {
  const { Text } = require('react-native');
  return <Text style={{ fontSize: 20, opacity: color === '#7C3AED' ? 1 : 0.5 }}>{icon}</Text>;
}

export default function AppNavigator() {
  const { isAuthenticated, loadUser } = useAuthStore();

  useEffect(() => { loadUser(); }, []);

  return (
    <NavigationContainer>
      {isAuthenticated ? <MainTabs /> : <AuthStack />}
    </NavigationContainer>
  );
}
