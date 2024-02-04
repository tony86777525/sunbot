$(function () {
    $(document).on('submit', '[name="setCWToken"]', (event) => {
        event.preventDefault();

        let formData = $(event.target).serializeArray();

        formData.forEach((data) => {
            localStorage.setItem(data.name, data.value);
        })

        window.location.href = 'chatbot.html';
    })
})