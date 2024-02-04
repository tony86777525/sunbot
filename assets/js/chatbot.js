$(function () {
	//WOW master
	new WOW().init();

	//open & close navigation
	$('[data-nav-item="nav-open"]').on('click', function(){
		$('body').addClass('openNav');
	});
	$('[data-nav-item="nav-close"]').on('click', function(){
		$('body').removeClass('openNav');
	});

	//open popup
	$('[data-button-item="popup"]').on('click', function(){
		var target = $(this).data('popup-target');
		$('body').removeClass('openNav');
		
		//if user is NOT logged in
		$('[data-popup-name="' + target + '"]').fadeIn();

		//if user accept exchange
		if(target == 'exchange') {
			$('[data-popup-name="trial"]').fadeOut();
		}

		if(target == 'accept') {
			$('[data-popup-name="exchange"]').fadeOut();
		}
	});

	//close popup
	$('[data-popup-item="close"]').on('click', function(){
		$(this).closest('[data-popup-item="group"]').fadeOut();
	});
});
