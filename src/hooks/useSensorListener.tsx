import { useRef, useEffect } from 'react';
import {
  Accelerometer,
  Magnetometer,
  Gyroscope,
  ThreeAxisMeasurement,
} from 'expo-sensors';
import BackgroundGeolocation from 'react-native-background-geolocation';
import { Platform } from 'react-native';
import { SensorDataRefArray } from '../types';

export const useSensorListener = (
  sensor: 'accelerometer' | 'magnetometer' | 'gyroscope' | 'fusion',
  callback: (data: SensorDataRefArray) => void,
  interval: number
) => {
  const initSensorData = { x: 0, y: 0, z: 0 };
  const acc = useRef<ThreeAxisMeasurement>(initSensorData);
  const mag = useRef<ThreeAxisMeasurement>(initSensorData);
  const gyr = useRef<ThreeAxisMeasurement>(initSensorData);

  const bgGeo = BackgroundGeolocation;
  const currentData: SensorDataRefArray = [acc, mag, gyr];
  let timeId: ReturnType<typeof setInterval>;

  // Background process
  const backgroundWatch = () => {
    bgGeo.watchPosition(
      (location) => {
        subscribe();
      },
      (error) => {
        throw error;
      },
      { interval }
    );
  };

  const subscribe = () => {
    unsubscribe().then((msg) => {
      Accelerometer.setUpdateInterval(interval);
      Magnetometer.setUpdateInterval(interval);
      Gyroscope.setUpdateInterval(interval);
      switch (sensor) {
        case 'accelerometer':
          Accelerometer.addListener((data) => {
            acc.current = data;
          });
          break;
        case 'magnetometer':
          Magnetometer.addListener((data) => {
            mag.current = data;
          });
          break;
        case 'gyroscope':
          Gyroscope.addListener((data) => {
            gyr.current = data;
          });
          break;
        case 'fusion':
          Accelerometer.addListener((data) => {
            acc.current = data;
          });
          Magnetometer.addListener((data) => {
            mag.current = data;
          });
          Gyroscope.addListener((data) => {
            gyr.current = data;
          });
          break;
        default:
          throw new Error(
            'Sensor Subscription Error: does not exist sensor type.'
          );
      }
    });
    clearInterval(timeId);
    timeId = setInterval(() => callback(currentData), interval);
  };

  const unsubscribe = () => {
    Accelerometer.removeAllListeners();
    Magnetometer.removeAllListeners();
    Gyroscope.removeAllListeners();
    return new Promise((resolve, reject) => {
      resolve('unsubscribe');
    });
  };

  useEffect(() => {
    if (Platform.OS === 'ios') {
      bgGeo.requestPermission();
    }
    bgGeo.ready(
      {
        stopOnTerminate: false,
        startOnBoot: true,
      },
      (state) => {
        if (!state.enabled) {
          bgGeo.start();
        }
        backgroundWatch();
      }
    );
    subscribe();

    return () => {
      unsubscribe().then((msg) => {
        bgGeo.stopWatchPosition();
        bgGeo.stop();
        clearInterval(timeId);
      });
    };
  }, []);
};
