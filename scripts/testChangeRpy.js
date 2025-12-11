const fs = require('fs');
const { changeRpyUrdfToThree } = require('./eulerXYZ.js');

fs.readFile(process.argv[2] || 'testChangeRpy.json', (err, data) => {
  if (err) {
    console.error("Error reading file:", err);
    return;
  }
  const json = JSON.parse(data);
  console.log(JSON.stringify(changeRpyUrdfToThree(json), null, 2));
});
