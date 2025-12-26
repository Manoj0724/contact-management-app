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

/* ======================================================
   PAGINATION + SEARCH (THIS IS THE MAIN API YOU USE)
   ====================================================== */
app.get("/api/contacts/paginate", async (req, res) => {
  try {
    const page  = Number(req.query.page)  || 1;
    const limit = Number(req.query.limit) || 3;
    const q     = (req.query.q || "").trim();

    const skip = (page - 1) * limit;

    let filter = {};

    if (q) {
      const regex = new RegExp(q, "i");
      filter = {
        $or: [
          { firstName: regex },
          { lastName: regex },
          { mobile1: regex },
          { mobile2: regex },
          { "address.city": regex },
          { "address.state": regex },
          { "address.pincode": regex }
        ]
      };
    }

    const total = await Contact.countDocuments(filter);
    const contacts = await Contact.find(filter)
      .skip(skip)
      .limit(limit);

    res.json({
      success: true,
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      contacts
    });

  } catch (err) {
    console.error("❌ PAGINATION ERROR:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

/* ======================================================
   GET ONE CONTACT (KEEP BELOW PAGINATE)
   ====================================================== */
app.get("/api/contacts/:id", async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ success: false, error: "Invalid ID" });
    }

    const contact = await Contact.findById(req.params.id);
    if (!contact) {
      return res.status(404).json({ success: false, error: "Not found" });
    }

    res.json(contact);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/* ======================================================
   CREATE
   ====================================================== */
app.post("/api/contacts", async (req, res) => {
  const contact = new Contact(req.body);
  await contact.save();
  res.json({ success: true, contact });
});

/* ======================================================
   UPDATE
   ====================================================== */
app.put("/api/contacts/:id", async (req, res) => {
  const updated = await Contact.findByIdAndUpdate(
    req.params.id,
    req.body,
    { new: true }
  );
  res.json({ success: true, contact: updated });
});

/* ======================================================
   DELETE
   ====================================================== */
app.delete("/api/contacts/:id", async (req, res) => {
  await Contact.findByIdAndDelete(req.params.id);
  res.json({ success: true });
});

/* ======================================================
   START SERVER
   ====================================================== */
app.listen(5000, () => {
  console.log("🚀 Server running on http://localhost:5000");
});
