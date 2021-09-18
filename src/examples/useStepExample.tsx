import React from 'react';
import { View, Text } from 'react-native';
import { useAttitude } from '../hooks/useAttitude';
import { useSensorListener } from '../hooks/useSensorListener';
import { useStep } from '../hooks/useStep';

export const useStepExample = () => {
  const [attitude, setAttitudeSensor] = useAttitude();
  const [step, setStepSensor] = useStep(attitude);

  useSensorListener(
    'fusion',
    ([acc, mag, gyr]) => {
      setAttitudeSensor({ acc, mag });
      setStepSensor({ acc });
    },
    100
  );

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Text style={{ fontSize: 20, marginBottom: 16 }}>useStepExample</Text>
      <Text style={{ fontSize: 14 }}>
        count: {step.count} length: {step.length.toFixed(6)}
      </Text>
    </View>
  );
};
