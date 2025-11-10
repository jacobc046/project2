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

        rows.forEach(row => {
            container.innerHTML += `
                <table>
                    <tr>
                        <th>Email</th>
                        <th>First Name</th>
                        <th>Last Name</th>
                        <th>Order Count</th>
                    </tr>
                    <tr>
                        <td>${row.email}</td>
                        <td>${row.first_name}</td>
                        <td>${row.last_name}</td>
                        <td>${row.frequency}</td>
                    </tr>
                </table>
            `;
        });
    })
    .catch(err => console.error(err));

fetch('http://localhost:5050/uncommittedClients')
    .then(response => response.json())
    .then(result => {
        const rows = result.rows;
        console.log(rows);
        

        const container = document.getElementById("uncommitted-clients");
        container.innerHTML = "";
        if (rows.length === 0) {
            container.innerHTML = "<p>No uncommitted clients found</p>";
            return;
        }

        rows.forEach(row => {
            container.innerHTML += `
                <table>
                    <tr>
                        <th>Email</th>
                        <th>First Name</th>
                        <th>Last Name</th>
                    </tr>
                    <tr>
                        <td>${row.email}</td>
                        <td>${row.first_name}</td>
                        <td>${row.last_name}</td>
                    </tr>
                </table>
            `;
        });
    })

fetch('http://localhost:5050/acceptedQuotes')
    .then(response => response.json())
    .then(result => {
        const rows = result.rows;
        console.log(rows);
        

        const container = document.getElementById("accepted-quotes");
        container.innerHTML = "";
        if (rows.length === 0) {
            container.innerHTML = "<p>No accepted quotes found for this month</p>";
            return;
        }

        rows.forEach(row => {
            container.innerHTML += `
                <table>
                    <tr>
                        <th>Email</th>
                        <th>First Name</th>
                        <th>Last Name</th>
                        <th>Quote ID</th>
                        <th>Price</th>
                        <th>Date</th>
                        <th>Notes</th>
                    </tr>
                    <tr>
                        <td>${row.email}</td>
                        <td>${row.first_name}</td>
                        <td>${row.last_name}</td>
                        <td>${row.quoteId}</td>
                        <td>${row.price}</td>
                        <td>${row.date}</td>
                        <td>${row.notes}</td>
                    </tr>
                </table>
            `;
        });
    })