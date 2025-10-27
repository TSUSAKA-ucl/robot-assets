#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

// ファイルパスを指定
if (process.argv.length < 3) {
  console.error('使用法: node read_json.js <ファイルパス>');
  process.exit(1);
}
 
// 入力と出力のファイルパス
const inputPath = process.argv[2] || './input.json';
const outputPath = process.argv[2] ? process.argv[2].replace('.json', '.csv') : './output.csv';
// 入力ファイルが存在するか確認
if (!fs.existsSync(inputPath)) {
  console.error(`入力ファイルが存在しません: ${inputPath}`);
  process.exit(1);
}

// JSONファイル読み込み
fs.readFile(inputPath, 'utf8', (err, data) => {
  if (err) {
    console.error('ファイル読み込みエラー:', err);
    return;
  }

  try {
    const allObjects = JSON.parse(data);

    // "type" が "revolute" の要素だけ抽出
    const revolutes = allObjects.filter(obj => obj.$.type === 'revolute');

    // ヘッダ行
    const header = ['name', 'x', 'y', 'z', 'roll', 'pitch', 'yaw'];

    // 各行を文字列に変換
    const rows = revolutes.map(obj => {
      const name = obj.$.name ?? '';
      const xyz_in = obj.origin.$.xyz ?? [NaN, NaN, NaN];
      const xyz = Array.isArray(xyz_in) && xyz_in.length === 3 ? xyz_in : [NaN, NaN, NaN];
      const rpy_in = obj.origin.$.rpy ?? [NaN, NaN, NaN];
      const rpy = Array.isArray(rpy_in) && rpy_in.length === 3 ? rpy_in : [NaN, NaN, NaN];
      const axis_in = obj.axis.$.xyz ?? [NaN, NaN, NaN];
      const axis = Array.isArray(axis_in) && axis_in.length === 3 ? axis_in : [NaN, NaN, NaN];
      // 各値を文字列に変換し、カンマで結合
      return [name, ...xyz, ...rpy, ...axis].join(',');
    });

    // CSV全体の文字列を生成
    const csv = [header.join(','), ...rows].join('\n');

    // ファイルに書き出し
    fs.writeFile(outputPath, csv, 'utf8', err => {
      if (err) {
        console.error('CSV書き込みエラー:', err);
        return;
      }
      console.log('CSVを出力しました:', outputPath);
    });

  } catch (e) {
    console.error('JSONのパースエラー:', e);
  }
});
