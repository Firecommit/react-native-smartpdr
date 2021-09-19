/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * Generated with the TypeScript template
 * https://github.com/react-native-community/react-native-template-typescript
 *
 * @format
 */

import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { FeedScreen } from './src/feed';
import { useSensorListenerExample } from './src/examples/useSensorListenerExample';
import { useAttitudeExample } from './src/examples/useAttitudeExample';
import { useStepExample } from './src/examples/useStepExample';
import { useHeadingExample } from './src/examples/useHeadingExample';

export const App = () => {
  const Stack = createNativeStackNavigator();
  const Screen = {
    Feed: {
      component: FeedScreen,
      options: { headerTitle: 'Feed Screen' },
    },
    Sensors: {
      component: useSensorListenerExample,
      options: { headerTitle: 'Embeded Sensors Example' },
    },
    Attitude: {
      component: useAttitudeExample,
      options: { headerTitle: 'Device Attitude Estimation' },
    },
    Step: {
      component: useStepExample,
      options: { headerTitle: 'Step Event Detection' },
    },
    Heading: {
      component: useHeadingExample,
      options: { headerTitle: 'Heading Direction Estimation' },
    },
  };
  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <Stack.Navigator initialRouteName="Feed">
          {Object.entries(Screen).map(([name, params]) => (
            <Stack.Screen
              key={name}
              name={name}
              component={params.component}
              options={params.options}
            />
          ))}
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
};
