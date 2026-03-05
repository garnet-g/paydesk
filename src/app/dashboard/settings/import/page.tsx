'use client'

import { useState } from 'react'
import { Upload, FileSpreadsheet, CheckCircle, AlertCircle, ArrowLeft, Download, Loader2 } from 'lucide-react'
import DashboardLayout from '@/components/DashboardLayout'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

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
                            <h2 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: 'var(--spacing-xs)', color: 'var(--primary-900)' }}>Data Management Hub</h2>
                            <p className="text-muted-foreground font-medium">Bulk import your school data with precision</p>
                        </div>
                    </div>
                    <div className="hidden md:flex items-center gap-md px-lg py-md bg-primary-50 rounded-2xl border border-primary-100/50">
                        <div className="p-sm bg-primary-100 text-primary-600 rounded-xl">
                            <FileSpreadsheet size={20} />
                        </div>
                        <div className="text-xs">
                            <div className="font-semibold text-primary-900  tracking-tight">System Health</div>
                            <div className="text-primary-600 font-bold ">Ready for processing</div>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-xl mb-2xl">
                    {(['STUDENTS', 'PARENTS', 'BALANCES'] as const).map(type => (
                        <button
                            key={type}
                            onClick={() => { setImportType(type); setFile(null); setResult(null); }}
                            className={cn(
                                "group relative overflow-hidden p-xl text-center transition-all duration-500 rounded-[2rem] border-2",
                                importType === type
                                    ? "bg-white border-primary-500 shadow-2xl shadow-primary-200/50 scale-[1.02]"
                                    : "bg-white/50 border-transparent hover:border-neutral-200 hover:bg-white shadow-sm"
                            )}
                        >
                            <div className={cn(
                                "w-16 h-16 rounded-2xl mx-auto mb-lg flex items-center justify-center transition-all duration-500",
                                importType === type
                                    ? "bg-primary-600 text-white shadow-lg shadow-primary-200 scale-110"
                                    : "bg-neutral-100 text-neutral-400 group-hover:bg-primary-50 group-hover:text-primary-600"
                            )}>
                                <FileSpreadsheet size={32} />
                            </div>
                            <div className={cn(
                                "font-bold text-lg tracking-tight transition-colors",
                                importType === type ? "text-primary-900" : "text-neutral-500"
                            )}>{type}</div>
                            <div className={cn(
                                "text-[10px] font-black uppercase tracking-widest mt-sm transition-colors",
                                importType === type ? "text-primary-600" : "text-neutral-400"
                            )}>
                                {type === 'STUDENTS' && 'Student Records'}
                                {type === 'PARENTS' && 'Guardian Links'}
                                {type === 'BALANCES' && 'Fee Balances'}
                            </div>

                            {importType === type && (
                                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-12 h-1 bg-primary-600 rounded-t-full" />
                            )}
                        </button>
                    ))}
                </div>

                <div className="card shadow-2xl border-neutral-100 p-2xl relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary-400 via-primary-600 to-primary-400" />

                    <div className="flex flex-col lg:flex-row gap-2xl">
                        <div className="flex-1">
                            <h3 className="text-xl font-semibold text-primary-900 mb-lg flex items-center gap-sm">
                                <Upload size={20} className="text-primary-600" />
                                Select your {importType.toLowerCase()} file
                            </h3>

                            <div
                                className={cn(
                                    "relative border-2 border-dashed rounded-[2.5rem] p-3xl text-center transition-all duration-500 min-h-[350px] flex flex-col items-center justify-center cursor-pointer group/drop",
                                    file
                                        ? "border-success-500 bg-success-50/20 shadow-xl shadow-success-100/50"
                                        : "border-neutral-200 bg-neutral-50/50 hover:border-primary-400 hover:bg-white hover:shadow-2xl hover:shadow-primary-100/50"
                                )}
                                onDragOver={(e) => e.preventDefault()}
                                onDrop={(e) => {
                                    e.preventDefault();
                                    if (e.dataTransfer.files[0]) setFile(e.dataTransfer.files[0]);
                                }}
                                onClick={() => document.getElementById('file-upload')?.click()}
                            >
                                {file ? (
                                    <div className="animate-in zoom-in-95 duration-500 text-center">
                                        <div className="w-24 h-24 bg-success-600 text-white rounded-[2rem] flex items-center justify-center mx-auto mb-lg shadow-2xl shadow-success-200 scale-110">
                                            <CheckCircle size={48} />
                                        </div>
                                        <div className="font-bold text-2xl text-neutral-900 mb-xs">{file.name}</div>
                                        <div className="flex items-center justify-center gap-md">
                                            <Badge variant="outline" className="bg-success-50 text-success-700 border-success-200 px-4 py-1.5 rounded-full font-bold uppercase text-[10px] tracking-widest">
                                                {(file.size / 1024).toFixed(1)} KB
                                            </Badge>
                                            <Badge variant="outline" className="bg-success-50 text-success-700 border-success-200 px-4 py-1.5 rounded-full font-bold uppercase text-[10px] tracking-widest">
                                                Ready for upload
                                            </Badge>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="space-y-6">
                                        <div className="w-24 h-24 bg-white text-neutral-300 rounded-[2rem] flex items-center justify-center mx-auto shadow-sm ring-1 ring-neutral-100 group-hover/drop:text-primary-600 group-hover/drop:scale-110 group-hover/drop:shadow-2xl group-hover/drop:shadow-primary-200 transition-all duration-700">
                                            <Upload size={48} />
                                        </div>
                                        <div>
                                            <div className="font-bold text-2xl text-neutral-900 mb-xs">Drop your CSV file here</div>
                                            <div className="text-neutral-500 font-medium">Click to browse or drag and drop your file</div>
                                        </div>
                                        <div className="inline-flex items-center gap-sm px-4 py-2 bg-neutral-100 text-neutral-500 rounded-full text-[10px] font-black uppercase tracking-widest">
                                            Maximum file size: 10MB
                                        </div>
                                    </div>
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
                                    <h4 className="font-semibold text-warning-900 text-xs   mb-md flex items-center gap-sm">
                                        <Download size={14} />
                                        Template Tool
                                    </h4>
                                    <p className="text-xs text-warning-800 font-medium leading-relaxed">
                                        Use our official schema to prevent mapping errors during the migration process.
                                        <a href={templates[importType]} download className="ml-1 text-warning-900 underline font-semibold">Download here.</a>
                                    </p>
                                </div>
                            </div>

                            <Button
                                className={`btn w-full py-4 rounded-2xl font-semibold   text-xs transition-all duration-300 flex items-center justify-center gap-md ${!file || isUploading
                                    ? 'bg-neutral-100 text-neutral-400 cursor-not-allowed'
                                    : 'bg-primary-600 text-white shadow-xl shadow-primary-200 hover:scale-105 active:scale-95'
                                    }`}
                                disabled={!file || isUploading}
                                onClick={handleUpload}
                            >
                                {isUploading ? (
                                    <><Loader2 className="animate-spin" size={18} /> Processing...</>
                                ) : (
                                    <>Start Data Import</>
                                )}
                            </Button>

                            {result && (
                                <div className={`p-lg rounded-2xl border animate-slide-up ${result.success
                                    ? 'bg-success-50 border-success-100 text-success-800 shadow-lg shadow-success-50'
                                    : 'bg-error-50 border-error-100 text-error-800 shadow-lg shadow-error-50'
                                    }`}>
                                    <div className="flex items-center gap-md mb-sm">
                                        {result.success ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
                                        <div className="font-semibold text-xs  tracking-tight">{result.message}</div>
                                    </div>
                                    {result.details && (
                                        <div className="grid grid-cols-2 gap-sm mt-md">
                                            <div className="bg-white/50 p-xs rounded-lg text-center">
                                                <div className="text-[10px] font-semibold  opacity-60">Success</div>
                                                <div className="font-semibold text-lg">{result.details.created}</div>
                                            </div>
                                            <div className="bg-white/50 p-xs rounded-lg text-center">
                                                <div className="text-[10px] font-semibold  opacity-60">Errors</div>
                                                <div className="font-semibold text-lg text-error-600 tabular-nums">{result.details.errors}</div>
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
