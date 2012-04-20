(function($, exports, undefined){

var ksh = {};

// https://gist.github.com/964849
ksh.parseUrl = function(a){return function(b,c,d){a.href=b;c={};for(d in a)if(""+a[d]===a[d])c[d]=a[d];return c}}(document.createElement("a"));

ksh.explodeUrl = function($el){

	if( $el.length === 0 ) return;

	var  url = ksh.parseUrl( $el[0].href )
		,toShow = ['protocol', 'hostname', 'port', 'pathname']
		,i
		,part
		,all = '';

	for(i = 0; i < toShow.length; i++){
		part = toShow[i];
		if( url[part] !== '' || url[part] > 0 ){
			all += '<span class="exploded-url">'
				+ '<span class="exploded-url-part">[' + part + ']</span>'
				+ '<span class="exploded-url-value">' + url[part] + '</span>'
				+ '</span>';
		}
	}

	$el.html(all);
}

ksh.githubFeed = function($container, tpl){

	function render(feed){
		//console.log(feed);

		var all = feed.slice(0, 8).map(function(item){ return tpl(item) });
		$container.append(all.join('\n'));
	}

	var  url = 'https://github.com/kirbysayshi.json'
		,req = $.ajax({ url: url, type: 'GET', dataType: 'jsonp' });

	req.done(render);
}

ksh.twitterFeed = function($container, tpl){

	function render(feed){
		//console.log(feed);

		var all = feed.slice(0, 8).map(function(item){ return tpl(item) });
		$container.append(all.join('\n'));
	}

	var  url = 'http://api.twitter.com/1/statuses/user_timeline/kirbysayshi.json'
		,req = $.ajax({ url: url, type: 'GET', dataType: 'jsonp' });

	req.done(render);
}

ksh.hasHN = function(cb, url){

    url = encodeURIComponent(url || document.location);

    var  head = document.head || document.getElementsByTagName( "head" )[0] || document.documentElement
        ,callbackName = 'hasHN_' + ((Math.random() * 100000)|0)
        ,src = 'http://api.thriftdb.com/api.hnsearch.com/items/_search'
            + '?callback=' + callbackName
            + '&filter[fields][url]=' + url
        ,tag = document.createElement('script');

    tag.async = 'async';
    tag.src = src;
    head.insertBefore( tag, head.firstChild );

    window[callbackName] = function(response){

        if(!response){
            cb(new Error('unknown error'), response);
            return;
        }

        if(response.hits > 0 && response.results.length > 0){
            cb(null, response.results[0].item )
        } else {
            cb(new Error('no results found'), response);
        }
    }
}

ksh.redirector = function(){

	var routes = {
		 '/else/2009/07/01/succulent-netbeans.html': '/2009/07/01/succulent-netbeans.html'
		,'/JavaScript/2012/03/14/introducing-twitter-sequencer.html': '/2012/03/14/introducing-twitter-sequencer.html'
		,'/flash/2009/07/07/smashmmo.html': '/2009/07/07/smashmmo.html'
		,'/flash/2009/07/08/portable-spacetime-displacement-unit-01.html': '/2009/07/08/portable-spacetime-displacement-unit-01.html'
		,'/projects.html': '/'
		,'/blog.html': '/'
		,'/me.html': '#contact'
		,'/resume.html': 'http://careers.stackoverflow.com/senofpeter'
	}

	var tpl = vash.compile($('#tpl-404-match').html())
		,matched;

	if(window.location.pathname in routes){

		matched = routes[window.location.pathname];

		$('#content-container article').append( tpl({ redirect: matched }) );

		setTimeout(function(){
			window.location = matched;
		}, 3000);
	}
}

ksh.defaultInit = function(){
	ksh.githubFeed( $('.github-feed'), vash.compile($('#tpl-github-feed-item').html()) );
	ksh.twitterFeed( $('.twitter-feed'), vash.compile($('#tpl-twitter-feed-item').html()) );

	ksh.explodeUrl( $('.post .project-url') );

	if($('body').hasClass('page-404')){
		ksh.redirector();
	}

	if($('body').hasClass('page-post')){

		ksh.hasHN(function(err, item){

			var id = '';

			if(!err){
				id = 'found'
			} else {
				id = 'none'
			}

			var tpl = vash.compile($('#tpl-hn-link-' + id).html())

			$('.hn-link').append( tpl( { hnlink: item.url } ) )
		})
	}

	$('#social-contacts-header .header-contact').on('click', function(e){
		e.preventDefault();
		e.stopPropagation();

		$('#footer-container footer').cutout({
			 fadeInDuration: 100
			,roundness: 15
			,cutoutPaddingX: 5
			,cutoutPaddingY: 0
			,softness: 4
			,onDrawComplete: function(){
				$.scrollTo( $('#contact'), {
					duration: 1000
					,onAfter: function(){
						setTimeout(function(){
							// this is a bit of a hack until .cutout returns the element or something
							$('.cutout-canvas').animate({ opacity: 0 }, 1000, function(){
								$(this).remove();
								window.location.hash = 'contact';
							});
						}, 500);
					}
				})
			}
		});
	})
}

exports.ksh = ksh;

})(jQuery, window);


// cutout plugin
;(function(a,b){a.fn.cutout=function(b){function d(a,b,c,d,e,f){a.beginPath(),a.moveTo(b,c+f),a.lineTo(b,c+e-f),a.quadraticCurveTo(b,c+e,b+f,c+e),a.lineTo(b+d-f,c+e),a.quadraticCurveTo(b+d,c+e,b+d,c+e-f),a.lineTo(b+d,c+f),a.quadraticCurveTo(b+d,c,b+d-f,c),a.lineTo(b+f,c),a.quadraticCurveTo(b,c,b,c+f),a.fill()}var c={opacity:.6,fadeInDuration:500,color:"#000000",cutoutPaddingX:0,cutoutPaddingY:0,softness:5,roundness:5,drawOverride:!1,parent:"body",autoResize:!0,killOnEvents:["click"],onDrawComplete:function(){},onDestroy:function(){}};return this.each(function(e){function t(){n={top:parseFloat(h.css("marginTop")),right:parseFloat(h.css("marginRight")),bottom:parseFloat(h.css("marginBottom")),left:parseFloat(h.css("marginLeft"))},k=j.offset(),l={width:0,height:0},m=h.offset(),r={x:0,y:0},s={width:0,height:0},c.drawOverride!==!1?(r.x=c.drawOverride.min.x-c.cutoutPaddingX,r.y=c.drawOverride.min.y-c.cutoutPaddingY,s.width=c.drawOverride.max.x-c.drawOverride.min.x+c.cutoutPaddingX*2,s.height=c.drawOverride.max.y-c.drawOverride.min.y+c.cutoutPaddingY*2):(l={width:j.width(),height:j.height()},r.x=k.left-m.left-c.cutoutPaddingX+n.left,r.y=k.top-m.top-c.cutoutPaddingY+n.top,s.width=l.width+c.cutoutPaddingX*2+parseInt(j.css("paddingLeft"))+parseInt(j.css("paddingRight")),s.height=l.height+c.cutoutPaddingY*2+parseInt(j.css("paddingTop"))+parseInt(j.css("paddingBottom")))}function u(){var a;q.canvas.width=q.canvas.width,q.save(),q.fillStyle=c.color,q.globalAlpha=c.opacity,q.fillRect(0,0,f[0].width,f[0].height),q.restore(),q.save(),q.globalCompositeOperation="destination-out",q.fillStyle="#FFFFFF",q.shadowOffsetX=0,q.shadowOffsetY=0,q.shadowColor="rgba(0,0,0,1)",d(q,r.x,r.y,s.width,s.height,c.roundness);for(a=0;a<c.softness;a++)q.shadowBlur=a===0?400:50*a,d(q,r.x,r.y,s.width,s.height,c.roundness);q.restore()}function v(){var b=25,c=5;f.append(a("<div/>").css({position:"absolute",width:s.width+c*2,height:s.height+c*2,opacity:.8,border:b+"px solid #333333",top:r.y-n.top-b-c,left:r.x-n.left-b-c}))}function w(){console.log("destroy called"),f.remove(),g.unbind("resize",x),c.onDestroy.call(j)}function x(){clearTimeout(i),i=setTimeout(function(){u()},500)}b&&a.extend(c,b);var f,g=a(window),h=a(c.parent),i=0,j=a(this),k,l,m,n,o,p,q,r,s;f=a("<canvas/>",{"class":"cutout-canvas",css:{position:"absolute",zIndex:"2147483647"}}),document.body===h[0]&&h.css({height:"auto",width:"auto",marginTop:"-=1px",paddingTop:"+=1px"}),h.css({position:"relative"}),t(),f.attr({width:document.body===h[0]?Math.max(g.width(),h.outerWidth(!0)):h.outerWidth(!0),height:document.body===h[0]?Math.max(g.height(),h.outerHeight(!0)):h.outerHeight(!0)}),f.css({top:0-n.top,left:0-n.left});try{q=f[0].getContext("2d"),u()}catch(e){f=a("<div/>",{"class":"cutout-canvas",css:{position:"absolute",top:0-n.top,left:0-n.left,zIndex:"9000",width:f.attr("width"),height:f.attr("height")}}),v()}f.css({display:"none"}).appendTo(h).fadeIn(c.fadeInDuration,function(){c.onDrawComplete.call(j)}),c.autoResize===!0&&g.bind("resize",x),a.each(c.killOnEvents,function(){var a=this,b=a==="scroll"||a==="resize"?g:f;b.bind(a.toString(),w)})})}})(jQuery)

/**
 * jQuery.ScrollTo
 * Copyright (c) 2007-2009 Ariel Flesler - aflesler(at)gmail(dot)com | http://flesler.blogspot.com
 * Dual licensed under MIT and GPL.
 * Date: 5/25/2009
 *
 * @projectDescription Easy element scrolling using jQuery.
 * http://flesler.blogspot.com/2007/10/jqueryscrollto.html
 * Works with jQuery +1.2.6. Tested on FF 2/3, IE 6/7/8, Opera 9.5/6, Safari 3, Chrome 1 on WinXP.
 *
 * @author Ariel Flesler
 * @version 1.4.2
 *
 */
;(function(a){function c(a){return typeof a=="object"?a:{top:a,left:a}}var b=a.scrollTo=function(b,c,d){a(window).scrollTo(b,c,d)};b.defaults={axis:"xy",duration:parseFloat(a.fn.jquery)>=1.3?0:1},b.window=function(b){return a(window)._scrollable()},a.fn._scrollable=function(){return this.map(function(){var b=this,c=!b.nodeName||a.inArray(b.nodeName.toLowerCase(),["iframe","#document","html","body"])!=-1;if(!c)return b;var d=(b.contentWindow||b).document||b.ownerDocument||b;return a.browser.safari||d.compatMode=="BackCompat"?d.body:d.documentElement})},a.fn.scrollTo=function(d,e,f){return typeof e=="object"&&(f=e,e=0),typeof f=="function"&&(f={onAfter:f}),d=="max"&&(d=9e9),f=a.extend({},b.defaults,f),e=e||f.speed||f.duration,f.queue=f.queue&&f.axis.length>1,f.queue&&(e/=2),f.offset=c(f.offset),f.over=c(f.over),this._scrollable().each(function(){function m(a){h.animate(k,e,f.easing,a&&function(){a.call(this,d,f)})}var g=this,h=a(g),i=d,j,k={},l=h.is("html,body");switch(typeof i){case"number":case"string":if(/^([+-]=)?\d+(\.\d+)?(px|%)?$/.test(i)){i=c(i);break}i=a(i,this);case"object":if(i.is||i.style)j=(i=a(i)).offset()}a.each(f.axis.split(""),function(a,c){var d=c=="x"?"Left":"Top",e=d.toLowerCase(),n="scroll"+d,o=g[n],p=b.max(g,c);if(j)k[n]=j[e]+(l?0:o-h.offset()[e]),f.margin&&(k[n]-=parseInt(i.css("margin"+d))||0,k[n]-=parseInt(i.css("border"+d+"Width"))||0),k[n]+=f.offset[e]||0,f.over[e]&&(k[n]+=i[c=="x"?"width":"height"]()*f.over[e]);else{var q=i[e];k[n]=q.slice&&q.slice(-1)=="%"?parseFloat(q)/100*p:q}/^\d+$/.test(k[n])&&(k[n]=k[n]<=0?0:Math.min(k[n],p)),!a&&f.queue&&(o!=k[n]&&m(f.onAfterFirst),delete k[n])}),m(f.onAfter)}).end()},b.max=function(b,c){var d=c=="x"?"Width":"Height",e="scroll"+d;if(!a(b).is("html,body"))return b[e]-a(b)[d.toLowerCase()]();var f="client"+d,g=b.ownerDocument.documentElement,h=b.ownerDocument.body;return Math.max(g[e],h[e])-Math.min(g[f],h[f])}})(jQuery)

/*!
	es5-shim

    Copyright (c) 2009, 280 North Inc. http://280north.com/
    MIT License. http://github.com/280north/narwhal/blob/master/README.md
*/
;(function(n){"function"==typeof define?define(n):n()})(function(){function n(a){try{return Object.defineProperty(a,"sentinel",{}),"sentinel"in a}catch(d){}}if(!Function.prototype.bind)Function.prototype.bind=function(a){var d=this;if("function"!=typeof d)throw new TypeError;var b=p.call(arguments,1),c=function(){if(this instanceof c){var e=function(){};e.prototype=d.prototype;var e=new e,g=d.apply(e,b.concat(p.call(arguments)));return null!==g&&Object(g)===g?g:e}return d.apply(a,b.concat(p.call(arguments)))};
return c};var l=Function.prototype.call,f=Object.prototype,p=Array.prototype.slice,m=l.bind(f.toString),h=l.bind(f.hasOwnProperty),t,u,q,r,o;if(o=h(f,"__defineGetter__"))t=l.bind(f.__defineGetter__),u=l.bind(f.__defineSetter__),q=l.bind(f.__lookupGetter__),r=l.bind(f.__lookupSetter__);if(!Array.isArray)Array.isArray=function(a){return"[object Array]"==m(a)};if(!Array.prototype.forEach)Array.prototype.forEach=function(a,d){var b=i(this),c=0,e=b.length>>>0;if("[object Function]"!=m(a))throw new TypeError;
for(;c<e;)c in b&&a.call(d,b[c],c,b),c++};if(!Array.prototype.map)Array.prototype.map=function(a,d){var b=i(this),c=b.length>>>0,e=Array(c);if("[object Function]"!=m(a))throw new TypeError;for(var g=0;g<c;g++)g in b&&(e[g]=a.call(d,b[g],g,b));return e};if(!Array.prototype.filter)Array.prototype.filter=function(a,d){var b=i(this),c=b.length>>>0,e=[];if("[object Function]"!=m(a))throw new TypeError;for(var g=0;g<c;g++)g in b&&a.call(d,b[g],g,b)&&e.push(b[g]);return e};if(!Array.prototype.every)Array.prototype.every=
function(a,d){var b=i(this),c=b.length>>>0;if("[object Function]"!=m(a))throw new TypeError;for(var e=0;e<c;e++)if(e in b&&!a.call(d,b[e],e,b))return!1;return!0};if(!Array.prototype.some)Array.prototype.some=function(a,d){var b=i(this),c=b.length>>>0;if("[object Function]"!=m(a))throw new TypeError;for(var e=0;e<c;e++)if(e in b&&a.call(d,b[e],e,b))return!0;return!1};if(!Array.prototype.reduce)Array.prototype.reduce=function(a){var d=i(this),b=d.length>>>0;if("[object Function]"!=m(a))throw new TypeError;
if(!b&&1==arguments.length)throw new TypeError;var c=0,e;if(2<=arguments.length)e=arguments[1];else{do{if(c in d){e=d[c++];break}if(++c>=b)throw new TypeError;}while(1)}for(;c<b;c++)c in d&&(e=a.call(void 0,e,d[c],c,d));return e};if(!Array.prototype.reduceRight)Array.prototype.reduceRight=function(a){var d=i(this),b=d.length>>>0;if("[object Function]"!=m(a))throw new TypeError;if(!b&&1==arguments.length)throw new TypeError;var c,b=b-1;if(2<=arguments.length)c=arguments[1];else{do{if(b in d){c=d[b--];
break}if(0>--b)throw new TypeError;}while(1)}do b in this&&(c=a.call(void 0,c,d[b],b,d));while(b--);return c};if(!Array.prototype.indexOf)Array.prototype.indexOf=function(a){var d=i(this),b=d.length>>>0;if(!b)return-1;var c=0;1<arguments.length&&(c=v(arguments[1]));for(c=0<=c?c:Math.max(0,b+c);c<b;c++)if(c in d&&d[c]===a)return c;return-1};if(!Array.prototype.lastIndexOf)Array.prototype.lastIndexOf=function(a){var d=i(this),b=d.length>>>0;if(!b)return-1;var c=b-1;1<arguments.length&&(c=Math.min(c,
v(arguments[1])));for(c=0<=c?c:b-Math.abs(c);0<=c;c--)if(c in d&&a===d[c])return c;return-1};if(!Object.getPrototypeOf)Object.getPrototypeOf=function(a){return a.__proto__||(a.constructor?a.constructor.prototype:f)};if(!Object.getOwnPropertyDescriptor)Object.getOwnPropertyDescriptor=function(a,d){if("object"!=typeof a&&"function"!=typeof a||null===a)throw new TypeError("Object.getOwnPropertyDescriptor called on a non-object: "+a);if(h(a,d)){var b,c,e;b={enumerable:!0,configurable:!0};if(o){var g=
a.__proto__;a.__proto__=f;c=q(a,d);e=r(a,d);a.__proto__=g;if(c||e){if(c)b.get=c;if(e)b.set=e;return b}}b.value=a[d];return b}};if(!Object.getOwnPropertyNames)Object.getOwnPropertyNames=function(a){return Object.keys(a)};if(!Object.create)Object.create=function(a,d){var b;if(null===a)b={__proto__:null};else{if("object"!=typeof a)throw new TypeError("typeof prototype["+typeof a+"] != 'object'");b=function(){};b.prototype=a;b=new b;b.__proto__=a}void 0!==d&&Object.defineProperties(b,d);return b};if(Object.defineProperty){var l=
n({}),y="undefined"==typeof document||n(document.createElement("div"));if(!l||!y)var s=Object.defineProperty}if(!Object.defineProperty||s)Object.defineProperty=function(a,d,b){if("object"!=typeof a&&"function"!=typeof a||null===a)throw new TypeError("Object.defineProperty called on non-object: "+a);if("object"!=typeof b&&"function"!=typeof b||null===b)throw new TypeError("Property description must be an object: "+b);if(s)try{return s.call(Object,a,d,b)}catch(c){}if(h(b,"value"))if(o&&(q(a,d)||r(a,
d))){var e=a.__proto__;a.__proto__=f;delete a[d];a[d]=b.value;a.__proto__=e}else a[d]=b.value;else{if(!o)throw new TypeError("getters & setters can not be defined on this javascript engine");h(b,"get")&&t(a,d,b.get);h(b,"set")&&u(a,d,b.set)}return a};if(!Object.defineProperties)Object.defineProperties=function(a,d){for(var b in d)h(d,b)&&Object.defineProperty(a,b,d[b]);return a};if(!Object.seal)Object.seal=function(a){return a};if(!Object.freeze)Object.freeze=function(a){return a};try{Object.freeze(function(){})}catch(D){Object.freeze=
function(a){return function(d){return"function"==typeof d?d:a(d)}}(Object.freeze)}if(!Object.preventExtensions)Object.preventExtensions=function(a){return a};if(!Object.isSealed)Object.isSealed=function(){return!1};if(!Object.isFrozen)Object.isFrozen=function(){return!1};if(!Object.isExtensible)Object.isExtensible=function(a){if(Object(a)!==a)throw new TypeError;for(var d="";h(a,d);)d+="?";a[d]=!0;var b=h(a,d);delete a[d];return b};if(!Object.keys){var w=!0,x="toString,toLocaleString,valueOf,hasOwnProperty,isPrototypeOf,propertyIsEnumerable,constructor".split(","),
z=x.length,j;for(j in{toString:null})w=!1;Object.keys=function(a){if("object"!=typeof a&&"function"!=typeof a||null===a)throw new TypeError("Object.keys called on a non-object");var d=[],b;for(b in a)h(a,b)&&d.push(b);if(w)for(b=0;b<z;b++){var c=x[b];h(a,c)&&d.push(c)}return d}}if(!Date.prototype.toISOString||-1===(new Date(-621987552E5)).toISOString().indexOf("-000001"))Date.prototype.toISOString=function(){var a,d,b,c;if(!isFinite(this))throw new RangeError;a=[this.getUTCMonth()+1,this.getUTCDate(),
this.getUTCHours(),this.getUTCMinutes(),this.getUTCSeconds()];c=this.getUTCFullYear();c=(0>c?"-":9999<c?"+":"")+("00000"+Math.abs(c)).slice(0<=c&&9999>=c?-4:-6);for(d=a.length;d--;)b=a[d],10>b&&(a[d]="0"+b);return c+"-"+a.slice(0,2).join("-")+"T"+a.slice(2).join(":")+"."+("000"+this.getUTCMilliseconds()).slice(-3)+"Z"};if(!Date.now)Date.now=function(){return(new Date).getTime()};if(!Date.prototype.toJSON)Date.prototype.toJSON=function(){if("function"!=typeof this.toISOString)throw new TypeError;return this.toISOString()};
if(!Date.parse||864E13!==Date.parse("+275760-09-13T00:00:00.000Z"))Date=function(a){var d=function g(b,d,c,f,h,i,j){var k=arguments.length;return this instanceof a?(k=1==k&&""+b===b?new a(g.parse(b)):7<=k?new a(b,d,c,f,h,i,j):6<=k?new a(b,d,c,f,h,i):5<=k?new a(b,d,c,f,h):4<=k?new a(b,d,c,f):3<=k?new a(b,d,c):2<=k?new a(b,d):1<=k?new a(b):new a,k.constructor=g,k):a.apply(this,arguments)},b=RegExp("^(\\d{4}|[+-]\\d{6})(?:-(\\d{2})(?:-(\\d{2})(?:T(\\d{2}):(\\d{2})(?::(\\d{2})(?:\\.(\\d{3}))?)?(?:Z|(?:([-+])(\\d{2}):(\\d{2})))?)?)?)?$"),
c;for(c in a)d[c]=a[c];d.now=a.now;d.UTC=a.UTC;d.prototype=a.prototype;d.prototype.constructor=d;d.parse=function(d){var c=b.exec(d);if(c){c.shift();for(var f=1;7>f;f++)c[f]=+(c[f]||(3>f?1:0)),1==f&&c[f]--;var h=+c.pop(),i=+c.pop(),j=c.pop(),f=0;if(j){if(23<i||59<h)return NaN;f=6E4*(60*i+h)*("+"==j?-1:1)}h=+c[0];return 0<=h&&99>=h?(c[0]=h+400,a.UTC.apply(this,c)+f-126227808E5):a.UTC.apply(this,c)+f}return a.parse.apply(this,arguments)};return d}(Date);j="\t\n\u000b\u000c\r \u00a0\u1680\u180e\u2000\u2001\u2002\u2003\u2004\u2005\u2006\u2007\u2008\u2009\u200a\u202f\u205f\u3000\u2028\u2029\ufeff";
if(!String.prototype.trim||j.trim()){j="["+j+"]";var A=RegExp("^"+j+j+"*"),B=RegExp(j+j+"*$");String.prototype.trim=function(){return(""+this).replace(A,"").replace(B,"")}}var v=function(a){a=+a;a!==a?a=0:0!==a&&a!==1/0&&a!==-(1/0)&&(a=(0<a||-1)*Math.floor(Math.abs(a)));return a},C="a"!="a"[0],i=function(a){if(null==a)throw new TypeError;return C&&"string"==typeof a&&a?a.split(""):Object(a)}});

/*!
 * JSON 3.1
 * http://bestiejs.github.com/json3
 *
 * Copyright 2012, Kit Cambridge.
 *
 * Released under the MIT License.
*/
;(function(a,b){typeof define=="function"&&define.amd?define("json",["exports"],b):b(typeof exports=="object"&&exports||this.JSON||(this.JSON={}))})(this,function(a){var b={}.toString,c={}.hasOwnProperty,d,e,f;return e=typeof a.stringify=="function",f=typeof a.parse=="function",function(){var c='{"result":[1,true,false,null,"\\u0000\\b\\n\\f\\r\\t"]}',d,g,h;if(e){d=function(){return 1},d.toJSON=d;try{switch(!1){case a.stringify(0)==="0":case a.stringify(new 0..constructor)==="0":case a.stringify(new"".constructor)=='""':case a.stringify(b)===void 0:case a.stringify(void 0)===void 0:case a.stringify()===void 0:case a.stringify(d)==="1":case a.stringify([d])=="[1]":case a.stringify([void 0])=="[null]":case a.stringify(null)=="null":case a.stringify([void 0,b,null])=="[null,null,null]":case a.stringify({result:[d,true,false,null,"\0\b\n\f\r	"]})==c:case a.stringify(null,d)==="1":case a.stringify([1,2],null,1)=="[\n 1,\n 2\n]":case(d=new Date(-864e13)).getUTCFullYear()!=-271821||a.stringify(d)=='"-271821-04-20T00:00:00.000Z"':case(d=new Date(864e13)).getUTCFullYear()!=275760||a.stringify(d)=='"+275760-09-13T00:00:00.000Z"':e=!1}}catch(i){e=!1}}if(f)try{if(a.parse("0")===0&&!a.parse(!1)){h=a.parse(c);if(f=h.result.length==5&&h.result[0]==1){try{f=!a.parse('"	"')}catch(i){}if(f)try{f=a.parse("+1")!=1&&a.parse("01")!=1}catch(i){}}}}catch(i){f=!1}}(),typeof c!="function"&&(c=function(){var a,c={},d=c.constructor;return(c.__proto__=null,c.__proto__={toString:1},c).toString!=b?a=function e(a){var b=this.__proto__,c=a in(this.__proto__=null,this);return this.__proto__=b,c}:a=function f(a){var b=(this.constructor||d).prototype;return a in this&&!(a in b&&this[a]===b[a])},a}()),d=function(){function g(){this.valueOf=0}var a,d,e,f=0;g.prototype.valueOf=0,a=new g;for(d in a)c.call(a,d)&&(f+=1);return a=null,f?f==2?e=function(d,e){var f={},g=b.call(d)=="[object Function]",h;for(h in d)(!g||h!="prototype")&&!c.call(f,h)&&(f[h]=1)&&c.call(d,h)&&e(h)}:e=function(d,e){var f=b.call(d)=="[object Function]",g,h;for(g in d)(!f||g!="prototype")&&c.call(d,g)&&!(h=g==="constructor")&&e(g);(h||c.call(d,"constructor"))&&e("constructor")}:(a=["valueOf","toString","toLocaleString","propertyIsEnumerable","isPrototypeOf","hasOwnProperty","constructor"],e=function(e,f){var g=b.call(e)=="[object Function]",h,i;for(h in e)(!g||h!="prototype")&&c.call(e,h)&&f(h);for(i=a.length;i--;)h=a[i],c.call(e,h)&&f(h)}),e}(),e||(a.stringify=function(){function e(a,b){return b="000000"+(b||0),b.slice(b.length-a)}function f(b){var c='"',d=0,f;for(;f=b.charAt(d);d+=1)c+='\\"\b\f\n\r	'.indexOf(f)>-1?a[f]:f<" "?"\\u00"+e(2,f.charCodeAt(0).toString(16)):f;return c+'"'}function g(a,h,i,j,k,l,m){var n=h[a],o,p,q,r,s,t,u,v;typeof n=="object"&&n&&(b.call(n)=="[object Date]"&&!c.call(n,"toJSON")?n>-1/0&&n<1/0?(p=n.getUTCFullYear(),n=(p<=0||p>=1e4?(p<0?"-":"+")+e(6,p<0?-p:p):e(4,p))+"-"+e(2,n.getUTCMonth()+1)+"-"+e(2,n.getUTCDate())+"T"+e(2,n.getUTCHours())+":"+e(2,n.getUTCMinutes())+":"+e(2,n.getUTCSeconds())+"."+e(3,n.getUTCMilliseconds())+"Z"):n=null:typeof n.toJSON=="function"&&(n=n.toJSON(a))),i&&(n=i.call(h,a,n));if(n===null)return"null";o=b.call(n);switch(o){case"[object Boolean]":return""+n;case"[object Number]":return n>-1/0&&n<1/0?""+n:"null";case"[object String]":return f(n)}if(typeof n=="object"){for(t=m.length;t--;)if(m[t]==n)throw TypeError("Cyclic structures cannot be serialized.");m.push(n),q=[],u=l,l+=k;if(o=="[object Array]"){for(s=0,t=n.length;s<t;v||(v=!0),s++)r=g(s,n,i,j,k,l,m),q.push(r===void 0?"null":r);return v?k?"[\n"+l+q.join(",\n"+l)+"\n"+u+"]":"["+q.join(",")+"]":"[]"}return d(j||n,function(a){var b=g(a,n,i,j,k,l,m);b!==void 0&&q.push(f(a)+":"+(k?" ":"")+b),v||(v=!0)}),v?k?"{\n"+l+q.join(",\n"+l)+"\n"+u+"}":"{"+q.join(",")+"}":"{}"}}function h(a,c,d){var e="",f,h,i,j;if(typeof c=="function"||typeof c=="object"&&c)if(b.call(c)=="[object Function]")f=c;else if(b.call(c)=="[object Array]"){h={};for(i=c.length;i--;)j=c[i],j&&(b.call(j)=="[object String]"||b.call(j)=="[object Number]")&&(h[j]=1)}if(d!=null&&d!=="")if(b.call(d)=="[object Number]"){if((d-=d%1)>0)for(e="",d>10&&(d=10);e.length<d;)e+=" "}else b.call(d)=="[object String]"&&(e=d.length<=10?d:d.slice(0,10));return g("$",{$:a},f,h,e,"",[])}var a={"\\":"\\\\",'"':'\\"',"\b":"\\b","\f":"\\f","\n":"\\n","\r":"\\r","	":"\\t"};return h}()),f||(a.parse=function(){function e(a){this.source=a,this.index=0}function f(){for(var b=this.source,d=this.source.length,e,f,g,h,i;this.index<d;){e=b.charAt(this.index);switch(e){case"	":case"\r":case"\n":case" ":this.index+=1;break;case"{":case"}":case"[":case"]":case":":case",":return this.index+=1,e;case'"':f="@",this.index+=1;while(this.index<d){e=b.charAt(this.index);if(e<" ")throw SyntaxError("Unescaped control character in string.");if(e=="\\"){this.index+=1,e=b.charAt(this.index);if('\\"/btnfr'.indexOf(e)>-1)f+=a[e],this.index+=1;else{if(e!="u")throw SyntaxError("Invalid escape sequence in string.");g=this.index+=1;for(h=this.index+4;this.index<h;this.index+=1){e=b.charAt(this.index);if(!(e>="0"&&e<="9"||e>="a"&&e<="f"||e>="A"&&e<="F"))throw SyntaxError("Invalid Unicode escape sequence in string.")}f+=c("0x"+b.slice(g,this.index))}}else{if(e=='"')break;f+=e,this.index+=1}}if(b.charAt(this.index)=='"')return this.index+=1,f;throw SyntaxError("Unterminated string.");default:g=this.index,e=="-"&&(i=!0,e=b.charAt(this.index+=1));if(e>="0"&&e<="9"){if(e=="0"&&(e=b.charAt(this.index+1),e>="0"&&e<="9"))throw SyntaxError("Illegal octal literal.");i=!1;for(;this.index<d&&(e=b.charAt(this.index),e>="0"&&e<="9");this.index+=1);if(b.charAt(this.index)=="."){h=this.index+=1;for(;h<d&&(e=b.charAt(h),e>="0"&&e<="9");h+=1);if(h==this.index)throw SyntaxError("Illegal trailing decimal.");this.index=h}e=b.charAt(this.index);if(e=="e"||e=="E"){e=b.charAt(this.index+=1);if(e=="+"||e=="-")this.index+=1;for(h=this.index;h<d&&(e=b.charAt(h),e>="0"&&e<="9");h+=1);if(h==this.index)throw SyntaxError("Illegal empty exponent.");this.index=h}return+b.slice(g,this.index)}if(i)throw SyntaxError("Unexpected `-`.");if(e=="t"&&b.slice(this.index,this.index+4)=="true")return this.index+=4,!0;if(e=="f"&&b.slice(this.index,this.index+5)=="false")return this.index+=5,!1;if(e=="n"&&b.slice(this.index,this.index+4)=="null")return this.index+=4,null;throw SyntaxError("Unrecognized token.")}}return"$"}function g(a){var b,c,d;if(a=="$")throw SyntaxError("Unexpected end-of-file.");if(typeof a=="string"){if(a.charAt(0)=="@")return a.slice(1);switch(a){case"[":b=[];for(;;c||(c=!0)){a=this.lex();if(a=="]")break;if(c){if(a!=",")throw SyntaxError("A comma (`,`) must separate the previous array element from the next.");a=this.lex();if(a=="]")throw SyntaxError("Unexpected trailing `,` in array literal.")}if(a==",")throw SyntaxError("Unexpected `,` in array literal.");b.push(this.get(a))}return b;case"{":b={};for(;;c||(c=!0)){a=this.lex();if(a=="}")break;if(c){if(a!=",")throw SyntaxError("A comma (`,`) must separate the previous object member from the next.");a=this.lex();if(a=="}")throw SyntaxError("Unexpected trailing `,`. in object literal.")}if(a==",")throw SyntaxError("Unexpected `,` in object literal.");if(typeof a!="string"||a.charAt(0)!="@")throw SyntaxError("Object property names must be double-quoted strings.");if(this.lex()!=":")throw SyntaxError("A single colon (`:`) must separate each object property name from the value.");b[a.slice(1)]=this.get(this.lex())}return b}throw SyntaxError("Expected `[` or `{`.")}return a}function h(a,c,e){var f=a[c],g,i;if(typeof f=="object"&&f)if(b.call(f)=="[object Array]")for(g=f.length;g--;)i=h(f,g,e),i===void 0?f.splice(g,1):f[g]=i;else d(f,function(a){var b=h(f,a,e);b===void 0?delete f[a]:f[a]=b});return e.call(a,c,f)}function i(a,c){var d=new e(""+a),f=d.get(d.lex());if(d.lex()!="$")throw SyntaxError("Expected end-of-file.");return c&&b.call(c)=="[object Function]"?h({$:f},"$",c):f}var a={"\\":"\\",'"':'"',"/":"/",b:"\b",t:"	",n:"\n",f:"\f",r:"\r"},c="".constructor.fromCharCode;return e.prototype.lex=f,e.prototype.get=g,i}()),a})

/**
 * Vash - JavaScript Template Parser
 *
 * https://github.com/kirbysayshi/vash
 *
 * Copyright (c) 2012 Andrew Petersen
 * MIT License (LICENSE)
 */
;(function(a){typeof define=="function"&&define.amd?define(a):typeof module=="object"&&module.exports?module.exports=a:window.vash=a})(function(a){function f(a,b){this.ast=a,this.originalMarkup=b||""}function e(a,b){this.options=b||{},this.tokens=a,this.ast=d(e.modes.PRG)}function c(a){this.input=this.originalInput=a.replace(/\r\n|\r/g,"\n"),this.lineno=1,this.charno=0}var b=a;a.version="0.4.2-861",a.config={useWith:!1,modelName:"model",debug:!1,debugParser:!1,debugCompiler:!1},c.prototype={tok:function(a,b){return{type:a,line:this.lineno,chr:this.charno,val:b,toString:function(){return"["+this.type+" ("+this.line+","+this.chr+"): "+this.val+"]"}}},scan:function(a,b){var c,d;if(c=a.exec(this.input)){this.consume(c[0].length),d=this.tok(b,c[1]),this.charno+=c[0].length;return d}},spew:function(a){this.input=a+this.input,this.charno-=a.length},consume:function(a){this.input=this.input.substr(a)},spewIf:function(a,b){var c;a&&(c=a.val.split(b),c.length>1&&(a.val=c.shift(),this.spew(b+c.join(b))));return a},advance:function(){return this.next()},next:function(){return this.EMAIL()||this.AT_STAR_OPEN()||this.AT_STAR_CLOSE()||this.AT_COLON()||this.AT()||this.FAT_ARROW()||this.PAREN_OPEN()||this.PAREN_CLOSE()||this.HARD_PAREN_OPEN()||this.HARD_PAREN_CLOSE()||this.BRACE_OPEN()||this.BRACE_CLOSE()||this.TEXT_TAG_OPEN()||this.TEXT_TAG_CLOSE()||this.HTML_TAG_SELFCLOSE()||this.HTML_TAG_OPEN()||this.HTML_TAG_CLOSE()||this.PERIOD()||this.NEWLINE()||this.WHITESPACE()||this.FUNCTION()||this.KEYWORD()||this.HTML_RAW()||this.IDENTIFIER()||this.OPERATOR()||this.ASSIGN_OPERATOR()||this.LOGICAL()||this.BACKSLASH()||this.DOUBLE_QUOTE()||this.SINGLE_QUOTE()||this.NUMERIC_CONTENT()||this.CONTENT()},AT:function(){return this.scan(/^(@)/,c.tks.AT)},AT_COLON:function(){return this.scan(/^@\:/,c.tks.AT_COLON)},AT_STAR_OPEN:function(){return this.scan(/^(@\*)/,c.tks.AT_STAR_OPEN)},AT_STAR_CLOSE:function(){return this.scan(/^(\*@)/,c.tks.AT_STAR_CLOSE)},PAREN_OPEN:function(){return this.scan(/^(\()/,c.tks.PAREN_OPEN)},PAREN_CLOSE:function(){return this.scan(/^(\))/,c.tks.PAREN_CLOSE)},BRACE_OPEN:function(){return this.scan(/^(\{)/,c.tks.BRACE_OPEN)},BRACE_CLOSE:function(){return this.scan(/^(\})/,c.tks.BRACE_CLOSE)},HARD_PAREN_OPEN:function(){return this.scan(/^(\[)/,c.tks.HARD_PAREN_OPEN)},HARD_PAREN_CLOSE:function(){return this.scan(/^(\])/,c.tks.HARD_PAREN_CLOSE)},TEXT_TAG_OPEN:function(){return this.scan(/^(<text>)/,c.tks.TEXT_TAG_OPEN)},TEXT_TAG_CLOSE:function(){return this.scan(/^(<\/text>)/,c.tks.TEXT_TAG_CLOSE)},HTML_TAG_SELFCLOSE:function(){return this.spewIf(this.scan(/^(<[^>]+?\/>)/,c.tks.HTML_TAG_SELFCLOSE),"@")},HTML_TAG_OPEN:function(){return this.spewIf(this.scan(/^(<[^\/ >]+?[^>]*?>)/,c.tks.HTML_TAG_OPEN),"@")},HTML_TAG_CLOSE:function(){return this.spewIf(this.scan(/^(<\/[^>\b]+?>)/,c.tks.HTML_TAG_CLOSE),"@")},FAT_ARROW:function(){return this.scan(/^(\(.*?\)?\s*?=>)/,c.tks.FAT_ARROW)},FUNCTION:function(){return this.scan(/^(function)(?![\d\w])/,c.tks.FUNCTION)},KEYWORD:function(){return this.scan(/^(case|catch|do|else|finally|for|function|goto|if|instanceof|return|switch|try|typeof|var|while|with)(?![\d\w])/,c.tks.KEYWORD)},IDENTIFIER:function(){return this.scan(/^([_$a-zA-Z\xA0-\uFFFF][_$a-zA-Z0-9\xA0-\uFFFF]*)/,c.tks.IDENTIFIER)},HTML_RAW:function(){return this.scan(/^(vash\.raw)(?![\d\w])/,c.tks.HTML_RAW)},PERIOD:function(){return this.scan(/^(\.)/,c.tks.PERIOD)},EMAIL:function(){return this.scan(/^([a-zA-Z0-9._%-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4})\b/,c.tks.EMAIL)},ASSIGN_OPERATOR:function(){return this.scan(/^(\|=|\^=|&=|>>>=|>>=|<<=|-=|\+=|%=|\/=|\*=|=)/,c.tks.ASSIGN_OPERATOR)},OPERATOR:function(){return this.scan(/^(===|!==|==|!==|>>>|<<|>>|>=|<=|>|<|\+|-|\/|\*|\^|%|\:|\?)/,c.tks.OPERATOR)},LOGICAL:function(){return this.scan(/^(&&|\|\||&|\||\^)/,c.tks.LOGICAL)},SINGLE_QUOTE:function(){return this.scan(/^(')/,c.tks.SINGLE_QUOTE)},DOUBLE_QUOTE:function(){return this.scan(/^(")/,c.tks.DOUBLE_QUOTE)},BACKSLASH:function(){return this.scan(/^(\\)/,c.tks.BACKSLASH)},NUMERIC_CONTENT:function(){return this.scan(/^([0-9]+)/,c.tks.NUMERIC_CONTENT)},CONTENT:function(){return this.scan(/^([^\s})@.]+?)/,c.tks.CONTENT)},WHITESPACE:function(){return this.scan(/^(\s)/,c.tks.WHITESPACE)},NEWLINE:function(){var a=this.scan(/^(\n)/,c.tks.NEWLINE);a&&(this.lineno++,this.charno=0);return a},EOF:function(){return this.scan(/^$/,c.tks.EOF)}},c.tks={AT:"AT",AT_STAR_OPEN:"AT_STAR_OPEN",AT_STAR_CLOSE:"AT_STAR_CLOSE",AT_COLON:"AT_COLON",EMAIL:"EMAIL",PAREN_OPEN:"PAREN_OPEN",PAREN_CLOSE:"PAREN_CLOSE",BRACE_OPEN:"BRACE_OPEN",BRACE_CLOSE:"BRACE_CLOSE",HARD_PAREN_OPEN:"HARD_PAREN_OPEN",HARD_PAREN_CLOSE:"HARD_PAREN_CLOSE",TEXT_TAG_OPEN:"TEXT_TAG_OPEN",TEXT_TAG_CLOSE:"TEXT_TAG_CLOSE",HTML_TAG_SELFCLOSE:"HTML_TAG_SELFCLOSE",HTML_TAG_OPEN:"HTML_TAG_OPEN",HTML_TAG_CLOSE:"HTML_TAG_CLOSE",KEYWORD:"KEYWORD",FUNCTION:"FUNCTION",FAT_ARROW:"FAT_ARROW",IDENTIFIER:"IDENTIFIER",PERIOD:"PERIOD",ASSIGN_OPERATOR:"ASSIGN_OPERATOR",SINGLE_QUOTE:"SINGLE_QUOTE",DOUBLE_QUOTE:"DOUBLE_QUOTE",BACKSLASH:"BACKSLASH",NUMERIC_CONTENT:"NUMERIC_CONTENT",OPERATOR:"OPERATOR",LOGICAL:"LOGICAL",CONTENT:"CONTENT",WHITESPACE:"WHITESPACE",NEWLINE:"NEWLINE",EOF:"EOF",HTML_RAW:"HTML_RAW"},c.pairs={AT_STAR_OPEN:c.tks.AT_STAR_CLOSE,PAREN_OPEN:c.tks.PAREN_CLOSE,BRACE_OPEN:c.tks.BRACE_CLOSE,HARD_PAREN_OPEN:c.tks.HARD_PAREN_CLOSE,DOUBLE_QUOTE:c.tks.DOUBLE_QUOTE,SINGLE_QUOTE:c.tks.SINGLE_QUOTE};var d=function(a){return new d.fn.init(a)};d.prototype.init=function(a){if(!a)return this;if(typeof a=="string"){this.mode=a;return this}if(!d.isArray(a)&&a.vquery!==this.vquery)a=[a];else if(a.length>=d.maxSize)throw{name:"vQuery Error",message:"Maximum number of elements exceeded"};if(a.vquery===this.vquery)return a;var b=d.makeArray(a,this);this.maxCheck();return b},d.fn=d.prototype.init.prototype=d.prototype,d.fn.vquery="yep",d.fn.constructor=d,d.fn.length=0,d.fn.parent=null,d.fn.mode=null,d.fn.tagName=null,d.fn.beget=function(a,b){var c=d();c.mode=a,c.parent=this,this.push(c),b&&(c.tagName=b),this.maxCheck();return c},d.fn.each=function(a){d.each(this,a,this);return this},d.fn.closest=function(a,b){var c=this;if(!b)while(c&&(c.mode!==a||c==this)&&c.parent&&(c=c.parent));else while(c)if(c.tagName!==b&&c.parent)c=c.parent;else break;return c},d.fn.pushFlatten=function(a){var b=a,c,d;while(b.length===1&&b[0].vquery)b=b[0];if(b.mode!==e.modes.PRG)this.push(b);else for(c=0;c<b.length;c++)this.push(b[c]);this.maxCheck();return this},d.fn.push=function(a){d.isArray(a)?(a.vquery&&a.forEach(function(a){a.parent=this},this),Array.prototype.push.apply(this,a)):(a.vquery&&(a.parent=this),Array.prototype.push.call(this,a)),this.maxCheck();return this.length},d.fn.root=function(){var a=this;while(a&&a.parent&&(a=a.parent));return a},d.fn.toTreeString=function(){function c(e){var f,g;a.push(Array(b).join(" |")+" +"+e.mode+" "+(e.tagName||"")),b+=1,f=e.slice();while(g=f.shift())g.vquery===d.fn.vquery?c(g):a.push(Array(b).join(" |")+" "+(g?g.toString():"[empty]"));b-=1}var a=[],b=1;c(this);return a.join("\n")},d.fn.maxCheck=function(){if(this.length>=d.maxSize){var a=new Error;a.message="Maximum number of elements exceeded",a.name="vQueryDepthException";throw a}},d.maxSize=1e3,d.makeArray=function(a,b){a=Array.prototype.slice.call(a,0);if(b){b.push.apply(b,a),b.mode=a.mode,b.parent=a.parent,b.tagName=a.tagName;return b}return a},d.isArray=function(a){return Object.prototype.toString.call(a)=="[object Array]"},d.copyObj=function(a){var b={};for(var c in a)Object.prototype.hasOwnProperty.call(a,c)&&(b[c]=a[c]);return b},d.takeMethodsFromArray=function(){var a=["pop","push","reverse","shift","sort","splice","unshift","concat","join","slice","indexOf","lastIndexOf","filter","forEach","every","map","some","reduce","reduceRight"],b=[],c;for(var e=0;e<a.length;e++){c=a[e];if(typeof b[c]=="function")d.fn[c]||function(a){d.fn[a]=function(){return b[a].apply(this,d.makeArray(arguments))}}(c);else throw new Error("Vash requires ES5 array iteration methods, missing: "+c)}},d.takeMethodsFromArray(),e.modes={PRG:"PROGRAM",MKP:"MARKUP",BLK:"BLOCK",EXP:"EXPRESSION"},e.prototype={parse:function(){var a,b,c,d;while(a=this.tokens.pop()){this.options.debugParser&&console.log(this.ast&&this.ast.mode,a.type,a,a.val);if(this.ast.mode===e.modes.PRG||this.ast.mode===null)this.ast=this.ast.beget(this.options.initialMode||e.modes.MKP),this.options.initialMode===e.modes.EXP&&(this.ast=this.ast.beget(e.modes.EXP));if(this.ast.mode===e.modes.MKP){this.handleMKP(a);continue}if(this.ast.mode===e.modes.BLK){this.handleBLK(a);continue}if(this.ast.mode===e.modes.EXP){this.handleEXP(a);continue}}this.ast=this.ast.root(),this.options.debugParser&&!this.options.initialMode&&(console.log(this.ast),console.log(this.ast.toTreeString()));return this.ast},exceptionFactory:function(a,b,c){b=="UNMATCHED"&&(a.name="UnmatchedCharacterError",this.ast.root(),c&&(a.message="Unmatched "+c.type+" at line "+c.line+", character "+c.chr+". Value: "+c.val+"\n "+this.ast.toTreeString(),a.lineNumber=c.line));return a},advanceUntilNot:function(a){var b,c,d=[];while(c=this.tokens[this.tokens.length-1])if(c.type===a)b=this.tokens.pop(),d.push(b);else break;return d},advanceUntilMatched:function(a,b,c,d,e){var f=a,g=null,h=0,i=0,j=[];while(f){f.type===b?g&&g.type!==escape&&b!==c||!g?h++:b===c&&i++:f.type===c&&(i++,g&&g.type===e&&i--),j.push(f);if(h===i)break;g=f,f=this.tokens.pop();if(!f)throw this.exceptionFactory(new Error,"UNMATCHED",a)}return j.reverse()},handleMKP:function(a){var b=this.tokens[this.tokens.length-1],d=this.tokens[this.tokens.length-2],f=null,g;switch(a.type){case c.tks.AT_STAR_OPEN:this.advanceUntilMatched(a,c.tks.AT_STAR_OPEN,c.tks.AT_STAR_CLOSE,c.tks.AT,c.tks.AT);break;case c.tks.AT:if(b)switch(b.type){case c.tks.PAREN_OPEN:case c.tks.IDENTIFIER:case c.tks.HTML_RAW:this.ast.length===0&&(this.ast=this.ast.parent,this.ast.pop()),this.ast=this.ast.beget(e.modes.EXP);break;case c.tks.KEYWORD:case c.tks.FUNCTION:case c.tks.BRACE_OPEN:case c.tks.BLOCK_GENERATOR:this.ast.length===0&&(this.ast=this.ast.parent,this.ast.pop()),this.ast=this.ast.beget(e.modes.BLK);break;default:this.ast.push(this.tokens.pop())}break;case c.tks.BRACE_OPEN:this.ast=this.ast.beget(e.modes.BLK),this.tokens.push(a);break;case c.tks.BRACE_CLOSE:this.ast=this.ast.parent,this.tokens.push(a);break;case c.tks.TEXT_TAG_OPEN:case c.tks.HTML_TAG_OPEN:f=a.val.match(/^<([^\/ >]+)/i),f===null&&b&&b.type===c.tks.AT&&d&&(f=d.val.match(/(.*)/)),this.ast.tagName?this.ast=this.ast.beget(e.modes.MKP,f[1]):this.ast.tagName=f[1],c.tks.HTML_TAG_OPEN===a.type&&this.ast.push(a);break;case c.tks.TEXT_TAG_CLOSE:case c.tks.HTML_TAG_CLOSE:f=a.val.match(/^<\/([^>]+)/i),f===null&&b&&b.type===c.tks.AT&&d&&(f=d.val.match(/(.*)/)),g=this.ast.closest(e.modes.MKP,f[1]),g!==null&&g.tagName===f[1]&&(this.ast=g),c.tks.HTML_TAG_CLOSE===a.type&&this.ast.push(a),this.ast.parent&&this.ast.parent.mode===e.modes.BLK&&(b.type===c.tks.WHITESPACE||b.type===c.tks.NEWLINE)&&(this.ast=this.ast.parent);break;case c.tks.HTML_TAG_SELFCLOSE:this.ast.push(a),this.ast.parent&&this.ast.parent.mode===e.modes.BLK&&(b.type===c.tks.WHITESPACE||b.type===c.tks.NEWLINE)&&(this.ast=this.ast.parent);break;default:this.ast.push(a)}},handleBLK:function(a){var b=this.tokens[this.tokens.length-1],f,g,h,i,j,k;switch(a.type){case c.tks.AT:switch(b.type){case c.tks.AT:break;default:this.tokens.push(a),this.ast=this.ast.beget(e.modes.MKP)}break;case c.tks.AT_COLON:this.ast=this.ast.beget(e.modes.MKP);break;case c.tks.TEXT_TAG_OPEN:case c.tks.TEXT_TAG_CLOSE:case c.tks.HTML_TAG_SELFCLOSE:case c.tks.HTML_TAG_OPEN:case c.tks.HTML_TAG_CLOSE:this.ast=this.ast.beget(e.modes.MKP),this.tokens.push(a);break;case c.tks.FAT_ARROW:this.ast=this.ast.beget(e.modes.BLK);break;case c.tks.BRACE_OPEN:case c.tks.PAREN_OPEN:i=d.copyObj(this.options),i.initialMode=e.modes.BLK,h=this.advanceUntilMatched(a,a.type,c.pairs[a.type],null,c.tks.AT),h.pop(),g=h.shift(),this.ast.push(a),j=new e(h,i),j.parse(),this.ast.pushFlatten(j.ast),this.ast.push(g),h=this.advanceUntilNot(c.tks.WHITESPACE),b=this.tokens[this.tokens.length-1],b&&b.type!==c.tks.KEYWORD&&b.type!==c.tks.FUNCTION&&b.type!==c.tks.BRACE_OPEN&&a.type!==c.tks.PAREN_OPEN?(this.tokens.push.apply(this.tokens,h.reverse()),this.ast=this.ast.parent):this.ast.push(h);break;case c.tks.WHITESPACE:this.ast.push(a),this.advanceUntilNot(c.tks.WHITESPACE);break;default:this.ast.push(a)}},handleEXP:function(a){var b=null,f,g,h,i,j,k;switch(a.type){case c.tks.KEYWORD:case c.tks.FUNCTION:this.ast=this.ast.beget(e.modes.BLK),this.tokens.push(a);break;case c.tks.WHITESPACE:case c.tks.LOGICAL:case c.tks.ASSIGN_OPERATOR:case c.tks.OPERATOR:case c.tks.NUMERIC_CONTENT:this.ast.parent&&this.ast.parent.mode===e.modes.EXP?this.ast.push(a):(this.ast=this.ast.parent,this.tokens.push(a));break;case c.tks.IDENTIFIER:case c.tks.HTML_RAW:this.ast.push(a);break;case c.tks.SINGLE_QUOTE:case c.tks.DOUBLE_QUOTE:this.ast.parent&&this.ast.parent.mode===e.modes.EXP?(j=this.advanceUntilMatched(a,a.type,c.pairs[a.type],c.tks.BACKSLASH,c.tks.BACKSLASH),this.ast.pushFlatten(j.reverse())):(this.ast=this.ast.parent,this.tokens.push(a));break;case c.tks.HARD_PAREN_OPEN:case c.tks.PAREN_OPEN:h=d.copyObj(this.options),h.initialMode=e.modes.EXP,j=this.advanceUntilMatched(a,a.type,c.pairs[a.type],null,c.tks.AT),j.pop(),g=j.shift(),this.ast.push(a),i=new e(j,h),i.parse(),this.ast.pushFlatten(i.ast),this.ast.push(g),b=this.tokens[this.tokens.length-1],this.ast.parent&&this.ast.parent.mode!==e.modes.EXP&&b&&b.type!==c.tks.HARD_PAREN_OPEN&&b.type!==c.tks.PERIOD&&(this.ast=this.ast.parent);break;case c.tks.BRACE_OPEN:this.tokens.push(a),this.ast=this.ast.beget(e.modes.BLK);break;case c.tks.FAT_ARROW:this.tokens.push(a),this.ast=this.ast.beget(e.modes.BLK);break;case c.tks.PERIOD:b=this.tokens[this.tokens.length-1],!b||b.type!==c.tks.IDENTIFIER&&b.type!==c.tks.KEYWORD&&b.type!==c.tks.FUNCTION&&b.type!==c.tks.PERIOD?(this.ast=this.ast.parent,this.tokens.push(a)):this.ast.push(a);break;default:this.ast.parent&&this.ast.parent.mode!==e.modes.EXP?(this.ast=this.ast.parent,this.tokens.push(a)):this.ast.push(a)}}};var g=f.prototype;g.assemble=function(a){function q(a){return a.vquery&&a.mode===e.modes.EXP?a.filter(q).length>0:a.vquery&&a.mode!==e.modes.EXP?!0:!1}function p(a){var b,c=a.slice(0),d,f,g;a.mode===e.modes.EXP&&a.parent&&a.parent.mode!==e.modes.EXP&&(d=a.filter(q).length);for(f=0;f<c.length;f++){g=c[f];if(g.vquery){p(g);continue}a.mode===e.modes.MKP?m(g,a,f):a.mode===e.modes.BLK?n(g,a,f):a.mode===e.modes.EXP&&o(g,a,f,d>0?!1:!0)}}function o(g,i,j,k){var m="",n="",o=i.parent&&i.parent.mode!==e.modes.EXP;a.htmlEscape!==!1&&(g.type===c.tks.HTML_RAW&&d.push(!0),o&&j===0&&k&&d.length===0&&(m+="( typeof (__vt = "),o&&j===i.length-1&&k&&(d.length>0?d.pop():n+=") !== 'undefined' ? __vt : '' ).toString()\n.replace(/&(?!w+;)/g, '&amp;')\n.replace(/</g, '&lt;')\n.replace(/>/g, '&gt;')\n.replace(/\"/g, '&quot;') \n")),o&&(j===0||j===1&&i[0].type===c.tks.HTML_RAW)&&(l(g),m="__vo.push("+m),o&&(j===i.length-1||j===i.length-2&&i[i.length-1].type===c.tks.HTML_RAW)&&(n+="); \n"),g.type!==c.tks.HTML_RAW&&b.push(m+g.val.replace(f,'"').replace(h,'"')+n),o&&j===i.length-1&&l(g)}function n(a,c,d){b.push(a.val.replace(f,'"'))}function m(a,c,d){l(a),b.push("__vo.push('"+a.val.replace(f,'"').replace(i,"\\n")+"'); \n")}function l(c){a.debug&&(b.push("__vl = "+c.line+", "),b.push("__vc = "+c.chr+"; \n"))}a=a||{};var b=[],d=[],f=/["']/gi,h=/(\\?)(["'])/gi,i=/[\n\r]/gi,j,k;b.unshift("var __vo = [], __vt; \n"),a.debug&&b.push("var __vl = 0, __vc = 0; \n"),p(this.ast),a.useWith===!0&&(b.unshift("with("+a.modelName+" || {}){ \n"),b.push("}")),a.debug&&(b.unshift("try { \n"),b.push("} catch(e){ (",g.reportError.toString(),")(e, __vl, __vc, ",'"'+this.originalMarkup.replace(i,"!LB!").replace(h,"\\$2")+'"',") } \n")),b.push("return __vo.join('');"),j=b.join(""),a.debugCompiler&&console.log(j);try{k=new Function(a.modelName,j)}catch(r){r.message+=" -> "+j;throw r}return k},g.reportError=function(a,b,c,d){var e=d.split("!LB!"),f=3,g=Math.max(0,b-f),h=Math.min(e.length,b+f),i=e.slice(g,h).map(function(a,c,d){var e=c+g+1;return(e===b?"  > ":"    ")+e+" | "+a}).join("\n");a.message="Problem while rendering template at line "+b+", character "+c+".\nOriginal message: "+a.message+"."+"\nContext: \n\n"+i+"\n\n";throw a},a.VLexer=c,a.VParser=e,a.VCompiler=f,a.compile=function h(b,d){if(b===""||typeof b!="string")throw new Error("Empty or non-string cannot be compiled");var g,h,i=[],j,k,l;d=d||{},d.useWith=d.useWith||a.config.useWith,d.modelName=d.modelName||a.config.modelName,d.debug=d.debug||a.config.debug,d.debugParser=d.debugParser||a.config.debugParser,d.debugCompiler=d.debugCompiler||a.config.debugCompiler,g=new c(b);while(h=g.advance())i.push(h);i.reverse(),j=new e(i,d),j.parse(),k=new f(j.ast,b),l=k.assemble(d),l.displayName="render";return l};return a}({}))
