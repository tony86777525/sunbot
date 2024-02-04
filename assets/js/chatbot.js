$(function () {
	//WOW master
	new WOW().init();

	let sunBot = new SunBot;
	sunBot.init();

	$(document).on('click', 'button[name="question"]', (event) => {
		// result chat
		const question = event.target.dataset.value;
		$('[data-target="typing"]').append(`<div>Ｑ：${question}</div>`);
		$('[data-target="typing"]').animate({scrollTop: $('[data-target="typing"]')[0].scrollHeight}, 0);

		sunBot.getAnswer(question);
	})

	$(document).on('submit', 'form[name="question"]', (event) => {
		event.preventDefault();

		const formData = $(event.target).serializeArray();

		const question = formData.find(data => data.name === 'question');

		// result chat
		$('[data-target="typing"]').append(`<div>Ｑ：${question.value}</div>`)
		$('[data-target="typing"]').animate({scrollTop: $('[data-target="typing"]')[0].scrollHeight}, 0);
		sunBot.getAnswer(question.value);
	})

	$(document).on('click', '[name="popup"]', (event) => {
		alert(event.target.dataset.value);
	})

	$(window).on('beforeunload', function () {
		sunBot.closeWindows();
	});



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
			$(document).on('submit', '[name="exchange"]', (element) => {
				element.preventDefault();

				const formData = $(element.target).serializeArray();
				const numberData = formData.find(data => data.name === 'number');

				if (numberData === undefined) {
					alert('輸入錯誤');
					return;
				}

				const number = numberData.value;

				sunBot.exchangeTimes(number);
			})
			$('[data-popup-name="exchange"]').fadeOut();
		}
	});

	//close popup
	$('[data-popup-item="close"]').on('click', function(){
		$(this).closest('[data-popup-item="group"]').fadeOut();
	});
});
