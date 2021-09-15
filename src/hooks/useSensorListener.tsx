import { useRef, useEffect } from 'react';
import {
  Accelerometer,
  Magnetometer,
  Gyroscope,
  ThreeAxisMeasurement,
} from 'expo-sensors';
import { SensorDataRefArray, SubscriptArray } from '../types';

export const useSensorListener = (
  sensor: 'accelerometer' | 'magnetometer' | 'gyroscope' | 'fusion',
  callback: (data: SensorDataRefArray) => void,
  interval: number
) => {
  const initSensorData = { x: 0, y: 0, z: 0 };
  const timerId = useRef<ReturnType<typeof setInterval>>();
  const acc = useRef<ThreeAxisMeasurement>(initSensorData);
  const mag = useRef<ThreeAxisMeasurement>(initSensorData);
  const gyr = useRef<ThreeAxisMeasurement>(initSensorData);

  Accelerometer.setUpdateInterval(interval);
  Magnetometer.setUpdateInterval(interval);
  Gyroscope.setUpdateInterval(interval);

  let subscription: SubscriptArray;
  let currentData: SensorDataRefArray;

  const subscribe = () => {
    switch (sensor) {
      case 'accelerometer':
        currentData = [acc];
        subscription = [
          Accelerometer.addListener((data) => {
            acc.current = data;
          }),
        ];
        break;
      case 'magnetometer':
        currentData = [mag];
        subscription = [
          Magnetometer.addListener((data) => {
            mag.current = data;
          }),
        ];
        break;
      case 'gyroscope':
        currentData = [gyr];
        subscription = [
          Gyroscope.addListener((data) => {
            gyr.current = data;
          }),
        ];
        break;
      case 'fusion':
        currentData = [acc, mag, gyr];
        subscription = [
          Accelerometer.addListener((data) => {
            acc.current = data;
          }),
          Magnetometer.addListener((data) => {
            mag.current = data;
          }),
          Gyroscope.addListener((data) => {
            gyr.current = data;
          }),
        ];
        break;
      default:
        throw new Error(
          'Sensor Subscription Error: does not exist sensor type.'
        );
    }
  };

  const unsubscribe = () => {
    Accelerometer.removeAllListeners();
    Magnetometer.removeAllListeners();
    Gyroscope.removeAllListeners();
  };

  useEffect(() => {
    subscribe();
    timerId.current = setInterval(() => callback(currentData), interval);
    return () => {
      if (timerId.current) clearInterval(timerId.current);
      setTimeout(() => {
        unsubscribe();
      }, 1000);
    };
  }, []);
};
