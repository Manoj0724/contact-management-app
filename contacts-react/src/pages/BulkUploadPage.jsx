import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Upload, FileText, CheckCircle, XCircle, Download, ChevronUp, ChevronDown } from 'lucide-react'
import { bulkUpload } from '@/services/api'
import { toast } from 'sonner'

const SAMPLE_DATA = [
  { title: 'Mr', firstName: 'John', lastName: 'Smith', mobile1: '9876543210', mobile2: '9876543211', city: 'Mumbai', state: 'Maharashtra', pincode: '400001' },
  { title: 'Mrs', firstName: 'Priya', lastName: 'Sharma', mobile1: '8765432109', mobile2: '', city: 'Delhi', state: 'Delhi', pincode: '110001' },
  { title: 'Dr', firstName: 'Arjun', lastName: 'Patel', mobile1: '7654321098', mobile2: '7654321099', city: 'Bangalore', state: 'Karnataka', pincode: '560001' },
  { title: 'Ms', firstName: 'Sneha', lastName: 'Iyer', mobile1: '6543210987', mobile2: '', city: 'Chennai', state: 'Tamil Nadu', pincode: '600001' },
]

const VALIDATION_RULES = [
  { field: 'title', required: true, desc: 'Must be: Mr, Mrs, Ms, or Dr', example: 'Mr' },
  { field: 'firstName', required: true, desc: 'Letters and spaces only', example: 'John' },
  { field: 'lastName', required: true, desc: 'Letters and spaces only', example: 'Smith' },
  { field: 'mobile1', required: true, desc: 'Exactly 10 digits', example: '9876543210' },
  { field: 'mobile2', required: false, desc: 'Exactly 10 digits (optional)', example: '9876543211' },
  { field: 'city', required: true, desc: 'Letters only', example: 'Mumbai' },
  { field: 'state', required: true, desc: 'Letters only', example: 'Maharashtra' },
  { field: 'pincode', required: true, desc: 'Exactly 6 digits', example: '400001' },
]

export default function BulkUploadPage() {
  const navigate = useNavigate()
  const fileRef = useRef()
  const [file, setFile] = useState(null)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [dragOver, setDragOver] = useState(false)
  const [showTemplate, setShowTemplate] = useState(true)

  const handleFile = (f) => {
    if (!f) return
    if (!f.name.endsWith('.csv')) return toast.error('Only CSV files allowed')
    setFile(f); setResult(null)
  }

  const handleUpload = async () => {
    if (!file) return toast.error('Please select a CSV file')
    setLoading(true)
    try {
      const fd = new FormData(); fd.append('file', file)
      const res = await bulkUpload(fd)
      setResult(res.data)
      toast.success(`Upload complete! ${res.data.inserted || 0} contacts added`)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Upload failed')
    } finally { setLoading(false) }
  }

  const downloadTemplate = () => {
    const csv = 'title,firstName,lastName,mobile1,mobile2,city,state,pincode\nMr,John,Smith,9876543210,9876543211,Mumbai,Maharashtra,400001\nMrs,Priya,Sharma,8765432109,,Delhi,Delhi,110001'
    const blob = new Blob([csv], { type: 'text/csv' })
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'contacts_template.csv'; a.click()
  }

  return (
    <div className="max-w-4xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/contacts')}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors text-slate-500">
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Bulk Upload Contacts</h1>
            <p className="text-slate-500 text-sm mt-0.5">Upload hundreds of contacts at once via CSV or manual entry</p>
          </div>
        </div>
        <button onClick={downloadTemplate}
          className="flex items-center gap-2 px-4 py-2.5 border border-slate-200 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50 bg-white shadow-sm transition-colors">
          <Download size={15} /> Download Template
        </button>
      </div>

      {/* Steps */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-4">
        <div className="flex items-center gap-0">
          {[['1', 'Upload File', true], ['2', 'Preview & Edit', false], ['3', 'Results', false]].map(([num, label, active], i) => (
            <div key={num} className="flex items-center flex-1">
              <div className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${active ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-400'}`}>{num}</div>
                <span className={`text-sm font-medium ${active ? 'text-slate-700' : 'text-slate-400'}`}>{label}</span>
              </div>
              {i < 2 && <div className="flex-1 h-px bg-slate-200 mx-3" />}
            </div>
          ))}
        </div>
      </div>

      {/* CSV Template Section */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        <button onClick={() => setShowTemplate(!showTemplate)}
          className="w-full flex items-center gap-3 px-6 py-4 text-left hover:bg-slate-50 transition-colors">
          <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center">
            <FileText size={16} className="text-blue-600" />
          </div>
          <div className="flex-1">
            <p className="font-semibold text-slate-700 text-sm">CSV Template Format</p>
            <p className="text-xs text-slate-400 mt-0.5">Click to {showTemplate ? 'hide' : 'show'} required columns and sample data</p>
          </div>
          {showTemplate ? <ChevronUp size={18} className="text-slate-400" /> : <ChevronDown size={18} className="text-slate-400" />}
        </button>

        {showTemplate && (
          <div className="px-6 pb-6 space-y-5 border-t border-slate-100">
            {/* Sample Data Table */}
            <div>
              <div className="flex items-center gap-2 mt-4 mb-3">
                <div className="w-5 h-5 bg-slate-100 rounded flex items-center justify-center">
                  <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="3" x2="9" y2="21"/></svg>
                </div>
                <span className="text-sm font-semibold text-slate-700">Sample CSV Data</span>
              </div>
              <div className="overflow-x-auto rounded-lg border border-slate-200">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200">
                      {['TITLE', 'FIRSTNAME', 'LASTNAME', 'MOBILE1', 'MOBILE2', 'CITY', 'STATE', 'PINCODE'].map(h => (
                        <th key={h} className="px-3 py-2 text-left font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {SAMPLE_DATA.map((row, i) => (
                      <tr key={i} className="border-b border-slate-100 last:border-0">
                        {[row.title, row.firstName, row.lastName, row.mobile1, row.mobile2 || '', row.city, row.state, row.pincode].map((val, j) => (
                          <td key={j} className="px-3 py-2 text-slate-600">{val}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Validation Rules */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <CheckCircle size={16} className="text-blue-500" />
                <span className="text-sm font-semibold text-slate-700">Validation Rules</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {VALIDATION_RULES.map(rule => (
                  <div key={rule.field} className="bg-slate-50 rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-bold text-slate-700">{rule.field}</span>
                      {rule.required
                        ? <span className="text-xs bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded font-medium">required</span>
                        : <span className="text-xs bg-slate-200 text-slate-500 px-1.5 py-0.5 rounded font-medium">optional</span>}
                    </div>
                    <p className="text-xs text-slate-500 mb-2">{rule.desc}</p>
                    <div className="bg-green-50 border border-green-100 rounded px-2 py-1">
                      <span className="text-xs text-green-700 font-mono">{rule.example}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Pro Tips */}
            <div className="bg-amber-50 border border-amber-100 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-amber-500">💡</span>
                <span className="text-sm font-semibold text-amber-800">Pro Tips:</span>
              </div>
              <ul className="space-y-1 text-xs text-amber-700 list-disc list-inside">
                <li>Column names are case-insensitive (firstName = firstname = FIRSTNAME)</li>
                <li>Empty cells are allowed for optional fields like mobile2</li>
                <li>Maximum 500 contacts per upload</li>
                <li>Use Excel, Google Sheets, or any CSV editor</li>
              </ul>
            </div>
          </div>
        )}
      </div>

      {/* Drop Zone */}
      {!result && (
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-8">
          <div
            onDragOver={e => { e.preventDefault(); setDragOver(true) }}
            onDragLeave={() => setDragOver(false)}
            onDrop={e => { e.preventDefault(); setDragOver(false); handleFile(e.dataTransfer.files[0]) }}
            className={`border-2 border-dashed rounded-xl p-12 text-center transition-all ${dragOver ? 'border-blue-400 bg-blue-50' : file ? 'border-green-300 bg-green-50' : 'border-slate-200 hover:border-blue-300'}`}>
            <input ref={fileRef} type="file" accept=".csv" className="hidden" onChange={e => handleFile(e.target.files[0])} />
            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 ${file ? 'bg-green-500' : 'bg-blue-600'}`}>
              <Upload size={28} className="text-white" />
            </div>
            <h3 className="text-lg font-semibold text-slate-700 mb-1">
              {file ? file.name : 'Drag & Drop your CSV file here'}
            </h3>
            <p className="text-sm text-slate-400 mb-6">
              {file ? `${(file.size / 1024).toFixed(1)} KB` : 'Supports CSV files up to 5MB — max 500 contacts'}
            </p>
            <div className="flex items-center justify-center gap-3">
              <button onClick={() => fileRef.current?.click()}
                className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors">
                <FileText size={15} /> Browse File
              </button>
              <span className="text-slate-400 text-sm">or</span>
              <button className="flex items-center gap-2 px-5 py-2.5 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-lg text-sm font-medium transition-colors">
                ✏️ Enter Manually
              </button>
            </div>
          </div>

          {file && (
            <div className="flex justify-end gap-3 mt-4">
              <button onClick={() => setFile(null)} className="px-4 py-2 border border-slate-200 rounded-lg text-sm text-slate-600 hover:bg-slate-50 transition-colors">Clear</button>
              <button onClick={handleUpload} disabled={loading}
                className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-60">
                <Upload size={15} /> {loading ? 'Uploading...' : 'Upload Contacts'}
              </button>
            </div>
          )}
        </div>
      )}

      {/* How it works */}
      {!result && (
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-6">
          <h3 className="font-semibold text-slate-700 mb-4">How it works</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              ['1', 'Download Template', 'Get the CSV template with correct columns', 'bg-blue-600'],
              ['2', 'Fill in Contacts', 'Add your contacts — title, name, mobile, city, etc.', 'bg-blue-600'],
              ['3', 'Upload & Review', 'Preview data, fix errors, then upload', 'bg-blue-600'],
              ['4', 'Done!', 'Contacts are saved and ready to use', 'bg-blue-600'],
            ].map(([num, title, desc, bg]) => (
              <div key={num} className="text-center">
                <div className={`w-8 h-8 ${bg} text-white rounded-full flex items-center justify-center text-sm font-bold mx-auto mb-2`}>{num}</div>
                <p className="text-sm font-semibold text-slate-700 mb-1">{title}</p>
                <p className="text-xs text-slate-400">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Result */}
      {result && (
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-6 space-y-4">
          <h3 className="font-semibold text-slate-700 text-lg">Upload Results</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-green-50 border border-green-100 rounded-xl p-5 text-center">
              <CheckCircle size={24} className="mx-auto text-green-500 mb-2" />
              <p className="text-3xl font-bold text-green-700">{result.inserted || 0}</p>
              <p className="text-sm text-green-600 mt-1">Successfully Inserted</p>
            </div>
            <div className="bg-red-50 border border-red-100 rounded-xl p-5 text-center">
              <XCircle size={24} className="mx-auto text-red-400 mb-2" />
              <p className="text-3xl font-bold text-red-600">{result.failed || 0}</p>
              <p className="text-sm text-red-500 mt-1">Failed</p>
            </div>
          </div>
          {result.errors?.length > 0 && (
            <div className="bg-red-50 rounded-lg p-4">
              <p className="text-sm font-semibold text-red-700 mb-2">Errors:</p>
              {result.errors.slice(0, 5).map((e, i) => <p key={i} className="text-sm text-red-600">• {e}</p>)}
            </div>
          )}
          <button onClick={() => navigate('/contacts')}
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors">
            View Contacts
          </button>
        </div>
      )}
    </div>
  )
}
