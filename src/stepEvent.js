import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { Accelerometer, Magnetometer } from 'expo-sensors';
import { Button } from 'react-native-paper';

import { RealTimeLineChart } from './lineChart';

export function StepEventScreen({ navigation }) {
  const [acc, setAcc] = React.useState({ x: 0, y: 0, z: 0 });
  const [mag, setMag] = React.useState({ x: 0, y: 0, z: 0 });
  const [subscription, setSubscription] = React.useState(null);
  const [count, setCount] = React.useState(0);
  const [dataList, setDataList] = React.useState({
    z: [],
    step: [],
  });
  const W = 7;

  const euler = EulerAngles(acc, mag);
  const acc_gcs = LCS2GCS(acc, euler);

  const _subscribe = () => {
    const sensor = {
      acc: Accelerometer.addListener((accelerometerData) => {
        setAcc(accelerometerData);
      }),
      mag: Magnetometer.addListener((magnetometerData) => {
        setMag(magnetometerData);
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
    dataList.z.push(round(HighPassFilter(acc_gcs.z)));
    let acc_lpf = dataList.z.slice(count, W + count);
    if (acc_lpf.length === W) {
      let total = acc_lpf.reduce((sum, e) => {
        return sum + e;
      }, 0);
      if (dataList.step.length >= 50) {
        dataList.step.shift();
        dataList.z = dataList.z.slice((W - 1) / 2);
      }
      dataList.step.push(total / W);
      setCount((count) => count + (W - 1) / 2);
    }
  }, [acc]);

  return (
    <View style={styles.container}>
      <RealTimeLineChart dataList={dataList} />
      <Text style={styles.title}>Euler Angles</Text>
      <Text style={styles.text}>
        pitch: {round(euler.pitch)} roll: {round(euler.roll)} yaw:{' '}
        {round(euler.yaw)}
      </Text>
      <Text style={styles.title}>Accelerometer LCS</Text>
      <Text style={styles.text}>
        x: {round(acc.x)} y: {round(acc.y)} z: {round(acc.z)}
      </Text>
      <Text style={styles.title}>Accelerometer GCS</Text>
      <Text style={styles.text}>
        x: {round(acc_gcs.x)} y: {round(acc_gcs.y)} z: {round(acc_gcs.z)}
      </Text>
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

var prev_g = 1;
function HighPassFilter(acc_gcs_z) {
  let alpha = 0.9;
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

function EulerAngles(acc, mag) {
  let R = {
    pitch:
      Math.atan2(-acc.x, Math.sqrt(acc.y * acc.y + acc.z * acc.z)) *
      (180 / Math.PI),
    roll: Math.atan2(acc.y, acc.z) * (180 / Math.PI),
  };
  let D = {
    x:
      Math.cos(R.pitch) * mag.x +
      Math.sin(R.pitch) * Math.sin(R.roll) * mag.y +
      Math.sin(R.pitch) * Math.cos(R.roll) * mag.z,
    y: Math.cos(R.roll) * mag.y - Math.sin(R.roll) * mag.z,
  };
  return { ...R, yaw: Math.atan2(-D.y, D.x) * (180 / Math.PI) };
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
  button: { margin: 8 },
});
