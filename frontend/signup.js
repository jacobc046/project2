document.addEventListener("DOMContentLoaded", function () {
  // Select the sign-up button
  const signUpBtn = document.querySelector("#sign-up-btn");

  if (signUpBtn) {
    // make sure it exists
    signUpBtn.onclick = async function () {
      const firstNameInput = document.querySelector("#first-name-input");
      const lastNameInput = document.querySelector("#last-name-input");
      const passwordInput = document.querySelector("#password-input");
      const emailInput = document.querySelector("#email-input");
      const phoneNumberInput = document.querySelector("#phone-number-input");
      const streetInput = document.querySelector("#street-input");
      const cityInput = document.querySelector("#city-input");
      const stateInput = document.querySelector("#state-input");
      const zipcodeInput = document.querySelector("#zipcode-input");
      const cardNumberInput = document.querySelector("#card-number-input");
      const exDateInput = document.querySelector("#ex-date-input");
      const cvvInput = document.querySelector("#cvv-code-input");

      await fetch("http://localhost:5050/signup", {
        headers: { "Content-type": "application/json" },
        method: "POST",
        credentials: "include",
        body: JSON.stringify({
          password: passwordInput.value,
          firstName: firstNameInput.value,
          lastName: lastNameInput.value,
          email: emailInput.value,
          phoneNumber: phoneNumberInput.value,
          street: streetInput.value,
          city: cityInput.value,
          state: stateInput.value,
          zipcode: zipcodeInput.value,
          cardNumber: cardNumberInput.value,
          exDate: exDateInput.value,
          cvv: cvvInput.value,
        }),
      })
        .then((response) => response.json())
        .then((data) => {
          console.log("Signup response:", data);
          window.location.href = "/clientHome.html";
        })
        .catch((err) => console.error(err));
    };
  } else {
    console.log("No sign up button");
  }
});
