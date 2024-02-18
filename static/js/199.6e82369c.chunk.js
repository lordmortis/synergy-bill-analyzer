(()=>{"use strict";let e=function(e){return e[e.unknown=0]="unknown",e[e.actual=1]="actual",e}({});const t=[{headerFields:["date","time","usage not yet billed","usage already billed","generation","meter reading status"],mapping:{date:e=>n(e[0]),time:e=>r(e[1]),kWhIn:e=>s(e[2])+s(e[3]),kWhOut:e=>parseFloat(e[4]),status:e=>a(e[5])}},{headerFields:["date","time","off peak","peak","super offpeak","meter reading status"],mapping:{date:e=>n(e[0]),time:e=>r(e[1]),kWhIn:e=>s(e[2])+s(e[3])+s(e[4]),kWhOut:e=>0,status:e=>a(e[5])}},{headerFields:["date","time","off peak(am)","super off peak","peak","off-peak","meter reading status"],mapping:{date:e=>n(e[0]),time:e=>r(e[1]),kWhIn:e=>s(e[2])+s(e[3])+s(e[4])+s(e[5]),kWhOut:e=>0,status:e=>a(e[6])}},{headerFields:["date","time","kwh","kw","kva","power factor","reading status"],mapping:{date:e=>n(e[0]),time:e=>r(e[1]),kWhIn:e=>s(e[2]),kWhOut:e=>0,status:e=>a(e[6])}}];function n(e){const t=e.split("/"),n=new Date;return n.setFullYear(parseInt(t[2],10),parseInt(t[1],10)-1,parseInt(t[0],10)),n.setHours(0,0,1,0),n}function r(e){const t=e.split(":");let n=parseInt(t[0],10);return"30"===t[1]&&(n+=.5),n}function a(t){return"actual"===t.toLowerCase()?e.actual:e.unknown}function s(e){const t=parseFloat(e);return Number.isFinite(t)?t:0}function u(e,t){for(let n=0;n<e.length;n++)if(t[n].toLowerCase()!==e[n])return!1;return!0}const l=10,o=13,i=100,c=new TextDecoder,p=[new class{constructor(){this.currentFileType=null}reset(){this.currentFileType=null}headerFound(e){for(const n of t)if(u(n.headerFields,e))return this.currentFileType=n,!0;return!1}processLine(e){if(null==this.currentFileType)return null;const t=this.currentFileType.mapping;return{date:t.date(e),time:t.time(e),kWhIn:t.kWhIn(e),kWhOut:t.kWhOut(e),readingStatus:t.status(e)}}}],d={busy:!1,currentFile:null};let f=function(e){return e[e.Unknown=0]="Unknown",e[e.ImportStart=1]="ImportStart",e[e.ImportEnd=2]="ImportEnd",e[e.NewRecords=3]="NewRecords",e[e.Error=4]="Error",e}({});function h(e,t){return{type:f.NewRecords,records:e,recordNumber:t}}function m(e){self.postMessage(e)}function k(e){var t;d.busy?m((t="Currently Busy",{type:f.Error,error:t})):(m({type:f.ImportStart}),d.busy=!0,d.currentFile=e.name,async function(e){const t=Array(0);let n=0,r=null,a=null,s=null,u=!0;for(;u;){let d=await e.read();if(d.done&&(u=!1),void 0===d.value)continue;const f=d.value;let k=0,y=0,g=!1;if(0!==f.length){for(;y<=f.length;){switch(f[y]){case o:g=!0;break;case l:let e;null!=r?(e=new Uint8Array(r.length+(g?y-1:y-k)),e.set(r,0),e.set(f.subarray(k,g?y-1:y),r.length),r=null):e=f.subarray(k,g?y-1:y),k<y&&(a=c.decode(e)),k=y+1,g=!1}if(y++,null==a)continue;a=a.replaceAll('"',""),a=a.toLowerCase();const e=a.split(",");if(a=null,null==s)for(const t of p)t.headerFound(e)&&(s=t);else{const n=s.processLine(e);null!=n&&t.push(n)}}k<y&&(r=f.subarray(k,y)),t.length<i||(m(h(t,n)),n+=t.length,t.splice(0))}}0!==t.length&&m(h(t,n))}(e.stream().getReader()).finally((()=>{d.busy=!1,m({type:f.ImportEnd}),d.currentFile=null})))}self.onmessage=e=>{"function"===typeof e.data.stream&&k(e.data)}})();
//# sourceMappingURL=199.6e82369c.chunk.js.map