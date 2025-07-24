(function(){const t=document.createElement("link").relList;if(t&&t.supports&&t.supports("modulepreload"))return;for(const s of document.querySelectorAll('link[rel="modulepreload"]'))i(s);new MutationObserver(s=>{for(const n of s)if(n.type==="childList")for(const a of n.addedNodes)a.tagName==="LINK"&&a.rel==="modulepreload"&&i(a)}).observe(document,{childList:!0,subtree:!0});function e(s){const n={};return s.integrity&&(n.integrity=s.integrity),s.referrerPolicy&&(n.referrerPolicy=s.referrerPolicy),s.crossOrigin==="use-credentials"?n.credentials="include":s.crossOrigin==="anonymous"?n.credentials="omit":n.credentials="same-origin",n}function i(s){if(s.ep)return;s.ep=!0;const n=e(s);fetch(s.href,n)}})();class C{constructor(t=0,e=0){this.x=t,this.y=e}}class A{constructor({type:t="dynamic",solid:e=!1,hazard:i=!1,width:s,height:n,isGrounded:a=!1,isAgainstWall:o=!1,groundType:r=null}){this.type=t,this.solid=e,this.hazard=i,this.width=s,this.height=n,this.isGrounded=a,this.isAgainstWall=o,this.groundType=r}}class ne{constructor(t,e){this.zoom=1.8,this.viewportWidth=t,this.viewportHeight=e,this.width=this.viewportWidth/this.zoom,this.height=this.viewportHeight/this.zoom,this.levelWidth=this.width,this.levelHeight=this.height,this.followSpeed=5,this.deadZone={x:this.width*.2,y:this.height*.2},this.minX=0,this.maxX=0,this.minY=0,this.maxY=0,this.shakeTimer=0,this.shakeIntensity=0,this.shakeInitialIntensity=0,this.shakeDuration=0,this.shakeX=0,this.shakeY=0,this.targetX=0,this.targetY=0,console.log("Camera initialized:",{viewport:`${this.viewportWidth}x${this.viewportHeight}`,zoom:this.zoom,worldView:`${this.width}x${this.height}`})}update(t,e,i){if(e===null)return;const s=t.getComponent(e,C),n=t.getComponent(e,A);if(!s||!n)return;const a=this.x+this.width/2,o=this.y+this.height/2,r=s.x+n.width/2,l=s.y+n.height/2,d=r-a,u=l-o;let p=0,y=0;Math.abs(d)>this.deadZone.x&&(p=d>0?d-this.deadZone.x:d+this.deadZone.x),Math.abs(u)>this.deadZone.y&&(y=u>0?u-this.deadZone.y:u+this.deadZone.y),this.targetX=this.x+p,this.targetY=this.y+y,this.x+=(this.targetX-this.x)*this.followSpeed*i,this.y+=(this.targetY-this.y)*this.followSpeed*i,this.x=Math.max(this.minX,Math.min(this.maxX,this.x)),this.y=Math.max(this.minY,Math.min(this.maxY,this.y)),this.updateShake(i)}updateShake(t){if(this.shakeTimer>0){this.shakeTimer-=t,this.shakeX=(Math.random()-.5)*this.shakeIntensity,this.shakeY=(Math.random()-.5)*this.shakeIntensity;const e=this.shakeInitialIntensity/this.shakeDuration;this.shakeIntensity=Math.max(0,this.shakeIntensity-e*t),this.shakeTimer<=0&&(this.shakeX=0,this.shakeY=0,this.shakeIntensity=0)}}shake(t=10,e=.3){this.shakeTimer=e,this.shakeDuration=e,this.shakeIntensity=t,this.shakeInitialIntensity=t}apply(t){t.save(),t.scale(this.zoom,this.zoom),t.translate(-Math.round(this.x+this.shakeX),-Math.round(this.y+this.shakeY))}restore(t){t.restore()}snapToPlayer(t,e){if(e===null)return;const i=t.getComponent(e,C),s=t.getComponent(e,A);!i||!s||this.centerOn(i.x+s.width/2,i.y+s.height/2)}centerOn(t,e){this.x=t-this.width/2,this.y=e-this.height/2,this.x=Math.max(this.minX,Math.min(this.maxX,this.x)),this.y=Math.max(this.minY,Math.min(this.maxY,this.y)),this.targetX=this.x,this.targetY=this.y}updateLevelBounds(t,e){this.levelWidth=t,this.levelHeight=e,this.maxX=Math.max(0,this.levelWidth-this.width),this.maxY=Math.max(0,this.levelHeight-this.height),this.x=Math.max(this.minX,Math.min(this.maxX,this.x)),this.y=Math.max(this.minY,Math.min(this.maxY,this.y))}isVisible(t,e,i=0,s=0){return t+i>this.x&&t<this.x+this.width&&e+s>this.y&&e<this.y+this.height}isRectVisible(t){return this.isVisible(t.x,t.y,t.width,t.height)}setFollowSpeed(t){this.followSpeed=Math.max(.1,t)}setDeadZone(t,e){this.deadZone.x=this.width*Math.max(0,Math.min(.5,t)),this.deadZone.y=this.height*Math.max(0,Math.min(.5,e))}}class ae{constructor(){this.events={}}subscribe(t,e){this.events[t]||(this.events[t]=new Set),this.events[t].add(e)}unsubscribe(t,e){this.events[t]&&this.events[t].delete(e)}publish(t,e){this.events[t]&&this.events[t].forEach(i=>{try{i(e)}catch(s){console.error(`Error in event bus callback for event: ${t}`,s)}})}}const c=new ae;class oe{constructor(){this.sounds={},this.soundPool={},this.poolSize=5,this.channels={SFX:new Set,UI:new Set,Music:new Set},this.audioContext=null,this.audioUnlocked=!1,this.settings={enabled:!0,volume:.5},this.loadSettings(),this._setupEventSubscriptions()}_setupEventSubscriptions(){c.subscribe("playSound",t=>this.play(t)),c.subscribe("startSoundLoop",t=>this.playLoop(t)),c.subscribe("stopSoundLoop",({key:t})=>this.stopLoop(t)),c.subscribe("toggleSound",()=>this.toggleSound()),c.subscribe("setSoundVolume",({volume:t})=>this.setVolume(t))}loadSettings(){this.settings.enabled=!0,this.settings.volume=.5}saveSettings(){}loadSounds(t){["button_click","jump","double_jump","collect","level_complete","trophy_activated","death_sound","dash","checkpoint_activated","hit","sand_walk","mud_run","ice_run","trampoline_bounce","fire_activated","arrow_pop","fan_blowing","rh_slam","sh_slam"].forEach(i=>{if(t[i]){this.sounds[i]=t[i],this.soundPool[i]=[];for(let s=0;s<this.poolSize;s++)this.soundPool[i].push(this.sounds[i].cloneNode(!0))}else console.warn(`Sound asset ${i} not found in assets`)})}async play({key:t,volumeMultiplier:e=1,channel:i="SFX"}){if(!this.settings.enabled||!this.sounds[t]||!this.channels[i])return;this.audioUnlocked||await this.unlockAudio();const s=this.soundPool[t];if(!s){console.warn(`Sound pool for ${t} not found.`);return}const n=s.find(a=>a.paused||a.ended);if(n){n.volume=Math.max(0,Math.min(1,this.settings.volume*e)),n.currentTime=0,this.channels[i].add(n),n.onended=()=>{this.channels[i].delete(n),n.onended=null};try{await n.play()}catch(a){a.name!=="AbortError"&&console.error(`Audio pool play failed for ${t}:`,a),this.channels[i].delete(n)}}else console.warn(`Sound pool for ${t} was depleted. No sound played.`)}async playLoop({key:t,volumeMultiplier:e=1,channel:i="SFX"}){if(!(!this.settings.enabled||!this.sounds[t]||!this.channels[i])&&!Array.from(this.channels[i]).some(s=>s.src===this.sounds[t].src)){this.audioUnlocked||await this.unlockAudio();try{const s=this.sounds[t].cloneNode(!0);s.volume=Math.max(0,Math.min(1,this.settings.volume*e)),s.loop=!0,await s.play(),this.channels[i].add(s)}catch(s){console.error(`Failed to play looping sound ${t}:`,s)}}}stopLoop(t){const e=this.sounds[t]?.src;if(e)for(const i in this.channels)this.channels[i].forEach(s=>{s.src===e&&s.loop&&(s.pause(),s.currentTime=0,this.channels[i].delete(s))})}stopAll({except:t=[]}={}){for(const e in this.channels)t.includes(e)||(this.channels[e].forEach(i=>{i.pause(),i.currentTime=0}),this.channels[e].clear())}async unlockAudio(){if(!this.audioUnlocked){if(!this.audioContext)try{const t=window.AudioContext||window.webkitAudioContext;t&&(this.audioContext=new t)}catch(t){console.error("Failed to create AudioContext",t);return}this.audioContext.state==="suspended"&&await this.audioContext.resume().catch(t=>console.error("Failed to resume AudioContext",t)),this.audioContext.state==="running"&&(this.audioUnlocked=!0)}}setVolume(t){this.settings.volume=Math.max(0,Math.min(1,t));for(const e in this.channels)this.channels[e].forEach(i=>{i.volume=this.settings.volume});this.saveSettings(),c.publish("soundSettingsChanged",{soundEnabled:this.settings.enabled,soundVolume:this.settings.volume})}setEnabled(t){this.settings.enabled=t,this.settings.enabled||this.stopAll(),this.saveSettings(),c.publish("soundSettingsChanged",{soundEnabled:this.settings.enabled,soundVolume:this.settings.volume})}toggleSound(){return this.setEnabled(!this.settings.enabled),this.settings.enabled}getSettings(){return{soundEnabled:this.settings.enabled,soundVolume:this.settings.volume,audioUnlocked:this.audioUnlocked}}}class re{constructor(t,e){this.canvas=t,this.fontRenderer=e,this.isVisible=!0,this.stats={levelName:"Loading...",collectedFruits:0,totalFruits:0,deathCount:0,soundEnabled:!0,soundVolume:.5,health:100,maxHealth:100},c.subscribe("statsUpdated",i=>this.updateStats(i))}setVisible(t){this.isVisible=t}updateStats(t){this.stats={...this.stats,...t}}drawGameHUD(t){if(!(!this.isVisible||!this.fontRenderer))try{t.save(),t.setTransform(1,0,0,1,0,0);const{levelName:e,collectedFruits:i,totalFruits:s,deathCount:n,soundEnabled:a,soundVolume:o,health:r,maxHealth:l}=this.stats,d=[`${e}`,`Fruits: ${i}/${s}`,`Deaths: ${n||0}`,`Sound: ${a?"On":"Off"} (${Math.round(o*100)}%)`],u={scale:2.5,align:"center",color:"white",outlineColor:"black",outlineWidth:1};let p=0;d.forEach(vt=>{const dt=this.fontRenderer.getTextWidth(vt,u.scale);dt>p&&(p=dt)});const y=40,m=10,P=10,F=p+y,Q=180;t.fillStyle="rgba(0, 0, 0, 0.5)",t.beginPath(),t.roundRect(m,P,F,Q,10),t.fill();const tt=35,yt=P+25,bt=m+F/2;d.forEach((vt,dt)=>{const se=yt+dt*tt;this.fontRenderer.drawText(t,vt,bt,se,u)});const B=150,K=20,X=m+F+15,G=P;t.fillStyle="rgba(0, 0, 0, 0.7)",t.fillRect(X-2,G-2,B+4,K+4),t.fillStyle="#333",t.fillRect(X,G,B,K);const et=(r||0)/(l||100),ie=B*et;et>.6?t.fillStyle="#4CAF50":et>.3?t.fillStyle="#FFC107":t.fillStyle="#F44336",t.fillRect(X,G,ie,K),this.fontRenderer.drawText(t,"HP",X+B+10,G+K/2-12,{scale:2,align:"left"}),t.restore()}catch(e){console.warn("Error drawing HUD:",e)}}}const at={PinkMan:{name:"Pink Man",unlockRequirement:0},NinjaFrog:{name:"Ninja Frog",unlockRequirement:10},MaskDude:{name:"Mask Dude",unlockRequirement:20},VirtualGuy:{name:"Virtual Guy",unlockRequirement:30}},L=[{name:"Mechanical Mastery",levels:[{name:"Level 1",jsonPath:"/levels/mechanical-mastery/01.json"},{name:"Level 2",jsonPath:"/levels/mechanical-mastery/02.json"},{name:"Level 3",jsonPath:"/levels/mechanical-mastery/03.json"},{name:"Level 4",jsonPath:"/levels/mechanical-mastery/04.json"},{name:"Level 5",jsonPath:"/levels/mechanical-mastery/05.json"},{name:"Level 6",jsonPath:"/levels/mechanical-mastery/06.json"},{name:"Level 7",jsonPath:"/levels/mechanical-mastery/07.json"},{name:"Level 8",jsonPath:"/levels/mechanical-mastery/08.json"},{name:"Level 9",jsonPath:"/levels/mechanical-mastery/09.json"},{name:"Level 10",jsonPath:"/levels/mechanical-mastery/10.json"}]},{name:"Sky High",levels:[{name:"Level 1",jsonPath:"/levels/sky-high/01.json"},{name:"Level 2",jsonPath:"/levels/sky-high/02.json"},{name:"Level 3",jsonPath:"/levels/sky-high/03.json"},{name:"Level 4",jsonPath:"/levels/sky-high/04.json"},{name:"Level 5",jsonPath:"/levels/sky-high/05.json"},{name:"Level 6",jsonPath:"/levels/sky-high/06.json"},{name:"Level 7",jsonPath:"/levels/sky-high/07.json"},{name:"Level 8",jsonPath:"/levels/sky-high/08.json"},{name:"Level 9",jsonPath:"/levels/sky-high/09.json"},{name:"Level 10",jsonPath:"/levels/sky-high/10.json"}]}];function Lt(h,t,e){let i=0;for(let s=0;s<h;s++)i+=e[s].levels.length;return i+=t,i}class pt{constructor(t=null){if(t)this.currentSection=t.currentSection,this.currentLevelIndex=t.currentLevelIndex,this.showingLevelComplete=t.showingLevelComplete,this.levelProgress=t.levelProgress,this.selectedCharacter=t.selectedCharacter,this.levelStats=t.levelStats;else{this.currentSection=0,this.currentLevelIndex=0,this.showingLevelComplete=!1;const e=this.loadProgress();this.levelProgress=e.levelProgress,this.selectedCharacter=e.selectedCharacter,this.levelStats=e.levelStats,this.ensureStatsForAllLevels()}}_clone(){const t=JSON.parse(JSON.stringify(this));return new pt(t)}_getDefaultState(){return{levelProgress:{unlockedLevels:[1],completedLevels:[]},selectedCharacter:"PinkMan",levelStats:{}}}loadProgress(){try{const t=localStorage.getItem("parkourGameState");if(!t)return this._getDefaultState();const e=JSON.parse(t);if(typeof e!="object"||e===null)return this._getDefaultState();const i=e.levelProgress;return typeof i!="object"||i===null||!Array.isArray(i.unlockedLevels)||!Array.isArray(i.completedLevels)?this._getDefaultState():((typeof e.selectedCharacter!="string"||!at[e.selectedCharacter])&&(e.selectedCharacter="PinkMan"),(!e.levelStats||typeof e.levelStats!="object")&&(e.levelStats={}),e)}catch(t){return console.error("Failed to parse game state from localStorage. Resetting to default.",t),this._getDefaultState()}}saveProgress(){try{const t={levelProgress:this.levelProgress,selectedCharacter:this.selectedCharacter,levelStats:this.levelStats};localStorage.setItem("parkourGameState",JSON.stringify(t)),console.log("Progress saved:",t)}catch(t){console.error("Failed to save game state to localStorage",t)}}setSelectedCharacter(t){if(at[t]&&this.selectedCharacter!==t){const e=this._clone();return e.selectedCharacter=t,e.saveProgress(),e}return this}ensureStatsForAllLevels(){L.forEach((t,e)=>{t.levels.forEach((i,s)=>{const n=`${e}-${s}`;this.levelStats[n]||(this.levelStats[n]={fastestTime:null,lowestDeaths:null,totalAttempts:0})})})}incrementAttempts(t,e){const i=`${t}-${e}`;this.levelStats[i]&&(this.levelStats[i].totalAttempts+=1,this.saveProgress())}onLevelComplete(t){const e=this._clone(),i=`${this.currentSection}-${this.currentLevelIndex}`;if(!this.levelProgress.completedLevels.includes(i)){e.levelProgress.completedLevels.push(i);const n=L.reduce((o,r)=>o+r.levels.length,0),a=Lt(this.currentSection,this.currentLevelIndex,L);if(a+1<n){const o=a+2;o>this.levelProgress.unlockedLevels[0]&&(e.levelProgress.unlockedLevels[0]=o)}}const s=e.levelStats[i];return s&&((s.fastestTime===null||t.time<s.fastestTime)&&(s.fastestTime=t.time),(s.lowestDeaths===null||t.deaths<s.lowestDeaths)&&(s.lowestDeaths=t.deaths)),e.showingLevelComplete=!0,e.saveProgress(),c.publish("playSound",{key:"level_complete",volume:1,channel:"UI"}),e}isCharacterUnlocked(t){const e=at[t];return e?this.levelProgress.completedLevels.length>=e.unlockRequirement:!1}isLevelUnlocked(t,e){return Lt(t,e,L)<this.levelProgress.unlockedLevels[0]}isLevelCompleted(t,e){const i=`${t}-${e}`;return this.levelProgress.completedLevels.includes(i)}resetProgress(){try{localStorage.removeItem("parkourGameState");const t=this._getDefaultState();this.levelProgress=t.levelProgress,this.selectedCharacter=t.selectedCharacter,this.levelStats=t.levelStats,this.currentSection=0,this.currentLevelIndex=0,this.ensureStatsForAllLevels()}catch(t){console.error("Failed to reset game state in localStorage",t)}}unlockAllLevels(){const t=L.reduce((e,i)=>e+i.levels.length,0);this.levelProgress.unlockedLevels[0]=t,this.levelProgress.completedLevels=Array.from({length:t},(e,i)=>`temp-${i}`),this.saveProgress()}}const g={WIDTH:32,HEIGHT:32,SPAWN_WIDTH:96,SPAWN_HEIGHT:96,CLING_OFFSET:7,MOVE_SPEED:200,JUMP_FORCE:400,GRAVITY:1200,MAX_FALL_SPEED:600,FALL_DAMAGE_MIN_VELOCITY:525,FALL_DAMAGE_MAX_VELOCITY:650,FALL_DAMAGE_MIN_AMOUNT:8,FALL_DAMAGE_MAX_AMOUNT:20,DASH_SPEED:500,DASH_DURATION:.2,DASH_COOLDOWN:.7,COYOTE_TIME:.1,JUMP_BUFFER_TIME:.15,HIT_STUN_DURATION:.2,SAND_MOVE_MULTIPLIER:.5,MUD_JUMP_MULTIPLIER:.6,ICE_ACCELERATION:800,ICE_FRICTION:400,TRAMPOLINE_BOUNCE_MULTIPLIER:2,ANIMATION_SPEED:.06,SPAWN_ANIMATION_SPEED:.08,HIT_ANIMATION_SPEED:.1,ANIMATION_FRAMES:{idle:11,run:12,double_jump:6,jump:1,fall:1,dash:1,cling:5,spawn:7,despawn:7,hit:7}},S={TILE_SIZE:48},k={DEFAULT_HAZARD_DAMAGE:25,SPIKE_DAMAGE:40,SPIKE_KNOCKBACK_X:150,SPIKE_KNOCKBACK_Y:-200,SPIKED_BALL_DAMAGE:50,SPIKED_BALL_KNOCKBACK_BASE:200,SPIKED_BALL_KNOCKBACK_Y_BOOST:-150,FIRE_TRAP_DAMAGE:10,FIRE_TRAP_DAMAGE_INTERVAL:1};class M{constructor(t=0,e=0){this.vx=t,this.vy=e}}class x{constructor({speed:t=g.MOVE_SPEED,jumpForce:e=g.JUMP_FORCE,dashSpeed:i=g.DASH_SPEED,dashDuration:s=g.DASH_DURATION,jumpBufferTimer:n=0,coyoteTimer:a=0,dashTimer:o=0,dashCooldownTimer:r=0,hitStunTimer:l=0,jumpCount:d=0,isDashing:u=!1,isHit:p=!1,isSpawning:y=!0,spawnComplete:m=!1,isDespawning:P=!1,despawnAnimationFinished:F=!1,needsRespawn:Q=!1,deathCount:tt=0,activeSurfaceSound:yt=null,surfaceParticleTimer:bt=0,jumpParticleTimer:B=0,jumpPressed:K=!1,dashPressed:X=!1,hLock:G=!1,vLock:et=!1}={}){this.speed=t,this.jumpForce=e,this.dashSpeed=i,this.dashDuration=s,this.jumpBufferTimer=n,this.coyoteTimer=a,this.dashTimer=o,this.dashCooldownTimer=r,this.hitStunTimer=l,this.surfaceParticleTimer=bt,this.jumpParticleTimer=B,this.jumpCount=d,this.isDashing=u,this.isHit=p,this.isSpawning=y,this.spawnComplete=m,this.isDespawning=P,this.despawnAnimationFinished=F,this.needsRespawn=Q,this.hLock=G,this.vLock=et,this.jumpPressed=K,this.dashPressed=X,this.deathCount=tt,this.activeSurfaceSound=yt}}class he{constructor(t,e,i){this.cellSize=i,this.widthInCells=Math.ceil(t/i),this.heightInCells=Math.ceil(e/i),this.grid=new Array(this.widthInCells*this.heightInCells).fill(null).map(()=>[])}clear(){for(let t=0;t<this.grid.length;t++)this.grid[t]=[]}insert(t){const e=Math.floor(t.x/this.cellSize),i=Math.floor(t.y/this.cellSize),s=Math.floor((t.x+t.width)/this.cellSize),n=Math.floor((t.y+t.height)/this.cellSize);for(let a=i;a<=n;a++)for(let o=e;o<=s;o++)if(o>=0&&o<this.widthInCells&&a>=0&&a<this.heightInCells){const r=a*this.widthInCells+o;this.grid[r].push(t)}}query(t){const e=Math.floor(t.x/this.cellSize),i=Math.floor(t.y/this.cellSize),s=Math.floor((t.x+t.width)/this.cellSize),n=Math.floor((t.y+t.height)/this.cellSize),a=new Set;for(let o=i;o<=n;o++)for(let r=e;r<=s;r++)if(r>=0&&r<this.widthInCells&&o>=0&&o<this.heightInCells){const l=o*this.widthInCells+r;this.grid[l].forEach(d=>a.add(d))}return Array.from(a)}}class le{constructor(){this.spatialGrid=null,this.currentLevel=null}_initializeGridForLevel(t){const e=S.TILE_SIZE*2;this.spatialGrid=new he(t.width,t.height,e),this.currentLevel=t;for(let i=0;i<t.gridHeight;i++)for(let s=0;s<t.gridWidth;s++){const n=t.tiles[i][s];n&&n.solid&&this.spatialGrid.insert({x:s*S.TILE_SIZE,y:i*S.TILE_SIZE,width:S.TILE_SIZE,height:S.TILE_SIZE,isOneWay:n.oneWay||!1,surfaceType:n.interaction||n.type,type:"tile"})}t.traps.forEach(i=>{if(i.solid&&i.type!=="falling_platform"){const s=i.hitbox||{x:i.x-i.width/2,y:i.y-i.height/2,width:i.width,height:i.height};this.spatialGrid.insert({...s,isOneWay:!1,surfaceType:i.type,onLanded:typeof i.onLanded=="function"?i.onLanded.bind(i):null,type:"trap"})}})}update(t,{entityManager:e,level:i}){i!==this.currentLevel&&this._initializeGridForLevel(i);const s=e.query([C,M,A]);for(const n of s){const a=e.getComponent(n,C),o=e.getComponent(n,M),r=e.getComponent(n,A),l=e.getComponent(n,x);if(l&&(l.isSpawning||l.isDespawning))continue;if(a.y>i.height+100){c.publish("collisionEvent",{type:"world_bottom",entityId:n,entityManager:e});continue}const d={x:a.x-Math.abs(o.vx*t),y:a.y-Math.abs(o.vy*t),width:r.width+Math.abs(o.vx*t)*2,height:r.height+Math.abs(o.vy*t)*2},u=this.spatialGrid.query(d),p=i.traps.filter(m=>m.type==="falling_platform"&&m.solid).map(m=>({x:m.x-m.width/2,y:m.y-m.height/2,width:m.width,height:m.height,isOneWay:!1,surfaceType:"platform",onLanded:typeof m.onLanded=="function"?m.onLanded.bind(m):null})),y=[...u,...p];this._handleHorizontalCollisions(a,o,r,y,t),this._handleVerticalCollisions(a,o,r,y,t,n),a.x=Math.max(0,Math.min(a.x,i.width-r.width)),this._checkObjectInteractions(a,o,r,i,t,n,e)}}_isRectColliding(t,e){return t.x<e.x+e.width&&t.x+t.width>e.x&&t.y<e.y+e.height&&t.y+t.height>e.y}_handleHorizontalCollisions(t,e,i,s,n){t.x+=e.vx*n,i.isAgainstWall=!1;const a={x:t.x,y:t.y,width:i.width,height:i.height};for(const o of s)o.isOneWay||this._isRectColliding(a,o)&&(e.vx>0?t.x=o.x-i.width:e.vx<0&&(t.x=o.x+o.width),e.vx=0,a.x=t.x,i.isAgainstWall=!["sand","mud","ice","platform"].includes(o.surfaceType))}_handleVerticalCollisions(t,e,i,s,n,a){t.y+=e.vy*n,i.isGrounded=!1;const o={x:t.x,y:t.y,width:i.width,height:i.height};for(const r of s)this._isRectColliding(o,r)&&(e.vy>0?t.y-e.vy*n+i.height<=r.y&&(this._landOnSurface(t,e,i,r.y,r.surfaceType,a),o.y=t.y,r.onLanded&&r.onLanded(c)):e.vy<0&&(r.isOneWay||(t.y=r.y+r.height,e.vy=0,o.y=t.y)))}_landOnSurface(t,e,i,s,n,a){const o=e.vy;o>=g.FALL_DAMAGE_MIN_VELOCITY&&c.publish("playerLandedHard",{entityId:a,landingVelocity:o}),t.y=s-i.height,e.vy=0,i.isGrounded=!0,i.groundType=n}_isCollidingWith(t,e,i){const s=i.hitbox||{x:i.x-(i.width||i.size)/2,y:i.y-(i.height||i.size)/2,width:i.width||i.size,height:i.height||i.size};return t.x<s.x+s.width&&t.x+e.width>s.x&&t.y<s.y+s.height&&t.y+e.height>s.y}_checkObjectInteractions(t,e,i,s,n,a,o){this._checkFruitCollisions(t,i,s,a,o),this._checkTrophyCollision(t,i,s.trophy,a,o,e,n),this.checkCheckpointCollisions(t,i,s,a,o),this._checkTrapInteractions(t,e,i,s,n,a,o)}_checkTrapInteractions(t,e,i,s,n,a,o){const r={pos:t,vel:e,col:i,entityId:a,entityManager:o,dt:n};for(const l of s.traps)!l.solid&&this._isCollidingWith(t,i,l)&&l.onCollision(r,c)}_checkFruitCollisions(t,e,i,s,n){for(const a of i.getActiveFruits())this._isCollidingWith(t,e,a)&&c.publish("collisionEvent",{type:"fruit",entityId:s,target:a,entityManager:n})}_checkTrophyCollision(t,e,i,s,n,a,o){if(!i||i.inactive||i.acquired)return;const r=15,l={x:i.x-i.size/2,y:i.y-i.size/2+r,width:i.size,height:i.size-r};if(!this._isRectColliding({x:t.x,y:t.y,width:e.width,height:e.height},l))return;const d=t.y+e.height-a.vy*o;if(a.vy>=0&&d<=l.y){i.isAnimating||(i.isAnimating=!0,c.publish("playerKnockback",{entityId:s,entityManager:n,vx:0,vy:-300}),c.publish("playSound",{key:"trophy_activated",volume:.9,channel:"UI"}),c.publish("cameraShakeRequested",{intensity:6,duration:.25}));return}a.vx>0?(t.x=l.x-e.width,a.vx=0):a.vx<0&&(t.x=l.x+l.width,a.vx=0)}checkCheckpointCollisions(t,e,i,s,n){for(const a of i.getInactiveCheckpoints())this._isCollidingWith(t,e,a)&&c.publish("collisionEvent",{type:"checkpoint",entityId:s,target:a,entityManager:n})}}class E{constructor({spriteKey:t,width:e,height:i,animationState:s="idle",animationFrame:n=0,animationTimer:a=0,direction:o="right",isVisible:r=!0}){this.spriteKey=t,this.width=e,this.height=i,this.animationState=s,this.animationFrame=n,this.animationTimer=a,this.direction=o,this.isVisible=r}}class _t{constructor(t){this.characterId=t}}class ce{constructor(t,e,i){this.ctx=t,this.canvas=e,this.assets=i,this.backgroundCache=new Map,this.backgroundOffset={x:0,y:0},this.staticLayerCache=null}preRenderLevel(t){this.staticLayerCache=document.createElement("canvas"),this.staticLayerCache.width=t.width,this.staticLayerCache.height=t.height;const e=this.staticLayerCache.getContext("2d");e.imageSmoothingEnabled=!1;const i=S.TILE_SIZE;for(let s=0;s<t.gridHeight;s++)for(let n=0;n<t.gridWidth;n++){const a=t.tiles[s][n];if(a.solid&&!a.oneWay){const o=this.assets[a.spriteKey];if(!o){e.fillStyle="magenta",e.fillRect(n*i,s*i,i,i);continue}const r=n*i,l=s*i,d=i+1;if(a.spriteConfig){const u=i,p=a.spriteConfig.height||i,y=d,m=p===i?d:p;e.drawImage(o,a.spriteConfig.srcX,a.spriteConfig.srcY,u,p,r,l,y,m)}else e.drawImage(o,r,l,d,d)}}}_preRenderBackground(t){const e=t.background;if(this.backgroundCache.has(e))return this.backgroundCache.get(e);const i=this.assets[e];if(!i||!i.complete||i.naturalWidth===0)return null;const s=document.createElement("canvas");s.width=this.canvas.width+i.width,s.height=this.canvas.height+i.height;const n=s.getContext("2d"),a=n.createPattern(i,"repeat");return n.fillStyle=a,n.fillRect(0,0,s.width,s.height),this.backgroundCache.set(e,s),s}drawScrollingBackground(t,e){const i=this._preRenderBackground(t),s=this.assets[t.background];if(!i||!s||!s.complete||s.naturalWidth===0){this.ctx.fillStyle="#87CEEB",this.ctx.fillRect(0,0,this.canvas.width,this.canvas.height);return}this.backgroundOffset.x+=t.backgroundScroll.x*e,this.backgroundOffset.y+=t.backgroundScroll.y*e;const n=(this.backgroundOffset.x%s.width+s.width)%s.width,a=(this.backgroundOffset.y%s.height+s.height)%s.height;this.ctx.drawImage(i,n,a,this.canvas.width,this.canvas.height,0,0,this.canvas.width,this.canvas.height)}renderScene(t,e,i){t.apply(this.ctx),this.drawTileGrid(e,t),e.trophy&&this.drawTrophy(e.trophy,t),this.drawFruits(e.getActiveFruits(),t),this.drawCheckpoints(e.checkpoints,t),this.drawTraps(e.traps,t);const s=i.query([C,E]);for(const n of s){const a=i.getComponent(n,C),o=i.getComponent(n,E),r=i.getComponent(n,_t),l=i.getComponent(n,x);this._drawRenderable(a,o,r,l)}t.restore(this.ctx)}_drawRenderable(t,e,i,s){const n=e.animationState;if(!e.isVisible||s&&s.despawnAnimationFinished)return;const a={idle:"playerIdle",run:"playerRun",jump:"playerJump",double_jump:"playerDoubleJump",fall:"playerFall",dash:"playerDash",cling:"playerCling",spawn:"playerAppear",despawn:"playerDisappear",hit:"playerHit"};let o;const r=a[n];if(n==="spawn"||n==="despawn"?o=this.assets[r]:i?o=this.assets.characters[i.characterId]?.[r]||this.assets.playerIdle:o=this.assets[e.spriteKey],!o){this.ctx.fillStyle="#FF00FF",this.ctx.fillRect(t.x,t.y,e.width,e.height);return}const l=g.ANIMATION_FRAMES[n]||1,d=o.width/l,u=d*e.animationFrame;this.ctx.save();const p=n==="spawn"||n==="despawn",y=p?t.x-(e.width-g.WIDTH)/2:t.x,m=p?t.y-(e.height-g.HEIGHT)/2:t.y;e.direction==="left"?(this.ctx.scale(-1,1),this.ctx.translate(-y-e.width,m)):this.ctx.translate(y,m);const P=n==="cling"?g.CLING_OFFSET:0;this.ctx.drawImage(o,u,0,d,o.height,P,0,e.width,e.height),this.ctx.restore()}drawTileGrid(t,e){this.staticLayerCache&&this.ctx.drawImage(this.staticLayerCache,0,0);const i=S.TILE_SIZE,s=Math.floor(e.x/i),n=Math.ceil((e.x+e.width)/i),a=Math.floor(e.y/i),o=Math.ceil((e.y+e.height)/i);for(let r=a;r<o;r++)for(let l=s;l<n;l++){if(l<0||l>=t.gridWidth||r<0||r>=t.gridHeight)continue;const d=t.tiles[r][l];if(d.type==="empty"||!d.oneWay)continue;const u=this.assets[d.spriteKey];if(!u){this.ctx.fillStyle="magenta",this.ctx.fillRect(l*i,r*i,i,i);continue}const p=l*i,y=r*i,m=i+1;if(d.spriteConfig){const P=i,F=d.spriteConfig.height||i,Q=m,tt=F===i?m:F;this.ctx.drawImage(u,d.spriteConfig.srcX,d.spriteConfig.srcY,P,F,p,y,Q,tt)}else this.ctx.drawImage(u,p,y,m,m)}}drawTrophy(t,e){if(!e.isVisible(t.x-t.size/2,t.y-t.size/2,t.size,t.size))return;const i=t.isAnimating||t.acquired,s=this.assets[i?"trophy_pressed":"trophy_idle"];if(!s)return;let n,a;i?(n=s.width/t.frameCount,a=n*t.animationFrame):(n=s.width,a=0),t.inactive&&(this.ctx.globalAlpha=.5),this.ctx.drawImage(s,a,0,n,s.height,t.x-t.size/2,t.y-t.size/2,t.size,t.size),this.ctx.globalAlpha=1}drawFruits(t,e){for(const i of t){if(!e.isRectVisible({x:i.x-i.size/2,y:i.y-i.size/2,width:i.size,height:i.size}))continue;const s=this.assets[i.spriteKey];if(!s)continue;const n=s.width/i.frameCount,a=n*i.frame;this.ctx.drawImage(s,a,0,n,s.height,i.x-i.size/2,i.y-i.size/2,i.size,i.size)}}drawTraps(t,e){for(const i of t)i.render(this.ctx,this.assets,e)}drawCheckpoints(t,e){for(const i of t){if(!e.isRectVisible({x:i.x,y:i.y,width:i.size,height:i.size}))continue;let s,n=0,a;switch(i.state){case"inactive":s=this.assets.checkpoint_inactive,s&&(a=s.width);break;case"activating":s=this.assets.checkpoint_activation,s&&(a=s.width/i.frameCount,n=i.frame*a);break;case"active":if(s=this.assets.checkpoint_active,s){const r=Math.floor(performance.now()/1e3/.1%10);a=s.width/10,n=r*a}break}s&&a>0?this.ctx.drawImage(s,n,0,a,s.height,i.x-i.size/2,i.y-i.size/2,i.size,i.size):(this.ctx.fillStyle="purple",this.ctx.fillRect(i.x-i.size/2,i.y-i.size/2,i.size,i.size))}}}const Y={0:{type:"empty",solid:!1,hazard:!1,description:"Empty space. The player can move freely through it."},1:{type:"dirt",solid:!0,hazard:!1,spriteKey:"block",spriteConfig:{srcX:96,srcY:0},description:"A standard, solid block of dirt. Wall-jumps are not possible on this surface."},2:{type:"stone",solid:!0,hazard:!1,spriteKey:"block",spriteConfig:{srcX:0,srcY:0},description:"A standard, solid block of stone. Players can wall-jump off this surface."},3:{type:"wood",solid:!0,hazard:!1,spriteKey:"block",spriteConfig:{srcX:0,srcY:64},description:"A standard, solid block of wood. Players can wall-jump off this surface."},4:{type:"green_block",solid:!0,hazard:!1,spriteKey:"block",spriteConfig:{srcX:0,srcY:128},description:"A solid, green-colored block. Players can wall-jump off this surface."},5:{type:"orange_dirt",solid:!0,hazard:!1,spriteKey:"block",spriteConfig:{srcX:96,srcY:64},description:"Solid orange dirt. Wall-jumps are not possible on this surface."},6:{type:"pink_dirt",solid:!0,hazard:!1,spriteKey:"block",spriteConfig:{srcX:96,srcY:128},description:"Solid pink dirt. Wall-jumps are not possible on this surface."},7:{type:"sand",solid:!0,hazard:!1,spriteKey:"sand_mud_ice",spriteConfig:{srcX:0,srcY:0},interaction:"sand",description:"A solid block of sand. Slows player movement. Wall-jumps are not possible."},8:{type:"mud",solid:!0,hazard:!1,spriteKey:"sand_mud_ice",spriteConfig:{srcX:64,srcY:0},interaction:"mud",description:"A solid block of mud. Reduces jump height. Wall-jumps are not possible."},9:{type:"ice",solid:!0,hazard:!1,spriteKey:"sand_mud_ice",spriteConfig:{srcX:128,srcY:0},interaction:"ice",description:"A solid block of slippery ice. Reduces friction. Wall-jumps are not possible."},a:{type:"oneway_gold",solid:!0,oneWay:!0,hazard:!1,spriteKey:"block",spriteConfig:{srcX:272,srcY:0,height:5},description:"A one-way platform made of gold. The player can jump through it from below."},b:{type:"oneway_wood",solid:!0,oneWay:!0,hazard:!1,spriteKey:"block",spriteConfig:{srcX:272,srcY:16,height:5},description:"A one-way platform made of wood. The player can jump through it from below."},c:{type:"oneway_stone",solid:!0,oneWay:!0,hazard:!1,spriteKey:"block",spriteConfig:{srcX:272,srcY:32,height:5},description:"A one-way platform made of stone. The player can jump through it from below."}};class O{constructor(t,e,i){this.x=t,this.y=e,this.width=i.width||16,this.height=i.height||16,this.type=i.type,this.id=`${this.type}-${Math.random().toString(36).substr(2,9)}`}update(t,e,i){}render(t,e,i){}onCollision(t,e){}reset(){}}class de extends O{constructor(t,e,i){super(t,e,{...i,width:16,height:16}),this.solid=!0,this.state="off",this.playerIsOnTop=!1,this.frame=0,this.frameTimer=0,this.turnOffTimer=0,this.damageTimer=k.FIRE_TRAP_DAMAGE_INTERVAL,this.anim={activating:{frames:4,speed:.1},on:{frames:3,speed:.15}}}get hitbox(){return this.state==="on"||this.state==="activating"?{x:this.x-this.width/2,y:this.y-this.height*1.5,width:this.width,height:this.height*2}:{x:this.x-this.width/2,y:this.y-this.height/2,width:this.width,height:this.height}}update(t){switch(!this.playerIsOnTop&&this.state==="on"&&(this.state="turning_off",this.turnOffTimer=2),this.state){case"activating":this.frameTimer+=t,this.frameTimer>=this.anim.activating.speed&&(this.frameTimer=0,this.frame++,this.frame>=this.anim.activating.frames&&(this.frame=0,this.state="on"));break;case"on":this.frameTimer+=t,this.frameTimer>=this.anim.on.speed&&(this.frameTimer=0,this.frame=(this.frame+1)%this.anim.on.frames);break;case"turning_off":this.turnOffTimer-=t,this.turnOffTimer<=0&&(this.state="off",this.frame=0);break}this.state==="on"?this.damageTimer+=t:this.playerIsOnTop||(this.damageTimer=k.FIRE_TRAP_DAMAGE_INTERVAL)}render(t,e,i){if(!i.isVisible(this.x,this.y-this.height,this.width,this.height*2))return;const s=this.x-this.width/2,n=this.y-this.height/2,a=e.fire_off;if(a&&t.drawImage(a,0,16,16,16,s,n,this.width,this.height),this.state==="off"||this.state==="turning_off")return;let o,r=0,l;this.state==="activating"?(o=e.fire_hit,l=o.width/this.anim.activating.frames,r=this.frame*l):(o=e.fire_on,l=o.width/this.anim.on.frames,r=this.frame*l),o&&t.drawImage(o,r,0,l,o.height,s,n-this.height,this.width,this.height*2)}onLanded(t){this.playerIsOnTop=!0,(this.state==="off"||this.state==="turning_off")&&(this.state="activating",this.frame=0,this.frameTimer=0,t.publish("playSound",{key:"fire_activated",volume:.8,channel:"SFX"}))}onCollision(t,e){this.state==="on"&&this.damageTimer>=k.FIRE_TRAP_DAMAGE_INTERVAL&&(this.damageTimer-=k.FIRE_TRAP_DAMAGE_INTERVAL,e.publish("playerTookDamage",{amount:k.FIRE_TRAP_DAMAGE,source:"fire"}))}reset(){this.state="off",this.playerIsOnTop=!1,this.frame=0,this.frameTimer=0,this.turnOffTimer=0,this.damageTimer=k.FIRE_TRAP_DAMAGE_INTERVAL}}class ue extends O{constructor(t,e,i){super(t,e,{...i,width:16,height:16}),this.state="hidden",this.activationRadius=64,this.warningDuration=.4,this.retractDelay=1.5,this.timer=0,this.damage=i.damage||k.SPIKE_DAMAGE}get hitbox(){return{x:this.x-this.width/2,y:this.y-this.height/4,width:this.width,height:this.height/2}}update(t,e){if(!e)return;this.timer>0&&(this.timer-=t);const i=e.x,s=e.x+e.width,n=e.y,a=e.y+e.height,o=this.x-this.activationRadius,r=this.x+this.activationRadius,l=this.y-this.activationRadius,d=this.y+this.activationRadius,u=s>o&&i<r&&a>l&&n<d;switch(this.state){case"hidden":u&&(this.state="warning",this.timer=this.warningDuration);break;case"warning":this.timer<=0&&(this.state="extended",this.timer=this.retractDelay);break;case"extended":this.timer<=0&&(this.state="hidden");break}}render(t,e,i){if(this.state==="hidden"||this.state==="warning")return;const s=this.x-this.width/2,n=this.y-this.height/2;if(!i.isVisible(s,n,this.width,this.height))return;const a=e.spike_two;a&&t.drawImage(a,s,n,this.width,this.height)}onCollision(t,e){if(this.state!=="extended")return;const i=t.entityManager.getComponent(t.entityId,E);if(!i)return;const s=i.direction==="right"?-150:k.SPIKE_KNOCKBACK_X,n=k.SPIKE_KNOCKBACK_Y;e.publish("collisionEvent",{type:"hazard",entityId:t.entityId,entityManager:t.entityManager,damage:this.damage,knockback:{vx:s,vy:n}})}reset(){this.state="hidden",this.timer=0}}class pe extends O{constructor(t,e,i){super(t,e,{...i,width:28,height:28}),this.state="idle",this.frame=0,this.frameCount=8,this.frameSpeed=.05,this.frameTimer=0}update(t){this.state==="jumping"&&(this.frameTimer+=t,this.frameTimer>=this.frameSpeed&&(this.frameTimer-=this.frameSpeed,this.frame++,this.frame>=this.frameCount&&(this.frame=0,this.state="idle")))}render(t,e,i){const s=this.x-this.width/2,n=this.y-this.height/2;if(!i.isVisible(s,n,this.width,this.height))return;let a,o=0,r;this.state==="jumping"?(a=e.trampoline_jump,a&&(r=a.width/this.frameCount,o=this.frame*r)):(a=e.trampoline_idle,a&&(r=a.width)),a&&r>0?t.drawImage(a,o,0,r,a.height,s,n,this.width,this.height):(t.fillStyle="#8e44ad",t.fillRect(s,n,this.width,this.height))}onCollision(t,e){const{pos:i,vel:s,col:n}=t;s.vy=-400*g.TRAMPOLINE_BOUNCE_MULTIPLIER,i.y=this.y-this.height/2-n.height,this.state="jumping",this.frame=0,this.frameTimer=0,e.publish("playSound",{key:"trampoline_bounce",volume:1,channel:"SFX"})}reset(){this.state="idle",this.frame=0,this.frameTimer=0}}class me extends O{constructor(t,e,i){super(t,e,{...i,width:28,height:28}),this.chainLength=i.chainLength||100,this.swingArc=i.swingArc||90,this.period=i.period||4,this.tiltAmount=i.tiltAmount||.5,this.anchorX=t,this.anchorY=e,this.ballX=this.anchorX,this.ballY=this.anchorY+this.chainLength,this.swingTimer=0,this.maxAngle=this.swingArc/2*(Math.PI/180),this.rotation=0}get hitbox(){return{x:this.ballX-this.width/2,y:this.ballY-this.height/2,width:this.width,height:this.height}}update(t){this.swingTimer+=t;const e=this.maxAngle*Math.sin(this.swingTimer/this.period*2*Math.PI),i=this.maxAngle*Math.cos(this.swingTimer/this.period*2*Math.PI);this.rotation=i*this.tiltAmount,this.ballX=this.anchorX+this.chainLength*Math.sin(e),this.ballY=this.anchorY+this.chainLength*Math.cos(e)}render(t,e,i){if(!i.isVisible(this.anchorX-this.chainLength,this.anchorY,this.chainLength*2,this.chainLength*2))return;const s=e.spiked_ball,n=e.spiked_ball_chain;if(n){const o=this.ballX-this.anchorX,r=this.ballY-this.anchorY,l=Math.sqrt(o*o+r*r),d=Math.atan2(r,o);t.save(),t.translate(this.anchorX,this.anchorY),t.rotate(d);for(let u=0;u<l;u+=8)t.drawImage(n,u,-8/2,8,8);t.restore()}s?(t.save(),t.translate(this.ballX,this.ballY),t.rotate(this.rotation),t.drawImage(s,-this.width/2,-this.height/2,this.width,this.height),t.restore()):(t.fillStyle="red",t.fillRect(this.hitbox.x,this.hitbox.y,this.width,this.height))}onCollision(t,e){const i=t.pos.x+t.col.width/2,s=t.pos.y+t.col.height/2;let n=i-this.ballX,a=s-this.ballY;const o=Math.sqrt(n*n+a*a);o===0?(n=1,a=0):(n/=o,a/=o);const r=k.SPIKED_BALL_KNOCKBACK_BASE;e.publish("collisionEvent",{type:"hazard",entityId:t.entityId,entityManager:t.entityManager,damage:k.SPIKED_BALL_DAMAGE,knockback:{vx:n*r,vy:a*r+k.SPIKED_BALL_KNOCKBACK_Y_BOOST}})}reset(){this.swingTimer=0,this.rotation=0}}class fe extends O{constructor(t,e,i){super(t,e,i),this.width=18,this.height=18,this.type="arrow_bubble",this.direction=i.direction||"right",this.knockbackSpeed=i.knockbackSpeed||450,this.state="idle",this.RESPAWN_DURATION=4,this.respawnTimer=0,this.idleAnimation={frameCount:10,frameSpeed:.1,frameTimer:0,currentFrame:0},this.hitAnimation={frameCount:4,frameSpeed:.08,frameTimer:0,currentFrame:0}}update(t){this.state==="idle"?(this.idleAnimation.frameTimer+=t,this.idleAnimation.frameTimer>=this.idleAnimation.frameSpeed&&(this.idleAnimation.frameTimer=0,this.idleAnimation.currentFrame=(this.idleAnimation.currentFrame+1)%this.idleAnimation.frameCount)):this.state==="hit"?(this.hitAnimation.frameTimer+=t,this.hitAnimation.frameTimer>=this.hitAnimation.frameSpeed&&(this.hitAnimation.frameTimer=0,this.hitAnimation.currentFrame++,this.hitAnimation.currentFrame>=this.hitAnimation.frameCount&&(this.state="respawning",this.respawnTimer=this.RESPAWN_DURATION))):this.state==="respawning"&&(this.respawnTimer-=t,this.respawnTimer<=0&&this._resetToIdle())}render(t,e,i){if(this.state==="respawning")return;const s=this.x-this.width/2,n=this.y-this.height/2;if(!i.isVisible(s,n,this.width,this.height))return;const a=this.state==="idle"?e.arrow_idle:e.arrow_hit,o=this.state==="idle"?this.idleAnimation.currentFrame:this.hitAnimation.currentFrame,r=this.state==="idle"?this.idleAnimation.frameCount:this.hitAnimation.frameCount;if(a){const l=a.width/r,d=a.height;t.save(),t.translate(this.x,this.y);let u=0;switch(this.direction){case"up":u=0;break;case"right":u=Math.PI/2;break;case"down":u=Math.PI;break;case"left":default:u=-Math.PI/2;break}t.rotate(u),t.drawImage(a,o*l,0,l,d,-this.width/2,-this.height/2,this.width,this.height),t.restore()}}onCollision(t,e){if(this.state!=="idle")return;const i=t.entityManager.getComponent(t.entityId,x);if(!i)return;this.state="hit",this.hitAnimation.currentFrame=0,this.hitAnimation.frameTimer=0,e.publish("playSound",{key:"arrow_pop",volume:.8,channel:"SFX"});const{vel:s}=t;switch(this.direction==="up"||this.direction==="down"?(i.vLock=!0,s.vx=0):(i.hLock=!0,s.vy=0),this.direction){case"up":s.vy=-this.knockbackSpeed;break;case"down":s.vy=this.knockbackSpeed;break;case"left":s.vx=-this.knockbackSpeed;break;case"right":s.vx=this.knockbackSpeed;break}}_resetToIdle(){this.state="idle",this.idleAnimation.currentFrame=0,this.idleAnimation.frameTimer=0,this.hitAnimation.currentFrame=0,this.hitAnimation.frameTimer=0,this.respawnTimer=0}reset(){this._resetToIdle()}}class ge extends O{constructor(t,e,i){super(t,e,i),this.width=24,this.height=8,this.type="fan",this.direction=i.direction||"right",this.pushStrength=i.pushStrength||250,this.windHeight=i.windHeight||120,this.soundRadius=i.soundRadius||250,this.state="off",this.onDuration=5,this.offDuration=5,this.timer=this.offDuration,this.isSoundPlaying=!1,this.onAnimation={frameCount:4,frameSpeed:.05,frameTimer:0,currentFrame:0},this.particleTimer=0}get hitbox(){const t=this.width,e=this.height;switch(this.direction){case"up":return{x:this.x-t/2,y:this.y-e/2-this.windHeight,width:t,height:this.windHeight};case"down":return{x:this.x-t/2,y:this.y+e/2,width:t,height:this.windHeight};case"left":return{x:this.x-e/2-this.windHeight,y:this.y-t/2,width:this.windHeight,height:t};case"right":default:return{x:this.x+e/2,y:this.y-t/2,width:this.windHeight,height:t}}}update(t,e,i){this.timer-=t,this.timer<=0&&(this.state==="off"?(this.state="on",this.timer=this.onDuration):(this.state="off",this.timer=this.offDuration)),this.state==="on"&&(this.onAnimation.frameTimer+=t,this.onAnimation.frameTimer>=this.onAnimation.frameSpeed&&(this.onAnimation.frameTimer=0,this.onAnimation.currentFrame=(this.onAnimation.currentFrame+1)%this.onAnimation.frameCount),this.particleTimer+=t,this.particleTimer>=.05&&(this.particleTimer=0,i.publish("createParticles",{x:this.x,y:this.y,type:"fan_push",direction:this.direction,particleSpeed:this.pushStrength*.75})));const s=this.isSoundPlaying;let n=!1;this.state==="on"&&e&&Math.sqrt(Math.pow(e.x-this.x,2)+Math.pow(e.y-this.y,2))<this.soundRadius&&(n=!0),n&&!s?(i.publish("startSoundLoop",{key:"fan_blowing",volume:.7,channel:"SFX"}),this.isSoundPlaying=!0):!n&&s&&(i.publish("stopSoundLoop",{key:"fan_blowing"}),this.isSoundPlaying=!1)}render(t,e,i){const s=this.state==="on"?e.fan_on:e.fan_off;if(!s||!i.isVisible(this.x-32,this.y-32,64,64))return;const n=this.state==="on"?this.onAnimation.currentFrame:0,a=this.state==="on"?this.onAnimation.frameCount:1,o=24,r=8,l=s.width/a,d=s.height;t.save(),t.translate(this.x,this.y);let u=0;switch(this.direction){case"up":u=0;break;case"left":u=-Math.PI/2;break;case"down":u=Math.PI;break;case"right":default:u=Math.PI/2;break}t.rotate(u),t.drawImage(s,n*l,0,l,d,-o/2,-r/2,o,r),t.restore()}onCollision(t){if(this.state!=="on")return;const e=t.entityManager.getComponent(t.entityId,x);if(!e)return;const{vel:i}=t;switch(this.direction==="up"||this.direction==="down"?e.vLock=!0:e.hLock=!0,this.direction){case"up":i.vy=-this.pushStrength;break;case"down":i.vy=this.pushStrength;break;case"left":i.vx=-this.pushStrength;break;case"right":i.vx=this.pushStrength;break}}reset(t){this.isSoundPlaying&&t.publish("stopSoundLoop",{key:"fan_blowing"}),this.state="off",this.timer=this.offDuration,this.isSoundPlaying=!1,this.onAnimation.currentFrame=0,this.onAnimation.frameTimer=0}}class ye extends O{constructor(t,e,i){super(t,e,{...i,width:32,height:10}),this.solid=!0,this.initialX=t,this.initialY=e,this.state="idle",this.playerOnTimer=0,this.shakeTimer=0,this.respawnTimer=0,this.fallSpeed=0,this.opacity=1,this.shakeOffsetX=0,this.shakeOffsetY=0,this.bobbingTimer=Math.random()*Math.PI*2,this.bobbingAmplitude=Math.random()*5+5,this.PLAYER_ON_DURATION=.3,this.SHAKE_DURATION=.15,this.RESPAWN_DURATION=5,this.FALL_ACCELERATION=250,this.MAX_FALL_SPEED=600,this.animation={frameCount:4,frameSpeed:.1,frameTimer:0,currentFrame:0},this.particleTimer=0}_isPlayerOnTop(t){if(!t)return!1;const e=t.y+t.height,i=this.y-this.height/2;return t.x<this.x+this.width/2&&t.x+t.width>this.x-this.width/2&&Math.abs(e-i)<5}update(t,e,i){switch((this.state==="idle"||this.state==="active")&&(this.animation.frameTimer+=t,this.animation.frameTimer>=this.animation.frameSpeed&&(this.animation.frameTimer=0,this.animation.currentFrame=(this.animation.currentFrame+1)%this.animation.frameCount)),this.state){case"idle":this.bobbingTimer+=t*2,this.y=this.initialY+Math.sin(this.bobbingTimer)*this.bobbingAmplitude;break;case"active":if(this.playerOnTimer-=t,!this._isPlayerOnTop(e)){this.reset();return}this.playerOnTimer<=0&&(this.state="shaking",this.shakeTimer=this.SHAKE_DURATION,i.publish("playSound",{key:"falling_platform",volume:.7,channel:"SFX"}));break;case"shaking":this.shakeTimer-=t,this.shakeOffsetX=(Math.random()-.5)*4,this.shakeOffsetY=(Math.random()-.5)*2,this.shakeTimer<=0&&(this.state="falling",this.solid=!1,this.shakeOffsetX=0,this.shakeOffsetY=0);break;case"falling":this.fallSpeed=Math.min(this.MAX_FALL_SPEED,this.fallSpeed+this.FALL_ACCELERATION*t),this.y+=this.fallSpeed*t,this.opacity-=t*.5,this.particleTimer+=t,this.particleTimer>.05&&(this.particleTimer=0,i.publish("createParticles",{x:this.x,y:this.y-this.height/2,type:"walk_dust",particleSpeed:50})),this.opacity<=0&&(this.state="respawning",this.respawnTimer=this.RESPAWN_DURATION);break;case"respawning":this.respawnTimer-=t,this.respawnTimer<=0&&this.reset();break}}render(t,e,i){if(this.state==="respawning"||this.opacity<=0)return;const s=this.x-this.width/2+this.shakeOffsetX,n=this.y-this.height/2+this.shakeOffsetY;if(!i.isVisible(s,n,this.width,this.height))return;const a=this.state==="idle"||this.state==="active",o=a?e.falling_platform_on:e.falling_platform_off;if(o){if(t.globalAlpha=this.opacity,a){const r=o.width/this.animation.frameCount,l=this.animation.currentFrame*r;t.drawImage(o,l,0,r,o.height,s,n,this.width,this.height)}else t.drawImage(o,s,n,this.width,this.height);t.globalAlpha=1}}onLanded(){this.state==="idle"&&(this.state="active",this.playerOnTimer=this.PLAYER_ON_DURATION)}reset(){this.state="idle",this.x=this.initialX,this.y=this.initialY,this.opacity=1,this.fallSpeed=0,this.playerOnTimer=0,this.solid=!0,this.animation.currentFrame=0,this.animation.frameTimer=0,this.shakeOffsetX=0,this.shakeOffsetY=0}}class be extends O{constructor(t,e,i){super(t,e,{...i,width:42,height:42}),this.initialY=e,this.targetY=e,this.type="rock_head",this.state="idle",this.timers={blink:Math.random()*4+2,warning:.2,slammed:.4},this.velocities={slam:1200,retract:80},this.animations={blink:{frameCount:4,frameSpeed:.08,timer:0,frame:0},hit:{frameCount:4,frameSpeed:.1,timer:0,frame:0}},this.shakeOffset={x:0,y:0}}get detectionZone(){return{x:this.x-this.width/2,y:this.y+this.height/2,width:this.width,height:500}}get hitbox(){return{x:this.x-this.width/2,y:this.y-this.height/2,width:this.width,height:this.height}}isPlayerInZone(t){if(!t)return!1;const e=this.detectionZone,i={x:t.x,y:t.y,width:t.width,height:t.height};return i.x<e.x+e.width&&i.x+i.width>e.x&&i.y<e.y+e.height&&i.y+i.height>e.y}update(t,e,i,s){this[`_update_${this.state}`]?.(t,e,i,s)}_update_idle(t,e,i){if(this.timers.blink-=t,this.timers.blink<=0){this.state="blinking",this.animations.blink.timer=0,this.animations.blink.frame=0;return}this.isPlayerInZone(e)&&(this.state="warning",this.timers.warning=.5)}_update_blinking(t){this.animations.blink.timer+=t,this.animations.blink.timer>=this.animations.blink.frameSpeed&&(this.animations.blink.timer=0,this.animations.blink.frame++,this.animations.blink.frame>=this.animations.blink.frameCount&&(this.state="idle",this.timers.blink=Math.random()*3+2))}_update_warning(t){this.timers.warning-=t,this.shakeOffset.x=(Math.random()-.5)*6,this.shakeOffset.y=(Math.random()-.5)*6,this.timers.warning<=0&&(this.state="slamming",this.shakeOffset={x:0,y:0})}_update_slamming(t,e,i,s){if(this.y+=this.velocities.slam*t,s.getTileAt(this.x,this.y+this.height/2).solid){this.y=Math.floor((this.y+this.height/2)/S.TILE_SIZE)*S.TILE_SIZE-this.height/2,this.state="slammed",this.timers.slammed=.4,this.animations.hit.frame=0,i.publish("playSound",{key:"rh_slam",volume:1.5,channel:"SFX"}),i.publish("cameraShakeRequested",{intensity:15,duration:.3}),i.publish("createParticles",{x:this.x,y:this.y+this.height/2,type:"walk_dust",particleSpeed:200}),i.publish("createParticles",{x:this.x,y:this.y+this.height/2,type:"sand",particleSpeed:200});return}if(e){const a={x:e.x,y:e.y,width:e.width,height:e.height};this._isRectColliding(this.hitbox,a)&&i.publish("playerDied")}}_update_slammed(t){this.timers.slammed-=t,this.animations.hit.timer+=t,this.animations.hit.timer>=this.animations.hit.frameSpeed&&(this.animations.hit.timer=0,this.animations.hit.frame=Math.min(this.animations.hit.frame+1,this.animations.hit.frameCount-1)),this.timers.slammed<=0&&(this.state="retracting")}_update_retracting(t){this.y-=this.velocities.retract*t,this.y<=this.initialY&&(this.y=this.initialY,this.state="idle",this.timers.blink=Math.random()*3+2)}render(t,e,i){const s=this.x-this.width/2+this.shakeOffset.x,n=this.y-this.height/2+this.shakeOffset.y;if(!i.isVisible(s,n,this.width,this.height))return;let a=e.rh_idle,o=0,r=this.width;this.state==="blinking"?(a=e.rh_blink,r=a.width/this.animations.blink.frameCount,o=this.animations.blink.frame*r):this.state==="slammed"&&(a=e.rh_bottom_hit,r=a.width/this.animations.hit.frameCount,o=this.animations.hit.frame*r),a&&t.drawImage(a,o,0,r,a.height,s,n,this.width,this.height)}_isRectColliding(t,e){return t.x<e.x+e.width&&t.x+t.width>e.x&&t.y<e.y+e.height&&t.y+t.height>e.y}reset(){this.y=this.initialY,this.state="idle",this.timers.blink=Math.random()*3+2,this.shakeOffset={x:0,y:0},this.animations.blink.frame=0,this.animations.hit.frame=0}}class ve extends O{constructor(t,e,i){super(t,e,{...i,width:54,height:52}),this.initialY=e,this.targetY=e,this.type="spike_head",this.state="idle",this.timers={blink:Math.random()*4+2,warning:.2,slammed:.4},this.velocities={slam:1200,retract:80},this.animations={blink:{frameCount:4,frameSpeed:.08,timer:0,frame:0},hit:{frameCount:4,frameSpeed:.1,timer:0,frame:0}},this.shakeOffset={x:0,y:0}}get detectionZone(){return{x:this.x-this.width/2,y:this.y+this.height/2,width:this.width,height:500}}get hitbox(){return{x:this.x-this.width/2,y:this.y-this.height/2,width:this.width,height:this.height}}isPlayerInZone(t){if(!t)return!1;const e=this.detectionZone,i={x:t.x,y:t.y,width:t.width,height:t.height};return i.x<e.x+e.width&&i.x+i.width>e.x&&i.y<e.y+e.height&&i.y+i.height>e.y}update(t,e,i,s){this[`_update_${this.state}`]?.(t,e,i,s)}_update_idle(t,e,i){if(this.timers.blink-=t,this.timers.blink<=0){this.state="blinking",this.animations.blink.timer=0,this.animations.blink.frame=0;return}this.isPlayerInZone(e)&&(this.state="warning",this.timers.warning=.5)}_update_blinking(t){this.animations.blink.timer+=t,this.animations.blink.timer>=this.animations.blink.frameSpeed&&(this.animations.blink.timer=0,this.animations.blink.frame++,this.animations.blink.frame>=this.animations.blink.frameCount&&(this.state="idle",this.timers.blink=Math.random()*3+2))}_update_warning(t){this.timers.warning-=t,this.shakeOffset.x=(Math.random()-.5)*6,this.shakeOffset.y=(Math.random()-.5)*6,this.timers.warning<=0&&(this.state="slamming",this.shakeOffset={x:0,y:0})}_update_slamming(t,e,i,s){if(this.y+=this.velocities.slam*t,s.getTileAt(this.x,this.y+this.height/2).solid){this.y=Math.floor((this.y+this.height/2)/S.TILE_SIZE)*S.TILE_SIZE-this.height/2,this.state="slammed",this.timers.slammed=.4,this.animations.hit.frame=0,i.publish("playSound",{key:"sh_slam",volume:1.5,channel:"SFX"}),i.publish("cameraShakeRequested",{intensity:15,duration:.3}),i.publish("createParticles",{x:this.x,y:this.y+this.height/2,type:"walk_dust",particleSpeed:200}),i.publish("createParticles",{x:this.x,y:this.y+this.height/2,type:"sand",particleSpeed:200});return}if(e){const a={x:e.x,y:e.y,width:e.width,height:e.height};this._isRectColliding(this.hitbox,a)&&i.publish("playerDied")}}_update_slammed(t){this.timers.slammed-=t,this.animations.hit.timer+=t,this.animations.hit.timer>=this.animations.hit.frameSpeed&&(this.animations.hit.timer=0,this.animations.hit.frame=Math.min(this.animations.hit.frame+1,this.animations.hit.frameCount-1)),this.timers.slammed<=0&&(this.state="retracting")}_update_retracting(t){this.y-=this.velocities.retract*t,this.y<=this.initialY&&(this.y=this.initialY,this.state="idle",this.timers.blink=Math.random()*3+2)}render(t,e,i){const s=this.x-this.width/2+this.shakeOffset.x,n=this.y-this.height/2+this.shakeOffset.y;if(!i.isVisible(s,n,this.width,this.height))return;let a=e.sh_idle,o=0,r=this.width;this.state==="blinking"?(a=e.sh_blink,r=a.width/this.animations.blink.frameCount,o=this.animations.blink.frame*r):this.state==="slammed"&&(a=e.sh_bottom_hit,r=a.width/this.animations.hit.frameCount,o=this.animations.hit.frame*r),a&&t.drawImage(a,o,0,r,a.height,s,n,this.width,this.height)}_isRectColliding(t,e){return t.x<e.x+e.width&&t.x+t.width>e.x&&t.y<e.y+e.height&&t.y+t.height>e.y}reset(){this.y=this.initialY,this.state="idle",this.timers.blink=Math.random()*3+2,this.shakeOffset={x:0,y:0},this.animations.blink.frame=0,this.animations.hit.frame=0}}const xe={fire_trap:de,spike:ue,trampoline:pe,spiked_ball:me,arrow_bubble:fe,fan:ge,falling_platform:ye,rock_head:be,spike_head:ve};class Se{constructor(t){this.name=t.name||"Unnamed Level",this.gridWidth=t.gridWidth,this.gridHeight=t.gridHeight,this.width=this.gridWidth*S.TILE_SIZE,this.height=this.gridHeight*S.TILE_SIZE,this.background=t.background||"background_blue",this.backgroundScroll=t.backgroundScroll||{x:0,y:15},this.startPosition={x:t.startPosition.x*S.TILE_SIZE,y:t.startPosition.y*S.TILE_SIZE},this.tiles=t.layout.map(e=>[...e].map(i=>Y[i]||Y[0])),this.fruits=[],this.checkpoints=[],this.traps=[],this.trophy=null,(t.objects||[]).forEach(e=>{const i=e.x*S.TILE_SIZE,s=e.y*S.TILE_SIZE,n=xe[e.type];n?this.traps.push(new n(i,s,e)):e.type.startsWith("fruit_")?this.fruits.push({x:i,y:s,size:28,spriteKey:e.type,frame:0,frameCount:17,frameSpeed:.07,frameTimer:0,collected:!1,type:"fruit"}):e.type==="checkpoint"?this.checkpoints.push({x:i,y:s,size:64,state:"inactive",frame:0,frameCount:26,frameSpeed:.07,frameTimer:0,type:"checkpoint"}):e.type==="trophy"&&(this.trophy={x:i,y:s,size:64,frameCount:8,animationFrame:0,animationTimer:0,animationSpeed:.07,acquired:!1,inactive:!0,contactMade:!1,isAnimating:!1})}),this.totalFruitCount=this.fruits.length,this.collectedFruitCount=0,this.completed=!1}getTileAt(t,e){const i=Math.floor(t/S.TILE_SIZE),s=Math.floor(e/S.TILE_SIZE);return i<0||i>=this.gridWidth?Y[0]:s<0?Y[1]:s>=this.gridHeight||!this.tiles[s]?Y[0]:this.tiles[s][i]||Y[0]}update(t,e,i,s){this.updateFruits(t),this.updateTrophyAnimation(t),this.updateCheckpoints(t);const n=e.getComponent(i,C),a=e.getComponent(i,A),o=n&&a?{...n,width:a.width,height:a.height}:null;for(const r of this.traps)r.update(t,o,s,this)}updateCheckpoints(t){for(const e of this.checkpoints)e.state==="activating"&&(e.frameTimer+=t,e.frameTimer>=e.frameSpeed&&(e.frameTimer-=e.frameSpeed,e.frame++,e.frame>=e.frameCount&&(e.frame=0,e.state="active")))}getInactiveCheckpoints(){return this.checkpoints.filter(t=>t.state==="inactive")}updateFruits(t){for(const e of this.fruits)e.collected||(e.frameTimer+=t,e.frameTimer>=e.frameSpeed&&(e.frameTimer-=e.frameSpeed,e.frame=(e.frame+1)%e.frameCount))}collectFruit(t){t.collected||(t.collected=!0,this.collectedFruitCount++,this.trophy&&this.allFruitsCollected()&&(this.trophy.inactive=!1))}getActiveFruits(){return this.fruits.filter(t=>!t.collected)}getFruitCount(){return this.collectedFruitCount}getTotalFruitCount(){return this.totalFruitCount}allFruitsCollected(){return this.collectedFruitCount===this.totalFruitCount}recalculateCollectedFruits(){this.collectedFruitCount=this.fruits.reduce((t,e)=>t+(e.collected?1:0),0)}updateTrophyAnimation(t){const e=this.trophy;!e||!e.isAnimating||e.acquired||(e.animationTimer+=t,e.animationTimer>=e.animationSpeed&&(e.animationTimer-=e.animationSpeed,e.animationFrame=e.animationFrame+1,e.animationFrame>=e.frameCount&&(e.animationFrame=e.frameCount-1,e.isAnimating=!1,e.acquired=!0)))}isCompleted(){return this.fruits.length&&!this.allFruitsCollected()?!1:!this.trophy||this.trophy.acquired}reset(){this.fruits.forEach(t=>{t.collected=!1,t.frame=0,t.frameTimer=0}),this.collectedFruitCount=0,this.checkpoints.forEach(t=>{t.state="inactive",t.frame=0,t.frameTimer=0}),this.traps.forEach(t=>{t.reset(eventBus)}),this.trophy&&(this.trophy.acquired=!1,this.trophy.inactive=!0,this.trophy.isAnimating=!1,this.trophy.animationFrame=0,this.trophy.animationTimer=0),this.completed=!1}}class we{constructor(t){this.gameState=t,this.levelSections=L,c.subscribe("requestNextLevel",()=>this.goToNextLevel()),c.subscribe("requestPreviousLevel",()=>this.goToPreviousLevel())}loadLevel(t,e){if(t>=this.levelSections.length||e>=this.levelSections[t].levels.length)return console.error(`Invalid level: Section ${t}, Level ${e}`),null;const i=this.levelSections[t].levels[e];return i?(this.gameState.currentSection=t,this.gameState.currentLevelIndex=e,new Se(i)):(console.error(`Failed to load level data for Section ${t}, Level ${e}. The JSON file may be missing or failed to fetch.`),null)}hasNextLevel(){const{currentSection:t,currentLevelIndex:e}=this.gameState,i=e+1<this.levelSections[t].levels.length,s=t+1<this.levelSections.length;return i||s}hasPreviousLevel(){const{currentSection:t,currentLevelIndex:e}=this.gameState;return e>0||t>0}goToNextLevel(){if(!this.hasNextLevel())return;let{currentSection:t,currentLevelIndex:e}=this.gameState;e+1<this.levelSections[t].levels.length?e++:t+1<this.levelSections.length&&(t++,e=0),c.publish("requestLevelLoad",{sectionIndex:t,levelIndex:e})}goToPreviousLevel(){if(!this.hasPreviousLevel())return;let{currentSection:t,currentLevelIndex:e}=this.gameState;e>0?e--:t>0&&(t--,e=this.levelSections[t].levels.length-1),c.publish("requestLevelLoad",{sectionIndex:t,levelIndex:e})}}class _e{constructor(t){this.assets=t,this.activeParticles=[],this.inactivePool=[],this.poolSize=300;for(let e=0;e<this.poolSize;e++)this.inactivePool.push({});c.subscribe("createParticles",e=>this.create(e))}create({x:t,y:e,type:i,direction:s="right",particleSpeed:n=null}){const o={dash:{count:10,baseSpeed:150,spriteKey:"dust_particle",life:.4,gravity:50},double_jump:{count:7,baseSpeed:100,spriteKey:"dust_particle",life:.4,gravity:50},sand:{count:2,baseSpeed:20,spriteKey:"sand_particle",life:.5,gravity:120},mud:{count:2,baseSpeed:15,spriteKey:"mud_particle",life:.6,gravity:100},ice:{count:2,baseSpeed:25,spriteKey:"ice_particle",life:.4,gravity:20},walk_dust:{count:1,baseSpeed:15,spriteKey:"dust_particle",life:.4,gravity:80},jump_trail:{count:1,baseSpeed:10,spriteKey:"dust_particle",life:.3,gravity:20},fan_push:{count:2,baseSpeed:120,spriteKey:"dust_particle",life:.7,gravity:0}}[i];if(o)for(let r=0;r<o.count;r++){this.inactivePool.length===0&&this.inactivePool.push({});const l=this.inactivePool.pop();let d,p=(n||o.baseSpeed)*(.8+Math.random()*.4);if(i==="dash")d=(s==="right"?Math.PI:0)+(Math.random()-.5)*(Math.PI/2);else if(i==="double_jump")d=Math.PI/2+(Math.random()-.5)*(Math.PI/3);else if(i==="jump_trail")d=Math.random()*Math.PI*2,p*=Math.random()*.5;else if(i==="fan_push"){let m=0;switch(s){case"up":m=-Math.PI/2;break;case"left":m=Math.PI;break;case"down":m=Math.PI/2;break;case"right":default:m=0;break}d=m+(Math.random()-.5)*(Math.PI/6)}else d=-(Math.PI/2)+(Math.random()-.5)*(Math.PI/4);const y=o.life+Math.random()*.3;l.x=t,l.y=e,l.vx=Math.cos(d)*p,l.vy=Math.sin(d)*p,l.life=y,l.initialLife=y,l.size=5+Math.random()*4,l.alpha=1,l.spriteKey=o.spriteKey,l.gravity=o.gravity,this.activeParticles.push(l)}}update(t){for(let e=this.activeParticles.length-1;e>=0;e--){const i=this.activeParticles[e];if(i.life-=t,i.life<=0){const s=this.activeParticles.splice(e,1)[0];this.inactivePool.push(s)}else i.x+=i.vx*t,i.y+=i.vy*t,i.vy+=(i.gravity||50)*t,i.alpha=Math.max(0,i.life/i.initialLife)}}render(t,e){if(this.activeParticles.length!==0){t.save(),e.apply(t);for(const i of this.activeParticles){const s=this.assets[i.spriteKey]||this.assets.dust_particle;!s||!e.isVisible(i.x,i.y,i.size,i.size)||(t.globalAlpha=i.alpha,t.drawImage(s,i.x-i.size/2,i.y-i.size/2,i.size,i.size))}e.restore(t),t.restore()}}}class ke{constructor(t,e){this.canvas=t,this.assets=e,this.hoveredButton=null;const i=64,s=20,n=20,a=10,o=this.canvas.width-i-s;this.uiButtons=[{id:"settings",x:o,y:n+(i+a)*0,width:i,height:i,assetKey:"settings_icon",visible:!1},{id:"pause",x:o,y:n+(i+a)*1,width:i,height:i,assetKey:"pause_icon",visible:!1},{id:"levels",x:o,y:n+(i+a)*2,width:i,height:i,assetKey:"levels_icon",visible:!1},{id:"character",x:o,y:n+(i+a)*3,width:i,height:i,assetKey:"character_icon",visible:!1},{id:"info",x:o,y:n+(i+a)*4,width:i,height:i,assetKey:"info_icon",visible:!1}],this.canvas.addEventListener("mousemove",r=>this.handleMouseMove(r)),this.canvas.addEventListener("click",r=>this.handleCanvasClick(r)),c.subscribe("gameStarted",()=>this.uiButtons.forEach(r=>r.visible=!0))}_getMousePos(t){const e=this.canvas.getBoundingClientRect(),i=this.canvas.width/e.width,s=this.canvas.height/e.height;return{x:(t.clientX-e.left)*i,y:(t.clientY-e.top)*s}}handleMouseMove(t){const{x:e,y:i}=this._getMousePos(t);this.hoveredButton=null;for(const s of this.uiButtons)if(s.visible&&e>=s.x&&e<=s.x+s.width&&i>=s.y&&i<=s.y+s.height){this.hoveredButton=s;break}}handleCanvasClick(t){this.hoveredButton&&(c.publish("playSound",{key:"button_click",volume:.8,channel:"UI"}),c.publish("ui_button_clicked",{buttonId:this.hoveredButton.id}))}update(){}render(t,e){t.save(),t.setTransform(1,0,0,1,0,0);for(const i of this.uiButtons){if(!i.visible)continue;const s=i.id==="pause"?e?"pause_icon":"play_icon":i.assetKey,n=this.assets[s];if(!n)continue;const a=this.hoveredButton?.id===i.id,o=a?1.1:1,r=i.width*o,l=i.height*o,d=i.x-(r-i.width)/2,u=i.y-(l-i.height)/2;t.globalAlpha=a?1:.8,t.drawImage(n,d,u,r,l)}t.restore()}}class It{constructor(){this.nextEntityId=0,this.entities=new Set,this.componentsByClass=new Map}createEntity(){const t=this.nextEntityId++;return this.entities.add(t),t}addComponent(t,e){const i=e.constructor;return this.componentsByClass.has(i)||this.componentsByClass.set(i,new Map),this.componentsByClass.get(i).set(t,e),this}getComponent(t,e){const i=this.componentsByClass.get(e);return i?i.get(t):void 0}hasComponent(t,e){const i=this.componentsByClass.get(e);return i?i.has(t):!1}removeComponent(t,e){const i=this.componentsByClass.get(e);i&&i.delete(t)}destroyEntity(t){for(const e of this.componentsByClass.values())e.delete(t);this.entities.delete(t)}query(t){const e=[];for(const i of this.entities)t.every(s=>this.hasComponent(i,s))&&e.push(i);return e}}class z{constructor(){this.moveLeft=!1,this.moveRight=!1,this.jump=!1,this.dash=!1}}class I{constructor(t="idle"){this.currentState=t}}class st{constructor(t=100,e=100){this.maxHealth=t,this.currentHealth=e}}function Ce(h,t,e,i){const s=h.createEntity();return h.addComponent(s,new C(t,e)),h.addComponent(s,new M),h.addComponent(s,new _t(i)),h.addComponent(s,new E({spriteKey:null,width:g.SPAWN_WIDTH,height:g.SPAWN_HEIGHT,animationState:"spawn"})),h.addComponent(s,new x),h.addComponent(s,new A({type:"dynamic",solid:!0,width:g.WIDTH,height:g.HEIGHT})),h.addComponent(s,new z),h.addComponent(s,new I("spawn")),h.addComponent(s,new st),s}class Ae{constructor(t){this.entityManager=t,this.keys=new Set,this.initEventListeners()}initEventListeners(){window.addEventListener("keydown",this.handleKeyDown.bind(this)),window.addEventListener("keyup",this.handleKeyUp.bind(this)),window.addEventListener("contextmenu",t=>t.preventDefault())}handleKeyDown(t){const e=t.key.toLowerCase();this.keys.add(e);const i={enter:"confirm",r:"restart",n:"next",p:"previous",escape:"escape_pressed"};e===" "&&c.publish("action_confirm_pressed");const s=i[e];s&&c.publish(`action_${s}`)}handleKeyUp(t){const e=t.key.toLowerCase();this.keys.delete(e)}update(t,{keybinds:e,isRunning:i,gameState:s}){const n=i&&!s.showingLevelComplete,a=this.entityManager.query([x,z]);for(const o of a){const r=this.entityManager.getComponent(o,z);r.moveLeft=n&&this.keys.has(e.moveLeft),r.moveRight=n&&this.keys.has(e.moveRight),r.jump=n&&this.keys.has(e.jump),r.dash=n&&this.keys.has(e.dash)}}}class Te{constructor(){c.subscribe("collisionEvent",t=>this.handleCollision(t)),c.subscribe("playerLandedHard",t=>this.handlePlayerLandedHard(t))}handlePlayerLandedHard({entityId:t,landingVelocity:e}){const{FALL_DAMAGE_MIN_VELOCITY:i,FALL_DAMAGE_MAX_VELOCITY:s,FALL_DAMAGE_MIN_AMOUNT:n,FALL_DAMAGE_MAX_AMOUNT:a}=g,r=(Math.max(i,Math.min(e,s))-i)/(s-i),l=Math.round(n+r*(a-n));c.publish("playerTookDamage",{amount:l,source:"fall"})}handleCollision({type:t,entityId:e,target:i,entityManager:s,damage:n,knockback:a}){if(s.getComponent(e,x))switch(t){case"fruit":c.publish("fruitCollected",i);break;case"world_bottom":c.publish("playerDied");break;case"hazard":const r=n!==void 0?n:k.DEFAULT_HAZARD_DAMAGE;r>0&&c.publish("playerTookDamage",{amount:r,source:"hazard"}),a&&c.publish("playerKnockback",{entityId:e,entityManager:s,vx:a.vx,vy:a.vy});break;case"checkpoint":c.publish("checkpointActivated",i);break}}update(t,e){}}class Ee{constructor(){c.subscribe("playerTookDamage",t=>this.handleDamageTaken(t)),c.subscribe("playerRespawned",()=>{this.clearDamageEvents(),this.clearKnockbackEvents()}),c.subscribe("playerKnockback",t=>this.handleKnockback(t)),this.damageEvents=[],this.knockbackEvents=[]}clearDamageEvents(){this.damageEvents=[]}clearKnockbackEvents(){this.knockbackEvents=[]}handleDamageTaken(t){this.damageEvents.push(t)}handleKnockback(t){this.knockbackEvents.push(t)}_processDamageEvents(t){if(this.damageEvents.length===0)return;const e=t.query([x,E,I]);for(const i of this.damageEvents)for(const s of e){const n=t.getComponent(s,x),a=t.getComponent(s,E),o=t.getComponent(s,I);n.isHit||n.isSpawning||(i.source==="fall"||i.source==="fire"||i.source==="hazard")&&!n.isHit&&(n.isHit=!0,n.hitStunTimer=g.HIT_STUN_DURATION,this._setAnimationState(a,o,"hit",n,t.getComponent(s,A)),c.publish("playSound",{key:"hit",volume:.5,channel:"SFX"}))}this.damageEvents=[]}_processKnockbackEvents(t){if(this.knockbackEvents.length!==0){for(const e of this.knockbackEvents){const{entityId:i,vx:s,vy:n}=e;if(t.getComponent(i,x)){const o=t.getComponent(i,M);o&&(o.vx=s,o.vy=n)}}this.knockbackEvents=[]}}update(t,{entityManager:e}){this._processDamageEvents(e),this._processKnockbackEvents(e);const i=e.query([x,C,M,A,E,z,I]);for(const s of i){const n=e.getComponent(s,x),a=e.getComponent(s,C),o=e.getComponent(s,M),r=e.getComponent(s,A),l=e.getComponent(s,E),d=e.getComponent(s,z),u=e.getComponent(s,I);this._updateTimers(t,n),this._handleInput(t,d,a,o,n,r,l,u),this._updateFSM(o,n,r,l,u),this._updateAnimation(t,n,l,u),this._handleJumpTrail(t,a,r,n,u),r.isGrounded&&(n.coyoteTimer=g.COYOTE_TIME)}}_handleJumpTrail(t,e,i,s,n){n.currentState==="jump"&&s.jumpCount===1?(s.jumpParticleTimer-=t,s.jumpParticleTimer<=0&&(s.jumpParticleTimer=.05,c.publish("createParticles",{x:e.x+i.width/2,y:e.y+i.height,type:"jump_trail"}))):s.jumpParticleTimer=0}_updateTimers(t,e){e.jumpBufferTimer>0&&(e.jumpBufferTimer-=t),e.coyoteTimer>0&&(e.coyoteTimer-=t),e.dashCooldownTimer>0&&(e.dashCooldownTimer-=t),e.isHit&&(e.hitStunTimer-=t,e.hitStunTimer<=0&&(e.isHit=!1)),e.isDashing&&(e.dashTimer-=t,e.dashTimer<=0&&(e.isDashing=!1))}_handleInput(t,e,i,s,n,a,o,r){if(!(n.isSpawning||n.isDashing||n.isDespawning||n.isHit)){if(e.moveLeft?o.direction="left":e.moveRight&&(o.direction="right"),!n.vLock){const l=e.jump&&!n.jumpPressed;if(e.jump&&(n.jumpBufferTimer=g.JUMP_BUFFER_TIME),n.jumpBufferTimer>0&&(a.isGrounded||n.coyoteTimer>0)&&n.jumpCount===0){const d=n.jumpForce*(a.groundType==="mud"?g.MUD_JUMP_MULTIPLIER:1);s.vy=-d,n.jumpCount=1,n.jumpBufferTimer=0,n.coyoteTimer=0,c.publish("playSound",{key:"jump",volume:.8,channel:"SFX"})}else l&&a.isAgainstWall&&!a.isGrounded?(s.vx=(o.direction==="left"?1:-1)*n.speed,o.direction=o.direction==="left"?"right":"left",s.vy=-n.jumpForce,n.jumpCount=1,c.publish("playSound",{key:"jump",volume:.8,channel:"SFX"})):l&&n.jumpCount===1&&!a.isGrounded&&!a.isAgainstWall&&(s.vy=-n.jumpForce,n.jumpCount=2,n.jumpBufferTimer=0,this._setAnimationState(o,r,"double_jump",n,a),c.publish("playSound",{key:"double_jump",volume:.6,channel:"SFX"}),c.publish("createParticles",{x:i.x+a.width/2,y:i.y+a.height,type:"double_jump"}))}n.vLock=!1,n.jumpPressed=e.jump,e.dash&&!n.dashPressed&&n.dashCooldownTimer<=0&&(n.isDashing=!0,n.dashTimer=n.dashDuration,s.vx=o.direction==="right"?n.dashSpeed:-n.dashSpeed,s.vy=0,n.dashCooldownTimer=g.DASH_COOLDOWN,this._setAnimationState(o,r,"dash",n,a),c.publish("playSound",{key:"dash",volume:.7,channel:"SFX"}),c.publish("createParticles",{x:i.x+a.width/2,y:i.y+a.height/2,type:"dash",direction:o.direction})),n.dashPressed=e.dash}}_updateFSM(t,e,i,s,n){const a=n.currentState;if(!(a==="spawn"&&!e.spawnComplete||a==="despawn")){if(a==="spawn"&&e.spawnComplete){this._setAnimationState(s,n,"idle",e,i);return}if(e.isHit){a!=="hit"&&this._setAnimationState(s,n,"hit",e,i);return}if(a==="hit"&&!e.isHit&&this._setAnimationState(s,n,"idle",e,i),e.isDashing){a!=="dash"&&this._setAnimationState(s,n,"dash",e,i);return}i.isGrounded?Math.abs(t.vx)>1?a!=="run"&&this._setAnimationState(s,n,"run",e,i):a!=="idle"&&this._setAnimationState(s,n,"idle",e,i):i.isAgainstWall&&e.coyoteTimer<=0&&t.vy>=0?a!=="cling"&&this._setAnimationState(s,n,"cling",e,i):t.vy<0&&a!=="jump"&&a!=="double_jump"?this._setAnimationState(s,n,"jump",e,i):t.vy>.1&&a!=="fall"&&this._setAnimationState(s,n,"fall",e,i)}}_setAnimationState(t,e,i,s,n){if(e.currentState!==i){let a=null;i==="run"&&n.isGrounded&&(a={sand:"sand_walk",mud:"mud_run",ice:"ice_run"}[n.groundType]||null),a!==s.activeSurfaceSound&&(s.activeSurfaceSound&&c.publish("stopSoundLoop",{key:s.activeSurfaceSound}),a&&c.publish("startSoundLoop",{key:a,channel:"SFX"}),s.activeSurfaceSound=a),e.currentState=i,t.animationState=i,t.animationFrame=0,t.animationTimer=0,i==="cling"?s.jumpCount=1:(i==="idle"||i==="run")&&(s.jumpCount=0)}}_updateAnimation(t,e,i,s){i.animationTimer+=t;const n=i.animationState;let a;if(n==="spawn"||n==="despawn"?a=g.SPAWN_ANIMATION_SPEED:n==="hit"?a=g.HIT_ANIMATION_SPEED:a=g.ANIMATION_SPEED,i.animationTimer<a)return;i.animationTimer-=a;const o=g.ANIMATION_FRAMES[n]||1;i.animationFrame++,n==="spawn"||n==="despawn"||n==="hit"?i.animationFrame>=o&&(i.animationFrame=o-1,n==="spawn"&&(e.isSpawning=!1,e.spawnComplete=!0,i.width=g.WIDTH,i.height=g.HEIGHT),n==="despawn"&&(e.isDespawning=!1,e.despawnAnimationFinished=!0)):i.animationFrame%=o}}class $e{constructor(){}update(t,{entityManager:e}){const i=e.query([x,M,A,z,C,I]);for(const s of i){const n=e.getComponent(s,M),a=e.getComponent(s,A),o=e.getComponent(s,x),r=e.getComponent(s,z),l=e.getComponent(s,C),d=e.getComponent(s,I);if(o.isSpawning||o.isDespawning){n.vx=0,n.vy=0;continue}this._applyHorizontalMovement(t,r,n,a,o),this._applyVerticalMovement(t,n,a,o,d),this._updateSurfaceEffects(t,l,n,a,o)}}_applyHorizontalMovement(t,e,i,s,n){if(n.isDashing||n.isHit){n.isHit&&(i.vx=0);return}const a=!n.hLock;n.hLock=!1;const o=1e3;if(s.isGrounded&&s.groundType==="ice"){const r=g.ICE_ACCELERATION,l=g.ICE_FRICTION;a&&e.moveLeft?i.vx-=r*t:a&&e.moveRight?i.vx+=r*t:i.vx>0?(i.vx-=l*t,i.vx<0&&(i.vx=0)):i.vx<0&&(i.vx+=l*t,i.vx>0&&(i.vx=0)),i.vx=Math.max(-n.speed,Math.min(n.speed,i.vx))}else{const r=n.speed*(s.isGrounded&&s.groundType==="sand"?g.SAND_MOVE_MULTIPLIER:1);a&&e.moveLeft?i.vx=-r:a&&e.moveRight?i.vx=r:i.vx>0?(i.vx-=o*t,i.vx<0&&(i.vx=0)):i.vx<0&&(i.vx+=o*t,i.vx>0&&(i.vx=0))}}_applyVerticalMovement(t,e,i,s,n){!i.isGrounded&&!s.isDashing&&!s.isHit&&!s.isSpawning&&(e.vy+=g.GRAVITY*t),n&&n.currentState==="cling"&&(e.vy=Math.min(e.vy,30)),e.vy=Math.min(e.vy,g.MAX_FALL_SPEED)}_updateSurfaceEffects(t,e,i,s,n){if(s.isGrounded&&Math.abs(i.vx)>1&&!n.isDashing&&!n.isHit){n.surfaceParticleTimer+=t;const o=s.groundType==="sand"||s.groundType==="mud"?.1:.15;if(n.surfaceParticleTimer>=o){n.surfaceParticleTimer=0;let r;switch(s.groundType){case"sand":r="sand";break;case"mud":r="mud";break;case"ice":r="ice";break;default:s.groundType&&(r="walk_dust");break}r&&c.publish("createParticles",{x:e.x+s.width/2,y:e.y+s.height,type:r})}}}}class Le{constructor(){this.levelStartTime=0,this.levelTime=0}reset(t){t?this.levelStartTime=performance.now():this.levelStartTime=0,this.levelTime=0}update(t,{entityManager:e,playerEntityId:i,level:s,isRunning:n,gameState:a,levelManager:o}){this.levelStartTime===0&&n&&(this.levelStartTime=performance.now()),n&&!a.showingLevelComplete&&(this.levelTime=(performance.now()-this.levelStartTime)/1e3);const r=e.getComponent(i,x);if(r&&(s.trophy&&s.trophy.acquired&&!r.isDespawning&&this._startPlayerDespawnSequence(e,i),r.despawnAnimationFinished&&!a.showingLevelComplete)){r.despawnAnimationFinished=!1;const l={deaths:r.deathCount,time:this.levelTime},d=a.onLevelComplete(l);d!==a&&(c.publish("gameStateUpdated",d),c.publish("pauseGame"),c.publish("levelComplete",{deaths:l.deaths,time:l.time,hasNextLevel:o.hasNextLevel(),hasPreviousLevel:o.hasPreviousLevel()}))}}_startPlayerDespawnSequence(t,e){const i=t.getComponent(e,x),s=t.getComponent(e,E),n=t.getComponent(e,I);i&&!i.isDespawning&&(c.publish("cameraShakeRequested",{intensity:8,duration:.3}),i.isDespawning=!0,s.animationState="despawn",n.currentState="despawn",s.animationFrame=0,s.animationTimer=0,s.width=g.SPAWN_WIDTH,s.height=g.SPAWN_HEIGHT)}}class Ie{constructor(t){this.assets=t,this.activeEffects=[],c.subscribe("fruitCollected",e=>this._onFruitCollected(e))}_onFruitCollected(t){this.activeEffects.push({type:"fruit_collected",x:t.x,y:t.y,size:t.size,frame:0,frameCount:6,frameSpeed:.1,frameTimer:0})}reset(){this.activeEffects=[]}update(t){for(let e=this.activeEffects.length-1;e>=0;e--){const i=this.activeEffects[e];i.frameTimer+=t,i.frameTimer>=i.frameSpeed&&(i.frameTimer=0,i.frame++,i.frame>=i.frameCount&&this.activeEffects.splice(e,1))}}render(t,e){if(this.activeEffects.length===0)return;e.apply(t);const i=this.assets.fruit_collected;if(i){const s=i.width/6;for(const n of this.activeEffects){if(!e.isRectVisible({x:n.x,y:n.y,width:n.size,height:n.size}))continue;const a=n.frame*s;t.drawImage(i,a,0,s,i.height,n.x-n.size/2,n.y-n.size/2,n.size,n.size)}}e.restore(t)}}class Me{constructor(t,e,i,s,n){this.ctx=t,this.canvas=e,this.assets=i,this.lastFrameTime=0,this.keybinds=s,this.isRunning=!1,this.gameHasStarted=!1,this.pauseForMenu=!1,this.entityManager=new It,this.lastCheckpoint=null,this.fruitsAtLastCheckpoint=new Set,this.playerEntityId=null,this.camera=new ne(e.width,e.height),this.hud=new re(e,n),this.soundManager=new oe,this.soundManager.loadSounds(i),this.renderer=new ce(t,e,i),this.gameState=new pt,c.publish("gameStateUpdated",this.gameState),this.levelManager=new we(this.gameState),this.inputSystem=new Ae(this.entityManager),this.playerStateSystem=new Ee,this.movementSystem=new $e,this.collisionSystem=new le,this.gameplaySystem=new Te,this.particleSystem=new _e(i),this.effectsSystem=new Ie(i),this.gameFlowSystem=new Le,this.uiSystem=new ke(e,i),this.systems=[this.inputSystem,this.playerStateSystem,this.movementSystem,this.collisionSystem,this.gameplaySystem,this.particleSystem,this.effectsSystem,this.gameFlowSystem,this.uiSystem],this.currentLevel=null,this._setupEventSubscriptions()}_setupEventSubscriptions(){c.subscribe("requestStartGame",()=>this.loadLevel(this.gameState.currentSection,this.gameState.currentLevelIndex)),c.subscribe("requestLevelLoad",({sectionIndex:t,levelIndex:e})=>this.loadLevel(t,e)),c.subscribe("requestLevelRestart",()=>this.loadLevel(this.gameState.currentSection,this.gameState.currentLevelIndex)),c.subscribe("keybindsUpdated",t=>this.updateKeybinds(t)),c.subscribe("fruitCollected",t=>this._onFruitCollected(t)),c.subscribe("playerTookDamage",t=>this._onPlayerTookDamage(t)),c.subscribe("checkpointActivated",t=>this._onCheckpointActivated(t)),c.subscribe("playerDied",()=>this._onPlayerDied()),c.subscribe("characterUpdated",t=>this.updatePlayerCharacter(t)),c.subscribe("cameraShakeRequested",t=>this._onCameraShakeRequested(t)),c.subscribe("menuOpened",()=>{this.pauseForMenu=!0,this.pause()}),c.subscribe("allMenusClosed",()=>{this.pauseForMenu=!1,this.resume()}),c.subscribe("pauseGame",()=>this.pause()),c.subscribe("gameStateUpdated",t=>this.gameState=t)}updateKeybinds(t){this.keybinds={...t}}start(){this.isRunning||(this.isRunning=!0,this.gameHasStarted=!0,this.lastFrameTime=performance.now(),c.publish("gameStarted"),c.publish("gameResumed"),this.gameLoop())}stop(){this.isRunning=!1,this.soundManager.stopAll()}pause(){if(!this.isRunning)return;this.isRunning=!1,this.soundManager.stopAll({except:["UI"]});const t=this.entityManager.getComponent(this.playerEntityId,x);t&&(t.needsRespawn=!1),c.publish("gamePaused")}resume(){if(this.pauseForMenu||this.isRunning||!this.gameHasStarted||this.gameState.showingLevelComplete)return;this.isRunning=!0,this.lastFrameTime=performance.now(),c.publish("gameResumed"),this.gameLoop();const t=this.entityManager.getComponent(this.playerEntityId,x);t&&(t.needsRespawn=!1)}gameLoop(t=performance.now()){if(!this.isRunning)return;const e=Math.min((t-this.lastFrameTime)/1e3,.016);this.lastFrameTime=t,this.update(e),this.render(e),requestAnimationFrame(i=>this.gameLoop(i))}loadLevel(t,e){this.levelManager.gameState=this.gameState;const i=this.levelManager.loadLevel(t,e);if(!i){this.stop();return}this.currentLevel=i,this.pauseForMenu=!1;const s=new pt(this.gameState);s.showingLevelComplete=!1,s.currentSection=t,s.currentLevelIndex=e,this.gameState=s,this.gameState.incrementAttempts(t,e),c.publish("gameStateUpdated",this.gameState),this.lastCheckpoint=null,this.fruitsAtLastCheckpoint.clear(),this.soundManager.stopAll(),this.entityManager=new It,this.inputSystem.entityManager=this.entityManager,this.effectsSystem.reset(),this.gameFlowSystem.reset(this.isRunning),this.playerEntityId=Ce(this.entityManager,this.currentLevel.startPosition.x,this.currentLevel.startPosition.y,this.gameState.selectedCharacter),this.camera.updateLevelBounds(this.currentLevel.width,this.currentLevel.height),this.camera.snapToPlayer(this.entityManager,this.playerEntityId),this.renderer.preRenderLevel(this.currentLevel),this.gameHasStarted?this.resume():this.start(),c.publish("levelLoaded",{gameState:this.gameState})}update(t){if(!this.currentLevel)return;this.camera.update(this.entityManager,this.playerEntityId,t);const e={entityManager:this.entityManager,playerEntityId:this.playerEntityId,level:this.currentLevel,camera:this.camera,isRunning:this.isRunning,gameState:this.gameState,keybinds:this.keybinds,dt:t,levelManager:this.levelManager};for(const n of this.systems)n.update(t,e);const i=this.entityManager.getComponent(this.playerEntityId,x);i&&i.needsRespawn&&!this.gameState.showingLevelComplete&&this.isRunning&&this._respawnPlayer(),this.currentLevel.update(t,this.entityManager,this.playerEntityId,c);const s=this.entityManager.getComponent(this.playerEntityId,st);c.publish("statsUpdated",{levelName:this.currentLevel.name,collectedFruits:this.currentLevel.getFruitCount(),totalFruits:this.currentLevel.getTotalFruitCount(),deathCount:i?i.deathCount:0,levelTime:this.gameFlowSystem.levelTime,health:s?s.currentHealth:100,maxHealth:s?s.maxHealth:100})}_onPlayerTookDamage({amount:t}){const e=this.entityManager.getComponent(this.playerEntityId,st),i=this.entityManager.getComponent(this.playerEntityId,x);e&&i&&!i.isHit&&!i.needsRespawn&&(e.currentHealth=Math.max(0,e.currentHealth-t),this.camera.shake(8,.3),e.currentHealth<=0&&this._onPlayerDied())}_onPlayerDied(){const t=this.entityManager.getComponent(this.playerEntityId,x);if(t&&!t.needsRespawn){const e=this.entityManager.getComponent(this.playerEntityId,M),i=this.entityManager.getComponent(this.playerEntityId,I),s=this.entityManager.getComponent(this.playerEntityId,E);t.needsRespawn=!0,t.deathCount++,e.vx=0,e.vy=0,t.isHit=!0,i.currentState="hit",s.animationState="hit",s.animationFrame=0,s.animationTimer=0,c.publish("playSound",{key:"death_sound",volume:.3,channel:"SFX"})}}_respawnPlayer(){const t=this.lastCheckpoint||this.currentLevel.startPosition;this.lastCheckpoint?this.currentLevel.fruits.forEach((u,p)=>u.collected=this.fruitsAtLastCheckpoint.has(p)):this.currentLevel.fruits.forEach(u=>u.collected=!1),this.currentLevel.recalculateCollectedFruits(),this.effectsSystem.reset(),this.currentLevel.trophy&&(this.currentLevel.trophy.acquired=!1,this.currentLevel.trophy.isAnimating=!1,this.currentLevel.trophy.animationFrame=0,this.currentLevel.trophy.animationTimer=0,this.currentLevel.trophy.inactive=!this.currentLevel.allFruitsCollected());const e=this.entityManager.getComponent(this.playerEntityId,C),i=this.entityManager.getComponent(this.playerEntityId,M),s=this.entityManager.getComponent(this.playerEntityId,x),n=this.entityManager.getComponent(this.playerEntityId,E),a=this.entityManager.getComponent(this.playerEntityId,A),o=this.entityManager.getComponent(this.playerEntityId,I),r=this.entityManager.getComponent(this.playerEntityId,st);e.x=t.x,e.y=t.y,i.vx=0,i.vy=0,r&&(r.currentHealth=r.maxHealth);const l=s.deathCount,d=s.activeSurfaceSound;Object.assign(s,new x),s.deathCount=l,s.activeSurfaceSound=d,s.needsRespawn=!1,o.currentState="spawn",n.animationState="spawn",n.animationFrame=0,n.animationTimer=0,n.direction="right",n.width=g.SPAWN_WIDTH,n.height=g.SPAWN_HEIGHT,a.isGrounded=!1,a.isAgainstWall=!1,a.groundType=null,this.camera.shake(15,.5),c.publish("playerRespawned")}_onFruitCollected(t){this.currentLevel.collectFruit(t),c.publish("playSound",{key:"collect",volume:.8,channel:"SFX"});const e=this.entityManager.getComponent(this.playerEntityId,st);e&&e.currentHealth<e.maxHealth&&(e.currentHealth=Math.min(e.maxHealth,e.currentHealth+10))}updatePlayerCharacter(t){if(this.playerEntityId===null)return;const e=this.entityManager.getComponent(this.playerEntityId,_t);e&&(e.characterId=t||this.gameState.selectedCharacter)}_onCheckpointActivated(t){t.state="activating",this.lastCheckpoint={x:t.x,y:t.y-t.size/2},c.publish("playSound",{key:"checkpoint_activated",volume:1,channel:"UI"}),this.fruitsAtLastCheckpoint.clear(),this.currentLevel.fruits.forEach((e,i)=>{e.collected&&this.fruitsAtLastCheckpoint.add(i)}),this.currentLevel.checkpoints.forEach(e=>{e!==t&&e.state==="active"&&(e.state="inactive",e.frame=0)})}_onCameraShakeRequested({intensity:t,duration:e}){this.camera&&this.camera.shake(t,e)}render(t){this.currentLevel&&(this.ctx.clearRect(0,0,this.canvas.width,this.canvas.height),this.renderer.drawScrollingBackground(this.currentLevel,t),this.renderer.renderScene(this.camera,this.currentLevel,this.entityManager),this.particleSystem.render(this.ctx,this.camera),this.effectsSystem.render(this.ctx,this.camera),this.hud.drawGameHUD(this.ctx),this.uiSystem.render(this.ctx,this.isRunning))}}function Re(h,t,e,i=!0){const s=document.createElement("canvas");s.width=h,s.height=t;const n=s.getContext("2d");return n.fillStyle=e,n.fillRect(0,0,h,t),i&&(n.fillStyle="rgba(0, 0, 0, 0.1)",n.fillRect(0,0,h/2,t/2),n.fillRect(h/2,t/2,h/2,t/2)),s}function Mt(h,t){return new Promise(e=>{const i=new Image,s=1e4;let n=!1;const a=()=>{if(n)return;n=!0,console.warn(`Failed or timed out loading image: ${h}. Using fallback.`);let r="#808080";t.includes("player")?r="#ff8c21":t.includes("fruit")&&(r="#FF6B6B");const l=Re(32,32,r),d=new Image;d.src=l.toDataURL(),d.onload=()=>e(d)},o=setTimeout(a,s);i.onload=()=>{n||(clearTimeout(o),e(i))},i.onerror=()=>{clearTimeout(o),a()},i.crossOrigin="anonymous",i.src=h})}function Pe(h,t){return new Promise(e=>{const i=new Audio,s=1e4;let n=!1;const a=()=>{if(n)return;n=!0,console.warn(`Failed or timed out loading sound: ${h}. Using silent fallback.`);const r=new Audio("data:audio/wav;base64,UklGRigAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA=");e(r)},o=setTimeout(a,s);i.addEventListener("canplaythrough",()=>{n||(clearTimeout(o),e(i))}),i.addEventListener("error",()=>{clearTimeout(o),a()}),i.crossOrigin="anonymous",i.preload="auto",i.src=h,i.load()})}function Fe(h){return fetch(h).then(t=>{if(!t.ok)throw new Error(`Failed to fetch level: ${h}, status: ${t.status}`);return t.json()}).catch(t=>(console.error(`Error loading JSON from ${h}:`,t),null))}const xt={PinkMan:{path:"/assets/MainCharacters/PinkMan/"},NinjaFrog:{path:"/assets/MainCharacters/NinjaFrog/"},MaskDude:{path:"/assets/MainCharacters/MaskDude/"},VirtualGuy:{path:"/assets/MainCharacters/VirtualGuy/"}},Rt={playerJump:"jump.png",playerDoubleJump:"double_jump.png",playerIdle:"idle.png",playerRun:"run.png",playerFall:"fall.png",playerDash:"dash.png",playerCling:"wall_jump.png",playerHit:"hit.png"};async function Oe(){const h={font_spritesheet:"/assets/Menu/Text/Text (White) (8x10).png",settings_icon:"/assets/Menu/Buttons/Settings.png",pause_icon:"/assets/Menu/Buttons/Pause.png",play_icon:"/assets/Menu/Buttons/Play.png",levels_icon:"/assets/Menu/Buttons/Levels.png",character_icon:"/assets/Menu/Buttons/Character.png",info_icon:"/assets/Menu/Buttons/Info.png",background_blue:"/assets/Background/Blue.png",background_brown:"/assets/Background/Brown.png",background_gray:"/assets/Background/Gray.png",background_green:"/assets/Background/Green.png",background_pink:"/assets/Background/Pink.png",background_purple:"/assets/Background/Purple.png",background_red:"/assets/Background/Red.png",background_yellow:"/assets/Background/Yellow.png",block:"/assets/Terrain/Terrain.png",playerAppear:"/assets/MainCharacters/Appearing.png",playerDisappear:"/assets/MainCharacters/Disappearing.png",fruit_apple:"/assets/Items/Fruits/Apple.png",fruit_bananas:"/assets/Items/Fruits/Bananas.png",fruit_cherries:"/assets/Items/Fruits/Cherries.png",fruit_kiwi:"/assets/Items/Fruits/Kiwi.png",fruit_melon:"/assets/Items/Fruits/Melon.png",fruit_orange:"/assets/Items/Fruits/Orange.png",fruit_pineapple:"/assets/Items/Fruits/Pineapple.png",fruit_strawberry:"/assets/Items/Fruits/Strawberry.png",fruit_collected:"/assets/Items/Fruits/Collected.png",checkpoint_inactive:"/assets/Items/Checkpoints/Checkpoint/Checkpoint (No Flag).png",checkpoint_activation:"/assets/Items/Checkpoints/Checkpoint/Checkpoint (Flag Out).png",checkpoint_active:"/assets/Items/Checkpoints/Checkpoint/Checkpoint (Flag Idle).png",trophy_idle:"/assets/Items/Checkpoints/End/End (Idle).png",trophy_pressed:"/assets/Items/Checkpoints/End/End (Pressed).png",spike_two:"/assets/Traps/Spikes/Two.png",fire_off:"/assets/Traps/Fire/off.png",fire_hit:"/assets/Traps/Fire/hit.png",fire_on:"/assets/Traps/Fire/on.png",spiked_ball_chain:"/assets/Traps/Spiked Ball/Chain.png",spiked_ball:"/assets/Traps/Spiked Ball/Spiked Ball.png",saw:"/assets/Traps/Saw/on.png",saw_chain:"/assets/Traps/Saw/Chain.png",fan_off:"/assets/Traps/Fan/Off.png",fan_on:"/assets/Traps/Fan/On.png",arrow_idle:"/assets/Traps/Arrow/Idle.png",arrow_hit:"/assets/Traps/Arrow/Hit.png",falling_platform_off:"/assets/Traps/Falling Platforms/Off.png",falling_platform_on:"/assets/Traps/Falling Platforms/On.png",rh_blink:"/assets/Traps/Rock Head/Blink.png",rh_idle:"/assets/Traps/Rock Head/Idle.png",rh_bottom_hit:"/assets/Traps/Rock Head/Bottom Hit.png",sh_blink:"/assets/Traps/Spike Head/Blink.png",sh_idle:"/assets/Traps/Spike Head/Idle.png",sh_bottom_hit:"/assets/Traps/Spike Head/Bottom Hit.png",sand_mud_ice:"/assets/Traps/Sand Mud Ice/Sand Mud Ice.png",trampoline_idle:"/assets/Traps/Trampoline/Idle.png",trampoline_jump:"/assets/Traps/Trampoline/Jump.png",dust_particle:"/assets/Other/Dust Particle.png",ice_particle:"/assets/Traps/Sand Mud Ice/Ice Particle.png",sand_particle:"/assets/Traps/Sand Mud Ice/Sand Particle.png",mud_particle:"/assets/Traps/Sand Mud Ice/Mud Particle.png"},t={button_click:"/assets/Sounds/Button Click.mp3",jump:"/assets/Sounds/Player Jump.mp3",double_jump:"/assets/Sounds/Player Double Jump.mp3",collect:"/assets/Sounds/Fruit Collect.mp3",level_complete:"/assets/Sounds/Level Complete.mp3",trophy_activated:"/assets/Sounds/Trophy Activated.mp3",death_sound:"/assets/Sounds/Death.mp3",dash:"/assets/Sounds/Whoosh.mp3",checkpoint_activated:"/assets/Sounds/Checkpoint (Activation).mp3",hit:"/assets/Sounds/Hit.mp3",sand_walk:"/assets/Sounds/Sand Walk.mp3",mud_run:"/assets/Sounds/Mud Run.mp3",ice_run:"/assets/Sounds/Ice Run.mp3",trampoline_bounce:"/assets/Sounds/Boing.mp3",fire_activated:"/assets/Sounds/Fire (Activated).mp3",arrow_pop:"/assets/Sounds/Arrow Pop.mp3",fan_blowing:"/assets/Sounds/Fan Blowing.mp3",rh_slam:"/assets/Sounds/RH Slam.mp3",sh_slam:"/assets/Sounds/SH Slam.mp3",falling_platform:"/assets/Sounds/Falling Platform Whirring.mp3"};console.log("Starting asset loading...");const e=Object.entries(h).map(([o,r])=>Mt(r,o).then(l=>({[o]:l}))),i=Object.entries(t).map(([o,r])=>Pe(r).then(l=>({[o]:l}))),s=[];for(const o in xt)for(const r in Rt){const l=xt[o].path+Rt[r],d=Mt(l,`${o}-${r}`).then(u=>({type:"character",charKey:o,spriteKey:r,img:u}));s.push(d)}const n=[];L.forEach((o,r)=>{o.levels.forEach((l,d)=>{l.jsonPath&&n.push(Fe(l.jsonPath).then(u=>({data:u,sectionIndex:r,levelIndex:d,type:"level"})))})});const a=[...e,...i,...s,...n];try{const o=await Promise.all(a),r={characters:{}};for(const l in xt)r.characters[l]={};for(const l of o)l&&(l.type==="character"?r.characters[l.charKey][l.spriteKey]=l.img:l.type==="level"?L[l.sectionIndex].levels[l.levelIndex]=l.data:Object.assign(r,l));return console.log("All assets and level data processed. Available assets:",Object.keys(r).length),r}catch(o){throw console.error("A critical error occurred during asset loading:",o),o}}const Pt={A:{x:0,y:0},B:{x:8,y:0},C:{x:16,y:0},D:{x:24,y:0},E:{x:32,y:0},F:{x:40,y:0},G:{x:48,y:0},H:{x:56,y:0},I:{x:64,y:0},J:{x:72,y:0},K:{x:0,y:10},L:{x:8,y:10},M:{x:16,y:10},N:{x:24,y:10},O:{x:32,y:10},P:{x:40,y:10},Q:{x:48,y:10},R:{x:56,y:10},S:{x:64,y:10},T:{x:72,y:10},U:{x:0,y:20},V:{x:8,y:20},W:{x:16,y:20},X:{x:24,y:20},Y:{x:32,y:20},Z:{x:40,y:20},0:{x:0,y:30},1:{x:8,y:30},2:{x:16,y:30},3:{x:24,y:30},4:{x:32,y:30},5:{x:40,y:30},6:{x:48,y:30},7:{x:56,y:30},8:{x:64,y:30},9:{x:72,y:30},".":{x:0,y:40},",":{x:8,y:40},":":{x:16,y:40},"?":{x:24,y:40},"!":{x:32,y:40},"(":{x:40,y:40},")":{x:48,y:40},"+":{x:56,y:40},"-":{x:64,y:40},"/":{x:48,y:20}," ":{x:0,y:0,space:!0},"%":{x:56,y:20},"'":{x:64,y:20},"&":{x:72,y:20}},$=8,j=10;class He{constructor(t){this.sprite=t,this.sprite||console.error("Font spritesheet not provided to FontRenderer!"),this.characterCache=new Map}_getCachedCharacter(t,e){const i=`${t}_${e}`;if(this.characterCache.has(i))return this.characterCache.get(i);const s=Pt[t];if(!s)return null;const n=document.createElement("canvas");n.width=$,n.height=j;const a=n.getContext("2d");return a.imageSmoothingEnabled=!1,a.drawImage(this.sprite,s.x,s.y,$,j,0,0,$,j),a.globalCompositeOperation="source-in",a.fillStyle=e,a.fillRect(0,0,$,j),this.characterCache.set(i,n),n}_renderText(t,e,i,s,{scale:n=1,color:a=null}={}){if(!this.sprite)return;const o=e.toUpperCase();let r=i;t.imageSmoothingEnabled=!1;for(const l of o){const d=Pt[l];if(!d){r+=$*n;continue}if(d.space){r+=$*n;continue}let u,p=d.x,y=d.y;a?(u=this._getCachedCharacter(l,a),p=0,y=0):u=this.sprite,u&&t.drawImage(u,p,y,$,j,r,s,$*n,j*n),r+=$*n}}drawText(t,e,i,s,{scale:n=1,align:a="left",color:o="white",outlineColor:r=null,outlineWidth:l=1}={}){const d=this.getTextWidth(e,n);let u=i;if(a==="center"?u=i-d/2:a==="right"&&(u=i-d),r){const p={scale:n,color:r};this._renderText(t,e,u-l,s,p),this._renderText(t,e,u+l,s,p),this._renderText(t,e,u,s-l,p),this._renderText(t,e,u,s+l,p)}this._renderText(t,e,u,s,{scale:n,color:o})}getTextWidth(t,e=1){return t.length*$*e}renderTextToCanvas(t,e){if(!this.sprite)return null;const i=e.outlineColor&&e.outlineWidth?e.outlineWidth*2:0,s=this.getTextWidth(t,e.scale),n=j*e.scale,a=document.createElement("canvas");a.width=s+i,a.height=n+i;const o=a.getContext("2d"),r={...e,align:"left"};return this.drawText(o,t,i/2,i/2,r),a}}/**
 * @license
 * Copyright 2019 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */const ut=globalThis,kt=ut.ShadowRoot&&(ut.ShadyCSS===void 0||ut.ShadyCSS.nativeShadow)&&"adoptedStyleSheets"in Document.prototype&&"replace"in CSSStyleSheet.prototype,Ct=Symbol(),Ft=new WeakMap;let Xt=class{constructor(t,e,i){if(this._$cssResult$=!0,i!==Ct)throw Error("CSSResult is not constructable. Use `unsafeCSS` or `css` instead.");this.cssText=t,this.t=e}get styleSheet(){let t=this.o;const e=this.t;if(kt&&t===void 0){const i=e!==void 0&&e.length===1;i&&(t=Ft.get(e)),t===void 0&&((this.o=t=new CSSStyleSheet).replaceSync(this.cssText),i&&Ft.set(e,t))}return t}toString(){return this.cssText}};const je=h=>new Xt(typeof h=="string"?h:h+"",void 0,Ct),R=(h,...t)=>{const e=h.length===1?h[0]:t.reduce((i,s,n)=>i+(a=>{if(a._$cssResult$===!0)return a.cssText;if(typeof a=="number")return a;throw Error("Value passed to 'css' function must be a 'css' function result: "+a+". Use 'unsafeCSS' to pass non-literal values, but take care to ensure page security.")})(s)+h[n+1],h[0]);return new Xt(e,h,Ct)},De=(h,t)=>{if(kt)h.adoptedStyleSheets=t.map(e=>e instanceof CSSStyleSheet?e:e.styleSheet);else for(const e of t){const i=document.createElement("style"),s=ut.litNonce;s!==void 0&&i.setAttribute("nonce",s),i.textContent=e.cssText,h.appendChild(i)}},Ot=kt?h=>h:h=>h instanceof CSSStyleSheet?(t=>{let e="";for(const i of t.cssRules)e+=i.cssText;return je(e)})(h):h;/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */const{is:Ne,defineProperty:Ue,getOwnPropertyDescriptor:ze,getOwnPropertyNames:We,getOwnPropertySymbols:Be,getPrototypeOf:Ke}=Object,ft=globalThis,Ht=ft.trustedTypes,Xe=Ht?Ht.emptyScript:"",Ge=ft.reactiveElementPolyfillSupport,ot=(h,t)=>h,wt={toAttribute(h,t){switch(t){case Boolean:h=h?Xe:null;break;case Object:case Array:h=h==null?h:JSON.stringify(h)}return h},fromAttribute(h,t){let e=h;switch(t){case Boolean:e=h!==null;break;case Number:e=h===null?null:Number(h);break;case Object:case Array:try{e=JSON.parse(h)}catch{e=null}}return e}},Gt=(h,t)=>!Ne(h,t),jt={attribute:!0,type:String,converter:wt,reflect:!1,useDefault:!1,hasChanged:Gt};Symbol.metadata??=Symbol("metadata"),ft.litPropertyMetadata??=new WeakMap;let V=class extends HTMLElement{static addInitializer(t){this._$Ei(),(this.l??=[]).push(t)}static get observedAttributes(){return this.finalize(),this._$Eh&&[...this._$Eh.keys()]}static createProperty(t,e=jt){if(e.state&&(e.attribute=!1),this._$Ei(),this.prototype.hasOwnProperty(t)&&((e=Object.create(e)).wrapped=!0),this.elementProperties.set(t,e),!e.noAccessor){const i=Symbol(),s=this.getPropertyDescriptor(t,i,e);s!==void 0&&Ue(this.prototype,t,s)}}static getPropertyDescriptor(t,e,i){const{get:s,set:n}=ze(this.prototype,t)??{get(){return this[e]},set(a){this[e]=a}};return{get:s,set(a){const o=s?.call(this);n?.call(this,a),this.requestUpdate(t,o,i)},configurable:!0,enumerable:!0}}static getPropertyOptions(t){return this.elementProperties.get(t)??jt}static _$Ei(){if(this.hasOwnProperty(ot("elementProperties")))return;const t=Ke(this);t.finalize(),t.l!==void 0&&(this.l=[...t.l]),this.elementProperties=new Map(t.elementProperties)}static finalize(){if(this.hasOwnProperty(ot("finalized")))return;if(this.finalized=!0,this._$Ei(),this.hasOwnProperty(ot("properties"))){const e=this.properties,i=[...We(e),...Be(e)];for(const s of i)this.createProperty(s,e[s])}const t=this[Symbol.metadata];if(t!==null){const e=litPropertyMetadata.get(t);if(e!==void 0)for(const[i,s]of e)this.elementProperties.set(i,s)}this._$Eh=new Map;for(const[e,i]of this.elementProperties){const s=this._$Eu(e,i);s!==void 0&&this._$Eh.set(s,e)}this.elementStyles=this.finalizeStyles(this.styles)}static finalizeStyles(t){const e=[];if(Array.isArray(t)){const i=new Set(t.flat(1/0).reverse());for(const s of i)e.unshift(Ot(s))}else t!==void 0&&e.push(Ot(t));return e}static _$Eu(t,e){const i=e.attribute;return i===!1?void 0:typeof i=="string"?i:typeof t=="string"?t.toLowerCase():void 0}constructor(){super(),this._$Ep=void 0,this.isUpdatePending=!1,this.hasUpdated=!1,this._$Em=null,this._$Ev()}_$Ev(){this._$ES=new Promise(t=>this.enableUpdating=t),this._$AL=new Map,this._$E_(),this.requestUpdate(),this.constructor.l?.forEach(t=>t(this))}addController(t){(this._$EO??=new Set).add(t),this.renderRoot!==void 0&&this.isConnected&&t.hostConnected?.()}removeController(t){this._$EO?.delete(t)}_$E_(){const t=new Map,e=this.constructor.elementProperties;for(const i of e.keys())this.hasOwnProperty(i)&&(t.set(i,this[i]),delete this[i]);t.size>0&&(this._$Ep=t)}createRenderRoot(){const t=this.shadowRoot??this.attachShadow(this.constructor.shadowRootOptions);return De(t,this.constructor.elementStyles),t}connectedCallback(){this.renderRoot??=this.createRenderRoot(),this.enableUpdating(!0),this._$EO?.forEach(t=>t.hostConnected?.())}enableUpdating(t){}disconnectedCallback(){this._$EO?.forEach(t=>t.hostDisconnected?.())}attributeChangedCallback(t,e,i){this._$AK(t,i)}_$ET(t,e){const i=this.constructor.elementProperties.get(t),s=this.constructor._$Eu(t,i);if(s!==void 0&&i.reflect===!0){const n=(i.converter?.toAttribute!==void 0?i.converter:wt).toAttribute(e,i.type);this._$Em=t,n==null?this.removeAttribute(s):this.setAttribute(s,n),this._$Em=null}}_$AK(t,e){const i=this.constructor,s=i._$Eh.get(t);if(s!==void 0&&this._$Em!==s){const n=i.getPropertyOptions(s),a=typeof n.converter=="function"?{fromAttribute:n.converter}:n.converter?.fromAttribute!==void 0?n.converter:wt;this._$Em=s;const o=a.fromAttribute(e,n.type);this[s]=o??this._$Ej?.get(s)??o,this._$Em=null}}requestUpdate(t,e,i){if(t!==void 0){const s=this.constructor,n=this[t];if(i??=s.getPropertyOptions(t),!((i.hasChanged??Gt)(n,e)||i.useDefault&&i.reflect&&n===this._$Ej?.get(t)&&!this.hasAttribute(s._$Eu(t,i))))return;this.C(t,e,i)}this.isUpdatePending===!1&&(this._$ES=this._$EP())}C(t,e,{useDefault:i,reflect:s,wrapped:n},a){i&&!(this._$Ej??=new Map).has(t)&&(this._$Ej.set(t,a??e??this[t]),n!==!0||a!==void 0)||(this._$AL.has(t)||(this.hasUpdated||i||(e=void 0),this._$AL.set(t,e)),s===!0&&this._$Em!==t&&(this._$Eq??=new Set).add(t))}async _$EP(){this.isUpdatePending=!0;try{await this._$ES}catch(e){Promise.reject(e)}const t=this.scheduleUpdate();return t!=null&&await t,!this.isUpdatePending}scheduleUpdate(){return this.performUpdate()}performUpdate(){if(!this.isUpdatePending)return;if(!this.hasUpdated){if(this.renderRoot??=this.createRenderRoot(),this._$Ep){for(const[s,n]of this._$Ep)this[s]=n;this._$Ep=void 0}const i=this.constructor.elementProperties;if(i.size>0)for(const[s,n]of i){const{wrapped:a}=n,o=this[s];a!==!0||this._$AL.has(s)||o===void 0||this.C(s,void 0,n,o)}}let t=!1;const e=this._$AL;try{t=this.shouldUpdate(e),t?(this.willUpdate(e),this._$EO?.forEach(i=>i.hostUpdate?.()),this.update(e)):this._$EM()}catch(i){throw t=!1,this._$EM(),i}t&&this._$AE(e)}willUpdate(t){}_$AE(t){this._$EO?.forEach(e=>e.hostUpdated?.()),this.hasUpdated||(this.hasUpdated=!0,this.firstUpdated(t)),this.updated(t)}_$EM(){this._$AL=new Map,this.isUpdatePending=!1}get updateComplete(){return this.getUpdateComplete()}getUpdateComplete(){return this._$ES}shouldUpdate(t){return!0}update(t){this._$Eq&&=this._$Eq.forEach(e=>this._$ET(e,this[e])),this._$EM()}updated(t){}firstUpdated(t){}};V.elementStyles=[],V.shadowRootOptions={mode:"open"},V[ot("elementProperties")]=new Map,V[ot("finalized")]=new Map,Ge?.({ReactiveElement:V}),(ft.reactiveElementVersions??=[]).push("2.1.1");/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */const At=globalThis,mt=At.trustedTypes,Dt=mt?mt.createPolicy("lit-html",{createHTML:h=>h}):void 0,Yt="$lit$",H=`lit$${Math.random().toFixed(9).slice(2)}$`,Vt="?"+H,Ye=`<${Vt}>`,W=document,rt=()=>W.createComment(""),ht=h=>h===null||typeof h!="object"&&typeof h!="function",Tt=Array.isArray,Ve=h=>Tt(h)||typeof h?.[Symbol.iterator]=="function",St=`[ 	
\f\r]`,it=/<(?:(!--|\/[^a-zA-Z])|(\/?[a-zA-Z][^>\s]*)|(\/?$))/g,Nt=/-->/g,Ut=/>/g,D=RegExp(`>|${St}(?:([^\\s"'>=/]+)(${St}*=${St}*(?:[^ 	
\f\r"'\`<>=]|("|')|))|$)`,"g"),zt=/'/g,Wt=/"/g,qt=/^(?:script|style|textarea|title)$/i,qe=h=>(t,...e)=>({_$litType$:h,strings:t,values:e}),f=qe(1),q=Symbol.for("lit-noChange"),w=Symbol.for("lit-nothing"),Bt=new WeakMap,U=W.createTreeWalker(W,129);function Zt(h,t){if(!Tt(h)||!h.hasOwnProperty("raw"))throw Error("invalid template strings array");return Dt!==void 0?Dt.createHTML(t):t}const Ze=(h,t)=>{const e=h.length-1,i=[];let s,n=t===2?"<svg>":t===3?"<math>":"",a=it;for(let o=0;o<e;o++){const r=h[o];let l,d,u=-1,p=0;for(;p<r.length&&(a.lastIndex=p,d=a.exec(r),d!==null);)p=a.lastIndex,a===it?d[1]==="!--"?a=Nt:d[1]!==void 0?a=Ut:d[2]!==void 0?(qt.test(d[2])&&(s=RegExp("</"+d[2],"g")),a=D):d[3]!==void 0&&(a=D):a===D?d[0]===">"?(a=s??it,u=-1):d[1]===void 0?u=-2:(u=a.lastIndex-d[2].length,l=d[1],a=d[3]===void 0?D:d[3]==='"'?Wt:zt):a===Wt||a===zt?a=D:a===Nt||a===Ut?a=it:(a=D,s=void 0);const y=a===D&&h[o+1].startsWith("/>")?" ":"";n+=a===it?r+Ye:u>=0?(i.push(l),r.slice(0,u)+Yt+r.slice(u)+H+y):r+H+(u===-2?o:y)}return[Zt(h,n+(h[e]||"<?>")+(t===2?"</svg>":t===3?"</math>":"")),i]};class lt{constructor({strings:t,_$litType$:e},i){let s;this.parts=[];let n=0,a=0;const o=t.length-1,r=this.parts,[l,d]=Ze(t,e);if(this.el=lt.createElement(l,i),U.currentNode=this.el.content,e===2||e===3){const u=this.el.content.firstChild;u.replaceWith(...u.childNodes)}for(;(s=U.nextNode())!==null&&r.length<o;){if(s.nodeType===1){if(s.hasAttributes())for(const u of s.getAttributeNames())if(u.endsWith(Yt)){const p=d[a++],y=s.getAttribute(u).split(H),m=/([.?@])?(.*)/.exec(p);r.push({type:1,index:n,name:m[2],strings:y,ctor:m[1]==="."?Qe:m[1]==="?"?ti:m[1]==="@"?ei:gt}),s.removeAttribute(u)}else u.startsWith(H)&&(r.push({type:6,index:n}),s.removeAttribute(u));if(qt.test(s.tagName)){const u=s.textContent.split(H),p=u.length-1;if(p>0){s.textContent=mt?mt.emptyScript:"";for(let y=0;y<p;y++)s.append(u[y],rt()),U.nextNode(),r.push({type:2,index:++n});s.append(u[p],rt())}}}else if(s.nodeType===8)if(s.data===Vt)r.push({type:2,index:n});else{let u=-1;for(;(u=s.data.indexOf(H,u+1))!==-1;)r.push({type:7,index:n}),u+=H.length-1}n++}}static createElement(t,e){const i=W.createElement("template");return i.innerHTML=t,i}}function Z(h,t,e=h,i){if(t===q)return t;let s=i!==void 0?e._$Co?.[i]:e._$Cl;const n=ht(t)?void 0:t._$litDirective$;return s?.constructor!==n&&(s?._$AO?.(!1),n===void 0?s=void 0:(s=new n(h),s._$AT(h,e,i)),i!==void 0?(e._$Co??=[])[i]=s:e._$Cl=s),s!==void 0&&(t=Z(h,s._$AS(h,t.values),s,i)),t}class Je{constructor(t,e){this._$AV=[],this._$AN=void 0,this._$AD=t,this._$AM=e}get parentNode(){return this._$AM.parentNode}get _$AU(){return this._$AM._$AU}u(t){const{el:{content:e},parts:i}=this._$AD,s=(t?.creationScope??W).importNode(e,!0);U.currentNode=s;let n=U.nextNode(),a=0,o=0,r=i[0];for(;r!==void 0;){if(a===r.index){let l;r.type===2?l=new ct(n,n.nextSibling,this,t):r.type===1?l=new r.ctor(n,r.name,r.strings,this,t):r.type===6&&(l=new ii(n,this,t)),this._$AV.push(l),r=i[++o]}a!==r?.index&&(n=U.nextNode(),a++)}return U.currentNode=W,s}p(t){let e=0;for(const i of this._$AV)i!==void 0&&(i.strings!==void 0?(i._$AI(t,i,e),e+=i.strings.length-2):i._$AI(t[e])),e++}}class ct{get _$AU(){return this._$AM?._$AU??this._$Cv}constructor(t,e,i,s){this.type=2,this._$AH=w,this._$AN=void 0,this._$AA=t,this._$AB=e,this._$AM=i,this.options=s,this._$Cv=s?.isConnected??!0}get parentNode(){let t=this._$AA.parentNode;const e=this._$AM;return e!==void 0&&t?.nodeType===11&&(t=e.parentNode),t}get startNode(){return this._$AA}get endNode(){return this._$AB}_$AI(t,e=this){t=Z(this,t,e),ht(t)?t===w||t==null||t===""?(this._$AH!==w&&this._$AR(),this._$AH=w):t!==this._$AH&&t!==q&&this._(t):t._$litType$!==void 0?this.$(t):t.nodeType!==void 0?this.T(t):Ve(t)?this.k(t):this._(t)}O(t){return this._$AA.parentNode.insertBefore(t,this._$AB)}T(t){this._$AH!==t&&(this._$AR(),this._$AH=this.O(t))}_(t){this._$AH!==w&&ht(this._$AH)?this._$AA.nextSibling.data=t:this.T(W.createTextNode(t)),this._$AH=t}$(t){const{values:e,_$litType$:i}=t,s=typeof i=="number"?this._$AC(t):(i.el===void 0&&(i.el=lt.createElement(Zt(i.h,i.h[0]),this.options)),i);if(this._$AH?._$AD===s)this._$AH.p(e);else{const n=new Je(s,this),a=n.u(this.options);n.p(e),this.T(a),this._$AH=n}}_$AC(t){let e=Bt.get(t.strings);return e===void 0&&Bt.set(t.strings,e=new lt(t)),e}k(t){Tt(this._$AH)||(this._$AH=[],this._$AR());const e=this._$AH;let i,s=0;for(const n of t)s===e.length?e.push(i=new ct(this.O(rt()),this.O(rt()),this,this.options)):i=e[s],i._$AI(n),s++;s<e.length&&(this._$AR(i&&i._$AB.nextSibling,s),e.length=s)}_$AR(t=this._$AA.nextSibling,e){for(this._$AP?.(!1,!0,e);t!==this._$AB;){const i=t.nextSibling;t.remove(),t=i}}setConnected(t){this._$AM===void 0&&(this._$Cv=t,this._$AP?.(t))}}class gt{get tagName(){return this.element.tagName}get _$AU(){return this._$AM._$AU}constructor(t,e,i,s,n){this.type=1,this._$AH=w,this._$AN=void 0,this.element=t,this.name=e,this._$AM=s,this.options=n,i.length>2||i[0]!==""||i[1]!==""?(this._$AH=Array(i.length-1).fill(new String),this.strings=i):this._$AH=w}_$AI(t,e=this,i,s){const n=this.strings;let a=!1;if(n===void 0)t=Z(this,t,e,0),a=!ht(t)||t!==this._$AH&&t!==q,a&&(this._$AH=t);else{const o=t;let r,l;for(t=n[0],r=0;r<n.length-1;r++)l=Z(this,o[i+r],e,r),l===q&&(l=this._$AH[r]),a||=!ht(l)||l!==this._$AH[r],l===w?t=w:t!==w&&(t+=(l??"")+n[r+1]),this._$AH[r]=l}a&&!s&&this.j(t)}j(t){t===w?this.element.removeAttribute(this.name):this.element.setAttribute(this.name,t??"")}}class Qe extends gt{constructor(){super(...arguments),this.type=3}j(t){this.element[this.name]=t===w?void 0:t}}class ti extends gt{constructor(){super(...arguments),this.type=4}j(t){this.element.toggleAttribute(this.name,!!t&&t!==w)}}class ei extends gt{constructor(t,e,i,s,n){super(t,e,i,s,n),this.type=5}_$AI(t,e=this){if((t=Z(this,t,e,0)??w)===q)return;const i=this._$AH,s=t===w&&i!==w||t.capture!==i.capture||t.once!==i.once||t.passive!==i.passive,n=t!==w&&(i===w||s);s&&this.element.removeEventListener(this.name,this,i),n&&this.element.addEventListener(this.name,this,t),this._$AH=t}handleEvent(t){typeof this._$AH=="function"?this._$AH.call(this.options?.host??this.element,t):this._$AH.handleEvent(t)}}class ii{constructor(t,e,i){this.element=t,this.type=6,this._$AN=void 0,this._$AM=e,this.options=i}get _$AU(){return this._$AM._$AU}_$AI(t){Z(this,t)}}const si=At.litHtmlPolyfillSupport;si?.(lt,ct),(At.litHtmlVersions??=[]).push("3.3.1");const Jt=(h,t,e)=>{const i=e?.renderBefore??t;let s=i._$litPart$;if(s===void 0){const n=e?.renderBefore??null;i._$litPart$=s=new ct(t.insertBefore(rt(),n),n,void 0,e??{})}return s._$AI(h),s};/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */const Et=globalThis;class _ extends V{constructor(){super(...arguments),this.renderOptions={host:this},this._$Do=void 0}createRenderRoot(){const t=super.createRenderRoot();return this.renderOptions.renderBefore??=t.firstChild,t}update(t){const e=this.render();this.hasUpdated||(this.renderOptions.isConnected=this.isConnected),super.update(t),this._$Do=Jt(e,this.renderRoot,this.renderOptions)}connectedCallback(){super.connectedCallback(),this._$Do?.setConnected(!0)}disconnectedCallback(){super.disconnectedCallback(),this._$Do?.setConnected(!1)}render(){return q}}_._$litElement$=!0,_.finalized=!0,Et.litElementHydrateSupport?.({LitElement:_});const ni=Et.litElementPolyfillSupport;ni?.({LitElement:_});(Et.litElementVersions??=[]).push("4.2.1");/**
 * @license
 * Copyright 2021 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */function*J(h,t){if(h!==void 0){let e=0;for(const i of h)yield t(i,e++)}}function nt(h){return h===" "?"SPACE":h.startsWith("arrow")?h.replace("arrow","").toUpperCase():h.toUpperCase()}function $t(h=0){const t=Math.floor(h/60),e=h%60,i=Math.floor(e),s=Math.floor((e-i)*1e3);return`${t.toString().padStart(2,"0")}:${i.toString().padStart(2,"0")}.${s.toString().padStart(3,"0")}`}class ai extends _{static properties={fontRenderer:{type:Object},text:{type:String},scale:{type:Number},color:{type:String},outlineColor:{type:String},outlineWidth:{type:Number},align:{type:String}};constructor(){super(),this.text="",this.scale=1,this.color="white",this.outlineColor=null,this.outlineWidth=1,this.align="left"}updated(t){super.updated(t),!(!this.fontRenderer||!this.shadowRoot)&&this.renderCanvas()}renderCanvas(){const t=this.shadowRoot.querySelector("#container");if(!t)return;const e=this.fontRenderer.renderTextToCanvas(this.text,{scale:this.scale,color:this.color,outlineColor:this.outlineColor,outlineWidth:this.outlineWidth,align:this.align});e&&(e.style.imageRendering="pixelated",t.innerHTML="",t.appendChild(e))}render(){return f`<div id="container"></div>`}}customElements.define("bitmap-text",ai);class oi extends _{static styles=R`
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
  `;static properties={action:{type:String},currentKey:{type:String},isRemapping:{type:Boolean,state:!0},fontRenderer:{type:Object}};constructor(){super(),this.isRemapping=!1}connectedCallback(){super.connectedCallback(),window.addEventListener("keydown",this._handleGlobalKeydown)}disconnectedCallback(){super.disconnectedCallback(),window.removeEventListener("keydown",this._handleGlobalKeydown)}_handleGlobalKeydown=t=>{if(!this.isRemapping)return;t.preventDefault(),t.stopPropagation();const e=t.key.toLowerCase();this.dispatchEvent(new CustomEvent("keybind-changed",{detail:{action:this.action,newKey:e},bubbles:!0,composed:!0})),this.isRemapping=!1};_startRemap(t){t.stopPropagation(),this.isRemapping=!0,c.publish("playSound",{key:"button_click",volume:.8,channel:"UI"})}render(){const t=this.isRemapping?"Press key...":nt(this.currentKey);return f`
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
    `}}customElements.define("keybind-display",oi);class ri extends _{static styles=R`
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
  `;static properties={keybinds:{type:Object},soundSettings:{type:Object},fontRenderer:{type:Object}};_dispatchClose(){c.publish("playSound",{key:"button_click",volume:.8,channel:"UI"}),this.dispatchEvent(new CustomEvent("close-modal",{bubbles:!0,composed:!0}))}_toggleSound(){c.publish("playSound",{key:"button_click",volume:.8,channel:"UI"}),c.publish("toggleSound")}_setVolume(t){const e=parseFloat(t.target.value);c.publish("setSoundVolume",{volume:e})}_testSound(){c.publish("playSound",{key:"jump",volume:.8,channel:"UI"})}render(){if(!this.keybinds||!this.soundSettings||!this.fontRenderer)return f``;const t=Object.keys(this.keybinds);return f`
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
              ${J(t,e=>f`
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
    `}}customElements.define("settings-menu",ri);class hi extends _{static styles=R`
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
  `;static properties={stats:{type:Object},fontRenderer:{type:Object}};constructor(){super(),this.stats={collectedFruits:0,totalFruits:0,deathCount:0,levelTime:0}}_dispatch(t){this.dispatchEvent(new CustomEvent(t,{bubbles:!0,composed:!0}))}render(){return f`
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
            <bitmap-text .fontRenderer=${this.fontRenderer} text="Time: ${$t(this.stats.levelTime)}" scale="1.8"></bitmap-text>
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
    `}}customElements.define("pause-modal",hi);class li extends _{static styles=R`
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
  `;static properties={gameState:{type:Object},fontRenderer:{type:Object}};_dispatchClose(){c.publish("playSound",{key:"button_click",volume:.8,channel:"UI"}),this.dispatchEvent(new CustomEvent("close-modal",{bubbles:!0,composed:!0}))}_selectLevel(t,e){this.dispatchEvent(new CustomEvent("level-selected",{detail:{sectionIndex:t,levelIndex:e},bubbles:!0,composed:!0}))}_openStatsModal(){c.publish("playSound",{key:"button_click",volume:.8,channel:"UI"}),c.publish("ui_button_clicked",{buttonId:"stats"})}render(){return this.gameState?f`
      <div class="modal-overlay" @click=${this._dispatchClose}>
        <div class="modal-content" @click=${t=>t.stopPropagation()}>
          <button class="close-button" @click=${this._dispatchClose}></button>
          
          <div class="title-container">
            <bitmap-text .fontRenderer=${this.fontRenderer} text="Levels Menu" scale="3" outlineColor="black" outlineWidth="2"></bitmap-text>
          </div>

          <!-- The new scrollable container -->
          <div class="scrollable-content">
            <div id="level-selection-container">
              ${J(L,(t,e)=>f`
                <div class="level-section-menu">
                  <div class="section-title-container">
                    <bitmap-text .fontRenderer=${this.fontRenderer} text=${t.name} scale="2"></bitmap-text>
                  </div>
                  <div class="level-grid">
                    ${J(t.levels,(i,s)=>{const n=this.gameState.isLevelUnlocked(e,s),a=this.gameState.isLevelCompleted(e,s),o=this.gameState.currentSection===e&&this.gameState.currentLevelIndex===s,r=`level-button ${a?"completed":""} ${o?"current":""} ${n?"":"locked"}`;return n?f`<button class=${r} @click=${()=>this._selectLevel(e,s)}>${s+1}</button>`:f`<button class=${r} disabled>
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
    `:f``}}customElements.define("levels-menu",li);class ci extends _{static styles=R`
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
  `;static properties={characterId:{type:String},idleSprite:{type:Object},isLocked:{type:Boolean},isSelected:{type:Boolean},fontRenderer:{type:Object}};constructor(){super(),this.animationFrameId=null,this.animState={frame:0,timer:0,lastTime:0}}connectedCallback(){super.connectedCallback(),this.animationFrameId=requestAnimationFrame(this._animatePreview)}disconnectedCallback(){super.disconnectedCallback(),this.animationFrameId&&cancelAnimationFrame(this.animationFrameId)}_animatePreview=t=>{const e=this.shadowRoot.querySelector(".char-canvas");if(!e||!this.idleSprite){this.animationFrameId=requestAnimationFrame(this._animatePreview);return}this.animState.lastTime===0&&(this.animState.lastTime=t);const i=(t-this.animState.lastTime)/1e3;this.animState.lastTime=t,this.animState.timer+=i;const s=.08,n=11,a=this.idleSprite.width/n;if(this.animState.timer>=s){this.animState.timer=0,this.animState.frame=(this.animState.frame+1)%n;const o=e.getContext("2d");o.clearRect(0,0,e.width,e.height),o.drawImage(this.idleSprite,this.animState.frame*a,0,a,this.idleSprite.height,0,0,e.width,e.height)}this.animationFrameId=requestAnimationFrame(this._animatePreview)};_handleSelect(){this.isLocked||this.isSelected||this.dispatchEvent(new CustomEvent("character-selected",{detail:{characterId:this.characterId},bubbles:!0,composed:!0}))}render(){const t=at[this.characterId],e=`character-card ${this.isLocked?"locked":""} ${this.isSelected?"selected":""}`,i=this.isLocked?"Locked":this.isSelected?"Selected":"Select";return f`
      <div class=${e}>
        <canvas class="char-canvas" width="64" height="64"></canvas>
        <div class="char-name-container">
            <bitmap-text .fontRenderer=${this.fontRenderer} .text=${t.name} scale="2"></bitmap-text>
        </div>
        <div class="char-unlock-container">
          ${this.isLocked?f`
                <bitmap-text .fontRenderer=${this.fontRenderer} text="Complete ${t.unlockRequirement} levels" scale="1.5" color="#ccc"></bitmap-text>
                <bitmap-text .fontRenderer=${this.fontRenderer} text="to unlock" scale="1.5" color="#ccc"></bitmap-text>
              `:f`<bitmap-text .fontRenderer=${this.fontRenderer} text="Available" scale="1.5" color="#ccc"></bitmap-text>`}
        </div>
        <button class="select-button" @click=${this._handleSelect} ?disabled=${this.isLocked||this.isSelected}>
          <bitmap-text .fontRenderer=${this.fontRenderer} .text=${i} scale="1.8"></bitmap-text>
        </button>
      </div>
    `}}customElements.define("character-card",ci);class di extends _{static styles=R`
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
  `;static properties={gameState:{type:Object},assets:{type:Object},fontRenderer:{type:Object}};_dispatchClose(){c.publish("playSound",{key:"button_click",volume:.8,channel:"UI"}),this.dispatchEvent(new CustomEvent("close-modal",{bubbles:!0,composed:!0}))}render(){if(!this.gameState||!this.assets)return f`<div class="modal-overlay">Loading...</div>`;const t=Object.keys(at);return f`
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
                    ${J(t,e=>f`
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
    `}}customElements.define("character-menu",di);class ui extends _{static styles=R`
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
  `;static properties={keybinds:{type:Object},fontRenderer:{type:Object}};_dispatchClose(){c.publish("playSound",{key:"button_click",volume:.8,channel:"UI"}),this.dispatchEvent(new CustomEvent("close-modal",{bubbles:!0,composed:!0}))}render(){return this.keybinds?f`
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
                        <bitmap-text .fontRenderer=${this.fontRenderer} text=${nt(this.keybinds.moveLeft)} scale="1.5"></bitmap-text>
                    </div>
                    <span>/</span>
                    <div class="key-display">
                        <bitmap-text .fontRenderer=${this.fontRenderer} text=${nt(this.keybinds.moveRight)} scale="1.5"></bitmap-text>
                    </div>
                  </div>
                </div>

                <div class="keybind-item">
                  <label>Jump / Double Jump / Wall Jump:</label>
                  <div class="key-display">
                    <bitmap-text .fontRenderer=${this.fontRenderer} text=${nt(this.keybinds.jump)} scale="1.5"></bitmap-text>
                  </div>
                </div>

                <div class="keybind-item">
                  <label>Dash:</label>
                  <div class="key-display">
                    <bitmap-text .fontRenderer=${this.fontRenderer} text=${nt(this.keybinds.dash)} scale="1.5"></bitmap-text>
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
    `:f``}}customElements.define("info-modal",ui);class pi extends _{static styles=R`
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
  `;static properties={stats:{type:Object},hasNextLevel:{type:Boolean},hasPreviousLevel:{type:Boolean},fontRenderer:{type:Object}};_dispatch(t){this.dispatchEvent(new CustomEvent(t))}render(){return this.stats?f`
      <div class="modal-overlay">
        <div class="modal-content">
          <div class="title-container">
            <bitmap-text .fontRenderer=${this.fontRenderer} text="Level Complete!" scale="3" outlineColor="black" outlineWidth="2"></bitmap-text>
          </div>
          <div class="stats-container">
            <bitmap-text .fontRenderer=${this.fontRenderer} text="Deaths: ${this.stats.deaths}" scale="1.8"></bitmap-text>
            <bitmap-text .fontRenderer=${this.fontRenderer} text="Time: ${$t(this.stats.time)}" scale="1.8"></bitmap-text>
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
    `:f``}}customElements.define("level-complete-modal",pi);class mi extends _{static styles=R`
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
  `;static properties={gameState:{type:Object},fontRenderer:{type:Object}};_dispatchClose(){c.publish("playSound",{key:"button_click",volume:.8,channel:"UI"}),this.dispatchEvent(new CustomEvent("close-modal",{bubbles:!0,composed:!0}))}_getStatDisplay(t,e=null){return t==null?"-":e?e(t):t.toString()}render(){if(!this.gameState||!this.gameState.levelStats)return f``;const{levelStats:t}=this.gameState;return f`
      <div class="modal-overlay" @click=${this._dispatchClose}>
        <div class="modal-content" @click=${e=>e.stopPropagation()}>
          <button class="close-button" @click=${this._dispatchClose}></button>
          <div class="title-container">
            <bitmap-text .fontRenderer=${this.fontRenderer} text="Level Statistics" scale="3" outlineColor="black" outlineWidth="2"></bitmap-text>
          </div>
          <div class="stats-list-container">
            ${J(L,(e,i)=>f`
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

                  ${J(e.levels,(s,n)=>{const a=`${i}-${n}`,o=t[a]||{fastestTime:null,lowestDeaths:null,totalAttempts:0};return f`
                        <div class="stat-row">
                            <div class="stat-cell level-name">Level ${n+1}</div>
                            <div class="stat-cell">${this._getStatDisplay(o.fastestTime,$t)}</div>
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
    `}}customElements.define("stats-modal",mi);class fi extends _{static styles=R`
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
  `;static properties={activeModal:{type:String,state:!0},gameHasStarted:{type:Boolean,state:!0},keybinds:{type:Object,state:!0},soundSettings:{type:Object,state:!0},currentStats:{type:Object,state:!0},gameState:{type:Object,state:!0},assets:{type:Object,state:!0},fontRenderer:{type:Object},levelCompleteStats:{type:Object,state:!0},isLoading:{type:Boolean,state:!0}};constructor(){super(),this.activeModal="main-menu",this.gameHasStarted=!1,this.keybinds={moveLeft:"a",moveRight:"d",jump:"w",dash:" "},this.soundSettings={soundEnabled:!0,soundVolume:.5},this.currentStats={},this.gameState=null,this.assets=null,this.fontRenderer=null,this.levelCompleteStats=null,this.isLoading=!0}connectedCallback(){super.connectedCallback(),c.subscribe("requestStartGame",this._handleStartGame),c.subscribe("soundSettingsChanged",this._handleSoundUpdate),c.subscribe("keybindsUpdated",this._handleKeybindsUpdate),c.subscribe("ui_button_clicked",this._handleUIButtonClick),c.subscribe("statsUpdated",this._handleStatsUpdate),c.subscribe("action_escape_pressed",this._handleEscapePress),c.subscribe("levelLoaded",this._handleLevelLoad),c.subscribe("gameStateUpdated",t=>this.gameState=t),c.subscribe("assetsLoaded",t=>this.assets=t),c.subscribe("levelComplete",t=>this.levelCompleteStats=t)}disconnectedCallback(){super.disconnectedCallback(),c.unsubscribe("requestStartGame",this._handleStartGame),c.unsubscribe("soundSettingsChanged",this._handleSoundUpdate),c.unsubscribe("keybindsUpdated",this._handleKeybindsUpdate),c.unsubscribe("ui_button_clicked",this._handleUIButtonClick),c.unsubscribe("statsUpdated",this._handleStatsUpdate),c.unsubscribe("action_escape_pressed",this._handleEscapePress),c.unsubscribe("levelLoaded",this._handleLevelLoad),c.unsubscribe("gameStateUpdated",t=>this.gameState=t),c.unsubscribe("assetsLoaded",t=>this.assets=t),c.unsubscribe("levelComplete",t=>this.levelCompleteStats=t)}updated(t){super.updated(t),this.isLoading&&this.assets&&this.fontRenderer&&(this.isLoading=!1)}_handleLevelLoad=({gameState:t})=>{this.gameState=t,this.levelCompleteStats=null,this.gameHasStarted||(this.gameHasStarted=!0),this.activeModal=null};_handleStartGame=()=>{this.gameHasStarted=!0,this.activeModal=null,c.publish("allMenusClosed")};_handleSoundUpdate=t=>{this.soundSettings={...t}};_handleKeybindsUpdate=t=>{this.keybinds={...t}};_handleStatsUpdate=t=>{this.currentStats={...t}};_handleUIButtonClick=({buttonId:t})=>{t==="pause"?this.activeModal?this._closeModal():this.gameHasStarted&&(this.activeModal="pause",c.publish("menuOpened")):t==="stats"?(this.activeModal="stats",c.publish("menuOpened")):(this.activeModal=t,c.publish("menuOpened"))};_handleEscapePress=()=>{this.levelCompleteStats||(this.activeModal?this._closeModal():this.gameHasStarted&&(this.activeModal="pause",c.publish("menuOpened")))};_handleKeybindChange=t=>{const{action:e,newKey:i}=t.detail,s={...this.keybinds,[e]:i};c.publish("keybindsUpdated",s)};_closeModal=()=>{const t=this.activeModal!==null;this.activeModal=this.gameHasStarted?null:"main-menu",t&&this.gameHasStarted&&c.publish("allMenusClosed")};_openModalFromMenu(t){c.publish("playSound",{key:"button_click",volume:.8,channel:"UI"}),this.activeModal=t}_handleRestart(){this._closeModal(),c.publish("requestLevelRestart")}_handleOpenLevelsMenu(){this.activeModal="levels"}_handleLevelSelected(t){const{sectionIndex:e,levelIndex:i}=t.detail;c.publish("requestLevelLoad",{sectionIndex:e,levelIndex:i})}_handleCharacterSelected(t){const{characterId:e}=t.detail,i=this.gameState.setSelectedCharacter(e);i!==this.gameState&&(this.gameState=i,c.publish("gameStateUpdated",this.gameState)),c.publish("playSound",{key:"button_click",volume:.8,channel:"UI"}),c.publish("characterUpdated",e)}_handleLevelAction(t){this.levelCompleteStats=null,t==="restart"?c.publish("requestLevelRestart"):t==="next"?c.publish("requestNextLevel"):t==="previous"&&c.publish("requestPreviousLevel")}render(){return this.levelCompleteStats?f`
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
          ${this.isLoading?this.renderLoadingScreen():this.activeModal==="main-menu"?this.renderMainMenuContent():this.renderActiveModal()}
        </div>
      `}renderLoadingScreen(){return f`
        <div class="loading-container">
            <div class="loading-text">LOADING...</div>
            <div class="loading-spinner"></div>
        </div>
      `}renderMainMenuContent(){const t=[{text:"Start Game",action:()=>c.publish("requestStartGame")},{text:"Levels",action:()=>this._openModalFromMenu("levels")},{text:"Character",action:()=>this._openModalFromMenu("character")},{text:"Settings",action:()=>this._openModalFromMenu("settings")},{text:"Stats",action:()=>this._openModalFromMenu("stats")}];return f`
      <div class="main-menu-container">
        <bitmap-text
          .fontRenderer=${this.fontRenderer} text="Parkour Hero" scale="9" outlineColor="black" outlineWidth="2"
        ></bitmap-text>
        <div class="main-menu-buttons">
          ${t.map(e=>f`
            <button @click=${e.action}>
              <bitmap-text .fontRenderer=${this.fontRenderer} text=${e.text} scale="2.5" outlineColor="#004a99" outlineWidth="1"></bitmap-text>
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
                    ></info-modal>`;case"stats":return f`<stats-modal
                      .gameState=${this.gameState}
                      .fontRenderer=${this.fontRenderer}
                      @close-modal=${this._closeModal}
                    ></stats-modal>`;default:return f``}}}customElements.define("parkour-hero-ui",fi);const Kt=document.getElementById("ui-root");Kt?Jt(document.createElement("parkour-hero-ui"),Kt):console.error("UI Root element #ui-root not found. UI cannot be initialized.");const v=document.getElementById("gameCanvas"),b=v.getContext("2d"),N=document.getElementById("ui-root");if(!v||!b)throw console.error("Canvas not found or context not available"),document.body.innerHTML="<h1>Error: Canvas not supported</h1>",new Error("Canvas not available");b.imageSmoothingEnabled=!1;const Qt=1920,te=1080;v.width=Qt;v.height=te;console.log(`Canvas initialized: ${Qt}x${te}`);function ee(){try{const h=1.7777777777777777,t=window.innerWidth/window.innerHeight;let e,i;t>h?(i=window.innerHeight,e=i*h):(e=window.innerWidth,i=e/h);const s=Math.floor(e),n=Math.floor(i),a=`${(window.innerWidth-s)/2}px`,o=`${(window.innerHeight-n)/2}px`;v.style.width=`${s}px`,v.style.height=`${n}px`,v.style.position="absolute",v.style.left=a,v.style.top=o,N&&(N.style.width=`${s}px`,N.style.height=`${n}px`,N.style.position="absolute",N.style.left=a,N.style.top=o,N.style.overflow="hidden"),console.log(`Canvas resized to: ${s}x${n} (display size)`)}catch(h){console.error("Error resizing canvas:",h)}}window.addEventListener("resize",ee);ee();function gi(){b.fillStyle="#222",b.fillRect(0,0,v.width,v.height),b.fillStyle="white",b.font="24px sans-serif",b.textAlign="center",b.fillText("Loading Assets...",v.width/2,v.height/2);const h=300,t=20,e=(v.width-h)/2,i=v.height/2+30;b.strokeStyle="white",b.lineWidth=2,b.strokeRect(e,i,h,t),b.fillStyle="#4CAF50",b.fillRect(e,i,h*.1,t)}gi();let yi={moveLeft:"a",moveRight:"d",jump:"w",dash:" "},T;Oe().then(h=>{console.log("Assets loaded successfully, preparing main menu...");try{const t=new He(h.font_spritesheet);T=new Me(b,v,h,yi,t),c.publish("assetsLoaded",h);const e=document.querySelector("parkour-hero-ui");e&&(e.fontRenderer=t),c.subscribe("requestStartGame",()=>{T.start()}),window.unlockAllLevels=()=>{T&&T.gameState&&(T.gameState.unlockAllLevels(),c.publish("gameStateUpdated",T.gameState))},console.log("Developer command available: Type `unlockAllLevels()` in the console to unlock all levels."),window.resetProgress=()=>{T&&T.gameState&&(T.gameState.resetProgress(),T.loadLevel(0,0),console.log("Game reset to Level 1."),c.publish("gameStateUpdated",T.gameState))},console.log("Developer command available: Type `resetProgress()` in the console to reset all saved data."),console.log("Game is ready. Waiting for user to start from the main menu.")}catch(t){console.error("Failed to start game engine:",t),b.fillStyle="#222",b.fillRect(0,0,v.width,v.height),b.fillStyle="red",b.font="24px sans-serif",b.textAlign="center",b.fillText("Game Failed to Start",v.width/2,v.height/2-20),b.fillStyle="white",b.font="16px sans-serif",b.fillText("Check console for details",v.width/2,v.height/2+20)}}).catch(h=>{console.error("Asset loading failed:",h),b.fillStyle="#222",b.fillRect(0,0,v.width,v.height),b.fillStyle="red",b.font="24px sans-serif",b.textAlign="center",b.fillText("Failed to Load Assets",v.width/2,v.height/2-20),b.fillStyle="white",b.font="16px sans-serif",b.fillText("Check console for details",v.width/2,v.height/2+20)});window.addEventListener("error",h=>{console.error("Global error:",h.error)});window.addEventListener("unhandledrejection",h=>{console.error("Unhandled promise rejection:",h.reason)});console.log("Game initialization started");console.log("Canvas dimensions:",v.width,"x",v.height);console.log("Device pixel ratio:",window.devicePixelRatio);console.log("User agent:",navigator.userAgent);
