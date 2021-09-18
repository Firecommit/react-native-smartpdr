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

export const AngleRange = (rad: number, scope: '2PI' | 'PI'): number => {
  let tmp = 0;
  switch (scope) {
    case '2PI':
      tmp = rad % (2 * Math.PI);
      if (tmp < 0) tmp += 2 * Math.PI;
      break;
    case 'PI':
      tmp = rad + Math.PI;
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

export const LowPassFilter = (
  prev: number,
  data: number,
  alpha: number = 0.95
) => {
  return alpha * prev + (1 - alpha) * data;
};

export const LCS2GCS = (
  data: ThreeAxisMeasurement,
  attitude: AttitudeData
): ThreeAxisMeasurement => {
  const { pitch, roll, yaw } = attitude;

  const Rx = (rad: number) => [
    [1, 0, 0],
    [0, -Math.cos(rad), Math.sin(rad)],
    [0, Math.sin(rad), Math.cos(rad)],
  ];
  const Ry = (rad: number) => [
    [Math.cos(rad), 0, Math.sin(rad)],
    [0, 1, 0],
    [-Math.sin(rad), 0, Math.cos(rad)],
  ];
  const Rz = (rad: number) => [
    [Math.cos(rad), Math.sin(rad), 0],
    [-Math.sin(rad), Math.cos(rad), 0],
    [0, 0, 1],
  ];
  const MatrixProduct = (matrix1: number[][], matrix2: number[][]) => {
    const tmp = [];
    for (let i = 0; i < 3; i++) {
      tmp[i] = new Array(3).fill(0);
    }
    for (let i = 0; i < 3; i++) {
      for (let j = 0; j < 3; j++) {
        for (let k = 0; k < 3; k++) {
          tmp[i][j] += matrix1[i][k] * matrix2[k][j];
        }
      }
    }
    return tmp;
  };

  const R = MatrixProduct(MatrixProduct(Rz(yaw), Rx(pitch)), Ry(roll));

  return {
    x: R[0][0] * data.x + R[1][0] * data.y + R[2][0] * data.z,
    y: R[0][1] * data.x + R[1][1] * data.y + R[2][1] * data.z,
    z: R[0][2] * data.x + R[1][2] * data.y + R[2][2] * data.z,
  };
};

export const StepEventDetection = (
  stepAccQueue: number[],
  peak: number = 0.5,
  pp: number = 1.0
) => {
  const t = stepAccQueue.length / 2;
  const slopeUp = stepAccQueue.slice(0, t - 1);
  const slopeDown = stepAccQueue.slice(t + 1);

  // the peak point of time exceeding the threshold acc_peak
  if (stepAccQueue[t] > peak) return false;
  for (let i = -t; i < t; i++) {
    if (!(stepAccQueue[t] > stepAccQueue[t + 1])) {
      return false;
    }
  }

  // the set of time point that the largest difference
  // between the current peak and both of previous and next valley
  const prev = slopeUp.map((e) => Math.abs(stepAccQueue[t] - e));
  const next = slopeDown.map((e) => Math.abs(stepAccQueue[t] - e));
  if (!(Math.max(...prev) > pp && Math.max(...next) > pp)) return false;

  // the point of time that shows increment on the frontside
  // and decrement on the backside
  const pos = slopeUp.map((e, idx) => slopeUp[idx + 1] - e || e);
  const neg = slopeDown.map((e, idx) => e - slopeDown[idx - 1] || e);
  if (
    !(pos.reduce((a, b) => a + b) / t > 0) &&
    !(neg.reduce((a, b) => a + b) / t < 0)
  ) {
    return false;
  }

  return true;
};

export const StepLength = (
  peak: number,
  valley: number,
  threshold: number = 3.23
) => {
  const peak2peak = peak - valley;
  if (peak2peak < 0) return 0;
  const fourthRootLength = 1.479 * peak2peak ** (1 / 4) + -1.259;
  const logarithmLength = 1.131 * Math.log(peak2peak) + 0.159;
  return peak2peak < threshold ? fourthRootLength : logarithmLength;
};
