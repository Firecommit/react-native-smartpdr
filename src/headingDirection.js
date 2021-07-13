import React from 'react';
import { ScrollView, View, Text } from 'react-native';
import { Accelerometer, Magnetometer, Gyroscope } from 'expo-sensors';
import { Button } from 'react-native-paper';

// custom modules
import { styles } from './utils/styles';
import { round } from './utils/sensors_utils';
import { RealTimeLineChart } from './lineChart';
import { useHeading } from './utils/customHooks';

export function HeadingDirectionScreen({ navigation }) {
  // Listeners
  const [subscription, setSubscription] = React.useState(null);
  const [acc, setAcc] = React.useState({ x: 0, y: 0, z: 0 });
  const [mag, setMag] = React.useState({ x: 0, y: 0, z: 0 });
  const [gyr, setGyr] = React.useState({ x: 0, y: 0, z: 0 });

  // Custom Hooks
  const heading = useHeading(acc, mag, gyr);

  // Constant declarations
  const dt = 100;
  const data = round((heading * 180) / Math.PI);

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
      <ScrollView style={styles.scroll}>
        <View style={styles.container}>
          <RealTimeLineChart title="Heading" data={data} />
        </View>
        <Text style={styles.title}>Heading Direction</Text>
        <Text style={styles.text}>{data}</Text>
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
