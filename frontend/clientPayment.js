import { formatDate } from "../ultils/formatDate";
import { formatMoney } from "../ultils/formatMoney";

let rows = [];

document.addEventListener("DOMContentLoaded", async () => {
  const API = "http://localhost:5050";
  const list = document.getElementById("unpaidItems");
  const payBillBtn = document.getElementById("pay-bill-btn");

  //gets the request from the backend and stores it in a json format, goes through each row to get the client name and id
  try {
    const res = await fetch(`${API}/listUnpaidBills`, {
      method: "GET",
      credentials: "include",
    });

    rows = await res.json();
    rows = rows.unpaidBills;
    if (rows.empty) {
      list.innerHTML = "No upaid bills to display";
      return;
    }
    console.log(rows);

    list.innerHTML = rows
      .map(
        (r) => `
      <li>
        <button class="row"
        data-data="${encodeURIComponent(JSON.stringify(r))}">
          Bill ID: ${r.billID}
        </button>
      </li>
    `
      )
      .join("");
  } catch (e) {
    console.error(e);
    list.innerHTML = `<li>Failed to load unpaid bills</li>`;
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

      document.getElementById("d-date").textContent = formatDate(r.date);
      document.getElementById("d-budget").textContent = formatMoney(r.price);
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

        const blob = new Blob([new Uint8Array(buf.data)], { type: "image/png" }); // or "image/png"
        const img = document.createElement("img");
        img.src = URL.createObjectURL(blob);
        img.alt = `Image ${i}`;
        img.onerror = () => img.remove();
        imageContainer.appendChild(img);
    }

    payBillBtn.addEventListener("click", async (e) => {
      const cardNumber = document.getElementById("card-number-input").value;
      const cvv = document.getElementById("cvv-input").value;
      const exDate = document.getElementById("ex-date-input").value;      
  
      const res = await fetch(`${API}/payBill`, {
        method: "POST",
        credentials: "include",
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            billID: r.billID,
            bill_number: r.bill_number,
            price: r.price,
            status: "paid",
            card_number: cardNumber,
            cvv: cvv,
            ex_date: exDate
        })
      });      

      const resJson = await res.json();

      if (resJson.success) alert("Payment completed successfully!");
      else alert("Error completing payment " + res.error)
    });
    } catch (err) {
      console.error("Failed to load details/images:", err);
      document.getElementById("d-name").textContent = "Error loading details";
      document.getElementById("d-images").innerHTML = "";
    }
  });

}); //end top event listener, you probably dont want to include anything outside this scope
