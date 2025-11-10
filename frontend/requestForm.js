document.getElementById("request-form").addEventListener("submit", async (e) => {
  e.preventDefault();

  const form = e.target;
  const formData = new FormData(form);

  // Send to backend
  const res = await fetch("http://localhost:5050/request", {
      method: "POST",
    body: formData,
    credentials: "include"
  });

  const data = await res.json();
  console.log(data);
  if (data.success) {
    alert("Request submitted successfully!");
  }
});
