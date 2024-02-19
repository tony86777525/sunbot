const CWApiRelease = 'https://api.cw.com.tw';
const CWPublishingToken = localStorage.getItem('cw_publishing_token') ?? '';
const CWPublishingMemberToken = localStorage.getItem('cw_publishing_memberToken') ?? '';

const SunBotApiRelease = 'https://sunbot.aws.aif.tw';
// const SunBotApiRelease = 'https://sunbot.aws.aif.tw';
// const SunBotApiTest = 'https://sunbot.aif.tw';

const gas = 'https://script.google.com/macros/s/AKfycbyTmsQ6skjaiuZYAAYBY8at6FzMPz9nhpQqlHeJ3rMX7QZcfCLIkxkn6wAlQs1iJ6-OtA/exec';

const testQuestions = [
    {
        question: '做生意賺大錢',
        answer: '許多人都跟您一樣，希望做生意賺大錢，但是市場詭譎多變，各媒體眾聲喧嘩，財經訊息又真假難辨。接下來，我會試著從你最感興趣的面向與提問，幫助你做對經營決策。<br>你最想以哪個面向，了解如何做生意賺大錢？',
        buttons: [
            '營業目標怎麼訂？',
            '下一個世界工廠在哪裡？',
            '貿易戰、科技戰怎麼打？',
        ]
    },
    {
        question: '抓緊投資反轉點？',
        answer: '原來你希望可以抓緊投資反轉點，但是全球市場詭譎多變，各媒體眾聲喧嘩，財經訊息真假難辨。接下來，我會試著從你最感興趣的面向與提問，幫助你做對投資決策。<br>你最想以哪個面向，了解如何抓緊投資反轉點？',
        buttons: [
            '影響利率升降的因素',
            '不想存定存。小資族、退休族該怎麼投資？',
            '重塑未來的三個經濟動力',
        ]
    },
    {
        question: '確保工作與薪資穩定？',
        answer: '許多人都和你一樣，擔心工作與薪資不穩定，但全球政經情勢詭譎多變，各媒體眾聲喧嘩，財經訊息又真假難辨。接下來，我會試著從你最感興趣的面向與提問，幫助你做確保工作與薪資穩定。<br>您最想以哪個面向，確保工作與薪資穩定？',
        buttons: [
            '我想了解這世界怎麼了？',
            '哪些人可能永久失業？',
            '如何成為市場贏家，不淪為受害者？',
        ]
    }
];

class SunBot {
    constructor() {
        this._uuid = null;
        this._token = null;
        this._account = null;
        this._email = null;
        this._name = null;
        this._times = null;
        this._exchangeTimes = null;
        this._question = '';
        this._answer = '';
        this._answerToCheckBook = '';
        this._answerToRelatedQuestion = [];
        this._CWApi = CWApiRelease;
        this._CWPublishingToken = null;
        this._CWPublishingMemberToken = null;

        // 測試用
        localStorage.setItem('cw_publishing_token', CWPublishingToken);
        localStorage.setItem('cw_publishing_memberToken', CWPublishingMemberToken);
    }

    async init (getMemberTimesResolve = () => {}) {
        let resolve = (result) => {
            if (result.success === true) {
                if (result.code === "0000") {
                    this._token = result.items.uuid;
                    this._account = result.items.account;
                    this._email = result.items.email;
                    this._name = result.items.name;
                }
            }
        }

        let reject = (error) => {
            window.location.href = 'https://books.cw.com.tw/topic/sunbot/index.html';
        }

        let functions = {
            resolve,
            reject,
            getMemberTimesResolve
        };

        // get cw member info
        this.getMember(functions).then(() => {
            // get uuid
            this.getUuid();
        });
    }

    async getUuid() {
        if (this.isMemberLogin() === false) {
            return;
        }

        let settings = {
            method: 'GET',
            url: `${SunBotApiRelease}/getuuid/`,
        }
        let resolve = (result) => {
            let data = JSON.parse(result)
            this._uuid = data.uuid;
        }

        let functions = {
            resolve,
        };

        this.beforeSend();

        await fetch(
            settings.url,
            {
                method: settings.method,
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                },
            }
        ).then((response) => {
            if (!response.ok) {
                throw new Error(response.statusText);
            }

            return response.json();
        }).then((data) => {
            functions.resolve ?
                functions.resolve(data)
                : () => {};
        }).catch(err => {
            functions.reject
                ? functions.reject(err)
                : () => {};
        }).finally(() => {
            this.final();
        });
    }

    getStream() {
        if (this.isMemberLogin() === false) {
            return;
        }

        let settings = {
            method: 'PUT',
            url: `${SunBotApiRelease}/stream/${this._uuid}`,
        }

        this.beforeSend(true);

        return fetch(
            settings.url,
            {
                method: settings.method,
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                    'Authorization': this._token,
                },
            }
        );
    }

    async getAnswer(functions, question, test = false) {
        this._question = question;
        if (this.isMemberLogin() === false) {
            return;
        }

        // id-27 remove
        // if (test === true) {
        //     functions.beforeSend ?
        //         functions.beforeSend(this._question)
        //         : () => {};
        //
        //     this.beforeSend(true);
        //     const testQuestion = testQuestions.find((element) => element.question = question);
        //     this._answer = testQuestion.answer;
        //     this._answerToRelatedQuestion = testQuestion.buttons;
        //     this.setAnswer(functions);
        //     this.final(true);
        //
        //     return
        // }

        if (this._uuid === null) {
            await this.getUuid();
        }

        if (this._times <= 0) {
            functions.noCount();

            return;
        } else {
            functions.beforeSend ?
                functions.beforeSend(this._question)
                : () => {};
        }

        let settings = {
            method: 'PUT',
            url: `${SunBotApiRelease}/answer/${this._uuid}`,
            body: JSON.stringify({"question": this._question})
        }

        this.beforeSend(true);

        await fetch(
            settings.url,
            {
                method: settings.method,
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                    'Authorization': this._token,
                },
                body: settings.body,
            }
        ).then((response) => {
            if (!response.ok) {
                throw new Error(response.statusText);
            }

            return response.json();
        }).then((data) => {
            let outText = data.out_text;
            let answerable = data.answerable;
            let recommend = data.recommend;
            let relatedContent = data.related_content;

            switch (answerable) {
                case 'chat': {
                    this._answer += outText;
                    return this.getStream();
                }
                case 'book': {
                    return this.getStream();
                }
                case 'answer': {
                    this._answerToCheckBook += relatedContent;
                    // Related Questions
                    if (recommend.question !== undefined) {
                        this._answerToRelatedQuestion = recommend.question;
                    }
                    return this.getStream();
                }
                case 'reject': {
                    this._answer += `${outText}`;
                    // Related Questions
                    if (recommend.question !== undefined) {
                        this._answerToRelatedQuestion = recommend.question;
                    }

                    this.setAnswer(functions);
                }
            }
        }).then(function (response) {
            if (!response.ok) {
                throw new Error(response.statusText);
            }

            return response.body;
        }).then((data) => {
            const reader = data.getReader();
            return new ReadableStream({
                start(controller) {
                    function push() {
                        reader.read().then(({ done, value }) => {
                            if (done) {
                                controller.close();
                                return;
                            }
                            controller.enqueue(value);
                            push();
                        });
                    }
                    push();
                },
            });
        }).then((stream) =>
            new Response(stream, { headers: { "Content-Type": "text/html" } }).text(),
        ).then((data) => {
            this._answer = data;
            this.setAnswer(functions);

        }).catch(err => {
        }).finally(() => {
            this.usingTimes();
            this.final(true);
        });
    }

    async getMember(functions) {
        if (this._CWPublishingToken === null) {
            this._CWPublishingToken = localStorage.getItem('cw_publishing_token');
        }

        if (this._CWPublishingMemberToken === null) {
            this._CWPublishingMemberToken = localStorage.getItem('cw_publishing_memberToken');
        }

        let settings = {
            method: 'GET',
            url: `${this._CWApi}/api/books/v1.0/member/info`,
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'Authorization': `${this._CWPublishingToken}`,
                'Member-Access-Token': this._CWPublishingMemberToken,
            },
        };

        this.beforeSend();

        let getMemberTimes = () => {
            if (this.isMemberLogin === false) {
                return;
            }

            let data = {
                type: 'getMemberTimes',
                token: this._token,
                account: this._account,
                email: this._email,
                name: this._name,
            };

            let settings = {
                method: 'POST',
                url: gas,
                body: JSON.stringify(data),
            };
            return fetch(
                settings.url,
                {
                    method: settings.method,
                    body: settings.body,
                },
            )
        }

        let resolve = (result) => {
            if (result.isSuccess === true) {
                this._times = result.times;
                this._exchangeTimes = result.exchangeTimes;
            }
        }

        return await fetch(
            settings.url,
            {
                method: settings.method,
                headers: settings.headers,
            }
        ).then((response) => {
            if (!response.ok) {
                throw new Error(response.statusText);
            }

            return response.json();
        }).then((result) => {
            functions.resolve ?
                functions.resolve(result)
                : () => {};

            return getMemberTimes();
        }).then((response) => {
            if (!response.ok) {
                throw new Error(response.statusText);
            }

            return response.json();
        }).then(function (result) {
            resolve(result);

            functions.getMemberTimesResolve
                ? functions.getMemberTimesResolve(result)
                : () => {};
        }).catch(err => {
            functions.reject
                ? functions.reject(err)
                : () => {};
        }).finally(() => {
            this.final();
        });
    }

    async usingTimes() {
        if (this.isMemberLogin() === false) {
            return;
        }

        let data = {
            type: 'usingTimes',
            account: this._account,
        };

        let settings = {
            method: 'POST',
            url: gas,
            body: JSON.stringify(data),
        };

        let resolve = (data) => {
            if (data.isSuccess === 1) {
                this._times = data.times;
            } else if (data.isSuccess === 2) {
                this._times = 0;
            }
        }

        let functions = {
            resolve,
        };

        this.beforeSend(true);

        return await fetch(
            settings.url,
            {
                method: settings.method,
                body: settings.body,
            },
        ).then((response) => {
            if (!response.ok) {
                throw new Error(response.statusText);
            }

            return response.json();
        }).then((data) => {
            functions.resolve ?
                functions.resolve(data)
                : () => {};
        }).catch(err => {
            functions.reject
                ? functions.reject(err)
                : () => {};
        }).finally(() => {
            this.final(true);
        });
    }

    async checkNumber(functions, number) {
        if (this.isMemberLogin() === false) {
            return;
        }

        let data = {
            type: 'checkNumber',
            no: number,
        };

        let settings = {
            method: 'POST',
            url: gas,
            body: JSON.stringify(data),
        };

        this.beforeSend();

        return await fetch(
            settings.url,
            {
                method: settings.method,
                body: settings.body,
            },
        ).then((response) => {
            if (!response.ok) {
                throw new Error(response.statusText);
            }

            return response.json();
        }).then((data) => {
            functions.resolve ?
                functions.resolve(data)
                : () => {};
        }).catch(err => {
            functions.reject
                ? functions.reject(err)
                : () => {};
        }).finally(() => {
            this.final();
        });
    }
    async exchangeTimes(functions, number) {
        if (this.isMemberLogin() === false) {
            return;
        }

        let data = {
            type: 'exchangeTimes',
            account: this._account,
            no: number,
        };

        let settings = {
            method: 'POST',
            url: gas,
            body: JSON.stringify(data),
        };

        this.beforeSend();

        return await fetch(
            settings.url,
            {
                method: settings.method,
                body: settings.body,
            },
        ).then((response) => {
            if (!response.ok) {
                throw new Error(response.statusText);
            }

            return response.json();
        }).then((data) => {
            if (data.isSuccess === 1) {
                this._times = data.times;
                this._exchangeTimes = data._exchangeTimes;
            }

            functions.resolve ?
                functions.resolve(data)
                : () => {};
        }).catch(err => {
            functions.reject
                ? functions.reject(err)
                : () => {};
        }).finally(() => {
            this.final();
        });
    }

    closeWindows() {
        if (this._uuid !== null) {
            navigator.sendBeacon(`${SunBotApiRelease}/remove/${this._uuid}`);
        }
    }

    setAnswer(functions) {
        functions.answer(this._answer, this._answerToRelatedQuestion, this._answerToCheckBook);

        this.setQuestion();
        this._answer = '';
        this._answerToCheckBook = '';
        this._answerToRelatedQuestion = '';
    }

    setQuestion() {
        let data = {
            type: 'question',
            account: this._account,
            question: this._question,
            answer: this._answer,
            related: this._answerToCheckBook
        };

        let settings = {
            method: 'POST',
            url: gas,
            body: JSON.stringify(data),
        };
        fetch(
            settings.url,
            {
                method: settings.method,
                body: settings.body,
            },
        )
    }

    appendQuestionnaire() {
        if (this._times % 10 === 2 && this._exchangeTimes > 0) {
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

            let answer = `謝謝您的體驗！<br>還喜歡 AI 孫主任的服務嗎？<br>邀請您花十分鐘，填寫回饋問卷，讓我可以提供給您更好的服務！`;
            let buttons = `<a href="https://cwealth.my.salesforce-sites.com/web_surveypage?surveyId=a14RA000000PkHNYA0" class="action action--form" target="_blank">填寫問卷回饋</a>`;
            let target = $('.loadingWrap').closest('.message');
            target.find('.message__msg').html('').typing({
                sourceElement: `<div>${answer}<div>`,
                cb: () => {
                    target.find('.message__actions').html(buttons);
                }
            });
        }
    }

    isMemberLogin() {
        return this._token !== null
            && this._account !== null
            && this._email !== null
            && this._name !== null;
    }

    beforeSend(isAnswer = false) {
        // reset
        if (isAnswer === true) {
            $('.aiLoading').show();
        } else {
            $('.ajaxLoading').show();
        }

        $('.exchangeHint .times').text('');
    }

    final(isAnswer = false) {
        const times = this._times;

        $('.exchangeHint .times').text(times);

        // reset
        $('input[name="question"]').val('');

        if (isAnswer === true) {
            $('.aiLoading').hide();
        } else {
            $('.ajaxLoading').hide();
        }
    }
}
