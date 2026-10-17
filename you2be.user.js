// ==UserScript==
// @name         YouTube Shortener
// @namespace    https://github.com/codeince/you2be
// @version      1.0.2
// @downloadURL https://raw.githubusercontent.com/codeince/you2be/main/you2be.user.js
// @icon https://raw.githubusercontent.com/codeince/you2be/main/icon.ico
// @match        *://youtu.be/*
// @match        *://youtube.com/shorts/*
// @match        *://youtube.com/watch*
// @match        *://m.youtube.com/shorts/*
// @match        *://m.youtube.com/watch*
// @match        *://www.youtube.com/shorts/*
// @match        *://www.youtube.com/watch*
// @run-at       document-start
// ==/UserScript==

const url = new URL(location.href);
const keptParams = ["v", "t", "list", "index"];

/**
 * Removes all extra query params
 * @param {URL} target
 * @param {URL} source
 * @returns {URL}
 */
function cleanParams(target, source) {
	for (const key of keptParams) {
		if (source.searchParams.has(key)) {
			target.searchParams.set(key, source.searchParams.get(key));
		}
	}
	return target;
}

/**
 * Adds s if t query parameter is just a number
 * @param {URL} source
 * @returns {URL}
 */
function betterTime(source) {
	const value = source.searchParams.get("t");
	if (/^[0-9]*$/.test(value)) {
		source.searchParams.set("t", `${value}s`)
  }
  return source;
}

/**
 * Try to fetch Video ID
 * @param {URL} source
 * @returns {string|null}
 */
function getVideoId(source) {
	let videoId = null;
	if (source.hostname === "youtu.be") {
		videoId = source.pathname.split("/").filter(Boolean)[0] ?? null;
	} else {
		const shortsMatch = source.pathname.match(/^\/shorts\/([^/?]+)/);
		if (shortsMatch) {
			videoId = shortsMatch[1];
		} else if (source.pathname === "/watch") {
			videoId = source.searchParams.get("v");
		}
	}

	return videoId;
}

let target = null;

const videoId = getVideoId(url);
if (videoId) {
	target = new URL(
		"/watch",
		url.hostname === "youtu.be" ? "https://youtube.com" : url.origin,
	);
	target.searchParams.set("v", videoId);
  cleanParams(target, url);
  betterTime(target);
}

if (target && target.href !== url.href) {
	window.stop();
	location.replace(target.href);
}
