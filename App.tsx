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
import { AttitudeScreen } from './src/component/attitude';
import { StepScreen } from './src/component/step';
import { HeadingScreen } from './src/component/heading';
import { LengthScreen } from './src/component/length';
import { LocationScreen } from './src/component/location';

export const App = () => {
  const Stack = createNativeStackNavigator();
  const Screen = {
    Feed: {
      component: FeedScreen,
      options: { headerTitle: 'Feed Screen' },
    },
    Attitude: {
      component: AttitudeScreen,
      options: { headerTitle: 'Device Attitude Estimation' },
    },
    Step: {
      component: StepScreen,
      options: { headerTitle: 'Step Event Detection' },
    },
    Heading: {
      component: HeadingScreen,
      options: { headerTitle: 'Heading Direction Estimation' },
    },
    Length: {
      component: LengthScreen,
      options: { headerTitle: 'Step Length Estimation' },
    },
    Location: {
      component: LocationScreen,
      options: { headerTitle: 'Indoor Location Estimation' },
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
