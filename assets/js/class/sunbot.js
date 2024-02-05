const CWApiRelease = 'https://api.cw.com.tw';
const CWPublishingToken = localStorage.getItem('cw_publishing_token') ?? '';
const CWPublishingMemberToken = localStorage.getItem('cw_publishing_memberToken') ?? '';

const LoginPageUrl = 'login.html';
// const LoginPageUrl = 'https://web.cw.com.tw/activity/redirect/f2051b3a-5d63-4a23-992f-6fe6a796bb51';
const gas = 'https://script.google.com/macros/s/AKfycbxtMUAT-FYcOeNT2Plp1lTzOWPfXqedZwQ0YaFKJFvmBmm2chcIPlxfxNGQHtOh-m3AmA/exec';

class SunBot {
    constructor() {
        this._uuid = null;
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
                    this._account = result.items.account;
                    this._email = result.items.email;
                    this._name = result.items.name;
                }
            }
        }

        let reject = (error) => {
            window.location.href = 'login.html';
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
            url: 'https://sunbot.aif.tw/getuuid/',
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
            url: `https://sunbot.aif.tw/stream/${this._uuid}`,
        }

        this.beforeSend();

        return fetch(
            settings.url,
            {
                method: settings.method,
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                },
            }
        );
    }

    async getAnswer(functions, question) {
        this._question = question;
        if (this.isMemberLogin() === false) {
            return;
        }

        if (this._uuid === null) {
            await this.getUuid();
        }

        if (this._times <= 0) {
            functions.noCount();

            return;
        } else {
            await this.usingTimes();
        }

        let settings = {
            method: 'PUT',
            url: `https://sunbot.aif.tw/answer/${this._uuid}`,
            body: JSON.stringify({"question": this._question})
        }

        functions.beforeSend ?
            functions.beforeSend(this._question)
            : () => {};

        this.beforeSend();

        await fetch(
            settings.url,
            {
                method: settings.method,
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
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
console.log(answerable);
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
                    //`<button class="btn btn-light btn-sm" name="popup" data-value="${relatedContent}">查看書中段落</button>`;
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


            this.final();
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
            email: this._email,
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
            email: this._email,
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

    closeWindows() {
        if (this._uuid !== null) {
            navigator.sendBeacon(`https://sunbot.aif.tw/remove/${this._uuid}`);
        }
    }

    setAnswer(functions) {
        functions.answer(this._answer, this._answerToRelatedQuestion, this._answerToCheckBook);

        // let answerElement = this._answer;
        //
        // if (this._answerToCheckBook) {
        //     answerElement += `<button class="btn btn-light btn-sm" name="popup" data-value="${this._answerToCheckBook}">查看書中段落</button>`;
        // }
        //
        // if (this._answerToRelatedQuestion) {
        //     this._answerToRelatedQuestion.forEach((question) => {
        //         answerElement += `<button class="btn btn-light btn-sm" name="question" data-value="${question}">${question}</button>`;
        //     })
        // }

        // $('[data-target="typing"]').append(`<div>Ａ：${answerElement}<hr></div>`);

        // let target = $('.loadingWrap').closest('.message__msg');
        // $('.loadingWrap').closest('.message__msg').remove()

        // target.typing({
        //     sourceElement: `<div>${answerElement}<div>`
        // });

        this.setQuestion();
        this._answer = '';
        this._answerToCheckBook = '';
        this._answerToRelatedQuestion = '';
    }

    setQuestion() {
        let data = {
            type: 'question',
            email: this._email,
            question: this._question,
            answer: this._answer
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

    isMemberLogin() {
        return this._account !== null
            && this._email !== null
            && this._name !== null;
    }

    beforeSend() {
        // reset
        $('[data-member="account"]').text('');
        $('[data-member="email"]').text('');
        $('[data-member="name"]').text('');
        $('[data-member="times"]').text('');

        $('.ajaxLoading').show();
    }

    final() {
        const account = this._account;
        const email = this._email;
        const name = this._name;
        const times = this._times;

        // $('[data-member="account"]').text(account);
        // $('[data-member="email"]').text(email);
        // $('[data-member="name"]').text(name);
        // $('[data-member="times"]').text(times);
        //
        // // reset
        // $('form[name="question"] input[name="question"]').val('');
        //
        $('textarea[name="question"]').text('');
        $('.ajaxLoading').hide();
    }
}
