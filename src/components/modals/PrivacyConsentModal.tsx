'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { AlertTriangle, CheckCircle2 } from 'lucide-react'

export function PrivacyConsentModal() {
    const { data: session, update } = useSession()
    const router = useRouter()
    const [isOpen, setIsOpen] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        // Show modal if user is logged in and hasn't accepted terms
        if (session?.user && session.user.termsAccepted === false) {
            setIsOpen(true)
        } else {
            setIsOpen(false)
        }
    }, [session])

    const handleAccept = async () => {
        try {
            setIsLoading(true)
            setError(null)
            const res = await fetch('/api/user/accept-terms', {
                method: 'POST',
            })

            const data = await res.json()

            if (!res.ok) {
                throw new Error(data.error || 'Failed to accept terms')
            }

            // Update local session
            await update({ termsAccepted: true })
            setIsOpen(false)
            router.refresh()
        } catch (err: any) {
            console.error(err)
            setError(err.message)
            setIsLoading(false)
        }
    }

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="p-6 border-b border-gray-100 flex items-center gap-3 bg-gray-50/50">
                    <div className="p-2 bg-amber-100 text-amber-600 rounded-lg">
                        <AlertTriangle className="h-6 w-6" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-gray-900">Terms of Use & Privacy Policy</h2>
                        <p className="text-sm text-gray-500 mt-1">Please read and accept to continue using PayDesk</p>
                    </div>
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto flex-1 text-sm text-gray-600 space-y-6">
                    <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">Privacy Policy</h3>
                        <p className="mb-3">
                            The personal information that you are asked to provide, and the reasons why you are asked to provide it, will be made clear to you at the point we ask you to provide your personal information.
                        </p>
                        <p>
                            If you contact us directly, we may receive additional information about you such as your name, email address, the contents of the message and/or attachments you may send us, and any other information you may choose to provide.
                        </p>
                    </div>

                    <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">How we use your information</h3>
                        <p className="mb-2">We use the information we collect in various ways, including to:</p>
                        <ul className="list-disc pl-5 space-y-1">
                            <li>Provide, operate, and maintain our service</li>
                            <li>Improve, personalize, and expand our service</li>
                            <li>Understand and analyze how you use our service</li>
                            <li>Develop new products, services, features, and functionality</li>
                            <li>Communicate with you, either directly or through one of our partners, including for customer service, to provide you with updates and other information relating to the service, and for marketing and promotional purposes</li>
                            <li>Send you emails and notifications</li>
                            <li>Find and prevent fraud</li>
                        </ul>
                    </div>

                    <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">Data Protection Act (DPA) Compliance</h3>
                        <p>
                            We are committed to handling your data securely and in accordance with the Data Protection Act of Kenya. By continuing to use this platform, you consent to our data collection and processing practices as outlined above.
                        </p>
                    </div>

                    {error && (
                        <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm border border-red-100">
                            {error}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-gray-100 bg-gray-50 flex items-center justify-between">
                    <p className="text-xs text-gray-500 max-w-[60%]">
                        You must accept these terms to continue accessing your dashboard and managing your school's data.
                    </p>
                    <button
                        onClick={handleAccept}
                        disabled={isLoading}
                        className="flex items-center gap-2 bg-brand-600 hover:bg-brand-700 text-white px-6 py-2.5 rounded-lg font-medium transition-colors focus:ring-4 focus:ring-brand-500/20 disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                        {isLoading ? (
                            <div className="h-5 w-5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                        ) : (
                            <CheckCircle2 className="h-5 w-5" />
                        )}
                        <span>{isLoading ? 'Accepting...' : 'I Agree & Continue'}</span>
                    </button>
                </div>
            </div>
        </div>
    )
}
