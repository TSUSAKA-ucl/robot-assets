#!/usr/bin/env node
//
// URDFのXMLから必要部分だけのJSONを作成。以下のファイルを生成する
//	ik-cd-workerのCmdVelGeneratorのWASM版の初期化データ用
//	robot-loaderのjoint情報および各linkのvisual情報
//	URDFの内容を修正するための update.json のstub
// 下記convertToNumbers関数のnumericKeysに含まれるキーのvalueは数値に変換してJSONで出力する
// "--sort"オプションを付けると、jointタグに関しては、親子関係でセマンティックソートし
// 配列にして "urdfsorted.json"を出力。"--sort"オプションを付けないとjoint名と値
// キーバリューオブジェクトとして "urdfmap.json"を出力。
// robot-loader(ver.1.0.5以降), ik-cd-worker(0.2.7以降)は、urdf.jsonはsorted(配列)でも
// sortedでなくても(key valueオブジェクト)受け付ける。update.jsonを使って内容を修正する場合は
// key valueオブジェクトのほうが簡単。
//
const xml2js = require('xml2js');
const fs = require('fs');
const path = require("path");
const yargs = require("yargs/yargs");
const { hideBin } = require("yargs/helpers");
const util = require('util');
const { sortJointsByHierarchy,
	convertToNumbers
      } = require('./urdfSupports');
const { eulerXYZToRotmat,
	eulerURDFToRotmat,
	rotmatToEulerXYZ,
	changeRpyUrdfToThree,
	matrixMultiply,
	transposeMatrix
      } = require('./eulerXYZ.js');

// 引数パース
const argv = yargs(hideBin(process.argv))
      .usage("Usage: $0 <urdf_XML_file> --sort")
      .option("sort", {
	alias: "s",
	describe: "output the joint list as an array instead of a key-value object",
	default: false,
	type: 'boolean'
      })
      .option("select", {
	alias: "c",
	describe: "select only links that appear in joint map",
	default: false,
	type: 'boolean'
      })
      .option("urdfjson", {
	alias: "j",
	describe: "skip creating urdfmap.json and create only linkmap.json according to this option urdfjson",
	default: '',
	type: 'string'
      })
      .option("no-colliders", {
	alias: "n",
	describe: "do not create collider shape descriptions in update-stub.json",
	default: false,
	type: 'boolean'
      })
      .demandCommand(1, "You must provide a URDF(XML) file")
      .help()
      .argv;

const selectOnly = argv.select ? true : argv.urdfjson ? true : false;
// const parser = new xml2js.Parser();
const parser = new xml2js.Parser({explicitArray: false});

const keepKeys = ['joint','name','parent'];

argv._.forEach(filename => {
  fs.readFile(filename, (err, data) => {
    parser.parseString(data, (err, result) => {
      const joints = 
	    convertToNumbers(sortJointsByHierarchy(result.robot.joint));
      const jointMap = Object.fromEntries(joints.map((v) => [v.$.name,v]));
      // console.log(JSON.stringify(result.robot.joint,null,2));
      if (!argv.json) {
	// js出力
	// console.log(util.inspect(joints, { depth: null, colors: false }));
	// JSON出力
	const jointOutput = argv.sort ? joints : jointMap;
	const output = argv.sort ? 'urdfsorted.json' : 'urdfmap.json';

	fs.writeFileSync(output,
			 JSON.stringify(changeRpyUrdfToThree(jointOutput),
					null, 2));
	console.log('The joint information was exported to',output);
      }
      //
      let links = convertToNumbers(result.robot.link)
      let selectMap = jointMap;
      console.log('argv.urdfjson=',argv.urdfjson);
      if (argv.urdfjson) {
	try {
	  const data = fs.readFileSync(argv.urdfjson, 'utf8');
	  selectMap = JSON.parse(data);
	  console.log('keys of selectMap:',Object.keys(selectMap));
	} catch(err) {
	  console.error('Failed to read urdfjson file:', argv.urdfjson);
	  console.error('linkmap.json and update-stub.json were not created.');
	  process.exit(1);
	}
      }
      console.log('Total elements in selectMap:', Object.keys(selectMap).length);
      if (selectOnly) {
	// 存在するjoint.parent.$.linkとjoint.child.$.linkを集める
	const selectKeys = Object.entries(selectMap).map(([jname,joint])=>{
	  return [joint.parent.$.link, joint.child.$.link];
	}).flat();
	console.log('Selecting links:', selectKeys);
	links = links.filter(link=>selectKeys.includes(link.$.name));
      }
      const linkArray = Array.isArray(links) ? links : [links];
      const linkMap = Object.fromEntries(
	linkArray.map(link => [link.$.name, link])
      );
      fs.writeFileSync('linkmap.json',
		       JSON.stringify(changeRpyUrdfToThree(linkMap),
				      null, 2));
      console.log('The link information was exported to linkmap.json');
      //
      const obj = {};
      Object.entries(linkMap).forEach(([name,value])=>{
	if (value?.visual) {
	  const visuals = Array.isArray(value?.visual) ? value?.visual :
		[ value?.visual ];
	  const newVisual = [];
	  visuals.forEach((visual)=>{
	    console.log('processing update for link:', name);
	    const origin = {};
	    if (visual?.origin?.$) {
	      Object.assign(origin, visual.origin.$);
	    }
	    if (origin.rpy) {
	      const mat = eulerURDFToRotmat(
		origin.rpy[0], origin.rpy[1], origin.rpy[2]
	      );
	      const rotx90 = eulerXYZToRotmat(Math.PI/2, 0, 0);
	      const newMat = matrixMultiply(mat, rotx90);
	      const newRpy = rotmatToEulerXYZ(newMat);
	      origin.rpy = [ newRpy.rx, newRpy.ry, newRpy.rz ];
	    } else {
	      origin.rpy = [ Math.PI/2, 0, 0 ];
	    }
	    const fname = visual?.geometry?.mesh?.$?.filename;
	    if (fname) {
	      const parts = fname.split('.');
	      parts.pop(); // remove last element i.e extension
	      const fbase = parts.join('.');
	      // const mesh = fname+'.gltf';
	      const mesh = fbase+'.gltf';
	      const bbox = fbase+'.bbox.gltf';
	      const meshVisual = { geometry: {mesh: {$:{filename: mesh.split('/').pop()}}}};
	      const bboxVisual = { geometry: {mesh: {$:{filename: bbox.split('/').pop()}}}};
	      if (visual.geometry.mesh.$.scale) {
		meshVisual.geometry.mesh.$.scale = visual.geometry.mesh.$.scale;
		bboxVisual.geometry.mesh.$.scale = visual.geometry.mesh.$.scale;
	      }
	      if (origin) { // origin must be always set
		meshVisual.origin = { $: origin };
		bboxVisual.origin = { $: origin };
	      }
	      newVisual.push(meshVisual);
	      if (!argv['no-colliders']) {
		newVisual.push(bboxVisual);
	      }
	    } else {
	      newVisual.push(visual);
	    }
	  });
	  obj[name] = { visual: newVisual };
	} else {
	  obj[name] = value;
	}
      });
      const myUpdate = obj;
      fs.writeFileSync('update-stub.json', JSON.stringify(myUpdate, null, 2));
      console.log('recomended update.json stub was exported to update-stub.json');
   });
  });
});
