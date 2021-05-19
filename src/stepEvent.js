import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { Accelerometer, Magnetometer } from 'expo-sensors';
import { Button } from 'react-native-paper';

import { RealTimeLineChart } from './lineChart';

export function StepEventScreen({ navigation }) {
  const [acc, setAcc] = React.useState({ x: 0, y: 0, z: 0 });
  const [mag, setMag] = React.useState({ x: 0, y: 0, z: 0 });
  const [subscription, setSubscription] = React.useState(null);
  Accelerometer.setUpdateInterval(500);
  Magnetometer.setUpdateInterval(500);

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

  const euler = EulerAngles(acc, mag);
  const acc_gcs = LCS2GCS(acc, euler);

  return (
    <View style={styles.container}>
      <RealTimeLineChart dataParam={round(AccFilter(acc_gcs.z))} />
      <Text style={styles.text}>
        Accelerometer LCS: (in Gs where 1 G = 9.81 m s^-2)
      </Text>
      <Text style={styles.text}>
        x: {round(acc.x)} y: {round(acc.y)} z: {round(acc.z)}
      </Text>
      <Text style={styles.text}>
        pitch: {round(euler.pitch)} roll: {round(euler.roll)} yaw:{' '}
        {round(euler.yaw)}
      </Text>
      <Text style={styles.text}>
        Magnetometer: x: {round(mag.x)} y: {round(mag.y)} z: {round(mag.z)}
      </Text>
      <Text style={styles.text}>
        Accelerometer GCS: (in Gs where 1 G = 9.81 m s^-2)
      </Text>
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

function AccFilter(acc_gcs_z) {
  let alpha = 0.9;
  let g = alpha + (1 - alpha) * acc_gcs_z;
  let acc_hpf = acc_gcs_z - g;
  return acc_hpf;
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
  text: {
    textAlign: 'center',
    color: '#707070',
  },
  buttonContainer: {
    flexDirection: 'row',
    alignItems: 'stretch',
    marginTop: 15,
  },
  button: { margin: 8 },
});
