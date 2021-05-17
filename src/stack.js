import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { Appbar, Avatar, useTheme } from 'react-native-paper';
import { Image } from 'react-native';

import { FeedScreen } from './feed';
import { DetailsScreen } from './details';

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
        <Stack.Screen
          name="Feed"
          component={FeedScreen}
          options={{ headerTitle: 'Feed' }}
        />
        <Stack.Screen
          name="Details"
          component={DetailsScreen}
          options={{ headerTitle: 'Details' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
