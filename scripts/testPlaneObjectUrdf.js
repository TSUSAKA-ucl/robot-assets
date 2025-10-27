#!/usr/bin/env node
const fs = require('fs');

process.argv.slice(2).forEach(filename => {
  fs.readFile(filename, (err,text) => {
    const data = JSON.parse(text);
    const array = Object.values(data);
    console.log('object:', data);
    console.log('array:', array);
  });
});
