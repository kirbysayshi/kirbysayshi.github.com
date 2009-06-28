$(document).ready(function(){
	$("a.more").bind("click", function(){
		$(this).siblings("div.postcontent").toggle("fast");
	});
});