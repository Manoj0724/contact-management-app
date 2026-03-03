const mongoose = require('mongoose')
const fs = require('fs')

const ATLAS = 'mongodb+srv://manoj0724:Manoj9004@cluster0.f9hxo9y.mongodb.net/contactsdb'

async function importData() {
  await mongoose.connect(ATLAS)
  console.log('Connected to Atlas')

  const contacts = JSON.parse(fs.readFileSync('contacts_backup.json'))
  const groups   = JSON.parse(fs.readFileSync('groups_backup.json'))

  // Clear existing data first
  await mongoose.connection.db.collection('contacts').deleteMany({})
  await mongoose.connection.db.collection('groups').deleteMany({})
  console.log('🗑️ Cleared existing Atlas data')

  if (contacts.length) await mongoose.connection.db.collection('contacts').insertMany(contacts)
  if (groups.length)   await mongoose.connection.db.collection('groups').insertMany(groups)

  console.log(`✅ Imported ${contacts.length} contacts and ${groups.length} groups`)
  process.exit(0)
}
importData().catch(console.error)