document
  .getElementById("request-form")
  .addEventListener("submit", async (e) => {
    e.preventDefault();

    const form = e.target;
    const formData = new FormData(form);

    // Send to backend
    const res = await fetch("http://localhost:5050/request", {
      method: "POST",
      body: formData,
      credentials: "include",
    });

    const data = await res.json();

    if (data.success) {
      alert("request has been submitted");
      window.location.href = "clientHome.html";
    } else {
      alert("Error");
    }
    console.log(data);
  });
