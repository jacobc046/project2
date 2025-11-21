document.addEventListener("DOMContentLoaded", async () => {
  const API = "http://localhost:5050";
  const list = document.getElementById("quoteItems");

  const qClient = document.getElementById("q-client");
  const qAddress = document.getElementById("q-address");
  const qStatus = document.getElementById("q-status");
  const qPrice = document.getElementById("q-price");
  const qDate = document.getElementById("q-date");
  const qNotes = document.getElementById("q-notes");

  const negotiateBtn = document.getElementById("btn-negotiate");
  const negPrice = document.getElementById("neg-price");
  const negDate = document.getElementById("neg-datetime");
  const negNote = document.getElementById("neg-note");

  const qHistory = document.getElementById("q-history");
  const cancelBtn = document.getElementById("btn-cancel");
  const acceptBtn = document.getElementById("btn-accept");

  //which quote is currently selected
  let currentQuoteID = null;

  const formatMoney = (n) => {
    const v = Number(n);
    if (!Number.isFinite(v)) return "-";
    return v
      .toLocaleString("en-US", { style: "currency", currency: "USD" })
      .replace("$", "");
  };

  //convert into JS date
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

  //load list of quotes
  async function loadList() {
    try {
      const res = await fetch(`${API}/quotes`, { credentials: "include" });
      const text = await res.text();
      let rows;
      try {
        rows = JSON.parse(text);
      } catch {
        throw new Error(text || "Bad JSON from /quotes");
      }
      if (!res.ok) throw new Error(rows?.error || "Failed to load quotes");

      if (!Array.isArray(rows) || rows.length === 0) {
        list.innerHTML = `<li>No quotes yet.</li>`;
        return;
      }

      //for each quote in the list create a button with the quote info
      list.innerHTML = rows
        .map(
          (r) => `
          <li>
            <button class="row" data-id="${r.quoteID}">
              <span>Quote ID ${r.quoteID}</span>
              ${r.client_name || "Unknown"}
            </button>
          </li>
        `
        )
        .join("");
    } catch (e) {
      console.error("Load quotes failed:", e);
      list.innerHTML = `<li>Failed to load quotes</li>`;
    }
  }

  //load a single quote into the right pane
  //get text, parse JSON
  async function loadQuote(id) {
    try {
      const res = await fetch(`${API}/quotes/${id}`, {
        credentials: "include",
      });
      const text = await res.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch {
        throw new Error(text || "Bad JSON from /quotes/:id");
      }
      if (!res.ok || !data.success)
        throw new Error(data?.error || "Failed to load quote");

      const q = data.quote;
      qClient.textContent = q.client_name || "Unknown client";
      qAddress.textContent = q.address || "—";
      qStatus.textContent = (q.quote_status || "-").toUpperCase();
      qPrice.textContent = formatMoney(q.price);
      qDate.textContent = formatDate(q.date);
      qNotes.textContent = q.notes || "—";

      //sets current quote id as selected quote and loads history for that quote
      currentQuoteID = q.quoteID;

      await loadHistory(id);
    } catch (err) {
      console.error("Quote detail load failed:", err);
      qClient.textContent = "Select a quote";
      qAddress.textContent =
        qStatus.textContent =
        qPrice.textContent =
        qDate.textContent =
        qNotes.textContent =
          "—";
      currentQuoteID = null;
    }
  }

  // initial list load
  await loadList();

  // click on a quote in the list
  list.addEventListener("click", async (e) => {
    const btn = e.target.closest(".row");
    if (!btn) return;

    const id = btn.dataset.id;

    list
      .querySelectorAll(".row.selected")
      .forEach((el) => el.classList.remove("selected"));
    btn.classList.add("selected");

    await loadQuote(id);
  });

  //negotiation
  negotiateBtn.addEventListener("click", async () => {
    if (!currentQuoteID) {
      alert("Select a quote first.");
      return;
    }

    //if input is empty, null so can fall back to original value
    try {
      const payload = {
        price: negPrice.value === "" ? null : Number(negPrice.value),
        scheduledAt: negDate.value || null,
        note: negNote.value || null,
      };

      const res = await fetch(`${API}/quotes/${currentQuoteID}/negotiate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });

      const text = await res.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch {
        throw new Error(text || "Bad JSON from negotiate");
      }

      if (!res.ok || !data.success)
        throw new Error(data.error || "Failed to send negotiation");

      //resets the form/inputs
      negPrice.value = "";
      negDate.value = "";
      negNote.value = "";

      // reload current quote so the new values show in the UI
      await loadQuote(currentQuoteID);

      alert("Negotiation sent to client.");
    } catch (err) {
      console.error("Negotiate error:", err);
      alert("Could not send negotiation. Please try again.");
    }
  });

  //Loading quote history
  async function loadHistory(id) {
    const res = await fetch(`${API}/quotes/${id}/history`, {
      credentials: "include",
    });
    const data = await res.json();

    //if failure
    if (!data.success || !Array.isArray(data.history)) {
      qHistory.innerHTML = "<li>No history available.</li>";
      return;
    }

    //if no quote history
    if (data.history.length === 0) {
      qHistory.innerHTML = "<li>No previous negotiations.</li>";
      return;
    }

    //builds the quote history html
    qHistory.innerHTML = data.history
      .map(
        (h) => `
          <li>
            <strong>Quote${h.response_number}</strong> <br />
            $${formatMoney(h.price)} —
            ${formatDate(h.date)} <br/>
            ${h.quote_status} <br/>
            ${h.notes || "No notes"} <br />
          </li>
        `
      )
      .join("");
  }

  //cancel button
  cancelBtn.addEventListener("click", async () => {
    if (!currentQuoteID) {
      alert("Select a quote first.");
      return;
    }

    const ok = confirm("Are you sure you want to cancel this quote?");
    if (!ok) return;

    try {
      const res = await fetch(`${API}/quotes/${currentQuoteID}/cancel`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      });

      const text = await res.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch {
        throw new Error(text || "Bad JSON from cancel");
      }

      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to cancel quote");
      }

      // Refresh main details + history + list
      await loadQuote(currentQuoteID);
      await loadList();

      alert("Quote has been canceled.");
    } catch (err) {
      console.error("Cancel error:", err);
      alert("Could not cancel the quote. Please try again.");
    }
  });

  //accept button and create an order
  acceptBtn.addEventListener("click", async () => {
    if (!currentQuoteID) {
      alert("Select a quote first.");
      return;
    }

    const ok = confirm(
      "Accept this quote and create a service order for this client?"
    );
    if (!ok) return;

    try {
      const res = await fetch(`${API}/quotes/${currentQuoteID}/accept`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      });

      const text = await res.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch {
        throw new Error(text || "Bad JSON from accept");
      }

      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to accept quote");
      }

      //refreshes quote details and list
      await loadQuote(currentQuoteID);
      await loadList();

      alert(
        `Quote accepted. Order #${data.orderID} has been created for this client.`
      );
    } catch (err) {
      console.error("Accept error:", err);
      alert("Could not accept the quote. Please try again.");
    }
  });
});
