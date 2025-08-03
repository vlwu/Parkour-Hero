import{e as r,l as z,c as ue,E as _e,G as we,a as H,F as Se,b as Re,g as Ce}from"./font-renderer-zQjr9ldM.js";/**
 * @license
 * Copyright 2019 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */const B=globalThis,q=B.ShadowRoot&&(B.ShadyCSS===void 0||B.ShadyCSS.nativeShadow)&&"adoptedStyleSheets"in Document.prototype&&"replace"in CSSStyleSheet.prototype,K=Symbol(),ie=new WeakMap;let me=class{constructor(e,t,i){if(this._$cssResult$=!0,i!==K)throw Error("CSSResult is not constructable. Use `unsafeCSS` or `css` instead.");this.cssText=e,this.t=t}get styleSheet(){let e=this.o;const t=this.t;if(q&&e===void 0){const i=t!==void 0&&t.length===1;i&&(e=ie.get(t)),e===void 0&&((this.o=e=new CSSStyleSheet).replaceSync(this.cssText),i&&ie.set(t,e))}return e}toString(){return this.cssText}};const Ae=o=>new me(typeof o=="string"?o:o+"",void 0,K),f=(o,...e)=>{const t=o.length===1?o[0]:e.reduce((i,s,n)=>i+(a=>{if(a._$cssResult$===!0)return a.cssText;if(typeof a=="number")return a;throw Error("Value passed to 'css' function must be a 'css' function result: "+a+". Use 'unsafeCSS' to pass non-literal values, but take care to ensure page security.")})(s)+o[n+1],o[0]);return new me(t,o,K)},Ee=(o,e)=>{if(q)o.adoptedStyleSheets=e.map(t=>t instanceof CSSStyleSheet?t:t.styleSheet);else for(const t of e){const i=document.createElement("style"),s=B.litNonce;s!==void 0&&i.setAttribute("nonce",s),i.textContent=t.cssText,o.appendChild(i)}},se=q?o=>o:o=>o instanceof CSSStyleSheet?(e=>{let t="";for(const i of e.cssRules)t+=i.cssText;return Ae(t)})(o):o;/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */const{is:Me,defineProperty:Le,getOwnPropertyDescriptor:je,getOwnPropertyNames:Pe,getOwnPropertySymbols:Ue,getPrototypeOf:Te}=Object,D=globalThis,oe=D.trustedTypes,Oe=oe?oe.emptyScript:"",Ie=D.reactiveElementPolyfillSupport,j=(o,e)=>o,V={toAttribute(o,e){switch(e){case Boolean:o=o?Oe:null;break;case Object:case Array:o=o==null?o:JSON.stringify(o)}return o},fromAttribute(o,e){let t=o;switch(e){case Boolean:t=o!==null;break;case Number:t=o===null?null:Number(o);break;case Object:case Array:try{t=JSON.parse(o)}catch{t=null}}return t}},be=(o,e)=>!Me(o,e),ne={attribute:!0,type:String,converter:V,reflect:!1,useDefault:!1,hasChanged:be};Symbol.metadata??=Symbol("metadata"),D.litPropertyMetadata??=new WeakMap;let C=class extends HTMLElement{static addInitializer(e){this._$Ei(),(this.l??=[]).push(e)}static get observedAttributes(){return this.finalize(),this._$Eh&&[...this._$Eh.keys()]}static createProperty(e,t=ne){if(t.state&&(t.attribute=!1),this._$Ei(),this.prototype.hasOwnProperty(e)&&((t=Object.create(t)).wrapped=!0),this.elementProperties.set(e,t),!t.noAccessor){const i=Symbol(),s=this.getPropertyDescriptor(e,i,t);s!==void 0&&Le(this.prototype,e,s)}}static getPropertyDescriptor(e,t,i){const{get:s,set:n}=je(this.prototype,e)??{get(){return this[t]},set(a){this[t]=a}};return{get:s,set(a){const c=s?.call(this);n?.call(this,a),this.requestUpdate(e,c,i)},configurable:!0,enumerable:!0}}static getPropertyOptions(e){return this.elementProperties.get(e)??ne}static _$Ei(){if(this.hasOwnProperty(j("elementProperties")))return;const e=Te(this);e.finalize(),e.l!==void 0&&(this.l=[...e.l]),this.elementProperties=new Map(e.elementProperties)}static finalize(){if(this.hasOwnProperty(j("finalized")))return;if(this.finalized=!0,this._$Ei(),this.hasOwnProperty(j("properties"))){const t=this.properties,i=[...Pe(t),...Ue(t)];for(const s of i)this.createProperty(s,t[s])}const e=this[Symbol.metadata];if(e!==null){const t=litPropertyMetadata.get(e);if(t!==void 0)for(const[i,s]of t)this.elementProperties.set(i,s)}this._$Eh=new Map;for(const[t,i]of this.elementProperties){const s=this._$Eu(t,i);s!==void 0&&this._$Eh.set(s,t)}this.elementStyles=this.finalizeStyles(this.styles)}static finalizeStyles(e){const t=[];if(Array.isArray(e)){const i=new Set(e.flat(1/0).reverse());for(const s of i)t.unshift(se(s))}else e!==void 0&&t.push(se(e));return t}static _$Eu(e,t){const i=t.attribute;return i===!1?void 0:typeof i=="string"?i:typeof e=="string"?e.toLowerCase():void 0}constructor(){super(),this._$Ep=void 0,this.isUpdatePending=!1,this.hasUpdated=!1,this._$Em=null,this._$Ev()}_$Ev(){this._$ES=new Promise(e=>this.enableUpdating=e),this._$AL=new Map,this._$E_(),this.requestUpdate(),this.constructor.l?.forEach(e=>e(this))}addController(e){(this._$EO??=new Set).add(e),this.renderRoot!==void 0&&this.isConnected&&e.hostConnected?.()}removeController(e){this._$EO?.delete(e)}_$E_(){const e=new Map,t=this.constructor.elementProperties;for(const i of t.keys())this.hasOwnProperty(i)&&(e.set(i,this[i]),delete this[i]);e.size>0&&(this._$Ep=e)}createRenderRoot(){const e=this.shadowRoot??this.attachShadow(this.constructor.shadowRootOptions);return Ee(e,this.constructor.elementStyles),e}connectedCallback(){this.renderRoot??=this.createRenderRoot(),this.enableUpdating(!0),this._$EO?.forEach(e=>e.hostConnected?.())}enableUpdating(e){}disconnectedCallback(){this._$EO?.forEach(e=>e.hostDisconnected?.())}attributeChangedCallback(e,t,i){this._$AK(e,i)}_$ET(e,t){const i=this.constructor.elementProperties.get(e),s=this.constructor._$Eu(e,i);if(s!==void 0&&i.reflect===!0){const n=(i.converter?.toAttribute!==void 0?i.converter:V).toAttribute(t,i.type);this._$Em=e,n==null?this.removeAttribute(s):this.setAttribute(s,n),this._$Em=null}}_$AK(e,t){const i=this.constructor,s=i._$Eh.get(e);if(s!==void 0&&this._$Em!==s){const n=i.getPropertyOptions(s),a=typeof n.converter=="function"?{fromAttribute:n.converter}:n.converter?.fromAttribute!==void 0?n.converter:V;this._$Em=s;const c=a.fromAttribute(t,n.type);this[s]=c??this._$Ej?.get(s)??c,this._$Em=null}}requestUpdate(e,t,i){if(e!==void 0){const s=this.constructor,n=this[e];if(i??=s.getPropertyOptions(e),!((i.hasChanged??be)(n,t)||i.useDefault&&i.reflect&&n===this._$Ej?.get(e)&&!this.hasAttribute(s._$Eu(e,i))))return;this.C(e,t,i)}this.isUpdatePending===!1&&(this._$ES=this._$EP())}C(e,t,{useDefault:i,reflect:s,wrapped:n},a){i&&!(this._$Ej??=new Map).has(e)&&(this._$Ej.set(e,a??t??this[e]),n!==!0||a!==void 0)||(this._$AL.has(e)||(this.hasUpdated||i||(t=void 0),this._$AL.set(e,t)),s===!0&&this._$Em!==e&&(this._$Eq??=new Set).add(e))}async _$EP(){this.isUpdatePending=!0;try{await this._$ES}catch(t){Promise.reject(t)}const e=this.scheduleUpdate();return e!=null&&await e,!this.isUpdatePending}scheduleUpdate(){return this.performUpdate()}performUpdate(){if(!this.isUpdatePending)return;if(!this.hasUpdated){if(this.renderRoot??=this.createRenderRoot(),this._$Ep){for(const[s,n]of this._$Ep)this[s]=n;this._$Ep=void 0}const i=this.constructor.elementProperties;if(i.size>0)for(const[s,n]of i){const{wrapped:a}=n,c=this[s];a!==!0||this._$AL.has(s)||c===void 0||this.C(s,void 0,n,c)}}let e=!1;const t=this._$AL;try{e=this.shouldUpdate(t),e?(this.willUpdate(t),this._$EO?.forEach(i=>i.hostUpdate?.()),this.update(t)):this._$EM()}catch(i){throw e=!1,this._$EM(),i}e&&this._$AE(t)}willUpdate(e){}_$AE(e){this._$EO?.forEach(t=>t.hostUpdated?.()),this.hasUpdated||(this.hasUpdated=!0,this.firstUpdated(e)),this.updated(e)}_$EM(){this._$AL=new Map,this.isUpdatePending=!1}get updateComplete(){return this.getUpdateComplete()}getUpdateComplete(){return this._$ES}shouldUpdate(e){return!0}update(e){this._$Eq&&=this._$Eq.forEach(t=>this._$ET(t,this[t])),this._$EM()}updated(e){}firstUpdated(e){}};C.elementStyles=[],C.shadowRootOptions={mode:"open"},C[j("elementProperties")]=new Map,C[j("finalized")]=new Map,Ie?.({ReactiveElement:C}),(D.reactiveElementVersions??=[]).push("2.1.1");/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */const Y=globalThis,N=Y.trustedTypes,ae=N?N.createPolicy("lit-html",{createHTML:o=>o}):void 0,ge="$lit$",$=`lit$${Math.random().toFixed(9).slice(2)}$`,fe="?"+$,He=`<${fe}>`,w=document,P=()=>w.createComment(""),U=o=>o===null||typeof o!="object"&&typeof o!="function",J=Array.isArray,ze=o=>J(o)||typeof o?.[Symbol.iterator]=="function",F=`[ 	
\f\r]`,L=/<(?:(!--|\/[^a-zA-Z])|(\/?[a-zA-Z][^>\s]*)|(\/?$))/g,re=/-->/g,le=/>/g,k=RegExp(`>|${F}(?:([^\\s"'>=/]+)(${F}*=${F}*(?:[^ 	
\f\r"'\`<>=]|("|')|))|$)`,"g"),de=/'/g,ce=/"/g,ve=/^(?:script|style|textarea|title)$/i,Be=o=>(e,...t)=>({_$litType$:o,strings:e,values:t}),l=Be(1),A=Symbol.for("lit-noChange"),m=Symbol.for("lit-nothing"),pe=new WeakMap,_=w.createTreeWalker(w,129);function xe(o,e){if(!J(o)||!o.hasOwnProperty("raw"))throw Error("invalid template strings array");return ae!==void 0?ae.createHTML(e):e}const Ne=(o,e)=>{const t=o.length-1,i=[];let s,n=e===2?"<svg>":e===3?"<math>":"",a=L;for(let c=0;c<t;c++){const d=o[c];let p,u,h=-1,v=0;for(;v<d.length&&(a.lastIndex=v,u=a.exec(d),u!==null);)v=a.lastIndex,a===L?u[1]==="!--"?a=re:u[1]!==void 0?a=le:u[2]!==void 0?(ve.test(u[2])&&(s=RegExp("</"+u[2],"g")),a=k):u[3]!==void 0&&(a=k):a===k?u[0]===">"?(a=s??L,h=-1):u[1]===void 0?h=-2:(h=a.lastIndex-u[2].length,p=u[1],a=u[3]===void 0?k:u[3]==='"'?ce:de):a===ce||a===de?a=k:a===re||a===le?a=L:(a=k,s=void 0);const y=a===k&&o[c+1].startsWith("/>")?" ":"";n+=a===L?d+He:h>=0?(i.push(p),d.slice(0,h)+ge+d.slice(h)+$+y):d+$+(h===-2?c:y)}return[xe(o,n+(o[t]||"<?>")+(e===2?"</svg>":e===3?"</math>":"")),i]};class T{constructor({strings:e,_$litType$:t},i){let s;this.parts=[];let n=0,a=0;const c=e.length-1,d=this.parts,[p,u]=Ne(e,t);if(this.el=T.createElement(p,i),_.currentNode=this.el.content,t===2||t===3){const h=this.el.content.firstChild;h.replaceWith(...h.childNodes)}for(;(s=_.nextNode())!==null&&d.length<c;){if(s.nodeType===1){if(s.hasAttributes())for(const h of s.getAttributeNames())if(h.endsWith(ge)){const v=u[a++],y=s.getAttribute(h).split($),I=/([.?@])?(.*)/.exec(v);d.push({type:1,index:n,name:I[2],strings:y,ctor:I[1]==="."?We:I[1]==="?"?Fe:I[1]==="@"?Ge:W}),s.removeAttribute(h)}else h.startsWith($)&&(d.push({type:6,index:n}),s.removeAttribute(h));if(ve.test(s.tagName)){const h=s.textContent.split($),v=h.length-1;if(v>0){s.textContent=N?N.emptyScript:"";for(let y=0;y<v;y++)s.append(h[y],P()),_.nextNode(),d.push({type:2,index:++n});s.append(h[v],P())}}}else if(s.nodeType===8)if(s.data===fe)d.push({type:2,index:n});else{let h=-1;for(;(h=s.data.indexOf($,h+1))!==-1;)d.push({type:7,index:n}),h+=$.length-1}n++}}static createElement(e,t){const i=w.createElement("template");return i.innerHTML=e,i}}function E(o,e,t=o,i){if(e===A)return e;let s=i!==void 0?t._$Co?.[i]:t._$Cl;const n=U(e)?void 0:e._$litDirective$;return s?.constructor!==n&&(s?._$AO?.(!1),n===void 0?s=void 0:(s=new n(o),s._$AT(o,t,i)),i!==void 0?(t._$Co??=[])[i]=s:t._$Cl=s),s!==void 0&&(e=E(o,s._$AS(o,e.values),s,i)),e}class De{constructor(e,t){this._$AV=[],this._$AN=void 0,this._$AD=e,this._$AM=t}get parentNode(){return this._$AM.parentNode}get _$AU(){return this._$AM._$AU}u(e){const{el:{content:t},parts:i}=this._$AD,s=(e?.creationScope??w).importNode(t,!0);_.currentNode=s;let n=_.nextNode(),a=0,c=0,d=i[0];for(;d!==void 0;){if(a===d.index){let p;d.type===2?p=new O(n,n.nextSibling,this,e):d.type===1?p=new d.ctor(n,d.name,d.strings,this,e):d.type===6&&(p=new Ve(n,this,e)),this._$AV.push(p),d=i[++c]}a!==d?.index&&(n=_.nextNode(),a++)}return _.currentNode=w,s}p(e){let t=0;for(const i of this._$AV)i!==void 0&&(i.strings!==void 0?(i._$AI(e,i,t),t+=i.strings.length-2):i._$AI(e[t])),t++}}class O{get _$AU(){return this._$AM?._$AU??this._$Cv}constructor(e,t,i,s){this.type=2,this._$AH=m,this._$AN=void 0,this._$AA=e,this._$AB=t,this._$AM=i,this.options=s,this._$Cv=s?.isConnected??!0}get parentNode(){let e=this._$AA.parentNode;const t=this._$AM;return t!==void 0&&e?.nodeType===11&&(e=t.parentNode),e}get startNode(){return this._$AA}get endNode(){return this._$AB}_$AI(e,t=this){e=E(this,e,t),U(e)?e===m||e==null||e===""?(this._$AH!==m&&this._$AR(),this._$AH=m):e!==this._$AH&&e!==A&&this._(e):e._$litType$!==void 0?this.$(e):e.nodeType!==void 0?this.T(e):ze(e)?this.k(e):this._(e)}O(e){return this._$AA.parentNode.insertBefore(e,this._$AB)}T(e){this._$AH!==e&&(this._$AR(),this._$AH=this.O(e))}_(e){this._$AH!==m&&U(this._$AH)?this._$AA.nextSibling.data=e:this.T(w.createTextNode(e)),this._$AH=e}$(e){const{values:t,_$litType$:i}=e,s=typeof i=="number"?this._$AC(e):(i.el===void 0&&(i.el=T.createElement(xe(i.h,i.h[0]),this.options)),i);if(this._$AH?._$AD===s)this._$AH.p(t);else{const n=new De(s,this),a=n.u(this.options);n.p(t),this.T(a),this._$AH=n}}_$AC(e){let t=pe.get(e.strings);return t===void 0&&pe.set(e.strings,t=new T(e)),t}k(e){J(this._$AH)||(this._$AH=[],this._$AR());const t=this._$AH;let i,s=0;for(const n of e)s===t.length?t.push(i=new O(this.O(P()),this.O(P()),this,this.options)):i=t[s],i._$AI(n),s++;s<t.length&&(this._$AR(i&&i._$AB.nextSibling,s),t.length=s)}_$AR(e=this._$AA.nextSibling,t){for(this._$AP?.(!1,!0,t);e!==this._$AB;){const i=e.nextSibling;e.remove(),e=i}}setConnected(e){this._$AM===void 0&&(this._$Cv=e,this._$AP?.(e))}}class W{get tagName(){return this.element.tagName}get _$AU(){return this._$AM._$AU}constructor(e,t,i,s,n){this.type=1,this._$AH=m,this._$AN=void 0,this.element=e,this.name=t,this._$AM=s,this.options=n,i.length>2||i[0]!==""||i[1]!==""?(this._$AH=Array(i.length-1).fill(new String),this.strings=i):this._$AH=m}_$AI(e,t=this,i,s){const n=this.strings;let a=!1;if(n===void 0)e=E(this,e,t,0),a=!U(e)||e!==this._$AH&&e!==A,a&&(this._$AH=e);else{const c=e;let d,p;for(e=n[0],d=0;d<n.length-1;d++)p=E(this,c[i+d],t,d),p===A&&(p=this._$AH[d]),a||=!U(p)||p!==this._$AH[d],p===m?e=m:e!==m&&(e+=(p??"")+n[d+1]),this._$AH[d]=p}a&&!s&&this.j(e)}j(e){e===m?this.element.removeAttribute(this.name):this.element.setAttribute(this.name,e??"")}}class We extends W{constructor(){super(...arguments),this.type=3}j(e){this.element[this.name]=e===m?void 0:e}}class Fe extends W{constructor(){super(...arguments),this.type=4}j(e){this.element.toggleAttribute(this.name,!!e&&e!==m)}}class Ge extends W{constructor(e,t,i,s,n){super(e,t,i,s,n),this.type=5}_$AI(e,t=this){if((e=E(this,e,t,0)??m)===A)return;const i=this._$AH,s=e===m&&i!==m||e.capture!==i.capture||e.once!==i.once||e.passive!==i.passive,n=e!==m&&(i===m||s);s&&this.element.removeEventListener(this.name,this,i),n&&this.element.addEventListener(this.name,this,e),this._$AH=e}handleEvent(e){typeof this._$AH=="function"?this._$AH.call(this.options?.host??this.element,e):this._$AH.handleEvent(e)}}class Ve{constructor(e,t,i){this.element=e,this.type=6,this._$AN=void 0,this._$AM=t,this.options=i}get _$AU(){return this._$AM._$AU}_$AI(e){E(this,e)}}const qe=Y.litHtmlPolyfillSupport;qe?.(T,O),(Y.litHtmlVersions??=[]).push("3.3.1");const ye=(o,e,t)=>{const i=t?.renderBefore??e;let s=i._$litPart$;if(s===void 0){const n=t?.renderBefore??null;i._$litPart$=s=new O(e.insertBefore(P(),n),n,void 0,t??{})}return s._$AI(o),s};/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */const Z=globalThis;class b extends C{constructor(){super(...arguments),this.renderOptions={host:this},this._$Do=void 0}createRenderRoot(){const e=super.createRenderRoot();return this.renderOptions.renderBefore??=e.firstChild,e}update(e){const t=this.render();this.hasUpdated||(this.renderOptions.isConnected=this.isConnected),super.update(e),this._$Do=ye(t,this.renderRoot,this.renderOptions)}connectedCallback(){super.connectedCallback(),this._$Do?.setConnected(!0)}disconnectedCallback(){super.disconnectedCallback(),this._$Do?.setConnected(!1)}render(){return A}}b._$litElement$=!0,b.finalized=!0,Z.litElementHydrateSupport?.({LitElement:b});const Ke=Z.litElementPolyfillSupport;Ke?.({LitElement:b});(Z.litElementVersions??=[]).push("4.2.1");/**
 * @license
 * Copyright 2021 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */function*S(o,e){if(o!==void 0){let t=0;for(const i of o)yield e(i,t++)}}function x(o){return o===" "?"SPACE":o.startsWith("arrow")?o.replace("arrow","").toUpperCase():o.toUpperCase()}function Q(o=0){const e=Math.floor(o/60),t=o%60,i=Math.floor(t),s=Math.floor((t-i)*1e3);return`${e.toString().padStart(2,"0")}:${i.toString().padStart(2,"0")}.${s.toString().padStart(3,"0")}`}class Ye extends b{static properties={fontRenderer:{type:Object},text:{type:String},scale:{type:Number},color:{type:String},outlineColor:{type:String},outlineWidth:{type:Number},align:{type:String}};constructor(){super(),this.text="",this.scale=1,this.color="white",this.outlineColor=null,this.outlineWidth=1,this.align="left"}updated(e){super.updated(e),!(!this.fontRenderer||!this.shadowRoot)&&this.renderCanvas()}renderCanvas(){const e=this.shadowRoot.querySelector("#container");if(!e)return;const t=this.fontRenderer.renderTextToCanvas(this.text,{scale:this.scale,color:this.color,outlineColor:this.outlineColor,outlineWidth:this.outlineWidth,align:this.align});t&&(t.style.imageRendering="pixelated",e.innerHTML="",e.appendChild(t))}render(){return l`<div id="container"></div>`}}customElements.define("bitmap-text",Ye);class Je extends b{static styles=f`
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
  `;static properties={action:{type:String},currentKey:{type:String},isRemapping:{type:Boolean,state:!0},fontRenderer:{type:Object}};constructor(){super(),this.isRemapping=!1}connectedCallback(){super.connectedCallback(),window.addEventListener("keydown",this._handleGlobalKeydown)}disconnectedCallback(){super.disconnectedCallback(),window.removeEventListener("keydown",this._handleGlobalKeydown)}_handleGlobalKeydown=e=>{if(!this.isRemapping)return;e.preventDefault(),e.stopPropagation();const t=e.key.toLowerCase();this.dispatchEvent(new CustomEvent("keybind-changed",{detail:{action:this.action,newKey:t},bubbles:!0,composed:!0})),this.isRemapping=!1};_startRemap(e){e.stopPropagation(),this.isRemapping=!0,r.publish("playSound",{key:"button_click",volume:.8,channel:"UI"})}render(){const e=this.isRemapping?"Press key...":x(this.currentKey);return l`
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
    `}}customElements.define("keybind-display",Je);class Ze extends b{static styles=f`
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
  `;static properties={keybinds:{type:Object},soundSettings:{type:Object},fontRenderer:{type:Object}};_dispatchClose(){r.publish("playSound",{key:"button_click",volume:.8,channel:"UI"}),this.dispatchEvent(new CustomEvent("close-modal",{bubbles:!0,composed:!0}))}_toggleSound(){r.publish("playSound",{key:"button_click",volume:.8,channel:"UI"}),r.publish("toggleSound")}_setVolume(e){const t=parseFloat(e.target.value);r.publish("setSoundVolume",{volume:t})}_testSound(){r.publish("playSound",{key:"jump",volume:.8,channel:"UI"})}render(){if(!this.keybinds||!this.soundSettings||!this.fontRenderer)return l``;const e=Object.keys(this.keybinds);return l`
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
              ${S(e,t=>l`
                <div class="keybind-item">
                  <div class="label-container">
                    <bitmap-text .fontRenderer=${this.fontRenderer} text=${t.replace(/([A-Z])/g," $1").replace(/^./,i=>i.toUpperCase())} scale="1.8"></bitmap-text>
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
    `}}customElements.define("settings-menu",Ze);class Qe extends b{static styles=f`
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

    .button-container { display: flex; justify-content: center; gap: 15px; }
    .modal-image-button {
        background: transparent; border: none; padding: 0;
        cursor: pointer; width: 48px; height: 48px;
        transition: transform 0.2s ease-in-out;
    }
    .modal-image-button:hover { transform: scale(1.1); }
    .modal-image-button img { width: 100%; height: 100%; }
    .exit-button-container {
      margin-top: 20px;
      padding-top: 20px;
      border-top: 1px solid #555;
    }
    .exit-button {
      background-color: #e74c3c;
      color: #fff;
      border: 2px solid #c0392b;
      padding: 10px 20px;
      border-radius: 8px;
      cursor: pointer;
      display: flex;
      justify-content: center;
      align-items: center;
      transition: all 0.2s ease-in-out;
      width: 100%;
      box-sizing: border-box;
    }
    .exit-button:hover {
      background-color: #c0392b;
    }
  `;static properties={stats:{type:Object},fontRenderer:{type:Object}};constructor(){super(),this.stats={collectedFruits:0,totalFruits:0,deathCount:0,levelTime:0}}_dispatch(e){this.dispatchEvent(new CustomEvent(e,{bubbles:!0,composed:!0}))}render(){return l`
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
            <bitmap-text .fontRenderer=${this.fontRenderer} text="Time: ${Q(this.stats.levelTime)}" scale="1.8"></bitmap-text>
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
          <div class="exit-button-container">
            <button class="exit-button" @click=${()=>this._dispatch("exit-to-menu")}>
              <bitmap-text .fontRenderer=${this.fontRenderer} text="Exit to Main Menu" scale="1.8"></bitmap-text>
            </button>
          </div>
        </div>
      </div>
    `}}customElements.define("pause-modal",Qe);class Xe extends b{static styles=f`
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
      background-color: #333;
      border-radius: 12px;
      box-shadow: 0 8px 16px rgba(0, 0, 0, 0.5);
      color: #eee;
      text-align: center;
      position: relative;
      width: 90%;
      max-width: 600px;
      max-height: 80vh;

      display: flex;
      flex-direction: column;

      padding: 20px;
      box-sizing: border-box;
    }


    .scrollable-content {
      flex-grow: 1;
      overflow-y: auto;
      padding: 10px 5px;
      margin: 0 -5px;
    }


    .footer-actions {
        flex-shrink: 0;
        padding-top: 20px;
        display: flex;
        justify-content: center;
        align-items: center;
        border-top: 1px solid #444;
    }


    .close-button {
      position: absolute; top: 15px; right: 15px; width: 32px; height: 32px;
      background-image: url('/assets/Menu/Buttons/Close.png');
      background-size: cover; background-color: transparent;
      border: none; cursor: pointer; border-radius: 50%;
      transition: transform 0.2s ease-in-out;
      z-index: 10;
    }
    .close-button:hover { transform: scale(1.1); }

    .title-container {
      display: flex;
      justify-content: center;
      margin-bottom: 25px;
      flex-shrink: 0;
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
      width: 100%;
      height: 100%;
    }
    .level-button:not(:disabled):hover {
      background-color: #007bff; border-color: #0056b3; transform: translateY(-2px);
    }
    .level-button.completed { background-color: #4CAF50; border-color: #45a049; }
    .level-button.current { border-color: #ffc107; box-shadow: 0 0 8px rgba(255, 193, 7, 0.7); }
    .level-button.locked { background-color: #444; color: #777; cursor: not-allowed; border-color: #666; }
    .level-button.locked svg { fill: #777; width: 24px; height: 24px; }

    .level-button.add-level {
        background-color: #444;
        border-style: dashed;
        font-size: 2em;
    }
    .level-button.add-level:hover {
        background-color: #555;
        border-color: #888;
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

    .level-button-container {
      position: relative;
      aspect-ratio: 1 / 1;
      display: flex;
    }
    .menu-button {
      position: absolute;
      top: 4px;
      right: 4px;
      width: 24px;
      height: 24px;
      background: rgba(0,0,0,0.5);
      border: 1px solid rgba(255,255,255,0.3);
      border-radius: 50%;
      color: white;
      cursor: pointer;
      display: flex;
      justify-content: center;
      align-items: center;
      padding: 0;
      line-height: 1;
      font-size: 18px;
      z-index: 5;
    }
    .menu-button:hover {
      background: rgba(0,0,0,0.8);
    }
    .context-menu {
      position: absolute;
      top: 32px;
      right: 2px;
      background-color: #444;
      border: 1px solid #555;
      border-radius: 6px;
      box-shadow: 0 4px 8px rgba(0,0,0,0.3);
      z-index: 10;
      width: 100px;
    }
    .context-menu button {
      display: block;
      width: 100%;
      padding: 10px;
      background: none;
      border: none;
      color: #eee;
      text-align: left;
      cursor: pointer;
    }
    .context-menu button:hover {
      background-color: #555;
    }
  `;static properties={gameState:{type:Object},fontRenderer:{type:Object},activeMenuIndex:{type:String,state:!0}};constructor(){super(),this.activeMenuIndex=null,document.addEventListener("click",this._handleGlobalClick,!0)}disconnectedCallback(){super.disconnectedCallback(),document.removeEventListener("click",this._handleGlobalClick,!0)}_handleGlobalClick=e=>{this.activeMenuIndex&&!e.composedPath().some(t=>t.classList?.contains("context-menu-container"))&&(this.activeMenuIndex=null)};_dispatchClose(){r.publish("playSound",{key:"button_click",volume:.8,channel:"UI"}),this.dispatchEvent(new CustomEvent("close-modal",{bubbles:!0,composed:!0}))}_selectLevel(e,t){this.dispatchEvent(new CustomEvent("level-selected",{detail:{sectionIndex:e,levelIndex:t},bubbles:!0,composed:!0}))}_openStatsModal(){r.publish("playSound",{key:"button_click",volume:.8,channel:"UI"}),r.publish("ui_button_clicked",{buttonId:"stats"})}_goToEditor(){window.location.href="editor.html"}_handleMenuClick(e,t,i){e.stopPropagation();const s=`${t}-${i}`;this.activeMenuIndex=this.activeMenuIndex===s?null:s}_handleEditLevel(e,t){const i=z[e].levels[t];sessionStorage.setItem("editingLevelData",JSON.stringify(i)),sessionStorage.setItem("editingLevelIndex",t.toString()),window.location.href="editor.html"}_handleDeleteLevel(e,t){confirm(`Are you sure you want to delete "${z[e].levels[t].name}"? This action cannot be undone.`)&&r.publish("deleteDIYLevel",{levelIndex:t}),this.activeMenuIndex=null}render(){return this.gameState?l`
      <div class="modal-overlay" @click=${this._dispatchClose}>
        <div class="modal-content" @click=${e=>e.stopPropagation()}>
          <button class="close-button" @click=${this._dispatchClose}></button>

          <div class="title-container">
            <bitmap-text .fontRenderer=${this.fontRenderer} text="Levels Menu" scale="3" outlineColor="black" outlineWidth="2"></bitmap-text>
          </div>

          <div class="scrollable-content">
            <div id="level-selection-container">
              ${S(z,(e,t)=>l`
                <div class="level-section-menu">
                  <div class="section-title-container">
                    <bitmap-text .fontRenderer=${this.fontRenderer} text=${e.name} scale="2"></bitmap-text>
                  </div>
                  <div class="level-grid">
                    ${S(e.levels,(i,s)=>{const n=this.gameState.isLevelUnlocked(t,s),a=this.gameState.isLevelCompleted(t,s),c=this.gameState.currentSection===t&&this.gameState.currentLevelIndex===s,d=`level-button ${a?"completed":""} ${c?"current":""} ${n?"":"locked"}`;if(e.name==="DIY"){const p=`${t}-${s}`;return l`
                          <div class="level-button-container context-menu-container">
                            <button class=${d} @click=${()=>this._selectLevel(t,s)}>${s+1}</button>
                            <button class="menu-button" @click=${u=>this._handleMenuClick(u,t,s)}>⋮</button>
                            ${this.activeMenuIndex===p?l`
                              <div class="context-menu">
                                <button @click=${()=>this._handleEditLevel(t,s)}>Edit</button>
                                <button @click=${()=>this._handleDeleteLevel(t,s)}>Delete</button>
                              </div>
                            `:""}
                          </div>
                        `}return n?l`<button class=${d} @click=${()=>this._selectLevel(t,s)}>${s+1}</button>`:l`<button class=${d} disabled>
                              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zM9 8V6c0-1.66 1.34-3 3-3s3 1.34 3 3v2H9z"></path></svg>
                           </button>`})}
                    ${e.name==="DIY"?l`<button class="level-button add-level" @click=${this._goToEditor} title="Create New Level">+</button>`:""}
                  </div>
                </div>
              `)}
            </div>
          </div>

          <div class="footer-actions">
            <button class="footer-button" @click=${this._openStatsModal}>
                <bitmap-text .fontRenderer=${this.fontRenderer} text="View Stats" scale="1.8"></bitmap-text>
            </button>
          </div>
        </div>
      </div>
    `:l``}}customElements.define("levels-menu",Xe);class et extends b{static styles=f`
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
  `;static properties={characterId:{type:String},idleSprite:{type:Object},isLocked:{type:Boolean},isSelected:{type:Boolean},fontRenderer:{type:Object}};constructor(){super(),this.animationFrameId=null,this.animState={frame:0,timer:0,lastTime:0}}connectedCallback(){super.connectedCallback(),this.animationFrameId=requestAnimationFrame(this._animatePreview)}disconnectedCallback(){super.disconnectedCallback(),this.animationFrameId&&cancelAnimationFrame(this.animationFrameId)}_animatePreview=e=>{const t=this.shadowRoot.querySelector(".char-canvas");if(!t||!this.idleSprite){this.animationFrameId=requestAnimationFrame(this._animatePreview);return}this.animState.lastTime===0&&(this.animState.lastTime=e);const i=(e-this.animState.lastTime)/1e3;this.animState.lastTime=e,this.animState.timer+=i;const s=.08,n=11,a=this.idleSprite.width/n;if(this.animState.timer>=s){this.animState.timer=0,this.animState.frame=(this.animState.frame+1)%n;const c=t.getContext("2d");c.clearRect(0,0,t.width,t.height),c.drawImage(this.idleSprite,this.animState.frame*a,0,a,this.idleSprite.height,0,0,t.width,t.height)}this.animationFrameId=requestAnimationFrame(this._animatePreview)};_handleSelect(){this.isLocked||this.isSelected||this.dispatchEvent(new CustomEvent("character-selected",{detail:{characterId:this.characterId},bubbles:!0,composed:!0}))}render(){const e=ue[this.characterId],t=`character-card ${this.isLocked?"locked":""} ${this.isSelected?"selected":""}`,i=this.isLocked?"Locked":this.isSelected?"Selected":"Select";return l`
      <div class=${t}>
        <canvas class="char-canvas" width="64" height="64"></canvas>
        <div class="char-name-container">
            <bitmap-text .fontRenderer=${this.fontRenderer} .text=${e.name} scale="2"></bitmap-text>
        </div>
        <div class="char-unlock-container">
          ${this.isLocked?l`
                <bitmap-text .fontRenderer=${this.fontRenderer} text="Complete ${e.unlockRequirement} levels" scale="1.5" color="#ccc"></bitmap-text>
                <bitmap-text .fontRenderer=${this.fontRenderer} text="to unlock" scale="1.5" color="#ccc"></bitmap-text>
              `:l`<bitmap-text .fontRenderer=${this.fontRenderer} text="Available" scale="1.5" color="#ccc"></bitmap-text>`}
        </div>
        <button class="select-button" @click=${this._handleSelect} ?disabled=${this.isLocked||this.isSelected}>
          <bitmap-text .fontRenderer=${this.fontRenderer} .text=${i} scale="1.8"></bitmap-text>
        </button>
      </div>
    `}}customElements.define("character-card",et);class tt extends b{static styles=f`
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
  `;static properties={gameState:{type:Object},assets:{type:Object},fontRenderer:{type:Object}};_dispatchClose(){r.publish("playSound",{key:"button_click",volume:.8,channel:"UI"}),this.dispatchEvent(new CustomEvent("close-modal",{bubbles:!0,composed:!0}))}render(){if(!this.gameState||!this.assets)return l`<div class="modal-overlay">Loading...</div>`;const e=Object.keys(ue);return l`
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
                    ${S(e,t=>l`
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
    `}}customElements.define("character-menu",tt);class it extends b{static styles=f`
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
      max-width: 600px; max-height: 80vh;
      display: flex;
      flex-direction: column;
    }
    .scrollable-content {
        flex-grow: 1;
        overflow-y: auto;
        padding-right: 15px; /* For scrollbar */
        margin-right: -15px; /* For scrollbar */
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
    .settings-section { padding: 20px; background-color: #444; border-radius: 8px; border: 1px solid #555; margin-bottom: 20px; }
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

      display: flex;
      justify-content: center;
      align-items: center;
      padding: 5px 8px;
    }
    .footer-actions {
        flex-shrink: 0;
        padding-top: 20px;
        display: flex;
        justify-content: center;
        align-items: center;
        border-top: 1px solid #444;
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
  `;static properties={keybinds:{type:Object},fontRenderer:{type:Object}};_dispatchClose(){r.publish("playSound",{key:"button_click",volume:.8,channel:"UI"}),this.dispatchEvent(new CustomEvent("close-modal",{bubbles:!0,composed:!0}))}_openEnemyCatalogue(){r.publish("playSound",{key:"button_click",volume:.8,channel:"UI"}),r.publish("ui_button_clicked",{buttonId:"enemy-catalogue"})}render(){return this.keybinds?l`
      <div class="modal-overlay" @click=${this._dispatchClose}>
        <div class="modal-content" @click=${e=>e.stopPropagation()}>
          <button class="close-button" @click=${this._dispatchClose}></button>

          <div class="title-container">
            <bitmap-text .fontRenderer=${this.fontRenderer} text="Info Section" scale="3" outlineColor="black" outlineWidth="2"></bitmap-text>
          </div>

          <div class="scrollable-content">
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
                          <bitmap-text .fontRenderer=${this.fontRenderer} text=${x(this.keybinds.moveLeft)} scale="1.5"></bitmap-text>
                      </div>
                      <span>/</span>
                      <div class="key-display">
                          <bitmap-text .fontRenderer=${this.fontRenderer} text=${x(this.keybinds.moveRight)} scale="1.5"></bitmap-text>
                      </div>
                    </div>
                  </div>

                  <div class="keybind-item">
                    <label>Jump / Double Jump / Wall Jump:</label>
                    <div class="key-display">
                      <bitmap-text .fontRenderer=${this.fontRenderer} text=${x(this.keybinds.jump)} scale="1.5"></bitmap-text>
                    </div>
                  </div>

                  <div class="keybind-item">
                    <label>Dash:</label>
                    <div class="key-display">
                      <bitmap-text .fontRenderer=${this.fontRenderer} text=${x(this.keybinds.dash)} scale="1.5"></bitmap-text>
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

          <div class="footer-actions">
            <button class="footer-button" @click=${this._openEnemyCatalogue}>
                <bitmap-text .fontRenderer=${this.fontRenderer} text="Enemy Behavior" scale="1.8"></bitmap-text>
            </button>
          </div>

        </div>
      </div>
    `:l``}}customElements.define("info-modal",it);class st extends b{static styles=f`
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
  `;static properties={stats:{type:Object},hasNextLevel:{type:Boolean},hasPreviousLevel:{type:Boolean},fontRenderer:{type:Object}};_dispatch(e){this.dispatchEvent(new CustomEvent(e))}render(){return this.stats?l`
      <div class="modal-overlay">
        <div class="modal-content">
          <div class="title-container">
            <bitmap-text .fontRenderer=${this.fontRenderer} text="Level Complete!" scale="3" outlineColor="black" outlineWidth="2"></bitmap-text>
          </div>
          <div class="stats-container">
            <bitmap-text .fontRenderer=${this.fontRenderer} text="Deaths: ${this.stats.deaths}" scale="1.8"></bitmap-text>
            <bitmap-text .fontRenderer=${this.fontRenderer} text="Time: ${Q(this.stats.time)}" scale="1.8"></bitmap-text>
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
    `:l``}}customElements.define("level-complete-modal",st);class ot extends b{static styles=f`
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
  `;static properties={gameState:{type:Object},fontRenderer:{type:Object}};_dispatchClose(){r.publish("playSound",{key:"button_click",volume:.8,channel:"UI"}),this.dispatchEvent(new CustomEvent("close-modal",{bubbles:!0,composed:!0}))}_getStatDisplay(e,t=null){return e==null?"-":t?t(e):e.toString()}render(){if(!this.gameState||!this.gameState.levelStats)return l``;const{levelStats:e}=this.gameState;return l`
      <div class="modal-overlay" @click=${this._dispatchClose}>
        <div class="modal-content" @click=${t=>t.stopPropagation()}>
          <button class="close-button" @click=${this._dispatchClose}></button>
          <div class="title-container">
            <bitmap-text .fontRenderer=${this.fontRenderer} text="Level Statistics" scale="3" outlineColor="black" outlineWidth="2"></bitmap-text>
          </div>
          <div class="stats-list-container">
            ${S(z,(t,i)=>l`
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

                  ${S(t.levels,(s,n)=>{const a=`${i}-${n}`,c=e[a]||{fastestTime:null,lowestDeaths:null,totalAttempts:0};return l`
                        <div class="stat-row">
                            <div class="stat-cell level-name">Level ${n+1}</div>
                            <div class="stat-cell">${this._getStatDisplay(c.fastestTime,Q)}</div>
                            <div class="stat-cell">${this._getStatDisplay(c.lowestDeaths)}</div>
                            <div class="stat-cell">${this._getStatDisplay(c.totalAttempts)}</div>
                        </div>
                    `})}
                </div>
              </div>
            `)}
          </div>
        </div>
      </div>
    `}}customElements.define("stats-modal",ot);class nt extends b{static styles=f`
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
      max-height: 90vh; display: flex; flex-direction: column;
    }
    .scrollable-content {
        flex-grow: 1;
        overflow-y: auto;
        display: flex;
        flex-direction: column;
        gap: 20px;
        padding: 5px; /* Add a little padding for the scrollbar */
        margin: 0 -5px;
    }
    .title-container, .section-title-container {
      display: flex; justify-content: center;
    }
    .title-container {
      margin-bottom: 20px;
      flex-shrink: 0;
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
    .footer-actions {
        flex-shrink: 0;
        padding-top: 20px;
        display: flex;
        justify-content: center;
        align-items: center;
    }
    .action-button {
      background-color: #007bff; color: #fff; border: 2px solid #0056b3;
      padding: 10px 20px; border-radius: 8px; cursor: pointer;
      display: flex; justify-content: center; align-items: center;
      transition: all 0.2s ease-in-out;
    }
    .action-button:hover { background-color: #0056b3; }
  `;static properties={keybinds:{type:Object},fontRenderer:{type:Object}};_dispatchClose(){r.publish("playSound",{key:"button_click",volume:.8,channel:"UI"}),this.dispatchEvent(new CustomEvent("close-modal",{bubbles:!0,composed:!0}))}render(){return!this.keybinds||!this.fontRenderer?l``:l`
      <div class="modal-overlay">
        <div class="modal-content" @click=${e=>e.stopPropagation()}>
          <div class="title-container">
            <bitmap-text .fontRenderer=${this.fontRenderer} text="Welcome to Parkour Hero!" scale="3" outlineColor="black" outlineWidth="2"></bitmap-text>
          </div>

          <div class="scrollable-content">
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
                        <div class="key-display"><bitmap-text .fontRenderer=${this.fontRenderer} text=${x(this.keybinds.moveLeft)} scale="1.5"></bitmap-text></div>
                        <div class="key-display"><bitmap-text .fontRenderer=${this.fontRenderer} text=${x(this.keybinds.moveRight)} scale="1.5"></bitmap-text></div>
                    </div>
                    <span>Jump</span>
                    <div class="key-display"><bitmap-text .fontRenderer=${this.fontRenderer} text=${x(this.keybinds.jump)} scale="1.5"></bitmap-text></div>
                    <span>Dash</span>
                    <div class="key-display"><bitmap-text .fontRenderer=${this.fontRenderer} text=${x(this.keybinds.dash)} scale="1.5"></bitmap-text></div>
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
          </div>
          
          <div class="footer-actions">
            <button class="action-button" @click=${this._dispatchClose}>
                <bitmap-text .fontRenderer=${this.fontRenderer} text="Got It!" scale="2"></bitmap-text>
            </button>
          </div>
        </div>
      </div>
    `}}customElements.define("tutorial-modal",nt);const at={mushroom:"A simple-minded fungus that patrols back and forth on its platform. Be careful not to run into it.",chicken:"This feisty fowl stays put until it spots a target on its level. Once provoked, it charges relentlessly.",rhino:"A ground enemy that detects the player on the same platform. It charges, accelerating rapidly, and only stops when it hits a wall.",snail:"Moves slowly and predictably. A single stomp will cause it fall out of its shell. The shell then continues to bounce around.",slime:"Hops along platforms, leaving behind a trail of damaging goo. Time your jumps to avoid both the slime and its puddles.",turtle:"A defensive creature. It periodically extends sharp spikes from its shell, making it dangerous to touch. It can only be stomped when its spikes are retracted.",bluebird:"Flies in a horizontal pattern, bobbing gently up and down. Its flight path is consistent, making it a predictable obstacle.",fatbird:"Hovers in the air until a player passes directly underneath, at which point it slams down to the ground with force.",radish:"This vegetable starts by flying around a small area. After being stomped once, it loses its leaves and falls, then begins patrolling on the ground.",bee:"Patrols a small area in the air. Periodically stops to shoot a projectile straight down. Can be a threat from above.",bat:"Hangs from ceilings and waits. When a player approaches from below, it swoops down to attack. It will return if the player moves too far away.",ghost:"A spooky foe that patrols a platform, periodically turning invisible. It cannot be harmed or harm you while invisible.",plant:"A stationary plant that shoots projectiles at the player when they enter its line of sight."};class rt extends b{static styles=f`
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
      display: flex; flex-direction: column;
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

    .catalogue-container {
      display: flex; flex-direction: column; gap: 20px;
      padding: 10px;
    }

    .enemy-entry {
      background-color: #444;
      border: 1px solid #555;
      border-radius: 8px;
      padding: 15px;
      text-align: left;
    }

    .enemy-title {
      border-bottom: 2px solid #666;
      padding-bottom: 10px;
      margin-bottom: 10px;
    }

    .enemy-description {
      color: #ccc;
      line-height: 1.6;
    }
  `;static properties={fontRenderer:{type:Object}};_dispatchClose(){r.publish("playSound",{key:"button_click",volume:.8,channel:"UI"}),this.dispatchEvent(new CustomEvent("close-modal",{bubbles:!0,composed:!0}))}render(){return this.fontRenderer?l`
      <div class="modal-overlay" @click=${this._dispatchClose}>
        <div class="modal-content" @click=${e=>e.stopPropagation()}>
          <button class="close-button" @click=${this._dispatchClose}></button>
          <div class="title-container">
            <bitmap-text .fontRenderer=${this.fontRenderer} text="Enemy Catalogue" scale="3" outlineColor="black" outlineWidth="2"></bitmap-text>
          </div>
          <div class="catalogue-container">
            ${S(Object.keys(_e),e=>l`
              <div class="enemy-entry">
                <div class="enemy-title">
                  <bitmap-text .fontRenderer=${this.fontRenderer} text=${e.charAt(0).toUpperCase()+e.slice(1)} scale="2.2"></bitmap-text>
                </div>
                <p class="enemy-description">${at[e]||"No behavior description available."}</p>
              </div>
            `)}
          </div>
        </div>
      </div>
    `:l``}}customElements.define("enemy-catalogue-modal",rt);class lt extends b{static styles=f`
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

    .main-menu-icon-buttons {
      display: flex;
      gap: 20px;
    }
    .icon-button {
      background: transparent;
      border: none;
      padding: 0;
      cursor: pointer;
      width: 64px;
      height: 64px;
      transition: all 0.2s ease-in-out;
    }
    .icon-button:hover {
      transform: scale(1.1);
    }
    .icon-button img {
      width: 100%;
      height: 100%;
    }

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
        font-family: 'Arial', sans-serif;
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
  `;static properties={activeModal:{type:String,state:!0},gameHasStarted:{type:Boolean,state:!0},keybinds:{type:Object,state:!0},soundSettings:{type:Object,state:!0},currentStats:{type:Object,state:!0},gameState:{type:Object,state:!0},assets:{type:Object,state:!0},fontRenderer:{type:Object},levelCompleteStats:{type:Object,state:!0},previewMode:{type:Boolean}};constructor(){super(),this.activeModal="main-menu",this.gameHasStarted=!1,this.keybinds={moveLeft:"a",moveRight:"d",jump:"w",dash:" "},this.soundSettings={soundEnabled:!0,soundVolume:.5},this.currentStats={},this.gameState=new we,this.assets=null,this.fontRenderer=null,this.levelCompleteStats=null,this.previewMode=!1,window.location.hash==="#levels"&&(this.activeModal="levels",history.pushState("",document.title,window.location.pathname+window.location.search))}connectedCallback(){super.connectedCallback(),r.subscribe("soundSettingsChanged",this._handleSoundUpdate),r.subscribe("keybindsUpdated",this._handleKeybindsUpdate),r.subscribe("ui_button_clicked",this._handleUIButtonClick),r.subscribe("statsUpdated",this._handleStatsUpdate),r.subscribe("action_escape_pressed",this._handleEscapePress),r.subscribe("levelLoaded",this._handleLevelLoad),r.subscribe("gameStateUpdated",e=>this.gameState=e),r.subscribe("assetsLoaded",e=>this.assets=e),r.subscribe("levelComplete",e=>this.levelCompleteStats=e),this.previewMode&&(this.gameHasStarted=!0,this.activeModal=null)}disconnectedCallback(){super.disconnectedCallback(),r.unsubscribe("soundSettingsChanged",this._handleSoundUpdate),r.unsubscribe("keybindsUpdated",this._handleKeybindsUpdate),r.unsubscribe("ui_button_clicked",this._handleUIButtonClick),r.unsubscribe("statsUpdated",this._handleStatsUpdate),r.unsubscribe("action_escape_pressed",this._handleEscapePress),r.unsubscribe("levelLoaded",this._handleLevelLoad),r.unsubscribe("gameStateUpdated",e=>this.gameState=e),r.unsubscribe("assetsLoaded",e=>this.assets=e),r.unsubscribe("levelComplete",e=>this.levelCompleteStats=e)}_handleLevelLoad=({gameState:e})=>{this.gameState=e,this.levelCompleteStats=null,this.gameHasStarted||(this.gameHasStarted=!0),this.activeModal=null,e.currentSection===0&&e.currentLevelIndex===0&&!e.tutorialShown&&!this.previewMode&&(this.activeModal="tutorial",r.publish("menuOpened"))};_handleSoundUpdate=e=>{this.soundSettings={...e}};_handleKeybindsUpdate=e=>{this.keybinds={...e}};_handleStatsUpdate=e=>{this.currentStats={...e}};_handleUIButtonClick=({buttonId:e})=>{e==="pause"?this.activeModal?this._closeModal():this.gameHasStarted&&(this.activeModal="pause",r.publish("menuOpened")):e==="stats"?(this.activeModal="stats",r.publish("menuOpened")):e==="enemy-catalogue"?(this.activeModal="enemy-catalogue",r.publish("menuOpened")):(this.activeModal=e,r.publish("menuOpened"))};_handleEscapePress=()=>{this.levelCompleteStats||(this.activeModal?this._closeModal():this.gameHasStarted&&(this.activeModal="pause",r.publish("menuOpened")))};_handleKeybindChange=e=>{const{action:t,newKey:i}=e.detail,s={...this.keybinds,[t]:i};r.publish("keybindsUpdated",s)};_closeModal=()=>{const e=this.activeModal!==null,t=this.activeModal;if(this.activeModal=this.gameHasStarted&&!this.previewMode?null:"main-menu",this.previewMode&&(this.activeModal=null),e&&this.gameHasStarted){if(t==="tutorial"){const i=this.gameState.markTutorialAsShown();i!==this.gameState&&(this.gameState=i,r.publish("gameStateUpdated",this.gameState))}r.publish("allMenusClosed")}};_openModalFromMenu(e){r.publish("playSound",{key:"button_click",volume:.8,channel:"UI"}),e==="editor"?window.location.href="editor.html":this.activeModal=e}_handleRestart(){this._closeModal(),r.publish("requestLevelRestart")}_handleOpenLevelsMenu(){this.activeModal="levels"}_handleExitToMenu=()=>{this.gameHasStarted=!1,this.activeModal="main-menu"};_handleLevelSelected(e){const{sectionIndex:t,levelIndex:i}=e.detail;this.activeModal="main-menu",r.publish("allMenusClosed"),requestAnimationFrame(()=>{r.publish("requestLevelLoad",{sectionIndex:t,levelIndex:i})})}_handleCharacterSelected(e){const{characterId:t}=e.detail,i=this.gameState.setSelectedCharacter(t);i!==this.gameState&&(this.gameState=i,r.publish("gameStateUpdated",this.gameState)),r.publish("playSound",{key:"button_click",volume:.8,channel:"UI"}),r.publish("characterUpdated",t)}_handleLevelAction(e){this.levelCompleteStats=null,e==="restart"?r.publish("requestLevelRestart"):e==="next"?r.publish("requestNextLevel"):e==="previous"&&r.publish("requestPreviousLevel")}render(){if(this.levelCompleteStats)return l`
        <level-complete-modal
          .stats=${this.levelCompleteStats}
          .hasNextLevel=${this.levelCompleteStats.hasNextLevel}
          .hasPreviousLevel=${this.levelCompleteStats.hasPreviousLevel}
          .fontRenderer=${this.fontRenderer}
          @next-level=${()=>this._handleLevelAction("next")}
          @restart-level=${()=>this._handleLevelAction("restart")}
          @previous-level=${()=>this._handleLevelAction("previous")}
        ></level-complete-modal>
      `;const e=!this.assets||!this.fontRenderer;return!this.gameHasStarted&&!this.previewMode?l`
        <div class="main-menu-overlay">
          ${e?this.renderLoadingScreen():this.activeModal==="main-menu"?this.renderMainMenuContent():this.renderActiveModal()}
        </div>
      `:this.renderActiveModal()}renderLoadingScreen(){return l`
        <div class="loading-container">
            <div class="loading-text">LOADING...</div>
            <div class="loading-spinner"></div>
        </div>
      `}renderMainMenuContent(){const t=this.gameState&&(this.gameState.levelProgress.completedLevels.length>0||this.gameState.levelProgress.unlockedLevels[0]>1)?"Continue":"Start Game",i=[{id:"levels",title:"Levels"},{id:"character",title:"Character"},{id:"settings",title:"Settings"},{id:"info",title:"How to Play"},{id:"editor",title:"Level Editor"}],s=n=>n.charAt(0).toUpperCase()+n.slice(1);return l`
      <div class="main-menu-container">
        <bitmap-text
          .fontRenderer=${this.fontRenderer} text="Parkour Hero" scale="9" outlineColor="black" outlineWidth="2"
        ></bitmap-text>
        <div class="main-menu-buttons">
          <button @click=${()=>{r.publish("playSound",{key:"button_click",volume:.8,channel:"UI"}),r.publish("requestStartGame")}}>
              <bitmap-text .fontRenderer=${this.fontRenderer} text=${t} scale="2.5" outlineColor="#004a99" outlineWidth="1"></bitmap-text>
          </button>
        </div>
        <div class="main-menu-icon-buttons">
            ${i.map(n=>l`
                <button class="icon-button" title=${n.title} @click=${()=>this._openModalFromMenu(n.id)}>
                    <img src="/assets/Menu/Buttons/${s(n.id)}.png" alt=${n.title}>
                </button>
            `)}
        </div>
      </div>
    `}renderActiveModal(){switch(this.activeModal){case"tutorial":return l`<tutorial-modal
                      .keybinds=${this.keybinds}
                      .fontRenderer=${this.fontRenderer}
                      @close-modal=${this._closeModal}
                    ></tutorial-modal>`;case"settings":return l`<settings-menu
                      .keybinds=${this.keybinds} .soundSettings=${this.soundSettings} .fontRenderer=${this.fontRenderer}
                      @close-modal=${this._closeModal} @keybind-changed=${this._handleKeybindChange}
                    ></settings-menu>`;case"pause":return l`<pause-modal
                      .stats=${this.currentStats} .fontRenderer=${this.fontRenderer}
                      @resume-game=${this._closeModal} @restart-level=${this._handleRestart} @open-levels-menu=${this._handleOpenLevelsMenu}
                      @exit-to-menu=${this._handleExitToMenu}
                    ></pause-modal>`;case"levels":return l`<levels-menu
                      .gameState=${this.gameState} .fontRenderer=${this.fontRenderer}
                      @close-modal=${this._closeModal} @level-selected=${this._handleLevelSelected}
                    ></levels-menu>`;case"character":return l`<character-menu
                      .gameState=${this.gameState} .assets=${this.assets} .fontRenderer=${this.fontRenderer}
                      @close-modal=${this._closeModal} @character-selected=${this._handleCharacterSelected}
                    ></character-menu>`;case"info":return l`<info-modal
                      .keybinds=${this.keybinds}
                      .fontRenderer=${this.fontRenderer}
                      @close-modal=${this._closeModal}
                    ></info-modal>`;case"stats":return l`<stats-modal
                      .gameState=${this.gameState}
                      .fontRenderer=${this.fontRenderer}
                      @close-modal=${this._closeModal}
                    ></stats-modal>`;case"enemy-catalogue":return l`<enemy-catalogue-modal
                      .fontRenderer=${this.fontRenderer}
                      @close-modal=${this._closeModal}
                    ></enemy-catalogue-modal>`;default:return l``}}}customElements.define("parkour-hero-ui",lt);const he=document.getElementById("ui-root");he?ye(document.createElement("parkour-hero-ui"),he):console.error("UI Root element #ui-root not found. UI cannot be initialized.");const R=document.getElementById("gameCanvas"),M=document.getElementById("uiCanvas"),G=document.getElementById("ui-root"),$e=R.getContext("webgl2",{alpha:!0}),X=M.getContext("2d");if(!R||!M||!X||!$e)throw console.error("A required canvas or context is not available"),document.body.innerHTML="<h1>Error: Canvas or WebGL2 not supported</h1>",new Error("Canvas or WebGL2 not available");X.imageSmoothingEnabled=!1;const ee=1920,te=1080;R.width=ee;R.height=te;M.width=ee;M.height=te;console.log(`Canvases initialized: ${ee}x${te}`);function ke(){try{const o=1.7777777777777777,e=window.innerWidth/window.innerHeight;let t,i;e>o?(i=window.innerHeight,t=i*o):(t=window.innerWidth,i=t/o);const s=Math.floor(t),n=Math.floor(i),a=`${(window.innerWidth-s)/2}px`,c=`${(window.innerHeight-n)/2}px`;[R,M,G].forEach(p=>{p&&(p.style.width=`${s}px`,p.style.height=`${n}px`,p.style.position="absolute",p.style.left=a,p.style.top=c)}),G&&(G.style.overflow="hidden"),console.log(`Canvases resized to: ${s}x${n} (display size)`)}catch(o){console.error("Error resizing canvas:",o)}}window.addEventListener("resize",ke);ke();let dt={moveLeft:"a",moveRight:"d",jump:"w",dash:" "},g;H.loadCoreAssets().then(async o=>{console.log("Core assets loaded successfully, preparing main menu...");try{const e=new Se(o.font_spritesheet);g=new Re($e,M,X,o,dt,e,H),r.publish("assetsLoaded",o);const t=document.querySelector("parkour-hero-ui");t&&(t.fontRenderer=e),r.subscribe("requestStartGame",()=>{g.start()}),await H.loadGameplayAssets(),g.renderer.syncTextures(),g.particleSystem.syncTextures(),g.soundManager.addSounds(H.assets,Ce),console.log("All gameplay assets are now loaded and ready."),window.unlockAllLevels=()=>{g&&g.gameState&&(g.gameState=g.gameState.unlockAllLevels(),r.publish("gameStateUpdated",g.gameState),console.log("All levels have been unlocked."))},console.log("Developer command available: Type `unlockAllLevels()` in the console to unlock all levels."),window.resetProgress=()=>{g&&g.gameState&&(g.gameState=g.gameState.resetProgress(),g.loadLevel(0,0),console.log("Game progress has been reset."))},console.log("Developer command available: Type `resetProgress()` in the console to reset all saved data."),console.log("Game is ready. Waiting for user to start from the main menu.")}catch(e){console.error("Failed to start game engine:",e)}}).catch(o=>{console.error("Asset loading failed:",o)});window.addEventListener("error",o=>{console.error("Global error:",o.error)});window.addEventListener("unhandledrejection",o=>{console.error("Unhandled promise rejection:",o.reason)});console.log("Game initialization started");console.log("Canvas dimensions:",R.width,"x",R.height);console.log("Device pixel ratio:",window.devicePixelRatio);console.log("User agent:",navigator.userAgent);
