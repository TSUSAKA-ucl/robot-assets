#!/usr/bin/env node
//
// URDFのXMLから必要部分だけのJSONを作成する
// 	CmdVelGeneratorのWASM版の初期化に使用するデータとして生成
//
// jointタグだけ抜き出して配列にし、親子関係でセマンティックソートし、
// numericKeysに含まれるキーのvalueを数値に変換し、JSONで出力する
//
const xml2js = require('xml2js');
const fs = require('fs');
// const parser = new xml2js.Parser();
const parser = new xml2js.Parser({explicitArray: false});
const util = require('util');

const keepKeys = ['joint','name','parent'];

process.argv.slice(2).forEach(filename => {
  fs.readFile(filename, (err, data) => {
    parser.parseString(data, (err, result) => {
      // console.log(JSON.stringify(result, null, 2));
      // 不要なタグの削除
      // delete result.root.unwantedTag;
      const linkArray = convertToNumbers(result.robot.link);
      const linkMap = Object.fromEntries(
	linkArray.map(link => [link.$.name, link])
      );
      // console.log(JSON.stringify(result.robot.joint,null,2));
      // js出力
      // console.log(util.inspect(filtered, { depth: null, colors: false }));
      // JSON出力
      console.log(JSON.stringify(linkMap, null, 2));
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
