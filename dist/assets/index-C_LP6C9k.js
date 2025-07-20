(function(){const e=document.createElement("link").relList;if(e&&e.supports&&e.supports("modulepreload"))return;for(const i of document.querySelectorAll('link[rel="modulepreload"]'))s(i);new MutationObserver(i=>{for(const n of i)if(n.type==="childList")for(const a of n.addedNodes)a.tagName==="LINK"&&a.rel==="modulepreload"&&s(a)}).observe(document,{childList:!0,subtree:!0});function t(i){const n={};return i.integrity&&(n.integrity=i.integrity),i.referrerPolicy&&(n.referrerPolicy=i.referrerPolicy),i.crossOrigin==="use-credentials"?n.credentials="include":i.crossOrigin==="anonymous"?n.credentials="omit":n.credentials="same-origin",n}function s(i){if(i.ep)return;i.ep=!0;const n=t(i);fetch(i.href,n)}})();class C{constructor(e=0,t=0){this.x=e,this.y=t}}class T{constructor({type:e="dynamic",solid:t=!1,hazard:s=!1,width:i,height:n,isGrounded:a=!1,isAgainstWall:r=!1,groundType:l=null}){this.type=e,this.solid=t,this.hazard=s,this.width=i,this.height=n,this.isGrounded=a,this.isAgainstWall=r,this.groundType=l}}class st{constructor(e,t){this.zoom=1.8,this.viewportWidth=e,this.viewportHeight=t,this.width=this.viewportWidth/this.zoom,this.height=this.viewportHeight/this.zoom,this.levelWidth=this.width,this.levelHeight=this.height,this.followSpeed=5,this.deadZone={x:this.width*.2,y:this.height*.2},this.minX=0,this.maxX=0,this.minY=0,this.maxY=0,this.shakeTimer=0,this.shakeIntensity=0,this.shakeInitialIntensity=0,this.shakeDuration=0,this.shakeX=0,this.shakeY=0,this.targetX=0,this.targetY=0,console.log("Camera initialized:",{viewport:`${this.viewportWidth}x${this.viewportHeight}`,zoom:this.zoom,worldView:`${this.width}x${this.height}`})}update(e,t,s){if(t===null)return;const i=e.getComponent(t,C),n=e.getComponent(t,T);if(!i||!n)return;const a=this.x+this.width/2,r=this.y+this.height/2,l=i.x+n.width/2,h=i.y+n.height/2,d=l-a,u=h-r;let p=0,y=0;Math.abs(d)>this.deadZone.x&&(p=d>0?d-this.deadZone.x:d+this.deadZone.x),Math.abs(u)>this.deadZone.y&&(y=u>0?u-this.deadZone.y:u+this.deadZone.y),this.targetX=this.x+p,this.targetY=this.y+y,this.x+=(this.targetX-this.x)*this.followSpeed*s,this.y+=(this.targetY-this.y)*this.followSpeed*s,this.x=Math.max(this.minX,Math.min(this.maxX,this.x)),this.y=Math.max(this.minY,Math.min(this.maxY,this.y)),this.updateShake(s)}updateShake(e){if(this.shakeTimer>0){this.shakeTimer-=e,this.shakeX=(Math.random()-.5)*this.shakeIntensity,this.shakeY=(Math.random()-.5)*this.shakeIntensity;const t=this.shakeInitialIntensity/this.shakeDuration;this.shakeIntensity=Math.max(0,this.shakeIntensity-t*e),this.shakeTimer<=0&&(this.shakeX=0,this.shakeY=0,this.shakeIntensity=0)}}shake(e=10,t=.3){this.shakeTimer=t,this.shakeDuration=t,this.shakeIntensity=e,this.shakeInitialIntensity=e}apply(e){e.save(),e.scale(this.zoom,this.zoom),e.translate(-Math.round(this.x+this.shakeX),-Math.round(this.y+this.shakeY))}restore(e){e.restore()}snapToPlayer(e,t){if(t===null)return;const s=e.getComponent(t,C),i=e.getComponent(t,T);!s||!i||this.centerOn(s.x+i.width/2,s.y+i.height/2)}centerOn(e,t){this.x=e-this.width/2,this.y=t-this.height/2,this.x=Math.max(this.minX,Math.min(this.maxX,this.x)),this.y=Math.max(this.minY,Math.min(this.maxY,this.y)),this.targetX=this.x,this.targetY=this.y}updateLevelBounds(e,t){this.levelWidth=e,this.levelHeight=t,this.maxX=Math.max(0,this.levelWidth-this.width),this.maxY=Math.max(0,this.levelHeight-this.height),this.x=Math.max(this.minX,Math.min(this.maxX,this.x)),this.y=Math.max(this.minY,Math.min(this.maxY,this.y))}isVisible(e,t,s=0,i=0){return e+s>this.x&&e<this.x+this.width&&t+i>this.y&&t<this.y+this.height}isRectVisible(e){return this.isVisible(e.x,e.y,e.width,e.height)}setFollowSpeed(e){this.followSpeed=Math.max(.1,e)}setDeadZone(e,t){this.deadZone.x=this.width*Math.max(0,Math.min(.5,e)),this.deadZone.y=this.height*Math.max(0,Math.min(.5,t))}}class it{constructor(){this.events={}}subscribe(e,t){this.events[e]||(this.events[e]=new Set),this.events[e].add(t)}unsubscribe(e,t){this.events[e]&&this.events[e].delete(t)}publish(e,t){this.events[e]&&this.events[e].forEach(s=>{try{s(t)}catch(i){console.error(`Error in event bus callback for event: ${e}`,i)}})}}const c=new it;class nt{constructor(){this.sounds={},this.soundPool={},this.poolSize=5,this.channels={SFX:new Set,UI:new Set,Music:new Set},this.audioContext=null,this.audioUnlocked=!1,this.settings={enabled:!0,volume:.5},this.loadSettings(),this._setupEventSubscriptions()}_setupEventSubscriptions(){c.subscribe("playSound",e=>this.play(e)),c.subscribe("startSoundLoop",e=>this.playLoop(e)),c.subscribe("stopSoundLoop",({key:e})=>this.stopLoop(e)),c.subscribe("toggleSound",()=>this.toggleSound()),c.subscribe("setSoundVolume",({volume:e})=>this.setVolume(e))}loadSettings(){this.settings.enabled=!0,this.settings.volume=.5}saveSettings(){}loadSounds(e){["button_click","jump","double_jump","collect","level_complete","death_sound","dash","checkpoint_activated","sand_walk","mud_run","ice_run","trampoline_bounce"].forEach(s=>{if(e[s]){this.sounds[s]=e[s],this.soundPool[s]=[];for(let i=0;i<this.poolSize;i++)this.soundPool[s].push(this.sounds[s].cloneNode(!0))}else console.warn(`Sound asset ${s} not found in assets`)})}async play({key:e,volumeMultiplier:t=1,channel:s="SFX"}){if(!this.settings.enabled||!this.sounds[e]||!this.channels[s])return;this.audioUnlocked||await this.unlockAudio();const i=this.soundPool[e];if(!i){console.warn(`Sound pool for ${e} not found.`);return}const n=i.find(a=>a.paused||a.ended);if(n){n.volume=Math.max(0,Math.min(1,this.settings.volume*t)),n.currentTime=0,this.channels[s].add(n),n.onended=()=>{this.channels[s].delete(n),n.onended=null};try{await n.play()}catch(a){a.name!=="AbortError"&&console.error(`Audio pool play failed for ${e}:`,a),this.channels[s].delete(n)}}else console.warn(`Sound pool for ${e} was depleted. No sound played.`)}async playLoop({key:e,volumeMultiplier:t=1,channel:s="SFX"}){if(!(!this.settings.enabled||!this.sounds[e]||!this.channels[s])&&!Array.from(this.channels[s]).some(i=>i.src===this.sounds[e].src)){this.audioUnlocked||await this.unlockAudio();try{const i=this.sounds[e].cloneNode(!0);i.volume=Math.max(0,Math.min(1,this.settings.volume*t)),i.loop=!0,await i.play(),this.channels[s].add(i)}catch(i){console.error(`Failed to play looping sound ${e}:`,i)}}}stopLoop(e){const t=this.sounds[e]?.src;if(t)for(const s in this.channels)this.channels[s].forEach(i=>{i.src===t&&i.loop&&(i.pause(),i.currentTime=0,this.channels[s].delete(i))})}stopAll({except:e=[]}={}){for(const t in this.channels)e.includes(t)||(this.channels[t].forEach(s=>{s.pause(),s.currentTime=0}),this.channels[t].clear())}async unlockAudio(){if(!this.audioUnlocked){if(!this.audioContext)try{const e=window.AudioContext||window.webkitAudioContext;e&&(this.audioContext=new e)}catch(e){console.error("Failed to create AudioContext",e);return}this.audioContext.state==="suspended"&&await this.audioContext.resume().catch(e=>console.error("Failed to resume AudioContext",e)),this.audioContext.state==="running"&&(this.audioUnlocked=!0)}}setVolume(e){this.settings.volume=Math.max(0,Math.min(1,e));for(const t in this.channels)this.channels[t].forEach(s=>{s.volume=this.settings.volume});this.saveSettings(),c.publish("soundSettingsChanged",{soundEnabled:this.settings.enabled,soundVolume:this.settings.volume})}setEnabled(e){this.settings.enabled=e,this.settings.enabled||this.stopAll(),this.saveSettings(),c.publish("soundSettingsChanged",{soundEnabled:this.settings.enabled,soundVolume:this.settings.volume})}toggleSound(){return this.setEnabled(!this.settings.enabled),this.settings.enabled}getSettings(){return{soundEnabled:this.settings.enabled,soundVolume:this.settings.volume,audioUnlocked:this.audioUnlocked}}}class at{constructor(e,t){this.canvas=e,this.fontRenderer=t,this.isVisible=!0,this.stats={levelName:"Loading...",collectedFruits:0,totalFruits:0,deathCount:0,soundEnabled:!0,soundVolume:.5,health:100,maxHealth:100},c.subscribe("statsUpdated",s=>this.updateStats(s))}setVisible(e){this.isVisible=e}updateStats(e){this.stats={...this.stats,...e}}drawGameHUD(e){if(!(!this.isVisible||!this.fontRenderer))try{e.save(),e.setTransform(1,0,0,1,0,0);const{levelName:t,collectedFruits:s,totalFruits:i,deathCount:n,soundEnabled:a,soundVolume:r,health:l,maxHealth:h}=this.stats,d=[`${t}`,`Fruits: ${s}/${i}`,`Deaths: ${n||0}`,`Sound: ${a?"On":"Off"} (${Math.round(r*100)}%)`],u={scale:2.5,align:"center",color:"white",outlineColor:"black",outlineWidth:1};let p=0;d.forEach(ye=>{const ne=this.fontRenderer.getTextWidth(ye,u.scale);ne>p&&(p=ne)});const y=40,x=10,$=10,V=p+y,ue=180;e.fillStyle="rgba(0, 0, 0, 0.5)",e.beginPath(),e.roundRect(x,$,V,ue,10),e.fill();const pe=35,me=$+25,fe=x+V/2;d.forEach((ye,ne)=>{const tt=me+ne*pe;this.fontRenderer.drawText(e,ye,fe,tt,u)});const U=150,z=20,N=x+V+15,ie=$;e.fillStyle="rgba(0, 0, 0, 0.7)",e.fillRect(N-2,ie-2,U+4,z+4),e.fillStyle="#333",e.fillRect(N,ie,U,z);const ge=(l||0)/(h||100),et=U*ge;ge>.6?e.fillStyle="#4CAF50":ge>.3?e.fillStyle="#FFC107":e.fillStyle="#F44336",e.fillRect(N,ie,et,z),this.fontRenderer.drawText(e,"HP",N+U+10,ie+z/2-12,{scale:2,align:"left"}),e.restore()}catch(t){console.warn("Error drawing HUD:",t)}}}const Z={PinkMan:{name:"Pink Man",unlockRequirement:0},NinjaFrog:{name:"Ninja Frog",unlockRequirement:10},MaskDude:{name:"Mask Dude",unlockRequirement:20},VirtualGuy:{name:"Virtual Guy",unlockRequirement:30}},E=[{name:"Mechanical Mastery",levels:[{name:"Level 1",jsonPath:"/levels/basic-mechanics/01.json"},{name:"Level 2",jsonPath:"/levels/basic-mechanics/02.json"},{name:"Level 3",jsonPath:"/levels/basic-mechanics/03.json"},{name:"Level 4",jsonPath:"/levels/basic-mechanics/04.json"},{name:"Level 5",jsonPath:"/levels/basic-mechanics/05.json"},{name:"Level 6",jsonPath:"/levels/basic-mechanics/06.json"},{name:"Level 7",jsonPath:"/levels/basic-mechanics/07.json"},{name:"Level 8",jsonPath:"/levels/basic-mechanics/08.json"},{name:"Level 9",jsonPath:"/levels/basic-mechanics/09.json"},{name:"Level 10",jsonPath:"/levels/basic-mechanics/10.json"}]},{name:"Sky High",levels:[{name:"Level 1",jsonPath:"/levels/sky-high/01.json"},{name:"Level 2",jsonPath:"/levels/sky-high/02.json"},{name:"Level 3",jsonPath:"/levels/sky-high/03.json"},{name:"Level 4",jsonPath:"/levels/sky-high/04.json"},{name:"Level 5",jsonPath:"/levels/sky-high/05.json"},{name:"Level 6",jsonPath:"/levels/sky-high/06.json"},{name:"Level 7",jsonPath:"/levels/sky-high/07.json"},{name:"Level 8",jsonPath:"/levels/sky-high/08.json"},{name:"Level 9",jsonPath:"/levels/sky-high/09.json"},{name:"Level 10",jsonPath:"/levels/sky-high/10.json"}]}];function Ee(o,e,t){let s=0;for(let i=0;i<o;i++)s+=t[i].levels.length;return s+=e,s}class le{constructor(e=null){if(e)this.currentSection=e.currentSection,this.currentLevelIndex=e.currentLevelIndex,this.showingLevelComplete=e.showingLevelComplete,this.levelProgress=e.levelProgress,this.selectedCharacter=e.selectedCharacter,this.levelStats=e.levelStats;else{this.currentSection=0,this.currentLevelIndex=0,this.showingLevelComplete=!1;const t=this.loadProgress();this.levelProgress=t.levelProgress,this.selectedCharacter=t.selectedCharacter,this.levelStats=t.levelStats,this.ensureStatsForAllLevels()}}_clone(){const e=JSON.parse(JSON.stringify(this));return new le(e)}_getDefaultState(){return{levelProgress:{unlockedLevels:[1],completedLevels:[]},selectedCharacter:"PinkMan",levelStats:{}}}loadProgress(){try{const e=localStorage.getItem("parkourGameState");if(!e)return this._getDefaultState();const t=JSON.parse(e);if(typeof t!="object"||t===null)return this._getDefaultState();const s=t.levelProgress;return typeof s!="object"||s===null||!Array.isArray(s.unlockedLevels)||!Array.isArray(s.completedLevels)?this._getDefaultState():((typeof t.selectedCharacter!="string"||!Z[t.selectedCharacter])&&(t.selectedCharacter="PinkMan"),(!t.levelStats||typeof t.levelStats!="object")&&(t.levelStats={}),t)}catch(e){return console.error("Failed to parse game state from localStorage. Resetting to default.",e),this._getDefaultState()}}saveProgress(){try{const e={levelProgress:this.levelProgress,selectedCharacter:this.selectedCharacter,levelStats:this.levelStats};localStorage.setItem("parkourGameState",JSON.stringify(e)),console.log("Progress saved:",e)}catch(e){console.error("Failed to save game state to localStorage",e)}}setSelectedCharacter(e){if(Z[e]&&this.selectedCharacter!==e){const t=this._clone();return t.selectedCharacter=e,t.saveProgress(),t}return this}ensureStatsForAllLevels(){E.forEach((e,t)=>{e.levels.forEach((s,i)=>{const n=`${t}-${i}`;this.levelStats[n]||(this.levelStats[n]={fastestTime:null,lowestDeaths:null,totalAttempts:0})})})}incrementAttempts(e,t){const s=`${e}-${t}`;this.levelStats[s]&&(this.levelStats[s].totalAttempts+=1,this.saveProgress())}onLevelComplete(e){const t=this._clone(),s=`${this.currentSection}-${this.currentLevelIndex}`;if(!this.levelProgress.completedLevels.includes(s)){t.levelProgress.completedLevels.push(s);const n=E.reduce((r,l)=>r+l.levels.length,0),a=Ee(this.currentSection,this.currentLevelIndex,E);if(a+1<n){const r=a+2;r>this.levelProgress.unlockedLevels[0]&&(t.levelProgress.unlockedLevels[0]=r)}}const i=t.levelStats[s];return i&&((i.fastestTime===null||e.time<i.fastestTime)&&(i.fastestTime=e.time),(i.lowestDeaths===null||e.deaths<i.lowestDeaths)&&(i.lowestDeaths=e.deaths)),t.showingLevelComplete=!0,t.saveProgress(),c.publish("playSound",{key:"level_complete",volume:1,channel:"UI"}),t}isCharacterUnlocked(e){const t=Z[e];return t?this.levelProgress.completedLevels.length>=t.unlockRequirement:!1}isLevelUnlocked(e,t){return Ee(e,t,E)<this.levelProgress.unlockedLevels[0]}isLevelCompleted(e,t){const s=`${e}-${t}`;return this.levelProgress.completedLevels.includes(s)}resetProgress(){try{localStorage.removeItem("parkourGameState");const e=this._getDefaultState();this.levelProgress=e.levelProgress,this.selectedCharacter=e.selectedCharacter,this.levelStats=e.levelStats,this.currentSection=0,this.currentLevelIndex=0,this.ensureStatsForAllLevels()}catch(e){console.error("Failed to reset game state in localStorage",e)}}unlockAllLevels(){const e=E.reduce((t,s)=>t+s.levels.length,0);this.levelProgress.unlockedLevels[0]=e,this.levelProgress.completedLevels=Array.from({length:e},(t,s)=>`temp-${s}`),this.saveProgress()}}const f={WIDTH:32,HEIGHT:32,SPAWN_WIDTH:96,SPAWN_HEIGHT:96,CLING_OFFSET:7,MOVE_SPEED:200,JUMP_FORCE:400,GRAVITY:1200,MAX_FALL_SPEED:600,FALL_DAMAGE_MIN_VELOCITY:550,FALL_DAMAGE_MAX_VELOCITY:700,FALL_DAMAGE_MIN_AMOUNT:5,FALL_DAMAGE_MAX_AMOUNT:20,DASH_SPEED:500,DASH_DURATION:.2,DASH_COOLDOWN:.7,COYOTE_TIME:.1,JUMP_BUFFER_TIME:.15,HIT_STUN_DURATION:.2,SAND_MOVE_MULTIPLIER:.5,MUD_JUMP_MULTIPLIER:.6,ICE_ACCELERATION:800,ICE_FRICTION:400,TRAMPOLINE_BOUNCE_MULTIPLIER:2,ANIMATION_SPEED:.06,SPAWN_ANIMATION_SPEED:.08,HIT_ANIMATION_SPEED:.1,ANIMATION_FRAMES:{idle:11,run:12,double_jump:6,jump:1,fall:1,dash:1,cling:5,spawn:7,despawn:7,hit:7}},b={TILE_SIZE:48};class R{constructor(e=0,t=0){this.vx=e,this.vy=t}}class ot{constructor(){}update(e,{entityManager:t,level:s}){const i=t.query([C,R,T]);for(const n of i){const a=t.getComponent(n,C),r=t.getComponent(n,R),l=t.getComponent(n,T);if(a.y>s.height+50){c.publish("collisionEvent",{type:"world_bottom",entityId:n,entityManager:t});continue}a.x+=r.vx*e,this._handleHorizontalCollisions(a,r,l,s),a.y+=r.vy*e,this._checkTrampolineBounce(a,r,l,s,e)||this._handleVerticalCollisions(a,r,l,s,e,n),a.x=Math.max(0,Math.min(a.x,s.width-l.width)),this._checkHazardCollisions(a,l,s,n,t),this._checkFruitCollisions(a,l,s,n,t),this._checkTrophyCollision(a,l,s.trophy,n,t),this.checkCheckpointCollisions(a,l,s,n,t)}}_handleHorizontalCollisions(e,t,s,i){if(t.vx===0){s.isAgainstWall=!1;return}const n=Math.floor(e.y/b.TILE_SIZE),a=Math.floor((e.y+s.height-1)/b.TILE_SIZE),r=t.vx>0?e.x+s.width:e.x,l=Math.floor(r/b.TILE_SIZE);for(let h=n;h<=a;h++){const d=i.getTileAt(l*b.TILE_SIZE,h*b.TILE_SIZE);if(d&&d.solid){e.x=t.vx>0?l*b.TILE_SIZE-s.width:(l+1)*b.TILE_SIZE,t.vx=0,s.isAgainstWall=!["dirt","sand","mud","ice"].includes(d.type);return}}s.isAgainstWall=!1}_calculateAndApplyFallDamage(e){const{FALL_DAMAGE_MIN_VELOCITY:t,FALL_DAMAGE_MAX_VELOCITY:s,FALL_DAMAGE_MIN_AMOUNT:i,FALL_DAMAGE_MAX_AMOUNT:n}=f,r=(Math.max(t,Math.min(e,s))-t)/(s-t),l=Math.round(i+r*(n-i));c.publish("playerTookDamage",{amount:l,source:"fall"})}_handleVerticalCollisions(e,t,s,i,n,a){const r=Math.floor(e.x/b.TILE_SIZE),l=Math.floor((e.x+s.width-1)/b.TILE_SIZE);if(t.vy<0){const u=Math.floor(e.y/b.TILE_SIZE);for(let p=r;p<=l;p++){const y=i.getTileAt(p*b.TILE_SIZE,u*b.TILE_SIZE);if(y&&y.solid){e.y=(u+1)*b.TILE_SIZE,t.vy=0;return}}}const h=e.y+s.height,d=Math.floor(h/b.TILE_SIZE);s.isGrounded=!1;for(let u=r;u<=l;u++){const p=i.getTileAt(u*b.TILE_SIZE,d*b.TILE_SIZE);if(p&&p.solid&&t.vy>=0){const y=d*b.TILE_SIZE,x=e.y+s.height;if(x>=y&&x-t.vy*n<=y+1){const $=t.vy;$>=f.FALL_DAMAGE_MIN_VELOCITY&&this._calculateAndApplyFallDamage($),e.y=y-s.height,t.vy=0,s.isGrounded=!0,s.groundType=p.interaction||p.type;return}}}}_checkTrampolineBounce(e,t,s,i,n){if(t.vy<=0)return!1;for(const a of i.trampolines){const r=e.y+s.height;if(e.x+s.width>a.x&&e.x<a.x+a.size&&r>=a.y&&r-t.vy*n<=a.y+1)return a.state="jumping",a.frame=0,a.frameTimer=0,e.y=a.y-s.height,t.vy=-400*f.TRAMPOLINE_BOUNCE_MULTIPLIER,c.publish("playSound",{key:"trampoline_bounce",volume:1,channel:"SFX"}),!0}return!1}_isCollidingWith(e,t,s){const i=s.width||s.size,n=s.height||s.size;return e.x<s.x+i&&e.x+t.width>s.x&&e.y<s.y+n&&e.y+t.height>s.y}_checkHazardCollisions(e,t,s,i,n){const a=[{x:e.x,y:e.y},{x:e.x+t.width-1,y:e.y},{x:e.x,y:e.y+t.height-1},{x:e.x+t.width-1,y:e.y+t.height-1}];for(const r of a)if(s.getTileAt(r.x,r.y).hazard){c.publish("collisionEvent",{type:"hazard",entityId:i,entityManager:n});return}}_checkFruitCollisions(e,t,s,i,n){for(const a of s.getActiveFruits())this._isCollidingWith(e,t,a)&&c.publish("collisionEvent",{type:"fruit",entityId:i,target:a,entityManager:n})}_checkTrophyCollision(e,t,s,i,n){!s||s.acquired||s.inactive||this._isCollidingWith(e,t,s)&&c.publish("collisionEvent",{type:"trophy",entityId:i,target:s,entityManager:n})}checkCheckpointCollisions(e,t,s,i,n){for(const a of s.getInactiveCheckpoints())this._isCollidingWith(e,t,a)&&c.publish("collisionEvent",{type:"checkpoint",entityId:i,target:a,entityManager:n})}}class I{constructor({spriteKey:e,width:t,height:s,animationState:i="idle",animationFrame:n=0,animationTimer:a=0,direction:r="right",isVisible:l=!0}){this.spriteKey=e,this.width=t,this.height=s,this.animationState=i,this.animationFrame=n,this.animationTimer=a,this.direction=r,this.isVisible=l}}class Se{constructor(e){this.characterId=e}}class S{constructor({speed:e=f.MOVE_SPEED,jumpForce:t=f.JUMP_FORCE,dashSpeed:s=f.DASH_SPEED,dashDuration:i=f.DASH_DURATION,jumpBufferTimer:n=0,coyoteTimer:a=0,dashTimer:r=0,dashCooldownTimer:l=0,hitStunTimer:h=0,jumpCount:d=0,isDashing:u=!1,isHit:p=!1,isSpawning:y=!0,spawnComplete:x=!1,isDespawning:$=!1,despawnAnimationFinished:V=!1,needsRespawn:ue=!1,deathCount:pe=0,activeSurfaceSound:me=null,surfaceParticleTimer:fe=0,jumpParticleTimer:U=0,jumpPressed:z=!1,dashPressed:N=!1}={}){this.speed=e,this.jumpForce=t,this.dashSpeed=s,this.dashDuration=i,this.jumpBufferTimer=n,this.coyoteTimer=a,this.dashTimer=r,this.dashCooldownTimer=l,this.hitStunTimer=h,this.surfaceParticleTimer=fe,this.jumpParticleTimer=U,this.jumpCount=d,this.isDashing=u,this.isHit=p,this.isSpawning=y,this.spawnComplete=x,this.isDespawning=$,this.despawnAnimationFinished=V,this.needsRespawn=ue,this.jumpPressed=z,this.dashPressed=N,this.deathCount=pe,this.activeSurfaceSound=me}}class rt{constructor(e,t,s){this.ctx=e,this.canvas=t,this.assets=s,this.backgroundCache=new Map,this.backgroundOffset={x:0,y:0}}_preRenderBackground(e){const t=e.background;if(this.backgroundCache.has(t))return this.backgroundCache.get(t);const s=this.assets[t];if(!s||!s.complete||s.naturalWidth===0)return null;const i=document.createElement("canvas");i.width=this.canvas.width+s.width,i.height=this.canvas.height+s.height;const n=i.getContext("2d"),a=n.createPattern(s,"repeat");return n.fillStyle=a,n.fillRect(0,0,i.width,i.height),this.backgroundCache.set(t,i),i}drawScrollingBackground(e,t){const s=this._preRenderBackground(e),i=this.assets[e.background];if(!s||!i||!i.complete||i.naturalWidth===0){this.ctx.fillStyle="#87CEEB",this.ctx.fillRect(0,0,this.canvas.width,this.canvas.height);return}this.backgroundOffset.x+=e.backgroundScroll.x*t,this.backgroundOffset.y+=e.backgroundScroll.y*t;const n=(this.backgroundOffset.x%i.width+i.width)%i.width,a=(this.backgroundOffset.y%i.height+i.height)%i.height;this.ctx.drawImage(s,n,a,this.canvas.width,this.canvas.height,0,0,this.canvas.width,this.canvas.height)}renderScene(e,t,s,i){e.apply(this.ctx),this.drawTileGrid(t,e),t.trophy&&this.drawTrophy(t.trophy,e),this.drawFruits(t.getActiveFruits(),e),this.drawCheckpoints(t.checkpoints,e),this.drawTrampolines(t.trampolines,e);const n=s.query([C,I]);for(const a of n){const r=s.getComponent(a,C),l=s.getComponent(a,I),h=s.getComponent(a,Se),d=s.getComponent(a,S);this._drawRenderable(r,l,h,d)}this.drawCollectedFruits(i,e),e.restore(this.ctx)}_drawRenderable(e,t,s,i){const n=t.animationState;if(!t.isVisible||i&&i.despawnAnimationFinished)return;const a={idle:"playerIdle",run:"playerRun",jump:"playerJump",double_jump:"playerDoubleJump",fall:"playerFall",dash:"playerDash",cling:"playerCling",spawn:"playerAppear",despawn:"playerDisappear",hit:"playerHit"};let r;const l=a[n];if(n==="spawn"||n==="despawn"?r=this.assets[l]:s?r=this.assets.characters[s.characterId]?.[l]||this.assets.playerIdle:r=this.assets[t.spriteKey],!r){this.ctx.fillStyle="#FF00FF",this.ctx.fillRect(e.x,e.y,t.width,t.height);return}const h=f.ANIMATION_FRAMES[n]||1,d=r.width/h,u=d*t.animationFrame;this.ctx.save();const p=n==="spawn"||n==="despawn",y=p?e.x-(t.width-f.WIDTH)/2:e.x,x=p?e.y-(t.height-f.HEIGHT)/2:e.y;t.direction==="left"?(this.ctx.scale(-1,1),this.ctx.translate(-y-t.width,x)):this.ctx.translate(y,x);const $=n==="cling"?f.CLING_OFFSET:0;this.ctx.drawImage(r,u,0,d,r.height,$,0,t.width,t.height),this.ctx.restore()}drawTileGrid(e,t){const s=b.TILE_SIZE,i=Math.floor(t.x/s),n=Math.ceil((t.x+t.width)/s),a=Math.floor(t.y/s),r=Math.ceil((t.y+t.height)/s);for(let l=a;l<r;l++)for(let h=i;h<n;h++){if(h<0||h>=e.gridWidth||l<0||l>=e.gridHeight)continue;const d=e.tiles[l][h];if(d.type==="empty")continue;const u=this.assets[d.spriteKey];if(!u){this.ctx.fillStyle="magenta",this.ctx.fillRect(h*s,l*s,s,s);continue}const p=h*s,y=l*s,x=s+1;d.spriteConfig?this.ctx.drawImage(u,d.spriteConfig.srcX,d.spriteConfig.srcY,s,s,p,y,x,x):this.ctx.drawImage(u,p,y,x,x)}}drawTrophy(e,t){if(!t.isVisible(e.x-e.size/2,e.y-e.size/2,e.size,e.size))return;const s=this.assets.trophy;if(!s)return;const i=s.width/e.frameCount,n=i*e.animationFrame;e.inactive&&(this.ctx.globalAlpha=.5),this.ctx.drawImage(s,n,0,i,s.height,e.x-e.size/2,e.y-e.size/2,e.size,e.size),this.ctx.globalAlpha=1}drawFruits(e,t){for(const s of e){if(!t.isRectVisible({x:s.x-s.size/2,y:s.y-s.size/2,width:s.size,height:s.size}))continue;const i=this.assets[s.spriteKey];if(!i)continue;const n=i.width/s.frameCount,a=n*s.frame;this.ctx.drawImage(i,a,0,n,i.height,s.x-s.size/2,s.y-s.size/2,s.size,s.size)}}drawTrampolines(e,t){for(const s of e){if(!t.isRectVisible({x:s.x,y:s.y,width:s.size,height:s.size}))continue;let i,n=0,a;s.state==="jumping"?(i=this.assets.trampoline_jump,i&&(a=i.width/s.frameCount,n=s.frame*a)):(i=this.assets.trampoline_idle,i&&(a=i.width)),i&&a>0?this.ctx.drawImage(i,n,0,a,i.height,s.x-s.size/2,s.y-s.size/2,s.size,s.size):(this.ctx.fillStyle="#8e44ad",this.ctx.fillRect(s.x-s.size/2,s.y-s.size/2,s.size,s.size))}}drawCollectedFruits(e,t){const s=this.assets.fruit_collected;if(!s)return;const i=s.width/6;for(const n of e){if(!t.isRectVisible({x:n.x,y:n.y,width:n.size,height:n.size}))continue;const a=n.frame*i;this.ctx.drawImage(s,a,0,i,s.height,n.x-n.size/2,n.y-n.size/2,n.size,n.size)}}drawCheckpoints(e,t){for(const s of e){if(!t.isRectVisible({x:s.x,y:s.y,width:s.size,height:s.size}))continue;let i,n=0,a;switch(s.state){case"inactive":i=this.assets.checkpoint_inactive,i&&(a=i.width);break;case"activating":i=this.assets.checkpoint_activation,i&&(a=i.width/s.frameCount,n=s.frame*a);break;case"active":if(i=this.assets.checkpoint_active,i){const l=Math.floor(performance.now()/1e3/.1%10);a=i.width/10,n=l*a}break}i&&a>0?this.ctx.drawImage(i,n,0,a,i.height,s.x-s.size/2,s.y-s.size/2,s.size,s.size):(this.ctx.fillStyle="purple",this.ctx.fillRect(s.x-s.size/2,s.y-s.size/2,s.size,s.size))}}}const ae={0:{type:"empty",solid:!1,hazard:!1,description:"Empty space. The player can move freely through it."},1:{type:"dirt",solid:!0,hazard:!1,spriteKey:"block",spriteConfig:{srcX:96,srcY:0},description:"A standard, solid block of dirt. Wall-jumps are not possible on this surface."},2:{type:"stone",solid:!0,hazard:!1,spriteKey:"block",spriteConfig:{srcX:0,srcY:0},description:"A standard, solid block of stone. Players can wall-jump off this surface."},3:{type:"wood",solid:!0,hazard:!1,spriteKey:"block",spriteConfig:{srcX:0,srcY:64},description:"A standard, solid block of wood. Players can wall-jump off this surface."},4:{type:"green_block",solid:!0,hazard:!1,spriteKey:"block",spriteConfig:{srcX:0,srcY:128},description:"A solid, green-colored block. Players can wall-jump off this surface."},5:{type:"orange_dirt",solid:!0,hazard:!1,spriteKey:"block",spriteConfig:{srcX:96,srcY:64},description:"Solid orange dirt. Wall-jumps are not possible on this surface."},6:{type:"pink_dirt",solid:!0,hazard:!1,spriteKey:"block",spriteConfig:{srcX:96,srcY:128},description:"Solid pink dirt. Wall-jumps are not possible on this surface."},7:{type:"sand",solid:!0,hazard:!1,spriteKey:"sand_mud_ice",spriteConfig:{srcX:0,srcY:0},interaction:"sand",description:"A solid block of sand. Slows player movement. Wall-jumps are not possible."},8:{type:"mud",solid:!0,hazard:!1,spriteKey:"sand_mud_ice",spriteConfig:{srcX:64,srcY:0},interaction:"mud",description:"A solid block of mud. Reduces jump height. Wall-jumps are not possible."},9:{type:"ice",solid:!0,hazard:!1,spriteKey:"sand_mud_ice",spriteConfig:{srcX:128,srcY:0},interaction:"ice",description:"A solid block of slippery ice. Reduces friction. Wall-jumps are not possible."},A:{type:"spike_up",solid:!1,hazard:!0,spriteKey:"spike_two",description:"A dangerous spike pointing upwards. Lethal to the touch."},F:{type:"fire",solid:!1,hazard:!0,spriteKey:"fire_on",interaction:"fire_trap",description:"A deadly fire trap. Avoid contact."}};class lt{constructor(e){this.name=e.name||"Unnamed Level",this.gridWidth=e.gridWidth,this.gridHeight=e.gridHeight,this.width=this.gridWidth*b.TILE_SIZE,this.height=this.gridHeight*b.TILE_SIZE,this.background=e.background||"background_blue",this.backgroundScroll=e.backgroundScroll||{x:0,y:15},this.startPosition={x:e.startPosition.x*b.TILE_SIZE,y:e.startPosition.y*b.TILE_SIZE},this.tiles=e.layout.map(t=>[...t].map(s=>ae[s]||ae[0])),this.fruits=[],this.checkpoints=[],this.trampolines=[],this.trophy=null,(e.objects||[]).forEach(t=>{const s=t.x*b.TILE_SIZE,i=t.y*b.TILE_SIZE;t.type.startsWith("fruit_")?this.fruits.push({x:s,y:i,size:28,spriteKey:t.type,frame:0,frameCount:17,frameSpeed:.07,frameTimer:0,collected:!1,type:"fruit"}):t.type==="checkpoint"?this.checkpoints.push({x:s,y:i,size:64,state:"inactive",frame:0,frameCount:26,frameSpeed:.07,frameTimer:0,type:"checkpoint"}):t.type==="trampoline"?this.trampolines.push({x:s,y:i,size:28,state:"idle",frame:0,frameCount:8,frameSpeed:.05,frameTimer:0,type:"trampoline"}):t.type==="trophy"&&(this.trophy={x:s,y:i,size:32,frameCount:8,animationFrame:0,animationTimer:0,animationSpeed:.35,acquired:!1,inactive:!0,contactMade:!1})}),this.totalFruitCount=this.fruits.length,this.collectedFruitCount=0,this.completed=!1}getTileAt(e,t){const s=Math.floor(e/b.TILE_SIZE),i=Math.floor(t/b.TILE_SIZE);return s<0||s>=this.gridWidth||i<0?ae[1]:i>=this.gridHeight?ae[0]:this.tiles[i][s]}updateCheckpoints(e){for(const t of this.checkpoints)t.state==="activating"&&(t.frameTimer+=e,t.frameTimer>=t.frameSpeed&&(t.frameTimer-=t.frameSpeed,t.frame++,t.frame>=t.frameCount&&(t.frame=0,t.state="active")))}getInactiveCheckpoints(){return this.checkpoints.filter(e=>e.state==="inactive")}updateFruits(e){for(const t of this.fruits)t.collected||(t.frameTimer+=e,t.frameTimer>=t.frameSpeed&&(t.frameTimer-=t.frameSpeed,t.frame=(t.frame+1)%t.frameCount))}updateTrampolines(e){for(const t of this.trampolines)t.state==="jumping"&&(t.frameTimer+=e,t.frameTimer>=t.frameSpeed&&(t.frameTimer-=t.frameSpeed,t.frame++,t.frame>=t.frameCount&&(t.frame=0,t.state="idle")))}collectFruit(e){e.collected||(e.collected=!0,this.collectedFruitCount++,this.trophy&&this.allFruitsCollected()&&(this.trophy.inactive=!1))}getActiveFruits(){return this.fruits.filter(e=>!e.collected)}getFruitCount(){return this.collectedFruitCount}getTotalFruitCount(){return this.totalFruitCount}allFruitsCollected(){return this.collectedFruitCount===this.totalFruitCount}recalculateCollectedFruits(){this.collectedFruitCount=this.fruits.reduce((e,t)=>e+(t.collected?1:0),0)}updateTrophyAnimation(e){const t=this.trophy;!t||t.inactive||t.acquired||(t.animationTimer+=e,t.animationTimer>=t.animationSpeed&&(t.animationTimer-=t.animationSpeed,t.animationFrame=(t.animationFrame+1)%t.frameCount))}isCompleted(){return this.fruits.length&&!this.allFruitsCollected()?!1:!this.trophy||this.trophy.acquired}reset(){this.fruits.forEach(e=>{e.collected=!1,e.frame=0,e.frameTimer=0}),this.collectedFruitCount=0,this.checkpoints.forEach(e=>{e.state="inactive",e.frame=0,e.frameTimer=0}),this.trampolines.forEach(e=>{e.state="idle",e.frame=0,e.frameTimer=0}),this.trophy&&(this.trophy.acquired=!1,this.trophy.inactive=!0,this.trophy.animationFrame=0,this.trophy.animationTimer=0),this.completed=!1}}class ct{constructor(e){this.gameState=e,this.levelSections=E,c.subscribe("requestNextLevel",()=>this.goToNextLevel()),c.subscribe("requestPreviousLevel",()=>this.goToPreviousLevel())}loadLevel(e,t){if(e>=this.levelSections.length||t>=this.levelSections[e].levels.length)return console.error(`Invalid level: Section ${e}, Level ${t}`),null;const s=this.levelSections[e].levels[t];return s?(this.gameState.currentSection=e,this.gameState.currentLevelIndex=t,new lt(s)):(console.error(`Failed to load level data for Section ${e}, Level ${t}. The JSON file may be missing or failed to fetch.`),null)}hasNextLevel(){const{currentSection:e,currentLevelIndex:t}=this.gameState,s=t+1<this.levelSections[e].levels.length,i=e+1<this.levelSections.length;return s||i}hasPreviousLevel(){const{currentSection:e,currentLevelIndex:t}=this.gameState;return t>0||e>0}goToNextLevel(){if(!this.hasNextLevel())return;let{currentSection:e,currentLevelIndex:t}=this.gameState;t+1<this.levelSections[e].levels.length?t++:e+1<this.levelSections.length&&(e++,t=0),c.publish("requestLevelLoad",{sectionIndex:e,levelIndex:t})}goToPreviousLevel(){if(!this.hasPreviousLevel())return;let{currentSection:e,currentLevelIndex:t}=this.gameState;t>0?t--:e>0&&(e--,t=this.levelSections[e].levels.length-1),c.publish("requestLevelLoad",{sectionIndex:e,levelIndex:t})}handleLevelCompleteAction(e){this.gameState.showingLevelComplete=!1;let{currentSection:t,currentLevelIndex:s}=this.gameState;e==="next"&&this.hasNextLevel()?(s+1<this.levelSections[t].levels.length?s++:t+1<this.levelSections.length&&(t++,s=0),c.publish("requestLevelLoad",{sectionIndex:t,levelIndex:s})):e==="restart"?c.publish("requestLevelLoad",{sectionIndex:t,levelIndex:s}):e==="previous"&&this.hasPreviousLevel()&&(s>0?s--:t>0&&(t--,s=this.levelSections[t].levels.length-1),c.publish("requestLevelLoad",{sectionIndex:t,levelIndex:s}))}}class ht{constructor(e){this.assets=e,this.particles=[],c.subscribe("createParticles",t=>this.create(t))}create({x:e,y:t,type:s,direction:i="right"}){const a={dash:{count:10,baseSpeed:150,spriteKey:"dust_particle",life:.4,gravity:50},double_jump:{count:7,baseSpeed:100,spriteKey:"dust_particle",life:.4,gravity:50},sand:{count:2,baseSpeed:20,spriteKey:"sand_particle",life:.5,gravity:120},mud:{count:2,baseSpeed:15,spriteKey:"mud_particle",life:.6,gravity:100},ice:{count:2,baseSpeed:25,spriteKey:"ice_particle",life:.4,gravity:20},walk_dust:{count:1,baseSpeed:15,spriteKey:"dust_particle",life:.4,gravity:80},jump_trail:{count:1,baseSpeed:10,spriteKey:"dust_particle",life:.3,gravity:20}}[s];if(a)for(let r=0;r<a.count;r++){let l,h=a.baseSpeed+Math.random()*(a.baseSpeed*.5);s==="dash"?l=(i==="right"?Math.PI:0)+(Math.random()-.5)*(Math.PI/2):s==="double_jump"?l=Math.PI/2+(Math.random()-.5)*(Math.PI/3):s==="jump_trail"?(l=Math.random()*Math.PI*2,h*=Math.random()*.5):l=-(Math.PI/2)+(Math.random()-.5)*(Math.PI/4);const d=a.life+Math.random()*.3;this.particles.push({x:e,y:t,vx:Math.cos(l)*h,vy:Math.sin(l)*h,life:d,initialLife:d,size:5+Math.random()*4,alpha:1,spriteKey:a.spriteKey,gravity:a.gravity})}}update(e){for(let t=this.particles.length-1;t>=0;t--){const s=this.particles[t];s.life-=e,s.life<=0?this.particles.splice(t,1):(s.x+=s.vx*e,s.y+=s.vy*e,s.vy+=(s.gravity||50)*e,s.alpha=Math.max(0,s.life/s.initialLife))}}render(e,t){if(this.particles.length!==0){e.save(),t.apply(e);for(const s of this.particles){const i=this.assets[s.spriteKey]||this.assets.dust_particle;!i||!t.isVisible(s.x,s.y,s.size,s.size)||(e.globalAlpha=s.alpha,e.drawImage(i,s.x-s.size/2,s.y-s.size/2,s.size,s.size))}t.restore(e),e.restore()}}}class dt{constructor(e,t){this.canvas=e,this.assets=t,this.hoveredButton=null;const s=64,i=20,n=20,a=10,r=this.canvas.width-s-i;this.uiButtons=[{id:"settings",x:r,y:n+(s+a)*0,width:s,height:s,assetKey:"settings_icon",visible:!1},{id:"pause",x:r,y:n+(s+a)*1,width:s,height:s,assetKey:"pause_icon",visible:!1},{id:"levels",x:r,y:n+(s+a)*2,width:s,height:s,assetKey:"levels_icon",visible:!1},{id:"character",x:r,y:n+(s+a)*3,width:s,height:s,assetKey:"character_icon",visible:!1},{id:"info",x:r,y:n+(s+a)*4,width:s,height:s,assetKey:"info_icon",visible:!1}],this.canvas.addEventListener("mousemove",l=>this.handleMouseMove(l)),this.canvas.addEventListener("click",l=>this.handleCanvasClick(l)),c.subscribe("gameStarted",()=>this.uiButtons.forEach(l=>l.visible=!0))}_getMousePos(e){const t=this.canvas.getBoundingClientRect(),s=this.canvas.width/t.width,i=this.canvas.height/t.height;return{x:(e.clientX-t.left)*s,y:(e.clientY-t.top)*i}}handleMouseMove(e){const{x:t,y:s}=this._getMousePos(e);this.hoveredButton=null;for(const i of this.uiButtons)if(i.visible&&t>=i.x&&t<=i.x+i.width&&s>=i.y&&s<=i.y+i.height){this.hoveredButton=i;break}}handleCanvasClick(e){this.hoveredButton&&(c.publish("playSound",{key:"button_click",volume:.8,channel:"UI"}),c.publish("ui_button_clicked",{buttonId:this.hoveredButton.id}))}update(){}render(e,t){e.save(),e.setTransform(1,0,0,1,0,0);for(const s of this.uiButtons){if(!s.visible)continue;const i=s.id==="pause"?t?"pause_icon":"play_icon":s.assetKey,n=this.assets[i];if(!n)continue;const a=this.hoveredButton?.id===s.id,r=a?1.1:1,l=s.width*r,h=s.height*r,d=s.x-(l-s.width)/2,u=s.y-(h-s.height)/2;e.globalAlpha=a?1:.8,e.drawImage(n,d,u,l,h)}e.restore()}}class Te{constructor(){this.nextEntityId=0,this.entities=new Set,this.componentsByClass=new Map}createEntity(){const e=this.nextEntityId++;return this.entities.add(e),e}addComponent(e,t){const s=t.constructor;return this.componentsByClass.has(s)||this.componentsByClass.set(s,new Map),this.componentsByClass.get(s).set(e,t),this}getComponent(e,t){const s=this.componentsByClass.get(t);return s?s.get(e):void 0}hasComponent(e,t){const s=this.componentsByClass.get(t);return s?s.has(e):!1}removeComponent(e,t){const s=this.componentsByClass.get(t);s&&s.delete(e)}destroyEntity(e){for(const t of this.componentsByClass.values())t.delete(e);this.entities.delete(e)}query(e){const t=[];for(const s of this.entities)e.every(i=>this.hasComponent(s,i))&&t.push(s);return t}}class D{constructor(){this.moveLeft=!1,this.moveRight=!1,this.jump=!1,this.dash=!1}}class j{constructor(e="idle"){this.currentState=e}}class Y{constructor(e=100,t=100){this.maxHealth=e,this.currentHealth=t}}function ut(o,e,t,s){const i=o.createEntity();return o.addComponent(i,new C(e,t)),o.addComponent(i,new R),o.addComponent(i,new Se(s)),o.addComponent(i,new I({spriteKey:null,width:f.SPAWN_WIDTH,height:f.SPAWN_HEIGHT,animationState:"spawn"})),o.addComponent(i,new S),o.addComponent(i,new T({type:"dynamic",solid:!0,width:f.WIDTH,height:f.HEIGHT})),o.addComponent(i,new D),o.addComponent(i,new j("spawn")),o.addComponent(i,new Y),i}class pt{constructor(){this.keys={},c.subscribe("key_down",({key:e})=>this.keys[e]=!0),c.subscribe("key_up",({key:e})=>this.keys[e]=!1)}isKeyDown(e){return!!this.keys[e]}}const oe=new pt;class mt{update(e,{entityManager:t,keybinds:s,isRunning:i,gameState:n}){const a=i&&!n.showingLevelComplete,r=t.query([S,D]);for(const l of r){const h=t.getComponent(l,D);h.moveLeft=a&&oe.isKeyDown(s.moveLeft),h.moveRight=a&&oe.isKeyDown(s.moveRight),h.jump=a&&oe.isKeyDown(s.jump),h.dash=a&&oe.isKeyDown(s.dash)}}}class ft{constructor(){c.subscribe("collisionEvent",e=>this.handleCollision(e))}handleCollision({type:e,entityId:t,target:s,entityManager:i}){if(i.getComponent(t,S))switch(e){case"fruit":c.publish("fruitCollected",s);break;case"world_bottom":c.publish("playerDied");break;case"hazard":c.publish("playerTookDamage",{amount:25});break;case"trophy":c.publish("trophyCollision");break;case"checkpoint":c.publish("checkpointActivated",s);break}}update(e,t){}}class gt{constructor(){c.subscribe("playerTookDamage",e=>this.handleDamageTaken(e)),this.damageEvents=[]}handleDamageTaken(e){this.damageEvents.push(e)}_processDamageEvents(e){if(this.damageEvents.length===0)return;const t=e.query([S,I,j]);for(const s of this.damageEvents)for(const i of t){const n=e.getComponent(i,S),a=e.getComponent(i,I),r=e.getComponent(i,j);s.source==="fall"&&!n.isHit&&(n.isHit=!0,n.hitStunTimer=f.HIT_STUN_DURATION,this._setAnimationState(a,r,"hit",n))}this.damageEvents=[]}update(e,{entityManager:t}){this._processDamageEvents(t);const s=t.query([S,C,R,T,I,D,j]);for(const i of s){const n=t.getComponent(i,S),a=t.getComponent(i,C),r=t.getComponent(i,R),l=t.getComponent(i,T),h=t.getComponent(i,I),d=t.getComponent(i,D),u=t.getComponent(i,j);this._updateTimers(e,n),this._handleInput(e,d,a,r,n,l,h,u),this._updateFSM(r,n,l,h,u),this._updateAnimation(e,n,h,u),this._handleJumpTrail(e,a,l,n,u),l.isGrounded&&(n.coyoteTimer=f.COYOTE_TIME)}}_handleJumpTrail(e,t,s,i,n){n.currentState==="jump"&&i.jumpCount===1?(i.jumpParticleTimer-=e,i.jumpParticleTimer<=0&&(i.jumpParticleTimer=.05,c.publish("createParticles",{x:t.x+s.width/2,y:t.y+s.height,type:"jump_trail"}))):i.jumpParticleTimer=0}_updateTimers(e,t){t.jumpBufferTimer>0&&(t.jumpBufferTimer-=e),t.coyoteTimer>0&&(t.coyoteTimer-=e),t.dashCooldownTimer>0&&(t.dashCooldownTimer-=e),t.isHit&&(t.hitStunTimer-=e,t.hitStunTimer<=0&&(t.isHit=!1)),t.isDashing&&(t.dashTimer-=e,t.dashTimer<=0&&(t.isDashing=!1))}_handleInput(e,t,s,i,n,a,r,l){if(n.isSpawning||n.isDashing||n.isDespawning||n.isHit)return;t.moveLeft?r.direction="left":t.moveRight&&(r.direction="right");const h=t.jump&&!n.jumpPressed;if(t.jump&&(n.jumpBufferTimer=f.JUMP_BUFFER_TIME),n.jumpBufferTimer>0&&(a.isGrounded||n.coyoteTimer>0)&&n.jumpCount===0){const d=n.jumpForce*(a.groundType==="mud"?f.MUD_JUMP_MULTIPLIER:1);i.vy=-d,n.jumpCount=1,n.jumpBufferTimer=0,n.coyoteTimer=0,c.publish("playSound",{key:"jump",volume:.8,channel:"SFX"})}else h&&a.isAgainstWall&&!a.isGrounded?(i.vx=(r.direction==="left"?1:-1)*n.speed,r.direction=r.direction==="left"?"right":"left",i.vy=-n.jumpForce,n.jumpCount=1,c.publish("playSound",{key:"jump",volume:.8,channel:"SFX"})):h&&n.jumpCount===1&&!a.isGrounded&&!a.isAgainstWall&&(i.vy=-n.jumpForce,n.jumpCount=2,n.jumpBufferTimer=0,this._setAnimationState(r,l,"double_jump",n),c.publish("playSound",{key:"double_jump",volume:.6,channel:"SFX"}),c.publish("createParticles",{x:s.x+a.width/2,y:s.y+a.height,type:"double_jump"}));n.jumpPressed=t.jump,t.dash&&!n.dashPressed&&n.dashCooldownTimer<=0&&(n.isDashing=!0,n.dashTimer=n.dashDuration,i.vx=r.direction==="right"?n.dashSpeed:-n.dashSpeed,i.vy=0,n.dashCooldownTimer=f.DASH_COOLDOWN,this._setAnimationState(r,l,"dash",n),c.publish("playSound",{key:"dash",volume:.7,channel:"SFX"}),c.publish("createParticles",{x:s.x+a.width/2,y:s.y+a.height/2,type:"dash",direction:r.direction})),n.dashPressed=t.dash}_updateFSM(e,t,s,i,n){const a=n.currentState;if(a==="spawn"&&t.spawnComplete){this._setAnimationState(i,n,"idle",t);return}if(!(a==="spawn"||a==="despawn")){if(t.isHit){a!=="hit"&&this._setAnimationState(i,n,"hit",t);return}if(a==="hit"&&!t.isHit&&this._setAnimationState(i,n,"idle",t),t.isDashing){a!=="dash"&&this._setAnimationState(i,n,"dash",t);return}s.isAgainstWall&&!s.isGrounded&&e.vy>=0?a!=="cling"&&this._setAnimationState(i,n,"cling",t):s.isGrounded?Math.abs(e.vx)>1?a!=="run"&&this._setAnimationState(i,n,"run",t):a!=="idle"&&this._setAnimationState(i,n,"idle",t):e.vy<0&&a!=="jump"&&a!=="double_jump"?this._setAnimationState(i,n,"jump",t):e.vy>=0&&a!=="fall"&&this._setAnimationState(i,n,"fall",t)}}_setAnimationState(e,t,s,i){t.currentState!==s&&(t.currentState=s,e.animationState=s,e.animationFrame=0,e.animationTimer=0,s==="cling"?i.jumpCount=1:(s==="idle"||s==="run")&&(i.jumpCount=0))}_updateAnimation(e,t,s,i){s.animationTimer+=e;const n=s.animationState;let a;if(n==="spawn"||n==="despawn"?a=f.SPAWN_ANIMATION_SPEED:n==="hit"?a=f.HIT_ANIMATION_SPEED:a=f.ANIMATION_SPEED,s.animationTimer<a)return;s.animationTimer-=a;const r=f.ANIMATION_FRAMES[n]||1;s.animationFrame++,n==="spawn"||n==="despawn"||n==="hit"?s.animationFrame>=r&&(s.animationFrame=r-1,n==="spawn"&&(t.isSpawning=!1,t.spawnComplete=!0,s.width=f.WIDTH,s.height=f.HEIGHT),n==="despawn"&&(t.isDespawning=!1,t.despawnAnimationFinished=!0)):s.animationFrame%=r}}class yt{constructor(){}update(e,{entityManager:t}){const s=t.query([S,R,T,D,C]);for(const i of s){const n=t.getComponent(i,R),a=t.getComponent(i,T),r=t.getComponent(i,S),l=t.getComponent(i,D),h=t.getComponent(i,C);if(r.isSpawning||r.isDespawning){n.vx=0,n.vy=0;continue}this._applyHorizontalMovement(e,l,n,a,r),this._applyVerticalMovement(e,n,a,r),this._updateSurfaceEffects(e,h,n,a,r)}}_applyHorizontalMovement(e,t,s,i,n){if(n.isDashing||n.isHit){n.isHit&&(s.vx=0);return}if(i.isGrounded&&i.groundType==="ice"){const a=f.ICE_ACCELERATION,r=f.ICE_FRICTION;t.moveLeft?s.vx-=a*e:t.moveRight?s.vx+=a*e:(s.vx+=(s.vx>0?-r:r)*e,Math.abs(s.vx)<r*e&&(s.vx=0)),s.vx=Math.max(-n.speed,Math.min(n.speed,s.vx))}else{const a=n.speed*(i.isGrounded&&i.groundType==="sand"?f.SAND_MOVE_MULTIPLIER:1);t.moveLeft?s.vx=-a:t.moveRight?s.vx=a:s.vx=0}}_applyVerticalMovement(e,t,s,i){!i.isDashing&&!i.isHit&&(t.vy+=f.GRAVITY*e),s.isAgainstWall&&!s.isGrounded&&(t.vy=Math.min(t.vy,30)),t.vy=Math.min(t.vy,f.MAX_FALL_SPEED)}_updateSurfaceEffects(e,t,s,i,n){const a=i.isGrounded&&Math.abs(s.vx)>1&&!n.isDashing&&!n.isHit,r=a?{sand:"sand_walk",mud:"mud_run",ice:"ice_run"}[i.groundType]:null;if(r!==n.activeSurfaceSound&&(n.activeSurfaceSound&&c.publish("stopSoundLoop",{key:n.activeSurfaceSound}),r&&c.publish("startSoundLoop",{key:r,channel:"SFX"}),n.activeSurfaceSound=r),a){n.surfaceParticleTimer+=e;const l=i.groundType==="sand"||i.groundType==="mud"?.1:.15;if(n.surfaceParticleTimer>=l){n.surfaceParticleTimer=0;let h;switch(i.groundType){case"sand":h="sand";break;case"mud":h="mud";break;case"ice":h="ice";break;default:i.groundType&&(h="walk_dust");break}h&&c.publish("createParticles",{x:t.x+i.width/2,y:t.y+i.height,type:h})}}}}class vt{constructor(e,t,s,i,n){this.ctx=e,this.canvas=t,this.assets=s,this.fontRenderer=n,this.lastFrameTime=0,this.keybinds=i,this.isRunning=!1,this.gameHasStarted=!1,this.pauseForMenu=!1,this.entityManager=new Te,this.lastCheckpoint=null,this.fruitsAtLastCheckpoint=new Set,this.playerEntityId=null,this.camera=new st(t.width,t.height),this.hud=new at(t,this.fontRenderer),this.soundManager=new nt,this.soundManager.loadSounds(s),this.renderer=new rt(e,t,s),this.gameState=new le,c.publish("gameStateUpdated",this.gameState),this.levelManager=new ct(this.gameState),this.inputSystemProcessor=new mt,this.playerStateSystem=new gt,this.movementSystem=new yt,this.collisionSystem=new ot,this.gameplaySystem=new ft,this.particleSystem=new ht(s),this.uiSystem=new dt(t,s),this.systems=[this.inputSystemProcessor,this.playerStateSystem,this.movementSystem,this.collisionSystem,this.particleSystem,this.uiSystem],this.levelStartTime=0,this.levelTime=0,this.currentLevel=null,this.collectedFruits=[],this._setupEventSubscriptions()}_setupEventSubscriptions(){c.subscribe("requestStartGame",()=>this.loadLevel(this.gameState.currentSection,this.gameState.currentLevelIndex)),c.subscribe("requestLevelLoad",({sectionIndex:e,levelIndex:t})=>this.loadLevel(e,t)),c.subscribe("requestLevelRestart",()=>this.loadLevel(this.gameState.currentSection,this.gameState.currentLevelIndex)),c.subscribe("keybindsUpdated",e=>this.updateKeybinds(e)),c.subscribe("fruitCollected",e=>this._onFruitCollected(e)),c.subscribe("playerTookDamage",e=>this._onPlayerTookDamage(e)),c.subscribe("trophyCollision",()=>this._onTrophyCollision()),c.subscribe("checkpointActivated",e=>this._onCheckpointActivated(e)),c.subscribe("playerDied",()=>this._onPlayerDied()),c.subscribe("characterUpdated",e=>this.updatePlayerCharacter(e)),c.subscribe("menuOpened",()=>{this.pauseForMenu=!0,this.pause()}),c.subscribe("allMenusClosed",()=>{this.pauseForMenu=!1,this.resume()}),c.subscribe("gameStateUpdated",e=>this.gameState=e)}updatePlayerCharacter(e){if(this.playerEntityId===null)return;const t=this.entityManager.getComponent(this.playerEntityId,Se);t&&(t.characterId=e||this.gameState.selectedCharacter)}updateKeybinds(e){this.keybinds={...e}}start(){this.isRunning||(this.isRunning=!0,this.gameHasStarted=!0,this.lastFrameTime=performance.now(),c.publish("gameStarted"),c.publish("gameResumed"),this.gameLoop())}stop(){this.isRunning=!1,this.soundManager.stopAll()}pause(){if(!this.isRunning)return;this.isRunning=!1,this.soundManager.stopAll({except:["UI"]});const e=this.entityManager.getComponent(this.playerEntityId,S);e&&(e.needsRespawn=!1),c.publish("gamePaused")}resume(){if(this.pauseForMenu||this.isRunning||!this.gameHasStarted||this.gameState.showingLevelComplete)return;this.isRunning=!0,this.lastFrameTime=performance.now(),c.publish("gameResumed"),this.gameLoop();const e=this.entityManager.getComponent(this.playerEntityId,S);e&&(e.needsRespawn=!1)}gameLoop(e=performance.now()){if(!this.isRunning)return;const t=Math.min((e-this.lastFrameTime)/1e3,.016);this.lastFrameTime=e,this.update(t),this.render(t),requestAnimationFrame(s=>this.gameLoop(s))}loadLevel(e,t){this.levelManager.gameState=this.gameState;const s=this.levelManager.loadLevel(e,t);if(!s){this.stop();return}this.currentLevel=s,this.pauseForMenu=!1;const i=new le(this.gameState);i.showingLevelComplete=!1,i.currentSection=e,i.currentLevelIndex=t,this.gameState=i,this.gameState.incrementAttempts(e,t),c.publish("gameStateUpdated",this.gameState),this.collectedFruits=[],this.lastCheckpoint=null,this.fruitsAtLastCheckpoint.clear(),this.soundManager.stopAll(),this.entityManager=new Te,this.playerEntityId=ut(this.entityManager,this.currentLevel.startPosition.x,this.currentLevel.startPosition.y,this.gameState.selectedCharacter),this.camera.updateLevelBounds(this.currentLevel.width,this.currentLevel.height),this.camera.snapToPlayer(this.entityManager,this.playerEntityId),this.levelStartTime=performance.now(),this.gameHasStarted?this.resume():this.start(),c.publish("levelLoaded",{gameState:this.gameState})}update(e){if(!this.currentLevel)return;this.isRunning&&!this.gameState.showingLevelComplete&&(this.levelTime=(performance.now()-this.levelStartTime)/1e3),this.camera.update(this.entityManager,this.playerEntityId,e);const t={entityManager:this.entityManager,playerEntityId:this.playerEntityId,level:this.currentLevel,camera:this.camera,isRunning:this.isRunning,gameState:this.gameState,keybinds:this.keybinds,dt:e};for(const n of this.systems)n.update(e,t);const s=this.entityManager.getComponent(this.playerEntityId,S),i=this.entityManager.getComponent(this.playerEntityId,Y);s&&s.needsRespawn&&!this.gameState.showingLevelComplete&&this.isRunning&&this._respawnPlayer(),this.currentLevel.updateFruits(e),this.currentLevel.updateTrophyAnimation(e),this.currentLevel.updateCheckpoints(e),this.currentLevel.updateTrampolines(e);for(let n=this.collectedFruits.length-1;n>=0;n--){const a=this.collectedFruits[n];a.frameTimer+=e,a.frameTimer>=a.frameSpeed&&(a.frameTimer=0,a.frame++,a.frame>=a.collectedFrameCount&&this.collectedFruits.splice(n,1))}if(s&&s.despawnAnimationFinished&&!this.gameState.showingLevelComplete){s.despawnAnimationFinished=!1;const n={deaths:s.deathCount,time:this.levelTime},a=this.gameState.onLevelComplete(n);a!==this.gameState&&(this.gameState=a,c.publish("gameStateUpdated",this.gameState),this.pause(),c.publish("levelComplete",{deaths:n.deaths,time:n.time,hasNextLevel:this.levelManager.hasNextLevel(),hasPreviousLevel:this.levelManager.hasPreviousLevel()}))}c.publish("statsUpdated",{levelName:this.currentLevel.name,collectedFruits:this.currentLevel.getFruitCount(),totalFruits:this.currentLevel.getTotalFruitCount(),deathCount:s?s.deathCount:0,levelTime:this.levelTime,health:i?i.currentHealth:100,maxHealth:i?i.maxHealth:100})}_onPlayerTookDamage({amount:e}){const t=this.entityManager.getComponent(this.playerEntityId,Y),s=this.entityManager.getComponent(this.playerEntityId,S);t&&s&&!s.needsRespawn&&(t.currentHealth=Math.max(0,t.currentHealth-e),this.camera.shake(8,.3),t.currentHealth<=0&&this._onPlayerDied())}_onPlayerDied(){const e=this.entityManager.getComponent(this.playerEntityId,S);e&&!e.needsRespawn&&(e.deathCount++,e.needsRespawn=!0)}_respawnPlayer(){const e=this.lastCheckpoint||this.currentLevel.startPosition;this.lastCheckpoint?this.currentLevel.fruits.forEach((d,u)=>d.collected=this.fruitsAtLastCheckpoint.has(u)):this.currentLevel.fruits.forEach(d=>d.collected=!1),this.currentLevel.recalculateCollectedFruits();const t=this.entityManager.getComponent(this.playerEntityId,C),s=this.entityManager.getComponent(this.playerEntityId,R),i=this.entityManager.getComponent(this.playerEntityId,S),n=this.entityManager.getComponent(this.playerEntityId,I),a=this.entityManager.getComponent(this.playerEntityId,T),r=this.entityManager.getComponent(this.playerEntityId,j),l=this.entityManager.getComponent(this.playerEntityId,Y);t.x=e.x,t.y=e.y,s.vx=0,s.vy=0,l&&(l.currentHealth=l.maxHealth);const h=i.deathCount;this.entityManager.removeComponent(this.playerEntityId,S),this.entityManager.addComponent(this.playerEntityId,new S({deathCount:h})),n.animationState="spawn",r.currentState="spawn",n.animationFrame=0,n.animationTimer=0,n.direction="right",n.width=f.SPAWN_WIDTH,n.height=f.SPAWN_HEIGHT,a.isGrounded=!1,a.isAgainstWall=!1,a.groundType=null,this.camera.shake(15,.5),c.publish("playSound",{key:"death_sound",volume:.3,channel:"SFX"})}_onFruitCollected(e){this.currentLevel.collectFruit(e),c.publish("playSound",{key:"collect",volume:.8,channel:"SFX"}),this.collectedFruits.push({x:e.x,y:e.y,size:e.size,frame:0,frameSpeed:.1,frameTimer:0,collectedFrameCount:6});const t=this.entityManager.getComponent(this.playerEntityId,Y);t&&t.currentHealth<t.maxHealth&&(t.currentHealth=Math.min(t.maxHealth,t.currentHealth+10))}_onCheckpointActivated(e){e.state="activating",this.lastCheckpoint={x:e.x,y:e.y-e.size/2},c.publish("playSound",{key:"checkpoint_activated",volume:1,channel:"UI"}),this.fruitsAtLastCheckpoint.clear(),this.currentLevel.fruits.forEach((t,s)=>{t.collected&&this.fruitsAtLastCheckpoint.add(s)}),this.currentLevel.checkpoints.forEach(t=>{t!==e&&t.state==="active"&&(t.state="inactive",t.frame=0)})}_onTrophyCollision(){const e=this.entityManager.getComponent(this.playerEntityId,S),t=this.entityManager.getComponent(this.playerEntityId,I),s=this.entityManager.getComponent(this.playerEntityId,j);e&&!e.isDespawning&&(this.currentLevel.trophy.acquired=!0,this.camera.shake(8,.3),e.isDespawning=!0,t.animationState="despawn",s.currentState="despawn",t.animationFrame=0,t.animationTimer=0,t.width=f.SPAWN_WIDTH,t.height=f.SPAWN_HEIGHT)}render(e){this.currentLevel&&(this.ctx.clearRect(0,0,this.canvas.width,this.canvas.height),this.renderer.drawScrollingBackground(this.currentLevel,e),this.renderer.renderScene(this.camera,this.currentLevel,this.entityManager,this.collectedFruits),this.particleSystem.render(this.ctx,this.camera),this.hud.drawGameHUD(this.ctx),this.uiSystem.render(this.ctx,this.isRunning))}}function bt(o,e,t,s=!0){const i=document.createElement("canvas");i.width=o,i.height=e;const n=i.getContext("2d");return n.fillStyle=t,n.fillRect(0,0,o,e),s&&(n.fillStyle="rgba(0, 0, 0, 0.1)",n.fillRect(0,0,o/2,e/2),n.fillRect(o/2,e/2,o/2,e/2)),i}function Le(o,e){return new Promise(t=>{const s=new Image,i=1e4;let n=!1;const a=()=>{if(n)return;n=!0,console.warn(`Failed or timed out loading image: ${o}. Using fallback.`);let l="#808080";e.includes("player")?l="#ff8c21":e.includes("fruit")&&(l="#FF6B6B");const h=bt(32,32,l),d=new Image;d.src=h.toDataURL(),d.onload=()=>t(d)},r=setTimeout(a,i);s.onload=()=>{n||(clearTimeout(r),t(s))},s.onerror=()=>{clearTimeout(r),a()},s.crossOrigin="anonymous",s.src=o})}function xt(o,e){return new Promise(t=>{const s=new Audio,i=1e4;let n=!1;const a=()=>{if(n)return;n=!0,console.warn(`Failed or timed out loading sound: ${o}. Using silent fallback.`);const l=new Audio("data:audio/wav;base64,UklGRigAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA=");t(l)},r=setTimeout(a,i);s.addEventListener("canplaythrough",()=>{n||(clearTimeout(r),t(s))}),s.addEventListener("error",()=>{clearTimeout(r),a()}),s.crossOrigin="anonymous",s.preload="auto",s.src=o,s.load()})}function St(o){return fetch(o).then(e=>{if(!e.ok)throw new Error(`Failed to fetch level: ${o}, status: ${e.status}`);return e.json()}).catch(e=>(console.error(`Error loading JSON from ${o}:`,e),null))}const ve={PinkMan:{path:"/assets/MainCharacters/PinkMan/"},NinjaFrog:{path:"/assets/MainCharacters/NinjaFrog/"},MaskDude:{path:"/assets/MainCharacters/MaskDude/"},VirtualGuy:{path:"/assets/MainCharacters/VirtualGuy/"}},Ie={playerJump:"jump.png",playerDoubleJump:"double_jump.png",playerIdle:"idle.png",playerRun:"run.png",playerFall:"fall.png",playerDash:"dash.png",playerCling:"wall_jump.png",playerHit:"hit.png"};async function _t(){const o={font_spritesheet:"/assets/Menu/Text/Text (White) (8x10).png",settings_icon:"/assets/Menu/Buttons/Settings.png",pause_icon:"/assets/Menu/Buttons/Pause.png",play_icon:"/assets/Menu/Buttons/Play.png",levels_icon:"/assets/Menu/Buttons/Levels.png",character_icon:"/assets/Menu/Buttons/Character.png",info_icon:"/assets/Menu/Buttons/Info.png",background_blue:"/assets/Background/Blue.png",background_brown:"/assets/Background/Brown.png",background_gray:"/assets/Background/Gray.png",background_green:"/assets/Background/Green.png",background_pink:"/assets/Background/Pink.png",background_purple:"/assets/Background/Purple.png",background_red:"/assets/Background/Red.png",background_yellow:"/assets/Background/Yellow.png",block:"/assets/Terrain/Terrain.png",playerAppear:"/assets/MainCharacters/Appearing.png",playerDisappear:"/assets/MainCharacters/Disappearing.png",fruit_apple:"/assets/Items/Fruits/Apple.png",fruit_bananas:"/assets/Items/Fruits/Bananas.png",fruit_cherries:"/assets/Items/Fruits/Cherries.png",fruit_kiwi:"/assets/Items/Fruits/Kiwi.png",fruit_melon:"/assets/Items/Fruits/Melon.png",fruit_orange:"/assets/Items/Fruits/Orange.png",fruit_pineapple:"/assets/Items/Fruits/Pineapple.png",fruit_strawberry:"/assets/Items/Fruits/Strawberry.png",fruit_collected:"/assets/Items/Fruits/Collected.png",checkpoint_inactive:"/assets/Items/Checkpoints/Checkpoint/Checkpoint (No Flag).png",checkpoint_activation:"/assets/Items/Checkpoints/Checkpoint/Checkpoint (Flag Out).png",checkpoint_active:"/assets/Items/Checkpoints/Checkpoint/Checkpoint (Flag Idle).png",trophy:"/assets/Items/Checkpoints/End/End (Pressed).png",spike_two:"/assets/Traps/Spikes/Two.png",fire_off:"/assets/Traps/Fire/off.png",fire_hit:"/assets/Traps/Fire/hit.png",fire_on:"/assets/Traps/Fire/on.png",sand_mud_ice:"/assets/Traps/Sand Mud Ice/Sand Mud Ice.png",trampoline_idle:"/assets/Traps/Trampoline/Idle.png",trampoline_jump:"/assets/Traps/Trampoline/Jump.png",dust_particle:"/assets/Other/Dust Particle.png",ice_particle:"/assets/Traps/Sand Mud Ice/Ice Particle.png",sand_particle:"/assets/Traps/Sand Mud Ice/Sand Particle.png",mud_particle:"/assets/Traps/Sand Mud Ice/Mud Particle.png"},e={button_click:"/assets/Sounds/Button Click.mp3",jump:"/assets/Sounds/Player Jump.mp3",double_jump:"/assets/Sounds/Player Double Jump.mp3",collect:"/assets/Sounds/Fruit Collect.mp3",level_complete:"/assets/Sounds/Level Complete.mp3",death_sound:"/assets/Sounds/Death.mp3",dash:"/assets/Sounds/Whoosh.mp3",checkpoint_activated:"/assets/Sounds/Checkpoint (Activation).mp3",sand_walk:"/assets/Sounds/Sand Walk.mp3",mud_run:"/assets/Sounds/Mud Run.mp3",ice_run:"/assets/Sounds/Ice Run.mp3",trampoline_bounce:"/assets/Sounds/Boing.mp3"};console.log("Starting asset loading...");const t=Object.entries(o).map(([r,l])=>Le(l,r).then(h=>({[r]:h}))),s=Object.entries(e).map(([r,l])=>xt(l).then(h=>({[r]:h}))),i=[];for(const r in ve)for(const l in Ie){const h=ve[r].path+Ie[l],d=Le(h,`${r}-${l}`).then(u=>({type:"character",charKey:r,spriteKey:l,img:u}));i.push(d)}const n=[];E.forEach((r,l)=>{r.levels.forEach((h,d)=>{h.jsonPath&&n.push(St(h.jsonPath).then(u=>({data:u,sectionIndex:l,levelIndex:d,type:"level"})))})});const a=[...t,...s,...i,...n];try{const r=await Promise.all(a),l={characters:{}};for(const h in ve)l.characters[h]={};for(const h of r)h&&(h.type==="character"?l.characters[h.charKey][h.spriteKey]=h.img:h.type==="level"?E[h.sectionIndex].levels[h.levelIndex]=h.data:Object.assign(l,h));return console.log("All assets and level data processed. Available assets:",Object.keys(l).length),l}catch(r){throw console.error("A critical error occurred during asset loading:",r),r}}class wt{constructor(){this.init()}init(){window.addEventListener("keydown",this.handleKeyDown.bind(this)),window.addEventListener("keyup",this.handleKeyUp.bind(this)),window.addEventListener("contextmenu",e=>e.preventDefault())}handleKeyDown(e){const t=e.key.toLowerCase();c.publish("key_down",{key:t,rawEvent:e});const s={enter:"confirm",r:"restart",n:"next",p:"previous",escape:"escape_pressed"};t===" "&&c.publish("action_confirm_pressed");const i=s[t];i&&c.publish(`action_${i}`)}handleKeyUp(e){const t=e.key.toLowerCase();c.publish("key_up",{key:t,rawEvent:e})}}const Me={A:{x:0,y:0},B:{x:8,y:0},C:{x:16,y:0},D:{x:24,y:0},E:{x:32,y:0},F:{x:40,y:0},G:{x:48,y:0},H:{x:56,y:0},I:{x:64,y:0},J:{x:72,y:0},K:{x:0,y:10},L:{x:8,y:10},M:{x:16,y:10},N:{x:24,y:10},O:{x:32,y:10},P:{x:40,y:10},Q:{x:48,y:10},R:{x:56,y:10},S:{x:64,y:10},T:{x:72,y:10},U:{x:0,y:20},V:{x:8,y:20},W:{x:16,y:20},X:{x:24,y:20},Y:{x:32,y:20},Z:{x:40,y:20},0:{x:0,y:30},1:{x:8,y:30},2:{x:16,y:30},3:{x:24,y:30},4:{x:32,y:30},5:{x:40,y:30},6:{x:48,y:30},7:{x:56,y:30},8:{x:64,y:30},9:{x:72,y:30},".":{x:0,y:40},",":{x:8,y:40},":":{x:16,y:40},"?":{x:24,y:40},"!":{x:32,y:40},"(":{x:40,y:40},")":{x:48,y:40},"+":{x:56,y:40},"-":{x:64,y:40},"/":{x:48,y:20}," ":{x:0,y:0,space:!0},"%":{x:56,y:20},"'":{x:64,y:20},"&":{x:72,y:20}},A=8,P=10;class Ct{constructor(e){this.sprite=e,this.sprite||console.error("Font spritesheet not provided to FontRenderer!"),this.characterCache=new Map}_getCachedCharacter(e,t){const s=`${e}_${t}`;if(this.characterCache.has(s))return this.characterCache.get(s);const i=Me[e];if(!i)return null;const n=document.createElement("canvas");n.width=A,n.height=P;const a=n.getContext("2d");return a.imageSmoothingEnabled=!1,a.drawImage(this.sprite,i.x,i.y,A,P,0,0,A,P),a.globalCompositeOperation="source-in",a.fillStyle=t,a.fillRect(0,0,A,P),this.characterCache.set(s,n),n}_renderText(e,t,s,i,{scale:n=1,color:a=null}={}){if(!this.sprite)return;const r=t.toUpperCase();let l=s;e.imageSmoothingEnabled=!1;for(const h of r){const d=Me[h];if(!d){l+=A*n;continue}if(d.space){l+=A*n;continue}let u,p=d.x,y=d.y;a?(u=this._getCachedCharacter(h,a),p=0,y=0):u=this.sprite,u&&e.drawImage(u,p,y,A,P,l,i,A*n,P*n),l+=A*n}}drawText(e,t,s,i,{scale:n=1,align:a="left",color:r="white",outlineColor:l=null,outlineWidth:h=1}={}){const d=this.getTextWidth(t,n);let u=s;if(a==="center"?u=s-d/2:a==="right"&&(u=s-d),l){const p={scale:n,color:l};this._renderText(e,t,u-h,i,p),this._renderText(e,t,u+h,i,p),this._renderText(e,t,u,i-h,p),this._renderText(e,t,u,i+h,p)}this._renderText(e,t,u,i,{scale:n,color:r})}getTextWidth(e,t=1){return e.length*A*t}renderTextToCanvas(e,t){if(!this.sprite)return null;const s=t.outlineColor&&t.outlineWidth?t.outlineWidth*2:0,i=this.getTextWidth(e,t.scale),n=P*t.scale,a=document.createElement("canvas");a.width=i+s,a.height=n+s;const r=a.getContext("2d"),l={...t,align:"left"};return this.drawText(r,e,s/2,s/2,l),a}}/**
 * @license
 * Copyright 2019 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */const re=globalThis,_e=re.ShadowRoot&&(re.ShadyCSS===void 0||re.ShadyCSS.nativeShadow)&&"adoptedStyleSheets"in Document.prototype&&"replace"in CSSStyleSheet.prototype,we=Symbol(),Re=new WeakMap;let We=class{constructor(e,t,s){if(this._$cssResult$=!0,s!==we)throw Error("CSSResult is not constructable. Use `unsafeCSS` or `css` instead.");this.cssText=e,this.t=t}get styleSheet(){let e=this.o;const t=this.t;if(_e&&e===void 0){const s=t!==void 0&&t.length===1;s&&(e=Re.get(t)),e===void 0&&((this.o=e=new CSSStyleSheet).replaceSync(this.cssText),s&&Re.set(t,e))}return e}toString(){return this.cssText}};const kt=o=>new We(typeof o=="string"?o:o+"",void 0,we),L=(o,...e)=>{const t=o.length===1?o[0]:e.reduce((s,i,n)=>s+(a=>{if(a._$cssResult$===!0)return a.cssText;if(typeof a=="number")return a;throw Error("Value passed to 'css' function must be a 'css' function result: "+a+". Use 'unsafeCSS' to pass non-literal values, but take care to ensure page security.")})(i)+o[n+1],o[0]);return new We(t,o,we)},$t=(o,e)=>{if(_e)o.adoptedStyleSheets=e.map(t=>t instanceof CSSStyleSheet?t:t.styleSheet);else for(const t of e){const s=document.createElement("style"),i=re.litNonce;i!==void 0&&s.setAttribute("nonce",i),s.textContent=t.cssText,o.appendChild(s)}},Pe=_e?o=>o:o=>o instanceof CSSStyleSheet?(e=>{let t="";for(const s of e.cssRules)t+=s.cssText;return kt(t)})(o):o;/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */const{is:At,defineProperty:Et,getOwnPropertyDescriptor:Tt,getOwnPropertyNames:Lt,getOwnPropertySymbols:It,getPrototypeOf:Mt}=Object,he=globalThis,Fe=he.trustedTypes,Rt=Fe?Fe.emptyScript:"",Pt=he.reactiveElementPolyfillSupport,J=(o,e)=>o,xe={toAttribute(o,e){switch(e){case Boolean:o=o?Rt:null;break;case Object:case Array:o=o==null?o:JSON.stringify(o)}return o},fromAttribute(o,e){let t=o;switch(e){case Boolean:t=o!==null;break;case Number:t=o===null?null:Number(o);break;case Object:case Array:try{t=JSON.parse(o)}catch{t=null}}return t}},Ge=(o,e)=>!At(o,e),je={attribute:!0,type:String,converter:xe,reflect:!1,useDefault:!1,hasChanged:Ge};Symbol.metadata??=Symbol("metadata"),he.litPropertyMetadata??=new WeakMap;let B=class extends HTMLElement{static addInitializer(e){this._$Ei(),(this.l??=[]).push(e)}static get observedAttributes(){return this.finalize(),this._$Eh&&[...this._$Eh.keys()]}static createProperty(e,t=je){if(t.state&&(t.attribute=!1),this._$Ei(),this.prototype.hasOwnProperty(e)&&((t=Object.create(t)).wrapped=!0),this.elementProperties.set(e,t),!t.noAccessor){const s=Symbol(),i=this.getPropertyDescriptor(e,s,t);i!==void 0&&Et(this.prototype,e,i)}}static getPropertyDescriptor(e,t,s){const{get:i,set:n}=Tt(this.prototype,e)??{get(){return this[t]},set(a){this[t]=a}};return{get:i,set(a){const r=i?.call(this);n?.call(this,a),this.requestUpdate(e,r,s)},configurable:!0,enumerable:!0}}static getPropertyOptions(e){return this.elementProperties.get(e)??je}static _$Ei(){if(this.hasOwnProperty(J("elementProperties")))return;const e=Mt(this);e.finalize(),e.l!==void 0&&(this.l=[...e.l]),this.elementProperties=new Map(e.elementProperties)}static finalize(){if(this.hasOwnProperty(J("finalized")))return;if(this.finalized=!0,this._$Ei(),this.hasOwnProperty(J("properties"))){const t=this.properties,s=[...Lt(t),...It(t)];for(const i of s)this.createProperty(i,t[i])}const e=this[Symbol.metadata];if(e!==null){const t=litPropertyMetadata.get(e);if(t!==void 0)for(const[s,i]of t)this.elementProperties.set(s,i)}this._$Eh=new Map;for(const[t,s]of this.elementProperties){const i=this._$Eu(t,s);i!==void 0&&this._$Eh.set(i,t)}this.elementStyles=this.finalizeStyles(this.styles)}static finalizeStyles(e){const t=[];if(Array.isArray(e)){const s=new Set(e.flat(1/0).reverse());for(const i of s)t.unshift(Pe(i))}else e!==void 0&&t.push(Pe(e));return t}static _$Eu(e,t){const s=t.attribute;return s===!1?void 0:typeof s=="string"?s:typeof e=="string"?e.toLowerCase():void 0}constructor(){super(),this._$Ep=void 0,this.isUpdatePending=!1,this.hasUpdated=!1,this._$Em=null,this._$Ev()}_$Ev(){this._$ES=new Promise(e=>this.enableUpdating=e),this._$AL=new Map,this._$E_(),this.requestUpdate(),this.constructor.l?.forEach(e=>e(this))}addController(e){(this._$EO??=new Set).add(e),this.renderRoot!==void 0&&this.isConnected&&e.hostConnected?.()}removeController(e){this._$EO?.delete(e)}_$E_(){const e=new Map,t=this.constructor.elementProperties;for(const s of t.keys())this.hasOwnProperty(s)&&(e.set(s,this[s]),delete this[s]);e.size>0&&(this._$Ep=e)}createRenderRoot(){const e=this.shadowRoot??this.attachShadow(this.constructor.shadowRootOptions);return $t(e,this.constructor.elementStyles),e}connectedCallback(){this.renderRoot??=this.createRenderRoot(),this.enableUpdating(!0),this._$EO?.forEach(e=>e.hostConnected?.())}enableUpdating(e){}disconnectedCallback(){this._$EO?.forEach(e=>e.hostDisconnected?.())}attributeChangedCallback(e,t,s){this._$AK(e,s)}_$ET(e,t){const s=this.constructor.elementProperties.get(e),i=this.constructor._$Eu(e,s);if(i!==void 0&&s.reflect===!0){const n=(s.converter?.toAttribute!==void 0?s.converter:xe).toAttribute(t,s.type);this._$Em=e,n==null?this.removeAttribute(i):this.setAttribute(i,n),this._$Em=null}}_$AK(e,t){const s=this.constructor,i=s._$Eh.get(e);if(i!==void 0&&this._$Em!==i){const n=s.getPropertyOptions(i),a=typeof n.converter=="function"?{fromAttribute:n.converter}:n.converter?.fromAttribute!==void 0?n.converter:xe;this._$Em=i;const r=a.fromAttribute(t,n.type);this[i]=r??this._$Ej?.get(i)??r,this._$Em=null}}requestUpdate(e,t,s){if(e!==void 0){const i=this.constructor,n=this[e];if(s??=i.getPropertyOptions(e),!((s.hasChanged??Ge)(n,t)||s.useDefault&&s.reflect&&n===this._$Ej?.get(e)&&!this.hasAttribute(i._$Eu(e,s))))return;this.C(e,t,s)}this.isUpdatePending===!1&&(this._$ES=this._$EP())}C(e,t,{useDefault:s,reflect:i,wrapped:n},a){s&&!(this._$Ej??=new Map).has(e)&&(this._$Ej.set(e,a??t??this[e]),n!==!0||a!==void 0)||(this._$AL.has(e)||(this.hasUpdated||s||(t=void 0),this._$AL.set(e,t)),i===!0&&this._$Em!==e&&(this._$Eq??=new Set).add(e))}async _$EP(){this.isUpdatePending=!0;try{await this._$ES}catch(t){Promise.reject(t)}const e=this.scheduleUpdate();return e!=null&&await e,!this.isUpdatePending}scheduleUpdate(){return this.performUpdate()}performUpdate(){if(!this.isUpdatePending)return;if(!this.hasUpdated){if(this.renderRoot??=this.createRenderRoot(),this._$Ep){for(const[i,n]of this._$Ep)this[i]=n;this._$Ep=void 0}const s=this.constructor.elementProperties;if(s.size>0)for(const[i,n]of s){const{wrapped:a}=n,r=this[i];a!==!0||this._$AL.has(i)||r===void 0||this.C(i,void 0,n,r)}}let e=!1;const t=this._$AL;try{e=this.shouldUpdate(t),e?(this.willUpdate(t),this._$EO?.forEach(s=>s.hostUpdate?.()),this.update(t)):this._$EM()}catch(s){throw e=!1,this._$EM(),s}e&&this._$AE(t)}willUpdate(e){}_$AE(e){this._$EO?.forEach(t=>t.hostUpdated?.()),this.hasUpdated||(this.hasUpdated=!0,this.firstUpdated(e)),this.updated(e)}_$EM(){this._$AL=new Map,this.isUpdatePending=!1}get updateComplete(){return this.getUpdateComplete()}getUpdateComplete(){return this._$ES}shouldUpdate(e){return!0}update(e){this._$Eq&&=this._$Eq.forEach(t=>this._$ET(t,this[t])),this._$EM()}updated(e){}firstUpdated(e){}};B.elementStyles=[],B.shadowRootOptions={mode:"open"},B[J("elementProperties")]=new Map,B[J("finalized")]=new Map,Pt?.({ReactiveElement:B}),(he.reactiveElementVersions??=[]).push("2.1.1");/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */const Ce=globalThis,ce=Ce.trustedTypes,He=ce?ce.createPolicy("lit-html",{createHTML:o=>o}):void 0,Ke="$lit$",M=`lit$${Math.random().toFixed(9).slice(2)}$`,Ve="?"+M,Ft=`<${Ve}>`,O=document,Q=()=>O.createComment(""),ee=o=>o===null||typeof o!="object"&&typeof o!="function",ke=Array.isArray,jt=o=>ke(o)||typeof o?.[Symbol.iterator]=="function",be=`[ 	
\f\r]`,X=/<(?:(!--|\/[^a-zA-Z])|(\/?[a-zA-Z][^>\s]*)|(\/?$))/g,De=/-->/g,Oe=/>/g,F=RegExp(`>|${be}(?:([^\\s"'>=/]+)(${be}*=${be}*(?:[^ 	
\f\r"'\`<>=]|("|')|))|$)`,"g"),Ue=/'/g,ze=/"/g,Xe=/^(?:script|style|textarea|title)$/i,Ht=o=>(e,...t)=>({_$litType$:o,strings:e,values:t}),m=Ht(1),W=Symbol.for("lit-noChange"),_=Symbol.for("lit-nothing"),Ne=new WeakMap,H=O.createTreeWalker(O,129);function Ye(o,e){if(!ke(o)||!o.hasOwnProperty("raw"))throw Error("invalid template strings array");return He!==void 0?He.createHTML(e):e}const Dt=(o,e)=>{const t=o.length-1,s=[];let i,n=e===2?"<svg>":e===3?"<math>":"",a=X;for(let r=0;r<t;r++){const l=o[r];let h,d,u=-1,p=0;for(;p<l.length&&(a.lastIndex=p,d=a.exec(l),d!==null);)p=a.lastIndex,a===X?d[1]==="!--"?a=De:d[1]!==void 0?a=Oe:d[2]!==void 0?(Xe.test(d[2])&&(i=RegExp("</"+d[2],"g")),a=F):d[3]!==void 0&&(a=F):a===F?d[0]===">"?(a=i??X,u=-1):d[1]===void 0?u=-2:(u=a.lastIndex-d[2].length,h=d[1],a=d[3]===void 0?F:d[3]==='"'?ze:Ue):a===ze||a===Ue?a=F:a===De||a===Oe?a=X:(a=F,i=void 0);const y=a===F&&o[r+1].startsWith("/>")?" ":"";n+=a===X?l+Ft:u>=0?(s.push(h),l.slice(0,u)+Ke+l.slice(u)+M+y):l+M+(u===-2?r:y)}return[Ye(o,n+(o[t]||"<?>")+(e===2?"</svg>":e===3?"</math>":"")),s]};class te{constructor({strings:e,_$litType$:t},s){let i;this.parts=[];let n=0,a=0;const r=e.length-1,l=this.parts,[h,d]=Dt(e,t);if(this.el=te.createElement(h,s),H.currentNode=this.el.content,t===2||t===3){const u=this.el.content.firstChild;u.replaceWith(...u.childNodes)}for(;(i=H.nextNode())!==null&&l.length<r;){if(i.nodeType===1){if(i.hasAttributes())for(const u of i.getAttributeNames())if(u.endsWith(Ke)){const p=d[a++],y=i.getAttribute(u).split(M),x=/([.?@])?(.*)/.exec(p);l.push({type:1,index:n,name:x[2],strings:y,ctor:x[1]==="."?Ut:x[1]==="?"?zt:x[1]==="@"?Nt:de}),i.removeAttribute(u)}else u.startsWith(M)&&(l.push({type:6,index:n}),i.removeAttribute(u));if(Xe.test(i.tagName)){const u=i.textContent.split(M),p=u.length-1;if(p>0){i.textContent=ce?ce.emptyScript:"";for(let y=0;y<p;y++)i.append(u[y],Q()),H.nextNode(),l.push({type:2,index:++n});i.append(u[p],Q())}}}else if(i.nodeType===8)if(i.data===Ve)l.push({type:2,index:n});else{let u=-1;for(;(u=i.data.indexOf(M,u+1))!==-1;)l.push({type:7,index:n}),u+=M.length-1}n++}}static createElement(e,t){const s=O.createElement("template");return s.innerHTML=e,s}}function G(o,e,t=o,s){if(e===W)return e;let i=s!==void 0?t._$Co?.[s]:t._$Cl;const n=ee(e)?void 0:e._$litDirective$;return i?.constructor!==n&&(i?._$AO?.(!1),n===void 0?i=void 0:(i=new n(o),i._$AT(o,t,s)),s!==void 0?(t._$Co??=[])[s]=i:t._$Cl=i),i!==void 0&&(e=G(o,i._$AS(o,e.values),i,s)),e}class Ot{constructor(e,t){this._$AV=[],this._$AN=void 0,this._$AD=e,this._$AM=t}get parentNode(){return this._$AM.parentNode}get _$AU(){return this._$AM._$AU}u(e){const{el:{content:t},parts:s}=this._$AD,i=(e?.creationScope??O).importNode(t,!0);H.currentNode=i;let n=H.nextNode(),a=0,r=0,l=s[0];for(;l!==void 0;){if(a===l.index){let h;l.type===2?h=new se(n,n.nextSibling,this,e):l.type===1?h=new l.ctor(n,l.name,l.strings,this,e):l.type===6&&(h=new Bt(n,this,e)),this._$AV.push(h),l=s[++r]}a!==l?.index&&(n=H.nextNode(),a++)}return H.currentNode=O,i}p(e){let t=0;for(const s of this._$AV)s!==void 0&&(s.strings!==void 0?(s._$AI(e,s,t),t+=s.strings.length-2):s._$AI(e[t])),t++}}class se{get _$AU(){return this._$AM?._$AU??this._$Cv}constructor(e,t,s,i){this.type=2,this._$AH=_,this._$AN=void 0,this._$AA=e,this._$AB=t,this._$AM=s,this.options=i,this._$Cv=i?.isConnected??!0}get parentNode(){let e=this._$AA.parentNode;const t=this._$AM;return t!==void 0&&e?.nodeType===11&&(e=t.parentNode),e}get startNode(){return this._$AA}get endNode(){return this._$AB}_$AI(e,t=this){e=G(this,e,t),ee(e)?e===_||e==null||e===""?(this._$AH!==_&&this._$AR(),this._$AH=_):e!==this._$AH&&e!==W&&this._(e):e._$litType$!==void 0?this.$(e):e.nodeType!==void 0?this.T(e):jt(e)?this.k(e):this._(e)}O(e){return this._$AA.parentNode.insertBefore(e,this._$AB)}T(e){this._$AH!==e&&(this._$AR(),this._$AH=this.O(e))}_(e){this._$AH!==_&&ee(this._$AH)?this._$AA.nextSibling.data=e:this.T(O.createTextNode(e)),this._$AH=e}$(e){const{values:t,_$litType$:s}=e,i=typeof s=="number"?this._$AC(e):(s.el===void 0&&(s.el=te.createElement(Ye(s.h,s.h[0]),this.options)),s);if(this._$AH?._$AD===i)this._$AH.p(t);else{const n=new Ot(i,this),a=n.u(this.options);n.p(t),this.T(a),this._$AH=n}}_$AC(e){let t=Ne.get(e.strings);return t===void 0&&Ne.set(e.strings,t=new te(e)),t}k(e){ke(this._$AH)||(this._$AH=[],this._$AR());const t=this._$AH;let s,i=0;for(const n of e)i===t.length?t.push(s=new se(this.O(Q()),this.O(Q()),this,this.options)):s=t[i],s._$AI(n),i++;i<t.length&&(this._$AR(s&&s._$AB.nextSibling,i),t.length=i)}_$AR(e=this._$AA.nextSibling,t){for(this._$AP?.(!1,!0,t);e!==this._$AB;){const s=e.nextSibling;e.remove(),e=s}}setConnected(e){this._$AM===void 0&&(this._$Cv=e,this._$AP?.(e))}}class de{get tagName(){return this.element.tagName}get _$AU(){return this._$AM._$AU}constructor(e,t,s,i,n){this.type=1,this._$AH=_,this._$AN=void 0,this.element=e,this.name=t,this._$AM=i,this.options=n,s.length>2||s[0]!==""||s[1]!==""?(this._$AH=Array(s.length-1).fill(new String),this.strings=s):this._$AH=_}_$AI(e,t=this,s,i){const n=this.strings;let a=!1;if(n===void 0)e=G(this,e,t,0),a=!ee(e)||e!==this._$AH&&e!==W,a&&(this._$AH=e);else{const r=e;let l,h;for(e=n[0],l=0;l<n.length-1;l++)h=G(this,r[s+l],t,l),h===W&&(h=this._$AH[l]),a||=!ee(h)||h!==this._$AH[l],h===_?e=_:e!==_&&(e+=(h??"")+n[l+1]),this._$AH[l]=h}a&&!i&&this.j(e)}j(e){e===_?this.element.removeAttribute(this.name):this.element.setAttribute(this.name,e??"")}}class Ut extends de{constructor(){super(...arguments),this.type=3}j(e){this.element[this.name]=e===_?void 0:e}}class zt extends de{constructor(){super(...arguments),this.type=4}j(e){this.element.toggleAttribute(this.name,!!e&&e!==_)}}class Nt extends de{constructor(e,t,s,i,n){super(e,t,s,i,n),this.type=5}_$AI(e,t=this){if((e=G(this,e,t,0)??_)===W)return;const s=this._$AH,i=e===_&&s!==_||e.capture!==s.capture||e.once!==s.once||e.passive!==s.passive,n=e!==_&&(s===_||i);i&&this.element.removeEventListener(this.name,this,s),n&&this.element.addEventListener(this.name,this,e),this._$AH=e}handleEvent(e){typeof this._$AH=="function"?this._$AH.call(this.options?.host??this.element,e):this._$AH.handleEvent(e)}}class Bt{constructor(e,t,s){this.element=e,this.type=6,this._$AN=void 0,this._$AM=t,this.options=s}get _$AU(){return this._$AM._$AU}_$AI(e){G(this,e)}}const Wt=Ce.litHtmlPolyfillSupport;Wt?.(te,se),(Ce.litHtmlVersions??=[]).push("3.3.1");const qe=(o,e,t)=>{const s=t?.renderBefore??e;let i=s._$litPart$;if(i===void 0){const n=t?.renderBefore??null;s._$litPart$=i=new se(e.insertBefore(Q(),n),n,void 0,t??{})}return i._$AI(o),i};/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */const $e=globalThis;class w extends B{constructor(){super(...arguments),this.renderOptions={host:this},this._$Do=void 0}createRenderRoot(){const e=super.createRenderRoot();return this.renderOptions.renderBefore??=e.firstChild,e}update(e){const t=this.render();this.hasUpdated||(this.renderOptions.isConnected=this.isConnected),super.update(e),this._$Do=qe(t,this.renderRoot,this.renderOptions)}connectedCallback(){super.connectedCallback(),this._$Do?.setConnected(!0)}disconnectedCallback(){super.disconnectedCallback(),this._$Do?.setConnected(!1)}render(){return W}}w._$litElement$=!0,w.finalized=!0,$e.litElementHydrateSupport?.({LitElement:w});const Gt=$e.litElementPolyfillSupport;Gt?.({LitElement:w});($e.litElementVersions??=[]).push("4.2.1");/**
 * @license
 * Copyright 2021 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */function*K(o,e){if(o!==void 0){let t=0;for(const s of o)yield e(s,t++)}}function q(o){return o===" "?"SPACE":o.startsWith("arrow")?o.replace("arrow","").toUpperCase():o.toUpperCase()}function Ae(o=0){const e=Math.floor(o/60),t=o%60,s=Math.floor(t),i=Math.floor((t-s)*1e3);return`${e.toString().padStart(2,"0")}:${s.toString().padStart(2,"0")}.${i.toString().padStart(3,"0")}`}class Kt extends w{static properties={fontRenderer:{type:Object},text:{type:String},scale:{type:Number},color:{type:String},outlineColor:{type:String},outlineWidth:{type:Number},align:{type:String}};constructor(){super(),this.text="",this.scale=1,this.color="white",this.outlineColor=null,this.outlineWidth=1,this.align="left"}updated(e){super.updated(e),!(!this.fontRenderer||!this.shadowRoot)&&this.renderCanvas()}renderCanvas(){const e=this.shadowRoot.querySelector("#container");if(!e)return;const t=this.fontRenderer.renderTextToCanvas(this.text,{scale:this.scale,color:this.color,outlineColor:this.outlineColor,outlineWidth:this.outlineWidth,align:this.align});t&&(t.style.imageRendering="pixelated",e.innerHTML="",e.appendChild(t))}render(){return m`<div id="container"></div>`}}customElements.define("bitmap-text",Kt);class Vt extends w{static styles=L`
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
  `;static properties={action:{type:String},currentKey:{type:String},isRemapping:{type:Boolean,state:!0},fontRenderer:{type:Object}};constructor(){super(),this.isRemapping=!1}connectedCallback(){super.connectedCallback(),window.addEventListener("keydown",this._handleGlobalKeydown)}disconnectedCallback(){super.disconnectedCallback(),window.removeEventListener("keydown",this._handleGlobalKeydown)}_handleGlobalKeydown=e=>{if(!this.isRemapping)return;e.preventDefault(),e.stopPropagation();const t=e.key.toLowerCase();this.dispatchEvent(new CustomEvent("keybind-changed",{detail:{action:this.action,newKey:t},bubbles:!0,composed:!0})),this.isRemapping=!1};_startRemap(e){e.stopPropagation(),this.isRemapping=!0,c.publish("playSound",{key:"button_click",volume:.8,channel:"UI"})}render(){const e=this.isRemapping?"Press key...":q(this.currentKey);return m`
      <div
        class="keybind-display ${this.isRemapping?"active-rebind":""}"
        @click=${this._startRemap}
      >
        <bitmap-text
          .fontRenderer=${this.fontRenderer}
          .text=${e}
          scale="1.8"
        ></bitmap-text>
      </div>
    `}}customElements.define("keybind-display",Vt);class Xt extends w{static styles=L`
    :host {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    }
    .modal-overlay {
      position: fixed; inset: 0;
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
  `;static properties={keybinds:{type:Object},soundSettings:{type:Object},fontRenderer:{type:Object}};_dispatchClose(){c.publish("playSound",{key:"button_click",volume:.8,channel:"UI"}),this.dispatchEvent(new CustomEvent("close-modal",{bubbles:!0,composed:!0}))}_toggleSound(){c.publish("playSound",{key:"button_click",volume:.8,channel:"UI"}),c.publish("toggleSound")}_setVolume(e){const t=parseFloat(e.target.value);c.publish("setSoundVolume",{volume:t})}_testSound(){c.publish("playSound",{key:"jump",volume:.8,channel:"UI"})}render(){if(!this.keybinds||!this.soundSettings||!this.fontRenderer)return m``;const e=Object.keys(this.keybinds);return m`
      <div class="modal-overlay" @click=${this._dispatchClose}>
        <div class="modal-content" @click=${t=>t.stopPropagation()}>
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
              ${K(e,t=>m`
                <div class="keybind-item">
                  <div class="label-container">
                    <bitmap-text .fontRenderer=${this.fontRenderer} text=${t.replace(/([A-Z])/g," $1").replace(/^./,s=>s.toUpperCase())} scale="1.8"></bitmap-text>
                  </div>
                  <keybind-display
                    .action=${t}
                    .currentKey=${this.keybinds[t]}
                    .fontRenderer=${this.fontRenderer}
                  ></keybind-display>
                </div>
              `)}
            </div>
          </div>
        </div>
      </div>
    `}}customElements.define("settings-menu",Xt);class Yt extends w{static styles=L`
    :host {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    }
    .modal-overlay {
      position: fixed; inset: 0;
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
  `;static properties={stats:{type:Object},fontRenderer:{type:Object}};constructor(){super(),this.stats={collectedFruits:0,totalFruits:0,deathCount:0,levelTime:0}}_dispatch(e){this.dispatchEvent(new CustomEvent(e,{bubbles:!0,composed:!0}))}render(){return m`
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
            <bitmap-text .fontRenderer=${this.fontRenderer} text="Time: ${Ae(this.stats.levelTime)}" scale="1.8"></bitmap-text>
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
    `}}customElements.define("pause-modal",Yt);class qt extends w{static styles=L`
    :host {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    }
    .modal-overlay {
      position: fixed; inset: 0;
      background-color: rgba(0, 0, 0, 0.7);
      display: flex; justify-content: center; align-items: center;
      z-index: 200;
    }
    .modal-content {
      background-color: #333; padding: 30px; border-radius: 12px;
      box-shadow: 0 8px 16px rgba(0, 0, 0, 0.5); color: #eee;
      text-align: center; position: relative; width: 90%;
      max-width: 600px; max-height: 80vh; overflow-y: auto;
      padding-bottom: 80px;
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
    
    #level-selection-container {
      display: flex; flex-direction: column; gap: 20px; padding: 10px;
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
      display: grid; grid-template-columns: repeat(auto-fill, minmax(60px, 1fr)); gap: 15px;
    }
    .level-button {
      background-color: #555; color: #fff; border: 2px solid #777;
      padding: 15px 10px; border-radius: 8px; cursor: pointer;
      font-size: 1.2em; font-weight: bold; transition: all 0.2s ease-in-out;
      display: flex; justify-content: center; align-items: center;
      min-height: 53px; box-sizing: border-box;
    }
    .level-button:not(:disabled):hover {
      background-color: #007bff; border-color: #0056b3; transform: translateY(-2px);
    }
    .level-button.completed { background-color: #4CAF50; border-color: #45a049; }
    .level-button.current { border-color: #ffc107; box-shadow: 0 0 8px rgba(255, 193, 7, 0.7); }
    .level-button.locked { background-color: #444; color: #777; cursor: not-allowed; border-color: #666; }
    .level-button.locked svg { fill: #777; width: 24px; height: 24px; }

    .footer-actions {
        position: absolute;
        bottom: 20px;
        left: 50%;
        transform: translateX(-50%);
        display: flex;
        gap: 15px;
    }
    .footer-button {
      background-color: #007bff; color: #fff; border: 2px solid #0056b3;
      padding: 10px 20px; border-radius: 8px; cursor: pointer;
      display: flex; justify-content: center; align-items: center;
      transition: all 0.2s ease-in-out;
    }
    .footer-button:hover {
      background-color: #0056b3;
    }
  `;static properties={gameState:{type:Object},fontRenderer:{type:Object}};_dispatchClose(){c.publish("playSound",{key:"button_click",volume:.8,channel:"UI"}),this.dispatchEvent(new CustomEvent("close-modal",{bubbles:!0,composed:!0}))}_selectLevel(e,t){this.dispatchEvent(new CustomEvent("level-selected",{detail:{sectionIndex:e,levelIndex:t},bubbles:!0,composed:!0}))}_openStatsModal(){c.publish("playSound",{key:"button_click",volume:.8,channel:"UI"}),c.publish("ui_button_clicked",{buttonId:"stats"})}render(){return this.gameState?m`
      <div class="modal-overlay" @click=${this._dispatchClose}>
        <div class="modal-content" @click=${e=>e.stopPropagation()}>
          <button class="close-button" @click=${this._dispatchClose}></button>
          <div class="title-container">
            <bitmap-text .fontRenderer=${this.fontRenderer} text="Levels Menu" scale="3" outlineColor="black" outlineWidth="2"></bitmap-text>
          </div>
          <div id="level-selection-container">
            ${K(E,(e,t)=>m`
              <div class="level-section-menu">
                <div class="section-title-container">
                  <bitmap-text .fontRenderer=${this.fontRenderer} text=${e.name} scale="2"></bitmap-text>
                </div>
                <div class="level-grid">
                  ${K(e.levels,(s,i)=>{const n=this.gameState.isLevelUnlocked(t,i),a=this.gameState.isLevelCompleted(t,i),r=this.gameState.currentSection===t&&this.gameState.currentLevelIndex===i,l=`level-button ${a?"completed":""} ${r?"current":""} ${n?"":"locked"}`;return n?m`<button class=${l} @click=${()=>this._selectLevel(t,i)}>${i+1}</button>`:m`<button class=${l} disabled>
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zM9 8V6c0-1.66 1.34-3 3-3s3 1.34 3 3v2H9z"></path></svg>
                         </button>`})}
                </div>
              </div>
            `)}
          </div>
          <div class="footer-actions">
            <button class="footer-button" @click=${this._openStatsModal}>
                <bitmap-text .fontRenderer=${this.fontRenderer} text="View Stats" scale="1.8"></bitmap-text>
            </button>
          </div>
        </div>
      </div>
    `:m``}}customElements.define("levels-menu",qt);class Zt extends w{static styles=L`
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
      /* Removed min-height. Let it size to the text. */
      margin-top: 5px;
    }
    .char-unlock-container { 
      /* Removed min-height. Let it size to the text. */
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
  `;static properties={characterId:{type:String},idleSprite:{type:Object},isLocked:{type:Boolean},isSelected:{type:Boolean},fontRenderer:{type:Object}};constructor(){super(),this.animationFrameId=null,this.animState={frame:0,timer:0,lastTime:0}}connectedCallback(){super.connectedCallback(),this.animationFrameId=requestAnimationFrame(this._animatePreview)}disconnectedCallback(){super.disconnectedCallback(),this.animationFrameId&&cancelAnimationFrame(this.animationFrameId)}_animatePreview=e=>{const t=this.shadowRoot.querySelector(".char-canvas");if(!t||!this.idleSprite){this.animationFrameId=requestAnimationFrame(this._animatePreview);return}this.animState.lastTime===0&&(this.animState.lastTime=e);const s=(e-this.animState.lastTime)/1e3;this.animState.lastTime=e,this.animState.timer+=s;const i=.08,n=11,a=this.idleSprite.width/n;if(this.animState.timer>=i){this.animState.timer=0,this.animState.frame=(this.animState.frame+1)%n;const r=t.getContext("2d");r.clearRect(0,0,t.width,t.height),r.drawImage(this.idleSprite,this.animState.frame*a,0,a,this.idleSprite.height,0,0,t.width,t.height)}this.animationFrameId=requestAnimationFrame(this._animatePreview)};_handleSelect(){this.isLocked||this.isSelected||this.dispatchEvent(new CustomEvent("character-selected",{detail:{characterId:this.characterId},bubbles:!0,composed:!0}))}render(){const e=Z[this.characterId],t=`character-card ${this.isLocked?"locked":""} ${this.isSelected?"selected":""}`,s=this.isLocked?"Locked":this.isSelected?"Selected":"Select";return m`
      <div class=${t}>
        <canvas class="char-canvas" width="64" height="64"></canvas>
        <div class="char-name-container">
            <bitmap-text .fontRenderer=${this.fontRenderer} .text=${e.name} scale="2"></bitmap-text>
        </div>
        <div class="char-unlock-container">
          ${this.isLocked?m`
                <bitmap-text .fontRenderer=${this.fontRenderer} text="Complete ${e.unlockRequirement} levels" scale="1.5" color="#ccc"></bitmap-text>
                <bitmap-text .fontRenderer=${this.fontRenderer} text="to unlock" scale="1.5" color="#ccc"></bitmap-text>
              `:m`<bitmap-text .fontRenderer=${this.fontRenderer} text="Available" scale="1.5" color="#ccc"></bitmap-text>`}
        </div>
        <button class="select-button" @click=${this._handleSelect} ?disabled=${this.isLocked||this.isSelected}>
          <bitmap-text .fontRenderer=${this.fontRenderer} .text=${s} scale="1.8"></bitmap-text>
        </button>
      </div>
    `}}customElements.define("character-card",Zt);class Jt extends w{static styles=L`
    .modal-overlay {
      position: fixed; inset: 0;
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
  `;static properties={gameState:{type:Object},assets:{type:Object},fontRenderer:{type:Object}};_dispatchClose(){c.publish("playSound",{key:"button_click",volume:.8,channel:"UI"}),this.dispatchEvent(new CustomEvent("close-modal",{bubbles:!0,composed:!0}))}render(){if(!this.gameState||!this.assets)return m`<div class="modal-overlay">Loading...</div>`;const e=Object.keys(Z);return m`
        <div class="modal-overlay" @click=${this._dispatchClose}>
            <div class="modal-content" @click=${t=>t.stopPropagation()}>
                <button class="close-button" @click=${this._dispatchClose}></button>
                <div class="title-container">
                    <bitmap-text .fontRenderer=${this.fontRenderer} text="Character Selection" scale="3" outlineColor="black" outlineWidth="2"></bitmap-text>
                </div>
                <div class="subtitle-container">
                    <bitmap-text .fontRenderer=${this.fontRenderer} text="Choose Your Hero!" scale="2"></bitmap-text>
                </div>
                <div id="character-selection-container">
                    ${K(e,t=>m`
                        <character-card
                            .characterId=${t}
                            .idleSprite=${this.assets.characters[t]?.playerIdle}
                            .isLocked=${!this.gameState.isCharacterUnlocked(t)}
                            .isSelected=${this.gameState.selectedCharacter===t}
                            .fontRenderer=${this.fontRenderer}
                        ></character-card>
                    `)}
                </div>
            </div>
        </div>
    `}}customElements.define("character-menu",Jt);class Qt extends w{static styles=L`
    :host {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    }
    .modal-overlay {
      position: fixed; inset: 0;
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
  `;static properties={keybinds:{type:Object},fontRenderer:{type:Object}};_dispatchClose(){c.publish("playSound",{key:"button_click",volume:.8,channel:"UI"}),this.dispatchEvent(new CustomEvent("close-modal",{bubbles:!0,composed:!0}))}render(){return this.keybinds?m`
      <div class="modal-overlay" @click=${this._dispatchClose}>
        <div class="modal-content" @click=${e=>e.stopPropagation()}>
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
              <p><strong>Note:</strong> You cannot cling to natural surfaces like dirt, sand, mud, or ice.</p>
              <div class="keybind-list">
                
                <div class="keybind-item">
                  <label>Move Left / Right:</label>
                  <div class="key-display-container">
                    <div class="key-display">
                        <bitmap-text .fontRenderer=${this.fontRenderer} text=${q(this.keybinds.moveLeft)} scale="1.5"></bitmap-text>
                    </div>
                    <span>/</span>
                    <div class="key-display">
                        <bitmap-text .fontRenderer=${this.fontRenderer} text=${q(this.keybinds.moveRight)} scale="1.5"></bitmap-text>
                    </div>
                  </div>
                </div>

                <div class="keybind-item">
                  <label>Jump / Double Jump / Wall Jump:</label>
                  <div class="key-display">
                    <bitmap-text .fontRenderer=${this.fontRenderer} text=${q(this.keybinds.jump)} scale="1.5"></bitmap-text>
                  </div>
                </div>

                <div class="keybind-item">
                  <label>Dash:</label>
                  <div class="key-display">
                    <bitmap-text .fontRenderer=${this.fontRenderer} text=${q(this.keybinds.dash)} scale="1.5"></bitmap-text>
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
    `:m``}}customElements.define("info-modal",Qt);class es extends w{static styles=L`
    .modal-overlay {
      position: fixed; inset: 0;
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
  `;static properties={stats:{type:Object},hasNextLevel:{type:Boolean},hasPreviousLevel:{type:Boolean},fontRenderer:{type:Object}};_dispatch(e){this.dispatchEvent(new CustomEvent(e))}render(){return this.stats?m`
      <div class="modal-overlay">
        <div class="modal-content">
          <div class="title-container">
            <bitmap-text .fontRenderer=${this.fontRenderer} text="Level Complete!" scale="3" outlineColor="black" outlineWidth="2"></bitmap-text>
          </div>
          <div class="stats-container">
            <bitmap-text .fontRenderer=${this.fontRenderer} text="Deaths: ${this.stats.deaths}" scale="1.8"></bitmap-text>
            <bitmap-text .fontRenderer=${this.fontRenderer} text="Time: ${Ae(this.stats.time)}" scale="1.8"></bitmap-text>
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
    `:m``}}customElements.define("level-complete-modal",es);class ts extends w{static styles=L`
    :host {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    }
    .modal-overlay {
      position: fixed; inset: 0;
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
  `;static properties={gameState:{type:Object},fontRenderer:{type:Object}};_dispatchClose(){c.publish("playSound",{key:"button_click",volume:.8,channel:"UI"}),this.dispatchEvent(new CustomEvent("close-modal",{bubbles:!0,composed:!0}))}_getStatDisplay(e,t=null){return e==null?"-":t?t(e):e.toString()}render(){if(!this.gameState||!this.gameState.levelStats)return m``;const{levelStats:e}=this.gameState;return m`
      <div class="modal-overlay" @click=${this._dispatchClose}>
        <div class="modal-content" @click=${t=>t.stopPropagation()}>
          <button class="close-button" @click=${this._dispatchClose}></button>
          <div class="title-container">
            <bitmap-text .fontRenderer=${this.fontRenderer} text="Level Statistics" scale="3" outlineColor="black" outlineWidth="2"></bitmap-text>
          </div>
          <div class="stats-list-container">
            ${K(E,(t,s)=>m`
              <div class="level-section-stats">
                <div class="section-title-container">
                  <bitmap-text .fontRenderer=${this.fontRenderer} text=${t.name} scale="2"></bitmap-text>
                </div>
                <div class="stats-grid">
                    <div class="stat-row stat-header">
                        <div class="stat-cell level-name">Level</div>
                        <div class="stat-cell">Fastest Time</div>
                        <div class="stat-cell">Lowest Deaths</div>
                        <div class="stat-cell">Attempts</div>
                    </div>

                  ${K(t.levels,(i,n)=>{const a=`${s}-${n}`,r=e[a]||{fastestTime:null,lowestDeaths:null,totalAttempts:0};return m`
                        <div class="stat-row">
                            <div class="stat-cell level-name">Level ${n+1}</div>
                            <div class="stat-cell">${this._getStatDisplay(r.fastestTime,Ae)}</div>
                            <div class="stat-cell">${this._getStatDisplay(r.lowestDeaths)}</div>
                            <div class="stat-cell">${this._getStatDisplay(r.totalAttempts)}</div>
                        </div>
                    `})}
                </div>
              </div>
            `)}
          </div>
        </div>
      </div>
    `}}customElements.define("stats-modal",ts);class ss extends w{static styles=L`
    .main-menu-overlay {
      position: fixed; inset: 0;
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
  `;static properties={activeModal:{type:String,state:!0},gameHasStarted:{type:Boolean,state:!0},keybinds:{type:Object,state:!0},soundSettings:{type:Object,state:!0},currentStats:{type:Object,state:!0},gameState:{type:Object,state:!0},assets:{type:Object,state:!0},fontRenderer:{type:Object},levelCompleteStats:{type:Object,state:!0}};constructor(){super(),this.activeModal="main-menu",this.gameHasStarted=!1,this.keybinds={moveLeft:"a",moveRight:"d",jump:"w",dash:" "},this.soundSettings={soundEnabled:!0,soundVolume:.5},this.currentStats={},this.gameState=null,this.assets=null,this.fontRenderer=null,this.levelCompleteStats=null}connectedCallback(){super.connectedCallback(),c.subscribe("requestStartGame",this._handleStartGame),c.subscribe("soundSettingsChanged",this._handleSoundUpdate),c.subscribe("keybindsUpdated",this._handleKeybindsUpdate),c.subscribe("ui_button_clicked",this._handleUIButtonClick),c.subscribe("statsUpdated",this._handleStatsUpdate),c.subscribe("action_escape_pressed",this._handleEscapePress),c.subscribe("levelLoaded",this._handleLevelLoad),c.subscribe("gameStateUpdated",e=>this.gameState=e),c.subscribe("assetsLoaded",e=>this.assets=e),c.subscribe("levelComplete",e=>this.levelCompleteStats=e)}disconnectedCallback(){super.disconnectedCallback(),c.unsubscribe("requestStartGame",this._handleStartGame),c.unsubscribe("soundSettingsChanged",this._handleSoundUpdate),c.unsubscribe("keybindsUpdated",this._handleKeybindsUpdate),c.unsubscribe("ui_button_clicked",this._handleUIButtonClick),c.unsubscribe("statsUpdated",this._handleStatsUpdate),c.unsubscribe("action_escape_pressed",this._handleEscapePress),c.unsubscribe("levelLoaded",this._handleLevelLoad),c.unsubscribe("gameStateUpdated",e=>this.gameState=e),c.unsubscribe("assetsLoaded",e=>this.assets=e),c.unsubscribe("levelComplete",e=>this.levelCompleteStats=e)}_handleLevelLoad=({gameState:e})=>{this.gameState=e,this.levelCompleteStats=null,this.gameHasStarted||(this.gameHasStarted=!0),this.activeModal=null};_handleStartGame=()=>{this.gameHasStarted=!0,this.activeModal=null,c.publish("allMenusClosed")};_handleSoundUpdate=e=>{this.soundSettings={...e}};_handleKeybindsUpdate=e=>{this.keybinds={...e}};_handleStatsUpdate=e=>{this.currentStats={...e}};_handleUIButtonClick=({buttonId:e})=>{e==="pause"?this.activeModal?this._closeModal():this.gameHasStarted&&(this.activeModal="pause",c.publish("menuOpened")):e==="stats"?(this.activeModal="stats",c.publish("menuOpened")):(this.activeModal=e,c.publish("menuOpened"))};_handleEscapePress=()=>{this.levelCompleteStats||(this.activeModal?this._closeModal():this.gameHasStarted&&(this.activeModal="pause",c.publish("menuOpened")))};_handleKeybindChange=e=>{const{action:t,newKey:s}=e.detail,i={...this.keybinds,[t]:s};c.publish("keybindsUpdated",i)};_closeModal=()=>{const e=this.activeModal!==null;this.activeModal=this.gameHasStarted?null:"main-menu",e&&this.gameHasStarted&&c.publish("allMenusClosed")};_openModalFromMenu(e){c.publish("playSound",{key:"button_click",volume:.8,channel:"UI"}),this.activeModal=e}_handleRestart(){this._closeModal(),c.publish("requestLevelRestart")}_handleOpenLevelsMenu(){this.activeModal="levels"}_handleLevelSelected(e){const{sectionIndex:t,levelIndex:s}=e.detail;c.publish("requestLevelLoad",{sectionIndex:t,levelIndex:s})}_handleCharacterSelected(e){const{characterId:t}=e.detail,s=this.gameState.setSelectedCharacter(t);s!==this.gameState&&(this.gameState=s,c.publish("gameStateUpdated",this.gameState)),c.publish("playSound",{key:"button_click",volume:.8,channel:"UI"}),c.publish("characterUpdated",t)}_handleLevelAction(e){this.levelCompleteStats=null,e==="restart"?c.publish("requestLevelRestart"):e==="next"?c.publish("requestNextLevel"):e==="previous"&&c.publish("requestPreviousLevel")}render(){return this.levelCompleteStats?m`
        <level-complete-modal
          .stats=${this.levelCompleteStats}
          .hasNextLevel=${this.levelCompleteStats.hasNextLevel}
          .hasPreviousLevel=${this.levelCompleteStats.hasPreviousLevel}
          .fontRenderer=${this.fontRenderer}
          @next-level=${()=>this._handleLevelAction("next")}
          @restart-level=${()=>this._handleLevelAction("restart")}
          @previous-level=${()=>this._handleLevelAction("previous")}
        ></level-complete-modal>
      `:this.gameHasStarted?this.renderActiveModal():m`
        <div class="main-menu-overlay">
          ${this.activeModal==="main-menu"?this.renderMainMenuContent():this.renderActiveModal()}
        </div>
      `}renderMainMenuContent(){const e=[{text:"Start Game",action:()=>c.publish("requestStartGame")},{text:"Levels",action:()=>this._openModalFromMenu("levels")},{text:"Character",action:()=>this._openModalFromMenu("character")},{text:"Settings",action:()=>this._openModalFromMenu("settings")},{text:"Stats",action:()=>this._openModalFromMenu("stats")}];return m`
      <div class="main-menu-container">
        <bitmap-text
          .fontRenderer=${this.fontRenderer} text="Parkour Hero" scale="9" outlineColor="black" outlineWidth="2"
        ></bitmap-text>
        <div class="main-menu-buttons">
          ${e.map(t=>m`
            <button @click=${t.action}>
              <bitmap-text .fontRenderer=${this.fontRenderer} text=${t.text} scale="2.5" outlineColor="#004a99" outlineWidth="1"></bitmap-text>
            </button>
          `)}
        </div>
      </div>
    `}renderActiveModal(){switch(this.activeModal){case"settings":return m`<settings-menu 
                      .keybinds=${this.keybinds} .soundSettings=${this.soundSettings} .fontRenderer=${this.fontRenderer}
                      @close-modal=${this._closeModal} @keybind-changed=${this._handleKeybindChange}
                    ></settings-menu>`;case"pause":return m`<pause-modal
                      .stats=${this.currentStats} .fontRenderer=${this.fontRenderer}
                      @resume-game=${this._closeModal} @restart-level=${this._handleRestart} @open-levels-menu=${this._handleOpenLevelsMenu}
                    ></pause-modal>`;case"levels":return m`<levels-menu
                      .gameState=${this.gameState} .fontRenderer=${this.fontRenderer}
                      @close-modal=${this._closeModal} @level-selected=${this._handleLevelSelected}
                    ></levels-menu>`;case"character":return m`<character-menu
                      .gameState=${this.gameState} .assets=${this.assets} .fontRenderer=${this.fontRenderer}
                      @close-modal=${this._closeModal} @character-selected=${this._handleCharacterSelected}
                    ></character-menu>`;case"info":return m`<info-modal
                      .keybinds=${this.keybinds}
                      .fontRenderer=${this.fontRenderer}
                      @close-modal=${this._closeModal}
                    ></info-modal>`;case"stats":return m`<stats-modal
                      .gameState=${this.gameState}
                      .fontRenderer=${this.fontRenderer}
                      @close-modal=${this._closeModal}
                    ></stats-modal>`;default:return m``}}}customElements.define("parkour-hero-ui",ss);const Be=document.getElementById("ui-root");Be?qe(document.createElement("parkour-hero-ui"),Be):console.error("UI Root element #ui-root not found. UI cannot be initialized.");const v=document.getElementById("gameCanvas"),g=v.getContext("2d");if(!v||!g)throw console.error("Canvas not found or context not available"),document.body.innerHTML="<h1>Error: Canvas not supported</h1>",new Error("Canvas not available");g.imageSmoothingEnabled=!1;const Ze=1920,Je=1080;v.width=Ze;v.height=Je;console.log(`Canvas initialized: ${Ze}x${Je}`);function Qe(){try{const o=1.7777777777777777,e=window.innerWidth/window.innerHeight;let t,s;e>o?(s=window.innerHeight,t=s*o):(t=window.innerWidth,s=t/o);const i=Math.floor(t),n=Math.floor(s);v.style.width=`${i}px`,v.style.height=`${n}px`,v.style.position="absolute",v.style.left=`${(window.innerWidth-i)/2}px`,v.style.top=`${(window.innerHeight-n)/2}px`,console.log(`Canvas resized to: ${i}x${n} (display size)`)}catch(o){console.error("Error resizing canvas:",o)}}window.addEventListener("resize",Qe);Qe();function is(){g.fillStyle="#222",g.fillRect(0,0,v.width,v.height),g.fillStyle="white",g.font="24px sans-serif",g.textAlign="center",g.fillText("Loading Assets...",v.width/2,v.height/2);const o=300,e=20,t=(v.width-o)/2,s=v.height/2+30;g.strokeStyle="white",g.lineWidth=2,g.strokeRect(t,s,o,e),g.fillStyle="#4CAF50",g.fillRect(t,s,o*.1,e)}is();let ns={moveLeft:"a",moveRight:"d",jump:"w",dash:" "},k,as;_t().then(o=>{console.log("Assets loaded successfully, preparing main menu...");try{const e=new Ct(o.font_spritesheet);k=new vt(g,v,o,ns,e),c.publish("assetsLoaded",o);const t=document.querySelector("parkour-hero-ui");t&&(t.fontRenderer=e),as=new wt,c.subscribe("requestStartGame",()=>{k.start()}),window.unlockAllLevels=()=>{k&&k.gameState&&(k.gameState.unlockAllLevels(),c.publish("gameStateUpdated",k.gameState))},console.log("Developer command available: Type `unlockAllLevels()` in the console to unlock all levels."),window.resetProgress=()=>{k&&k.gameState&&(k.gameState.resetProgress(),k.loadLevel(0,0),console.log("Game reset to Level 1."),c.publish("gameStateUpdated",k.gameState))},console.log("Developer command available: Type `resetProgress()` in the console to reset all saved data."),console.log("Game is ready. Waiting for user to start from the main menu.")}catch(e){console.error("Failed to start game engine:",e),g.fillStyle="#222",g.fillRect(0,0,v.width,v.height),g.fillStyle="red",g.font="24px sans-serif",g.textAlign="center",g.fillText("Game Failed to Start",v.width/2,v.height/2-20),g.fillStyle="white",g.font="16px sans-serif",g.fillText("Check console for details",v.width/2,v.height/2+20)}}).catch(o=>{console.error("Asset loading failed:",o),g.fillStyle="#222",g.fillRect(0,0,v.width,v.height),g.fillStyle="red",g.font="24px sans-serif",g.textAlign="center",g.fillText("Failed to Load Assets",v.width/2,v.height/2-20),g.fillStyle="white",g.font="16px sans-serif",g.fillText("Check console for details",v.width/2,v.height/2+20)});window.addEventListener("error",o=>{console.error("Global error:",o.error)});window.addEventListener("unhandledrejection",o=>{console.error("Unhandled promise rejection:",o.reason)});console.log("Game initialization started");console.log("Canvas dimensions:",v.width,"x",v.height);console.log("Device pixel ratio:",window.devicePixelRatio);console.log("User agent:",navigator.userAgent);
