const fs = require("node:fs");
const vm = require("node:vm");
const assert = require("node:assert/strict");
const html = fs.readFileSync("index.html", "utf8");
const code = html.match(/<script>([\s\S]*?)<\/script>/)[1];
const elements = new Map();
const element = id => {
  if (!elements.has(id)) elements.set(id, {value: "", disabled: false, textContent: "", innerHTML: "", classList: {add(){}, remove(){}}, addEventListener(){}, setAttribute(){}, play: async()=>{}, appendChild(){}});
  return elements.get(id);
};
let stopped = 0;
const track = {stop(){ stopped++; }, getCapabilities(){return {};}};
const stream = {getVideoTracks:()=>[track], getTracks:()=>[track]};
let failPlayback = false;
element("video").play = async()=>{if(failPlayback) throw new Error("playback failed");};
let request;
const context = vm.createContext({
 document: {getElementById:element, createElement:()=>element("created")},
 window: {isSecureContext:true, ZXing:true, addEventListener(){}},
 navigator: {mediaDevices:{getUserMedia:async()=>stream}},
 ZXing: {DecodeHintType:{}, BarcodeFormat:{}, BrowserMultiFormatReader:class {reset(){} decodeFromVideoElementContinuously(){}}},
 fetch:async(url, options)=>{request={url,options};return {ok:true,json:async()=>[{barcode:"001",name:"Example",price:5}]};},
 alert(){}, console, setTimeout, clearTimeout
});
(async()=>{
 vm.runInContext(code, context);
 await new Promise(resolve=>setImmediate(resolve));
 assert.equal(request.url,"./items.json");
 assert.equal(request.options.headers,undefined);
 vm.runInContext('handleCode("001")',context);
 assert.match(element("result").innerHTML,/Example/);
 failPlayback=true;
 await vm.runInContext("start()",context);
 assert.equal(stopped,1);
 assert.equal(element("video").srcObject,null);
 assert.equal(element("startBtn").disabled,false);
 failPlayback=false;
 await vm.runInContext("start()",context);
 assert.equal(element("startBtn").disabled,true);
 vm.runInContext("stop()",context);
 assert.equal(stopped,2);
 assert.equal(element("video").srcObject,null);
 assert.match(html,/https:\/\/github.com\/2handzxd\/workplace-price-scanner\/edit\/main\/items.json/);
 assert.doesNotMatch(html,/saveUnknown|URL.createObjectURL|exportBtn/);
 console.log("Passed: public load, lookup, camera cleanup, stop, GitHub editing workflow");
})().catch(error=>{console.error(error);process.exitCode=1;});
