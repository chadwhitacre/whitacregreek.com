#!/usr/bin/env node
const fs = require( 'fs' );
const path = require( 'path' );
const jsdom = require("jsdom");
const { JSDOM } = jsdom;

function modifyOne(dom) {
  const document = dom.window.document;

  function remove(el) {
    if (!el) return false;
    el.parentNode.removeChild(el);
    return true;
  }

  function removeAll(query) {
    var el;
    while(1) {
      el = document.querySelector(query);
      if (!remove(el)) break;
    }
  };

  removeAll('script');
  removeAll('iframe');
  remove(document.getElementById('jp-post-flair')); // share buttons
  remove(document.getElementById('likes-other-gravatars')); // ???
  remove(document.getElementById('colophon'));
}

async function handleFile(filepath) {
  console.log(filepath);
  if (!filepath.endsWith('.html')) {
    return;
  }
  var html;
  const dom = await JSDOM.fromFile(filepath).then(dom => {
    modifyOne(dom);
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
      await handleFile(next);
    } else if(stat.isDirectory()) {
      await handleDir(next);
    } else {
      throw aFit;
    }
  }
}

(async ()=>{
  await handleDir('raw')
})();
