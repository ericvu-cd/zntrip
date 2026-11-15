'use strict';
function makeLoopBuffer(context,decoded,seconds){
  const n=Math.min(decoded.length,Math.round((seconds||decoded.duration)*decoded.sampleRate));
  const fade=Math.min(Math.round(decoded.sampleRate*.02),Math.floor(n/8));
  if(fade<2)return decoded;
  const result=context.createBuffer(decoded.numberOfChannels,n-fade,decoded.sampleRate);
  for(let ch=0;ch<decoded.numberOfChannels;ch++){
    const input=decoded.getChannelData(ch),output=result.getChannelData(ch);
    output.set(input.subarray(fade,n-fade));
    for(let i=0;i<fade;i++){
      const w=.5-.5*Math.cos(Math.PI*i/(fade-1));
      output[n-2*fade+i]=input[n-fade+i]*(1-w)+input[i]*w;
    }
  }
  return result;
}
if(typeof module!=='undefined'&&module.exports)module.exports={makeLoopBuffer};
if(typeof document!=='undefined')(()=>{
  const script=document.currentScript;
  const url=new URL('./assets/sunlight-loop.m4a',script.src).href;
  const toggle=document.getElementById('musicToggle'),label=document.getElementById('musicStatus'),slider=document.getElementById('musicVolume'),volumeLabel=document.getElementById('musicVolumeValue');
  let wanted=true,volume=.5,context=null,gain=null,source=null,buffer=null,loading=null,starting=null,error='',lastGain=-1,suspendTimer=null;
  try{const saved=JSON.parse(localStorage.getItem('zhunan-bgm-v1')||'null');if(saved){wanted=saved.enabled!==false;if(Number.isFinite(saved.volume))volume=Math.min(1,Math.max(0,saved.volume))}}catch(e){}
  slider.value=String(Math.round(volume*100));
  function remember(){try{localStorage.setItem('zhunan-bgm-v1',JSON.stringify({enabled:wanted,volume}))}catch(e){}}
  function playing(){return !!source&&!!context&&context.state==='running'&&wanted&&!document.hidden}
  function refresh(){const active=playing();toggle.setAttribute('aria-pressed',String(active));toggle.dataset.audioState=error?'error':loading?'loading':active?'playing':wanted?'ready':'muted';label.textContent=error?'點擊重試':loading?(wanted?'載入中…':'已關閉'):active?'播放中':wanted?'點擊播放':'已關閉';toggle.setAttribute('aria-label','背景音樂，'+label.textContent);volumeLabel.textContent=Math.round(volume*100)+'%';}
  function applyVolume(){if(!gain||!context)return;const isRhythm=!!document.getElementById('tapWave'),isTask=document.body.classList.contains('task-expanded');const target=wanted&&!document.hidden?volume*(isRhythm ? .35 : isTask ? .7 : 1):0;if(Math.abs(target-lastGain)<.0001)return;lastGain=target;gain.gain.cancelScheduledValues(context.currentTime);gain.gain.setTargetAtTime(target,context.currentTime,.25)}
  async function load(){if(buffer)return buffer;if(loading)return loading;loading=(async()=>{const response=await fetch(url,{cache:'force-cache'});if(!response.ok)throw Error('audio download failed');const decoded=await context.decodeAudioData(await response.arrayBuffer());buffer=makeLoopBuffer(context,decoded,156.5);return buffer})();refresh();try{return await loading}finally{loading=null;refresh()}}
  function removeUnlock(){document.removeEventListener('pointerdown',unlock,true);document.removeEventListener('keydown',unlock,true)}
  async function start(){if(starting)return starting;starting=(async()=>{error='';clearTimeout(suspendTimer);removeUnlock();const AudioCtx=window.AudioContext||window.webkitAudioContext;if(!AudioCtx)throw Error('unsupported');if(!context){try{context=new AudioCtx({latencyHint:'playback',sampleRate:32000})}catch(e){context=new AudioCtx()}gain=context.createGain();gain.gain.value=0;gain.connect(context.destination);context.addEventListener('statechange',refresh)}await context.resume();const audio=await load();if(!wanted||document.hidden){if(context.state==='running')await context.suspend();return}await context.resume();if(!source){source=context.createBufferSource();source.buffer=audio;source.loop=true;source.loopStart=0;source.loopEnd=audio.duration;source.connect(gain);source.start();toggle.dataset.loop='true'}lastGain=-1;applyVolume();refresh()})().catch(()=>{error='音樂暫時無法播放';refresh()}).finally(()=>{starting=null;refresh()});return starting}
  async function mute(){clearTimeout(suspendTimer);lastGain=-1;applyVolume();refresh();suspendTimer=setTimeout(async()=>{if(context&&context.state==='running'&&(!wanted||document.hidden))try{await context.suspend()}catch(e){}refresh()},180)}
  function unlock(e){if(e.target.closest&&e.target.closest('#musicToggle'))return;if(e.type==='keydown'&&!['Enter',' '].includes(e.key))return;if(!wanted){removeUnlock();return}start()}
  toggle.addEventListener('click',()=>{if(wanted&&(playing()||loading)){wanted=false;remember();mute()}else{wanted=true;remember();start()}});
  slider.addEventListener('input',()=>{volume=Number(slider.value)/100;remember();applyVolume();refresh()});
  document.addEventListener('pointerdown',unlock,true);document.addEventListener('keydown',unlock,true);
  document.addEventListener('visibilitychange',()=>{if(document.hidden)mute();else if(wanted&&context)start()});window.addEventListener('pagehide',()=>{if(context)mute()});window.addEventListener('pageshow',()=>{if(wanted&&context&&!document.hidden)start()});
  new MutationObserver(applyVolume).observe(document.body,{attributes:true,attributeFilter:['class']});new MutationObserver(applyVolume).observe(document.getElementById('game'),{childList:true,subtree:true});
  refresh();
})();
