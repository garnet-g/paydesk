'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Mail, Lock, ArrowRight, ShieldCheck, HelpCircle } from 'lucide-react'

export default function LoginPage() {
    const router = useRouter()
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)

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

    return (
        <div className="relative flex min-h-screen items-center justify-center bg-gray-50/50 px-4 py-12 selection:bg-blue-100 selection:text-blue-900">
            {/* Background elements */}
            <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-[10%] -left-[10%] h-[40%] w-[40%] rounded-full bg-blue-100/30 blur-3xl"></div>
                <div className="absolute -bottom-[10%] -right-[10%] h-[40%] w-[40%] rounded-full bg-indigo-100/30 blur-3xl"></div>
            </div>

            <div className="relative z-10 w-full max-w-[440px] animate-fade-in">
                <div className="mb-10 text-center">
                    <div className="mx-auto mb-6 flex h-[72px] w-[72px] items-center justify-center rounded-2xl bg-white shadow-xl shadow-gray-200/50 ring-1 ring-gray-100">
                        <img
                            src="/paydesk-logo.png"
                            alt="PayDesk"
                            className="h-10 w-10 object-contain"
                        />
                    </div>
                    <h1 className="text-3xl font-extrabold tracking-tight text-[#030213] md:text-4xl">
                        Welcome back
                    </h1>
                    <p className="mt-3 text-sm font-medium text-gray-500">
                        Please enter your details to sign in
                    </p>
                </div>

                <div className="rounded-[2.5rem] border border-gray-200 bg-white p-10 shadow-2xl shadow-gray-200/60 dark:border-white/10 dark:bg-card">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {error && (
                            <div className="flex items-center gap-2 rounded-xl border border-red-100 bg-red-50 p-4 text-xs font-bold text-red-600 animate-slide-down">
                                <ShieldCheck size={16} />
                                {error}
                            </div>
                        )}

                        <div className="space-y-2">
                            <label className="text-xs font-bold uppercase tracking-widest text-gray-500 ml-1">
                                Email Address
                            </label>
                            <div className="relative group">
                                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 transition-colors group-focus-within:text-blue-600">
                                    <Mail size={18} />
                                </div>
                                <input
                                    type="email"
                                    className="w-full rounded-2xl border border-gray-200 bg-gray-50/50 py-4 pl-12 pr-4 text-sm font-medium transition-all focus:border-blue-600/50 focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-600/5"
                                    placeholder="principal@academy.edu"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    autoComplete="email"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <div className="flex items-center justify-between ml-1">
                                <label className="text-xs font-bold uppercase tracking-widest text-gray-500">
                                    Password
                                </label>
                                <a href="#" className="text-[10px] font-bold uppercase tracking-widest text-blue-600 hover:text-blue-700 transition-colors">
                                    Forgot?
                                </a>
                            </div>
                            <div className="relative group">
                                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 transition-colors group-focus-within:text-blue-600">
                                    <Lock size={18} />
                                </div>
                                <input
                                    type="password"
                                    className="w-full rounded-2xl border border-gray-200 bg-gray-50/50 py-4 pl-12 pr-4 text-sm font-medium transition-all focus:border-blue-600/50 focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-600/5"
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    autoComplete="current-password"
                                />
                            </div>
                        </div>

                        <div className="flex items-center gap-3 py-1">
                            <div className="flex h-5 items-center">
                                <input
                                    id="remember"
                                    type="checkbox"
                                    className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-600"
                                />
                            </div>
                            <label htmlFor="remember" className="text-xs font-semibold text-gray-500 cursor-pointer select-none">
                                Keep me signed in
                            </label>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="group relative flex w-full items-center justify-center overflow-hidden rounded-2xl bg-[#030213] py-4 text-sm font-bold text-white shadow-xl transition-all hover:bg-black active:scale-[0.98] disabled:opacity-70"
                        >
                            <span className="relative z-10 flex items-center gap-2">
                                {loading ? (
                                    <>
                                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white"></div>
                                        Authenticating...
                                    </>
                                ) : (
                                    <>
                                        Sign in to PayDesk
                                        <ArrowRight size={18} className="transition-transform group-hover:translate-x-1" />
                                    </>
                                )}
                            </span>
                        </button>
                    </form>

                    <div className="mt-10 flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-widest text-gray-400 border-t border-gray-100 pt-8">
                        <HelpCircle size={14} />
                        <span>System Admin Support</span>
                    </div>
                </div>

                <div className="mt-12 text-center text-[10px] font-bold uppercase tracking-[0.4em] text-gray-400">
                    © 2026 PayDesk Global Technologies • v1.2.0
                </div>
            </div>
        </div>
    )
}
