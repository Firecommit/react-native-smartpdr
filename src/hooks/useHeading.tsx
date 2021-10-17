import { RefObject, useRef, useState } from 'react';
import { AttitudeData, SensorDataRefObj } from '../types';
import {
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
  RefObject<number>,
  ({ acc, mag, gyr }: SensorDataRefObj, interval: number) => void
] => {
  const heading = useRef(0);
  const headingMag = useRef(0);
  const headingGyr = useRef(0);
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
      const prevHeadingMag = headingMag.current;
      headingMag.current = AngleRange(
        atan2(-magGcs.y, magGcs.x) - headingDecline - Math.PI / 2,
        '2PI'
      );
      if (headingGyr.current % (Math.PI / 2) <= (5 * Math.PI) / 180) {
        headingGyr.current = 0;
      }
      if (!headingGyr.current) headingGyr.current = headingMag.current;

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
      if (Math.abs(headingMag.current - prevHeadingMag) > biasThreshold) {
        gyrAngQueue.current.length = 0;
      } else {
        const currentGyrAng = gyrAng.current;
        gyrAngQueue.current.push(JSON.stringify(currentGyrAng));
      }
      if (gyrAngQueue.current.length) {
        const start = JSON.parse(gyrAngQueue.current[0]);
        const end = JSON.parse(gyrAngQueue.current.slice(-1)[0]);
        bias.current.x =
          (end.x - start.x) / ((gyrAngQueue.current.length * interval) / 1000);
        bias.current.y =
          (end.y - start.y) / ((gyrAngQueue.current.length * interval) / 1000);
        bias.current.z =
          (end.z - start.z) / ((gyrAngQueue.current.length * interval) / 1000);
      }
      const calibrationGyr = {
        x: gyr.current.x - bias.current.x,
        y: gyr.current.y - bias.current.y,
        z: gyr.current.z - bias.current.z,
      };
      const gyrGcs = ScalarProjection(calibrationGyr, gravityVector);
      headingGyr.current = AngleRange(
        headingGyr.current - gyrGcs * (interval / 1000),
        '2PI'
      );

      heading.current = HeadingDirectionFinding(
        headingMag.current,
        headingGyr.current,
        prevHeadingMag,
        heading.current
      );
    }
  };

  return [heading, setHeadingSensors];
};
