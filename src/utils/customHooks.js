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
