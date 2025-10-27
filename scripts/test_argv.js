#!/usr/bin/env node
for(var i = 0;i < process.argv.length; i++){
  console.log("argv[" + i + "] = " + process.argv[i]);
}

process.argv.slice(2).forEach(fn=>{
  console.log(fn);
});
