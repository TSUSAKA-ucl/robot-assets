const fs = require('fs');
const stringifyPrettyCompact = require('@aitodotai/json-stringify-pretty-compact');

const yargs = require("yargs/yargs");
const { hideBin } = require("yargs/helpers");

// parsing command line arguments
const argv = yargs(hideBin(process.argv))
      .usage("Usage: $0 <json_file> --columuns [num] --output [file_name]")
      .option("columns", {
	alias: "c",
	type: "number",
	description: "Set maximum number of columns per line",
	default: 80
      })
      .option("output", {
	alias: "o",
	type: "string",
	description: "Set output file name",
	default: "output_compact.json"
      })
      .demandCommand(1, "You must provide a JSON file path")
      .help()
      .argv;


const inputPath = process.argv[2] || './linkmap.json';

fs.readFile(inputPath, 'utf8', (err, res) => {
  if (err) {
    console.error('File loading error -', err);
    return;
  }
  try {
    const data = JSON.parse(res);

    const columns = argv.columns || 80;
    const options = { maxLength: columns };
    const jsonString = stringifyPrettyCompact(data, options);
    fs.writeFileSync(argv.output, jsonString);
  } catch (e) {
    console.error('JSON parsing error -', e);
  }
});
