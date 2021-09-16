import { RefObject, useRef } from 'react';
import { ThreeAxisMeasurement } from 'expo-sensors';
import { AttitudeData } from '../types';
import { AngleRange, ObjectSignInversion } from '../utils';

export const useAttitude = (): [
  RefObject<AttitudeData>,
  ({
    acc,
    mag,
  }: {
    acc: RefObject<ThreeAxisMeasurement>;
    mag: RefObject<ThreeAxisMeasurement>;
  }) => void
] => {
  const initYaw = useRef(0);
  const attitude = useRef({ pitch: 0, roll: 0, yaw: 0 });

  const setAttitudeSensors = ({
    acc,
    mag,
  }: {
    acc: RefObject<ThreeAxisMeasurement>;
    mag: RefObject<ThreeAxisMeasurement>;
  }) => {
    if (acc.current && mag.current) {
      const accInv = ObjectSignInversion(acc.current);
      const pitch = Math.atan2(
        accInv.y,
        Math.sqrt(accInv.x ** 2 + accInv.z ** 2)
      );
      const roll = Math.atan2(-accInv.x, accInv.z);
      const mx =
        mag.current.x * Math.cos(roll) + mag.current.z * Math.sin(roll);
      const my =
        mag.current.x * (-Math.sin(pitch) * Math.sin(roll)) +
        mag.current.y * -Math.cos(pitch) +
        mag.current.z * Math.sin(pitch) * Math.cos(roll);
      let yaw = Math.atan2(my, mx);
      if (!initYaw.current) initYaw.current = yaw;
      yaw = AngleRange(yaw - initYaw.current, 'PI');
      attitude.current = { pitch, roll, yaw };
    }
  };

  return [attitude, setAttitudeSensors];
};
