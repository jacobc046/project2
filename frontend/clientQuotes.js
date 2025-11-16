let rows = [];

document.addEventListener("DOMContentLoaded", async () => {
  const API = "http://localhost:5050";
  const list = document.getElementById("quoteItems");

  //gets the request from the backend and stores it in a json format, goes through each row to get the client name and id
  try {
    const res = await fetch(`${API}/listQuotes`, {
      method: "GET",
      credentials: "include",
    });

    rows = await res.json();
    if (rows.empty) {
      list.innerHTML = "No quotes to display";
      return;
    } // if there are no quotes to display
    console.log(rows);

    list.innerHTML = rows
      .map(
        (r) => `
      <li>
        <button class="row" data-id="${
          r.quoteID
        }" data-data="${encodeURIComponent(JSON.stringify(r))}">
          ${r.client_name}
        </button>
      </li>
    `
      )
      .join("");
  } catch (e) {
    console.error(e);
    list.innerHTML = `<li>Failed to load quotes</li>`;
  }

  //handles the click on the clients name on the request
  list.addEventListener("click", (e) => {
    const btn = e.target.closest(".row");
    if (!btn) return;
    const r = JSON.parse(decodeURIComponent(btn.dataset.data));
    localStorage.setItem("quoteID", decodeURIComponent(btn.dataset.id));

    try {
      document.getElementById("d-name").textContent = r.client_name;
      document.getElementById("d-address").textContent = r.address || "—";
      document.getElementById("d-rooms").textContent = r.number_of_rooms ?? "—";
      const dateObj = new Date(r.date);
      // Format the date and time for datetime-local input
      const year = dateObj.getFullYear();
      const month = String(dateObj.getMonth() + 1).padStart(2, "0"); // Month is 0-indexed
      const day = String(dateObj.getDate()).padStart(2, "0");
      const hours = String(dateObj.getHours()).padStart(2, "0");
      const minutes = String(dateObj.getMinutes()).padStart(2, "0");

      document.getElementById(
        "d-date"
      ).value = `${year}-${month}-${day}T${hours}:${minutes}`;
      document.getElementById("d-budget").value = r.price || 0.0;
      document.getElementById("d-cleaning").textContent =
        r.cleaning_type || "—";
      document.getElementById("d-notes").textContent = r.notes;

      //gets the images
      const imageContainer = document.getElementById("d-images");
      imageContainer.innerHTML = "";

      //loops through the images and loads the valid ones
      for (let i = 1; i <= 5; i++) {
        const buf = r[`image${i}`];
        if (!buf || !buf.data) continue; // if null or empty, skip

        const blob = new Blob([new Uint8Array(buf)], { type: "image/png" }); // or "image/png"
        const img = document.createElement("img");
        img.src = URL.createObjectURL(blob);
        img.alt = `Image ${i}`;
        img.onerror = () => img.remove();
        imageContainer.appendChild(img);
      }
    } catch (err) {
      console.error("Failed to load details/images:", err);
      document.getElementById("d-name").textContent = "Error loading details";
      document.getElementById("d-images").innerHTML = "";
    }
  });

  const editButton = document.getElementById("editBtn");
  editButton.addEventListener("click", async (e) => {
    const data = rows.filter(
      (row) => row.quoteID == localStorage.getItem("quoteID")
    )[0];

    const budget = document.getElementById("d-budget").value;
    const date = document.getElementById("d-date").value;
    const notes = document.getElementById("d-notes").value;

    const res = await fetch(`${API}/submitQuote`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        quoteID: data.quoteID,
        requestID: data.requestID,
        response_number: data.response_number + 1,
        status: "awaiting admin",
        budget: budget,
        date: date,
        notes: notes,
      }),
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.success) {
          alert(`Quote updated successfully!`);
        } else {
          alert("Update failed: " + data.message);
        }
      })
      .catch((err) => console.error(err));
  });

  const approveBtn = document.getElementById("approveBtn");
  approveBtn.addEventListener("click", async (e) => {
    const data = rows.filter(
      (row) => row.quoteID == localStorage.getItem("quoteID")
    )[0];

    const res = await fetch(`${API}/submitQuote`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        quoteID: data.quoteID,
        requestID: data.requestID,
        response_number: data.response_number + 1,
        status: "accepted",
        budget: data.price,
        date: data.date,
        notes: data.notes,
      }),
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.success) {
          alert(`Quote approved successfully!`);
        } else {
          alert("Approval failed: " + data.message);
        }
      });
  });

  const rejectBtn = document.getElementById("rejectBtn");
  rejectBtn.addEventListener("click", async (e) => {
    const data = rows.filter(
      (row) => row.quoteID == localStorage.getItem("quoteID")
    )[0];

    const res = await fetch(`${API}/submitQuote`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        quoteID: data.quoteID,
        requestID: data.requestID,
        response_number: data.response_number + 1,
        status: "rejected",
        budget: data.price,
        date: data.date,
        notes: data.notes,
      }),
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.success) {
          alert(`Quote rejected successfully!`);
        } else {
          alert("Rejection failed: " + data.message);
        }
      });
  });
}); //end top event listener, you probably dont want to include anything outside this scope
