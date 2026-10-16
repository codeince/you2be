// ==UserScript==
// @name         YouTube Shortener
// @namespace    https://github.com/codeince/you2be
// @version      1.0.0
// @downloadURL https://raw.githubusercontent.com/codeince/you2be/main/you2be.user.js
// @icon https://raw.githubusercontent.com/codeince/you2be/main/icon.ico
// @match        *://youtu.be/*
// @match        *://youtube.com/shorts/*
// @match        *://youtube.com/watch*
// @match        *://www.youtube.com/shorts/*
// @match        *://www.youtube.com/watch*
// @run-at       document-start
// ==/UserScript==

const url = new URL(location.href);
const keptParams = ["v", "t", "list", "index"];

function cleanParams(target, source) {
  for (const key of keptParams) {
    if (source.searchParams.has(key)) {
      target.searchParams.set(key, source.searchParams.get(key));
    }
  }
  return target;
}

let target = null;

const shortsMatch = url.pathname.match(/^\/shorts\/([^/?]+)/);

if (shortsMatch) {
  target = new URL("/watch", "https://www.youtube.com");
  target.searchParams.set("v", shortsMatch[1]);
  cleanParams(target, url);
}

else if (url.hostname === "youtu.be") {
  const videoId = url.pathname.split("/").filter(Boolean)[0];

  if (videoId) {
    target = new URL("/watch", "https://www.youtube.com");
    target.searchParams.set("v", videoId);
    cleanParams(target, url);
  }
}

else if (url.pathname === "/watch") {
  target = new URL("/watch", url.origin);
  cleanParams(target, url);
}

if (target && target.href !== url.href) {
  location.replace(target.href);
}
