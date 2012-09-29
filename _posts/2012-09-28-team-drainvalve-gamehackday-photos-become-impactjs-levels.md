---
layout:     post
title: Turning Photos into ImpactJS Platform Levels
oneliner: Shatner actually worked really well.
type:       project
projecturl: http://vimeo.com/25640233
categories:
  - Game Design
  - JavaScript
  - Experiments
tags:
  - ImpactJS
  - Foursquare
  - Edge Detection
---

More than a year ago [@tiegz](http://twitter.com/tiegz), [@shinyee_au](http://twitter.com/shinyee_au), and I participated in [gamehackday](http://gamehackday.org). We started off with this idea for importing photos from a foursquare location into a game, and then battling your friends that were also at the same location.

Eventually our overambitious hack was whittled down into just taking a photo and turning it into a platforming level for [ImpactJS][], without any user-authoring. I've recorded a [screencast](http://vimeo.com/25640233) about it (I highly suggest you watch it to understand what's going on), but never got a chance to explore some of the code involved.

<iframe src="http://player.vimeo.com/video/25640233" width="548" height="343" frameborder="0" webkitAllowFullScreen mozallowfullscreen allowFullScreen></iframe>

There were two components to the hack itself, analyzing a photo to create a tile map from it, and injecting that tile map into [ImpactJS][] at runtime (which it definitely wasn't meant to do!).

"Tile-izing" an Arbitrary Photo
-------------------------------

We could have gone with some very advanced edge detection techniques, but instead used a very simple algorithm that we basically just thought up on the spot:

1. Average the RGB values for each pixel. If less than or equal to `382` `(255 * 3  / 2)`, mark as solid.
2. Divide the image into arbitrary tiles. For each tile, if the majority of pixels within it are marked as solid, the tile is solid, otherwise the tile is transparent.

To actually accomplish this, the following hacky code was used. This is completely unedited, and does have some bugs (it was a hackday!):

{% highlight js %}
function tileize(cvs, reverse){

	_reverse = reverse || false;

	var  _width = cvs.width
		,_height = cvs.height
		,_idata = cvs.getContext('2d')
			.getImageData(0,0,_width,_height)
			.data
		,_length = _idata.length
		,_tilesize = _width < 100 ? 1 : _width / 100
		,_cols = ~~(_width / _tilesize)
		,_rows = ~~(_height / _tilesize)
		,r
		,c
		,t
		,tile
		,blacks
		,pxInTile
		,p = 0
		,px = 0
		,_tiles = []
		,_map = [];

	console.log(_width, _height, _idata.length)

	while( p < _length){

		px = ~~(p / 4);
		tile = ~~(px / _tilesize);
		_tiles[tile] = _tiles[tile] || [];
		_tiles[tile].push(
			// average is black?
			(_idata[p] + _idata[p+1] + _idata[p+2] <= 382
				? true
				: false)
		);
		p += 4;
	}

	t = _tiles.length - 1;
	while(t >= 0){
		blacks = 0;
		tile = _tiles[t]; // array of true/false
		pxInTile = tile.length;

		while(p = tile.pop()){
			blacks += (p === true ? 1 : 0);
		}

		r = ~~(t / _width);
		c = ~~(t % ~~(_width / _tilesize)); //t - (r * );

		_map[r] = _map[r] || [];

		if(blacks / pxInTile >= 0.5){
			//_tiles[t] = true;
			_map[r][c] = _reverse === true ? 0 : 1;
		} else {
			//_tiles[t] = false;
			_map[r][c] = _reverse === true ? 1 : 0;
		}

		t--
	}

	return _map;
}
{% endhighlight %}

The function can be divided into two components, and uses the raw pixel data from a canvas. The first is determining if a pixel should be considered black or white:

{% highlight js %}
while( p < _length){

	px = ~~(p / 4);
	tile = ~~(px / _tilesize);
	_tiles[tile] = _tiles[tile] || [];
	_tiles[tile].push(
		// average is black?
		(_idata[p] + _idata[p+1] + _idata[p+2] <= 382
			? true
			: false)
	);
	p += 4;
}
{% endhighlight %}

This discards any alpha channel, since we assumed we were using photos. It also groups pixels based on tilesize. `px` is the "pixel index", which assumes that pixels are indexed from the top left to right, one row at a time. [ImageData](https://developer.mozilla.org/en-US/DOM/ImageData) is a single array, with the R, G, B, and A values one after another, hence the need to increment `p` by `4` each step. One other note is that `~~()` is a [faster](http://jsperf.com/math-floor-vs-math-round-vs-parseint/5) shorthand for `Math.floor`.

Once the pixels were converted to a form of bicolor, the next step was to make the tilemap in a format that [ImpactJS][] expected.

{% highlight js %}
t = _tiles.length - 1;
while(t >= 0){
	blacks = 0;
	tile = _tiles[t]; // array of true/false
	pxInTile = tile.length;

	while(p = tile.pop()){
		blacks += (p === true ? 1 : 0);
	}

	r = ~~(t / _width);
	c = ~~(t % ~~(_width / _tilesize)); //t - (r * );

	_map[r] = _map[r] || [];

	if(blacks / pxInTile >= 0.5){
		//_tiles[t] = true;
		_map[r][c] = _reverse === true ? 0 : 1;
	} else {
		//_tiles[t] = false;
		_map[r][c] = _reverse === true ? 1 : 0;
	}

	t--
}
{% endhighlight %}

This loops through the bicolor array of arrays of `true`/`false` backwards. If the average of all tiles is black/solid, then mark the tile as solid. [ImpactJS][] expects the map to be an array of rows, each holding a single cell. The only other strange part is the `_reverse` variable, which we added to allow for images that were predominantly dark.

This code is pretty inefficient, but it worked!

The last component, not shown here, was to take the `_map` array, and convert it to JSON via `JSON.stringify`. This was then `POST`ed to a server-side script which helped with the second stage...

Getting ImpactJS to Load a Dynamically Generated Level
------------------------------------------------------

Once the map data was generated clientside and sent back to the server, the server injected it into a simple template that exposed the data as global variables:

{% highlight html %}
<script type="text/javascript">
	IMAGE = '<%= @image %>';
	WIDTH = <%= @width %>;
	HEIGHT = <%= @height %>;
	BLAH = <%= @map.first.size %>;
	TILESIZE = <%= @tilesize %>;
	MAP = <%= @map %>;
	BG_TILESIZE = Math.min(WIDTH, HEIGHT);
</script>
{% endhighlight %}

We then hardcoded [ImpactJS][] to look for a level called `game.levels.dynamic` in our `main.js` game initialization file:

{% highlight js %}
ig.module(
	'game.main'
)
.requires(
	'impact.game',
	'impact.font',
	'game.entities.player',
	'game.levels.dynamic' // our "dynamic" level as a dependency
)
.defines(function(){

MyGame = ig.Game.extend({
	font: new ig.Font('media/04b03.font.png'),
	gravity: 100,
	init: function() {
		ig.input.bind(ig.KEY.LEFT_ARROW,'left');
		ig.input.bind(ig.KEY.RIGHT_ARROW,'right');
		ig.input.bind(ig.KEY.X,'jump');
		ig.input.bind(ig.KEY.C,'shoot');
		ig.input.bind(ig.KEY.F,'fps');

		this.loadLevel(LevelDynamic); // load our "dynamic" level
	}
});

// Start the Game with 60fps, a resolution of 320x240, scaled
// up by a factor of 2
ig.main( '#canvas', MyGame, 60, BG_TILESIZE, BG_TILESIZE, 1);

});
{% endhighlight %}

As you can see, we used the demo code from [ImpactJS][] as a start. The trickiest part was the map file itself. To avoid doing anything _super_ crazy, we simply referenced the previously defined global variables (`IMAGE`, `BG_TILESIZE`, `TILESIZE`, `MAP`) from within a static map file:

{% highlight js %}
ig.module( 'game.levels.dynamic' )
.requires('impact.image')
.defines(function(){

	LevelDynamic=/*JSON[*/{
	"entities":[
		{"type":"EntityPlayer","x":52,"y":0}
	],
	"layer":[
		{"name":"background",
		"width":1,
		"height":1,
		"linkWithCollision":false,
		"visible":true,
		"tilesetName":IMAGE,
		"repeat":false,
		"distance":"1",
		"tilesize": BG_TILESIZE,
		"foreground":false,
		"data":[[1]]
		},
		{"name":"collision",
		"width":10,
		"height":10,
		"linkWithCollision":false,
		"visible":1,
		"tilesetName":"media/collisiontiles-25x25.png",
		"repeat":false,
		"distance":"1",
		"tilesize":TILESIZE,
		"foreground":false,
		"data": MAP
		},
		{"name":"main",
		"width":10,
		"height":10,
		"linkWithCollision":false,
		"visible":1,
		"tilesetName":"media/tileset.png",
		"repeat":false,
		"distance":"1",
		"tilesize":TILESIZE,
		"foreground":false,
		"data": MAP
		}
	]
	}/*]JSON*/;
	LevelDynamicResources=[new ig.Image(IMAGE), new ig.Image('media/tileset.png')];
});
{% endhighlight %}

Referencing these global variables allows [ImpactJS][] to still do it's thing regarding its internal loading system.

This is a bare minimum [ImpactJS][] level, containing three layers: background, collision, and main. We used the uploaded image (stored temporarily on the server) as the background. The collision layer is invisible, but [ImpactJS][] uses an image to represent the collision layer when using its level editor, [Weltmeister](http://impactjs.com/documentation/weltmeister). The main layer uses a custom tileset we created that contains only two tiles: a translucent square, and an empty tile. You can see this in the screencast; tiles that are solid are slightly grey compared to those that aren't.

Conclusion
----------

And that's basically it! We'd always wanted to release the source, but due to a few reasons (tired of it after the hack, [ImpactJS][] isn't open source, etc) we just never got around to it. But now, hopefully, this explains how it worked! Definitely let me know if things could be clarified.

[ImpactJS]: http://impactjs.com/
