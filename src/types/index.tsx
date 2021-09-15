import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ParamListBase } from '@react-navigation/routers';
import { Accelerometer, ThreeAxisMeasurement } from 'expo-sensors';
import { RefObject } from 'react';

/* navigation types */
export type Props = NativeStackScreenProps<ParamListBase, 'Feed'>;

/* sensor data types */
export type SubscriptArray = Array<
  ReturnType<typeof Accelerometer.addListener>
>;
export type SensorDataRefArray = Array<RefObject<ThreeAxisMeasurement>>;
