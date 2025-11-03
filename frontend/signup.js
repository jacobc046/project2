document.addEventListener("DOMContentLoaded", function () {
  // Select the sign-up button
  const signUpBtn = document.querySelector("#sign-up-btn");

  if (signUpBtn) {
    // make sure it exists
    signUpBtn.onclick = function () {
      const firstNameInput = document.querySelector("#first-name-input");
      const lastNameInput = document.querySelector("#last-name-input");
      const usernameInput = document.querySelector("#username-input");
      const passwordInput = document.querySelector("#password-input");
      const isClient = document.querySelector('#is-client');

      const selectedValue = isClient ? 'client' : 'admin';

      fetch("http://localhost:5050/signup", {
        headers: { "Content-type": "application/json" },
        method: "POST",
        body: JSON.stringify({
            username: usernameInput.value,
            password: passwordInput.value,
            firstName: firstNameInput.value,
            lastName: lastNameInput.value,
            account_type: selectedValue
        }),
      })
        .then((response) => response.json())
        .then((data) => {
          console.log("Signup response:", data);
          window.location.href = selectedValue == 'admin' ? "/adminHome.html" : "/clientHome.html";
        })
        .catch((err) => console.error(err));
    };
  } else {
    console.log("No sign up button");
  }
});