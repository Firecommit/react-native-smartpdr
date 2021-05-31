export function LCS2GCS(lcs, euler, T = false) {
  let gcs = { x: 0, y: 0, z: 0 };
  let pitch = euler.pitch,
    roll = euler.roll,
    yaw = euler.yaw;

  let R = [
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

  if (T) {
    gcs.x = R[0][0] * lcs.x + R[1][0] * lcs.y + R[2][0] * lcs.z;
    gcs.y = R[0][1] * lcs.x + R[1][1] * lcs.y + R[2][1] * lcs.z;
    gcs.z = R[0][2] * lcs.x + R[1][2] * lcs.y + R[2][2] * lcs.z;
  } else {
    gcs.x = R[0][0] * lcs.x + R[0][1] * lcs.y + R[0][2] * lcs.z;
    gcs.y = R[1][0] * lcs.x + R[1][1] * lcs.y + R[1][2] * lcs.z;
    gcs.z = R[2][0] * lcs.x + R[2][1] * lcs.y + R[2][2] * lcs.z;
  }

  return gcs;
}

export function EulerAngles(acc, mag, gyrAng, prevEuler) {
  let pitch = Math.atan2(acc.y, acc.z);
  let roll = Math.atan2(
    -acc.x,
    Math.sqrt(Math.pow(acc.y, 2) + Math.pow(acc.z, 2))
  );
  let yaw = Math.atan2(
    mag.z * Math.sin(roll) - mag.y * Math.cos(roll),
    mag.x * Math.cos(pitch) +
      mag.y * Math.sin(pitch) * Math.sin(roll) +
      mag.z * Math.sin(pitch) * Math.cos(roll)
  );

  let alpha = 0.95;
  return !prevEuler
    ? {
        pitch: pitch,
        roll: roll,
        yaw: yaw,
      }
    : {
        pitch: alpha * (prevEuler.pitch + gyrAng.pitch) + (1 - alpha) * pitch,
        roll: alpha * (prevEuler.roll + gyrAng.roll) + (1 - alpha) * roll,
        yaw: alpha * (prevEuler.yaw + gyrAng.yaw) + (1 - alpha) * yaw,
      };
}

export function round(n) {
  if (!n) {
    return 0;
  }
  return Math.floor(n * 100) / 100;
}

export function degree(deg) {
  deg = deg % 360;
  if (deg < 0) deg += 360;
  return deg;
}
