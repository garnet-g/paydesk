'use client'

import { useState, useEffect } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter, useParams } from 'next/navigation'

export default function SchoolLoginPage() {
    const router = useRouter()
    const { schoolCode } = useParams()
    const [school, setSchool] = useState<any>(null)
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)
    const [fetchingSchool, setFetchingSchool] = useState(true)

    useEffect(() => {
        if (schoolCode) {
            fetchSchool()
        }
    }, [schoolCode])

    const fetchSchool = async () => {
        try {
            const res = await fetch(`/api/schools/by-code/${schoolCode}`)
            if (res.ok) {
                const data = await res.json()
                setSchool(data)
            }
        } catch (err) {
            console.error('Failed to fetch school:', err)
        } finally {
            setFetchingSchool(false)
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')
        setLoading(true)

        try {
            const result = await signIn('credentials', {
                email,
                password,
                redirect: false,
            })

            if (result?.error) {
                setError('Invalid email or password')
            } else {
                router.push('/dashboard')
                router.refresh()
            }
        } catch (err) {
            setError('An error occurred. Please try again.')
        } finally {
            setLoading(false)
        }
    }

    if (fetchingSchool) {
        return (
            <div className="page-wrapper flex items-center justify-center min-h-screen">
                <div className="spinner"></div>
            </div>
        )
    }

    const schoolName = school?.name || 'PayDesk'

    return (
        <div className="min-h-screen flex items-center justify-center p-6 bg-gray-50 dark:bg-slate-950 font-inter">
            {/* Background decorative elements */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none opacity-20 dark:opacity-10">
                <div className="absolute top-[10%] left-[10%] w-[40%] h-[40%] bg-primary/20 blur-[120px] rounded-full" />
                <div className="absolute bottom-[10%] right-[10%] w-[40%] h-[40%] bg-blue-600/20 blur-[120px] rounded-full" />
            </div>

            <div className="relative z-10 w-full max-w-[440px] animate-in fade-in slide-in-from-bottom-4 duration-700">
                <div className="card rounded-[2.5rem] p-10 border-border dark:bg-card shadow-2xl flex flex-col gap-8">
                    <div className="text-center flex flex-col gap-4">
                        <div className="flex justify-center h-20 items-center">
                            {school?.logoUrl ? (
                                <img src={school.logoUrl} alt={schoolName} className="h-full object-contain" />
                            ) : (
                                <div className="h-16 w-16 bg-primary rounded-2xl flex items-center justify-center">
                                    <span className="text-white text-2xl font-bold">P</span>
                                </div>
                            )}
                        </div>
                        <div className="space-y-1">
                            <h1 className="text-2xl font-outfit font-semibold tracking-tight text-foreground">{schoolName}</h1>
                            <p className="text-muted-foreground text-sm font-medium uppercase tracking-widest opacity-60">Security Access Terminal</p>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
                        {error && (
                            <div className="bg-destructive/10 text-destructive text-xs py-3 px-4 rounded-xl border border-destructive/20 flex items-center gap-3">
                                <span className="text-sm">⚠️</span>
                                <span className="font-medium">{error}</span>
                            </div>
                        )}

                        <div className="flex flex-col gap-2">
                            <label htmlFor="email" className="text-[11px] font-black uppercase tracking-widest text-muted-foreground ml-1">Email Coordinates</label>
                            <input
                                id="email"
                                type="email"
                                className="h-14 bg-muted/5 border border-border px-5 rounded-2xl text-sm font-medium transition-all focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                                placeholder="name@example.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>

                        <div className="flex flex-col gap-2">
                            <label htmlFor="password" title="password" className="text-[11px] font-black uppercase tracking-widest text-muted-foreground ml-1">Security Key</label>
                            <input
                                id="password"
                                type="password"
                                className="h-14 bg-muted/5 border border-border px-5 rounded-2xl text-sm font-medium transition-all focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                        </div>

                        <div className="flex items-center justify-between px-1">
                            <label className="flex items-center gap-3 cursor-pointer group">
                                <input type="checkbox" className="w-4 h-4 rounded border-border text-primary focus:ring-primary transition-all" />
                                <span className="text-xs font-semibold text-muted-foreground group-hover:text-foreground transition-colors">Persistence</span>
                            </label>
                            <a href="#" className="text-xs font-semibold text-primary/80 hover:text-primary transition-colors">Credential Recovery</a>
                        </div>

                        <button
                            type="submit"
                            className="h-14 bg-primary text-primary-foreground rounded-2xl font-bold text-sm shadow-xl shadow-primary/20 hover:shadow-primary/30 active:scale-[0.98] transition-all disabled:opacity-50"
                            disabled={loading}
                        >
                            {loading ? 'AUTHENTICATING...' : 'INITIATE ACCESS'}
                        </button>
                    </form>

                    <div className="pt-8 border-t border-border/50 text-center space-y-2">
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em] opacity-40">
                            Verified Official {schoolName} Portal
                        </p>
                        {school?.phoneNumber && (
                            <p className="text-[11px] font-semibold text-muted-foreground">
                                Technical Support: {school.phoneNumber}
                            </p>
                        )}
                    </div>
                </div>

                <div className="mt-8 text-center flex flex-col items-center gap-3">
                    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.25em] opacity-30">
                        Powered by PayDesk &copy; 2026 <span className="mx-2">/</span> Core v1.0.1
                    </p>
                </div>
            </div>
        </div>
    )
}
