import React from 'react';
import { ScrollView, Text, View } from 'react-native';
import { Accelerometer, Magnetometer, Gyroscope } from 'expo-sensors';
import { Button } from 'react-native-paper';

// custom modules
import { styles } from './utils/styles';
import { useEulerAngle, useGyrAngle } from './utils/customHooks';
import { RealTimeLineChart } from './lineChart';
import { range, round } from './utils/sensors_utils';

export function LocationScreen({ navigation }) {
  // Listeners
  const [subscription, setSubscription] = React.useState(null);
  const [acc, setAcc] = React.useState({ x: 0, y: 0, z: 0 });
  const [mag, setMag] = React.useState({ x: 0, y: 0, z: 0 });
  const [gyr, setGyr] = React.useState({ x: 0, y: 0, z: 0 });

  // Custom Hooks
  const gyrAng = useGyrAngle(gyr);
  const euler = useEulerAngle(acc, mag, gyr);

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

  return (
    <View style={styles.container}>
      <ScrollView>
        <RealTimeLineChart
          title="x-axis angle"
          data={round(euler.pitch * (180 / Math.PI))}
        />
        <RealTimeLineChart
          title="y-axis angle"
          data={round(euler.roll * (180 / Math.PI))}
        />
        <RealTimeLineChart
          title="z-axis angle"
          data={round(euler.yaw * (180 / Math.PI))}
        />
        <View style={styles.container}>
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
      </ScrollView>
    </View>
  );
}
