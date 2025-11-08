document.addEventListener("DOMContentLoaded", async () => {
  const API = "http://localhost:5050";
  const list = document.getElementById("requestItems");

  //gets the request from the backend and stores it in a json format, goes through each row to get the client name and id
  try {
    const res = await fetch(`${API}/requests`);
    const rows = await res.json();
    list.innerHTML = rows
      .map(
        (r) => `
      <li>
        <button class="row" data-id="${r.requestID}">
          ${r.client_name}
        </button>
      </li>
    `
      )
      .join("");
  } catch (e) {
    console.error(e);
    list.innerHTML = `<li>Failed to load requests</li>`;
  }

  //handles the click on the clients name on the request
  list.addEventListener("click", async (e) => {
    const btn = e.target.closest(".row");
    if (!btn) return;
    const id = btn.dataset.id;

    try {
      //fetches the detials for that request based on the id, returns the file in json format
      const res = await fetch(`${API}/requests/${id}`);
      const r = await res.json();

      document.getElementById("d-name").textContent = r.client_name;
      document.getElementById("d-address").textContent = r.address || "—";
      document.getElementById("d-rooms").textContent = r.number_of_rooms ?? "—";
      const dateObj = new Date(r.date);
      const formattedDate = dateObj.toLocaleString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      });
      document.getElementById("d-date").textContent = formattedDate || "—";
      document.getElementById("d-budget").textContent = r.budget || "0.00";
      document.getElementById("d-cleaning").textContent =
        r.cleaning_type || "—";
      document.getElementById("d-notes").textContent = r.notes || "—";

      //gets the images
      const imageContainer = document.getElementById("d-images");
      imageContainer.innerHTML = "";

      //loops through the images and loads the valid ones
      for (let i = 1; i <= 5; i++) {
        const img = document.createElement("img");
        img.src = `${API}/requests/${id}/image/${i}`;
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
});
