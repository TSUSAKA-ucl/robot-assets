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

// 引数パース
const argv = yargs(hideBin(process.argv))
      .usage("Usage: $0 <urdf_XML_file> --sort")
      .option("sort", {
	alias: "s",
	describe: "output the joint list as an array instead of a key-value object",
	default: false,
	type: 'boolean'
      })
      .demandCommand(1, "You must provide a URDF(XML) file")
      .help()
      .argv;

// const parser = new xml2js.Parser();
const parser = new xml2js.Parser({explicitArray: false});
const util = require('util');

const keepKeys = ['joint','name','parent'];

argv._.forEach(filename => {
  fs.readFile(filename, (err, data) => {
    parser.parseString(data, (err, result) => {
      // console.log(JSON.stringify(result, null, 2));
      // 不要なタグの削除
      // delete result.root.unwantedTag;
      const joint = result.robot.joint;
      const filtered =
	    // Object.fromEntries(
	    // Object.entries(result.robot) //.filter(([key])=>keepKeys.includes(key))
	    // result.robot.joint.every(entry=>keepKeys.includes(entry.$));
	    // result.robot.joint.(entry=>"name" in entry.$ ? $ : );
	    convertToNumbers(sortJointsByHierarchy(result.robot.joint));
      const jointMap = Object.fromEntries(filtered.map((v) => [v.$.name,v]));
      // console.log(JSON.stringify(result.robot.joint,null,2));
      // js出力
      // console.log(util.inspect(filtered, { depth: null, colors: false }));
      // JSON出力
      const jointOutput = argv.sort ? filtered : jointMap;
      const output = argv.sort ? 'urdfsorted.json' : 'urdfmap.json';

      fs.writeFileSync(output, JSON.stringify(jointOutput, null, 2));
      console.log('The joint information was exported to',output);
      //
      const links = convertToNumbers(result.robot.link)
      const linkArray = Array.isArray(links) ? links : [links];
      const linkMap = Object.fromEntries(
	linkArray.map(link => [link.$.name, link])
      );
      fs.writeFileSync('linkmap.json', JSON.stringify(linkMap, null, 2));
      console.log('The link information was exported to linkmap.json');
      //
      const myUpdate = Object.entries(linkMap).map(([name,value])=>{
	const visuals = value?.visual;
	if (visuals) {
	  // return [name, visuals?.geometry?.mesh?.$?.filename];
	  const fname = visuals?.geometry?.mesh?.$?.filename;
	  const parts = fname.split('.');
	  parts.pop(); // remove last element i.e extension
	  const fbase = parts.join('.');
	  if (fname) {
	    const mesh = fname+'.gltf';
	    const bbox = fbase+'.bbox.gltf';
	    return [name, {visual: [ {geometry: {mesh: {$:{filename: mesh.split('/').pop()}}}},
				     {geometry: {mesh: {$:{filename: bbox.split('/').pop()}}}},
				   ]}];
	  }
	} else {
	  return [name, visuals];
	}
      });
      fs.writeFileSync('update-stub.json', JSON.stringify(myUpdate, null, 2));
      console.log('recomended update.json stub was exported to update-stub.json');
   });
  });
});

function sortJointsByHierarchy(joints) {
  // joint間の名前付き参照関係を構築
  const graph = new Map(); // parent_link_name -> list of joints
  const inDegree = new Map(); // child_link_name -> number of parents (for topological sort)

  const linkToJoint = new Map(); // child link -> joint object (for ordered result)

  joints.forEach(joint => {
    const parent = joint.parent.$.link;
    const child = joint.child.$.link;

    // グラフ構築
    if (!graph.has(parent)) graph.set(parent, []);
    graph.get(parent).push(joint);

    // in-degree count
    inDegree.set(child, (inDegree.get(child) || 0) + 1);
    if (!inDegree.has(parent)) inDegree.set(parent, 0); // ensure parent is included

    // 紐づけ保存（任意）
    linkToJoint.set(child, joint);
  });

  // in-degree = 0 のノードをキューに追加（ルート）
  const queue = [];
  for (const [link, degree] of inDegree.entries()) {
    if (degree === 0) queue.push(link);
  }

  const orderedJoints = [];

  while (queue.length > 0) {
    const parentLink = queue.shift();
    const children = graph.get(parentLink) || [];

    for (const joint of children) {
      const childLink = joint.child.$.link;
      orderedJoints.push(joint);

      inDegree.set(childLink, inDegree.get(childLink) - 1);
      if (inDegree.get(childLink) === 0) {
        queue.push(childLink);
      }
    }
  }

  // 結果チェック：並びきれなかった joint があれば警告
  if (orderedJoints.length !== joints.length) {
    console.warn("一部のjointが循環依存しているか、構造がおかしい可能性があります。");
  }

  return orderedJoints;
}

// 特定のキーのバリューを数値に変換する
const convertToNumbers = function fnc(obj) {
  const numericKeys = ['xyz', 'rpy', 'lower', 'upper', 'effort', 'velocity'];
  if (Array.isArray(obj)) {
    // 配列なら中身に再帰
    return obj.map(fnc);
  } else if (obj && typeof obj === 'object') {
    // オブジェクトなら各キーを調べる
    const result = {};
    for (const [key, value] of Object.entries(obj)) {
      if (numericKeys.includes(key) && typeof value === 'string') {
        // const num = Number(value);
        // result[key] = Number.isNaN(num) ? value : num;
	const numbers = value.trim().split(/\s+/).map(Number);
	result[key] = numbers.length === 1 ? numbers[0] : numbers;
      } else {
        result[key] = fnc(value); // 再帰
      }
    }
    return result;
  } else {
    // プリミティブ（文字列や数値など）はそのまま
    return obj;
  }
}

function updateLeaves(a, b) {
  for (const key in b) {
    if (!(key in a)) continue; // aに存在しないキーは無視
    const bVal = b[key];
    const aVal = a[key];

    if (
      bVal !== null &&
      typeof bVal === "object" &&
      !Array.isArray(bVal) &&
      aVal !== null &&
      typeof aVal === "object" &&
      !Array.isArray(aVal)
    ) {
      // 両方オブジェクトなら再帰
      updateLeaves(aVal, bVal);
    } else {
      // 配列やオブジェクトでない値は上書き
      a[key] = bVal;
    }
  }
  return a;
}
