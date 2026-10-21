/// <reference types="tampermonkey" />
// ==UserScript==
// @name           YouTube Fastener
// @name:ru        YouTube Ускоритель
// @description    Surf YouTube faster
// @description:ru Гоняй быстрее по YouTube
// @namespace      https://github.com/codeince/you2be
// @version        1.0.8
// @downloadURL    https://raw.githubusercontent.com/codeince/you2be/main/you2be.user.js
// @updateURL    https://raw.githubusercontent.com/codeince/you2be/main/you2be.user.js
// @icon           https://raw.githubusercontent.com/codeince/you2be/main/icon.ico
// @match          http*://youtu.be/*
// @match          http*://youtube.com/*
// @match          http*://m.youtube.com/*
// @match          http*://www.youtube.com/*
// @grant GM.getValue
// @grant GM.setValue
// @grant GM.addValueChangeListener
// @grant GM.registerMenuCommand
// @grant GM.unregisterMenuCommand
// @grant window.onurlchange
// @run-at         document-start
// ==/UserScript==

const keepShortsId = "keepShorts";

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
	} else if (source.hostname.endsWith("youtube.com")) {
		const match = source.pathname.match(/^\/shorts\/([^/?]+)/);
		if (match) {
			videoId = match[1];
		}
	}
	return videoId;
}

/**
 * Removes all extra query parameters
 * @param {URL} target
 * @param {URL} source
 * @returns {URL}
 */
function cleanParams(target, source) {
	const keptParams = ["v", "t", "list", "index"];
	for (const key of keptParams) {
		const value = source.searchParams.get(key);
		if (source.searchParams.has(key) && value) {
			target.searchParams.set(key, value);
		}
	}
	return target;
}

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

let keepShorts = await GM.getValue(keepShortsId, false);

async function unregisterMenu() {
	await GM.unregisterMenuCommand(keepShortsId);
}

async function registerMenu() {
	const caption = keepShorts
		? translation.keepShortsOn
		: translation.keepShortsOff;
	await GM.registerMenuCommand(
		caption,
		async () => {
			await GM.setValue(keepShortsId, !keepShorts);
		},
		{ id: keepShortsId },
	);
}

/**
 * Is this link a supported video link
 * @param {URL} url
 * @returns {boolean} is video
 */
function isVideoLink(url) {
	return getVideoId(url) || url.pathname === "/watch";
}

/**
 * Run
 * @param {URL} url
 * @returns {Promise<boolean>} redirected
 */
async function run(url) {
	await GM.addValueChangeListener(
		keepShortsId,
		async (_name, _old, _new, remote) => {
			keepShorts = !keepShorts;
			if (
				!remote &&
				url.hostname.endsWith("youtube.com") &&
				url.pathname.startsWith("/shorts/")
			) {
				location.reload();
			} else {
				await unregisterMenu();
				await registerMenu();
			}
		},
	);

	const target = new URL(
		"/watch",
		url.hostname === "youtu.be" ? "https://youtube.com" : url.origin,
	);

	const videoId = getVideoId(url);
	if (videoId) {
		if (
			keepShorts &&
			url.hostname.endsWith("youtube.com") &&
			url.pathname.startsWith("/shorts/")
		) {
			target.pathname = `/shorts/${videoId}`;
		} else {
			target.searchParams.set("v", videoId);
		}
	}
	cleanParams(target, url);
	betterTime(target);

	if (target.href !== url.href) {
		location.replace(target.href);
	}

	return target.href !== url.href;
}

unregisterMenu();
registerMenu();

const url = new URL(location.href);
if (isVideoLink(url)) run();
if (window.onurlchange === null) {
  window.addEventListener("urlchange", async () => {
    const url = new URL(location.href);
    if (isVideoLink(url)) {
      await run(url);
    }
  })
	window.addEventListener("click", async (event) => {
		const link = event.target?.closest("a[href]");
		if (!link) return;
		const url = new URL(link.getAttribute("href"), "https://youtube.com");

		if (isVideoLink(url)) {
			event.preventDefault();
			event.stopImmediatePropagation();

			if (!(await run(url))) {
				location.assign(url);
			}
		}
	});
}
