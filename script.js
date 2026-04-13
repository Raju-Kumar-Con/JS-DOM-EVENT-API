const API_URL = "https://api.restful-api.dev/objects";
const tableBody = document.querySelector("#dataTable tbody");

let dataList = [];
let unsavedRow = false;
let sortDirection = {};

//  FETCH 
async function fetchData() {
    try {
        const res = await fetch(API_URL);
        dataList = await res.json();
        renderTable(dataList);
    } catch (err) {
        alert("Error fetching data");
    }
}

//  RENDER 
function renderTable(data) {
    tableBody.innerHTML = "";

    data.forEach(item => {
        const d = item.data || {};

        const row = document.createElement("tr");

        row.innerHTML = `
            <td>${item.id}</td>
            <td>${item.name || "N/A"}</td>
            <td>${d.color || "N/A"}</td>
            <td>${d.capacity || "N/A"}</td>
            <td>${d.cpu || "N/A"}</td>
            <td>${d.description || "N/A"}</td>
            <td>${d.screen || "N/A"}</td>
            <td>${d.email || "N/A"}</td>
            <td>${d.date || "N/A"}</td>
            <td><button class="editBtn">Edit</button></td>
        `;

        addRowEvents(row);
        tableBody.appendChild(row);
    });
}

//  ADD ROW 
document.getElementById("addRowBtn").addEventListener("click", () => {
    if (unsavedRow) {
        alert("Save current row first!");
        return;
    }

    unsavedRow = true;

    const row = document.createElement("tr");

    row.innerHTML = `
        <td></td>
        <td><input></td>
        <td><input></td>
        <td><input></td>
        <td><input></td>
        <td><input></td>
        <td><input></td>
        <td><input></td>
        <td><input type="date"></td>
        <td><button class="saveBtn">Save</button></td>
    `;

    tableBody.prepend(row);

    const inputs = row.querySelectorAll("input");

    inputs.forEach(input => {
        input.addEventListener("input", () => validateRow(row));
    });

    row.querySelector(".saveBtn")
        .addEventListener("click", () => handleSave(row));

    addRowEvents(row);
});

//  VALIDATION 
function validateRow(row) {
    const inputs = row.querySelectorAll("input");
    let valid = true;

    inputs.forEach((input, index) => {
        let value = input.value.trim();
        input.classList.remove("invalid");

        if (index === 0 && !/^[a-zA-Z ]+$/.test(value)) valid = false;
        if (index === 2 && value && parseInt(value) < 100) valid = false;
        if (index === 6 && value && !/^\S+@\S+\.\S+$/.test(value)) valid = false;

        if (!valid) input.classList.add("invalid");
    });

    return valid;
}

//  SAVE 
async function handleSave(row) {
    if (!validateRow(row)) {
        alert("Invalid Data");
        return;
    }

    const inputs = row.querySelectorAll("input");

    const body = {
        name: inputs[0].value.trim(),
        data: {
            color: inputs[1].value.trim(),
            capacity: inputs[2].value.trim(),
            cpu: inputs[3].value.trim(),
            description: inputs[4].value.trim(),
            screen: inputs[5].value.trim(),
            email: inputs[6].value.trim(),
            date: inputs[7].value
        }
    };

    try {
        await fetch(API_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body)
        });

        const newId = getNextId();
        row.children[0].innerText = newId;

        dataList.unshift({
            id: newId,
            name: body.name,
            data: body.data
        });

        row.querySelectorAll("input").forEach(inp => {
            inp.parentElement.innerText = inp.value || "N/A";
        });

        row.innerHTML = row.innerHTML.replace(
            /<button.*<\/button>/,
            `<button class="editBtn">Edit</button>`
        );

        addRowEvents(row);

        unsavedRow = false;

    } catch {
        alert("Failed to save data");
    }
}

//  NEXT ID 
function getNextId() {
    if (dataList.length === 0) return 1;

    const ids = dataList
        .map(i => parseInt(i.id))
        .filter(id => !isNaN(id));

    return Math.max(...ids) + 1;
}

//  EDIT 
function toggleEdit(row, btn) {
    const isSave = btn.innerText === "Save";

    if (isSave) {
        const inputs = row.querySelectorAll("input");

        const updated = {
            name: inputs[0].value,
            color: inputs[1].value,
            capacity: inputs[2].value,
            cpu: inputs[3].value,
            description: inputs[4].value,
            screen: inputs[5].value,
            email: inputs[6].value,
            date: inputs[7].value
        };

        row.innerHTML = `
            <td>${row.children[0].innerText}</td>
            <td>${updated.name || "N/A"}</td>
            <td>${updated.color || "N/A"}</td>
            <td>${updated.capacity || "N/A"}</td>
            <td>${updated.cpu || "N/A"}</td>
            <td>${updated.description || "N/A"}</td>
            <td>${updated.screen || "N/A"}</td>
            <td>${updated.email || "N/A"}</td>
            <td>${updated.date || "N/A"}</td>
            <td><button class="editBtn">Edit</button></td>
        `;

        addRowEvents(row);

    } else {
        for (let i = 1; i < row.children.length - 1; i++) {
            const td = row.children[i];
            const value = td.innerText;

            if (i === 8) {
                td.innerHTML = `<input type="date" value="${value !== "N/A" ? value : ""}">`;
            } else {
                td.innerHTML = `<input value="${value !== "N/A" ? value : ""}">`;
            }
        }

        btn.innerText = "Save";
    }
}

//  ROW EVENTS 
function addRowEvents(row) {
    row.addEventListener("mouseenter", () => {
        row.classList.add("highlight");
    });

    row.addEventListener("mouseleave", () => {
        row.classList.remove("highlight");
    });

    const editBtn = row.querySelector(".editBtn");
    if (editBtn) {
        editBtn.addEventListener("click", () => toggleEdit(row, editBtn));
    }
}

//  SEARCH 
document.getElementById("searchBtn").addEventListener("click", async () => {
    const id = document.getElementById("searchId").value.trim();

    try {
        const res = await fetch(`${API_URL}/${id}`);

        if (!res.ok) {
            alert("No data found");
            renderTable(dataList);
            return;
        }

        const data = await res.json();
        renderTable([data]);

    } catch {
        alert("No data found");
        renderTable(dataList);
    }
});

//  SORT 
document.querySelectorAll("th").forEach(th => {
    th.addEventListener("dblclick", () => {
        const key = th.innerText.toLowerCase();

        sortDirection[key] = !sortDirection[key];

        dataList.sort((a, b) => {
            let valA = a[key] || "";
            let valB = b[key] || "";

            if (typeof valA === "string") {
                return sortDirection[key]
                    ? valA.localeCompare(valB)
                    : valB.localeCompare(valA);
            }

            return sortDirection[key] ? valA - valB : valB - valA;
        });

        renderTable(dataList);
    });
});

//  INIT 
fetchData();