const { eulerXYZToRotmat, rotmatToEulerXYZ } = require('./eulerXYZ.js');

const roll = process.argv[2] ? Number(process.argv[2])*Math.PI/180 : 0;
const pitch = process.argv[3] ? Number(process.argv[3])*Math.PI/180 : 0;
const yaw = process.argv[4] ? Number(process.argv[4])*Math.PI/180 : 0;

if (! (roll==0 && pitch==0 && yaw==0)) {
  const mat = eulerXYZToRotmat(roll, pitch, yaw);
  console.log('Rotation Matrix:');
  console.log(mat);
  const euler = rotmatToEulerXYZ(mat);
  console.log('Converted back to Euler angles then calculated rotation matrix again:');
  console.log(eulerXYZToRotmat(euler.rx, euler.ry, euler.rz));
  console.log(`rx: ${euler.rx/Math.PI*180}, ry: ${euler.ry/Math.PI*180}, rz: ${euler.rz/Math.PI*180}`);
} else {
allSet = [
  [[1, 0, 0],[0, 1, 0],[0, 0, 1]],
  [[1, 0, 0],[0, -1, 0],[0, 0, -1]],
  [[1, 0, 0],[0, 0, 1],[0, -1, 0]],
  [[1, 0, 0],[0, 0, -1],[0, 1, 0]],
  [[-1, 0, 0],[0, 1, 0],[0, 0, -1]],
  [[-1, 0, 0],[0, -1, 0],[0, 0, 1]],
  [[-1, 0, 0],[0, 0, 1],[0, 1, 0]],
  [[-1, 0, 0],[0, 0, -1],[0, -1, 0]],
  [[0, 1, 0],[1, 0, 0],[0, 0, -1]],
  [[0, 1, 0],[-1, 0, 0],[0, 0, 1]],
  [[0, 1, 0],[0, 0, 1],[1, 0, 0]],
  [[0, 1, 0],[0, 0, -1],[-1, 0, 0]],
  [[0, -1, 0],[1, 0, 0],[0, 0, 1]],
  [[0, -1, 0],[-1, 0, 0],[0, 0, -1]],
  [[0, -1, 0],[0, 0, 1],[-1, 0, 0]],
  [[0, -1, 0],[0, 0, -1],[1, 0, 0]],
  [[0, 0, 1],[1, 0, 0],[0, 1, 0]],
  [[0, 0, 1],[-1, 0, 0],[0, -1, 0]],
  [[0, 0, 1],[0, 1, 0],[-1, 0, 0]],
  [[0, 0, 1],[0, -1, 0],[1, 0, 0]],
  [[0, 0, -1],[1, 0, 0],[0, -1, 0]],
  [[0, 0, -1],[-1, 0, 0],[0, 1, 0]],
  [[0, 0, -1],[0, 1, 0],[1, 0, 0]],
  [[0, 0, -1],[0, -1, 0],[-1, 0, 0]]];
  // allEuler = allSet.map(m => rotmatToEulerStable(m));
  // allEuler = allSet.map(m => rotmatToEulerStable_XYZ(m));
  allEuler = allSet.map(m => rotmatToEulerXYZ(m));
  allEuler.forEach((e, i) => {
    console.log(`Set ${i}: roll=${e.rz}, pitch=${e.ry}, yaw=${e.rx}`);
  });
  allRotmats = allEuler.map(e => eulerXYZToRotmat(e.rx, e.ry, e.rz));
  allRotmats.forEach((m, i) => {
    m.forEach((row, r)=>{
      row.forEach((val, c)=>{
	if (val > 1-1e-10) m[r][c] = 1;
	else if (val < -1+1e-10) m[r][c] = -1;
	else if (Math.abs(val) < 1e-10) m[r][c] = 0;
	// m[r][c] = Math.round(val*1e6)/1e6;
      });
    });
  });
  allRotmats.forEach((m, i) => {
    console.log(`Difference for Set ${i}:`,
		m.map((row, r)=>
		  row.map((val, c)=>val - allSet[i][r][c])
		));
    // console.log('euler:', allEuler[i]);
    // console.log('original:', allSet[i]);
  });
}
