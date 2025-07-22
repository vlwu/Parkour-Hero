(function(){const e=document.createElement("link").relList;if(e&&e.supports&&e.supports("modulepreload"))return;for(const i of document.querySelectorAll('link[rel="modulepreload"]'))s(i);new MutationObserver(i=>{for(const n of i)if(n.type==="childList")for(const a of n.addedNodes)a.tagName==="LINK"&&a.rel==="modulepreload"&&s(a)}).observe(document,{childList:!0,subtree:!0});function t(i){const n={};return i.integrity&&(n.integrity=i.integrity),i.referrerPolicy&&(n.referrerPolicy=i.referrerPolicy),i.crossOrigin==="use-credentials"?n.credentials="include":i.crossOrigin==="anonymous"?n.credentials="omit":n.credentials="same-origin",n}function s(i){if(i.ep)return;i.ep=!0;const n=t(i);fetch(i.href,n)}})();class C{constructor(e=0,t=0){this.x=e,this.y=t}}class T{constructor({type:e="dynamic",solid:t=!1,hazard:s=!1,width:i,height:n,isGrounded:a=!1,isAgainstWall:o=!1,groundType:l=null}){this.type=e,this.solid=t,this.hazard=s,this.width=i,this.height=n,this.isGrounded=a,this.isAgainstWall=o,this.groundType=l}}class it{constructor(e,t){this.zoom=1.8,this.viewportWidth=e,this.viewportHeight=t,this.width=this.viewportWidth/this.zoom,this.height=this.viewportHeight/this.zoom,this.levelWidth=this.width,this.levelHeight=this.height,this.followSpeed=5,this.deadZone={x:this.width*.2,y:this.height*.2},this.minX=0,this.maxX=0,this.minY=0,this.maxY=0,this.shakeTimer=0,this.shakeIntensity=0,this.shakeInitialIntensity=0,this.shakeDuration=0,this.shakeX=0,this.shakeY=0,this.targetX=0,this.targetY=0,console.log("Camera initialized:",{viewport:`${this.viewportWidth}x${this.viewportHeight}`,zoom:this.zoom,worldView:`${this.width}x${this.height}`})}update(e,t,s){if(t===null)return;const i=e.getComponent(t,C),n=e.getComponent(t,T);if(!i||!n)return;const a=this.x+this.width/2,o=this.y+this.height/2,l=i.x+n.width/2,h=i.y+n.height/2,d=l-a,u=h-o;let p=0,f=0;Math.abs(d)>this.deadZone.x&&(p=d>0?d-this.deadZone.x:d+this.deadZone.x),Math.abs(u)>this.deadZone.y&&(f=u>0?u-this.deadZone.y:u+this.deadZone.y),this.targetX=this.x+p,this.targetY=this.y+f,this.x+=(this.targetX-this.x)*this.followSpeed*s,this.y+=(this.targetY-this.y)*this.followSpeed*s,this.x=Math.max(this.minX,Math.min(this.maxX,this.x)),this.y=Math.max(this.minY,Math.min(this.maxY,this.y)),this.updateShake(s)}updateShake(e){if(this.shakeTimer>0){this.shakeTimer-=e,this.shakeX=(Math.random()-.5)*this.shakeIntensity,this.shakeY=(Math.random()-.5)*this.shakeIntensity;const t=this.shakeInitialIntensity/this.shakeDuration;this.shakeIntensity=Math.max(0,this.shakeIntensity-t*e),this.shakeTimer<=0&&(this.shakeX=0,this.shakeY=0,this.shakeIntensity=0)}}shake(e=10,t=.3){this.shakeTimer=t,this.shakeDuration=t,this.shakeIntensity=e,this.shakeInitialIntensity=e}apply(e){e.save(),e.scale(this.zoom,this.zoom),e.translate(-Math.round(this.x+this.shakeX),-Math.round(this.y+this.shakeY))}restore(e){e.restore()}snapToPlayer(e,t){if(t===null)return;const s=e.getComponent(t,C),i=e.getComponent(t,T);!s||!i||this.centerOn(s.x+i.width/2,s.y+i.height/2)}centerOn(e,t){this.x=e-this.width/2,this.y=t-this.height/2,this.x=Math.max(this.minX,Math.min(this.maxX,this.x)),this.y=Math.max(this.minY,Math.min(this.maxY,this.y)),this.targetX=this.x,this.targetY=this.y}updateLevelBounds(e,t){this.levelWidth=e,this.levelHeight=t,this.maxX=Math.max(0,this.levelWidth-this.width),this.maxY=Math.max(0,this.levelHeight-this.height),this.x=Math.max(this.minX,Math.min(this.maxX,this.x)),this.y=Math.max(this.minY,Math.min(this.maxY,this.y))}isVisible(e,t,s=0,i=0){return e+s>this.x&&e<this.x+this.width&&t+i>this.y&&t<this.y+this.height}isRectVisible(e){return this.isVisible(e.x,e.y,e.width,e.height)}setFollowSpeed(e){this.followSpeed=Math.max(.1,e)}setDeadZone(e,t){this.deadZone.x=this.width*Math.max(0,Math.min(.5,e)),this.deadZone.y=this.height*Math.max(0,Math.min(.5,t))}}class nt{constructor(){this.events={}}subscribe(e,t){this.events[e]||(this.events[e]=new Set),this.events[e].add(t)}unsubscribe(e,t){this.events[e]&&this.events[e].delete(t)}publish(e,t){this.events[e]&&this.events[e].forEach(s=>{try{s(t)}catch(i){console.error(`Error in event bus callback for event: ${e}`,i)}})}}const c=new nt;class at{constructor(){this.sounds={},this.soundPool={},this.poolSize=5,this.channels={SFX:new Set,UI:new Set,Music:new Set},this.audioContext=null,this.audioUnlocked=!1,this.settings={enabled:!0,volume:.5},this.loadSettings(),this._setupEventSubscriptions()}_setupEventSubscriptions(){c.subscribe("playSound",e=>this.play(e)),c.subscribe("startSoundLoop",e=>this.playLoop(e)),c.subscribe("stopSoundLoop",({key:e})=>this.stopLoop(e)),c.subscribe("toggleSound",()=>this.toggleSound()),c.subscribe("setSoundVolume",({volume:e})=>this.setVolume(e))}loadSettings(){this.settings.enabled=!0,this.settings.volume=.5}saveSettings(){}loadSounds(e){["button_click","jump","double_jump","collect","level_complete","death_sound","dash","checkpoint_activated","hit","sand_walk","mud_run","ice_run","trampoline_bounce","fire_activated"].forEach(s=>{if(e[s]){this.sounds[s]=e[s],this.soundPool[s]=[];for(let i=0;i<this.poolSize;i++)this.soundPool[s].push(this.sounds[s].cloneNode(!0))}else console.warn(`Sound asset ${s} not found in assets`)})}async play({key:e,volumeMultiplier:t=1,channel:s="SFX"}){if(!this.settings.enabled||!this.sounds[e]||!this.channels[s])return;this.audioUnlocked||await this.unlockAudio();const i=this.soundPool[e];if(!i){console.warn(`Sound pool for ${e} not found.`);return}const n=i.find(a=>a.paused||a.ended);if(n){n.volume=Math.max(0,Math.min(1,this.settings.volume*t)),n.currentTime=0,this.channels[s].add(n),n.onended=()=>{this.channels[s].delete(n),n.onended=null};try{await n.play()}catch(a){a.name!=="AbortError"&&console.error(`Audio pool play failed for ${e}:`,a),this.channels[s].delete(n)}}else console.warn(`Sound pool for ${e} was depleted. No sound played.`)}async playLoop({key:e,volumeMultiplier:t=1,channel:s="SFX"}){if(!(!this.settings.enabled||!this.sounds[e]||!this.channels[s])&&!Array.from(this.channels[s]).some(i=>i.src===this.sounds[e].src)){this.audioUnlocked||await this.unlockAudio();try{const i=this.sounds[e].cloneNode(!0);i.volume=Math.max(0,Math.min(1,this.settings.volume*t)),i.loop=!0,await i.play(),this.channels[s].add(i)}catch(i){console.error(`Failed to play looping sound ${e}:`,i)}}}stopLoop(e){const t=this.sounds[e]?.src;if(t)for(const s in this.channels)this.channels[s].forEach(i=>{i.src===t&&i.loop&&(i.pause(),i.currentTime=0,this.channels[s].delete(i))})}stopAll({except:e=[]}={}){for(const t in this.channels)e.includes(t)||(this.channels[t].forEach(s=>{s.pause(),s.currentTime=0}),this.channels[t].clear())}async unlockAudio(){if(!this.audioUnlocked){if(!this.audioContext)try{const e=window.AudioContext||window.webkitAudioContext;e&&(this.audioContext=new e)}catch(e){console.error("Failed to create AudioContext",e);return}this.audioContext.state==="suspended"&&await this.audioContext.resume().catch(e=>console.error("Failed to resume AudioContext",e)),this.audioContext.state==="running"&&(this.audioUnlocked=!0)}}setVolume(e){this.settings.volume=Math.max(0,Math.min(1,e));for(const t in this.channels)this.channels[t].forEach(s=>{s.volume=this.settings.volume});this.saveSettings(),c.publish("soundSettingsChanged",{soundEnabled:this.settings.enabled,soundVolume:this.settings.volume})}setEnabled(e){this.settings.enabled=e,this.settings.enabled||this.stopAll(),this.saveSettings(),c.publish("soundSettingsChanged",{soundEnabled:this.settings.enabled,soundVolume:this.settings.volume})}toggleSound(){return this.setEnabled(!this.settings.enabled),this.settings.enabled}getSettings(){return{soundEnabled:this.settings.enabled,soundVolume:this.settings.volume,audioUnlocked:this.audioUnlocked}}}class ot{constructor(e,t){this.canvas=e,this.fontRenderer=t,this.isVisible=!0,this.stats={levelName:"Loading...",collectedFruits:0,totalFruits:0,deathCount:0,soundEnabled:!0,soundVolume:.5,health:100,maxHealth:100},c.subscribe("statsUpdated",s=>this.updateStats(s))}setVisible(e){this.isVisible=e}updateStats(e){this.stats={...this.stats,...e}}drawGameHUD(e){if(!(!this.isVisible||!this.fontRenderer))try{e.save(),e.setTransform(1,0,0,1,0,0);const{levelName:t,collectedFruits:s,totalFruits:i,deathCount:n,soundEnabled:a,soundVolume:o,health:l,maxHealth:h}=this.stats,d=[`${t}`,`Fruits: ${s}/${i}`,`Deaths: ${n||0}`,`Sound: ${a?"On":"Off"} (${Math.round(o*100)}%)`],u={scale:2.5,align:"center",color:"white",outlineColor:"black",outlineWidth:1};let p=0;d.forEach(be=>{const ae=this.fontRenderer.getTextWidth(be,u.scale);ae>p&&(p=ae)});const f=40,x=10,k=10,F=p+f,pe=180;e.fillStyle="rgba(0, 0, 0, 0.5)",e.beginPath(),e.roundRect(x,k,F,pe,10),e.fill();const me=35,fe=k+25,ge=x+F/2;d.forEach((be,ae)=>{const st=fe+ae*me;this.fontRenderer.drawText(e,be,ge,st,u)});const N=150,z=20,B=x+F+15,ne=k;e.fillStyle="rgba(0, 0, 0, 0.7)",e.fillRect(B-2,ne-2,N+4,z+4),e.fillStyle="#333",e.fillRect(B,ne,N,z);const ye=(l||0)/(h||100),tt=N*ye;ye>.6?e.fillStyle="#4CAF50":ye>.3?e.fillStyle="#FFC107":e.fillStyle="#F44336",e.fillRect(B,ne,tt,z),this.fontRenderer.drawText(e,"HP",B+N+10,ne+z/2-12,{scale:2,align:"left"}),e.restore()}catch(t){console.warn("Error drawing HUD:",t)}}}const J={PinkMan:{name:"Pink Man",unlockRequirement:0},NinjaFrog:{name:"Ninja Frog",unlockRequirement:10},MaskDude:{name:"Mask Dude",unlockRequirement:20},VirtualGuy:{name:"Virtual Guy",unlockRequirement:30}},E=[{name:"Mechanical Mastery",levels:[{name:"Level 1",jsonPath:"/levels/mechanical-mastery/01.json"},{name:"Level 2",jsonPath:"/levels/mechanical-mastery/02.json"},{name:"Level 3",jsonPath:"/levels/mechanical-mastery/03.json"},{name:"Level 4",jsonPath:"/levels/mechanical-mastery/04.json"},{name:"Level 5",jsonPath:"/levels/mechanical-mastery/05.json"},{name:"Level 6",jsonPath:"/levels/mechanical-mastery/06.json"},{name:"Level 7",jsonPath:"/levels/mechanical-mastery/07.json"},{name:"Level 8",jsonPath:"/levels/mechanical-mastery/08.json"},{name:"Level 9",jsonPath:"/levels/mechanical-mastery/09.json"},{name:"Level 10",jsonPath:"/levels/mechanical-mastery/10.json"}]},{name:"Sky High",levels:[{name:"Level 1",jsonPath:"/levels/sky-high/01.json"},{name:"Level 2",jsonPath:"/levels/sky-high/02.json"},{name:"Level 3",jsonPath:"/levels/sky-high/03.json"},{name:"Level 4",jsonPath:"/levels/sky-high/04.json"},{name:"Level 5",jsonPath:"/levels/sky-high/05.json"},{name:"Level 6",jsonPath:"/levels/sky-high/06.json"},{name:"Level 7",jsonPath:"/levels/sky-high/07.json"},{name:"Level 8",jsonPath:"/levels/sky-high/08.json"},{name:"Level 9",jsonPath:"/levels/sky-high/09.json"},{name:"Level 10",jsonPath:"/levels/sky-high/10.json"}]}];function Ee(r,e,t){let s=0;for(let i=0;i<r;i++)s+=t[i].levels.length;return s+=e,s}class le{constructor(e=null){if(e)this.currentSection=e.currentSection,this.currentLevelIndex=e.currentLevelIndex,this.showingLevelComplete=e.showingLevelComplete,this.levelProgress=e.levelProgress,this.selectedCharacter=e.selectedCharacter,this.levelStats=e.levelStats;else{this.currentSection=0,this.currentLevelIndex=0,this.showingLevelComplete=!1;const t=this.loadProgress();this.levelProgress=t.levelProgress,this.selectedCharacter=t.selectedCharacter,this.levelStats=t.levelStats,this.ensureStatsForAllLevels()}}_clone(){const e=JSON.parse(JSON.stringify(this));return new le(e)}_getDefaultState(){return{levelProgress:{unlockedLevels:[1],completedLevels:[]},selectedCharacter:"PinkMan",levelStats:{}}}loadProgress(){try{const e=localStorage.getItem("parkourGameState");if(!e)return this._getDefaultState();const t=JSON.parse(e);if(typeof t!="object"||t===null)return this._getDefaultState();const s=t.levelProgress;return typeof s!="object"||s===null||!Array.isArray(s.unlockedLevels)||!Array.isArray(s.completedLevels)?this._getDefaultState():((typeof t.selectedCharacter!="string"||!J[t.selectedCharacter])&&(t.selectedCharacter="PinkMan"),(!t.levelStats||typeof t.levelStats!="object")&&(t.levelStats={}),t)}catch(e){return console.error("Failed to parse game state from localStorage. Resetting to default.",e),this._getDefaultState()}}saveProgress(){try{const e={levelProgress:this.levelProgress,selectedCharacter:this.selectedCharacter,levelStats:this.levelStats};localStorage.setItem("parkourGameState",JSON.stringify(e)),console.log("Progress saved:",e)}catch(e){console.error("Failed to save game state to localStorage",e)}}setSelectedCharacter(e){if(J[e]&&this.selectedCharacter!==e){const t=this._clone();return t.selectedCharacter=e,t.saveProgress(),t}return this}ensureStatsForAllLevels(){E.forEach((e,t)=>{e.levels.forEach((s,i)=>{const n=`${t}-${i}`;this.levelStats[n]||(this.levelStats[n]={fastestTime:null,lowestDeaths:null,totalAttempts:0})})})}incrementAttempts(e,t){const s=`${e}-${t}`;this.levelStats[s]&&(this.levelStats[s].totalAttempts+=1,this.saveProgress())}onLevelComplete(e){const t=this._clone(),s=`${this.currentSection}-${this.currentLevelIndex}`;if(!this.levelProgress.completedLevels.includes(s)){t.levelProgress.completedLevels.push(s);const n=E.reduce((o,l)=>o+l.levels.length,0),a=Ee(this.currentSection,this.currentLevelIndex,E);if(a+1<n){const o=a+2;o>this.levelProgress.unlockedLevels[0]&&(t.levelProgress.unlockedLevels[0]=o)}}const i=t.levelStats[s];return i&&((i.fastestTime===null||e.time<i.fastestTime)&&(i.fastestTime=e.time),(i.lowestDeaths===null||e.deaths<i.lowestDeaths)&&(i.lowestDeaths=e.deaths)),t.showingLevelComplete=!0,t.saveProgress(),c.publish("playSound",{key:"level_complete",volume:1,channel:"UI"}),t}isCharacterUnlocked(e){const t=J[e];return t?this.levelProgress.completedLevels.length>=t.unlockRequirement:!1}isLevelUnlocked(e,t){return Ee(e,t,E)<this.levelProgress.unlockedLevels[0]}isLevelCompleted(e,t){const s=`${e}-${t}`;return this.levelProgress.completedLevels.includes(s)}resetProgress(){try{localStorage.removeItem("parkourGameState");const e=this._getDefaultState();this.levelProgress=e.levelProgress,this.selectedCharacter=e.selectedCharacter,this.levelStats=e.levelStats,this.currentSection=0,this.currentLevelIndex=0,this.ensureStatsForAllLevels()}catch(e){console.error("Failed to reset game state in localStorage",e)}}unlockAllLevels(){const e=E.reduce((t,s)=>t+s.levels.length,0);this.levelProgress.unlockedLevels[0]=e,this.levelProgress.completedLevels=Array.from({length:e},(t,s)=>`temp-${s}`),this.saveProgress()}}const g={WIDTH:32,HEIGHT:32,SPAWN_WIDTH:96,SPAWN_HEIGHT:96,CLING_OFFSET:7,MOVE_SPEED:200,JUMP_FORCE:400,GRAVITY:1200,MAX_FALL_SPEED:600,FALL_DAMAGE_MIN_VELOCITY:550,FALL_DAMAGE_MAX_VELOCITY:700,FALL_DAMAGE_MIN_AMOUNT:5,FALL_DAMAGE_MAX_AMOUNT:20,DASH_SPEED:500,DASH_DURATION:.2,DASH_COOLDOWN:.7,COYOTE_TIME:.1,JUMP_BUFFER_TIME:.15,HIT_STUN_DURATION:.2,SAND_MOVE_MULTIPLIER:.5,MUD_JUMP_MULTIPLIER:.6,ICE_ACCELERATION:800,ICE_FRICTION:400,TRAMPOLINE_BOUNCE_MULTIPLIER:2,ANIMATION_SPEED:.06,SPAWN_ANIMATION_SPEED:.08,HIT_ANIMATION_SPEED:.1,ANIMATION_FRAMES:{idle:11,run:12,double_jump:6,jump:1,fall:1,dash:1,cling:5,spawn:7,despawn:7,hit:7}},v={TILE_SIZE:48};class M{constructor(e=0,t=0){this.vx=e,this.vy=t}}class S{constructor({speed:e=g.MOVE_SPEED,jumpForce:t=g.JUMP_FORCE,dashSpeed:s=g.DASH_SPEED,dashDuration:i=g.DASH_DURATION,jumpBufferTimer:n=0,coyoteTimer:a=0,dashTimer:o=0,dashCooldownTimer:l=0,hitStunTimer:h=0,jumpCount:d=0,isDashing:u=!1,isHit:p=!1,isSpawning:f=!0,spawnComplete:x=!1,isDespawning:k=!1,despawnAnimationFinished:F=!1,needsRespawn:pe=!1,deathCount:me=0,activeSurfaceSound:fe=null,surfaceParticleTimer:ge=0,jumpParticleTimer:N=0,jumpPressed:z=!1,dashPressed:B=!1}={}){this.speed=e,this.jumpForce=t,this.dashSpeed=s,this.dashDuration=i,this.jumpBufferTimer=n,this.coyoteTimer=a,this.dashTimer=o,this.dashCooldownTimer=l,this.hitStunTimer=h,this.surfaceParticleTimer=ge,this.jumpParticleTimer=N,this.jumpCount=d,this.isDashing=u,this.isHit=p,this.isSpawning=f,this.spawnComplete=x,this.isDespawning=k,this.despawnAnimationFinished=F,this.needsRespawn=pe,this.jumpPressed=z,this.dashPressed=B,this.deathCount=me,this.activeSurfaceSound=fe}}class rt{constructor(){}update(e,{entityManager:t,level:s}){for(const n of s.traps)n.type==="fire_trap"&&(n.playerIsOnTop=!1);const i=t.query([C,M,T]);for(const n of i){const a=t.getComponent(n,C),o=t.getComponent(n,M),l=t.getComponent(n,T),h=t.getComponent(n,S);if(!(h&&(h.isSpawning||h.isDespawning))){if(a.y>s.height+50){c.publish("collisionEvent",{type:"world_bottom",entityId:n,entityManager:t});continue}a.x+=o.vx*e,this._handleTileHorizontalCollisions(a,o,l,s),a.y+=o.vy*e,this._handleTileVerticalCollisions(a,o,l,s,e),this._handleSolidObjectCollisions(a,o,l,s,e),a.x=Math.max(0,Math.min(a.x,s.width-l.width)),this._checkObjectInteractions(a,o,l,s,e,n,t)}}}_handleTileHorizontalCollisions(e,t,s,i){if(t.vx===0){s.isAgainstWall=!1;return}const n=Math.floor(e.y/v.TILE_SIZE),a=Math.floor((e.y+s.height-1)/v.TILE_SIZE),o=t.vx>0?e.x+s.width:e.x,l=Math.floor(o/v.TILE_SIZE);for(let h=n;h<=a;h++){const d=i.getTileAt(l*v.TILE_SIZE,h*v.TILE_SIZE);if(d&&d.solid){e.x=t.vx>0?l*v.TILE_SIZE-s.width:(l+1)*v.TILE_SIZE,t.vx=0,s.isAgainstWall=!["dirt","sand","mud","ice"].includes(d.type);return}}s.isAgainstWall=!1}_handleTileVerticalCollisions(e,t,s,i,n){const a=Math.floor(e.x/v.TILE_SIZE),o=Math.floor((e.x+s.width-1)/v.TILE_SIZE);if(t.vy<0){const d=Math.floor(e.y/v.TILE_SIZE);for(let u=a;u<=o;u++){const p=i.getTileAt(u*v.TILE_SIZE,d*v.TILE_SIZE);if(p&&p.solid){e.y=(d+1)*v.TILE_SIZE,t.vy=0;return}}}const l=e.y+s.height,h=Math.floor(l/v.TILE_SIZE);s.isGrounded=!1;for(let d=a;d<=o;d++){const u=i.getTileAt(d*v.TILE_SIZE,h*v.TILE_SIZE);if(u&&u.solid&&t.vy>=0){const p=h*v.TILE_SIZE,f=e.y+s.height,x=f-t.vy*n;if(f>=p&&x<=p+1){this._landOnSurface(e,t,s,p,u.interaction||u.type);return}}}}_handleSolidObjectCollisions(e,t,s,i,n){const a=i.traps.filter(o=>o.solid);for(const o of a){const l=o.x-o.width/2,h=o.x+o.width/2,d=o.y-o.height/2,u=o.y+o.height/2,p=e.x,f=e.x+s.width,x=e.y,k=e.y+s.height;if(!(f<l||p>h||k<d||x>u)){if(t.vy>=0){const F=k-t.vy*n;if(k>=d&&F<=d+1){this._landOnSurface(e,t,s,d,o.type),typeof o.onLanded=="function"&&o.onLanded(c);continue}}k>d&&x<u&&(t.vx>0&&f>l&&p<l?(e.x=l-s.width,t.vx=0):t.vx<0&&p<h&&f>h&&(e.x=h,t.vx=0))}}}_landOnSurface(e,t,s,i,n){const a=t.vy;if(a>=g.FALL_DAMAGE_MIN_VELOCITY){const{FALL_DAMAGE_MIN_VELOCITY:o,FALL_DAMAGE_MAX_VELOCITY:l,FALL_DAMAGE_MIN_AMOUNT:h,FALL_DAMAGE_MAX_AMOUNT:d}=g,p=(Math.max(o,Math.min(a,l))-o)/(l-o),f=Math.round(h+p*(d-h));c.publish("playerTookDamage",{amount:f,source:"fall"})}e.y=i-s.height,t.vy=0,s.isGrounded=!0,s.groundType=n}_isCollidingWith(e,t,s){const i=s.hitbox||{x:s.x-(s.width||s.size)/2,y:s.y-(s.height||s.size)/2,width:s.width||s.size,height:s.height||s.size};return e.x<i.x+i.width&&e.x+t.width>i.x&&e.y<i.y+i.height&&e.y+t.height>i.y}_checkObjectInteractions(e,t,s,i,n,a,o){this._checkFruitCollisions(e,s,i,a,o),this._checkTrophyCollision(e,s,i.trophy,a,o),this.checkCheckpointCollisions(e,s,i,a,o),this._checkTrapInteractions(e,t,s,i,n,a,o)}_checkTrapInteractions(e,t,s,i,n,a,o){const l={pos:e,vel:t,col:s,entityId:a,entityManager:o};for(const h of i.traps)if(h.type==="trampoline"){if(t.vy>0){const d=e.y+s.height,u=h.y-h.height/2,p=h.x-h.width/2,f=d-t.vy*n;if(e.x+s.width>p&&e.x<p+h.width&&d>=u&&f<=u+1){h.onCollision(l,c);return}}}else this._isCollidingWith(e,s,h)&&h.onCollision(l,c)}_checkFruitCollisions(e,t,s,i,n){for(const a of s.getActiveFruits())this._isCollidingWith(e,t,a)&&c.publish("collisionEvent",{type:"fruit",entityId:i,target:a,entityManager:n})}_checkTrophyCollision(e,t,s,i,n){!s||s.acquired||s.inactive||this._isCollidingWith(e,t,s)&&c.publish("collisionEvent",{type:"trophy",entityId:i,target:s,entityManager:n})}checkCheckpointCollisions(e,t,s,i,n){for(const a of s.getInactiveCheckpoints())this._isCollidingWith(e,t,a)&&c.publish("collisionEvent",{type:"checkpoint",entityId:i,target:a,entityManager:n})}}class L{constructor({spriteKey:e,width:t,height:s,animationState:i="idle",animationFrame:n=0,animationTimer:a=0,direction:o="right",isVisible:l=!0}){this.spriteKey=e,this.width=t,this.height=s,this.animationState=i,this.animationFrame=n,this.animationTimer=a,this.direction=o,this.isVisible=l}}class we{constructor(e){this.characterId=e}}class lt{constructor(e,t,s){this.ctx=e,this.canvas=t,this.assets=s,this.backgroundCache=new Map,this.backgroundOffset={x:0,y:0}}_preRenderBackground(e){const t=e.background;if(this.backgroundCache.has(t))return this.backgroundCache.get(t);const s=this.assets[t];if(!s||!s.complete||s.naturalWidth===0)return null;const i=document.createElement("canvas");i.width=this.canvas.width+s.width,i.height=this.canvas.height+s.height;const n=i.getContext("2d"),a=n.createPattern(s,"repeat");return n.fillStyle=a,n.fillRect(0,0,i.width,i.height),this.backgroundCache.set(t,i),i}drawScrollingBackground(e,t){const s=this._preRenderBackground(e),i=this.assets[e.background];if(!s||!i||!i.complete||i.naturalWidth===0){this.ctx.fillStyle="#87CEEB",this.ctx.fillRect(0,0,this.canvas.width,this.canvas.height);return}this.backgroundOffset.x+=e.backgroundScroll.x*t,this.backgroundOffset.y+=e.backgroundScroll.y*t;const n=(this.backgroundOffset.x%i.width+i.width)%i.width,a=(this.backgroundOffset.y%i.height+i.height)%i.height;this.ctx.drawImage(s,n,a,this.canvas.width,this.canvas.height,0,0,this.canvas.width,this.canvas.height)}renderScene(e,t,s,i){e.apply(this.ctx),this.drawTileGrid(t,e),t.trophy&&this.drawTrophy(t.trophy,e),this.drawFruits(t.getActiveFruits(),e),this.drawCheckpoints(t.checkpoints,e),this.drawTraps(t.traps,e);const n=s.query([C,L]);for(const a of n){const o=s.getComponent(a,C),l=s.getComponent(a,L),h=s.getComponent(a,we),d=s.getComponent(a,S);this._drawRenderable(o,l,h,d)}this.drawCollectedFruits(i,e),e.restore(this.ctx)}_drawRenderable(e,t,s,i){const n=t.animationState;if(!t.isVisible||i&&i.despawnAnimationFinished)return;const a={idle:"playerIdle",run:"playerRun",jump:"playerJump",double_jump:"playerDoubleJump",fall:"playerFall",dash:"playerDash",cling:"playerCling",spawn:"playerAppear",despawn:"playerDisappear",hit:"playerHit"};let o;const l=a[n];if(n==="spawn"||n==="despawn"?o=this.assets[l]:s?o=this.assets.characters[s.characterId]?.[l]||this.assets.playerIdle:o=this.assets[t.spriteKey],!o){this.ctx.fillStyle="#FF00FF",this.ctx.fillRect(e.x,e.y,t.width,t.height);return}const h=g.ANIMATION_FRAMES[n]||1,d=o.width/h,u=d*t.animationFrame;this.ctx.save();const p=n==="spawn"||n==="despawn",f=p?e.x-(t.width-g.WIDTH)/2:e.x,x=p?e.y-(t.height-g.HEIGHT)/2:e.y;t.direction==="left"?(this.ctx.scale(-1,1),this.ctx.translate(-f-t.width,x)):this.ctx.translate(f,x);const k=n==="cling"?g.CLING_OFFSET:0;this.ctx.drawImage(o,u,0,d,o.height,k,0,t.width,t.height),this.ctx.restore()}drawTileGrid(e,t){const s=v.TILE_SIZE,i=Math.floor(t.x/s),n=Math.ceil((t.x+t.width)/s),a=Math.floor(t.y/s),o=Math.ceil((t.y+t.height)/s);for(let l=a;l<o;l++)for(let h=i;h<n;h++){if(h<0||h>=e.gridWidth||l<0||l>=e.gridHeight)continue;const d=e.tiles[l][h];if(d.type==="empty")continue;const u=this.assets[d.spriteKey];if(!u){this.ctx.fillStyle="magenta",this.ctx.fillRect(h*s,l*s,s,s);continue}const p=h*s,f=l*s,x=s+1;d.spriteConfig?this.ctx.drawImage(u,d.spriteConfig.srcX,d.spriteConfig.srcY,s,s,p,f,x,x):this.ctx.drawImage(u,p,f,x,x)}}drawTrophy(e,t){if(!t.isVisible(e.x-e.size/2,e.y-e.size/2,e.size,e.size))return;const s=this.assets.trophy;if(!s)return;const i=s.width/e.frameCount,n=i*e.animationFrame;e.inactive&&(this.ctx.globalAlpha=.5),this.ctx.drawImage(s,n,0,i,s.height,e.x-e.size/2,e.y-e.size/2,e.size,e.size),this.ctx.globalAlpha=1}drawFruits(e,t){for(const s of e){if(!t.isRectVisible({x:s.x-s.size/2,y:s.y-s.size/2,width:s.size,height:s.size}))continue;const i=this.assets[s.spriteKey];if(!i)continue;const n=i.width/s.frameCount,a=n*s.frame;this.ctx.drawImage(i,a,0,n,i.height,s.x-s.size/2,s.y-s.size/2,s.size,s.size)}}drawTraps(e,t){for(const s of e)s.render(this.ctx,this.assets,t)}drawCollectedFruits(e,t){const s=this.assets.fruit_collected;if(!s)return;const i=s.width/6;for(const n of e){if(!t.isRectVisible({x:n.x,y:n.y,width:n.size,height:n.size}))continue;const a=n.frame*i;this.ctx.drawImage(s,a,0,i,s.height,n.x-n.size/2,n.y-n.size/2,n.size,n.size)}}drawCheckpoints(e,t){for(const s of e){if(!t.isRectVisible({x:s.x,y:s.y,width:s.size,height:s.size}))continue;let i,n=0,a;switch(s.state){case"inactive":i=this.assets.checkpoint_inactive,i&&(a=i.width);break;case"activating":i=this.assets.checkpoint_activation,i&&(a=i.width/s.frameCount,n=s.frame*a);break;case"active":if(i=this.assets.checkpoint_active,i){const l=Math.floor(performance.now()/1e3/.1%10);a=i.width/10,n=l*a}break}i&&a>0?this.ctx.drawImage(i,n,0,a,i.height,s.x-s.size/2,s.y-s.size/2,s.size,s.size):(this.ctx.fillStyle="purple",this.ctx.fillRect(s.x-s.size/2,s.y-s.size/2,s.size,s.size))}}}const K={0:{type:"empty",solid:!1,hazard:!1,description:"Empty space. The player can move freely through it."},1:{type:"dirt",solid:!0,hazard:!1,spriteKey:"block",spriteConfig:{srcX:96,srcY:0},description:"A standard, solid block of dirt. Wall-jumps are not possible on this surface."},2:{type:"stone",solid:!0,hazard:!1,spriteKey:"block",spriteConfig:{srcX:0,srcY:0},description:"A standard, solid block of stone. Players can wall-jump off this surface."},3:{type:"wood",solid:!0,hazard:!1,spriteKey:"block",spriteConfig:{srcX:0,srcY:64},description:"A standard, solid block of wood. Players can wall-jump off this surface."},4:{type:"green_block",solid:!0,hazard:!1,spriteKey:"block",spriteConfig:{srcX:0,srcY:128},description:"A solid, green-colored block. Players can wall-jump off this surface."},5:{type:"orange_dirt",solid:!0,hazard:!1,spriteKey:"block",spriteConfig:{srcX:96,srcY:64},description:"Solid orange dirt. Wall-jumps are not possible on this surface."},6:{type:"pink_dirt",solid:!0,hazard:!1,spriteKey:"block",spriteConfig:{srcX:96,srcY:128},description:"Solid pink dirt. Wall-jumps are not possible on this surface."},7:{type:"sand",solid:!0,hazard:!1,spriteKey:"sand_mud_ice",spriteConfig:{srcX:0,srcY:0},interaction:"sand",description:"A solid block of sand. Slows player movement. Wall-jumps are not possible."},8:{type:"mud",solid:!0,hazard:!1,spriteKey:"sand_mud_ice",spriteConfig:{srcX:64,srcY:0},interaction:"mud",description:"A solid block of mud. Reduces jump height. Wall-jumps are not possible."},9:{type:"ice",solid:!0,hazard:!1,spriteKey:"sand_mud_ice",spriteConfig:{srcX:128,srcY:0},interaction:"ice",description:"A solid block of slippery ice. Reduces friction. Wall-jumps are not possible."}};class ce{constructor(e,t,s){this.x=e,this.y=t,this.width=s.width||16,this.height=s.height||16,this.type=s.type,this.id=`${this.type}-${Math.random().toString(36).substr(2,9)}`}update(e,t,s){}render(e,t,s){}onCollision(e,t){}reset(){}}class ht extends ce{constructor(e,t,s){super(e,t,{...s,width:16,height:16}),this.solid=!0,this.state="off",this.playerIsOnTop=!1,this.frame=0,this.frameTimer=0,this.turnOffTimer=0,this.damageTimer=1,this.anim={activating:{frames:4,speed:.1},on:{frames:3,speed:.15}}}get hitbox(){return this.state==="on"||this.state==="activating"?{x:this.x-this.width/2,y:this.y-this.height*1.5,width:this.width,height:this.height*2}:{x:this.x-this.width/2,y:this.y-this.height/2,width:this.width,height:this.height}}update(e){switch(!this.playerIsOnTop&&this.state==="on"&&(this.state="turning_off",this.turnOffTimer=2),this.state){case"activating":this.frameTimer+=e,this.frameTimer>=this.anim.activating.speed&&(this.frameTimer=0,this.frame++,this.frame>=this.anim.activating.frames&&(this.frame=0,this.state="on"));break;case"on":this.frameTimer+=e,this.frameTimer>=this.anim.on.speed&&(this.frameTimer=0,this.frame=(this.frame+1)%this.anim.on.frames);break;case"turning_off":this.turnOffTimer-=e,this.turnOffTimer<=0&&(this.state="off",this.frame=0);break}this.state==="on"?this.damageTimer+=e:this.playerIsOnTop||(this.damageTimer=1)}render(e,t,s){if(!s.isVisible(this.x,this.y-this.height,this.width,this.height*2))return;const i=this.x-this.width/2,n=this.y-this.height/2,a=t.fire_off;if(a&&e.drawImage(a,0,16,16,16,i,n,this.width,this.height),this.state==="off"||this.state==="turning_off")return;let o,l=0,h;this.state==="activating"?(o=t.fire_hit,h=o.width/this.anim.activating.frames,l=this.frame*h):(o=t.fire_on,h=o.width/this.anim.on.frames,l=this.frame*h),o&&e.drawImage(o,l,0,h,o.height,i,n-this.height,this.width,this.height*2)}onLanded(e){this.playerIsOnTop=!0,(this.state==="off"||this.state==="turning_off")&&(this.state="activating",this.frame=0,this.frameTimer=0,e.publish("playSound",{key:"fire_activated",volume:.8,channel:"SFX"}))}onCollision(e,t){this.state==="on"&&this.damageTimer>=1&&(this.damageTimer-=1,t.publish("playerTookDamage",{amount:10,source:"fire"}))}reset(){this.state="off",this.playerIsOnTop=!1,this.frame=0,this.frameTimer=0,this.turnOffTimer=0,this.damageTimer=1}}class ct extends ce{constructor(e,t,s){super(e,t,{...s,width:16,height:16}),this.state="hidden",this.activationRadius=64,this.warningDuration=.4,this.retractDelay=1.5,this.timer=0,this.damage=s.damage||40}get hitbox(){return{x:this.x-this.width/2,y:this.y-this.height/4,width:this.width,height:this.height/2}}update(e,t){if(!t)return;this.timer>0&&(this.timer-=e);const s=t.x,i=t.x+t.width,n=t.y,a=t.y+t.height,o=this.x-this.activationRadius,l=this.x+this.activationRadius,h=this.y-this.activationRadius,d=this.y+this.activationRadius,u=i>o&&s<l&&a>h&&n<d;switch(this.state){case"hidden":u&&(this.state="warning",this.timer=this.warningDuration);break;case"warning":this.timer<=0&&(this.state="extended",this.timer=this.retractDelay);break;case"extended":this.timer<=0&&(this.state="hidden");break}}render(e,t,s){if(this.state==="hidden"||this.state==="warning")return;const i=this.x-this.width/2,n=this.y-this.height/2;if(!s.isVisible(i,n,this.width,this.height))return;const a=t.spike_two;a&&e.drawImage(a,i,n,this.width,this.height)}onCollision(e,t){this.state==="extended"&&t.publish("collisionEvent",{type:"hazard",entityId:e.entityId,entityManager:e.entityManager,damage:this.damage})}reset(){this.state="hidden",this.timer=0}}class dt extends ce{constructor(e,t,s){super(e,t,{...s,width:28,height:28}),this.state="idle",this.frame=0,this.frameCount=8,this.frameSpeed=.05,this.frameTimer=0}update(e){this.state==="jumping"&&(this.frameTimer+=e,this.frameTimer>=this.frameSpeed&&(this.frameTimer-=this.frameSpeed,this.frame++,this.frame>=this.frameCount&&(this.frame=0,this.state="idle")))}render(e,t,s){const i=this.x-this.width/2,n=this.y-this.height/2;if(!s.isVisible(i,n,this.width,this.height))return;let a,o=0,l;this.state==="jumping"?(a=t.trampoline_jump,a&&(l=a.width/this.frameCount,o=this.frame*l)):(a=t.trampoline_idle,a&&(l=a.width)),a&&l>0?e.drawImage(a,o,0,l,a.height,i,n,this.width,this.height):(e.fillStyle="#8e44ad",e.fillRect(i,n,this.width,this.height))}onCollision(e,t){const{pos:s,vel:i,col:n}=e;i.vy=-400*g.TRAMPOLINE_BOUNCE_MULTIPLIER,s.y=this.y-this.height/2-n.height,this.state="jumping",this.frame=0,this.frameTimer=0,t.publish("playSound",{key:"trampoline_bounce",volume:1,channel:"SFX"})}reset(){this.state="idle",this.frame=0,this.frameTimer=0}}class ut extends ce{constructor(e,t,s){super(e,t,{...s,width:28,height:28}),this.chainLength=s.chainLength||100,this.swingArc=s.swingArc||90,this.period=s.period||4,this.tiltAmount=s.tiltAmount||.5,this.anchorX=e,this.anchorY=t,this.ballX=this.anchorX,this.ballY=this.anchorY+this.chainLength,this.swingTimer=0,this.maxAngle=this.swingArc/2*(Math.PI/180),this.rotation=0}get hitbox(){return{x:this.ballX-this.width/2,y:this.ballY-this.height/2,width:this.width,height:this.height}}update(e){this.swingTimer+=e;const t=this.maxAngle*Math.sin(this.swingTimer/this.period*2*Math.PI),s=this.maxAngle*Math.cos(this.swingTimer/this.period*2*Math.PI);this.rotation=s*this.tiltAmount,this.ballX=this.anchorX+this.chainLength*Math.sin(t),this.ballY=this.anchorY+this.chainLength*Math.cos(t)}render(e,t,s){if(!s.isVisible(this.anchorX-this.chainLength,this.anchorY,this.chainLength*2,this.chainLength*2))return;const i=t.spiked_ball,n=t.spiked_ball_chain;if(n){const o=this.ballX-this.anchorX,l=this.ballY-this.anchorY,h=Math.sqrt(o*o+l*l),d=Math.atan2(l,o);e.save(),e.translate(this.anchorX,this.anchorY),e.rotate(d);for(let u=0;u<h;u+=8)e.drawImage(n,u,-8/2,8,8);e.restore()}i?(e.save(),e.translate(this.ballX,this.ballY),e.rotate(this.rotation),e.drawImage(i,-this.width/2,-this.height/2,this.width,this.height),e.restore()):(e.fillStyle="red",e.fillRect(this.hitbox.x,this.hitbox.y,this.width,this.height))}onCollision(e,t){t.publish("collisionEvent",{type:"hazard",entityId:e.entityId,entityManager:e.entityManager,damage:50})}reset(){this.swingTimer=0,this.rotation=0}}const pt={fire_trap:ht,spike:ct,trampoline:dt,spiked_ball:ut};class mt{constructor(e){this.name=e.name||"Unnamed Level",this.gridWidth=e.gridWidth,this.gridHeight=e.gridHeight,this.width=this.gridWidth*v.TILE_SIZE,this.height=this.gridHeight*v.TILE_SIZE,this.background=e.background||"background_blue",this.backgroundScroll=e.backgroundScroll||{x:0,y:15},this.startPosition={x:e.startPosition.x*v.TILE_SIZE,y:e.startPosition.y*v.TILE_SIZE},this.tiles=e.layout.map(t=>[...t].map(s=>K[s]||K[0])),this.fruits=[],this.checkpoints=[],this.traps=[],this.trophy=null,(e.objects||[]).forEach(t=>{const s=t.x*v.TILE_SIZE,i=t.y*v.TILE_SIZE,n=pt[t.type];n?this.traps.push(new n(s,i,t)):t.type.startsWith("fruit_")?this.fruits.push({x:s,y:i,size:28,spriteKey:t.type,frame:0,frameCount:17,frameSpeed:.07,frameTimer:0,collected:!1,type:"fruit"}):t.type==="checkpoint"?this.checkpoints.push({x:s,y:i,size:64,state:"inactive",frame:0,frameCount:26,frameSpeed:.07,frameTimer:0,type:"checkpoint"}):t.type==="trophy"&&(this.trophy={x:s,y:i,size:32,frameCount:8,animationFrame:0,animationTimer:0,animationSpeed:.35,acquired:!1,inactive:!0,contactMade:!1})}),this.totalFruitCount=this.fruits.length,this.collectedFruitCount=0,this.completed=!1}getTileAt(e,t){const s=Math.floor(e/v.TILE_SIZE),i=Math.floor(t/v.TILE_SIZE);return s<0||s>=this.gridWidth||i<0?K[1]:i>=this.gridHeight||!this.tiles[i]?K[0]:this.tiles[i][s]||K[0]}update(e,t,s,i){this.updateFruits(e),this.updateTrophyAnimation(e),this.updateCheckpoints(e);const n=t.getComponent(s,C),a=t.getComponent(s,T),o=n&&a?{...n,width:a.width,height:a.height}:null;for(const l of this.traps)l.update(e,o,i)}updateCheckpoints(e){for(const t of this.checkpoints)t.state==="activating"&&(t.frameTimer+=e,t.frameTimer>=t.frameSpeed&&(t.frameTimer-=t.frameSpeed,t.frame++,t.frame>=t.frameCount&&(t.frame=0,t.state="active")))}getInactiveCheckpoints(){return this.checkpoints.filter(e=>e.state==="inactive")}updateFruits(e){for(const t of this.fruits)t.collected||(t.frameTimer+=e,t.frameTimer>=t.frameSpeed&&(t.frameTimer-=t.frameSpeed,t.frame=(t.frame+1)%t.frameCount))}collectFruit(e){e.collected||(e.collected=!0,this.collectedFruitCount++,this.trophy&&this.allFruitsCollected()&&(this.trophy.inactive=!1))}getActiveFruits(){return this.fruits.filter(e=>!e.collected)}getFruitCount(){return this.collectedFruitCount}getTotalFruitCount(){return this.totalFruitCount}allFruitsCollected(){return this.collectedFruitCount===this.totalFruitCount}recalculateCollectedFruits(){this.collectedFruitCount=this.fruits.reduce((e,t)=>e+(t.collected?1:0),0)}updateTrophyAnimation(e){const t=this.trophy;!t||t.inactive||t.acquired||(t.animationTimer+=e,t.animationTimer>=t.animationSpeed&&(t.animationTimer-=t.animationSpeed,t.animationFrame=(t.animationFrame+1)%t.frameCount))}isCompleted(){return this.fruits.length&&!this.allFruitsCollected()?!1:!this.trophy||this.trophy.acquired}reset(){this.fruits.forEach(e=>{e.collected=!1,e.frame=0,e.frameTimer=0}),this.collectedFruitCount=0,this.checkpoints.forEach(e=>{e.state="inactive",e.frame=0,e.frameTimer=0}),this.traps.forEach(e=>{e.reset()}),this.trophy&&(this.trophy.acquired=!1,this.trophy.inactive=!0,this.trophy.animationFrame=0,this.trophy.animationTimer=0),this.completed=!1}}class ft{constructor(e){this.gameState=e,this.levelSections=E,c.subscribe("requestNextLevel",()=>this.goToNextLevel()),c.subscribe("requestPreviousLevel",()=>this.goToPreviousLevel())}loadLevel(e,t){if(e>=this.levelSections.length||t>=this.levelSections[e].levels.length)return console.error(`Invalid level: Section ${e}, Level ${t}`),null;const s=this.levelSections[e].levels[t];return s?(this.gameState.currentSection=e,this.gameState.currentLevelIndex=t,new mt(s)):(console.error(`Failed to load level data for Section ${e}, Level ${t}. The JSON file may be missing or failed to fetch.`),null)}hasNextLevel(){const{currentSection:e,currentLevelIndex:t}=this.gameState,s=t+1<this.levelSections[e].levels.length,i=e+1<this.levelSections.length;return s||i}hasPreviousLevel(){const{currentSection:e,currentLevelIndex:t}=this.gameState;return t>0||e>0}goToNextLevel(){if(!this.hasNextLevel())return;let{currentSection:e,currentLevelIndex:t}=this.gameState;t+1<this.levelSections[e].levels.length?t++:e+1<this.levelSections.length&&(e++,t=0),c.publish("requestLevelLoad",{sectionIndex:e,levelIndex:t})}goToPreviousLevel(){if(!this.hasPreviousLevel())return;let{currentSection:e,currentLevelIndex:t}=this.gameState;t>0?t--:e>0&&(e--,t=this.levelSections[e].levels.length-1),c.publish("requestLevelLoad",{sectionIndex:e,levelIndex:t})}handleLevelCompleteAction(e){this.gameState.showingLevelComplete=!1;let{currentSection:t,currentLevelIndex:s}=this.gameState;e==="next"&&this.hasNextLevel()?(s+1<this.levelSections[t].levels.length?s++:t+1<this.levelSections.length&&(t++,s=0),c.publish("requestLevelLoad",{sectionIndex:t,levelIndex:s})):e==="restart"?c.publish("requestLevelLoad",{sectionIndex:t,levelIndex:s}):e==="previous"&&this.hasPreviousLevel()&&(s>0?s--:t>0&&(t--,s=this.levelSections[t].levels.length-1),c.publish("requestLevelLoad",{sectionIndex:t,levelIndex:s}))}}class gt{constructor(e){this.assets=e,this.particles=[],c.subscribe("createParticles",t=>this.create(t))}create({x:e,y:t,type:s,direction:i="right"}){const a={dash:{count:10,baseSpeed:150,spriteKey:"dust_particle",life:.4,gravity:50},double_jump:{count:7,baseSpeed:100,spriteKey:"dust_particle",life:.4,gravity:50},sand:{count:2,baseSpeed:20,spriteKey:"sand_particle",life:.5,gravity:120},mud:{count:2,baseSpeed:15,spriteKey:"mud_particle",life:.6,gravity:100},ice:{count:2,baseSpeed:25,spriteKey:"ice_particle",life:.4,gravity:20},walk_dust:{count:1,baseSpeed:15,spriteKey:"dust_particle",life:.4,gravity:80},jump_trail:{count:1,baseSpeed:10,spriteKey:"dust_particle",life:.3,gravity:20}}[s];if(a)for(let o=0;o<a.count;o++){let l,h=a.baseSpeed+Math.random()*(a.baseSpeed*.5);s==="dash"?l=(i==="right"?Math.PI:0)+(Math.random()-.5)*(Math.PI/2):s==="double_jump"?l=Math.PI/2+(Math.random()-.5)*(Math.PI/3):s==="jump_trail"?(l=Math.random()*Math.PI*2,h*=Math.random()*.5):l=-(Math.PI/2)+(Math.random()-.5)*(Math.PI/4);const d=a.life+Math.random()*.3;this.particles.push({x:e,y:t,vx:Math.cos(l)*h,vy:Math.sin(l)*h,life:d,initialLife:d,size:5+Math.random()*4,alpha:1,spriteKey:a.spriteKey,gravity:a.gravity})}}update(e){for(let t=this.particles.length-1;t>=0;t--){const s=this.particles[t];s.life-=e,s.life<=0?this.particles.splice(t,1):(s.x+=s.vx*e,s.y+=s.vy*e,s.vy+=(s.gravity||50)*e,s.alpha=Math.max(0,s.life/s.initialLife))}}render(e,t){if(this.particles.length!==0){e.save(),t.apply(e);for(const s of this.particles){const i=this.assets[s.spriteKey]||this.assets.dust_particle;!i||!t.isVisible(s.x,s.y,s.size,s.size)||(e.globalAlpha=s.alpha,e.drawImage(i,s.x-s.size/2,s.y-s.size/2,s.size,s.size))}t.restore(e),e.restore()}}}class yt{constructor(e,t){this.canvas=e,this.assets=t,this.hoveredButton=null;const s=64,i=20,n=20,a=10,o=this.canvas.width-s-i;this.uiButtons=[{id:"settings",x:o,y:n+(s+a)*0,width:s,height:s,assetKey:"settings_icon",visible:!1},{id:"pause",x:o,y:n+(s+a)*1,width:s,height:s,assetKey:"pause_icon",visible:!1},{id:"levels",x:o,y:n+(s+a)*2,width:s,height:s,assetKey:"levels_icon",visible:!1},{id:"character",x:o,y:n+(s+a)*3,width:s,height:s,assetKey:"character_icon",visible:!1},{id:"info",x:o,y:n+(s+a)*4,width:s,height:s,assetKey:"info_icon",visible:!1}],this.canvas.addEventListener("mousemove",l=>this.handleMouseMove(l)),this.canvas.addEventListener("click",l=>this.handleCanvasClick(l)),c.subscribe("gameStarted",()=>this.uiButtons.forEach(l=>l.visible=!0))}_getMousePos(e){const t=this.canvas.getBoundingClientRect(),s=this.canvas.width/t.width,i=this.canvas.height/t.height;return{x:(e.clientX-t.left)*s,y:(e.clientY-t.top)*i}}handleMouseMove(e){const{x:t,y:s}=this._getMousePos(e);this.hoveredButton=null;for(const i of this.uiButtons)if(i.visible&&t>=i.x&&t<=i.x+i.width&&s>=i.y&&s<=i.y+i.height){this.hoveredButton=i;break}}handleCanvasClick(e){this.hoveredButton&&(c.publish("playSound",{key:"button_click",volume:.8,channel:"UI"}),c.publish("ui_button_clicked",{buttonId:this.hoveredButton.id}))}update(){}render(e,t){e.save(),e.setTransform(1,0,0,1,0,0);for(const s of this.uiButtons){if(!s.visible)continue;const i=s.id==="pause"?t?"pause_icon":"play_icon":s.assetKey,n=this.assets[i];if(!n)continue;const a=this.hoveredButton?.id===s.id,o=a?1.1:1,l=s.width*o,h=s.height*o,d=s.x-(l-s.width)/2,u=s.y-(h-s.height)/2;e.globalAlpha=a?1:.8,e.drawImage(n,d,u,l,h)}e.restore()}}class Le{constructor(){this.nextEntityId=0,this.entities=new Set,this.componentsByClass=new Map}createEntity(){const e=this.nextEntityId++;return this.entities.add(e),e}addComponent(e,t){const s=t.constructor;return this.componentsByClass.has(s)||this.componentsByClass.set(s,new Map),this.componentsByClass.get(s).set(e,t),this}getComponent(e,t){const s=this.componentsByClass.get(t);return s?s.get(e):void 0}hasComponent(e,t){const s=this.componentsByClass.get(t);return s?s.has(e):!1}removeComponent(e,t){const s=this.componentsByClass.get(t);s&&s.delete(e)}destroyEntity(e){for(const t of this.componentsByClass.values())t.delete(e);this.entities.delete(e)}query(e){const t=[];for(const s of this.entities)e.every(i=>this.hasComponent(s,i))&&t.push(s);return t}}class H{constructor(){this.moveLeft=!1,this.moveRight=!1,this.jump=!1,this.dash=!1}}class P{constructor(e="idle"){this.currentState=e}}class q{constructor(e=100,t=100){this.maxHealth=e,this.currentHealth=t}}function bt(r,e,t,s){const i=r.createEntity();return r.addComponent(i,new C(e,t)),r.addComponent(i,new M),r.addComponent(i,new we(s)),r.addComponent(i,new L({spriteKey:null,width:g.SPAWN_WIDTH,height:g.SPAWN_HEIGHT,animationState:"spawn"})),r.addComponent(i,new S),r.addComponent(i,new T({type:"dynamic",solid:!0,width:g.WIDTH,height:g.HEIGHT})),r.addComponent(i,new H),r.addComponent(i,new P("spawn")),r.addComponent(i,new q),i}class vt{constructor(){this.keys={},c.subscribe("key_down",({key:e})=>this.keys[e]=!0),c.subscribe("key_up",({key:e})=>this.keys[e]=!1)}isKeyDown(e){return!!this.keys[e]}}const oe=new vt;class xt{update(e,{entityManager:t,keybinds:s,isRunning:i,gameState:n}){const a=i&&!n.showingLevelComplete,o=t.query([S,H]);for(const l of o){const h=t.getComponent(l,H);h.moveLeft=a&&oe.isKeyDown(s.moveLeft),h.moveRight=a&&oe.isKeyDown(s.moveRight),h.jump=a&&oe.isKeyDown(s.jump),h.dash=a&&oe.isKeyDown(s.dash)}}}class St{constructor(){c.subscribe("collisionEvent",e=>this.handleCollision(e))}handleCollision({type:e,entityId:t,target:s,entityManager:i,damage:n}){if(i.getComponent(t,S))switch(e){case"fruit":c.publish("fruitCollected",s);break;case"world_bottom":c.publish("playerDied");break;case"hazard":const o=n!==void 0?n:25;c.publish("playerTookDamage",{amount:o,source:"hazard"});break;case"trophy":c.publish("trophyCollision");break;case"checkpoint":c.publish("checkpointActivated",s);break}}update(e,t){}}class wt{constructor(){c.subscribe("playerTookDamage",e=>this.handleDamageTaken(e)),c.subscribe("playerRespawned",()=>this.clearDamageEvents()),this.damageEvents=[]}clearDamageEvents(){this.damageEvents=[]}handleDamageTaken(e){this.damageEvents.push(e)}_processDamageEvents(e){if(this.damageEvents.length===0)return;const t=e.query([S,L,P]);for(const s of this.damageEvents)for(const i of t){const n=e.getComponent(i,S),a=e.getComponent(i,L),o=e.getComponent(i,P);n.isHit||n.isSpawning||(s.source==="fall"||s.source==="fire"||s.source==="hazard")&&!n.isHit&&(n.isHit=!0,n.hitStunTimer=g.HIT_STUN_DURATION,this._setAnimationState(a,o,"hit",n),c.publish("playSound",{key:"hit",volume:.8,channel:"SFX"}))}this.damageEvents=[]}update(e,{entityManager:t}){this._processDamageEvents(t);const s=t.query([S,C,M,T,L,H,P]);for(const i of s){const n=t.getComponent(i,S),a=t.getComponent(i,C),o=t.getComponent(i,M),l=t.getComponent(i,T),h=t.getComponent(i,L),d=t.getComponent(i,H),u=t.getComponent(i,P);this._updateTimers(e,n),this._handleInput(e,d,a,o,n,l,h,u),this._updateFSM(o,n,l,h,u),this._updateAnimation(e,n,h,u),this._handleJumpTrail(e,a,l,n,u),l.isGrounded&&(n.coyoteTimer=g.COYOTE_TIME)}}_handleJumpTrail(e,t,s,i,n){n.currentState==="jump"&&i.jumpCount===1?(i.jumpParticleTimer-=e,i.jumpParticleTimer<=0&&(i.jumpParticleTimer=.05,c.publish("createParticles",{x:t.x+s.width/2,y:t.y+s.height,type:"jump_trail"}))):i.jumpParticleTimer=0}_updateTimers(e,t){t.jumpBufferTimer>0&&(t.jumpBufferTimer-=e),t.coyoteTimer>0&&(t.coyoteTimer-=e),t.dashCooldownTimer>0&&(t.dashCooldownTimer-=e),t.isHit&&(t.hitStunTimer-=e,t.hitStunTimer<=0&&(t.isHit=!1)),t.isDashing&&(t.dashTimer-=e,t.dashTimer<=0&&(t.isDashing=!1))}_handleInput(e,t,s,i,n,a,o,l){if(n.isSpawning||n.isDashing||n.isDespawning||n.isHit)return;t.moveLeft?o.direction="left":t.moveRight&&(o.direction="right");const h=t.jump&&!n.jumpPressed;if(t.jump&&(n.jumpBufferTimer=g.JUMP_BUFFER_TIME),n.jumpBufferTimer>0&&(a.isGrounded||n.coyoteTimer>0)&&n.jumpCount===0){const d=n.jumpForce*(a.groundType==="mud"?g.MUD_JUMP_MULTIPLIER:1);i.vy=-d,n.jumpCount=1,n.jumpBufferTimer=0,n.coyoteTimer=0,c.publish("playSound",{key:"jump",volume:.8,channel:"SFX"})}else h&&a.isAgainstWall&&!a.isGrounded?(i.vx=(o.direction==="left"?1:-1)*n.speed,o.direction=o.direction==="left"?"right":"left",i.vy=-n.jumpForce,n.jumpCount=1,c.publish("playSound",{key:"jump",volume:.8,channel:"SFX"})):h&&n.jumpCount===1&&!a.isGrounded&&!a.isAgainstWall&&(i.vy=-n.jumpForce,n.jumpCount=2,n.jumpBufferTimer=0,this._setAnimationState(o,l,"double_jump",n),c.publish("playSound",{key:"double_jump",volume:.6,channel:"SFX"}),c.publish("createParticles",{x:s.x+a.width/2,y:s.y+a.height,type:"double_jump"}));n.jumpPressed=t.jump,t.dash&&!n.dashPressed&&n.dashCooldownTimer<=0&&(n.isDashing=!0,n.dashTimer=n.dashDuration,i.vx=o.direction==="right"?n.dashSpeed:-n.dashSpeed,i.vy=0,n.dashCooldownTimer=g.DASH_COOLDOWN,this._setAnimationState(o,l,"dash",n),c.publish("playSound",{key:"dash",volume:.7,channel:"SFX"}),c.publish("createParticles",{x:s.x+a.width/2,y:s.y+a.height/2,type:"dash",direction:o.direction})),n.dashPressed=t.dash}_updateFSM(e,t,s,i,n){const a=n.currentState;if(!(a==="spawn"&&!t.spawnComplete||a==="despawn")){if(a==="spawn"&&t.spawnComplete){this._setAnimationState(i,n,"idle",t);return}if(t.isHit){a!=="hit"&&this._setAnimationState(i,n,"hit",t);return}if(a==="hit"&&!t.isHit&&this._setAnimationState(i,n,"idle",t),t.isDashing){a!=="dash"&&this._setAnimationState(i,n,"dash",t);return}s.isAgainstWall&&!s.isGrounded&&e.vy>=0?a!=="cling"&&this._setAnimationState(i,n,"cling",t):s.isGrounded?Math.abs(e.vx)>1?a!=="run"&&this._setAnimationState(i,n,"run",t):a!=="idle"&&this._setAnimationState(i,n,"idle",t):e.vy<0&&a!=="jump"&&a!=="double_jump"?this._setAnimationState(i,n,"jump",t):e.vy>=0&&a!=="fall"&&this._setAnimationState(i,n,"fall",t)}}_setAnimationState(e,t,s,i){t.currentState!==s&&(t.currentState=s,e.animationState=s,e.animationFrame=0,e.animationTimer=0,s==="cling"?i.jumpCount=1:(s==="idle"||s==="run")&&(i.jumpCount=0))}_updateAnimation(e,t,s,i){s.animationTimer+=e;const n=s.animationState;let a;if(n==="spawn"||n==="despawn"?a=g.SPAWN_ANIMATION_SPEED:n==="hit"?a=g.HIT_ANIMATION_SPEED:a=g.ANIMATION_SPEED,s.animationTimer<a)return;s.animationTimer-=a;const o=g.ANIMATION_FRAMES[n]||1;s.animationFrame++,n==="spawn"||n==="despawn"||n==="hit"?s.animationFrame>=o&&(s.animationFrame=o-1,n==="spawn"&&(t.isSpawning=!1,t.spawnComplete=!0,s.width=g.WIDTH,s.height=g.HEIGHT),n==="despawn"&&(t.isDespawning=!1,t.despawnAnimationFinished=!0)):s.animationFrame%=o}}class _t{constructor(){}update(e,{entityManager:t}){const s=t.query([S,M,T,H,C]);for(const i of s){const n=t.getComponent(i,M),a=t.getComponent(i,T),o=t.getComponent(i,S),l=t.getComponent(i,H),h=t.getComponent(i,C);if(o.isSpawning||o.isDespawning){n.vx=0,n.vy=0,o.activeSurfaceSound&&(c.publish("stopSoundLoop",{key:o.activeSurfaceSound}),o.activeSurfaceSound=null);continue}this._applyHorizontalMovement(e,l,n,a,o),this._applyVerticalMovement(e,n,a,o),this._updateSurfaceEffects(e,h,n,a,o)}}_applyHorizontalMovement(e,t,s,i,n){if(n.isDashing||n.isHit){n.isHit&&(s.vx=0);return}if(i.isGrounded&&i.groundType==="ice"){const a=g.ICE_ACCELERATION,o=g.ICE_FRICTION;t.moveLeft?s.vx-=a*e:t.moveRight?s.vx+=a*e:s.vx>0?(s.vx-=o*e,s.vx<0&&(s.vx=0)):s.vx<0&&(s.vx+=o*e,s.vx>0&&(s.vx=0)),s.vx=Math.max(-n.speed,Math.min(n.speed,s.vx))}else{const a=n.speed*(i.isGrounded&&i.groundType==="sand"?g.SAND_MOVE_MULTIPLIER:1);t.moveLeft?s.vx=-a:t.moveRight?s.vx=a:s.vx=0}}_applyVerticalMovement(e,t,s,i){!s.isGrounded&&!i.isDashing&&!i.isHit&&!i.isSpawning&&(t.vy+=g.GRAVITY*e),s.isAgainstWall&&!s.isGrounded&&(t.vy=Math.min(t.vy,30)),t.vy=Math.min(t.vy,g.MAX_FALL_SPEED)}_updateSurfaceEffects(e,t,s,i,n){const a=i.isGrounded&&Math.abs(s.vx)>1&&!n.isDashing&&!n.isHit,o=a?{sand:"sand_walk",mud:"mud_run",ice:"ice_run"}[i.groundType]:null;if(o!==n.activeSurfaceSound&&(n.activeSurfaceSound&&c.publish("stopSoundLoop",{key:n.activeSurfaceSound}),o&&c.publish("startSoundLoop",{key:o,channel:"SFX"}),n.activeSurfaceSound=o),a){n.surfaceParticleTimer+=e;const l=i.groundType==="sand"||i.groundType==="mud"?.1:.15;if(n.surfaceParticleTimer>=l){n.surfaceParticleTimer=0;let h;switch(i.groundType){case"sand":h="sand";break;case"mud":h="mud";break;case"ice":h="ice";break;default:i.groundType&&(h="walk_dust");break}h&&c.publish("createParticles",{x:t.x+i.width/2,y:t.y+i.height,type:h})}}}}class Ct{constructor(e,t,s,i,n){this.ctx=e,this.canvas=t,this.assets=s,this.fontRenderer=n,this.lastFrameTime=0,this.keybinds=i,this.isRunning=!1,this.gameHasStarted=!1,this.pauseForMenu=!1,this.entityManager=new Le,this.lastCheckpoint=null,this.fruitsAtLastCheckpoint=new Set,this.playerEntityId=null,this.camera=new it(t.width,t.height),this.hud=new ot(t,this.fontRenderer),this.soundManager=new at,this.soundManager.loadSounds(s),this.renderer=new lt(e,t,s),this.gameState=new le,c.publish("gameStateUpdated",this.gameState),this.levelManager=new ft(this.gameState),this.inputSystemProcessor=new xt,this.playerStateSystem=new wt,this.movementSystem=new _t,this.collisionSystem=new rt,this.gameplaySystem=new St,this.particleSystem=new gt(s),this.uiSystem=new yt(t,s),this.systems=[this.inputSystemProcessor,this.playerStateSystem,this.movementSystem,this.collisionSystem,this.particleSystem,this.uiSystem],this.levelStartTime=0,this.levelTime=0,this.currentLevel=null,this.collectedFruits=[],this._setupEventSubscriptions()}_setupEventSubscriptions(){c.subscribe("requestStartGame",()=>this.loadLevel(this.gameState.currentSection,this.gameState.currentLevelIndex)),c.subscribe("requestLevelLoad",({sectionIndex:e,levelIndex:t})=>this.loadLevel(e,t)),c.subscribe("requestLevelRestart",()=>this.loadLevel(this.gameState.currentSection,this.gameState.currentLevelIndex)),c.subscribe("keybindsUpdated",e=>this.updateKeybinds(e)),c.subscribe("fruitCollected",e=>this._onFruitCollected(e)),c.subscribe("playerTookDamage",e=>this._onPlayerTookDamage(e)),c.subscribe("trophyCollision",()=>this._onTrophyCollision()),c.subscribe("checkpointActivated",e=>this._onCheckpointActivated(e)),c.subscribe("playerDied",()=>this._onPlayerDied()),c.subscribe("characterUpdated",e=>this.updatePlayerCharacter(e)),c.subscribe("menuOpened",()=>{this.pauseForMenu=!0,this.pause()}),c.subscribe("allMenusClosed",()=>{this.pauseForMenu=!1,this.resume()}),c.subscribe("gameStateUpdated",e=>this.gameState=e)}updatePlayerCharacter(e){if(this.playerEntityId===null)return;const t=this.entityManager.getComponent(this.playerEntityId,we);t&&(t.characterId=e||this.gameState.selectedCharacter)}updateKeybinds(e){this.keybinds={...e}}start(){this.isRunning||(this.isRunning=!0,this.gameHasStarted=!0,this.lastFrameTime=performance.now(),c.publish("gameStarted"),c.publish("gameResumed"),this.gameLoop())}stop(){this.isRunning=!1,this.soundManager.stopAll()}pause(){if(!this.isRunning)return;this.isRunning=!1,this.soundManager.stopAll({except:["UI"]});const e=this.entityManager.getComponent(this.playerEntityId,S);e&&(e.needsRespawn=!1),c.publish("gamePaused")}resume(){if(this.pauseForMenu||this.isRunning||!this.gameHasStarted||this.gameState.showingLevelComplete)return;this.isRunning=!0,this.lastFrameTime=performance.now(),c.publish("gameResumed"),this.gameLoop();const e=this.entityManager.getComponent(this.playerEntityId,S);e&&(e.needsRespawn=!1)}gameLoop(e=performance.now()){if(!this.isRunning)return;const t=Math.min((e-this.lastFrameTime)/1e3,.016);this.lastFrameTime=e,this.update(t),this.render(t),requestAnimationFrame(s=>this.gameLoop(s))}loadLevel(e,t){this.levelManager.gameState=this.gameState;const s=this.levelManager.loadLevel(e,t);if(!s){this.stop();return}this.currentLevel=s,this.pauseForMenu=!1;const i=new le(this.gameState);i.showingLevelComplete=!1,i.currentSection=e,i.currentLevelIndex=t,this.gameState=i,this.gameState.incrementAttempts(e,t),c.publish("gameStateUpdated",this.gameState),this.collectedFruits=[],this.lastCheckpoint=null,this.fruitsAtLastCheckpoint.clear(),this.soundManager.stopAll(),this.entityManager=new Le,this.playerEntityId=bt(this.entityManager,this.currentLevel.startPosition.x,this.currentLevel.startPosition.y,this.gameState.selectedCharacter),this.camera.updateLevelBounds(this.currentLevel.width,this.currentLevel.height),this.camera.snapToPlayer(this.entityManager,this.playerEntityId),this.levelStartTime=performance.now(),this.gameHasStarted?this.resume():this.start(),c.publish("levelLoaded",{gameState:this.gameState})}update(e){if(!this.currentLevel)return;this.isRunning&&!this.gameState.showingLevelComplete&&(this.levelTime=(performance.now()-this.levelStartTime)/1e3),this.camera.update(this.entityManager,this.playerEntityId,e);const t={entityManager:this.entityManager,playerEntityId:this.playerEntityId,level:this.currentLevel,camera:this.camera,isRunning:this.isRunning,gameState:this.gameState,keybinds:this.keybinds,dt:e};for(const n of this.systems)n.update(e,t);const s=this.entityManager.getComponent(this.playerEntityId,S);s&&s.needsRespawn&&!this.gameState.showingLevelComplete&&this.isRunning&&this._respawnPlayer(),this.currentLevel.update(e,this.entityManager,this.playerEntityId,c);for(let n=this.collectedFruits.length-1;n>=0;n--){const a=this.collectedFruits[n];a.frameTimer+=e,a.frameTimer>=a.frameSpeed&&(a.frameTimer=0,a.frame++,a.frame>=a.collectedFrameCount&&this.collectedFruits.splice(n,1))}if(s&&s.despawnAnimationFinished&&!this.gameState.showingLevelComplete){s.despawnAnimationFinished=!1;const n={deaths:s.deathCount,time:this.levelTime},a=this.gameState.onLevelComplete(n);a!==this.gameState&&(this.gameState=a,c.publish("gameStateUpdated",this.gameState),this.pause(),c.publish("levelComplete",{deaths:n.deaths,time:n.time,hasNextLevel:this.levelManager.hasNextLevel(),hasPreviousLevel:this.levelManager.hasPreviousLevel()}))}const i=this.entityManager.getComponent(this.playerEntityId,q);c.publish("statsUpdated",{levelName:this.currentLevel.name,collectedFruits:this.currentLevel.getFruitCount(),totalFruits:this.currentLevel.getTotalFruitCount(),deathCount:s?s.deathCount:0,levelTime:this.levelTime,health:i?i.currentHealth:100,maxHealth:i?i.maxHealth:100})}_onPlayerTookDamage({amount:e}){const t=this.entityManager.getComponent(this.playerEntityId,q),s=this.entityManager.getComponent(this.playerEntityId,S);t&&s&&!s.isHit&&!s.needsRespawn&&(t.currentHealth=Math.max(0,t.currentHealth-e),this.camera.shake(8,.3),t.currentHealth<=0&&this._onPlayerDied())}_onPlayerDied(){const e=this.entityManager.getComponent(this.playerEntityId,S);if(e&&!e.needsRespawn){const t=this.entityManager.getComponent(this.playerEntityId,M),s=this.entityManager.getComponent(this.playerEntityId,P),i=this.entityManager.getComponent(this.playerEntityId,L);e.needsRespawn=!0,e.deathCount++,t.vx=0,t.vy=0,e.isHit=!0,s.currentState="hit",i.animationState="hit",i.animationFrame=0,i.animationTimer=0,c.publish("playSound",{key:"death_sound",volume:.3,channel:"SFX"})}}_respawnPlayer(){const e=this.lastCheckpoint||this.currentLevel.startPosition;this.lastCheckpoint?this.currentLevel.fruits.forEach((d,u)=>d.collected=this.fruitsAtLastCheckpoint.has(u)):this.currentLevel.fruits.forEach(d=>d.collected=!1),this.currentLevel.recalculateCollectedFruits();const t=this.entityManager.getComponent(this.playerEntityId,C),s=this.entityManager.getComponent(this.playerEntityId,M),i=this.entityManager.getComponent(this.playerEntityId,S),n=this.entityManager.getComponent(this.playerEntityId,L),a=this.entityManager.getComponent(this.playerEntityId,T),o=this.entityManager.getComponent(this.playerEntityId,P),l=this.entityManager.getComponent(this.playerEntityId,q);t.x=e.x,t.y=e.y,s.vx=0,s.vy=0,l&&(l.currentHealth=l.maxHealth),i.activeSurfaceSound&&c.publish("stopSoundLoop",{key:i.activeSurfaceSound});const h=i.deathCount;Object.assign(i,new S),i.deathCount=h,i.needsRespawn=!1,o.currentState="spawn",n.animationState="spawn",n.animationFrame=0,n.animationTimer=0,n.direction="right",n.width=g.SPAWN_WIDTH,n.height=g.SPAWN_HEIGHT,a.isGrounded=!1,a.isAgainstWall=!1,a.groundType=null,this.camera.shake(15,.5),c.publish("playerRespawned")}_onFruitCollected(e){this.currentLevel.collectFruit(e),c.publish("playSound",{key:"collect",volume:.8,channel:"SFX"}),this.collectedFruits.push({x:e.x,y:e.y,size:e.size,frame:0,frameSpeed:.1,frameTimer:0,collectedFrameCount:6});const t=this.entityManager.getComponent(this.playerEntityId,q);t&&t.currentHealth<t.maxHealth&&(t.currentHealth=Math.min(t.maxHealth,t.currentHealth+10))}_onCheckpointActivated(e){e.state="activating",this.lastCheckpoint={x:e.x,y:e.y-e.size/2},c.publish("playSound",{key:"checkpoint_activated",volume:1,channel:"UI"}),this.fruitsAtLastCheckpoint.clear(),this.currentLevel.fruits.forEach((t,s)=>{t.collected&&this.fruitsAtLastCheckpoint.add(s)}),this.currentLevel.checkpoints.forEach(t=>{t!==e&&t.state==="active"&&(t.state="inactive",t.frame=0)})}_onTrophyCollision(){const e=this.entityManager.getComponent(this.playerEntityId,S),t=this.entityManager.getComponent(this.playerEntityId,L),s=this.entityManager.getComponent(this.playerEntityId,P);e&&!e.isDespawning&&(this.currentLevel.trophy.acquired=!0,this.camera.shake(8,.3),e.isDespawning=!0,t.animationState="despawn",s.currentState="despawn",t.animationFrame=0,t.animationTimer=0,t.width=g.SPAWN_WIDTH,t.height=g.SPAWN_HEIGHT)}render(e){this.currentLevel&&(this.ctx.clearRect(0,0,this.canvas.width,this.canvas.height),this.renderer.drawScrollingBackground(this.currentLevel,e),this.renderer.renderScene(this.camera,this.currentLevel,this.entityManager,this.collectedFruits),this.particleSystem.render(this.ctx,this.camera),this.hud.drawGameHUD(this.ctx),this.uiSystem.render(this.ctx,this.isRunning))}}function kt(r,e,t,s=!0){const i=document.createElement("canvas");i.width=r,i.height=e;const n=i.getContext("2d");return n.fillStyle=t,n.fillRect(0,0,r,e),s&&(n.fillStyle="rgba(0, 0, 0, 0.1)",n.fillRect(0,0,r/2,e/2),n.fillRect(r/2,e/2,r/2,e/2)),i}function Ie(r,e){return new Promise(t=>{const s=new Image,i=1e4;let n=!1;const a=()=>{if(n)return;n=!0,console.warn(`Failed or timed out loading image: ${r}. Using fallback.`);let l="#808080";e.includes("player")?l="#ff8c21":e.includes("fruit")&&(l="#FF6B6B");const h=kt(32,32,l),d=new Image;d.src=h.toDataURL(),d.onload=()=>t(d)},o=setTimeout(a,i);s.onload=()=>{n||(clearTimeout(o),t(s))},s.onerror=()=>{clearTimeout(o),a()},s.crossOrigin="anonymous",s.src=r})}function $t(r,e){return new Promise(t=>{const s=new Audio,i=1e4;let n=!1;const a=()=>{if(n)return;n=!0,console.warn(`Failed or timed out loading sound: ${r}. Using silent fallback.`);const l=new Audio("data:audio/wav;base64,UklGRigAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA=");t(l)},o=setTimeout(a,i);s.addEventListener("canplaythrough",()=>{n||(clearTimeout(o),t(s))}),s.addEventListener("error",()=>{clearTimeout(o),a()}),s.crossOrigin="anonymous",s.preload="auto",s.src=r,s.load()})}function Tt(r){return fetch(r).then(e=>{if(!e.ok)throw new Error(`Failed to fetch level: ${r}, status: ${e.status}`);return e.json()}).catch(e=>(console.error(`Error loading JSON from ${r}:`,e),null))}const ve={PinkMan:{path:"/assets/MainCharacters/PinkMan/"},NinjaFrog:{path:"/assets/MainCharacters/NinjaFrog/"},MaskDude:{path:"/assets/MainCharacters/MaskDude/"},VirtualGuy:{path:"/assets/MainCharacters/VirtualGuy/"}},Me={playerJump:"jump.png",playerDoubleJump:"double_jump.png",playerIdle:"idle.png",playerRun:"run.png",playerFall:"fall.png",playerDash:"dash.png",playerCling:"wall_jump.png",playerHit:"hit.png"};async function At(){const r={font_spritesheet:"/assets/Menu/Text/Text (White) (8x10).png",settings_icon:"/assets/Menu/Buttons/Settings.png",pause_icon:"/assets/Menu/Buttons/Pause.png",play_icon:"/assets/Menu/Buttons/Play.png",levels_icon:"/assets/Menu/Buttons/Levels.png",character_icon:"/assets/Menu/Buttons/Character.png",info_icon:"/assets/Menu/Buttons/Info.png",background_blue:"/assets/Background/Blue.png",background_brown:"/assets/Background/Brown.png",background_gray:"/assets/Background/Gray.png",background_green:"/assets/Background/Green.png",background_pink:"/assets/Background/Pink.png",background_purple:"/assets/Background/Purple.png",background_red:"/assets/Background/Red.png",background_yellow:"/assets/Background/Yellow.png",block:"/assets/Terrain/Terrain.png",playerAppear:"/assets/MainCharacters/Appearing.png",playerDisappear:"/assets/MainCharacters/Disappearing.png",fruit_apple:"/assets/Items/Fruits/Apple.png",fruit_bananas:"/assets/Items/Fruits/Bananas.png",fruit_cherries:"/assets/Items/Fruits/Cherries.png",fruit_kiwi:"/assets/Items/Fruits/Kiwi.png",fruit_melon:"/assets/Items/Fruits/Melon.png",fruit_orange:"/assets/Items/Fruits/Orange.png",fruit_pineapple:"/assets/Items/Fruits/Pineapple.png",fruit_strawberry:"/assets/Items/Fruits/Strawberry.png",fruit_collected:"/assets/Items/Fruits/Collected.png",checkpoint_inactive:"/assets/Items/Checkpoints/Checkpoint/Checkpoint (No Flag).png",checkpoint_activation:"/assets/Items/Checkpoints/Checkpoint/Checkpoint (Flag Out).png",checkpoint_active:"/assets/Items/Checkpoints/Checkpoint/Checkpoint (Flag Idle).png",trophy:"/assets/Items/Checkpoints/End/End (Pressed).png",spike_two:"/assets/Traps/Spikes/Two.png",fire_off:"/assets/Traps/Fire/off.png",fire_hit:"/assets/Traps/Fire/hit.png",fire_on:"/assets/Traps/Fire/on.png",spiked_ball_chain:"/assets/Traps/Spiked Ball/Chain.png",spiked_ball:"/assets/Traps/Spiked Ball/Spiked Ball.png",sand_mud_ice:"/assets/Traps/Sand Mud Ice/Sand Mud Ice.png",trampoline_idle:"/assets/Traps/Trampoline/Idle.png",trampoline_jump:"/assets/Traps/Trampoline/Jump.png",dust_particle:"/assets/Other/Dust Particle.png",ice_particle:"/assets/Traps/Sand Mud Ice/Ice Particle.png",sand_particle:"/assets/Traps/Sand Mud Ice/Sand Particle.png",mud_particle:"/assets/Traps/Sand Mud Ice/Mud Particle.png"},e={button_click:"/assets/Sounds/Button Click.mp3",jump:"/assets/Sounds/Player Jump.mp3",double_jump:"/assets/Sounds/Player Double Jump.mp3",collect:"/assets/Sounds/Fruit Collect.mp3",level_complete:"/assets/Sounds/Level Complete.mp3",death_sound:"/assets/Sounds/Death.mp3",dash:"/assets/Sounds/Whoosh.mp3",checkpoint_activated:"/assets/Sounds/Checkpoint (Activation).mp3",hit:"/assets/Sounds/Hit.mp3",sand_walk:"/assets/Sounds/Sand Walk.mp3",mud_run:"/assets/Sounds/Mud Run.mp3",ice_run:"/assets/Sounds/Ice Run.mp3",trampoline_bounce:"/assets/Sounds/Boing.mp3",fire_activated:"assets/Sounds/Fire (Activated).mp3"};console.log("Starting asset loading...");const t=Object.entries(r).map(([o,l])=>Ie(l,o).then(h=>({[o]:h}))),s=Object.entries(e).map(([o,l])=>$t(l).then(h=>({[o]:h}))),i=[];for(const o in ve)for(const l in Me){const h=ve[o].path+Me[l],d=Ie(h,`${o}-${l}`).then(u=>({type:"character",charKey:o,spriteKey:l,img:u}));i.push(d)}const n=[];E.forEach((o,l)=>{o.levels.forEach((h,d)=>{h.jsonPath&&n.push(Tt(h.jsonPath).then(u=>({data:u,sectionIndex:l,levelIndex:d,type:"level"})))})});const a=[...t,...s,...i,...n];try{const o=await Promise.all(a),l={characters:{}};for(const h in ve)l.characters[h]={};for(const h of o)h&&(h.type==="character"?l.characters[h.charKey][h.spriteKey]=h.img:h.type==="level"?E[h.sectionIndex].levels[h.levelIndex]=h.data:Object.assign(l,h));return console.log("All assets and level data processed. Available assets:",Object.keys(l).length),l}catch(o){throw console.error("A critical error occurred during asset loading:",o),o}}class Et{constructor(){this.init()}init(){window.addEventListener("keydown",this.handleKeyDown.bind(this)),window.addEventListener("keyup",this.handleKeyUp.bind(this)),window.addEventListener("contextmenu",e=>e.preventDefault())}handleKeyDown(e){const t=e.key.toLowerCase();c.publish("key_down",{key:t,rawEvent:e});const s={enter:"confirm",r:"restart",n:"next",p:"previous",escape:"escape_pressed"};t===" "&&c.publish("action_confirm_pressed");const i=s[t];i&&c.publish(`action_${i}`)}handleKeyUp(e){const t=e.key.toLowerCase();c.publish("key_up",{key:t,rawEvent:e})}}const Re={A:{x:0,y:0},B:{x:8,y:0},C:{x:16,y:0},D:{x:24,y:0},E:{x:32,y:0},F:{x:40,y:0},G:{x:48,y:0},H:{x:56,y:0},I:{x:64,y:0},J:{x:72,y:0},K:{x:0,y:10},L:{x:8,y:10},M:{x:16,y:10},N:{x:24,y:10},O:{x:32,y:10},P:{x:40,y:10},Q:{x:48,y:10},R:{x:56,y:10},S:{x:64,y:10},T:{x:72,y:10},U:{x:0,y:20},V:{x:8,y:20},W:{x:16,y:20},X:{x:24,y:20},Y:{x:32,y:20},Z:{x:40,y:20},0:{x:0,y:30},1:{x:8,y:30},2:{x:16,y:30},3:{x:24,y:30},4:{x:32,y:30},5:{x:40,y:30},6:{x:48,y:30},7:{x:56,y:30},8:{x:64,y:30},9:{x:72,y:30},".":{x:0,y:40},",":{x:8,y:40},":":{x:16,y:40},"?":{x:24,y:40},"!":{x:32,y:40},"(":{x:40,y:40},")":{x:48,y:40},"+":{x:56,y:40},"-":{x:64,y:40},"/":{x:48,y:20}," ":{x:0,y:0,space:!0},"%":{x:56,y:20},"'":{x:64,y:20},"&":{x:72,y:20}},A=8,j=10;class Lt{constructor(e){this.sprite=e,this.sprite||console.error("Font spritesheet not provided to FontRenderer!"),this.characterCache=new Map}_getCachedCharacter(e,t){const s=`${e}_${t}`;if(this.characterCache.has(s))return this.characterCache.get(s);const i=Re[e];if(!i)return null;const n=document.createElement("canvas");n.width=A,n.height=j;const a=n.getContext("2d");return a.imageSmoothingEnabled=!1,a.drawImage(this.sprite,i.x,i.y,A,j,0,0,A,j),a.globalCompositeOperation="source-in",a.fillStyle=t,a.fillRect(0,0,A,j),this.characterCache.set(s,n),n}_renderText(e,t,s,i,{scale:n=1,color:a=null}={}){if(!this.sprite)return;const o=t.toUpperCase();let l=s;e.imageSmoothingEnabled=!1;for(const h of o){const d=Re[h];if(!d){l+=A*n;continue}if(d.space){l+=A*n;continue}let u,p=d.x,f=d.y;a?(u=this._getCachedCharacter(h,a),p=0,f=0):u=this.sprite,u&&e.drawImage(u,p,f,A,j,l,i,A*n,j*n),l+=A*n}}drawText(e,t,s,i,{scale:n=1,align:a="left",color:o="white",outlineColor:l=null,outlineWidth:h=1}={}){const d=this.getTextWidth(t,n);let u=s;if(a==="center"?u=s-d/2:a==="right"&&(u=s-d),l){const p={scale:n,color:l};this._renderText(e,t,u-h,i,p),this._renderText(e,t,u+h,i,p),this._renderText(e,t,u,i-h,p),this._renderText(e,t,u,i+h,p)}this._renderText(e,t,u,i,{scale:n,color:o})}getTextWidth(e,t=1){return e.length*A*t}renderTextToCanvas(e,t){if(!this.sprite)return null;const s=t.outlineColor&&t.outlineWidth?t.outlineWidth*2:0,i=this.getTextWidth(e,t.scale),n=j*t.scale,a=document.createElement("canvas");a.width=i+s,a.height=n+s;const o=a.getContext("2d"),l={...t,align:"left"};return this.drawText(o,e,s/2,s/2,l),a}}/**
 * @license
 * Copyright 2019 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */const re=globalThis,_e=re.ShadowRoot&&(re.ShadyCSS===void 0||re.ShadyCSS.nativeShadow)&&"adoptedStyleSheets"in Document.prototype&&"replace"in CSSStyleSheet.prototype,Ce=Symbol(),Pe=new WeakMap;let Ge=class{constructor(e,t,s){if(this._$cssResult$=!0,s!==Ce)throw Error("CSSResult is not constructable. Use `unsafeCSS` or `css` instead.");this.cssText=e,this.t=t}get styleSheet(){let e=this.o;const t=this.t;if(_e&&e===void 0){const s=t!==void 0&&t.length===1;s&&(e=Pe.get(t)),e===void 0&&((this.o=e=new CSSStyleSheet).replaceSync(this.cssText),s&&Pe.set(t,e))}return e}toString(){return this.cssText}};const It=r=>new Ge(typeof r=="string"?r:r+"",void 0,Ce),I=(r,...e)=>{const t=r.length===1?r[0]:e.reduce((s,i,n)=>s+(a=>{if(a._$cssResult$===!0)return a.cssText;if(typeof a=="number")return a;throw Error("Value passed to 'css' function must be a 'css' function result: "+a+". Use 'unsafeCSS' to pass non-literal values, but take care to ensure page security.")})(i)+r[n+1],r[0]);return new Ge(t,r,Ce)},Mt=(r,e)=>{if(_e)r.adoptedStyleSheets=e.map(t=>t instanceof CSSStyleSheet?t:t.styleSheet);else for(const t of e){const s=document.createElement("style"),i=re.litNonce;i!==void 0&&s.setAttribute("nonce",i),s.textContent=t.cssText,r.appendChild(s)}},Fe=_e?r=>r:r=>r instanceof CSSStyleSheet?(e=>{let t="";for(const s of e.cssRules)t+=s.cssText;return It(t)})(r):r;/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */const{is:Rt,defineProperty:Pt,getOwnPropertyDescriptor:Ft,getOwnPropertyNames:jt,getOwnPropertySymbols:Ot,getPrototypeOf:Dt}=Object,de=globalThis,je=de.trustedTypes,Ht=je?je.emptyScript:"",Ut=de.reactiveElementPolyfillSupport,Q=(r,e)=>r,Se={toAttribute(r,e){switch(e){case Boolean:r=r?Ht:null;break;case Object:case Array:r=r==null?r:JSON.stringify(r)}return r},fromAttribute(r,e){let t=r;switch(e){case Boolean:t=r!==null;break;case Number:t=r===null?null:Number(r);break;case Object:case Array:try{t=JSON.parse(r)}catch{t=null}}return t}},Xe=(r,e)=>!Rt(r,e),Oe={attribute:!0,type:String,converter:Se,reflect:!1,useDefault:!1,hasChanged:Xe};Symbol.metadata??=Symbol("metadata"),de.litPropertyMetadata??=new WeakMap;let W=class extends HTMLElement{static addInitializer(e){this._$Ei(),(this.l??=[]).push(e)}static get observedAttributes(){return this.finalize(),this._$Eh&&[...this._$Eh.keys()]}static createProperty(e,t=Oe){if(t.state&&(t.attribute=!1),this._$Ei(),this.prototype.hasOwnProperty(e)&&((t=Object.create(t)).wrapped=!0),this.elementProperties.set(e,t),!t.noAccessor){const s=Symbol(),i=this.getPropertyDescriptor(e,s,t);i!==void 0&&Pt(this.prototype,e,i)}}static getPropertyDescriptor(e,t,s){const{get:i,set:n}=Ft(this.prototype,e)??{get(){return this[t]},set(a){this[t]=a}};return{get:i,set(a){const o=i?.call(this);n?.call(this,a),this.requestUpdate(e,o,s)},configurable:!0,enumerable:!0}}static getPropertyOptions(e){return this.elementProperties.get(e)??Oe}static _$Ei(){if(this.hasOwnProperty(Q("elementProperties")))return;const e=Dt(this);e.finalize(),e.l!==void 0&&(this.l=[...e.l]),this.elementProperties=new Map(e.elementProperties)}static finalize(){if(this.hasOwnProperty(Q("finalized")))return;if(this.finalized=!0,this._$Ei(),this.hasOwnProperty(Q("properties"))){const t=this.properties,s=[...jt(t),...Ot(t)];for(const i of s)this.createProperty(i,t[i])}const e=this[Symbol.metadata];if(e!==null){const t=litPropertyMetadata.get(e);if(t!==void 0)for(const[s,i]of t)this.elementProperties.set(s,i)}this._$Eh=new Map;for(const[t,s]of this.elementProperties){const i=this._$Eu(t,s);i!==void 0&&this._$Eh.set(i,t)}this.elementStyles=this.finalizeStyles(this.styles)}static finalizeStyles(e){const t=[];if(Array.isArray(e)){const s=new Set(e.flat(1/0).reverse());for(const i of s)t.unshift(Fe(i))}else e!==void 0&&t.push(Fe(e));return t}static _$Eu(e,t){const s=t.attribute;return s===!1?void 0:typeof s=="string"?s:typeof e=="string"?e.toLowerCase():void 0}constructor(){super(),this._$Ep=void 0,this.isUpdatePending=!1,this.hasUpdated=!1,this._$Em=null,this._$Ev()}_$Ev(){this._$ES=new Promise(e=>this.enableUpdating=e),this._$AL=new Map,this._$E_(),this.requestUpdate(),this.constructor.l?.forEach(e=>e(this))}addController(e){(this._$EO??=new Set).add(e),this.renderRoot!==void 0&&this.isConnected&&e.hostConnected?.()}removeController(e){this._$EO?.delete(e)}_$E_(){const e=new Map,t=this.constructor.elementProperties;for(const s of t.keys())this.hasOwnProperty(s)&&(e.set(s,this[s]),delete this[s]);e.size>0&&(this._$Ep=e)}createRenderRoot(){const e=this.shadowRoot??this.attachShadow(this.constructor.shadowRootOptions);return Mt(e,this.constructor.elementStyles),e}connectedCallback(){this.renderRoot??=this.createRenderRoot(),this.enableUpdating(!0),this._$EO?.forEach(e=>e.hostConnected?.())}enableUpdating(e){}disconnectedCallback(){this._$EO?.forEach(e=>e.hostDisconnected?.())}attributeChangedCallback(e,t,s){this._$AK(e,s)}_$ET(e,t){const s=this.constructor.elementProperties.get(e),i=this.constructor._$Eu(e,s);if(i!==void 0&&s.reflect===!0){const n=(s.converter?.toAttribute!==void 0?s.converter:Se).toAttribute(t,s.type);this._$Em=e,n==null?this.removeAttribute(i):this.setAttribute(i,n),this._$Em=null}}_$AK(e,t){const s=this.constructor,i=s._$Eh.get(e);if(i!==void 0&&this._$Em!==i){const n=s.getPropertyOptions(i),a=typeof n.converter=="function"?{fromAttribute:n.converter}:n.converter?.fromAttribute!==void 0?n.converter:Se;this._$Em=i;const o=a.fromAttribute(t,n.type);this[i]=o??this._$Ej?.get(i)??o,this._$Em=null}}requestUpdate(e,t,s){if(e!==void 0){const i=this.constructor,n=this[e];if(s??=i.getPropertyOptions(e),!((s.hasChanged??Xe)(n,t)||s.useDefault&&s.reflect&&n===this._$Ej?.get(e)&&!this.hasAttribute(i._$Eu(e,s))))return;this.C(e,t,s)}this.isUpdatePending===!1&&(this._$ES=this._$EP())}C(e,t,{useDefault:s,reflect:i,wrapped:n},a){s&&!(this._$Ej??=new Map).has(e)&&(this._$Ej.set(e,a??t??this[e]),n!==!0||a!==void 0)||(this._$AL.has(e)||(this.hasUpdated||s||(t=void 0),this._$AL.set(e,t)),i===!0&&this._$Em!==e&&(this._$Eq??=new Set).add(e))}async _$EP(){this.isUpdatePending=!0;try{await this._$ES}catch(t){Promise.reject(t)}const e=this.scheduleUpdate();return e!=null&&await e,!this.isUpdatePending}scheduleUpdate(){return this.performUpdate()}performUpdate(){if(!this.isUpdatePending)return;if(!this.hasUpdated){if(this.renderRoot??=this.createRenderRoot(),this._$Ep){for(const[i,n]of this._$Ep)this[i]=n;this._$Ep=void 0}const s=this.constructor.elementProperties;if(s.size>0)for(const[i,n]of s){const{wrapped:a}=n,o=this[i];a!==!0||this._$AL.has(i)||o===void 0||this.C(i,void 0,n,o)}}let e=!1;const t=this._$AL;try{e=this.shouldUpdate(t),e?(this.willUpdate(t),this._$EO?.forEach(s=>s.hostUpdate?.()),this.update(t)):this._$EM()}catch(s){throw e=!1,this._$EM(),s}e&&this._$AE(t)}willUpdate(e){}_$AE(e){this._$EO?.forEach(t=>t.hostUpdated?.()),this.hasUpdated||(this.hasUpdated=!0,this.firstUpdated(e)),this.updated(e)}_$EM(){this._$AL=new Map,this.isUpdatePending=!1}get updateComplete(){return this.getUpdateComplete()}getUpdateComplete(){return this._$ES}shouldUpdate(e){return!0}update(e){this._$Eq&&=this._$Eq.forEach(t=>this._$ET(t,this[t])),this._$EM()}updated(e){}firstUpdated(e){}};W.elementStyles=[],W.shadowRootOptions={mode:"open"},W[Q("elementProperties")]=new Map,W[Q("finalized")]=new Map,Ut?.({ReactiveElement:W}),(de.reactiveElementVersions??=[]).push("2.1.1");/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */const ke=globalThis,he=ke.trustedTypes,De=he?he.createPolicy("lit-html",{createHTML:r=>r}):void 0,Ve="$lit$",R=`lit$${Math.random().toFixed(9).slice(2)}$`,Ke="?"+R,Nt=`<${Ke}>`,U=document,ee=()=>U.createComment(""),te=r=>r===null||typeof r!="object"&&typeof r!="function",$e=Array.isArray,zt=r=>$e(r)||typeof r?.[Symbol.iterator]=="function",xe=`[ 	
\f\r]`,Y=/<(?:(!--|\/[^a-zA-Z])|(\/?[a-zA-Z][^>\s]*)|(\/?$))/g,He=/-->/g,Ue=/>/g,O=RegExp(`>|${xe}(?:([^\\s"'>=/]+)(${xe}*=${xe}*(?:[^ 	
\f\r"'\`<>=]|("|')|))|$)`,"g"),Ne=/'/g,ze=/"/g,Ye=/^(?:script|style|textarea|title)$/i,Bt=r=>(e,...t)=>({_$litType$:r,strings:e,values:t}),m=Bt(1),G=Symbol.for("lit-noChange"),w=Symbol.for("lit-nothing"),Be=new WeakMap,D=U.createTreeWalker(U,129);function qe(r,e){if(!$e(r)||!r.hasOwnProperty("raw"))throw Error("invalid template strings array");return De!==void 0?De.createHTML(e):e}const Wt=(r,e)=>{const t=r.length-1,s=[];let i,n=e===2?"<svg>":e===3?"<math>":"",a=Y;for(let o=0;o<t;o++){const l=r[o];let h,d,u=-1,p=0;for(;p<l.length&&(a.lastIndex=p,d=a.exec(l),d!==null);)p=a.lastIndex,a===Y?d[1]==="!--"?a=He:d[1]!==void 0?a=Ue:d[2]!==void 0?(Ye.test(d[2])&&(i=RegExp("</"+d[2],"g")),a=O):d[3]!==void 0&&(a=O):a===O?d[0]===">"?(a=i??Y,u=-1):d[1]===void 0?u=-2:(u=a.lastIndex-d[2].length,h=d[1],a=d[3]===void 0?O:d[3]==='"'?ze:Ne):a===ze||a===Ne?a=O:a===He||a===Ue?a=Y:(a=O,i=void 0);const f=a===O&&r[o+1].startsWith("/>")?" ":"";n+=a===Y?l+Nt:u>=0?(s.push(h),l.slice(0,u)+Ve+l.slice(u)+R+f):l+R+(u===-2?o:f)}return[qe(r,n+(r[t]||"<?>")+(e===2?"</svg>":e===3?"</math>":"")),s]};class se{constructor({strings:e,_$litType$:t},s){let i;this.parts=[];let n=0,a=0;const o=e.length-1,l=this.parts,[h,d]=Wt(e,t);if(this.el=se.createElement(h,s),D.currentNode=this.el.content,t===2||t===3){const u=this.el.content.firstChild;u.replaceWith(...u.childNodes)}for(;(i=D.nextNode())!==null&&l.length<o;){if(i.nodeType===1){if(i.hasAttributes())for(const u of i.getAttributeNames())if(u.endsWith(Ve)){const p=d[a++],f=i.getAttribute(u).split(R),x=/([.?@])?(.*)/.exec(p);l.push({type:1,index:n,name:x[2],strings:f,ctor:x[1]==="."?Xt:x[1]==="?"?Vt:x[1]==="@"?Kt:ue}),i.removeAttribute(u)}else u.startsWith(R)&&(l.push({type:6,index:n}),i.removeAttribute(u));if(Ye.test(i.tagName)){const u=i.textContent.split(R),p=u.length-1;if(p>0){i.textContent=he?he.emptyScript:"";for(let f=0;f<p;f++)i.append(u[f],ee()),D.nextNode(),l.push({type:2,index:++n});i.append(u[p],ee())}}}else if(i.nodeType===8)if(i.data===Ke)l.push({type:2,index:n});else{let u=-1;for(;(u=i.data.indexOf(R,u+1))!==-1;)l.push({type:7,index:n}),u+=R.length-1}n++}}static createElement(e,t){const s=U.createElement("template");return s.innerHTML=e,s}}function X(r,e,t=r,s){if(e===G)return e;let i=s!==void 0?t._$Co?.[s]:t._$Cl;const n=te(e)?void 0:e._$litDirective$;return i?.constructor!==n&&(i?._$AO?.(!1),n===void 0?i=void 0:(i=new n(r),i._$AT(r,t,s)),s!==void 0?(t._$Co??=[])[s]=i:t._$Cl=i),i!==void 0&&(e=X(r,i._$AS(r,e.values),i,s)),e}class Gt{constructor(e,t){this._$AV=[],this._$AN=void 0,this._$AD=e,this._$AM=t}get parentNode(){return this._$AM.parentNode}get _$AU(){return this._$AM._$AU}u(e){const{el:{content:t},parts:s}=this._$AD,i=(e?.creationScope??U).importNode(t,!0);D.currentNode=i;let n=D.nextNode(),a=0,o=0,l=s[0];for(;l!==void 0;){if(a===l.index){let h;l.type===2?h=new ie(n,n.nextSibling,this,e):l.type===1?h=new l.ctor(n,l.name,l.strings,this,e):l.type===6&&(h=new Yt(n,this,e)),this._$AV.push(h),l=s[++o]}a!==l?.index&&(n=D.nextNode(),a++)}return D.currentNode=U,i}p(e){let t=0;for(const s of this._$AV)s!==void 0&&(s.strings!==void 0?(s._$AI(e,s,t),t+=s.strings.length-2):s._$AI(e[t])),t++}}class ie{get _$AU(){return this._$AM?._$AU??this._$Cv}constructor(e,t,s,i){this.type=2,this._$AH=w,this._$AN=void 0,this._$AA=e,this._$AB=t,this._$AM=s,this.options=i,this._$Cv=i?.isConnected??!0}get parentNode(){let e=this._$AA.parentNode;const t=this._$AM;return t!==void 0&&e?.nodeType===11&&(e=t.parentNode),e}get startNode(){return this._$AA}get endNode(){return this._$AB}_$AI(e,t=this){e=X(this,e,t),te(e)?e===w||e==null||e===""?(this._$AH!==w&&this._$AR(),this._$AH=w):e!==this._$AH&&e!==G&&this._(e):e._$litType$!==void 0?this.$(e):e.nodeType!==void 0?this.T(e):zt(e)?this.k(e):this._(e)}O(e){return this._$AA.parentNode.insertBefore(e,this._$AB)}T(e){this._$AH!==e&&(this._$AR(),this._$AH=this.O(e))}_(e){this._$AH!==w&&te(this._$AH)?this._$AA.nextSibling.data=e:this.T(U.createTextNode(e)),this._$AH=e}$(e){const{values:t,_$litType$:s}=e,i=typeof s=="number"?this._$AC(e):(s.el===void 0&&(s.el=se.createElement(qe(s.h,s.h[0]),this.options)),s);if(this._$AH?._$AD===i)this._$AH.p(t);else{const n=new Gt(i,this),a=n.u(this.options);n.p(t),this.T(a),this._$AH=n}}_$AC(e){let t=Be.get(e.strings);return t===void 0&&Be.set(e.strings,t=new se(e)),t}k(e){$e(this._$AH)||(this._$AH=[],this._$AR());const t=this._$AH;let s,i=0;for(const n of e)i===t.length?t.push(s=new ie(this.O(ee()),this.O(ee()),this,this.options)):s=t[i],s._$AI(n),i++;i<t.length&&(this._$AR(s&&s._$AB.nextSibling,i),t.length=i)}_$AR(e=this._$AA.nextSibling,t){for(this._$AP?.(!1,!0,t);e!==this._$AB;){const s=e.nextSibling;e.remove(),e=s}}setConnected(e){this._$AM===void 0&&(this._$Cv=e,this._$AP?.(e))}}class ue{get tagName(){return this.element.tagName}get _$AU(){return this._$AM._$AU}constructor(e,t,s,i,n){this.type=1,this._$AH=w,this._$AN=void 0,this.element=e,this.name=t,this._$AM=i,this.options=n,s.length>2||s[0]!==""||s[1]!==""?(this._$AH=Array(s.length-1).fill(new String),this.strings=s):this._$AH=w}_$AI(e,t=this,s,i){const n=this.strings;let a=!1;if(n===void 0)e=X(this,e,t,0),a=!te(e)||e!==this._$AH&&e!==G,a&&(this._$AH=e);else{const o=e;let l,h;for(e=n[0],l=0;l<n.length-1;l++)h=X(this,o[s+l],t,l),h===G&&(h=this._$AH[l]),a||=!te(h)||h!==this._$AH[l],h===w?e=w:e!==w&&(e+=(h??"")+n[l+1]),this._$AH[l]=h}a&&!i&&this.j(e)}j(e){e===w?this.element.removeAttribute(this.name):this.element.setAttribute(this.name,e??"")}}class Xt extends ue{constructor(){super(...arguments),this.type=3}j(e){this.element[this.name]=e===w?void 0:e}}class Vt extends ue{constructor(){super(...arguments),this.type=4}j(e){this.element.toggleAttribute(this.name,!!e&&e!==w)}}class Kt extends ue{constructor(e,t,s,i,n){super(e,t,s,i,n),this.type=5}_$AI(e,t=this){if((e=X(this,e,t,0)??w)===G)return;const s=this._$AH,i=e===w&&s!==w||e.capture!==s.capture||e.once!==s.once||e.passive!==s.passive,n=e!==w&&(s===w||i);i&&this.element.removeEventListener(this.name,this,s),n&&this.element.addEventListener(this.name,this,e),this._$AH=e}handleEvent(e){typeof this._$AH=="function"?this._$AH.call(this.options?.host??this.element,e):this._$AH.handleEvent(e)}}class Yt{constructor(e,t,s){this.element=e,this.type=6,this._$AN=void 0,this._$AM=t,this.options=s}get _$AU(){return this._$AM._$AU}_$AI(e){X(this,e)}}const qt=ke.litHtmlPolyfillSupport;qt?.(se,ie),(ke.litHtmlVersions??=[]).push("3.3.1");const Ze=(r,e,t)=>{const s=t?.renderBefore??e;let i=s._$litPart$;if(i===void 0){const n=t?.renderBefore??null;s._$litPart$=i=new ie(e.insertBefore(ee(),n),n,void 0,t??{})}return i._$AI(r),i};/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */const Te=globalThis;class _ extends W{constructor(){super(...arguments),this.renderOptions={host:this},this._$Do=void 0}createRenderRoot(){const e=super.createRenderRoot();return this.renderOptions.renderBefore??=e.firstChild,e}update(e){const t=this.render();this.hasUpdated||(this.renderOptions.isConnected=this.isConnected),super.update(e),this._$Do=Ze(t,this.renderRoot,this.renderOptions)}connectedCallback(){super.connectedCallback(),this._$Do?.setConnected(!0)}disconnectedCallback(){super.disconnectedCallback(),this._$Do?.setConnected(!1)}render(){return G}}_._$litElement$=!0,_.finalized=!0,Te.litElementHydrateSupport?.({LitElement:_});const Zt=Te.litElementPolyfillSupport;Zt?.({LitElement:_});(Te.litElementVersions??=[]).push("4.2.1");/**
 * @license
 * Copyright 2021 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */function*V(r,e){if(r!==void 0){let t=0;for(const s of r)yield e(s,t++)}}function Z(r){return r===" "?"SPACE":r.startsWith("arrow")?r.replace("arrow","").toUpperCase():r.toUpperCase()}function Ae(r=0){const e=Math.floor(r/60),t=r%60,s=Math.floor(t),i=Math.floor((t-s)*1e3);return`${e.toString().padStart(2,"0")}:${s.toString().padStart(2,"0")}.${i.toString().padStart(3,"0")}`}class Jt extends _{static properties={fontRenderer:{type:Object},text:{type:String},scale:{type:Number},color:{type:String},outlineColor:{type:String},outlineWidth:{type:Number},align:{type:String}};constructor(){super(),this.text="",this.scale=1,this.color="white",this.outlineColor=null,this.outlineWidth=1,this.align="left"}updated(e){super.updated(e),!(!this.fontRenderer||!this.shadowRoot)&&this.renderCanvas()}renderCanvas(){const e=this.shadowRoot.querySelector("#container");if(!e)return;const t=this.fontRenderer.renderTextToCanvas(this.text,{scale:this.scale,color:this.color,outlineColor:this.outlineColor,outlineWidth:this.outlineWidth,align:this.align});t&&(t.style.imageRendering="pixelated",e.innerHTML="",e.appendChild(t))}render(){return m`<div id="container"></div>`}}customElements.define("bitmap-text",Jt);class Qt extends _{static styles=I`
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
  `;static properties={action:{type:String},currentKey:{type:String},isRemapping:{type:Boolean,state:!0},fontRenderer:{type:Object}};constructor(){super(),this.isRemapping=!1}connectedCallback(){super.connectedCallback(),window.addEventListener("keydown",this._handleGlobalKeydown)}disconnectedCallback(){super.disconnectedCallback(),window.removeEventListener("keydown",this._handleGlobalKeydown)}_handleGlobalKeydown=e=>{if(!this.isRemapping)return;e.preventDefault(),e.stopPropagation();const t=e.key.toLowerCase();this.dispatchEvent(new CustomEvent("keybind-changed",{detail:{action:this.action,newKey:t},bubbles:!0,composed:!0})),this.isRemapping=!1};_startRemap(e){e.stopPropagation(),this.isRemapping=!0,c.publish("playSound",{key:"button_click",volume:.8,channel:"UI"})}render(){const e=this.isRemapping?"Press key...":Z(this.currentKey);return m`
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
    `}}customElements.define("keybind-display",Qt);class es extends _{static styles=I`
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
              ${V(e,t=>m`
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
    `}}customElements.define("settings-menu",es);class ts extends _{static styles=I`
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
    `}}customElements.define("pause-modal",ts);class ss extends _{static styles=I`
    :host {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    }
    .modal-overlay {
      position: fixed; inset: 0;
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
  `;static properties={gameState:{type:Object},fontRenderer:{type:Object}};_dispatchClose(){c.publish("playSound",{key:"button_click",volume:.8,channel:"UI"}),this.dispatchEvent(new CustomEvent("close-modal",{bubbles:!0,composed:!0}))}_selectLevel(e,t){this.dispatchEvent(new CustomEvent("level-selected",{detail:{sectionIndex:e,levelIndex:t},bubbles:!0,composed:!0}))}_openStatsModal(){c.publish("playSound",{key:"button_click",volume:.8,channel:"UI"}),c.publish("ui_button_clicked",{buttonId:"stats"})}render(){return this.gameState?m`
      <div class="modal-overlay" @click=${this._dispatchClose}>
        <div class="modal-content" @click=${e=>e.stopPropagation()}>
          <button class="close-button" @click=${this._dispatchClose}></button>
          
          <div class="title-container">
            <bitmap-text .fontRenderer=${this.fontRenderer} text="Levels Menu" scale="3" outlineColor="black" outlineWidth="2"></bitmap-text>
          </div>

          <!-- The new scrollable container -->
          <div class="scrollable-content">
            <div id="level-selection-container">
              ${V(E,(e,t)=>m`
                <div class="level-section-menu">
                  <div class="section-title-container">
                    <bitmap-text .fontRenderer=${this.fontRenderer} text=${e.name} scale="2"></bitmap-text>
                  </div>
                  <div class="level-grid">
                    ${V(e.levels,(s,i)=>{const n=this.gameState.isLevelUnlocked(t,i),a=this.gameState.isLevelCompleted(t,i),o=this.gameState.currentSection===t&&this.gameState.currentLevelIndex===i,l=`level-button ${a?"completed":""} ${o?"current":""} ${n?"":"locked"}`;return n?m`<button class=${l} @click=${()=>this._selectLevel(t,i)}>${i+1}</button>`:m`<button class=${l} disabled>
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
    `:m``}}customElements.define("levels-menu",ss);class is extends _{static styles=I`
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
  `;static properties={characterId:{type:String},idleSprite:{type:Object},isLocked:{type:Boolean},isSelected:{type:Boolean},fontRenderer:{type:Object}};constructor(){super(),this.animationFrameId=null,this.animState={frame:0,timer:0,lastTime:0}}connectedCallback(){super.connectedCallback(),this.animationFrameId=requestAnimationFrame(this._animatePreview)}disconnectedCallback(){super.disconnectedCallback(),this.animationFrameId&&cancelAnimationFrame(this.animationFrameId)}_animatePreview=e=>{const t=this.shadowRoot.querySelector(".char-canvas");if(!t||!this.idleSprite){this.animationFrameId=requestAnimationFrame(this._animatePreview);return}this.animState.lastTime===0&&(this.animState.lastTime=e);const s=(e-this.animState.lastTime)/1e3;this.animState.lastTime=e,this.animState.timer+=s;const i=.08,n=11,a=this.idleSprite.width/n;if(this.animState.timer>=i){this.animState.timer=0,this.animState.frame=(this.animState.frame+1)%n;const o=t.getContext("2d");o.clearRect(0,0,t.width,t.height),o.drawImage(this.idleSprite,this.animState.frame*a,0,a,this.idleSprite.height,0,0,t.width,t.height)}this.animationFrameId=requestAnimationFrame(this._animatePreview)};_handleSelect(){this.isLocked||this.isSelected||this.dispatchEvent(new CustomEvent("character-selected",{detail:{characterId:this.characterId},bubbles:!0,composed:!0}))}render(){const e=J[this.characterId],t=`character-card ${this.isLocked?"locked":""} ${this.isSelected?"selected":""}`,s=this.isLocked?"Locked":this.isSelected?"Selected":"Select";return m`
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
    `}}customElements.define("character-card",is);class ns extends _{static styles=I`
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
  `;static properties={gameState:{type:Object},assets:{type:Object},fontRenderer:{type:Object}};_dispatchClose(){c.publish("playSound",{key:"button_click",volume:.8,channel:"UI"}),this.dispatchEvent(new CustomEvent("close-modal",{bubbles:!0,composed:!0}))}render(){if(!this.gameState||!this.assets)return m`<div class="modal-overlay">Loading...</div>`;const e=Object.keys(J);return m`
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
                    ${V(e,t=>m`
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
    `}}customElements.define("character-menu",ns);class as extends _{static styles=I`
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
              <p>Beware of traps and enemies—an unknown world is full of hidden dangers.</p>
              <p><strong>Note:</strong> You cannot cling to natural surfaces like dirt, sand, mud, or ice.</p>
              <div class="keybind-list">
                
                <div class="keybind-item">
                  <label>Move Left / Right:</label>
                  <div class="key-display-container">
                    <div class="key-display">
                        <bitmap-text .fontRenderer=${this.fontRenderer} text=${Z(this.keybinds.moveLeft)} scale="1.5"></bitmap-text>
                    </div>
                    <span>/</span>
                    <div class="key-display">
                        <bitmap-text .fontRenderer=${this.fontRenderer} text=${Z(this.keybinds.moveRight)} scale="1.5"></bitmap-text>
                    </div>
                  </div>
                </div>

                <div class="keybind-item">
                  <label>Jump / Double Jump / Wall Jump:</label>
                  <div class="key-display">
                    <bitmap-text .fontRenderer=${this.fontRenderer} text=${Z(this.keybinds.jump)} scale="1.5"></bitmap-text>
                  </div>
                </div>

                <div class="keybind-item">
                  <label>Dash:</label>
                  <div class="key-display">
                    <bitmap-text .fontRenderer=${this.fontRenderer} text=${Z(this.keybinds.dash)} scale="1.5"></bitmap-text>
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
    `:m``}}customElements.define("info-modal",as);class os extends _{static styles=I`
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
    `:m``}}customElements.define("level-complete-modal",os);class rs extends _{static styles=I`
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
            ${V(E,(t,s)=>m`
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

                  ${V(t.levels,(i,n)=>{const a=`${s}-${n}`,o=e[a]||{fastestTime:null,lowestDeaths:null,totalAttempts:0};return m`
                        <div class="stat-row">
                            <div class="stat-cell level-name">Level ${n+1}</div>
                            <div class="stat-cell">${this._getStatDisplay(o.fastestTime,Ae)}</div>
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
    `}}customElements.define("stats-modal",rs);class ls extends _{static styles=I`
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
                    ></stats-modal>`;default:return m``}}}customElements.define("parkour-hero-ui",ls);const We=document.getElementById("ui-root");We?Ze(document.createElement("parkour-hero-ui"),We):console.error("UI Root element #ui-root not found. UI cannot be initialized.");const b=document.getElementById("gameCanvas"),y=b.getContext("2d");if(!b||!y)throw console.error("Canvas not found or context not available"),document.body.innerHTML="<h1>Error: Canvas not supported</h1>",new Error("Canvas not available");y.imageSmoothingEnabled=!1;const Je=1920,Qe=1080;b.width=Je;b.height=Qe;console.log(`Canvas initialized: ${Je}x${Qe}`);function et(){try{const r=1.7777777777777777,e=window.innerWidth/window.innerHeight;let t,s;e>r?(s=window.innerHeight,t=s*r):(t=window.innerWidth,s=t/r);const i=Math.floor(t),n=Math.floor(s);b.style.width=`${i}px`,b.style.height=`${n}px`,b.style.position="absolute",b.style.left=`${(window.innerWidth-i)/2}px`,b.style.top=`${(window.innerHeight-n)/2}px`,console.log(`Canvas resized to: ${i}x${n} (display size)`)}catch(r){console.error("Error resizing canvas:",r)}}window.addEventListener("resize",et);et();function hs(){y.fillStyle="#222",y.fillRect(0,0,b.width,b.height),y.fillStyle="white",y.font="24px sans-serif",y.textAlign="center",y.fillText("Loading Assets...",b.width/2,b.height/2);const r=300,e=20,t=(b.width-r)/2,s=b.height/2+30;y.strokeStyle="white",y.lineWidth=2,y.strokeRect(t,s,r,e),y.fillStyle="#4CAF50",y.fillRect(t,s,r*.1,e)}hs();let cs={moveLeft:"a",moveRight:"d",jump:"w",dash:" "},$,ds;At().then(r=>{console.log("Assets loaded successfully, preparing main menu...");try{const e=new Lt(r.font_spritesheet);$=new Ct(y,b,r,cs,e),c.publish("assetsLoaded",r);const t=document.querySelector("parkour-hero-ui");t&&(t.fontRenderer=e),ds=new Et,c.subscribe("requestStartGame",()=>{$.start()}),window.unlockAllLevels=()=>{$&&$.gameState&&($.gameState.unlockAllLevels(),c.publish("gameStateUpdated",$.gameState))},console.log("Developer command available: Type `unlockAllLevels()` in the console to unlock all levels."),window.resetProgress=()=>{$&&$.gameState&&($.gameState.resetProgress(),$.loadLevel(0,0),console.log("Game reset to Level 1."),c.publish("gameStateUpdated",$.gameState))},console.log("Developer command available: Type `resetProgress()` in the console to reset all saved data."),console.log("Game is ready. Waiting for user to start from the main menu.")}catch(e){console.error("Failed to start game engine:",e),y.fillStyle="#222",y.fillRect(0,0,b.width,b.height),y.fillStyle="red",y.font="24px sans-serif",y.textAlign="center",y.fillText("Game Failed to Start",b.width/2,b.height/2-20),y.fillStyle="white",y.font="16px sans-serif",y.fillText("Check console for details",b.width/2,b.height/2+20)}}).catch(r=>{console.error("Asset loading failed:",r),y.fillStyle="#222",y.fillRect(0,0,b.width,b.height),y.fillStyle="red",y.font="24px sans-serif",y.textAlign="center",y.fillText("Failed to Load Assets",b.width/2,b.height/2-20),y.fillStyle="white",y.font="16px sans-serif",y.fillText("Check console for details",b.width/2,b.height/2+20)});window.addEventListener("error",r=>{console.error("Global error:",r.error)});window.addEventListener("unhandledrejection",r=>{console.error("Unhandled promise rejection:",r.reason)});console.log("Game initialization started");console.log("Canvas dimensions:",b.width,"x",b.height);console.log("Device pixel ratio:",window.devicePixelRatio);console.log("User agent:",navigator.userAgent);
