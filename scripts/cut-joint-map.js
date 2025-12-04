//
// joint定義mapのjsonから、parentプロパフィ(linK)の値がfromの要素から
// childプロパティ(link)の値がtoの間だけを切り出す
//
const fs = require('fs');
const path = require("path");
const yargs = require("yargs/yargs");
const { hideBin } = require("yargs/helpers");
const { sortJointsByHierarchy } = require('./urdfSupports');

// 引数パース
const argv = yargs(hideBin(process.argv))
      .usage("Usage: $0 <input_json> --from [link_name] --to [link_name] --output [output_file]")
      .option("from", {
	alias: "f",
	description: "Specify the starting link name (inclusive)",
	default: "" // include beginning
      })
      .option("to", {
	alias: "t",
	description: "Specify the ending link name (inclusive)",
	default: "" // include end
      })
      .option("output", {
	alias: "o",
	description: "Specify the output file name",
	default: "urdfmap_cut.json"
      })
      .demandCommand(1, "You must provide an input JSON file path")
      .help()
      .argv;

const inputPath = argv._[0];
const fromLink = argv.from;
const toLink = argv.to;
const outputPath = argv.output;

fs.readFile(inputPath, 'utf8', (err, res) => {
  if (err) {
    console.error('File loading error -', err);
    return;
  }
  try {
    const obj = JSON.parse(res);
    const data = Array.isArray(obj) ? obj
	  : sortJointsByHierarchy(Object.values(obj));
    // link名からindexを取得
    const fromIndex = fromLink ?
	  data.findIndex(item => item.parent?.$?.link === fromLink) : 0;
    const toIndex = toLink ?
	  data.findIndex(item => item.child?.$?.link === toLink)
	  : data.length - 1;

    if (fromIndex === -1) {
      console.error(`'from' link name "${fromLink}" not found.`);
      return;
    }
    if (toIndex === -1) {
      console.error(`'to' link name "${toLink}" not found.`);
      return;
    }
    if (fromIndex > toIndex) {
      console.error(`'from' index (${fromIndex}) is greater than 'to' index (${toIndex}).`);
      return;
    }

    // 切り出し
    const cutData = data.slice(fromIndex, toIndex + 1);

    // 書き出し
    if (Array.isArray(obj)) {
      fs.writeFileSync(outputPath, JSON.stringify(cutData, null, 2));
      console.log(`Cut joint map array saved to ${outputPath}`);
    } else {
      const jointMap = Object.fromEntries(cutData.map((v) => [v.$.name,v]));
      fs.writeFileSync(outputPath, JSON.stringify(jointMap, null, 2));
      console.log(`Cut joint map object saved to ${outputPath}`);
    }
  } catch (e) {
    console.error('JSON parsing error -', e);
  }
});
