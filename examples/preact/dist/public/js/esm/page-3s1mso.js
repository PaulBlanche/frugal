import * as preact from 'preact';

function Article(props) {
    return(/*#__PURE__*/ preact.h(preact.Fragment, null, /*#__PURE__*/ preact.h("h1", null, props.title), /*#__PURE__*/ preact.h("p", null, props.content)));
}

/* esm.sh - esbuild bundle(preact@10.5.14) deno production */
var x$1,d$1,W,P,F,H$1,I,A={},O=[],Y=/acit|ex(?:s|g|n|p|$)|rph|grid|ows|mnc|ntw|ine[ch]|zoo|^ord|itera/i;function k(e,t){for(var _ in t)e[_]=t[_];return e}function R(e){var t=e.parentNode;t&&t.removeChild(e);}function Z(e,t,_){var r,l,o,s={};for(o in t)o=="key"?r=t[o]:o=="ref"?l=t[o]:s[o]=t[o];if(arguments.length>2&&(s.children=arguments.length>3?x$1.call(arguments,2):_),typeof e=="function"&&e.defaultProps!=null)for(o in e.defaultProps)s[o]===void 0&&(s[o]=e.defaultProps[o]);return S(e,s,r,l,null)}function S(e,t,_,r,l){var o={type:e,props:t,key:_,ref:r,__k:null,__:null,__b:0,__e:null,__d:void 0,__c:null,__h:null,constructor:void 0,__v:l??++W};return d$1.vnode!=null&&d$1.vnode(o),o}function U(e){return e.children}function D(e,t){this.props=e,this.context=t;}function C(e,t){if(t==null)return e.__?C(e.__,e.__.__k.indexOf(e)+1):null;for(var _;t<e.__k.length;t++)if((_=e.__k[t])!=null&&_.__e!=null)return _.__e;return typeof e.type=="function"?C(e):null}function B(e){var t,_;if((e=e.__)!=null&&e.__c!=null){for(e.__e=e.__c.base=null,t=0;t<e.__k.length;t++)if((_=e.__k[t])!=null&&_.__e!=null){e.__e=e.__c.base=_.__e;break}return B(e)}}function L(e){(!e.__d&&(e.__d=!0)&&P.push(e)&&!T.__r++||H$1!==d$1.debounceRendering)&&((H$1=d$1.debounceRendering)||F)(T);}function T(){for(var e;T.__r=P.length;)e=P.sort(function(t,_){return t.__v.__b-_.__v.__b}),P=[],e.some(function(t){var _,r,l,o,s,u;t.__d&&(s=(o=(_=t).__v).__e,(u=_.__P)&&(r=[],(l=k({},o)).__v=o.__v+1,M(u,o,l,_.__n,u.ownerSVGElement!==void 0,o.__h!=null?[s]:null,r,s??C(o),o.__h),J(r,o),o.__e!=s&&B(o)));});}function $(e,t,_,r,l,o,s,u,p,a){var n,v,c,i,f,b,h,y=r&&r.__k||O,m=y.length;for(_.__k=[],n=0;n<t.length;n++)if((i=_.__k[n]=(i=t[n])==null||typeof i=="boolean"?null:typeof i=="string"||typeof i=="number"||typeof i=="bigint"?S(null,i,null,null,i):Array.isArray(i)?S(U,{children:i},null,null,null):i.__b>0?S(i.type,i.props,i.key,null,i.__v):i)!=null){if(i.__=_,i.__b=_.__b+1,(c=y[n])===null||c&&i.key==c.key&&i.type===c.type)y[n]=void 0;else for(v=0;v<m;v++){if((c=y[v])&&i.key==c.key&&i.type===c.type){y[v]=void 0;break}c=null;}M(e,i,c=c||A,l,o,s,u,p,a),f=i.__e,(v=i.ref)&&c.ref!=v&&(h||(h=[]),c.ref&&h.push(c.ref,null,i),h.push(v,i.__c||f,i)),f!=null?(b==null&&(b=f),typeof i.type=="function"&&i.__k!=null&&i.__k===c.__k?i.__d=p=V(i,p,e):p=j(e,i,c,y,f,p),a||_.type!=="option"?typeof _.type=="function"&&(_.__d=p):e.value=""):p&&c.__e==p&&p.parentNode!=e&&(p=C(c));}for(_.__e=b,n=m;n--;)y[n]!=null&&(typeof _.type=="function"&&y[n].__e!=null&&y[n].__e==_.__d&&(_.__d=C(r,n+1)),Q(y[n],y[n]));if(h)for(n=0;n<h.length;n++)K(h[n],h[++n],h[++n]);}function V(e,t,_){var r,l;for(r=0;r<e.__k.length;r++)(l=e.__k[r])&&(l.__=e,t=typeof l.type=="function"?V(l,t,_):j(_,l,l,e.__k,l.__e,t));return t}function j(e,t,_,r,l,o){var s,u,p;if(t.__d!==void 0)s=t.__d,t.__d=void 0;else if(_==null||l!=o||l.parentNode==null)e:if(o==null||o.parentNode!==e)e.appendChild(l),s=null;else {for(u=o,p=0;(u=u.nextSibling)&&p<r.length;p+=2)if(u==l)break e;e.insertBefore(l,o),s=o;}return s!==void 0?s:l.nextSibling}function te(e,t,_,r,l){var o;for(o in _)o==="children"||o==="key"||o in t||N(e,o,null,_[o],r);for(o in t)l&&typeof t[o]!="function"||o==="children"||o==="key"||o==="value"||o==="checked"||_[o]===t[o]||N(e,o,t[o],_[o],r);}function z(e,t,_){t[0]==="-"?e.setProperty(t,_):e[t]=_==null?"":typeof _!="number"||Y.test(t)?_:_+"px";}function N(e,t,_,r,l){var o;e:if(t==="style")if(typeof _=="string")e.style.cssText=_;else {if(typeof r=="string"&&(e.style.cssText=r=""),r)for(t in r)_&&t in _||z(e.style,t,"");if(_)for(t in _)r&&_[t]===r[t]||z(e.style,t,_[t]);}else if(t[0]==="o"&&t[1]==="n")o=t!==(t=t.replace(/Capture$/,"")),t=t.toLowerCase()in e?t.toLowerCase().slice(2):t.slice(2),e.l||(e.l={}),e.l[t+o]=_,_?r||e.addEventListener(t,o?q:G,o):e.removeEventListener(t,o?q:G,o);else if(t!=="dangerouslySetInnerHTML"){if(l)t=t.replace(/xlink[H:h]/,"h").replace(/sName$/,"s");else if(t!=="href"&&t!=="list"&&t!=="form"&&t!=="tabIndex"&&t!=="download"&&t in e)try{e[t]=_??"";break e}catch{}typeof _=="function"||(_!=null&&(_!==!1||t[0]==="a"&&t[1]==="r")?e.setAttribute(t,_):e.removeAttribute(t));}}function G(e){this.l[e.type+!1](d$1.event?d$1.event(e):e);}function q(e){this.l[e.type+!0](d$1.event?d$1.event(e):e);}function M(e,t,_,r,l,o,s,u,p){var a,n,v,c,i,f,b,h,y,m,w,g=t.type;if(t.constructor!==void 0)return null;_.__h!=null&&(p=_.__h,u=t.__e=_.__e,t.__h=null,o=[u]),(a=d$1.__b)&&a(t);try{e:if(typeof g=="function"){if(h=t.props,y=(a=g.contextType)&&r[a.__c],m=a?y?y.props.value:a.__:r,_.__c?b=(n=t.__c=_.__c).__=n.__E:("prototype"in g&&g.prototype.render?t.__c=n=new g(h,m):(t.__c=n=new D(h,m),n.constructor=g,n.render=ne),y&&y.sub(n),n.props=h,n.state||(n.state={}),n.context=m,n.__n=r,v=n.__d=!0,n.__h=[]),n.__s==null&&(n.__s=n.state),g.getDerivedStateFromProps!=null&&(n.__s==n.state&&(n.__s=k({},n.__s)),k(n.__s,g.getDerivedStateFromProps(h,n.__s))),c=n.props,i=n.state,v)g.getDerivedStateFromProps==null&&n.componentWillMount!=null&&n.componentWillMount(),n.componentDidMount!=null&&n.__h.push(n.componentDidMount);else {if(g.getDerivedStateFromProps==null&&h!==c&&n.componentWillReceiveProps!=null&&n.componentWillReceiveProps(h,m),!n.__e&&n.shouldComponentUpdate!=null&&n.shouldComponentUpdate(h,n.__s,m)===!1||t.__v===_.__v){n.props=h,n.state=n.__s,t.__v!==_.__v&&(n.__d=!1),n.__v=t,t.__e=_.__e,t.__k=_.__k,t.__k.forEach(function(E){E&&(E.__=t);}),n.__h.length&&s.push(n);break e}n.componentWillUpdate!=null&&n.componentWillUpdate(h,n.__s,m),n.componentDidUpdate!=null&&n.__h.push(function(){n.componentDidUpdate(c,i,f);});}n.context=m,n.props=h,n.state=n.__s,(a=d$1.__r)&&a(t),n.__d=!1,n.__v=t,n.__P=e,a=n.render(n.props,n.state,n.context),n.state=n.__s,n.getChildContext!=null&&(r=k(k({},r),n.getChildContext())),v||n.getSnapshotBeforeUpdate==null||(f=n.getSnapshotBeforeUpdate(c,i)),w=a!=null&&a.type===U&&a.key==null?a.props.children:a,$(e,Array.isArray(w)?w:[w],t,_,r,l,o,s,u,p),n.base=t.__e,t.__h=null,n.__h.length&&s.push(n),b&&(n.__E=n.__=null),n.__e=!1;}else o==null&&t.__v===_.__v?(t.__k=_.__k,t.__e=_.__e):t.__e=_e(_.__e,t,_,r,l,o,s,p);(a=d$1.diffed)&&a(t);}catch(E){t.__v=null,(p||o!=null)&&(t.__e=u,t.__h=!!p,o[o.indexOf(u)]=null),d$1.__e(E,t,_);}}function J(e,t){d$1.__c&&d$1.__c(t,e),e.some(function(_){try{e=_.__h,_.__h=[],e.some(function(r){r.call(_);});}catch(r){d$1.__e(r,_.__v);}});}function _e(e,t,_,r,l,o,s,u){var p,a,n,v=_.props,c=t.props,i=t.type,f=0;if(i==="svg"&&(l=!0),o!=null){for(;f<o.length;f++)if((p=o[f])&&(p===e||(i?p.localName==i:p.nodeType==3))){e=p,o[f]=null;break}}if(e==null){if(i===null)return document.createTextNode(c);e=l?document.createElementNS("http://www.w3.org/2000/svg",i):document.createElement(i,c.is&&c),o=null,u=!1;}if(i===null)v===c||u&&e.data===c||(e.data=c);else {if(o=o&&x$1.call(e.childNodes),a=(v=_.props||A).dangerouslySetInnerHTML,n=c.dangerouslySetInnerHTML,!u){if(o!=null)for(v={},f=0;f<e.attributes.length;f++)v[e.attributes[f].name]=e.attributes[f].value;(n||a)&&(n&&(a&&n.__html==a.__html||n.__html===e.innerHTML)||(e.innerHTML=n&&n.__html||""));}if(te(e,c,v,l,u),n)t.__k=[];else if(f=t.props.children,$(e,Array.isArray(f)?f:[f],t,_,r,l&&i!=="foreignObject",o,s,o?o[0]:_.__k&&C(_,0),u),o!=null)for(f=o.length;f--;)o[f]!=null&&R(o[f]);u||("value"in c&&(f=c.value)!==void 0&&(f!==e.value||i==="progress"&&!f)&&N(e,"value",f,v.value,!1),"checked"in c&&(f=c.checked)!==void 0&&f!==e.checked&&N(e,"checked",f,v.checked,!1));}return e}function K(e,t,_){try{typeof e=="function"?e(t):e.current=t;}catch(r){d$1.__e(r,_);}}function Q(e,t,_){var r,l;if(d$1.unmount&&d$1.unmount(e),(r=e.ref)&&(r.current&&r.current!==e.__e||K(r,null,t)),(r=e.__c)!=null){if(r.componentWillUnmount)try{r.componentWillUnmount();}catch(o){d$1.__e(o,t);}r.base=r.__P=null;}if(r=e.__k)for(l=0;l<r.length;l++)r[l]&&Q(r[l],t,typeof e.type!="function");_||e.__e==null||R(e.__e),e.__e=e.__d=void 0;}function ne(e,t,_){return this.constructor(e,_)}function oe(e,t,_){var r,l,o;d$1.__&&d$1.__(e,t),l=(r=typeof _=="function")?null:_&&_.__k||t.__k,o=[],M(t,e=(!r&&_||t).__k=Z(U,null,[e]),l||A,A,t.ownerSVGElement!==void 0,!r&&_?[_]:l?null:t.firstChild?x$1.call(t.childNodes):null,o,!r&&_?_:l?l.__e:t.firstChild,r),J(o,e);}function se(e,t){var _={__c:t="__cC"+I++,__:e,Consumer:function(r,l){return r.children(l)},Provider:function(r){var l,o;return this.getChildContext||(l=[],(o={})[t]=this,this.getChildContext=function(){return o},this.shouldComponentUpdate=function(s){this.props.value!==s.value&&l.some(L);},this.sub=function(s){l.push(s);var u=s.componentWillUnmount;s.componentWillUnmount=function(){l.splice(l.indexOf(s),1),u&&u.call(s);};}),r.children}};return _.Provider.__=_.Consumer.contextType=_}x$1=O.slice,d$1={__e:function(e,t){for(var _,r,l;t=t.__;)if((_=t.__c)&&!_.__)try{if((r=_.constructor)&&r.getDerivedStateFromError!=null&&(_.setState(r.getDerivedStateFromError(e)),l=_.__d),_.componentDidCatch!=null&&(_.componentDidCatch(e),l=_.__d),l)return _.__E=_}catch(o){e=o;}throw e}},W=0,D.prototype.setState=function(e,t){var _;_=this.__s!=null&&this.__s!==this.state?this.__s:this.__s=k({},this.state),typeof e=="function"&&(e=e(k({},_),this.props)),e&&k(_,e),e!=null&&this.__v&&(t&&this.__h.push(t),L(this));},D.prototype.forceUpdate=function(e){this.__v&&(this.__e=!0,e&&this.__h.push(e),L(this));},D.prototype.render=U,P=[],F=typeof Promise=="function"?Promise.prototype.then.bind(Promise.resolve()):setTimeout,T.__r=0,I=0;

/* esm.sh - esbuild bundle(preact@10.5.14/hooks) deno production */
var l,h=[],H=d$1.__b,p=d$1.__r,d=d$1.diffed,y=d$1.__c,E=d$1.unmount;function x(){h.forEach(function(_){if(_.__P)try{_.__H.__h.forEach(s),_.__H.__h.forEach(m),_.__H.__h=[];}catch(n){_.__H.__h=[],d$1.__e(n,_.__v);}}),h=[];}d$1.__b=function(_){H&&H(_);},d$1.__r=function(_){p&&p(_);var n=(_.__c).__H;n&&(n.__h.forEach(s),n.__h.forEach(m),n.__h=[]);},d$1.diffed=function(_){d&&d(_);var n=_.__c;n&&n.__H&&n.__H.__h.length&&(h.push(n)!==1&&l===d$1.requestAnimationFrame||((l=d$1.requestAnimationFrame)||function(t){var u,o=function(){clearTimeout(f),g&&cancelAnimationFrame(u),setTimeout(t);},f=setTimeout(o,100);g&&(u=requestAnimationFrame(o));})(x));},d$1.__c=function(_,n){n.some(function(t){try{t.__h.forEach(s),t.__h=t.__h.filter(function(u){return !u.__||m(u)});}catch(u){n.some(function(o){o.__h&&(o.__h=[]);}),n=[],d$1.__e(u,t.__v);}}),y&&y(_,n);},d$1.unmount=function(_){E&&E(_);var n=_.__c;if(n&&n.__H)try{n.__H.__.forEach(s);}catch(t){d$1.__e(t,n.__v);}};var g=typeof requestAnimationFrame=="function";function s(_){typeof _.__c=="function"&&_.__c();}function m(_){_.__c=_.__();}

const dataContext = se(undefined);
function DataProvider({ context , children  }) {
    if (typeof window.document === "undefined") {
        return(/*#__PURE__*/ Z(U, null, context && /*#__PURE__*/ Z("script", {
            dangerouslySetInnerHTML: {
                __html: `window.__FRUGAL__ = window.__FRUGAL__ || {}; 
window.__FRUGAL__.context = ${JSON.stringify(context)}`.replace(/<\/script>/g, "<\\/script>")
            }
        }), /*#__PURE__*/ Z(dataContext.Provider, {
            value: context
        }, children)));
    } else {
        return(/*#__PURE__*/ Z(dataContext.Provider, {
            value: window.__FRUGAL__.context
        }, children));
    }
}

function hydrate(name, getApp) {
    const hydratableOnLoad = queryHydratables(name, "load");
    if (hydratableOnLoad.length !== 0) {
        hydrateOnLoad(hydratableOnLoad, getApp);
    }
    const hydratableOnVisible = queryHydratables(name, "visible");
    if (hydratableOnVisible.length !== 0) {
        hydrateOnVisible(hydratableOnVisible, getApp);
    }
    const hydratableOnIdle = queryHydratables(name, "idle");
    if (hydratableOnIdle.length !== 0) {
        hydrateOnIdle(hydratableOnIdle, getApp);
    }
    const hydratableOnMediaQuery = queryHydratables(name, "media-query");
    if (hydratableOnMediaQuery.length !== 0) {
        hydrateOnMediaQuery(hydratableOnMediaQuery, getApp);
    }
}
function hydrateOnLoad(hydratables, getApp) {
    hydratables.forEach((root)=>{
        hydrateElement(root, getApp());
    });
}
function hydrateOnIdle(hydratables, getApp) {
    setTimeout(()=>{
        hydratables.forEach((root)=>{
            hydrateElement(root, getApp());
        });
    }, 10);
}
function hydrateOnVisible(hydratables, getApp) {
    const observer1 = new IntersectionObserver((entries, observer)=>{
        entries.forEach((entry)=>{
            if (entry.isIntersecting) {
                hydrateElement(entry.target, getApp());
                observer.unobserve(entry.target);
            }
        });
    });
    hydratables.forEach((root)=>{
        observer1.observe(root);
    });
}
function hydrateOnMediaQuery(hydratables, getApp) {
    hydratables.forEach((root)=>{
        const query = root.dataset["hydrationQuery"];
        if (query && matchMedia(query)) {
            hydrateElement(root, getApp());
        }
    });
}
function queryHydratables(name, strategy) {
    return document.querySelectorAll(`[data-hydratable="${name}"][data-hydration-strategy="${strategy}"]`);
}
async function hydrateElement(root, App) {
    const data = root.querySelector('[type="application/json"]');
    const props = JSON.parse(data.textContent);
    const syncApp = await App(props);
    oe(/*#__PURE__*/ Z(DataProvider, null, syncApp), root);
}

const NAME = "article";
function main() {
    console.log('mounting Article');
    hydrate(NAME, ()=>Article
    );
}

main();
