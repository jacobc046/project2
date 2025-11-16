document.addEventListener("DOMContentLoaded", async () => {
  const API = "http://localhost:5050";

  const list = document.getElementById("orderItems");
  const oClient = document.getElementById("o-client");
  const oAddress = document.getElementById("o-address");
  const oRooms = document.getElementById("o-rooms");
  const oPrice = document.getElementById("o-price");
  const oDate = document.getElementById("o-date");
  const oNotes = document.getElementById("o-notes");

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
  });
});
