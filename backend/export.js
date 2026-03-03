const mongoose = require('mongoose')
const fs = require('fs')

async function exportData() {
  await mongoose.connect('mongodb://localhost:27017/contactsdb')
  console.log('Connected to local MongoDB')

  const contacts = await mongoose.connection.db.collection('contacts').find({}).toArray()
  const groups   = await mongoose.connection.db.collection('groups').find({}).toArray()

  fs.writeFileSync('contacts_backup.json', JSON.stringify(contacts, null, 2))
  fs.writeFileSync('groups_backup.json',   JSON.stringify(groups, null, 2))

  console.log(`✅ Exported ${contacts.length} contacts and ${groups.length} groups`)
  process.exit(0)
}

exportData().catch(console.error)