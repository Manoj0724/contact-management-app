const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const Contact = require("./Contact");

const app = express();

app.use(cors());
app.use(express.json());

// ---------- MONGODB ----------
mongoose
  .connect("mongodb://127.0.0.1:27017/contacts_db")
  .then(() => console.log("✅ MongoDB Connected"))
  .catch(err => console.error("Mongo error:", err));


// ---------- PAGINATION (MUST BE FIRST) ----------
app.get("/api/contacts/paginate", async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const total = await Contact.countDocuments();
    const contacts = await Contact.find().skip(skip).limit(limit);

    res.json({
      success: true,
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      contacts
    });
  } catch (err) {
    console.error("Pagination error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});


// ---------- SEARCH ----------
app.get("/api/contacts/search", async (req, res) => {
  const q = req.query.q || "";
  const regex = new RegExp(q, "i");

  const results = await Contact.find({
    $or: [
      { firstName: regex },
      { lastName: regex },
      { mobile1: regex },
      { "address.city": regex }
    ]
  });

  res.json(results);
});


// ---------- GET ALL ----------
app.get("/api/contacts", async (req, res) => {
  const contacts = await Contact.find();
  res.json(contacts);
});


// ---------- GET ONE (ALWAYS LAST) ----------
app.get("/api/contacts/:id", async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(400).json({
      success: false,
      error: "Invalid contact id"
    });
  }

  const contact = await Contact.findById(req.params.id);
  if (!contact) {
    return res.status(404).json({ success: false });
  }

  res.json(contact);
});


// ---------- CREATE ----------
app.post("/api/contacts", async (req, res) => {
  const contact = new Contact(req.body);
  await contact.save();
  res.json({ success: true, contact });
});


// ---------- UPDATE ----------
app.put("/api/contacts/:id", async (req, res) => {
  const updated = await Contact.findByIdAndUpdate(req.params.id, req.body, { new: true });
  res.json({ success: true, contact: updated });
});


// ---------- DELETE ----------
app.delete("/api/contacts/:id", async (req, res) => {
  await Contact.findByIdAndDelete(req.params.id);
  res.json({ success: true });
});


// ---------- START ----------
app.listen(5000, () => {
  console.log("🚀 Server running on http://localhost:5000");
});
