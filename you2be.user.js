// ==UserScript==
// @name           YouTube Fastener
// @name:ru        YouTube Ускоритель
// @description    Surf YouTube faster
// @description:ru Гоняй быстрее по YouTube
// @namespace      https://github.com/codeince/you2be
// @version        1.0.3
// @downloadURL    https://raw.githubusercontent.com/codeince/you2be/main/you2be.user.js
// @updateURL    https://raw.githubusercontent.com/codeince/you2be/main/you2be.user.js
// @icon           https://raw.githubusercontent.com/codeince/you2be/main/icon.ico
// @match          *://youtu.be/*
// @match          *://youtube.com/shorts/*
// @match          *://youtube.com/watch*
// @match          *://m.youtube.com/shorts/*
// @match          *://m.youtube.com/watch*
// @match          *://www.youtube.com/shorts/*
// @match          *://www.youtube.com/watch*
// @grant GM.getValue
// @grant GM.setValue
// @grant GM.registerMenuCommand
// @grant GM.unregisterMenuCommand
// @top-level-await
// @run-at         document-start
// ==/UserScript==

const i18n = {
	en: {
		keepShortsOn: "Shorts in menu",
		keepShortsOff: "Shorts in default video player",
	},
	ru: {
		keepShortsOn: "Shorts в меню",
		keepShortsOff: "Shorts в окне обычных видео",
	},
};

/**
 * Gets user language
 * @returns {string}
 */
function getLang() {
	const ytLang = document.documentElement.lang?.split("-")[0];
	if (ytLang && i18n[ytLang]) return ytLang;
	const navLang = navigator.language.split("-")[0];
	if (i18n[navLang]) return navLang;
	return "en";
}

const translation = i18n[getLang()];

const keepShortsId = "keepShorts";
let keepShorts = await GM.getValue(keepShortsId, false);

async function registerMenu() {
	const caption = keepShorts
		? translation.keepShortsOn
		: translation.keepShortsOff;
	await GM.registerMenuCommand(
		caption,
		async () => {
			keepShorts = !keepShorts;
			await GM.setValue(keepShortsId, keepShorts);
			await GM.unregisterMenuCommand(keepShortsId);
			registerMenu();
			location.reload();
		},
		{ id: keepShortsId },
	);
}
registerMenu();

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
		source.searchParams.set("t", `${value}s`);
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
	if (keepShorts && url.pathname.startsWith("/shorts/")) {
		target.pathname = `/shorts/${videoId}`;
	} else {
		target.searchParams.set("v", videoId);
	}
	cleanParams(target, url);
	betterTime(target);
}

if (target && target.href !== url.href) {
	window.stop();
	location.replace(target.href);
}
