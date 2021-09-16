import React from 'react';
import { View, Text } from 'react-native';
import { useAttitude } from '../hooks/useAttitude';
import { useSensorListener } from '../hooks/useSensorListener';

export const useAttitudeExample = () => {
  const [attitude, setAttitudeSensors] = useAttitude();

  useSensorListener(
    'fusion',
    ([acc, mag, gyr]) => {
      setAttitudeSensors({ acc, mag });
      if (attitude.current) {
        console.log(
          'pitch:',
          deg(attitude.current.pitch),
          'roll:',
          deg(attitude.current.roll),
          'yaw:',
          deg(attitude.current.yaw)
        );
      }
    },
    100
  );

  const deg = (ang: number): string => {
    return ((ang * 180) / Math.PI).toFixed(4);
  };

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Text style={{ fontSize: 20, marginBottom: 16 }}>useAttitudeExample</Text>
      <Text style={{ fontSize: 14 }}>check your debug console log!</Text>
    </View>
  );
};
