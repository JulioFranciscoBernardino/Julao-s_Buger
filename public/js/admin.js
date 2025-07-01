// ---------Responsive-navbar-active-animation-----------
function test() {
	var tabsNewAnim = $('#navbarSupportedContent');
	var activeItemNewAnim = tabsNewAnim.find('.active');
	if(activeItemNewAnim.length === 0) return; // caso nenhum item esteja ativo
	var activeWidthNewAnimHeight = activeItemNewAnim.innerHeight();
	var activeWidthNewAnimWidth = activeItemNewAnim.innerWidth();
	var itemPosNewAnim = activeItemNewAnim.position();
	$(".hori-selector").css({
		"top": itemPosNewAnim.top + "px",
		"left": itemPosNewAnim.left + "px",
		"height": activeWidthNewAnimHeight + "px",
		"width": activeWidthNewAnimWidth + "px"
	});
	$("#navbarSupportedContent").on("click", "li", function (e) {
		$('#navbarSupportedContent ul li').removeClass("active");
		$(this).addClass('active');
		var activeWidthNewAnimHeight = $(this).innerHeight();
		var activeWidthNewAnimWidth = $(this).innerWidth();
		var itemPosNewAnim = $(this).position();
		$(".hori-selector").css({
			"top": itemPosNewAnim.top + "px",
			"left": itemPosNewAnim.left + "px",
			"height": activeWidthNewAnimHeight + "px",
			"width": activeWidthNewAnimWidth + "px"
		});
	});
}

$(document).ready(function () {
	setTimeout(function () { test(); });

	// Ativa o menu conforme a página atual
	var path = window.location.pathname.split("/").pop();
	if (path === '') {
		path = 'index.html';
	}
	var target = $('#navbarSupportedContent ul li a[href="' + path + '"]');
	target.parent().addClass('active');
});

$(window).on('resize', function () {
	setTimeout(function () { test(); }, 500);
});

$(".navbar-toggler").click(function () {
	$(".navbar-collapse").slideToggle(300);
	setTimeout(function () { test(); });
});
