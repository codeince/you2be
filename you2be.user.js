// ==UserScript==
// @name YouTube Fastener
// @name:ru YouTube Ускоритель
// @description Surf YouTube faster
// @description:ru Гоняй быстрее по YouTube
// @namespace https://github.com/codeince/you2be
// @author Code Slasher Incorporation
// @version 1.2.1
// @downloadURL https://raw.githubusercontent.com/codeince/you2be/main/you2be.user.js
// @updateURL https://raw.githubusercontent.com/codeince/you2be/main/you2be.user.js
// @icon https://raw.githubusercontent.com/codeince/you2be/main/icon.png
// @match http*://youtu.be/*
// @match http*://youtube.com/*
// @match http*://m.youtube.com/*
// @match http*://www.youtube.com/*
// @grant GM.addValueChangeListener
// @grant GM.getValue
// @grant GM.setClipboard
// @grant GM.setValue
// @grant GM.registerMenuCommand
// @grant GM.unregisterMenuCommand
// @grant window.onurlchange
// @run-at document-start
// ==/UserScript==
class e{id;default;constructor(e,t){this.id=e,this.default=t}async getValue(){let e=await GM.getValue(this.id,this.default);return typeof e!=typeof this.default&&(e=this.default,await this.setValue(this.default),alert(`You setted ${this.id} to different value type\nValue meant to be like ${this.default}`)),e}async setValue(e){typeof e==typeof this.default?await GM.setValue(this.id,e):alert(`You setted ${this.id} to different value type\nValue meant to be like ${this.default}`)}}let t=null;const a={id:"ytf",data:{keepShorts:new e("keepShorts",!1),keptParams:new e("keptParams",{v:[],t:[],list:[],index:["start_radio"]}),shareKeptParams:new e("shareKeptParams",{v:[]})}};function s(e){let t=null;if("youtu.be"===e.hostname)t=e.pathname.split("/").filter(Boolean)[0]??null;else if(e.hostname.endsWith("youtube.com")){const a=e.pathname.match(/^\/shorts\/([^/?]+)/);a&&(t=a[1])}return t}const n={en:{keepShortsOn:"Shorts in menu",keepShortsOff:"Shorts in default video player",share:"Share"},ru:{keepShortsOn:"Shorts в меню",keepShortsOff:"Shorts в окне обычных видео",share:"Поделиться"}};const r=n[function(){const e=document.documentElement.lang?.split("-")[0];if(e&&n[e])return e;const t=navigator.language.split("-")[0];return n[t]?t:"en"}()];async function o(){await GM.unregisterMenuCommand(a.data.keepShorts.id),await GM.unregisterMenuCommand("share")}async function i(){const e=await a.data.keepShorts.getValue()?r.keepShortsOn:r.keepShortsOff;await GM.registerMenuCommand(e,async()=>{await a.data.keepShorts.setValue(!await a.data.keepShorts.getValue())},{id:a.data.keepShorts.id}),await GM.registerMenuCommand(r.share,async()=>{const e=t??new URL(location.href);t=null,await h(e,await a.data.shareKeptParams.getValue(),async e=>await GM.setClipboard(e.href,"text"))},{id:"share"})}function d(e){return s(e)||"/watch"===e.pathname}async function h(e,t,n){await GM.addValueChangeListener(a.data.keepShorts.id,async(t,a,s,n)=>{!n&&e.hostname.endsWith("youtube.com")&&e.pathname.startsWith("/shorts/")?location.reload():(await o(),await i())});const r=new URL("/watch","youtu.be"===e.hostname?"https://youtube.com":e.origin),d=s(e);if(d&&(await a.data.keepShorts.getValue()&&e.hostname.endsWith("youtube.com")&&e.pathname.startsWith("/shorts/")?r.pathname=`/shorts/${d}`:r.searchParams.set("v",d)),function(e,t,a){for(const[s,n]of Object.entries(a)){let a=t.searchParams.get(s);for(const e of n){if(a)break;a=t.searchParams.get(e)}a&&e.searchParams.set(s,a)}}(r,e,t),function(e){const t=e.searchParams.get("t");/^[0-9]*$/.test(t)&&e.searchParams.set("t",`${t}s`)}(r),"function"==typeof n)return await n(r),!1;const h=r.href!==e.href;return h&&(sessionStorage.setItem(`${a.id}:redirected`,"1"),location.assign(e.hostname.endsWith("youtube.com")?`${r.pathname}${r.search}`:r.href),window.addEventListener("load",()=>sessionStorage.removeItem(`${a.id}:redirected`),{once:!0})),h}const u=new URL(location.href);(async()=>{o(),i(),sessionStorage.getItem(`${a.id}:redirected`)?window.addEventListener("load",()=>sessionStorage.removeItem(`${a.id}:redirected`),{once:!0}):d(u)&&await h(u,await a.data.keptParams.getValue())})(),"onurlchange"in window&&window.addEventListener("urlchange",async()=>{if(sessionStorage.getItem(`${a.id}:redirected`))return;const e=new URL(location.href);d(e)&&await h(e,await a.data.keptParams.getValue())}),window.addEventListener("click",async e=>{if(sessionStorage.getItem(`${a.id}:redirected`))return;const t=e.target?.closest("a[href]");if(!t)return;const s=new URL(t.getAttribute("href"),location.origin);d(s)&&(e.preventDefault(),await h(s,await a.data.keptParams.getValue()))}),window.addEventListener("contextmenu",e=>{const a=e.target?.closest("a[href]");if(!a)return;let s=new URL(a.getAttribute("href"),location.origin);d(s)&&(t=s,document.body.addEventListener("click",()=>{t=null},{once:!0}))},!0);