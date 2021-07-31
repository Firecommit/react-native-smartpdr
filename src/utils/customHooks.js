import React from 'react';
import { argmin, LPFilter, compFilter, toGCS, range } from './sensors_utils';

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
  // States
  const [initAng, setInitAng] = React.useState({ pitch: 0, roll: 0, yaw: 0 });
  const [calibration, setCalibration] = React.useState({
    pitch: 0,
    roll: 0,
    yaw: 0,
  });
  const [angle, setAngle] = React.useState({ pitch: 0, roll: 0, yaw: 0 });

  // Constant declarations
  const dt = 100;

  React.useEffect(() => {
    if (acc.x + acc.y + acc.z) {
      let pitch = Math.atan2(
        -acc.y,
        Math.sqrt(Math.pow(-acc.x, 2) + Math.pow(-acc.z, 2))
      );
      let roll = Math.atan2(acc.x, -acc.z);
      if (!initAng.roll) setInitAng((ang) => ({ ...ang, roll: roll }));
      if (!initAng.pitch) setInitAng((ang) => ({ ...ang, pitch: pitch }));
      setCalibration((c) => ({ ...c, pitch: pitch, roll: roll }));
    }
  }, [acc]);

  React.useEffect(() => {
    if (mag.x + mag.y + mag.z) {
      let mx =
          -mag.x * Math.cos(calibration.roll) +
          -mag.z * Math.sin(calibration.roll),
        my =
          -mag.x * (-Math.sin(calibration.pitch) * Math.sin(calibration.roll)) +
          -mag.y * -Math.cos(calibration.pitch) +
          -mag.z * Math.sin(calibration.pitch) * Math.cos(calibration.roll);
      let yaw = Math.atan2(my, mx);
      if (!initAng.yaw) setInitAng((ang) => ({ ...ang, yaw: yaw }));
      setCalibration((i) => ({ ...i, yaw: yaw }));
    }
  }, [mag]);

  React.useEffect(() => {
    if (gyr.x + gyr.y + gyr.z) {
      let pitch =
        gyr.x * Math.cos(calibration.roll) + gyr.z * Math.sin(calibration.roll);
      let roll =
        gyr.x * Math.sin(calibration.roll) * Math.tan(calibration.pitch) +
        gyr.y +
        gyr.z * -Math.cos(calibration.roll) * Math.tan(calibration.pitch);
      let yaw =
        gyr.x * (-Math.sin(calibration.roll) / Math.cos(calibration.pitch)) +
        gyr.z * (Math.cos(calibration.roll) / Math.cos(calibration.pitch));

      if (angle.roll && angle.pitch && angle.yaw) {
        setAngle((ang) => ({
          pitch: compFilter(ang.pitch + pitch * (dt / 1000), calibration.pitch),
          roll: compFilter(
            range(ang.roll + roll * (dt / 1000), 'PI'),
            calibration.roll
          ),
          yaw: compFilter(
            range(ang.yaw + yaw * (dt / 1000), 'PI'),
            calibration.yaw
          ),
        }));
      } else {
        if (initAng.roll && initAng.pitch && initAng.yaw) {
          setAngle(initAng);
        }
      }
    }
  }, [gyr]);
  return angle;
}

export function useAccStep(acc, mag, gyr) {
  // Custom Hooks
  const euler = useEulerAngle(acc, mag, gyr);

  // States
  const [gravity, setGravity] = React.useState({ x: 0, y: 0, z: 1 });
  const [movingWindow, setMovingWindow] = React.useState([]);
  const [accStep, setAccStep] = React.useState(0);
  const [accEvent, setAccEvent] = React.useState(0);
  const [accList, setAccList] = React.useState([]);

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
    if (acc.x + acc.y + acc.z && euler.pitch && euler.roll && euler.yaw) {
      let acc_gcs = toGCS({ x: -acc.x, y: -acc.y, z: -acc.z }, euler);
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
  const euler = useEulerAngle(acc, mag, gyr);

  // Constant declarations
  const dt = 100;
  const h_decline = (7.5 * Math.PI) / 180;

  React.useEffect(() => {
    if (acc.x + acc.y + acc.z && euler.roll && euler.pitch && euler.yaw) {
      let acc_gcs = toGCS({ x: -acc.x, y: -acc.y, z: -acc.z }, euler);
      setGravity((g) => ({ ...g, z: LPFilter(g.z, acc_gcs.z * 9.81) }));
    }
  }, [acc]);

  const atan2 = (y, x) => {
    return 2 * Math.atan(y / (Math.sqrt(x * x + y * y) + x));
  };

  // Magnetometer-based heading direction
  React.useEffect(() => {
    if (mag.x + mag.y + mag.z && euler.roll && euler.pitch && euler.yaw) {
      let mag_gcs = toGCS(
        { x: -mag.x, y: -mag.y, z: -mag.z },
        { ...euler, yaw: 0 }
      );
      let h_mag = atan2(-mag_gcs.y, mag_gcs.x) - h_decline;
      h_mag = range(h_mag + Math.PI / 2, '2PI');

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

      setHeadingMag((h) => ({ ...h, prev: h.current, current: h_mag }));
      if (
        !headingMag.current ||
        Math.abs(h_mag - headingGyr) > (10 * Math.PI) / 180
      )
        setHeadingGyr(h_mag);
    }
  }, [mag]);

  // Gyroscope-based heading direction
  React.useEffect(() => {
    if (gyr.x + gyr.y + gyr.z && euler.roll && euler.pitch && euler.yaw) {
      let gt = toGCS(gravity, euler, true);
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
