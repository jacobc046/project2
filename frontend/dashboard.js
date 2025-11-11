fetch('http://localhost:5050/frequentClients')
    .then(res => res.json())
    .then(result => {
        const rows = result.rows;
        
        const container = document.getElementById("frequent-clients");
        container.innerHTML = ""; // clear before rendering

        if (rows.length === 0) {
            container.innerHTML = "<p>No frequent clients found</p>";
            return;
        }

        container.innerHTML += `
        <table id="frequent-clients-table">
            <tr>
                <th>Email</th>
                <th>First Name</th>
                <th>Last Name</th>
                <th>Order Count</th>
            </tr>
        </table>
        `;

        const table = document.getElementById("frequent-clients-table");

        rows.forEach(row => {
            table.innerHTML += `
            <tr>
                <td>${row.email}</td>
                <td>${row.first_name}</td>
                <td>${row.last_name}</td>
                <td>${row.frequency}</td>
            </tr>
            `;
        });
    })
    .catch(err => console.error(err));

fetch('http://localhost:5050/uncommittedClients')
    .then(response => response.json())
    .then(result => {
        const rows = result.rows;

        const container = document.getElementById("uncommitted-clients");
        container.innerHTML = "";
        if (rows.length === 0) {
            container.innerHTML = "<p>No uncommitted clients found</p>";
            return;
        }

        container.innerHTML += `
        <table id="uncommitted-clients-table">
            <tr>
                <th>Email</th>
                <th>First Name</th>
                <th>Last Name</th>
            </tr>
        </table>
        `;

        const table = document.getElementById("uncommitted-clients-table");

        rows.forEach(row => {
            table.innerHTML += `
            <tr>
                <td>${row.email}</td>
                <td>${row.first_name}</td>
                <td>${row.last_name}</td>
            </tr>
            `;
        });
    })

fetch('http://localhost:5050/acceptedQuotes')
    .then(response => response.json())
    .then(result => {
        const rows = result.rows;

        const container = document.getElementById("accepted-quotes");
        container.innerHTML = "";
        if (rows.length === 0) {
            container.innerHTML = "<p>No accepted quotes found for this month</p>";
            return;
        }

        container.innerHTML += `
        <table id="accepted-quotes-table">
            <tr>
                <th>Email</th>
                <th>First Name</th>
                <th>Last Name</th>
                <th>Quote ID</th>
                <th>Price</th>
                <th>Date</th>
                <th>Notes</th>
            </tr>
        </table>
        `;

        const table = document.getElementById("accepted-quotes-table");

        rows.forEach(row => {
            table.innerHTML += `
            <tr>
                <td>${row.email}</td>
                <td>${row.first_name}</td>
                <td>${row.last_name}</td>
                <td>${row.quoteId}</td>
                <td>${row.price}</td>
                <td>${row.date}</td>
                <td>${row.notes}</td>
            </tr>
            `;
        });
    });

fetch('http://localhost:5050/prospectiveClients')
    .then(response => response.json())
    .then(result => {
        const rows = result.rows;

        const container = document.getElementById("prospective-clients");
        container.innerHTML = "";
        if (rows.length === 0) {
            container.innerHTML = "<p>No prospective clients found</p>";
            return;
        }

        container.innerHTML += `
        <table id="prospective-clients-table">
            <tr>
                <th>Email</th>
                <th>First Name</th>
                <th>Last Name</th>
            </tr>
        </table>
        `;

        const table = document.getElementById("prospective-clients-table");
        
        rows.forEach(row => {
            table.innerHTML += `
            <tr>
                <td>${row.email}</td>
                <td>${row.first_name}</td>
                <td>${row.last_name}</td>
            </tr>
            `;
        });
    });
        
fetch('http://localhost:5050/largestClients')
    .then(response => response.json())
    .then(result => {
        const rows = result.rows;

        const container = document.getElementById("largest-job");
        container.innerHTML = "";
        if (rows.length === 0) {
            container.innerHTML = "<p>No clients found</p>";
            return;
        }

        container.innerHTML += `
        <table id="largest-job-table">
            <tr>
                <th>Email</th>
                <th>First Name</th>
                <th>Last Name</th>
                <th>Address</th>
                <th>Number of Rooms</th>
                <th>Budget</th>
                <th>Cleaning Type</th>
            </tr>
        </table>
        `;

        const table = document.getElementById("largest-job-table");
        
        rows.forEach(row => {
            table.innerHTML += `
            <tr>
            <td>${row.email}</td>
            <td>${row.first_name}</td>
            <td>${row.last_name}</td>
            <td>${row.address}</td>
            <td>${row.number_of_rooms}</td>
            <td>${row.budget}</td>
            <td>${row.cleaning_type}</td>
            </tr>
            `;
        });
    });

fetch('http://localhost:5050/overdueBills')
    .then(response => response.json())
    .then(result => {
        const rows = result.rows;

        const container = document.getElementById("overdue-bills");
        container.innerHTML = "";
        if (rows.length === 0) {
            container.innerHTML = "<p>No overdue bills found</p>";
            return;
        }

        container.innerHTML += `
        <table id="overdue-bills-table">
            <tr>
                <th>Email</th>
                <th>First Name</th>
                <th>Last Name</th>
                <th>Address</th>
                <th>Number of Rooms</th>
                <th>Price</th>
                <th>Date Issued</th>
            </tr>
        </table>
        `;

        const table = document.getElementById("overdue-bills-table");
        
        rows.forEach(row => {
            table.innerHTML += `
            <tr>
                <td>${row.email}</td>
                <td>${row.first_name}</td>
                <td>${row.last_name}</td>
                <td>${row.address}</td>
                <td>${row.number_of_rooms}</td>
                <td>${row.price}</td>
                <td>${row.date_issued}</td>
            </tr>
            `;
        });
    });

fetch('http://localhost:5050/badClients')
    .then(response => response.json())
    .then(result => {
        const rows = result.rows;

        const container = document.getElementById("bad-clients");
        container.innerHTML = "";
        if (rows.length === 0) {
            container.innerHTML = "<p>No bad clients found</p>";
            return;
        }

        container.innerHTML += `
        <table id="bad-clients-table">
            <tr>
                <th>Email</th>
                <th>First Name</th>
                <th>Last Name</th>
            </tr>
        </table>
        `;

        const table = document.getElementById("bad-clients-table");
        
        rows.forEach(row => {
            table.innerHTML += `
            <tr>
                <td>${row.email}</td>
                <td>${row.first_name}</td>
                <td>${row.last_name}</td>
            </tr>
            `;
        });
    });

fetch('http://localhost:5050/goodClients')
    .then(response => response.json())
    .then(result => {
        const rows = result.rows;

        const container = document.getElementById("good-clients");
        container.innerHTML = "";
        if (rows.length === 0) {
            container.innerHTML = "<p>No good clients found</p>";
            return;
        }

        container.innerHTML += `
        <table id="good-clients-table">
            <tr>
                <th>Email</th>
                <th>First Name</th>
                <th>Last Name</th>
            </tr>
        </table>
        `;

        const table = document.getElementById("good-clients-table");
        
        rows.forEach(row => {
            table.innerHTML += `
            <tr>
                <td>${row.email}</td>
                <td>${row.first_name}</td>
                <td>${row.last_name}</td>
            </tr>
            `;
        });
    });