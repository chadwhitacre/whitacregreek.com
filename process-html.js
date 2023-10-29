#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const https = require('https');
const jsdom = require('jsdom');
const prettier = require('prettier');

const { JSDOM } = jsdom;

function reverse(s) {
  return s.split('').reverse().join('');
}

async function download(url, destdir) {
  var fnqs = path.basename(url);
  var filename = fnqs, querystring = '';

  if (fnqs.indexOf('?') > -1) {
    [filename, querystring] = fnqs.split('?');
    var emanelif = reverse(filename);
    var idx = emanelif.indexOf('.');
    var ext = reverse(emanelif.slice(0, idx));
    var fn = reverse(emanelif.slice(idx+1));
    fn = fn.replaceAll('_', '-').replaceAll('.', '-');
    part = querystring.replaceAll('=', '-').replaceAll('&', '-');
    filename = `${fn}-${part}.${ext}`
  }

  filepath = path.join(destdir, filename);
  var file = fs.createWriteStream(filepath);
  await https.get(url, function(response) {
    response.pipe(file);
    file.on('finish', function() {
      file.close();
    });
  });

  return filepath.replace('docs/', '/');
}

async function modifyImages(images, destdir) {
  for (var i=0, img; img=images[i]; i++) {

    // strip data-foo attrs
    for (var j=0, attr; attr=img.attributes[j]; j++) {
      if (attr.name.startsWith('data-')) {
        img.removeAttribute(attr.name);
        j--;
      }
    }

    // download img.src and replace
    var url = img.src;
    if (url.startsWith('http')) {
      img.src = await download(url, destdir);
    }

    // same for img.srcset
    var url, size, urlSizes = img.srcset.split(', ');
    for (var j=0, urlSize; urlSize=urlSizes[j]; j++) {
      [url, size] = urlSize.split(' ');
      url = await download(url, destdir);
      urlSizes[j] = `${url} ${size}`;
    }
    img.srcset = urlSizes.join(', ');
  }
}

async function modifyDom(dom, destdir) {
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
  remove('#actionbar'); // ???
  remove('link[rel="alternate"]'); // RSS feeds
  remove('link[rel="EditURI"]');
  remove('link[rel="canonical"]');
  remove('link[rel="shortlink"]');
  remove('link[rel="search"]');
  remove('link[rel="dns-prefetch"]');
  remove('meta[name="generator"]');
  remove('meta[property="article:publisher"]');
  remove('meta[name="msapplication-task"]');
  remove('meta[name="msapplication-window"]');
  remove('meta[name="msapplication-tooltip"]');

  // carousel
  remove('#jp-carousel-loading-overlay');
  remove('.jp-carousel-overlay');
  remove('#all-css-0-2');

  document.getElementById('global-styles-inline-css').innerHTML = '@import url("/assets/global.css")';

  await modifyImages(document.getElementsByTagName('img'), destdir);
}

function modifyHtml(html) {
  html = html.replace(/<!--[\s\S]*?-->/g, '');
  html = html.replace(/\n\n/g, '');

  // Hacky, yes.
  html = html.replace('href="https://s0.wp.com/_static/??-eJytkFFPAyEQhP+QsMFUqg/G38LBhm67cISFGv6914utp4mpDz5OZubL7MJ7UX7ODXOD1FXhHikLMJ1Q4IitOH9Sq9Je5AE28Ws29kVOWOPiVISzsXqvDUydOMDE8wqYqqsDpA3G/wC1A6YvEGXPPVwGCyQM5JAX+3LRRhR2A6tijM4PnSjfry/eVn8r/T5+Xbp5nhtzbypWCn++/weiukY5yp26nz9rj9o8a6OEUmFUFc96B4Gk3RLqBnpLr8a+WLsz+yd7/ABW9sKA&amp;cssminify=yes"',
    'href="/assets/1.css"');
  html = html.replace('href="https://s1.wp.com/_static/??/wp-content/mu-plugins/core-compat/wp-mediaelement.css,/wp-content/mu-plugins/wpcom-bbpress-premium-themes.css?m=1432920480j&amp;cssminify=yes"',
    'href="/assets/2.css"');
  html = html.replace('href="https://s0.wp.com/_static/??-eJxti1EKgDAMQy/kLCrI/BDv4hxSXbthN/X4TgQ/RPKTvCRwBGU8R8sRKKng0owssNttTAQTSgTkyZ6lESngf2w8UUbK4Wpzkg95rgjsI+a3vOYuBuqrtsvSja6XCwGfNCc=&amp;cssminify=yes"',
    'href="/assets/3.css"');
  html = html.replace('href="https://s0.wp.com/wp-content/themes/pub/varia/print.css?m=1571655471i&amp;cssminify=yes"',
    'href="/assets/4.css"');
  html = html.replace('href="https://s0.wp.com/_static/??-eJx9i9EKwjAMAH/IGCpjsAfxW7oQu0ralDbd8O+d+KIovt3BHW4FSLNxNrSFEzcsfcaFV67Y7C58pNYO+DtbfY0eY6ZXClshTV9D6lCkh5gbBlYQJW9R84fAVXys/9bKs2jYMeBevelzuqSzGyc3TO40jLcHjTdOxQ==&amp;cssminify=yes"',
    'href="/assets/5.css"');
  html = html.replace('href="https://s0.wp.com/wp-content/themes/pub/hever/style.css?m=1691491246i&amp;cssminify=yes"',
    'href="/assets/6.css"');
  html = html.replace('href="https://s1.wp.com/_static/??-eJyNjcEKAjEMRH/IGnZxFz2InyI1DW3XNCmmRfx7XfEiXrwM82B4A/fqUKWRNCjdVe4xi8FCrXq8fhiK6hqhMxlY8jcKPoTHu2aJWzTbwP+mcxYEU8yeHWtU+4IfW0tUXr9pB5H14nkdnMpxmA/zNA7TuF+eUVRJKw==&amp;cssminify=yes"',
    'href="/assets/7.css"');
  html = html.replace('href="https://s0.wp.com/_static/??-eJyljEsKgDAMBS9kDUUquhDPom0Qaz/BNHh9KdgTuBl4w2PgIWVzKpgKRFEU5DgTg8dCm72+DTHnCicBGex2Z2EMwM9JeKtdkgvYW+YOftTaqYkaXOOix8noQU+z8S9MR0BZ&amp;cssminify=yes"',
    'href="/assets/8.css"');
  html = html.replace('href="https://s1.wp.com/i/favicon.ico"', 'href="/favicon.ico"');
  html = html.replace('<link rel="apple-touch-icon" href="https://s2.wp.com/i/webclip.png" />', 'href="/assets/webclip.png"');

  return html;
}

async function handleFile(src) {
  if (!src.endsWith('.html')) {
    return;
  }
  const dest = src.replace('raw/', 'docs/');
  const destdir = path.dirname(dest);
  await fs.mkdir(destdir, { recursive: true }, () => {})

  const dom = await JSDOM.fromFile(src);
  await modifyDom(dom, destdir);

  var html;
  html = dom.serialize();
  html = modifyHtml(html);
  html = await prettier.format(html, {parser: 'html'});

  await fs.writeFile(dest, html, () => {});
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
