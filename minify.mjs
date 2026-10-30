import{readFile as t,writeFile as a}from"node:fs/promises";import{minify as i}from"terser";const r=await t("src.js","utf8"),s=r.match(/^\/\/ ==UserScript==[\s\S]*?^\/\/ ==\/UserScript==\s*/m);if(!s)throw new Error("UserScript wasn't found");const m=await i(r,{compress:!0,mangle:!0,toplevel:!0,keep_fnames:!1,keep_classnames:!1,format:{preamble:s[0].trimEnd().split(`
`).map(e=>{for(;e.includes("  ");)e=e.replaceAll("  "," ");return e}).join(`
`),comments:!1}});await a("you2be.user.js",m.code);
