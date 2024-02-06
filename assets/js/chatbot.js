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

	let sunBot = new SunBot;
	let getMemberTimesResolve = (result) => {
		$('.exchangeHint').hide();
		if (result.isSuccess === true) {

			let questions = result.questions;
			if (questions) {
				let appendContent = '';
				questions.forEach((element) => {
					let action = '';
					if (element.related !== '') {
						action = `<button class="action action--related" data-button-item="popup" data-popup-target="related" data-value="${element.related}">書中相關段落</button>`;
					}
					appendContent +=
						`<div class="message message--user">
							<div class="message__dialog">${element.question}</div>
						</div>
						<div class="message message--ai">
							<div class="message__profile">AI孫主任</div>
							<div class="message__msg">
								${element.answer}
							</div>
							<div class="message__actions">
								${action}
							</div>
						</div>`;
				});

				$('.chatroom__messages').append(appendContent);
				$('.chatroom__messages').animate({scrollTop: $('.chatroom__messages')[0].scrollHeight}, 0);
				$('.chatroom').removeClass('is-unstart');
			}

			let exchangeTimes = result.exchangeTimes;
			let times = result.times;

			if (exchangeTimes > 0) {
				$('.chatroom').addClass('is-exchanged');
				$('.exchangeHint .times').text(times);
				$('.exchangeHint').show();
				$('.nav__links')
					.append(`<a class="link link&#45;&#45;text is-mb" href="#">2024 總體經濟白皮書</a>`)
					.prepend(`<a class="link link--text is-pc" href="#">2024 總體經濟白皮書</a>`);
			}
		}
	}
	sunBot.init(getMemberTimesResolve);

	$(document).on('click', 'button[name="questionButton"]', (event) => {
		$(event.target).addClass('is-active');
		// result chat
		const question = event.target.dataset.value;

		if (question === '' || question === undefined) {
			return;
		}

		const test = $(event.target).attr('data-test') === "true" ? true : false

		let beforeSend = (question) => {
			$('.chatroom__messages').append(
				`<div class="message message--user" style="display: none;">
					<div class="message__dialog">${question}</div>
				</div>`
			);
			$('.chatroom__messages').animate({scrollTop: $('.chatroom__messages')[0].scrollHeight}, 0)

			$('.chatroom__messages .message:last').fadeIn(600, () => {
				$('.chatroom__messages').append(
					`<div class="message message--ai">
					<div class="message__profile">AI孫主任</div>
					<div class="message__msg">
						<div class="loadingWrap">
							<div class="loading loading-0"></div>
							<div class="loading loading-1"></div>
							<div class="loading loading-2"></div>
						</div>
					</div>
					<div class="message__actions"></div>
				</div>`
				);
				$('.chatroom__messages').animate({scrollTop: $('.chatroom__messages')[0].scrollHeight}, 0)
			})
		};

		let noCount = () => {
			$('[data-popup-item="group"][data-popup-name="trial"]').show();
		}

		let answer = (answer, questions = null, related = null) => {
			let buttons = '';

			if (related) {
				buttons += `<button class="action action--related" data-button-item="popup" data-popup-target="related" data-value="${related}">書中相關段落</button>`
			}
			if (questions) {
				questions.forEach((question) => {
					buttons += `<button class="action action--recommend" name="questionButton" data-value="${question}">${question}</button>`;
				});
			}

			let target = $('.loadingWrap').closest('.message');
			target.find('.message__msg').html('').typing({
				sourceElement: `<div>${answer}<div>`,
				cb: () => {
					target.find('.message__actions').html(buttons);

					sunBot.appendQuestionnaire();
				}
			});

			$('.chatroom').removeClass('is-unstart');

			return true;
		}

		let functions = {
			noCount,
			beforeSend,
			answer
		};

		sunBot.getAnswer(functions, question, test);
	})

	$(document).on('click', 'button[name="questionSubmit"]', (event) => {
		let question = $('textarea[name="question"]').val();

		if (question === '' || question === undefined) {
			return;
		}
		question = question.trim();
		if (question === '') {
			return;
		}

		let beforeSend = (question) => {
			$('.chatroom__messages').append(
				`<div class="message message--user" style="display: none;">
					<div class="message__dialog">${question}</div>
				</div>`
			);
			$('.chatroom__messages').animate({scrollTop: $('.chatroom__messages')[0].scrollHeight}, 0)

			$('.chatroom__messages .message:last').fadeIn(600, () => {
				$('.chatroom__messages').append(
					`<div class="message message--ai">
					<div class="message__profile">AI孫主任</div>
					<div class="message__msg">
						<div class="loadingWrap">
							<div class="loading loading-0"></div>
							<div class="loading loading-1"></div>
							<div class="loading loading-2"></div>
						</div>
					</div>
					<div class="message__actions"></div>
				</div>`
				);
				$('.chatroom__messages').animate({scrollTop: $('.chatroom__messages')[0].scrollHeight}, 0)
			})
		}

		let noCount = () => {
			$('[data-popup-item="group"][data-popup-name="trial"]').show();
		}

		let answer = (answer, questions = null, related = null) => {
			let buttons = '';

			if (related) {
				buttons += `<button class="action action--related" data-button-item="popup" data-popup-target="related" data-value="${related}">書中相關段落</button>`
			}
			if (questions) {
				questions.forEach((question) => {
					buttons += `<button class="action action--recommend" name="questionButton" data-value="${question}">${question}</button>`;
				});
			}

			let target = $('.loadingWrap').closest('.message');
			target.find('.message__msg').html('').typing({
				sourceElement: `<div>${answer}<div>`,
				cb: () => {
					target.find('.message__actions').html(buttons);

					sunBot.appendQuestionnaire();
				}
			});

			return true;
		}

		let functions = {
			noCount,
			beforeSend,
			answer
		};

		sunBot.getAnswer(functions, question);
	})

	$(window).on('beforeunload', function () {
		sunBot.closeWindows();
	});

	//open popup
	$(document).on('click', '[data-button-item="popup"]', function(){
		var target = $(this).data('popup-target');
		$('body').removeClass('openNav');
		

		if (target == 'exchange') {
			$('[data-popup-name="exchange"]').find('.popupContent__status span').text('請輸入您的兌換碼');
			$('[data-popup-name="exchange"]').find('.popupContent__status').removeClass('is-exchanged');
			$('[data-popup-name="exchange"]').find('.popupContent__status, .exchangeInput').removeClass('is-error');
			$('[data-popup-name="exchange"]')
				.find('button[name="send"], button[name="cancel"], button[name="submit"], button[name="resend"]').hide();
			$('[data-popup-name="exchange"]').find('button[name="send"]').show();
			$('[data-popup-name="exchange"]').find('.codeStatus').hide();

			$('[data-popup-name="trial"]').hide();
			$('[data-popup-name="' + target + '"]').show();
		}
		else if(target == 'accept') {
			const number = $('[data-popup-name="exchange"]').find('[name="number"]').val();

			if (number === undefined || number === '') {
				$('[data-popup-name="exchange"]').find('.popupContent__status span').text('兌換碼有問題！');
				$('[data-popup-name="exchange"]').find('.popupContent__status, .exchangeInput').addClass('is-error');
				$('[data-popup-name="exchange"]').find('button[name="send"], button[name="cancel"], button[name="submit"], button[name="resend"]').hide();
				$('[data-popup-name="exchange"]').find('button[name="resend"]').show();
				$('[data-popup-name="exchange"]').find('.codeStatus').show();
				return;
			}

			let resolve = (data) => {
				if (data.isSuccess === 1) {
					$('[data-popup-name="' + target + '"]').show();
					$('[data-popup-name="exchange"]').hide();
					$('.chatroom').addClass('is-exchanged');
					$('.exchangeHint').show();
					$('.nav__links')
						.append(`<a class="link link&#45;&#45;text is-mb" href="#">2024 總體經濟白皮書</a>`)
						.prepend(`<a class="link link--text is-pc" href="#">2024 總體經濟白皮書</a>`);
				} else {
					$('[data-popup-name="exchange"]').find('.popupContent__status span').text('兌換碼有問題！');
					$('[data-popup-name="exchange"]').find('.popupContent__status, .exchangeInput').addClass('is-error');
					$('[data-popup-name="exchange"]').find('button[name="send"], button[name="cancel"], button[name="submit"], button[name="resend"]').hide();
					$('[data-popup-name="exchange"]').find('button[name="resend"]').show();
					$('[data-popup-name="exchange"]').find('.codeStatus').show();
				}
			}

			let functions = {
				resolve,
			};

			sunBot.exchangeTimes(functions, number);
		}
		else if (target === 'related') {
			let paragraph = $(this).attr('data-value');
			paragraph = paragraph.replace(/\n/g, '<br>');

			$('[data-popup-name="' + target + '"]').find('.related').html(paragraph)
			$('[data-popup-name="' + target + '"]').show();
		}
		else {
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

	$('[data-popup-name="exchange"]').find('button[name="send"], button[name="resend"]').on('click', function(){
		$('[data-popup-name="exchange"]').find('.popupContent__status span').text('請輸入您的兌換碼');
		$('[data-popup-name="exchange"]').find('.popupContent__status').removeClass('is-exchanged');
		$('[data-popup-name="exchange"]').find('.popupContent__status, .exchangeInput').removeClass('is-error');
		$('[data-popup-name="exchange"]').find('.codeStatus').hide();

		const number = $('[data-popup-name="exchange"]').find('[name="number"]').val();

		if (number === undefined || number === '') {
			$('[data-popup-name="exchange"]').find('.popupContent__status span').text('兌換碼有問題！');
			$('[data-popup-name="exchange"]').find('.popupContent__status, .exchangeInput').addClass('is-error');
			$('[data-popup-name="exchange"]').find('button[name="send"], button[name="cancel"], button[name="submit"], button[name="resend"]').hide();
			$('[data-popup-name="exchange"]').find('button[name="resend"]').show();
			$('[data-popup-name="exchange"]').find('.codeStatus').show();
			return;
		}

		let resolve = (data) => {
			if (data.isSuccess === true) {
				$('[data-popup-name="exchange"]').find('.popupContent__status span').text('兌換碼有效！');
				$('[data-popup-name="exchange"]').find('.popupContent__status').addClass('is-exchanged');
				$('[data-popup-name="exchange"]').find('button[name="send"], button[name="cancel"], button[name="submit"], button[name="resend"]').hide();
				$('[data-popup-name="exchange"]').find('button[name="cancel"], button[name="submit"]').show();
				$('[data-popup-name="exchange"]').find('.codeStatus').hide();
			} else {
				$('[data-popup-name="exchange"]').find('.popupContent__status span').text('兌換碼有問題！');
				$('[data-popup-name="exchange"]').find('.popupContent__status, .exchangeInput').addClass('is-error');
				$('[data-popup-name="exchange"]').find('button[name="send"], button[name="cancel"], button[name="submit"], button[name="resend"]').hide();
				$('[data-popup-name="exchange"]').find('button[name="resend"]').show();
				$('[data-popup-name="exchange"]').find('.codeStatus').show();
			}
		}

		let functions = {
			resolve,
		};

		sunBot.checkNumber(functions, number);
	});
});
