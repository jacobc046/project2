document.addEventListener("DOMContentLoaded", async () => {
  const API = "http://localhost:5050";
  const list = document.getElementById("requestItems");
  const rejectBtn = document.getElementById("rejectBtn");
  const rejectNote = document.getElementById("reject-note");
  const sendQuoteBtn = document.getElementById("sendQuoteBtn");
  const quotePrice = document.getElementById("q-price");
  const quoteDateTime = document.getElementById("q-datetime");
  const quoteNote = document.getElementById("q-note");

  let currentRequestId = null;

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
    currentRequestId = id;

    try {
      //fetches the detials for that request based on the id, returns the file in json format
      const res = await fetch(`${API}/requests/${id}`);
      const r = await res.json();

      document.getElementById("d-name").textContent = r.client_name;
      document.getElementById("d-address").textContent = r.address || "—";
      document.getElementById("d-status").textContent =
        r.status.toUpperCase() || "-";
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

      const status = (r.status || "").toLowerCase();
      document.getElementById("d-status").textContent = status
        ? status.toUpperCase()
        : "-";

      // 1) default: enable both buttons
      rejectBtn.disabled = false;
      rejectBtn.style.opacity = "1";
      rejectBtn.textContent = "Reject Request";

      sendQuoteBtn.disabled = false;
      sendQuoteBtn.style.opacity = "1";
      sendQuoteBtn.textContent = "Send Quote";

      // 2) override based on status
      if (status === "rejected") {
        rejectBtn.disabled = true;
        rejectBtn.style.opacity = "0.6";
        rejectBtn.textContent = "Already Rejected";

        sendQuoteBtn.disabled = true;
        sendQuoteBtn.style.opacity = "0.6";
        sendQuoteBtn.textContent = "Cannot send quote";
      } else if (status === "quoted") {
        sendQuoteBtn.disabled = true;
        sendQuoteBtn.style.opacity = "0.6";
        sendQuoteBtn.textContent = "Quote Already Sent";

        rejectBtn.disabled = true;
        rejectBtn.style.opacity = "0.6";
        rejectBtn.textContent = "Already Quoted";
      }
    } catch (err) {
      console.error("Failed to load details/images:", err);
      document.getElementById("d-name").textContent = "Error loading details";
      document.getElementById("d-images").innerHTML = "";
    }
  });

  //reject request
  rejectBtn.addEventListener("click", async () => {
    if (!currentRequestId) {
      alert("Please select a request first.");
      return;
    }
    const note = (rejectNote.value || "").trim();

    try {
      const res = await fetch(`${API}/requests/${currentRequestId}/reject`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ note }),
        credentials: "include",
      });
      const text = await res.text();
      let data = {};
      try {
        data = JSON.parse(text);
      } catch (e) {
        data = { error: text };
      }
      if (!res.ok || !data.success) {
        console.error("Reject error payload:", data);
        alert(`Could not reject the request. ${data.error || ""}`.trim());
        return;
      }

      document.getElementById("d-status").textContent = "Rejected";
      rejectBtn.disabled = true;
      rejectNote.value = "";
      alert("The request has been successfully rejected");
    } catch (err) {
      console.error(err);
      alert("Could not reject the request. Please try again.");
    }
  });

  //send a quote
  sendQuoteBtn.addEventListener("click", async () => {
    if (!currentRequestId) {
      alert("Please select a request first.");
      return;
    }

    const payload = {
      price: quotePrice.value.trim() === "" ? null : Number(quotePrice.value),
      scheduledAt: quoteDateTime.value || null,
      note: quoteNote.value || null,
    };

    try {
      const res = await fetch(`${API}/requests/${currentRequestId}/quote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });

      const text = await res.text();
      let data = {};
      try {
        data = JSON.parse(text);
      } catch {
        data = { error: text };
      }

      if (!res.ok || !data.success) {
        console.error("Send quote error payload:", data);
        alert(`Could not send the quote. ${data.error || ""}`.trim());
        return;
      }

      // UI success updates
      document.getElementById("d-status").textContent = "quoted";
      quotePrice.value = "";
      quoteDateTime.value = "";
      quoteNote.value = "";
      alert("Quote sent to client.");
    } catch (err) {
      console.error(err);
      alert("Could not send the quote. Please try again.");
    }
  });
});
