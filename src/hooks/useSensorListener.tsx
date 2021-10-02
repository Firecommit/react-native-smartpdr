import { useRef, useEffect } from 'react';
import {
  Accelerometer,
  Magnetometer,
  Gyroscope,
  ThreeAxisMeasurement,
} from 'expo-sensors';
import BackgroundGeolocation from 'react-native-background-geolocation';
import { AppState, Platform } from 'react-native';
import BackgroundTimer from 'react-native-background-timer';
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
  const bgTime = BackgroundTimer;
  const currentData: SensorDataRefArray = [acc, mag, gyr];
  let timeId: ReturnType<typeof setInterval>;

  const backgroundWatch = () => {
    bgGeo.watchPosition(
      (location) => {
        console.log('mode: backgroundWatch');
        // bgTime.stopBackgroundTimer();
        subscribe();
      },
      (error) => {
        throw error;
      },
      { interval: 60000 }
    );
  };

  const backgroundTimer = () => {
    bgTime.runBackgroundTimer(() => {
      subscribe();
    }, interval);
  };

  const backgroundTask = () => {
    bgGeo.startBackgroundTask().then((taskId) => {
      console.log('mode: backgroundTask');
      subscribe();
      bgGeo.stopBackgroundTask(taskId);
    });
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
        // backgroundTimer();
        backgroundTask();
      }
    );

    timeId = setInterval(() => callback(currentData), interval);
    const appState = AppState.addEventListener('change', (state) => {
      if (state === 'background') {
        // bgTime.stopBackgroundTimer();
        unsubscribe().then((msg) => {
          backgroundTask();
          // backgroundTimer();
        });
      }
    });

    return () => {
      unsubscribe().then((msg) => {
        /* @ts-ignore */
        appState.remove();
        bgGeo.stopWatchPosition();
        bgGeo.stop();
        bgTime.stopBackgroundTimer();
        clearInterval(timeId);
      });
    };
  }, []);
};
