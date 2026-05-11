#!/usr/bin/env node
//
// URDFのXMLからlinkのnameと link visual geometry meshのfilenameと
// link collision geometry meshのfilenameだけ取り出して、そのjson表を
// 作る
const xml2js = require('xml2js');
const fs = require('fs');
const path = require("path");
const yargs = require("yargs/yargs");
const { hideBin } = require("yargs/helpers");
const util = require('util');

// parsing command line arguments
const argv = yargs(hideBin(process.argv))
      .usage("Usage: $0 <json_file> --output [file_name]")
      .option("output", {
	alias: "o",
	type: "string",
	description: "Set output file name",
	default: null // stdoutに出力する場合はnull
      })
      .option("collision", { // collision geometryのfilenameだけ出力するオプション
	alias: "c",
	type: "boolean",
	description: "Output only collision geometry mesh filenames",
	default: false
      })
      .option("visual", { // visual geometryのfilenameだけ出力するオプション
	alias: "v",
	type: "boolean",
	description: "Output only visual geometry mesh filenames",
	default: false
      })
      .option("list", { // visualのみあるいはcollisionのみの出力の時にファイル名の配列の形で出力するオプション
	alias: "l",
	type: "boolean",
	description: "Output filenames as a list instead of an object with visual and collision properties (only valid when --visual or --collision is used)",
	default: false
      })
      .option("name", { // linkのnameだけ出力するオプション
	alias: "n",
	type: "boolean",
	description: "Output only link names",
	default: false
      })
      .option("skip", {
	alias: "s",
	type: "number",
	description: "When outputting as a list, skip the first n items (only valid when --list is used)",
	default: 0
      })
      .option("trim", {// 配列出力のときに最後のn個を取り除いて出力するオプション
	alias: "t",
	type: "number",
	description: "When outputting as a list, trim the last n items (only valid when --list is used)",
	default: 0
      })
      .option("basename", { // 出力するファイル名をbasenameだけにするオプション
	alias: "b",
	type: "boolean",
	description: "Output only the basename of the mesh filenames (only valid when --visual or --collision is used)",
	default: false
      })
      .option("path", { // 出力するファイル名を、path(引数)+basenameにするオプション
	alias: "P",
	type: "string",
	description: "When outputting mesh filenames, replace their paths with the specified path (only valid when --visual or --collision is used)",
	default: null
      })
      .option("ply", { // ファイル名の拡張子(dae,stl,plyなど)を .bbox.ply に置き換えて出力するオプション
	alias: "p",
	type: "boolean",
	description: "When outputting mesh filenames, replace their extensions (e.g., .dae, .stl, .ply) with .bbox.ply (only valid when --visual or --collision is used)",
	default: false
      })
      .option("stub", { // output file nameを "shapeList-stub.json" にするオプション
	alias: "S",
	type: "boolean",
	description: "Set output file name to shapeList-stub.json (overrides --output)",
	default: false
      })
      .demandCommand(1, "You must provide a JSON file path")
      .help()
      .argv;

const inputUrdf = process.argv[2] || './chain_0.urdf';

function pathConversion(filename, args) {
  let convertedPath = filename;
  if (args.ply) {
    const ext = path.extname(filename);
    convertedPath = filename.replace(ext, '.bbox.ply');
  }
  if (args.basename) {
    if (args.path) {
      convertedPath = path.join(args.path, path.basename(convertedPath));
    } else {
      convertedPath = path.basename(convertedPath);
    }
  }
  return convertedPath;
}



const parser = new xml2js.Parser({explicitArray: false});
const filename = inputUrdf;
// console.log(`Reading URDF file: ${filename}`);
try {
  fs.readFile(filename, (err, data) => {
    try {
      parser.parseString(data, (err, result) => {
	const outputArray = 
	      result.robot.link.map((link) => {
		// console.log('Processing link:', link);
		const visual = Array.isArray(link.visual) ? link.visual : [link.visual];
		const collision = Array.isArray(link.collision) ? link.collision : [link.collision];
		// geometry.mesh.$.filenameが存在しない場合、その配列要素はスキップする
		// console.log('visual:', visual);
		const visualMeshFilenames = (!visual || visual.length === 0) ? null :
		      visual
		      .filter(v => v && v.geometry && v.geometry.mesh && v.geometry.mesh.$ && v.geometry.mesh.$.filename)
		      .map(v =>
			pathConversion(v.geometry.mesh.$.filename, argv));
		const collisionMeshFilenames = (!collision || collision.length === 0) ? null :
		      collision
		      .filter(c => c && c.geometry && c.geometry.mesh && c.geometry.mesh.$ && c.geometry.mesh.$.filename)
		      .map(c => // ファイル名のbasenameだけを取り出す
			pathConversion(c.geometry.mesh.$.filename, argv));
		if (argv.visual && !argv.collision) {
		  return { name : link.$.name,
			   visual : visualMeshFilenames };
		} else if (!argv.visual && argv.collision) {
		  return { name : link.$.name,
			   collision : collisionMeshFilenames };
		} else if (argv.visual && argv.collision) {
		  console.error("Error: --visual and --collision options cannot be used together. Please choose one.");
		  process.exit(1);
		} else {
		  return { name : link.$.name,
			   visual : visualMeshFilenames,
			   collision : collisionMeshFilenames };
		}
	      });
	const outputObj = {};
	for (const item of outputArray) {
	  const {name, ...rest} = item;
	  outputObj[name] = rest;
	}
	let output;
	if (argv.name) {
	  output = Object.keys(outputObj);
	} else if (argv.list) {
	  output = Object.values(outputObj).map(item => {
	    const values = Object.values(item).flat();
	    return values ? values : [];
	  } );
	  if (argv.skip > 0) {
	    output = output.slice(argv.skip);
	  }
	  if (argv.trim > 0) {
	    output = output.slice(0, -argv.trim);
	  }
	} else {
	  output = outputObj;
	}
	      
	// output = outputArray.reduce((acc, item) => {
	//   acc[item.name] = {visual: item.visual, collision: item.collision};
	//   return acc;
	// });
	// const output = outputArray[0];
	if (argv.stub) {
	  argv.output = "shapeList-stub.json";
	}
	if (argv.output === null) {
	  console.log(util.inspect(output, {depth: null}));
	} else {
	  fs.writeFile(argv.output, JSON.stringify(output, null, 2), (err) => {
	    if (err) {
	      console.error("Error writing to file:", err);
	    } else {
	      console.log(`Output written to ${argv.output}`);
	    }
	  });
	}
      });
    } catch (err) {
      console.error("Error parsing URDF file:", err);
    }
  });
} catch (err) {
  console.error("Error reading URDF file:", err);
}

