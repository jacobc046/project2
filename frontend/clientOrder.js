let rows = [];

document.addEventListener("DOMContentLoaded", async () => {
  const API = "http://localhost:5050";
  const list = document.getElementById("orderItems");

  //gets the request from the backend and stores it in a json format, goes through each row to get the client name and id
  try {
    const res = await fetch(`${API}/orders`, {
      method: "GET",
      credentials: "include",
    });

    rows = await res.json();
    rows = rows.orders;
    if (rows.empty) {
      list.innerHTML = "No orders to display";
      return;
    } // if there are no quotes to display
    console.log(rows);

    list.innerHTML = rows
      .map(
        (r) => `
      <li>
        <button class="row" data-id="${
          r.orderID
        }" data-data="${encodeURIComponent(JSON.stringify(r))}">
          ${r.client_name}
        </button>
      </li>
    `
      )
      .join("");
  } catch (e) {
    console.error(e);
    list.innerHTML = `<li>Failed to load orders</li>`;
  }

  //handles the click on the clients name on the request
  list.addEventListener("click", (e) => {
    const btn = e.target.closest(".row");
    if (!btn) return;
    const r = JSON.parse(decodeURIComponent(btn.dataset.data));

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
      ).textContent = `${month}-${day}-${year} at ${hours}:${minutes}`;
      document.getElementById("d-budget").textContent = r.price || 0.0;
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

        const blob = new Blob([new Uint8Array(buf.data)], { type: "image/png" });
        
        
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
}); //end top event listener, you probably dont want to include anything outside this scope
