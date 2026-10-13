const fs=require("node:fs"),vm=require("node:vm"),assert=require("node:assert/strict");
const core=require("../catalog-draft.js");
const html=fs.readFileSync("index.html","utf8");
const code=html.match(/<script>([\s\S]*?)<\/script>/)[1];
core.merge(JSON.parse(fs.readFileSync("items.json","utf8")), []);
const product=(barcode,name="Product")=>({barcode,name,price:2,department:"",location:"",note:""});
assert.equal(core.validate(product("001")).barcode,"001");
assert.throws(()=>core.validate({...product("1"),price:-1}),/Price/);
assert.throws(()=>core.validate({...product("1"),price:NaN}),/Price/);
assert.throws(()=>core.validate({...product("1"),name:""}),/name/);
const many=Array.from({length:500},(_,i)=>product(String(i).padStart(6,"0")));
assert.equal(core.merge([product("existing")],many).length,501);
assert.throws(()=>core.merge([product("001","Published")],[product("001","Draft")]),/different details/);
assert.equal(core.merge([product("001")],[product("001")]).length,1);
assert.throws(()=>core.merge([product("1"),product("1")],[]),/Duplicate/);
const storage=new Map(), elements=new Map();
function el(id){
 if(!elements.has(id)) elements.set(id,{
  value:"",textContent:"",innerHTML:"",disabled:false,checked:false,options:[],events:{},children:[],
  classList:{add(){},remove(){}},focus(){},setAttribute(){},click(){},remove(){},
  addEventListener(type,fn){this.events[type]=fn;},appendChild(child){this.children.push(child);},
  play:async()=>{}
 });
 return elements.get(id);
}
let stopped=0,failPlayback=false,failDecode=false,failConstraint=false,callback;
let resolveCamera=null,delayCamera=false;
const requests=[];
const stream={getTracks:()=>[{stop(){stopped++;}}],getVideoTracks:()=>[{getCapabilities:()=>({focusMode:["continuous"]}),getSettings:()=>({deviceId:"webcam"})}]};
el("video").play=async()=>{if(failPlayback) throw new Error("playback failed");};
const context=vm.createContext({
 CatalogDraft:core,localStorage:{getItem:key=>storage.get(key)||null,setItem:(key,value)=>storage.set(key,value)},
 document:{hidden:false,body:el("body"),getElementById:el,createElement:()=>el("created-"+Math.random()),addEventListener(){}},
 window:{isSecureContext:true,ZXing:true,addEventListener(){}},
 navigator:{mediaDevices:{
  getUserMedia:async constraints=>{
   requests.push(constraints);
   if(failConstraint){failConstraint=false;throw Object.assign(new Error("constraints"),{name:"OverconstrainedError"});}
   if(delayCamera) return new Promise(resolve=>{resolveCamera=resolve;});
   return stream;
  },
  enumerateDevices:async()=>[{kind:"videoinput",deviceId:"webcam",label:"Laptop webcam"}]
 }},
 ZXing:{DecodeHintType:{},BarcodeFormat:{},BrowserMultiFormatReader:class{
  reset(){} async decodeFromVideoElementContinuously(video,cb){if(failDecode)throw new Error("decoder failed");callback=cb;}
 }},
 fetch:async()=>({ok:true,json:async()=>[product("published")]}),
 URL:{createObjectURL:()=> "blob:test",revokeObjectURL(){}},Blob,
 alert(){},confirm:()=>true,console,setTimeout:(fn,ms)=>{if(ms<30000)return setTimeout(fn,ms);},clearTimeout
});
const tick=()=>new Promise(resolve=>setImmediate(resolve));
(async()=>{
 vm.runInContext(code,context);await tick();
 assert.equal(el("saveDraft").disabled,false);
 // Scan capture cannot overwrite details while entering a product.
 el("batchMode").checked=true;
 vm.runInContext('handleCode("000123")',context);
 assert.equal(el("draftBarcode").value,"000123");
 vm.runInContext('handleCode("999999")',context);
 assert.equal(el("draftBarcode").value,"000123");
 el("draftName").value="First";el("draftPrice").value="4.50";
 el("productForm").events.submit({preventDefault(){}});
 let saved=JSON.parse(storage.get("workplace-scanner-drafts-v1"));
 assert.equal(saved.length,1);assert.equal(saved[0].barcode,"000123");assert.equal(saved[0].price,4.5);
 vm.runInContext('handleCode("000124")',context);
 el("draftName").value="Second";el("draftPrice").value="";
 el("productForm").events.submit({preventDefault(){}});
 assert.match(el("draftStatus").textContent,/Price is required/);
 assert.equal(JSON.parse(storage.get("workplace-scanner-drafts-v1")).length,1);
 el("draftPrice").value="-1";el("productForm").events.submit({preventDefault(){}});
 assert.match(el("draftStatus").textContent,/non-negative/);
 // Restored drafts, catalog downloads, and import conflict protection.
 await el("downloadCatalog").onclick();
 assert.match(el("draftStatus").textContent,/Downloaded 2 products/);
 await el("importDrafts").events.change({target:{files:[{size:100,text:async()=>JSON.stringify([product("000123","Conflicting")])}],value:""}});
 assert.match(el("draftStatus").textContent,/Restore failed/);
 assert.equal(JSON.parse(storage.get("workplace-scanner-drafts-v1"))[0].name,"First");
 // Camera errors clean up and async decoder errors are caught.
 failPlayback=true;await vm.runInContext("start()",context);
 assert.equal(stopped,1);assert.equal(el("video").srcObject,null);
 failPlayback=false;failDecode=true;await vm.runInContext("start()",context);
 assert.equal(stopped,2);failDecode=false;
 failConstraint=true;await vm.runInContext("start()",context);
 assert.equal(requests.at(-1).video,true);
 assert.equal(el("video").playsInline,true);assert.equal(el("video").muted,true);
 vm.runInContext("stop()",context);
 el("cameraSelect").value="device:webcam";
 await vm.runInContext("start()",context);
 assert.equal(requests.at(-1).video.deviceId.exact,"webcam");
 vm.runInContext("stop()",context);
 // Permission resolution after cancellation must not leave camera running.
 delayCamera=true;
 const pending=vm.runInContext("start()",context);
 vm.runInContext("stop()",context);
 const before=stopped;resolveCamera(stream);await pending;
 assert.equal(stopped,before+1);
 assert.equal(el("video").srcObject,null);
 assert.match(html,/\/upload\/main/);
 console.log("Passed: 500-product merge, validation, duplicate protection, locked scan entry, persistent drafts, export/import, Safari video flags, device selection, fallback, failure cleanup, canceled camera request");
})().catch(error=>{console.error(error);process.exitCode=1;});
