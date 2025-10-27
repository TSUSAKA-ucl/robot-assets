#!/usr/bin/env node

import fs from "fs";

main();

// updateLeaves は既存の関数をそのまま使用
// import する場合は: import { updateLeaves } from './updateLeaves.js';

function main() {
  const [,, fileA, fileB] = process.argv;

  if (!fileA || !fileB) {
    console.error("Usage: node updateJson.js <fileA.json> <fileB.json>");
    process.exit(1);
  }

  const a = JSON.parse(fs.readFileSync(fileA, "utf-8"));
  console.log(fileA + ' is parsed');
  const b = JSON.parse(fs.readFileSync(fileB, "utf-8"));
  console.log(fileB + ' is parsed');

  updateLeaves(a, b);

  console.log(JSON.stringify(a, null, 2));
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
      // if (a[key] != bVal) console.log('update: ', a[key], ' to ', bVal);
      a[key] = bVal;
    }
  }
  return a;
}
