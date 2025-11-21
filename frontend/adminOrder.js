document.addEventListener("DOMContentLoaded", async () => {
  const API = "http://localhost:5050";

  const list = document.getElementById("orderItems");
  const oClient = document.getElementById("o-client");
  const oAddress = document.getElementById("o-address");
  const oRooms = document.getElementById("o-rooms");
  const oPrice = document.getElementById("o-price");
  const oDate = document.getElementById("o-date");
  const oNotes = document.getElementById("o-notes");
  const imageContainer = document.getElementById("o-images");

  const generateBill = document.getElementById("gen-bill");
  const bNumber = document.getElementById("b-number");
  const bStatus = document.getElementById("b-status");
  const bAmount = document.getElementById("b-amount");
  const bDate = document.getElementById("b-date");
  const bNotes = document.getElementById("b-notes");

  const reviseAmount = document.getElementById("revise-amount");
  const reviseNotes = document.getElementById("revise-notes");
  const reviseBtn = document.getElementById("revise-bill");
  const billHistoryList = document.getElementById("bill-history");

  //which order is currently selected
  let currentOrderID = null;

  //format money and date
  const formatMoney = (n) => {
    const v = Number(n);
    if (!Number.isFinite(v)) return "-";
    return v
      .toLocaleString("en-US", { style: "currency", currency: "USD" })
      .replace("$", "");
  };

  const formatDate = (d) => {
    const dt = new Date(d);
    return Number.isNaN(dt.getTime())
      ? "-"
      : dt.toLocaleString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
          hour: "numeric",
          minute: "2-digit",
          hour12: true,
        });
  };

  //loads order list
  async function loadOrderList() {
    try {
      const res = await fetch(`${API}/orders`, { credentials: "include" });
      const text = await res.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch {
        throw new Error(text || "Bad JSON from /orders");
      }

      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to load orders");
      }

      const rows = data.orders || [];

      if (!rows.length) {
        list.innerHTML = "<li>No orders yet.</li>";
        return;
      }

      list.innerHTML = rows
        .map(
          (o) => `
          <li>
            <button class="row" data-id="${o.orderID}">
              <span>Order ID ${o.orderID}</span>
              ${o.client_name || "Unknown client"}
            </button>
          </li>
        `
        )
        .join("");
    } catch (err) {
      console.error("Load orders failed:", err);
      list.innerHTML = "<li>Failed to load orders.</li>";
    }
  }

  //loads one order
  async function loadOrder(id) {
    try {
      const res = await fetch(`${API}/orders/${id}`, {
        credentials: "include",
      });
      const text = await res.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch {
        throw new Error(text || "Bad JSON from /orders/:id");
      }

      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to load order");
      }

      const o = data.order;
      oClient.textContent = o.client_name || "Unknown client";
      oAddress.textContent = o.address || "–";
      oRooms.textContent = o.number_of_rooms ?? "–";
      oPrice.textContent = formatMoney(o.price);
      oDate.textContent = formatDate(o.date);
      oNotes.textContent = o.notes || "–";
      //console.log(o);

      //gets the images
      imageContainer.innerHTML = "";

      //loops through the images and loads the valid ones
      for (let i = 1; i <= 5; i++) {
        const buf = o[`image${i}`];
        if (!buf || !buf.data) continue; // if null or empty, skip

        const blob = new Blob([new Uint8Array(buf.data)], {
          type: "image/png",
        }); // or "image/png"
        const img = document.createElement("img");
        img.src = URL.createObjectURL(blob);
        img.alt = `Image ${i}`;
        img.onerror = () => img.remove();
        imageContainer.appendChild(img);
      }

      currentOrderID = o.orderID;
    } catch (err) {
      console.error("Order detail load failed:", err);
      oClient.textContent = "Select an order";
      oAddress.textContent =
        oRooms.textContent =
        oPrice.textContent =
        oDate.textContent =
        oNotes.textContent =
          "–";
      currentOrderID = null;
      clearBillUI("No bill yet. Select an order.");
    }
  }

  // initial load
  await loadOrderList();

  // clicking on an order in the list
  list.addEventListener("click", async (e) => {
    const btn = e.target.closest(".row");
    if (!btn) return;

    const id = btn.dataset.id;

    list
      .querySelectorAll(".row.selected")
      .forEach((el) => el.classList.remove("selected"));
    btn.classList.add("selected");

    await loadOrder(id);
    await loadBillForOrder(id);
    await loadBillHistory(id);
  });

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

  generateBill.addEventListener("click", async () => {
    if (!currentOrderID) {
      alert("Select an order first.");
      return;
    }

    try {
      const res = await fetch(`${API}/orders/${currentOrderID}/bill`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      });

      const text = await res.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch {
        throw new Error(text || "Bad JSON from create bill");
      }

      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to generate bill");
      }

      renderBill(data.bill);
      await loadBillHistory(currentOrderID);

      alert(`Bill #${data.bill.bill_number} created for this order.`);
    } catch (err) {
      console.error("Generate bill error:", err);
      alert("Could not generate bill. Please try again.");
    }
  });

  function renderBillHistory(history) {
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

      renderBillHistory(data.history);
    } catch (err) {
      console.error("Load bill history failed:", err);
      billHistoryList.innerHTML = "<li>Failed to load bill history.</li>";
    }
  }

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
});
