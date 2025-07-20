(function(){const e=document.createElement("link").relList;if(e&&e.supports&&e.supports("modulepreload"))return;for(const i of document.querySelectorAll('link[rel="modulepreload"]'))s(i);new MutationObserver(i=>{for(const n of i)if(n.type==="childList")for(const o of n.addedNodes)o.tagName==="LINK"&&o.rel==="modulepreload"&&s(o)}).observe(document,{childList:!0,subtree:!0});function t(i){const n={};return i.integrity&&(n.integrity=i.integrity),i.referrerPolicy&&(n.referrerPolicy=i.referrerPolicy),i.crossOrigin==="use-credentials"?n.credentials="include":i.crossOrigin==="anonymous"?n.credentials="omit":n.credentials="same-origin",n}function s(i){if(i.ep)return;i.ep=!0;const n=t(i);fetch(i.href,n)}})();class C{constructor(e=0,t=0){this.x=e,this.y=t}}class E{constructor({type:e="dynamic",solid:t=!1,hazard:s=!1,width:i,height:n,isGrounded:o=!1,isAgainstWall:l=!1,groundType:r=null}){this.type=e,this.solid=t,this.hazard=s,this.width=i,this.height=n,this.isGrounded=o,this.isAgainstWall=l,this.groundType=r}}class Ve{constructor(e,t){this.zoom=1.8,this.viewportWidth=e,this.viewportHeight=t,this.width=this.viewportWidth/this.zoom,this.height=this.viewportHeight/this.zoom,this.levelWidth=this.width,this.levelHeight=this.height,this.followSpeed=5,this.deadZone={x:this.width*.3,y:this.height*.3},this.minX=0,this.maxX=0,this.minY=0,this.maxY=0,this.shakeTimer=0,this.shakeIntensity=0,this.shakeInitialIntensity=0,this.shakeDuration=0,this.shakeX=0,this.shakeY=0,this.targetX=0,this.targetY=0,console.log("Camera initialized:",{viewport:`${this.viewportWidth}x${this.viewportHeight}`,zoom:this.zoom,worldView:`${this.width}x${this.height}`})}update(e,t,s){if(t===null)return;const i=e.getComponent(t,C),n=e.getComponent(t,E);if(!i||!n)return;const o=this.x+this.width/2,l=this.y+this.height/2,r=i.x+n.width/2,h=i.y+n.height/2,d=r-o,u=h-l;let p=0,b=0;Math.abs(d)>this.deadZone.x&&(p=d>0?d-this.deadZone.x:d+this.deadZone.x),Math.abs(u)>this.deadZone.y&&(b=u>0?u-this.deadZone.y:u+this.deadZone.y),this.targetX=this.x+p,this.targetY=this.y+b,this.x+=(this.targetX-this.x)*this.followSpeed*s,this.y+=(this.targetY-this.y)*this.followSpeed*s,this.x=Math.max(this.minX,Math.min(this.maxX,this.x)),this.y=Math.max(this.minY,Math.min(this.maxY,this.y)),this.updateShake(s)}updateShake(e){if(this.shakeTimer>0){this.shakeTimer-=e,this.shakeX=(Math.random()-.5)*this.shakeIntensity,this.shakeY=(Math.random()-.5)*this.shakeIntensity;const t=this.shakeInitialIntensity/this.shakeDuration;this.shakeIntensity=Math.max(0,this.shakeIntensity-t*e),this.shakeTimer<=0&&(this.shakeX=0,this.shakeY=0,this.shakeIntensity=0)}}shake(e=10,t=.3){this.shakeTimer=t,this.shakeDuration=t,this.shakeIntensity=e,this.shakeInitialIntensity=e}apply(e){e.save(),e.scale(this.zoom,this.zoom),e.translate(-Math.round(this.x+this.shakeX),-Math.round(this.y+this.shakeY))}restore(e){e.restore()}snapToPlayer(e,t){if(t===null)return;const s=e.getComponent(t,C),i=e.getComponent(t,E);!s||!i||this.centerOn(s.x+i.width/2,s.y+i.height/2)}centerOn(e,t){this.x=e-this.width/2,this.y=t-this.height/2,this.x=Math.max(this.minX,Math.min(this.maxX,this.x)),this.y=Math.max(this.minY,Math.min(this.maxY,this.y)),this.targetX=this.x,this.targetY=this.y}updateLevelBounds(e,t){this.levelWidth=e,this.levelHeight=t,this.maxX=Math.max(0,this.levelWidth-this.width),this.maxY=Math.max(0,this.levelHeight-this.height),this.x=Math.max(this.minX,Math.min(this.maxX,this.x)),this.y=Math.max(this.minY,Math.min(this.maxY,this.y))}isVisible(e,t,s=0,i=0){return e+s>this.x&&e<this.x+this.width&&t+i>this.y&&t<this.y+this.height}isRectVisible(e){return this.isVisible(e.x,e.y,e.width,e.height)}setFollowSpeed(e){this.followSpeed=Math.max(.1,e)}setDeadZone(e,t){this.deadZone.x=this.width*Math.max(0,Math.min(.5,e)),this.deadZone.y=this.height*Math.max(0,Math.min(.5,t))}}class Xe{constructor(){this.events={}}subscribe(e,t){this.events[e]||(this.events[e]=new Set),this.events[e].add(t)}unsubscribe(e,t){this.events[e]&&this.events[e].delete(t)}publish(e,t){this.events[e]&&this.events[e].forEach(s=>{try{s(t)}catch(i){console.error(`Error in event bus callback for event: ${e}`,i)}})}}const c=new Xe;class Ye{constructor(){this.sounds={},this.soundPool={},this.poolSize=5,this.channels={SFX:new Set,UI:new Set,Music:new Set},this.audioContext=null,this.audioUnlocked=!1,this.settings={enabled:!0,volume:.5},this.loadSettings(),this._setupEventSubscriptions()}_setupEventSubscriptions(){c.subscribe("playSound",e=>this.play(e)),c.subscribe("startSoundLoop",e=>this.playLoop(e)),c.subscribe("stopSoundLoop",({key:e})=>this.stopLoop(e)),c.subscribe("toggleSound",()=>this.toggleSound()),c.subscribe("setSoundVolume",({volume:e})=>this.setVolume(e))}loadSettings(){this.settings.enabled=!0,this.settings.volume=.5}saveSettings(){}loadSounds(e){["button_click","jump","double_jump","collect","level_complete","death_sound","dash","checkpoint_activated","sand_walk","mud_run","ice_run","trampoline_bounce"].forEach(s=>{if(e[s]){this.sounds[s]=e[s],this.soundPool[s]=[];for(let i=0;i<this.poolSize;i++)this.soundPool[s].push(this.sounds[s].cloneNode(!0))}else console.warn(`Sound asset ${s} not found in assets`)})}async play({key:e,volumeMultiplier:t=1,channel:s="SFX"}){if(!this.settings.enabled||!this.sounds[e]||!this.channels[s])return;this.audioUnlocked||await this.unlockAudio();const i=this.soundPool[e];if(!i){console.warn(`Sound pool for ${e} not found.`);return}const n=i.find(o=>o.paused||o.ended);if(n){n.volume=Math.max(0,Math.min(1,this.settings.volume*t)),n.currentTime=0,this.channels[s].add(n),n.onended=()=>{this.channels[s].delete(n),n.onended=null};try{await n.play()}catch(o){o.name!=="AbortError"&&console.error(`Audio pool play failed for ${e}:`,o),this.channels[s].delete(n)}}else console.warn(`Sound pool for ${e} was depleted. No sound played.`)}async playLoop({key:e,volumeMultiplier:t=1,channel:s="SFX"}){if(!(!this.settings.enabled||!this.sounds[e]||!this.channels[s])&&!Array.from(this.channels[s]).some(i=>i.src===this.sounds[e].src)){this.audioUnlocked||await this.unlockAudio();try{const i=this.sounds[e].cloneNode(!0);i.volume=Math.max(0,Math.min(1,this.settings.volume*t)),i.loop=!0,await i.play(),this.channels[s].add(i)}catch(i){console.error(`Failed to play looping sound ${e}:`,i)}}}stopLoop(e){const t=this.sounds[e]?.src;if(t)for(const s in this.channels)this.channels[s].forEach(i=>{i.src===t&&i.loop&&(i.pause(),i.currentTime=0,this.channels[s].delete(i))})}stopAll({except:e=[]}={}){for(const t in this.channels)e.includes(t)||(this.channels[t].forEach(s=>{s.pause(),s.currentTime=0}),this.channels[t].clear())}async unlockAudio(){if(!this.audioUnlocked){if(!this.audioContext)try{const e=window.AudioContext||window.webkitAudioContext;e&&(this.audioContext=new e)}catch(e){console.error("Failed to create AudioContext",e);return}this.audioContext.state==="suspended"&&await this.audioContext.resume().catch(e=>console.error("Failed to resume AudioContext",e)),this.audioContext.state==="running"&&(this.audioUnlocked=!0)}}setVolume(e){this.settings.volume=Math.max(0,Math.min(1,e));for(const t in this.channels)this.channels[t].forEach(s=>{s.volume=this.settings.volume});this.saveSettings(),c.publish("soundSettingsChanged",{soundEnabled:this.settings.enabled,soundVolume:this.settings.volume})}setEnabled(e){this.settings.enabled=e,this.settings.enabled||this.stopAll(),this.saveSettings(),c.publish("soundSettingsChanged",{soundEnabled:this.settings.enabled,soundVolume:this.settings.volume})}toggleSound(){return this.setEnabled(!this.settings.enabled),this.settings.enabled}getSettings(){return{soundEnabled:this.settings.enabled,soundVolume:this.settings.volume,audioUnlocked:this.audioUnlocked}}}class qe{constructor(e,t){this.canvas=e,this.fontRenderer=t,this.isVisible=!0,this.stats={levelName:"Loading...",collectedFruits:0,totalFruits:0,deathCount:0,soundEnabled:!0,soundVolume:.5},c.subscribe("statsUpdated",s=>this.updateStats(s))}setVisible(e){this.isVisible=e}updateStats(e){this.stats={...this.stats,...e}}drawGameHUD(e){if(!(!this.isVisible||!this.fontRenderer))try{e.save(),e.setTransform(1,0,0,1,0,0);const{levelName:t,collectedFruits:s,totalFruits:i,deathCount:n,soundEnabled:o,soundVolume:l}=this.stats,r=[`${t}`,`Fruits: ${s}/${i}`,`Deaths: ${n||0}`,`Sound: ${o?"On":"Off"} (${Math.round(l*100)}%)`],h={scale:2.5,align:"center",color:"white",outlineColor:"black",outlineWidth:1};let d=0;r.forEach(B=>{const O=this.fontRenderer.getTextWidth(B,h.scale);O>d&&(d=O)});const u=40,p=10,b=10,S=d+u,N=180;e.fillStyle="rgba(0, 0, 0, 0.5)",e.beginPath(),e.roundRect(p,b,S,N,10),e.fill();const re=35,le=b+25,ce=p+S/2;r.forEach((B,O)=>{const Ke=le+O*re;this.fontRenderer.drawText(e,B,ce,Ke,h)}),e.restore()}catch(t){console.warn("Error drawing HUD:",t)}}}const K={PinkMan:{name:"Pink Man",unlockRequirement:0},NinjaFrog:{name:"Ninja Frog",unlockRequirement:10},MaskDude:{name:"Mask Dude",unlockRequirement:20},VirtualGuy:{name:"Virtual Guy",unlockRequirement:30}},T=[{name:"Mechanical Mastery",levels:[{name:"Level 1",jsonPath:"/levels/basic-mechanics/01.json"},{name:"Level 2",jsonPath:"/levels/basic-mechanics/02.json"},{name:"Level 3",jsonPath:"/levels/basic-mechanics/03.json"},{name:"Level 4",jsonPath:"/levels/basic-mechanics/04.json"},{name:"Level 5",jsonPath:"/levels/basic-mechanics/05.json"},{name:"Level 6",jsonPath:"/levels/basic-mechanics/06.json"},{name:"Level 7",jsonPath:"/levels/basic-mechanics/07.json"},{name:"Level 8",jsonPath:"/levels/basic-mechanics/08.json"},{name:"Level 9",jsonPath:"/levels/basic-mechanics/09.json"},{name:"Level 10",jsonPath:"/levels/basic-mechanics/10.json"}]},{name:"Sky High",levels:[{name:"Level 1",jsonPath:"/levels/sky-high/01.json"},{name:"Level 2",jsonPath:"/levels/sky-high/02.json"},{name:"Level 3",jsonPath:"/levels/sky-high/03.json"},{name:"Level 4",jsonPath:"/levels/sky-high/04.json"},{name:"Level 5",jsonPath:"/levels/sky-high/05.json"},{name:"Level 6",jsonPath:"/levels/sky-high/06.json"},{name:"Level 7",jsonPath:"/levels/sky-high/07.json"},{name:"Level 8",jsonPath:"/levels/sky-high/08.json"},{name:"Level 9",jsonPath:"/levels/sky-high/09.json"},{name:"Level 10",jsonPath:"/levels/sky-high/10.json"}]}];function ve(a,e,t){let s=0;for(let i=0;i<a;i++)s+=t[i].levels.length;return s+=e,s}class se{constructor(e=null){if(e)this.currentSection=e.currentSection,this.currentLevelIndex=e.currentLevelIndex,this.showingLevelComplete=e.showingLevelComplete,this.levelProgress=e.levelProgress,this.selectedCharacter=e.selectedCharacter;else{this.currentSection=0,this.currentLevelIndex=0,this.showingLevelComplete=!1;const t=this.loadProgress();this.levelProgress=t.levelProgress,this.selectedCharacter=t.selectedCharacter}}_clone(){return new se(this)}_getDefaultState(){return{levelProgress:{unlockedLevels:[1],completedLevels:[]},selectedCharacter:"PinkMan"}}loadProgress(){try{const e=localStorage.getItem("parkourGameState");if(!e)return this._getDefaultState();const t=JSON.parse(e);if(typeof t!="object"||t===null)return this._getDefaultState();const s=t.levelProgress;return typeof s!="object"||s===null||!Array.isArray(s.unlockedLevels)||!Array.isArray(s.completedLevels)?this._getDefaultState():((typeof t.selectedCharacter!="string"||!K[t.selectedCharacter])&&(t.selectedCharacter="PinkMan"),t)}catch(e){return console.error("Failed to parse game state from localStorage. Resetting to default.",e),this._getDefaultState()}}saveProgress(){try{const e={levelProgress:this.levelProgress,selectedCharacter:this.selectedCharacter};localStorage.setItem("parkourGameState",JSON.stringify(e)),console.log("Progress saved:",e)}catch(e){console.error("Failed to save game state to localStorage",e)}}setSelectedCharacter(e){if(K[e]&&this.selectedCharacter!==e){const t=this._clone();return t.selectedCharacter=e,t.saveProgress(),t}return this}onLevelComplete(){const e=this._clone(),t=`${this.currentSection}-${this.currentLevelIndex}`;if(!this.levelProgress.completedLevels.includes(t)){e.levelProgress.completedLevels.push(t);const s=T.reduce((n,o)=>n+o.levels.length,0),i=ve(this.currentSection,this.currentLevelIndex,T);if(i+1<s){const n=i+2;n>this.levelProgress.unlockedLevels[0]&&(e.levelProgress.unlockedLevels[0]=n)}}return e.showingLevelComplete=!0,e.saveProgress(),c.publish("playSound",{key:"level_complete",volume:1,channel:"UI"}),e}isCharacterUnlocked(e){const t=K[e];return t?this.levelProgress.completedLevels.length>=t.unlockRequirement:!1}isLevelUnlocked(e,t){return ve(e,t,T)<this.levelProgress.unlockedLevels[0]}isLevelCompleted(e,t){const s=`${e}-${t}`;return this.levelProgress.completedLevels.includes(s)}resetProgress(){try{localStorage.removeItem("parkourGameState");const e=this._getDefaultState();this.levelProgress=e.levelProgress,this.selectedCharacter=e.selectedCharacter,this.currentSection=0,this.currentLevelIndex=0}catch(e){console.error("Failed to reset game state in localStorage",e)}}unlockAllLevels(){const e=T.reduce((t,s)=>t+s.levels.length,0);this.levelProgress.unlockedLevels[0]=e,this.levelProgress.completedLevels=Array.from({length:e},(t,s)=>`temp-${s}`),this.saveProgress()}}const g={WIDTH:32,HEIGHT:32,SPAWN_WIDTH:96,SPAWN_HEIGHT:96,CLING_OFFSET:7,MOVE_SPEED:200,JUMP_FORCE:400,GRAVITY:1200,MAX_FALL_SPEED:500,DASH_SPEED:500,DASH_DURATION:.2,DASH_COOLDOWN:.7,COYOTE_TIME:.1,JUMP_BUFFER_TIME:.15,SAND_MOVE_MULTIPLIER:.5,MUD_JUMP_MULTIPLIER:.6,ICE_ACCELERATION:800,ICE_FRICTION:400,TRAMPOLINE_BOUNCE_MULTIPLIER:2,ANIMATION_SPEED:.06,SPAWN_ANIMATION_SPEED:.08,ANIMATION_FRAMES:{idle:11,run:12,double_jump:6,jump:1,fall:1,dash:1,cling:5,spawn:7,despawn:7}},v={TILE_SIZE:48};class I{constructor(e=0,t=0){this.vx=e,this.vy=t}}class Ze{constructor(){}update(e,{entityManager:t,level:s}){const i=t.query([C,I,E]);for(const n of i){const o=t.getComponent(n,C),l=t.getComponent(n,I),r=t.getComponent(n,E);if(o.y>s.height+50){c.publish("collisionEvent",{type:"world_bottom",entityId:n,entityManager:t});continue}o.x+=l.vx*e,this._handleHorizontalCollisions(o,l,r,s),o.y+=l.vy*e,this._checkTrampolineBounce(o,l,r,s,e)||this._handleVerticalCollisions(o,l,r,s,e),o.x=Math.max(0,Math.min(o.x,s.width-r.width)),this._checkHazardCollisions(o,r,s,n,t),this._checkFruitCollisions(o,r,s,n,t),this._checkTrophyCollision(o,r,s.trophy,n,t),this.checkCheckpointCollisions(o,r,s,n,t)}}_handleHorizontalCollisions(e,t,s,i){if(t.vx===0){s.isAgainstWall=!1;return}const n=Math.floor(e.y/v.TILE_SIZE),o=Math.floor((e.y+s.height-1)/v.TILE_SIZE),l=t.vx>0?e.x+s.width:e.x,r=Math.floor(l/v.TILE_SIZE);for(let h=n;h<=o;h++){const d=i.getTileAt(r*v.TILE_SIZE,h*v.TILE_SIZE);if(d&&d.solid){e.x=t.vx>0?r*v.TILE_SIZE-s.width:(r+1)*v.TILE_SIZE,t.vx=0,s.isAgainstWall=!["dirt","sand","mud","ice"].includes(d.type);return}}s.isAgainstWall=!1}_handleVerticalCollisions(e,t,s,i,n){const o=Math.floor(e.x/v.TILE_SIZE),l=Math.floor((e.x+s.width-1)/v.TILE_SIZE);if(t.vy<0){const d=Math.floor(e.y/v.TILE_SIZE);for(let u=o;u<=l;u++){const p=i.getTileAt(u*v.TILE_SIZE,d*v.TILE_SIZE);if(p&&p.solid){e.y=(d+1)*v.TILE_SIZE,t.vy=0;return}}}const r=e.y+s.height,h=Math.floor(r/v.TILE_SIZE);s.isGrounded=!1;for(let d=o;d<=l;d++){const u=i.getTileAt(d*v.TILE_SIZE,h*v.TILE_SIZE);if(u&&u.solid&&t.vy>=0){const p=h*v.TILE_SIZE,b=e.y+s.height;if(b>=p&&b-t.vy*n<=p+1){e.y=p-s.height,t.vy=0,s.isGrounded=!0,s.groundType=u.interaction||u.type;return}}}}_checkTrampolineBounce(e,t,s,i,n){if(t.vy<=0)return!1;for(const o of i.trampolines){const l=e.y+s.height;if(e.x+s.width>o.x&&e.x<o.x+o.size&&l>=o.y&&l-t.vy*n<=o.y+1)return o.state="jumping",o.frame=0,o.frameTimer=0,e.y=o.y-s.height,t.vy=-400*g.TRAMPOLINE_BOUNCE_MULTIPLIER,c.publish("playSound",{key:"trampoline_bounce",volume:1,channel:"SFX"}),!0}return!1}_isCollidingWith(e,t,s){const i=s.width||s.size,n=s.height||s.size;return e.x<s.x+i&&e.x+t.width>s.x&&e.y<s.y+n&&e.y+t.height>s.y}_checkHazardCollisions(e,t,s,i,n){const o=[{x:e.x,y:e.y},{x:e.x+t.width-1,y:e.y},{x:e.x,y:e.y+t.height-1},{x:e.x+t.width-1,y:e.y+t.height-1}];for(const l of o)if(s.getTileAt(l.x,l.y).hazard){c.publish("collisionEvent",{type:"hazard",entityId:i,entityManager:n});return}}_checkFruitCollisions(e,t,s,i,n){for(const o of s.getActiveFruits())this._isCollidingWith(e,t,o)&&c.publish("collisionEvent",{type:"fruit",entityId:i,target:o,entityManager:n})}_checkTrophyCollision(e,t,s,i,n){!s||s.acquired||s.inactive||this._isCollidingWith(e,t,s)&&c.publish("collisionEvent",{type:"trophy",entityId:i,target:s,entityManager:n})}checkCheckpointCollisions(e,t,s,i,n){for(const o of s.getInactiveCheckpoints())this._isCollidingWith(e,t,o)&&c.publish("collisionEvent",{type:"checkpoint",entityId:i,target:o,entityManager:n})}}class F{constructor({spriteKey:e,width:t,height:s,animationState:i="idle",animationFrame:n=0,animationTimer:o=0,direction:l="right",isVisible:r=!0}){this.spriteKey=e,this.width=t,this.height=s,this.animationState=i,this.animationFrame=n,this.animationTimer=o,this.direction=l,this.isVisible=r}}class pe{constructor(e){this.characterId=e}}class _{constructor({speed:e=g.MOVE_SPEED,jumpForce:t=g.JUMP_FORCE,dashSpeed:s=g.DASH_SPEED,dashDuration:i=g.DASH_DURATION,jumpBufferTimer:n=0,coyoteTimer:o=0,dashTimer:l=0,dashCooldownTimer:r=0,jumpCount:h=0,isDashing:d=!1,isSpawning:u=!0,spawnComplete:p=!1,isDespawning:b=!1,despawnAnimationFinished:S=!1,needsRespawn:N=!1,deathCount:re=0,activeSurfaceSound:le=null,surfaceParticleTimer:ce=0,jumpPressed:B=!1,dashPressed:O=!1}={}){this.speed=e,this.jumpForce=t,this.dashSpeed=s,this.dashDuration=i,this.jumpBufferTimer=n,this.coyoteTimer=o,this.dashTimer=l,this.dashCooldownTimer=r,this.surfaceParticleTimer=ce,this.jumpCount=h,this.isDashing=d,this.isSpawning=u,this.spawnComplete=p,this.isDespawning=b,this.despawnAnimationFinished=S,this.needsRespawn=N,this.jumpPressed=B,this.dashPressed=O,this.deathCount=re,this.activeSurfaceSound=le}}class Je{constructor(e,t,s){this.ctx=e,this.canvas=t,this.assets=s,this.backgroundCache=new Map,this.backgroundOffset={x:0,y:0}}_preRenderBackground(e){const t=e.background;if(this.backgroundCache.has(t))return this.backgroundCache.get(t);const s=this.assets[t];if(!s||!s.complete||s.naturalWidth===0)return null;const i=document.createElement("canvas");i.width=this.canvas.width+s.width,i.height=this.canvas.height+s.height;const n=i.getContext("2d"),o=n.createPattern(s,"repeat");return n.fillStyle=o,n.fillRect(0,0,i.width,i.height),this.backgroundCache.set(t,i),i}drawScrollingBackground(e,t){const s=this._preRenderBackground(e),i=this.assets[e.background];if(!s||!i||!i.complete||i.naturalWidth===0){this.ctx.fillStyle="#87CEEB",this.ctx.fillRect(0,0,this.canvas.width,this.canvas.height);return}this.backgroundOffset.x+=e.backgroundScroll.x*t,this.backgroundOffset.y+=e.backgroundScroll.y*t;const n=(this.backgroundOffset.x%i.width+i.width)%i.width,o=(this.backgroundOffset.y%i.height+i.height)%i.height;this.ctx.drawImage(s,n,o,this.canvas.width,this.canvas.height,0,0,this.canvas.width,this.canvas.height)}renderScene(e,t,s,i){e.apply(this.ctx),this.drawTileGrid(t,e),t.trophy&&this.drawTrophy(t.trophy,e),this.drawFruits(t.getActiveFruits(),e),this.drawCheckpoints(t.checkpoints,e),this.drawTrampolines(t.trampolines,e);const n=s.query([C,F]);for(const o of n){const l=s.getComponent(o,C),r=s.getComponent(o,F),h=s.getComponent(o,pe),d=s.getComponent(o,_);this._drawRenderable(l,r,h,d)}this.drawCollectedFruits(i,e),e.restore(this.ctx)}_drawRenderable(e,t,s,i){const n=t.animationState;if(!t.isVisible||i&&i.despawnAnimationFinished)return;const o={idle:"playerIdle",run:"playerRun",jump:"playerJump",double_jump:"playerDoubleJump",fall:"playerFall",dash:"playerDash",cling:"playerCling",spawn:"playerAppear",despawn:"playerDisappear"};let l;const r=o[n];if(n==="spawn"||n==="despawn"?l=this.assets[r]:s?l=this.assets.characters[s.characterId]?.[r]||this.assets.playerIdle:l=this.assets[t.spriteKey],!l){this.ctx.fillStyle="#FF00FF",this.ctx.fillRect(e.x,e.y,t.width,t.height);return}const h=g.ANIMATION_FRAMES[n]||1,d=l.width/h,u=d*t.animationFrame;this.ctx.save();const p=n==="spawn"||n==="despawn",b=p?e.x-(t.width-g.WIDTH)/2:e.x,S=p?e.y-(t.height-g.HEIGHT)/2:e.y;t.direction==="left"?(this.ctx.scale(-1,1),this.ctx.translate(-b-t.width,S)):this.ctx.translate(b,S);const N=n==="cling"?g.CLING_OFFSET:0;this.ctx.drawImage(l,u,0,d,l.height,N,0,t.width,t.height),this.ctx.restore()}drawTileGrid(e,t){const s=v.TILE_SIZE,i=Math.floor(t.x/s),n=Math.ceil((t.x+t.width)/s),o=Math.floor(t.y/s),l=Math.ceil((t.y+t.height)/s);for(let r=o;r<l;r++)for(let h=i;h<n;h++){if(h<0||h>=e.gridWidth||r<0||r>=e.gridHeight)continue;const d=e.tiles[r][h];if(d.type==="empty")continue;const u=this.assets[d.spriteKey];if(!u){this.ctx.fillStyle="magenta",this.ctx.fillRect(h*s,r*s,s,s);continue}const p=h*s,b=r*s,S=s+1;d.spriteConfig?this.ctx.drawImage(u,d.spriteConfig.srcX,d.spriteConfig.srcY,s,s,p,b,S,S):this.ctx.drawImage(u,p,b,S,S)}}drawTrophy(e,t){if(!t.isVisible(e.x-e.size/2,e.y-e.size/2,e.size,e.size))return;const s=this.assets.trophy;if(!s)return;const i=s.width/e.frameCount,n=i*e.animationFrame;e.inactive&&(this.ctx.globalAlpha=.5),this.ctx.drawImage(s,n,0,i,s.height,e.x-e.size/2,e.y-e.size/2,e.size,e.size),this.ctx.globalAlpha=1}drawFruits(e,t){for(const s of e){if(!t.isRectVisible({x:s.x-s.size/2,y:s.y-s.size/2,width:s.size,height:s.size}))continue;const i=this.assets[s.spriteKey];if(!i)continue;const n=i.width/s.frameCount,o=n*s.frame;this.ctx.drawImage(i,o,0,n,i.height,s.x-s.size/2,s.y-s.size/2,s.size,s.size)}}drawTrampolines(e,t){for(const s of e){if(!t.isRectVisible({x:s.x,y:s.y,width:s.size,height:s.size}))continue;let i,n=0,o;s.state==="jumping"?(i=this.assets.trampoline_jump,i&&(o=i.width/s.frameCount,n=s.frame*o)):(i=this.assets.trampoline_idle,i&&(o=i.width)),i&&o>0?this.ctx.drawImage(i,n,0,o,i.height,s.x-s.size/2,s.y-s.size/2,s.size,s.size):(this.ctx.fillStyle="#8e44ad",this.ctx.fillRect(s.x-s.size/2,s.y-s.size/2,s.size,s.size))}}drawCollectedFruits(e,t){const s=this.assets.fruit_collected;if(!s)return;const i=s.width/6;for(const n of e){if(!t.isRectVisible({x:n.x,y:n.y,width:n.size,height:n.size}))continue;const o=n.frame*i;this.ctx.drawImage(s,o,0,i,s.height,n.x-n.size/2,n.y-n.size/2,n.size,n.size)}}drawCheckpoints(e,t){for(const s of e){if(!t.isRectVisible({x:s.x,y:s.y,width:s.size,height:s.size}))continue;let i,n=0,o;switch(s.state){case"inactive":i=this.assets.checkpoint_inactive,i&&(o=i.width);break;case"activating":i=this.assets.checkpoint_activation,i&&(o=i.width/s.frameCount,n=s.frame*o);break;case"active":if(i=this.assets.checkpoint_active,i){const r=Math.floor(performance.now()/1e3/.1%10);o=i.width/10,n=r*o}break}i&&o>0?this.ctx.drawImage(i,n,0,o,i.height,s.x-s.size/2,s.y-s.size/2,s.size,s.size):(this.ctx.fillStyle="purple",this.ctx.fillRect(s.x-s.size/2,s.y-s.size/2,s.size,s.size))}}}const Q={0:{type:"empty",solid:!1,hazard:!1,description:"Empty space. The player can move freely through it."},1:{type:"dirt",solid:!0,hazard:!1,spriteKey:"block",spriteConfig:{srcX:96,srcY:0},description:"A standard, solid block of dirt. Wall-jumps are not possible on this surface."},2:{type:"stone",solid:!0,hazard:!1,spriteKey:"block",spriteConfig:{srcX:0,srcY:0},description:"A standard, solid block of stone. Players can wall-jump off this surface."},3:{type:"wood",solid:!0,hazard:!1,spriteKey:"block",spriteConfig:{srcX:0,srcY:64},description:"A standard, solid block of wood. Players can wall-jump off this surface."},4:{type:"green_block",solid:!0,hazard:!1,spriteKey:"block",spriteConfig:{srcX:0,srcY:128},description:"A solid, green-colored block. Players can wall-jump off this surface."},5:{type:"orange_dirt",solid:!0,hazard:!1,spriteKey:"block",spriteConfig:{srcX:96,srcY:64},description:"Solid orange dirt. Wall-jumps are not possible on this surface."},6:{type:"pink_dirt",solid:!0,hazard:!1,spriteKey:"block",spriteConfig:{srcX:96,srcY:128},description:"Solid pink dirt. Wall-jumps are not possible on this surface."},7:{type:"sand",solid:!0,hazard:!1,spriteKey:"sand_mud_ice",spriteConfig:{srcX:0,srcY:0},interaction:"sand",description:"A solid block of sand. Slows player movement. Wall-jumps are not possible."},8:{type:"mud",solid:!0,hazard:!1,spriteKey:"sand_mud_ice",spriteConfig:{srcX:64,srcY:0},interaction:"mud",description:"A solid block of mud. Reduces jump height. Wall-jumps are not possible."},9:{type:"ice",solid:!0,hazard:!1,spriteKey:"sand_mud_ice",spriteConfig:{srcX:128,srcY:0},interaction:"ice",description:"A solid block of slippery ice. Reduces friction. Wall-jumps are not possible."},A:{type:"spike_up",solid:!1,hazard:!0,spriteKey:"spike_two",description:"A dangerous spike pointing upwards. Lethal to the touch."},F:{type:"fire",solid:!1,hazard:!0,spriteKey:"fire_on",interaction:"fire_trap",description:"A deadly fire trap. Avoid contact."}};class Qe{constructor(e){this.name=e.name||"Unnamed Level",this.gridWidth=e.gridWidth,this.gridHeight=e.gridHeight,this.width=this.gridWidth*v.TILE_SIZE,this.height=this.gridHeight*v.TILE_SIZE,this.background=e.background||"background_blue",this.backgroundScroll=e.backgroundScroll||{x:0,y:15},this.startPosition={x:e.startPosition.x*v.TILE_SIZE,y:e.startPosition.y*v.TILE_SIZE},this.tiles=e.layout.map(t=>[...t].map(s=>Q[s]||Q[0])),this.fruits=[],this.checkpoints=[],this.trampolines=[],this.trophy=null,(e.objects||[]).forEach(t=>{const s=t.x*v.TILE_SIZE,i=t.y*v.TILE_SIZE;t.type.startsWith("fruit_")?this.fruits.push({x:s,y:i,size:28,spriteKey:t.type,frame:0,frameCount:17,frameSpeed:.07,frameTimer:0,collected:!1,type:"fruit"}):t.type==="checkpoint"?this.checkpoints.push({x:s,y:i,size:64,state:"inactive",frame:0,frameCount:26,frameSpeed:.07,frameTimer:0,type:"checkpoint"}):t.type==="trampoline"?this.trampolines.push({x:s,y:i,size:28,state:"idle",frame:0,frameCount:8,frameSpeed:.05,frameTimer:0,type:"trampoline"}):t.type==="trophy"&&(this.trophy={x:s,y:i,size:32,frameCount:8,animationFrame:0,animationTimer:0,animationSpeed:.35,acquired:!1,inactive:!0,contactMade:!1})}),this.totalFruitCount=this.fruits.length,this.collectedFruitCount=0,this.completed=!1}getTileAt(e,t){const s=Math.floor(e/v.TILE_SIZE),i=Math.floor(t/v.TILE_SIZE);return s<0||s>=this.gridWidth||i<0?Q[1]:i>=this.gridHeight?Q[0]:this.tiles[i][s]}updateCheckpoints(e){for(const t of this.checkpoints)t.state==="activating"&&(t.frameTimer+=e,t.frameTimer>=t.frameSpeed&&(t.frameTimer-=t.frameSpeed,t.frame++,t.frame>=t.frameCount&&(t.frame=0,t.state="active")))}getInactiveCheckpoints(){return this.checkpoints.filter(e=>e.state==="inactive")}updateFruits(e){for(const t of this.fruits)t.collected||(t.frameTimer+=e,t.frameTimer>=t.frameSpeed&&(t.frameTimer-=t.frameSpeed,t.frame=(t.frame+1)%t.frameCount))}updateTrampolines(e){for(const t of this.trampolines)t.state==="jumping"&&(t.frameTimer+=e,t.frameTimer>=t.frameSpeed&&(t.frameTimer-=t.frameSpeed,t.frame++,t.frame>=t.frameCount&&(t.frame=0,t.state="idle")))}collectFruit(e){e.collected||(e.collected=!0,this.collectedFruitCount++,this.trophy&&this.allFruitsCollected()&&(this.trophy.inactive=!1))}getActiveFruits(){return this.fruits.filter(e=>!e.collected)}getFruitCount(){return this.collectedFruitCount}getTotalFruitCount(){return this.totalFruitCount}allFruitsCollected(){return this.collectedFruitCount===this.totalFruitCount}recalculateCollectedFruits(){this.collectedFruitCount=this.fruits.reduce((e,t)=>e+(t.collected?1:0),0)}updateTrophyAnimation(e){const t=this.trophy;!t||t.inactive||t.acquired||(t.animationTimer+=e,t.animationTimer>=t.animationSpeed&&(t.animationTimer-=t.animationSpeed,t.animationFrame=(t.animationFrame+1)%t.frameCount))}isCompleted(){return this.fruits.length&&!this.allFruitsCollected()?!1:!this.trophy||this.trophy.acquired}reset(){this.fruits.forEach(e=>{e.collected=!1,e.frame=0,e.frameTimer=0}),this.collectedFruitCount=0,this.checkpoints.forEach(e=>{e.state="inactive",e.frame=0,e.frameTimer=0}),this.trampolines.forEach(e=>{e.state="idle",e.frame=0,e.frameTimer=0}),this.trophy&&(this.trophy.acquired=!1,this.trophy.inactive=!0,this.trophy.animationFrame=0,this.trophy.animationTimer=0),this.completed=!1}}class et{constructor(e){this.gameState=e,this.levelSections=T,c.subscribe("requestNextLevel",()=>this.goToNextLevel()),c.subscribe("requestPreviousLevel",()=>this.goToPreviousLevel())}loadLevel(e,t){if(e>=this.levelSections.length||t>=this.levelSections[e].levels.length)return console.error(`Invalid level: Section ${e}, Level ${t}`),null;const s=this.levelSections[e].levels[t];return s?(this.gameState.currentSection=e,this.gameState.currentLevelIndex=t,new Qe(s)):(console.error(`Failed to load level data for Section ${e}, Level ${t}. The JSON file may be missing or failed to fetch.`),null)}hasNextLevel(){const{currentSection:e,currentLevelIndex:t}=this.gameState,s=t+1<this.levelSections[e].levels.length,i=e+1<this.levelSections.length;return s||i}hasPreviousLevel(){const{currentSection:e,currentLevelIndex:t}=this.gameState;return t>0||e>0}goToNextLevel(){if(!this.hasNextLevel())return;let{currentSection:e,currentLevelIndex:t}=this.gameState;t+1<this.levelSections[e].levels.length?t++:e+1<this.levelSections.length&&(e++,t=0),c.publish("requestLevelLoad",{sectionIndex:e,levelIndex:t})}goToPreviousLevel(){if(!this.hasPreviousLevel())return;let{currentSection:e,currentLevelIndex:t}=this.gameState;t>0?t--:e>0&&(e--,t=this.levelSections[e].levels.length-1),c.publish("requestLevelLoad",{sectionIndex:e,levelIndex:t})}handleLevelCompleteAction(e){this.gameState.showingLevelComplete=!1;let{currentSection:t,currentLevelIndex:s}=this.gameState;e==="next"&&this.hasNextLevel()?(s+1<this.levelSections[t].levels.length?s++:t+1<this.levelSections.length&&(t++,s=0),c.publish("requestLevelLoad",{sectionIndex:t,levelIndex:s})):e==="restart"?c.publish("requestLevelLoad",{sectionIndex:t,levelIndex:s}):e==="previous"&&this.hasPreviousLevel()&&(s>0?s--:t>0&&(t--,s=this.levelSections[t].levels.length-1),c.publish("requestLevelLoad",{sectionIndex:t,levelIndex:s}))}}class tt{constructor(e){this.assets=e,this.particles=[],c.subscribe("createParticles",t=>this.create(t))}create({x:e,y:t,type:s,direction:i="right"}){const o={dash:{count:10,baseSpeed:150,spriteKey:"dust_particle",life:.4,gravity:50},double_jump:{count:7,baseSpeed:100,spriteKey:"dust_particle",life:.4,gravity:50},sand:{count:2,baseSpeed:20,spriteKey:"sand_particle",life:.5,gravity:120},mud:{count:2,baseSpeed:15,spriteKey:"mud_particle",life:.6,gravity:100},ice:{count:2,baseSpeed:25,spriteKey:"ice_particle",life:.4,gravity:20}}[s];if(o)for(let l=0;l<o.count;l++){let r;s==="dash"?r=(i==="right"?Math.PI:0)+(Math.random()-.5)*(Math.PI/2):s==="double_jump"?r=Math.PI/2+(Math.random()-.5)*(Math.PI/3):r=-(Math.PI/2)+(Math.random()-.5)*(Math.PI/4);const h=o.baseSpeed+Math.random()*(o.baseSpeed*.5),d=o.life+Math.random()*.3;this.particles.push({x:e,y:t,vx:Math.cos(r)*h,vy:Math.sin(r)*h,life:d,initialLife:d,size:5+Math.random()*4,alpha:1,spriteKey:o.spriteKey,gravity:o.gravity})}}update(e){for(let t=this.particles.length-1;t>=0;t--){const s=this.particles[t];s.life-=e,s.life<=0?this.particles.splice(t,1):(s.x+=s.vx*e,s.y+=s.vy*e,s.vy+=(s.gravity||50)*e,s.alpha=Math.max(0,s.life/s.initialLife))}}render(e,t){if(this.particles.length!==0){e.save(),t.apply(e);for(const s of this.particles){const i=this.assets[s.spriteKey]||this.assets.dust_particle;!i||!t.isVisible(s.x,s.y,s.size,s.size)||(e.globalAlpha=s.alpha,e.drawImage(i,s.x-s.size/2,s.y-s.size/2,s.size,s.size))}t.restore(e),e.restore()}}}class st{constructor(e,t){this.canvas=e,this.assets=t,this.hoveredButton=null;const s=64,i=20,n=20,o=10,l=this.canvas.width-s-i;this.uiButtons=[{id:"settings",x:l,y:n+(s+o)*0,width:s,height:s,assetKey:"settings_icon",visible:!1},{id:"pause",x:l,y:n+(s+o)*1,width:s,height:s,assetKey:"pause_icon",visible:!1},{id:"levels",x:l,y:n+(s+o)*2,width:s,height:s,assetKey:"levels_icon",visible:!1},{id:"character",x:l,y:n+(s+o)*3,width:s,height:s,assetKey:"character_icon",visible:!1},{id:"info",x:l,y:n+(s+o)*4,width:s,height:s,assetKey:"info_icon",visible:!1}],this.canvas.addEventListener("mousemove",r=>this.handleMouseMove(r)),this.canvas.addEventListener("click",r=>this.handleCanvasClick(r)),c.subscribe("gameStarted",()=>this.uiButtons.forEach(r=>r.visible=!0))}_getMousePos(e){const t=this.canvas.getBoundingClientRect(),s=this.canvas.width/t.width,i=this.canvas.height/t.height;return{x:(e.clientX-t.left)*s,y:(e.clientY-t.top)*i}}handleMouseMove(e){const{x:t,y:s}=this._getMousePos(e);this.hoveredButton=null;for(const i of this.uiButtons)if(i.visible&&t>=i.x&&t<=i.x+i.width&&s>=i.y&&s<=i.y+i.height){this.hoveredButton=i;break}}handleCanvasClick(e){this.hoveredButton&&(c.publish("playSound",{key:"button_click",volume:.8,channel:"UI"}),c.publish("ui_button_clicked",{buttonId:this.hoveredButton.id}))}update(){}render(e,t){e.save(),e.setTransform(1,0,0,1,0,0);for(const s of this.uiButtons){if(!s.visible)continue;const i=s.id==="pause"?t?"pause_icon":"play_icon":s.assetKey,n=this.assets[i];if(!n)continue;const o=this.hoveredButton?.id===s.id,l=o?1.1:1,r=s.width*l,h=s.height*l,d=s.x-(r-s.width)/2,u=s.y-(h-s.height)/2;e.globalAlpha=o?1:.8,e.drawImage(n,d,u,r,h)}e.restore()}}class xe{constructor(){this.nextEntityId=0,this.entities=new Set,this.componentsByClass=new Map}createEntity(){const e=this.nextEntityId++;return this.entities.add(e),e}addComponent(e,t){const s=t.constructor;return this.componentsByClass.has(s)||this.componentsByClass.set(s,new Map),this.componentsByClass.get(s).set(e,t),this}getComponent(e,t){const s=this.componentsByClass.get(t);return s?s.get(e):void 0}hasComponent(e,t){const s=this.componentsByClass.get(t);return s?s.has(e):!1}removeComponent(e,t){const s=this.componentsByClass.get(t);s&&s.delete(e)}destroyEntity(e){for(const t of this.componentsByClass.values())t.delete(e);this.entities.delete(e)}query(e){const t=[];for(const s of this.entities)e.every(i=>this.hasComponent(s,i))&&t.push(s);return t}}class j{constructor(){this.moveLeft=!1,this.moveRight=!1,this.jump=!1,this.dash=!1}}class X{constructor(e="idle"){this.currentState=e}}function it(a,e,t,s){const i=a.createEntity();return a.addComponent(i,new C(e,t)),a.addComponent(i,new I),a.addComponent(i,new pe(s)),a.addComponent(i,new F({spriteKey:null,width:g.SPAWN_WIDTH,height:g.SPAWN_HEIGHT,animationState:"spawn"})),a.addComponent(i,new _),a.addComponent(i,new E({type:"dynamic",solid:!0,width:g.WIDTH,height:g.HEIGHT})),a.addComponent(i,new j),a.addComponent(i,new X("spawn")),i}class nt{constructor(){this.keys={},c.subscribe("key_down",({key:e})=>this.keys[e]=!0),c.subscribe("key_up",({key:e})=>this.keys[e]=!1)}isKeyDown(e){return!!this.keys[e]}}const ee=new nt;class ot{update(e,{entityManager:t,keybinds:s,isRunning:i,gameState:n}){const o=i&&!n.showingLevelComplete,l=t.query([_,j]);for(const r of l){const h=t.getComponent(r,j);h.moveLeft=o&&ee.isKeyDown(s.moveLeft),h.moveRight=o&&ee.isKeyDown(s.moveRight),h.jump=o&&ee.isKeyDown(s.jump),h.dash=o&&ee.isKeyDown(s.dash)}}}class at{constructor(){c.subscribe("collisionEvent",e=>this.handleCollision(e))}handleCollision({type:e,entityId:t,target:s,entityManager:i}){if(i.getComponent(t,_))switch(e){case"fruit":c.publish("fruitCollected",s);break;case"world_bottom":case"hazard":c.publish("playerDied");break;case"trophy":c.publish("trophyCollision");break;case"checkpoint":c.publish("checkpointActivated",s);break}}update(e,t){}}class rt{constructor(){}update(e,{entityManager:t}){const s=t.query([_,C,I,E,F,j,X]);for(const i of s){const n=t.getComponent(i,_),o=t.getComponent(i,C),l=t.getComponent(i,I),r=t.getComponent(i,E),h=t.getComponent(i,F),d=t.getComponent(i,j),u=t.getComponent(i,X);this._updateTimers(e,n),this._handleInput(e,d,o,l,n,r,h,u),this._updateFSM(l,n,r,h,u),this._updateAnimation(e,n,h,u),r.isGrounded&&(n.coyoteTimer=g.COYOTE_TIME)}}_updateTimers(e,t){t.jumpBufferTimer>0&&(t.jumpBufferTimer-=e),t.coyoteTimer>0&&(t.coyoteTimer-=e),t.dashCooldownTimer>0&&(t.dashCooldownTimer-=e),t.isDashing&&(t.dashTimer-=e,t.dashTimer<=0&&(t.isDashing=!1))}_handleInput(e,t,s,i,n,o,l,r){if(n.isSpawning||n.isDashing||n.isDespawning)return;t.moveLeft?l.direction="left":t.moveRight&&(l.direction="right");const h=t.jump&&!n.jumpPressed;if(t.jump&&(n.jumpBufferTimer=g.JUMP_BUFFER_TIME),n.jumpBufferTimer>0&&(o.isGrounded||n.coyoteTimer>0)&&n.jumpCount===0){const d=n.jumpForce*(o.groundType==="mud"?g.MUD_JUMP_MULTIPLIER:1);i.vy=-d,n.jumpCount=1,n.jumpBufferTimer=0,n.coyoteTimer=0,c.publish("playSound",{key:"jump",volume:.8,channel:"SFX"})}else h&&o.isAgainstWall&&!o.isGrounded?(i.vx=(l.direction==="left"?1:-1)*n.speed,l.direction=l.direction==="left"?"right":"left",i.vy=-n.jumpForce,n.jumpCount=1,c.publish("playSound",{key:"jump",volume:.8,channel:"SFX"})):h&&n.jumpCount===1&&!o.isGrounded&&!o.isAgainstWall&&(i.vy=-n.jumpForce,n.jumpCount=2,n.jumpBufferTimer=0,this._setAnimationState(l,r,"double_jump",n),c.publish("playSound",{key:"double_jump",volume:.6,channel:"SFX"}),c.publish("createParticles",{x:s.x+o.width/2,y:s.y+o.height,type:"double_jump"}));n.jumpPressed=t.jump,t.dash&&!n.dashPressed&&n.dashCooldownTimer<=0&&(n.isDashing=!0,n.dashTimer=n.dashDuration,i.vx=l.direction==="right"?n.dashSpeed:-n.dashSpeed,i.vy=0,n.dashCooldownTimer=g.DASH_COOLDOWN,this._setAnimationState(l,r,"dash",n),c.publish("playSound",{key:"dash",volume:.7,channel:"SFX"}),c.publish("createParticles",{x:s.x+o.width/2,y:s.y+o.height/2,type:"dash",direction:l.direction})),n.dashPressed=t.dash}_updateFSM(e,t,s,i,n){const o=n.currentState;if(o==="spawn"&&t.spawnComplete){this._setAnimationState(i,n,"idle",t);return}if(!(o==="spawn"||o==="despawn")){if(t.isDashing){o!=="dash"&&this._setAnimationState(i,n,"dash",t);return}s.isAgainstWall&&!s.isGrounded&&e.vy>=0?o!=="cling"&&this._setAnimationState(i,n,"cling",t):s.isGrounded?Math.abs(e.vx)>1?o!=="run"&&this._setAnimationState(i,n,"run",t):o!=="idle"&&this._setAnimationState(i,n,"idle",t):e.vy<0&&o!=="jump"&&o!=="double_jump"?this._setAnimationState(i,n,"jump",t):e.vy>=0&&o!=="fall"&&this._setAnimationState(i,n,"fall",t)}}_setAnimationState(e,t,s,i){t.currentState!==s&&(t.currentState=s,e.animationState=s,e.animationFrame=0,e.animationTimer=0,s==="cling"?i.jumpCount=1:(s==="idle"||s==="run")&&(i.jumpCount=0))}_updateAnimation(e,t,s,i){s.animationTimer+=e;const n=s.animationState,o=n==="spawn"||n==="despawn"?g.SPAWN_ANIMATION_SPEED:g.ANIMATION_SPEED;if(s.animationTimer<o)return;s.animationTimer-=o;const l=g.ANIMATION_FRAMES[n]||1;s.animationFrame++,n==="spawn"||n==="despawn"?s.animationFrame>=l&&(s.animationFrame=l-1,n==="spawn"&&(t.isSpawning=!1,t.spawnComplete=!0,s.width=g.WIDTH,s.height=g.HEIGHT),n==="despawn"&&(t.isDespawning=!1,t.despawnAnimationFinished=!0)):s.animationFrame%=l}}class lt{constructor(){}update(e,{entityManager:t}){const s=t.query([_,I,E,j,C]);for(const i of s){const n=t.getComponent(i,I),o=t.getComponent(i,E),l=t.getComponent(i,_),r=t.getComponent(i,j),h=t.getComponent(i,C);if(l.isSpawning||l.isDespawning){n.vx=0,n.vy=0;continue}this._applyHorizontalMovement(e,r,n,o,l),this._applyVerticalMovement(e,n,o,l),this._updateSurfaceEffects(e,h,n,o,l)}}_applyHorizontalMovement(e,t,s,i,n){if(!n.isDashing)if(i.isGrounded&&i.groundType==="ice"){const o=g.ICE_ACCELERATION,l=g.ICE_FRICTION;t.moveLeft?s.vx-=o*e:t.moveRight?s.vx+=o*e:(s.vx+=(s.vx>0?-l:l)*e,Math.abs(s.vx)<l*e&&(s.vx=0)),s.vx=Math.max(-n.speed,Math.min(n.speed,s.vx))}else{const o=n.speed*(i.isGrounded&&i.groundType==="sand"?g.SAND_MOVE_MULTIPLIER:1);t.moveLeft?s.vx=-o:t.moveRight?s.vx=o:s.vx=0}}_applyVerticalMovement(e,t,s,i){i.isDashing||(t.vy+=g.GRAVITY*e),s.isAgainstWall&&!s.isGrounded&&(t.vy=Math.min(t.vy,30)),t.vy=Math.min(t.vy,g.MAX_FALL_SPEED)}_updateSurfaceEffects(e,t,s,i,n){const o=i.isGrounded&&Math.abs(s.vx)>1&&!n.isDashing,l=o?{sand:"sand_walk",mud:"mud_run",ice:"ice_run"}[i.groundType]:null;if(l!==n.activeSurfaceSound&&(n.activeSurfaceSound&&c.publish("stopSoundLoop",{key:n.activeSurfaceSound}),l&&c.publish("startSoundLoop",{key:l,channel:"SFX"}),n.activeSurfaceSound=l),o&&(n.surfaceParticleTimer+=e,n.surfaceParticleTimer>=.1)){n.surfaceParticleTimer=0;const r={sand:"sand",mud:"mud",ice:"ice"}[i.groundType];r&&c.publish("createParticles",{x:t.x+i.width/2,y:t.y+i.height,type:r})}}}class ct{constructor(e,t,s,i,n){this.ctx=e,this.canvas=t,this.assets=s,this.fontRenderer=n,this.lastFrameTime=0,this.keybinds=i,this.isRunning=!1,this.gameHasStarted=!1,this.pauseForMenu=!1,this.entityManager=new xe,this.lastCheckpoint=null,this.fruitsAtLastCheckpoint=new Set,this.playerEntityId=null,this.camera=new Ve(t.width,t.height),this.hud=new qe(t,this.fontRenderer),this.soundManager=new Ye,this.soundManager.loadSounds(s),this.renderer=new Je(e,t,s),this.gameState=new se,c.publish("gameStateUpdated",this.gameState),this.levelManager=new et(this.gameState),this.inputSystemProcessor=new ot,this.playerStateSystem=new rt,this.movementSystem=new lt,this.collisionSystem=new Ze,this.gameplaySystem=new at,this.particleSystem=new tt(s),this.uiSystem=new st(t,s),this.systems=[this.inputSystemProcessor,this.playerStateSystem,this.movementSystem,this.collisionSystem,this.particleSystem,this.uiSystem],this.levelStartTime=0,this.levelTime=0,this.currentLevel=null,this.collectedFruits=[],this._setupEventSubscriptions()}_setupEventSubscriptions(){c.subscribe("requestStartGame",()=>this.loadLevel(this.gameState.currentSection,this.gameState.currentLevelIndex)),c.subscribe("requestLevelLoad",({sectionIndex:e,levelIndex:t})=>this.loadLevel(e,t)),c.subscribe("requestLevelRestart",()=>this.loadLevel(this.gameState.currentSection,this.gameState.currentLevelIndex)),c.subscribe("keybindsUpdated",e=>this.updateKeybinds(e)),c.subscribe("fruitCollected",e=>this._onFruitCollected(e)),c.subscribe("trophyCollision",()=>this._onTrophyCollision()),c.subscribe("checkpointActivated",e=>this._onCheckpointActivated(e)),c.subscribe("playerDied",()=>this._onPlayerDied()),c.subscribe("characterUpdated",e=>this.updatePlayerCharacter(e)),c.subscribe("menuOpened",()=>{this.pauseForMenu=!0,this.pause()}),c.subscribe("allMenusClosed",()=>{this.pauseForMenu=!1,this.resume()}),c.subscribe("gameStateUpdated",e=>this.gameState=e)}updatePlayerCharacter(e){if(this.playerEntityId===null)return;const t=this.entityManager.getComponent(this.playerEntityId,pe);t&&(t.characterId=e||this.gameState.selectedCharacter)}updateKeybinds(e){this.keybinds={...e}}start(){this.isRunning||(this.isRunning=!0,this.gameHasStarted=!0,this.lastFrameTime=performance.now(),c.publish("gameStarted"),c.publish("gameResumed"),this.gameLoop())}stop(){this.isRunning=!1,this.soundManager.stopAll()}pause(){if(!this.isRunning)return;this.isRunning=!1,this.soundManager.stopAll({except:["UI"]});const e=this.entityManager.getComponent(this.playerEntityId,_);e&&(e.needsRespawn=!1),c.publish("gamePaused")}resume(){if(this.pauseForMenu||this.isRunning||!this.gameHasStarted||this.gameState.showingLevelComplete)return;this.isRunning=!0,this.lastFrameTime=performance.now(),c.publish("gameResumed"),this.gameLoop();const e=this.entityManager.getComponent(this.playerEntityId,_);e&&(e.needsRespawn=!1)}gameLoop(e=performance.now()){if(!this.isRunning)return;const t=Math.min((e-this.lastFrameTime)/1e3,.016);this.lastFrameTime=e,this.update(t),this.render(t),requestAnimationFrame(s=>this.gameLoop(s))}loadLevel(e,t){this.levelManager.gameState=this.gameState;const s=this.levelManager.loadLevel(e,t);if(!s){this.stop();return}this.currentLevel=s,this.pauseForMenu=!1;const i=new se(this.gameState);i.showingLevelComplete=!1,i.currentSection=e,i.currentLevelIndex=t,this.gameState=i,c.publish("gameStateUpdated",this.gameState),this.collectedFruits=[],this.lastCheckpoint=null,this.fruitsAtLastCheckpoint.clear(),this.soundManager.stopAll(),this.entityManager=new xe,this.playerEntityId=it(this.entityManager,this.currentLevel.startPosition.x,this.currentLevel.startPosition.y,this.gameState.selectedCharacter),this.camera.updateLevelBounds(this.currentLevel.width,this.currentLevel.height),this.camera.snapToPlayer(this.entityManager,this.playerEntityId),this.levelStartTime=performance.now(),this.gameHasStarted?this.resume():this.start(),c.publish("levelLoaded",{gameState:this.gameState})}update(e){if(!this.currentLevel)return;this.isRunning&&!this.gameState.showingLevelComplete&&(this.levelTime=(performance.now()-this.levelStartTime)/1e3),this.camera.update(this.entityManager,this.playerEntityId,e);const t={entityManager:this.entityManager,playerEntityId:this.playerEntityId,level:this.currentLevel,camera:this.camera,isRunning:this.isRunning,gameState:this.gameState,keybinds:this.keybinds,dt:e};for(const i of this.systems)i.update(e,t);const s=this.entityManager.getComponent(this.playerEntityId,_);s&&s.needsRespawn&&!this.gameState.showingLevelComplete&&this.isRunning&&this._respawnPlayer(),this.currentLevel.updateFruits(e),this.currentLevel.updateTrophyAnimation(e),this.currentLevel.updateCheckpoints(e),this.currentLevel.updateTrampolines(e);for(let i=this.collectedFruits.length-1;i>=0;i--){const n=this.collectedFruits[i];n.frameTimer+=e,n.frameTimer>=n.frameSpeed&&(n.frameTimer=0,n.frame++,n.frame>=n.collectedFrameCount&&this.collectedFruits.splice(i,1))}if(s&&s.despawnAnimationFinished&&!this.gameState.showingLevelComplete){s.despawnAnimationFinished=!1;const i=this.gameState.onLevelComplete();i!==this.gameState&&(this.gameState=i,c.publish("gameStateUpdated",this.gameState),this.pause(),c.publish("levelComplete",{deaths:s.deathCount,time:this.levelTime,hasNextLevel:this.levelManager.hasNextLevel(),hasPreviousLevel:this.levelManager.hasPreviousLevel()}))}c.publish("statsUpdated",{levelName:this.currentLevel.name,collectedFruits:this.currentLevel.getFruitCount(),totalFruits:this.currentLevel.getTotalFruitCount(),deathCount:s?s.deathCount:0,levelTime:this.levelTime})}_onPlayerDied(){const e=this.entityManager.getComponent(this.playerEntityId,_);e&&!e.needsRespawn&&(e.deathCount++,e.needsRespawn=!0)}_respawnPlayer(){const e=this.lastCheckpoint||this.currentLevel.startPosition;this.lastCheckpoint?this.currentLevel.fruits.forEach((h,d)=>h.collected=this.fruitsAtLastCheckpoint.has(d)):this.currentLevel.fruits.forEach(h=>h.collected=!1),this.currentLevel.recalculateCollectedFruits();const t=this.entityManager.getComponent(this.playerEntityId,C),s=this.entityManager.getComponent(this.playerEntityId,I),i=this.entityManager.getComponent(this.playerEntityId,_),n=this.entityManager.getComponent(this.playerEntityId,F),o=this.entityManager.getComponent(this.playerEntityId,E),l=this.entityManager.getComponent(this.playerEntityId,X);t.x=e.x,t.y=e.y,s.vx=0,s.vy=0;const r=i.deathCount;this.entityManager.removeComponent(this.playerEntityId,_),this.entityManager.addComponent(this.playerEntityId,new _({deathCount:r})),n.animationState="spawn",l.currentState="spawn",n.animationFrame=0,n.animationTimer=0,n.direction="right",n.width=g.SPAWN_WIDTH,n.height=g.SPAWN_HEIGHT,o.isGrounded=!1,o.isAgainstWall=!1,o.groundType=null,this.camera.shake(15,.5),c.publish("playSound",{key:"death_sound",volume:.3,channel:"SFX"})}_onFruitCollected(e){this.currentLevel.collectFruit(e),c.publish("playSound",{key:"collect",volume:.8,channel:"SFX"}),this.collectedFruits.push({x:e.x,y:e.y,size:e.size,frame:0,frameSpeed:.1,frameTimer:0,collectedFrameCount:6})}_onCheckpointActivated(e){e.state="activating",this.lastCheckpoint={x:e.x,y:e.y-e.size/2},c.publish("playSound",{key:"checkpoint_activated",volume:1,channel:"UI"}),this.fruitsAtLastCheckpoint.clear(),this.currentLevel.fruits.forEach((t,s)=>{t.collected&&this.fruitsAtLastCheckpoint.add(s)}),this.currentLevel.checkpoints.forEach(t=>{t!==e&&t.state==="active"&&(t.state="inactive",t.frame=0)})}_onTrophyCollision(){const e=this.entityManager.getComponent(this.playerEntityId,_),t=this.entityManager.getComponent(this.playerEntityId,F),s=this.entityManager.getComponent(this.playerEntityId,X);e&&!e.isDespawning&&(this.currentLevel.trophy.acquired=!0,this.camera.shake(8,.3),e.isDespawning=!0,t.animationState="despawn",s.currentState="despawn",t.animationFrame=0,t.animationTimer=0,t.width=g.SPAWN_WIDTH,t.height=g.SPAWN_HEIGHT)}render(e){this.currentLevel&&(this.ctx.clearRect(0,0,this.canvas.width,this.canvas.height),this.renderer.drawScrollingBackground(this.currentLevel,e),this.renderer.renderScene(this.camera,this.currentLevel,this.entityManager,this.collectedFruits),this.particleSystem.render(this.ctx,this.camera),this.hud.drawGameHUD(this.ctx),this.uiSystem.render(this.ctx,this.isRunning))}}function ht(a,e,t,s=!0){const i=document.createElement("canvas");i.width=a,i.height=e;const n=i.getContext("2d");return n.fillStyle=t,n.fillRect(0,0,a,e),s&&(n.fillStyle="rgba(0, 0, 0, 0.1)",n.fillRect(0,0,a/2,e/2),n.fillRect(a/2,e/2,a/2,e/2)),i}function Se(a,e){return new Promise(t=>{const s=new Image,i=1e4;let n=!1;const o=()=>{if(n)return;n=!0,console.warn(`Failed or timed out loading image: ${a}. Using fallback.`);let r="#808080";e.includes("player")?r="#ff8c21":e.includes("fruit")&&(r="#FF6B6B");const h=ht(32,32,r),d=new Image;d.src=h.toDataURL(),d.onload=()=>t(d)},l=setTimeout(o,i);s.onload=()=>{n||(clearTimeout(l),t(s))},s.onerror=()=>{clearTimeout(l),o()},s.crossOrigin="anonymous",s.src=a})}function dt(a,e){return new Promise(t=>{const s=new Audio,i=1e4;let n=!1;const o=()=>{if(n)return;n=!0,console.warn(`Failed or timed out loading sound: ${a}. Using silent fallback.`);const r=new Audio("data:audio/wav;base64,UklGRigAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA=");t(r)},l=setTimeout(o,i);s.addEventListener("canplaythrough",()=>{n||(clearTimeout(l),t(s))}),s.addEventListener("error",()=>{clearTimeout(l),o()}),s.crossOrigin="anonymous",s.preload="auto",s.src=a,s.load()})}function ut(a){return fetch(a).then(e=>{if(!e.ok)throw new Error(`Failed to fetch level: ${a}, status: ${e.status}`);return e.json()}).catch(e=>(console.error(`Error loading JSON from ${a}:`,e),null))}const he={PinkMan:{path:"/assets/MainCharacters/PinkMan/"},NinjaFrog:{path:"/assets/MainCharacters/NinjaFrog/"},MaskDude:{path:"/assets/MainCharacters/MaskDude/"},VirtualGuy:{path:"/assets/MainCharacters/VirtualGuy/"}},_e={playerJump:"jump.png",playerDoubleJump:"double_jump.png",playerIdle:"idle.png",playerRun:"run.png",playerFall:"fall.png",playerDash:"dash.png",playerCling:"wall_jump.png"};async function pt(){const a={font_spritesheet:"/assets/Menu/Text/Text (White) (8x10).png",settings_icon:"/assets/Menu/Buttons/Settings.png",pause_icon:"/assets/Menu/Buttons/Pause.png",play_icon:"/assets/Menu/Buttons/Play.png",levels_icon:"/assets/Menu/Buttons/Levels.png",character_icon:"/assets/Menu/Buttons/Character.png",info_icon:"/assets/Menu/Buttons/Info.png",background_blue:"/assets/Background/Blue.png",background_brown:"/assets/Background/Brown.png",background_gray:"/assets/Background/Gray.png",background_green:"/assets/Background/Green.png",background_pink:"/assets/Background/Pink.png",background_purple:"/assets/Background/Purple.png",background_red:"/assets/Background/Red.png",background_yellow:"/assets/Background/Yellow.png",block:"/assets/Terrain/Terrain.png",playerAppear:"/assets/MainCharacters/Appearing.png",playerDisappear:"/assets/MainCharacters/Disappearing.png",fruit_apple:"/assets/Items/Fruits/Apple.png",fruit_bananas:"/assets/Items/Fruits/Bananas.png",fruit_cherries:"/assets/Items/Fruits/Cherries.png",fruit_kiwi:"/assets/Items/Fruits/Kiwi.png",fruit_melon:"/assets/Items/Fruits/Melon.png",fruit_orange:"/assets/Items/Fruits/Orange.png",fruit_pineapple:"/assets/Items/Fruits/Pineapple.png",fruit_strawberry:"/assets/Items/Fruits/Strawberry.png",fruit_collected:"/assets/Items/Fruits/Collected.png",checkpoint_inactive:"/assets/Items/Checkpoints/Checkpoint/Checkpoint (No Flag).png",checkpoint_activation:"/assets/Items/Checkpoints/Checkpoint/Checkpoint (Flag Out).png",checkpoint_active:"/assets/Items/Checkpoints/Checkpoint/Checkpoint (Flag Idle).png",trophy:"/assets/Items/Checkpoints/End/End (Pressed).png",spike_two:"/assets/Traps/Spikes/Two.png",fire_off:"/assets/Traps/Fire/off.png",fire_hit:"/assets/Traps/Fire/hit.png",fire_on:"/assets/Traps/Fire/on.png",sand_mud_ice:"/assets/Traps/Sand Mud Ice/Sand Mud Ice.png",trampoline_idle:"/assets/Traps/Trampoline/Idle.png",trampoline_jump:"/assets/Traps/Trampoline/Jump.png",dust_particle:"/assets/Other/Dust Particle.png",ice_particle:"/assets/Traps/Sand Mud Ice/Ice Particle.png",sand_particle:"/assets/Traps/Sand Mud Ice/Sand Particle.png",mud_particle:"/assets/Traps/Sand Mud Ice/Mud Particle.png"},e={button_click:"/assets/Sounds/Button Click.mp3",jump:"/assets/Sounds/Player Jump.mp3",double_jump:"/assets/Sounds/Player Double Jump.mp3",collect:"/assets/Sounds/Fruit Collect.mp3",level_complete:"/assets/Sounds/Level Complete.mp3",death_sound:"/assets/Sounds/Death.mp3",dash:"/assets/Sounds/Whoosh.mp3",checkpoint_activated:"/assets/Sounds/Checkpoint (Activation).mp3",sand_walk:"/assets/Sounds/Sand Walk.mp3",mud_run:"/assets/Sounds/Mud Run.mp3",ice_run:"/assets/Sounds/Ice Run.mp3",trampoline_bounce:"/assets/Sounds/Boing.mp3"};console.log("Starting asset loading...");const t=Object.entries(a).map(([l,r])=>Se(r,l).then(h=>({[l]:h}))),s=Object.entries(e).map(([l,r])=>dt(r).then(h=>({[l]:h}))),i=[];for(const l in he)for(const r in _e){const h=he[l].path+_e[r],d=Se(h,`${l}-${r}`).then(u=>({type:"character",charKey:l,spriteKey:r,img:u}));i.push(d)}const n=[];T.forEach((l,r)=>{l.levels.forEach((h,d)=>{h.jsonPath&&n.push(ut(h.jsonPath).then(u=>({data:u,sectionIndex:r,levelIndex:d,type:"level"})))})});const o=[...t,...s,...i,...n];try{const l=await Promise.all(o),r={characters:{}};for(const h in he)r.characters[h]={};for(const h of l)h&&(h.type==="character"?r.characters[h.charKey][h.spriteKey]=h.img:h.type==="level"?T[h.sectionIndex].levels[h.levelIndex]=h.data:Object.assign(r,h));return console.log("All assets and level data processed. Available assets:",Object.keys(r).length),r}catch(l){throw console.error("A critical error occurred during asset loading:",l),l}}class mt{constructor(){this.init()}init(){window.addEventListener("keydown",this.handleKeyDown.bind(this)),window.addEventListener("keyup",this.handleKeyUp.bind(this)),window.addEventListener("contextmenu",e=>e.preventDefault())}handleKeyDown(e){const t=e.key.toLowerCase();c.publish("key_down",{key:t,rawEvent:e});const s={enter:"confirm",r:"restart",n:"next",p:"previous",escape:"escape_pressed"};t===" "&&c.publish("action_confirm_pressed");const i=s[t];i&&c.publish(`action_${i}`)}handleKeyUp(e){const t=e.key.toLowerCase();c.publish("key_up",{key:t,rawEvent:e})}}const we={A:{x:0,y:0},B:{x:8,y:0},C:{x:16,y:0},D:{x:24,y:0},E:{x:32,y:0},F:{x:40,y:0},G:{x:48,y:0},H:{x:56,y:0},I:{x:64,y:0},J:{x:72,y:0},K:{x:0,y:10},L:{x:8,y:10},M:{x:16,y:10},N:{x:24,y:10},O:{x:32,y:10},P:{x:40,y:10},Q:{x:48,y:10},R:{x:56,y:10},S:{x:64,y:10},T:{x:72,y:10},U:{x:0,y:20},V:{x:8,y:20},W:{x:16,y:20},X:{x:24,y:20},Y:{x:32,y:20},Z:{x:40,y:20},0:{x:0,y:30},1:{x:8,y:30},2:{x:16,y:30},3:{x:24,y:30},4:{x:32,y:30},5:{x:40,y:30},6:{x:48,y:30},7:{x:56,y:30},8:{x:64,y:30},9:{x:72,y:30},".":{x:0,y:40},",":{x:8,y:40},":":{x:16,y:40},"?":{x:24,y:40},"!":{x:32,y:40},"(":{x:40,y:40},")":{x:48,y:40},"+":{x:56,y:40},"-":{x:64,y:40},"/":{x:48,y:20}," ":{x:0,y:0,space:!0},"%":{x:56,y:20},"'":{x:64,y:20},"&":{x:72,y:20}},$=8,M=10;class ft{constructor(e){this.sprite=e,this.sprite||console.error("Font spritesheet not provided to FontRenderer!"),this.characterCache=new Map}_getCachedCharacter(e,t){const s=`${e}_${t}`;if(this.characterCache.has(s))return this.characterCache.get(s);const i=we[e];if(!i)return null;const n=document.createElement("canvas");n.width=$,n.height=M;const o=n.getContext("2d");return o.imageSmoothingEnabled=!1,o.drawImage(this.sprite,i.x,i.y,$,M,0,0,$,M),o.globalCompositeOperation="source-in",o.fillStyle=t,o.fillRect(0,0,$,M),this.characterCache.set(s,n),n}_renderText(e,t,s,i,{scale:n=1,color:o=null}={}){if(!this.sprite)return;const l=t.toUpperCase();let r=s;e.imageSmoothingEnabled=!1;for(const h of l){const d=we[h];if(!d){r+=$*n;continue}if(d.space){r+=$*n;continue}let u,p=d.x,b=d.y;o?(u=this._getCachedCharacter(h,o),p=0,b=0):u=this.sprite,u&&e.drawImage(u,p,b,$,M,r,i,$*n,M*n),r+=$*n}}drawText(e,t,s,i,{scale:n=1,align:o="left",color:l="white",outlineColor:r=null,outlineWidth:h=1}={}){const d=this.getTextWidth(t,n);let u=s;if(o==="center"?u=s-d/2:o==="right"&&(u=s-d),r){const p={scale:n,color:r};this._renderText(e,t,u-h,i,p),this._renderText(e,t,u+h,i,p),this._renderText(e,t,u,i-h,p),this._renderText(e,t,u,i+h,p)}this._renderText(e,t,u,i,{scale:n,color:l})}getTextWidth(e,t=1){return e.length*$*t}renderTextToCanvas(e,t){if(!this.sprite)return null;const s=t.outlineColor&&t.outlineWidth?t.outlineWidth*2:0,i=this.getTextWidth(e,t.scale),n=M*t.scale,o=document.createElement("canvas");o.width=i+s,o.height=n+s;const l=o.getContext("2d"),r={...t,align:"left"};return this.drawText(l,e,s/2,s/2,r),o}}/**
 * @license
 * Copyright 2019 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */const te=globalThis,me=te.ShadowRoot&&(te.ShadyCSS===void 0||te.ShadyCSS.nativeShadow)&&"adoptedStyleSheets"in Document.prototype&&"replace"in CSSStyleSheet.prototype,fe=Symbol(),Ce=new WeakMap;let Fe=class{constructor(e,t,s){if(this._$cssResult$=!0,s!==fe)throw Error("CSSResult is not constructable. Use `unsafeCSS` or `css` instead.");this.cssText=e,this.t=t}get styleSheet(){let e=this.o;const t=this.t;if(me&&e===void 0){const s=t!==void 0&&t.length===1;s&&(e=Ce.get(t)),e===void 0&&((this.o=e=new CSSStyleSheet).replaceSync(this.cssText),s&&Ce.set(t,e))}return e}toString(){return this.cssText}};const gt=a=>new Fe(typeof a=="string"?a:a+"",void 0,fe),A=(a,...e)=>{const t=a.length===1?a[0]:e.reduce((s,i,n)=>s+(o=>{if(o._$cssResult$===!0)return o.cssText;if(typeof o=="number")return o;throw Error("Value passed to 'css' function must be a 'css' function result: "+o+". Use 'unsafeCSS' to pass non-literal values, but take care to ensure page security.")})(i)+a[n+1],a[0]);return new Fe(t,a,fe)},yt=(a,e)=>{if(me)a.adoptedStyleSheets=e.map(t=>t instanceof CSSStyleSheet?t:t.styleSheet);else for(const t of e){const s=document.createElement("style"),i=te.litNonce;i!==void 0&&s.setAttribute("nonce",i),s.textContent=t.cssText,a.appendChild(s)}},ke=me?a=>a:a=>a instanceof CSSStyleSheet?(e=>{let t="";for(const s of e.cssRules)t+=s.cssText;return gt(t)})(a):a;/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */const{is:bt,defineProperty:vt,getOwnPropertyDescriptor:xt,getOwnPropertyNames:St,getOwnPropertySymbols:_t,getPrototypeOf:wt}=Object,oe=globalThis,$e=oe.trustedTypes,Ct=$e?$e.emptyScript:"",kt=oe.reactiveElementPolyfillSupport,V=(a,e)=>a,ue={toAttribute(a,e){switch(e){case Boolean:a=a?Ct:null;break;case Object:case Array:a=a==null?a:JSON.stringify(a)}return a},fromAttribute(a,e){let t=a;switch(e){case Boolean:t=a!==null;break;case Number:t=a===null?null:Number(a);break;case Object:case Array:try{t=JSON.parse(a)}catch{t=null}}return t}},je=(a,e)=>!bt(a,e),Ee={attribute:!0,type:String,converter:ue,reflect:!1,useDefault:!1,hasChanged:je};Symbol.metadata??=Symbol("metadata"),oe.litPropertyMetadata??=new WeakMap;let z=class extends HTMLElement{static addInitializer(e){this._$Ei(),(this.l??=[]).push(e)}static get observedAttributes(){return this.finalize(),this._$Eh&&[...this._$Eh.keys()]}static createProperty(e,t=Ee){if(t.state&&(t.attribute=!1),this._$Ei(),this.prototype.hasOwnProperty(e)&&((t=Object.create(t)).wrapped=!0),this.elementProperties.set(e,t),!t.noAccessor){const s=Symbol(),i=this.getPropertyDescriptor(e,s,t);i!==void 0&&vt(this.prototype,e,i)}}static getPropertyDescriptor(e,t,s){const{get:i,set:n}=xt(this.prototype,e)??{get(){return this[t]},set(o){this[t]=o}};return{get:i,set(o){const l=i?.call(this);n?.call(this,o),this.requestUpdate(e,l,s)},configurable:!0,enumerable:!0}}static getPropertyOptions(e){return this.elementProperties.get(e)??Ee}static _$Ei(){if(this.hasOwnProperty(V("elementProperties")))return;const e=wt(this);e.finalize(),e.l!==void 0&&(this.l=[...e.l]),this.elementProperties=new Map(e.elementProperties)}static finalize(){if(this.hasOwnProperty(V("finalized")))return;if(this.finalized=!0,this._$Ei(),this.hasOwnProperty(V("properties"))){const t=this.properties,s=[...St(t),..._t(t)];for(const i of s)this.createProperty(i,t[i])}const e=this[Symbol.metadata];if(e!==null){const t=litPropertyMetadata.get(e);if(t!==void 0)for(const[s,i]of t)this.elementProperties.set(s,i)}this._$Eh=new Map;for(const[t,s]of this.elementProperties){const i=this._$Eu(t,s);i!==void 0&&this._$Eh.set(i,t)}this.elementStyles=this.finalizeStyles(this.styles)}static finalizeStyles(e){const t=[];if(Array.isArray(e)){const s=new Set(e.flat(1/0).reverse());for(const i of s)t.unshift(ke(i))}else e!==void 0&&t.push(ke(e));return t}static _$Eu(e,t){const s=t.attribute;return s===!1?void 0:typeof s=="string"?s:typeof e=="string"?e.toLowerCase():void 0}constructor(){super(),this._$Ep=void 0,this.isUpdatePending=!1,this.hasUpdated=!1,this._$Em=null,this._$Ev()}_$Ev(){this._$ES=new Promise(e=>this.enableUpdating=e),this._$AL=new Map,this._$E_(),this.requestUpdate(),this.constructor.l?.forEach(e=>e(this))}addController(e){(this._$EO??=new Set).add(e),this.renderRoot!==void 0&&this.isConnected&&e.hostConnected?.()}removeController(e){this._$EO?.delete(e)}_$E_(){const e=new Map,t=this.constructor.elementProperties;for(const s of t.keys())this.hasOwnProperty(s)&&(e.set(s,this[s]),delete this[s]);e.size>0&&(this._$Ep=e)}createRenderRoot(){const e=this.shadowRoot??this.attachShadow(this.constructor.shadowRootOptions);return yt(e,this.constructor.elementStyles),e}connectedCallback(){this.renderRoot??=this.createRenderRoot(),this.enableUpdating(!0),this._$EO?.forEach(e=>e.hostConnected?.())}enableUpdating(e){}disconnectedCallback(){this._$EO?.forEach(e=>e.hostDisconnected?.())}attributeChangedCallback(e,t,s){this._$AK(e,s)}_$ET(e,t){const s=this.constructor.elementProperties.get(e),i=this.constructor._$Eu(e,s);if(i!==void 0&&s.reflect===!0){const n=(s.converter?.toAttribute!==void 0?s.converter:ue).toAttribute(t,s.type);this._$Em=e,n==null?this.removeAttribute(i):this.setAttribute(i,n),this._$Em=null}}_$AK(e,t){const s=this.constructor,i=s._$Eh.get(e);if(i!==void 0&&this._$Em!==i){const n=s.getPropertyOptions(i),o=typeof n.converter=="function"?{fromAttribute:n.converter}:n.converter?.fromAttribute!==void 0?n.converter:ue;this._$Em=i;const l=o.fromAttribute(t,n.type);this[i]=l??this._$Ej?.get(i)??l,this._$Em=null}}requestUpdate(e,t,s){if(e!==void 0){const i=this.constructor,n=this[e];if(s??=i.getPropertyOptions(e),!((s.hasChanged??je)(n,t)||s.useDefault&&s.reflect&&n===this._$Ej?.get(e)&&!this.hasAttribute(i._$Eu(e,s))))return;this.C(e,t,s)}this.isUpdatePending===!1&&(this._$ES=this._$EP())}C(e,t,{useDefault:s,reflect:i,wrapped:n},o){s&&!(this._$Ej??=new Map).has(e)&&(this._$Ej.set(e,o??t??this[e]),n!==!0||o!==void 0)||(this._$AL.has(e)||(this.hasUpdated||s||(t=void 0),this._$AL.set(e,t)),i===!0&&this._$Em!==e&&(this._$Eq??=new Set).add(e))}async _$EP(){this.isUpdatePending=!0;try{await this._$ES}catch(t){Promise.reject(t)}const e=this.scheduleUpdate();return e!=null&&await e,!this.isUpdatePending}scheduleUpdate(){return this.performUpdate()}performUpdate(){if(!this.isUpdatePending)return;if(!this.hasUpdated){if(this.renderRoot??=this.createRenderRoot(),this._$Ep){for(const[i,n]of this._$Ep)this[i]=n;this._$Ep=void 0}const s=this.constructor.elementProperties;if(s.size>0)for(const[i,n]of s){const{wrapped:o}=n,l=this[i];o!==!0||this._$AL.has(i)||l===void 0||this.C(i,void 0,n,l)}}let e=!1;const t=this._$AL;try{e=this.shouldUpdate(t),e?(this.willUpdate(t),this._$EO?.forEach(s=>s.hostUpdate?.()),this.update(t)):this._$EM()}catch(s){throw e=!1,this._$EM(),s}e&&this._$AE(t)}willUpdate(e){}_$AE(e){this._$EO?.forEach(t=>t.hostUpdated?.()),this.hasUpdated||(this.hasUpdated=!0,this.firstUpdated(e)),this.updated(e)}_$EM(){this._$AL=new Map,this.isUpdatePending=!1}get updateComplete(){return this.getUpdateComplete()}getUpdateComplete(){return this._$ES}shouldUpdate(e){return!0}update(e){this._$Eq&&=this._$Eq.forEach(t=>this._$ET(t,this[t])),this._$EM()}updated(e){}firstUpdated(e){}};z.elementStyles=[],z.shadowRootOptions={mode:"open"},z[V("elementProperties")]=new Map,z[V("finalized")]=new Map,kt?.({ReactiveElement:z}),(oe.reactiveElementVersions??=[]).push("2.1.1");/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */const ge=globalThis,ie=ge.trustedTypes,Ae=ie?ie.createPolicy("lit-html",{createHTML:a=>a}):void 0,Ue="$lit$",L=`lit$${Math.random().toFixed(9).slice(2)}$`,Oe="?"+L,$t=`<${Oe}>`,U=document,Y=()=>U.createComment(""),q=a=>a===null||typeof a!="object"&&typeof a!="function",ye=Array.isArray,Et=a=>ye(a)||typeof a?.[Symbol.iterator]=="function",de=`[ 	
\f\r]`,W=/<(?:(!--|\/[^a-zA-Z])|(\/?[a-zA-Z][^>\s]*)|(\/?$))/g,Le=/-->/g,Te=/>/g,R=RegExp(`>|${de}(?:([^\\s"'>=/]+)(${de}*=${de}*(?:[^ 	
\f\r"'\`<>=]|("|')|))|$)`,"g"),Ie=/'/g,Me=/"/g,ze=/^(?:script|style|textarea|title)$/i,At=a=>(e,...t)=>({_$litType$:a,strings:e,values:t}),f=At(1),D=Symbol.for("lit-noChange"),x=Symbol.for("lit-nothing"),Re=new WeakMap,P=U.createTreeWalker(U,129);function De(a,e){if(!ye(a)||!a.hasOwnProperty("raw"))throw Error("invalid template strings array");return Ae!==void 0?Ae.createHTML(e):e}const Lt=(a,e)=>{const t=a.length-1,s=[];let i,n=e===2?"<svg>":e===3?"<math>":"",o=W;for(let l=0;l<t;l++){const r=a[l];let h,d,u=-1,p=0;for(;p<r.length&&(o.lastIndex=p,d=o.exec(r),d!==null);)p=o.lastIndex,o===W?d[1]==="!--"?o=Le:d[1]!==void 0?o=Te:d[2]!==void 0?(ze.test(d[2])&&(i=RegExp("</"+d[2],"g")),o=R):d[3]!==void 0&&(o=R):o===R?d[0]===">"?(o=i??W,u=-1):d[1]===void 0?u=-2:(u=o.lastIndex-d[2].length,h=d[1],o=d[3]===void 0?R:d[3]==='"'?Me:Ie):o===Me||o===Ie?o=R:o===Le||o===Te?o=W:(o=R,i=void 0);const b=o===R&&a[l+1].startsWith("/>")?" ":"";n+=o===W?r+$t:u>=0?(s.push(h),r.slice(0,u)+Ue+r.slice(u)+L+b):r+L+(u===-2?l:b)}return[De(a,n+(a[t]||"<?>")+(e===2?"</svg>":e===3?"</math>":"")),s]};class Z{constructor({strings:e,_$litType$:t},s){let i;this.parts=[];let n=0,o=0;const l=e.length-1,r=this.parts,[h,d]=Lt(e,t);if(this.el=Z.createElement(h,s),P.currentNode=this.el.content,t===2||t===3){const u=this.el.content.firstChild;u.replaceWith(...u.childNodes)}for(;(i=P.nextNode())!==null&&r.length<l;){if(i.nodeType===1){if(i.hasAttributes())for(const u of i.getAttributeNames())if(u.endsWith(Ue)){const p=d[o++],b=i.getAttribute(u).split(L),S=/([.?@])?(.*)/.exec(p);r.push({type:1,index:n,name:S[2],strings:b,ctor:S[1]==="."?It:S[1]==="?"?Mt:S[1]==="@"?Rt:ae}),i.removeAttribute(u)}else u.startsWith(L)&&(r.push({type:6,index:n}),i.removeAttribute(u));if(ze.test(i.tagName)){const u=i.textContent.split(L),p=u.length-1;if(p>0){i.textContent=ie?ie.emptyScript:"";for(let b=0;b<p;b++)i.append(u[b],Y()),P.nextNode(),r.push({type:2,index:++n});i.append(u[p],Y())}}}else if(i.nodeType===8)if(i.data===Oe)r.push({type:2,index:n});else{let u=-1;for(;(u=i.data.indexOf(L,u+1))!==-1;)r.push({type:7,index:n}),u+=L.length-1}n++}}static createElement(e,t){const s=U.createElement("template");return s.innerHTML=e,s}}function H(a,e,t=a,s){if(e===D)return e;let i=s!==void 0?t._$Co?.[s]:t._$Cl;const n=q(e)?void 0:e._$litDirective$;return i?.constructor!==n&&(i?._$AO?.(!1),n===void 0?i=void 0:(i=new n(a),i._$AT(a,t,s)),s!==void 0?(t._$Co??=[])[s]=i:t._$Cl=i),i!==void 0&&(e=H(a,i._$AS(a,e.values),i,s)),e}class Tt{constructor(e,t){this._$AV=[],this._$AN=void 0,this._$AD=e,this._$AM=t}get parentNode(){return this._$AM.parentNode}get _$AU(){return this._$AM._$AU}u(e){const{el:{content:t},parts:s}=this._$AD,i=(e?.creationScope??U).importNode(t,!0);P.currentNode=i;let n=P.nextNode(),o=0,l=0,r=s[0];for(;r!==void 0;){if(o===r.index){let h;r.type===2?h=new J(n,n.nextSibling,this,e):r.type===1?h=new r.ctor(n,r.name,r.strings,this,e):r.type===6&&(h=new Pt(n,this,e)),this._$AV.push(h),r=s[++l]}o!==r?.index&&(n=P.nextNode(),o++)}return P.currentNode=U,i}p(e){let t=0;for(const s of this._$AV)s!==void 0&&(s.strings!==void 0?(s._$AI(e,s,t),t+=s.strings.length-2):s._$AI(e[t])),t++}}class J{get _$AU(){return this._$AM?._$AU??this._$Cv}constructor(e,t,s,i){this.type=2,this._$AH=x,this._$AN=void 0,this._$AA=e,this._$AB=t,this._$AM=s,this.options=i,this._$Cv=i?.isConnected??!0}get parentNode(){let e=this._$AA.parentNode;const t=this._$AM;return t!==void 0&&e?.nodeType===11&&(e=t.parentNode),e}get startNode(){return this._$AA}get endNode(){return this._$AB}_$AI(e,t=this){e=H(this,e,t),q(e)?e===x||e==null||e===""?(this._$AH!==x&&this._$AR(),this._$AH=x):e!==this._$AH&&e!==D&&this._(e):e._$litType$!==void 0?this.$(e):e.nodeType!==void 0?this.T(e):Et(e)?this.k(e):this._(e)}O(e){return this._$AA.parentNode.insertBefore(e,this._$AB)}T(e){this._$AH!==e&&(this._$AR(),this._$AH=this.O(e))}_(e){this._$AH!==x&&q(this._$AH)?this._$AA.nextSibling.data=e:this.T(U.createTextNode(e)),this._$AH=e}$(e){const{values:t,_$litType$:s}=e,i=typeof s=="number"?this._$AC(e):(s.el===void 0&&(s.el=Z.createElement(De(s.h,s.h[0]),this.options)),s);if(this._$AH?._$AD===i)this._$AH.p(t);else{const n=new Tt(i,this),o=n.u(this.options);n.p(t),this.T(o),this._$AH=n}}_$AC(e){let t=Re.get(e.strings);return t===void 0&&Re.set(e.strings,t=new Z(e)),t}k(e){ye(this._$AH)||(this._$AH=[],this._$AR());const t=this._$AH;let s,i=0;for(const n of e)i===t.length?t.push(s=new J(this.O(Y()),this.O(Y()),this,this.options)):s=t[i],s._$AI(n),i++;i<t.length&&(this._$AR(s&&s._$AB.nextSibling,i),t.length=i)}_$AR(e=this._$AA.nextSibling,t){for(this._$AP?.(!1,!0,t);e!==this._$AB;){const s=e.nextSibling;e.remove(),e=s}}setConnected(e){this._$AM===void 0&&(this._$Cv=e,this._$AP?.(e))}}class ae{get tagName(){return this.element.tagName}get _$AU(){return this._$AM._$AU}constructor(e,t,s,i,n){this.type=1,this._$AH=x,this._$AN=void 0,this.element=e,this.name=t,this._$AM=i,this.options=n,s.length>2||s[0]!==""||s[1]!==""?(this._$AH=Array(s.length-1).fill(new String),this.strings=s):this._$AH=x}_$AI(e,t=this,s,i){const n=this.strings;let o=!1;if(n===void 0)e=H(this,e,t,0),o=!q(e)||e!==this._$AH&&e!==D,o&&(this._$AH=e);else{const l=e;let r,h;for(e=n[0],r=0;r<n.length-1;r++)h=H(this,l[s+r],t,r),h===D&&(h=this._$AH[r]),o||=!q(h)||h!==this._$AH[r],h===x?e=x:e!==x&&(e+=(h??"")+n[r+1]),this._$AH[r]=h}o&&!i&&this.j(e)}j(e){e===x?this.element.removeAttribute(this.name):this.element.setAttribute(this.name,e??"")}}class It extends ae{constructor(){super(...arguments),this.type=3}j(e){this.element[this.name]=e===x?void 0:e}}class Mt extends ae{constructor(){super(...arguments),this.type=4}j(e){this.element.toggleAttribute(this.name,!!e&&e!==x)}}class Rt extends ae{constructor(e,t,s,i,n){super(e,t,s,i,n),this.type=5}_$AI(e,t=this){if((e=H(this,e,t,0)??x)===D)return;const s=this._$AH,i=e===x&&s!==x||e.capture!==s.capture||e.once!==s.once||e.passive!==s.passive,n=e!==x&&(s===x||i);i&&this.element.removeEventListener(this.name,this,s),n&&this.element.addEventListener(this.name,this,e),this._$AH=e}handleEvent(e){typeof this._$AH=="function"?this._$AH.call(this.options?.host??this.element,e):this._$AH.handleEvent(e)}}class Pt{constructor(e,t,s){this.element=e,this.type=6,this._$AN=void 0,this._$AM=t,this.options=s}get _$AU(){return this._$AM._$AU}_$AI(e){H(this,e)}}const Ft=ge.litHtmlPolyfillSupport;Ft?.(Z,J),(ge.litHtmlVersions??=[]).push("3.3.1");const He=(a,e,t)=>{const s=t?.renderBefore??e;let i=s._$litPart$;if(i===void 0){const n=t?.renderBefore??null;s._$litPart$=i=new J(e.insertBefore(Y(),n),n,void 0,t??{})}return i._$AI(a),i};/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */const be=globalThis;class w extends z{constructor(){super(...arguments),this.renderOptions={host:this},this._$Do=void 0}createRenderRoot(){const e=super.createRenderRoot();return this.renderOptions.renderBefore??=e.firstChild,e}update(e){const t=this.render();this.hasUpdated||(this.renderOptions.isConnected=this.isConnected),super.update(e),this._$Do=He(t,this.renderRoot,this.renderOptions)}connectedCallback(){super.connectedCallback(),this._$Do?.setConnected(!0)}disconnectedCallback(){super.disconnectedCallback(),this._$Do?.setConnected(!1)}render(){return D}}w._$litElement$=!0,w.finalized=!0,be.litElementHydrateSupport?.({LitElement:w});const jt=be.litElementPolyfillSupport;jt?.({LitElement:w});(be.litElementVersions??=[]).push("4.2.1");/**
 * @license
 * Copyright 2021 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */function*ne(a,e){if(a!==void 0){let t=0;for(const s of a)yield e(s,t++)}}function G(a){return a===" "?"SPACE":a.startsWith("arrow")?a.replace("arrow","").toUpperCase():a.toUpperCase()}function Ne(a=0){const e=Math.floor(a/60),t=a%60,s=Math.floor(t),i=Math.floor((t-s)*1e3);return`${e.toString().padStart(2,"0")}:${s.toString().padStart(2,"0")}.${i.toString().padStart(3,"0")}`}class Ut extends w{static properties={fontRenderer:{type:Object},text:{type:String},scale:{type:Number},color:{type:String},outlineColor:{type:String},outlineWidth:{type:Number},align:{type:String}};constructor(){super(),this.text="",this.scale=1,this.color="white",this.outlineColor=null,this.outlineWidth=1,this.align="left"}updated(e){super.updated(e),!(!this.fontRenderer||!this.shadowRoot)&&this.renderCanvas()}renderCanvas(){const e=this.shadowRoot.querySelector("#container");if(!e)return;const t=this.fontRenderer.renderTextToCanvas(this.text,{scale:this.scale,color:this.color,outlineColor:this.outlineColor,outlineWidth:this.outlineWidth,align:this.align});t&&(t.style.imageRendering="pixelated",e.innerHTML="",e.appendChild(t))}render(){return f`<div id="container"></div>`}}customElements.define("bitmap-text",Ut);class Ot extends w{static styles=A`
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
  `;static properties={action:{type:String},currentKey:{type:String},isRemapping:{type:Boolean,state:!0},fontRenderer:{type:Object}};constructor(){super(),this.isRemapping=!1}connectedCallback(){super.connectedCallback(),window.addEventListener("keydown",this._handleGlobalKeydown)}disconnectedCallback(){super.disconnectedCallback(),window.removeEventListener("keydown",this._handleGlobalKeydown)}_handleGlobalKeydown=e=>{if(!this.isRemapping)return;e.preventDefault(),e.stopPropagation();const t=e.key.toLowerCase();this.dispatchEvent(new CustomEvent("keybind-changed",{detail:{action:this.action,newKey:t},bubbles:!0,composed:!0})),this.isRemapping=!1};_startRemap(e){e.stopPropagation(),this.isRemapping=!0,c.publish("playSound",{key:"button_click",volume:.8,channel:"UI"})}render(){const e=this.isRemapping?"Press key...":G(this.currentKey);return f`
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
    `}}customElements.define("keybind-display",Ot);class zt extends w{static styles=A`
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
  `;static properties={keybinds:{type:Object},soundSettings:{type:Object},fontRenderer:{type:Object}};_dispatchClose(){c.publish("playSound",{key:"button_click",volume:.8,channel:"UI"}),this.dispatchEvent(new CustomEvent("close-modal",{bubbles:!0,composed:!0}))}_toggleSound(){c.publish("playSound",{key:"button_click",volume:.8,channel:"UI"}),c.publish("toggleSound")}_setVolume(e){const t=parseFloat(e.target.value);c.publish("setSoundVolume",{volume:t})}_testSound(){c.publish("playSound",{key:"jump",volume:.8,channel:"UI"})}render(){if(!this.keybinds||!this.soundSettings||!this.fontRenderer)return f``;const e=Object.keys(this.keybinds);return f`
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
              ${ne(e,t=>f`
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
    `}}customElements.define("settings-menu",zt);class Dt extends w{static styles=A`
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
  `;static properties={stats:{type:Object},fontRenderer:{type:Object}};constructor(){super(),this.stats={collectedFruits:0,totalFruits:0,deathCount:0,levelTime:0}}_dispatch(e){this.dispatchEvent(new CustomEvent(e,{bubbles:!0,composed:!0}))}render(){return f`
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
            <bitmap-text .fontRenderer=${this.fontRenderer} text="Time: ${Ne(this.stats.levelTime)}" scale="1.8"></bitmap-text>
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
    `}}customElements.define("pause-modal",Dt);class Ht extends w{static styles=A`
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
  `;static properties={gameState:{type:Object},fontRenderer:{type:Object}};_dispatchClose(){c.publish("playSound",{key:"button_click",volume:.8,channel:"UI"}),this.dispatchEvent(new CustomEvent("close-modal",{bubbles:!0,composed:!0}))}_selectLevel(e,t){this.dispatchEvent(new CustomEvent("level-selected",{detail:{sectionIndex:e,levelIndex:t},bubbles:!0,composed:!0}))}render(){return this.gameState?f`
      <div class="modal-overlay" @click=${this._dispatchClose}>
        <div class="modal-content" @click=${e=>e.stopPropagation()}>
          <button class="close-button" @click=${this._dispatchClose}></button>
          <div class="title-container">
            <bitmap-text .fontRenderer=${this.fontRenderer} text="Levels Menu" scale="3" outlineColor="black" outlineWidth="2"></bitmap-text>
          </div>
          <div id="level-selection-container">
            ${ne(T,(e,t)=>f`
              <div class="level-section-menu">
                <div class="section-title-container">
                  <bitmap-text .fontRenderer=${this.fontRenderer} text=${e.name} scale="2"></bitmap-text>
                </div>
                <div class="level-grid">
                  ${ne(e.levels,(s,i)=>{const n=this.gameState.isLevelUnlocked(t,i),o=this.gameState.isLevelCompleted(t,i),l=this.gameState.currentSection===t&&this.gameState.currentLevelIndex===i,r=`level-button ${o?"completed":""} ${l?"current":""} ${n?"":"locked"}`;return n?f`<button class=${r} @click=${()=>this._selectLevel(t,i)}>${i+1}</button>`:f`<button class=${r} disabled>
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zM9 8V6c0-1.66 1.34-3 3-3s3 1.34 3 3v2H9z"></path></svg>
                         </button>`})}
                </div>
              </div>
            `)}
          </div>
        </div>
      </div>
    `:f``}}customElements.define("levels-menu",Ht);class Nt extends w{static styles=A`
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
  `;static properties={characterId:{type:String},idleSprite:{type:Object},isLocked:{type:Boolean},isSelected:{type:Boolean},fontRenderer:{type:Object}};constructor(){super(),this.animationFrameId=null,this.animState={frame:0,timer:0,lastTime:0}}connectedCallback(){super.connectedCallback(),this.animationFrameId=requestAnimationFrame(this._animatePreview)}disconnectedCallback(){super.disconnectedCallback(),this.animationFrameId&&cancelAnimationFrame(this.animationFrameId)}_animatePreview=e=>{const t=this.shadowRoot.querySelector(".char-canvas");if(!t||!this.idleSprite){this.animationFrameId=requestAnimationFrame(this._animatePreview);return}this.animState.lastTime===0&&(this.animState.lastTime=e);const s=(e-this.animState.lastTime)/1e3;this.animState.lastTime=e,this.animState.timer+=s;const i=.08,n=11,o=this.idleSprite.width/n;if(this.animState.timer>=i){this.animState.timer=0,this.animState.frame=(this.animState.frame+1)%n;const l=t.getContext("2d");l.clearRect(0,0,t.width,t.height),l.drawImage(this.idleSprite,this.animState.frame*o,0,o,this.idleSprite.height,0,0,t.width,t.height)}this.animationFrameId=requestAnimationFrame(this._animatePreview)};_handleSelect(){this.isLocked||this.isSelected||this.dispatchEvent(new CustomEvent("character-selected",{detail:{characterId:this.characterId},bubbles:!0,composed:!0}))}render(){const e=K[this.characterId],t=`character-card ${this.isLocked?"locked":""} ${this.isSelected?"selected":""}`,s=this.isLocked?"Locked":this.isSelected?"Selected":"Select";return f`
      <div class=${t}>
        <canvas class="char-canvas" width="64" height="64"></canvas>
        <div class="char-name-container">
            <bitmap-text .fontRenderer=${this.fontRenderer} .text=${e.name} scale="2"></bitmap-text>
        </div>
        <div class="char-unlock-container">
          ${this.isLocked?f`
                <bitmap-text .fontRenderer=${this.fontRenderer} text="Complete ${e.unlockRequirement} levels" scale="1.5" color="#ccc"></bitmap-text>
                <bitmap-text .fontRenderer=${this.fontRenderer} text="to unlock" scale="1.5" color="#ccc"></bitmap-text>
              `:f`<bitmap-text .fontRenderer=${this.fontRenderer} text="Available" scale="1.5" color="#ccc"></bitmap-text>`}
        </div>
        <button class="select-button" @click=${this._handleSelect} ?disabled=${this.isLocked||this.isSelected}>
          <bitmap-text .fontRenderer=${this.fontRenderer} .text=${s} scale="1.8"></bitmap-text>
        </button>
      </div>
    `}}customElements.define("character-card",Nt);class Bt extends w{static styles=A`
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
  `;static properties={gameState:{type:Object},assets:{type:Object},fontRenderer:{type:Object}};_dispatchClose(){c.publish("playSound",{key:"button_click",volume:.8,channel:"UI"}),this.dispatchEvent(new CustomEvent("close-modal",{bubbles:!0,composed:!0}))}render(){if(!this.gameState||!this.assets)return f`<div class="modal-overlay">Loading...</div>`;const e=Object.keys(K);return f`
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
                    ${ne(e,t=>f`
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
    `}}customElements.define("character-menu",Bt);class Wt extends w{static styles=A`
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
  `;static properties={keybinds:{type:Object},fontRenderer:{type:Object}};_dispatchClose(){c.publish("playSound",{key:"button_click",volume:.8,channel:"UI"}),this.dispatchEvent(new CustomEvent("close-modal",{bubbles:!0,composed:!0}))}render(){return this.keybinds?f`
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
                        <bitmap-text .fontRenderer=${this.fontRenderer} text=${G(this.keybinds.moveLeft)} scale="1.5"></bitmap-text>
                    </div>
                    <span>/</span>
                    <div class="key-display">
                        <bitmap-text .fontRenderer=${this.fontRenderer} text=${G(this.keybinds.moveRight)} scale="1.5"></bitmap-text>
                    </div>
                  </div>
                </div>

                <div class="keybind-item">
                  <label>Jump / Double Jump / Wall Jump:</label>
                  <div class="key-display">
                    <bitmap-text .fontRenderer=${this.fontRenderer} text=${G(this.keybinds.jump)} scale="1.5"></bitmap-text>
                  </div>
                </div>

                <div class="keybind-item">
                  <label>Dash:</label>
                  <div class="key-display">
                    <bitmap-text .fontRenderer=${this.fontRenderer} text=${G(this.keybinds.dash)} scale="1.5"></bitmap-text>
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
    `:f``}}customElements.define("info-modal",Wt);class Gt extends w{static styles=A`
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
  `;static properties={stats:{type:Object},hasNextLevel:{type:Boolean},hasPreviousLevel:{type:Boolean},fontRenderer:{type:Object}};_dispatch(e){this.dispatchEvent(new CustomEvent(e))}render(){return this.stats?f`
      <div class="modal-overlay">
        <div class="modal-content">
          <div class="title-container">
            <bitmap-text .fontRenderer=${this.fontRenderer} text="Level Complete!" scale="3" outlineColor="black" outlineWidth="2"></bitmap-text>
          </div>
          <div class="stats-container">
            <bitmap-text .fontRenderer=${this.fontRenderer} text="Deaths: ${this.stats.deaths}" scale="1.8"></bitmap-text>
            <bitmap-text .fontRenderer=${this.fontRenderer} text="Time: ${Ne(this.stats.time)}" scale="1.8"></bitmap-text>
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
    `:f``}}customElements.define("level-complete-modal",Gt);class Kt extends w{static styles=A`
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
  `;static properties={activeModal:{type:String,state:!0},gameHasStarted:{type:Boolean,state:!0},keybinds:{type:Object,state:!0},soundSettings:{type:Object,state:!0},currentStats:{type:Object,state:!0},gameState:{type:Object,state:!0},assets:{type:Object,state:!0},fontRenderer:{type:Object},levelCompleteStats:{type:Object,state:!0}};constructor(){super(),this.activeModal="main-menu",this.gameHasStarted=!1,this.keybinds={moveLeft:"a",moveRight:"d",jump:"w",dash:" "},this.soundSettings={soundEnabled:!0,soundVolume:.5},this.currentStats={},this.gameState=null,this.assets=null,this.fontRenderer=null,this.levelCompleteStats=null}connectedCallback(){super.connectedCallback(),c.subscribe("requestStartGame",this._handleStartGame),c.subscribe("soundSettingsChanged",this._handleSoundUpdate),c.subscribe("keybindsUpdated",this._handleKeybindsUpdate),c.subscribe("ui_button_clicked",this._handleUIButtonClick),c.subscribe("statsUpdated",this._handleStatsUpdate),c.subscribe("action_escape_pressed",this._handleEscapePress),c.subscribe("levelLoaded",this._handleLevelLoad),c.subscribe("gameStateUpdated",e=>this.gameState=e),c.subscribe("assetsLoaded",e=>this.assets=e),c.subscribe("levelComplete",e=>this.levelCompleteStats=e)}disconnectedCallback(){super.disconnectedCallback(),c.unsubscribe("requestStartGame",this._handleStartGame),c.unsubscribe("soundSettingsChanged",this._handleSoundUpdate),c.unsubscribe("keybindsUpdated",this._handleKeybindsUpdate),c.unsubscribe("ui_button_clicked",this._handleUIButtonClick),c.unsubscribe("statsUpdated",this._handleStatsUpdate),c.unsubscribe("action_escape_pressed",this._handleEscapePress),c.unsubscribe("levelLoaded",this._handleLevelLoad),c.unsubscribe("gameStateUpdated",e=>this.gameState=e),c.unsubscribe("assetsLoaded",e=>this.assets=e),c.unsubscribe("levelComplete",e=>this.levelCompleteStats=e)}_handleLevelLoad=({gameState:e})=>{this.gameState=e,this.levelCompleteStats=null,this.gameHasStarted||(this.gameHasStarted=!0),this.activeModal=null};_handleStartGame=()=>{this.gameHasStarted=!0,this.activeModal=null,c.publish("allMenusClosed")};_handleSoundUpdate=e=>{this.soundSettings={...e}};_handleKeybindsUpdate=e=>{this.keybinds={...e}};_handleStatsUpdate=e=>{this.currentStats={...e}};_handleUIButtonClick=({buttonId:e})=>{e==="pause"?this.activeModal?this._closeModal():this.gameHasStarted&&(this.activeModal="pause",c.publish("menuOpened")):(this.activeModal=e,c.publish("menuOpened"))};_handleEscapePress=()=>{this.levelCompleteStats||(this.activeModal?this._closeModal():this.gameHasStarted&&(this.activeModal="pause",c.publish("menuOpened")))};_handleKeybindChange=e=>{const{action:t,newKey:s}=e.detail,i={...this.keybinds,[t]:s};c.publish("keybindsUpdated",i)};_closeModal=()=>{const e=this.activeModal!==null;this.activeModal=this.gameHasStarted?null:"main-menu",e&&this.gameHasStarted&&c.publish("allMenusClosed")};_openModalFromMenu(e){c.publish("playSound",{key:"button_click",volume:.8,channel:"UI"}),this.activeModal=e}_handleRestart(){this._closeModal(),c.publish("requestLevelRestart")}_handleOpenLevelsMenu(){this.activeModal="levels"}_handleLevelSelected(e){const{sectionIndex:t,levelIndex:s}=e.detail;c.publish("requestLevelLoad",{sectionIndex:t,levelIndex:s})}_handleCharacterSelected(e){const{characterId:t}=e.detail,s=this.gameState.setSelectedCharacter(t);s!==this.gameState&&(this.gameState=s,c.publish("gameStateUpdated",this.gameState)),c.publish("playSound",{key:"button_click",volume:.8,channel:"UI"}),c.publish("characterUpdated",t)}_handleLevelAction(e){this.levelCompleteStats=null,e==="restart"?c.publish("requestLevelRestart"):e==="next"?c.publish("requestNextLevel"):e==="previous"&&c.publish("requestPreviousLevel")}render(){return this.levelCompleteStats?f`
        <level-complete-modal
          .stats=${this.levelCompleteStats}
          .hasNextLevel=${this.levelCompleteStats.hasNextLevel}
          .hasPreviousLevel=${this.levelCompleteStats.hasPreviousLevel}
          .fontRenderer=${this.fontRenderer}
          @next-level=${()=>this._handleLevelAction("next")}
          @restart-level=${()=>this._handleLevelAction("restart")}
          @previous-level=${()=>this._handleLevelAction("previous")}
        ></level-complete-modal>
      `:this.gameHasStarted?this.renderActiveModal():f`
        <div class="main-menu-overlay">
          ${this.activeModal==="main-menu"?this.renderMainMenuContent():this.renderActiveModal()}
        </div>
      `}renderMainMenuContent(){const e=[{text:"Start Game",action:()=>c.publish("requestStartGame")},{text:"Levels",action:()=>this._openModalFromMenu("levels")},{text:"Character",action:()=>this._openModalFromMenu("character")},{text:"Settings",action:()=>this._openModalFromMenu("settings")}];return f`
      <div class="main-menu-container">
        <bitmap-text
          .fontRenderer=${this.fontRenderer} text="Parkour Hero" scale="9" outlineColor="black" outlineWidth="2"
        ></bitmap-text>
        <div class="main-menu-buttons">
          ${e.map(t=>f`
            <button @click=${t.action}>
              <bitmap-text .fontRenderer=${this.fontRenderer} text=${t.text} scale="2.5" outlineColor="#004a99" outlineWidth="1"></bitmap-text>
            </button>
          `)}
        </div>
      </div>
    `}renderActiveModal(){switch(this.activeModal){case"settings":return f`<settings-menu 
                      .keybinds=${this.keybinds} .soundSettings=${this.soundSettings} .fontRenderer=${this.fontRenderer}
                      @close-modal=${this._closeModal} @keybind-changed=${this._handleKeybindChange}
                    ></settings-menu>`;case"pause":return f`<pause-modal
                      .stats=${this.currentStats} .fontRenderer=${this.fontRenderer}
                      @resume-game=${this._closeModal} @restart-level=${this._handleRestart} @open-levels-menu=${this._handleOpenLevelsMenu}
                    ></pause-modal>`;case"levels":return f`<levels-menu
                      .gameState=${this.gameState} .fontRenderer=${this.fontRenderer}
                      @close-modal=${this._closeModal} @level-selected=${this._handleLevelSelected}
                    ></levels-menu>`;case"character":return f`<character-menu
                      .gameState=${this.gameState} .assets=${this.assets} .fontRenderer=${this.fontRenderer}
                      @close-modal=${this._closeModal} @character-selected=${this._handleCharacterSelected}
                    ></character-menu>`;case"info":return f`<info-modal
                      .keybinds=${this.keybinds}
                      .fontRenderer=${this.fontRenderer}
                      @close-modal=${this._closeModal}
                    ></info-modal>`;default:return f``}}}customElements.define("parkour-hero-ui",Kt);const Pe=document.getElementById("ui-root");Pe?He(document.createElement("parkour-hero-ui"),Pe):console.error("UI Root element #ui-root not found. UI cannot be initialized.");const y=document.getElementById("gameCanvas"),m=y.getContext("2d");if(!y||!m)throw console.error("Canvas not found or context not available"),document.body.innerHTML="<h1>Error: Canvas not supported</h1>",new Error("Canvas not available");m.imageSmoothingEnabled=!1;const Be=1920,We=1080;y.width=Be;y.height=We;console.log(`Canvas initialized: ${Be}x${We}`);function Ge(){try{const a=1.7777777777777777,e=window.innerWidth/window.innerHeight;let t,s;e>a?(s=window.innerHeight,t=s*a):(t=window.innerWidth,s=t/a);const i=Math.floor(t),n=Math.floor(s);y.style.width=`${i}px`,y.style.height=`${n}px`,y.style.position="absolute",y.style.left=`${(window.innerWidth-i)/2}px`,y.style.top=`${(window.innerHeight-n)/2}px`,console.log(`Canvas resized to: ${i}x${n} (display size)`)}catch(a){console.error("Error resizing canvas:",a)}}window.addEventListener("resize",Ge);Ge();function Vt(){m.fillStyle="#222",m.fillRect(0,0,y.width,y.height),m.fillStyle="white",m.font="24px sans-serif",m.textAlign="center",m.fillText("Loading Assets...",y.width/2,y.height/2);const a=300,e=20,t=(y.width-a)/2,s=y.height/2+30;m.strokeStyle="white",m.lineWidth=2,m.strokeRect(t,s,a,e),m.fillStyle="#4CAF50",m.fillRect(t,s,a*.1,e)}Vt();let Xt={moveLeft:"a",moveRight:"d",jump:"w",dash:" "},k,Yt;pt().then(a=>{console.log("Assets loaded successfully, preparing main menu...");try{const e=new ft(a.font_spritesheet);k=new ct(m,y,a,Xt,e),c.publish("assetsLoaded",a);const t=document.querySelector("parkour-hero-ui");t&&(t.fontRenderer=e),Yt=new mt,c.subscribe("requestStartGame",()=>{k.start()}),window.unlockAllLevels=()=>{k&&k.gameState&&(k.gameState.unlockAllLevels(),c.publish("gameStateUpdated",k.gameState))},console.log("Developer command available: Type `unlockAllLevels()` in the console to unlock all levels."),window.resetProgress=()=>{k&&k.gameState&&(k.gameState.resetProgress(),k.loadLevel(0,0),console.log("Game reset to Level 1."),c.publish("gameStateUpdated",k.gameState))},console.log("Developer command available: Type `resetProgress()` in the console to reset all saved data."),console.log("Game is ready. Waiting for user to start from the main menu.")}catch(e){console.error("Failed to start game engine:",e),m.fillStyle="#222",m.fillRect(0,0,y.width,y.height),m.fillStyle="red",m.font="24px sans-serif",m.textAlign="center",m.fillText("Game Failed to Start",y.width/2,y.height/2-20),m.fillStyle="white",m.font="16px sans-serif",m.fillText("Check console for details",y.width/2,y.height/2+20)}}).catch(a=>{console.error("Asset loading failed:",a),m.fillStyle="#222",m.fillRect(0,0,y.width,y.height),m.fillStyle="red",m.font="24px sans-serif",m.textAlign="center",m.fillText("Failed to Load Assets",y.width/2,y.height/2-20),m.fillStyle="white",m.font="16px sans-serif",m.fillText("Check console for details",y.width/2,y.height/2+20)});window.addEventListener("error",a=>{console.error("Global error:",a.error)});window.addEventListener("unhandledrejection",a=>{console.error("Unhandled promise rejection:",a.reason)});console.log("Game initialization started");console.log("Canvas dimensions:",y.width,"x",y.height);console.log("Device pixel ratio:",window.devicePixelRatio);console.log("User agent:",navigator.userAgent);
