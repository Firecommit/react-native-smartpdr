import React from 'react';
import {
  argmin,
  LPFilter,
  compFilter,
  toGCS,
  range,
  object_sign_inversion,
  round,
} from './sensors_utils';

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

export function useAttitude(acc, mag, gyr) {
  // Constractor
  const initState = { pitch: 0, roll: 0, yaw: 0 };
  const acc_inv = object_sign_inversion(acc);

  // States
  const [init, setInit] = React.useState(initState);
  const [euler, setEuler] = React.useState(initState);
  const [attitude, setAttitude] = React.useState(initState);

  // Constant declarations
  const dt = 100; // [ms]

  React.useEffect(() => {
    if (acc.x + acc.y + acc.z) {
      let pitch = Math.atan2(
        acc_inv.y,
        Math.sqrt(Math.pow(acc_inv.x, 2) + Math.pow(acc_inv.z, 2))
      );
      let roll = Math.atan2(-acc_inv.x, acc_inv.z);
      if (!init.roll) setInit((i) => ({ ...i, roll: roll }));
      if (!init.pitch) setInit((i) => ({ ...i, pitch: pitch }));
      setEuler((e) => ({ ...e, pitch: pitch, roll: roll }));
    }
  }, [acc]);

  React.useEffect(() => {
    if (mag.x + mag.y + mag.z) {
      let mx = mag.x * Math.cos(euler.roll) + mag.z * Math.sin(euler.roll),
        my =
          mag.x * (-Math.sin(euler.pitch) * Math.sin(euler.roll)) +
          mag.y * -Math.cos(euler.pitch) +
          mag.z * Math.sin(euler.pitch) * Math.cos(euler.roll);
      let yaw = range(Math.atan2(my, mx) - init.yaw, '2PI');
      if (!init.yaw) {
        setInit((i) => ({ ...i, yaw: yaw }));
      } else {
        setEuler((e) => ({ ...e, yaw: range(yaw, 'PI') }));
      }
    }
  }, [mag]);

  React.useEffect(() => {
    if (gyr.x + gyr.y + gyr.z) {
      let pitch = gyr.x * Math.cos(euler.roll) + gyr.z * Math.sin(euler.roll);
      let roll =
        gyr.x * Math.sin(euler.roll) * Math.tan(euler.pitch) +
        gyr.y +
        gyr.z * -Math.cos(euler.roll) * Math.tan(euler.pitch);
      let yaw =
        gyr.x * (-Math.sin(euler.roll) / Math.cos(euler.pitch)) +
        gyr.z * (Math.cos(euler.roll) / Math.cos(euler.pitch));

      if (attitude.roll && attitude.pitch) {
        setAttitude((att) => ({
          pitch: compFilter(att.pitch + pitch * (dt / 1000), euler.pitch),
          roll: compFilter(
            range(att.roll + roll * (dt / 1000), 'PI'),
            euler.roll
          ),
          yaw: compFilter(range(att.yaw + yaw * (dt / 1000), 'PI'), euler.yaw),
        }));
      } else {
        if (init.roll && init.pitch) {
          setAttitude({ ...init, yaw: 0 });
        }
      }
    }
  }, [gyr]);
  return attitude;
}

export function useAccStep(acc, mag, gyr) {
  // Constractor
  const acc_inv = object_sign_inversion(acc);

  // States
  const [gravity, setGravity] = React.useState({ x: 0, y: 0, z: 1 });
  const [movingWindow, setMovingWindow] = React.useState([]);
  const [accStep, setAccStep] = React.useState(0);
  const [accEvent, setAccEvent] = React.useState(0);
  const [accList, setAccList] = React.useState([]);

  // Custom Hooks
  const attitude = useAttitude(acc, mag, gyr);

  // Constant declarations
  const [W, N] = [3, 6];

  // Private function: a peak step counting algorithm.
  const _algorithm = () => {
    let acc_peak_th = 0.5,
      acc_pp_th = 1.0;
    let t = N / 2;
    let cond = { peak: false, pp: false, slope: false };

    // the peak point of time exceeding the threshold acc_peak
    if (accList[t] > acc_peak_th) {
      for (let i = -N / 2; i < N / 2; i++) {
        if (i === 0) continue;
        if (accList[t] > accList[t + i]) {
          cond.peak = true;
          break;
        }
      }
    }

    // the set of time point that the largest difference
    // between the current peak and both of previous and next valley
    let diff = { prev: [], next: [] };
    for (let i = 1; i < N / 2; i++) {
      diff.prev.push(accList[t] - accList[t - i]);
      diff.next.push(accList[t] - accList[t + i]);
    }
    if (
      Math.max(...diff.prev) > acc_pp_th &&
      Math.max(...diff.next) > acc_pp_th
    ) {
      cond.pp = true;
    }

    // the point of time that shows increment on the frontside
    // and decrement on the backside
    let sum = { pos: 0, neg: 0 };
    for (let i = t - N / 2; i <= t - 1; i++) {
      sum.pos = accList[i + 1] - accList[i];
    }
    for (let i = t + 1; i < t + N / 2; i++) {
      sum.neg = accList[i] - accList[i - 1];
    }
    if ((2 / N) * sum.pos > 0 && (2 / N) * sum.neg < 0) cond.slope = true;

    return cond.peak && cond.pp && cond.slope ? accList[t] : 0;
  };

  React.useEffect(() => {
    if (acc.x + acc.y + acc.z) {
      let acc_gcs = toGCS(acc_inv, attitude);
      setGravity((g) => ({ ...g, z: LPFilter(g.z, acc_gcs.z) }));
      let acc_hpf = (acc_gcs.z - gravity.z) * 9.81;

      setMovingWindow((mw) => [...mw, acc_hpf]);
      if (movingWindow.length === W) {
        let acc_step = movingWindow.reduce((a, b) => a + b) / W;
        setAccStep(acc_step);
        setAccList((al) => [...al, acc_step]);
        if (accList.length === N) {
          setAccEvent(_algorithm);
          setAccList((al) => al.slice(1));
        }
        setMovingWindow((mv) => mv.slice((W - 1) / 2));
      }
    }
  }, [acc]);

  return [accStep, accEvent];
}

export function useHeading(acc, mag, gyr) {
  // Constractor
  const acc_inv = object_sign_inversion(acc);

  // States
  const [gravity, setGravity] = React.useState({ x: 0, y: 0, z: 9.81 });
  const [gyrAngTI, setGyrAngTI] = React.useState([]);
  const [bias, setBias] = React.useState({ x: 0, y: 0, z: 0 });
  const [headingMag, setHeadingMag] = React.useState({
    prev: null,
    current: 0,
  });
  const [headingGyr, setHeadingGyr] = React.useState(0);
  const [heading, setHeading] = React.useState(0);

  // Custom Hooks
  const gyrAng = useGyrAngle(gyr);
  const attitude = useAttitude(acc, mag, gyr);

  // Constant declarations
  const dt = 100; // [ms]
  const h_decline = (7.5 * Math.PI) / 180;

  React.useEffect(() => {
    if (acc.x + acc.y + acc.z) {
      let acc_gcs = toGCS(acc_inv, attitude);
      setGravity((g) => ({ ...g, z: LPFilter(g.z, acc_gcs.z * 9.81) }));
    }
  }, [acc]);

  const atan2 = (y, x) => {
    return 2 * Math.atan(y / (Math.sqrt(x * x + y * y) + x));
  };

  // Magnetometer-based heading direction
  React.useEffect(() => {
    let { pitch, roll, yaw } = attitude;
    if (mag.x + mag.y + mag.z && pitch && roll && yaw) {
      let mag_gcs = toGCS(mag, { ...attitude, yaw: 0 });
      let h_mag = atan2(-mag_gcs.y, mag_gcs.x) - h_decline;
      h_mag = range(h_mag - Math.PI / 2, '2PI');

      // Calculated Gyroscope bias
      if (Math.abs(h_mag - headingMag.current) > (0.7 * Math.PI) / 180) {
        setGyrAngTI([]);
      } else {
        setGyrAngTI((ti) => [...ti, JSON.stringify(gyrAng)]);
      }
      let num_TI = gyrAngTI.length;
      if (num_TI) {
        let start = JSON.parse(gyrAngTI[0]),
          end = JSON.parse(gyrAngTI.slice(-1)[0]);
        setBias({
          x: (end.pitch - start.pitch) / (num_TI * (dt / 1000)),
          y: (end.roll - start.roll) / (num_TI * (dt / 1000)),
          z: (end.yaw - start.yaw) / (num_TI * (dt / 1000)),
        });
      }

      if (
        !headingMag.current ||
        headingMag.current < (5 * Math.PI) / 180 ||
        headingMag.current > (355 * Math.PI) / 180
      )
        setHeadingGyr(h_mag);
      setHeadingMag((h) => ({ ...h, prev: h.current, current: h_mag }));
    }
  }, [mag]);

  // Gyroscope-based heading direction
  React.useEffect(() => {
    if (gyr.x + gyr.y + gyr.z) {
      let gt = toGCS(gravity, attitude, true);
      let corrGyr = {
        x: gyr.x - bias.x,
        y: gyr.y - bias.y,
        z: gyr.z - bias.z,
      };
      let gyr_gcs =
        (corrGyr.x * gt.x + corrGyr.y * gt.y + corrGyr.z * gt.z) /
        Math.sqrt(Math.pow(gt.x, 2) + Math.pow(gt.y, 2) + Math.pow(gt.z, 2));
      if (headingGyr) {
        setHeadingGyr((h) => range(h - gyr_gcs * (dt / 1000), '2PI'));
      }
    }
  }, [gyr]);

  // Updating heading state
  // Private function: the reasonable heading direction of a user finding algorithm.
  const _algorithm = (h_mag, h_gyr, h_mag_prev, h_t_prev) => {
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

  React.useEffect(() => {
    setHeading((h_prev) =>
      _algorithm(headingMag.current, headingGyr, headingMag.prev, h_prev)
    );
  }, [headingMag, headingGyr]);

  return heading;
}

export function useStepLength(acc, mag, gyr) {
  // Custom Hooks
  const [accStep, accEvent] = useAccStep(acc, mag, gyr);
  const heading = useHeading(acc, mag, gyr);

  // States
  const [accList, setAccList] = React.useState([]);
  const [headingList, setHeadingList] = React.useState([]);
  const [valleyList, setValleyList] = React.useState([]);
  const [accIdx, setAccIdx] = React.useState(-1);
  const [headingIdx, setHeadingIdx] = React.useState(-1);
  const [ret, setRet] = React.useState({ stepLength: 0, headingStep: 0 });

  // Constant declarations
  const acc_th = 3.23;

  React.useEffect(() => {
    setAccList((al) => [...al, accStep]);
    setHeadingList((hl) => [...hl, heading]);
    if (accEvent) {
      let peakIdx = accList.indexOf(accEvent);
      setAccIdx(peakIdx);
      if (valleyList.length) {
        let valleyIdx = argmin(valleyList, accList);
        setHeadingIdx(valleyIdx);
      }
      setValleyList([]);
    } else {
      setValleyList((vl) => [...vl, accStep]);
    }

    let acc_peak = accList[accIdx],
      acc_valley = accList[headingIdx],
      acc_pp = acc_peak - acc_valley;
    let fourth_root = 1.479 * Math.pow(acc_pp, 1 / 4) + -1.259,
      logarithm = 1.131 * Math.log(acc_pp) + 0.159;

    setRet({
      stepLength: acc_pp < acc_th ? fourth_root : logarithm,
      headingStep: headingList[headingIdx],
    });
  }, [accStep]);

  return [ret.stepLength, ret.headingStep];
}
