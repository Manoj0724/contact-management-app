// server.js  (inside backend folder)
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const Contact = require("./Contact"); // your Mongoose model

const app = express();

// ---------- MIDDLEWARE ----------
app.use(cors());            // allow frontend (http://localhost:....)
app.use(express.json());    // parse JSON body

// ---------- MONGODB CONNECTION ----------
mongoose
  .connect("mongodb://127.0.0.1:27017/contacts_db")
  .then(() => console.log("✅ MongoDB Connected"))
  .catch((err) => console.error("Mongo error:", err));

// ---------- GET ALL CONTACTS ----------
app.get("/api/contacts", async (req, res) => {
  try {
    const contacts = await Contact.find();
    res.json(contacts); // pure JSON array
  } catch (err) {
    console.error("GET /api/contacts error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// ---------- SEARCH CONTACTS (BACKEND SEARCH) ----------
app.get("/api/contacts/search", async (req, res) => {
  try {
    const q = (req.query.q || "").trim();

    // If empty q, just return all contacts
    if (!q) {
      const all = await Contact.find();
      return res.json(all);
    }

    // Case-insensitive regex
    const regex = new RegExp(q, "i");

    const results = await Contact.find({
      $or: [
        { title: regex },
        { firstName: regex },
        { lastName: regex },
        { mobile1: regex },
        { mobile2: regex },
        { "address.city": regex },
        { "address.state": regex },
        { "address.pincode": regex },
      ],
    });

    res.json(results);
  } catch (err) {
    console.error("GET /api/contacts/search error:", err);
    res.status(500).json({ error: "Search failed" });
  }
});

// ---------- GET ONE CONTACT BY ID ----------
app.get("/api/contacts/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const contact = await Contact.findById(id);

    if (!contact) {
      return res.status(404).json({ success: false, error: "Not found" });
    }

    res.json({ success: true, contact });
  } catch (err) {
    console.error("GET /api/contacts/:id error:", err);
    res.status(500).json({ success: false, error: "Fetch failed" });
  }
});


// ---------- CREATE NEW CONTACT ----------
app.post("/api/contacts", async (req, res) => {
  try {
    const contact = new Contact(req.body);
    await contact.save();
    res.json({ success: true, contact });
  } catch (err) {
    console.error("POST /api/contacts error:", err);
    res.status(500).json({ success: false, error: "Save failed" });
  }
});

// ---------- UPDATE CONTACT ----------
app.put("/api/contacts/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const updated = await Contact.findByIdAndUpdate(id, req.body, {
      new: true,
    });

    if (!updated) {
      return res.status(404).json({ success: false, error: "Not found" });
    }

    res.json({ success: true, contact: updated });
  } catch (err) {
    console.error("PUT /api/contacts/:id error:", err);
    res.status(500).json({ success: false, error: "Update failed" });
  }
});

// ---------- DELETE CONTACT ----------
app.delete("/api/contacts/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const deleted = await Contact.findByIdAndDelete(id);

    if (!deleted) {
      return res.status(404).json({ success: false, error: "Not found" });
    }

    res.json({ success: true });
  } catch (err) {
    console.error("DELETE /api/contacts/:id error:", err);
    res.status(500).json({ success: false, error: "Delete failed" });
  }
});

// ---------- START SERVER ----------
app.listen(5000, () => {
  console.log("🚀 Server running on http://localhost:5000");
});
