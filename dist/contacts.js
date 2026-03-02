"use strict";
console.log("contacts.ts loaded");
// ---------- MODAL & FORM ELEMENTS ----------
const addContactModal = document.getElementById("addContactModal");
const saveContactBtn = document.getElementById("saveContactBtn");
const newTitle = document.getElementById("newTitle");
const newFirst = document.getElementById("newFirst");
const newLast = document.getElementById("newLast");
const newMob1 = document.getElementById("newMob1");
const newMob2 = document.getElementById("newMob2");
const newCity = document.getElementById("newCity");
const newState = document.getElementById("newState");
const newPin = document.getElementById("newPin");
// ---------- EDIT STATE ----------
let isEditing = false;
let editingId = null;
// ---------- TABLE & UI ELEMENTS ----------
const contactBody = document.getElementById("contactBody");
const pagination = document.getElementById("pagination");
const pageSizeSelect = document.getElementById("pageSizeSelect");
const searchInput = document.getElementById("basicSearch");
const searchBtn = document.getElementById("basicSearchBtn");
// ---------- API ----------
const API = "http://localhost:5000/api/contacts/paginate";
// ---------- SAVED PAGE SIZE ----------
const savedPageSize = Number(localStorage.getItem("pageSize")) || 3;
// ---------- STATE ----------
const state = {
    page: 1,
    limit: savedPageSize,
    query: "",
};
if (pageSizeSelect) {
    pageSizeSelect.value = String(state.limit);
}
// ---------- LOAD CONTACTS ----------
function loadContacts() {
    let url = `${API}?page=${state.page}&limit=${state.limit}`;
    if (state.query) {
        url += `&q=${encodeURIComponent(state.query)}`;
    }
    console.log("API CALL →", url);
    fetch(url)
        .then((res) => {
        if (!res.ok) {
            throw new Error(res.status.toString());
        }
        return res.json();
    })
        .then((data) => {
        if (!data.success) {
            alert("Backend returned error");
            return;
        }
        renderTable(data.contacts);
        renderPagination(data.totalPages);
        const accountCount = document.getElementById("accountCount");
        if (accountCount) {
            accountCount.innerText = `Showing page ${data.page} of ${data.totalPages} (Total: ${data.total})`;
        }
    })
        .catch((err) => {
        console.error("Fetch error:", err);
        alert("Backend fetch failed");
    });
}
loadContacts();
/* ================================
   RENDER TABLE (TypeScript)
================================ */
function renderTable(list) {
    if (!contactBody)
        return;
    contactBody.innerHTML = "";
    if (!list.length) {
        contactBody.innerHTML = `
      <tr>
        <td colspan="9" class="text-center text-danger">
          No records found
        </td>
      </tr>`;
        return;
    }
    list.forEach((c) => {
        contactBody.innerHTML += `
      <tr>
        <td>${c.title}</td>
        <td>${c.firstName}</td>
        <td>${c.lastName}</td>
        <td>${c.mobile1}</td>
        <td>${c.mobile2 ?? ""}</td>
        <td>${c.address?.city ?? ""}</td>
        <td>${c.address?.state ?? ""}</td>
        <td>${c.address?.pincode ?? ""}</td>
        <td>
          <button 
            class="btn btn-sm btn-warning me-1" 
            onclick="editContact('${c._id}')">
            Edit
          </button>
          <button 
            class="btn btn-sm btn-danger" 
            onclick="deleteContact('${c._id}')">
            Delete
          </button>
        </td>
      </tr>
    `;
    });
}
/* ================================
  PAGINATION (TypeScript)
================================ */
function renderPagination(totalPages) {
    if (!pagination)
        return;
    pagination.innerHTML = "";
    // Prev button
    pagination.innerHTML += `
    <li class="page-item ${state.page === 1 ? "disabled" : ""}">
      <a class="page-link" href="#" onclick="gotoPage(${state.page - 1})">
        Prev
      </a>
    </li>
  `;
    // Page numbers
    for (let i = 1; i <= totalPages; i++) {
        pagination.innerHTML += `
      <li class="page-item ${state.page === i ? "active" : ""}">
        <a class="page-link" href="#" onclick="gotoPage(${i})">
          ${i}
        </a>
      </li>
    `;
    }
    // Next button
    pagination.innerHTML += `
    <li class="page-item ${state.page === totalPages ? "disabled" : ""}">
      <a class="page-link" href="#" onclick="gotoPage(${state.page + 1})">
        Next
      </a>
    </li>
  `;
}
function gotoPage(page) {
    state.page = page;
    loadContacts();
}
/* ================================
   SEARCH (TypeScript)
================================ */
let isSearchApplied = false;
if (searchBtn && searchInput) {
    searchBtn.onclick = () => {
        // 🔁 CLEAR MODE
        if (isSearchApplied) {
            searchInput.value = "";
            state.query = "";
            state.page = 1;
            loadContacts();
            // reset button to SEARCH
            searchBtn.classList.remove("btn-danger");
            searchBtn.classList.add("btn-primary");
            searchBtn.innerHTML = `<i class="bi bi-search"></i>`;
            isSearchApplied = false;
            return;
        }
        // 🔍 SEARCH MODE
        const value = searchInput.value.trim();
        if (!value)
            return;
        state.query = value;
        state.page = 1;
        loadContacts();
        // change button to CLEAR
        searchBtn.classList.remove("btn-primary");
        searchBtn.classList.add("btn-danger");
        searchBtn.innerHTML = `<i class="bi bi-x-lg"></i>`;
        isSearchApplied = true;
    };
    searchInput.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
            searchBtn.click();
        }
    });
}
/* ================================
   PAGE SIZE (TypeScript)
================================ */
if (pageSizeSelect) {
    pageSizeSelect.onchange = () => {
        const selectedSize = Number(pageSizeSelect.value);
        // save to localStorage
        localStorage.setItem("pageSize", String(selectedSize));
        state.limit = selectedSize;
        state.page = 1;
        loadContacts();
    };
}
/* ================================
   ADVANCED SEARCH (TypeScript)
================================ */
const applyFilterBtn = document.getElementById("applyFilter");
const resetFilterBtn = document.getElementById("resetFilter");
if (applyFilterBtn && resetFilterBtn) {
    applyFilterBtn.onclick = () => {
        const firstName = document.getElementById("firstName")?.value.trim() || "";
        const lastName = document.getElementById("lastName")?.value.trim() || "";
        const mobile = document.getElementById("mobile")?.value.trim() || "";
        const city = document.getElementById("city")?.value || "";
        const stateVal = document.getElementById("state")?.value || "";
        const pincode = document.getElementById("pincode")?.value.trim() || "";
        // priority-based search (ONE value only)
        if (firstName)
            state.query = firstName;
        else if (lastName)
            state.query = lastName;
        else if (mobile)
            state.query = mobile;
        else if (city && city !== "All")
            state.query = city;
        else if (stateVal && stateVal !== "All")
            state.query = stateVal;
        else if (pincode)
            state.query = pincode;
        else {
            alert("Please enter at least one search field");
            return;
        }
        state.page = 1;
        loadContacts();
    };
    resetFilterBtn.onclick = () => {
        document.getElementById("title").value = "";
        document.getElementById("firstName").value = "";
        document.getElementById("lastName").value = "";
        document.getElementById("mobile").value = "";
        document.getElementById("city").value = "";
        document.getElementById("state").value = "";
        document.getElementById("pincode").value = "";
        state.query = "";
        state.page = 1;
        loadContacts();
    };
}
/* ================================
   CSV EXPORT (TypeScript)
================================ */
const csvBtn = document.getElementById("csvButton");
if (csvBtn) {
    csvBtn.onclick = () => {
        const rows = document.querySelectorAll("#contactTable tbody tr");
        if (!rows.length || rows[0].innerText.includes("No records")) {
            alert("No data to export");
            return;
        }
        const csv = [];
        csv.push([
            "Title",
            "First Name",
            "Last Name",
            "Mobile 1",
            "Mobile 2",
            "City",
            "State",
            "Pincode",
        ].join(","));
        rows.forEach((row) => {
            const cols = row.querySelectorAll("td");
            const rowData = [
                cols[0]?.innerText ?? "",
                cols[1]?.innerText ?? "",
                cols[2]?.innerText ?? "",
                cols[3]?.innerText ?? "",
                cols[4]?.innerText ?? "",
                cols[5]?.innerText ?? "",
                cols[6]?.innerText ?? "",
                cols[7]?.innerText ?? "",
            ];
            csv.push(rowData.join(","));
        });
        downloadCSV(csv.join("\n"));
    };
}
function downloadCSV(csvContent) {
    const blob = new Blob([csvContent], {
        type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "contacts.csv";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}
/* ================================
   DELETE (TypeScript)
================================ */
function deleteContact(id) {
    if (!confirm("Delete this contact?"))
        return;
    fetch(`http://localhost:5000/api/contacts/${id}`, {
        method: "DELETE",
    })
        .then((res) => res.json())
        .then(() => {
        showToast("✔ Contact deleted Successfully!");
        loadContacts(); // reload page from backend
    })
        .catch((err) => {
        console.error("Delete failed:", err);
        alert("Failed to delete contact");
    });
}
/* ================================
   EDIT (TypeScript)
================================ */
function editContact(id) {
    fetch(`http://localhost:5000/api/contacts/${id}`)
        .then((res) => res.json())
        .then((contact) => {
        isEditing = true;
        editingId = id;
        if (!newTitle ||
            !newFirst ||
            !newLast ||
            !newMob1 ||
            !newMob2 ||
            !newCity ||
            !newState ||
            !newPin ||
            !saveContactBtn ||
            !addContactModal) {
            return;
        }
        newTitle.value = contact.title;
        newFirst.value = contact.firstName;
        newLast.value = contact.lastName;
        newMob1.value = contact.mobile1;
        newMob2.value = contact.mobile2 ?? "";
        newCity.value = contact.address?.city ?? "";
        newState.value = contact.address?.state ?? "";
        newPin.value = contact.address?.pincode ?? "";
        saveContactBtn.innerText = "Update Contact";
        const modalTitle = document.querySelector(".modal-title");
        if (modalTitle) {
            modalTitle.innerText = "Edit Contact";
        }
        const modal = new bootstrap.Modal(addContactModal);
        modal.show();
    })
        .catch((err) => {
        console.error("Edit fetch failed:", err);
        alert("Failed to load contact");
    });
}
/* ================================
   TOAST
================================ */
function showToast(message) {
    const toastMsg = document.getElementById("toastMessage");
    const toastEl = document.getElementById("successToast");
    if (!toastMsg || !toastEl)
        return;
    toastMsg.innerText = message;
    const toast = new bootstrap.Toast(toastEl);
    toast.show();
}
/* ================================
   RESET MODAL
================================ */
function resetModal() {
    if (!newTitle ||
        !newFirst ||
        !newLast ||
        !newMob1 ||
        !newMob2 ||
        !newCity ||
        !newState ||
        !newPin ||
        !saveContactBtn ||
        !addContactModal) {
        return;
    }
    // exit edit mode
    isEditing = false;
    editingId = null;
    // reset modal title & button
    saveContactBtn.innerText = "Save Contact";
    const modalTitle = document.querySelector(".modal-title");
    if (modalTitle) {
        modalTitle.innerText = "Add New Contact";
    }
    // clear inputs
    newTitle.value = "Mr";
    newFirst.value = "";
    newLast.value = "";
    newMob1.value = "";
    newMob2.value = "";
    newCity.value = "";
    newState.value = "";
    newPin.value = "";
    // close modal
    const modal = bootstrap.Modal.getOrCreateInstance(addContactModal);
    modal.hide();
}
/* ================================
   SAVE / UPDATE
================================ */
if (saveContactBtn) {
    saveContactBtn.onclick = () => {
        if (!newTitle ||
            !newFirst ||
            !newLast ||
            !newMob1 ||
            !newCity ||
            !newState ||
            !newPin) {
            return;
        }
        if (!newFirst.value ||
            !newLast.value ||
            !newMob1.value ||
            !newCity.value ||
            !newState.value ||
            !newPin.value) {
            alert("Please fill all mandatory fields");
            return;
        }
        const payload = {
            title: newTitle.value,
            firstName: newFirst.value,
            lastName: newLast.value,
            mobile1: newMob1.value,
            mobile2: newMob2?.value || "",
            address: {
                city: newCity.value,
                state: newState.value,
                pincode: newPin.value,
            },
        };
        const url = isEditing && editingId
            ? `http://localhost:5000/api/contacts/${editingId}`
            : `http://localhost:5000/api/contacts`;
        const method = isEditing ? "PUT" : "POST";
        fetch(url, {
            method,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
        })
            .then((res) => res.json())
            .then(() => {
            showToast(isEditing
                ? "✔ Contact Updated Successfully!"
                : "✔ Contact Added Successfully!");
            resetModal();
            loadContacts();
        })
            .catch((err) => {
            console.error("Save failed:", err);
            alert("Save failed");
        });
    };
}
/* ================================
   INITIAL LOAD
================================ */
loadContacts();
