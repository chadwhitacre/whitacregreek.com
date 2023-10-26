#!/usr/bin/env node
const fs = require( 'fs' );
const path = require( 'path' );
const jsdom = require("jsdom");
const { JSDOM } = jsdom;

async function handleFile(filepath) {
  if (!filepath.endsWith('.html')) {
    return;
  }
  var html;
  const dom = await JSDOM.fromFile(filepath).then(dom => {
    html = dom.serialize();
  });
  const www = filepath.replace('raw/', 'www/');
  await fs.mkdir(path.dirname(www), { recursive: true }, () => {})
  await fs.writeFile(www, html, () => {});
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
  handleDir('raw')
})();
