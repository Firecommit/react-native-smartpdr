import React, { useRef, useEffect } from 'react';
import { View, Text } from 'react-native';
import {
  accelerometer,
  magnetometer,
  gyroscope,
  SensorTypes,
  setUpdateIntervalForType,
  SensorData,
} from 'react-native-sensors';

export const AttitudeScreen = () => {
  const initSensorData = { x: 0, y: 0, z: 0, timestamp: 0 };
  const subscription = useRef<ReturnType<typeof setInterval>>();
  const acc = useRef<SensorData>(initSensorData);
  const mag = useRef<SensorData>(initSensorData);
  const gyr = useRef<SensorData>(initSensorData);

  setUpdateIntervalForType(SensorTypes.accelerometer, 1000);
  setUpdateIntervalForType(SensorTypes.magnetometer, 1000);
  setUpdateIntervalForType(SensorTypes.gyroscope, 1000);

  const subscribe = () => {
    const sensor = {
      acc: accelerometer.subscribe((data) => {
        acc.current = data;
      }).unsubscribe,
      mag: magnetometer.subscribe((data) => {
        mag.current = data;
      }).unsubscribe,
      gyr: gyroscope.subscribe((data) => {
        gyr.current = data;
      }).unsubscribe,
    };
    return sensor;
  };

  useEffect(() => {
    subscription.current = setInterval(() => {
      subscribe();
    }, 1000);
    return () => subscription.current && clearInterval(subscription.current);
  }, []);

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Text style={{ fontSize: 20 }}>Attitude Screen</Text>
    </View>
  );
};
