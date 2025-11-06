// adminHome.js
document.addEventListener("DOMContentLoaded", function () {
  const API = "http://localhost:5050";

  // 1. load list
  fetch(`${API}/requests?status=new`)
    .then((res) => res.json())
    .then((rows) => {
      document.getElementById("requestItems").innerHTML = rows
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
    })
    .catch((err) => {
      console.error("Failed to load requests:", err);
      document.getElementById(
        "requestItems"
      ).innerHTML = `<li>Failed to load requests</li>`;
    });

  document
    .getElementById("requestItems")
    .addEventListener("click", function (e) {
      const btn = e.target.closest(".row");
      if (!btn) return;

      const id = btn.dataset.id;

      fetch(`${API}/requests/${id}`)
        .then((res) => res.json())
        .then((r) => {
          document.getElementById("d-name").textContent = r.client_name;
          document.getElementById("d-address").textContent = r.address || "—";
          document.getElementById("d-rooms").textContent =
            r.number_of_rooms ?? "—";
          document.getElementById("d-date").textContent = r.date || "—";
          document.getElementById("d-budget").textContent = r.budget || "0.00";
          document.getElementById("d-cleaning").textContent =
            r.cleaning_type || "—";
          document.getElementById("d-notes").textContent = r.notes || "—";
        })
        .catch((err) => {
          console.error("Failed to load details:", err);
          document.getElementById("d-name").textContent =
            "Error loading details";
        });
    });
});
