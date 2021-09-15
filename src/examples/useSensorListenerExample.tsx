import React from 'react';
import { View, Text } from 'react-native';
import { useSensorListener } from '../hooks/useSensorListener';

export const useSensorListenerExample = () => {
  useSensorListener(
    'fusion',
    ([acc, mag, gyr]) => {
      console.log('acc:', acc.current);
      console.log('mag:', mag.current);
      console.log('gyr:', gyr.current);
      console.log('\n');
    },
    100
  );

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Text style={{ fontSize: 20, marginBottom: 16 }}>
        useSensorListenerExample
      </Text>
      <Text style={{ fontSize: 14 }}>check your debug console log!</Text>
    </View>
  );
};
