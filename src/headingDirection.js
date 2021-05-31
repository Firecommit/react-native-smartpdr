import React from 'react';
import { ScrollView, Text, View } from 'react-native';
import { Accelerometer, Magnetometer, Gyroscope } from 'expo-sensors';
import { Button } from 'react-native-paper';

// custom module
import { styles } from './utils/styles';
import { degree, EulerAngles, LCS2GCS, round } from './utils/sensors_utils';
import { RealTimeLineChart } from './lineChart';
import { usePrevious } from './utils/customHooks';

export function HeadingDirectionScreen({ navigation }) {
  // Listeners
  const [subscription, setSubscription] = React.useState(null);
  const [acc, setAcc] = React.useState({ x: 0, y: 0, z: 0 });
  const [mag, setMag] = React.useState({ x: 0, y: 0, z: 0 });
  const [gyr, setGyr] = React.useState({ x: 0, y: 0, z: 0 });
  const [gyrAng, setGyrAng] = React.useState({ pitch: 0, roll: 0, yaw: 0 });

  // Custom Hooks
  const euler = EulerAngles(acc, mag, gyrAng, prevEuler);
  const prevEuler = usePrevious(euler);
  const [gravity, setGravity] = React.useState({ x: 0, y: 0, z: 1 });
  const prevGravity = usePrevious(gravity);
  const [headingMag, setHeadingMag] = React.useState(0);
  const prevHeadingMag = usePrevious(headingMag);
  const [headingGyr, setHeadingGyr] = React.useState(0);
  const prevHeadingGyr = usePrevious(headingGyr);

  // States
  const [stackAng, setStackAng] = React.useState([]);
  const [bias, setBias] = React.useState({ x: 0, y: 0, z: 0 });
  const [corrGyr, setCorrGyr] = React.useState({ x: 0, y: 0, z: 0 });

  // Constant declarations
  const dt = 100;
  const h_decline = -(7 * Math.PI) / 180;
  const alpha = 0.95;

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

  // Magnetometer-based Heading Direction
  React.useEffect(() => {
    let mag_gcs = LCS2GCS(mag, euler);
    let h_mag =
      2 *
        Math.atan2(
          -mag_gcs.y,
          Math.sqrt(Math.pow(mag_gcs.x, 2) + Math.pow(-mag_gcs.y, 2)) +
            mag_gcs.x
        ) -
      h_decline;
    setHeadingMag(h_mag);
  }, [mag]);

  // Gyroscope-based Heading Direction
  const acc_gcs = LCS2GCS(acc, euler);
  React.useState(() => {
    !prevGravity
      ? setGravity({
          ...gravity,
          z: alpha * gravity.z + (1 - alpha) * acc_gcs.z,
        })
      : setGravity({
          ...gravity,
          z: alpha * prevGravity.z + (1 - alpha) * acc_gcs.z,
        });
  }, [acc]);

  React.useEffect(() => {
    setGyrAng((angle) => {
      angle.pitch += gyr.x * (dt / 1000);
      angle.roll += gyr.x * (dt / 1000);
      angle.yaw += gyr.x * (dt / 1000);
      return angle;
    });

    if (prevEuler) {
      setStackAng([...stackAng, JSON.stringify(gyrAng)]);
    }
    if (stackAng.length > 1) {
      let start = JSON.parse(stackAng[0]),
        end = JSON.parse(stackAng.slice(-1)[0]);
      setBias((b) => {
        b.x = start.pitch - end.pitch / (stackAng.length * (dt / 1000));
        b.y = start.roll - end.roll / (stackAng.length * (dt / 1000));
        b.z = start.yaw - end.yaw / (stackAng.length * (dt / 1000));
        return b;
      });
      setCorrGyr((g) => {
        g.x = alpha * gyr.x + (1 - alpha) * -bias.x;
        g.y = alpha * gyr.y + (1 - alpha) * -bias.y;
        g.z = alpha * gyr.z + (1 - alpha) * -bias.z;
        return g;
      });

      let gt = LCS2GCS(gravity, euler, true);
      let gyr_gcs =
        (corrGyr.x * gt.x + corrGyr.y * gt.y + corrGyr.z * gt.z) /
        Math.sqrt(Math.pow(gt.x, 2) + Math.pow(gt.y, 2) + Math.pow(gt.z, 2));
      setHeadingGyr((h) => h - gyr_gcs * (dt / 1000));
    }
  }, [gyr]);

  const heading = HeadingDirection(
    headingMag,
    headingGyr,
    prevHeadingMag,
    prevHeadingGyr
  );

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scroll}>
        <RealTimeLineChart
          title="Heading Direction"
          data={degree(round((heading * 180) / Math.PI))}
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

function HeadingDirection(h_mag, h_gyr, h_mag_prev, h_t_prev) {
  let weight = { prev: 2, mag: 1, gyr: 2, pmg: 1 / 5, mg: 1 / 3, pg: 1 / 4 };
  let threshold = {
    h_cor_t: (5 * Math.PI) / 180,
    h_mag_t: (2 * Math.PI) / 180,
  };
  let diff = {
    h_cor_diff: Math.abs(h_mag - h_gyr),
    h_mag_diff: Math.abs(h_mag - h_mag_prev),
  };
  let h_t = 0;

  if (diff.h_cor_diff <= threshold.h_cor_t) {
    if (diff.h_mag_diff <= threshold.h_mag_t) {
      h_t =
        weight.pmg *
        (weight.prev * h_t_prev + weight.mag * h_mag + weight.gyr * h_gyr);
    } else {
      h_t = weight.mg * (weight.mag * h_mag + weight.gyr * h_gyr);
    }
  } else {
    if (diff.h_mag_diff <= threshold.h_mag_t) {
      h_t = h_t_prev;
    } else {
      h_t = weight.pg * (weight.prev * h_t_prev + weight.gyr * h_gyr);
    }
  }

  return h_t;
}
