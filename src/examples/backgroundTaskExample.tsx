import React from 'react';
import { View, Text } from 'react-native';
import { useAttitude } from '../hooks/useAttitude';
import { useHeading } from '../hooks/useHeading';
import { useSensorListener } from '../hooks/useSensorListener';

export const backgroundTaskExample = () => {
  const [attitude, setAttitudeSensors] = useAttitude();
  const [heading, setHeadingSensors] = useHeading(attitude);

  useSensorListener(
    'fusion',
    ([acc, mag, gyr]) => {
      setAttitudeSensors({ acc, mag });
      setHeadingSensors({ acc, mag, gyr }, 100);
      console.log(attitude.current);
    },
    100
  );

  const deg = (ang: number): string => {
    return ((ang * 180) / Math.PI).toFixed(4);
  };

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Text style={{ fontSize: 20, marginBottom: 16 }}>
        BackgroundTaskExample
      </Text>
      <Text style={{ fontSize: 14 }}>check your debug console log!</Text>
      <Text style={{ fontSize: 14 }}>heading: {deg(heading)}</Text>
    </View>
  );
};
