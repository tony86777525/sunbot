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
		

		if (target == 'exchange') {
			$('.popupContent__status').removeClass('is-exchanged');
			$('.popupContent__status, .exchangeInput').removeClass('is-error');
			$('.codeStatus').hide();

			$('[data-popup-name="trial"]').hide();
			$('[data-popup-name="' + target + '"]').show();
		} else if(target == 'accept') {
			$('.popupContent__status').removeClass('is-exchanged');
			$('.popupContent__status, .exchangeInput').removeClass('is-error');

			const number = $('[name="number"]').val();

			if (number === undefined || number === '') {
				$('.popupContent__status, .exchangeInput').addClass('is-error');
				$('.codeStatus').show();
				return;
			}

			$('.popupContent__status').addClass('is-exchanged');

			let resolve = (data) => {
				if (data.isSuccess === 1) {
					this._times = data.times;

					$('[data-popup-name="' + target + '"]').show();
					$('[data-popup-name="exchange"]').hide();
				} else {
					$('.popupContent__status, .exchangeInput').addClass('is-error');
					$('.codeStatus').show();
				}
			}

			let functions = {
				resolve,
			};

			sunBot.exchangeTimes(functions, number);
		} else {
			//if user is NOT logged in
			$('[data-popup-name="' + target + '"]').show();

			//if user accept exchange
			if(target == 'exchange') {
				$('[data-popup-name="trial"]').hide();
			}
		}


	});

	//close popup
	$('[data-popup-item="close"]').on('click', function(){
		$(this).closest('[data-popup-item="group"]').hide();
	});
});
