import {FaceRig} from './face.js';
const base=new URL(document.querySelector('meta[name="asset-base"]').content,document.baseURI);
const canvas=document.querySelector('canvas'),ctx=canvas.getContext('2d',{alpha:false});
const status=document.querySelector('#status'),play=document.querySelector('#play'),voice=document.querySelector('#voice'),audio=document.querySelector('audio');
const cache=new Map(),pending=new Map();
let m,face,lips,index=0,pos=0,dir=1,playing=true,last=0,token=0;
const path=p=>new URL(p,base).href;
audio.src=path('audio/eunsol-dialogue.wav');audio.playbackRate=1;
function load(i){if(cache.has(i))return Promise.resolve(cache.get(i));if(pending.has(i))return pending.get(i);const p=new Promise((yes,no)=>{const im=new Image();im.onload=()=>{pending.delete(i);cache.set(i,im);yes(im)};im.onerror=()=>{pending.delete(i);no(new Error('이미지를 불러오지 못했습니다. 새로고침해 주세요.'))};im.src=path(m.frames[i])});pending.set(i,p);return p;}
function warm(i){for(let n=1;n<=18;n++){const j=Math.max(0,Math.min(m.count-1,i+n*dir));load(j).catch(error)}for(const k of cache.keys())if(cache.size>48&&k!==i&&Math.abs(k-i)>24)cache.delete(k);}
function error(e){playing=false;status.hidden=false;status.textContent=e.message;console.error(e)}
function frame(now){const dt=last?Math.min(.08,Math.max(0,(now-last)/1000)):0;last=now;
 if(playing){let target=pos+dt*m.fps*2*dir;if(target>m.count-1||target<0){dir=-dir;target=target<0?-target:2*(m.count-1)-target;}const i=Math.max(0,Math.min(m.count-1,Math.floor(target)));if(cache.has(i)){pos=target;if(i!==index){index=i;warm(i)}}else{const id=++token;load(i).then(()=>{if(id===token&&playing){pos=target;index=i;warm(i)}}).catch(error)}}
 const im=cache.get(index);if(im){ctx.drawImage(im,0,0);let v=null;if(!audio.paused&&!audio.ended)v=lips.samples[Math.min(lips.samples.length-1,Math.floor(audio.currentTime*lips.fps))];face.render(ctx,index,now,v);canvas.dataset.frame=index;}
 requestAnimationFrame(frame);
}
play.onclick=()=>{playing=!playing;token++;play.textContent=playing?'정지':'재생'};
voice.onclick=()=>{if(!audio.paused){audio.pause();audio.currentTime=0;voice.textContent='대사 듣기';return}audio.currentTime=0;audio.playbackRate=1;audio.play().then(()=>voice.textContent='대사 멈추기').catch(()=>voice.textContent='다시 눌러주세요')};
audio.onended=()=>voice.textContent='대사 다시 듣기';
try{[m,face,lips]=await Promise.all([fetch(path('manifest.json')).then(r=>r.json()),FaceRig.load(path('face/')),fetch(path('audio/lipsync.json')).then(r=>r.json())]);canvas.width=m.width;canvas.height=m.height;face.state.autoBlink=true;await Promise.all(Array.from({length:Math.min(19,m.count)},(_,i)=>load(i)));status.hidden=true;play.disabled=false;voice.disabled=false;warm(0);window.m013Viewer={get state(){return{index,dir,playing,audioTime:audio.currentTime,audioRate:audio.playbackRate,sourceRate:2}},face};requestAnimationFrame(frame)}catch(e){error(e)}
