import fs from 'fs';
import path from 'path';
const srcDir = path.resolve('node_modules/@ucl-nuee/nova2/public');
const dstDir = path.resolve('public');
const robots = fs.readdirSync(srcDir);
robots.map(robot => {
  const srcRobot = path.join(srcDir, robot);
  const dstRobot = path.join(dstDir, robot);
  fs.mkdirSync(dstRobot);
  fs.readdirSync(srcRobot).map(asset => {
    fs.copyFileSync(path.join(srcRobot,asset),
		    path.join(dstRobot,asset));
  });
});
