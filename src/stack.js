import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { Appbar, useTheme } from 'react-native-paper';
import { Image } from 'react-native';

import { FeedScreen } from './feed';
import { AttitudeScreen } from './attitude';
import { StepEventScreen } from './stepEvent';
import { HeadingDirectionScreen } from './headingDirection';
import { StepLengthScreen } from './stepLength';
import { LocationScreen } from './location';

function Header({ scene, previous, navigation }) {
  const { options } = scene.descriptor;
  const title =
    options.headerTitle !== undefined
      ? options.headerTitle
      : options.title !== undefined
      ? options.title
      : scene.route.name;
  const theme = useTheme();

  return (
    <Appbar.Header theme={{ colors: { primary: theme.colors.surface } }}>
      {previous ? (
        <Appbar.BackAction
          onPress={navigation.goBack}
          color={theme.colors.primary}
        />
      ) : null}
      <Appbar.Content
        title={
          previous ? (
            title
          ) : (
            <Image
              source={require('../assets/firecommit_icon.png')}
              style={{ width: 48, height: 48 }}
            />
          )
        }
      />
    </Appbar.Header>
  );
}

export function StackNavigator() {
  const Stack = createStackNavigator();

  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Feed"
        headerMode="screen"
        screenOptions={{
          header: ({ scene, previous, navigation }) => (
            <Header scene={scene} previous={previous} navigation={navigation} />
          ),
        }}
      >
        {Object.entries(StackScreen).map(([rootName, params], idx) => (
          <Stack.Screen key={idx} name={rootName} {...params} />
        ))}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const StackScreen = {
  Feed: { component: FeedScreen, options: { headerTitle: 'Feed' } },
  Attitude: {
    component: AttitudeScreen,
    options: { headerTitle: 'Attitude Estimation' },
  },
  StepEvent: {
    component: StepEventScreen,
    options: { headerTitle: 'Step Event Detection' },
  },
  HeadingDirection: {
    component: HeadingDirectionScreen,
    options: { headerTitle: 'Heading Direction Estimation' },
  },
  StepLength: {
    component: StepLengthScreen,
    options: { headerTitle: 'Step Length Estimation' },
  },
  Location: {
    component: LocationScreen,
    options: { headerTitle: 'Location Estimation' },
  },
};
