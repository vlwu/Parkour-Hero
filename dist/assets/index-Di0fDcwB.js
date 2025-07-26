(function(){const t=document.createElement("link").relList;if(t&&t.supports&&t.supports("modulepreload"))return;for(const s of document.querySelectorAll('link[rel="modulepreload"]'))i(s);new MutationObserver(s=>{for(const n of s)if(n.type==="childList")for(const a of n.addedNodes)a.tagName==="LINK"&&a.rel==="modulepreload"&&i(a)}).observe(document,{childList:!0,subtree:!0});function e(s){const n={};return s.integrity&&(n.integrity=s.integrity),s.referrerPolicy&&(n.referrerPolicy=s.referrerPolicy),s.crossOrigin==="use-credentials"?n.credentials="include":s.crossOrigin==="anonymous"?n.credentials="omit":n.credentials="same-origin",n}function i(s){if(s.ep)return;s.ep=!0;const n=e(s);fetch(s.href,n)}})();class w{constructor(t=0,e=0){this.x=t,this.y=e}}class _{constructor({type:t="dynamic",solid:e=!1,hazard:i=!1,width:s,height:n,isGrounded:a=!1,isAgainstWall:o=!1,groundType:r=null}){this.type=t,this.solid=e,this.hazard=i,this.width=s,this.height=n,this.isGrounded=a,this.isAgainstWall=o,this.groundType=r}}class Te{constructor(t,e){this.zoom=1.8,this.viewportWidth=t,this.viewportHeight=e,this.width=this.viewportWidth/this.zoom,this.height=this.viewportHeight/this.zoom,this.levelWidth=this.width,this.levelHeight=this.height,this.followSpeed=5,this.deadZone={x:this.width*.2,y:this.height*.2},this.minX=0,this.maxX=0,this.minY=0,this.maxY=0,this.shakeTimer=0,this.shakeIntensity=0,this.shakeInitialIntensity=0,this.shakeDuration=0,this.shakeX=0,this.shakeY=0,this.targetX=0,this.targetY=0,this.projectionMatrix=new Float32Array(16),console.log("Camera initialized:",{viewport:`${this.viewportWidth}x${this.viewportHeight}`,zoom:this.zoom,worldView:`${this.width}x${this.height}`})}update(t,e,i){if(e===null)return;const s=t.getComponent(e,w),n=t.getComponent(e,_);if(!s||!n)return;const a=this.x+this.width/2,o=this.y+this.height/2,r=s.x+n.width/2,l=s.y+n.height/2,d=r-a,u=l-o;let p=0,m=0;Math.abs(d)>this.deadZone.x&&(p=d>0?d-this.deadZone.x:d+this.deadZone.x),Math.abs(u)>this.deadZone.y&&(m=u>0?u-this.deadZone.y:u+this.deadZone.y),this.targetX=this.x+p,this.targetY=this.y+m,this.x+=(this.targetX-this.x)*this.followSpeed*i,this.y+=(this.targetY-this.y)*this.followSpeed*i,this.x=Math.max(this.minX,Math.min(this.maxX,this.x)),this.y=Math.max(this.minY,Math.min(this.maxY,this.y)),i>0?this.updateShake(i):(this.shakeX=0,this.shakeY=0)}updateShake(t){if(this.shakeTimer>0){this.shakeTimer-=t,this.shakeX=(Math.random()-.5)*this.shakeIntensity,this.shakeY=(Math.random()-.5)*this.shakeIntensity;const e=this.shakeInitialIntensity/this.shakeDuration;this.shakeIntensity=Math.max(0,this.shakeIntensity-e*t),this.shakeTimer<=0&&(this.shakeX=0,this.shakeY=0,this.shakeIntensity=0)}}shake(t=10,e=.3){this.shakeTimer=e,this.shakeDuration=e,this.shakeIntensity=t,this.shakeInitialIntensity=t}apply(t){t.save(),t.scale(this.zoom,this.zoom),t.translate(-Math.round(this.x+this.shakeX),-Math.round(this.y+this.shakeY))}restore(t){t.restore()}snapToPlayer(t,e){if(e===null)return;const i=t.getComponent(e,w),s=t.getComponent(e,_);!i||!s||this.centerOn(i.x+s.width/2,i.y+s.height/2)}centerOn(t,e){this.x=t-this.width/2,this.y=e-this.height/2,this.x=Math.max(this.minX,Math.min(this.maxX,this.x)),this.y=Math.max(this.minY,Math.min(this.maxY,this.y)),this.targetX=this.x,this.targetY=this.y}getViewportBounds(){return{x:this.x-32,y:this.y-32,width:this.width+64,height:this.height+64}}updateLevelBounds(t,e){this.levelWidth=t,this.levelHeight=e,this.maxX=Math.max(0,this.levelWidth-this.width),this.maxY=Math.max(0,this.levelHeight-this.height),this.x=Math.max(this.minX,Math.min(this.maxX,this.x)),this.y=Math.max(this.minY,Math.min(this.maxY,this.y))}getProjectionMatrix(){const t=this.x+this.shakeX,e=this.x+this.shakeX+this.width,i=this.y+this.shakeY,s=this.y+this.shakeY+this.height,n=1/(t-e),a=1/(s-i),o=1/-2;return this.projectionMatrix[0]=-2*n,this.projectionMatrix[1]=0,this.projectionMatrix[2]=0,this.projectionMatrix[3]=0,this.projectionMatrix[4]=0,this.projectionMatrix[5]=-2*a,this.projectionMatrix[6]=0,this.projectionMatrix[7]=0,this.projectionMatrix[8]=0,this.projectionMatrix[9]=0,this.projectionMatrix[10]=2*o,this.projectionMatrix[11]=0,this.projectionMatrix[12]=(t+e)*n,this.projectionMatrix[13]=(i+s)*a,this.projectionMatrix[14]=0*o,this.projectionMatrix[15]=1,this.projectionMatrix}isVisible(t,e,i=0,s=0){return t+i>this.x&&t<this.x+this.width&&e+s>this.y&&e<this.y+this.height}isRectVisible(t){return this.isVisible(t.x,t.y,t.width,t.height)}setFollowSpeed(t){this.followSpeed=Math.max(.1,t)}setDeadZone(t,e){this.deadZone.x=this.width*Math.max(0,Math.min(.5,t)),this.deadZone.y=this.height*Math.max(0,Math.min(.5,e))}}class Ae{constructor(){this.events={}}subscribe(t,e){this.events[t]||(this.events[t]=new Set),this.events[t].add(e)}unsubscribe(t,e){this.events[t]&&this.events[t].delete(e)}publish(t,e){this.events[t]&&this.events[t].forEach(i=>{try{i(e)}catch(s){console.error(`Error in event bus callback for event: ${t}`,s)}})}}const c=new Ae;class Ee{constructor(){this.sounds={},this.soundPool={},this.poolSize=5,this.channels={SFX:new Set,UI:new Set,Music:new Set},this.audioContext=null,this.audioUnlocked=!1,this.settings={enabled:!0,volume:.5},this.loadSettings(),this._setupEventSubscriptions(),this._addInteractionListenerForAudioUnlock()}_addInteractionListenerForAudioUnlock(){const t=async()=>{await this.unlockAudio(),this.audioUnlocked&&(window.removeEventListener("click",t),window.removeEventListener("keydown",t),window.removeEventListener("touchstart",t))};window.addEventListener("click",t),window.addEventListener("keydown",t),window.addEventListener("touchstart",t)}_setupEventSubscriptions(){c.subscribe("playSound",t=>this.play(t)),c.subscribe("startSoundLoop",t=>this.playLoop(t)),c.subscribe("stopSoundLoop",({key:t})=>this.stopLoop(t)),c.subscribe("toggleSound",()=>this.toggleSound()),c.subscribe("setSoundVolume",({volume:t})=>this.setVolume(t))}loadSettings(){this.settings.enabled=!0,this.settings.volume=.5}saveSettings(){}loadSounds(t){["button_click","jump","double_jump","collect","level_complete","trophy_activated","death_sound","dash","checkpoint_activated","hit","enemy_stomp","sand_walk","mud_run","ice_run","trampoline_bounce","fire_activated","arrow_pop","fan_blowing","rh_slam","sh_slam","snail_wall_hit"].forEach(i=>{if(t[i]){this.sounds[i]=t[i],this.soundPool[i]=[];for(let s=0;s<this.poolSize;s++)this.soundPool[i].push(this.sounds[i].cloneNode(!0))}else console.warn(`Sound asset ${i} not found in assets`)})}async play({key:t,volumeMultiplier:e=1,channel:i="SFX"}){if(!this.settings.enabled||!this.sounds[t]||!this.channels[i])return;this.audioUnlocked||await this.unlockAudio();const s=this.soundPool[t];if(!s){console.warn(`Sound pool for ${t} not found.`);return}const n=s.find(a=>a.paused||a.ended);if(n){n.volume=Math.max(0,Math.min(1,this.settings.volume*e)),n.currentTime=0,this.channels[i].add(n),n.onended=()=>{this.channels[i].delete(n),n.onended=null};try{await n.play()}catch(a){a.name!=="AbortError"&&console.error(`Audio pool play failed for ${t}:`,a),this.channels[i].delete(n)}}else console.warn(`Sound pool for ${t} was depleted. No sound played.`)}async playLoop({key:t,volumeMultiplier:e=1,channel:i="SFX"}){if(!(!this.settings.enabled||!this.sounds[t]||!this.channels[i])&&!Array.from(this.channels[i]).some(s=>s.src===this.sounds[t].src)){this.audioUnlocked||await this.unlockAudio();try{const s=this.sounds[t].cloneNode(!0);s.volume=Math.max(0,Math.min(1,this.settings.volume*e)),s.loop=!0,await s.play(),this.channels[i].add(s)}catch(s){console.error(`Failed to play looping sound ${t}:`,s)}}}stopLoop(t){const e=this.sounds[t]?.src;if(e)for(const i in this.channels)this.channels[i].forEach(s=>{s.src===e&&s.loop&&(s.pause(),s.currentTime=0,this.channels[i].delete(s))})}stopAll({except:t=[]}={}){for(const e in this.channels)t.includes(e)||(this.channels[e].forEach(i=>{i.pause(),i.currentTime=0}),this.channels[e].clear())}async unlockAudio(){if(!this.audioUnlocked){if(!this.audioContext)try{const t=window.AudioContext||window.webkitAudioContext;t&&(this.audioContext=new t)}catch(t){console.error("Failed to create AudioContext",t);return}this.audioContext&&(this.audioContext.state==="suspended"&&await this.audioContext.resume().catch(t=>console.error("Failed to resume AudioContext",t)),this.audioContext.state==="running"&&(this.audioUnlocked=!0))}}setVolume(t){this.settings.volume=Math.max(0,Math.min(1,t));for(const e in this.channels)this.channels[e].forEach(i=>{i.volume=this.settings.volume});this.saveSettings(),c.publish("soundSettingsChanged",{soundEnabled:this.settings.enabled,soundVolume:this.settings.volume})}setEnabled(t){this.settings.enabled=t,this.settings.enabled||this.stopAll(),this.saveSettings(),c.publish("soundSettingsChanged",{soundEnabled:this.settings.enabled,soundVolume:this.settings.volume})}toggleSound(){return this.setEnabled(!this.settings.enabled),this.settings.enabled}getSettings(){return{soundEnabled:this.settings.enabled,soundVolume:this.settings.volume,audioUnlocked:this.audioUnlocked}}}class Ie{constructor(t,e){this.canvas=t,this.fontRenderer=e,this.isVisible=!0,this.stats={levelName:"Loading...",collectedFruits:0,totalFruits:0,deathCount:0,soundEnabled:!0,soundVolume:.5,health:100,maxHealth:100},this.fps=0,this.frameCount=0,this.elapsedTime=0,c.subscribe("statsUpdated",i=>this.updateStats(i))}setVisible(t){this.isVisible=t}updateStats(t){this.stats={...this.stats,...t}}drawGameHUD(t,e){if(!(!this.isVisible||!this.fontRenderer)){this.frameCount++,this.elapsedTime+=e,this.elapsedTime>=1&&(this.fps=this.frameCount,this.frameCount=0,this.elapsedTime-=1);try{t.save(),t.setTransform(1,0,0,1,0,0);const{levelName:i,collectedFruits:s,totalFruits:n,deathCount:a,soundEnabled:o,soundVolume:r,health:l,maxHealth:d}=this.stats,u=[`${i}`,`Fruits: ${s}/${n}`,`Deaths: ${a||0}`,`Sound: ${o?"On":"Off"} (${Math.round(r*100)}%)`],p={scale:2.5,align:"center",color:"white",outlineColor:"black",outlineWidth:1};let m=0;u.forEach(At=>{const bt=this.fontRenderer.getTextWidth(At,p.scale);bt>m&&(m=bt)});const A=40,f=10,M=10,T=m+A,O=180;t.fillStyle="rgba(0, 0, 0, 0.5)",t.beginPath(),t.roundRect(f,M,T,O,10),t.fill();const D=35,nt=M+25,Ct=f+T/2;u.forEach((At,bt)=>{const Ce=nt+bt*D;this.fontRenderer.drawText(t,At,Ct,Ce,p)});const J=150,X=20,at=f+T+15,ot=M;t.fillStyle="rgba(0, 0, 0, 0.7)",t.fillRect(at-2,ot-2,J+4,X+4),t.fillStyle="#333",t.fillRect(at,ot,J,X);const Tt=(l||0)/(d||100),xe=J*Tt;Tt>.6?t.fillStyle="#4CAF50":Tt>.3?t.fillStyle="#FFC107":t.fillStyle="#F44336",t.fillRect(at,ot,xe,X),this.fontRenderer.drawText(t,"HP",at+J+10,ot+X/2-12,{scale:2,align:"left"});const Se=`FPS: ${this.fps}`,_e={scale:2,align:"left",color:"white",outlineColor:"black",outlineWidth:1},we=at,ke=ot+X+10;this.fontRenderer.drawText(t,Se,we,ke,_e),t.restore()}catch(i){console.warn("Error drawing HUD:",i)}}}}const ct={PinkMan:{name:"Pink Man",unlockRequirement:0},NinjaFrog:{name:"Ninja Frog",unlockRequirement:10},MaskDude:{name:"Mask Dude",unlockRequirement:20},VirtualGuy:{name:"Virtual Guy",unlockRequirement:30}},F=[{name:"Mechanical Mastery",levels:[{name:"Level 1",jsonPath:"/levels/mechanical-mastery/01.json"},{name:"Level 2",jsonPath:"/levels/mechanical-mastery/02.json"},{name:"Level 3",jsonPath:"/levels/mechanical-mastery/03.json"},{name:"Level 4",jsonPath:"/levels/mechanical-mastery/04.json"},{name:"Level 5",jsonPath:"/levels/mechanical-mastery/05.json"},{name:"Level 6",jsonPath:"/levels/mechanical-mastery/06.json"},{name:"Level 7",jsonPath:"/levels/mechanical-mastery/07.json"},{name:"Level 8",jsonPath:"/levels/mechanical-mastery/08.json"},{name:"Level 9",jsonPath:"/levels/mechanical-mastery/09.json"},{name:"Level 10",jsonPath:"/levels/mechanical-mastery/10.json"}]},{name:"Sky High",levels:[{name:"Level 1",jsonPath:"/levels/sky-high/01.json"},{name:"Level 2",jsonPath:"/levels/sky-high/02.json"},{name:"Level 3",jsonPath:"/levels/sky-high/03.json"},{name:"Level 4",jsonPath:"/levels/sky-high/04.json"},{name:"Level 5",jsonPath:"/levels/sky-high/05.json"},{name:"Level 6",jsonPath:"/levels/sky-high/06.json"},{name:"Level 7",jsonPath:"/levels/sky-high/07.json"},{name:"Level 8",jsonPath:"/levels/sky-high/08.json"},{name:"Level 9",jsonPath:"/levels/sky-high/09.json"},{name:"Level 10",jsonPath:"/levels/sky-high/10.json"}]}];function Gt(h,t,e){let i=0;for(let s=0;s<h;s++)i+=e[s].levels.length;return i+=t,i}function Le(h,t){let e=0;for(let n=0;n<t.length;n++){const a=t[n].levels.length;if(h<e+a)return{sectionIndex:n,levelIndex:h-e};e+=a}const i=t.length-1;if(i<0)return{sectionIndex:0,levelIndex:0};const s=t[i].levels.length-1;return{sectionIndex:i,levelIndex:s>=0?s:0}}class ut{constructor(t=null){if(t)this.currentSection=t.currentSection,this.currentLevelIndex=t.currentLevelIndex,this.showingLevelComplete=t.showingLevelComplete,this.levelProgress=t.levelProgress,this.selectedCharacter=t.selectedCharacter,this.levelStats=t.levelStats,this.tutorialShown=t.tutorialShown;else{this.showingLevelComplete=!1;const e=this.loadProgress();this.levelProgress=e.levelProgress,this.selectedCharacter=e.selectedCharacter,this.levelStats=e.levelStats,this.tutorialShown=e.tutorialShown,this.ensureStatsForAllLevels();const i=this.levelProgress.unlockedLevels[0]-1,{sectionIndex:s,levelIndex:n}=Le(i,F);this.currentSection=s,this.currentLevelIndex=n}}_clone(){const t=JSON.parse(JSON.stringify(this));return new ut(t)}_getDefaultState(){return{levelProgress:{unlockedLevels:[1],completedLevels:[]},selectedCharacter:"PinkMan",levelStats:{},tutorialShown:!1}}loadProgress(){try{const t=localStorage.getItem("parkourGameState");if(!t)return this._getDefaultState();const e=JSON.parse(t);if(typeof e!="object"||e===null)return this._getDefaultState();const i=e.levelProgress;return typeof i!="object"||i===null||!Array.isArray(i.unlockedLevels)||!Array.isArray(i.completedLevels)?this._getDefaultState():((typeof e.selectedCharacter!="string"||!ct[e.selectedCharacter])&&(e.selectedCharacter="PinkMan"),(!e.levelStats||typeof e.levelStats!="object")&&(e.levelStats={}),typeof e.tutorialShown!="boolean"&&(e.tutorialShown=!1),e)}catch(t){return console.error("Failed to parse game state from localStorage. Resetting to default.",t),this._getDefaultState()}}saveProgress(){try{const t={levelProgress:this.levelProgress,selectedCharacter:this.selectedCharacter,levelStats:this.levelStats,tutorialShown:this.tutorialShown};localStorage.setItem("parkourGameState",JSON.stringify(t)),console.log("Progress saved:",t)}catch(t){console.error("Failed to save game state to localStorage",t)}}setSelectedCharacter(t){if(ct[t]&&this.selectedCharacter!==t){const e=this._clone();return e.selectedCharacter=t,e.saveProgress(),e}return this}ensureStatsForAllLevels(){F.forEach((t,e)=>{t.levels.forEach((i,s)=>{const n=`${e}-${s}`;this.levelStats[n]||(this.levelStats[n]={fastestTime:null,lowestDeaths:null,totalAttempts:0})})})}incrementAttempts(t,e){const i=this._clone(),s=`${t}-${e}`;return i.levelStats[s]&&(i.levelStats[s].totalAttempts+=1,i.saveProgress()),i}onLevelComplete(t){const e=this._clone(),i=`${this.currentSection}-${this.currentLevelIndex}`;if(!this.levelProgress.completedLevels.includes(i)){e.levelProgress.completedLevels.push(i);const n=F.reduce((o,r)=>o+r.levels.length,0),a=Gt(this.currentSection,this.currentLevelIndex,F);if(a+1<n){const o=a+2;o>this.levelProgress.unlockedLevels[0]&&(e.levelProgress.unlockedLevels[0]=o)}}const s=e.levelStats[i];return s&&((s.fastestTime===null||t.time<s.fastestTime)&&(s.fastestTime=t.time),(s.lowestDeaths===null||t.deaths<s.lowestDeaths)&&(s.lowestDeaths=t.deaths)),e.showingLevelComplete=!0,e.saveProgress(),c.publish("playSound",{key:"level_complete",volume:1,channel:"UI"}),e}isCharacterUnlocked(t){const e=ct[t];return e?this.levelProgress.completedLevels.length>=e.unlockRequirement:!1}isLevelUnlocked(t,e){return Gt(t,e,F)<this.levelProgress.unlockedLevels[0]}isLevelCompleted(t,e){const i=`${t}-${e}`;return this.levelProgress.completedLevels.includes(i)}resetProgress(){try{localStorage.removeItem("parkourGameState");const t=new ut;return t.saveProgress(),t}catch(t){return console.error("Failed to reset game state in localStorage",t),this}}markTutorialAsShown(){if(this.tutorialShown)return this;const t=this._clone();return t.tutorialShown=!0,t.saveProgress(),t}unlockAllLevels(){const t=this._clone(),e=F.reduce((i,s)=>i+s.levels.length,0);return t.levelProgress.unlockedLevels[0]=e,t.levelProgress.completedLevels=[],F.forEach((i,s)=>{i.levels.forEach((n,a)=>{t.levelProgress.completedLevels.push(`${s}-${a}`)})}),t.saveProgress(),t}}const y={WIDTH:32,HEIGHT:32,SPAWN_WIDTH:96,SPAWN_HEIGHT:96,CLING_OFFSET:7,MOVE_SPEED:200,JUMP_FORCE:400,GRAVITY:1200,MAX_FALL_SPEED:600,FALL_DAMAGE_MIN_VELOCITY:525,FALL_DAMAGE_MAX_VELOCITY:650,FALL_DAMAGE_MIN_AMOUNT:8,FALL_DAMAGE_MAX_AMOUNT:20,DASH_SPEED:500,DASH_DURATION:.2,DASH_COOLDOWN:.7,COYOTE_TIME:.1,JUMP_BUFFER_TIME:.15,HIT_STUN_DURATION:.2,SAND_MOVE_MULTIPLIER:.3,MUD_JUMP_MULTIPLIER:.6,ICE_ACCELERATION:800,ICE_FRICTION:400,TRAMPOLINE_BOUNCE_MULTIPLIER:2,ANIMATION_SPEED:.06,SPAWN_ANIMATION_SPEED:.08,HIT_ANIMATION_SPEED:.1,ANIMATION_FRAMES:{idle:11,run:12,double_jump:6,jump:1,fall:1,dash:1,cling:5,spawn:7,despawn:7,hit:7}},v={TILE_SIZE:48},L={DEFAULT_HAZARD_DAMAGE:25,SPIKE_DAMAGE:20,SPIKE_KNOCKBACK_X:150,SPIKE_KNOCKBACK_Y:-200,SPIKED_BALL_DAMAGE:50,SPIKED_BALL_KNOCKBACK_BASE:200,SPIKED_BALL_KNOCKBACK_Y_BOOST:-150,SAW_DAMAGE:35,SAW_KNOCKBACK_BASE:250,SAW_KNOCKBACK_Y_BOOST:-100,FIRE_TRAP_DAMAGE:15,FIRE_TRAP_DAMAGE_INTERVAL:1};class E{constructor(t=0,e=0){this.vx=t,this.vy=e}}class b{constructor({speed:t=y.MOVE_SPEED,jumpForce:e=y.JUMP_FORCE,dashSpeed:i=y.DASH_SPEED,dashDuration:s=y.DASH_DURATION,jumpBufferTimer:n=0,coyoteTimer:a=0,dashTimer:o=0,dashCooldownTimer:r=0,hitStunTimer:l=0,jumpCount:d=0,isDashing:u=!1,isHit:p=!1,isSpawning:m=!0,spawnComplete:A=!1,isDespawning:f=!1,despawnAnimationFinished:M=!1,needsRespawn:T=!1,deathCount:O=0,activeSurfaceSound:D=null,surfaceParticleTimer:nt=0,jumpParticleTimer:Ct=0,hLock:J=!1,vLock:X=!1}={}){this.speed=t,this.jumpForce=e,this.dashSpeed=i,this.dashDuration=s,this.jumpBufferTimer=n,this.coyoteTimer=a,this.dashTimer=o,this.dashCooldownTimer=r,this.hitStunTimer=l,this.surfaceParticleTimer=nt,this.jumpParticleTimer=Ct,this.jumpCount=d,this.isDashing=u,this.isHit=p,this.isSpawning=m,this.spawnComplete=A,this.isDespawning=f,this.despawnAnimationFinished=M,this.needsRespawn=T,this.hLock=J,this.vLock=X,this.deathCount=O,this.activeSurfaceSound=D,this.currentState=null}}class re{constructor(t,e,i){this.cellSize=i,this.widthInCells=Math.ceil(t/i),this.heightInCells=Math.ceil(e/i),this.grid=new Array(this.widthInCells*this.heightInCells).fill(null).map(()=>[])}clear(){for(let t=0;t<this.grid.length;t++)this.grid[t]=[]}_getGridIndices(t){const e=Math.floor(t.x/this.cellSize),i=Math.floor(t.y/this.cellSize),s=Math.floor((t.x+t.width)/this.cellSize),n=Math.floor((t.y+t.height)/this.cellSize);return{startX:e,startY:i,endX:s,endY:n}}insert(t){const{startX:e,startY:i,endX:s,endY:n}=this._getGridIndices(t);for(let a=i;a<=n;a++)for(let o=e;o<=s;o++)if(o>=0&&o<this.widthInCells&&a>=0&&a<this.heightInCells){const r=a*this.widthInCells+o;this.grid[r].push(t)}}removeObjects(t){for(const e of t){const{startX:i,startY:s,endX:n,endY:a}=this._getGridIndices(e);for(let o=s;o<=a;o++)for(let r=i;r<=n;r++)if(r>=0&&r<this.widthInCells&&o>=0&&o<this.heightInCells){const l=o*this.widthInCells+r,d=this.grid[l],u=d.indexOf(e);u!==-1&&d.splice(u,1)}}}query(t){const e=Math.floor(t.x/this.cellSize),i=Math.floor(t.y/this.cellSize),s=Math.floor((t.x+t.width)/this.cellSize),n=Math.floor((t.y+t.height)/this.cellSize),a=new Set;for(let o=i;o<=n;o++)for(let r=e;r<=s;r++)if(r>=0&&r<this.widthInCells&&o>=0&&o<this.heightInCells){const l=o*this.widthInCells+r;this.grid[l].forEach(d=>a.add(d))}return Array.from(a)}}class Mt{constructor(){}}class P{constructor({type:t,ai:e}){this.type=t,this.ai=e,this.isDead=!1,this.deathTimer=0,this.timer=0,this.immunityTimer=0,this.ai.particleDropInterval&&(this.particleDropTimer=this.ai.particleDropInterval),this.type==="snail"&&(this.snailState="walking")}}class V{constructor({stompable:t=!0,stompBounceVelocity:e=250,dealsContactDamage:i=!0}={}){this.stompable=t,this.stompBounceVelocity=e,this.dealsContactDamage=i}}class Re{constructor(){this.spatialGrid=null,this.currentLevel=null,this.dynamicGridObjects=[]}_initializeGridForLevel(t){const e=v.TILE_SIZE*2;this.spatialGrid=new re(t.width,t.height,e),this.currentLevel=t;for(let i=0;i<t.gridHeight;i++)for(let s=0;s<t.gridWidth;s++){const n=t.tiles[i][s];n&&n.solid&&this.spatialGrid.insert({x:s*v.TILE_SIZE,y:i*v.TILE_SIZE,width:v.TILE_SIZE,height:v.TILE_SIZE,isOneWay:n.oneWay||!1,surfaceType:n.interaction||n.type,type:"tile"})}}_updateGridWithDynamicObjects(t,e){this.spatialGrid.removeObjects(this.dynamicGridObjects),this.dynamicGridObjects=[],e.traps.forEach(s=>{if(s.solid){const a={...s.hitbox||{x:s.x-s.width/2,y:s.y-s.height/2,width:s.width,height:s.height},isOneWay:!1,surfaceType:s.type==="falling_platform"?"platform":s.type,onLanded:typeof s.onLanded=="function"?s.onLanded.bind(s):null,type:"trap"};this.spatialGrid.insert(a),this.dynamicGridObjects.push(a)}});const i=t.query([w,_,Mt]);for(const s of i){const n=t.getComponent(s,w),a=t.getComponent(s,_),o=t.hasComponent(s,P),r={x:n.x,y:n.y,width:a.width,height:a.height,isOneWay:!1,surfaceType:o?"enemy":"entity",type:"entity",entityId:s};this.spatialGrid.insert(r),this.dynamicGridObjects.push(r)}}update(t,{entityManager:e,level:i}){i!==this.currentLevel&&this._initializeGridForLevel(i),this._updateGridWithDynamicObjects(e,i);const s=e.query([w,E,_]);for(const n of s){const a=e.getComponent(n,w),o=e.getComponent(n,E),r=e.getComponent(n,_),l=e.getComponent(n,b);if(l&&(l.isSpawning||l.isDespawning||l.needsRespawn))continue;if(a.y>i.height+100){c.publish("collisionEvent",{type:"world_bottom",entityId:n,entityManager:e});continue}a.x+=o.vx*t,r.isAgainstWall=!1;let d={x:a.x,y:a.y,width:r.width,height:r.height};const u={x:o.vx>0?a.x:a.x+o.vx*t,y:a.y,width:r.width+Math.abs(o.vx*t),height:r.height},p=this.spatialGrid.query(u);for(const f of p)if(!(f.type==="entity"&&f.entityId===n)&&!f.isOneWay&&this._isRectColliding(d,f)){const M=!!l,T=f.type==="entity"&&e.hasComponent(f.entityId,P);if(M&&T){const O=e.getComponent(f.entityId,P),D=e.getComponent(f.entityId,V);if(!O.isDead&&(!D||D.dealsContactDamage)){c.publish("playerTookDamage",{amount:1e3,source:"enemy_contact"});return}continue}if(f.type==="entity")continue;o.vx>0?a.x=f.x-r.width:o.vx<0&&(a.x=f.x+f.width),o.vx=0,d.x=a.x,r.isAgainstWall=!["sand","mud","ice","platform"].includes(f.surfaceType)}a.y+=o.vy*t,r.isGrounded=!1,d={x:a.x,y:a.y,width:r.width,height:r.height};const m={x:a.x,y:o.vy>0?a.y:a.y+o.vy*t,width:r.width,height:r.height+Math.abs(o.vy*t)},A=this.spatialGrid.query(m);for(const f of A){if(f.type==="entity"&&f.entityId===n||!this._isRectColliding(d,f))continue;const M=!!l,T=f.type==="entity"&&e.hasComponent(f.entityId,P);if(M&&T){const O=e.getComponent(f.entityId,P),D=e.getComponent(f.entityId,V),nt=a.y-o.vy*t+r.height;if(o.vy>0&&nt<=f.y+2&&!O.isDead&&D?.stompable){c.publish("enemyStomped",{enemyId:f.entityId,stompBounceVelocity:D.stompBounceVelocity}),a.y=f.y-r.height,o.vy=0;continue}if(!O.isDead&&(!D||D.dealsContactDamage)){c.publish("playerDied");return}continue}if(f.type!=="entity")if(o.vy>=0){const O=a.y-o.vy*t+r.height;O<=f.y+2&&(!f.isOneWay||O<=f.y)&&(this._landOnSurface(a,o,r,f.y,f.surfaceType,n),d.y=a.y,f.onLanded&&f.onLanded(c))}else f.isOneWay||(a.y=f.y+f.height,o.vy=0,d.y=a.y)}if(!r.isGrounded&&o.vy>=0){const f={x:a.x,y:a.y+r.height,width:r.width,height:1},M=this.spatialGrid.query(f);for(const T of M)if(!(T.type==="entity"&&T.entityId===n)&&T.type!=="entity"&&this._isRectColliding(f,T))if(T.isOneWay){if(T.isOneWay&&a.y+r.height<=T.y+2){this._landOnSurface(a,o,r,T.y,T.surfaceType,n),o.vy>0&&(o.vy=0);break}}else{this._landOnSurface(a,o,r,T.y,T.surfaceType,n),o.vy>0&&(o.vy=0);break}}a.x=Math.max(0,Math.min(a.x,i.width-r.width)),a.y<0&&(a.y=0,o.vy<0&&(o.vy=0)),this._checkObjectInteractions(a,o,r,i,t,n,e)}}_isRectColliding(t,e){return t.x<e.x+e.width&&t.x+t.width>e.x&&t.y<e.y+e.height&&t.y+t.height>e.y}_landOnSurface(t,e,i,s,n,a){const o=e.vy;o>=y.FALL_DAMAGE_MIN_VELOCITY&&c.publish("playerLandedHard",{entityId:a,landingVelocity:o}),t.y=s-i.height,e.vy=0,i.isGrounded=!0,i.groundType=n}_isCollidingWith(t,e,i){const s=i.damageHitbox||i.hitbox||{x:i.x-(i.width||i.size)/2,y:i.y-(i.height||i.size)/2,width:i.width||i.size,height:i.height||i.size};return t.x<s.x+s.width&&t.x+e.width>s.x&&t.y<s.y+s.height&&t.y+e.height>s.y}_checkObjectInteractions(t,e,i,s,n,a,o){this._checkFruitCollisions(t,i,s,a,o),this._checkTrophyCollision(t,i,s.trophy,a,o,e,n),this.checkCheckpointCollisions(t,i,s,a,o),this._checkTrapInteractions(t,e,i,s,n,a,o)}_checkTrapInteractions(t,e,i,s,n,a,o){const r={pos:t,vel:e,col:i,entityId:a,entityManager:o,dt:n};for(const l of s.traps)!l.solid&&this._isCollidingWith(t,i,l)&&l.onCollision(r,c)}_checkFruitCollisions(t,e,i,s,n){for(const a of i.getActiveFruits())this._isCollidingWith(t,e,a)&&c.publish("collisionEvent",{type:"fruit",entityId:s,target:a,entityManager:n})}_checkTrophyCollision(t,e,i,s,n,a,o){if(!i||i.inactive||i.acquired)return;const r=15,l={x:i.x-i.size/2,y:i.y-i.size/2+r,width:i.size,height:i.size-r};if(!this._isRectColliding({x:t.x,y:t.y,width:e.width,height:e.height},l))return;const d=t.y+e.height-a.vy*o;if(a.vy>=0&&d<=l.y){i.isAnimating||(i.isAnimating=!0,c.publish("playerKnockback",{entityId:s,entityManager:n,vx:0,vy:-300}),c.publish("playSound",{key:"trophy_activated",volume:.9,channel:"UI"}),c.publish("cameraShakeRequested",{intensity:6,duration:.25}));return}a.vx>0?(t.x=l.x-e.width,a.vx=0):a.vx<0&&(t.x=l.x+l.width,a.vx=0)}checkCheckpointCollisions(t,e,i,s,n){for(const a of i.getInactiveCheckpoints())this._isCollidingWith(t,e,a)&&c.publish("collisionEvent",{type:"checkpoint",entityId:s,target:a,entityManager:n})}}class vt{constructor(t=0,e=0){this.x=t,this.y=e}}class k{constructor({spriteKey:t,width:e,height:i,animationState:s="idle",animationFrame:n=0,animationTimer:a=0,direction:o="right",isVisible:r=!0}){this.spriteKey=t,this.width=e,this.height=i,this.animationState=s,this.animationFrame=n,this.animationTimer=a,this.direction=o,this.isVisible=r}}class Pt{constructor(t){this.characterId=t}}const $t={mushroom:{width:32,height:32,spriteKey:"mushroom",animations:{idle:{frameCount:14,speed:.1},run:{frameCount:16,speed:.1},hit:{frameCount:5,speed:.1}},killable:{stompable:!0,stompBounceVelocity:300},ai:{type:"patrol",aggroRange:0,patrolSpeed:40}},chicken:{width:32,height:34,spriteKey:"chicken",animations:{idle:{frameCount:13,speed:.1},run:{frameCount:14,speed:.08},hit:{frameCount:5,speed:.1}},killable:{stompable:!0,stompBounceVelocity:250},ai:{type:"ground_charge",aggroRange:250,chargeSpeed:200,idleTime:1.5,chargeTime:2,cooldownTime:1}},snail:{width:38,height:24,spriteKey:"snail",animations:{idle:{frameCount:15,speed:.2},walk:{frameCount:10,speed:.15},shell_idle:{frameCount:6,speed:.1},shell_wall_hit:{frameCount:4,speed:.05},shell_top_hit:{frameCount:5,speed:.1},hit:{frameCount:5,speed:.1}},killable:{stompable:!0,stompBounceVelocity:250},ai:{type:"snail",patrolSpeed:20,shellSpeed:150}},slime:{width:44,height:30,spriteKey:"slime",animations:{idle_run:{frameCount:10,speed:.1},hit:{frameCount:5,speed:.1}},killable:{stompable:!0,stompBounceVelocity:350},ai:{type:"patrol",patrolSpeed:25,particleDropInterval:.8}},turtle:{width:44,height:26,spriteKey:"turtle",animations:{idle1:{frameCount:14,speed:.1},idle2:{frameCount:14,speed:.1},spikes_out:{frameCount:8,speed:.1},spikes_in:{frameCount:8,speed:.1},hit:{frameCount:5,speed:.1}},killable:{stompable:!0,stompBounceVelocity:250},ai:{type:"defensive_cycle",spikesInDuration:2,spikesOutDuration:3}}};class Me{constructor(t,e,i){this.ctx=t,this.canvas=e,this.assets=i,this.backgroundCache=new Map,this.backgroundOffset={x:0,y:0},this.staticLayerCache=null}preRenderLevel(t){this.staticLayerCache=document.createElement("canvas"),this.staticLayerCache.width=t.width,this.staticLayerCache.height=t.height;const e=this.staticLayerCache.getContext("2d");e.imageSmoothingEnabled=!1;const i=v.TILE_SIZE;for(let s=0;s<t.gridHeight;s++)for(let n=0;n<t.gridWidth;n++){const a=t.tiles[s][n];if(a.solid){const o=this.assets[a.spriteKey];if(!o){e.fillStyle="magenta",e.fillRect(n*i,s*i,i,i);continue}const r=n*i,l=s*i,d=i+1;if(a.spriteConfig){const u=i,p=a.spriteConfig.height||i,m=d,A=p===i?d:p;e.drawImage(o,a.spriteConfig.srcX,a.spriteConfig.srcY,u,p,r,l,m,A)}else e.drawImage(o,r,l,d,d)}}}_preRenderBackground(t){const e=t.background;if(this.backgroundCache.has(e))return this.backgroundCache.get(e);const i=this.assets[e];if(!i||!i.complete||i.naturalWidth===0)return null;const s=document.createElement("canvas");s.width=this.canvas.width+i.width,s.height=this.canvas.height+i.height;const n=s.getContext("2d"),a=n.createPattern(i,"repeat");return n.fillStyle=a,n.fillRect(0,0,s.width,s.height),this.backgroundCache.set(e,s),s}drawScrollingBackground(t,e){const i=this._preRenderBackground(t),s=this.assets[t.background];if(!i||!s||!s.complete||s.naturalWidth===0){this.ctx.fillStyle="#87CEEB",this.ctx.fillRect(0,0,this.canvas.width,this.canvas.height);return}this.backgroundOffset.x+=t.backgroundScroll.x*e,this.backgroundOffset.y+=t.backgroundScroll.y*e;const n=(this.backgroundOffset.x%s.width+s.width)%s.width,a=(this.backgroundOffset.y%s.height+s.height)%s.height;this.ctx.drawImage(i,n,a,this.canvas.width,this.canvas.height,0,0,this.canvas.width,this.canvas.height)}renderScene(t,e,i,s){t.apply(this.ctx),this.staticLayerCache&&this.ctx.drawImage(this.staticLayerCache,0,0);const n=e.spatialGrid.query(t.getViewportBounds());for(const o of n){if(!o.instance)continue;const r=o.instance;switch(o.type){case"trap":r.render(this.ctx,this.assets,t);break;case"fruit":r.collected||this.drawFruits([r],t);break;case"checkpoint":this.drawCheckpoints([r],t);break;case"trophy":this.drawTrophy(r,t);break}}const a=i.query([w,k]);for(const o of a){const r=i.getComponent(o,w),l=i.getComponent(o,vt),d=i.getComponent(o,k);let u=r.x,p=r.y;l&&(u=l.x+(r.x-l.x)*s,p=l.y+(r.y-l.y)*s);const m={x:u,y:p};if(i.hasComponent(o,b)){const f=i.getComponent(o,Pt),M=i.getComponent(o,b);this._drawPlayer(m,d,f,M)}else i.hasComponent(o,P)&&this._drawEnemy(m,d)}t.restore(this.ctx)}_drawPlayer(t,e,i,s){const n=e.animationState;if(!e.isVisible||s&&s.despawnAnimationFinished)return;const a={idle:"playerIdle",run:"playerRun",jump:"playerJump",double_jump:"playerDoubleJump",fall:"playerFall",dash:"playerDash",cling:"playerCling",spawn:"playerAppear",despawn:"playerDisappear",hit:"playerHit"};let o;const r=a[n];if(n==="spawn"||n==="despawn"?o=this.assets[r]:i?o=this.assets.characters[i.characterId]?.[r]||this.assets.playerIdle:o=this.assets[e.spriteKey],!o){this.ctx.fillStyle="#FF00FF",this.ctx.fillRect(t.x,t.y,e.width,e.height);return}const l=y.ANIMATION_FRAMES[n]||1,d=o.width/l,u=d*e.animationFrame;this.ctx.save();const p=n==="spawn"||n==="despawn",m=p?t.x-(e.width-y.WIDTH)/2:t.x,A=p?t.y-(e.height-y.HEIGHT)/2:t.y;e.direction==="left"?(this.ctx.scale(-1,1),this.ctx.translate(-m-e.width,A)):this.ctx.translate(m,A);const f=n==="cling"?y.CLING_OFFSET:0;this.ctx.drawImage(o,u,0,d,o.height,f,0,e.width,e.height),this.ctx.restore()}_drawEnemy(t,e){if(!e.isVisible)return;const i=`${e.spriteKey}_${e.animationState}`,s=this.assets[i],n=$t[e.spriteKey];if(!n)return;if(!s){console.warn(`Missing enemy sprite for asset key: "${i}"`),this.ctx.fillStyle="#FF00FF",this.ctx.fillRect(t.x,t.y,e.width,e.height);return}const a=n.animations[e.animationState]?.frameCount||1,o=s.width/a,r=e.animationFrame%a*o,l=e.direction==="right";this.ctx.save(),l?(this.ctx.scale(-1,1),this.ctx.translate(-t.x-e.width,t.y)):this.ctx.translate(t.x,t.y),this.ctx.drawImage(s,r,0,o,s.height,0,0,e.width,e.height),this.ctx.restore()}drawTrophy(t,e){if(!e.isVisible(t.x-t.size/2,t.y-t.size/2,t.size,t.size))return;const i=t.isAnimating||t.acquired,s=this.assets[i?"trophy_pressed":"trophy_idle"];if(!s)return;let n,a;i?(n=s.width/t.frameCount,a=n*t.animationFrame):(n=s.width,a=0),t.inactive&&(this.ctx.globalAlpha=.5),this.ctx.drawImage(s,a,0,n,s.height,t.x-t.size/2,t.y-t.size/2,t.size,t.size),this.ctx.globalAlpha=1}drawFruits(t,e){for(const i of t){if(!e.isRectVisible({x:i.x-i.size/2,y:i.y-i.size/2,width:i.size,height:i.size}))continue;const s=this.assets[i.spriteKey];if(!s)continue;const n=s.width/i.frameCount,a=n*i.frame;this.ctx.drawImage(s,a,0,n,s.height,i.x-i.size/2,i.y-i.size/2,i.size,i.size)}}drawCheckpoints(t,e){for(const i of t){if(!e.isRectVisible({x:i.x,y:i.y,width:i.size,height:i.size}))continue;let s,n=0,a;switch(i.state){case"inactive":s=this.assets.checkpoint_inactive,s&&(a=s.width);break;case"activating":s=this.assets.checkpoint_activation,s&&(a=s.width/i.frameCount,n=i.frame*a);break;case"active":if(s=this.assets.checkpoint_active,s){const r=Math.floor(performance.now()/1e3/.1%10);a=s.width/10,n=r*a}break}s&&a>0?this.ctx.drawImage(s,n,0,a,s.height,i.x-i.size/2,i.y-i.size/2,i.size,i.size):(this.ctx.fillStyle="purple",this.ctx.fillRect(i.x-i.size/2,i.y-i.size/2,i.size,i.size))}}}const Q={0:{type:"empty",solid:!1,hazard:!1,description:"Empty space. The player can move freely through it."},1:{type:"dirt",solid:!0,hazard:!1,spriteKey:"block",spriteConfig:{srcX:96,srcY:0},description:"A standard, solid block of dirt. Wall-jumps are not possible on this surface."},2:{type:"stone",solid:!0,hazard:!1,spriteKey:"block",spriteConfig:{srcX:0,srcY:0},description:"A standard, solid block of stone. Players can wall-jump off this surface."},3:{type:"wood",solid:!0,hazard:!1,spriteKey:"block",spriteConfig:{srcX:0,srcY:64},description:"A standard, solid block of wood. Players can wall-jump off this surface."},4:{type:"green_block",solid:!0,hazard:!1,spriteKey:"block",spriteConfig:{srcX:0,srcY:128},description:"A solid, green-colored block. Players can wall-jump off this surface."},5:{type:"orange_dirt",solid:!0,hazard:!1,spriteKey:"block",spriteConfig:{srcX:96,srcY:64},description:"Solid orange dirt. Wall-jumps are not possible on this surface."},6:{type:"pink_dirt",solid:!0,hazard:!1,spriteKey:"block",spriteConfig:{srcX:96,srcY:128},description:"Solid pink dirt. Wall-jumps are not possible on this surface."},7:{type:"sand",solid:!0,hazard:!1,spriteKey:"sand_mud_ice",spriteConfig:{srcX:0,srcY:0},interaction:"sand",description:"A solid block of sand. Slows player movement. Wall-jumps are not possible."},8:{type:"mud",solid:!0,hazard:!1,spriteKey:"sand_mud_ice",spriteConfig:{srcX:64,srcY:0},interaction:"mud",description:"A solid block of mud. Reduces jump height. Wall-jumps are not possible."},9:{type:"ice",solid:!0,hazard:!1,spriteKey:"sand_mud_ice",spriteConfig:{srcX:128,srcY:0},interaction:"ice",description:"A solid block of slippery ice. Reduces friction. Wall-jumps are not possible."},a:{type:"oneway_gold",solid:!0,oneWay:!0,hazard:!1,spriteKey:"block",spriteConfig:{srcX:272,srcY:0,height:5},description:"A one-way platform made of gold. The player can jump through it from below."},b:{type:"oneway_wood",solid:!0,oneWay:!0,hazard:!1,spriteKey:"block",spriteConfig:{srcX:272,srcY:16,height:5},description:"A one-way platform made of wood. The player can jump through it from below."},c:{type:"oneway_stone",solid:!0,oneWay:!0,hazard:!1,spriteKey:"block",spriteConfig:{srcX:272,srcY:32,height:5},description:"A one-way platform made of stone. The player can jump through it from below."}};class j{constructor(t,e,i){this.x=t,this.y=e,this.width=i.width||16,this.height=i.height||16,this.type=i.type,this.id=`${this.type}-${Math.random().toString(36).substr(2,9)}`}update(t,e,i){}render(t,e,i){}onCollision(t,e){}reset(){}}class Pe extends j{constructor(t,e,i){super(t,e,{...i,width:16,height:16}),this.chainLength=i.chainLength||1,this.width=16*this.chainLength,this.x=t+(this.width-16)/2,this.solid=!0,this.state="off",this.frame=0,this.frameTimer=0,this.turnOffTimer=0,this.damageTimer=L.FIRE_TRAP_DAMAGE_INTERVAL,this.anim={activating:{frames:4,speed:.1},on:{frames:3,speed:.15}}}_isPlayerOnTop(t){if(!t)return!1;const e=t.y+t.height,i=this.y-this.height/2;return t.x<this.x+this.width/2&&t.x+t.width>this.x-this.width/2&&Math.abs(e-i)<5}get damageHitbox(){return this.state==="on"||this.state==="activating"?{x:this.x-this.width/2,y:this.y-this.height*1.5,width:this.width,height:this.height*2}:null}update(t,e,i){switch(!this._isPlayerOnTop(e)&&this.state==="on"&&(this.state="turning_off",this.turnOffTimer=2),this.state){case"activating":this.frameTimer+=t,this.frameTimer>=this.anim.activating.speed&&(this.frameTimer=0,this.frame++,this.frame>=this.anim.activating.frames&&(this.frame=0,this.state="on"));break;case"on":case"turning_off":this.frameTimer+=t,this.frameTimer>=this.anim.on.speed&&(this.frameTimer=0,this.frame=(this.frame+1)%this.anim.on.frames),this.state==="turning_off"&&(this.turnOffTimer-=t,this.turnOffTimer<=0&&(this.state="off",this.frame=0));break}if(this.state==="on"&&e){const n=this.damageHitbox,a={x:e.x,y:e.y,width:e.width,height:e.height};n&&a.x<n.x+n.width&&a.x+a.width>n.x&&a.y<n.y+n.height&&a.y+a.height>n.y&&(this.damageTimer+=t,this.damageTimer>=L.FIRE_TRAP_DAMAGE_INTERVAL&&(this.damageTimer-=L.FIRE_TRAP_DAMAGE_INTERVAL,i.publish("playerTookDamage",{amount:L.FIRE_TRAP_DAMAGE,source:"fire"})))}else this.damageTimer=L.FIRE_TRAP_DAMAGE_INTERVAL}render(t,e,i){const n=this.x-this.width/2;if(!i.isVisible(n,this.y-this.height,this.width,this.height*2))return;const a=e.fire_off;if(a)for(let d=0;d<this.chainLength;d++)t.drawImage(a,0,16,16,16,n+d*16,this.y-this.height/2,16,this.height);if(this.state==="off")return;let o,r=0,l;if(this.state==="activating"?(o=e.fire_hit,l=o.width/this.anim.activating.frames,r=this.frame*l):(o=e.fire_on,l=o.width/this.anim.on.frames,r=this.frame*l),o)for(let d=0;d<this.chainLength;d++)t.drawImage(o,r,0,l,o.height,n+d*16,this.y-this.height*1.5,16,this.height*2)}onLanded(t){(this.state==="off"||this.state==="turning_off")&&(this.state="activating",this.frame=0,this.frameTimer=0,t.publish("playSound",{key:"fire_activated",volume:.8,channel:"SFX"}))}reset(){this.state="off",this.frame=0,this.frameTimer=0,this.turnOffTimer=0,this.damageTimer=L.FIRE_TRAP_DAMAGE_INTERVAL}}class $e extends j{constructor(t,e,i){super(t,e,{...i,width:16,height:16}),this.state="hidden",this.activationRadius=64,this.warningDuration=.4,this.retractDelay=1.5,this.timer=0,this.damage=i.damage||L.SPIKE_DAMAGE}get hitbox(){return{x:this.x-this.width/2,y:this.y-this.height/4,width:this.width,height:this.height/2}}update(t,e){if(!e)return;this.timer>0&&(this.timer-=t);const i=e.x,s=e.x+e.width,n=e.y,a=e.y+e.height,o=this.x-this.activationRadius,r=this.x+this.activationRadius,l=this.y-this.activationRadius,d=this.y+this.activationRadius,u=s>o&&i<r&&a>l&&n<d;switch(this.state){case"hidden":u&&(this.state="warning",this.timer=this.warningDuration);break;case"warning":this.timer<=0&&(this.state="extended",this.timer=this.retractDelay);break;case"extended":this.timer<=0&&(this.state="hidden");break}}render(t,e,i){if(this.state==="hidden"||this.state==="warning")return;const s=this.x-this.width/2,n=this.y-this.height/2;if(!i.isVisible(s,n,this.width,this.height))return;const a=e.spike_two;a&&t.drawImage(a,s,n,this.width,this.height)}onCollision(t,e){if(this.state!=="extended")return;const i=t.entityManager.getComponent(t.entityId,k);if(!i)return;const s=i.direction==="right"?-150:L.SPIKE_KNOCKBACK_X,n=L.SPIKE_KNOCKBACK_Y;e.publish("collisionEvent",{type:"hazard",entityId:t.entityId,entityManager:t.entityManager,damage:this.damage,knockback:{vx:s,vy:n}})}reset(){this.state="hidden",this.timer=0}}class Fe extends j{constructor(t,e,i){super(t,e,{...i,width:28,height:28}),this.state="idle",this.frame=0,this.frameCount=8,this.frameSpeed=.05,this.frameTimer=0}update(t){this.state==="jumping"&&(this.frameTimer+=t,this.frameTimer>=this.frameSpeed&&(this.frameTimer-=this.frameSpeed,this.frame++,this.frame>=this.frameCount&&(this.frame=0,this.state="idle")))}render(t,e,i){const s=this.x-this.width/2,n=this.y-this.height/2;if(!i.isVisible(s,n,this.width,this.height))return;let a,o=0,r;this.state==="jumping"?(a=e.trampoline_jump,a&&(r=a.width/this.frameCount,o=this.frame*r)):(a=e.trampoline_idle,a&&(r=a.width)),a&&r>0?t.drawImage(a,o,0,r,a.height,s,n,this.width,this.height):(t.fillStyle="#8e44ad",t.fillRect(s,n,this.width,this.height))}onCollision(t,e){const{pos:i,vel:s,col:n}=t;s.vy=-400*y.TRAMPOLINE_BOUNCE_MULTIPLIER,i.y=this.y-this.height/2-n.height,this.state="jumping",this.frame=0,this.frameTimer=0,e.publish("playSound",{key:"trampoline_bounce",volume:1,channel:"SFX"})}reset(){this.state="idle",this.frame=0,this.frameTimer=0}}class Oe extends j{constructor(t,e,i){super(t,e,{...i,width:28,height:28}),this.chainLength=i.chainLength||100,this.swingArc=i.swingArc||90,this.period=i.period||4,this.tiltAmount=i.tiltAmount||.5,this.anchorX=t,this.anchorY=e,this.ballX=this.anchorX,this.ballY=this.anchorY+this.chainLength,this.swingTimer=0,this.maxAngle=this.swingArc/2*(Math.PI/180),this.rotation=0}get hitbox(){return{x:this.ballX-this.width/2,y:this.ballY-this.height/2,width:this.width,height:this.height}}update(t){this.swingTimer+=t;const e=this.maxAngle*Math.sin(this.swingTimer/this.period*2*Math.PI),i=this.maxAngle*Math.cos(this.swingTimer/this.period*2*Math.PI);this.rotation=i*this.tiltAmount,this.ballX=this.anchorX+this.chainLength*Math.sin(e),this.ballY=this.anchorY+this.chainLength*Math.cos(e)}render(t,e,i){if(!i.isVisible(this.anchorX-this.chainLength,this.anchorY,this.chainLength*2,this.chainLength*2))return;const s=e.spiked_ball,n=e.spiked_ball_chain;if(n){const o=this.ballX-this.anchorX,r=this.ballY-this.anchorY,l=Math.sqrt(o*o+r*r),d=Math.atan2(r,o);t.save(),t.translate(this.anchorX,this.anchorY),t.rotate(d);for(let u=0;u<l;u+=8)t.drawImage(n,u,-8/2,8,8);t.restore()}s?(t.save(),t.translate(this.ballX,this.ballY),t.rotate(this.rotation),t.drawImage(s,-this.width/2,-this.height/2,this.width,this.height),t.restore()):(t.fillStyle="red",t.fillRect(this.hitbox.x,this.hitbox.y,this.width,this.height))}onCollision(t,e){const i=t.pos.x+t.col.width/2,s=t.pos.y+t.col.height/2;let n=i-this.ballX,a=s-this.ballY;const o=Math.sqrt(n*n+a*a);o===0?(n=1,a=0):(n/=o,a/=o);const r=L.SPIKED_BALL_KNOCKBACK_BASE;e.publish("collisionEvent",{type:"hazard",entityId:t.entityId,entityManager:t.entityManager,damage:L.SPIKED_BALL_DAMAGE,knockback:{vx:n*r,vy:a*r+L.SPIKED_BALL_KNOCKBACK_Y_BOOST}})}reset(){this.swingTimer=0,this.rotation=0}}class De extends j{constructor(t,e,i){super(t,e,i),this.width=18,this.height=18,this.type="arrow_bubble",this.direction=i.direction||"right",this.knockbackSpeed=i.knockbackSpeed||450,this.state="idle",this.RESPAWN_DURATION=4,this.respawnTimer=0,this.idleAnimation={frameCount:10,frameSpeed:.1,frameTimer:0,currentFrame:0},this.hitAnimation={frameCount:4,frameSpeed:.08,frameTimer:0,currentFrame:0}}update(t){this.state==="idle"?(this.idleAnimation.frameTimer+=t,this.idleAnimation.frameTimer>=this.idleAnimation.frameSpeed&&(this.idleAnimation.frameTimer=0,this.idleAnimation.currentFrame=(this.idleAnimation.currentFrame+1)%this.idleAnimation.frameCount)):this.state==="hit"?(this.hitAnimation.frameTimer+=t,this.hitAnimation.frameTimer>=this.hitAnimation.frameSpeed&&(this.hitAnimation.frameTimer=0,this.hitAnimation.currentFrame++,this.hitAnimation.currentFrame>=this.hitAnimation.frameCount&&(this.state="respawning",this.respawnTimer=this.RESPAWN_DURATION))):this.state==="respawning"&&(this.respawnTimer-=t,this.respawnTimer<=0&&this._resetToIdle())}render(t,e,i){if(this.state==="respawning")return;const s=this.x-this.width/2,n=this.y-this.height/2;if(!i.isVisible(s,n,this.width,this.height))return;const a=this.state==="idle"?e.arrow_idle:e.arrow_hit,o=this.state==="idle"?this.idleAnimation.currentFrame:this.hitAnimation.currentFrame,r=this.state==="idle"?this.idleAnimation.frameCount:this.hitAnimation.frameCount;if(a){const l=a.width/r,d=a.height;t.save(),t.translate(this.x,this.y);let u=0;switch(this.direction){case"up":u=0;break;case"right":u=Math.PI/2;break;case"down":u=Math.PI;break;case"left":default:u=-Math.PI/2;break}t.rotate(u),t.drawImage(a,o*l,0,l,d,-this.width/2,-this.height/2,this.width,this.height),t.restore()}}onCollision(t,e){if(this.state!=="idle")return;const i=t.entityManager.getComponent(t.entityId,b);if(!i)return;this.state="hit",this.hitAnimation.currentFrame=0,this.hitAnimation.frameTimer=0,e.publish("playSound",{key:"arrow_pop",volume:.8,channel:"SFX"});const{vel:s}=t;switch(this.direction==="up"||this.direction==="down"?(i.vLock=!0,s.vx=0):(i.hLock=!0,s.vy=0),this.direction){case"up":s.vy=-this.knockbackSpeed;break;case"down":s.vy=this.knockbackSpeed;break;case"left":s.vx=-this.knockbackSpeed;break;case"right":s.vx=this.knockbackSpeed;break}}_resetToIdle(){this.state="idle",this.idleAnimation.currentFrame=0,this.idleAnimation.frameTimer=0,this.hitAnimation.currentFrame=0,this.hitAnimation.frameTimer=0,this.respawnTimer=0}reset(){this._resetToIdle()}}class je extends j{constructor(t,e,i){super(t,e,i),this.width=24,this.height=8,this.type="fan",this.direction=i.direction||"right",this.pushStrength=i.pushStrength||250,this.windHeight=i.windHeight||120,this.soundRadius=i.soundRadius||250,this.state="off",this.onDuration=5,this.offDuration=5,this.timer=this.offDuration,this.isSoundPlaying=!1,this.onAnimation={frameCount:4,frameSpeed:.05,frameTimer:0,currentFrame:0},this.particleTimer=0}get hitbox(){const t=this.width,e=this.height;switch(this.direction){case"up":return{x:this.x-t/2,y:this.y-e/2-this.windHeight,width:t,height:this.windHeight};case"down":return{x:this.x-t/2,y:this.y+e/2,width:t,height:this.windHeight};case"left":return{x:this.x-e/2-this.windHeight,y:this.y-t/2,width:this.windHeight,height:t};case"right":default:return{x:this.x+e/2,y:this.y-t/2,width:this.windHeight,height:t}}}update(t,e,i){this.timer-=t,this.timer<=0&&(this.state==="off"?(this.state="on",this.timer=this.onDuration):(this.state="off",this.timer=this.offDuration)),this.state==="on"&&(this.onAnimation.frameTimer+=t,this.onAnimation.frameTimer>=this.onAnimation.frameSpeed&&(this.onAnimation.frameTimer=0,this.onAnimation.currentFrame=(this.onAnimation.currentFrame+1)%this.onAnimation.frameCount),this.particleTimer+=t,this.particleTimer>=.05&&(this.particleTimer=0,i.publish("createParticles",{x:this.x,y:this.y,type:"fan_push",direction:this.direction,particleSpeed:this.pushStrength*.75})));const s=this.isSoundPlaying;let n=!1;this.state==="on"&&e&&Math.sqrt(Math.pow(e.x-this.x,2)+Math.pow(e.y-this.y,2))<this.soundRadius&&(n=!0),n&&!s?(i.publish("startSoundLoop",{key:"fan_blowing",volume:.7,channel:"SFX"}),this.isSoundPlaying=!0):!n&&s&&(i.publish("stopSoundLoop",{key:"fan_blowing"}),this.isSoundPlaying=!1)}render(t,e,i){const s=this.state==="on"?e.fan_on:e.fan_off;if(!s||!i.isVisible(this.x-32,this.y-32,64,64))return;const n=this.state==="on"?this.onAnimation.currentFrame:0,a=this.state==="on"?this.onAnimation.frameCount:1,o=24,r=8,l=s.width/a,d=s.height;t.save(),t.translate(this.x,this.y);let u=0;switch(this.direction){case"up":u=0;break;case"left":u=-Math.PI/2;break;case"down":u=Math.PI;break;case"right":default:u=Math.PI/2;break}t.rotate(u),t.drawImage(s,n*l,0,l,d,-o/2,-r/2,o,r),t.restore()}onCollision(t){if(this.state!=="on")return;const e=t.entityManager.getComponent(t.entityId,b);if(!e)return;const{vel:i}=t;switch(this.direction==="up"||this.direction==="down"?e.vLock=!0:e.hLock=!0,this.direction){case"up":i.vy=-this.pushStrength;break;case"down":i.vy=this.pushStrength;break;case"left":i.vx=-this.pushStrength;break;case"right":i.vx=this.pushStrength;break}}reset(t){this.isSoundPlaying&&t.publish("stopSoundLoop",{key:"fan_blowing"}),this.state="off",this.timer=this.offDuration,this.isSoundPlaying=!1,this.onAnimation.currentFrame=0,this.onAnimation.frameTimer=0}}class He extends j{constructor(t,e,i){super(t,e,{...i,width:32,height:10}),this.solid=!0,this.initialX=t,this.initialY=e,this.state="idle",this.playerOnTimer=0,this.shakeTimer=0,this.respawnTimer=0,this.fallSpeed=0,this.opacity=1,this.shakeOffsetX=0,this.shakeOffsetY=0,this.bobbingTimer=Math.random()*Math.PI*2,this.bobbingAmplitude=Math.random()*5+5,this.PLAYER_ON_DURATION=.3,this.SHAKE_DURATION=.15,this.RESPAWN_DURATION=5,this.FALL_ACCELERATION=250,this.MAX_FALL_SPEED=600,this.animation={frameCount:4,frameSpeed:.1,frameTimer:0,currentFrame:0},this.particleTimer=0}_isPlayerOnTop(t){if(!t)return!1;const e=t.y+t.height,i=this.y-this.height/2;return t.x<this.x+this.width/2&&t.x+t.width>this.x-this.width/2&&Math.abs(e-i)<5}update(t,e,i){switch((this.state==="idle"||this.state==="active")&&(this.animation.frameTimer+=t,this.animation.frameTimer>=this.animation.frameSpeed&&(this.animation.frameTimer=0,this.animation.currentFrame=(this.animation.currentFrame+1)%this.animation.frameCount)),this.state){case"idle":this.bobbingTimer+=t*2,this.y=this.initialY+Math.sin(this.bobbingTimer)*this.bobbingAmplitude;break;case"active":if(this.playerOnTimer-=t,!this._isPlayerOnTop(e)){this.reset();return}this.playerOnTimer<=0&&(this.state="shaking",this.shakeTimer=this.SHAKE_DURATION,i.publish("playSound",{key:"falling_platform",volume:.7,channel:"SFX"}));break;case"shaking":this.shakeTimer-=t,this.shakeOffsetX=(Math.random()-.5)*4,this.shakeOffsetY=(Math.random()-.5)*2,this.shakeTimer<=0&&(this.state="falling",this.solid=!1,this.shakeOffsetX=0,this.shakeOffsetY=0);break;case"falling":this.fallSpeed=Math.min(this.MAX_FALL_SPEED,this.fallSpeed+this.FALL_ACCELERATION*t),this.y+=this.fallSpeed*t,this.opacity-=t*.5,this.particleTimer+=t,this.particleTimer>.05&&(this.particleTimer=0,i.publish("createParticles",{x:this.x,y:this.y-this.height/2,type:"walk_dust",particleSpeed:50})),this.opacity<=0&&(this.state="respawning",this.respawnTimer=this.RESPAWN_DURATION);break;case"respawning":this.respawnTimer-=t,this.respawnTimer<=0&&this.reset();break}}render(t,e,i){if(this.state==="respawning"||this.opacity<=0)return;const s=this.x-this.width/2+this.shakeOffsetX,n=this.y-this.height/2+this.shakeOffsetY;if(!i.isVisible(s,n,this.width,this.height))return;const a=this.state==="idle"||this.state==="active",o=a?e.falling_platform_on:e.falling_platform_off;if(o){if(t.globalAlpha=this.opacity,a){const r=o.width/this.animation.frameCount,l=this.animation.currentFrame*r;t.drawImage(o,l,0,r,o.height,s,n,this.width,this.height)}else t.drawImage(o,s,n,this.width,this.height);t.globalAlpha=1}}onLanded(){this.state==="idle"&&(this.state="active",this.playerOnTimer=this.PLAYER_ON_DURATION)}reset(){this.state="idle",this.x=this.initialX,this.y=this.initialY,this.opacity=1,this.fallSpeed=0,this.playerOnTimer=0,this.solid=!0,this.animation.currentFrame=0,this.animation.frameTimer=0,this.shakeOffsetX=0,this.shakeOffsetY=0}}class Ue extends j{constructor(t,e,i){super(t,e,{...i,width:42,height:42}),this.initialY=e,this.targetY=e,this.type="rock_head",this.state="idle",this.timers={blink:Math.random()*4+2,warning:.2,slammed:.4},this.velocities={slam:1200,retract:80},this.animations={blink:{frameCount:4,frameSpeed:.08,timer:0,frame:0},hit:{frameCount:4,frameSpeed:.1,timer:0,frame:0}},this.shakeOffset={x:0,y:0}}get detectionZone(){return{x:this.x-this.width/2,y:this.y+this.height/2,width:this.width,height:500}}get hitbox(){return{x:this.x-this.width/2,y:this.y-this.height/2,width:this.width,height:this.height}}isPlayerInZone(t,e){if(!t)return!1;const i=this.detectionZone,s={x:t.x,y:t.y,width:t.width,height:t.height};if(s.x+s.width<=i.x||s.x>=i.x+i.width||s.y<this.y)return!1;let n=this.y+this.height/2+i.height;const a=Math.floor((this.y+this.height/2)/v.TILE_SIZE),o=Math.floor(n/v.TILE_SIZE),r=Math.floor(i.x/v.TILE_SIZE),l=Math.floor((i.x+i.width)/v.TILE_SIZE);for(let u=a;u<=o;u++)for(let p=r;p<=l;p++){const m=e.getTileAt(p*v.TILE_SIZE,u*v.TILE_SIZE);if(m&&m.solid&&!m.oneWay){n=u*v.TILE_SIZE,u=o+1;break}}const d={x:i.x,y:this.y+this.height/2,width:i.width,height:n-(this.y+this.height/2)};return s.x<d.x+d.width&&s.x+s.width>d.x&&s.y<d.y+d.height&&s.y+s.height>d.y}update(t,e,i,s){this[`_update_${this.state}`]?.(t,e,i,s)}_update_idle(t,e,i,s){if(this.timers.blink-=t,this.timers.blink<=0){this.state="blinking",this.animations.blink.timer=0,this.animations.blink.frame=0;return}this.isPlayerInZone(e,s)&&(this.state="warning",this.timers.warning=.5)}_update_blinking(t){this.animations.blink.timer+=t,this.animations.blink.timer>=this.animations.blink.frameSpeed&&(this.animations.blink.timer=0,this.animations.blink.frame++,this.animations.blink.frame>=this.animations.blink.frameCount&&(this.state="idle",this.timers.blink=Math.random()*3+2))}_update_warning(t){this.timers.warning-=t,this.shakeOffset.x=(Math.random()-.5)*6,this.shakeOffset.y=(Math.random()-.5)*6,this.timers.warning<=0&&(this.state="slamming",this.shakeOffset={x:0,y:0})}_update_slamming(t,e,i,s){if(this.y+=this.velocities.slam*t,s.getTileAt(this.x,this.y+this.height/2).solid){this.y=Math.floor((this.y+this.height/2)/v.TILE_SIZE)*v.TILE_SIZE-this.height/2,this.state="slammed",this.timers.slammed=.4,this.animations.hit.frame=0,i.publish("playSound",{key:"rh_slam",volume:1.5,channel:"SFX"}),i.publish("cameraShakeRequested",{intensity:15,duration:.3}),i.publish("createParticles",{x:this.x,y:this.y+this.height/2,type:"walk_dust",particleSpeed:200}),i.publish("createParticles",{x:this.x,y:this.y+this.height/2,type:"sand",particleSpeed:200});return}if(e){const a={x:e.x,y:e.y,width:e.width,height:e.height};this._isRectColliding(this.hitbox,a)&&i.publish("collisionEvent",{type:"hazard",entityId:e.entityId,entityManager:e.entityManager,damage:1e3,knockback:{vx:0,vy:-100}})}}_update_slammed(t){this.timers.slammed-=t,this.animations.hit.timer+=t,this.animations.hit.timer>=this.animations.hit.frameSpeed&&(this.animations.hit.timer=0,this.animations.hit.frame=Math.min(this.animations.hit.frame+1,this.animations.hit.frameCount-1)),this.timers.slammed<=0&&(this.state="retracting")}_update_retracting(t){this.y-=this.velocities.retract*t,this.y<=this.initialY&&(this.y=this.initialY,this.state="idle",this.timers.blink=Math.random()*3+2)}render(t,e,i){const s=this.x-this.width/2+this.shakeOffset.x,n=this.y-this.height/2+this.shakeOffset.y;if(!i.isVisible(s,n,this.width,this.height))return;let a=e.rh_idle,o=0,r=this.width;this.state==="blinking"?(a=e.rh_blink,r=a.width/this.animations.blink.frameCount,o=this.animations.blink.frame*r):this.state==="slammed"&&(a=e.rh_bottom_hit,r=a.width/this.animations.hit.frameCount,o=this.animations.hit.frame*r),a&&t.drawImage(a,o,0,r,a.height,s,n,this.width,this.height)}_isRectColliding(t,e){return t.x<e.x+e.width&&t.x+t.width>e.x&&t.y<e.y+e.height&&t.y+t.height>e.y}reset(){this.y=this.initialY,this.state="idle",this.timers.blink=Math.random()*3+2,this.shakeOffset={x:0,y:0},this.animations.blink.frame=0,this.animations.hit.frame=0}}class Be extends j{constructor(t,e,i){super(t,e,{...i,width:54,height:52}),this.initialY=e,this.targetY=e,this.type="spike_head",this.state="idle",this.timers={blink:Math.random()*4+2,warning:.2,slammed:.4},this.velocities={slam:1200,retract:80},this.animations={blink:{frameCount:4,frameSpeed:.08,timer:0,frame:0},hit:{frameCount:4,frameSpeed:.1,timer:0,frame:0}},this.shakeOffset={x:0,y:0}}get detectionZone(){return{x:this.x-this.width/2,y:this.y+this.height/2,width:this.width,height:500}}get hitbox(){return{x:this.x-this.width/2,y:this.y-this.height/2,width:this.width,height:this.height}}isPlayerInZone(t,e){if(!t)return!1;const i=this.detectionZone,s={x:t.x,y:t.y,width:t.width,height:t.height};if(s.x+s.width<=i.x||s.x>=i.x+i.width||s.y<this.y)return!1;let n=this.y+this.height/2+i.height;const a=Math.floor((this.y+this.height/2)/v.TILE_SIZE),o=Math.floor(n/v.TILE_SIZE),r=Math.floor(i.x/v.TILE_SIZE),l=Math.floor((i.x+i.width)/v.TILE_SIZE);for(let u=a;u<=o;u++)for(let p=r;p<=l;p++){const m=e.getTileAt(p*v.TILE_SIZE,u*v.TILE_SIZE);if(m&&m.solid&&!m.oneWay){n=u*v.TILE_SIZE,u=o+1;break}}const d={x:i.x,y:this.y+this.height/2,width:i.width,height:n-(this.y+this.height/2)};return s.x<d.x+d.width&&s.x+s.width>d.x&&s.y<d.y+d.height&&s.y+s.height>d.y}update(t,e,i,s){this[`_update_${this.state}`]?.(t,e,i,s)}_update_idle(t,e,i,s){if(this.timers.blink-=t,this.timers.blink<=0){this.state="blinking",this.animations.blink.timer=0,this.animations.blink.frame=0;return}this.isPlayerInZone(e,s)&&(this.state="warning",this.timers.warning=.5)}_update_blinking(t){this.animations.blink.timer+=t,this.animations.blink.timer>=this.animations.blink.frameSpeed&&(this.animations.blink.timer=0,this.animations.blink.frame++,this.animations.blink.frame>=this.animations.blink.frameCount&&(this.state="idle",this.timers.blink=Math.random()*3+2))}_update_warning(t){this.timers.warning-=t,this.shakeOffset.x=(Math.random()-.5)*6,this.shakeOffset.y=(Math.random()-.5)*6,this.timers.warning<=0&&(this.state="slamming",this.shakeOffset={x:0,y:0})}_update_slamming(t,e,i,s){if(this.y+=this.velocities.slam*t,s.getTileAt(this.x,this.y+this.height/2).solid){this.y=Math.floor((this.y+this.height/2)/v.TILE_SIZE)*v.TILE_SIZE-this.height/2,this.state="slammed",this.timers.slammed=.4,this.animations.hit.frame=0,i.publish("playSound",{key:"sh_slam",volume:1.5,channel:"SFX"}),i.publish("cameraShakeRequested",{intensity:15,duration:.3}),i.publish("createParticles",{x:this.x,y:this.y+this.height/2,type:"walk_dust",particleSpeed:200}),i.publish("createParticles",{x:this.x,y:this.y+this.height/2,type:"sand",particleSpeed:200});return}if(e){const a={x:e.x,y:e.y,width:e.width,height:e.height};this._isRectColliding(this.hitbox,a)&&i.publish("collisionEvent",{type:"hazard",entityId:e.entityId,entityManager:e.entityManager,damage:1e3,knockback:{vx:0,vy:-100}})}}_update_slammed(t){this.timers.slammed-=t,this.animations.hit.timer+=t,this.animations.hit.timer>=this.animations.hit.frameSpeed&&(this.animations.hit.timer=0,this.animations.hit.frame=Math.min(this.animations.hit.frame+1,this.animations.hit.frameCount-1)),this.timers.slammed<=0&&(this.state="retracting")}_update_retracting(t){this.y-=this.velocities.retract*t,this.y<=this.initialY&&(this.y=this.initialY,this.state="idle",this.timers.blink=Math.random()*3+2)}render(t,e,i){const s=this.x-this.width/2+this.shakeOffset.x,n=this.y-this.height/2+this.shakeOffset.y;if(!i.isVisible(s,n,this.width,this.height))return;let a=e.sh_idle,o=0,r=this.width;this.state==="blinking"?(a=e.sh_blink,r=a.width/this.animations.blink.frameCount,o=this.animations.blink.frame*r):this.state==="slammed"&&(a=e.sh_bottom_hit,r=a.width/this.animations.hit.frameCount,o=this.animations.hit.frame*r),a&&t.drawImage(a,o,0,r,a.height,s,n,this.width,this.height)}_isRectColliding(t,e){return t.x<e.x+e.width&&t.x+t.width>e.x&&t.y<e.y+e.height&&t.y+t.height>e.y}reset(){this.y=this.initialY,this.state="idle",this.timers.blink=Math.random()*3+2,this.shakeOffset={x:0,y:0},this.animations.blink.frame=0,this.animations.hit.frame=0}}class Ne extends j{constructor(t,e,i){super(t,e,{...i,width:38,height:38}),this.type="saw",this.anchorX=t,this.anchorY=e,this.sawX=t,this.sawY=e,this.direction=i.direction||"horizontal",this.distance=i.distance||100,this.speed=i.speed||50,this.period=this.distance/this.speed*2,this.timer=0,this.animation={frameCount:8,frameSpeed:.05,frameTimer:0,currentFrame:0}}get hitbox(){return{x:this.sawX-this.width/2,y:this.sawY-this.height/2,width:this.width,height:this.height}}update(t){this.animation.frameTimer+=t,this.animation.frameTimer>=this.animation.frameSpeed&&(this.animation.frameTimer=0,this.animation.currentFrame=(this.animation.currentFrame+1)%this.animation.frameCount),this.timer+=t;const i=Math.sin(this.timer/this.period*2*Math.PI)*this.distance/2;this.direction==="horizontal"?(this.sawX=this.anchorX+i,this.sawY=this.anchorY):(this.sawX=this.anchorX,this.sawY=this.anchorY+i)}render(t,e,i){const s={x:0,y:0},n={x:0,y:0};if(this.direction==="horizontal"?(s.x=this.anchorX-this.distance/2,s.y=this.anchorY,n.x=this.anchorX+this.distance/2,n.y=this.anchorY):(s.x=this.anchorX,s.y=this.anchorY-this.distance/2,n.x=this.anchorX,n.y=this.anchorY+this.distance/2),!i.isVisible(Math.min(s.x,n.x),Math.min(s.y,n.y),this.distance,this.distance))return;const a=e.saw_chain;if(a){const l=n.x-s.x,d=n.y-s.y,u=Math.sqrt(l*l+d*d),p=Math.atan2(d,l);t.save(),t.translate(s.x,s.y),t.rotate(p);for(let m=0;m<u;m+=8)t.drawImage(a,m,-8/2,8,8);t.restore()}const o=e.saw;if(o){const r=o.width/this.animation.frameCount,l=this.animation.currentFrame*r;t.drawImage(o,l,0,r,o.height,this.sawX-this.width/2,this.sawY-this.height/2,this.width,this.height)}}onCollision(t,e){const i=t.pos.x+t.col.width/2,s=t.pos.y+t.col.height/2;let n=i-this.sawX,a=s-this.sawY;const o=Math.sqrt(n*n+a*a);o===0?(n=1,a=0):(n/=o,a/=o);const r=L.SAW_KNOCKBACK_BASE;e.publish("collisionEvent",{type:"hazard",entityId:t.entityId,entityManager:t.entityManager,damage:L.SAW_DAMAGE,knockback:{vx:n*r,vy:a*r+L.SAW_KNOCKBACK_Y_BOOST}})}reset(){this.timer=0,this.sawX=this.anchorX,this.sawY=this.anchorY}}class he extends j{constructor(t,e,i){super(t,e,{...i,width:16,height:16}),this.type="slime_puddle",this.solid=!1,this.lifespan=3,this.isExpired=!1,this.damageInterval=1,this.damageTimer=0}get hitbox(){return{x:this.x-this.width/2,y:this.y-this.height/2,width:this.width,height:this.height}}update(t){this.lifespan-=t,this.lifespan<=0&&(this.isExpired=!0),this.damageTimer>0&&(this.damageTimer-=t)}render(t,e,i){}onCollision(t,e){this.damageTimer<=0&&(this.damageTimer=this.damageInterval,e.publish("collisionEvent",{type:"hazard",entityId:t.entityId,entityManager:t.entityManager,damage:5,knockback:null}))}reset(){this.isExpired=!0}}class C{constructor(t="idle"){this.currentState=t}}function We(h,t,e,i,s={}){const n=$t[t];if(!n)return console.warn(`Attempted to create an unknown enemy type: "${t}"`),null;const a=h.createEntity(),o=n.ai.type==="hop"||n.ai.type==="defensive_cycle"||n.ai.type==="ground_charge"?"idle":"patrol",r=e-n.width/2,l=i-n.height/2;h.addComponent(a,new w(r,l)),h.addComponent(a,new E),h.addComponent(a,new C(o)),h.addComponent(a,new Mt);let d=r;n.ai.type==="patrol"&&(d=r-s.patrolDistance/2);const u={...n.ai,patrol:{startX:d,distance:s.patrolDistance||100,speed:n.ai.patrolSpeed||50}};h.addComponent(a,new P({type:t,ai:u})),h.addComponent(a,new V({...n.killable})),h.addComponent(a,new _({type:"solid",width:n.width,height:n.height}));let p;if(o==="idle")switch(t){case"slime":p="idle_run";break;case"turtle":p="idle2";break;default:p="idle";break}else t==="slime"?p="idle_run":p=n.spriteKey==="snail"?"walk":"run";return h.addComponent(a,new k({spriteKey:n.spriteKey,width:n.width,height:n.height,animationState:p,direction:s.startDirection||"right"})),a}const Ge={fire_trap:Pe,spike:$e,trampoline:Fe,spiked_ball:Oe,arrow_bubble:De,fan:je,falling_platform:He,rock_head:Ue,spike_head:Be,saw:Ne,slime_puddle:he};class le{constructor(t,e){this.name=t.name||"Unnamed Level",this.gridWidth=t.gridWidth,this.gridHeight=t.gridHeight,this.width=this.gridWidth*v.TILE_SIZE,this.height=this.gridHeight*v.TILE_SIZE,this.background=t.background||"background_blue",this.backgroundScroll=t.backgroundScroll||{x:0,y:15},this.startPosition={x:t.startPosition.x*v.TILE_SIZE,y:t.startPosition.y*v.TILE_SIZE},this.tiles=t.layout.map(i=>[...i].map(s=>Q[s]||Q[0])),this.spatialGrid=new re(this.width,this.height,v.TILE_SIZE*4),this.fruits=[],this.checkpoints=[],this.traps=[],this.trophy=null,this.initialEnemyConfigs=t.enemies||[],c.subscribe("createSlimePuddle",i=>this.addSlimePuddle(i)),(t.objects||[]).forEach(i=>{const s=i.x*v.TILE_SIZE,n=i.y*v.TILE_SIZE,a=Ge[i.type];if(a){const o=new a(s,n,i);this.traps.push(o)}else if(i.type.startsWith("fruit_")){const o={x:s,y:n,size:28,spriteKey:i.type,frame:0,frameCount:17,frameSpeed:.07,frameTimer:0,collected:!1,type:"fruit"};this.fruits.push(o)}else if(i.type==="checkpoint"){const o={x:s,y:n,size:64,state:"inactive",frame:0,frameCount:26,frameSpeed:.07,frameTimer:0,type:"checkpoint"};this.checkpoints.push(o)}else i.type==="trophy"&&(this.trophy={x:s,y:n,size:64,frameCount:8,animationFrame:0,animationTimer:0,animationSpeed:.07,acquired:!1,inactive:!0,contactMade:!1,isAnimating:!1,type:"trophy"})}),e&&this.resetEnemies(e),this._populateSpatialGrid(),this.totalFruitCount=this.fruits.length,this.collectedFruitCount=0,this.completed=!1}addSlimePuddle(t){const e=new he(t.x,t.y,{});this.traps.push(e);const i={...e.hitbox,instance:e,type:"trap"};e.gridObject=i,this.spatialGrid.insert(i)}_populateSpatialGrid(){this.spatialGrid.clear(),this.traps.forEach(t=>{const e={...t.hitbox||{x:t.x,y:t.y,width:1,height:1},instance:t,type:"trap"};t.gridObject=e,this.spatialGrid.insert(e)}),this.fruits.forEach(t=>this.spatialGrid.insert({x:t.x-14,y:t.y-14,width:28,height:28,instance:t,type:"fruit"})),this.checkpoints.forEach(t=>this.spatialGrid.insert({x:t.x-32,y:t.y-32,width:64,height:64,instance:t,type:"checkpoint"})),this.trophy&&this.spatialGrid.insert({x:this.trophy.x-32,y:this.trophy.y-32,width:64,height:64,instance:this.trophy,type:"trophy"})}getTileAt(t,e){const i=Math.floor(t/v.TILE_SIZE),s=Math.floor(e/v.TILE_SIZE);return i<0||i>=this.gridWidth?Q[0]:s<0?Q[1]:s>=this.gridHeight||!this.tiles[s]?Q[0]:this.tiles[s][i]||Q[0]}update(t,e,i,s,n){const a=e.getComponent(i,w),o=e.getComponent(i,_),r=a&&o?{...a,width:o.width,height:o.height}:null;for(const u of this.traps)u.update(t,r,s,this);const l=[];this.traps=this.traps.filter(u=>u.isExpired&&u.gridObject?(l.push(u.gridObject),!1):!0),l.length>0&&this.spatialGrid.removeObjects(l);const d=this.spatialGrid.query(n.getViewportBounds());for(const u of d)if(u.instance){const p=u.instance;switch(u.type){case"fruit":this._updateSingleFruit(p,t);break;case"checkpoint":this._updateSingleCheckpoint(p,t);break;case"trophy":this._updateSingleTrophy(p,t);break}}}_updateSingleCheckpoint(t,e){t.state==="activating"&&(t.frameTimer+=e,t.frameTimer>=t.frameSpeed&&(t.frameTimer-=t.frameSpeed,t.frame++,t.frame>=t.frameCount&&(t.frame=0,t.state="active")))}_updateSingleFruit(t,e){t.collected||(t.frameTimer+=e,t.frameTimer>=t.frameSpeed&&(t.frameTimer-=t.frameSpeed,t.frame=(t.frame+1)%t.frameCount))}_updateSingleTrophy(t,e){!t||!t.isAnimating||t.acquired||(t.animationTimer+=e,t.animationTimer>=t.animationSpeed&&(t.animationTimer-=t.animationSpeed,t.animationFrame=t.animationFrame+1,t.animationFrame>=t.frameCount&&(t.animationFrame=t.frameCount-1,t.isAnimating=!1,t.acquired=!0)))}getInactiveCheckpoints(){return this.checkpoints.filter(t=>t.state==="inactive")}collectFruit(t){t.collected||(t.collected=!0,this.collectedFruitCount++,this.trophy&&this.allFruitsCollected()&&(this.trophy.inactive=!1))}getActiveFruits(){return this.fruits.filter(t=>!t.collected)}getFruitCount(){return this.collectedFruitCount}getTotalFruitCount(){return this.totalFruitCount}allFruitsCollected(){return this.collectedFruitCount===this.totalFruitCount}recalculateCollectedFruits(){this.collectedFruitCount=this.fruits.reduce((t,e)=>t+(e.collected?1:0),0)}isCompleted(){return this.fruits.length&&!this.allFruitsCollected()?!1:!this.trophy||this.trophy.acquired}resetEnemies(t){const e=t.query([P]);for(const i of e)t.destroyEntity(i);this.initialEnemyConfigs.forEach(i=>{const s=i.x*v.TILE_SIZE,n=i.y*v.TILE_SIZE;We(t,i.type,s,n,i)})}reset(){this.fruits.forEach(t=>{t.collected=!1,t.frame=0,t.frameTimer=0}),this.collectedFruitCount=0,this.checkpoints.forEach(t=>{t.state="inactive",t.frame=0,t.frameTimer=0}),this.traps.forEach(t=>{t.reset(c)}),this.trophy&&(this.trophy.acquired=!1,this.trophy.inactive=!0,this.trophy.isAnimating=!1,this.trophy.animationFrame=0,this.trophy.animationTimer=0),this._populateSpatialGrid(),this.completed=!1}}class Xe{constructor(t){this.gameState=t,this.levelSections=F,c.subscribe("requestNextLevel",()=>this.goToNextLevel()),c.subscribe("requestPreviousLevel",()=>this.goToPreviousLevel()),c.subscribe("gameStateUpdated",e=>this.gameState=e)}getLevelData(t,e){return t>=this.levelSections.length||e>=this.levelSections[t].levels.length?(console.error(`Invalid level index: Section ${t}, Level ${e}`),null):this.levelSections[t].levels[e]}loadLevel(t,e){const i=this.getLevelData(t,e);return i?(this.gameState.currentSection=t,this.gameState.currentLevelIndex=e,new le(i)):(console.error(`Failed to load level data for Section ${t}, Level ${e}.`),null)}hasNextLevel(){const{currentSection:t,currentLevelIndex:e}=this.gameState,i=e+1<this.levelSections[t].levels.length,s=t+1<this.levelSections.length;return i||s}hasPreviousLevel(){const{currentSection:t,currentLevelIndex:e}=this.gameState;return e>0||t>0}goToNextLevel(){if(!this.hasNextLevel())return;let{currentSection:t,currentLevelIndex:e}=this.gameState;e+1<this.levelSections[t].levels.length?e++:t+1<this.levelSections.length&&(t++,e=0),c.publish("requestLevelLoad",{sectionIndex:t,levelIndex:e})}goToPreviousLevel(){if(!this.hasPreviousLevel())return;let{currentSection:t,currentLevelIndex:e}=this.gameState;e>0?e--:t>0&&(t--,e=this.levelSections[t].levels.length-1),c.publish("requestLevelLoad",{sectionIndex:t,levelIndex:e})}}const ze=`#version 300 es\r
\r
// Per-vertex attributes\r
layout(location = 0) in vec2 a_quad_vertex; // The corner of the particle quad (e.g., [-0.5, 0.5])\r
layout(location = 1) in vec2 a_tex_coord;     // Texture coordinate for this vertex\r
\r
// Per-instance attributes (one set of values for each particle)\r
layout(location = 2) in vec2 a_particle_position; // World position of the particle's center\r
layout(location = 3) in float a_particle_size;\r
layout(location = 4) in float a_particle_alpha;\r
layout(location = 5) in vec4 a_tex_info; // x_off, y_off, x_scale, y_scale\r
\r
// Uniforms (global for all particles in a draw call)\r
uniform mat4 u_projection;\r
\r
// Outputs to the fragment shader\r
out vec2 v_texCoord;\r
out float v_alpha;\r
\r
void main() {\r
    // Calculate the final vertex position in world space\r
    vec2 pos = a_quad_vertex * a_particle_size + a_particle_position;\r
\r
    // Apply the camera's projection matrix\r
    gl_Position = u_projection * vec4(pos, 0.0, 1.0);\r
\r
    // Calculate the texture coordinate for the specific animation frame\r
    v_texCoord = a_tex_coord * a_tex_info.zw + a_tex_info.xy;\r
\r
    // Pass alpha to the fragment shader\r
    v_alpha = a_particle_alpha;\r
}`,Ye=`#version 300 es\r
precision mediump float;\r
\r
uniform sampler2D u_texture;\r
\r
in vec2 v_texCoord;\r
in float v_alpha;\r
\r
out vec4 outColor;\r
\r
void main() {\r
  vec4 texColor = texture(u_texture, v_texCoord);\r
  \r
  // Discard fully transparent pixels from the texture to create non-rectangular shapes\r
  if (texColor.a < 0.1) {\r
    discard;\r
  }\r
  \r
  outColor = vec4(texColor.rgb, texColor.a * v_alpha);\r
}`;class Ke{constructor(t,e){this.gl=t,this.assets=e,this.activeParticles=[],this.inactivePool=[],this.poolSize=500;for(let i=0;i<this.poolSize;i++)this.inactivePool.push({});this._setupWebGLResources(),c.subscribe("createParticles",i=>this.create(i))}_compileShader(t,e){const i=this.gl,s=i.createShader(e);return i.shaderSource(s,t),i.compileShader(s),i.getShaderParameter(s,i.COMPILE_STATUS)?s:(console.error("An error occurred compiling the shaders: "+i.getShaderInfoLog(s)),i.deleteShader(s),null)}_createProgram(t,e){const i=this.gl,s=this._compileShader(t,i.VERTEX_SHADER),n=this._compileShader(e,i.FRAGMENT_SHADER),a=i.createProgram();return i.attachShader(a,s),i.attachShader(a,n),i.linkProgram(a),i.getProgramParameter(a,i.LINK_STATUS)?a:(console.error("Unable to initialize the shader program: "+i.getProgramInfoLog(a)),null)}_setupWebGLResources(){const t=this.gl;this.program=this._createProgram(ze,Ye),this.uniformLocations={projection:t.getUniformLocation(this.program,"u_projection"),texture:t.getUniformLocation(this.program,"u_texture")};const e=new Float32Array([-.5,-.5,.5,-.5,-.5,.5,.5,.5]),i=new Float32Array([0,1,1,1,0,0,1,0]);this.quadBuffer=t.createBuffer(),t.bindBuffer(t.ARRAY_BUFFER,this.quadBuffer),t.bufferData(t.ARRAY_BUFFER,e,t.STATIC_DRAW),this.texCoordBuffer=t.createBuffer(),t.bindBuffer(t.ARRAY_BUFFER,this.texCoordBuffer),t.bufferData(t.ARRAY_BUFFER,i,t.STATIC_DRAW),this.particleBuffer=t.createBuffer(),t.bindBuffer(t.ARRAY_BUFFER,this.particleBuffer);const s=8*Float32Array.BYTES_PER_ELEMENT;t.bufferData(t.ARRAY_BUFFER,this.poolSize*s,t.DYNAMIC_DRAW),this.vao=t.createVertexArray(),t.bindVertexArray(this.vao),t.bindBuffer(t.ARRAY_BUFFER,this.quadBuffer),t.enableVertexAttribArray(0),t.vertexAttribPointer(0,2,t.FLOAT,!1,0,0),t.bindBuffer(t.ARRAY_BUFFER,this.texCoordBuffer),t.enableVertexAttribArray(1),t.vertexAttribPointer(1,2,t.FLOAT,!1,0,0),t.bindBuffer(t.ARRAY_BUFFER,this.particleBuffer);const n=32;t.enableVertexAttribArray(2),t.vertexAttribPointer(2,2,t.FLOAT,!1,n,0),t.vertexAttribDivisor(2,1),t.enableVertexAttribArray(3),t.vertexAttribPointer(3,1,t.FLOAT,!1,n,8),t.vertexAttribDivisor(3,1),t.enableVertexAttribArray(4),t.vertexAttribPointer(4,1,t.FLOAT,!1,n,12),t.vertexAttribDivisor(4,1),t.enableVertexAttribArray(5),t.vertexAttribPointer(5,4,t.FLOAT,!1,n,16),t.vertexAttribDivisor(5,1),t.bindVertexArray(null),t.bindBuffer(t.ARRAY_BUFFER,null),this.textures={};const a=["dust_particle","sand_particle","mud_particle","ice_particle","slime_particles","snail_die"];for(const o of a)this.assets[o]&&(this.textures[o]=this._createTexture(this.assets[o]))}_createTexture(t){const e=this.gl,i=e.createTexture();return e.bindTexture(e.TEXTURE_2D,i),e.texImage2D(e.TEXTURE_2D,0,e.RGBA,e.RGBA,e.UNSIGNED_BYTE,t),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_MIN_FILTER,e.NEAREST),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_MAG_FILTER,e.NEAREST),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_WRAP_S,e.CLAMP_TO_EDGE),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_WRAP_T,e.CLAMP_TO_EDGE),i}create({x:t,y:e,type:i,direction:s="right",particleSpeed:n=null}){const o={dash:{count:10,baseSpeed:150,spriteKey:"dust_particle",life:.4,gravity:50},double_jump:{count:7,baseSpeed:100,spriteKey:"dust_particle",life:.4,gravity:50},sand:{count:2,baseSpeed:20,spriteKey:"sand_particle",life:.5,gravity:120},mud:{count:2,baseSpeed:15,spriteKey:"mud_particle",life:.6,gravity:100},ice:{count:2,baseSpeed:25,spriteKey:"ice_particle",life:.4,gravity:20},walk_dust:{count:1,baseSpeed:15,spriteKey:"dust_particle",life:.4,gravity:80},jump_trail:{count:1,baseSpeed:10,spriteKey:"dust_particle",life:.3,gravity:20},fan_push:{count:2,baseSpeed:120,spriteKey:"dust_particle",life:.7,gravity:0},enemy_death:{count:15,baseSpeed:100,spriteKey:"dust_particle",life:.6,gravity:150},slime_puddle:{count:1,baseSpeed:0,spriteKey:"slime_particles",life:4,gravity:0,animation:{frameCount:4,frameSpeed:.2}},snail_flee:{count:1,baseSpeed:250,spriteKey:"snail_die",life:1.5,gravity:800,size:38}}[i];if(o)for(let r=0;r<o.count&&this.inactivePool.length!==0;r++){const l=this.inactivePool.pop();let d,p=(n||o.baseSpeed)*(.8+Math.random()*.4);if(i==="enemy_death")d=Math.random()*Math.PI*2;else if(i==="dash")d=(s==="right"?Math.PI:0)+(Math.random()-.5)*(Math.PI/2);else if(i==="double_jump")d=Math.PI/2+(Math.random()-.5)*(Math.PI/3);else if(i==="jump_trail")d=Math.random()*Math.PI*2,p*=Math.random()*.5;else if(i==="fan_push"){let m=0;switch(s){case"up":m=-Math.PI/2;break;case"left":m=Math.PI;break;case"down":m=Math.PI/2;break;case"right":default:m=0;break}d=m+(Math.random()-.5)*(Math.PI/6)}else i==="snail_flee"?d=-Math.PI/2+(Math.random()-.5)*(Math.PI/4):d=-(Math.PI/2)+(Math.random()-.5)*(Math.PI/4);l.x=t,l.y=e,l.vx=Math.cos(d)*p,l.vy=Math.sin(d)*p,l.life=o.life+Math.random()*.3,l.size=o.size||(i==="slime_puddle"?16:5+Math.random()*4),l.alpha=1,l.spriteKey=o.spriteKey,l.gravity=o.gravity,l.animation=o.animation?{...o.animation,frameTimer:0,currentFrame:0}:null,this.activeParticles.push(l)}}update(t){for(let e=this.activeParticles.length-1;e>=0;e--){const i=this.activeParticles[e];if(i.life-=t,i.life<=0){const s=this.activeParticles.pop();e<this.activeParticles.length&&(this.activeParticles[e]=s),this.inactivePool.push(i)}else i.x+=i.vx*t,i.y+=i.vy*t,i.vy+=i.gravity*t,i.alpha=Math.min(1,i.life/1.5),i.animation&&(i.animation.frameTimer+=t,i.animation.frameTimer>=i.animation.frameSpeed&&(i.animation.frameTimer=0,i.animation.currentFrame=(i.animation.currentFrame+1)%i.animation.frameCount))}}render(t){const e=this.gl;if(this.activeParticles.length===0)return;e.viewport(0,0,e.canvas.width,e.canvas.height),e.useProgram(this.program),e.bindVertexArray(this.vao),e.uniformMatrix4fv(this.uniformLocations.projection,!1,t.getProjectionMatrix()),e.activeTexture(e.TEXTURE0),e.uniform1i(this.uniformLocations.texture,0),e.enable(e.BLEND),e.blendFunc(e.SRC_ALPHA,e.ONE_MINUS_SRC_ALPHA);const i={};for(const n of this.activeParticles)i[n.spriteKey]||(i[n.spriteKey]=[]),i[n.spriteKey].push(n);const s=8;for(const n in i){const a=i[n],o=a.length;if(o===0)continue;const r=new Float32Array(o*s);for(let l=0;l<o;l++){const d=a[l],u=l*s;r[u]=d.x,r[u+1]=d.y,r[u+2]=d.size,r[u+3]=d.alpha,d.animation?(r[u+4]=d.animation.currentFrame/d.animation.frameCount,r[u+5]=0,r[u+6]=1/d.animation.frameCount,r[u+7]=1):(r[u+4]=0,r[u+5]=0,r[u+6]=1,r[u+7]=1)}e.bindTexture(e.TEXTURE_2D,this.textures[n]),e.bindBuffer(e.ARRAY_BUFFER,this.particleBuffer),e.bufferSubData(e.ARRAY_BUFFER,0,r),e.drawArraysInstanced(e.TRIANGLE_STRIP,0,4,o)}e.bindVertexArray(null),e.disable(e.BLEND)}reset(){for(let t=this.activeParticles.length-1;t>=0;t--){const e=this.activeParticles.pop();this.inactivePool.push(e)}}}class Ve{constructor(t,e){this.canvas=t,this.assets=e,this.hoveredButton=null;const i=64,s=20,n=20,a=10,o=this.canvas.width-i-s;this.uiButtons=[{id:"settings",x:o,y:n+(i+a)*0,width:i,height:i,assetKey:"settings_icon",visible:!1},{id:"pause",x:o,y:n+(i+a)*1,width:i,height:i,assetKey:"pause_icon",visible:!1},{id:"levels",x:o,y:n+(i+a)*2,width:i,height:i,assetKey:"levels_icon",visible:!1},{id:"character",x:o,y:n+(i+a)*3,width:i,height:i,assetKey:"character_icon",visible:!1},{id:"info",x:o,y:n+(i+a)*4,width:i,height:i,assetKey:"info_icon",visible:!1}],this.canvas.addEventListener("mousemove",r=>this.handleMouseMove(r)),this.canvas.addEventListener("click",r=>this.handleCanvasClick(r)),c.subscribe("gameStarted",()=>this.uiButtons.forEach(r=>r.visible=!0))}_getMousePos(t){const e=this.canvas.getBoundingClientRect(),i=this.canvas.width/e.width,s=this.canvas.height/e.height;return{x:(t.clientX-e.left)*i,y:(t.clientY-e.top)*s}}handleMouseMove(t){const{x:e,y:i}=this._getMousePos(t);this.hoveredButton=null;for(const s of this.uiButtons)if(s.visible&&e>=s.x&&e<=s.x+s.width&&i>=s.y&&i<=s.y+s.height){this.hoveredButton=s;break}}handleCanvasClick(t){this.hoveredButton&&(c.publish("playSound",{key:"button_click",volume:.8,channel:"UI"}),c.publish("ui_button_clicked",{buttonId:this.hoveredButton.id}))}update(){}render(t,e){t.save(),t.setTransform(1,0,0,1,0,0);for(const i of this.uiButtons){if(!i.visible)continue;const s=i.id==="pause"?e?"pause_icon":"play_icon":i.assetKey,n=this.assets[s];if(!n)continue;const a=this.hoveredButton?.id===i.id,o=a?1.1:1,r=i.width*o,l=i.height*o,d=i.x-(r-i.width)/2,u=i.y-(l-i.height)/2;t.globalAlpha=a?1:.8,t.drawImage(n,d,u,r,l)}t.restore()}}class Xt{constructor(){this.nextEntityId=0,this.entities=new Set,this.componentsByClass=new Map}createEntity(){const t=this.nextEntityId++;return this.entities.add(t),t}addComponent(t,e){const i=e.constructor;return this.componentsByClass.has(i)||this.componentsByClass.set(i,new Map),this.componentsByClass.get(i).set(t,e),this}getComponent(t,e){const i=this.componentsByClass.get(e);return i?i.get(t):void 0}hasComponent(t,e){const i=this.componentsByClass.get(e);return i?i.has(t):!1}removeComponent(t,e){const i=this.componentsByClass.get(e);i&&i.delete(t)}destroyEntity(t){for(const e of this.componentsByClass.values())e.delete(t);this.entities.delete(t)}query(t){const e=[];for(const i of this.entities)t.every(s=>this.hasComponent(i,s))&&e.push(i);return e}}class G{constructor(){this.moveLeft=!1,this.moveRight=!1,this.jump=!1,this.dash=!1,this.jumpPressedThisFrame=!1,this.dashPressedThisFrame=!1}}class lt{constructor(t=100,e=100){this.maxHealth=t,this.currentHealth=e}}function qe(h,t,e,i){const s=h.createEntity(),n=t-y.WIDTH/2,a=e-y.HEIGHT/2;return h.addComponent(s,new w(n,a)),h.addComponent(s,new E),h.addComponent(s,new Pt(i)),h.addComponent(s,new k({spriteKey:null,width:y.SPAWN_WIDTH,height:y.SPAWN_HEIGHT,animationState:"spawn"})),h.addComponent(s,new b),h.addComponent(s,new _({type:"dynamic",solid:!0,width:y.WIDTH,height:y.HEIGHT})),h.addComponent(s,new G),h.addComponent(s,new C("spawn")),h.addComponent(s,new lt),h.addComponent(s,new Mt),s}class Ze{constructor(t){this.entityManager=t,this.keys=new Set,this.queue=[],this.initEventListeners()}initEventListeners(){window.addEventListener("keydown",this.handleKeyDown.bind(this)),window.addEventListener("keyup",this.handleKeyUp.bind(this)),window.addEventListener("contextmenu",t=>t.preventDefault())}handleKeyDown(t){const e=t.key.toLowerCase();this.keys.has(e)||this.queue.push({key:e,type:"down"}),this.keys.add(e);const i={enter:"confirm",r:"restart",n:"next",p:"previous",escape:"escape_pressed"};e===" "&&c.publish("action_confirm_pressed");const s=i[e];s&&c.publish(`action_${s}`)}handleKeyUp(t){const e=t.key.toLowerCase();this.keys.delete(e),this.queue.push({key:e,type:"up"})}update(t,{keybinds:e,isRunning:i,gameState:s}){const n=i&&!s.showingLevelComplete,a=this.entityManager.query([b,G]);for(const o of a){const r=this.entityManager.getComponent(o,G);r.moveLeft=n&&this.keys.has(e.moveLeft),r.moveRight=n&&this.keys.has(e.moveRight),r.jump=n&&this.keys.has(e.jump),r.dash=n&&this.keys.has(e.dash),r.jumpPressedThisFrame=!1,r.dashPressedThisFrame=!1}if(n){for(const o of this.queue)if(o.type==="down")for(const r of a){const l=this.entityManager.getComponent(r,G);o.key===e.jump&&(l.jumpPressedThisFrame=!0),o.key===e.dash&&(l.dashPressedThisFrame=!0)}}this.queue=[]}}class Je{constructor(){c.subscribe("collisionEvent",t=>this.handleCollision(t)),c.subscribe("playerLandedHard",t=>this.handlePlayerLandedHard(t))}handlePlayerLandedHard({entityId:t,landingVelocity:e}){const{FALL_DAMAGE_MIN_VELOCITY:i,FALL_DAMAGE_MAX_VELOCITY:s,FALL_DAMAGE_MIN_AMOUNT:n,FALL_DAMAGE_MAX_AMOUNT:a}=y,r=(Math.max(i,Math.min(e,s))-i)/(s-i),l=Math.round(n+r*(a-n));c.publish("playerTookDamage",{amount:l,source:"fall"})}handleCollision({type:t,entityId:e,target:i,entityManager:s,damage:n,knockback:a}){if(s.getComponent(e,b))switch(t){case"fruit":c.publish("fruitCollected",i);break;case"world_bottom":c.publish("playerDied");break;case"hazard":const r=n!==void 0?n:L.DEFAULT_HAZARD_DAMAGE;r>0&&c.publish("playerTookDamage",{amount:r,source:"hazard"}),a&&c.publish("playerKnockback",{entityId:e,entityManager:s,vx:a.vx,vy:a.vy});break;case"checkpoint":c.publish("checkpointActivated",i);break}}update(t,e){}}class N{constructor(t,e){this.entityId=t,this.entityManager=e}enter(){}update(t){return null}exit(){}}class Qe extends N{enter(){const t=this.entityManager.getComponent(this.entityId,C),e=this.entityManager.getComponent(this.entityId,k),i=this.entityManager.getComponent(this.entityId,b);t.currentState="cling",e.animationState="cling",e.animationFrame=0,e.animationTimer=0,i.jumpCount=1}update(t){const e=this.entityManager.getComponent(this.entityId,_);return!e.isAgainstWall||e.isGrounded?new Z(this.entityId,this.entityManager):null}}class Z extends N{enter(){const t=this.entityManager.getComponent(this.entityId,C),e=this.entityManager.getComponent(this.entityId,k);t.currentState="fall",e.animationState="fall",e.animationFrame=0,e.animationTimer=0}update(t){const e=this.entityManager.getComponent(this.entityId,_),i=this.entityManager.getComponent(this.entityId,E),s=this.entityManager.getComponent(this.entityId,b);return e.isGrounded?Math.abs(i.vx)>1?new ce(this.entityId,this.entityManager):new Ft(this.entityId,this.entityManager):e.isAgainstWall&&s.coyoteTimer<=0&&i.vy>=0?new Qe(this.entityId,this.entityManager):null}}class ce extends N{enter(){const t=this.entityManager.getComponent(this.entityId,C),e=this.entityManager.getComponent(this.entityId,k),i=this.entityManager.getComponent(this.entityId,b);t.currentState="run",e.animationState="run",e.animationFrame=0,e.animationTimer=0,i.jumpCount=0}update(t){const e=this.entityManager.getComponent(this.entityId,_),i=this.entityManager.getComponent(this.entityId,E);return Math.abs(i.vx)<1?new Ft(this.entityId,this.entityManager):e.isGrounded?null:new Z(this.entityId,this.entityManager)}}class Ft extends N{enter(){const t=this.entityManager.getComponent(this.entityId,C),e=this.entityManager.getComponent(this.entityId,k),i=this.entityManager.getComponent(this.entityId,b);t.currentState="idle",e.animationState="idle",e.animationFrame=0,e.animationTimer=0,i.jumpCount=0}update(t){const e=this.entityManager.getComponent(this.entityId,G),i=this.entityManager.getComponent(this.entityId,_);return e.moveLeft||e.moveRight?new ce(this.entityId,this.entityManager):i.isGrounded?null:new Z(this.entityId,this.entityManager)}}class ti extends N{enter(){const t=this.entityManager.getComponent(this.entityId,k),e=this.entityManager.getComponent(this.entityId,C),i=this.entityManager.getComponent(this.entityId,b);e.currentState="spawn",t.animationState="spawn",i.isSpawning=!0}update(t){return this.entityManager.getComponent(this.entityId,b).spawnComplete?new Ft(this.entityId,this.entityManager):null}}class zt extends N{enter(){const t=this.entityManager.getComponent(this.entityId,C),e=this.entityManager.getComponent(this.entityId,k);t.currentState="jump",e.animationState="jump",e.animationFrame=0,e.animationTimer=0}update(t){return this.entityManager.getComponent(this.entityId,E).vy>0?new Z(this.entityId,this.entityManager):null}}class ei extends N{enter(){const t=this.entityManager.getComponent(this.entityId,C),e=this.entityManager.getComponent(this.entityId,k);t.currentState="double_jump",e.animationState="double_jump",e.animationFrame=0,e.animationTimer=0}update(t){return this.entityManager.getComponent(this.entityId,E).vy>0?new Z(this.entityId,this.entityManager):null}}class ii extends N{enter(){const t=this.entityManager.getComponent(this.entityId,C),e=this.entityManager.getComponent(this.entityId,k);t.currentState="dash",e.animationState="dash",e.animationFrame=0,e.animationTimer=0}update(t){return this.entityManager.getComponent(this.entityId,b).isDashing?null:new Z(this.entityId,this.entityManager)}}class si extends N{enter(){const t=this.entityManager.getComponent(this.entityId,C),e=this.entityManager.getComponent(this.entityId,k);t.currentState="hit",e.animationState="hit",e.animationFrame=0,e.animationTimer=0}update(t){return this.entityManager.getComponent(this.entityId,b).isHit?null:new Z(this.entityId,this.entityManager)}}class ni{constructor(){c.subscribe("playerTookDamage",t=>this.handleDamageTaken(t)),c.subscribe("playerRespawned",()=>{this.clearDamageEvents(),this.clearKnockbackEvents(),this.clearStompEvents()}),c.subscribe("playerKnockback",t=>this.handleKnockback(t)),c.subscribe("enemyStomped",t=>this.handleEnemyStomped(t)),this.damageEvents=[],this.knockbackEvents=[],this.stompEvents=[]}clearDamageEvents(){this.damageEvents=[]}clearKnockbackEvents(){this.knockbackEvents=[]}clearStompEvents(){this.stompEvents=[]}handleDamageTaken(t){this.damageEvents.push(t)}handleKnockback(t){this.knockbackEvents.push(t)}handleEnemyStomped(t){this.stompEvents.push(t)}_transitionTo(t,e,i){const s=i.getComponent(t,b);s.currentState&&s.currentState.exit(),s.currentState=e,s.currentState.enter()}update(t,{entityManager:e}){this._processDamageEvents(e),this._processKnockbackEvents(e),this._processStompEvents(e);const i=e.query([b,C]);for(const s of i){const n=e.getComponent(s,b);if(n.currentState||this._transitionTo(s,new ti(s,e),e),this._updateTimers(t,n),this._handleGlobalInputLogic(s,e),n.currentState){const a=n.currentState.update(t);a&&this._transitionTo(s,a,e)}this._updateAnimation(t,s,e),this._handleJumpTrail(t,s,e),e.getComponent(s,_).isGrounded&&(n.coyoteTimer=y.COYOTE_TIME)}}_processDamageEvents(t){if(this.damageEvents.length===0)return;const e=t.query([b]);for(const i of e){const s=t.getComponent(i,b);s.isHit||s.isSpawning||(s.isHit=!0,s.hitStunTimer=y.HIT_STUN_DURATION,this._transitionTo(i,new si(i,t),t),c.publish("playSound",{key:"hit",volume:.5,channel:"SFX"}))}this.damageEvents=[]}_processKnockbackEvents(t){if(this.knockbackEvents.length!==0){for(const e of this.knockbackEvents){const{entityId:i,vx:s,vy:n}=e,a=t.getComponent(i,E);a&&(a.vx=s,a.vy=n)}this.knockbackEvents=[]}}_processStompEvents(t){if(this.stompEvents.length===0)return;const e=t.query([b,E]);for(const i of this.stompEvents)for(const s of e){const n=t.getComponent(s,E),a=t.getComponent(s,b);n.vy=-i.stompBounceVelocity,a.jumpCount=1}this.stompEvents=[]}_updateTimers(t,e){e.jumpBufferTimer>0&&(e.jumpBufferTimer-=t),e.coyoteTimer>0&&(e.coyoteTimer-=t),e.dashCooldownTimer>0&&(e.dashCooldownTimer-=t),e.isHit&&(e.hitStunTimer-=t,e.hitStunTimer<=0&&(e.isHit=!1)),e.isDashing&&(e.dashTimer-=t,e.dashTimer<=0&&(e.isDashing=!1))}_handleGlobalInputLogic(t,e){const i=e.getComponent(t,G),s=e.getComponent(t,b),n=e.getComponent(t,k),a=e.getComponent(t,E),o=e.getComponent(t,_),r=e.getComponent(t,w);if(!(s.isSpawning||s.isDashing||s.isDespawning||s.isHit)){if(i.moveLeft?n.direction="left":i.moveRight&&(n.direction="right"),!s.vLock){i.jump&&(s.jumpBufferTimer=y.JUMP_BUFFER_TIME);const l=i.jumpPressedThisFrame;s.jumpBufferTimer>0&&(o.isGrounded||s.coyoteTimer>0)&&s.jumpCount===0?(a.vy=-s.jumpForce*(o.groundType==="mud"?y.MUD_JUMP_MULTIPLIER:1),s.jumpCount=1,s.jumpBufferTimer=0,s.coyoteTimer=0,c.publish("playSound",{key:"jump",volume:.8,channel:"SFX"}),this._transitionTo(t,new zt(t,e),e)):l&&o.isAgainstWall&&!o.isGrounded?(a.vx=(n.direction==="left"?1:-1)*s.speed,n.direction=n.direction==="left"?"right":"left",a.vy=-s.jumpForce,this._transitionTo(t,new zt(t,e),e),c.publish("playSound",{key:"jump",volume:.8,channel:"SFX"})):l&&s.jumpCount===1&&!o.isGrounded&&!o.isAgainstWall&&(a.vy=-s.jumpForce,s.jumpCount=2,s.jumpBufferTimer=0,c.publish("playSound",{key:"double_jump",volume:.6,channel:"SFX"}),c.publish("createParticles",{x:r.x+o.width/2,y:r.y+o.height,type:"double_jump"}),this._transitionTo(t,new ei(t,e),e))}s.vLock=!1,i.dashPressedThisFrame&&s.dashCooldownTimer<=0&&(s.isDashing=!0,s.dashTimer=s.dashDuration,a.vx=n.direction==="right"?s.dashSpeed:-s.dashSpeed,a.vy=0,s.dashCooldownTimer=y.DASH_COOLDOWN,c.publish("playSound",{key:"dash",volume:.7,channel:"SFX"}),c.publish("createParticles",{x:r.x+o.width/2,y:r.y+o.height/2,type:"dash",direction:n.direction}),this._transitionTo(t,new ii(t,e),e))}}_handleJumpTrail(t,e,i){const s=i.getComponent(e,C),n=i.getComponent(e,b),a=i.getComponent(e,w),o=i.getComponent(e,_);s.currentState==="jump"&&n.jumpCount===1?(n.jumpParticleTimer-=t,n.jumpParticleTimer<=0&&(n.jumpParticleTimer=.05,c.publish("createParticles",{x:a.x+o.width/2,y:a.y+o.height,type:"jump_trail"}))):n.jumpParticleTimer=0}_updateAnimation(t,e,i){const s=i.getComponent(e,k),n=i.getComponent(e,b);s.animationTimer+=t;const a=s.animationState;let o;if(a==="spawn"||a==="despawn"?o=y.SPAWN_ANIMATION_SPEED:a==="hit"?o=y.HIT_ANIMATION_SPEED:o=y.ANIMATION_SPEED,s.animationTimer<o)return;s.animationTimer-=o;const r=y.ANIMATION_FRAMES[a]||1;s.animationFrame++,a==="spawn"||a==="despawn"||a==="hit"?s.animationFrame>=r&&(s.animationFrame=r-1,a==="spawn"&&(n.isSpawning=!1,n.spawnComplete=!0,s.width=y.WIDTH,s.height=y.HEIGHT),a==="despawn"&&(n.isDespawning=!1,n.despawnAnimationFinished=!0)):s.animationFrame%=r}}class ai{constructor(){}update(t,{entityManager:e}){const i=e.query([b,E,_,G,w,C]);for(const s of i){const n=e.getComponent(s,E),a=e.getComponent(s,_),o=e.getComponent(s,b),r=e.getComponent(s,G),l=e.getComponent(s,w),d=e.getComponent(s,C);if(o.isSpawning||o.isDespawning){n.vx=0,n.vy=0;continue}this._applyHorizontalMovement(t,r,n,a,o),this._applyVerticalMovement(t,n,a,o,d),this._updateSurfaceEffects(t,l,n,a,o)}}_applyHorizontalMovement(t,e,i,s,n){if(n.isDashing||n.isHit){n.isHit&&(i.vx=0);return}const a=!n.hLock;n.hLock=!1;const o=1e3;if(s.isGrounded&&s.groundType==="ice"){const r=y.ICE_ACCELERATION,l=y.ICE_FRICTION;a&&e.moveLeft?i.vx-=r*t:a&&e.moveRight?i.vx+=r*t:i.vx>0?(i.vx-=l*t,i.vx<0&&(i.vx=0)):i.vx<0&&(i.vx+=l*t,i.vx>0&&(i.vx=0)),i.vx=Math.max(-n.speed,Math.min(n.speed,i.vx))}else{const r=n.speed*(s.isGrounded&&s.groundType==="sand"?y.SAND_MOVE_MULTIPLIER:1);a&&e.moveLeft?i.vx=-r:a&&e.moveRight?i.vx=r:i.vx>0?(i.vx-=o*t,i.vx<0&&(i.vx=0)):i.vx<0&&(i.vx+=o*t,i.vx>0&&(i.vx=0))}}_applyVerticalMovement(t,e,i,s,n){!i.isGrounded&&!s.isDashing&&!s.isSpawning&&(e.vy+=y.GRAVITY*t),n&&n.currentState==="cling"&&(e.vy=Math.min(e.vy,30)),e.vy=Math.min(e.vy,y.MAX_FALL_SPEED)}_updateSurfaceEffects(t,e,i,s,n){if(s.isGrounded&&Math.abs(i.vx)>1&&!n.isDashing&&!n.isHit){n.surfaceParticleTimer+=t;const o=s.groundType==="sand"||s.groundType==="mud"?.1:.15;if(n.surfaceParticleTimer>=o){n.surfaceParticleTimer=0;let r;switch(s.groundType){case"sand":r="sand";break;case"mud":r="mud";break;case"ice":r="ice";break;default:s.groundType&&(r="walk_dust");break}r&&c.publish("createParticles",{x:e.x+s.width/2,y:e.y+s.height,type:r})}}}}class oi{constructor(){this.levelStartTime=0,this.levelTime=0}reset(t){t?this.levelStartTime=performance.now():this.levelStartTime=0,this.levelTime=0}update(t,{entityManager:e,playerEntityId:i,level:s,isRunning:n,gameState:a,levelManager:o}){this.levelStartTime===0&&n&&(this.levelStartTime=performance.now()),n&&!a.showingLevelComplete&&(this.levelTime=(performance.now()-this.levelStartTime)/1e3);const r=e.getComponent(i,b);if(r&&(s.trophy&&s.trophy.acquired&&!r.isDespawning&&this._startPlayerDespawnSequence(e,i),r.despawnAnimationFinished&&!a.showingLevelComplete)){r.despawnAnimationFinished=!1;const l={deaths:r.deathCount,time:this.levelTime},d=a.onLevelComplete(l);d!==a&&(c.publish("gameStateUpdated",d),c.publish("pauseGame"),c.publish("levelComplete",{deaths:l.deaths,time:l.time,hasNextLevel:o.hasNextLevel(),hasPreviousLevel:o.hasPreviousLevel()}))}}_startPlayerDespawnSequence(t,e){const i=t.getComponent(e,b),s=t.getComponent(e,k),n=t.getComponent(e,C);i&&!i.isDespawning&&(c.publish("cameraShakeRequested",{intensity:8,duration:.3}),i.isDespawning=!0,s.animationState="despawn",n.currentState="despawn",s.animationFrame=0,s.animationTimer=0,s.width=y.SPAWN_WIDTH,s.height=y.SPAWN_HEIGHT)}}class ri{constructor(t){this.assets=t,this.activeEffects=[],c.subscribe("fruitCollected",e=>this._onFruitCollected(e))}_onFruitCollected(t){this.activeEffects.push({type:"fruit_collected",x:t.x,y:t.y,size:t.size,frame:0,frameCount:6,frameSpeed:.1,frameTimer:0})}reset(){this.activeEffects=[]}update(t){for(let e=this.activeEffects.length-1;e>=0;e--){const i=this.activeEffects[e];i.frameTimer+=t,i.frameTimer>=i.frameSpeed&&(i.frameTimer=0,i.frame++,i.frame>=i.frameCount&&this.activeEffects.splice(e,1))}}render(t,e){if(this.activeEffects.length===0)return;e.apply(t);const i=this.assets.fruit_collected;if(i){const s=i.width/6;for(const n of this.activeEffects){if(!e.isRectVisible({x:n.x,y:n.y,width:n.size,height:n.size}))continue;const a=n.frame*s;t.drawImage(i,a,0,s,i.height,n.x-n.size/2,n.y-n.size/2,n.size,n.size)}}e.restore(t)}}class _t{constructor(t,e,i,s){this.entityId=t,this.entityManager=e,this.level=i,this.playerEntityId=s,this.enemy=this.entityManager.getComponent(this.entityId,P),this.pos=this.entityManager.getComponent(this.entityId,w),this.vel=this.entityManager.getComponent(this.entityId,E),this.state=this.entityManager.getComponent(this.entityId,C),this.renderable=this.entityManager.getComponent(this.entityId,k),this.col=this.entityManager.getComponent(this.entityId,_),this.killable=this.entityManager.getComponent(this.entityId,V)}update(t){throw new Error("AI Behavior 'update' method must be implemented.")}_findPlatformEdges(){if(!this.level||!this.pos||!this.col)return null;const t=48,e=Math.floor((this.pos.y+this.col.height+1)/t);if(e>=this.level.gridHeight||e<0)return null;const i=Math.floor((this.pos.x+this.col.width/2)/t),s=this.level.getTileAt(i*t,e*t);if(!s||!s.solid||s.oneWay)return null;let n=i;for(;n>0;){const o=this.level.getTileAt((n-1)*t,e*t);if(!o||!o.solid||o.oneWay)break;n--}let a=i;for(;a<this.level.gridWidth-1;){const o=this.level.getTileAt((a+1)*t,e*t);if(!o||!o.solid||o.oneWay)break;a++}return{left:n*t,right:(a+1)*t}}}class hi extends _t{update(t){const e=this.enemy.ai.patrolSpeed;switch(this.state.currentState==="idle"?this.renderable.animationState=this.enemy.type==="slime"?"idle_run":"idle":this.renderable.animationState=this.enemy.type==="slime"?"idle_run":"run",this.state.currentState){case"idle":this.vel.vx=0,this.enemy.timer-=t,this.enemy.timer<=0&&(this.state.currentState="patrol");break;case"patrol":this.vel.vx=this.renderable.direction==="right"?e:-e;const i=this.renderable.direction==="right"?this.pos.x+this.col.width:this.pos.x,s=this.pos.y+this.col.height+1,n=this.level.getTileAt(i,s),a=!n.solid||n.oneWay,o=this.renderable.direction==="right"?this.pos.x+this.col.width+1:this.pos.x-1,r=this.pos.y+this.col.height/2,l=this.level.getTileAt(o,r),d=l.solid&&!l.oneWay;(a||d)&&(this.renderable.direction=this.renderable.direction==="right"?"left":"right",this.state.currentState="idle",this.enemy.timer=.5);break}}}class li extends _t{update(t){const e=this.enemy.ai,i=this.playerEntityId!==null?this.entityManager.getComponent(this.playerEntityId,w):null,s=this.playerEntityId!==null?this.entityManager.getComponent(this.playerEntityId,_):null,n=i&&s?{...i,...s}:null;switch(this.state.currentState){case"idle":if(this.vel.vx=0,this.renderable.animationState="idle",this.col.isGrounded){const r=this._findPlatformEdges();if(r){const l=r.left+(r.right-r.left)/2;this.renderable.direction=this.pos.x+this.col.width/2<l?"right":"left"}}if(n){const l=Math.abs(n.y+n.height/2-(this.pos.y+this.col.height/2))<this.col.height*1.5,u=Math.abs(n.x+n.width/2-(this.pos.x+this.col.width/2))<=e.aggroRange;if(l&&u){const m=n.x+n.width/2>this.pos.x+this.col.width/2?"right":"left",A=this._findPlatformEdges();let f=!0;A&&(m==="right"&&this.pos.x+this.col.width>=A.right-1&&(f=!1),m==="left"&&this.pos.x<=A.left+1&&(f=!1)),f&&(this.renderable.direction=m,this.state.currentState="warning",this.enemy.timer=e.idleTime)}}break;case"warning":this.vel.vx=0,this.renderable.animationState="idle",this.enemy.timer-=t,this.enemy.timer<=0&&(this.state.currentState="charging",this.vel.vx=(this.renderable.direction==="right"?1:-1)*e.chargeSpeed);break;case"charging":this.renderable.animationState="run",this.vel.vx=(this.renderable.direction==="right"?1:-1)*e.chargeSpeed;const a=this._findPlatformEdges();let o=!1;a?this.vel.vx>0&&this.pos.x+this.col.width>=a.right?(o=!0,this.pos.x=a.right-this.col.width):this.vel.vx<0&&this.pos.x<=a.left&&(o=!0,this.pos.x=a.left):o=!0,o&&(this.state.currentState="cooldown",this.vel.vx=0,this.enemy.timer=e.cooldownTime);break;case"cooldown":this.vel.vx=0,this.renderable.animationState="idle",this.enemy.timer-=t,this.enemy.timer<=0&&(this.state.currentState="idle");break}}}class ci extends _t{update(t){this.vel.vx=0,this.enemy.timer-=t,this.enemy.timer<=0&&(this.state.currentState==="idle"?(this.state.currentState="spikes_out_transition",this.renderable.animationState="spikes_out",this.renderable.animationFrame=0):this.state.currentState==="hiding"&&(this.state.currentState="spikes_in_transition",this.renderable.animationState="spikes_in",this.renderable.animationFrame=0))}}class di extends _t{update(t){this.enemy.snailState==="shell"?this._updateShellAI(t):this._updateWalkingAI(t)}_updateWalkingAI(t){const e=this.enemy.ai.patrolSpeed;this.state.currentState="patrol",this.renderable.animationState="walk",this.vel.vx=this.renderable.direction==="right"?e:-e;const i=this.renderable.direction==="right"?this.pos.x+this.col.width:this.pos.x,s=this.pos.y+this.col.height+1,n=this.level.getTileAt(i,s),a=!n.solid||n.oneWay,o=this.renderable.direction==="right"?this.pos.x+this.col.width+1:this.pos.x-1,r=this.pos.y+this.col.height/2,l=this.level.getTileAt(o,r),d=l.solid&&!l.oneWay;(a||d)&&(this.renderable.direction=this.renderable.direction==="right"?"left":"right")}_updateShellAI(t){const e=this.enemy.ai.shellSpeed;switch(this.state.currentState){case"shell_patrol":this.renderable.animationState="shell_idle",this.vel.vx=this.renderable.direction==="right"?e:-e;const i=this.renderable.direction==="right"?this.pos.x+this.col.width+1:this.pos.x-1,s=this.pos.y+this.col.height/2,n=this.level.getTileAt(i,s);n.solid&&!n.oneWay&&(this.renderable.direction=this.renderable.direction==="right"?"left":"right",this.state.currentState="shell_hit_wall",this.renderable.animationState="shell_wall_hit",this.renderable.animationFrame=0,this.enemy.timer=.2,c.publish("playSound",{key:"snail_wall_hit",volume:.5,channel:"SFX"}));break;case"shell_hit_wall":this.vel.vx=0,this.enemy.timer-=t,this.enemy.timer<=0&&(this.state.currentState="shell_patrol");break}}}const ui={patrol:hi,ground_charge:li,defensive_cycle:ci,snail:di};function pi(h,t,e,i,s){const n=ui[h];return n?new n(t,e,i,s):(console.warn(`No AI behavior found for type: ${h}`),null)}class mi{constructor(){this.stompEvents=[],c.subscribe("enemyStomped",t=>this.stompEvents.push(t))}_processStompEvents(t){if(this.stompEvents.length!==0){for(const e of this.stompEvents){const{enemyId:i}=e,s=t.getComponent(i,P),n=t.getComponent(i,C),a=t.getComponent(i,k),o=t.getComponent(i,_),r=t.getComponent(i,V);if(s.type==="snail"&&!s.isDead)if(s.snailState==="walking"){s.snailState="shell",n.currentState="shell_patrol",a.animationState="shell_idle",a.animationFrame=0,o.solid=!0,r.stompable=!1,s.immunityTimer=.4;const l=t.getComponent(i,w);c.publish("createParticles",{x:l.x+o.width/2,y:l.y+o.height/2,type:"snail_flee"}),c.publish("playSound",{key:"enemy_stomp",volume:.9,channel:"SFX"})}else s.snailState==="shell"&&(s.isDead=!0,n.currentState="dying",a.animationState="shell_top_hit",a.animationFrame=0,a.animationTimer=0,o.solid=!1,s.deathTimer=.5,c.publish("playSound",{key:"enemy_stomp",volume:.9,channel:"SFX"}));else if(s&&!s.isDead){if(r&&!r.stompable){c.publish("playSound",{key:"hit",volume:.9,channel:"SFX"});continue}s.isDead=!0,n.currentState="dying",a.animationState="hit",a.animationFrame=0,a.animationTimer=0,o.solid=!1,s.deathTimer=.5,c.publish("playSound",{key:"enemy_stomp",volume:.9,channel:"SFX"})}}this.stompEvents=[]}}update(t,{entityManager:e,playerEntityId:i,level:s}){this._processStompEvents(e);const n=e.query([P,w,E,C,k]);for(const a of n){const o=e.getComponent(a,P),r=e.getComponent(a,w),l=e.getComponent(a,E),d=e.getComponent(a,_);if(o.immunityTimer>0&&(o.immunityTimer-=t,o.immunityTimer<=0)){const u=e.getComponent(a,V);u&&(u.stompable=!0)}if(o.isDead){if(this._updateDyingState(t,o,l,e,a))continue}else{const u=pi(o.ai.type,a,e,s,i);u&&u.update(t)}if(o.type==="slime"&&o.ai.particleDropInterval&&Math.abs(l.vx)>0&&(o.particleDropTimer-=t,o.particleDropTimer<=0)){o.particleDropTimer=o.ai.particleDropInterval;const u={x:r.x+d.width/2,y:r.y+d.height-2};c.publish("createParticles",{...u,type:"slime_puddle"}),c.publish("createSlimePuddle",u)}this._updateAnimation(t,a,e)}}_updateDyingState(t,e,i,s,n){if(i.vx=0,i.vy+=200*t,e.deathTimer-=t,e.deathTimer<=0){const a=s.getComponent(n,w),o=s.getComponent(n,_);return a&&o&&c.publish("createParticles",{x:a.x+o.width/2,y:a.y+o.height/2,type:"enemy_death"}),s.destroyEntity(n),!0}return!1}_updateAnimation(t,e,i){const s=i.getComponent(e,k),n=i.getComponent(e,P),a=i.getComponent(e,C),o=$t[n.type]?.animations[s.animationState];if(o&&(s.animationTimer+=t,s.animationTimer>=o.speed&&(s.animationTimer-=o.speed,s.animationFrame++,s.animationFrame>=o.frameCount)))if(n.type==="turtle"){const r=i.getComponent(e,V);s.animationState==="spikes_out"?(a.currentState="hiding",s.animationState="idle1",n.timer=n.ai.spikesOutDuration,s.animationFrame=0,r&&(r.stompable=!1,r.dealsContactDamage=!0)):s.animationState==="spikes_in"?(a.currentState="idle",s.animationState="idle2",n.timer=n.ai.spikesInDuration,s.animationFrame=0,r&&(r.stompable=!0,r.dealsContactDamage=!1)):s.animationFrame=0}else n.type==="snail"&&s.animationState==="shell_wall_hit"||(s.animationFrame=0)}}const rt=1/60;class fi{constructor(t,e,i,s,n,a){this.ctx=t,this.gl=e,this.canvas=i,this.assets=s,this.lastFrameTime=0,this.accumulator=0,this.keybinds=n,this.isRunning=!1,this.gameHasStarted=!1,this.pauseForMenu=!1,this.timeScale=1,this.entityManager=new Xt,this.lastCheckpoint=null,this.fruitsAtLastCheckpoint=new Set,this.playerEntityId=null,this.camera=new Te(i.width,i.height),this.hud=new Ie(i,a),this.soundManager=new Ee,this.soundManager.loadSounds(s),this.renderer=new Me(t,i,s),this.gameState=new ut,c.publish("gameStateUpdated",this.gameState),this.levelManager=new Xe(this.gameState),this.inputSystem=new Ze(this.entityManager),this.playerStateSystem=new ni,this.movementSystem=new ai,this.collisionSystem=new Re,this.gameplaySystem=new Je,this.particleSystem=new Ke(e,s),this.effectsSystem=new ri(s),this.gameFlowSystem=new oi,this.uiSystem=new Ve(i,s),this.enemySystem=new mi,this.systems=[this.inputSystem,this.playerStateSystem,this.movementSystem,this.collisionSystem,this.enemySystem,this.gameplaySystem,this.particleSystem,this.effectsSystem,this.gameFlowSystem,this.uiSystem],this.currentLevel=null,this._setupEventSubscriptions()}_setupEventSubscriptions(){c.subscribe("requestStartGame",()=>this.loadLevel(this.gameState.currentSection,this.gameState.currentLevelIndex)),c.subscribe("requestLevelLoad",({sectionIndex:t,levelIndex:e})=>this.loadLevel(t,e)),c.subscribe("requestLevelRestart",()=>this.loadLevel(this.gameState.currentSection,this.gameState.currentLevelIndex)),c.subscribe("keybindsUpdated",t=>this.updateKeybinds(t)),c.subscribe("fruitCollected",t=>this._onFruitCollected(t)),c.subscribe("playerTookDamage",t=>this._onPlayerTookDamage(t)),c.subscribe("checkpointActivated",t=>this._onCheckpointActivated(t)),c.subscribe("playerDied",()=>this._onPlayerDied()),c.subscribe("characterUpdated",t=>this.updatePlayerCharacter(t)),c.subscribe("cameraShakeRequested",t=>this._onCameraShakeRequested(t)),c.subscribe("menuOpened",()=>{this.pauseForMenu=!0,this.pause()}),c.subscribe("allMenusClosed",()=>{this.pauseForMenu=!1,this.resume()}),c.subscribe("pauseGame",()=>this.pause()),c.subscribe("gameStateUpdated",t=>this.gameState=t)}updateKeybinds(t){this.keybinds={...t}}start(){this.isRunning||(this.isRunning=!0,this.gameHasStarted=!0,this.lastFrameTime=performance.now(),c.publish("gameStarted"),c.publish("gameResumed"),this.gameLoop())}stop(){this.isRunning=!1,this.soundManager.stopAll()}pause(){if(this.timeScale===0)return;this.timeScale=0,this.soundManager.stopAll({except:["UI"]});const t=this.entityManager.getComponent(this.playerEntityId,b);t&&(t.needsRespawn=!1),c.publish("gamePaused")}resume(){if(this.pauseForMenu||!this.gameHasStarted||this.gameState.showingLevelComplete||this.timeScale===1)return;this.timeScale=1,c.publish("gameResumed");const t=this.entityManager.getComponent(this.playerEntityId,b);t&&(t.needsRespawn=!1)}gameLoop(t=performance.now()){if(!this.isRunning)return;let e=(t-this.lastFrameTime)/1e3;for(this.lastFrameTime=t,e>.25&&(e=.25),this.accumulator+=e;this.accumulator>=rt;){const s=rt*this.timeScale;this.update(s),this.accumulator-=rt}const i=this.accumulator/rt;this.render(e,i),requestAnimationFrame(s=>this.gameLoop(s))}loadLevel(t,e){const i=this.levelManager.getLevelData(t,e);if(!i){this.stop();return}this.pauseForMenu=!1;let s=new ut(this.gameState);s.showingLevelComplete=!1,s.currentSection=t,s.currentLevelIndex=e,s=s.incrementAttempts(t,e),this.gameState=s,c.publish("gameStateUpdated",this.gameState),this.lastCheckpoint=null,this.fruitsAtLastCheckpoint.clear(),this.soundManager.stopAll(),this.entityManager=new Xt,this.inputSystem.entityManager=this.entityManager,this.effectsSystem.reset(),this.particleSystem.reset(),this.gameFlowSystem.reset(this.isRunning),this.currentLevel=new le(i,this.entityManager),this.playerEntityId=qe(this.entityManager,this.currentLevel.startPosition.x,this.currentLevel.startPosition.y,this.gameState.selectedCharacter),this.camera.updateLevelBounds(this.currentLevel.width,this.currentLevel.height),this.camera.snapToPlayer(this.entityManager,this.playerEntityId),this.renderer.preRenderLevel(this.currentLevel),this.timeScale=1,this.gameHasStarted||this.start(),c.publish("levelLoaded",{gameState:this.gameState})}update(t){if(!this.currentLevel)return;const e=this.entityManager.query([w]);for(const a of e){const o=this.entityManager.getComponent(a,w);let r=this.entityManager.getComponent(a,vt);r?(r.x=o.x,r.y=o.y):this.entityManager.addComponent(a,new vt(o.x,o.y))}this.camera.update(this.entityManager,this.playerEntityId,t);const i={entityManager:this.entityManager,playerEntityId:this.playerEntityId,playerCol:this.playerEntityId?this.entityManager.getComponent(this.playerEntityId,_):null,level:this.currentLevel,camera:this.camera,isRunning:this.isRunning&&this.timeScale>0,gameState:this.gameState,keybinds:this.keybinds,dt:t,levelManager:this.levelManager};for(const a of this.systems)a.update(t,i);const s=this.entityManager.getComponent(this.playerEntityId,b);s&&s.needsRespawn&&!this.gameState.showingLevelComplete&&this.timeScale>0&&this._respawnPlayer(),this.currentLevel.update(t,this.entityManager,this.playerEntityId,c,this.camera);const n=this.entityManager.getComponent(this.playerEntityId,lt);c.publish("statsUpdated",{levelName:this.currentLevel.name,collectedFruits:this.currentLevel.getFruitCount(),totalFruits:this.currentLevel.getTotalFruitCount(),deathCount:s?s.deathCount:0,levelTime:this.gameFlowSystem.levelTime,health:n?n.currentHealth:100,maxHealth:n?n.maxHealth:100})}_onPlayerTookDamage({amount:t}){const e=this.entityManager.getComponent(this.playerEntityId,lt),i=this.entityManager.getComponent(this.playerEntityId,b);e&&i&&!i.isHit&&!i.needsRespawn&&(e.currentHealth=Math.max(0,e.currentHealth-t),this.camera.shake(8,.3),e.currentHealth<=0&&this._onPlayerDied())}_onPlayerDied(){const t=this.entityManager.getComponent(this.playerEntityId,b);if(t&&!t.needsRespawn){const e=this.entityManager.getComponent(this.playerEntityId,E),i=this.entityManager.getComponent(this.playerEntityId,C),s=this.entityManager.getComponent(this.playerEntityId,k);t.needsRespawn=!0,t.deathCount++,e.vx=0,e.vy=0,t.isHit=!0,i.currentState="hit",s.animationState="hit",s.animationFrame=0,s.animationTimer=0,c.publish("playSound",{key:"death_sound",volume:.3,channel:"SFX"})}}_respawnPlayer(){const t=this.lastCheckpoint||this.currentLevel.startPosition;this.lastCheckpoint?this.currentLevel.fruits.forEach((p,m)=>p.collected=this.fruitsAtLastCheckpoint.has(m)):this.currentLevel.fruits.forEach(p=>p.collected=!1),this.currentLevel.recalculateCollectedFruits(),this.effectsSystem.reset(),this.currentLevel.trophy&&(this.currentLevel.trophy.acquired=!1,this.currentLevel.trophy.isAnimating=!1,this.currentLevel.trophy.animationFrame=0,this.currentLevel.trophy.animationTimer=0,this.currentLevel.trophy.inactive=!this.currentLevel.allFruitsCollected()),this.currentLevel.resetEnemies(this.entityManager);const e=this.entityManager.getComponent(this.playerEntityId,w),i=this.entityManager.getComponent(this.playerEntityId,E),s=this.entityManager.getComponent(this.playerEntityId,b),n=this.entityManager.getComponent(this.playerEntityId,k),a=this.entityManager.getComponent(this.playerEntityId,_),o=this.entityManager.getComponent(this.playerEntityId,C),r=this.entityManager.getComponent(this.playerEntityId,lt),l=this.entityManager.getComponent(this.playerEntityId,vt);e.x=t.x,e.y=t.y,l&&(l.x=t.x,l.y=t.y),i.vx=0,i.vy=0,r&&(r.currentHealth=r.maxHealth);const d=s.deathCount,u=s.activeSurfaceSound;Object.assign(s,new b),s.deathCount=d,s.activeSurfaceSound=u,s.needsRespawn=!1,o.currentState="spawn",n.animationState="spawn",n.animationFrame=0,n.animationTimer=0,n.direction="right",n.width=y.SPAWN_WIDTH,n.height=y.SPAWN_HEIGHT,a.isGrounded=!1,a.isAgainstWall=!1,a.groundType=null,this.camera.shake(15,.5),c.publish("playerRespawned")}_onFruitCollected(t){this.currentLevel.collectFruit(t),c.publish("playSound",{key:"collect",volume:.8,channel:"SFX"});const e=this.entityManager.getComponent(this.playerEntityId,lt);e&&e.currentHealth<e.maxHealth&&(e.currentHealth=Math.min(e.maxHealth,e.currentHealth+10))}updatePlayerCharacter(t){if(this.playerEntityId===null)return;const e=this.entityManager.getComponent(this.playerEntityId,Pt);e&&(e.characterId=t||this.gameState.selectedCharacter)}_onCheckpointActivated(t){t.state="activating",this.lastCheckpoint={x:t.x,y:t.y-t.size/2},c.publish("playSound",{key:"checkpoint_activated",volume:1,channel:"UI"}),this.fruitsAtLastCheckpoint.clear(),this.currentLevel.fruits.forEach((e,i)=>{e.collected&&this.fruitsAtLastCheckpoint.add(i)}),this.currentLevel.checkpoints.forEach(e=>{e!==t&&e.state==="active"&&(e.state="inactive",e.frame=0)})}_onCameraShakeRequested({intensity:t,duration:e}){this.camera&&this.camera.shake(t,e)}render(t,e){this.currentLevel&&(this.ctx.clearRect(0,0,this.canvas.width,this.canvas.height),this.gl.clearColor(0,0,0,0),this.gl.clear(this.gl.COLOR_BUFFER_BIT),this.renderer.drawScrollingBackground(this.currentLevel,t*this.timeScale),this.renderer.renderScene(this.camera,this.currentLevel,this.entityManager,e),this.effectsSystem.render(this.ctx,this.camera),this.particleSystem.render(this.camera),this.hud.drawGameHUD(this.ctx,rt),this.uiSystem.render(this.ctx,this.timeScale>0))}}function gi(h,t,e,i=!0){const s=document.createElement("canvas");s.width=h,s.height=t;const n=s.getContext("2d");return n.fillStyle=e,n.fillRect(0,0,h,t),i&&(n.fillStyle="rgba(0, 0, 0, 0.1)",n.fillRect(0,0,h/2,t/2),n.fillRect(h/2,t/2,h/2,t/2)),s}function Yt(h,t){return new Promise(e=>{const i=new Image,s=1e4;let n=!1;const a=()=>{if(n)return;n=!0,console.warn(`Failed or timed out loading image: ${h}. Using fallback.`);let r="#808080";t.includes("player")?r="#ff8c21":t.includes("fruit")&&(r="#FF6B6B");const l=gi(32,32,r),d=new Image;d.src=l.toDataURL(),d.onload=()=>e(d)},o=setTimeout(a,s);i.onload=()=>{n||(clearTimeout(o),e(i))},i.onerror=()=>{clearTimeout(o),a()},i.crossOrigin="anonymous",i.src=h})}function yi(h,t){return new Promise(e=>{const i=new Audio,s=1e4;let n=!1;const a=()=>{if(n)return;n=!0,console.warn(`Failed or timed out loading sound: ${h}. Using silent fallback.`);const r=new Audio("data:audio/wav;base64,UklGRigAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA=");e(r)},o=setTimeout(a,s);i.addEventListener("canplaythrough",()=>{n||(clearTimeout(o),e(i))}),i.addEventListener("error",()=>{clearTimeout(o),a()}),i.crossOrigin="anonymous",i.preload="auto",i.src=h,i.load()})}function bi(h){return fetch(h).then(t=>{if(!t.ok)throw new Error(`Failed to fetch level: ${h}, status: ${t.status}`);return t.json()}).catch(t=>(console.error(`Error loading JSON from ${h}:`,t),null))}const Et={PinkMan:{path:"/assets/MainCharacters/PinkMan/"},NinjaFrog:{path:"/assets/MainCharacters/NinjaFrog/"},MaskDude:{path:"/assets/MainCharacters/MaskDude/"},VirtualGuy:{path:"/assets/MainCharacters/VirtualGuy/"}},Kt={playerJump:"jump.png",playerDoubleJump:"double_jump.png",playerIdle:"idle.png",playerRun:"run.png",playerFall:"fall.png",playerDash:"dash.png",playerCling:"wall_jump.png",playerHit:"hit.png"};async function vi(){const h={font_spritesheet:"/assets/Menu/Text/Text (White) (8x10).png",settings_icon:"/assets/Menu/Buttons/Settings.png",pause_icon:"/assets/Menu/Buttons/Pause.png",play_icon:"/assets/Menu/Buttons/Play.png",levels_icon:"/assets/Menu/Buttons/Levels.png",character_icon:"/assets/Menu/Buttons/Character.png",info_icon:"/assets/Menu/Buttons/Info.png",background_blue:"/assets/Background/Blue.png",background_brown:"/assets/Background/Brown.png",background_gray:"/assets/Background/Gray.png",background_green:"/assets/Background/Green.png",background_pink:"/assets/Background/Pink.png",background_purple:"/assets/Background/Purple.png",background_red:"/assets/Background/Red.png",background_yellow:"/assets/Background/Yellow.png",block:"/assets/Terrain/Terrain.png",playerAppear:"/assets/MainCharacters/Appearing.png",playerDisappear:"/assets/MainCharacters/Disappearing.png",fruit_apple:"/assets/Items/Fruits/Apple.png",fruit_bananas:"/assets/Items/Fruits/Bananas.png",fruit_cherries:"/assets/Items/Fruits/Cherries.png",fruit_kiwi:"/assets/Items/Fruits/Kiwi.png",fruit_melon:"/assets/Items/Fruits/Melon.png",fruit_orange:"/assets/Items/Fruits/Orange.png",fruit_pineapple:"/assets/Items/Fruits/Pineapple.png",fruit_strawberry:"/assets/Items/Fruits/Strawberry.png",fruit_collected:"/assets/Items/Fruits/Collected.png",checkpoint_inactive:"/assets/Items/Checkpoints/Checkpoint/Checkpoint (No Flag).png",checkpoint_activation:"/assets/Items/Checkpoints/Checkpoint/Checkpoint (Flag Out).png",checkpoint_active:"/assets/Items/Checkpoints/Checkpoint/Checkpoint (Flag Idle).png",trophy_idle:"/assets/Items/Checkpoints/End/End (Idle).png",trophy_pressed:"/assets/Items/Checkpoints/End/End (Pressed).png",spike_two:"/assets/Traps/Spikes/Two.png",fire_off:"/assets/Traps/Fire/off.png",fire_hit:"/assets/Traps/Fire/hit.png",fire_on:"/assets/Traps/Fire/on.png",spiked_ball_chain:"/assets/Traps/Spiked Ball/Chain.png",spiked_ball:"/assets/Traps/Spiked Ball/Spiked Ball.png",saw:"/assets/Traps/Saw/on.png",saw_chain:"/assets/Traps/Saw/Chain.png",fan_off:"/assets/Traps/Fan/Off.png",fan_on:"/assets/Traps/Fan/On.png",arrow_idle:"/assets/Traps/Arrow/Idle.png",arrow_hit:"/assets/Traps/Arrow/Hit.png",falling_platform_off:"/assets/Traps/Falling Platforms/Off.png",falling_platform_on:"/assets/Traps/Falling Platforms/On.png",rh_blink:"/assets/Traps/Rock Head/Blink.png",rh_idle:"/assets/Traps/Rock Head/Idle.png",rh_bottom_hit:"/assets/Traps/Rock Head/Bottom Hit.png",sh_blink:"/assets/Traps/Spike Head/Blink.png",sh_idle:"/assets/Traps/Spike Head/Idle.png",sh_bottom_hit:"/assets/Traps/Spike Head/Bottom Hit.png",sand_mud_ice:"/assets/Traps/Sand Mud Ice/Sand Mud Ice.png",trampoline_idle:"/assets/Traps/Trampoline/Idle.png",trampoline_jump:"/assets/Traps/Trampoline/Jump.png",mushroom_hit:"/assets/Enemies/Mushroom/Hit.png",mushroom_idle:"/assets/Enemies/Mushroom/Idle.png",mushroom_run:"/assets/Enemies/Mushroom/Run.png",chicken_hit:"/assets/Enemies/Chicken/Hit.png",chicken_idle:"/assets/Enemies/Chicken/Idle.png",chicken_run:"/assets/Enemies/Chicken/Run.png",snail_hit:"/assets/Enemies/Snail/Hit.png",snail_idle:"/assets/Enemies/Snail/Idle.png",snail_walk:"/assets/Enemies/Snail/Walk.png",snail_die:"/assets/Enemies/Snail/Snail without shell.png",snail_shell_idle:"/assets/Enemies/Snail/Shell Idle.png",snail_shell_top_hit:"/assets/Enemies/Snail/Shell Top Hit.png",snail_shell_wall_hit:"/assets/Enemies/Snail/Shell Wall Hit.png",slime_hit:"/assets/Enemies/Slime/Hit.png",slime_idle_run:"/assets/Enemies/Slime/Idle-Run.png",slime_particles:"/assets/Enemies/Slime/Particles.png",turtle_hit:"/assets/Enemies/Turtle/Hit.png",turtle_idle1:"/assets/Enemies/Turtle/Idle 1.png",turtle_idle2:"/assets/Enemies/Turtle/Idle 2.png",turtle_spikes_in:"/assets/Enemies/Turtle/Spikes in.png",turtle_spikes_out:"/assets/Enemies/Turtle/Spikes out.png",dust_particle:"/assets/Other/Dust Particle.png",ice_particle:"/assets/Traps/Sand Mud Ice/Ice Particle.png",sand_particle:"/assets/Traps/Sand Mud Ice/Sand Particle.png",mud_particle:"/assets/Traps/Sand Mud Ice/Mud Particle.png"},t={button_click:"/assets/Sounds/Button Click.mp3",jump:"/assets/Sounds/Player Jump.mp3",double_jump:"/assets/Sounds/Player Double Jump.mp3",collect:"/assets/Sounds/Fruit Collect.mp3",level_complete:"/assets/Sounds/Level Complete.mp3",trophy_activated:"/assets/Sounds/Trophy Activated.mp3",death_sound:"/assets/Sounds/Death.mp3",dash:"/assets/Sounds/Whoosh.mp3",checkpoint_activated:"/assets/Sounds/Checkpoint (Activation).mp3",hit:"/assets/Sounds/Hit.mp3",enemy_stomp:"/assets/Sounds/Enemy Stomp.mp3",sand_walk:"/assets/Sounds/Sand Walk.mp3",mud_run:"/assets/Sounds/Mud Run.mp3",ice_run:"/assets/Sounds/Ice Run.mp3",trampoline_bounce:"/assets/Sounds/Boing.mp3",fire_activated:"/assets/Sounds/Fire (Activated).mp3",arrow_pop:"/assets/Sounds/Arrow Pop.mp3",fan_blowing:"/assets/Sounds/Fan Blowing.mp3",rh_slam:"/assets/Sounds/RH Slam.mp3",sh_slam:"/assets/Sounds/SH Slam.mp3",falling_platform:"/assets/Sounds/Falling Platform Whirring.mp3",snail_wall_hit:"/assets/Sounds/Snail Wall Hit.mp3"};console.log("Starting asset loading...");const e=Object.entries(h).map(([o,r])=>Yt(r,o).then(l=>({[o]:l}))),i=Object.entries(t).map(([o,r])=>yi(r).then(l=>({[o]:l}))),s=[];for(const o in Et)for(const r in Kt){const l=Et[o].path+Kt[r],d=Yt(l,`${o}-${r}`).then(u=>({type:"character",charKey:o,spriteKey:r,img:u}));s.push(d)}const n=[];F.forEach((o,r)=>{o.levels.forEach((l,d)=>{l.jsonPath&&n.push(bi(l.jsonPath).then(u=>({data:u,sectionIndex:r,levelIndex:d,type:"level"})))})});const a=[...e,...i,...s,...n];try{const o=await Promise.all(a),r={characters:{}};for(const l in Et)r.characters[l]={};for(const l of o)l&&(l.type==="character"?r.characters[l.charKey][l.spriteKey]=l.img:l.type==="level"?F[l.sectionIndex].levels[l.levelIndex]=l.data:Object.assign(r,l));return console.log("All assets and level data processed. Available assets:",Object.keys(r).length),r}catch(o){throw console.error("A critical error occurred during asset loading:",o),o}}const Vt={A:{x:0,y:0},B:{x:8,y:0},C:{x:16,y:0},D:{x:24,y:0},E:{x:32,y:0},F:{x:40,y:0},G:{x:48,y:0},H:{x:56,y:0},I:{x:64,y:0},J:{x:72,y:0},K:{x:0,y:10},L:{x:8,y:10},M:{x:16,y:10},N:{x:24,y:10},O:{x:32,y:10},P:{x:40,y:10},Q:{x:48,y:10},R:{x:56,y:10},S:{x:64,y:10},T:{x:72,y:10},U:{x:0,y:20},V:{x:8,y:20},W:{x:16,y:20},X:{x:24,y:20},Y:{x:32,y:20},Z:{x:40,y:20},0:{x:0,y:30},1:{x:8,y:30},2:{x:16,y:30},3:{x:24,y:30},4:{x:32,y:30},5:{x:40,y:30},6:{x:48,y:30},7:{x:56,y:30},8:{x:64,y:30},9:{x:72,y:30},".":{x:0,y:40},",":{x:8,y:40},":":{x:16,y:40},"?":{x:24,y:40},"!":{x:32,y:40},"(":{x:40,y:40},")":{x:48,y:40},"+":{x:56,y:40},"-":{x:64,y:40},"/":{x:48,y:20}," ":{x:0,y:0,space:!0},"%":{x:56,y:20},"'":{x:64,y:20},"&":{x:72,y:20}},U=8,z=10;class xi{constructor(t){this.sprite=t,this.sprite||console.error("Font spritesheet not provided to FontRenderer!"),this.characterCache=new Map}_getCachedCharacter(t,e){const i=`${t}_${e}`;if(this.characterCache.has(i))return this.characterCache.get(i);const s=Vt[t];if(!s)return null;const n=document.createElement("canvas");n.width=U,n.height=z;const a=n.getContext("2d");return a.imageSmoothingEnabled=!1,a.drawImage(this.sprite,s.x,s.y,U,z,0,0,U,z),a.globalCompositeOperation="source-in",a.fillStyle=e,a.fillRect(0,0,U,z),this.characterCache.set(i,n),n}_renderText(t,e,i,s,{scale:n=1,color:a=null}={}){if(!this.sprite)return;const o=e.toUpperCase();let r=i;t.imageSmoothingEnabled=!1;for(const l of o){const d=Vt[l];if(!d){r+=U*n;continue}if(d.space){r+=U*n;continue}let u,p=d.x,m=d.y;a?(u=this._getCachedCharacter(l,a),p=0,m=0):u=this.sprite,u&&t.drawImage(u,p,m,U,z,r,s,U*n,z*n),r+=U*n}}drawText(t,e,i,s,{scale:n=1,align:a="left",color:o="white",outlineColor:r=null,outlineWidth:l=1}={}){const d=this.getTextWidth(e,n);let u=i;if(a==="center"?u=i-d/2:a==="right"&&(u=i-d),r){const p={scale:n,color:r};this._renderText(t,e,u-l,s,p),this._renderText(t,e,u+l,s,p),this._renderText(t,e,u,s-l,p),this._renderText(t,e,u,s+l,p)}this._renderText(t,e,u,s,{scale:n,color:o})}getTextWidth(t,e=1){return t.length*U*e}renderTextToCanvas(t,e){if(!this.sprite)return null;const i=e.outlineColor&&e.outlineWidth?e.outlineWidth*2:0,s=this.getTextWidth(t,e.scale),n=z*e.scale,a=document.createElement("canvas");a.width=s+i,a.height=n+i;const o=a.getContext("2d"),r={...e,align:"left"};return this.drawText(o,t,i/2,i/2,r),a}}/**
 * @license
 * Copyright 2019 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */const xt=globalThis,Ot=xt.ShadowRoot&&(xt.ShadyCSS===void 0||xt.ShadyCSS.nativeShadow)&&"adoptedStyleSheets"in Document.prototype&&"replace"in CSSStyleSheet.prototype,Dt=Symbol(),qt=new WeakMap;let de=class{constructor(t,e,i){if(this._$cssResult$=!0,i!==Dt)throw Error("CSSResult is not constructable. Use `unsafeCSS` or `css` instead.");this.cssText=t,this.t=e}get styleSheet(){let t=this.o;const e=this.t;if(Ot&&t===void 0){const i=e!==void 0&&e.length===1;i&&(t=qt.get(e)),t===void 0&&((this.o=t=new CSSStyleSheet).replaceSync(this.cssText),i&&qt.set(e,t))}return t}toString(){return this.cssText}};const Si=h=>new de(typeof h=="string"?h:h+"",void 0,Dt),H=(h,...t)=>{const e=h.length===1?h[0]:t.reduce((i,s,n)=>i+(a=>{if(a._$cssResult$===!0)return a.cssText;if(typeof a=="number")return a;throw Error("Value passed to 'css' function must be a 'css' function result: "+a+". Use 'unsafeCSS' to pass non-literal values, but take care to ensure page security.")})(s)+h[n+1],h[0]);return new de(e,h,Dt)},_i=(h,t)=>{if(Ot)h.adoptedStyleSheets=t.map(e=>e instanceof CSSStyleSheet?e:e.styleSheet);else for(const e of t){const i=document.createElement("style"),s=xt.litNonce;s!==void 0&&i.setAttribute("nonce",s),i.textContent=e.cssText,h.appendChild(i)}},Zt=Ot?h=>h:h=>h instanceof CSSStyleSheet?(t=>{let e="";for(const i of t.cssRules)e+=i.cssText;return Si(e)})(h):h;/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */const{is:wi,defineProperty:ki,getOwnPropertyDescriptor:Ci,getOwnPropertyNames:Ti,getOwnPropertySymbols:Ai,getPrototypeOf:Ei}=Object,wt=globalThis,Jt=wt.trustedTypes,Ii=Jt?Jt.emptyScript:"",Li=wt.reactiveElementPolyfillSupport,dt=(h,t)=>h,Rt={toAttribute(h,t){switch(t){case Boolean:h=h?Ii:null;break;case Object:case Array:h=h==null?h:JSON.stringify(h)}return h},fromAttribute(h,t){let e=h;switch(t){case Boolean:e=h!==null;break;case Number:e=h===null?null:Number(h);break;case Object:case Array:try{e=JSON.parse(h)}catch{e=null}}return e}},ue=(h,t)=>!wi(h,t),Qt={attribute:!0,type:String,converter:Rt,reflect:!1,useDefault:!1,hasChanged:ue};Symbol.metadata??=Symbol("metadata"),wt.litPropertyMetadata??=new WeakMap;let tt=class extends HTMLElement{static addInitializer(t){this._$Ei(),(this.l??=[]).push(t)}static get observedAttributes(){return this.finalize(),this._$Eh&&[...this._$Eh.keys()]}static createProperty(t,e=Qt){if(e.state&&(e.attribute=!1),this._$Ei(),this.prototype.hasOwnProperty(t)&&((e=Object.create(e)).wrapped=!0),this.elementProperties.set(t,e),!e.noAccessor){const i=Symbol(),s=this.getPropertyDescriptor(t,i,e);s!==void 0&&ki(this.prototype,t,s)}}static getPropertyDescriptor(t,e,i){const{get:s,set:n}=Ci(this.prototype,t)??{get(){return this[e]},set(a){this[e]=a}};return{get:s,set(a){const o=s?.call(this);n?.call(this,a),this.requestUpdate(t,o,i)},configurable:!0,enumerable:!0}}static getPropertyOptions(t){return this.elementProperties.get(t)??Qt}static _$Ei(){if(this.hasOwnProperty(dt("elementProperties")))return;const t=Ei(this);t.finalize(),t.l!==void 0&&(this.l=[...t.l]),this.elementProperties=new Map(t.elementProperties)}static finalize(){if(this.hasOwnProperty(dt("finalized")))return;if(this.finalized=!0,this._$Ei(),this.hasOwnProperty(dt("properties"))){const e=this.properties,i=[...Ti(e),...Ai(e)];for(const s of i)this.createProperty(s,e[s])}const t=this[Symbol.metadata];if(t!==null){const e=litPropertyMetadata.get(t);if(e!==void 0)for(const[i,s]of e)this.elementProperties.set(i,s)}this._$Eh=new Map;for(const[e,i]of this.elementProperties){const s=this._$Eu(e,i);s!==void 0&&this._$Eh.set(s,e)}this.elementStyles=this.finalizeStyles(this.styles)}static finalizeStyles(t){const e=[];if(Array.isArray(t)){const i=new Set(t.flat(1/0).reverse());for(const s of i)e.unshift(Zt(s))}else t!==void 0&&e.push(Zt(t));return e}static _$Eu(t,e){const i=e.attribute;return i===!1?void 0:typeof i=="string"?i:typeof t=="string"?t.toLowerCase():void 0}constructor(){super(),this._$Ep=void 0,this.isUpdatePending=!1,this.hasUpdated=!1,this._$Em=null,this._$Ev()}_$Ev(){this._$ES=new Promise(t=>this.enableUpdating=t),this._$AL=new Map,this._$E_(),this.requestUpdate(),this.constructor.l?.forEach(t=>t(this))}addController(t){(this._$EO??=new Set).add(t),this.renderRoot!==void 0&&this.isConnected&&t.hostConnected?.()}removeController(t){this._$EO?.delete(t)}_$E_(){const t=new Map,e=this.constructor.elementProperties;for(const i of e.keys())this.hasOwnProperty(i)&&(t.set(i,this[i]),delete this[i]);t.size>0&&(this._$Ep=t)}createRenderRoot(){const t=this.shadowRoot??this.attachShadow(this.constructor.shadowRootOptions);return _i(t,this.constructor.elementStyles),t}connectedCallback(){this.renderRoot??=this.createRenderRoot(),this.enableUpdating(!0),this._$EO?.forEach(t=>t.hostConnected?.())}enableUpdating(t){}disconnectedCallback(){this._$EO?.forEach(t=>t.hostDisconnected?.())}attributeChangedCallback(t,e,i){this._$AK(t,i)}_$ET(t,e){const i=this.constructor.elementProperties.get(t),s=this.constructor._$Eu(t,i);if(s!==void 0&&i.reflect===!0){const n=(i.converter?.toAttribute!==void 0?i.converter:Rt).toAttribute(e,i.type);this._$Em=t,n==null?this.removeAttribute(s):this.setAttribute(s,n),this._$Em=null}}_$AK(t,e){const i=this.constructor,s=i._$Eh.get(t);if(s!==void 0&&this._$Em!==s){const n=i.getPropertyOptions(s),a=typeof n.converter=="function"?{fromAttribute:n.converter}:n.converter?.fromAttribute!==void 0?n.converter:Rt;this._$Em=s;const o=a.fromAttribute(e,n.type);this[s]=o??this._$Ej?.get(s)??o,this._$Em=null}}requestUpdate(t,e,i){if(t!==void 0){const s=this.constructor,n=this[t];if(i??=s.getPropertyOptions(t),!((i.hasChanged??ue)(n,e)||i.useDefault&&i.reflect&&n===this._$Ej?.get(t)&&!this.hasAttribute(s._$Eu(t,i))))return;this.C(t,e,i)}this.isUpdatePending===!1&&(this._$ES=this._$EP())}C(t,e,{useDefault:i,reflect:s,wrapped:n},a){i&&!(this._$Ej??=new Map).has(t)&&(this._$Ej.set(t,a??e??this[t]),n!==!0||a!==void 0)||(this._$AL.has(t)||(this.hasUpdated||i||(e=void 0),this._$AL.set(t,e)),s===!0&&this._$Em!==t&&(this._$Eq??=new Set).add(t))}async _$EP(){this.isUpdatePending=!0;try{await this._$ES}catch(e){Promise.reject(e)}const t=this.scheduleUpdate();return t!=null&&await t,!this.isUpdatePending}scheduleUpdate(){return this.performUpdate()}performUpdate(){if(!this.isUpdatePending)return;if(!this.hasUpdated){if(this.renderRoot??=this.createRenderRoot(),this._$Ep){for(const[s,n]of this._$Ep)this[s]=n;this._$Ep=void 0}const i=this.constructor.elementProperties;if(i.size>0)for(const[s,n]of i){const{wrapped:a}=n,o=this[s];a!==!0||this._$AL.has(s)||o===void 0||this.C(s,void 0,n,o)}}let t=!1;const e=this._$AL;try{t=this.shouldUpdate(e),t?(this.willUpdate(e),this._$EO?.forEach(i=>i.hostUpdate?.()),this.update(e)):this._$EM()}catch(i){throw t=!1,this._$EM(),i}t&&this._$AE(e)}willUpdate(t){}_$AE(t){this._$EO?.forEach(e=>e.hostUpdated?.()),this.hasUpdated||(this.hasUpdated=!0,this.firstUpdated(t)),this.updated(t)}_$EM(){this._$AL=new Map,this.isUpdatePending=!1}get updateComplete(){return this.getUpdateComplete()}getUpdateComplete(){return this._$ES}shouldUpdate(t){return!0}update(t){this._$Eq&&=this._$Eq.forEach(e=>this._$ET(e,this[e])),this._$EM()}updated(t){}firstUpdated(t){}};tt.elementStyles=[],tt.shadowRootOptions={mode:"open"},tt[dt("elementProperties")]=new Map,tt[dt("finalized")]=new Map,Li?.({ReactiveElement:tt}),(wt.reactiveElementVersions??=[]).push("2.1.1");/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */const jt=globalThis,St=jt.trustedTypes,te=St?St.createPolicy("lit-html",{createHTML:h=>h}):void 0,pe="$lit$",W=`lit$${Math.random().toFixed(9).slice(2)}$`,me="?"+W,Ri=`<${me}>`,q=document,pt=()=>q.createComment(""),mt=h=>h===null||typeof h!="object"&&typeof h!="function",Ht=Array.isArray,Mi=h=>Ht(h)||typeof h?.[Symbol.iterator]=="function",It=`[ 	
\f\r]`,ht=/<(?:(!--|\/[^a-zA-Z])|(\/?[a-zA-Z][^>\s]*)|(\/?$))/g,ee=/-->/g,ie=/>/g,Y=RegExp(`>|${It}(?:([^\\s"'>=/]+)(${It}*=${It}*(?:[^ 	
\f\r"'\`<>=]|("|')|))|$)`,"g"),se=/'/g,ne=/"/g,fe=/^(?:script|style|textarea|title)$/i,Pi=h=>(t,...e)=>({_$litType$:h,strings:t,values:e}),g=Pi(1),et=Symbol.for("lit-noChange"),I=Symbol.for("lit-nothing"),ae=new WeakMap,K=q.createTreeWalker(q,129);function ge(h,t){if(!Ht(h)||!h.hasOwnProperty("raw"))throw Error("invalid template strings array");return te!==void 0?te.createHTML(t):t}const $i=(h,t)=>{const e=h.length-1,i=[];let s,n=t===2?"<svg>":t===3?"<math>":"",a=ht;for(let o=0;o<e;o++){const r=h[o];let l,d,u=-1,p=0;for(;p<r.length&&(a.lastIndex=p,d=a.exec(r),d!==null);)p=a.lastIndex,a===ht?d[1]==="!--"?a=ee:d[1]!==void 0?a=ie:d[2]!==void 0?(fe.test(d[2])&&(s=RegExp("</"+d[2],"g")),a=Y):d[3]!==void 0&&(a=Y):a===Y?d[0]===">"?(a=s??ht,u=-1):d[1]===void 0?u=-2:(u=a.lastIndex-d[2].length,l=d[1],a=d[3]===void 0?Y:d[3]==='"'?ne:se):a===ne||a===se?a=Y:a===ee||a===ie?a=ht:(a=Y,s=void 0);const m=a===Y&&h[o+1].startsWith("/>")?" ":"";n+=a===ht?r+Ri:u>=0?(i.push(l),r.slice(0,u)+pe+r.slice(u)+W+m):r+W+(u===-2?o:m)}return[ge(h,n+(h[e]||"<?>")+(t===2?"</svg>":t===3?"</math>":"")),i]};class ft{constructor({strings:t,_$litType$:e},i){let s;this.parts=[];let n=0,a=0;const o=t.length-1,r=this.parts,[l,d]=$i(t,e);if(this.el=ft.createElement(l,i),K.currentNode=this.el.content,e===2||e===3){const u=this.el.content.firstChild;u.replaceWith(...u.childNodes)}for(;(s=K.nextNode())!==null&&r.length<o;){if(s.nodeType===1){if(s.hasAttributes())for(const u of s.getAttributeNames())if(u.endsWith(pe)){const p=d[a++],m=s.getAttribute(u).split(W),A=/([.?@])?(.*)/.exec(p);r.push({type:1,index:n,name:A[2],strings:m,ctor:A[1]==="."?Oi:A[1]==="?"?Di:A[1]==="@"?ji:kt}),s.removeAttribute(u)}else u.startsWith(W)&&(r.push({type:6,index:n}),s.removeAttribute(u));if(fe.test(s.tagName)){const u=s.textContent.split(W),p=u.length-1;if(p>0){s.textContent=St?St.emptyScript:"";for(let m=0;m<p;m++)s.append(u[m],pt()),K.nextNode(),r.push({type:2,index:++n});s.append(u[p],pt())}}}else if(s.nodeType===8)if(s.data===me)r.push({type:2,index:n});else{let u=-1;for(;(u=s.data.indexOf(W,u+1))!==-1;)r.push({type:7,index:n}),u+=W.length-1}n++}}static createElement(t,e){const i=q.createElement("template");return i.innerHTML=t,i}}function it(h,t,e=h,i){if(t===et)return t;let s=i!==void 0?e._$Co?.[i]:e._$Cl;const n=mt(t)?void 0:t._$litDirective$;return s?.constructor!==n&&(s?._$AO?.(!1),n===void 0?s=void 0:(s=new n(h),s._$AT(h,e,i)),i!==void 0?(e._$Co??=[])[i]=s:e._$Cl=s),s!==void 0&&(t=it(h,s._$AS(h,t.values),s,i)),t}class Fi{constructor(t,e){this._$AV=[],this._$AN=void 0,this._$AD=t,this._$AM=e}get parentNode(){return this._$AM.parentNode}get _$AU(){return this._$AM._$AU}u(t){const{el:{content:e},parts:i}=this._$AD,s=(t?.creationScope??q).importNode(e,!0);K.currentNode=s;let n=K.nextNode(),a=0,o=0,r=i[0];for(;r!==void 0;){if(a===r.index){let l;r.type===2?l=new gt(n,n.nextSibling,this,t):r.type===1?l=new r.ctor(n,r.name,r.strings,this,t):r.type===6&&(l=new Hi(n,this,t)),this._$AV.push(l),r=i[++o]}a!==r?.index&&(n=K.nextNode(),a++)}return K.currentNode=q,s}p(t){let e=0;for(const i of this._$AV)i!==void 0&&(i.strings!==void 0?(i._$AI(t,i,e),e+=i.strings.length-2):i._$AI(t[e])),e++}}class gt{get _$AU(){return this._$AM?._$AU??this._$Cv}constructor(t,e,i,s){this.type=2,this._$AH=I,this._$AN=void 0,this._$AA=t,this._$AB=e,this._$AM=i,this.options=s,this._$Cv=s?.isConnected??!0}get parentNode(){let t=this._$AA.parentNode;const e=this._$AM;return e!==void 0&&t?.nodeType===11&&(t=e.parentNode),t}get startNode(){return this._$AA}get endNode(){return this._$AB}_$AI(t,e=this){t=it(this,t,e),mt(t)?t===I||t==null||t===""?(this._$AH!==I&&this._$AR(),this._$AH=I):t!==this._$AH&&t!==et&&this._(t):t._$litType$!==void 0?this.$(t):t.nodeType!==void 0?this.T(t):Mi(t)?this.k(t):this._(t)}O(t){return this._$AA.parentNode.insertBefore(t,this._$AB)}T(t){this._$AH!==t&&(this._$AR(),this._$AH=this.O(t))}_(t){this._$AH!==I&&mt(this._$AH)?this._$AA.nextSibling.data=t:this.T(q.createTextNode(t)),this._$AH=t}$(t){const{values:e,_$litType$:i}=t,s=typeof i=="number"?this._$AC(t):(i.el===void 0&&(i.el=ft.createElement(ge(i.h,i.h[0]),this.options)),i);if(this._$AH?._$AD===s)this._$AH.p(e);else{const n=new Fi(s,this),a=n.u(this.options);n.p(e),this.T(a),this._$AH=n}}_$AC(t){let e=ae.get(t.strings);return e===void 0&&ae.set(t.strings,e=new ft(t)),e}k(t){Ht(this._$AH)||(this._$AH=[],this._$AR());const e=this._$AH;let i,s=0;for(const n of t)s===e.length?e.push(i=new gt(this.O(pt()),this.O(pt()),this,this.options)):i=e[s],i._$AI(n),s++;s<e.length&&(this._$AR(i&&i._$AB.nextSibling,s),e.length=s)}_$AR(t=this._$AA.nextSibling,e){for(this._$AP?.(!1,!0,e);t!==this._$AB;){const i=t.nextSibling;t.remove(),t=i}}setConnected(t){this._$AM===void 0&&(this._$Cv=t,this._$AP?.(t))}}class kt{get tagName(){return this.element.tagName}get _$AU(){return this._$AM._$AU}constructor(t,e,i,s,n){this.type=1,this._$AH=I,this._$AN=void 0,this.element=t,this.name=e,this._$AM=s,this.options=n,i.length>2||i[0]!==""||i[1]!==""?(this._$AH=Array(i.length-1).fill(new String),this.strings=i):this._$AH=I}_$AI(t,e=this,i,s){const n=this.strings;let a=!1;if(n===void 0)t=it(this,t,e,0),a=!mt(t)||t!==this._$AH&&t!==et,a&&(this._$AH=t);else{const o=t;let r,l;for(t=n[0],r=0;r<n.length-1;r++)l=it(this,o[i+r],e,r),l===et&&(l=this._$AH[r]),a||=!mt(l)||l!==this._$AH[r],l===I?t=I:t!==I&&(t+=(l??"")+n[r+1]),this._$AH[r]=l}a&&!s&&this.j(t)}j(t){t===I?this.element.removeAttribute(this.name):this.element.setAttribute(this.name,t??"")}}class Oi extends kt{constructor(){super(...arguments),this.type=3}j(t){this.element[this.name]=t===I?void 0:t}}class Di extends kt{constructor(){super(...arguments),this.type=4}j(t){this.element.toggleAttribute(this.name,!!t&&t!==I)}}class ji extends kt{constructor(t,e,i,s,n){super(t,e,i,s,n),this.type=5}_$AI(t,e=this){if((t=it(this,t,e,0)??I)===et)return;const i=this._$AH,s=t===I&&i!==I||t.capture!==i.capture||t.once!==i.once||t.passive!==i.passive,n=t!==I&&(i===I||s);s&&this.element.removeEventListener(this.name,this,i),n&&this.element.addEventListener(this.name,this,t),this._$AH=t}handleEvent(t){typeof this._$AH=="function"?this._$AH.call(this.options?.host??this.element,t):this._$AH.handleEvent(t)}}class Hi{constructor(t,e,i){this.element=t,this.type=6,this._$AN=void 0,this._$AM=e,this.options=i}get _$AU(){return this._$AM._$AU}_$AI(t){it(this,t)}}const Ui=jt.litHtmlPolyfillSupport;Ui?.(ft,gt),(jt.litHtmlVersions??=[]).push("3.3.1");const ye=(h,t,e)=>{const i=e?.renderBefore??t;let s=i._$litPart$;if(s===void 0){const n=e?.renderBefore??null;i._$litPart$=s=new gt(t.insertBefore(pt(),n),n,void 0,e??{})}return s._$AI(h),s};/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */const Ut=globalThis;class R extends tt{constructor(){super(...arguments),this.renderOptions={host:this},this._$Do=void 0}createRenderRoot(){const t=super.createRenderRoot();return this.renderOptions.renderBefore??=t.firstChild,t}update(t){const e=this.render();this.hasUpdated||(this.renderOptions.isConnected=this.isConnected),super.update(t),this._$Do=ye(e,this.renderRoot,this.renderOptions)}connectedCallback(){super.connectedCallback(),this._$Do?.setConnected(!0)}disconnectedCallback(){super.disconnectedCallback(),this._$Do?.setConnected(!1)}render(){return et}}R._$litElement$=!0,R.finalized=!0,Ut.litElementHydrateSupport?.({LitElement:R});const Bi=Ut.litElementPolyfillSupport;Bi?.({LitElement:R});(Ut.litElementVersions??=[]).push("4.2.1");/**
 * @license
 * Copyright 2021 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */function*st(h,t){if(h!==void 0){let e=0;for(const i of h)yield t(i,e++)}}function B(h){return h===" "?"SPACE":h.startsWith("arrow")?h.replace("arrow","").toUpperCase():h.toUpperCase()}function Bt(h=0){const t=Math.floor(h/60),e=h%60,i=Math.floor(e),s=Math.floor((e-i)*1e3);return`${t.toString().padStart(2,"0")}:${i.toString().padStart(2,"0")}.${s.toString().padStart(3,"0")}`}class Ni extends R{static properties={fontRenderer:{type:Object},text:{type:String},scale:{type:Number},color:{type:String},outlineColor:{type:String},outlineWidth:{type:Number},align:{type:String}};constructor(){super(),this.text="",this.scale=1,this.color="white",this.outlineColor=null,this.outlineWidth=1,this.align="left"}updated(t){super.updated(t),!(!this.fontRenderer||!this.shadowRoot)&&this.renderCanvas()}renderCanvas(){const t=this.shadowRoot.querySelector("#container");if(!t)return;const e=this.fontRenderer.renderTextToCanvas(this.text,{scale:this.scale,color:this.color,outlineColor:this.outlineColor,outlineWidth:this.outlineWidth,align:this.align});e&&(e.style.imageRendering="pixelated",t.innerHTML="",t.appendChild(e))}render(){return g`<div id="container"></div>`}}customElements.define("bitmap-text",Ni);class Wi extends R{static styles=H`
    .keybind-display {
      background-color: #666;
      border: 1px solid #777;
      padding: 10px 15px;
      border-radius: 6px;
      width: 120px;
      cursor: pointer;
      text-align: center;
      transition: all 0.2s ease;
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 20px;
      box-sizing: border-box;
    }
    .keybind-display:hover {
      background-color: #777;
    }
    .keybind-display.active-rebind {
      border-color: #ff9800;
      background-color: #444;
      box-shadow: 0 0 5px rgba(255, 152, 0, 0.5);
    }
  `;static properties={action:{type:String},currentKey:{type:String},isRemapping:{type:Boolean,state:!0},fontRenderer:{type:Object}};constructor(){super(),this.isRemapping=!1}connectedCallback(){super.connectedCallback(),window.addEventListener("keydown",this._handleGlobalKeydown)}disconnectedCallback(){super.disconnectedCallback(),window.removeEventListener("keydown",this._handleGlobalKeydown)}_handleGlobalKeydown=t=>{if(!this.isRemapping)return;t.preventDefault(),t.stopPropagation();const e=t.key.toLowerCase();this.dispatchEvent(new CustomEvent("keybind-changed",{detail:{action:this.action,newKey:e},bubbles:!0,composed:!0})),this.isRemapping=!1};_startRemap(t){t.stopPropagation(),this.isRemapping=!0,c.publish("playSound",{key:"button_click",volume:.8,channel:"UI"})}render(){const t=this.isRemapping?"Press key...":B(this.currentKey);return g`
      <div
        class="keybind-display ${this.isRemapping?"active-rebind":""}"
        @click=${this._startRemap}
      >
        <bitmap-text
          .fontRenderer=${this.fontRenderer}
          .text=${t}
          scale="1.8"
        ></bitmap-text>
      </div>
    `}}customElements.define("keybind-display",Wi);class Gi extends R{static styles=H`
    :host {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    }
    .modal-overlay {
      position: absolute;
      inset: 0;
      background-color: rgba(0, 0, 0, 0.7);
      display: flex; justify-content: center; align-items: center;
      z-index: 200;
    }
    .modal-content {
      background-color: #333; padding: 30px; border-radius: 12px;
      box-shadow: 0 8px 16px rgba(0, 0, 0, 0.5); color: #eee;
      text-align: center; position: relative; width: 90%;
      max-width: 600px; max-height: 80vh; overflow-y: auto;
    }
    .close-button {
      position: absolute; top: 15px; right: 15px; width: 32px; height: 32px;
      background-image: url('/assets/Menu/Buttons/Close.png');
      background-size: cover; background-color: transparent;
      border: none; cursor: pointer; border-radius: 50%;
      transition: transform 0.2s ease-in-out;
    }
    .close-button:hover { transform: scale(1.1); }
    
    .title-container {
        display: flex;
        justify-content: center;
        margin-bottom: 25px;
    }
    .section-title-container {
        display: flex;
        justify-content: center;
        margin-bottom: 20px;
        border-bottom: 2px solid #666;
        padding-bottom: 10px;
    }

    .settings-section { margin-bottom: 30px; padding: 20px; background-color: #444; border-radius: 8px; border: 1px solid #555; }
    .setting-item { display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px; padding: 10px; background-color: #555; border-radius: 6px; }
    .setting-item .label-container { flex-grow: 1; text-align: left; }
    
    .toggle-button { 
        border: 2px solid #777; padding: 8px 16px; border-radius: 6px; cursor: pointer;
        min-width: 70px; transition: all 0.2s ease-in-out;
        display: flex; justify-content: center; align-items: center;
    }
    .toggle-button.sound-enabled { background-color: #4CAF50; border-color: #45a049; }
    .toggle-button.sound-disabled { background-color: #f44336; border-color: #d32f2f; }
    
    .volume-control { display: flex; align-items: center; gap: 10px; }
    
    .action-button { 
        background-color: #007bff; color: #fff; border: none; padding: 10px 20px;
        border-radius: 6px; cursor: pointer;
        display: flex; justify-content: center; align-items: center;
    }
    .action-button:hover:not(:disabled) { background-color: #0056b3; }
    .action-button:disabled { background-color: #666; cursor: not-allowed; opacity: 0.7; }

    .keybind-list { display: flex; flex-direction: column; gap: 15px; }
    .keybind-item { display: flex; justify-content: space-between; align-items: center; background-color: #555; padding: 12px 15px; border-radius: 8px; }
    .keybind-item .label-container { margin-right: 15px; flex-grow: 1; text-align: left; }
  `;static properties={keybinds:{type:Object},soundSettings:{type:Object},fontRenderer:{type:Object}};_dispatchClose(){c.publish("playSound",{key:"button_click",volume:.8,channel:"UI"}),this.dispatchEvent(new CustomEvent("close-modal",{bubbles:!0,composed:!0}))}_toggleSound(){c.publish("playSound",{key:"button_click",volume:.8,channel:"UI"}),c.publish("toggleSound")}_setVolume(t){const e=parseFloat(t.target.value);c.publish("setSoundVolume",{volume:e})}_testSound(){c.publish("playSound",{key:"jump",volume:.8,channel:"UI"})}render(){if(!this.keybinds||!this.soundSettings||!this.fontRenderer)return g``;const t=Object.keys(this.keybinds);return g`
      <div class="modal-overlay" @click=${this._dispatchClose}>
        <div class="modal-content" @click=${e=>e.stopPropagation()}>
          <button class="close-button" @click=${this._dispatchClose}></button>
          
          <div class="title-container">
            <bitmap-text .fontRenderer=${this.fontRenderer} text="Game Settings" scale="3" outlineColor="black" outlineWidth="2"></bitmap-text>
          </div>

          <div class="settings-section">
            <div class="section-title-container">
                <bitmap-text .fontRenderer=${this.fontRenderer} text="Sound Settings" scale="2.2"></bitmap-text>
            </div>
            
            <div class="setting-item">
              <div class="label-container">
                <bitmap-text .fontRenderer=${this.fontRenderer} text="Sound:" scale="1.8"></bitmap-text>
              </div>
              <button @click=${this._toggleSound} class="toggle-button ${this.soundSettings.soundEnabled?"sound-enabled":"sound-disabled"}">
                <bitmap-text .fontRenderer=${this.fontRenderer} text=${this.soundSettings.soundEnabled?"ON":"OFF"} scale="1.8"></bitmap-text>
              </button>
            </div>
            <div class="setting-item">
              <div class="label-container">
                <bitmap-text .fontRenderer=${this.fontRenderer} text="Global Volume:" scale="1.8"></bitmap-text>
              </div>
              <div class="volume-control">
                <input type="range" min="0" max="1" step="0.1" .value=${this.soundSettings.soundVolume} @input=${this._setVolume} />
                <bitmap-text .fontRenderer=${this.fontRenderer} text=${`${Math.round(this.soundSettings.soundVolume*100)}%`} scale="1.8"></bitmap-text>
              </div>
            </div>
             <div class="setting-item">
                <button @click=${this._testSound} class="action-button" ?disabled=${!this.soundSettings.soundEnabled}>
                    <bitmap-text .fontRenderer=${this.fontRenderer} text="Test Sound" scale="1.8"></bitmap-text>
                </button>
             </div>
          </div>

          <div class="settings-section">
            <div class="section-title-container">
                <bitmap-text .fontRenderer=${this.fontRenderer} text="Keybind Settings" scale="2.2"></bitmap-text>
            </div>
            <div class="keybind-list">
              ${st(t,e=>g`
                <div class="keybind-item">
                  <div class="label-container">
                    <bitmap-text .fontRenderer=${this.fontRenderer} text=${e.replace(/([A-Z])/g," $1").replace(/^./,i=>i.toUpperCase())} scale="1.8"></bitmap-text>
                  </div>
                  <keybind-display
                    .action=${e}
                    .currentKey=${this.keybinds[e]}
                    .fontRenderer=${this.fontRenderer}
                  ></keybind-display>
                </div>
              `)}
            </div>
          </div>
        </div>
      </div>
    `}}customElements.define("settings-menu",Gi);class Xi extends R{static styles=H`
    :host {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    }
    .modal-overlay {
      position: absolute;
      inset: 0;
      background-color: rgba(0, 0, 0, 0.7);
      display: flex; justify-content: center; align-items: center;
      z-index: 200;
    }
    .modal-content {
      background-color: #333; padding: 30px; border-radius: 12px;
      box-shadow: 0 8px 16px rgba(0, 0, 0, 0.5); color: #eee;
      text-align: center; position: relative; width: 90%;
      max-width: 500px;
    }
    .title-container {
      margin: 0 0 10px 0;
      display: flex;
      justify-content: center;
    }
    .subtitle-container {
      margin: 0 0 25px 0;
      display: flex;
      justify-content: center;
    }
    .stats-container {
        display: flex; flex-direction: column; align-items: center;
        gap: 12px; margin-bottom: 25px; padding: 15px;
        background-color: #444; border-radius: 8px;
    }
    /* No styles needed for .stat-item anymore, as bitmap-text handles it */
    .button-container { display: flex; justify-content: center; gap: 15px; }
    .modal-image-button {
        background: transparent; border: none; padding: 0;
        cursor: pointer; width: 48px; height: 48px;
        transition: transform 0.2s ease-in-out;
    }
    .modal-image-button:hover { transform: scale(1.1); }
    .modal-image-button img { width: 100%; height: 100%; }
  `;static properties={stats:{type:Object},fontRenderer:{type:Object}};constructor(){super(),this.stats={collectedFruits:0,totalFruits:0,deathCount:0,levelTime:0}}_dispatch(t){this.dispatchEvent(new CustomEvent(t,{bubbles:!0,composed:!0}))}render(){return g`
      <div class="modal-overlay">
        <div class="modal-content">
          <div class="title-container">
            <bitmap-text
              .fontRenderer=${this.fontRenderer}
              text="Game Paused"
              scale="3"
              outlineColor="black"
              outlineWidth="2"
            ></bitmap-text>
          </div>
          
          <div class="subtitle-container">
            <bitmap-text
                .fontRenderer=${this.fontRenderer}
                text="Press ESC to resume"
                scale="1.5"
                color="#ccc"
              ></bitmap-text>
          </div>

          <div class="stats-container">
            <bitmap-text .fontRenderer=${this.fontRenderer} text="Fruits: ${this.stats.collectedFruits}/${this.stats.totalFruits}" scale="1.8"></bitmap-text>
            <bitmap-text .fontRenderer=${this.fontRenderer} text="Deaths: ${this.stats.deathCount}" scale="1.8"></bitmap-text>
            <bitmap-text .fontRenderer=${this.fontRenderer} text="Time: ${Bt(this.stats.levelTime)}" scale="1.8"></bitmap-text>
          </div>
          
          <div class="button-container">
            <button class="modal-image-button" title="Resume" @click=${()=>this._dispatch("resume-game")}>
              <img src="/assets/Menu/Buttons/Play.png" alt="Resume">
            </button>
            <button class="modal-image-button" title="Restart" @click=${()=>this._dispatch("restart-level")}>
              <img src="/assets/Menu/Buttons/Restart.png" alt="Restart">
            </button>
            <button class="modal-image-button" title="Levels Menu" @click=${()=>this._dispatch("open-levels-menu")}>
              <img src="/assets/Menu/Buttons/Levels.png" alt="Main Menu">
            </button>
          </div>
        </div>
      </div>
    `}}customElements.define("pause-modal",Xi);class zi extends R{static styles=H`
    :host {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    }
    .modal-overlay {
      position: absolute;
      inset: 0;
      background-color: rgba(0, 0, 0, 0.7);
      display: flex; justify-content: center; align-items: center;
      z-index: 200;
    }
    
    /* --- MODIFICATION START --- */
    /* 1. The main content container is now a flex column. */
    .modal-content {
      background-color: #333;
      border-radius: 12px;
      box-shadow: 0 8px 16px rgba(0, 0, 0, 0.5);
      color: #eee;
      text-align: center;
      position: relative;
      width: 90%;
      max-width: 600px;
      max-height: 80vh;
      /* Flexbox layout to structure header, body, and footer */
      display: flex;
      flex-direction: column;
      /* Padding will be handled by inner elements now */
      padding: 20px;
      box-sizing: border-box;
    }

    /* 2. A new container for the scrollable level list. */
    .scrollable-content {
      flex-grow: 1; /* Allows this element to fill available space */
      overflow-y: auto; /* This is where the scrolling happens now */
      padding: 10px 5px; /* Add some padding for the scrollbar */
      margin: 0 -5px; /* Counteract padding to keep alignment clean */
    }
    
    /* 3. The footer is now a simple flex item, no longer absolutely positioned. */
    .footer-actions {
        flex-shrink: 0; /* Prevents the footer from shrinking */
        padding-top: 20px; /* Space between level list and button */
        display: flex;
        justify-content: center;
        align-items: center;
        border-top: 1px solid #444; /* Visual separator */
    }
    /* --- MODIFICATION END --- */

    .close-button {
      position: absolute; top: 15px; right: 15px; width: 32px; height: 32px;
      background-image: url('/assets/Menu/Buttons/Close.png');
      background-size: cover; background-color: transparent;
      border: none; cursor: pointer; border-radius: 50%;
      transition: transform 0.2s ease-in-out;
      z-index: 10; /* Ensure it's on top */
    }
    .close-button:hover { transform: scale(1.1); }
    
    .title-container {
      display: flex;
      justify-content: center;
      margin-bottom: 25px;
      flex-shrink: 0; /* Prevent header from shrinking */
    }
    
    #level-selection-container {
      display: flex; flex-direction: column; gap: 20px;
    }
    .level-section-menu {
      background-color: #3a3a3a; border-radius: 8px; padding: 15px; border: 1px solid #4a4a4a;
    }
    .section-title-container {
      margin: 0 0 15px 0;
      border-bottom: 2px solid #555;
      padding-bottom: 10px;
    }
    .level-grid {
      display: grid;
      grid-template-columns: repeat(5, 1fr);
      gap: 15px;
    }
    .level-button {
      background-color: #555; color: #fff; border: 2px solid #777;
      padding: 15px 10px; border-radius: 8px; cursor: pointer;
      font-size: 1.2em; font-weight: bold; transition: all 0.2s ease-in-out;
      display: flex; justify-content: center; align-items: center;
      min-height: 53px; box-sizing: border-box;
      aspect-ratio: 1 / 1;
    }
    .level-button:not(:disabled):hover {
      background-color: #007bff; border-color: #0056b3; transform: translateY(-2px);
    }
    .level-button.completed { background-color: #4CAF50; border-color: #45a049; }
    .level-button.current { border-color: #ffc107; box-shadow: 0 0 8px rgba(255, 193, 7, 0.7); }
    .level-button.locked { background-color: #444; color: #777; cursor: not-allowed; border-color: #666; }
    .level-button.locked svg { fill: #777; width: 24px; height: 24px; }

    .footer-button {
      background-color: #007bff; color: #fff; border: 2px solid #0056b3;
      padding: 10px 20px; border-radius: 8px; cursor: pointer;
      display: flex; justify-content: center; align-items: center;
      transition: all 0.2s ease-in-out;
    }
    .footer-button:hover {
      background-color: #0056b3;
    }
  `;static properties={gameState:{type:Object},fontRenderer:{type:Object}};_dispatchClose(){c.publish("playSound",{key:"button_click",volume:.8,channel:"UI"}),this.dispatchEvent(new CustomEvent("close-modal",{bubbles:!0,composed:!0}))}_selectLevel(t,e){this.dispatchEvent(new CustomEvent("level-selected",{detail:{sectionIndex:t,levelIndex:e},bubbles:!0,composed:!0}))}_openStatsModal(){c.publish("playSound",{key:"button_click",volume:.8,channel:"UI"}),c.publish("ui_button_clicked",{buttonId:"stats"})}render(){return this.gameState?g`
      <div class="modal-overlay" @click=${this._dispatchClose}>
        <div class="modal-content" @click=${t=>t.stopPropagation()}>
          <button class="close-button" @click=${this._dispatchClose}></button>
          
          <div class="title-container">
            <bitmap-text .fontRenderer=${this.fontRenderer} text="Levels Menu" scale="3" outlineColor="black" outlineWidth="2"></bitmap-text>
          </div>

          <!-- The new scrollable container -->
          <div class="scrollable-content">
            <div id="level-selection-container">
              ${st(F,(t,e)=>g`
                <div class="level-section-menu">
                  <div class="section-title-container">
                    <bitmap-text .fontRenderer=${this.fontRenderer} text=${t.name} scale="2"></bitmap-text>
                  </div>
                  <div class="level-grid">
                    ${st(t.levels,(i,s)=>{const n=this.gameState.isLevelUnlocked(e,s),a=this.gameState.isLevelCompleted(e,s),o=this.gameState.currentSection===e&&this.gameState.currentLevelIndex===s,r=`level-button ${a?"completed":""} ${o?"current":""} ${n?"":"locked"}`;return n?g`<button class=${r} @click=${()=>this._selectLevel(e,s)}>${s+1}</button>`:g`<button class=${r} disabled>
                              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zM9 8V6c0-1.66 1.34-3 3-3s3 1.34 3 3v2H9z"></path></svg>
                           </button>`})}
                  </div>
                </div>
              `)}
            </div>
          </div>

          <!-- The footer is now outside the scrollable area -->
          <div class="footer-actions">
            <button class="footer-button" @click=${this._openStatsModal}>
                <bitmap-text .fontRenderer=${this.fontRenderer} text="View Stats" scale="1.8"></bitmap-text>
            </button>
          </div>
        </div>
      </div>
    `:g``}}customElements.define("levels-menu",zi);class Yi extends R{static styles=H`
    :host {
      /* This allows the card to participate correctly in a flex/grid layout */
      display: flex;
    }
    .character-card {
      background-color: #555; border: 2px solid #777; border-radius: 8px;
      padding: 15px; display: flex; flex-direction: column;
      align-items: center; gap: 10px; transition: all 0.2s ease-in-out;
      position: relative;
      width: 100%; /* Fill the grid cell */
      box-sizing: border-box; /* Include padding in width calculation */
    }
    .character-card:not(.locked):hover { border-color: #007bff; transform: translateY(-3px); }
    .character-card.locked { opacity: 0.6; cursor: not-allowed; }
    .character-card.selected { border-color: #4CAF50; }
    
    .char-canvas {
      width: 64px; height: 64px; background-color: #444; border-radius: 6px;
      image-rendering: pixelated;
      flex-shrink: 0; /* Prevent canvas from shrinking */
    }
    .char-name-container { 
      margin-top: 5px;
    }
    .char-unlock-container { 
      display: flex; flex-direction: column; 
      justify-content: center; align-items: center;
      flex-grow: 1; /* This is key: it will take up available space, pushing the button down */
    }
    
    .select-button {
      background-color: #007bff; color: #fff; border: none; padding: 10px 15px;
      border-radius: 6px; cursor: pointer; width: 100%;
      transition: background-color 0.2s;
      display: flex; justify-content: center; align-items: center;
      margin-top: auto; /* Push the button to the bottom of the card */
      flex-shrink: 0; /* Prevent button from shrinking */
    }
    .select-button:hover:not(:disabled) { background-color: #0056b3; }
    
    .selected .select-button { background-color: #4CAF50; cursor: default; }
    .locked .select-button { background-color: #666; cursor: not-allowed; }
  `;static properties={characterId:{type:String},idleSprite:{type:Object},isLocked:{type:Boolean},isSelected:{type:Boolean},fontRenderer:{type:Object}};constructor(){super(),this.animationFrameId=null,this.animState={frame:0,timer:0,lastTime:0}}connectedCallback(){super.connectedCallback(),this.animationFrameId=requestAnimationFrame(this._animatePreview)}disconnectedCallback(){super.disconnectedCallback(),this.animationFrameId&&cancelAnimationFrame(this.animationFrameId)}_animatePreview=t=>{const e=this.shadowRoot.querySelector(".char-canvas");if(!e||!this.idleSprite){this.animationFrameId=requestAnimationFrame(this._animatePreview);return}this.animState.lastTime===0&&(this.animState.lastTime=t);const i=(t-this.animState.lastTime)/1e3;this.animState.lastTime=t,this.animState.timer+=i;const s=.08,n=11,a=this.idleSprite.width/n;if(this.animState.timer>=s){this.animState.timer=0,this.animState.frame=(this.animState.frame+1)%n;const o=e.getContext("2d");o.clearRect(0,0,e.width,e.height),o.drawImage(this.idleSprite,this.animState.frame*a,0,a,this.idleSprite.height,0,0,e.width,e.height)}this.animationFrameId=requestAnimationFrame(this._animatePreview)};_handleSelect(){this.isLocked||this.isSelected||this.dispatchEvent(new CustomEvent("character-selected",{detail:{characterId:this.characterId},bubbles:!0,composed:!0}))}render(){const t=ct[this.characterId],e=`character-card ${this.isLocked?"locked":""} ${this.isSelected?"selected":""}`,i=this.isLocked?"Locked":this.isSelected?"Selected":"Select";return g`
      <div class=${e}>
        <canvas class="char-canvas" width="64" height="64"></canvas>
        <div class="char-name-container">
            <bitmap-text .fontRenderer=${this.fontRenderer} .text=${t.name} scale="2"></bitmap-text>
        </div>
        <div class="char-unlock-container">
          ${this.isLocked?g`
                <bitmap-text .fontRenderer=${this.fontRenderer} text="Complete ${t.unlockRequirement} levels" scale="1.5" color="#ccc"></bitmap-text>
                <bitmap-text .fontRenderer=${this.fontRenderer} text="to unlock" scale="1.5" color="#ccc"></bitmap-text>
              `:g`<bitmap-text .fontRenderer=${this.fontRenderer} text="Available" scale="1.5" color="#ccc"></bitmap-text>`}
        </div>
        <button class="select-button" @click=${this._handleSelect} ?disabled=${this.isLocked||this.isSelected}>
          <bitmap-text .fontRenderer=${this.fontRenderer} .text=${i} scale="1.8"></bitmap-text>
        </button>
      </div>
    `}}customElements.define("character-card",Yi);class Ki extends R{static styles=H`
    .modal-overlay {
      position: absolute;
      inset: 0;
      background-color: rgba(0, 0, 0, 0.7);
      display: flex; justify-content: center; align-items: center;
      z-index: 200;
    }
    .modal-content {
      background-color: #333; padding: 30px; border-radius: 12px;
      box-shadow: 0 8px 16px rgba(0, 0, 0, 0.5); color: #eee;
      text-align: center; position: relative; width: 90%;
      /* Increase max-width to better accommodate wider cards on larger screens */
      max-width: 800px; 
      max-height: 80vh; overflow-y: auto;
      box-sizing: border-box; 
    }
    .close-button {
      position: absolute; top: 15px; right: 15px; width: 32px; height: 32px;
      background-image: url('/assets/Menu/Buttons/Close.png');
      background-size: cover; background-color: transparent;
      border: none; cursor: pointer; border-radius: 50%;
      transition: transform 0.2s ease-in-out;
    }
    .close-button:hover { transform: scale(1.1); }
    .title-container, .subtitle-container {
        display: flex;
        justify-content: center;
        margin-bottom: 10px;
    }
    .subtitle-container {
        margin-bottom: 25px;
    }
    
    #character-selection-container {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(190px, 1fr));
      gap: 20px;
      padding: 10px;
      grid-auto-rows: 1fr;
    }
  `;static properties={gameState:{type:Object},assets:{type:Object},fontRenderer:{type:Object}};_dispatchClose(){c.publish("playSound",{key:"button_click",volume:.8,channel:"UI"}),this.dispatchEvent(new CustomEvent("close-modal",{bubbles:!0,composed:!0}))}render(){if(!this.gameState||!this.assets)return g`<div class="modal-overlay">Loading...</div>`;const t=Object.keys(ct);return g`
        <div class="modal-overlay" @click=${this._dispatchClose}>
            <div class="modal-content" @click=${e=>e.stopPropagation()}>
                <button class="close-button" @click=${this._dispatchClose}></button>
                <div class="title-container">
                    <bitmap-text .fontRenderer=${this.fontRenderer} text="Character Selection" scale="3" outlineColor="black" outlineWidth="2"></bitmap-text>
                </div>
                <div class="subtitle-container">
                    <bitmap-text .fontRenderer=${this.fontRenderer} text="Choose Your Hero!" scale="2"></bitmap-text>
                </div>
                <div id="character-selection-container">
                    ${st(t,e=>g`
                        <character-card
                            .characterId=${e}
                            .idleSprite=${this.assets.characters[e]?.playerIdle}
                            .isLocked=${!this.gameState.isCharacterUnlocked(e)}
                            .isSelected=${this.gameState.selectedCharacter===e}
                            .fontRenderer=${this.fontRenderer}
                        ></character-card>
                    `)}
                </div>
            </div>
        </div>
    `}}customElements.define("character-menu",Ki);class Vi extends R{static styles=H`
    :host {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    }
    .modal-overlay {
      position: absolute;
      inset: 0;
      background-color: rgba(0, 0, 0, 0.7);
      display: flex; justify-content: center; align-items: center;
      z-index: 200;
    }
    .modal-content {
      background-color: #333; padding: 30px; border-radius: 12px;
      box-shadow: 0 8px 16px rgba(0, 0, 0, 0.5); color: #eee;
      text-align: center; position: relative; width: 90%;
      max-width: 600px; max-height: 80vh; overflow-y: auto;
    }
    .close-button {
      position: absolute; top: 15px; right: 15px; width: 32px; height: 32px;
      background-image: url('/assets/Menu/Buttons/Close.png');
      background-size: cover; background-color: transparent;
      border: none; cursor: pointer; border-radius: 50%;
      transition: transform 0.2s ease-in-out;
    }
    .close-button:hover { transform: scale(1.1); }
    .title-container, .subtitle-container {
        display: flex;
        justify-content: center;
        margin-bottom: 10px;
    }
    .subtitle-container {
        border-bottom: 2px solid #666;
        padding-bottom: 10px;
        margin-bottom: 20px;
    }
    .settings-section { padding: 20px; background-color: #444; border-radius: 8px; border: 1px solid #555; }
    .how-to-play p { line-height: 1.6; margin-bottom: 20px; text-align: left; }
    .keybind-list { display: flex; flex-direction: column; gap: 15px; }
    .keybind-item {
        display: flex; justify-content: space-between; align-items: center;
        background-color: #555; padding: 12px 15px; border-radius: 8px;
    }
    .keybind-item label { text-align: left; flex-grow: 1; }
    .key-display-container { display: flex; gap: 5px; align-items: center; }
    .key-display {
      background-color: #666; color: #fff; border: 1px solid #777;
      border-radius: 6px; text-align: center;
      min-width: 20px;
      /* Ensure container for bitmap text has a size */
      display: flex;
      justify-content: center;
      align-items: center;
      padding: 5px 8px;
    }
  `;static properties={keybinds:{type:Object},fontRenderer:{type:Object}};_dispatchClose(){c.publish("playSound",{key:"button_click",volume:.8,channel:"UI"}),this.dispatchEvent(new CustomEvent("close-modal",{bubbles:!0,composed:!0}))}render(){return this.keybinds?g`
      <div class="modal-overlay" @click=${this._dispatchClose}>
        <div class="modal-content" @click=${t=>t.stopPropagation()}>
          <button class="close-button" @click=${this._dispatchClose}></button>
          
          <div class="title-container">
            <bitmap-text .fontRenderer=${this.fontRenderer} text="Info Section" scale="3" outlineColor="black" outlineWidth="2"></bitmap-text>
          </div>

          <div class="settings-section">
            <div class="subtitle-container">
                <bitmap-text .fontRenderer=${this.fontRenderer} text="How to Play" scale="2"></bitmap-text>
            </div>
            
            <div class="how-to-play">
              <p>Use the controls to navigate the world, collect all the fruit, and reach the trophy!</p>
              <p>You can also jump off of most walls! While in the air, move against a wall to slide down it, then press the jump key again to wall jump away.</p>
              <p>Beware of traps and enemies—an unknown world is full of hidden dangers.</p>
              <p><strong>Note:</strong> You cannot cling to special surfaces like sand, mud, or ice.</p>
              <div class="keybind-list">
                
                <div class="keybind-item">
                  <label>Move Left / Right:</label>
                  <div class="key-display-container">
                    <div class="key-display">
                        <bitmap-text .fontRenderer=${this.fontRenderer} text=${B(this.keybinds.moveLeft)} scale="1.5"></bitmap-text>
                    </div>
                    <span>/</span>
                    <div class="key-display">
                        <bitmap-text .fontRenderer=${this.fontRenderer} text=${B(this.keybinds.moveRight)} scale="1.5"></bitmap-text>
                    </div>
                  </div>
                </div>

                <div class="keybind-item">
                  <label>Jump / Double Jump / Wall Jump:</label>
                  <div class="key-display">
                    <bitmap-text .fontRenderer=${this.fontRenderer} text=${B(this.keybinds.jump)} scale="1.5"></bitmap-text>
                  </div>
                </div>

                <div class="keybind-item">
                  <label>Dash:</label>
                  <div class="key-display">
                    <bitmap-text .fontRenderer=${this.fontRenderer} text=${B(this.keybinds.dash)} scale="1.5"></bitmap-text>
                  </div>
                </div>

                <div class="keybind-item">
                  <label>Pause Game:</label>
                  <div class="key-display">
                    <bitmap-text .fontRenderer=${this.fontRenderer} text="ESC" scale="1.5"></bitmap-text>
                  </div>
                </div>

              </div>
            </div>
          </div>
        </div>
      </div>
    `:g``}}customElements.define("info-modal",Vi);class qi extends R{static styles=H`
    .modal-overlay {
      position: absolute;
      inset: 0;
      background-color: rgba(0, 0, 0, 0.7);
      display: flex; justify-content: center; align-items: center; z-index: 300;
    }
    .modal-content {
      background-color: #333; padding: 30px; border-radius: 12px;
      box-shadow: 0 8px 16px rgba(0, 0, 0, 0.5); color: #eee;
      text-align: center; position: relative; width: 90%; max-width: 500px;
    }
    .title-container { display: flex; justify-content: center; margin-bottom: 25px; }
    .stats-container {
      display: flex; flex-direction: column; align-items: center;
      gap: 12px; margin-bottom: 25px; padding: 15px;
      background-color: #444; border-radius: 8px;
    }
    .button-container { display: flex; justify-content: center; gap: 15px; }
    .modal-image-button {
      background: transparent; border: none; padding: 0;
      cursor: pointer; width: 48px; height: 48px;
      transition: transform 0.2s ease-in-out;
    }
    .modal-image-button:hover:not(:disabled) { transform: scale(1.1); }
    .modal-image-button:disabled { cursor: not-allowed; filter: grayscale(1); opacity: 0.6; }
    .modal-image-button img { width: 100%; height: 100%; }
  `;static properties={stats:{type:Object},hasNextLevel:{type:Boolean},hasPreviousLevel:{type:Boolean},fontRenderer:{type:Object}};_dispatch(t){this.dispatchEvent(new CustomEvent(t))}render(){return this.stats?g`
      <div class="modal-overlay">
        <div class="modal-content">
          <div class="title-container">
            <bitmap-text .fontRenderer=${this.fontRenderer} text="Level Complete!" scale="3" outlineColor="black" outlineWidth="2"></bitmap-text>
          </div>
          <div class="stats-container">
            <bitmap-text .fontRenderer=${this.fontRenderer} text="Deaths: ${this.stats.deaths}" scale="1.8"></bitmap-text>
            <bitmap-text .fontRenderer=${this.fontRenderer} text="Time: ${Bt(this.stats.time)}" scale="1.8"></bitmap-text>
          </div>
          <div class="button-container">
            <button class="modal-image-button" title="Previous Level" ?disabled=${!this.hasPreviousLevel} @click=${()=>this._dispatch("previous-level")}>
              <img src="/assets/Menu/Buttons/Previous.png" alt="Previous">
            </button>
            <button class="modal-image-button" title="Restart Level" @click=${()=>this._dispatch("restart-level")}>
              <img src="/assets/Menu/Buttons/Restart.png" alt="Restart">
            </button>
            <button class="modal-image-button" title="Next Level" ?disabled=${!this.hasNextLevel} @click=${()=>this._dispatch("next-level")}>
              <img src="/assets/Menu/Buttons/Next.png" alt="Next">
            </button>
          </div>
        </div>
      </div>
    `:g``}}customElements.define("level-complete-modal",qi);class Zi extends R{static styles=H`
    :host {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    }
    .modal-overlay {
      position: absolute;
      inset: 0;
      background-color: rgba(0, 0, 0, 0.7);
      display: flex; justify-content: center; align-items: center;
      z-index: 250;
    }
    .modal-content {
      background-color: #333; padding: 30px; border-radius: 12px;
      box-shadow: 0 8px 16px rgba(0, 0, 0, 0.5); color: #eee;
      text-align: center; position: relative; width: 90%;
      max-width: 700px; max-height: 80vh; overflow-y: auto;
    }
    .close-button {
      position: absolute; top: 15px; right: 15px; width: 32px; height: 32px;
      background-image: url('/assets/Menu/Buttons/Close.png');
      background-size: cover; background-color: transparent;
      border: none; cursor: pointer; border-radius: 50%;
      transition: transform 0.2s ease-in-out;
    }
    .close-button:hover { transform: scale(1.1); }
    
    .title-container {
      display: flex;
      justify-content: center;
      margin-bottom: 25px;
    }
    
    .stats-list-container {
      display: flex; flex-direction: column; gap: 20px; padding: 10px;
    }
    .level-section-stats {
      background-color: #3a3a3a; border-radius: 8px; padding: 15px; border: 1px solid #4a4a4a;
    }
    .section-title-container {
      margin: 0 0 15px 0;
      border-bottom: 2px solid #555;
      padding-bottom: 10px;
    }
    .stats-grid {
      display: grid;
      grid-template-columns: 1fr;
      gap: 15px;
    }
    .stat-row {
      display: grid;
      grid-template-columns: 100px repeat(3, 1fr);
      align-items: center;
      background-color: #444;
      padding: 10px 15px;
      border-radius: 6px;
      gap: 10px;
      text-align: left;
    }
    .stat-header {
        font-weight: bold;
        color: #ccc;
    }
    .stat-header .stat-cell {
        justify-content: center;
        border-bottom: 1px solid #666;
        padding-bottom: 8px;
    }
    .stat-cell {
        display: flex;
        justify-content: center;
        align-items: center;
    }
    .stat-cell.level-name {
        font-weight: bold;
        justify-content: flex-start;
    }
  `;static properties={gameState:{type:Object},fontRenderer:{type:Object}};_dispatchClose(){c.publish("playSound",{key:"button_click",volume:.8,channel:"UI"}),this.dispatchEvent(new CustomEvent("close-modal",{bubbles:!0,composed:!0}))}_getStatDisplay(t,e=null){return t==null?"-":e?e(t):t.toString()}render(){if(!this.gameState||!this.gameState.levelStats)return g``;const{levelStats:t}=this.gameState;return g`
      <div class="modal-overlay" @click=${this._dispatchClose}>
        <div class="modal-content" @click=${e=>e.stopPropagation()}>
          <button class="close-button" @click=${this._dispatchClose}></button>
          <div class="title-container">
            <bitmap-text .fontRenderer=${this.fontRenderer} text="Level Statistics" scale="3" outlineColor="black" outlineWidth="2"></bitmap-text>
          </div>
          <div class="stats-list-container">
            ${st(F,(e,i)=>g`
              <div class="level-section-stats">
                <div class="section-title-container">
                  <bitmap-text .fontRenderer=${this.fontRenderer} text=${e.name} scale="2"></bitmap-text>
                </div>
                <div class="stats-grid">
                    <div class="stat-row stat-header">
                        <div class="stat-cell level-name">Level</div>
                        <div class="stat-cell">Fastest Time</div>
                        <div class="stat-cell">Lowest Deaths</div>
                        <div class="stat-cell">Attempts</div>
                    </div>

                  ${st(e.levels,(s,n)=>{const a=`${i}-${n}`,o=t[a]||{fastestTime:null,lowestDeaths:null,totalAttempts:0};return g`
                        <div class="stat-row">
                            <div class="stat-cell level-name">Level ${n+1}</div>
                            <div class="stat-cell">${this._getStatDisplay(o.fastestTime,Bt)}</div>
                            <div class="stat-cell">${this._getStatDisplay(o.lowestDeaths)}</div>
                            <div class="stat-cell">${this._getStatDisplay(o.totalAttempts)}</div>
                        </div>
                    `})}
                </div>
              </div>
            `)}
          </div>
        </div>
      </div>
    `}}customElements.define("stats-modal",Zi);class Ji extends R{static styles=H`
    :host {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    }
    .modal-overlay {
      position: absolute; inset: 0; background-color: rgba(0, 0, 0, 0.7);
      display: flex; justify-content: center; align-items: center; z-index: 400;
    }
    .modal-content {
      background-color: #333; padding: 30px; border-radius: 12px;
      box-shadow: 0 8px 16px rgba(0, 0, 0, 0.5); color: #eee;
      text-align: center; position: relative; width: 90%; max-width: 700px;
      max-height: 90vh; overflow-y: auto; display: flex; flex-direction: column; gap: 20px;
    }
    .title-container, .section-title-container {
      display: flex; justify-content: center;
    }
    .section {
      background-color: #444; border-radius: 8px; border: 1px solid #555;
      padding: 15px; text-align: left; display: flex; flex-direction: column; gap: 15px;
    }
    p { margin: 0; line-height: 1.6; }
    .controls-grid {
      display: grid; grid-template-columns: auto 1fr; gap: 10px 20px; align-items: center;
    }
    .key-display {
      background-color: #666; color: #fff; border: 1px solid #777;
      border-radius: 6px; text-align: center;
      min-width: 20px; display: inline-flex; justify-content: center;
      align-items: center; padding: 5px 8px;
    }
    .action-button {
      background-color: #007bff; color: #fff; border: 2px solid #0056b3;
      padding: 10px 20px; border-radius: 8px; cursor: pointer;
      display: flex; justify-content: center; align-items: center;
      transition: all 0.2s ease-in-out; margin-top: 10px;
    }
    .action-button:hover { background-color: #0056b3; }
  `;static properties={keybinds:{type:Object},fontRenderer:{type:Object}};_dispatchClose(){c.publish("playSound",{key:"button_click",volume:.8,channel:"UI"}),this.dispatchEvent(new CustomEvent("close-modal",{bubbles:!0,composed:!0}))}render(){return!this.keybinds||!this.fontRenderer?g``:g`
      <div class="modal-overlay">
        <div class="modal-content" @click=${t=>t.stopPropagation()}>
          <div class="title-container">
            <bitmap-text .fontRenderer=${this.fontRenderer} text="Welcome to Parkour Hero!" scale="3" outlineColor="black" outlineWidth="2"></bitmap-text>
          </div>

          <div class="section">
            <div class="section-title-container">
                <bitmap-text .fontRenderer=${this.fontRenderer} text="The Goal" scale="2.2"></bitmap-text>
            </div>
            <p>Your mission is to collect all the fruit to unlock the trophy, then reach it to complete the level!</p>
          </div>

          <div class="section">
            <div class="section-title-container">
                <bitmap-text .fontRenderer=${this.fontRenderer} text="Basic Controls" scale="2.2"></bitmap-text>
            </div>
            <div class="controls-grid">
                <span>Move Left / Right</span>
                <div style="display: flex; gap: 5px;">
                    <div class="key-display"><bitmap-text .fontRenderer=${this.fontRenderer} text=${B(this.keybinds.moveLeft)} scale="1.5"></bitmap-text></div>
                    <div class="key-display"><bitmap-text .fontRenderer=${this.fontRenderer} text=${B(this.keybinds.moveRight)} scale="1.5"></bitmap-text></div>
                </div>
                <span>Jump</span>
                <div class="key-display"><bitmap-text .fontRenderer=${this.fontRenderer} text=${B(this.keybinds.jump)} scale="1.5"></bitmap-text></div>
                <span>Dash</span>
                <div class="key-display"><bitmap-text .fontRenderer=${this.fontRenderer} text=${B(this.keybinds.dash)} scale="1.5"></bitmap-text></div>
            </div>
             <p><strong>Advanced Moves:</strong> Press Jump in the air for a <strong>Double Jump</strong>. Move into a wall while falling to slide, then press Jump for a <strong>Wall Jump</strong>!</p>
          </div>

          <div class="section">
            <div class="section-title-container">
                <bitmap-text .fontRenderer=${this.fontRenderer} text="Enemies & Environment" scale="2.2"></bitmap-text>
            </div>
            <p>This world is full of critters! Most can be defeated by jumping on their heads. Bumping into them from the side is a bad idea. Some foes are trickier than they look!</p>
            <p>Also, be sure to avoid dangerous traps as you traverse each section! Luckily, fruits do heal you from most damage.</p>
          </div>

          <div class="section">
            <div class="section-title-container">
                <bitmap-text .fontRenderer=${this.fontRenderer} text="Interface" scale="2.2"></bitmap-text>
            </div>
            <p>The buttons in the top-right corner allow you to change settings, pause the game, select levels, and more at any time.</p>
          </div>

          <button class="action-button" @click=${this._dispatchClose}>
            <bitmap-text .fontRenderer=${this.fontRenderer} text="Got It!" scale="2"></bitmap-text>
          </button>
        </div>
      </div>
    `}}customElements.define("tutorial-modal",Ji);class Qi extends R{static styles=H`
    .main-menu-overlay {
      position: absolute;
      inset: 0;
      background-image: url('/assets/Background/Main Menu.png');
      background-size: cover; background-position: center; z-index: 500;
      display: flex; justify-content: center; align-items: center;
      flex-direction: column;
    }
    .main-menu-container { display: flex; flex-direction: column; align-items: center; gap: 40px; }
    
    .main-menu-buttons { display: flex; flex-direction: column; gap: 20px; width: 250px; }
    .main-menu-buttons button {
      background-color: #007bff; border: 3px solid #0056b3;
      padding: 15px 25px; border-radius: 12px; cursor: pointer;
      transition: all 0.2s ease-in-out;
      box-shadow: 0 6px #004a99;
      display: flex;
      justify-content: center;
      align-items: center;
    }
    .main-menu-buttons button:hover { background-color: #0056b3; transform: translateY(-2px); box-shadow: 0 8px #004a99; }
    .main-menu-buttons button:active { transform: translateY(2px); box-shadow: 0 2px #004a99; }

    .loading-container {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        color: white;
        text-shadow: 2px 2px 4px #000000;
    }
    .loading-text {
        font-size: 4em;
        font-family: 'Arial', sans-serif; /* Fallback font */
        font-weight: bold;
        margin-bottom: 20px;
    }
    .loading-spinner {
        border: 8px solid rgba(255, 255, 255, 0.3);
        border-radius: 50%;
        border-top: 8px solid #fff;
        width: 60px;
        height: 60px;
        animation: spin 1s linear infinite;
    }
    @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
    }
  `;static properties={activeModal:{type:String,state:!0},gameHasStarted:{type:Boolean,state:!0},keybinds:{type:Object,state:!0},soundSettings:{type:Object,state:!0},currentStats:{type:Object,state:!0},gameState:{type:Object,state:!0},assets:{type:Object,state:!0},fontRenderer:{type:Object},levelCompleteStats:{type:Object,state:!0}};constructor(){super(),this.activeModal="main-menu",this.gameHasStarted=!1,this.keybinds={moveLeft:"a",moveRight:"d",jump:"w",dash:" "},this.soundSettings={soundEnabled:!0,soundVolume:.5},this.currentStats={},this.gameState=null,this.assets=null,this.fontRenderer=null,this.levelCompleteStats=null}connectedCallback(){super.connectedCallback(),c.subscribe("requestStartGame",this._handleStartGame),c.subscribe("soundSettingsChanged",this._handleSoundUpdate),c.subscribe("keybindsUpdated",this._handleKeybindsUpdate),c.subscribe("ui_button_clicked",this._handleUIButtonClick),c.subscribe("statsUpdated",this._handleStatsUpdate),c.subscribe("action_escape_pressed",this._handleEscapePress),c.subscribe("levelLoaded",this._handleLevelLoad),c.subscribe("gameStateUpdated",t=>this.gameState=t),c.subscribe("assetsLoaded",t=>this.assets=t),c.subscribe("levelComplete",t=>this.levelCompleteStats=t)}disconnectedCallback(){super.disconnectedCallback(),c.unsubscribe("requestStartGame",this._handleStartGame),c.unsubscribe("soundSettingsChanged",this._handleSoundUpdate),c.unsubscribe("keybindsUpdated",this._handleKeybindsUpdate),c.unsubscribe("ui_button_clicked",this._handleUIButtonClick),c.unsubscribe("statsUpdated",this._handleStatsUpdate),c.unsubscribe("action_escape_pressed",this._handleEscapePress),c.unsubscribe("levelLoaded",this._handleLevelLoad),c.unsubscribe("gameStateUpdated",t=>this.gameState=t),c.unsubscribe("assetsLoaded",t=>this.assets=t),c.unsubscribe("levelComplete",t=>this.levelCompleteStats=t)}_handleLevelLoad=({gameState:t})=>{this.gameState=t,this.levelCompleteStats=null,this.gameHasStarted||(this.gameHasStarted=!0),this.activeModal=null,t.currentSection===0&&t.currentLevelIndex===0&&!t.tutorialShown&&(this.activeModal="tutorial",c.publish("menuOpened"))};_handleStartGame=()=>{this.gameHasStarted=!0,this.activeModal=null,c.publish("allMenusClosed")};_handleSoundUpdate=t=>{this.soundSettings={...t}};_handleKeybindsUpdate=t=>{this.keybinds={...t}};_handleStatsUpdate=t=>{this.currentStats={...t}};_handleUIButtonClick=({buttonId:t})=>{t==="pause"?this.activeModal?this._closeModal():this.gameHasStarted&&(this.activeModal="pause",c.publish("menuOpened")):t==="stats"?(this.activeModal="stats",c.publish("menuOpened")):(this.activeModal=t,c.publish("menuOpened"))};_handleEscapePress=()=>{this.levelCompleteStats||(this.activeModal?this._closeModal():this.gameHasStarted&&(this.activeModal="pause",c.publish("menuOpened")))};_handleKeybindChange=t=>{const{action:e,newKey:i}=t.detail,s={...this.keybinds,[e]:i};c.publish("keybindsUpdated",s)};_closeModal=()=>{const t=this.activeModal!==null,e=this.activeModal;if(this.activeModal=this.gameHasStarted?null:"main-menu",t&&this.gameHasStarted){if(e==="tutorial"){const i=this.gameState.markTutorialAsShown();i!==this.gameState&&(this.gameState=i,c.publish("gameStateUpdated",this.gameState))}c.publish("allMenusClosed")}};_openModalFromMenu(t){c.publish("playSound",{key:"button_click",volume:.8,channel:"UI"}),this.activeModal=t}_handleRestart(){this._closeModal(),c.publish("requestLevelRestart")}_handleOpenLevelsMenu(){this.activeModal="levels"}_handleLevelSelected(t){const{sectionIndex:e,levelIndex:i}=t.detail;c.publish("requestLevelLoad",{sectionIndex:e,levelIndex:i})}_handleCharacterSelected(t){const{characterId:e}=t.detail,i=this.gameState.setSelectedCharacter(e);i!==this.gameState&&(this.gameState=i,c.publish("gameStateUpdated",this.gameState)),c.publish("playSound",{key:"button_click",volume:.8,channel:"UI"}),c.publish("characterUpdated",e)}_handleLevelAction(t){this.levelCompleteStats=null,t==="restart"?c.publish("requestLevelRestart"):t==="next"?c.publish("requestNextLevel"):t==="previous"&&c.publish("requestPreviousLevel")}render(){if(this.levelCompleteStats)return g`
        <level-complete-modal
          .stats=${this.levelCompleteStats}
          .hasNextLevel=${this.levelCompleteStats.hasNextLevel}
          .hasPreviousLevel=${this.levelCompleteStats.hasPreviousLevel}
          .fontRenderer=${this.fontRenderer}
          @next-level=${()=>this._handleLevelAction("next")}
          @restart-level=${()=>this._handleLevelAction("restart")}
          @previous-level=${()=>this._handleLevelAction("previous")}
        ></level-complete-modal>
      `;const t=!this.assets||!this.fontRenderer;return this.gameHasStarted?this.renderActiveModal():g`
        <div class="main-menu-overlay">
          ${t?this.renderLoadingScreen():this.activeModal==="main-menu"?this.renderMainMenuContent():this.renderActiveModal()}
        </div>
      `}renderLoadingScreen(){return g`
        <div class="loading-container">
            <div class="loading-text">LOADING...</div>
            <div class="loading-spinner"></div>
        </div>
      `}renderMainMenuContent(){const i=[{text:this.gameState&&(this.gameState.levelProgress.completedLevels.length>0||this.gameState.levelProgress.unlockedLevels[0]>1)?"Continue":"Start Game",action:()=>c.publish("requestStartGame")},{text:"Levels",action:()=>this._openModalFromMenu("levels")},{text:"Character",action:()=>this._openModalFromMenu("character")},{text:"Settings",action:()=>this._openModalFromMenu("settings")},{text:"How to Play",action:()=>this._openModalFromMenu("info")},{text:"Stats",action:()=>this._openModalFromMenu("stats")}];return g`
      <div class="main-menu-container">
        <bitmap-text
          .fontRenderer=${this.fontRenderer} text="Parkour Hero" scale="9" outlineColor="black" outlineWidth="2"
        ></bitmap-text>
        <div class="main-menu-buttons">
          ${i.map(s=>g`
            <button @click=${s.action}>
              <bitmap-text .fontRenderer=${this.fontRenderer} text=${s.text} scale="2.5" outlineColor="#004a99" outlineWidth="1"></bitmap-text>
            </button>
          `)}
        </div>
      </div>
    `}renderActiveModal(){switch(this.activeModal){case"tutorial":return g`<tutorial-modal
                      .keybinds=${this.keybinds}
                      .fontRenderer=${this.fontRenderer}
                      @close-modal=${this._closeModal}
                    ></tutorial-modal>`;case"settings":return g`<settings-menu 
                      .keybinds=${this.keybinds} .soundSettings=${this.soundSettings} .fontRenderer=${this.fontRenderer}
                      @close-modal=${this._closeModal} @keybind-changed=${this._handleKeybindChange}
                    ></settings-menu>`;case"pause":return g`<pause-modal
                      .stats=${this.currentStats} .fontRenderer=${this.fontRenderer}
                      @resume-game=${this._closeModal} @restart-level=${this._handleRestart} @open-levels-menu=${this._handleOpenLevelsMenu}
                    ></pause-modal>`;case"levels":return g`<levels-menu
                      .gameState=${this.gameState} .fontRenderer=${this.fontRenderer}
                      @close-modal=${this._closeModal} @level-selected=${this._handleLevelSelected}
                    ></levels-menu>`;case"character":return g`<character-menu
                      .gameState=${this.gameState} .assets=${this.assets} .fontRenderer=${this.fontRenderer}
                      @close-modal=${this._closeModal} @character-selected=${this._handleCharacterSelected}
                    ></character-menu>`;case"info":return g`<info-modal
                      .keybinds=${this.keybinds}
                      .fontRenderer=${this.fontRenderer}
                      @close-modal=${this._closeModal}
                    ></info-modal>`;case"stats":return g`<stats-modal
                      .gameState=${this.gameState}
                      .fontRenderer=${this.fontRenderer}
                      @close-modal=${this._closeModal}
                    ></stats-modal>`;default:return g``}}}customElements.define("parkour-hero-ui",Qi);const oe=document.getElementById("ui-root");oe?ye(document.createElement("parkour-hero-ui"),oe):console.error("UI Root element #ui-root not found. UI cannot be initialized.");const S=document.getElementById("gameCanvas"),yt=document.getElementById("particleCanvas"),x=S.getContext("2d"),be=yt.getContext("webgl2",{alpha:!0}),Lt=document.getElementById("ui-root");if(!S||!yt||!x||!be)throw console.error("A required canvas or context is not available"),document.body.innerHTML="<h1>Error: Canvas or WebGL2 not supported</h1>",new Error("Canvas or WebGL2 not available");x.imageSmoothingEnabled=!1;const Nt=1920,Wt=1080;S.width=Nt;S.height=Wt;yt.width=Nt;yt.height=Wt;console.log(`Canvases initialized: ${Nt}x${Wt}`);function ve(){try{const h=1.7777777777777777,t=window.innerWidth/window.innerHeight;let e,i;t>h?(i=window.innerHeight,e=i*h):(e=window.innerWidth,i=e/h);const s=Math.floor(e),n=Math.floor(i),a=`${(window.innerWidth-s)/2}px`,o=`${(window.innerHeight-n)/2}px`;[S,yt,Lt].forEach(l=>{l&&(l.style.width=`${s}px`,l.style.height=`${n}px`,l.style.position="absolute",l.style.left=a,l.style.top=o)}),Lt&&(Lt.style.overflow="hidden"),console.log(`Canvases resized to: ${s}x${n} (display size)`)}catch(h){console.error("Error resizing canvas:",h)}}window.addEventListener("resize",ve);ve();function ts(){x.fillStyle="#222",x.fillRect(0,0,S.width,S.height),x.fillStyle="white",x.font="24px sans-serif",x.textAlign="center",x.fillText("Loading Assets...",S.width/2,S.height/2);const h=300,t=20,e=(S.width-h)/2,i=S.height/2+30;x.strokeStyle="white",x.lineWidth=2,x.strokeRect(e,i,h,t),x.fillStyle="#4CAF50",x.fillRect(e,i,h*.1,t)}ts();let es={moveLeft:"a",moveRight:"d",jump:"w",dash:" "},$;vi().then(h=>{console.log("Assets loaded successfully, preparing main menu...");try{const t=new xi(h.font_spritesheet);$=new fi(x,be,S,h,es,t),c.publish("assetsLoaded",h);const e=document.querySelector("parkour-hero-ui");e&&(e.fontRenderer=t),c.subscribe("requestStartGame",()=>{$.start()}),window.unlockAllLevels=()=>{$&&$.gameState&&($.gameState=$.gameState.unlockAllLevels(),c.publish("gameStateUpdated",$.gameState),console.log("All levels have been unlocked."))},console.log("Developer command available: Type `unlockAllLevels()` in the console to unlock all levels."),window.resetProgress=()=>{$&&$.gameState&&($.gameState=$.gameState.resetProgress(),$.loadLevel(0,0),console.log("Game progress has been reset."))},console.log("Developer command available: Type `resetProgress()` in the console to reset all saved data."),console.log("Game is ready. Waiting for user to start from the main menu.")}catch(t){console.error("Failed to start game engine:",t),x.fillStyle="#222",x.fillRect(0,0,S.width,S.height),x.fillStyle="red",x.font="24px sans-serif",x.textAlign="center",x.fillText("Game Failed to Start",S.width/2,S.height/2-20),x.fillStyle="white",x.font="16px sans-serif",x.fillText("Check console for details",S.width/2,S.height/2+20)}}).catch(h=>{console.error("Asset loading failed:",h),x.fillStyle="#222",x.fillRect(0,0,S.width,S.height),x.fillStyle="red",x.font="24px sans-serif",x.textAlign="center",x.fillText("Failed to Load Assets",S.width/2,S.height/2-20),x.fillStyle="white",x.font="16px sans-serif",x.fillText("Check console for details",S.width/2,S.height/2+20)});window.addEventListener("error",h=>{console.error("Global error:",h.error)});window.addEventListener("unhandledrejection",h=>{console.error("Unhandled promise rejection:",h.reason)});console.log("Game initialization started");console.log("Canvas dimensions:",S.width,"x",S.height);console.log("Device pixel ratio:",window.devicePixelRatio);console.log("User agent:",navigator.userAgent);
