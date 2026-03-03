const mongoose = require('mongoose')
const fs = require('fs')

const ATLAS = 'mongodb+srv://manoj0724:Manoj9004@cluster0.f9hxo9y.mongodb.net/contactsdb'

async function reimport() {
  await mongoose.connect(ATLAS)
  console.log('Connected to Atlas')

  const contacts = JSON.parse(fs.readFileSync('contacts_backup.json'))
  const groups   = JSON.parse(fs.readFileSync('groups_backup.json'))

  // Clear existing
  await mongoose.connection.db.collection('contacts').deleteMany({})
  await mongoose.connection.db.collection('groups').deleteMany({})
  console.log('Cleared existing data')

  // Re-insert with proper ObjectId conversion
  const fixedContacts = contacts.map(c => ({
    ...c,
    _id: new mongoose.Types.ObjectId(c._id.toString().replace(/^ObjectId\("(.+)"\)$/, '$1')),
    groups: (c.groups || []).map(g => {
      try { return new mongoose.Types.ObjectId(g.toString()) } catch { return g }
    })
  }))

  const fixedGroups = groups.map(g => ({
    ...g,
    _id: new mongoose.Types.ObjectId(g._id.toString().replace(/^ObjectId\("(.+)"\)$/, '$1'))
  }))

  if (fixedContacts.length) await mongoose.connection.db.collection('contacts').insertMany(fixedContacts)
  if (fixedGroups.length)   await mongoose.connection.db.collection('groups').insertMany(fixedGroups)

  console.log(`✅ Reimported ${fixedContacts.length} contacts and ${fixedGroups.length} groups with proper ObjectIds`)
  process.exit(0)
}

reimport().catch(console.error)