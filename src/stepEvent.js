import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { Accelerometer } from 'expo-sensors';
import { Button } from 'react-native-paper';

import { RealTimeLineChart } from './lineChart';

export function StepEventScreen({ navigation }) {
  const [data, setData] = React.useState({ x: 0, y: 0, z: 0 });
  const [subscription, setSubscription] = React.useState(null);

  const _subscribe = () => {
    setSubscription(
      Accelerometer.addListener((accelerometerData) => {
        setData(accelerometerData);
      })
    );
  };

  const _unsubscribe = () => {
    subscription && subscription.remove();
    setSubscription(null);
  };

  React.useEffect(() => {
    _subscribe;
    return () => {
      Accelerometer.removeAllListeners();
      _unsubscribe;
    };
  }, [navigation]);

  return (
    <View style={styles.container}>
      <RealTimeLineChart
        x={round(data.x)}
        y={round(data.y)}
        z={round(data.z)}
      />
      <Text style={styles.text}>
        Accelerometer: (in Gs where 1 G = 9.81 m s^-2)
      </Text>
      <Text style={styles.text}>
        x: {round(data.x)} y: {round(data.y)} z: {round(data.z)}
      </Text>
      <Text style={styles.text}>
        pitch: {round(RPY_calc(data).pitch)} roll: {round(RPY_calc(data).roll)}{' '}
        yaw: 0
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

function RPY_calc(acc) {
  let pitch =
    Math.atan2(-acc.x, Math.sqrt(acc.y * acc.y + acc.z * acc.z)) *
    (180 / Math.PI);
  let roll = Math.atan2(acc.y, acc.z) * (180 / Math.PI);
  return { pitch: pitch, roll: roll };
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
