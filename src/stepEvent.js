import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { Accelerometer, Magnetometer, Gyroscope } from 'expo-sensors';
import { Button } from 'react-native-paper';

import { RealTimeLineChart } from './lineChart';

export function StepEventScreen({ navigation }) {
  const [acc, setAcc] = React.useState({ x: 0, y: 0, z: 0 });
  const [mag, setMag] = React.useState({ x: 0, y: 0, z: 0 });
  const [gyr, setGyr] = React.useState({ x: 0, y: 0, z: 0 });
  const [gyrDeg, setGyrDeg] = React.useState({ pitch: 0, roll: 0, yaw: 0 });
  const [subscription, setSubscription] = React.useState(null);
  const [accStep, setAccStep] = React.useState(0);
  const [windowList, setWindowList] = React.useState([]);
  const [timeList, setTimeList] = React.useState([]);
  const [stepCount, setStepCount] = React.useState(0);
  const W = 3;
  const N = 8;
  const dt = 100;

  const euler = EulerAngles(acc, mag, gyrDeg);
  const acc_gcs = LCS2GCS(acc, euler);

  Accelerometer.setUpdateInterval(dt);
  Magnetometer.setUpdateInterval(dt);
  Gyroscope.setUpdateInterval(dt);

  const _subscribe = () => {
    const sensor = {
      acc: Accelerometer.addListener((accelerometerData) => {
        setAcc(accelerometerData);
      }),
      mag: Magnetometer.addListener((magnetometerData) => {
        setMag(magnetometerData);
      }),
      gyr: Gyroscope.addListener((gyroscopeData) => {
        setGyrDeg((deg) => {
          deg.pitch += ((gyr.x + gyroscopeData.x) * (dt / 1000)) / 2;
          deg.roll += ((gyr.y + gyroscopeData.y) * (dt / 1000)) / 2;
          deg.yaw += ((gyr.z + gyroscopeData.z) * (dt / 1000)) / 2;
          return deg;
        });
        setGyr(gyroscopeData);
      }),
    };
    setSubscription(sensor);
  };

  const _unsubscribe = () => {
    subscription.acc.remove();
    subscription.mag.remove();
    subscription.gyr.remove();
    setSubscription(null);
  };

  React.useEffect(() => {
    _subscribe;
    return () => {
      Accelerometer.removeAllListeners();
      Magnetometer.removeAllListeners();
      Gyroscope.removeAllListeners();
      _unsubscribe;
    };
  }, [navigation]);

  React.useEffect(() => {
    setWindowList([...windowList, round(HighPassFilter(acc_gcs.z))]);
    if (windowList.length === W) {
      let total = windowList.reduce((sum, e) => {
        return sum + e;
      }, 0);
      setTimeList([...timeList, round(total / W)]);
      if (timeList.length >= N + 1) {
        let t = StepTimeDetection(timeList, N);
        if (t.peak && t.pp && t.slope) setStepCount((c) => c + 1);
        setTimeList(timeList.slice(1));
      }
      setAccStep(total / W);
      setWindowList((wl) => wl.slice((W - 1) / 2));
    }
  }, [acc]);

  return (
    <View style={styles.container}>
      <RealTimeLineChart step={round(accStep)} />
      <Text style={styles.title}>Euler Angles</Text>
      <Text style={styles.text}>
        pitch: {round(euler.pitch)} roll: {round(euler.roll)} yaw:{' '}
        {round(euler.yaw)}
      </Text>
      <Text style={styles.title}>LCS Accelerometer</Text>
      <Text style={styles.title}>(in Gs where 1 G = 9.81 m s^-2)</Text>
      <Text style={styles.text}>
        x: {round(acc.x)} y: {round(acc.y)} z: {round(acc.z)}
      </Text>
      <Text style={styles.title}>GCS Accelerometer</Text>
      <Text style={styles.title}>(in Gs where 1 G = 9.81 m s^-2)</Text>
      <Text style={styles.text}>
        x: {round(acc_gcs.x)} y: {round(acc_gcs.y)} z: {round(acc_gcs.z)}
      </Text>
      <Text style={styles.title}>Step Acceleration</Text>
      <Text style={styles.text}>z: {round(accStep)} [m s^-2]</Text>
      <Text style={styles.title}>Step Count</Text>
      <Text style={styles.text}>count: {stepCount}</Text>
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

var prev_g = 1;
function HighPassFilter(acc_gcs_z) {
  let alpha = 0.95;
  let g = alpha * prev_g + (1 - alpha) * acc_gcs_z;
  let acc_hpf = acc_gcs_z - g;
  prev_g = g;
  return acc_hpf * 9.81;
}

function LCS2GCS(acc_lcs, euler) {
  let acc_gcs = { x: 0, y: 0, z: 0 };
  let pitch = euler.pitch,
    roll = euler.roll,
    yaw = euler.yaw;

  let R = [
    [
      Math.cos(yaw) * Math.cos(roll) -
        Math.sin(yaw) * Math.sin(pitch) * Math.sin(roll),
      -Math.sin(yaw) * Math.cos(pitch),
      Math.cos(yaw) * Math.sin(roll) +
        Math.sin(yaw) * Math.sin(pitch) * Math.cos(roll),
    ],
    [
      -Math.sin(yaw) * Math.cos(roll) -
        Math.cos(yaw) * Math.sin(pitch) * Math.sin(roll),
      -Math.cos(yaw) * Math.cos(pitch),
      -Math.sin(yaw) * Math.sin(roll) +
        Math.cos(yaw) * Math.sin(pitch) * Math.cos(roll),
    ],
    [
      -Math.cos(pitch) * Math.sin(roll),
      Math.sin(pitch),
      Math.cos(pitch) * Math.cos(roll),
    ],
  ];

  acc_gcs.x = R[0][0] * acc_lcs.x + R[0][1] * acc_lcs.y + R[0][2] * acc_lcs.z;
  acc_gcs.y = R[1][0] * acc_lcs.x + R[1][1] * acc_lcs.y + R[1][2] * acc_lcs.z;
  acc_gcs.z = R[2][0] * acc_lcs.x + R[2][1] * acc_lcs.y + R[2][2] * acc_lcs.z;

  return acc_gcs;
}

function EulerAngles(acc, mag, gyrDeg) {
  let roll = Math.atan2(acc.y, acc.z);
  let pitch = Math.atan2(
    -acc.x,
    acc.y * Math.sin(roll) + acc.z * Math.cos(roll)
  );
  let yaw = Math.atan2(
    mag.z * Math.sin(roll) - mag.y * Math.cos(roll),
    mag.x * Math.cos(pitch) +
      mag.y * Math.sin(pitch) * Math.sin(roll) +
      mag.z * Math.sin(pitch) * Math.cos(roll)
  );

  //return { pitch: pitch, roll: roll, yaw: yaw };
  let alpha = 0.95;
  return {
    pitch: alpha * gyrDeg.pitch + (1 - alpha) * pitch,
    roll: alpha * gyrDeg.roll + (1 - alpha) * roll,
    yaw: alpha * gyrDeg.yaw + (1 - alpha) * yaw,
  };
}

function round(n) {
  if (!n) {
    return 0;
  }
  return Math.floor(n * 100) / 100;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    textAlign: 'center',
    color: '#000',
    fontWeight: 'bold',
  },
  text: {
    textAlign: 'center',
    color: '#707070',
    marginBottom: 8,
  },
  buttonContainer: {
    flexDirection: 'row',
    alignItems: 'stretch',
    marginTop: 15,
  },
  button: {},
  shadow: {
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowRadius: 2,
    shadowOpacity: 1,
  },
});
