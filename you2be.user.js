/// <reference types="tampermonkey" />
// ==UserScript==
// @name           YouTube Fastener
// @name:ru        YouTube Ускоритель
// @description    Surf YouTube faster
// @description:ru Гоняй быстрее по YouTube
// @namespace      https://github.com/codeince/you2be
// @version        1.1.3
// @downloadURL    https://raw.githubusercontent.com/codeince/you2be/main/you2be.user.js
// @updateURL    https://raw.githubusercontent.com/codeince/you2be/main/you2be.user.js
// @icon           https://raw.githubusercontent.com/codeince/you2be/main/icon.png
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

class Setting {
  id;
  default;

  constructor(id, default_value) {
    this.id = id;
    this.default = default_value;
  }

  async getValue() {
    let value = await GM.getValue(this.id, this.default);

    if (typeof value !== typeof this.default) {
      value = this.default;
      await this.setValue(this.default);
      alert(`You setted ${this.id} to different value type\nValue meant to be like ${this.default}`);
    }

    return value;
  }

  async setValue(new_value) {
    if (typeof new_value === typeof this.default) {
      await GM.setValue(this.id, new_value);
      alert(`You setted ${this.id} to different value type\nValue meant to be like ${this.default}`);
    }
  }
}

const settings = {
  id: "settings",
  data: {
    keepShorts: new Setting("keepShorts", false),
    keptParams: new Setting("keptParams", ["v", "t", "list", "index"]),
  },
};

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
 * @param {[string]} keptParams
 * @returns {URL}
 */
function cleanParams(target, source, keptParams) {
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

async function unregisterMenu() {
  await GM.unregisterMenuCommand(settings.data.keepShorts.id);
}

async function registerMenu() {
  const keepShorts = await settings.data.keepShorts.getValue();
  const caption = keepShorts ? translation.keepShortsOn : translation.keepShortsOff;
  await GM.registerMenuCommand(
    caption,
    async () => {
      await settings.data.keepShorts.setValue(!(await settings.data.keepShorts.getValue()));
    },
    {
      id: settings.data.keepShorts.id,
    },
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
    settings.data.keepShorts.id,
    async (_name, _old, _new, remote) => {
      if (!remote && url.hostname.endsWith("youtube.com") && url.pathname.startsWith("/shorts/")) {
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
      (await settings.data.keepShorts.getValue()) &&
      url.hostname.endsWith("youtube.com") &&
      url.pathname.startsWith("/shorts/")
    ) {
      target.pathname = `/shorts/${videoId}`;
    } else {
      target.searchParams.set("v", videoId);
    }
  }
  cleanParams(target, url, await settings.data.keptParams.getValue());
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
  });
  window.addEventListener("click", async (event) => {
    const link = event.target?.closest("a[href]");
    if (!link) return;
    const url = new URL(link.getAttribute("href"));
    if (url.origin === "") {
      url.origin = "https://youtube.com";
    }

    if (isVideoLink(url)) {
      event.preventDefault();
      event.stopImmediatePropagation();

      if (!(await run(url))) {
        location.assign(url);
      }
    }
  });
}
