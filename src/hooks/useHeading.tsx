import { RefObject, useRef, useState } from 'react';
import { AttitudeData, SensorDataRefObj } from '../types';
import {
  AngleDiff,
  AngleRange,
  atan2,
  HeadingDirectionFinding,
  LCS2GCS,
  LowPassFilter,
  ObjectSignInversion,
  ScalarProjection,
} from '../utils';

export const useHeading = (
  attitude: RefObject<AttitudeData>
): [
  RefObject<{ origin: number; mag: number; gyr: number }>,
  { origin: number; mag: number; gyr: number },
  ({ acc, mag, gyr }: SensorDataRefObj, interval: number) => void
] => {
  const ref = useRef({ origin: 0, mag: 0, gyr: 0 });
  const [state, setState] = useState({ origin: 0, mag: 0, gyr: 0 });
  const gravity = useRef({ x: 0, y: 0, z: 9.81 });
  const gyrAng = useRef({ x: 0, y: 0, z: 0 });
  const gyrAngQueue = useRef<string[]>([]);
  const bias = useRef({ x: 0, y: 0, z: 0 });

  const [headingDecline, biasThreshold] = [7.5, 0.7].map(
    (e) => (e * Math.PI) / 180
  );

  const setHeadingSensors = (
    { acc, mag, gyr }: SensorDataRefObj,
    interval: number
  ) => {
    if (acc.current && mag.current && gyr.current && attitude.current) {
      const accInv = ObjectSignInversion(acc.current);
      const accGcs = LCS2GCS(accInv, attitude.current);
      gravity.current = {
        ...gravity.current,
        z: LowPassFilter(gravity.current.z, accGcs.z * 9.81),
      };

      // Magnetometer-based heading direction
      const magGcs = LCS2GCS(mag.current, { ...attitude.current, yaw: 0 });
      const prevHeadingMag = ref.current.mag;
      const headingMag = AngleRange(
        atan2(-magGcs.y, magGcs.x) - headingDecline - Math.PI / 2,
        '2PI'
      );
      ref.current.mag = headingMag;
      setState((s) => ({ ...s, mag: headingMag }));
      if (ref.current.mag % (Math.PI / 4) <= (5 * Math.PI) / 180) {
        ref.current.gyr = 0;
        setState((r) => ({ ...r, gyr: 0 }));
      }
      if (!ref.current.gyr) {
        ref.current.gyr = headingMag;
        setState((r) => ({ ...r, gyr: headingMag }));
      }

      // Gyroscope-based heading direction
      const gravityVector = LCS2GCS(
        gravity.current,
        attitude.current,
        'transpose'
      );
      // Gyroscope bias
      gyrAng.current.x += (gyr.current.x * interval) / 1000;
      gyrAng.current.y += (gyr.current.y * interval) / 1000;
      gyrAng.current.z += (gyr.current.z * interval) / 1000;
      if (AngleDiff(ref.current.mag, prevHeadingMag) > biasThreshold) {
        gyrAngQueue.current.length = 0;
      } else {
        const currentGyrAng = gyrAng.current;
        gyrAngQueue.current.push(JSON.stringify(currentGyrAng));
      }
      if (gyrAngQueue.current.length) {
        const start = JSON.parse(gyrAngQueue.current[0]);
        const end = JSON.parse(gyrAngQueue.current.slice(-1)[0]);
        bias.current.x =
          (end.x - start.x) / (gyrAngQueue.current.length * (interval / 1000));
        bias.current.y =
          (end.y - start.y) / (gyrAngQueue.current.length * (interval / 1000));
        bias.current.z =
          (end.z - start.z) / (gyrAngQueue.current.length * (interval / 1000));
      }
      const calibrationGyr = {
        x: gyr.current.x - bias.current.x,
        y: gyr.current.y - bias.current.y,
        z: gyr.current.z - bias.current.z,
      };
      const gyrGcs = ScalarProjection(calibrationGyr, gravityVector);
      const headingGyr = AngleRange(
        ref.current.gyr - gyrGcs * (interval / 1000),
        '2PI'
      );
      ref.current.gyr = headingGyr;
      setState((s) => ({ ...s, gyr: headingGyr }));

      const heading = HeadingDirectionFinding(
        ref.current.mag,
        ref.current.gyr,
        prevHeadingMag,
        ref.current.origin
      );
      ref.current.origin = heading;
      setState((s) => ({ ...s, origin: heading }));
    }
  };

  return [ref, state, setHeadingSensors];
};
