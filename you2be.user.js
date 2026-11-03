// ==UserScript==
// @name YouTube Fastener
// @name:ru YouTube Ускоритель
// @description Surf YouTube faster
// @description:ru Гоняй быстрее по YouTube
// @namespace https://github.com/codeince/you2be
// @author Code Slasher Incorporation
// @version 1.2.0
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
class t{id;default;constructor(t,e){this.id=t,this.default=e}async getValue(){let t=await GM.getValue(this.id,this.default);return typeof t!=typeof this.default&&(t=this.default,await this.setValue(this.default),alert(`You setted ${this.id} to different value type\nValue meant to be like ${this.default}`)),t}async setValue(t){typeof t==typeof this.default?await GM.setValue(this.id,t):alert(`You setted ${this.id} to different value type\nValue meant to be like ${this.default}`)}}let e=null;const a="ytf:clean",s={id:"settings",data:{keepShorts:new t("keepShorts",!1),keptParams:new t("keptParams",{v:[],t:[],list:[],index:["start_radio"]}),shareKeptParams:new t("shareKeptParams",{v:[]})}};function n(t){let e=null;if("youtu.be"===t.hostname)e=t.pathname.split("/").filter(Boolean)[0]??null;else if(t.hostname.endsWith("youtube.com")){const a=t.pathname.match(/^\/shorts\/([^/?]+)/);a&&(e=a[1])}return e}const o={en:{keepShortsOn:"Shorts in menu",keepShortsOff:"Shorts in default video player",share:"Share"},ru:{keepShortsOn:"Shorts в меню",keepShortsOff:"Shorts в окне обычных видео",share:"Поделиться"}};const r=o[function(){const t=document.documentElement.lang?.split("-")[0];if(t&&o[t])return t;const e=navigator.language.split("-")[0];return o[e]?e:"en"}()];async function i(){await GM.unregisterMenuCommand(s.data.keepShorts.id),await GM.unregisterMenuCommand("share")}async function h(){const t=await s.data.keepShorts.getValue()?r.keepShortsOn:r.keepShortsOff;await GM.registerMenuCommand(t,async()=>{await s.data.keepShorts.setValue(!await s.data.keepShorts.getValue())},{id:s.data.keepShorts.id}),await GM.registerMenuCommand(r.share,async()=>{const t=e??new URL(location.href);e=null,await c(t,await s.data.shareKeptParams.getValue(),async t=>await GM.setClipboard(t.href,"text"))},{id:"share"})}function u(t){return n(t)||"/watch"===t.pathname}async function c(t,e,o){await GM.addValueChangeListener(s.data.keepShorts.id,async(e,a,s,n)=>{!n&&t.hostname.endsWith("youtube.com")&&t.pathname.startsWith("/shorts/")?location.reload():(await i(),await h())});const r=new URL("/watch","youtu.be"===t.hostname?"https://youtube.com":t.origin),u=n(t);if(u&&(await s.data.keepShorts.getValue()&&t.hostname.endsWith("youtube.com")&&t.pathname.startsWith("/shorts/")?r.pathname=`/shorts/${u}`:r.searchParams.set("v",u)),function(t,e,a){for(const[s,n]of Object.entries(a)){let a=e.searchParams.get(s);for(const t of n){if(a)break;a=e.searchParams.get(t)}a&&t.searchParams.set(s,a)}}(r,t,e),function(t){const e=t.searchParams.get("t");/^[0-9]*$/.test(e)&&t.searchParams.set("t",`${e}s`)}(r),"function"==typeof o)return await o(r),!1;const c=r.href!==t.href&&!sessionStorage.getItem(a);return c&&(sessionStorage.setItem(a,"1"),location.assign(t.hostname.endsWith("youtube.com")?`${r.pathname}${r.search}`:r.href),setTimeout(()=>sessionStorage.removeItem(a),100)),c}(async()=>{i(),h()})(),sessionStorage.removeItem(a);const l=new URL(location.href);(async()=>{u(l)&&await c(l,await s.data.keptParams.getValue())})(),"onurlchange"in window&&window.addEventListener("urlchange",async()=>{if(sessionStorage.getItem(a))return;const t=new URL(location.href);u(t)&&await c(t,await s.data.keptParams.getValue())}),window.addEventListener("click",async t=>{if(sessionStorage.getItem(a))return;const e=t.target?.closest("a[href]");if(!e)return;const n=new URL(e.getAttribute("href"),location.origin);u(n)&&(t.preventDefault(),await c(n,await s.data.keptParams.getValue()))}),window.addEventListener("contextmenu",t=>{const a=t.target?.closest("a[href]");if(!a)return;let s=new URL(a.getAttribute("href"),location.origin);u(s)&&(e=s,document.body.addEventListener("click",()=>{e=null},{once:!0}))},!0);