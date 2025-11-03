document.addEventListener('DOMContentLoaded', function() {
    const signInBtn = document.querySelector('#sign-in-btn');

    if (signInBtn) {
    signInBtn.onclick = function () {
        const username = document.querySelector('#username-input').value;
        const password = document.querySelector('#password-input').value;

        fetch('http://localhost:5050/signin', {
            method: 'POST', 
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                username: username,
                password: password
            })
        })
        .then(response => response.json())
        .then(data => {
            data = data.data
            console.log("Signin response:", data);
            if (data.success) {
            alert(`Success! Welcome, ${data.user.username}!`);
            window.location.href = accountTypeInput.value == 'admin' ? "/adminHome.html" : "/clientHome.html";
            } else {
            alert("Login failed: " + data.message);
            }
        })
        .catch(err => console.error(err));
    };
    } else {
        console.log("No sign in button")
    }
});