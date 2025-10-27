'use strict';
const fs = require('fs');
const path = require('path');

// Emscriptenで生成した初期化関数。これを呼んでSlrmModuleを生成する。
const ModuleFactory = require('../wasm/dist/slrm_module.js');

// SlrmModuleを閉じ込めて、その関連オブジェクトを生成するhelper関数群
function createHelpers(module) {
  function makeDoubleVector(jsArray) {
    const vec = new module.DoubleVector();
    for (let i = 0; i < jsArray.length; ++i) {
      vec.push_back(jsArray[i]);
    }
    return vec;
  }
  function makeJointModelVector(jsArray) {
    const vec = new module.JointModelFlatStructVector();
    for (let i = 0; i < jsArray.length; ++i) {
      vec.push_back(jsArray[i]);
    }
    return vec;
  }
  // 他のヘルパー関数もここに追加できる
  // }

  // 他にも必要な関数を追加できる
  return {
    makeDoubleVector,
    makeJointModelVector,
    // ... more helpers
  };
}

// ************************
// メイン関数
function main() {
  // ファイルパスを指定
  if (process.argv.length < 3) {
    console.error('使用法: node read_json.js <ファイルパス>');
    process.exit(1);
  }
  // リンク構造定義の入力のファイルパス
  const inputPath = process.argv[2] || './links.json';
  // 入力ファイルが存在するか確認
  if (!fs.existsSync(inputPath)) {
    console.error(`入力ファイルが存在しません: ${inputPath}`);
    process.exit(1);
  }
  // WASMのモジュールを生成する。モジュール初期化が完了してからアクセスするためthenを使う。
  ModuleFactory().then((SlrmModule) => { 
    const { makeDoubleVector, makeJointModelVector } = createHelpers(SlrmModule);
    // SlrmModule.setLogCallbacks(msg => console.log("debug: " + msg),
    // 			       msg => console.log("info: " + msg),
    // 			       msg => console.warn("warn: " + msg),
    // 			       msg => console.error("error: " + msg));
    SlrmModule.setJsLogLevel(4);
    let cmdVelGen = null;
    // リンク定義のJSONファイル(extract-joint-tag.jsでURDF XMLから生成)読み込み 
    fs.readFile(inputPath, 'utf8', (err, data) => {
      if (err) {
	console.error('ファイル読み込みエラー:', err);
	return;
      }
      try {
	const allObjects = JSON.parse(data);
	// console.log('読み込んだリンク定義:', allObjects);
	// "type" が "revolute" の要素だけ抽出
	const revolutes = allObjects.filter(obj => obj.$.type === 'revolute');
	// 各行をJointModuleFlatStructに
	const linkModel = revolutes.map(obj => {
	  // const name = obj.$.name ?? '';
	  const xyz_in = obj.origin.$.xyz ?? [NaN, NaN, NaN];
	  const xyz = makeDoubleVector(Array.isArray(xyz_in) && xyz_in.length === 3
				       ? xyz_in : [NaN, NaN, NaN]);
	  const rpy_in = obj.origin.$.rpy ?? [NaN, NaN, NaN];
	  const rpy = makeDoubleVector(Array.isArray(rpy_in) && rpy_in.length === 3
				       ? rpy_in : [NaN, NaN, NaN]);
	  const axis_in = obj.axis.$.xyz ?? [NaN, NaN, NaN];
	  const axis = makeDoubleVector(Array.isArray(axis_in) && axis_in.length === 3
					? axis_in : [NaN, NaN, NaN]);
	  // 各値をオブジェクトに変換
	  const j = new SlrmModule.JointModelFlatStruct(axis, xyz, rpy);
	  axis.delete();
	  xyz.delete();
	  rpy.delete();
	  return j;
	});
	console.log('抽出されたリンクパラメータ:', linkModel);
	const jointModelVector = makeJointModelVector(linkModel);
	console.log('JointModelFlatStructVector:', jointModelVector);
	// CmdVelGenerator のインスタンスを生成
	cmdVelGen = new SlrmModule.CmdVelGenerator(jointModelVector);
	// map内でSlrmModuleのJointModelFlatStructをnewしているため
	// delete()を呼ぶ必要がある。CmdVelGeneratorがnewされた時点で
	// コピーされていて不要になっている。
	linkModel.forEach(p => p.delete());
	console.log(cmdVelGen);
	if (cmdVelGen === null || cmdVelGen === undefined) {
	  console.error('CmdVelGeneratorのインスタンス生成に失敗しました。');
	  return;
	} else {
	  console.log('CmdVelGeneratorのインスタンス生成に成功しました。');
	}
	// cmdVelGen.setAngularGain(0.1);
	// CmdVelGeneratorのインスタンスが生成完了。
	// calc_velocity関数のテスト
	// Stamp = 1750387394,105693271,link6
	const test_joint_positions = makeDoubleVector([0.2,1.5,-1.0,-0.1,-0.4,1.5]);
	// Stamp = 1750387394,105693271,link6,interactive_marker
	const test_dest_position = makeDoubleVector([0.07139335203120406,
						     -0.10418553471142364,
						     0.11704873351506728]);
	const test_dest_orientation = makeDoubleVector([0.08614020248228683,
							-0.08263994602917865,
							-0.6421385155984861,
							0.7572375001421798]);
	const result = cmdVelGen.calcVelocity(test_joint_positions,
					      test_dest_position,
					      test_dest_orientation);
	// メモリリークを防ぐためにdelete()を呼ぶ
	test_joint_positions.delete();
	test_dest_position.delete();
	test_dest_orientation.delete();
	// 結果を表示
	console.log('status: ', result.status.value);
	// console.log('status: ', result.status);
	const vec = result.joint_velocities;
	for (let i = 0; i < vec.size(); ++i) {
	        console.log(`joint_velocities[${i}]: `, vec.get(i));
	}
	// console.log('velocity: ', result.joint_velocities);
	console.log('condition_number: ', result.other.condition_number,
		    ' manipulability: ', result.other.manipulability,
		    ' sensitivity_scale: ', result.other.sensitivity_scale
		   );
	// メモリリークを防ぐためにdelete()を呼ぶ
	cmdVelGen.delete();
      } catch (e) {
	console.error('JSONのパースエラー:', e);
      }
    });
  }).catch(err => {
    console.error('WASMモジュールの初期化エラー:', err);
  });
}

// モジュールが直接実行された場合にmainを呼び出す
if (require.main === module) {
  main();
}
