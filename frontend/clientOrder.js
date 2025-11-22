import { formatMoney } from '../ultils/formatMoney';
import { formatDate } from '../ultils/formatDate';

let rows = [];
//which order is currently selected
let currentOrderID = null;

document.addEventListener("DOMContentLoaded", async () => {
  const API = "http://localhost:5050";
  const list = document.getElementById("orderItems");
  const bNumber = document.getElementById("b-number");
  const bStatus = document.getElementById("b-status");
  const bAmount = document.getElementById("b-amount");
  const bDate = document.getElementById("b-date");
  const bNotes = document.getElementById("b-notes");

  const reviseAmount = document.getElementById("revise-amount");
  const reviseNotes = document.getElementById("revise-notes");
  const reviseBtn = document.getElementById("revise-bill");
  const billHistoryList = document.getElementById("bill-history");

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

  async function loadBillHistory(orderID) {
    try {
      const res = await fetch(`${API}/orders/${orderID}/bill/history`, {
        credentials: "include",
      });

      if (res.status === 404) {
        billHistoryList.innerHTML = "<li>No bill history for this order.</li>";
        return;
      }

      const text = await res.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch {
        throw new Error(text || "Bad JSON from /orders/:id/bill/history");
      }

      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to load bill history");
      }

      const history = data.history;

      if (!Array.isArray(history) || !history.length) {
      billHistoryList.innerHTML = "<li>No bill history for this order.</li>";
      return;
    }

    billHistoryList.innerHTML = history
      .map(
        (b) => `
        <li>
          <strong>Bill # ${b.bill_number}</strong> – 
          $${formatMoney(b.price)} – 
          ${b.status} – 
          ${formatDate(b.date_issued)}<br/>
          <em>${b.notes || "No notes"}</em>
        </li>
      `
      )
      .join("");
    } catch (err) {
      console.error("Load bill history failed:", err);
      billHistoryList.innerHTML = "<li>Failed to load bill history.</li>";
    }
  }

  function clearBillUI(message = "No bill yet. Click Generate Bill.") {
    bNumber.textContent = "-";
    bStatus.textContent = message;
    bAmount.textContent = "-";
    bDate.textContent = "-";
    bNotes.textContent = "-";
  }

  function renderBill(bill) {
    bNumber.textContent = bill.bill_number;
    bStatus.textContent = bill.status;
    bAmount.textContent = formatMoney(bill.price);
    bDate.textContent = formatDate(bill.date_issued);
    bNotes.textContent = bill.notes || "—";
  }

  async function loadBillForOrder(orderID) {
    try {
      const res = await fetch(`${API}/orders/${orderID}/bill`, {
        credentials: "include",
      });

      if (res.status === 404) {
        clearBillUI();
        return;
      }

      const text = await res.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch {
        throw new Error(text || "Bad JSON from /orders/:id/bill");
      }

      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to load bill");
      }

      renderBill(data.bill);
    } catch (err) {
      console.error("Load bill failed:", err);
      clearBillUI("Failed to load bill.");
    }
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

      currentOrderID = r.orderID;

      loadBillHistory(r.orderID);
      loadBillForOrder(r.orderID);
    } catch (err) {
      console.error("Failed to load details/images:", err);
      document.getElementById("d-name").textContent = "Error loading details";
      document.getElementById("d-images").innerHTML = "";
    }
  });

  reviseBtn.addEventListener("click", async () => {
    if (!currentOrderID) {
      alert("Select an order first.");
      return;
    }

    const newAmount = reviseAmount.value;
    const notes = reviseNotes.value;

    if (!newAmount) {
      alert("Please enter a new amount.");
      return;
    }

    try {
      const res = await fetch(`${API}/orders/${currentOrderID}/bill/revise`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          price: newAmount,
          notes: notes,
        }),
      });

      const text = await res.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch {
        throw new Error(text || "Bad JSON from revise bill");
      }

      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to revise bill");
      }

      // Show the new latest bill & refresh history
      renderBill(data.bill);
      await loadBillHistory(currentOrderID);

      alert(`Bill revised successfully (version ${data.bill.bill_number}).`);
    } catch (err) {
      console.error("Revise bill error:", err);
      alert("Could not revise bill. Please try again.");
    }
  });
}); //end top event listener, you probably dont want to include anything outside this scope
