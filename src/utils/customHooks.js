import React from 'react';

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

export function useEulerAngle(acc, mag) {
  const ref = React.useRef({ pitch: 0, roll: 0, yaw: 0 });
  const pitch = Math.atan2(acc.y, acc.z);
  const roll = Math.atan2(
    -acc.x,
    Math.sqrt(Math.pow(acc.y, 2) + Math.pow(acc.z, 2))
  );
  const yaw = Math.atan2(
    mag.z * Math.sin(roll) - mag.y * Math.cos(roll),
    mag.x * Math.cos(pitch) +
      mag.y * Math.sin(pitch) * Math.sin(roll) +
      mag.z * Math.sin(pitch) * Math.cos(roll)
  );
  React.useEffect(() => {
    ref.current = {
      pitch: pitch,
      roll: roll,
      yaw: yaw,
    };
  });
  return ref.current;
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
