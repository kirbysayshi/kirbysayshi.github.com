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

		$('.content-container').append( tpl({ redirect: matched }) );

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