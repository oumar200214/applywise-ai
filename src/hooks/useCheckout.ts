import { useState } from 'react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import type { PlanKey } from '@/lib/dodo'

export function useCheckout() {
  const [isProcessing, setIsProcessing] = useState(false)
  const router = useRouter()

  const startCheckout = async (planKey: PlanKey) => {
    setIsProcessing(true)
    const loadingToast = toast.loading('Redirection vers le paiement sécurisé...')

    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planKey }),
      })

      const data = await res.json()

      if (!res.ok) {
        if (res.status === 401) {
          toast.dismiss(loadingToast)
          // Redirect to login if unauthenticated
          router.push('/auth?redirect=/pricing')
          return
        }
        throw new Error(data.error || 'Une erreur est survenue')
      }

      if (data.payment_link) {
        toast.success('Redirection en cours...', { id: loadingToast })
        // Redirect to Dodo hosted checkout page
        window.location.href = data.payment_link
      } else {
        throw new Error('Lien de paiement manquant')
      }
    } catch (err) {
      console.error('Checkout error:', err)
      toast.error(err instanceof Error ? err.message : 'Erreur de paiement', {
        id: loadingToast,
      })
    } finally {
      setIsProcessing(false)
    }
  }

  return { startCheckout, isProcessing }
}
