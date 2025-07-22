(function(){const t=document.createElement("link").relList;if(t&&t.supports&&t.supports("modulepreload"))return;for(const i of document.querySelectorAll('link[rel="modulepreload"]'))s(i);new MutationObserver(i=>{for(const n of i)if(n.type==="childList")for(const a of n.addedNodes)a.tagName==="LINK"&&a.rel==="modulepreload"&&s(a)}).observe(document,{childList:!0,subtree:!0});function e(i){const n={};return i.integrity&&(n.integrity=i.integrity),i.referrerPolicy&&(n.referrerPolicy=i.referrerPolicy),i.crossOrigin==="use-credentials"?n.credentials="include":i.crossOrigin==="anonymous"?n.credentials="omit":n.credentials="same-origin",n}function s(i){if(i.ep)return;i.ep=!0;const n=e(i);fetch(i.href,n)}})();class k{constructor(t=0,e=0){this.x=t,this.y=e}}class T{constructor({type:t="dynamic",solid:e=!1,hazard:s=!1,width:i,height:n,isGrounded:a=!1,isAgainstWall:o=!1,groundType:l=null}){this.type=t,this.solid=e,this.hazard=s,this.width=i,this.height=n,this.isGrounded=a,this.isAgainstWall=o,this.groundType=l}}class ne{constructor(t,e){this.zoom=1.8,this.viewportWidth=t,this.viewportHeight=e,this.width=this.viewportWidth/this.zoom,this.height=this.viewportHeight/this.zoom,this.levelWidth=this.width,this.levelHeight=this.height,this.followSpeed=5,this.deadZone={x:this.width*.2,y:this.height*.2},this.minX=0,this.maxX=0,this.minY=0,this.maxY=0,this.shakeTimer=0,this.shakeIntensity=0,this.shakeInitialIntensity=0,this.shakeDuration=0,this.shakeX=0,this.shakeY=0,this.targetX=0,this.targetY=0,console.log("Camera initialized:",{viewport:`${this.viewportWidth}x${this.viewportHeight}`,zoom:this.zoom,worldView:`${this.width}x${this.height}`})}update(t,e,s){if(e===null)return;const i=t.getComponent(e,k),n=t.getComponent(e,T);if(!i||!n)return;const a=this.x+this.width/2,o=this.y+this.height/2,l=i.x+n.width/2,h=i.y+n.height/2,u=l-a,d=h-o;let p=0,m=0;Math.abs(u)>this.deadZone.x&&(p=u>0?u-this.deadZone.x:u+this.deadZone.x),Math.abs(d)>this.deadZone.y&&(m=d>0?d-this.deadZone.y:d+this.deadZone.y),this.targetX=this.x+p,this.targetY=this.y+m,this.x+=(this.targetX-this.x)*this.followSpeed*s,this.y+=(this.targetY-this.y)*this.followSpeed*s,this.x=Math.max(this.minX,Math.min(this.maxX,this.x)),this.y=Math.max(this.minY,Math.min(this.maxY,this.y)),this.updateShake(s)}updateShake(t){if(this.shakeTimer>0){this.shakeTimer-=t,this.shakeX=(Math.random()-.5)*this.shakeIntensity,this.shakeY=(Math.random()-.5)*this.shakeIntensity;const e=this.shakeInitialIntensity/this.shakeDuration;this.shakeIntensity=Math.max(0,this.shakeIntensity-e*t),this.shakeTimer<=0&&(this.shakeX=0,this.shakeY=0,this.shakeIntensity=0)}}shake(t=10,e=.3){this.shakeTimer=e,this.shakeDuration=e,this.shakeIntensity=t,this.shakeInitialIntensity=t}apply(t){t.save(),t.scale(this.zoom,this.zoom),t.translate(-Math.round(this.x+this.shakeX),-Math.round(this.y+this.shakeY))}restore(t){t.restore()}snapToPlayer(t,e){if(e===null)return;const s=t.getComponent(e,k),i=t.getComponent(e,T);!s||!i||this.centerOn(s.x+i.width/2,s.y+i.height/2)}centerOn(t,e){this.x=t-this.width/2,this.y=e-this.height/2,this.x=Math.max(this.minX,Math.min(this.maxX,this.x)),this.y=Math.max(this.minY,Math.min(this.maxY,this.y)),this.targetX=this.x,this.targetY=this.y}updateLevelBounds(t,e){this.levelWidth=t,this.levelHeight=e,this.maxX=Math.max(0,this.levelWidth-this.width),this.maxY=Math.max(0,this.levelHeight-this.height),this.x=Math.max(this.minX,Math.min(this.maxX,this.x)),this.y=Math.max(this.minY,Math.min(this.maxY,this.y))}isVisible(t,e,s=0,i=0){return t+s>this.x&&t<this.x+this.width&&e+i>this.y&&e<this.y+this.height}isRectVisible(t){return this.isVisible(t.x,t.y,t.width,t.height)}setFollowSpeed(t){this.followSpeed=Math.max(.1,t)}setDeadZone(t,e){this.deadZone.x=this.width*Math.max(0,Math.min(.5,t)),this.deadZone.y=this.height*Math.max(0,Math.min(.5,e))}}class ae{constructor(){this.events={}}subscribe(t,e){this.events[t]||(this.events[t]=new Set),this.events[t].add(e)}unsubscribe(t,e){this.events[t]&&this.events[t].delete(e)}publish(t,e){this.events[t]&&this.events[t].forEach(s=>{try{s(e)}catch(i){console.error(`Error in event bus callback for event: ${t}`,i)}})}}const c=new ae;class oe{constructor(){this.sounds={},this.soundPool={},this.poolSize=5,this.channels={SFX:new Set,UI:new Set,Music:new Set},this.audioContext=null,this.audioUnlocked=!1,this.settings={enabled:!0,volume:.5},this.loadSettings(),this._setupEventSubscriptions()}_setupEventSubscriptions(){c.subscribe("playSound",t=>this.play(t)),c.subscribe("startSoundLoop",t=>this.playLoop(t)),c.subscribe("stopSoundLoop",({key:t})=>this.stopLoop(t)),c.subscribe("toggleSound",()=>this.toggleSound()),c.subscribe("setSoundVolume",({volume:t})=>this.setVolume(t))}loadSettings(){this.settings.enabled=!0,this.settings.volume=.5}saveSettings(){}loadSounds(t){["button_click","jump","double_jump","collect","level_complete","death_sound","dash","checkpoint_activated","hit","sand_walk","mud_run","ice_run","trampoline_bounce","fire_activated","arrow_pop","fan_blowing"].forEach(s=>{if(t[s]){this.sounds[s]=t[s],this.soundPool[s]=[];for(let i=0;i<this.poolSize;i++)this.soundPool[s].push(this.sounds[s].cloneNode(!0))}else console.warn(`Sound asset ${s} not found in assets`)})}async play({key:t,volumeMultiplier:e=1,channel:s="SFX"}){if(!this.settings.enabled||!this.sounds[t]||!this.channels[s])return;this.audioUnlocked||await this.unlockAudio();const i=this.soundPool[t];if(!i){console.warn(`Sound pool for ${t} not found.`);return}const n=i.find(a=>a.paused||a.ended);if(n){n.volume=Math.max(0,Math.min(1,this.settings.volume*e)),n.currentTime=0,this.channels[s].add(n),n.onended=()=>{this.channels[s].delete(n),n.onended=null};try{await n.play()}catch(a){a.name!=="AbortError"&&console.error(`Audio pool play failed for ${t}:`,a),this.channels[s].delete(n)}}else console.warn(`Sound pool for ${t} was depleted. No sound played.`)}async playLoop({key:t,volumeMultiplier:e=1,channel:s="SFX"}){if(!(!this.settings.enabled||!this.sounds[t]||!this.channels[s])&&!Array.from(this.channels[s]).some(i=>i.src===this.sounds[t].src)){this.audioUnlocked||await this.unlockAudio();try{const i=this.sounds[t].cloneNode(!0);i.volume=Math.max(0,Math.min(1,this.settings.volume*e)),i.loop=!0,await i.play(),this.channels[s].add(i)}catch(i){console.error(`Failed to play looping sound ${t}:`,i)}}}stopLoop(t){const e=this.sounds[t]?.src;if(e)for(const s in this.channels)this.channels[s].forEach(i=>{i.src===e&&i.loop&&(i.pause(),i.currentTime=0,this.channels[s].delete(i))})}stopAll({except:t=[]}={}){for(const e in this.channels)t.includes(e)||(this.channels[e].forEach(s=>{s.pause(),s.currentTime=0}),this.channels[e].clear())}async unlockAudio(){if(!this.audioUnlocked){if(!this.audioContext)try{const t=window.AudioContext||window.webkitAudioContext;t&&(this.audioContext=new t)}catch(t){console.error("Failed to create AudioContext",t);return}this.audioContext.state==="suspended"&&await this.audioContext.resume().catch(t=>console.error("Failed to resume AudioContext",t)),this.audioContext.state==="running"&&(this.audioUnlocked=!0)}}setVolume(t){this.settings.volume=Math.max(0,Math.min(1,t));for(const e in this.channels)this.channels[e].forEach(s=>{s.volume=this.settings.volume});this.saveSettings(),c.publish("soundSettingsChanged",{soundEnabled:this.settings.enabled,soundVolume:this.settings.volume})}setEnabled(t){this.settings.enabled=t,this.settings.enabled||this.stopAll(),this.saveSettings(),c.publish("soundSettingsChanged",{soundEnabled:this.settings.enabled,soundVolume:this.settings.volume})}toggleSound(){return this.setEnabled(!this.settings.enabled),this.settings.enabled}getSettings(){return{soundEnabled:this.settings.enabled,soundVolume:this.settings.volume,audioUnlocked:this.audioUnlocked}}}class re{constructor(t,e){this.canvas=t,this.fontRenderer=e,this.isVisible=!0,this.stats={levelName:"Loading...",collectedFruits:0,totalFruits:0,deathCount:0,soundEnabled:!0,soundVolume:.5,health:100,maxHealth:100},c.subscribe("statsUpdated",s=>this.updateStats(s))}setVisible(t){this.isVisible=t}updateStats(t){this.stats={...this.stats,...t}}drawGameHUD(t){if(!(!this.isVisible||!this.fontRenderer))try{t.save(),t.setTransform(1,0,0,1,0,0);const{levelName:e,collectedFruits:s,totalFruits:i,deathCount:n,soundEnabled:a,soundVolume:o,health:l,maxHealth:h}=this.stats,u=[`${e}`,`Fruits: ${s}/${i}`,`Deaths: ${n||0}`,`Sound: ${a?"On":"Off"} (${Math.round(o*100)}%)`],d={scale:2.5,align:"center",color:"white",outlineColor:"black",outlineWidth:1};let p=0;u.forEach(vt=>{const rt=this.fontRenderer.getTextWidth(vt,d.scale);rt>p&&(p=rt)});const m=40,x=10,C=10,F=p+m,mt=180;t.fillStyle="rgba(0, 0, 0, 0.5)",t.beginPath(),t.roundRect(x,C,F,mt,10),t.fill();const ft=35,gt=C+25,yt=x+F/2;u.forEach((vt,rt)=>{const ie=gt+rt*ft;this.fontRenderer.drawText(t,vt,yt,ie,d)});const z=150,B=20,W=x+F+15,ot=C;t.fillStyle="rgba(0, 0, 0, 0.7)",t.fillRect(W-2,ot-2,z+4,B+4),t.fillStyle="#333",t.fillRect(W,ot,z,B);const bt=(l||0)/(h||100),se=z*bt;bt>.6?t.fillStyle="#4CAF50":bt>.3?t.fillStyle="#FFC107":t.fillStyle="#F44336",t.fillRect(W,ot,se,B),this.fontRenderer.drawText(t,"HP",W+z+10,ot+B/2-12,{scale:2,align:"left"}),t.restore()}catch(e){console.warn("Error drawing HUD:",e)}}}const tt={PinkMan:{name:"Pink Man",unlockRequirement:0},NinjaFrog:{name:"Ninja Frog",unlockRequirement:10},MaskDude:{name:"Mask Dude",unlockRequirement:20},VirtualGuy:{name:"Virtual Guy",unlockRequirement:30}},E=[{name:"Mechanical Mastery",levels:[{name:"Level 1",jsonPath:"/levels/mechanical-mastery/01.json"},{name:"Level 2",jsonPath:"/levels/mechanical-mastery/02.json"},{name:"Level 3",jsonPath:"/levels/mechanical-mastery/03.json"},{name:"Level 4",jsonPath:"/levels/mechanical-mastery/04.json"},{name:"Level 5",jsonPath:"/levels/mechanical-mastery/05.json"},{name:"Level 6",jsonPath:"/levels/mechanical-mastery/06.json"},{name:"Level 7",jsonPath:"/levels/mechanical-mastery/07.json"},{name:"Level 8",jsonPath:"/levels/mechanical-mastery/08.json"},{name:"Level 9",jsonPath:"/levels/mechanical-mastery/09.json"},{name:"Level 10",jsonPath:"/levels/mechanical-mastery/10.json"}]},{name:"Sky High",levels:[{name:"Level 1",jsonPath:"/levels/sky-high/01.json"},{name:"Level 2",jsonPath:"/levels/sky-high/02.json"},{name:"Level 3",jsonPath:"/levels/sky-high/03.json"},{name:"Level 4",jsonPath:"/levels/sky-high/04.json"},{name:"Level 5",jsonPath:"/levels/sky-high/05.json"},{name:"Level 6",jsonPath:"/levels/sky-high/06.json"},{name:"Level 7",jsonPath:"/levels/sky-high/07.json"},{name:"Level 8",jsonPath:"/levels/sky-high/08.json"},{name:"Level 9",jsonPath:"/levels/sky-high/09.json"},{name:"Level 10",jsonPath:"/levels/sky-high/10.json"}]}];function It(r,t,e){let s=0;for(let i=0;i<r;i++)s+=e[i].levels.length;return s+=t,s}class ct{constructor(t=null){if(t)this.currentSection=t.currentSection,this.currentLevelIndex=t.currentLevelIndex,this.showingLevelComplete=t.showingLevelComplete,this.levelProgress=t.levelProgress,this.selectedCharacter=t.selectedCharacter,this.levelStats=t.levelStats;else{this.currentSection=0,this.currentLevelIndex=0,this.showingLevelComplete=!1;const e=this.loadProgress();this.levelProgress=e.levelProgress,this.selectedCharacter=e.selectedCharacter,this.levelStats=e.levelStats,this.ensureStatsForAllLevels()}}_clone(){const t=JSON.parse(JSON.stringify(this));return new ct(t)}_getDefaultState(){return{levelProgress:{unlockedLevels:[1],completedLevels:[]},selectedCharacter:"PinkMan",levelStats:{}}}loadProgress(){try{const t=localStorage.getItem("parkourGameState");if(!t)return this._getDefaultState();const e=JSON.parse(t);if(typeof e!="object"||e===null)return this._getDefaultState();const s=e.levelProgress;return typeof s!="object"||s===null||!Array.isArray(s.unlockedLevels)||!Array.isArray(s.completedLevels)?this._getDefaultState():((typeof e.selectedCharacter!="string"||!tt[e.selectedCharacter])&&(e.selectedCharacter="PinkMan"),(!e.levelStats||typeof e.levelStats!="object")&&(e.levelStats={}),e)}catch(t){return console.error("Failed to parse game state from localStorage. Resetting to default.",t),this._getDefaultState()}}saveProgress(){try{const t={levelProgress:this.levelProgress,selectedCharacter:this.selectedCharacter,levelStats:this.levelStats};localStorage.setItem("parkourGameState",JSON.stringify(t)),console.log("Progress saved:",t)}catch(t){console.error("Failed to save game state to localStorage",t)}}setSelectedCharacter(t){if(tt[t]&&this.selectedCharacter!==t){const e=this._clone();return e.selectedCharacter=t,e.saveProgress(),e}return this}ensureStatsForAllLevels(){E.forEach((t,e)=>{t.levels.forEach((s,i)=>{const n=`${e}-${i}`;this.levelStats[n]||(this.levelStats[n]={fastestTime:null,lowestDeaths:null,totalAttempts:0})})})}incrementAttempts(t,e){const s=`${t}-${e}`;this.levelStats[s]&&(this.levelStats[s].totalAttempts+=1,this.saveProgress())}onLevelComplete(t){const e=this._clone(),s=`${this.currentSection}-${this.currentLevelIndex}`;if(!this.levelProgress.completedLevels.includes(s)){e.levelProgress.completedLevels.push(s);const n=E.reduce((o,l)=>o+l.levels.length,0),a=It(this.currentSection,this.currentLevelIndex,E);if(a+1<n){const o=a+2;o>this.levelProgress.unlockedLevels[0]&&(e.levelProgress.unlockedLevels[0]=o)}}const i=e.levelStats[s];return i&&((i.fastestTime===null||t.time<i.fastestTime)&&(i.fastestTime=t.time),(i.lowestDeaths===null||t.deaths<i.lowestDeaths)&&(i.lowestDeaths=t.deaths)),e.showingLevelComplete=!0,e.saveProgress(),c.publish("playSound",{key:"level_complete",volume:1,channel:"UI"}),e}isCharacterUnlocked(t){const e=tt[t];return e?this.levelProgress.completedLevels.length>=e.unlockRequirement:!1}isLevelUnlocked(t,e){return It(t,e,E)<this.levelProgress.unlockedLevels[0]}isLevelCompleted(t,e){const s=`${t}-${e}`;return this.levelProgress.completedLevels.includes(s)}resetProgress(){try{localStorage.removeItem("parkourGameState");const t=this._getDefaultState();this.levelProgress=t.levelProgress,this.selectedCharacter=t.selectedCharacter,this.levelStats=t.levelStats,this.currentSection=0,this.currentLevelIndex=0,this.ensureStatsForAllLevels()}catch(t){console.error("Failed to reset game state in localStorage",t)}}unlockAllLevels(){const t=E.reduce((e,s)=>e+s.levels.length,0);this.levelProgress.unlockedLevels[0]=t,this.levelProgress.completedLevels=Array.from({length:t},(e,s)=>`temp-${s}`),this.saveProgress()}}const g={WIDTH:32,HEIGHT:32,SPAWN_WIDTH:96,SPAWN_HEIGHT:96,CLING_OFFSET:7,MOVE_SPEED:200,JUMP_FORCE:400,GRAVITY:1200,MAX_FALL_SPEED:600,FALL_DAMAGE_MIN_VELOCITY:525,FALL_DAMAGE_MAX_VELOCITY:650,FALL_DAMAGE_MIN_AMOUNT:8,FALL_DAMAGE_MAX_AMOUNT:20,DASH_SPEED:500,DASH_DURATION:.2,DASH_COOLDOWN:.7,COYOTE_TIME:.1,JUMP_BUFFER_TIME:.15,HIT_STUN_DURATION:.2,SAND_MOVE_MULTIPLIER:.5,MUD_JUMP_MULTIPLIER:.6,ICE_ACCELERATION:800,ICE_FRICTION:400,TRAMPOLINE_BOUNCE_MULTIPLIER:2,ANIMATION_SPEED:.06,SPAWN_ANIMATION_SPEED:.08,HIT_ANIMATION_SPEED:.1,ANIMATION_FRAMES:{idle:11,run:12,double_jump:6,jump:1,fall:1,dash:1,cling:5,spawn:7,despawn:7,hit:7}},v={TILE_SIZE:48};class L{constructor(t=0,e=0){this.vx=t,this.vy=e}}class S{constructor({speed:t=g.MOVE_SPEED,jumpForce:e=g.JUMP_FORCE,dashSpeed:s=g.DASH_SPEED,dashDuration:i=g.DASH_DURATION,jumpBufferTimer:n=0,coyoteTimer:a=0,dashTimer:o=0,dashCooldownTimer:l=0,hitStunTimer:h=0,jumpCount:u=0,isDashing:d=!1,isHit:p=!1,isSpawning:m=!0,spawnComplete:x=!1,isDespawning:C=!1,despawnAnimationFinished:F=!1,needsRespawn:mt=!1,deathCount:ft=0,activeSurfaceSound:gt=null,surfaceParticleTimer:yt=0,jumpParticleTimer:z=0,jumpPressed:B=!1,dashPressed:W=!1}={}){this.speed=t,this.jumpForce=e,this.dashSpeed=s,this.dashDuration=i,this.jumpBufferTimer=n,this.coyoteTimer=a,this.dashTimer=o,this.dashCooldownTimer=l,this.hitStunTimer=h,this.surfaceParticleTimer=yt,this.jumpParticleTimer=z,this.jumpCount=u,this.isDashing=d,this.isHit=p,this.isSpawning=m,this.spawnComplete=x,this.isDespawning=C,this.despawnAnimationFinished=F,this.needsRespawn=mt,this.jumpPressed=B,this.dashPressed=W,this.deathCount=ft,this.activeSurfaceSound=gt}}class le{constructor(){}update(t,{entityManager:e,level:s}){for(const n of s.traps)n.type==="fire_trap"&&(n.playerIsOnTop=!1);const i=e.query([k,L,T]);for(const n of i){const a=e.getComponent(n,k),o=e.getComponent(n,L),l=e.getComponent(n,T),h=e.getComponent(n,S);if(!(h&&(h.isSpawning||h.isDespawning))){if(a.y>s.height+50){c.publish("collisionEvent",{type:"world_bottom",entityId:n,entityManager:e});continue}a.x+=o.vx*t,this._handleTileHorizontalCollisions(a,o,l,s),a.y+=o.vy*t,this._handleTileVerticalCollisions(a,o,l,s,t),this._handleSolidObjectCollisions(a,o,l,s,t),a.x=Math.max(0,Math.min(a.x,s.width-l.width)),this._checkObjectInteractions(a,o,l,s,t,n,e)}}}_handleTileHorizontalCollisions(t,e,s,i){if(e.vx===0){s.isAgainstWall=!1;return}const n=Math.floor(t.y/v.TILE_SIZE),a=Math.floor((t.y+s.height-1)/v.TILE_SIZE),o=e.vx>0?t.x+s.width:t.x,l=Math.floor(o/v.TILE_SIZE);for(let h=n;h<=a;h++){const u=i.getTileAt(l*v.TILE_SIZE,h*v.TILE_SIZE);if(u&&u.solid){t.x=e.vx>0?l*v.TILE_SIZE-s.width:(l+1)*v.TILE_SIZE,e.vx=0,s.isAgainstWall=!["dirt","sand","mud","ice"].includes(u.type);return}}s.isAgainstWall=!1}_handleTileVerticalCollisions(t,e,s,i,n){const a=Math.floor(t.x/v.TILE_SIZE),o=Math.floor((t.x+s.width-1)/v.TILE_SIZE);if(e.vy<0){const u=Math.floor(t.y/v.TILE_SIZE);for(let d=a;d<=o;d++){const p=i.getTileAt(d*v.TILE_SIZE,u*v.TILE_SIZE);if(p&&p.solid){t.y=(u+1)*v.TILE_SIZE,e.vy=0;return}}}const l=t.y+s.height,h=Math.floor(l/v.TILE_SIZE);s.isGrounded=!1;for(let u=a;u<=o;u++){const d=i.getTileAt(u*v.TILE_SIZE,h*v.TILE_SIZE);if(d&&d.solid&&e.vy>=0){const p=h*v.TILE_SIZE,m=t.y+s.height,x=m-e.vy*n;if(m>=p&&x<=p+1){this._landOnSurface(t,e,s,p,d.interaction||d.type);return}}}}_handleSolidObjectCollisions(t,e,s,i,n){const a=i.traps.filter(o=>o.solid);for(const o of a){const l=o.x-o.width/2,h=o.x+o.width/2,u=o.y-o.height/2,d=o.y+o.height/2,p=t.x,m=t.x+s.width,x=t.y,C=t.y+s.height;if(!(m<l||p>h||C<u||x>d)){if(e.vy>=0){const F=C-e.vy*n;if(C>=u&&F<=u+1){this._landOnSurface(t,e,s,u,o.type),typeof o.onLanded=="function"&&o.onLanded(c);continue}}C>u&&x<d&&(e.vx>0&&m>l&&p<l?(t.x=l-s.width,e.vx=0):e.vx<0&&p<h&&m>h&&(t.x=h,e.vx=0))}}}_landOnSurface(t,e,s,i,n){const a=e.vy;if(a>=g.FALL_DAMAGE_MIN_VELOCITY){const{FALL_DAMAGE_MIN_VELOCITY:o,FALL_DAMAGE_MAX_VELOCITY:l,FALL_DAMAGE_MIN_AMOUNT:h,FALL_DAMAGE_MAX_AMOUNT:u}=g,p=(Math.max(o,Math.min(a,l))-o)/(l-o),m=Math.round(h+p*(u-h));c.publish("playerTookDamage",{amount:m,source:"fall"})}t.y=i-s.height,e.vy=0,s.isGrounded=!0,s.groundType=n}_isCollidingWith(t,e,s){const i=s.hitbox||{x:s.x-(s.width||s.size)/2,y:s.y-(s.height||s.size)/2,width:s.width||s.size,height:s.height||s.size};return t.x<i.x+i.width&&t.x+e.width>i.x&&t.y<i.y+i.height&&t.y+e.height>i.y}_checkObjectInteractions(t,e,s,i,n,a,o){this._checkFruitCollisions(t,s,i,a,o),this._checkTrophyCollision(t,s,i.trophy,a,o),this.checkCheckpointCollisions(t,s,i,a,o),this._checkTrapInteractions(t,e,s,i,n,a,o)}_checkTrapInteractions(t,e,s,i,n,a,o){const l={pos:t,vel:e,col:s,entityId:a,entityManager:o,dt:n};for(const h of i.traps)if(h.type==="trampoline"){if(e.vy>0){const u=t.y+s.height,d=h.y-h.height/2,p=h.x-h.width/2,m=u-e.vy*n;if(t.x+s.width>p&&t.x<p+h.width&&u>=d&&m<=d+1){h.onCollision(l,c);continue}}}else h.type==="fan"?this._isCollidingWith(t,s,h)&&h.onCollision(l,c):this._isCollidingWith(t,s,h)&&h.onCollision(l,c)}_checkFruitCollisions(t,e,s,i,n){for(const a of s.getActiveFruits())this._isCollidingWith(t,e,a)&&c.publish("collisionEvent",{type:"fruit",entityId:i,target:a,entityManager:n})}_checkTrophyCollision(t,e,s,i,n){!s||s.acquired||s.inactive||this._isCollidingWith(t,e,s)&&c.publish("collisionEvent",{type:"trophy",entityId:i,target:s,entityManager:n})}checkCheckpointCollisions(t,e,s,i,n){for(const a of s.getInactiveCheckpoints())this._isCollidingWith(t,e,a)&&c.publish("collisionEvent",{type:"checkpoint",entityId:i,target:a,entityManager:n})}}class I{constructor({spriteKey:t,width:e,height:s,animationState:i="idle",animationFrame:n=0,animationTimer:a=0,direction:o="right",isVisible:l=!0}){this.spriteKey=t,this.width=e,this.height=s,this.animationState=i,this.animationFrame=n,this.animationTimer=a,this.direction=o,this.isVisible=l}}class _t{constructor(t){this.characterId=t}}class he{constructor(t,e,s){this.ctx=t,this.canvas=e,this.assets=s,this.backgroundCache=new Map,this.backgroundOffset={x:0,y:0}}_preRenderBackground(t){const e=t.background;if(this.backgroundCache.has(e))return this.backgroundCache.get(e);const s=this.assets[e];if(!s||!s.complete||s.naturalWidth===0)return null;const i=document.createElement("canvas");i.width=this.canvas.width+s.width,i.height=this.canvas.height+s.height;const n=i.getContext("2d"),a=n.createPattern(s,"repeat");return n.fillStyle=a,n.fillRect(0,0,i.width,i.height),this.backgroundCache.set(e,i),i}drawScrollingBackground(t,e){const s=this._preRenderBackground(t),i=this.assets[t.background];if(!s||!i||!i.complete||i.naturalWidth===0){this.ctx.fillStyle="#87CEEB",this.ctx.fillRect(0,0,this.canvas.width,this.canvas.height);return}this.backgroundOffset.x+=t.backgroundScroll.x*e,this.backgroundOffset.y+=t.backgroundScroll.y*e;const n=(this.backgroundOffset.x%i.width+i.width)%i.width,a=(this.backgroundOffset.y%i.height+i.height)%i.height;this.ctx.drawImage(s,n,a,this.canvas.width,this.canvas.height,0,0,this.canvas.width,this.canvas.height)}renderScene(t,e,s,i){t.apply(this.ctx),this.drawTileGrid(e,t),e.trophy&&this.drawTrophy(e.trophy,t),this.drawFruits(e.getActiveFruits(),t),this.drawCheckpoints(e.checkpoints,t),this.drawTraps(e.traps,t);const n=s.query([k,I]);for(const a of n){const o=s.getComponent(a,k),l=s.getComponent(a,I),h=s.getComponent(a,_t),u=s.getComponent(a,S);this._drawRenderable(o,l,h,u)}this.drawCollectedFruits(i,t),t.restore(this.ctx)}_drawRenderable(t,e,s,i){const n=e.animationState;if(!e.isVisible||i&&i.despawnAnimationFinished)return;const a={idle:"playerIdle",run:"playerRun",jump:"playerJump",double_jump:"playerDoubleJump",fall:"playerFall",dash:"playerDash",cling:"playerCling",spawn:"playerAppear",despawn:"playerDisappear",hit:"playerHit"};let o;const l=a[n];if(n==="spawn"||n==="despawn"?o=this.assets[l]:s?o=this.assets.characters[s.characterId]?.[l]||this.assets.playerIdle:o=this.assets[e.spriteKey],!o){this.ctx.fillStyle="#FF00FF",this.ctx.fillRect(t.x,t.y,e.width,e.height);return}const h=g.ANIMATION_FRAMES[n]||1,u=o.width/h,d=u*e.animationFrame;this.ctx.save();const p=n==="spawn"||n==="despawn",m=p?t.x-(e.width-g.WIDTH)/2:t.x,x=p?t.y-(e.height-g.HEIGHT)/2:t.y;e.direction==="left"?(this.ctx.scale(-1,1),this.ctx.translate(-m-e.width,x)):this.ctx.translate(m,x);const C=n==="cling"?g.CLING_OFFSET:0;this.ctx.drawImage(o,d,0,u,o.height,C,0,e.width,e.height),this.ctx.restore()}drawTileGrid(t,e){const s=v.TILE_SIZE,i=Math.floor(e.x/s),n=Math.ceil((e.x+e.width)/s),a=Math.floor(e.y/s),o=Math.ceil((e.y+e.height)/s);for(let l=a;l<o;l++)for(let h=i;h<n;h++){if(h<0||h>=t.gridWidth||l<0||l>=t.gridHeight)continue;const u=t.tiles[l][h];if(u.type==="empty")continue;const d=this.assets[u.spriteKey];if(!d){this.ctx.fillStyle="magenta",this.ctx.fillRect(h*s,l*s,s,s);continue}const p=h*s,m=l*s,x=s+1;u.spriteConfig?this.ctx.drawImage(d,u.spriteConfig.srcX,u.spriteConfig.srcY,s,s,p,m,x,x):this.ctx.drawImage(d,p,m,x,x)}}drawTrophy(t,e){if(!e.isVisible(t.x-t.size/2,t.y-t.size/2,t.size,t.size))return;const s=this.assets.trophy;if(!s)return;const i=s.width/t.frameCount,n=i*t.animationFrame;t.inactive&&(this.ctx.globalAlpha=.5),this.ctx.drawImage(s,n,0,i,s.height,t.x-t.size/2,t.y-t.size/2,t.size,t.size),this.ctx.globalAlpha=1}drawFruits(t,e){for(const s of t){if(!e.isRectVisible({x:s.x-s.size/2,y:s.y-s.size/2,width:s.size,height:s.size}))continue;const i=this.assets[s.spriteKey];if(!i)continue;const n=i.width/s.frameCount,a=n*s.frame;this.ctx.drawImage(i,a,0,n,i.height,s.x-s.size/2,s.y-s.size/2,s.size,s.size)}}drawTraps(t,e){for(const s of t)s.render(this.ctx,this.assets,e)}drawCollectedFruits(t,e){const s=this.assets.fruit_collected;if(!s)return;const i=s.width/6;for(const n of t){if(!e.isRectVisible({x:n.x,y:n.y,width:n.size,height:n.size}))continue;const a=n.frame*i;this.ctx.drawImage(s,a,0,i,s.height,n.x-n.size/2,n.y-n.size/2,n.size,n.size)}}drawCheckpoints(t,e){for(const s of t){if(!e.isRectVisible({x:s.x,y:s.y,width:s.size,height:s.size}))continue;let i,n=0,a;switch(s.state){case"inactive":i=this.assets.checkpoint_inactive,i&&(a=i.width);break;case"activating":i=this.assets.checkpoint_activation,i&&(a=i.width/s.frameCount,n=s.frame*a);break;case"active":if(i=this.assets.checkpoint_active,i){const l=Math.floor(performance.now()/1e3/.1%10);a=i.width/10,n=l*a}break}i&&a>0?this.ctx.drawImage(i,n,0,a,i.height,s.x-s.size/2,s.y-s.size/2,s.size,s.size):(this.ctx.fillStyle="purple",this.ctx.fillRect(s.x-s.size/2,s.y-s.size/2,s.size,s.size))}}}const q={0:{type:"empty",solid:!1,hazard:!1,description:"Empty space. The player can move freely through it."},1:{type:"dirt",solid:!0,hazard:!1,spriteKey:"block",spriteConfig:{srcX:96,srcY:0},description:"A standard, solid block of dirt. Wall-jumps are not possible on this surface."},2:{type:"stone",solid:!0,hazard:!1,spriteKey:"block",spriteConfig:{srcX:0,srcY:0},description:"A standard, solid block of stone. Players can wall-jump off this surface."},3:{type:"wood",solid:!0,hazard:!1,spriteKey:"block",spriteConfig:{srcX:0,srcY:64},description:"A standard, solid block of wood. Players can wall-jump off this surface."},4:{type:"green_block",solid:!0,hazard:!1,spriteKey:"block",spriteConfig:{srcX:0,srcY:128},description:"A solid, green-colored block. Players can wall-jump off this surface."},5:{type:"orange_dirt",solid:!0,hazard:!1,spriteKey:"block",spriteConfig:{srcX:96,srcY:64},description:"Solid orange dirt. Wall-jumps are not possible on this surface."},6:{type:"pink_dirt",solid:!0,hazard:!1,spriteKey:"block",spriteConfig:{srcX:96,srcY:128},description:"Solid pink dirt. Wall-jumps are not possible on this surface."},7:{type:"sand",solid:!0,hazard:!1,spriteKey:"sand_mud_ice",spriteConfig:{srcX:0,srcY:0},interaction:"sand",description:"A solid block of sand. Slows player movement. Wall-jumps are not possible."},8:{type:"mud",solid:!0,hazard:!1,spriteKey:"sand_mud_ice",spriteConfig:{srcX:64,srcY:0},interaction:"mud",description:"A solid block of mud. Reduces jump height. Wall-jumps are not possible."},9:{type:"ice",solid:!0,hazard:!1,spriteKey:"sand_mud_ice",spriteConfig:{srcX:128,srcY:0},interaction:"ice",description:"A solid block of slippery ice. Reduces friction. Wall-jumps are not possible."}};class Y{constructor(t,e,s){this.x=t,this.y=e,this.width=s.width||16,this.height=s.height||16,this.type=s.type,this.id=`${this.type}-${Math.random().toString(36).substr(2,9)}`}update(t,e,s){}render(t,e,s){}onCollision(t,e){}reset(){}}class ce extends Y{constructor(t,e,s){super(t,e,{...s,width:16,height:16}),this.solid=!0,this.state="off",this.playerIsOnTop=!1,this.frame=0,this.frameTimer=0,this.turnOffTimer=0,this.damageTimer=1,this.anim={activating:{frames:4,speed:.1},on:{frames:3,speed:.15}}}get hitbox(){return this.state==="on"||this.state==="activating"?{x:this.x-this.width/2,y:this.y-this.height*1.5,width:this.width,height:this.height*2}:{x:this.x-this.width/2,y:this.y-this.height/2,width:this.width,height:this.height}}update(t){switch(!this.playerIsOnTop&&this.state==="on"&&(this.state="turning_off",this.turnOffTimer=2),this.state){case"activating":this.frameTimer+=t,this.frameTimer>=this.anim.activating.speed&&(this.frameTimer=0,this.frame++,this.frame>=this.anim.activating.frames&&(this.frame=0,this.state="on"));break;case"on":this.frameTimer+=t,this.frameTimer>=this.anim.on.speed&&(this.frameTimer=0,this.frame=(this.frame+1)%this.anim.on.frames);break;case"turning_off":this.turnOffTimer-=t,this.turnOffTimer<=0&&(this.state="off",this.frame=0);break}this.state==="on"?this.damageTimer+=t:this.playerIsOnTop||(this.damageTimer=1)}render(t,e,s){if(!s.isVisible(this.x,this.y-this.height,this.width,this.height*2))return;const i=this.x-this.width/2,n=this.y-this.height/2,a=e.fire_off;if(a&&t.drawImage(a,0,16,16,16,i,n,this.width,this.height),this.state==="off"||this.state==="turning_off")return;let o,l=0,h;this.state==="activating"?(o=e.fire_hit,h=o.width/this.anim.activating.frames,l=this.frame*h):(o=e.fire_on,h=o.width/this.anim.on.frames,l=this.frame*h),o&&t.drawImage(o,l,0,h,o.height,i,n-this.height,this.width,this.height*2)}onLanded(t){this.playerIsOnTop=!0,(this.state==="off"||this.state==="turning_off")&&(this.state="activating",this.frame=0,this.frameTimer=0,t.publish("playSound",{key:"fire_activated",volume:.8,channel:"SFX"}))}onCollision(t,e){this.state==="on"&&this.damageTimer>=1&&(this.damageTimer-=1,e.publish("playerTookDamage",{amount:10,source:"fire"}))}reset(){this.state="off",this.playerIsOnTop=!1,this.frame=0,this.frameTimer=0,this.turnOffTimer=0,this.damageTimer=1}}class de extends Y{constructor(t,e,s){super(t,e,{...s,width:16,height:16}),this.state="hidden",this.activationRadius=64,this.warningDuration=.4,this.retractDelay=1.5,this.timer=0,this.damage=s.damage||40}get hitbox(){return{x:this.x-this.width/2,y:this.y-this.height/4,width:this.width,height:this.height/2}}update(t,e){if(!e)return;this.timer>0&&(this.timer-=t);const s=e.x,i=e.x+e.width,n=e.y,a=e.y+e.height,o=this.x-this.activationRadius,l=this.x+this.activationRadius,h=this.y-this.activationRadius,u=this.y+this.activationRadius,d=i>o&&s<l&&a>h&&n<u;switch(this.state){case"hidden":d&&(this.state="warning",this.timer=this.warningDuration);break;case"warning":this.timer<=0&&(this.state="extended",this.timer=this.retractDelay);break;case"extended":this.timer<=0&&(this.state="hidden");break}}render(t,e,s){if(this.state==="hidden"||this.state==="warning")return;const i=this.x-this.width/2,n=this.y-this.height/2;if(!s.isVisible(i,n,this.width,this.height))return;const a=e.spike_two;a&&t.drawImage(a,i,n,this.width,this.height)}onCollision(t,e){this.state==="extended"&&e.publish("collisionEvent",{type:"hazard",entityId:t.entityId,entityManager:t.entityManager,damage:this.damage})}reset(){this.state="hidden",this.timer=0}}class ue extends Y{constructor(t,e,s){super(t,e,{...s,width:28,height:28}),this.state="idle",this.frame=0,this.frameCount=8,this.frameSpeed=.05,this.frameTimer=0}update(t){this.state==="jumping"&&(this.frameTimer+=t,this.frameTimer>=this.frameSpeed&&(this.frameTimer-=this.frameSpeed,this.frame++,this.frame>=this.frameCount&&(this.frame=0,this.state="idle")))}render(t,e,s){const i=this.x-this.width/2,n=this.y-this.height/2;if(!s.isVisible(i,n,this.width,this.height))return;let a,o=0,l;this.state==="jumping"?(a=e.trampoline_jump,a&&(l=a.width/this.frameCount,o=this.frame*l)):(a=e.trampoline_idle,a&&(l=a.width)),a&&l>0?t.drawImage(a,o,0,l,a.height,i,n,this.width,this.height):(t.fillStyle="#8e44ad",t.fillRect(i,n,this.width,this.height))}onCollision(t,e){const{pos:s,vel:i,col:n}=t;i.vy=-400*g.TRAMPOLINE_BOUNCE_MULTIPLIER,s.y=this.y-this.height/2-n.height,this.state="jumping",this.frame=0,this.frameTimer=0,e.publish("playSound",{key:"trampoline_bounce",volume:1,channel:"SFX"})}reset(){this.state="idle",this.frame=0,this.frameTimer=0}}class pe extends Y{constructor(t,e,s){super(t,e,{...s,width:28,height:28}),this.chainLength=s.chainLength||100,this.swingArc=s.swingArc||90,this.period=s.period||4,this.tiltAmount=s.tiltAmount||.5,this.anchorX=t,this.anchorY=e,this.ballX=this.anchorX,this.ballY=this.anchorY+this.chainLength,this.swingTimer=0,this.maxAngle=this.swingArc/2*(Math.PI/180),this.rotation=0}get hitbox(){return{x:this.ballX-this.width/2,y:this.ballY-this.height/2,width:this.width,height:this.height}}update(t){this.swingTimer+=t;const e=this.maxAngle*Math.sin(this.swingTimer/this.period*2*Math.PI),s=this.maxAngle*Math.cos(this.swingTimer/this.period*2*Math.PI);this.rotation=s*this.tiltAmount,this.ballX=this.anchorX+this.chainLength*Math.sin(e),this.ballY=this.anchorY+this.chainLength*Math.cos(e)}render(t,e,s){if(!s.isVisible(this.anchorX-this.chainLength,this.anchorY,this.chainLength*2,this.chainLength*2))return;const i=e.spiked_ball,n=e.spiked_ball_chain;if(n){const o=this.ballX-this.anchorX,l=this.ballY-this.anchorY,h=Math.sqrt(o*o+l*l),u=Math.atan2(l,o);t.save(),t.translate(this.anchorX,this.anchorY),t.rotate(u);for(let d=0;d<h;d+=8)t.drawImage(n,d,-8/2,8,8);t.restore()}i?(t.save(),t.translate(this.ballX,this.ballY),t.rotate(this.rotation),t.drawImage(i,-this.width/2,-this.height/2,this.width,this.height),t.restore()):(t.fillStyle="red",t.fillRect(this.hitbox.x,this.hitbox.y,this.width,this.height))}onCollision(t,e){const s=t.pos.x+t.col.width/2,i=t.pos.y+t.col.height/2;let n=s-this.ballX,a=i-this.ballY;const o=Math.sqrt(n*n+a*a);o===0?(n=1,a=0):(n/=o,a/=o);const l=200;e.publish("collisionEvent",{type:"hazard",entityId:t.entityId,entityManager:t.entityManager,damage:50,knockback:{vx:n*l,vy:a*l-150}})}reset(){this.swingTimer=0,this.rotation=0}}class me extends Y{constructor(t,e,s){super(t,e,s),this.width=18,this.height=18,this.type="arrow_bubble",this.direction=s.direction||"right",this.knockbackSpeed=s.knockbackSpeed||450,this.state="idle",this.idleAnimation={frameCount:10,frameSpeed:.1,frameTimer:0,currentFrame:0},this.hitAnimation={frameCount:4,frameSpeed:.08,frameTimer:0,currentFrame:0}}update(t){this.state==="idle"?(this.idleAnimation.frameTimer+=t,this.idleAnimation.frameTimer>=this.idleAnimation.frameSpeed&&(this.idleAnimation.frameTimer=0,this.idleAnimation.currentFrame=(this.idleAnimation.currentFrame+1)%this.idleAnimation.frameCount)):this.state==="hit"&&(this.hitAnimation.frameTimer+=t,this.hitAnimation.frameTimer>=this.hitAnimation.frameSpeed&&(this.hitAnimation.frameTimer=0,this.hitAnimation.currentFrame++,this.hitAnimation.currentFrame>=this.hitAnimation.frameCount&&(this.state="inactive")))}render(t,e,s){if(this.state==="inactive")return;const i=this.x-this.width/2,n=this.y-this.height/2;if(!s.isVisible(i,n,this.width,this.height))return;const a=this.state==="idle"?e.arrow_idle:e.arrow_hit,o=this.state==="idle"?this.idleAnimation.currentFrame:this.hitAnimation.currentFrame,l=this.state==="idle"?this.idleAnimation.frameCount:this.hitAnimation.frameCount;if(a){const h=a.width/l,u=a.height;t.save(),t.translate(this.x,this.y);let d=0;switch(this.direction){case"up":d=0;break;case"right":d=Math.PI/2;break;case"down":d=Math.PI;break;case"left":default:d=-Math.PI/2;break}t.rotate(d),t.drawImage(a,o*h,0,h,u,-this.width/2,-this.height/2,this.width,this.height),t.restore()}}onCollision(t,e){if(this.state!=="idle")return;this.state="hit",this.hitAnimation.currentFrame=0,this.hitAnimation.frameTimer=0,e.publish("playSound",{key:"arrow_pop",volume:.8,channel:"SFX"});let s=0,i=0;switch(this.direction){case"up":i=-this.knockbackSpeed;break;case"down":i=this.knockbackSpeed;break;case"left":s=-this.knockbackSpeed;break;case"right":s=this.knockbackSpeed;break}e.publish("collisionEvent",{type:"hazard",entityId:t.entityId,entityManager:t.entityManager,damage:0,knockback:{vx:s,vy:i}})}reset(){this.state="idle",this.idleAnimation.currentFrame=0,this.idleAnimation.frameTimer=0,this.hitAnimation.currentFrame=0,this.hitAnimation.frameTimer=0}}class fe extends Y{constructor(t,e,s){super(t,e,s),this.width=24,this.height=8,this.type="fan",this.direction=s.direction||"right",this.pushStrength=s.pushStrength||250,this.windHeight=s.windHeight||120,this.soundRadius=s.soundRadius||250,this.state="off",this.onDuration=5,this.offDuration=5,this.timer=this.offDuration,this.isSoundPlaying=!1,this.onAnimation={frameCount:4,frameSpeed:.05,frameTimer:0,currentFrame:0},this.particleTimer=0}get hitbox(){const t=this.width,e=this.height;switch(this.direction){case"up":return{x:this.x-t/2,y:this.y-e/2-this.windHeight,width:t,height:this.windHeight};case"down":return{x:this.x-t/2,y:this.y+e/2,width:t,height:this.windHeight};case"left":return{x:this.x-e/2-this.windHeight,y:this.y-t/2,width:this.windHeight,height:t};case"right":default:return{x:this.x+e/2,y:this.y-t/2,width:this.windHeight,height:t}}}update(t,e,s){this.timer-=t,this.timer<=0&&(this.state==="off"?(this.state="on",this.timer=this.onDuration):(this.state="off",this.timer=this.offDuration)),this.state==="on"&&(this.onAnimation.frameTimer+=t,this.onAnimation.frameTimer>=this.onAnimation.frameSpeed&&(this.onAnimation.frameTimer=0,this.onAnimation.currentFrame=(this.onAnimation.currentFrame+1)%this.onAnimation.frameCount),this.particleTimer+=t,this.particleTimer>=.05&&(this.particleTimer=0,s.publish("createParticles",{x:this.x,y:this.y,type:"fan_push",direction:this.direction,particleSpeed:this.pushStrength*.75})));const i=this.isSoundPlaying;let n=!1;this.state==="on"&&e&&Math.sqrt(Math.pow(e.x-this.x,2)+Math.pow(e.y-this.y,2))<this.soundRadius&&(n=!0),n&&!i?(s.publish("startSoundLoop",{key:"fan_blowing",volume:.7,channel:"SFX"}),this.isSoundPlaying=!0):!n&&i&&(s.publish("stopSoundLoop",{key:"fan_blowing"}),this.isSoundPlaying=!1)}render(t,e,s){const i=this.state==="on"?e.fan_on:e.fan_off;if(!i||!s.isVisible(this.x-32,this.y-32,64,64))return;const n=this.state==="on"?this.onAnimation.currentFrame:0,a=this.state==="on"?this.onAnimation.frameCount:1,o=24,l=8,h=i.width/a,u=i.height;t.save(),t.translate(this.x,this.y);let d=0;switch(this.direction){case"up":d=0;break;case"left":d=-Math.PI/2;break;case"down":d=Math.PI;break;case"right":default:d=Math.PI/2;break}t.rotate(d),t.drawImage(i,n*h,0,h,u,-o/2,-l/2,o,l),t.restore()}onCollision(t){if(this.state!=="on")return;const{vel:e}=t;switch(this.direction){case"up":e.vy=-this.pushStrength;break;case"down":e.vy=this.pushStrength;break;case"left":e.vx=-this.pushStrength;break;case"right":e.vx=this.pushStrength;break}}reset(t){this.isSoundPlaying&&t.publish("stopSoundLoop",{key:"fan_blowing"}),this.state="off",this.timer=this.offDuration,this.isSoundPlaying=!1,this.onAnimation.currentFrame=0,this.onAnimation.frameTimer=0}}const ge={fire_trap:ce,spike:de,trampoline:ue,spiked_ball:pe,arrow_bubble:me,fan:fe};class ye{constructor(t){this.name=t.name||"Unnamed Level",this.gridWidth=t.gridWidth,this.gridHeight=t.gridHeight,this.width=this.gridWidth*v.TILE_SIZE,this.height=this.gridHeight*v.TILE_SIZE,this.background=t.background||"background_blue",this.backgroundScroll=t.backgroundScroll||{x:0,y:15},this.startPosition={x:t.startPosition.x*v.TILE_SIZE,y:t.startPosition.y*v.TILE_SIZE},this.tiles=t.layout.map(e=>[...e].map(s=>q[s]||q[0])),this.fruits=[],this.checkpoints=[],this.traps=[],this.trophy=null,(t.objects||[]).forEach(e=>{const s=e.x*v.TILE_SIZE,i=e.y*v.TILE_SIZE,n=ge[e.type];n?this.traps.push(new n(s,i,e)):e.type.startsWith("fruit_")?this.fruits.push({x:s,y:i,size:28,spriteKey:e.type,frame:0,frameCount:17,frameSpeed:.07,frameTimer:0,collected:!1,type:"fruit"}):e.type==="checkpoint"?this.checkpoints.push({x:s,y:i,size:64,state:"inactive",frame:0,frameCount:26,frameSpeed:.07,frameTimer:0,type:"checkpoint"}):e.type==="trophy"&&(this.trophy={x:s,y:i,size:32,frameCount:8,animationFrame:0,animationTimer:0,animationSpeed:.35,acquired:!1,inactive:!0,contactMade:!1})}),this.totalFruitCount=this.fruits.length,this.collectedFruitCount=0,this.completed=!1}getTileAt(t,e){const s=Math.floor(t/v.TILE_SIZE),i=Math.floor(e/v.TILE_SIZE);return s<0||s>=this.gridWidth||i<0?q[1]:i>=this.gridHeight||!this.tiles[i]?q[0]:this.tiles[i][s]||q[0]}update(t,e,s,i){this.updateFruits(t),this.updateTrophyAnimation(t),this.updateCheckpoints(t);const n=e.getComponent(s,k),a=e.getComponent(s,T),o=n&&a?{...n,width:a.width,height:a.height}:null;for(const l of this.traps)l.update(t,o,i)}updateCheckpoints(t){for(const e of this.checkpoints)e.state==="activating"&&(e.frameTimer+=t,e.frameTimer>=e.frameSpeed&&(e.frameTimer-=e.frameSpeed,e.frame++,e.frame>=e.frameCount&&(e.frame=0,e.state="active")))}getInactiveCheckpoints(){return this.checkpoints.filter(t=>t.state==="inactive")}updateFruits(t){for(const e of this.fruits)e.collected||(e.frameTimer+=t,e.frameTimer>=e.frameSpeed&&(e.frameTimer-=e.frameSpeed,e.frame=(e.frame+1)%e.frameCount))}collectFruit(t){t.collected||(t.collected=!0,this.collectedFruitCount++,this.trophy&&this.allFruitsCollected()&&(this.trophy.inactive=!1))}getActiveFruits(){return this.fruits.filter(t=>!t.collected)}getFruitCount(){return this.collectedFruitCount}getTotalFruitCount(){return this.totalFruitCount}allFruitsCollected(){return this.collectedFruitCount===this.totalFruitCount}recalculateCollectedFruits(){this.collectedFruitCount=this.fruits.reduce((t,e)=>t+(e.collected?1:0),0)}updateTrophyAnimation(t){const e=this.trophy;!e||e.inactive||e.acquired||(e.animationTimer+=t,e.animationTimer>=e.animationSpeed&&(e.animationTimer-=e.animationSpeed,e.animationFrame=(e.animationFrame+1)%e.frameCount))}isCompleted(){return this.fruits.length&&!this.allFruitsCollected()?!1:!this.trophy||this.trophy.acquired}reset(){this.fruits.forEach(t=>{t.collected=!1,t.frame=0,t.frameTimer=0}),this.collectedFruitCount=0,this.checkpoints.forEach(t=>{t.state="inactive",t.frame=0,t.frameTimer=0}),this.traps.forEach(t=>{t.reset(eventBus)}),this.trophy&&(this.trophy.acquired=!1,this.trophy.inactive=!0,this.trophy.animationFrame=0,this.trophy.animationTimer=0),this.completed=!1}}class be{constructor(t){this.gameState=t,this.levelSections=E,c.subscribe("requestNextLevel",()=>this.goToNextLevel()),c.subscribe("requestPreviousLevel",()=>this.goToPreviousLevel())}loadLevel(t,e){if(t>=this.levelSections.length||e>=this.levelSections[t].levels.length)return console.error(`Invalid level: Section ${t}, Level ${e}`),null;const s=this.levelSections[t].levels[e];return s?(this.gameState.currentSection=t,this.gameState.currentLevelIndex=e,new ye(s)):(console.error(`Failed to load level data for Section ${t}, Level ${e}. The JSON file may be missing or failed to fetch.`),null)}hasNextLevel(){const{currentSection:t,currentLevelIndex:e}=this.gameState,s=e+1<this.levelSections[t].levels.length,i=t+1<this.levelSections.length;return s||i}hasPreviousLevel(){const{currentSection:t,currentLevelIndex:e}=this.gameState;return e>0||t>0}goToNextLevel(){if(!this.hasNextLevel())return;let{currentSection:t,currentLevelIndex:e}=this.gameState;e+1<this.levelSections[t].levels.length?e++:t+1<this.levelSections.length&&(t++,e=0),c.publish("requestLevelLoad",{sectionIndex:t,levelIndex:e})}goToPreviousLevel(){if(!this.hasPreviousLevel())return;let{currentSection:t,currentLevelIndex:e}=this.gameState;e>0?e--:t>0&&(t--,e=this.levelSections[t].levels.length-1),c.publish("requestLevelLoad",{sectionIndex:t,levelIndex:e})}handleLevelCompleteAction(t){this.gameState.showingLevelComplete=!1;let{currentSection:e,currentLevelIndex:s}=this.gameState;t==="next"&&this.hasNextLevel()?(s+1<this.levelSections[e].levels.length?s++:e+1<this.levelSections.length&&(e++,s=0),c.publish("requestLevelLoad",{sectionIndex:e,levelIndex:s})):t==="restart"?c.publish("requestLevelLoad",{sectionIndex:e,levelIndex:s}):t==="previous"&&this.hasPreviousLevel()&&(s>0?s--:e>0&&(e--,s=this.levelSections[e].levels.length-1),c.publish("requestLevelLoad",{sectionIndex:e,levelIndex:s}))}}class ve{constructor(t){this.assets=t,this.particles=[],c.subscribe("createParticles",e=>this.create(e))}create({x:t,y:e,type:s,direction:i="right",particleSpeed:n=null}){const o={dash:{count:10,baseSpeed:150,spriteKey:"dust_particle",life:.4,gravity:50},double_jump:{count:7,baseSpeed:100,spriteKey:"dust_particle",life:.4,gravity:50},sand:{count:2,baseSpeed:20,spriteKey:"sand_particle",life:.5,gravity:120},mud:{count:2,baseSpeed:15,spriteKey:"mud_particle",life:.6,gravity:100},ice:{count:2,baseSpeed:25,spriteKey:"ice_particle",life:.4,gravity:20},walk_dust:{count:1,baseSpeed:15,spriteKey:"dust_particle",life:.4,gravity:80},jump_trail:{count:1,baseSpeed:10,spriteKey:"dust_particle",life:.3,gravity:20},fan_push:{count:2,baseSpeed:120,spriteKey:"dust_particle",life:.7,gravity:0}}[s];if(o)for(let l=0;l<o.count;l++){let h,d=(n||o.baseSpeed)*(.8+Math.random()*.4);if(s==="dash")h=(i==="right"?Math.PI:0)+(Math.random()-.5)*(Math.PI/2);else if(s==="double_jump")h=Math.PI/2+(Math.random()-.5)*(Math.PI/3);else if(s==="jump_trail")h=Math.random()*Math.PI*2,d*=Math.random()*.5;else if(s==="fan_push"){let m=0;switch(i){case"up":m=-Math.PI/2;break;case"left":m=Math.PI;break;case"down":m=Math.PI/2;break;case"right":default:m=0;break}h=m+(Math.random()-.5)*(Math.PI/6)}else h=-(Math.PI/2)+(Math.random()-.5)*(Math.PI/4);const p=o.life+Math.random()*.3;this.particles.push({x:t,y:e,vx:Math.cos(h)*d,vy:Math.sin(h)*d,life:p,initialLife:p,size:5+Math.random()*4,alpha:1,spriteKey:o.spriteKey,gravity:o.gravity})}}update(t){for(let e=this.particles.length-1;e>=0;e--){const s=this.particles[e];s.life-=t,s.life<=0?this.particles.splice(e,1):(s.x+=s.vx*t,s.y+=s.vy*t,s.vy+=(s.gravity||50)*t,s.alpha=Math.max(0,s.life/s.initialLife))}}render(t,e){if(this.particles.length!==0){t.save(),e.apply(t);for(const s of this.particles){const i=this.assets[s.spriteKey]||this.assets.dust_particle;!i||!e.isVisible(s.x,s.y,s.size,s.size)||(t.globalAlpha=s.alpha,t.drawImage(i,s.x-s.size/2,s.y-s.size/2,s.size,s.size))}e.restore(t),t.restore()}}}class xe{constructor(t,e){this.canvas=t,this.assets=e,this.hoveredButton=null;const s=64,i=20,n=20,a=10,o=this.canvas.width-s-i;this.uiButtons=[{id:"settings",x:o,y:n+(s+a)*0,width:s,height:s,assetKey:"settings_icon",visible:!1},{id:"pause",x:o,y:n+(s+a)*1,width:s,height:s,assetKey:"pause_icon",visible:!1},{id:"levels",x:o,y:n+(s+a)*2,width:s,height:s,assetKey:"levels_icon",visible:!1},{id:"character",x:o,y:n+(s+a)*3,width:s,height:s,assetKey:"character_icon",visible:!1},{id:"info",x:o,y:n+(s+a)*4,width:s,height:s,assetKey:"info_icon",visible:!1}],this.canvas.addEventListener("mousemove",l=>this.handleMouseMove(l)),this.canvas.addEventListener("click",l=>this.handleCanvasClick(l)),c.subscribe("gameStarted",()=>this.uiButtons.forEach(l=>l.visible=!0))}_getMousePos(t){const e=this.canvas.getBoundingClientRect(),s=this.canvas.width/e.width,i=this.canvas.height/e.height;return{x:(t.clientX-e.left)*s,y:(t.clientY-e.top)*i}}handleMouseMove(t){const{x:e,y:s}=this._getMousePos(t);this.hoveredButton=null;for(const i of this.uiButtons)if(i.visible&&e>=i.x&&e<=i.x+i.width&&s>=i.y&&s<=i.y+i.height){this.hoveredButton=i;break}}handleCanvasClick(t){this.hoveredButton&&(c.publish("playSound",{key:"button_click",volume:.8,channel:"UI"}),c.publish("ui_button_clicked",{buttonId:this.hoveredButton.id}))}update(){}render(t,e){t.save(),t.setTransform(1,0,0,1,0,0);for(const s of this.uiButtons){if(!s.visible)continue;const i=s.id==="pause"?e?"pause_icon":"play_icon":s.assetKey,n=this.assets[i];if(!n)continue;const a=this.hoveredButton?.id===s.id,o=a?1.1:1,l=s.width*o,h=s.height*o,u=s.x-(l-s.width)/2,d=s.y-(h-s.height)/2;t.globalAlpha=a?1:.8,t.drawImage(n,u,d,l,h)}t.restore()}}class Lt{constructor(){this.nextEntityId=0,this.entities=new Set,this.componentsByClass=new Map}createEntity(){const t=this.nextEntityId++;return this.entities.add(t),t}addComponent(t,e){const s=e.constructor;return this.componentsByClass.has(s)||this.componentsByClass.set(s,new Map),this.componentsByClass.get(s).set(t,e),this}getComponent(t,e){const s=this.componentsByClass.get(e);return s?s.get(t):void 0}hasComponent(t,e){const s=this.componentsByClass.get(e);return s?s.has(t):!1}removeComponent(t,e){const s=this.componentsByClass.get(e);s&&s.delete(t)}destroyEntity(t){for(const e of this.componentsByClass.values())e.delete(t);this.entities.delete(t)}query(t){const e=[];for(const s of this.entities)t.every(i=>this.hasComponent(s,i))&&e.push(s);return e}}class U{constructor(){this.moveLeft=!1,this.moveRight=!1,this.jump=!1,this.dash=!1}}class P{constructor(t="idle"){this.currentState=t}}class J{constructor(t=100,e=100){this.maxHealth=t,this.currentHealth=e}}function Se(r,t,e,s){const i=r.createEntity();return r.addComponent(i,new k(t,e)),r.addComponent(i,new L),r.addComponent(i,new _t(s)),r.addComponent(i,new I({spriteKey:null,width:g.SPAWN_WIDTH,height:g.SPAWN_HEIGHT,animationState:"spawn"})),r.addComponent(i,new S),r.addComponent(i,new T({type:"dynamic",solid:!0,width:g.WIDTH,height:g.HEIGHT})),r.addComponent(i,new U),r.addComponent(i,new P("spawn")),r.addComponent(i,new J),i}class we{constructor(){this.keys={},c.subscribe("key_down",({key:t})=>this.keys[t]=!0),c.subscribe("key_up",({key:t})=>this.keys[t]=!1)}isKeyDown(t){return!!this.keys[t]}}const lt=new we;class _e{update(t,{entityManager:e,keybinds:s,isRunning:i,gameState:n}){const a=i&&!n.showingLevelComplete,o=e.query([S,U]);for(const l of o){const h=e.getComponent(l,U);h.moveLeft=a&&lt.isKeyDown(s.moveLeft),h.moveRight=a&&lt.isKeyDown(s.moveRight),h.jump=a&&lt.isKeyDown(s.jump),h.dash=a&&lt.isKeyDown(s.dash)}}}class ke{constructor(){c.subscribe("collisionEvent",t=>this.handleCollision(t))}handleCollision({type:t,entityId:e,target:s,entityManager:i,damage:n,knockback:a}){if(i.getComponent(e,S))switch(t){case"fruit":c.publish("fruitCollected",s);break;case"world_bottom":c.publish("playerDied");break;case"hazard":const l=n!==void 0?n:25;l>0&&c.publish("playerTookDamage",{amount:l,source:"hazard"}),a&&c.publish("playerKnockback",{entityId:e,entityManager:i,vx:a.vx,vy:a.vy});break;case"trophy":c.publish("trophyCollision");break;case"checkpoint":c.publish("checkpointActivated",s);break}}update(t,e){}}class Ce{constructor(){c.subscribe("playerTookDamage",t=>this.handleDamageTaken(t)),c.subscribe("playerRespawned",()=>{this.clearDamageEvents(),this.clearKnockbackEvents()}),c.subscribe("playerKnockback",t=>this.handleKnockback(t)),this.damageEvents=[],this.knockbackEvents=[]}clearDamageEvents(){this.damageEvents=[]}clearKnockbackEvents(){this.knockbackEvents=[]}handleDamageTaken(t){this.damageEvents.push(t)}handleKnockback(t){this.knockbackEvents.push(t)}_processDamageEvents(t){if(this.damageEvents.length===0)return;const e=t.query([S,I,P]);for(const s of this.damageEvents)for(const i of e){const n=t.getComponent(i,S),a=t.getComponent(i,I),o=t.getComponent(i,P);n.isHit||n.isSpawning||(s.source==="fall"||s.source==="fire"||s.source==="hazard")&&!n.isHit&&(n.isHit=!0,n.hitStunTimer=g.HIT_STUN_DURATION,this._setAnimationState(a,o,"hit",n),c.publish("playSound",{key:"hit",volume:.5,channel:"SFX"}))}this.damageEvents=[]}_processKnockbackEvents(t){if(this.knockbackEvents.length!==0){for(const e of this.knockbackEvents){const{entityId:s,vx:i,vy:n}=e;if(t.getComponent(s,S)){const o=t.getComponent(s,L);o&&(o.vx=i,o.vy=n)}}this.knockbackEvents=[]}}update(t,{entityManager:e}){this._processDamageEvents(e),this._processKnockbackEvents(e);const s=e.query([S,k,L,T,I,U,P]);for(const i of s){const n=e.getComponent(i,S),a=e.getComponent(i,k),o=e.getComponent(i,L),l=e.getComponent(i,T),h=e.getComponent(i,I),u=e.getComponent(i,U),d=e.getComponent(i,P);this._updateTimers(t,n),this._handleInput(t,u,a,o,n,l,h,d),this._updateFSM(o,n,l,h,d),this._updateAnimation(t,n,h,d),this._handleJumpTrail(t,a,l,n,d),l.isGrounded&&(n.coyoteTimer=g.COYOTE_TIME)}}_handleJumpTrail(t,e,s,i,n){n.currentState==="jump"&&i.jumpCount===1?(i.jumpParticleTimer-=t,i.jumpParticleTimer<=0&&(i.jumpParticleTimer=.05,c.publish("createParticles",{x:e.x+s.width/2,y:e.y+s.height,type:"jump_trail"}))):i.jumpParticleTimer=0}_updateTimers(t,e){e.jumpBufferTimer>0&&(e.jumpBufferTimer-=t),e.coyoteTimer>0&&(e.coyoteTimer-=t),e.dashCooldownTimer>0&&(e.dashCooldownTimer-=t),e.isHit&&(e.hitStunTimer-=t,e.hitStunTimer<=0&&(e.isHit=!1)),e.isDashing&&(e.dashTimer-=t,e.dashTimer<=0&&(e.isDashing=!1))}_handleInput(t,e,s,i,n,a,o,l){if(n.isSpawning||n.isDashing||n.isDespawning||n.isHit)return;e.moveLeft?o.direction="left":e.moveRight&&(o.direction="right");const h=e.jump&&!n.jumpPressed;if(e.jump&&(n.jumpBufferTimer=g.JUMP_BUFFER_TIME),n.jumpBufferTimer>0&&(a.isGrounded||n.coyoteTimer>0)&&n.jumpCount===0){const u=n.jumpForce*(a.groundType==="mud"?g.MUD_JUMP_MULTIPLIER:1);i.vy=-u,n.jumpCount=1,n.jumpBufferTimer=0,n.coyoteTimer=0,c.publish("playSound",{key:"jump",volume:.8,channel:"SFX"})}else h&&a.isAgainstWall&&!a.isGrounded?(i.vx=(o.direction==="left"?1:-1)*n.speed,o.direction=o.direction==="left"?"right":"left",i.vy=-n.jumpForce,n.jumpCount=1,c.publish("playSound",{key:"jump",volume:.8,channel:"SFX"})):h&&n.jumpCount===1&&!a.isGrounded&&!a.isAgainstWall&&(i.vy=-n.jumpForce,n.jumpCount=2,n.jumpBufferTimer=0,this._setAnimationState(o,l,"double_jump",n),c.publish("playSound",{key:"double_jump",volume:.6,channel:"SFX"}),c.publish("createParticles",{x:s.x+a.width/2,y:s.y+a.height,type:"double_jump"}));n.jumpPressed=e.jump,e.dash&&!n.dashPressed&&n.dashCooldownTimer<=0&&(n.isDashing=!0,n.dashTimer=n.dashDuration,i.vx=o.direction==="right"?n.dashSpeed:-n.dashSpeed,i.vy=0,n.dashCooldownTimer=g.DASH_COOLDOWN,this._setAnimationState(o,l,"dash",n),c.publish("playSound",{key:"dash",volume:.7,channel:"SFX"}),c.publish("createParticles",{x:s.x+a.width/2,y:s.y+a.height/2,type:"dash",direction:o.direction})),n.dashPressed=e.dash}_updateFSM(t,e,s,i,n){const a=n.currentState;if(!(a==="spawn"&&!e.spawnComplete||a==="despawn")){if(a==="spawn"&&e.spawnComplete){this._setAnimationState(i,n,"idle",e);return}if(e.isHit){a!=="hit"&&this._setAnimationState(i,n,"hit",e);return}if(a==="hit"&&!e.isHit&&this._setAnimationState(i,n,"idle",e),e.isDashing){a!=="dash"&&this._setAnimationState(i,n,"dash",e);return}s.isAgainstWall&&!s.isGrounded&&t.vy>=0?a!=="cling"&&this._setAnimationState(i,n,"cling",e):s.isGrounded?Math.abs(t.vx)>1?a!=="run"&&this._setAnimationState(i,n,"run",e):a!=="idle"&&this._setAnimationState(i,n,"idle",e):t.vy<0&&a!=="jump"&&a!=="double_jump"?this._setAnimationState(i,n,"jump",e):t.vy>=0&&a!=="fall"&&this._setAnimationState(i,n,"fall",e)}}_setAnimationState(t,e,s,i){e.currentState!==s&&(e.currentState=s,t.animationState=s,t.animationFrame=0,t.animationTimer=0,s==="cling"?i.jumpCount=1:(s==="idle"||s==="run")&&(i.jumpCount=0))}_updateAnimation(t,e,s,i){s.animationTimer+=t;const n=s.animationState;let a;if(n==="spawn"||n==="despawn"?a=g.SPAWN_ANIMATION_SPEED:n==="hit"?a=g.HIT_ANIMATION_SPEED:a=g.ANIMATION_SPEED,s.animationTimer<a)return;s.animationTimer-=a;const o=g.ANIMATION_FRAMES[n]||1;s.animationFrame++,n==="spawn"||n==="despawn"||n==="hit"?s.animationFrame>=o&&(s.animationFrame=o-1,n==="spawn"&&(e.isSpawning=!1,e.spawnComplete=!0,s.width=g.WIDTH,s.height=g.HEIGHT),n==="despawn"&&(e.isDespawning=!1,e.despawnAnimationFinished=!0)):s.animationFrame%=o}}class Ae{constructor(){}update(t,{entityManager:e}){const s=e.query([S,L,T,U,k]);for(const i of s){const n=e.getComponent(i,L),a=e.getComponent(i,T),o=e.getComponent(i,S),l=e.getComponent(i,U),h=e.getComponent(i,k);if(o.isSpawning||o.isDespawning){n.vx=0,n.vy=0,o.activeSurfaceSound&&(c.publish("stopSoundLoop",{key:o.activeSurfaceSound}),o.activeSurfaceSound=null);continue}this._applyHorizontalMovement(t,l,n,a,o),this._applyVerticalMovement(t,n,a,o),this._updateSurfaceEffects(t,h,n,a,o)}}_applyHorizontalMovement(t,e,s,i,n){if(n.isDashing||n.isHit){n.isHit&&(s.vx=0);return}const a=1e3;if(i.isGrounded&&i.groundType==="ice"){const o=g.ICE_ACCELERATION,l=g.ICE_FRICTION;e.moveLeft?s.vx-=o*t:e.moveRight?s.vx+=o*t:s.vx>0?(s.vx-=l*t,s.vx<0&&(s.vx=0)):s.vx<0&&(s.vx+=l*t,s.vx>0&&(s.vx=0)),s.vx=Math.max(-n.speed,Math.min(n.speed,s.vx))}else{const o=n.speed*(i.isGrounded&&i.groundType==="sand"?g.SAND_MOVE_MULTIPLIER:1);e.moveLeft?s.vx=-o:e.moveRight?s.vx=o:s.vx>0?(s.vx-=a*t,s.vx<0&&(s.vx=0)):s.vx<0&&(s.vx+=a*t,s.vx>0&&(s.vx=0))}}_applyVerticalMovement(t,e,s,i){!s.isGrounded&&!i.isDashing&&!i.isHit&&!i.isSpawning&&(e.vy+=g.GRAVITY*t),s.isAgainstWall&&!s.isGrounded&&(e.vy=Math.min(e.vy,30)),e.vy=Math.min(e.vy,g.MAX_FALL_SPEED)}_updateSurfaceEffects(t,e,s,i,n){const a=i.isGrounded&&Math.abs(s.vx)>1&&!n.isDashing&&!n.isHit,o=a?{sand:"sand_walk",mud:"mud_run",ice:"ice_run"}[i.groundType]:null;if(o!==n.activeSurfaceSound&&(n.activeSurfaceSound&&c.publish("stopSoundLoop",{key:n.activeSurfaceSound}),o&&c.publish("startSoundLoop",{key:o,channel:"SFX"}),n.activeSurfaceSound=o),a){n.surfaceParticleTimer+=t;const l=i.groundType==="sand"||i.groundType==="mud"?.1:.15;if(n.surfaceParticleTimer>=l){n.surfaceParticleTimer=0;let h;switch(i.groundType){case"sand":h="sand";break;case"mud":h="mud";break;case"ice":h="ice";break;default:i.groundType&&(h="walk_dust");break}h&&c.publish("createParticles",{x:e.x+i.width/2,y:e.y+i.height,type:h})}}}}class Te{constructor(t,e,s,i,n){this.ctx=t,this.canvas=e,this.assets=s,this.fontRenderer=n,this.lastFrameTime=0,this.keybinds=i,this.isRunning=!1,this.gameHasStarted=!1,this.pauseForMenu=!1,this.entityManager=new Lt,this.lastCheckpoint=null,this.fruitsAtLastCheckpoint=new Set,this.playerEntityId=null,this.camera=new ne(e.width,e.height),this.hud=new re(e,this.fontRenderer),this.soundManager=new oe,this.soundManager.loadSounds(s),this.renderer=new he(t,e,s),this.gameState=new ct,c.publish("gameStateUpdated",this.gameState),this.levelManager=new be(this.gameState),this.inputSystemProcessor=new _e,this.playerStateSystem=new Ce,this.movementSystem=new Ae,this.collisionSystem=new le,this.gameplaySystem=new ke,this.particleSystem=new ve(s),this.uiSystem=new xe(e,s),this.systems=[this.inputSystemProcessor,this.playerStateSystem,this.movementSystem,this.collisionSystem,this.particleSystem,this.uiSystem],this.levelStartTime=0,this.levelTime=0,this.currentLevel=null,this.collectedFruits=[],this._setupEventSubscriptions()}_setupEventSubscriptions(){c.subscribe("requestStartGame",()=>this.loadLevel(this.gameState.currentSection,this.gameState.currentLevelIndex)),c.subscribe("requestLevelLoad",({sectionIndex:t,levelIndex:e})=>this.loadLevel(t,e)),c.subscribe("requestLevelRestart",()=>this.loadLevel(this.gameState.currentSection,this.gameState.currentLevelIndex)),c.subscribe("keybindsUpdated",t=>this.updateKeybinds(t)),c.subscribe("fruitCollected",t=>this._onFruitCollected(t)),c.subscribe("playerTookDamage",t=>this._onPlayerTookDamage(t)),c.subscribe("trophyCollision",()=>this._onTrophyCollision()),c.subscribe("checkpointActivated",t=>this._onCheckpointActivated(t)),c.subscribe("playerDied",()=>this._onPlayerDied()),c.subscribe("characterUpdated",t=>this.updatePlayerCharacter(t)),c.subscribe("menuOpened",()=>{this.pauseForMenu=!0,this.pause()}),c.subscribe("allMenusClosed",()=>{this.pauseForMenu=!1,this.resume()}),c.subscribe("gameStateUpdated",t=>this.gameState=t)}updatePlayerCharacter(t){if(this.playerEntityId===null)return;const e=this.entityManager.getComponent(this.playerEntityId,_t);e&&(e.characterId=t||this.gameState.selectedCharacter)}updateKeybinds(t){this.keybinds={...t}}start(){this.isRunning||(this.isRunning=!0,this.gameHasStarted=!0,this.lastFrameTime=performance.now(),c.publish("gameStarted"),c.publish("gameResumed"),this.gameLoop())}stop(){this.isRunning=!1,this.soundManager.stopAll()}pause(){if(!this.isRunning)return;this.isRunning=!1,this.soundManager.stopAll({except:["UI"]});const t=this.entityManager.getComponent(this.playerEntityId,S);t&&(t.needsRespawn=!1),c.publish("gamePaused")}resume(){if(this.pauseForMenu||this.isRunning||!this.gameHasStarted||this.gameState.showingLevelComplete)return;this.isRunning=!0,this.lastFrameTime=performance.now(),c.publish("gameResumed"),this.gameLoop();const t=this.entityManager.getComponent(this.playerEntityId,S);t&&(t.needsRespawn=!1)}gameLoop(t=performance.now()){if(!this.isRunning)return;const e=Math.min((t-this.lastFrameTime)/1e3,.016);this.lastFrameTime=t,this.update(e),this.render(e),requestAnimationFrame(s=>this.gameLoop(s))}loadLevel(t,e){this.levelManager.gameState=this.gameState;const s=this.levelManager.loadLevel(t,e);if(!s){this.stop();return}this.currentLevel=s,this.pauseForMenu=!1;const i=new ct(this.gameState);i.showingLevelComplete=!1,i.currentSection=t,i.currentLevelIndex=e,this.gameState=i,this.gameState.incrementAttempts(t,e),c.publish("gameStateUpdated",this.gameState),this.collectedFruits=[],this.lastCheckpoint=null,this.fruitsAtLastCheckpoint.clear(),this.soundManager.stopAll(),this.entityManager=new Lt,this.playerEntityId=Se(this.entityManager,this.currentLevel.startPosition.x,this.currentLevel.startPosition.y,this.gameState.selectedCharacter),this.camera.updateLevelBounds(this.currentLevel.width,this.currentLevel.height),this.camera.snapToPlayer(this.entityManager,this.playerEntityId),this.levelStartTime=performance.now(),this.gameHasStarted?this.resume():this.start(),c.publish("levelLoaded",{gameState:this.gameState})}update(t){if(!this.currentLevel)return;this.isRunning&&!this.gameState.showingLevelComplete&&(this.levelTime=(performance.now()-this.levelStartTime)/1e3),this.camera.update(this.entityManager,this.playerEntityId,t);const e={entityManager:this.entityManager,playerEntityId:this.playerEntityId,level:this.currentLevel,camera:this.camera,isRunning:this.isRunning,gameState:this.gameState,keybinds:this.keybinds,dt:t};for(const n of this.systems)n.update(t,e);const s=this.entityManager.getComponent(this.playerEntityId,S);s&&s.needsRespawn&&!this.gameState.showingLevelComplete&&this.isRunning&&this._respawnPlayer(),this.currentLevel.update(t,this.entityManager,this.playerEntityId,c);for(let n=this.collectedFruits.length-1;n>=0;n--){const a=this.collectedFruits[n];a.frameTimer+=t,a.frameTimer>=a.frameSpeed&&(a.frameTimer=0,a.frame++,a.frame>=a.collectedFrameCount&&this.collectedFruits.splice(n,1))}if(s&&s.despawnAnimationFinished&&!this.gameState.showingLevelComplete){s.despawnAnimationFinished=!1;const n={deaths:s.deathCount,time:this.levelTime},a=this.gameState.onLevelComplete(n);a!==this.gameState&&(this.gameState=a,c.publish("gameStateUpdated",this.gameState),this.pause(),c.publish("levelComplete",{deaths:n.deaths,time:n.time,hasNextLevel:this.levelManager.hasNextLevel(),hasPreviousLevel:this.levelManager.hasPreviousLevel()}))}const i=this.entityManager.getComponent(this.playerEntityId,J);c.publish("statsUpdated",{levelName:this.currentLevel.name,collectedFruits:this.currentLevel.getFruitCount(),totalFruits:this.currentLevel.getTotalFruitCount(),deathCount:s?s.deathCount:0,levelTime:this.levelTime,health:i?i.currentHealth:100,maxHealth:i?i.maxHealth:100})}_onPlayerTookDamage({amount:t}){const e=this.entityManager.getComponent(this.playerEntityId,J),s=this.entityManager.getComponent(this.playerEntityId,S);e&&s&&!s.isHit&&!s.needsRespawn&&(e.currentHealth=Math.max(0,e.currentHealth-t),this.camera.shake(8,.3),e.currentHealth<=0&&this._onPlayerDied())}_onPlayerDied(){const t=this.entityManager.getComponent(this.playerEntityId,S);if(t&&!t.needsRespawn){const e=this.entityManager.getComponent(this.playerEntityId,L),s=this.entityManager.getComponent(this.playerEntityId,P),i=this.entityManager.getComponent(this.playerEntityId,I);t.needsRespawn=!0,t.deathCount++,e.vx=0,e.vy=0,t.isHit=!0,s.currentState="hit",i.animationState="hit",i.animationFrame=0,i.animationTimer=0,c.publish("playSound",{key:"death_sound",volume:.3,channel:"SFX"})}}_respawnPlayer(){const t=this.lastCheckpoint||this.currentLevel.startPosition;this.lastCheckpoint?this.currentLevel.fruits.forEach((d,p)=>d.collected=this.fruitsAtLastCheckpoint.has(p)):this.currentLevel.fruits.forEach(d=>d.collected=!1),this.currentLevel.recalculateCollectedFruits();const e=this.entityManager.getComponent(this.playerEntityId,k),s=this.entityManager.getComponent(this.playerEntityId,L),i=this.entityManager.getComponent(this.playerEntityId,S),n=this.entityManager.getComponent(this.playerEntityId,I),a=this.entityManager.getComponent(this.playerEntityId,T),o=this.entityManager.getComponent(this.playerEntityId,P),l=this.entityManager.getComponent(this.playerEntityId,J);e.x=t.x,e.y=t.y,s.vx=0,s.vy=0,l&&(l.currentHealth=l.maxHealth);const h=i.deathCount,u=i.activeSurfaceSound;Object.assign(i,new S),i.deathCount=h,i.activeSurfaceSound=u,i.needsRespawn=!1,o.currentState="spawn",n.animationState="spawn",n.animationFrame=0,n.animationTimer=0,n.direction="right",n.width=g.SPAWN_WIDTH,n.height=g.SPAWN_HEIGHT,a.isGrounded=!1,a.isAgainstWall=!1,a.groundType=null,this.camera.shake(15,.5),c.publish("playerRespawned")}_onFruitCollected(t){this.currentLevel.collectFruit(t),c.publish("playSound",{key:"collect",volume:.8,channel:"SFX"}),this.collectedFruits.push({x:t.x,y:t.y,size:t.size,frame:0,frameSpeed:.1,frameTimer:0,collectedFrameCount:6});const e=this.entityManager.getComponent(this.playerEntityId,J);e&&e.currentHealth<e.maxHealth&&(e.currentHealth=Math.min(e.maxHealth,e.currentHealth+10))}_onCheckpointActivated(t){t.state="activating",this.lastCheckpoint={x:t.x,y:t.y-t.size/2},c.publish("playSound",{key:"checkpoint_activated",volume:1,channel:"UI"}),this.fruitsAtLastCheckpoint.clear(),this.currentLevel.fruits.forEach((e,s)=>{e.collected&&this.fruitsAtLastCheckpoint.add(s)}),this.currentLevel.checkpoints.forEach(e=>{e!==t&&e.state==="active"&&(e.state="inactive",e.frame=0)})}_onTrophyCollision(){const t=this.entityManager.getComponent(this.playerEntityId,S),e=this.entityManager.getComponent(this.playerEntityId,I),s=this.entityManager.getComponent(this.playerEntityId,P);t&&!t.isDespawning&&(this.currentLevel.trophy.acquired=!0,this.camera.shake(8,.3),t.isDespawning=!0,e.animationState="despawn",s.currentState="despawn",e.animationFrame=0,e.animationTimer=0,e.width=g.SPAWN_WIDTH,e.height=g.SPAWN_HEIGHT)}render(t){this.currentLevel&&(this.ctx.clearRect(0,0,this.canvas.width,this.canvas.height),this.renderer.drawScrollingBackground(this.currentLevel,t),this.renderer.renderScene(this.camera,this.currentLevel,this.entityManager,this.collectedFruits),this.particleSystem.render(this.ctx,this.camera),this.hud.drawGameHUD(this.ctx),this.uiSystem.render(this.ctx,this.isRunning))}}function $e(r,t,e,s=!0){const i=document.createElement("canvas");i.width=r,i.height=t;const n=i.getContext("2d");return n.fillStyle=e,n.fillRect(0,0,r,t),s&&(n.fillStyle="rgba(0, 0, 0, 0.1)",n.fillRect(0,0,r/2,t/2),n.fillRect(r/2,t/2,r/2,t/2)),i}function Mt(r,t){return new Promise(e=>{const s=new Image,i=1e4;let n=!1;const a=()=>{if(n)return;n=!0,console.warn(`Failed or timed out loading image: ${r}. Using fallback.`);let l="#808080";t.includes("player")?l="#ff8c21":t.includes("fruit")&&(l="#FF6B6B");const h=$e(32,32,l),u=new Image;u.src=h.toDataURL(),u.onload=()=>e(u)},o=setTimeout(a,i);s.onload=()=>{n||(clearTimeout(o),e(s))},s.onerror=()=>{clearTimeout(o),a()},s.crossOrigin="anonymous",s.src=r})}function Ee(r,t){return new Promise(e=>{const s=new Audio,i=1e4;let n=!1;const a=()=>{if(n)return;n=!0,console.warn(`Failed or timed out loading sound: ${r}. Using silent fallback.`);const l=new Audio("data:audio/wav;base64,UklGRigAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA=");e(l)},o=setTimeout(a,i);s.addEventListener("canplaythrough",()=>{n||(clearTimeout(o),e(s))}),s.addEventListener("error",()=>{clearTimeout(o),a()}),s.crossOrigin="anonymous",s.preload="auto",s.src=r,s.load()})}function Ie(r){return fetch(r).then(t=>{if(!t.ok)throw new Error(`Failed to fetch level: ${r}, status: ${t.status}`);return t.json()}).catch(t=>(console.error(`Error loading JSON from ${r}:`,t),null))}const xt={PinkMan:{path:"/assets/MainCharacters/PinkMan/"},NinjaFrog:{path:"/assets/MainCharacters/NinjaFrog/"},MaskDude:{path:"/assets/MainCharacters/MaskDude/"},VirtualGuy:{path:"/assets/MainCharacters/VirtualGuy/"}},Rt={playerJump:"jump.png",playerDoubleJump:"double_jump.png",playerIdle:"idle.png",playerRun:"run.png",playerFall:"fall.png",playerDash:"dash.png",playerCling:"wall_jump.png",playerHit:"hit.png"};async function Le(){const r={font_spritesheet:"/assets/Menu/Text/Text (White) (8x10).png",settings_icon:"/assets/Menu/Buttons/Settings.png",pause_icon:"/assets/Menu/Buttons/Pause.png",play_icon:"/assets/Menu/Buttons/Play.png",levels_icon:"/assets/Menu/Buttons/Levels.png",character_icon:"/assets/Menu/Buttons/Character.png",info_icon:"/assets/Menu/Buttons/Info.png",background_blue:"/assets/Background/Blue.png",background_brown:"/assets/Background/Brown.png",background_gray:"/assets/Background/Gray.png",background_green:"/assets/Background/Green.png",background_pink:"/assets/Background/Pink.png",background_purple:"/assets/Background/Purple.png",background_red:"/assets/Background/Red.png",background_yellow:"/assets/Background/Yellow.png",block:"/assets/Terrain/Terrain.png",playerAppear:"/assets/MainCharacters/Appearing.png",playerDisappear:"/assets/MainCharacters/Disappearing.png",fruit_apple:"/assets/Items/Fruits/Apple.png",fruit_bananas:"/assets/Items/Fruits/Bananas.png",fruit_cherries:"/assets/Items/Fruits/Cherries.png",fruit_kiwi:"/assets/Items/Fruits/Kiwi.png",fruit_melon:"/assets/Items/Fruits/Melon.png",fruit_orange:"/assets/Items/Fruits/Orange.png",fruit_pineapple:"/assets/Items/Fruits/Pineapple.png",fruit_strawberry:"/assets/Items/Fruits/Strawberry.png",fruit_collected:"/assets/Items/Fruits/Collected.png",checkpoint_inactive:"/assets/Items/Checkpoints/Checkpoint/Checkpoint (No Flag).png",checkpoint_activation:"/assets/Items/Checkpoints/Checkpoint/Checkpoint (Flag Out).png",checkpoint_active:"/assets/Items/Checkpoints/Checkpoint/Checkpoint (Flag Idle).png",trophy:"/assets/Items/Checkpoints/End/End (Pressed).png",spike_two:"/assets/Traps/Spikes/Two.png",fire_off:"/assets/Traps/Fire/off.png",fire_hit:"/assets/Traps/Fire/hit.png",fire_on:"/assets/Traps/Fire/on.png",spiked_ball_chain:"/assets/Traps/Spiked Ball/Chain.png",spiked_ball:"/assets/Traps/Spiked Ball/Spiked Ball.png",saw:"/assets/Traps/Saw/on.png",saw_chain:"/assets/Traps/Saw/Chain.png",fan_off:"/assets/Traps/Fan/Off.png",fan_on:"/assets/Traps/Fan/On.png",arrow_idle:"/assets/Traps/Arrow/Idle.png",arrow_hit:"/assets/Traps/Arrow/Hit.png",sand_mud_ice:"/assets/Traps/Sand Mud Ice/Sand Mud Ice.png",trampoline_idle:"/assets/Traps/Trampoline/Idle.png",trampoline_jump:"/assets/Traps/Trampoline/Jump.png",dust_particle:"/assets/Other/Dust Particle.png",ice_particle:"/assets/Traps/Sand Mud Ice/Ice Particle.png",sand_particle:"/assets/Traps/Sand Mud Ice/Sand Particle.png",mud_particle:"/assets/Traps/Sand Mud Ice/Mud Particle.png"},t={button_click:"/assets/Sounds/Button Click.mp3",jump:"/assets/Sounds/Player Jump.mp3",double_jump:"/assets/Sounds/Player Double Jump.mp3",collect:"/assets/Sounds/Fruit Collect.mp3",level_complete:"/assets/Sounds/Level Complete.mp3",death_sound:"/assets/Sounds/Death.mp3",dash:"/assets/Sounds/Whoosh.mp3",checkpoint_activated:"/assets/Sounds/Checkpoint (Activation).mp3",hit:"/assets/Sounds/Hit.mp3",sand_walk:"/assets/Sounds/Sand Walk.mp3",mud_run:"/assets/Sounds/Mud Run.mp3",ice_run:"/assets/Sounds/Ice Run.mp3",trampoline_bounce:"/assets/Sounds/Boing.mp3",fire_activated:"/assets/Sounds/Fire (Activated).mp3",arrow_pop:"/assets/Sounds/Arrow Pop.mp3",fan_blowing:"/assets/Sounds/Fan Blowing.mp3"};console.log("Starting asset loading...");const e=Object.entries(r).map(([o,l])=>Mt(l,o).then(h=>({[o]:h}))),s=Object.entries(t).map(([o,l])=>Ee(l).then(h=>({[o]:h}))),i=[];for(const o in xt)for(const l in Rt){const h=xt[o].path+Rt[l],u=Mt(h,`${o}-${l}`).then(d=>({type:"character",charKey:o,spriteKey:l,img:d}));i.push(u)}const n=[];E.forEach((o,l)=>{o.levels.forEach((h,u)=>{h.jsonPath&&n.push(Ie(h.jsonPath).then(d=>({data:d,sectionIndex:l,levelIndex:u,type:"level"})))})});const a=[...e,...s,...i,...n];try{const o=await Promise.all(a),l={characters:{}};for(const h in xt)l.characters[h]={};for(const h of o)h&&(h.type==="character"?l.characters[h.charKey][h.spriteKey]=h.img:h.type==="level"?E[h.sectionIndex].levels[h.levelIndex]=h.data:Object.assign(l,h));return console.log("All assets and level data processed. Available assets:",Object.keys(l).length),l}catch(o){throw console.error("A critical error occurred during asset loading:",o),o}}class Me{constructor(){this.init()}init(){window.addEventListener("keydown",this.handleKeyDown.bind(this)),window.addEventListener("keyup",this.handleKeyUp.bind(this)),window.addEventListener("contextmenu",t=>t.preventDefault())}handleKeyDown(t){const e=t.key.toLowerCase();c.publish("key_down",{key:e,rawEvent:t});const s={enter:"confirm",r:"restart",n:"next",p:"previous",escape:"escape_pressed"};e===" "&&c.publish("action_confirm_pressed");const i=s[e];i&&c.publish(`action_${i}`)}handleKeyUp(t){const e=t.key.toLowerCase();c.publish("key_up",{key:e,rawEvent:t})}}const Pt={A:{x:0,y:0},B:{x:8,y:0},C:{x:16,y:0},D:{x:24,y:0},E:{x:32,y:0},F:{x:40,y:0},G:{x:48,y:0},H:{x:56,y:0},I:{x:64,y:0},J:{x:72,y:0},K:{x:0,y:10},L:{x:8,y:10},M:{x:16,y:10},N:{x:24,y:10},O:{x:32,y:10},P:{x:40,y:10},Q:{x:48,y:10},R:{x:56,y:10},S:{x:64,y:10},T:{x:72,y:10},U:{x:0,y:20},V:{x:8,y:20},W:{x:16,y:20},X:{x:24,y:20},Y:{x:32,y:20},Z:{x:40,y:20},0:{x:0,y:30},1:{x:8,y:30},2:{x:16,y:30},3:{x:24,y:30},4:{x:32,y:30},5:{x:40,y:30},6:{x:48,y:30},7:{x:56,y:30},8:{x:64,y:30},9:{x:72,y:30},".":{x:0,y:40},",":{x:8,y:40},":":{x:16,y:40},"?":{x:24,y:40},"!":{x:32,y:40},"(":{x:40,y:40},")":{x:48,y:40},"+":{x:56,y:40},"-":{x:64,y:40},"/":{x:48,y:20}," ":{x:0,y:0,space:!0},"%":{x:56,y:20},"'":{x:64,y:20},"&":{x:72,y:20}},$=8,j=10;class Re{constructor(t){this.sprite=t,this.sprite||console.error("Font spritesheet not provided to FontRenderer!"),this.characterCache=new Map}_getCachedCharacter(t,e){const s=`${t}_${e}`;if(this.characterCache.has(s))return this.characterCache.get(s);const i=Pt[t];if(!i)return null;const n=document.createElement("canvas");n.width=$,n.height=j;const a=n.getContext("2d");return a.imageSmoothingEnabled=!1,a.drawImage(this.sprite,i.x,i.y,$,j,0,0,$,j),a.globalCompositeOperation="source-in",a.fillStyle=e,a.fillRect(0,0,$,j),this.characterCache.set(s,n),n}_renderText(t,e,s,i,{scale:n=1,color:a=null}={}){if(!this.sprite)return;const o=e.toUpperCase();let l=s;t.imageSmoothingEnabled=!1;for(const h of o){const u=Pt[h];if(!u){l+=$*n;continue}if(u.space){l+=$*n;continue}let d,p=u.x,m=u.y;a?(d=this._getCachedCharacter(h,a),p=0,m=0):d=this.sprite,d&&t.drawImage(d,p,m,$,j,l,i,$*n,j*n),l+=$*n}}drawText(t,e,s,i,{scale:n=1,align:a="left",color:o="white",outlineColor:l=null,outlineWidth:h=1}={}){const u=this.getTextWidth(e,n);let d=s;if(a==="center"?d=s-u/2:a==="right"&&(d=s-u),l){const p={scale:n,color:l};this._renderText(t,e,d-h,i,p),this._renderText(t,e,d+h,i,p),this._renderText(t,e,d,i-h,p),this._renderText(t,e,d,i+h,p)}this._renderText(t,e,d,i,{scale:n,color:o})}getTextWidth(t,e=1){return t.length*$*e}renderTextToCanvas(t,e){if(!this.sprite)return null;const s=e.outlineColor&&e.outlineWidth?e.outlineWidth*2:0,i=this.getTextWidth(t,e.scale),n=j*e.scale,a=document.createElement("canvas");a.width=i+s,a.height=n+s;const o=a.getContext("2d"),l={...e,align:"left"};return this.drawText(o,t,s/2,s/2,l),a}}/**
 * @license
 * Copyright 2019 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */const ht=globalThis,kt=ht.ShadowRoot&&(ht.ShadyCSS===void 0||ht.ShadyCSS.nativeShadow)&&"adoptedStyleSheets"in Document.prototype&&"replace"in CSSStyleSheet.prototype,Ct=Symbol(),Ft=new WeakMap;let Gt=class{constructor(t,e,s){if(this._$cssResult$=!0,s!==Ct)throw Error("CSSResult is not constructable. Use `unsafeCSS` or `css` instead.");this.cssText=t,this.t=e}get styleSheet(){let t=this.o;const e=this.t;if(kt&&t===void 0){const s=e!==void 0&&e.length===1;s&&(t=Ft.get(e)),t===void 0&&((this.o=t=new CSSStyleSheet).replaceSync(this.cssText),s&&Ft.set(e,t))}return t}toString(){return this.cssText}};const Pe=r=>new Gt(typeof r=="string"?r:r+"",void 0,Ct),M=(r,...t)=>{const e=r.length===1?r[0]:t.reduce((s,i,n)=>s+(a=>{if(a._$cssResult$===!0)return a.cssText;if(typeof a=="number")return a;throw Error("Value passed to 'css' function must be a 'css' function result: "+a+". Use 'unsafeCSS' to pass non-literal values, but take care to ensure page security.")})(i)+r[n+1],r[0]);return new Gt(e,r,Ct)},Fe=(r,t)=>{if(kt)r.adoptedStyleSheets=t.map(e=>e instanceof CSSStyleSheet?e:e.styleSheet);else for(const e of t){const s=document.createElement("style"),i=ht.litNonce;i!==void 0&&s.setAttribute("nonce",i),s.textContent=e.cssText,r.appendChild(s)}},jt=kt?r=>r:r=>r instanceof CSSStyleSheet?(t=>{let e="";for(const s of t.cssRules)e+=s.cssText;return Pe(e)})(r):r;/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */const{is:je,defineProperty:Oe,getOwnPropertyDescriptor:De,getOwnPropertyNames:He,getOwnPropertySymbols:Ue,getPrototypeOf:Ne}=Object,ut=globalThis,Ot=ut.trustedTypes,ze=Ot?Ot.emptyScript:"",Be=ut.reactiveElementPolyfillSupport,et=(r,t)=>r,wt={toAttribute(r,t){switch(t){case Boolean:r=r?ze:null;break;case Object:case Array:r=r==null?r:JSON.stringify(r)}return r},fromAttribute(r,t){let e=r;switch(t){case Boolean:e=r!==null;break;case Number:e=r===null?null:Number(r);break;case Object:case Array:try{e=JSON.parse(r)}catch{e=null}}return e}},Kt=(r,t)=>!je(r,t),Dt={attribute:!0,type:String,converter:wt,reflect:!1,useDefault:!1,hasChanged:Kt};Symbol.metadata??=Symbol("metadata"),ut.litPropertyMetadata??=new WeakMap;let X=class extends HTMLElement{static addInitializer(t){this._$Ei(),(this.l??=[]).push(t)}static get observedAttributes(){return this.finalize(),this._$Eh&&[...this._$Eh.keys()]}static createProperty(t,e=Dt){if(e.state&&(e.attribute=!1),this._$Ei(),this.prototype.hasOwnProperty(t)&&((e=Object.create(e)).wrapped=!0),this.elementProperties.set(t,e),!e.noAccessor){const s=Symbol(),i=this.getPropertyDescriptor(t,s,e);i!==void 0&&Oe(this.prototype,t,i)}}static getPropertyDescriptor(t,e,s){const{get:i,set:n}=De(this.prototype,t)??{get(){return this[e]},set(a){this[e]=a}};return{get:i,set(a){const o=i?.call(this);n?.call(this,a),this.requestUpdate(t,o,s)},configurable:!0,enumerable:!0}}static getPropertyOptions(t){return this.elementProperties.get(t)??Dt}static _$Ei(){if(this.hasOwnProperty(et("elementProperties")))return;const t=Ne(this);t.finalize(),t.l!==void 0&&(this.l=[...t.l]),this.elementProperties=new Map(t.elementProperties)}static finalize(){if(this.hasOwnProperty(et("finalized")))return;if(this.finalized=!0,this._$Ei(),this.hasOwnProperty(et("properties"))){const e=this.properties,s=[...He(e),...Ue(e)];for(const i of s)this.createProperty(i,e[i])}const t=this[Symbol.metadata];if(t!==null){const e=litPropertyMetadata.get(t);if(e!==void 0)for(const[s,i]of e)this.elementProperties.set(s,i)}this._$Eh=new Map;for(const[e,s]of this.elementProperties){const i=this._$Eu(e,s);i!==void 0&&this._$Eh.set(i,e)}this.elementStyles=this.finalizeStyles(this.styles)}static finalizeStyles(t){const e=[];if(Array.isArray(t)){const s=new Set(t.flat(1/0).reverse());for(const i of s)e.unshift(jt(i))}else t!==void 0&&e.push(jt(t));return e}static _$Eu(t,e){const s=e.attribute;return s===!1?void 0:typeof s=="string"?s:typeof t=="string"?t.toLowerCase():void 0}constructor(){super(),this._$Ep=void 0,this.isUpdatePending=!1,this.hasUpdated=!1,this._$Em=null,this._$Ev()}_$Ev(){this._$ES=new Promise(t=>this.enableUpdating=t),this._$AL=new Map,this._$E_(),this.requestUpdate(),this.constructor.l?.forEach(t=>t(this))}addController(t){(this._$EO??=new Set).add(t),this.renderRoot!==void 0&&this.isConnected&&t.hostConnected?.()}removeController(t){this._$EO?.delete(t)}_$E_(){const t=new Map,e=this.constructor.elementProperties;for(const s of e.keys())this.hasOwnProperty(s)&&(t.set(s,this[s]),delete this[s]);t.size>0&&(this._$Ep=t)}createRenderRoot(){const t=this.shadowRoot??this.attachShadow(this.constructor.shadowRootOptions);return Fe(t,this.constructor.elementStyles),t}connectedCallback(){this.renderRoot??=this.createRenderRoot(),this.enableUpdating(!0),this._$EO?.forEach(t=>t.hostConnected?.())}enableUpdating(t){}disconnectedCallback(){this._$EO?.forEach(t=>t.hostDisconnected?.())}attributeChangedCallback(t,e,s){this._$AK(t,s)}_$ET(t,e){const s=this.constructor.elementProperties.get(t),i=this.constructor._$Eu(t,s);if(i!==void 0&&s.reflect===!0){const n=(s.converter?.toAttribute!==void 0?s.converter:wt).toAttribute(e,s.type);this._$Em=t,n==null?this.removeAttribute(i):this.setAttribute(i,n),this._$Em=null}}_$AK(t,e){const s=this.constructor,i=s._$Eh.get(t);if(i!==void 0&&this._$Em!==i){const n=s.getPropertyOptions(i),a=typeof n.converter=="function"?{fromAttribute:n.converter}:n.converter?.fromAttribute!==void 0?n.converter:wt;this._$Em=i;const o=a.fromAttribute(e,n.type);this[i]=o??this._$Ej?.get(i)??o,this._$Em=null}}requestUpdate(t,e,s){if(t!==void 0){const i=this.constructor,n=this[t];if(s??=i.getPropertyOptions(t),!((s.hasChanged??Kt)(n,e)||s.useDefault&&s.reflect&&n===this._$Ej?.get(t)&&!this.hasAttribute(i._$Eu(t,s))))return;this.C(t,e,s)}this.isUpdatePending===!1&&(this._$ES=this._$EP())}C(t,e,{useDefault:s,reflect:i,wrapped:n},a){s&&!(this._$Ej??=new Map).has(t)&&(this._$Ej.set(t,a??e??this[t]),n!==!0||a!==void 0)||(this._$AL.has(t)||(this.hasUpdated||s||(e=void 0),this._$AL.set(t,e)),i===!0&&this._$Em!==t&&(this._$Eq??=new Set).add(t))}async _$EP(){this.isUpdatePending=!0;try{await this._$ES}catch(e){Promise.reject(e)}const t=this.scheduleUpdate();return t!=null&&await t,!this.isUpdatePending}scheduleUpdate(){return this.performUpdate()}performUpdate(){if(!this.isUpdatePending)return;if(!this.hasUpdated){if(this.renderRoot??=this.createRenderRoot(),this._$Ep){for(const[i,n]of this._$Ep)this[i]=n;this._$Ep=void 0}const s=this.constructor.elementProperties;if(s.size>0)for(const[i,n]of s){const{wrapped:a}=n,o=this[i];a!==!0||this._$AL.has(i)||o===void 0||this.C(i,void 0,n,o)}}let t=!1;const e=this._$AL;try{t=this.shouldUpdate(e),t?(this.willUpdate(e),this._$EO?.forEach(s=>s.hostUpdate?.()),this.update(e)):this._$EM()}catch(s){throw t=!1,this._$EM(),s}t&&this._$AE(e)}willUpdate(t){}_$AE(t){this._$EO?.forEach(e=>e.hostUpdated?.()),this.hasUpdated||(this.hasUpdated=!0,this.firstUpdated(t)),this.updated(t)}_$EM(){this._$AL=new Map,this.isUpdatePending=!1}get updateComplete(){return this.getUpdateComplete()}getUpdateComplete(){return this._$ES}shouldUpdate(t){return!0}update(t){this._$Eq&&=this._$Eq.forEach(e=>this._$ET(e,this[e])),this._$EM()}updated(t){}firstUpdated(t){}};X.elementStyles=[],X.shadowRootOptions={mode:"open"},X[et("elementProperties")]=new Map,X[et("finalized")]=new Map,Be?.({ReactiveElement:X}),(ut.reactiveElementVersions??=[]).push("2.1.1");/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */const At=globalThis,dt=At.trustedTypes,Ht=dt?dt.createPolicy("lit-html",{createHTML:r=>r}):void 0,Vt="$lit$",R=`lit$${Math.random().toFixed(9).slice(2)}$`,Yt="?"+R,We=`<${Yt}>`,N=document,st=()=>N.createComment(""),it=r=>r===null||typeof r!="object"&&typeof r!="function",Tt=Array.isArray,Xe=r=>Tt(r)||typeof r?.[Symbol.iterator]=="function",St=`[ 	
\f\r]`,Z=/<(?:(!--|\/[^a-zA-Z])|(\/?[a-zA-Z][^>\s]*)|(\/?$))/g,Ut=/-->/g,Nt=/>/g,O=RegExp(`>|${St}(?:([^\\s"'>=/]+)(${St}*=${St}*(?:[^ 	
\f\r"'\`<>=]|("|')|))|$)`,"g"),zt=/'/g,Bt=/"/g,qt=/^(?:script|style|textarea|title)$/i,Ge=r=>(t,...e)=>({_$litType$:r,strings:t,values:e}),f=Ge(1),G=Symbol.for("lit-noChange"),w=Symbol.for("lit-nothing"),Wt=new WeakMap,H=N.createTreeWalker(N,129);function Zt(r,t){if(!Tt(r)||!r.hasOwnProperty("raw"))throw Error("invalid template strings array");return Ht!==void 0?Ht.createHTML(t):t}const Ke=(r,t)=>{const e=r.length-1,s=[];let i,n=t===2?"<svg>":t===3?"<math>":"",a=Z;for(let o=0;o<e;o++){const l=r[o];let h,u,d=-1,p=0;for(;p<l.length&&(a.lastIndex=p,u=a.exec(l),u!==null);)p=a.lastIndex,a===Z?u[1]==="!--"?a=Ut:u[1]!==void 0?a=Nt:u[2]!==void 0?(qt.test(u[2])&&(i=RegExp("</"+u[2],"g")),a=O):u[3]!==void 0&&(a=O):a===O?u[0]===">"?(a=i??Z,d=-1):u[1]===void 0?d=-2:(d=a.lastIndex-u[2].length,h=u[1],a=u[3]===void 0?O:u[3]==='"'?Bt:zt):a===Bt||a===zt?a=O:a===Ut||a===Nt?a=Z:(a=O,i=void 0);const m=a===O&&r[o+1].startsWith("/>")?" ":"";n+=a===Z?l+We:d>=0?(s.push(h),l.slice(0,d)+Vt+l.slice(d)+R+m):l+R+(d===-2?o:m)}return[Zt(r,n+(r[e]||"<?>")+(t===2?"</svg>":t===3?"</math>":"")),s]};class nt{constructor({strings:t,_$litType$:e},s){let i;this.parts=[];let n=0,a=0;const o=t.length-1,l=this.parts,[h,u]=Ke(t,e);if(this.el=nt.createElement(h,s),H.currentNode=this.el.content,e===2||e===3){const d=this.el.content.firstChild;d.replaceWith(...d.childNodes)}for(;(i=H.nextNode())!==null&&l.length<o;){if(i.nodeType===1){if(i.hasAttributes())for(const d of i.getAttributeNames())if(d.endsWith(Vt)){const p=u[a++],m=i.getAttribute(d).split(R),x=/([.?@])?(.*)/.exec(p);l.push({type:1,index:n,name:x[2],strings:m,ctor:x[1]==="."?Ye:x[1]==="?"?qe:x[1]==="@"?Ze:pt}),i.removeAttribute(d)}else d.startsWith(R)&&(l.push({type:6,index:n}),i.removeAttribute(d));if(qt.test(i.tagName)){const d=i.textContent.split(R),p=d.length-1;if(p>0){i.textContent=dt?dt.emptyScript:"";for(let m=0;m<p;m++)i.append(d[m],st()),H.nextNode(),l.push({type:2,index:++n});i.append(d[p],st())}}}else if(i.nodeType===8)if(i.data===Yt)l.push({type:2,index:n});else{let d=-1;for(;(d=i.data.indexOf(R,d+1))!==-1;)l.push({type:7,index:n}),d+=R.length-1}n++}}static createElement(t,e){const s=N.createElement("template");return s.innerHTML=t,s}}function K(r,t,e=r,s){if(t===G)return t;let i=s!==void 0?e._$Co?.[s]:e._$Cl;const n=it(t)?void 0:t._$litDirective$;return i?.constructor!==n&&(i?._$AO?.(!1),n===void 0?i=void 0:(i=new n(r),i._$AT(r,e,s)),s!==void 0?(e._$Co??=[])[s]=i:e._$Cl=i),i!==void 0&&(t=K(r,i._$AS(r,t.values),i,s)),t}class Ve{constructor(t,e){this._$AV=[],this._$AN=void 0,this._$AD=t,this._$AM=e}get parentNode(){return this._$AM.parentNode}get _$AU(){return this._$AM._$AU}u(t){const{el:{content:e},parts:s}=this._$AD,i=(t?.creationScope??N).importNode(e,!0);H.currentNode=i;let n=H.nextNode(),a=0,o=0,l=s[0];for(;l!==void 0;){if(a===l.index){let h;l.type===2?h=new at(n,n.nextSibling,this,t):l.type===1?h=new l.ctor(n,l.name,l.strings,this,t):l.type===6&&(h=new Je(n,this,t)),this._$AV.push(h),l=s[++o]}a!==l?.index&&(n=H.nextNode(),a++)}return H.currentNode=N,i}p(t){let e=0;for(const s of this._$AV)s!==void 0&&(s.strings!==void 0?(s._$AI(t,s,e),e+=s.strings.length-2):s._$AI(t[e])),e++}}class at{get _$AU(){return this._$AM?._$AU??this._$Cv}constructor(t,e,s,i){this.type=2,this._$AH=w,this._$AN=void 0,this._$AA=t,this._$AB=e,this._$AM=s,this.options=i,this._$Cv=i?.isConnected??!0}get parentNode(){let t=this._$AA.parentNode;const e=this._$AM;return e!==void 0&&t?.nodeType===11&&(t=e.parentNode),t}get startNode(){return this._$AA}get endNode(){return this._$AB}_$AI(t,e=this){t=K(this,t,e),it(t)?t===w||t==null||t===""?(this._$AH!==w&&this._$AR(),this._$AH=w):t!==this._$AH&&t!==G&&this._(t):t._$litType$!==void 0?this.$(t):t.nodeType!==void 0?this.T(t):Xe(t)?this.k(t):this._(t)}O(t){return this._$AA.parentNode.insertBefore(t,this._$AB)}T(t){this._$AH!==t&&(this._$AR(),this._$AH=this.O(t))}_(t){this._$AH!==w&&it(this._$AH)?this._$AA.nextSibling.data=t:this.T(N.createTextNode(t)),this._$AH=t}$(t){const{values:e,_$litType$:s}=t,i=typeof s=="number"?this._$AC(t):(s.el===void 0&&(s.el=nt.createElement(Zt(s.h,s.h[0]),this.options)),s);if(this._$AH?._$AD===i)this._$AH.p(e);else{const n=new Ve(i,this),a=n.u(this.options);n.p(e),this.T(a),this._$AH=n}}_$AC(t){let e=Wt.get(t.strings);return e===void 0&&Wt.set(t.strings,e=new nt(t)),e}k(t){Tt(this._$AH)||(this._$AH=[],this._$AR());const e=this._$AH;let s,i=0;for(const n of t)i===e.length?e.push(s=new at(this.O(st()),this.O(st()),this,this.options)):s=e[i],s._$AI(n),i++;i<e.length&&(this._$AR(s&&s._$AB.nextSibling,i),e.length=i)}_$AR(t=this._$AA.nextSibling,e){for(this._$AP?.(!1,!0,e);t!==this._$AB;){const s=t.nextSibling;t.remove(),t=s}}setConnected(t){this._$AM===void 0&&(this._$Cv=t,this._$AP?.(t))}}class pt{get tagName(){return this.element.tagName}get _$AU(){return this._$AM._$AU}constructor(t,e,s,i,n){this.type=1,this._$AH=w,this._$AN=void 0,this.element=t,this.name=e,this._$AM=i,this.options=n,s.length>2||s[0]!==""||s[1]!==""?(this._$AH=Array(s.length-1).fill(new String),this.strings=s):this._$AH=w}_$AI(t,e=this,s,i){const n=this.strings;let a=!1;if(n===void 0)t=K(this,t,e,0),a=!it(t)||t!==this._$AH&&t!==G,a&&(this._$AH=t);else{const o=t;let l,h;for(t=n[0],l=0;l<n.length-1;l++)h=K(this,o[s+l],e,l),h===G&&(h=this._$AH[l]),a||=!it(h)||h!==this._$AH[l],h===w?t=w:t!==w&&(t+=(h??"")+n[l+1]),this._$AH[l]=h}a&&!i&&this.j(t)}j(t){t===w?this.element.removeAttribute(this.name):this.element.setAttribute(this.name,t??"")}}class Ye extends pt{constructor(){super(...arguments),this.type=3}j(t){this.element[this.name]=t===w?void 0:t}}class qe extends pt{constructor(){super(...arguments),this.type=4}j(t){this.element.toggleAttribute(this.name,!!t&&t!==w)}}class Ze extends pt{constructor(t,e,s,i,n){super(t,e,s,i,n),this.type=5}_$AI(t,e=this){if((t=K(this,t,e,0)??w)===G)return;const s=this._$AH,i=t===w&&s!==w||t.capture!==s.capture||t.once!==s.once||t.passive!==s.passive,n=t!==w&&(s===w||i);i&&this.element.removeEventListener(this.name,this,s),n&&this.element.addEventListener(this.name,this,t),this._$AH=t}handleEvent(t){typeof this._$AH=="function"?this._$AH.call(this.options?.host??this.element,t):this._$AH.handleEvent(t)}}class Je{constructor(t,e,s){this.element=t,this.type=6,this._$AN=void 0,this._$AM=e,this.options=s}get _$AU(){return this._$AM._$AU}_$AI(t){K(this,t)}}const Qe=At.litHtmlPolyfillSupport;Qe?.(nt,at),(At.litHtmlVersions??=[]).push("3.3.1");const Jt=(r,t,e)=>{const s=e?.renderBefore??t;let i=s._$litPart$;if(i===void 0){const n=e?.renderBefore??null;s._$litPart$=i=new at(t.insertBefore(st(),n),n,void 0,e??{})}return i._$AI(r),i};/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */const $t=globalThis;class _ extends X{constructor(){super(...arguments),this.renderOptions={host:this},this._$Do=void 0}createRenderRoot(){const t=super.createRenderRoot();return this.renderOptions.renderBefore??=t.firstChild,t}update(t){const e=this.render();this.hasUpdated||(this.renderOptions.isConnected=this.isConnected),super.update(t),this._$Do=Jt(e,this.renderRoot,this.renderOptions)}connectedCallback(){super.connectedCallback(),this._$Do?.setConnected(!0)}disconnectedCallback(){super.disconnectedCallback(),this._$Do?.setConnected(!1)}render(){return G}}_._$litElement$=!0,_.finalized=!0,$t.litElementHydrateSupport?.({LitElement:_});const ts=$t.litElementPolyfillSupport;ts?.({LitElement:_});($t.litElementVersions??=[]).push("4.2.1");/**
 * @license
 * Copyright 2021 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */function*V(r,t){if(r!==void 0){let e=0;for(const s of r)yield t(s,e++)}}function Q(r){return r===" "?"SPACE":r.startsWith("arrow")?r.replace("arrow","").toUpperCase():r.toUpperCase()}function Et(r=0){const t=Math.floor(r/60),e=r%60,s=Math.floor(e),i=Math.floor((e-s)*1e3);return`${t.toString().padStart(2,"0")}:${s.toString().padStart(2,"0")}.${i.toString().padStart(3,"0")}`}class es extends _{static properties={fontRenderer:{type:Object},text:{type:String},scale:{type:Number},color:{type:String},outlineColor:{type:String},outlineWidth:{type:Number},align:{type:String}};constructor(){super(),this.text="",this.scale=1,this.color="white",this.outlineColor=null,this.outlineWidth=1,this.align="left"}updated(t){super.updated(t),!(!this.fontRenderer||!this.shadowRoot)&&this.renderCanvas()}renderCanvas(){const t=this.shadowRoot.querySelector("#container");if(!t)return;const e=this.fontRenderer.renderTextToCanvas(this.text,{scale:this.scale,color:this.color,outlineColor:this.outlineColor,outlineWidth:this.outlineWidth,align:this.align});e&&(e.style.imageRendering="pixelated",t.innerHTML="",t.appendChild(e))}render(){return f`<div id="container"></div>`}}customElements.define("bitmap-text",es);class ss extends _{static styles=M`
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
  `;static properties={action:{type:String},currentKey:{type:String},isRemapping:{type:Boolean,state:!0},fontRenderer:{type:Object}};constructor(){super(),this.isRemapping=!1}connectedCallback(){super.connectedCallback(),window.addEventListener("keydown",this._handleGlobalKeydown)}disconnectedCallback(){super.disconnectedCallback(),window.removeEventListener("keydown",this._handleGlobalKeydown)}_handleGlobalKeydown=t=>{if(!this.isRemapping)return;t.preventDefault(),t.stopPropagation();const e=t.key.toLowerCase();this.dispatchEvent(new CustomEvent("keybind-changed",{detail:{action:this.action,newKey:e},bubbles:!0,composed:!0})),this.isRemapping=!1};_startRemap(t){t.stopPropagation(),this.isRemapping=!0,c.publish("playSound",{key:"button_click",volume:.8,channel:"UI"})}render(){const t=this.isRemapping?"Press key...":Q(this.currentKey);return f`
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
    `}}customElements.define("keybind-display",ss);class is extends _{static styles=M`
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
              ${V(t,e=>f`
                <div class="keybind-item">
                  <div class="label-container">
                    <bitmap-text .fontRenderer=${this.fontRenderer} text=${e.replace(/([A-Z])/g," $1").replace(/^./,s=>s.toUpperCase())} scale="1.8"></bitmap-text>
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
    `}}customElements.define("settings-menu",is);class ns extends _{static styles=M`
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
            <bitmap-text .fontRenderer=${this.fontRenderer} text="Time: ${Et(this.stats.levelTime)}" scale="1.8"></bitmap-text>
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
    `}}customElements.define("pause-modal",ns);class as extends _{static styles=M`
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
              ${V(E,(t,e)=>f`
                <div class="level-section-menu">
                  <div class="section-title-container">
                    <bitmap-text .fontRenderer=${this.fontRenderer} text=${t.name} scale="2"></bitmap-text>
                  </div>
                  <div class="level-grid">
                    ${V(t.levels,(s,i)=>{const n=this.gameState.isLevelUnlocked(e,i),a=this.gameState.isLevelCompleted(e,i),o=this.gameState.currentSection===e&&this.gameState.currentLevelIndex===i,l=`level-button ${a?"completed":""} ${o?"current":""} ${n?"":"locked"}`;return n?f`<button class=${l} @click=${()=>this._selectLevel(e,i)}>${i+1}</button>`:f`<button class=${l} disabled>
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
    `:f``}}customElements.define("levels-menu",as);class os extends _{static styles=M`
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
      flex-grow: 1;
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
  `;static properties={characterId:{type:String},idleSprite:{type:Object},isLocked:{type:Boolean},isSelected:{type:Boolean},fontRenderer:{type:Object}};constructor(){super(),this.animationFrameId=null,this.animState={frame:0,timer:0,lastTime:0}}connectedCallback(){super.connectedCallback(),this.animationFrameId=requestAnimationFrame(this._animatePreview)}disconnectedCallback(){super.disconnectedCallback(),this.animationFrameId&&cancelAnimationFrame(this.animationFrameId)}_animatePreview=t=>{const e=this.shadowRoot.querySelector(".char-canvas");if(!e||!this.idleSprite){this.animationFrameId=requestAnimationFrame(this._animatePreview);return}this.animState.lastTime===0&&(this.animState.lastTime=t);const s=(t-this.animState.lastTime)/1e3;this.animState.lastTime=t,this.animState.timer+=s;const i=.08,n=11,a=this.idleSprite.width/n;if(this.animState.timer>=i){this.animState.timer=0,this.animState.frame=(this.animState.frame+1)%n;const o=e.getContext("2d");o.clearRect(0,0,e.width,e.height),o.drawImage(this.idleSprite,this.animState.frame*a,0,a,this.idleSprite.height,0,0,e.width,e.height)}this.animationFrameId=requestAnimationFrame(this._animatePreview)};_handleSelect(){this.isLocked||this.isSelected||this.dispatchEvent(new CustomEvent("character-selected",{detail:{characterId:this.characterId},bubbles:!0,composed:!0}))}render(){const t=tt[this.characterId],e=`character-card ${this.isLocked?"locked":""} ${this.isSelected?"selected":""}`,s=this.isLocked?"Locked":this.isSelected?"Selected":"Select";return f`
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
          <bitmap-text .fontRenderer=${this.fontRenderer} .text=${s} scale="1.8"></bitmap-text>
        </button>
      </div>
    `}}customElements.define("character-card",os);class rs extends _{static styles=M`
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
  `;static properties={gameState:{type:Object},assets:{type:Object},fontRenderer:{type:Object}};_dispatchClose(){c.publish("playSound",{key:"button_click",volume:.8,channel:"UI"}),this.dispatchEvent(new CustomEvent("close-modal",{bubbles:!0,composed:!0}))}render(){if(!this.gameState||!this.assets)return f`<div class="modal-overlay">Loading...</div>`;const t=Object.keys(tt);return f`
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
                    ${V(t,e=>f`
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
    `}}customElements.define("character-menu",rs);class ls extends _{static styles=M`
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
              <p><strong>Note:</strong> You cannot cling to natural surfaces like dirt, sand, mud, or ice.</p>
              <div class="keybind-list">
                
                <div class="keybind-item">
                  <label>Move Left / Right:</label>
                  <div class="key-display-container">
                    <div class="key-display">
                        <bitmap-text .fontRenderer=${this.fontRenderer} text=${Q(this.keybinds.moveLeft)} scale="1.5"></bitmap-text>
                    </div>
                    <span>/</span>
                    <div class="key-display">
                        <bitmap-text .fontRenderer=${this.fontRenderer} text=${Q(this.keybinds.moveRight)} scale="1.5"></bitmap-text>
                    </div>
                  </div>
                </div>

                <div class="keybind-item">
                  <label>Jump / Double Jump / Wall Jump:</label>
                  <div class="key-display">
                    <bitmap-text .fontRenderer=${this.fontRenderer} text=${Q(this.keybinds.jump)} scale="1.5"></bitmap-text>
                  </div>
                </div>

                <div class="keybind-item">
                  <label>Dash:</label>
                  <div class="key-display">
                    <bitmap-text .fontRenderer=${this.fontRenderer} text=${Q(this.keybinds.dash)} scale="1.5"></bitmap-text>
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
    `:f``}}customElements.define("info-modal",ls);class hs extends _{static styles=M`
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
            <bitmap-text .fontRenderer=${this.fontRenderer} text="Time: ${Et(this.stats.time)}" scale="1.8"></bitmap-text>
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
    `:f``}}customElements.define("level-complete-modal",hs);class cs extends _{static styles=M`
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
            ${V(E,(e,s)=>f`
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

                  ${V(e.levels,(i,n)=>{const a=`${s}-${n}`,o=t[a]||{fastestTime:null,lowestDeaths:null,totalAttempts:0};return f`
                        <div class="stat-row">
                            <div class="stat-cell level-name">Level ${n+1}</div>
                            <div class="stat-cell">${this._getStatDisplay(o.fastestTime,Et)}</div>
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
    `}}customElements.define("stats-modal",cs);class ds extends _{static styles=M`
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
  `;static properties={activeModal:{type:String,state:!0},gameHasStarted:{type:Boolean,state:!0},keybinds:{type:Object,state:!0},soundSettings:{type:Object,state:!0},currentStats:{type:Object,state:!0},gameState:{type:Object,state:!0},assets:{type:Object,state:!0},fontRenderer:{type:Object},levelCompleteStats:{type:Object,state:!0},isLoading:{type:Boolean,state:!0}};constructor(){super(),this.activeModal="main-menu",this.gameHasStarted=!1,this.keybinds={moveLeft:"a",moveRight:"d",jump:"w",dash:" "},this.soundSettings={soundEnabled:!0,soundVolume:.5},this.currentStats={},this.gameState=null,this.assets=null,this.fontRenderer=null,this.levelCompleteStats=null,this.isLoading=!0}connectedCallback(){super.connectedCallback(),c.subscribe("requestStartGame",this._handleStartGame),c.subscribe("soundSettingsChanged",this._handleSoundUpdate),c.subscribe("keybindsUpdated",this._handleKeybindsUpdate),c.subscribe("ui_button_clicked",this._handleUIButtonClick),c.subscribe("statsUpdated",this._handleStatsUpdate),c.subscribe("action_escape_pressed",this._handleEscapePress),c.subscribe("levelLoaded",this._handleLevelLoad),c.subscribe("gameStateUpdated",t=>this.gameState=t),c.subscribe("assetsLoaded",t=>this.assets=t),c.subscribe("levelComplete",t=>this.levelCompleteStats=t)}disconnectedCallback(){super.disconnectedCallback(),c.unsubscribe("requestStartGame",this._handleStartGame),c.unsubscribe("soundSettingsChanged",this._handleSoundUpdate),c.unsubscribe("keybindsUpdated",this._handleKeybindsUpdate),c.unsubscribe("ui_button_clicked",this._handleUIButtonClick),c.unsubscribe("statsUpdated",this._handleStatsUpdate),c.unsubscribe("action_escape_pressed",this._handleEscapePress),c.unsubscribe("levelLoaded",this._handleLevelLoad),c.unsubscribe("gameStateUpdated",t=>this.gameState=t),c.unsubscribe("assetsLoaded",t=>this.assets=t),c.unsubscribe("levelComplete",t=>this.levelCompleteStats=t)}updated(t){super.updated(t),this.isLoading&&this.assets&&this.fontRenderer&&(this.isLoading=!1)}_handleLevelLoad=({gameState:t})=>{this.gameState=t,this.levelCompleteStats=null,this.gameHasStarted||(this.gameHasStarted=!0),this.activeModal=null};_handleStartGame=()=>{this.gameHasStarted=!0,this.activeModal=null,c.publish("allMenusClosed")};_handleSoundUpdate=t=>{this.soundSettings={...t}};_handleKeybindsUpdate=t=>{this.keybinds={...t}};_handleStatsUpdate=t=>{this.currentStats={...t}};_handleUIButtonClick=({buttonId:t})=>{t==="pause"?this.activeModal?this._closeModal():this.gameHasStarted&&(this.activeModal="pause",c.publish("menuOpened")):t==="stats"?(this.activeModal="stats",c.publish("menuOpened")):(this.activeModal=t,c.publish("menuOpened"))};_handleEscapePress=()=>{this.levelCompleteStats||(this.activeModal?this._closeModal():this.gameHasStarted&&(this.activeModal="pause",c.publish("menuOpened")))};_handleKeybindChange=t=>{const{action:e,newKey:s}=t.detail,i={...this.keybinds,[e]:s};c.publish("keybindsUpdated",i)};_closeModal=()=>{const t=this.activeModal!==null;this.activeModal=this.gameHasStarted?null:"main-menu",t&&this.gameHasStarted&&c.publish("allMenusClosed")};_openModalFromMenu(t){c.publish("playSound",{key:"button_click",volume:.8,channel:"UI"}),this.activeModal=t}_handleRestart(){this._closeModal(),c.publish("requestLevelRestart")}_handleOpenLevelsMenu(){this.activeModal="levels"}_handleLevelSelected(t){const{sectionIndex:e,levelIndex:s}=t.detail;c.publish("requestLevelLoad",{sectionIndex:e,levelIndex:s})}_handleCharacterSelected(t){const{characterId:e}=t.detail,s=this.gameState.setSelectedCharacter(e);s!==this.gameState&&(this.gameState=s,c.publish("gameStateUpdated",this.gameState)),c.publish("playSound",{key:"button_click",volume:.8,channel:"UI"}),c.publish("characterUpdated",e)}_handleLevelAction(t){this.levelCompleteStats=null,t==="restart"?c.publish("requestLevelRestart"):t==="next"?c.publish("requestNextLevel"):t==="previous"&&c.publish("requestPreviousLevel")}render(){return this.levelCompleteStats?f`
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
                    ></stats-modal>`;default:return f``}}}customElements.define("parkour-hero-ui",ds);const Xt=document.getElementById("ui-root");Xt?Jt(document.createElement("parkour-hero-ui"),Xt):console.error("UI Root element #ui-root not found. UI cannot be initialized.");const b=document.getElementById("gameCanvas"),y=b.getContext("2d"),D=document.getElementById("ui-root");if(!b||!y)throw console.error("Canvas not found or context not available"),document.body.innerHTML="<h1>Error: Canvas not supported</h1>",new Error("Canvas not available");y.imageSmoothingEnabled=!1;const Qt=1920,te=1080;b.width=Qt;b.height=te;console.log(`Canvas initialized: ${Qt}x${te}`);function ee(){try{const r=1.7777777777777777,t=window.innerWidth/window.innerHeight;let e,s;t>r?(s=window.innerHeight,e=s*r):(e=window.innerWidth,s=e/r);const i=Math.floor(e),n=Math.floor(s),a=`${(window.innerWidth-i)/2}px`,o=`${(window.innerHeight-n)/2}px`;b.style.width=`${i}px`,b.style.height=`${n}px`,b.style.position="absolute",b.style.left=a,b.style.top=o,D&&(D.style.width=`${i}px`,D.style.height=`${n}px`,D.style.position="absolute",D.style.left=a,D.style.top=o,D.style.overflow="hidden"),console.log(`Canvas resized to: ${i}x${n} (display size)`)}catch(r){console.error("Error resizing canvas:",r)}}window.addEventListener("resize",ee);ee();function us(){y.fillStyle="#222",y.fillRect(0,0,b.width,b.height),y.fillStyle="white",y.font="24px sans-serif",y.textAlign="center",y.fillText("Loading Assets...",b.width/2,b.height/2);const r=300,t=20,e=(b.width-r)/2,s=b.height/2+30;y.strokeStyle="white",y.lineWidth=2,y.strokeRect(e,s,r,t),y.fillStyle="#4CAF50",y.fillRect(e,s,r*.1,t)}us();let ps={moveLeft:"a",moveRight:"d",jump:"w",dash:" "},A,ms;Le().then(r=>{console.log("Assets loaded successfully, preparing main menu...");try{const t=new Re(r.font_spritesheet);A=new Te(y,b,r,ps,t),c.publish("assetsLoaded",r);const e=document.querySelector("parkour-hero-ui");e&&(e.fontRenderer=t),ms=new Me,c.subscribe("requestStartGame",()=>{A.start()}),window.unlockAllLevels=()=>{A&&A.gameState&&(A.gameState.unlockAllLevels(),c.publish("gameStateUpdated",A.gameState))},console.log("Developer command available: Type `unlockAllLevels()` in the console to unlock all levels."),window.resetProgress=()=>{A&&A.gameState&&(A.gameState.resetProgress(),A.loadLevel(0,0),console.log("Game reset to Level 1."),c.publish("gameStateUpdated",A.gameState))},console.log("Developer command available: Type `resetProgress()` in the console to reset all saved data."),console.log("Game is ready. Waiting for user to start from the main menu.")}catch(t){console.error("Failed to start game engine:",t),y.fillStyle="#222",y.fillRect(0,0,b.width,b.height),y.fillStyle="red",y.font="24px sans-serif",y.textAlign="center",y.fillText("Game Failed to Start",b.width/2,b.height/2-20),y.fillStyle="white",y.font="16px sans-serif",y.fillText("Check console for details",b.width/2,b.height/2+20)}}).catch(r=>{console.error("Asset loading failed:",r),y.fillStyle="#222",y.fillRect(0,0,b.width,b.height),y.fillStyle="red",y.font="24px sans-serif",y.textAlign="center",y.fillText("Failed to Load Assets",b.width/2,b.height/2-20),y.fillStyle="white",y.font="16px sans-serif",y.fillText("Check console for details",b.width/2,b.height/2+20)});window.addEventListener("error",r=>{console.error("Global error:",r.error)});window.addEventListener("unhandledrejection",r=>{console.error("Unhandled promise rejection:",r.reason)});console.log("Game initialization started");console.log("Canvas dimensions:",b.width,"x",b.height);console.log("Device pixel ratio:",window.devicePixelRatio);console.log("User agent:",navigator.userAgent);
