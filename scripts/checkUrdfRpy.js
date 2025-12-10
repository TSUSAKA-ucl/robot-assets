const fs = require('fs');
const path = require("path");
const { sortJointsByHierarchy } = require('./urdfSupports');


const data = fs.readFileSync('urdf.json', 'utf8');
const urdf = JSON.parse(data);

let urdfArray;
if (!Array.isArray(urdf)) {
  urdfArray = Object.entries(urdf).map(([k,v])=>v);
} else {
  urdfArray = urdf;
}
urdfArray.forEach(el => {
  const rpy = el.origin?.$?.rpy
  if (rpy) {
    console.log('name:',el.$?.name, 'rpy:', rpy);
  }
});
