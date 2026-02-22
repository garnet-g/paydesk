'use client'

import { useState } from 'react'
import { Upload, FileSpreadsheet, CheckCircle, AlertCircle, ArrowLeft, Download, Loader2 } from 'lucide-react'
import DashboardLayout from '@/components/DashboardLayout'
import Link from 'next/link'

export default function ImportDataPage() {
    const [importType, setImportType] = useState<'STUDENTS' | 'PARENTS' | 'BALANCES'>('STUDENTS')
    const [file, setFile] = useState<File | null>(null)
    const [isUploading, setIsUploading] = useState(false)
    const [result, setResult] = useState<{ success: boolean; message: string; details?: any } | null>(null)

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0])
            setResult(null)
        }
    }

    const handleUpload = async () => {
        if (!file) return

        setIsUploading(true)
        setResult(null)

        const formData = new FormData()
        formData.append('file', file)
        formData.append('type', importType)

        try {
            const res = await fetch('/api/admin/import', {
                method: 'POST',
                body: formData
            })

            const data = await res.json()
            setResult({
                success: res.ok,
                message: data.message || (res.ok ? 'Import completed successfully' : 'Import failed'),
                details: data.details
            })
        } catch (error) {
            setResult({
                success: false,
                message: 'A connection error occurred during upload.'
            })
        } finally {
            setIsUploading(false)
        }
    }

    const templates = {
        STUDENTS: '/templates/students_template.csv',
        PARENTS: '/templates/parents_template.csv',
        BALANCES: '/templates/balances_template.csv'
    }

    return (
        <DashboardLayout>
            <div className="animate-fade-in max-w-5xl mx-auto">
                <div className="mb-2xl flex items-center justify-between">
                    <div className="flex items-center gap-lg">
                        <Link href="/dashboard" className="p-sm bg-white shadow-sm border border-neutral-100 rounded-xl text-neutral-400 hover:text-primary-600 hover:border-primary-200 transition-all">
                            <ArrowLeft size={20} />
                        </Link>
                        <div>
                            <h2 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: 'var(--spacing-xs)', color: 'var(--primary-900)' }}>Data Migration Center</h2>
                            <p className="text-muted font-medium">Bulk initialize your school ecosystem with precision</p>
                        </div>
                    </div>
                    <div className="hidden md:flex items-center gap-md px-lg py-md bg-primary-50 rounded-2xl border border-primary-100/50">
                        <div className="p-sm bg-primary-100 text-primary-600 rounded-xl">
                            <FileSpreadsheet size={20} />
                        </div>
                        <div className="text-xs">
                            <div className="font-black text-primary-900 uppercase tracking-tighter">System Health</div>
                            <div className="text-primary-600 font-bold italic">Ready for processing</div>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-3 gap-lg mb-2xl">
                    {(['STUDENTS', 'PARENTS', 'BALANCES'] as const).map(type => (
                        <button
                            key={type}
                            onClick={() => { setImportType(type); setFile(null); setResult(null); }}
                            className={`group relative overflow-hidden card p-xl text-center transition-all duration-300 ${importType === type
                                ? 'border-primary-500 bg-primary-600 text-white shadow-xl shadow-primary-200 scale-105'
                                : 'hover:border-primary-200 hover:bg-primary-50/50'
                                }`}
                        >
                            {importType === type && (
                                <div className="absolute top-0 right-0 w-16 h-16 bg-white/10 rounded-full -mr-8 -mt-8 blur-lg" />
                            )}
                            <div className={`w-16 h-16 rounded-2xl mx-auto mb-lg flex items-center justify-center transition-transform group-hover:scale-110 ${importType === type ? 'bg-white/20' : 'bg-primary-50 text-primary-600'
                                }`}>
                                <FileSpreadsheet size={32} />
                            </div>
                            <div className="font-black text-lg uppercase tracking-tight">{type}</div>
                            <div className={`text-[10px] font-bold mt-sm uppercase tracking-widest ${importType === type ? 'text-white/70' : 'text-muted'}`}>
                                {type === 'STUDENTS' && 'Identity & Structure'}
                                {type === 'PARENTS' && 'Guardian Linkage'}
                                {type === 'BALANCES' && 'Financial History'}
                            </div>
                        </button>
                    ))}
                </div>

                <div className="card shadow-2xl border-neutral-100 p-2xl relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary-400 via-primary-600 to-primary-400" />

                    <div className="flex flex-col lg:flex-row gap-2xl">
                        <div className="flex-1">
                            <h3 className="text-xl font-black text-primary-900 mb-lg flex items-center gap-sm">
                                <Upload size={20} className="text-primary-600" />
                                Select {importType.toLowerCase()} sequence
                            </h3>

                            <div
                                className={`relative border-2 border-dashed rounded-3xl p-3xl text-center transition-all duration-500 min-h-[300px] flex flex-col items-center justify-center cursor-pointer ${file
                                    ? 'border-success-500 bg-success-50/30'
                                    : 'border-neutral-200 hover:border-primary-400 hover:bg-primary-50/30'
                                    }`}
                                onDragOver={(e) => e.preventDefault()}
                                onDrop={(e) => {
                                    e.preventDefault();
                                    if (e.dataTransfer.files[0]) setFile(e.dataTransfer.files[0]);
                                }}
                                onClick={() => document.getElementById('file-upload')?.click()}
                            >
                                {file ? (
                                    <div className="animate-fade-in text-center">
                                        <div className="w-20 h-20 bg-success-100 text-success-600 rounded-2xl flex items-center justify-center mx-auto mb-lg shadow-lg">
                                            <CheckCircle size={40} />
                                        </div>
                                        <div className="font-black text-xl text-primary-900 mb-xs">{file.name}</div>
                                        <div className="text-xs font-bold text-success-600 uppercase tracking-widest">
                                            {(file.size / 1024).toFixed(1)} KB • Ready for upload
                                        </div>
                                    </div>
                                ) : (
                                    <>
                                        <div className="w-20 h-20 bg-neutral-50 text-neutral-300 rounded-2xl flex items-center justify-center mx-auto mb-lg group-hover:text-primary-400 transition-colors">
                                            <Upload size={40} />
                                        </div>
                                        <div className="font-black text-xl text-primary-900 mb-xs">Drop your CSV file here</div>
                                        <div className="text-sm font-medium text-muted">Maximum file size: 10MB</div>
                                    </>
                                )}
                                <input
                                    id="file-upload"
                                    type="file"
                                    className="hidden"
                                    accept=".csv,.xlsx,.xls"
                                    onChange={handleFileChange}
                                />
                            </div>
                        </div>

                        <div className="w-full lg:w-80 flex flex-col gap-lg">
                            <div className="p-lg bg-warning-50 rounded-2xl border border-warning-100 relative overflow-hidden">
                                <div className="relative z-10">
                                    <h4 className="font-black text-warning-900 text-xs uppercase tracking-widest mb-md flex items-center gap-sm">
                                        <Download size={14} />
                                        Template Tool
                                    </h4>
                                    <p className="text-xs text-warning-800 font-medium leading-relaxed">
                                        Use our official schema to prevent mapping errors during the migration process.
                                        <a href={templates[importType]} download className="ml-1 text-warning-900 underline font-black">Download here.</a>
                                    </p>
                                </div>
                            </div>

                            <button
                                className={`btn w-full py-4 rounded-2xl font-black uppercase tracking-widest text-xs transition-all duration-300 flex items-center justify-center gap-md ${!file || isUploading
                                    ? 'bg-neutral-100 text-neutral-400 cursor-not-allowed'
                                    : 'bg-primary-600 text-white shadow-xl shadow-primary-200 hover:scale-105 active:scale-95'
                                    }`}
                                disabled={!file || isUploading}
                                onClick={handleUpload}
                            >
                                {isUploading ? (
                                    <><Loader2 className="animate-spin" size={18} /> Initializing...</>
                                ) : (
                                    <>Execute Migration Process</>
                                )}
                            </button>

                            {result && (
                                <div className={`p-lg rounded-2xl border animate-slide-up ${result.success
                                    ? 'bg-success-50 border-success-100 text-success-800 shadow-lg shadow-success-50'
                                    : 'bg-error-50 border-error-100 text-error-800 shadow-lg shadow-error-50'
                                    }`}>
                                    <div className="flex items-center gap-md mb-sm">
                                        {result.success ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
                                        <div className="font-black text-xs uppercase tracking-tight">{result.message}</div>
                                    </div>
                                    {result.details && (
                                        <div className="grid grid-cols-2 gap-sm mt-md">
                                            <div className="bg-white/50 p-xs rounded-lg text-center">
                                                <div className="text-[10px] font-black uppercase opacity-60">Success</div>
                                                <div className="font-black text-lg">{result.details.created}</div>
                                            </div>
                                            <div className="bg-white/50 p-xs rounded-lg text-center">
                                                <div className="text-[10px] font-black uppercase opacity-60">Errors</div>
                                                <div className="font-black text-lg text-error-600 tabular-nums">{result.details.errors}</div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    )
}
