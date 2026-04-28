const API_URL = "https://api.restful-api.dev/objects";

const tableBody = document.querySelector("#dataTable tbody");
const addRowBtn = document.getElementById("addRowBtn");
const searchBtn = document.getElementById("searchBtn");

let dataList = [];
let unsavedRow = false;
let sortDirection = {};

//  FETCH DATA 
async function fetchData() {
    try {
        const res = await fetch(API_URL);
        dataList = await res.json();
        renderTable(dataList);
    } catch {
        alert("Error fetching data");
    }
}

//  EXTRACT DATA 
function extractData(item) {
    return {
        id: item.id || "N/A",
        name: item.name || "N/A",
        color: item.data?.color || "N/A",
        capacity: item.data?.capacity || "N/A",
        cpu: item.data?.["CPU model"] || "N/A",
        description: item.data?.description || "N/A",
        screen: item.data?.["screen size"] || "N/A",
        email: item.data?.email || "N/A",
        date: item.data?.date || "N/A"
    };
}

//  RENDER TABLE 
function renderTable(data) {
    tableBody.innerHTML = "";

    data.forEach(item => {
        const d = extractData(item);

        const row = document.createElement("tr");

        Object.values(d).forEach(val => {
            const td = document.createElement("td");
            td.textContent = val;
            row.appendChild(td);
        });

        row.appendChild(document.createElement("td"));

        // hover events
        row.addEventListener("mouseenter", () => row.style.background = "#eef");
        row.addEventListener("mouseleave", () => row.style.background = "");

        tableBody.appendChild(row);
    });
}

//  ADD ROW 
function handleAddRow() {
    if (unsavedRow) {
        alert("Only one unsaved row allowed");
        return;
    }

    unsavedRow = true;

    const row = document.createElement("tr");

    const fields = ["id", "name", "color", "capacity", "cpu", "description", "screen", "email", "date"];

    fields.forEach((field, index) => {
        const td = document.createElement("td");

        if (index === 0) {
            td.textContent = "";
        } else {
            const input = document.createElement("input");
            if (field === "date") {
                input.type = "date";
            }

            input.addEventListener("input", () => validateInput(input, field));

            td.appendChild(input);
        }

        row.appendChild(td);
    });

    // Save button
    const saveTd = document.createElement("td");
    const saveBtn = document.createElement("button");
    saveBtn.textContent = "Save";

    saveBtn.addEventListener("click", () => handleSave(row));

    saveTd.appendChild(saveBtn);
    row.appendChild(saveTd);

    tableBody.prepend(row);
}

//  VALIDATION 
function validateInput(input, field) {
    let val = input.value.trim();
    input.value = val;

    let valid = true;

    if (field === "name") valid = /^[A-Za-z ]+$/.test(val);
    if (field === "email") valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val);
    if (field === "capacity") valid = val === "" || parseInt(val) >= 100;
    if (field === "screen") valid = val === "" || (val >= 10 && val <= 100);
    if (field === "date") valid = val === "" || /^\d{4}-\d{2}-\d{2}$/.test(val);

    input.classList.toggle("invalid", !valid);
    return valid;
}

//  SAVE 
async function handleSave(row) {
    const inputs = row.querySelectorAll("input");

    let valid = true;
    let values = {};

    const keys = ["name", "color", "capacity", "cpu", "description", "screen", "email", "date"];

    inputs.forEach((input, i) => {
        if (!validateInput(input, keys[i])) valid = false;
        values[keys[i]] = input.value.trim();
    });

    if (!valid) {
        alert("Fix validation errors");
        return;
    }

    try {
        const res = await fetch(API_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                name: values.name,
                data: values
            })
        });

        const data = await res.json();

        row.cells[0].textContent = data.id;

        inputs.forEach(input => {
            input.replaceWith(document.createTextNode(input.value || "N/A"));
        });

        row.cells[9].innerHTML = "";
        unsavedRow = false;

    } catch {
        alert("Failed to save data");
    }
}

//  SEARCH 
async function handleSearch() {
    const id = document.getElementById("searchId").value.trim();

    if (!id) return;

    try {
        const res = await fetch(`${API_URL}/${id}`);

        if (!res.ok) throw new Error();

        const data = await res.json();
        document.getElementById("searchResult").innerText =
            JSON.stringify(data, null, 2);

    } catch {
        document.getElementById("searchResult").innerText = "No data found";
    }
}

//  SORT 
function handleSort(key) {
    sortDirection[key] = !sortDirection[key];

    dataList.sort((a, b) => {
        const valA = extractData(a)[key] || "";
        const valB = extractData(b)[key] || "";

        if (!isNaN(valA) && !isNaN(valB)) {
            return sortDirection[key] ? valA - valB : valB - valA;
        }

        return sortDirection[key]
            ? valA.localeCompare(valB)
            : valB.localeCompare(valA);
    });

    renderTable(dataList);
}

//  EVENTS 
addRowBtn.addEventListener("click", handleAddRow);
searchBtn.addEventListener("click", handleSearch);

document.querySelectorAll("th[data-key]").forEach(th => {
    th.addEventListener("dblclick", () => {
        handleSort(th.dataset.key);
    });
});

// INIT
fetchData();