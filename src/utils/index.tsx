import { ThreeAxisMeasurement } from 'expo-sensors';
import { AttitudeData } from '../types';

export const ObjectSignInversion = (
  data: ThreeAxisMeasurement
): ThreeAxisMeasurement => {
  return {
    x: -data.x,
    y: -data.y,
    z: -data.z,
  };
};

export const AngleRange = (angle: number, scope: '2PI' | 'PI'): number => {
  let tmp = 0;
  switch (scope) {
    case '2PI':
      tmp = angle % (2 * Math.PI);
      if (tmp < 0) tmp += 2 * Math.PI;
      break;
    case 'PI':
      tmp = angle + Math.PI;
      tmp %= 2 * Math.PI;
      tmp = tmp < 0 ? tmp + Math.PI : tmp - Math.PI;
      break;
    default:
      break;
  }
  return tmp;
};

export const ComplementaryFilter = (
  eulerAttitude: AttitudeData,
  gyrAttitude: AttitudeData,
  prevAttitude: AttitudeData,
  dt: number = 0.1,
  alpha: number = 0.95
): AttitudeData => {
  return {
    pitch:
      alpha * (prevAttitude.pitch + gyrAttitude.pitch * (dt / 1000)) +
      (1 - alpha) * eulerAttitude.pitch,
    roll:
      alpha *
        AngleRange(prevAttitude.roll + gyrAttitude.roll * (dt / 1000), 'PI') +
      (1 - alpha) * eulerAttitude.roll,
    yaw:
      alpha *
        AngleRange(prevAttitude.yaw + gyrAttitude.yaw * (dt / 1000), 'PI') +
      (1 - alpha) * eulerAttitude.yaw,
  };
};
