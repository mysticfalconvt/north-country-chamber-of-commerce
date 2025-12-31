'use client'

import React, { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

interface EventApplicationFormProps {
  eventId: string
  eventName: string
  locale: 'en' | 'fr'
}

export function EventApplicationForm({ eventId, locale }: EventApplicationFormProps) {
  const [formData, setFormData] = useState({
    applicantName: '',
    applicantEmail: '',
    applicantPhone: '',
    category: '',
    details: '',
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle')

  const translations = {
    en: {
      title: 'Apply Now',
      applicantName: 'Name',
      applicantEmail: 'Email',
      applicantPhone: 'Phone',
      category: 'Entry Category',
      categoryPlaceholder: 'e.g., Hot Rod, Chili, Vendor',
      details: 'Application Details',
      detailsPlaceholder: 'Tell us about your entry...',
      submit: 'Submit Application',
      submitting: 'Submitting...',
      success:
        'Application submitted successfully! We will review your submission and contact you soon.',
      error: 'There was an error submitting your application. Please try again.',
      requiredFields: 'All fields are required',
    },
    fr: {
      title: 'Postuler maintenant',
      applicantName: 'Nom',
      applicantEmail: 'Courriel',
      applicantPhone: 'Téléphone',
      category: "Catégorie d'entrée",
      categoryPlaceholder: 'par ex., Hot Rod, Chili, Vendeur',
      details: 'Détails de la candidature',
      detailsPlaceholder: 'Parlez-nous de votre candidature...',
      submit: 'Soumettre la candidature',
      submitting: 'Soumission...',
      success:
        'Candidature soumise avec succès ! Nous examinerons votre soumission et vous contacterons bientôt.',
      error:
        "Une erreur s'est produite lors de la soumission de votre candidature. Veuillez réessayer.",
      requiredFields: 'Tous les champs sont obligatoires',
    },
  }

  const t = translations[locale]

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setSubmitStatus('idle')

    // Validate required fields
    if (
      !formData.applicantName ||
      !formData.applicantEmail ||
      !formData.applicantPhone ||
      !formData.details
    ) {
      alert(t.requiredFields)
      setIsSubmitting(false)
      return
    }

    try {
      const response = await fetch('/api/event-applications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          event: eventId,
          ...formData,
          details: {
            root: {
              type: 'root',
              children: [
                {
                  type: 'paragraph',
                  children: [
                    {
                      type: 'text',
                      text: formData.details,
                    },
                  ],
                },
              ],
            },
          },
          status: 'pending',
          submittedDate: new Date().toISOString(),
        }),
      })

      if (response.ok) {
        setSubmitStatus('success')
        setFormData({
          applicantName: '',
          applicantEmail: '',
          applicantPhone: '',
          category: '',
          details: '',
        })
      } else {
        setSubmitStatus('error')
      }
    } catch (error) {
      console.error('Error submitting application:', error)
      setSubmitStatus('error')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Card className="p-6">
      <h2 className="text-2xl font-semibold mb-6">{t.title}</h2>

      {submitStatus === 'success' && (
        <div className="mb-6 p-4 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg">
          <p className="text-green-800 dark:text-green-200">{t.success}</p>
        </div>
      )}

      {submitStatus === 'error' && (
        <div className="mb-6 p-4 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="text-red-800 dark:text-red-200">{t.error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <label htmlFor="applicantName" className="text-sm font-medium">
            {t.applicantName} *
          </label>
          <input
            id="applicantName"
            type="text"
            required
            value={formData.applicantName}
            onChange={(e) => setFormData({ ...formData, applicantName: e.target.value })}
            className="w-full px-4 py-2 border rounded-lg bg-background text-foreground"
          />
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <div className="space-y-2">
            <label htmlFor="applicantEmail" className="text-sm font-medium">
              {t.applicantEmail} *
            </label>
            <input
              id="applicantEmail"
              type="email"
              required
              value={formData.applicantEmail}
              onChange={(e) => setFormData({ ...formData, applicantEmail: e.target.value })}
              className="w-full px-4 py-2 border rounded-lg bg-background text-foreground"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="applicantPhone" className="text-sm font-medium">
              {t.applicantPhone} *
            </label>
            <input
              id="applicantPhone"
              type="tel"
              required
              value={formData.applicantPhone}
              onChange={(e) => setFormData({ ...formData, applicantPhone: e.target.value })}
              className="w-full px-4 py-2 border rounded-lg bg-background text-foreground"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label htmlFor="category" className="text-sm font-medium">
            {t.category}
          </label>
          <input
            id="category"
            type="text"
            placeholder={t.categoryPlaceholder}
            value={formData.category}
            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
            className="w-full px-4 py-2 border rounded-lg bg-background text-foreground"
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="details" className="text-sm font-medium">
            {t.details} *
          </label>
          <textarea
            id="details"
            required
            rows={6}
            placeholder={t.detailsPlaceholder}
            value={formData.details}
            onChange={(e) => setFormData({ ...formData, details: e.target.value })}
            className="w-full px-4 py-2 border rounded-lg bg-background text-foreground resize-none"
          />
        </div>

        <Button type="submit" disabled={isSubmitting} className="w-full">
          {isSubmitting ? t.submitting : t.submit}
        </Button>
      </form>
    </Card>
  )
}
