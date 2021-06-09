import React from 'react';
import { View, Text } from 'react-native';
import { Accelerometer, Magnetometer } from 'expo-sensors';
import { Button } from 'react-native-paper';

import { compFilter, round } from './utils/sensors_utils';
import { styles } from './utils/styles';
import { RealTimeLineChart } from './lineChart';
import { useEulerAngle, useGCS } from './utils/customHooks';

export function StepEventScreen({ navigation }) {
  // Listeners
  const [subscription, setSubscription] = React.useState(null);
  const [acc, setAcc] = React.useState({ x: 0, y: 0, z: 0 });
  const [mag, setMag] = React.useState({ x: 0, y: 0, z: 0 });

  // Custom Hooks
  const euler = useEulerAngle(acc, mag);
  const [gzt, setGzt] = React.useState(1);
  const acc_gcs = useGCS(acc, euler);

  // States
  const [accStep, setAccStep] = React.useState(0);
  const [stepCount, setStepCount] = React.useState(0);
  const [windowList, setWindowList] = React.useState([]);
  const [timeList, setTimeList] = React.useState([]);

  // Constant declarations
  const W = 3;
  const N = 8;
  const dt = 100;

  Accelerometer.setUpdateInterval(dt);
  Magnetometer.setUpdateInterval(dt);

  const _subscribe = () => {
    const sensor = {
      acc: Accelerometer.addListener((data) => {
        setAcc(data);
      }),
      mag: Magnetometer.addListener((data) => {
        setMag(data);
      }),
    };
    setSubscription(sensor);
  };

  const _unsubscribe = () => {
    subscription.acc.remove();
    subscription.mag.remove();
    setSubscription(null);
  };

  React.useEffect(() => {
    _subscribe;
    return () => {
      Accelerometer.removeAllListeners();
      Magnetometer.removeAllListeners();
      _unsubscribe;
    };
  }, [navigation]);

  React.useEffect(() => {
    setGzt((g) => compFilter(g, acc_gcs.z));
    let acc_hpf = (acc_gcs.z - gzt) * 9.81;

    setWindowList([...windowList, round(acc_hpf)]);
    if (windowList.length === W) {
      let total = windowList.reduce((sum, e) => {
        return sum + e;
      }, 0);
      setTimeList([...timeList, round(total / W)]);
      if (timeList.length >= N + 1) {
        let t = StepTimeDetection(timeList, N);
        if (t.peak && t.pp && t.slope) setStepCount((c) => c + 1);
        setTimeList((tl) => tl.slice(1));
      }
      setAccStep(total / W);
      setWindowList((wl) => wl.slice((W - 1) / 2));
    }
  }, [acc]);

  return (
    <View style={styles.container}>
      <RealTimeLineChart title="step acceleration" data={round(accStep)} />
      <Text style={styles.title}>Step Count</Text>
      <Text style={styles.text}>{stepCount}</Text>
      <View style={styles.buttonContainer}>
        <Button
          style={styles.button}
          dark={true}
          mode={subscription ? 'contained' : 'outlined'}
          onPress={subscription ? _unsubscribe : _subscribe}
        >
          {subscription ? 'On' : 'Off'}
        </Button>
      </View>
    </View>
  );
}

function StepTimeDetection(timeList, N) {
  let acc_peak = 0.3;
  let acc_pp = 0.6;
  let t = N / 2;
  let condition = { peak: false, pp: false, slope: false };

  // the peak point of time exceeding the threshold acc_peak
  if (timeList[t] > acc_peak) {
    for (i = -N / 2; i <= N / 2; i++) {
      if (i === 0) continue;
      if (timeList[t] > timeList[t + i]) {
        condition.peak = true;
        break;
      }
    }
  }

  // the set of time point that the largest difference
  // between the current peak and both of previous and next valley
  let diff = { prev: [], next: [] };
  for (i = 1; i <= N / 2; i++) {
    diff.prev.push(Math.abs(timeList[t] - timeList[t - i]));
    diff.next.push(Math.abs(timeList[t] - timeList[t + i]));
  }
  if (Math.max(...diff.prev) > acc_pp && Math.max(...diff.next) > acc_pp) {
    condition.pp = true;
  }

  // the point of time that shows increment on the frontside
  // and decrement on the backside
  let sum = { pos: 0, neg: 0 };
  for (i = t - N / 2; i <= t - 1; i++) {
    sum.pos = timeList[i + 1] - timeList[i];
  }
  for (i = t + 1; i <= t + N / 2; i++) {
    sum.neg = timeList[i] - timeList[i - 1];
  }
  if ((2 / N) * sum.pos > 0 && (2 / N) * sum.neg < 0) condition.slope = true;

  return condition;
}
