#!/usr/bin/env node
const fs = require( 'fs' );
const path = require( 'path' );
const jsdom = require("jsdom");
const { JSDOM } = jsdom;

async function handleFile(filepath) {
  if (!filepath.endsWith('.html')) {
    return;
  }
  const dom = JSDOM.fromFile(filepath).then(dom => {
    //console.log(dom.serialize());
    dom.window.document.querySelector("script").textContent); // "Hello world"
  });
}


async function handleDir(dirpath) {
  for(const name of await fs.promises.readdir(dirpath)) {
    const next = path.join(dirpath, name);
    const stat = await fs.promises.stat(next);
    if(stat.isFile()) {
      handleFile(next);
    } else if(stat.isDirectory()) {
      handleDir(next);
    }
  }
}

(async ()=>{
  handleDir('src')
})();
