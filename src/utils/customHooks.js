import React from 'react';
import { round, compFilter } from './sensors_utils';

export function usePrevious(value) {
  const ref = React.useRef();
  React.useEffect(() => {
    ref.current = value;
  });
  return ref.current;
}

export function useGyrAngle(gyr) {
  const ref = React.useRef({ pitch: 0, roll: 0, yaw: 0 });
  const dt = 100;
  React.useEffect(() => {
    ref.current.pitch += gyr.x * (dt / 1000);
    ref.current.roll += gyr.y * (dt / 1000);
    ref.current.yaw += gyr.z * (dt / 1000);
  }, [gyr]);
  return ref.current;
}

export function useEulerAngle(acc, mag, gyr) {
  const [biasYaw, setBiasYaw] = React.useState(0);
  const [angle, setAngle] = React.useState({ pitch: 0, roll: 0, yaw: 0 });
  const [ret, setRet] = React.useState({ pitch: 0, roll: 0, yaw: 0 });
  const dt = 100;

  React.useEffect(() => {
    let pitch = Math.atan2(acc.y, acc.z);
    pitch = pitch < 0 ? pitch + Math.PI : pitch - Math.PI;

    let roll = Math.atan2(
      acc.x,
      Math.sqrt(Math.pow(acc.y, 2) + Math.pow(acc.z, 2))
    );
    setAngle({ ...angle, pitch: pitch, roll: roll });
  }, [acc]);

  React.useEffect(() => {
    let yaw = Math.atan2(
      mag.z * Math.sin(angle.roll) - mag.y * Math.cos(angle.roll),
      mag.x * Math.cos(angle.pitch) +
        mag.y * Math.sin(angle.pitch) * Math.sin(angle.roll) +
        mag.z * Math.sin(angle.pitch) * Math.cos(angle.roll)
    );
    if (biasYaw === 0) {
      let by = yaw;
      setBiasYaw(by);
      let diff = yaw - by,
        corrYaw = Math.abs(diff) > Math.PI ? diff + 2 * Math.PI : diff;
      setAngle({ ...angle, yaw: corrYaw });
    } else {
      let diff = yaw - biasYaw,
        corrYaw = Math.abs(diff) > Math.PI ? diff + 2 * Math.PI : diff;
      setAngle({ ...angle, yaw: corrYaw });
    }
  }, [mag]);

  React.useEffect(() => {
    setRet((r) => ({
      pitch: r.pitch
        ? compFilter(gyr.x * (dt / 1000), angle.pitch, r.pitch)
        : compFilter(gyr.x * (dt / 1000), angle.pitch),
      roll: r.roll
        ? compFilter(gyr.y * (dt / 1000), angle.roll, r.roll)
        : compFilter(gyr.y * (dt / 1000), angle.roll),
      yaw: r.yaw
        ? compFilter(gyr.z * (dt / 1000), angle.yaw, r.yaw)
        : compFilter(gyr.z * (dt / 1000), angle.yaw),
    }));
  }, [gyr]);

  return ret;
}

export function useGCS(lcs, euler, T = false) {
  const pitch = euler.pitch,
    roll = euler.roll,
    yaw = euler.yaw;

  const R = [
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

  // T mean transpose. If T is true, R is transposed matrix. If T is false, R is rotation matrix.
  return {
    x: T
      ? R[0][0] * lcs.x + R[1][0] * lcs.y + R[2][0] * lcs.z
      : R[0][0] * lcs.x + R[0][1] * lcs.y + R[0][2] * lcs.z,
    y: T
      ? R[0][1] * lcs.x + R[1][1] * lcs.y + R[2][1] * lcs.z
      : R[1][0] * lcs.x + R[1][1] * lcs.y + R[1][2] * lcs.z,
    z: T
      ? R[0][2] * lcs.x + R[1][2] * lcs.y + R[2][2] * lcs.z
      : R[2][0] * lcs.x + R[2][1] * lcs.y + R[2][2] * lcs.z,
  };
}

export function useStep(acc, mag, gyr) {
  const euler = useEulerAngle(acc, mag, gyr);
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

  const StepTimeDetection = (timeList, N) => {
    let acc_peak = 0.5;
    let acc_pp = 1.0;
    let t = N / 2;
    let condition = { peak: false, pp: false, slope: false };

    // the peak point of time exceeding the threshold acc_peak
    if (timeList[t] > acc_peak) {
      for (let i = -N / 2; i <= N / 2; i++) {
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
    for (let i = 1; i <= N / 2; i++) {
      diff.prev.push(Math.abs(timeList[t] - timeList[t - i]));
      diff.next.push(Math.abs(timeList[t] - timeList[t + i]));
    }
    if (Math.max(...diff.prev) > acc_pp && Math.max(...diff.next) > acc_pp) {
      condition.pp = true;
    }

    // the point of time that shows increment on the frontside
    // and decrement on the backside
    let sum = { pos: 0, neg: 0 };
    for (let i = t - N / 2; i <= t - 1; i++) {
      sum.pos = timeList[i + 1] - timeList[i];
    }
    for (let i = t + 1; i <= t + N / 2; i++) {
      sum.neg = timeList[i] - timeList[i - 1];
    }
    if ((2 / N) * sum.pos > 0 && (2 / N) * sum.neg < 0) condition.slope = true;

    return condition;
  };

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

  return [accStep, stepCount];
}

export function useHeading(acc, mag, gyr) {
  // States
  const [stackAng, setStackAng] = React.useState([]);
  const [bias, setBias] = React.useState({ x: 0, y: 0, z: 0 });
  const [corrGyr, setCorrGyr] = React.useState({ x: 0, y: 0, z: 0 });
  const [gravity, setGravity] = React.useState({ x: 0, y: 0, z: 9.81 });
  const [headingMag, setHeadingMag] = React.useState(0);
  const [headingGyr, setHeadingGyr] = React.useState(0);

  // Custom Hooks
  const gyrAng = useGyrAngle(gyr);
  const euler = useEulerAngle(acc, mag, gyr);
  const acc_gcs = useGCS(acc, euler);
  const mag_gcs = useGCS(mag, euler);
  const gt = useGCS(gravity, euler, true);
  const prevGravity = usePrevious(gravity);
  const prevHeadingMag = usePrevious(headingMag);
  const prevHeadingGyr = usePrevious(headingGyr);

  // Constant declarations
  const dt = 100;
  const h_decline = -(7 * Math.PI) / 180;

  const HeadingDirection = (h_mag, h_gyr, h_mag_prev, h_t_prev) => {
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
  };

  // Magnetometer-based Heading Direction
  React.useEffect(() => {
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
  React.useState(() => {
    !prevGravity
      ? setGravity({
          ...gravity,
          z: compFilter(gravity.z, acc_gcs.z * 9.81),
        })
      : setGravity({
          ...gravity,
          z: compFilter(prevGravity.z, acc_gcs.z * 9.81),
        });
  }, [acc]);

  React.useEffect(() => {
    setStackAng([...stackAng, JSON.stringify(gyrAng)]);
    if (stackAng.length > 1) {
      let start = JSON.parse(stackAng[0]),
        end = JSON.parse(stackAng.slice(-1)[0]);

      setBias((b) => {
        b.x = start.pitch - end.pitch / ((stackAng.length - 1) * (dt / 1000));
        b.y = start.roll - end.roll / ((stackAng.length - 1) * (dt / 1000));
        b.z = start.yaw - end.yaw / ((stackAng.length - 1) * (dt / 1000));
        return b;
      });
      setCorrGyr((g) => {
        g.x = compFilter(gyr.x, -bias.x);
        g.y = compFilter(gyr.y, -bias.y);
        g.z = compFilter(gyr.z, -bias.z);
        return g;
      });

      let gyr_gcs =
        (corrGyr.x * gt.x + corrGyr.y * gt.y + corrGyr.z * gt.z) /
        Math.sqrt(gt.x * gt.x + gt.y * gt.y + gt.z * gt.z);
      setHeadingGyr((h) => h - gyr_gcs * (dt / 1000));
    }
  }, [gyr]);

  const heading = HeadingDirection(
    headingMag,
    headingGyr,
    prevHeadingMag,
    prevHeadingGyr
  );

  return [headingMag, headingGyr, heading];
}
