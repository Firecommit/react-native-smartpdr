import React from 'react';
import { Provider as PaperProvider, DefaultTheme } from 'react-native-paper';

import { StackNavigator } from './stack';

export function Main() {
  return (
    <PaperProvider
      theme={{
        ...DefaultTheme,
        colors: { ...DefaultTheme.colors, primary: '#fc8132' },
      }}
    >
      <StackNavigator />
    </PaperProvider>
  );
}
