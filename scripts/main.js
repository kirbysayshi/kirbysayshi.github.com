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