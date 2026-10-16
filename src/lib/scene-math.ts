export type Vector3 = { x: number; y: number; z: number };
export type Quaternion = [number, number, number, number];

export function axisRotation(axis: 'x' | 'y', angle: number): Quaternion {
  const half = angle / 2;
  return [axis === 'x' ? Math.sin(half) : 0, axis === 'y' ? Math.sin(half) : 0, 0, Math.cos(half)];
}

export function multiply(a: Quaternion, b: Quaternion): Quaternion {
  const [ax, ay, az, aw] = a;
  const [bx, by, bz, bw] = b;
  const q: Quaternion = [
    aw * bx + ax * bw + ay * bz - az * by,
    aw * by - ax * bz + ay * bw + az * bx,
    aw * bz + ax * by - ay * bx + az * bw,
    aw * bw - ax * bx - ay * by - az * bz,
  ];
  const length = Math.hypot(...q);
  return q.map((value) => value / length) as Quaternion;
}

export function rotationMatrix([x, y, z, w]: Quaternion) {
  return [
    1 - 2 * (y * y + z * z),
    2 * (x * y - z * w),
    2 * (x * z + y * w),
    2 * (x * y + z * w),
    1 - 2 * (x * x + z * z),
    2 * (y * z - x * w),
    2 * (x * z - y * w),
    2 * (y * z + x * w),
    1 - 2 * (x * x + y * y),
  ];
}

export function transform(point: Vector3, matrix: number[]): Vector3 {
  return {
    x: matrix[0] * point.x + matrix[1] * point.y + matrix[2] * point.z,
    y: matrix[3] * point.x + matrix[4] * point.y + matrix[5] * point.z,
    z: matrix[6] * point.x + matrix[7] * point.y + matrix[8] * point.z,
  };
}
