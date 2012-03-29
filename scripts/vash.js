/*jshint strict:true, laxcomma:true, laxbreak:true, boss:true, curly:true, node:true, browser:true, devel:true */

/**
 * Vash - JavaScript Template Parser
 *
 * https://github.com/kirbysayshi/vash
 *
 * Copyright (c) 2012 Andrew Petersen
 * MIT License (LICENSE)
 */
(function(exports){

	"use strict";
	exports["version"] = "0.3.1-355";

	exports["config"] = {
		 "useWith": false
		,"modelName": "model"
	};

	/************** Begin injected code from build script */
	
// This pattern and basic lexer code are taken from the Jade lexer:
// https://github.com/visionmedia/jade/blob/master/lib/lexer.js

function VLexer(str){
	this.tokens = [];
	this.input = this.originalInput = str.replace(/\r\n|\r/g, '\n');
	this.deferredTokens = [];
	this.stash = [];
	this.lineno = 1;
	this.charno = 0;
}

VLexer.prototype = {
	
	tok: function(type, val){
		return {
			 type: type
			,line: this.lineno
			,chr: this.charno
			,val: val
			,touched: 0
		}
	}
	
	,scan: function(regexp, type){
		var captures, token;
	    if (captures = regexp.exec(this.input)) {
			this.consume(captures[0].length);
			
			token = this.tok(type, captures[1]);
			this.charno += captures[0].length;
			return token;
	    }
	}
	
	,spew: function(str){
		this.input = str + this.input;
		this.charno -= str.length;
	}

	,consume: function(len){
		this.input = this.input.substr(len);
	}

	,spewIf: function(tok, ifStr){
		var parts;

		if(tok){
			tok.touched += 1;
			parts = tok.val.split(ifStr);

			if(parts.length > 1){
				tok.val = parts.shift();
				tok.touched += 1;
				this.spew(ifStr + parts.join(ifStr));
			}
		}
		
		return tok;
	}

	,advance: function(){
		return this.deferred()
			|| this.stashed()
			|| this.next();
	}

	,defer: function(tok){
		tok.touched += 1;
		this.deferredTokens.push(tok);
	}

	,lookahead: function(n){
		var fetch = n - this.stash.length;
		while (fetch-- > 0) this.stash.push(this.next());
		return this.stash[--n];
	}

	,next: function() {
		return this.EMAIL()
			|| this.AT_STAR_OPEN()
			|| this.AT_STAR_CLOSE()

			|| this.AT_COLON()
			|| this.AT()
			
			|| this.PAREN_OPEN()
			|| this.PAREN_CLOSE()
			
			|| this.HARD_PAREN_OPEN()
			|| this.HARD_PAREN_CLOSE()
			
			|| this.BRACE_OPEN()
			|| this.BRACE_CLOSE()
			
			|| this.TEXT_TAG_OPEN()
			|| this.TEXT_TAG_CLOSE()
			
			|| this.HTML_TAG_SELFCLOSE()
			|| this.HTML_TAG_OPEN()
			|| this.HTML_TAG_CLOSE()
			
			|| this.PERIOD()
			|| this.NEWLINE()
			|| this.WHITESPACE()
			|| this.KEYWORD()
			|| this.IDENTIFIER()
			|| this.CONTENT()
	}

	,deferred: function() {

		var tok = this.deferredTokens.shift();

		if(tok){
			tok.touched += 1;
			return tok;
		} else {
			return false;
		}
	}

	,stashed: function() {
		
		var tok = this.stash.shift();

		if(tok) {
			tok.touched += 1;
			return tok;
		} else {
			return false;
		}
	}
	
	,AT: function(){
		return this.scan(/^(@)/, VLexer.tks.AT);
	}
	,AT_COLON: function(){
		return this.scan(/^@\:/, VLexer.tks.AT_COLON);
	}
	,AT_STAR_OPEN: function(){
		return this.scan(/^(@\*)/, VLexer.tks.AT_STAR_OPEN);
	}
	,AT_STAR_CLOSE: function(){
		return this.scan(/^(\*@)/, VLexer.tks.AT_STAR_CLOSE);
	}
	,PAREN_OPEN: function(){
		return this.scan(/^(\()/, VLexer.tks.PAREN_OPEN);
	}
	,PAREN_CLOSE: function(){
		return this.scan(/^(\))/, VLexer.tks.PAREN_CLOSE);
	}
	,BRACE_OPEN: function(){
		return this.scan(/^(\{)/, VLexer.tks.BRACE_OPEN);
	}
	,BRACE_CLOSE: function(){
		return this.scan(/^(\})/, VLexer.tks.BRACE_CLOSE);
	}
	,HARD_PAREN_OPEN: function(){
		return this.scan(/^(\[)/, VLexer.tks.HARD_PAREN_OPEN);
	}
	,HARD_PAREN_CLOSE: function(){
		return this.scan(/^(\])/, VLexer.tks.HARD_PAREN_CLOSE);
	}
	,TEXT_TAG_OPEN: function(){
		return this.scan(/^(<text>)/, VLexer.tks.TEXT_TAG_OPEN);
	}
	,TEXT_TAG_CLOSE: function(){
		return this.scan(/^(<\/text>)/, VLexer.tks.TEXT_TAG_CLOSE);
	}
	,HTML_TAG_SELFCLOSE: function(){
		return this.spewIf(this.scan(/^(<[^>]+?\/>)/, VLexer.tks.HTML_TAG_SELFCLOSE), '@');
	}
	,HTML_TAG_OPEN: function(){
		return this.spewIf(this.scan(/^(<[^\/ >]+?[^>]*?>)/, VLexer.tks.HTML_TAG_OPEN), '@');
	} 
	,HTML_TAG_CLOSE: function(){
		return this.spewIf(this.scan(/^(<\/[^>\b]+?>)/, VLexer.tks.HTML_TAG_CLOSE), '@');
	}
	,KEYWORD: function(){
		return this.scan(/^(case|catch|do|else|finally|for|function|goto|if|instanceof|return|switch|try|typeof|var|while|with)(?![\d\w])/, VLexer.tks.KEYWORD);
	}
	,IDENTIFIER: function(){
		return this.scan(/^([_$a-zA-Z\xA0-\uFFFF][_$a-zA-Z0-9\xA0-\uFFFF]*)/, VLexer.tks.IDENTIFIER);
	}
	,PERIOD: function(){
		return this.scan(/^(\.)/, VLexer.tks.PERIOD);
	}
	,EMAIL: function(){
		return this.scan(/^([a-zA-Z0-9._%-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4})\b/, VLexer.tks.EMAIL);
	}
	,CONTENT: function(){
		return this.scan(/^([^\s})@.]+?)/, VLexer.tks.CONTENT);
	}
	,WHITESPACE: function(){
		return this.scan(/^(\s)/, VLexer.tks.WHITESPACE);
	}
	,NEWLINE: function(){
		var token = this.scan(/^(\n)/, VLexer.tks.NEWLINE);
		if(token){
			this.lineno++;
			this.charno = 0;
		}
		return token;
	}
}

VLexer.tks = {
	 AT: 'AT'
	,AT_STAR_OPEN: 'AT_STAR_OPEN'
	,AT_STAR_CLOSE: 'AT_STAR_CLOSE'
	,AT_COLON: 'AT_COLON'
	,EMAIL: 'EMAIL'
	,PAREN_OPEN: 'PAREN_OPEN'
	,PAREN_CLOSE: 'PAREN_CLOSE'
	,BRACE_OPEN: 'BRACE_OPEN'
	,BRACE_CLOSE: 'BRACE_CLOSE'
	,HARD_PAREN_OPEN: 'HARD_PAREN_OPEN'
	,HARD_PAREN_CLOSE: 'HARD_PAREN_CLOSE'
	,TEXT_TAG_OPEN: 'TEXT_TAG_OPEN'
	,TEXT_TAG_CLOSE: 'TEXT_TAG_CLOSE'
	,HTML_TAG_SELFCLOSE: 'HTML_TAG_SELFCLOSE'
	,HTML_TAG_OPEN: 'HTML_TAG_OPEN'
	,HTML_TAG_CLOSE: 'HTML_TAG_CLOSE'
	,KEYWORD: 'KEYWORD'
	,IDENTIFIER: 'IDENTIFIER'
	,PERIOD: 'PERIOD'
	,CONTENT: 'CONTENT'
	,WHITESPACE: 'WHITESPACE'
	,NEWLINE: 'NEWLINE'
};


function Stack(){
	this._stack = []
}

Stack.prototype = {
	push: function(obj){
		this._stack.push(obj);
		return this;
	}
	,pop: function(){
		if(this._stack.length > 0)
			return this._stack.pop();
		else 
			return null //throw new Error('Stack Underflow');
	}
	,peek: function(){
		if(this._stack.length > 0){
			return this._stack[ this._stack.length - 1 ]
		} else {
			return null;
		}
	}
	,count: function(){
		return this._stack.length;
	}
	,raw: function(){
		return this._stack;
	}
};

function VParser(str){
	if(typeof str !== 'string')
		throw this.exceptionFactory(new Error, 'INVALIDINPUT', str);
	this.lex = new VLexer(str);
	this.tks = VLexer.tks;
	
	this.blockStack = new Stack();
	this.mode = VParser.modes.MKP;
	
	this.buffer = '';
	this.buffers = [];

	this.debug = false;
	this.consumedTokens = [];
}

VParser.modes = { MKP: "MARKUP", BLK: "BLOCK", EXP: "EXPRESSION" };

VParser.prototype = {

	parse: function(){
		var curr, i, len, block, orderedTokens;
		
		while( (curr = this.lex.advance()) ){
			this.debug && console.debug(this.mode, curr.type, curr, curr.val);
			
			if(this.mode === VParser.modes.MKP){
				this._handleMKP(curr);
				continue;
			}
			
			if(this.mode === VParser.modes.BLK){
				this._handleBLK(curr);
				continue;
			}
			
			if(this.mode === VParser.modes.EXP){
				this._handleEXP(curr);	
				continue;
			}
		}

		this._endMode(VParser.modes.MKP);

		for(i = 0, len = this.blockStack.count(); i < len; i++){
			block = this.blockStack.pop();
			
			// only throw errors if there is an unclosed block
			if(block.type === VParser.modes.BLK)
				throw this.exceptionFactory(new Error, 'UNMATCHED', block.tok);
		}
		
		if(this.debug){
			orderedTokens = this.consumedTokens.sort(function(a,b){ return b.touched - a.touched })
			console.group('Top 30 tokens ordered by TOUCHING');
			orderedTokens.slice(0, 30).forEach(function(tok){ console.debug( tok.touched, tok ) })
			console.groupEnd();
		}
		
		return this.buffers;
	}
	
	// TODO: break compile out to its own object, maybe even own file
	// TODO: make two passes, once to concat/clean all adjacent same types, once to actually combine and compile

	,compile: function(options){
		options = options || {};
		options.useWith = options.useWith === true ? true : false;
		options.modelName = options.modelName || 'model';
	
		var	 i
			,len
			,previous = null
			,current = null
			,generated = 'var out = "";\n'
			,modes = VParser.modes
			,reQuote = /[\"']/gi
			,reLineBreak = /[\n\r]/gi

			,func;

		for(i = 0, len = this.buffers.length; i < len; i++){
			previous = current;
			current = this.buffers[i];

			if(current.type === modes.MKP){
				generated += 
					(previous !== null && (previous.type === modes.MKP || previous.type === modes.EXP) 
						? '+' 
						: 'out += ') 
					+ '\'' 
					+ current.value
						.replace(reQuote, '\"')
						.replace(reLineBreak, '\\n') 
					+ '\'\n';
			}

			if(current.type === modes.BLK){
				// Nuke new lines, otherwise causes parse error
				generated += current.value
					.replace(reQuote, '\"')
					.replace(reLineBreak, '') + '\n';
			}

			if(current.type === modes.EXP){
				generated += 
					(previous !== null && (previous.type === modes.MKP || previous.type === modes.EXP) 
						? '+' 
						: 'out +=') 
					//+ ' (' 
					+ current.value
						.replace(reQuote, '\"')
						.replace(reLineBreak, '\\n') 
					+ '\n';//+ ')\n';
			}
		}

		this.debug && console.debug(generated);

		try {

			func = new Function(options.modelName, 
				(options.useWith === true 
					? "with(" + options.modelName + " || {}){" + generated + "}" 
					: generated ) + "\nreturn out;");

		} catch(e){
			e.message += ' :::: GENERATED :::: ' + generated;
			throw e;	
		}

		return func;
	}
	
	,exceptionFactory: function(e, type, tok){

		// second param is either a token or string?

		//var context = this.lex.originalInput.split('\n')[tok.line - 1].substring(0, tok.chr + 1);
		var context = '', i;

		for(i = 0; i < this.buffers.length; i++){
			context += this.buffers[i].value;
		}

		if(context.length > 100){
			context = context.substring( context.length - 100 );
		}

		switch(type){

			case 'UNMATCHED':
				e.name = "UnmatchedCharacterError";

				if(tok){
					e.message = 'Unmatched ' + tok.type
						+ ' near: "' + context + '"'
						+ ' at line ' + tok.line
						+ ', character ' + tok.chr
						+ '. Value: ' + tok.val;
					e.lineNumber = tok.line;
				}

				break;

			case 'INVALIDINPUT':
				e.name = "InvalidParserInputError";
				
				if(tok){
					this.message = 'Asked to parse invalid or non-string input: '
						+ tok;
				}
				
				this.lineNumber = 0;
				break;

		}

		return e;
	}

	,_useToken: function(tok){
		this.debug && this.consumedTokens.push(tok);
		this.buffer += tok.val;
	}
	
	,_useTokens: function(toks){
		for(var i = 0, len = toks.length; i < len; i++){
			this.debug && this.consumedTokens.push(toks[i]);
			this.buffer += toks[i].val;
		}
	}

	,_advanceUntilNot: function(untilNot){
		var curr, next, tks = [];

		while( next = this.lex.lookahead(1) ){
			if(next.type === untilNot){
				curr = this.lex.advance();
				tks.push(curr);
			} else {
				break;
			}
		}
		
		return tks;
	}

	,_advanceUntilMatched: function(curr, start, end){
		var next = curr
			,nstart = 0
			,nend = 0
			,tks = [];
		
		while(next){
			if(next.type === start) nstart++;
			if(next.type === end) nend++;
			
			tks.push(next);
			
			if(nstart === nend) break;
			next = this.lex.advance();
			if(!next) throw this.exceptionFactory(new Error, 'UNMATCHED', curr);
		}
		
		return tks;
	}
	
	// allows a mode switch without closing the current buffer
	,_retconMode: function(correctMode){
		this.mode = correctMode;
	}

	,_endMode: function(nextMode){
		if(this.buffer !== ''){
			this.buffers.push( { type: this.mode, value: this.buffer } );
			this.buffer = '';
		}
		this.mode = nextMode || VParser.modes.MKP;
	}
	
	,_handleMKP: function(curr){
		var  next = this.lex.lookahead(1)
			,ahead = this.lex.lookahead(2)
			,block = null
			,tagName = null
			,tempStack = [];
		
		switch(curr.type){
			
			case this.tks.AT_STAR_OPEN:
				this._advanceUntilMatched(curr, this.tks.AT_STAR_OPEN, this.tks.AT_STAR_CLOSE);
				break;
			
			case this.tks.AT:
				if(next) switch(next.type){
					
					case this.tks.PAREN_OPEN:
					case this.tks.IDENTIFIER:
						this._endMode(VParser.modes.EXP);
						break;
					
					case this.tks.KEYWORD:
					case this.tks.BRACE_OPEN:
						this._endMode(VParser.modes.BLK);
						break;
					
					default:
						this._useToken(this.lex.advance());

						break;
				}
				break;		
			
			case this.tks.BRACE_OPEN:
				this._endMode(VParser.modes.BLK);
				this.lex.defer(curr);
				break;

			case this.tks.BRACE_CLOSE:
				this._endMode(VParser.modes.BLK);
				this.lex.defer(curr);
				break;
			
			case this.tks.TEXT_TAG_OPEN:
			case this.tks.HTML_TAG_OPEN:
				tagName = curr.val.match(/^<([^\/ >]+)/i); 
				
				if(tagName === null && next && next.type === this.tks.AT && ahead)
					tagName = ahead.val.match(/(.*)/); // HACK for <@exp>

				this.blockStack.push({ type: VParser.modes.MKP, tag: tagName[1], tok: curr });
				if(this.tks.HTML_TAG_OPEN === curr.type) this._useToken(curr);
				break;
			
			case this.tks.TEXT_TAG_CLOSE:
			case this.tks.HTML_TAG_CLOSE:
				tagName = curr.val.match(/^<\/([^>]+)/i); 
				
				if(tagName === null && next && next.type === this.tks.AT && ahead)
					tagName = ahead.val.match(/(.*)/); // HACK for </@exp>
				
				block = this.blockStack.pop();
				
				while(block !== null){
					if(block.type === VParser.modes.MKP && tagName[1] === block.tag){
						break;
					}
					tempStack.push(block);
					block = this.blockStack.pop();
				}
				
				if(block === null){
					// couldn't find opening tag
					throw this.exceptionFactory(new Error, 'UNMATCHED', curr);
				}
				
				// put all blocks back except for found
				this.blockStack.raw().push.apply(this.blockStack.raw(), tempStack);
				
				if(this.tks.HTML_TAG_CLOSE === curr.type) this._useToken(curr);

				block = this.blockStack.peek();
				if(
					block !== null && block.type === VParser.modes.BLK 
					&& (next.type === this.tks.WHITESPACE || next.type === this.tks.NEWLINE) 
				){
					this._useTokens(this._advanceUntilNot(this.tks.WHITESPACE));
					this._endMode(VParser.modes.BLK);
				}
				break;

			default:
				this._useToken(curr);
				break;
		}
		
	}
	
	,_handleBLK: function(curr){
		
		var next = this.lex.lookahead(1)
			,block = null
			,tempStack = [];
		
		switch(curr.type){
			
			case this.tks.AT:
				switch(next.type){
					
					case this.tks.AT:
						break;
					
					default:
						this.lex.defer(curr);
						this._endMode(VParser.modes.MKP);
						break;
				}
				break;
			
			case this.tks.AT_COLON:
				this._endMode(VParser.modes.MKP);
				break;
			
			case this.tks.TEXT_TAG_OPEN:
			case this.tks.TEXT_TAG_CLOSE:
			case this.tks.HTML_TAG_SELFCLOSE:
			case this.tks.HTML_TAG_OPEN:
			case this.tks.HTML_TAG_CLOSE:
				this._endMode(VParser.modes.MKP);
				this.lex.defer(curr);
				break;
			
			case this.tks.BRACE_OPEN:
			case this.tks.PAREN_OPEN:
				this.blockStack.push({ type: VParser.modes.BLK, tok: curr });
				this._useToken(curr);
				break;
			
			case this.tks.BRACE_CLOSE:
			case this.tks.PAREN_CLOSE:
				block = this.blockStack.pop();
				
				// try to find a block of type BLK. save non-BLKs for later...
				while(block !== null && block.type !== VParser.modes.BLK ){
					tempStack.push(block);
					block = this.blockStack.pop();
				}
				
				// put non-BLKs back in
				this.blockStack.raw().push.apply(this.blockStack.raw(), tempStack);
				
				if(block === null || (block !== null && block.type !== VParser.modes.BLK))
					throw this.exceptionFactory(new Error, 'UNMATCHED', curr);
				
				this._useToken(curr);
				
				// check for: } KEYWORD
				this._advanceUntilNot(this.tks.WHITESPACE);
				next = this.lex.lookahead(1);
				if( next && next.type === this.tks.KEYWORD )
					break;

				block = this.blockStack.peek();
				if(block !== null && block.type === VParser.modes.MKP) 
					this._endMode(VParser.modes.MKP);
					
				break;

			case this.tks.WHITESPACE:
				this._useToken(curr);
				this._advanceUntilNot(this.tks.WHITESPACE);
				break;

			default:
				this._useToken(curr);
				break;
		}
		
	}
	
	,_handleEXP: function(curr){
		
		var ahead = null;
		
		switch(curr.type){
			
			case this.tks.KEYWORD:		
				this._endMode(VParser.modes.BLK);
				this.lex.defer(curr);
				break;
			
			case this.tks.IDENTIFIER:
				this._useToken(curr);		
				break;
			
			case this.tks.HARD_PAREN_OPEN:
				this._useTokens(this._advanceUntilMatched(curr, this.tks.HARD_PAREN_OPEN, this.tks.HARD_PAREN_CLOSE));
				ahead = this.lex.lookahead(1);
				if(ahead && ahead.type === this.tks.IDENTIFIER){
					this._endMode(VParser.modes.MKP);
				}
				break;
			
			case this.tks.PAREN_OPEN:
				ahead = this.lex.lookahead(1);
				if(ahead && ahead.type === this.tks.KEYWORD){
					this.lex.defer(curr);
					this._retconMode(VParser.modes.BLK);
				} else {
					this._useTokens(this._advanceUntilMatched(curr, this.tks.PAREN_OPEN, this.tks.PAREN_CLOSE));
					ahead = this.lex.lookahead(1);
					if(ahead && ahead.type === this.tks.IDENTIFIER){
						this._endMode(VParser.modes.MKP);
					}	
				}
				break;
			
			case this.tks.PERIOD:
				ahead = this.lex.lookahead(1);
				if(ahead && (ahead.type === this.tks.IDENTIFIER || ahead.type === this.tks.KEYWORD))
					this._useToken(curr);
				else {
					this._endMode(VParser.modes.MKP);
					this.lex.defer(curr);
				}
				break;
			
			default:
				// assume end of expression
				this._endMode(VParser.modes.MKP);
				this.lex.defer(curr);
				break;
				
		}
		
	}
	
}

	/************** End injected code from build script */

	exports["VLexer"] = VLexer;
	exports["VParser"] = VParser;
	exports["compile"] = function tpl(markup, options){

		var  p = new VParser(markup)
			,cmp;

		options = options || {};
		options.useWith = typeof options.useWith === 'undefined' 
			? exports.config.useWith 
			: options.useWith;
		options.modelName = options.modelName || exports.config.modelName;

		p.parse();
		cmp = p.compile(options)

		// Express support
		return function render(locals){
			return cmp(locals);
		}
	};

})(typeof exports === 'undefined' ? this['vash'] = {} : exports);
