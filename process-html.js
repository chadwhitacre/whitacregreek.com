#!/usr/bin/env node
const fs = require( 'fs' );
const path = require( 'path' );
const jsdom = require("jsdom");
const { JSDOM } = jsdom;

function modifyOne(dom) {
  const document = dom.window.document;

  function remove(query) {
    var el;
    while(1) {
      el = document.querySelector(query);
      if (!el) break;
			el.parentNode.removeChild(el);
    }
  };

  remove('script');
  remove('iframe');
  remove('noscript');
  remove('#jp-post-flair'); // share buttons
  remove('#likes-other-gravatars'); // ???
  remove('#colophon'); // footer
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
