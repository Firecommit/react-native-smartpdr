import { useRef, RefObject, useState } from 'react';
import { ThreeAxisMeasurement } from 'expo-sensors';
import { AttitudeData, StepData } from '../types';
import {
  LCS2GCS,
  LowPassFilter,
  ObjectSignInversion,
  StepEventDetection,
  StepLength,
} from '../utils';

export const useStep = (
  attitude: RefObject<AttitudeData>
): [StepData, ({ acc }: { acc: RefObject<ThreeAxisMeasurement> }) => void] => {
  const [step, setStep] = useState<StepData>({ count: 0, length: 0 });
  const gravity = useRef(1);
  const windowQueue = useRef<Array<number>>([]);
  const stepAccQueue = useRef<Array<number>>([]);
  const accValleyQueue = useRef<Array<number>>([0]);
  const [W, N] = [3, 6];

  const setStepSensor = ({ acc }: { acc: RefObject<ThreeAxisMeasurement> }) => {
    if (acc.current && attitude.current) {
      const accInv = ObjectSignInversion(acc.current);
      const accGcs = LCS2GCS(accInv, attitude.current);
      gravity.current = LowPassFilter(gravity.current, accGcs.z);
      const accHpf = -(accGcs.z - gravity.current) * 9.81;

      // moving window queue: Enqueue event
      windowQueue.current.push(accHpf);
      if (windowQueue.current.length === W) {
        const stepAcc = windowQueue.current.reduce((a, b) => a + b) / W;
        // step acceleration queue: Enqueue event
        stepAccQueue.current.push(stepAcc);
        if (stepAccQueue.current.length === N) {
          if (StepEventDetection(stepAccQueue.current)) {
            const stepAccPeak = stepAccQueue.current[N / 2];
            const stepAccValley = Math.min(...accValleyQueue.current);
            const stepLength = StepLength(stepAccPeak, stepAccValley);
            if (stepLength && stepLength > 0) {
              setStep((s) => ({
                count: s.count + 1,
                length: stepLength,
              }));
            }
            // step acceleration valley queue: Dequeue event
            accValleyQueue.current = [0];
          } else {
            // step acceleration valley queue: Enqueue event
            accValleyQueue.current.push(stepAcc);
          }
          // step acceleration queue: Dequeue event
          stepAccQueue.current = stepAccQueue.current.slice(1);
        }
        // moving window queue: Dequeue event
        windowQueue.current = windowQueue.current.slice((W - 1) / 2);
      }
    }
  };

  return [step, setStepSensor];
};
