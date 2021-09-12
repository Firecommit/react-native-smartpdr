import React from 'react';
import { View, Text } from 'react-native';
import { useSensorListener } from '../hooks/useSensor';

export const AttitudeScreen = () => {
  useSensorListener(
    'fusion',
    ([acc, mag, gyr]) => {
      console.log('acc:', acc.current);
      console.log('mag:', mag.current);
      console.log('gyr:', gyr.current);
    },
    1000
  );

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Text style={{ fontSize: 20 }}>Attitude Screen</Text>
    </View>
  );
};
