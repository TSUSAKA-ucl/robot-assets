function rotmatToEulerXYZ(m) {
  const nx = m[0][0], ox = m[0][1], ax = m[0][2];
  const ny = m[1][0], oy = m[1][1], ay = m[1][2];
  const nz = m[2][0], oz = m[2][1], az = m[2][2];
  const normRx = Math.sqrt(ay*ay + az*az);
  let ry = 0;
  let rz = 0;
  let rx = 0;
  if (normRx < 10e-6) {
    if (ax > 0) {
      ry = Math.PI/2;
      rz = Math.atan2(ny,oy)*0.5;
      rx = rz;
    } else {
      ry = -Math.PI/2;
      rz = Math.atan2(ny,oy)*0.5;
      rx = -rz;
    }
  } else {
    rx = Math.atan2(-ay, az);
    const sy = -ay/normRx;
    const cy = az/normRx;
    ry = Math.atan2(ax, az*cy-ay*sy);
    rz = Math.atan2(cy*ny+nz*sy, cy*oy+oz*sy);
  }
  return { rx, ry, rz };
}

function eulerXYZToRotmat(rx, ry, rz) {
  const c1 = Math.cos(rx);
  const s1 = Math.sin(rx);
  const c2 = Math.cos(ry);
  const s2 = Math.sin(ry);
  const c3 = Math.cos(rz);
  const s3 = Math.sin(rz);

  const m00 = c2 * c3;
  const m01 = -c2 * s3;
  const m02 = s2;
  const m10 = c1 * s3 + c3 * s2 * s1;
  const m11 = c3 * c1 - s2 * s3 * s1;
  const m12 = -c2 * s1;
  const m20 = - c3 * c1 * s2 + s3 * s1;
  const m21 = c1 * s2 * s3 + c3 * s1;
  const m22 = c2 * c1;

  return [
    [m00, m01, m02],
    [m10, m11, m12],
    [m20, m21, m22]
  ];
}

function eulerURDFToRotmat(roll, pitch, yaw) {
  const c1 = Math.cos(roll);
  const s1 = Math.sin(roll);
  const c2 = Math.cos(pitch);
  const s2 = Math.sin(pitch);
  const c3 = Math.cos(yaw);
  const s3 = Math.sin(yaw);

  const m00 = c2 * c3;
  const m01 = c3*s1*s2 - c1*s3;
  const m02 = s1*s3 + c1*c3*s2;
  const m10 = c2 * s3;
  const m11 = c1 * c3 + s1 * s2 * s3;
  const m12 = c1 * s2 * s3 - c3 * s1;
  const m20 = -s2;
  const m21 = c2 * s1;
  const m22 = c1 * c2;

  return [
    [m00, m01, m02],
    [m10, m11, m12],
    [m20, m21, m22]
  ];
}


function matrixMultiply(a, b) {
  const result = [];
  for (let i = 0; i < a.length; i++) {
    result[i] = [];
    for (let j = 0; j < b[0].length; j++) {
      let sum = 0;
      for (let k = 0; k < a[0].length; k++) {
	sum += a[i][k] * b[k][j];
      }
      result[i][j] = sum;
    }
  }
  return result;
}

function transposeMatrix(m) {
  const result = [];
  for (let i = 0; i < m[0].length; i++) {
    result[i] = [];
    for (let j = 0; j < m.length; j++) {
      result[i][j] = m[j][i];
    }
  }
  return result;
}

function changeRpyUrdfToThree(obj) {
  if (obj === null || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) {
    return obj.map(e => changeRpyUrdfToThree(e));
  }
  if (obj?.origin?.$) {
    const {origin, ...rest} = obj;
    const result = changeRpyUrdfToThree(rest);
    const {$, ...otherAttrs} = origin;
    result.origin = changeRpyUrdfToThree(otherAttrs);
    const {rpy, ...rpyRest} = $;
    result.origin.$ = changeRpyUrdfToThree(rpyRest);
    if (Array.isArray(rpy) && rpy.length === 3 &&
	rpy.every(e => Number.isFinite(e))) {
      const mat = eulerURDFToRotmat(rpy[0], rpy[1], rpy[2]);
      const newRpy = rotmatToEulerXYZ(mat);
      result.origin.$.rpy = [ newRpy.rx, newRpy.ry, newRpy.rz ];
    } else {
      result.origin.$.rpy = rpy;
    }
    return result;
  } else {
    return Object.fromEntries(
      Object.entries(obj).map(([k,v])=>[k, changeRpyUrdfToThree(v)])
    );
  }
}

module.exports = {
  eulerXYZToRotmat,
  eulerURDFToRotmat,
  rotmatToEulerXYZ,
  changeRpyUrdfToThree,
  matrixMultiply,
  transposeMatrix
};
