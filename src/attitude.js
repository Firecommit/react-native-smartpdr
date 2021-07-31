import React from 'react';
import { View, Text, Image } from 'react-native';
import { Accelerometer, Gyroscope, Magnetometer } from 'expo-sensors';
import { Button } from 'react-native-paper';

import { useEulerAngle } from './utils/customHooks';
import { styles } from './utils/styles';
import { round } from './utils/sensors_utils';

export function AttitudeScreen({ navigation }) {
  // Listeners
  const [subscription, setSubscription] = React.useState(null);
  const [acc, setAcc] = React.useState({ x: 0, y: 0, z: 0 });
  const [mag, setMag] = React.useState({ x: 0, y: 0, z: 0 });
  const [gyr, setGyr] = React.useState({ x: 0, y: 0, z: 0 });

  // Custom Hooks
  const { pitch, roll, yaw } = useEulerAngle(acc, mag, gyr);

  // Constant declarations
  const dt = 100;

  Accelerometer.setUpdateInterval(dt);
  Magnetometer.setUpdateInterval(dt);
  Gyroscope.setUpdateInterval(dt);

  const _subscribe = () => {
    const sensor = {
      acc: Accelerometer.addListener((data) => {
        setAcc(data);
      }),
      mag: Magnetometer.addListener((data) => {
        setMag(data);
      }),
      gyr: Gyroscope.addListener((data) => {
        setGyr(data);
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

  const deg = (ang) => {
    return round((ang * 180) / Math.PI);
  };

  return (
    <View style={styles.container}>
      <View>
        <Image
          source={require('../assets/deviceAttitude.png')}
          style={{ width: 280, height: 300 }}
        />
      </View>
      <Text style={styles.title}>Attitude</Text>
      <Text style={styles.text}>
        pitch: {deg(pitch)} roll: {deg(roll)} yaw: {deg(yaw)}
      </Text>
      <Text style={styles.title}>Range: (±90°, ±180°, ±180°)</Text>
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
