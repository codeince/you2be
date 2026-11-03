/// <reference types="tampermonkey" />
// ==UserScript==
// @name           YouTube Fastener
// @name:ru        YouTube Ускоритель
// @description    Surf YouTube faster
// @description:ru Гоняй быстрее по YouTube
// @namespace      https://github.com/codeince/you2be
// @author         Code Slasher Incorporation
// @version        1.2.0
// @downloadURL    https://raw.githubusercontent.com/codeince/you2be/main/you2be.user.js
// @updateURL      https://raw.githubusercontent.com/codeince/you2be/main/you2be.user.js
// @icon           https://raw.githubusercontent.com/codeince/you2be/main/icon.png
// @match          http*://youtu.be/*
// @match          http*://youtube.com/*
// @match          http*://m.youtube.com/*
// @match          http*://www.youtube.com/*
// @grant          GM.addValueChangeListener
// @grant          GM.getValue
// @grant          GM.setClipboard
// @grant          GM.setValue
// @grant          GM.registerMenuCommand
// @grant          GM.unregisterMenuCommand
// @grant          window.onurlchange
// @run-at         document-start
// ==/UserScript==

class Setting {
  id;
  default;

  /**
   * Creates a setting
   * @param {string} id
   * @param {any} default_value
   */
  constructor(id, default_value) {
    this.id = id;
    this.default = default_value;
  }

  async getValue() {
    let value = await GM.getValue(this.id, this.default);

    if (typeof value !== typeof this.default) {
      value = this.default;
      await this.setValue(this.default);
      alert(
        `You setted ${this.id} to different value type\nValue meant to be like ${this.default}`,
      );
    }

    return value;
  }

  async setValue(new_value) {
    if (typeof new_value === typeof this.default) {
      await GM.setValue(this.id, new_value);
    } else {
      alert(
        `You setted ${this.id} to different value type\nValue meant to be like ${this.default}`,
      );
    }
  }
}

/** @type {URL|null} */
let lastLink = null;
const cleanSessionId = "ytf:clean";
const settings = {
  id: "settings",
  data: {
    keepShorts: new Setting("keepShorts", false),
    keptParams: new Setting("keptParams", { v: [], t: [], list: [], index: ["start_radio"] }),
    shareKeptParams: new Setting("shareKeptParams", {
      v: [],
    }),
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
 * @param {Record<string, string[]>} keptParams
 * @returns {URL}
 */
function cleanParams(target, source, keptParams) {
  for (const [key, values] of Object.entries(keptParams)) {
    let value = source.searchParams.get(key);

    for (const extraKey of values) {
      if (value) break;
      value = source.searchParams.get(extraKey);
    }

    if (value) {
      target.searchParams.set(key, value);
    }
  }
  return target;
}

const i18n = {
  en: {
    keepShortsOn: "Shorts in menu",
    keepShortsOff: "Shorts in default video player",
    share: "Share",
  },
  ru: {
    keepShortsOn: "Shorts в меню",
    keepShortsOff: "Shorts в окне обычных видео",
    share: "Поделиться",
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
  await GM.unregisterMenuCommand("share");
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
  await GM.registerMenuCommand(
    translation.share,
    async () => {
      const url = lastLink ?? new URL(location.href);
      lastLink = null;
      await run(
        url,
        await settings.data.shareKeptParams.getValue(),
        async (url) => await GM.setClipboard(url.href, "text"),
      );
    },
    { id: "share" },
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
 * @param {Record<string, string[]>} keptParams
 * @param {(url: URL) => Promise<void> | undefined} callback
 * @returns {Promise<boolean>} redirected
 */
async function run(url, keptParams, callback) {
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
  cleanParams(target, url, keptParams);
  betterTime(target);

  if (typeof callback === "function") {
    await callback(target);
    return false;
  }

  const redirected = target.href !== url.href && !sessionStorage.getItem(cleanSessionId);
  if (redirected) {
    sessionStorage.setItem(cleanSessionId, "1");
    location.assign(
      url.hostname.endsWith("youtube.com") ? `${target.pathname}${target.search}` : target.href,
    );
    setTimeout(() => sessionStorage.removeItem(cleanSessionId), 100);
  }

  return redirected;
}

(async () => {
  unregisterMenu();
  registerMenu();
})();

sessionStorage.removeItem(cleanSessionId);
const url = new URL(location.href);
(async () => {
  if (isVideoLink(url)) {
    await run(url, await settings.data.keptParams.getValue());
  }
})();
if ("onurlchange" in window) {
  window.addEventListener("urlchange", async () => {
    if (sessionStorage.getItem(cleanSessionId)) return;

    const url = new URL(location.href);
    if (isVideoLink(url)) {
      await run(url, await settings.data.keptParams.getValue());
    }
  });
}
window.addEventListener("click", async (event) => {
  if (sessionStorage.getItem(cleanSessionId)) return;

  const link = event.target?.closest("a[href]");
  if (!link) return;
  const url = new URL(link.getAttribute("href"), location.origin);

  if (isVideoLink(url)) {
    event.preventDefault();

    await run(url, await settings.data.keptParams.getValue());
  }
});

window.addEventListener(
  "contextmenu",
  (event) => {
    const target = event.target?.closest("a[href]");
    if (!target) return;
    let url = new URL(target.getAttribute("href"), location.origin);
    if (isVideoLink(url)) {
      lastLink = url;
      document.body.addEventListener(
        "click",
        () => {
          lastLink = null;
        },
        { once: true },
      );
    }
  },
  true,
);
