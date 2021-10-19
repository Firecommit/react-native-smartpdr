import React from 'react';
import { View, Text } from 'react-native';
import { useAttitude } from '../hooks/useAttitude';
import { useHeading } from '../hooks/useHeading';
import { useSensorListener } from '../hooks/useSensorListener';

export const useHeadingExample = () => {
  const [attitude, setAttitudeSensors] = useAttitude();
  const [ref, state, setHeadingSensors] = useHeading(attitude);

  useSensorListener(
    'fusion',
    ([acc, mag, gyr]) => {
      setAttitudeSensors({ acc, mag });
      setHeadingSensors({ acc, mag, gyr }, 100);
    },
    100
  );

  const deg = (ang: number): number => {
    return ang ? Number(((ang * 180) / Math.PI).toFixed(4)) : 0;
  };

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Text style={{ fontSize: 20, marginBottom: 16 }}>useHeadingExample</Text>
      <Text style={{ fontSize: 14 }}>headingMag: {deg(state.mag)}</Text>
      <Text style={{ fontSize: 14 }}>headingGyr: {deg(state.gyr)}</Text>
      <Text style={{ fontSize: 14 }}>heading: {deg(state.origin)}</Text>
    </View>
  );
};
