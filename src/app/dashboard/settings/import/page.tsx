'use client'

import { useState } from 'react'
import { Upload, FileSpreadsheet, CheckCircle, AlertCircle, ArrowLeft, Download, Loader2, ShieldCheck, Database, FileText, GraduationCap, Users } from 'lucide-react'
import DashboardLayout from '@/components/DashboardLayout'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'

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
                message: data.message || (res.ok ? 'Batch migration finalized successfully' : 'Migration protocol failure'),
                details: data.details
            })
            if (res.ok) toast.success("Data synchronization complete")
            else toast.error("Data synchronization failed")
        } catch (error) {
            setResult({
                success: false,
                message: 'A tactical connection error occurred during verification.'
            })
            toast.error("Transmission signal failure")
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
            <div className="max-w-6xl mx-auto space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
                {/* Modern Page Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
                    <div className="flex items-center gap-6">
                        <Link href="/dashboard" className="h-14 w-14 bg-white dark:bg-slate-900 rounded-[1.25rem] flex items-center justify-center text-slate-400 hover:text-blue-600 hover:border-blue-200 border border-slate-100 dark:border-slate-800 shadow-sm transition-all active:scale-95 group">
                            <ArrowLeft size={24} className="group-hover:-translate-x-1 transition-transform" />
                        </Link>
                        <div>
                            <h1 className="text-3xl font-black uppercase tracking-tighter italic text-foreground dark:text-white leading-none">
                                Data Management Hub
                            </h1>
                            <p className="text-slate-500 dark:text-slate-400 font-bold uppercase text-[10px] tracking-[0.2em] mt-2 flex items-center gap-2">
                                <Database size={12} className="text-blue-500" />
                                Enterprise-grade batch synchronization terminal
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-4 px-6 py-3 bg-blue-50 dark:bg-blue-900/10 rounded-2xl border border-blue-100 dark:border-blue-900/30">
                        <div className="h-10 w-10 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-200 dark:shadow-none">
                            <ShieldCheck size={20} />
                        </div>
                        <div>
                            <div className="text-[9px] font-black text-blue-900 dark:text-blue-400 uppercase tracking-widest leading-none mb-1">System Health</div>
                            <div className="text-xs font-black text-blue-600">OPERATIONAL READY</div>
                        </div>
                    </div>
                </div>

                {/* Import Type Selection */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {(['STUDENTS', 'PARENTS', 'BALANCES'] as const).map(type => (
                        <Card
                            key={type}
                            onClick={() => { setImportType(type); setFile(null); setResult(null); }}
                            className={cn(
                                "cursor-pointer transition-all duration-500 rounded-[2.5rem] border-none overflow-hidden group",
                                importType === type
                                    ? "bg-blue-600 text-white shadow-2xl scale-[1.02] ring-4 ring-blue-600/20"
                                    : "bg-white dark:bg-slate-950 border border-slate-100 dark:border-slate-900 shadow-lg hover:border-blue-600/30 shadow-slate-100 dark:shadow-none"
                            )}
                        >
                            <CardContent className="p-8 text-center flex flex-col items-center">
                                <div className={cn(
                                    "h-16 w-16 rounded-2xl flex items-center justify-center mb-6 transition-all duration-500",
                                    importType === type ? "bg-blue-600 text-white shadow-xl shadow-blue-500/40" : "bg-slate-50 dark:bg-slate-900 text-slate-400 group-hover:bg-blue-50 group-hover:text-blue-600"
                                )}>
                                    {type === 'STUDENTS' && <GraduationCap size={32} />}
                                    {type === 'PARENTS' && <Users size={32} />}
                                    {type === 'BALANCES' && <FileSpreadsheet size={32} />}
                                </div>
                                <h3 className="text-xl font-black uppercase italic tracking-tighter mb-1">{type}</h3>
                                <p className={cn(
                                    "text-[9px] font-black uppercase tracking-[0.2em] transition-colors",
                                    importType === type ? "text-blue-400" : "text-slate-400"
                                )}>
                                    {type === 'STUDENTS' && 'Primary Registry'}
                                    {type === 'PARENTS' && 'Guardian Mapping'}
                                    {type === 'BALANCES' && 'Financial States'}
                                </p>
                                {importType === type && (
                                    <motion.div layoutId="active-indicator" className="mt-6 h-1 w-10 bg-blue-500 rounded-full" />
                                )}
                            </CardContent>
                        </Card>
                    ))}
                </div>

                {/* Main Action Area */}
                <Card className="rounded-[2.5rem] border-none shadow-2xl bg-white dark:bg-slate-950 overflow-hidden ring-1 ring-slate-100 dark:ring-slate-900">
                    <CardHeader className="p-10 border-b border-slate-50 dark:border-slate-900">
                        <div className="flex items-center gap-4">
                            <div className="h-10 w-10 bg-white dark:bg-slate-900 rounded-xl flex items-center justify-center text-blue-600 dark:text-blue-400 border border-border dark:border-slate-800 shadow-sm">
                                <Upload size={20} />
                            </div>
                            <div>
                                <CardTitle className="text-xl font-black uppercase tracking-tighter italic">Batch Import Terminal</CardTitle>
                                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">Select source file for {importType.toLowerCase()} processing</p>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="p-10">
                        <div className="flex flex-col lg:flex-row gap-12">
                            <div className="flex-1">
                                <div
                                    className={cn(
                                        "relative border-4 border-dashed rounded-[3rem] p-12 text-center transition-all duration-500 min-h-[400px] flex flex-col items-center justify-center cursor-pointer group/drop",
                                        file
                                            ? "border-emerald-500 bg-emerald-50/20 dark:bg-emerald-900/10 shadow-xl shadow-emerald-100 dark:shadow-none"
                                            : "border-slate-100 dark:border-slate-900 bg-slate-50/50 dark:bg-slate-900/30 hover:border-blue-400 hover:bg-white dark:hover:bg-slate-900/50"
                                    )}
                                    onDragOver={(e) => e.preventDefault()}
                                    onDrop={(e) => {
                                        e.preventDefault();
                                        if (e.dataTransfer.files[0]) setFile(e.dataTransfer.files[0]);
                                    }}
                                    onClick={() => document.getElementById('file-upload')?.click()}
                                >
                                    <AnimatePresence mode="wait">
                                        {file ? (
                                            <motion.div
                                                key="file-ready"
                                                initial={{ opacity: 0, scale: 0.9 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                                className="text-center"
                                            >
                                                <div className="h-24 w-24 bg-emerald-600 text-white rounded-[2rem] flex items-center justify-center mx-auto mb-8 shadow-2xl shadow-emerald-200 dark:shadow-none scale-110">
                                                    <CheckCircle size={48} />
                                                </div>
                                                <h4 className="text-2xl font-black uppercase tracking-tight text-slate-900 dark:text-white mb-4 italic truncate max-w-sm">{file.name}</h4>
                                                <div className="flex items-center justify-center gap-3">
                                                    <Badge className="bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border-none px-4 py-1.5 rounded-xl font-black uppercase text-[10px] tracking-widest">
                                                        {(file.size / 1024).toFixed(1)} KB
                                                    </Badge>
                                                    <Badge className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 border-none px-4 py-1.5 rounded-xl font-black uppercase text-[10px] tracking-widest">
                                                        READY FOR SYNC
                                                    </Badge>
                                                </div>
                                            </motion.div>
                                        ) : (
                                            <motion.div
                                                key="empty-drop"
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                className="space-y-8"
                                            >
                                                <div className="h-24 w-24 bg-white dark:bg-slate-800 text-slate-200 dark:text-slate-700 rounded-[2rem] flex items-center justify-center mx-auto shadow-sm ring-1 ring-slate-100 dark:ring-slate-700 group-hover/drop:text-blue-600 group-hover/drop:scale-110 group-hover/drop:shadow-2xl transition-all duration-700">
                                                    <Upload size={48} />
                                                </div>
                                                <div>
                                                    <h4 className="text-2xl font-black uppercase tracking-tight italic text-slate-900 dark:text-white mb-2">Initialize Payload</h4>
                                                    <p className="text-slate-400 font-bold uppercase text-[10px] tracking-[0.2em]">Drop CSV file or click to transmit protocol</p>
                                                </div>
                                                <div className="inline-flex items-center gap-2 px-6 py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-950 rounded-full text-[9px] font-black uppercase tracking-[0.3em]">
                                                    MAX PAYLOAD: 10MB
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                    <input id="file-upload" type="file" className="hidden" accept=".csv" onChange={handleFileChange} />
                                </div>
                            </div>

                            <div className="w-full lg:w-96 space-y-8">
                                {/* Template Card */}
                                <div className="p-8 bg-blue-900 rounded-[2.5rem] text-white relative overflow-hidden group border border-blue-800 shadow-2xl">
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/20 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-blue-600/40 transition-colors" />
                                    <div className="relative z-10">
                                        <div className="h-10 w-10 bg-white/10 rounded-xl flex items-center justify-center mb-6 border border-white/5">
                                            <FileText size={20} className="text-blue-300" />
                                        </div>
                                        <h4 className="text-lg font-black uppercase italic tracking-tighter mb-3">Protocol Schema</h4>
                                        <p className="text-[10px] font-bold text-blue-300 uppercase tracking-widest leading-relaxed mb-6">
                                            Adhere to designated mapping standards to ensure data integrity during migration.
                                        </p>
                                        <Button
                                            asChild
                                            className="h-10 px-6 rounded-xl bg-white text-slate-950 hover:bg-slate-100 font-black text-[10px] uppercase tracking-[0.2em] w-full shadow-lg"
                                        >
                                            <a href={templates[importType]} download>
                                                Download Template
                                            </a>
                                        </Button>
                                    </div>
                                </div>

                                <div className="space-y-4 pt-4">
                                    <Button
                                        className={cn(
                                            "w-full h-16 rounded-2xl font-black text-[11px] uppercase tracking-[0.3em] italic gap-3 shadow-2xl transition-all active:scale-95",
                                            !file || isUploading
                                                ? "bg-slate-100 dark:bg-slate-900 text-slate-400 cursor-not-allowed shadow-none"
                                                : "bg-slate-900 hover:bg-black text-white dark:bg-white dark:text-slate-950 shadow-slate-200 dark:shadow-none"
                                        )}
                                        disabled={!file || isUploading}
                                        onClick={handleUpload}
                                    >
                                        {isUploading ? (
                                            <><Loader2 className="animate-spin" size={18} /> PROCESSING PROTOCOL...</>
                                        ) : (
                                            <><ShieldCheck size={18} /> INITIALIZE MIGRATION</>
                                        )}
                                    </Button>

                                    {result && (
                                        <motion.div
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className={cn(
                                                "p-6 rounded-[2rem] border-2",
                                                result.success
                                                    ? "bg-emerald-50/50 dark:bg-emerald-900/10 border-emerald-500/20 text-emerald-800 dark:text-emerald-400"
                                                    : "bg-red-50/50 dark:bg-red-900/10 border-red-500/20 text-red-800 dark:text-red-400"
                                            )}
                                        >
                                            <div className="flex items-center gap-3 mb-4">
                                                {result.success ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
                                                <div className="text-[10px] font-black uppercase tracking-widest leading-tight">{result.message}</div>
                                            </div>
                                            {result.details && (
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div className="bg-white/40 dark:bg-white/5 p-4 rounded-2xl border border-emerald-500/20 text-center">
                                                        <div className="text-[9px] font-black uppercase tracking-widest opacity-60 mb-1">Created</div>
                                                        <div className="text-xl font-black italic">{result.details.created}</div>
                                                    </div>
                                                    <div className="bg-white/40 dark:bg-white/5 p-4 rounded-2xl border border-red-500/20 text-center">
                                                        <div className="text-[9px] font-black uppercase tracking-widest opacity-60 mb-1">Errors</div>
                                                        <div className={cn("text-xl font-black italic", result.details.errors > 0 && "text-red-600")}>{result.details.errors}</div>
                                                    </div>
                                                </div>
                                            )}
                                        </motion.div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </DashboardLayout>
    )
}
