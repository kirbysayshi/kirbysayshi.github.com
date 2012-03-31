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
(function($, undefined){
	
	$.fn.cutout = function(options){

	    var settings = {
	         opacity: 0.6
			,fadeInDuration: 500
			,color: '#000000'
	        ,cutoutPaddingX: 0
			,cutoutPaddingY: 0
	        ,softness: 5
			,roundness: 5
			// manual override of where to draw cutout
			,drawOverride: false //{ max: {x: 0, y: 0}, min: {x: 0, y: 0} }
	        ,parent: 'body' // blackout everything by default
	        ,autoResize: true // redraw on window resize
	        ,killOnEvents: ['click']
			,onDrawComplete: function(){}
			,onDestroy: function(){}
	    };

	    return this.each(function(e){

	        if ( options ) { $.extend( settings, options ); }

	        var  $cover
	            ,$window = $(window)
	            ,$parent = $(settings.parent)
	            ,resizeTimeout = 0
	            ,$this = $(this)
	
				,cutoutPos
				,cutoutDim
				,parentPos
				,parentMargins
				,bodyWidth
				,bodyHeight
				,ctx
				,drawingPos
				,drawingDim;

			// create canvas cover
			$cover = $('<canvas/>', {
                'class': 'cutout-canvas'
                ,css :{
                     position: 'absolute'
					,zIndex: '2147483647'
                }
            });

			// attempt to reset body to auto in case of 100%
			// also fix collapsible margin/padding issues
			if(document.body === $parent[0]) {

				$parent.css({
					 height: 'auto'
					,width: 'auto'
					,marginTop: '-=1px'
					,paddingTop: '+=1px'
				});
			}

			// so absolute position works. this may break things
            $parent.css({position: 'relative'});

			// take and apply measurements
			doCalculations();
			
			// "manually" set width and height of canvas, since jQuery gets confused
            $cover.attr({
                 width: document.body === $parent[0] 
                    ? Math.max($window.width(), $parent.outerWidth(true))
                    : $parent.outerWidth(true)
                ,height: document.body === $parent[0] 
                    ? Math.max($window.height(), $parent.outerHeight(true)) 
                    : $parent.outerHeight(true)
            });

			// set position of cover
			$cover.css({
				 top: 0 - parentMargins.top
                ,left: 0 - parentMargins.left
			});
			
			try{
				//throw new Error('Force IE Behavior');
                ctx = $cover[0].getContext('2d');
				draw();  
            } catch (e){
				$cover = $('<div/>', {
					'class': 'cutout-canvas'
					,css: {
	                     position: 'absolute'
						,top: 0 - parentMargins.top
		                ,left: 0 - parentMargins.left
						,zIndex: '9000'
						,width: $cover.attr('width')
						,height: $cover.attr('height')
	                }
				});
				fallbackDraw();
            }		

			// add cover to dom and fade in
			$cover
				.css({display: 'none'})
				.appendTo($parent)
				.fadeIn(settings.fadeInDuration, function(){
					settings.onDrawComplete.call($this);
				});

			// bind resize event if necessary
            if(settings.autoResize === true){
                $window.bind('resize', onWindowResize);    
            }

            // bind kill events
            $.each(settings.killOnEvents, function(){
                var ev = this, $target = (ev === 'scroll' || ev === 'resize')
                    ? $window 
                    : $cover;

                $target.bind(ev.toString(), destroy);
            });

			
			function doCalculations(){
				
	            parentMargins = {
                     top: parseFloat($parent.css('marginTop'))
                    ,right: parseFloat($parent.css('marginRight'))
                    ,bottom: parseFloat($parent.css('marginBottom'))
                    ,left: parseFloat($parent.css('marginLeft'))
                };

				cutoutPos = $this.offset();
	            cutoutDim = { width: 0, height: 0};
	            parentPos = $parent.offset();
	            drawingPos = { x: 0, y: 0};
	            drawingDim = { width: 0, height: 0};
	
				if(settings.drawOverride !== false){
					
					drawingPos.x = settings.drawOverride.min.x - settings.cutoutPaddingX;
		            drawingPos.y = settings.drawOverride.min.y - settings.cutoutPaddingY;

		            drawingDim.width = settings.drawOverride.max.x 
						- settings.drawOverride.min.x + settings.cutoutPaddingX*2;
		            drawingDim.height = settings.drawOverride.max.y 
						- settings.drawOverride.min.y + settings.cutoutPaddingY*2;
					
				} else {
					cutoutDim = { width: $this.width(), height: $this.height() };
					
					drawingPos.x = cutoutPos.left - parentPos.left 
						- settings.cutoutPaddingX + parentMargins.left;
		            drawingPos.y = cutoutPos.top - parentPos.top 
						- settings.cutoutPaddingY + parentMargins.top;

		            drawingDim.width = cutoutDim.width + settings.cutoutPaddingX*2 
						+ parseInt($this.css('paddingLeft'))
						+ parseInt($this.css('paddingRight'));
		            drawingDim.height = cutoutDim.height + settings.cutoutPaddingY*2
						+ parseInt($this.css('paddingTop'))
						+ parseInt($this.css('paddingBottom'));
				}	
			}

	        function draw(){
	            var  i;

				// modifying width/height forces blank canvas
				ctx.canvas.width = ctx.canvas.width;

	            // draw blackout
	            ctx.save();
	            ctx.fillStyle = settings.color;
	            ctx.globalAlpha = settings.opacity;
	            ctx.fillRect(0,0,$cover[0].width, $cover[0].height);
	            ctx.restore();

	            // draw cutout
	            ctx.save();
	            ctx.globalCompositeOperation = 'destination-out';
	            ctx.fillStyle = '#FFFFFF';
	            ctx.shadowOffsetX = 0;
	            ctx.shadowOffsetY = 0;
	            ctx.shadowColor = 'rgba(0,0,0,1)';

	            // main cutout
	            roundedRect(
	                 ctx
	                ,drawingPos.x
	                ,drawingPos.y
	                ,drawingDim.width
	                ,drawingDim.height
	                ,settings.roundness);

	            // secondary cutout (softness)
	            for(i = 0; i < settings.softness; i++){
	                ctx.shadowBlur = i === 0 ? 400 : 50*i;
	                roundedRect(
	                     ctx
	                    ,drawingPos.x
	                    ,drawingPos.y
	                    ,drawingDim.width
	                    ,drawingDim.height
	                    ,settings.roundness);
	            }

	            ctx.restore();          
	        }

			function fallbackDraw(){
				var borderThickness = 25
					,pad = 5;
				$cover.append(
					$('<div/>').css({
						position: 'absolute'
						,width: drawingDim.width + (pad * 2)
						,height: drawingDim.height + (pad * 2)
						,opacity: 0.8
						,border: borderThickness + 'px solid #333333'
						,top: drawingPos.y - parentMargins.top - borderThickness - pad
						,left: drawingPos.x - parentMargins.left - borderThickness - pad
					})
				);
			}

	        function destroy(){
	            console.log('destroy called')
	            $cover.remove();
	            $window.unbind('resize', onWindowResize); 
	   			settings.onDestroy.call($this);
	        }

	        function onWindowResize(){
	            clearTimeout(resizeTimeout);
	            resizeTimeout = setTimeout(function(){
	                draw();
	            }, 500);
	        }
	    });

	    // from https://developer.mozilla.org/en/Canvas_tutorial/Drawing_shapes
	    function roundedRect(ctx,x,y,width,height,radius){
	        ctx.beginPath();
	        ctx.moveTo(x,y+radius);
	        ctx.lineTo(x,y+height-radius);
	        ctx.quadraticCurveTo(x,y+height,x+radius,y+height);
	        ctx.lineTo(x+width-radius,y+height);
	        ctx.quadraticCurveTo(x+width,y+height,x+width,y+height-radius);
	        ctx.lineTo(x+width,y+radius);
	        ctx.quadraticCurveTo(x+width,y,x+width-radius,y);
	        ctx.lineTo(x+radius,y);
	        ctx.quadraticCurveTo(x,y,x,y+radius);
	        ctx.fill();
	    }
	}
	
})(jQuery);

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
 * @id jQuery.scrollTo
 * @id jQuery.fn.scrollTo
 * @param {String, Number, DOMElement, jQuery, Object} target Where to scroll the matched elements.
 *	  The different options for target are:
 *		- A number position (will be applied to all axes).
 *		- A string position ('44', '100px', '+=90', etc ) will be applied to all axes
 *		- A jQuery/DOM element ( logically, child of the element to scroll )
 *		- A string selector, that will be relative to the element to scroll ( 'li:eq(2)', etc )
 *		- A hash { top:x, left:y }, x and y can be any kind of number/string like above.
*		- A percentage of the container's dimension/s, for example: 50% to go to the middle.
 *		- The string 'max' for go-to-end. 
 * @param {Number} duration The OVERALL length of the animation, this argument can be the settings object instead.
 * @param {Object,Function} settings Optional set of settings or the onAfter callback.
 *	 @option {String} axis Which axis must be scrolled, use 'x', 'y', 'xy' or 'yx'.
 *	 @option {Number} duration The OVERALL length of the animation.
 *	 @option {String} easing The easing method for the animation.
 *	 @option {Boolean} margin If true, the margin of the target element will be deducted from the final position.
 *	 @option {Object, Number} offset Add/deduct from the end position. One number for both axes or { top:x, left:y }.
 *	 @option {Object, Number} over Add/deduct the height/width multiplied by 'over', can be { top:x, left:y } when using both axes.
 *	 @option {Boolean} queue If true, and both axis are given, the 2nd axis will only be animated after the first one ends.
 *	 @option {Function} onAfter Function to be called after the scrolling ends. 
 *	 @option {Function} onAfterFirst If queuing is activated, this function will be called after the first scrolling ends.
 * @return {jQuery} Returns the same jQuery object, for chaining.
 *
 * @desc Scroll to a fixed position
 * @example $('div').scrollTo( 340 );
 *
 * @desc Scroll relatively to the actual position
 * @example $('div').scrollTo( '+=340px', { axis:'y' } );
 *
 * @dec Scroll using a selector (relative to the scrolled element)
 * @example $('div').scrollTo( 'p.paragraph:eq(2)', 500, { easing:'swing', queue:true, axis:'xy' } );
 *
 * @ Scroll to a DOM element (same for jQuery object)
 * @example var second_child = document.getElementById('container').firstChild.nextSibling;
 *			$('#container').scrollTo( second_child, { duration:500, axis:'x', onAfter:function(){
 *				alert('scrolled!!');																   
 *			}});
 *
 * @desc Scroll on both axes, to different values
 * @example $('div').scrollTo( { top: 300, left:'+=200' }, { axis:'xy', offset:-20 } );
 */
;(function( $ ){
	
	var $scrollTo = $.scrollTo = function( target, duration, settings ){
		$(window).scrollTo( target, duration, settings );
	};

	$scrollTo.defaults = {
		axis:'xy',
		duration: parseFloat($.fn.jquery) >= 1.3 ? 0 : 1
	};

	// Returns the element that needs to be animated to scroll the window.
	// Kept for backwards compatibility (specially for localScroll & serialScroll)
	$scrollTo.window = function( scope ){
		return $(window)._scrollable();
	};

	// Hack, hack, hack :)
	// Returns the real elements to scroll (supports window/iframes, documents and regular nodes)
	$.fn._scrollable = function(){
		return this.map(function(){
			var elem = this,
				isWin = !elem.nodeName || $.inArray( elem.nodeName.toLowerCase(), ['iframe','#document','html','body'] ) != -1;

				if( !isWin )
					return elem;

			var doc = (elem.contentWindow || elem).document || elem.ownerDocument || elem;
			
			return $.browser.safari || doc.compatMode == 'BackCompat' ?
				doc.body : 
				doc.documentElement;
		});
	};

	$.fn.scrollTo = function( target, duration, settings ){
		if( typeof duration == 'object' ){
			settings = duration;
			duration = 0;
		}
		if( typeof settings == 'function' )
			settings = { onAfter:settings };
			
		if( target == 'max' )
			target = 9e9;
			
		settings = $.extend( {}, $scrollTo.defaults, settings );
		// Speed is still recognized for backwards compatibility
		duration = duration || settings.speed || settings.duration;
		// Make sure the settings are given right
		settings.queue = settings.queue && settings.axis.length > 1;
		
		if( settings.queue )
			// Let's keep the overall duration
			duration /= 2;
		settings.offset = both( settings.offset );
		settings.over = both( settings.over );

		return this._scrollable().each(function(){
			var elem = this,
				$elem = $(elem),
				targ = target, toff, attr = {},
				win = $elem.is('html,body');

			switch( typeof targ ){
				// A number will pass the regex
				case 'number':
				case 'string':
					if( /^([+-]=)?\d+(\.\d+)?(px|%)?$/.test(targ) ){
						targ = both( targ );
						// We are done
						break;
					}
					// Relative selector, no break!
					targ = $(targ,this);
				case 'object':
					// DOMElement / jQuery
					if( targ.is || targ.style )
						// Get the real position of the target 
						toff = (targ = $(targ)).offset();
			}
			$.each( settings.axis.split(''), function( i, axis ){
				var Pos	= axis == 'x' ? 'Left' : 'Top',
					pos = Pos.toLowerCase(),
					key = 'scroll' + Pos,
					old = elem[key],
					max = $scrollTo.max(elem, axis);

				if( toff ){// jQuery / DOMElement
					attr[key] = toff[pos] + ( win ? 0 : old - $elem.offset()[pos] );

					// If it's a dom element, reduce the margin
					if( settings.margin ){
						attr[key] -= parseInt(targ.css('margin'+Pos)) || 0;
						attr[key] -= parseInt(targ.css('border'+Pos+'Width')) || 0;
					}
					
					attr[key] += settings.offset[pos] || 0;
					
					if( settings.over[pos] )
						// Scroll to a fraction of its width/height
						attr[key] += targ[axis=='x'?'width':'height']() * settings.over[pos];
				}else{ 
					var val = targ[pos];
					// Handle percentage values
					attr[key] = val.slice && val.slice(-1) == '%' ? 
						parseFloat(val) / 100 * max
						: val;
				}

				// Number or 'number'
				if( /^\d+$/.test(attr[key]) )
					// Check the limits
					attr[key] = attr[key] <= 0 ? 0 : Math.min( attr[key], max );

				// Queueing axes
				if( !i && settings.queue ){
					// Don't waste time animating, if there's no need.
					if( old != attr[key] )
						// Intermediate animation
						animate( settings.onAfterFirst );
					// Don't animate this axis again in the next iteration.
					delete attr[key];
				}
			});

			animate( settings.onAfter );			

			function animate( callback ){
				$elem.animate( attr, duration, settings.easing, callback && function(){
					callback.call(this, target, settings);
				});
			};

		}).end();
	};
	
	// Max scrolling position, works on quirks mode
	// It only fails (not too badly) on IE, quirks mode.
	$scrollTo.max = function( elem, axis ){
		var Dim = axis == 'x' ? 'Width' : 'Height',
			scroll = 'scroll'+Dim;
		
		if( !$(elem).is('html,body') )
			return elem[scroll] - $(elem)[Dim.toLowerCase()]();
		
		var size = 'client' + Dim,
			html = elem.ownerDocument.documentElement,
			body = elem.ownerDocument.body;

		return Math.max( html[scroll], body[scroll] ) 
			 - Math.min( html[size]  , body[size]   );
			
	};

	function both( val ){
		return typeof val == 'object' ? val : { top:val, left:val };
	};

})( jQuery );

/* Modernizr 2.5.3 (Custom Build) | MIT & BSD
 * Build: http://www.modernizr.com/download/#-shiv-mq-cssclasses-teststyles-load
 */
;window.Modernizr=function(a,b,c){function w(a){j.cssText=a}function x(a,b){return w(prefixes.join(a+";")+(b||""))}function y(a,b){return typeof a===b}function z(a,b){return!!~(""+a).indexOf(b)}function A(a,b,d){for(var e in a){var f=b[a[e]];if(f!==c)return d===!1?a[e]:y(f,"function")?f.bind(d||b):f}return!1}var d="2.5.3",e={},f=!0,g=b.documentElement,h="modernizr",i=b.createElement(h),j=i.style,k,l={}.toString,m={},n={},o={},p=[],q=p.slice,r,s=function(a,c,d,e){var f,i,j,k=b.createElement("div"),l=b.body,m=l?l:b.createElement("body");if(parseInt(d,10))while(d--)j=b.createElement("div"),j.id=e?e[d]:h+(d+1),k.appendChild(j);return f=["&#173;","<style>",a,"</style>"].join(""),k.id=h,m.innerHTML+=f,m.appendChild(k),l||(m.style.background="",g.appendChild(m)),i=c(k,a),l?k.parentNode.removeChild(k):m.parentNode.removeChild(m),!!i},t=function(b){var c=a.matchMedia||a.msMatchMedia;if(c)return c(b).matches;var d;return s("@media "+b+" { #"+h+" { position: absolute; } }",function(b){d=(a.getComputedStyle?getComputedStyle(b,null):b.currentStyle)["position"]=="absolute"}),d},u={}.hasOwnProperty,v;!y(u,"undefined")&&!y(u.call,"undefined")?v=function(a,b){return u.call(a,b)}:v=function(a,b){return b in a&&y(a.constructor.prototype[b],"undefined")},Function.prototype.bind||(Function.prototype.bind=function(b){var c=this;if(typeof c!="function")throw new TypeError;var d=q.call(arguments,1),e=function(){if(this instanceof e){var a=function(){};a.prototype=c.prototype;var f=new a,g=c.apply(f,d.concat(q.call(arguments)));return Object(g)===g?g:f}return c.apply(b,d.concat(q.call(arguments)))};return e});for(var B in m)v(m,B)&&(r=B.toLowerCase(),e[r]=m[B](),p.push((e[r]?"":"no-")+r));return w(""),i=k=null,function(a,b){function g(a,b){var c=a.createElement("p"),d=a.getElementsByTagName("head")[0]||a.documentElement;return c.innerHTML="x<style>"+b+"</style>",d.insertBefore(c.lastChild,d.firstChild)}function h(){var a=k.elements;return typeof a=="string"?a.split(" "):a}function i(a){var b={},c=a.createElement,e=a.createDocumentFragment,f=e();a.createElement=function(a){var e=(b[a]||(b[a]=c(a))).cloneNode();return k.shivMethods&&e.canHaveChildren&&!d.test(a)?f.appendChild(e):e},a.createDocumentFragment=Function("h,f","return function(){var n=f.cloneNode(),c=n.createElement;h.shivMethods&&("+h().join().replace(/\w+/g,function(a){return b[a]=c(a),f.createElement(a),'c("'+a+'")'})+");return n}")(k,f)}function j(a){var b;return a.documentShived?a:(k.shivCSS&&!e&&(b=!!g(a,"article,aside,details,figcaption,figure,footer,header,hgroup,nav,section{display:block}audio{display:none}canvas,video{display:inline-block;*display:inline;*zoom:1}[hidden]{display:none}audio[controls]{display:inline-block;*display:inline;*zoom:1}mark{background:#FF0;color:#000}")),f||(b=!i(a)),b&&(a.documentShived=b),a)}var c=a.html5||{},d=/^<|^(?:button|form|map|select|textarea)$/i,e,f;(function(){var a=b.createElement("a");a.innerHTML="<xyz></xyz>",e="hidden"in a,f=a.childNodes.length==1||function(){try{b.createElement("a")}catch(a){return!0}var c=b.createDocumentFragment();return typeof c.cloneNode=="undefined"||typeof c.createDocumentFragment=="undefined"||typeof c.createElement=="undefined"}()})();var k={elements:c.elements||"abbr article aside audio bdi canvas data datalist details figcaption figure footer header hgroup mark meter nav output progress section summary time video",shivCSS:c.shivCSS!==!1,shivMethods:c.shivMethods!==!1,type:"default",shivDocument:j};a.html5=k,j(b)}(this,b),e._version=d,e.mq=t,e.testStyles=s,g.className=g.className.replace(/(^|\s)no-js(\s|$)/,"$1$2")+(f?" js "+p.join(" "):""),e}(this,this.document),function(a,b,c){function d(a){return o.call(a)=="[object Function]"}function e(a){return typeof a=="string"}function f(){}function g(a){return!a||a=="loaded"||a=="complete"||a=="uninitialized"}function h(){var a=p.shift();q=1,a?a.t?m(function(){(a.t=="c"?B.injectCss:B.injectJs)(a.s,0,a.a,a.x,a.e,1)},0):(a(),h()):q=0}function i(a,c,d,e,f,i,j){function k(b){if(!o&&g(l.readyState)&&(u.r=o=1,!q&&h(),l.onload=l.onreadystatechange=null,b)){a!="img"&&m(function(){t.removeChild(l)},50);for(var d in y[c])y[c].hasOwnProperty(d)&&y[c][d].onload()}}var j=j||B.errorTimeout,l={},o=0,r=0,u={t:d,s:c,e:f,a:i,x:j};y[c]===1&&(r=1,y[c]=[],l=b.createElement(a)),a=="object"?l.data=c:(l.src=c,l.type=a),l.width=l.height="0",l.onerror=l.onload=l.onreadystatechange=function(){k.call(this,r)},p.splice(e,0,u),a!="img"&&(r||y[c]===2?(t.insertBefore(l,s?null:n),m(k,j)):y[c].push(l))}function j(a,b,c,d,f){return q=0,b=b||"j",e(a)?i(b=="c"?v:u,a,b,this.i++,c,d,f):(p.splice(this.i++,0,a),p.length==1&&h()),this}function k(){var a=B;return a.loader={load:j,i:0},a}var l=b.documentElement,m=a.setTimeout,n=b.getElementsByTagName("script")[0],o={}.toString,p=[],q=0,r="MozAppearance"in l.style,s=r&&!!b.createRange().compareNode,t=s?l:n.parentNode,l=a.opera&&o.call(a.opera)=="[object Opera]",l=!!b.attachEvent&&!l,u=r?"object":l?"script":"img",v=l?"script":u,w=Array.isArray||function(a){return o.call(a)=="[object Array]"},x=[],y={},z={timeout:function(a,b){return b.length&&(a.timeout=b[0]),a}},A,B;B=function(a){function b(a){var a=a.split("!"),b=x.length,c=a.pop(),d=a.length,c={url:c,origUrl:c,prefixes:a},e,f,g;for(f=0;f<d;f++)g=a[f].split("="),(e=z[g.shift()])&&(c=e(c,g));for(f=0;f<b;f++)c=x[f](c);return c}function g(a,e,f,g,i){var j=b(a),l=j.autoCallback;j.url.split(".").pop().split("?").shift(),j.bypass||(e&&(e=d(e)?e:e[a]||e[g]||e[a.split("/").pop().split("?")[0]]||h),j.instead?j.instead(a,e,f,g,i):(y[j.url]?j.noexec=!0:y[j.url]=1,f.load(j.url,j.forceCSS||!j.forceJS&&"css"==j.url.split(".").pop().split("?").shift()?"c":c,j.noexec,j.attrs,j.timeout),(d(e)||d(l))&&f.load(function(){k(),e&&e(j.origUrl,i,g),l&&l(j.origUrl,i,g),y[j.url]=2})))}function i(a,b){function c(a,c){if(a){if(e(a))c||(j=function(){var a=[].slice.call(arguments);k.apply(this,a),l()}),g(a,j,b,0,h);else if(Object(a)===a)for(n in m=function(){var b=0,c;for(c in a)a.hasOwnProperty(c)&&b++;return b}(),a)a.hasOwnProperty(n)&&(!c&&!--m&&(d(j)?j=function(){var a=[].slice.call(arguments);k.apply(this,a),l()}:j[n]=function(a){return function(){var b=[].slice.call(arguments);a&&a.apply(this,b),l()}}(k[n])),g(a[n],j,b,n,h))}else!c&&l()}var h=!!a.test,i=a.load||a.both,j=a.callback||f,k=j,l=a.complete||f,m,n;c(h?a.yep:a.nope,!!i),i&&c(i)}var j,l,m=this.yepnope.loader;if(e(a))g(a,0,m,0);else if(w(a))for(j=0;j<a.length;j++)l=a[j],e(l)?g(l,0,m,0):w(l)?B(l):Object(l)===l&&i(l,m);else Object(a)===a&&i(a,m)},B.addPrefix=function(a,b){z[a]=b},B.addFilter=function(a){x.push(a)},B.errorTimeout=1e4,b.readyState==null&&b.addEventListener&&(b.readyState="loading",b.addEventListener("DOMContentLoaded",A=function(){b.removeEventListener("DOMContentLoaded",A,0),b.readyState="complete"},0)),a.yepnope=k(),a.yepnope.executeStack=h,a.yepnope.injectJs=function(a,c,d,e,i,j){var k=b.createElement("script"),l,o,e=e||B.errorTimeout;k.src=a;for(o in d)k.setAttribute(o,d[o]);c=j?h:c||f,k.onreadystatechange=k.onload=function(){!l&&g(k.readyState)&&(l=1,c(),k.onload=k.onreadystatechange=null)},m(function(){l||(l=1,c(1))},e),i?k.onload():n.parentNode.insertBefore(k,n)},a.yepnope.injectCss=function(a,c,d,e,g,i){var e=b.createElement("link"),j,c=i?h:c||f;e.href=a,e.rel="stylesheet",e.type="text/css";for(j in d)e.setAttribute(j,d[j]);g||(n.parentNode.insertBefore(e,n),m(c,0))}}(this,document),Modernizr.load=function(){yepnope.apply(window,[].slice.call(arguments,0))};