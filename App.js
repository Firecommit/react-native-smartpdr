import React from 'react';
import Constants from 'expo-constants';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { Main } from './src/main';
import { AnimatedAppLoader } from './src/splash';

export default function App() {
  return (
    <SafeAreaProvider>
      <AnimatedAppLoader image={{ uri: Constants.manifest.splash.image }}>
        <Main />
      </AnimatedAppLoader>
    </SafeAreaProvider>
  );
}
