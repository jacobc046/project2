document.addEventListener("DOMContentLoaded", function () {
  // one can point your browser to http://localhost:5050/getAll to check what it returns first.
  fetch("http://localhost:5050/getAll")
    .then((response) => response.json())
    .then((data) => loadHTMLTable(data["data"]));
});