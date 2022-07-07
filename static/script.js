$(document).ready(function(){
    $('#sendMessageButton').on("click", async function(evt){
        evt.preventDefault();
        const message_to_user = $("select[id=to_username]").val();
        const message_body = $("input#body").val();

        if(message_to_user && message_body){
            $(this).prop('disabled', true);
            let response = await axios.post('/messages', { to_username: message_to_user, body: message_body });
            console.log(response.data);
            let new_message = response.data.message;
            let new_message_html = `
            <div class="col-sm-3">
                <div class="card">
                    <div class="card-body">
                        <h5 class="card-title">${ new_message.from_username } &raquo; ${ new_message.to_username }</h5>
                        <p class="card-text">${ new_message.body }</p>
                        <a href="/messages/${ new_message.id }" class="btn btn-outline-info btn-sm">Read</a>
                    </div>
                </div>
            </div>
            `;
            $("#sent_messages").append(new_message_html);
            $(this).prop('disabled', false);
            $("form")[0].reset();
        }else{
            alert("Please select the User and write the Message!!!");
        }
    });
});