// ==UserScript==
// @name           YouTube Fastener
// @name:ru        YouTube Ускоритель
// @description    Surf YouTube faster
// @description:ru Гоняй быстрее по YouTube
// @namespace      https://github.com/codeince/you2be
// @author         Code Slasher Incorporation
// @version        1.1.6
// @downloadURL    https://raw.githubusercontent.com/codeince/you2be/main/you2be.user.js
// @updateURL      https://raw.githubusercontent.com/codeince/you2be/main/you2be.user.js
// @icon           https://raw.githubusercontent.com/codeince/you2be/main/icon.png
// @match          http*://youtu.be/*
// @match          http*://youtube.com/*
// @match          http*://m.youtube.com/*
// @match          http*://www.youtube.com/*
// @grant          GM.getValue
// @grant          GM.setValue
// @grant          GM.addValueChangeListener
// @grant          GM.registerMenuCommand
// @grant          GM.unregisterMenuCommand
// @grant          window.onurlchange
// @run-at         document-start
// ==/UserScript==
class t{id;default;constructor(t,e){this.id=t,this.default=e}async getValue(){let t=await GM.getValue(this.id,this.default);return typeof t!=typeof this.default&&(t=this.default,await this.setValue(this.default),alert(`You setted ${this.id} to different value type\nValue meant to be like ${this.default}`)),t}async setValue(t){typeof t==typeof this.default?await GM.setValue(this.id,t):alert(`You setted ${this.id} to different value type\nValue meant to be like ${this.default}`)}}const e="ytf:clean",a={id:"settings",data:{keepShorts:new t("keepShorts",!1),keptParams:new t("keptParams",["v","t","list","index"])}};function s(t){let e=null;if("youtu.be"===t.hostname)e=t.pathname.split("/").filter(Boolean)[0]??null;else if(t.hostname.endsWith("youtube.com")){const a=t.pathname.match(/^\/shorts\/([^/?]+)/);a&&(e=a[1])}return e}const n={en:{keepShortsOn:"Shorts in menu",keepShortsOff:"Shorts in default video player"},ru:{keepShortsOn:"Shorts в меню",keepShortsOff:"Shorts в окне обычных видео"}};const o=n[function(){const t=document.documentElement.lang?.split("-")[0];if(t&&n[t])return t;const e=navigator.language.split("-")[0];return n[e]?e:"en"}()];async function i(){await GM.unregisterMenuCommand(a.data.keepShorts.id)}async function r(){const t=await a.data.keepShorts.getValue()?o.keepShortsOn:o.keepShortsOff;await GM.registerMenuCommand(t,async()=>{await a.data.keepShorts.setValue(!await a.data.keepShorts.getValue())},{id:a.data.keepShorts.id})}function h(t){return s(t)||"/watch"===t.pathname}async function u(t){await GM.addValueChangeListener(a.data.keepShorts.id,async(e,a,s,n)=>{!n&&t.hostname.endsWith("youtube.com")&&t.pathname.startsWith("/shorts/")?location.reload():(await i(),await r())});const n=new URL("/watch","youtu.be"===t.hostname?"https://youtube.com":t.origin),o=s(t);o&&(await a.data.keepShorts.getValue()&&t.hostname.endsWith("youtube.com")&&t.pathname.startsWith("/shorts/")?n.pathname=`/shorts/${o}`:n.searchParams.set("v",o)),function(t,e,a){for(const s of a){const a=e.searchParams.get(s);e.searchParams.has(s)&&a&&t.searchParams.set(s,a)}}(n,t,await a.data.keptParams.getValue()),function(t){const e=t.searchParams.get("t");/^[0-9]*$/.test(e)&&t.searchParams.set("t",`${e}s`)}(n);const h=n.href!==t.href&&!sessionStorage.getItem(e);return h&&(sessionStorage.setItem(e,!0),location.assign(t.hostname.endsWith("youtube.com")?`${n.pathname}${n.search}`:n.href),setTimeout(()=>sessionStorage.removeItem(e),100)),h}(async()=>{i(),r()})();const c=new URL(location.href);h(c)&&u(c),null===window.onurlchange&&window.addEventListener("urlchange",async()=>{if(sessionStorage.getItem(e))return;const t=new URL(location.href);h(t)&&await u(t)}),window.addEventListener("click",async t=>{if(sessionStorage.getItem(e))return;const a=t.target?.closest("a[href]");if(!a)return;const s=new URL(a.getAttribute("href"));""===s.origin&&(s.origin="https://youtube.com"),h(s)&&(t.preventDefault(),await u(s))});