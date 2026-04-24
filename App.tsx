import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View } from 'react-native';

// If you plan to use custom fonts later, you can preload them here
// import * as Font from 'expo-font';
// import { useEffect, useState } from 'react';

export default function App() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome to Shamba Mobile</Text>
      <Text style={styles.subtitle}>Your farming companion app</Text>
      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#2e7d32', // nice green for farming theme
  },
  subtitle: {
    fontSize: 16,
    color: '#555',
  },
});
