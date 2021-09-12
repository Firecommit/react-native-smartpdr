import { useRef, useEffect, RefObject } from 'react';
import {
  accelerometer,
  magnetometer,
  gyroscope,
  SensorTypes,
  setUpdateIntervalForType,
  SensorData,
} from 'react-native-sensors';

type SubscriptArray = Array<ReturnType<typeof accelerometer.subscribe>>;
type SensorDataRefArray = Array<RefObject<SensorData>>;

export const useSensorListener = (
  sensor: 'accelerometer' | 'magnetometer' | 'gyroscope' | 'fusion',
  callback: (data: SensorDataRefArray) => void,
  interval: number
) => {
  const initSensorData = { x: 0, y: 0, z: 0, timestamp: 0 };
  const timerId = useRef<ReturnType<typeof setInterval>>();
  const acc = useRef<SensorData>(initSensorData);
  const mag = useRef<SensorData>(initSensorData);
  const gyr = useRef<SensorData>(initSensorData);

  setUpdateIntervalForType(SensorTypes.accelerometer, interval);
  setUpdateIntervalForType(SensorTypes.magnetometer, interval);
  setUpdateIntervalForType(SensorTypes.gyroscope, interval);

  let subscription: SubscriptArray;
  let currentData: SensorDataRefArray;

  const subscribe = () => {
    switch (sensor) {
      case 'accelerometer':
        currentData = [acc];
        subscription = [
          accelerometer.subscribe((data) => {
            acc.current = data;
          }),
        ];
        break;
      case 'magnetometer':
        currentData = [mag];
        subscription = [
          magnetometer.subscribe((data) => {
            mag.current = data;
          }),
        ];
        break;
      case 'gyroscope':
        currentData = [gyr];
        subscription = [
          gyroscope.subscribe((data) => {
            gyr.current = data;
          }),
        ];
        break;
      case 'fusion':
        currentData = [acc, mag, gyr];
        subscription = [
          accelerometer.subscribe((data) => {
            acc.current = data;
          }),
          magnetometer.subscribe((data) => {
            mag.current = data;
          }),
          gyroscope.subscribe((data) => {
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
    subscription.forEach((s) => s.unsubscribe());
  };

  useEffect(() => {
    subscribe();
    timerId.current = setInterval(() => callback(currentData), 1000);
    return () => {
      if (timerId.current) clearInterval(timerId.current);
      setTimeout(() => {
        unsubscribe();
      }, interval);
    };
  }, []);
};
