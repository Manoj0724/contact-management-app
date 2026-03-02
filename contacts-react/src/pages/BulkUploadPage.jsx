import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowLeft, Upload, FileText, CheckCircle, XCircle,
  Download, ChevronDown, ChevronUp, AlertCircle,
  TableProperties, Lightbulb, Edit3, Plus, Trash2, X
} from 'lucide-react'
import { bulkUpload } from '@/services/api'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'

const COLS   = ['title', 'firstName', 'lastName', 'mobile1', 'mobile2', 'city', 'state', 'pincode']
const TITLES = ['Mr', 'Mrs', 'Ms', 'Dr']

const RULES = [
  { field: 'title',     req: true,  desc: 'Must be: Mr, Mrs, Ms, or Dr', ex: 'Mr'         },
  { field: 'firstName', req: true,  desc: 'Letters and spaces only',      ex: 'Rajesh'     },
  { field: 'lastName',  req: true,  desc: 'Letters and spaces only',      ex: 'Kumar'      },
  { field: 'mobile1',   req: true,  desc: 'Exactly 10 digits',            ex: '9876543210' },
  { field: 'mobile2',   req: false, desc: '10 digits (optional)',          ex: '9876543211' },
  { field: 'city',      req: true,  desc: 'Letters only',                 ex: 'Nellore'    },
  { field: 'state',     req: true,  desc: 'Letters only',                 ex: 'Andhra Pradesh' },
  { field: 'pincode',   req: true,  desc: 'Exactly 6 digits',             ex: '524001'     },
]

const SAMPLE_ROWS = [
  ['Mr',  'Rajesh', 'Kumar',  '9876543210', '9876543211', 'Nellore',   'Andhra Pradesh', '524001'],
  ['Mrs', 'Priya',  'Sharma', '8765432109', '',           'Delhi',     'Delhi',           '110001'],
  ['Dr',  'Arjun',  'Patel',  '7654321098', '7654321099', 'Bangalore', 'Karnataka',       '560001'],
  ['Ms',  'Sneha',  'Iyer',   '6543210987', '',           'Chennai',   'Tamil Nadu',       '600001'],
]

const TIPS = [
  'Column names are case-insensitive (firstName = firstname = FIRSTNAME)',
  'Empty cells are allowed for optional fields like mobile2',
  'Maximum 500 contacts per upload',
  'Use Excel, Google Sheets, or any CSV editor to prepare your file',
]

const STEPS = [
  { n: 1, label: 'Download Template', desc: 'Get the CSV template with correct columns' },
  { n: 2, label: 'Fill in Contacts',  desc: 'Add your contacts — title, name, mobile, city etc.' },
  { n: 3, label: 'Upload & Review',   desc: 'Preview data, fix errors, then upload' },
  { n: 4, label: 'Done!',             desc: 'Contacts are saved and ready to use' },
]

const emptyRow = () => ({ title: '', firstName: '', lastName: '', mobile1: '', mobile2: '', city: '', state: '', pincode: '' })

// ─── FIXED CSV Parser ─────────────────────────────────────────────────────────
// Properly handles quoted fields, commas inside quotes, Excel exports
function parseCSVLine(line) {
  const result = []
  let cur = ''
  let inQuotes = false
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') { cur += '"'; i++ }
      else inQuotes = !inQuotes
    } else if (ch === ',' && !inQuotes) {
      result.push(cur.trim())
      cur = ''
    } else {
      cur += ch
    }
  }
  result.push(cur.trim())
  return result
}

function parseCSV(text) {
  const lines = text.trim().split(/\r?\n/).filter(l => l.trim())
  if (lines.length < 2) return []

  const rawHeaders = parseCSVLine(lines[0]).map(h => h.toLowerCase().replace(/['"]/g, '').trim())

  // Flexible column mapping — handles firstName, first_name, first name, FIRSTNAME etc.
  const aliases = {
    title:     ['title'],
    firstName: ['firstname', 'first_name', 'first name', 'fname'],
    lastName:  ['lastname',  'last_name',  'last name',  'lname', 'surname'],
    mobile1:   ['mobile1',   'mobile_1',   'phone1',     'phone',   'mobile', 'contact'],
    mobile2:   ['mobile2',   'mobile_2',   'phone2',     'altphone', 'alt_phone'],
    city:      ['city',      'town'],
    state:     ['state',     'province'],
    pincode:   ['pincode',   'pin',        'zip',         'zipcode', 'postal'],
  }

  // Map each COLS field → column index in the CSV
  const colIdx = {}
  for (const [field, aliasList] of Object.entries(aliases)) {
    const idx = rawHeaders.findIndex(h => aliasList.includes(h))
    colIdx[field] = idx  // -1 means not found
  }

  const contacts = []
  for (let i = 1; i < lines.length; i++) {
    const vals = parseCSVLine(lines[i])
    const row = {}
    for (const field of COLS) {
      const idx = colIdx[field]
      row[field] = idx >= 0 && idx < vals.length ? (vals[idx] || '') : ''
    }
    // Skip fully empty rows
    if (!row.firstName && !row.lastName && !row.mobile1) continue
    contacts.push(row)
  }
  return contacts
}

// ─── Step Bar ─────────────────────────────────────────────────────────────────
function StepBar({ step }) {
  return (
    <div className="flex items-center w-full mb-6">
      {[1, 2, 3].map((s, i) => (
        <div key={s} className="flex items-center flex-1">
          <div className={`flex items-center gap-2 ${s < 3 ? 'flex-1' : ''}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0 transition-all ${
              step >= s ? 'bg-blue-600 text-white shadow-md shadow-blue-200' : 'bg-slate-100 text-slate-400'
            }`}>{s}</div>
            <span className={`text-sm font-medium whitespace-nowrap hidden sm:inline ${step >= s ? 'text-slate-700' : 'text-slate-400'}`}>
              {s === 1 ? 'Upload File' : s === 2 ? 'Preview & Edit' : 'Results'}
            </span>
          </div>
          {i < 2 && <div className={`flex-1 h-0.5 mx-2 sm:mx-3 ${step > s ? 'bg-blue-500' : 'bg-slate-200'}`} />}
        </div>
      ))}
    </div>
  )
}

// ─── Manual Entry Modal ────────────────────────────────────────────────────────
function ManualEntryModal({ onClose, onSubmit }) {
  const [rows, setRows]     = useState([emptyRow()])
  const [errors, setErrors] = useState([])

  const setCell = (i, field, val) =>
    setRows(prev => prev.map((r, idx) => idx === i ? { ...r, [field]: val } : r))

  const addRow = () => {
    if (rows.length >= 500) return toast.error('Max 500 contacts')
    setRows(prev => [...prev, emptyRow()])
  }

  const removeRow = (i) => {
    if (rows.length === 1) return
    setRows(prev => prev.filter((_, idx) => idx !== i))
    setErrors(prev => prev.filter((_, idx) => idx !== i))
  }

  const validate = () => {
    const errs = rows.map(row => {
      const e = []
      if (!TITLES.includes((row.title || '').trim()))                e.push('title')
      if (!row.firstName || !/^[a-zA-Z\s]+$/.test(row.firstName))   e.push('firstName')
      if (!row.lastName  || !/^[a-zA-Z\s]+$/.test(row.lastName))    e.push('lastName')
      if (!row.mobile1   || !/^\d{10}$/.test(row.mobile1))          e.push('mobile1')
      if (row.mobile2 && !/^\d{10}$/.test(row.mobile2))             e.push('mobile2')
      if (!row.city      || !/^[a-zA-Z\s]+$/.test(row.city))        e.push('city')
      if (!row.state     || !/^[a-zA-Z\s]+$/.test(row.state))       e.push('state')
      if (!row.pincode   || !/^\d{6}$/.test(row.pincode))           e.push('pincode')
      return e
    })
    setErrors(errs)
    return errs.every(e => e.length === 0)
  }

  const handleSubmit = () => {
    if (!validate()) { toast.error('Please fix the highlighted fields'); return }
    onSubmit(rows)
  }

  const fieldErr = (i, field) => errors[i]?.includes(field)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm cursor-pointer" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-4 border-b border-slate-200 bg-slate-50 shrink-0">
          <div>
            <h2 className="font-bold text-slate-800 text-base">Enter Contacts Manually</h2>
            <p className="text-xs text-slate-400 mt-0.5">{rows.length} row{rows.length !== 1 ? 's' : ''} · Fill all required fields</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-xl transition-colors text-slate-500 cursor-pointer">
            <X size={16} />
          </button>
        </div>

        {/* Table */}
        <div className="overflow-auto flex-1 p-3 sm:p-4">
          <table className="w-full min-w-max text-sm border-separate border-spacing-y-1.5">
            <thead>
              <tr>
                <th className="px-2 py-1.5 text-left text-xs font-bold text-slate-400 w-8">#</th>
                {RULES.map(r => (
                  <th key={r.field} className="px-2 py-1.5 text-left text-xs font-bold text-slate-500 uppercase tracking-wide whitespace-nowrap">
                    {r.field}
                    {r.req
                      ? <span className="text-red-400 ml-0.5">*</span>
                      : <span className="text-slate-300 font-normal ml-1 normal-case">opt</span>
                    }
                  </th>
                ))}
                <th className="w-8" />
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => (
                <tr key={i} className="group">
                  <td className="px-2 text-xs text-slate-400 font-mono pt-1">{i + 1}</td>

                  {/* Title select */}
                  <td className="px-1">
                    <select
                      value={row.title}
                      onChange={e => setCell(i, 'title', e.target.value)}
                      className={`h-9 w-20 rounded-lg border text-sm px-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white cursor-pointer ${
                        fieldErr(i, 'title') ? 'border-red-400 bg-red-50' : 'border-slate-200'
                      }`}>
                      <option value="">—</option>
                      {TITLES.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </td>

                  {/* Text fields */}
                  {['firstName', 'lastName', 'mobile1', 'mobile2', 'city', 'state', 'pincode'].map(field => (
                    <td key={field} className="px-1">
                      <input
                        value={row[field]}
                        onChange={e => {
                          let v = e.target.value
                          if (['mobile1','mobile2'].includes(field)) v = v.replace(/\D/g,'').slice(0,10)
                          if (field === 'pincode') v = v.replace(/\D/g,'').slice(0,6)
                          setCell(i, field, v)
                        }}
                        placeholder={RULES.find(r => r.field === field)?.ex || ''}
                        inputMode={['mobile1', 'mobile2', 'pincode'].includes(field) ? 'numeric' : undefined}
                        className={`h-9 rounded-lg border text-sm px-3 w-full focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors cursor-text ${
                          fieldErr(i, field) ? 'border-red-400 bg-red-50' : 'border-slate-200 bg-white hover:border-slate-300'
                        }`}
                      />
                    </td>
                  ))}

                  {/* Remove */}
                  <td className="px-1">
                    <button onClick={() => removeRow(i)}
                      className="p-1.5 rounded-lg text-slate-300 hover:text-red-500 hover:bg-red-50 transition-colors opacity-0 group-hover:opacity-100 cursor-pointer">
                      <Trash2 size={13} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <button onClick={addRow}
            className="mt-3 flex items-center gap-2 px-4 py-2.5 text-sm text-blue-600 hover:bg-blue-50 rounded-xl border border-dashed border-blue-200 transition-colors w-full justify-center font-medium cursor-pointer">
            <Plus size={14} /> Add Another Row
          </button>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between gap-3 px-4 sm:px-6 py-4 border-t border-slate-200 bg-slate-50 shrink-0">
          <p className="text-xs text-slate-400 hidden sm:block">
            Fields marked <span className="text-red-400 font-bold">*</span> are required
          </p>
          <div className="flex gap-3 w-full sm:w-auto">
            <Button variant="outline" onClick={onClose} className="flex-1 sm:flex-none cursor-pointer">Cancel</Button>
            <Button onClick={handleSubmit} className="flex-1 sm:flex-none bg-blue-600 hover:bg-blue-700 text-white gap-2 cursor-pointer">
              <CheckCircle size={14} /> Preview {rows.length} Contact{rows.length !== 1 ? 's' : ''}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function BulkUploadPage() {
  const navigate = useNavigate()
  const fileRef  = useRef()

  const [step, setStep]             = useState(1)
  const [file, setFile]             = useState(null)
  const [parsed, setParsed]         = useState([])
  const [loading, setLoading]       = useState(false)
  const [result, setResult]         = useState(null)
  const [dragOver, setDragOver]     = useState(false)
  const [showGuide, setShowGuide]   = useState(true)
  const [manualMode, setManualMode] = useState(false)

  const handleFile = async (f) => {
    if (!f) return
    if (!f.name.toLowerCase().endsWith('.csv')) return toast.error('Only CSV files are supported')
    if (f.size > 5 * 1024 * 1024) return toast.error('File too large — max 5MB')
    setFile(f)
    try {
      const text = await f.text()
      const rows = parseCSV(text)
      if (rows.length === 0) return toast.error('No valid rows found — check CSV format matches the template')
      if (rows.length > 500) return toast.error('Max 500 contacts per upload')
      setParsed(rows)
      setStep(2)
      toast.success(`${rows.length} rows detected — review below before uploading`)
    } catch (err) {
      toast.error('Could not parse CSV: ' + err.message)
    }
  }

  const handleManualSubmit = (rows) => {
    setManualMode(false)
    setParsed(rows)
    setStep(2)
    toast.success(`${rows.length} contacts ready — review below`)
  }

  const handleUpload = async () => {
    if (!parsed.length) return toast.error('No data to upload')
    setLoading(true)
    try {
      // ✅ Backend expects { contacts: [...] }
      const r = await bulkUpload({ contacts: parsed })
      setResult(r.data)
      setStep(3)
      const inserted = r.data.uploaded ?? r.data.inserted ?? 0
      toast.success(`Upload complete! ${inserted} contacts added`)
    } catch (e) {
      toast.error(e.response?.data?.message || 'Upload failed — check CSV format')
    } finally { setLoading(false) }
  }

  const downloadTemplate = () => {
    const csv = COLS.join(',') + '\n' + SAMPLE_ROWS.map(r => r.join(',')).join('\n')
    const a = document.createElement('a')
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }))
    a.download = 'contacts_template.csv'
    a.click()
    toast.success('Template downloaded!')
  }

  const reset = () => { setStep(1); setFile(null); setParsed([]); setResult(null) }

  return (
    <div className="max-w-4xl mx-auto space-y-4 sm:space-y-5 pb-10">

      {manualMode && (
        <ManualEntryModal
          onClose={() => setManualMode(false)}
          onSubmit={handleManualSubmit}
        />
      )}

      {/* Header */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/contacts')}
            className="p-2 hover:bg-slate-100 rounded-xl transition-colors text-slate-500 cursor-pointer">
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 className="text-lg sm:text-xl font-bold text-slate-800">Bulk Upload Contacts</h1>
            <p className="text-slate-400 text-xs mt-0.5">Upload hundreds of contacts at once via CSV or manual entry</p>
          </div>
        </div>
        <Button onClick={downloadTemplate} variant="outline" size="sm"
          className="gap-2 text-slate-600 border-slate-200 hover:border-blue-300 hover:text-blue-600 cursor-pointer">
          <Download size={13} /> Download Template
        </Button>
      </div>

      {/* Step Card */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm px-4 sm:px-6 py-5">
        <StepBar step={step} />

        {/* STEP 1 — Upload Zone */}
        {step === 1 && (
          <div
            onDragOver={e => { e.preventDefault(); setDragOver(true) }}
            onDragLeave={() => setDragOver(false)}
            onDrop={e => { e.preventDefault(); setDragOver(false); handleFile(e.dataTransfer.files[0]) }}
            className={`border-2 border-dashed rounded-2xl p-8 sm:p-14 text-center transition-all cursor-pointer ${
              dragOver ? 'border-blue-400 bg-blue-50' : 'border-slate-200 hover:border-blue-300 hover:bg-slate-50'
            }`}
            onClick={() => fileRef.current?.click()}>
            <input ref={fileRef} type="file" accept=".csv" className="hidden"
              onChange={e => handleFile(e.target.files[0])} />
            <div className="w-14 sm:w-16 h-14 sm:h-16 rounded-2xl bg-blue-600 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-blue-200">
              <Upload size={24} className="text-white" />
            </div>
            <h3 className="font-bold text-slate-700 text-base sm:text-lg mb-1">Drag & Drop your CSV here</h3>
            <p className="text-sm text-slate-400 mb-6">Supports CSV up to 5MB — max 500 contacts</p>
            <div className="flex items-center justify-center gap-3 flex-wrap">
              <button
                onClick={e => { e.stopPropagation(); fileRef.current?.click() }}
                className="flex items-center gap-2 px-5 sm:px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold transition-colors shadow-sm cursor-pointer">
                <FileText size={15} /> Browse File
              </button>
              <span className="text-slate-400 text-sm">or</span>
              <button
                onClick={e => { e.stopPropagation(); setManualMode(true) }}
                className="flex items-center gap-2 px-5 sm:px-6 py-2.5 border border-slate-200 hover:border-blue-300 text-slate-600 hover:text-blue-600 rounded-xl text-sm font-semibold transition-colors cursor-pointer">
                <Edit3 size={15} /> Enter Manually
              </button>
            </div>
          </div>
        )}

        {/* STEP 2 — Preview */}
        {step === 2 && parsed.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <p className="text-sm font-semibold text-slate-700">{parsed.length} contacts ready to upload</p>
              <button onClick={reset} className="text-xs text-slate-400 hover:text-red-500 transition-colors cursor-pointer">← Start over</button>
            </div>
            <div className="overflow-x-auto rounded-xl border border-slate-200 max-h-72 sm:max-h-80">
              <table className="w-full text-xs min-w-max">
                <thead className="sticky top-0 bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-3 py-2 text-left text-slate-400 font-bold w-10">#</th>
                    {COLS.map(c => (
                      <th key={c} className="px-3 py-2 text-left font-bold text-slate-500 uppercase tracking-wide whitespace-nowrap">{c}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {parsed.map((row, i) => (
                    <tr key={i} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                      <td className="px-3 py-2 text-slate-400">{i + 1}</td>
                      {COLS.map(c => (
                        <td key={c} className={`px-3 py-2 whitespace-nowrap ${!row[c] && RULES.find(r => r.field === c)?.req ? 'text-red-400 font-medium' : 'text-slate-600'}`}>
                          {row[c] || <span className="text-slate-300">—</span>}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Warn if firstName/lastName is empty */}
            {parsed.some(r => !r.firstName || !r.lastName) && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex gap-2">
                <AlertCircle size={15} className="text-amber-500 shrink-0 mt-0.5" />
                <p className="text-xs text-amber-700">
                  <strong>Warning:</strong> Some rows are missing firstName or lastName. Make sure your CSV headers match exactly: <code className="bg-amber-100 px-1 rounded">title, firstName, lastName, mobile1, mobile2, city, state, pincode</code>
                </p>
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-100 flex-wrap">
              <Button variant="outline" onClick={reset} className="cursor-pointer">Cancel</Button>
              <Button onClick={handleUpload} disabled={loading}
                className="bg-blue-600 hover:bg-blue-700 text-white gap-2 min-w-40 cursor-pointer">
                {loading
                  ? <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Uploading…</>
                  : <><Upload size={14} /> Upload {parsed.length} Contacts</>
                }
              </Button>
            </div>
          </div>
        )}

        {/* STEP 3 — Results */}
        {step === 3 && result && (
          <div className="space-y-4 sm:space-y-5">
            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4 sm:p-6 text-center">
                <CheckCircle size={28} className="mx-auto text-emerald-500 mb-2" />
                <p className="text-3xl sm:text-4xl font-bold text-emerald-700">{result.uploaded ?? result.inserted ?? 0}</p>
                <p className="text-sm text-emerald-600 font-semibold mt-1">Inserted</p>
              </div>
              <div className="bg-red-50 border border-red-100 rounded-2xl p-4 sm:p-6 text-center">
                <XCircle size={28} className="mx-auto text-red-400 mb-2" />
                <p className="text-3xl sm:text-4xl font-bold text-red-600">{result.failed ?? 0}</p>
                <p className="text-sm text-red-500 font-semibold mt-1">Failed</p>
              </div>
            </div>
            {result.errorList?.length > 0 && (
              <div className="bg-red-50 border border-red-100 rounded-xl p-4 space-y-1.5">
                <p className="text-sm font-bold text-red-700 mb-2 flex items-center gap-2">
                  <AlertCircle size={14} /> Failed Rows
                </p>
                {result.errorList.slice(0, 10).map((e, i) => (
                  <p key={i} className="text-xs text-red-600">• Row {e.row}: <strong>{e.name}</strong> — {e.error}</p>
                ))}
                {result.errorList.length > 10 && (
                  <p className="text-xs text-red-400 pt-1">…and {result.errorList.length - 10} more errors</p>
                )}
              </div>
            )}
            <div className="flex gap-3 pt-2 border-t border-slate-100">
              <Button variant="outline" onClick={reset} className="flex-1 cursor-pointer">Upload More</Button>
              <Button onClick={() => navigate('/contacts')} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white cursor-pointer">
                View Contacts
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* CSV Format Guide */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <button onClick={() => setShowGuide(!showGuide)}
          className="w-full flex items-center gap-3 px-4 sm:px-5 py-4 hover:bg-slate-50 transition-colors text-left cursor-pointer">
          <div className="w-8 h-8 bg-blue-50 rounded-xl flex items-center justify-center shrink-0">
            <TableProperties size={15} className="text-blue-600" />
          </div>
          <div className="flex-1">
            <p className="font-semibold text-slate-700 text-sm">CSV Template Format</p>
            <p className="text-xs text-slate-400">Click to {showGuide ? 'hide' : 'show'} required columns and sample data</p>
          </div>
          {showGuide ? <ChevronUp size={16} className="text-slate-400" /> : <ChevronDown size={16} className="text-slate-400" />}
        </button>
        {showGuide && (
          <div className="px-4 sm:px-5 pb-5 space-y-4 sm:space-y-5 border-t border-slate-100">
            <div className="overflow-x-auto rounded-xl border border-slate-200 mt-4">
              <table className="w-full text-xs min-w-max">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    {COLS.map(h => <th key={h} className="px-3 py-2.5 text-left font-bold text-blue-600 uppercase tracking-wide whitespace-nowrap">{h}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {SAMPLE_ROWS.map((row, i) => (
                    <tr key={i} className="border-b border-slate-100 last:border-0">
                      {row.map((v, j) => <td key={j} className="px-3 py-2.5 text-slate-600 whitespace-nowrap font-mono">{v || '—'}</td>)}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {RULES.map(r => (
                <div key={r.field} className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className="text-xs font-bold text-slate-700">{r.field}</span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold ${r.req ? 'bg-blue-100 text-blue-600' : 'bg-slate-200 text-slate-500'}`}>
                      {r.req ? 'req' : 'opt'}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 mb-2">{r.desc}</p>
                  <div className="bg-emerald-50 border border-emerald-100 rounded-lg px-2 py-1">
                    <span className="text-xs text-emerald-700 font-mono">{r.ex}</span>
                  </div>
                </div>
              ))}
            </div>
            <div className="bg-amber-50 border border-amber-100 rounded-xl p-3 sm:p-4 flex gap-3">
              <Lightbulb size={15} className="text-amber-500 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-bold text-amber-800 mb-2">Pro Tips:</p>
                <ul className="space-y-1">{TIPS.map((t, i) => <li key={i} className="text-xs text-amber-700">• {t}</li>)}</ul>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* How it works */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-4 sm:p-5">
        <p className="text-sm font-bold text-slate-700 mb-4">How it works</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {STEPS.map(s => (
            <div key={s.n} className="flex gap-3">
              <div className="w-7 h-7 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">{s.n}</div>
              <div>
                <p className="text-xs font-bold text-slate-700">{s.label}</p>
                <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">{s.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}