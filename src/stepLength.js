import React from 'react';
import { Accelerometer, Magnetometer, Gyroscope } from 'expo-sensors';
import { Text, View, ScrollView } from 'react-native';
import { Button } from 'react-native-paper';

// custom modules
import { styles } from './utils/styles';
import { RealTimeLineChart } from './lineChart';
import { useAccStep, useStepLength } from './utils/customHooks';
import { round, range } from './utils/sensors_utils';

export function StepLengthScreen({ navigation }) {
  // Listeners
  const [subscription, setSubscription] = React.useState(null);
  const [acc, setAcc] = React.useState({ x: 0, y: 0, z: 0 });
  const [mag, setMag] = React.useState({ x: 0, y: 0, z: 0 });
  const [gyr, setGyr] = React.useState({ x: 0, y: 0, z: 0 });

  // Custom Hooks
  const [accStep, stepFlag] = useAccStep(acc, mag, gyr);
  const [stepLength, headingStep] = useStepLength(acc, mag, gyr);

  // States
  const [stepCount, setStepCount] = React.useState(0);

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

  React.useEffect(() => {
    if (stepFlag) {
      setStepCount((c) => c + 1);
    }
  }, [accStep]);

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scroll}>
        <View style={styles.container}>
          <RealTimeLineChart title="step acceleration" data={accStep} />
        </View>
        <Text style={styles.title}>step count</Text>
        <Text style={styles.text}>{stepCount}</Text>
        <Text style={styles.title}>
          heading direction at the k_th step event
        </Text>
        <Text style={styles.text}>{round((headingStep * 180) / Math.PI)}</Text>
        <Text style={styles.title}>estimated step length</Text>
        <Text style={styles.text}>{stepLength}</Text>
        <View style={styles.container}>
          <Button
            style={styles.button}
            dark={true}
            mode={subscription ? 'contained' : 'outlined'}
            onPress={subscription ? _unsubscribe : _subscribe}
          >
            {subscription ? 'On' : 'Off'}
          </Button>
        </View>
      </ScrollView>
    </View>
  );
}
