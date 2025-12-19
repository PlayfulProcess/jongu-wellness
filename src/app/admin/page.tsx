'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/components/AuthProvider'
import { isAdmin } from '@/lib/admin-utils'
import { Header } from '@/components/shared/Header'
import { SubmissionCard } from '@/components/community/SubmissionCard'
import { SubmitToolModal } from '@/components/modals/SubmitToolModal'

interface Submission {
  id: string
  title: string
  claude_url: string
  category: string
  description: string
  creator_name: string
  creator_link?: string
  creator_background?: string
  thumbnail_url?: string
  submitter_ip?: string
  submitter_email?: string | null
  channel_slug?: string
  reviewed: boolean
  approved: boolean
  created_at: string
}

export default function AdminPage() {
  const { user, status } = useAuth()
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Edit modal state
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingSubmission, setEditingSubmission] = useState<Submission | null>(null)

  useEffect(() => {
    if (status === 'authenticated' && user && isAdmin(user.email || '')) {
      fetchSubmissions()
    } else if (status === 'unauthenticated') {
      setLoading(false)
    }
  }, [status, user])

  const fetchSubmissions = async () => {
    try {
      const response = await fetch('/api/admin/submissions')
      if (!response.ok) throw new Error('Failed to fetch submissions')
      
      const data = await response.json()
      setSubmissions(data || [])
    } catch (err) {
      console.error('Error fetching submissions:', err)
      setError('Failed to fetch submissions')
    } finally {
      setLoading(false)
    }
  }

  const approveSubmission = async (submissionId: string) => {
    try {
      const response = await fetch('/api/admin/submissions/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ submissionId })
      })

      if (response.ok) {
        fetchSubmissions() // Refresh data
      } else {
        const errorData = await response.json()
        setError(`Failed to approve submission: ${errorData.error}`)
      }
    } catch (err) {
      console.error('Error approving submission:', err)
      setError('Error approving submission')
    }
  }

  const rejectSubmission = async (submissionId: string) => {
    try {
      const response = await fetch('/api/admin/submissions/reject', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ submissionId })
      })

      if (response.ok) {
        fetchSubmissions() // Refresh data
      } else {
        const errorData = await response.json()
        setError(`Failed to reject submission: ${errorData.error}`)
      }
    } catch (err) {
      console.error('Error rejecting submission:', err)
      setError('Error rejecting submission')
    }
  }

  const handleEditSubmission = (submission: Submission | any) => {
    setEditingSubmission(submission)
    setShowEditModal(true)
  }

  if (status === 'loading') {
    return (
      <main className="min-h-screen bg-gray-50 py-8 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </main>
    )
  }

  if (!user || !isAdmin(user.email || '')) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main className="max-w-4xl mx-auto px-4 py-16 text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Access Denied</h1>
          <p className="text-gray-600">You don&apos;t have permission to access this page.</p>
        </main>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main className="max-w-7xl mx-auto px-4 py-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading submissions...</p>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Admin Dashboard</h1>
          <p className="text-gray-600">Manage tool submissions and community content</p>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        <div className="mb-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold text-gray-900">
              Tool Submissions ({submissions.length})
            </h2>
          </div>
        </div>

        {submissions.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No submissions yet</h3>
            <p className="mt-1 text-sm text-gray-500">Submissions will appear here for review.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {submissions.map((submission) => (
              <SubmissionCard
                key={submission.id}
                submission={{
                  id: submission.id,
                  name: submission.title,
                  title: submission.title,
                  url: submission.claude_url,
                  claude_url: submission.claude_url,
                  category: Array.isArray(submission.category)
                    ? submission.category
                    : (typeof submission.category === 'string' ? [submission.category] : []),
                  description: submission.description,
                  creator_name: submission.creator_name,
                  creator_link: submission.creator_link,
                  thumbnail_url: submission.thumbnail_url,
                  submitter_email: submission.submitter_email,
                  channel_slug: submission.channel_slug,
                  created_at: submission.created_at,
                  approved: submission.approved,
                  reviewed: submission.reviewed
                }}
                onApprove={approveSubmission}
                onReject={rejectSubmission}
                onEdit={handleEditSubmission}
                showAdminActions={true}
              />
            ))}
          </div>
        )}
      </main>

      {/* Edit Modal */}
      {showEditModal && editingSubmission && (
        <SubmitToolModal
          isOpen={showEditModal}
          onClose={() => {
            setShowEditModal(false)
            setEditingSubmission(null)
          }}
          channelSlug={editingSubmission.channel_slug || 'wellness'}
          editMode={true}
          editToolId={editingSubmission.id}
          prefilledData={{
            url: editingSubmission.claude_url,
            title: editingSubmission.title,
            description: editingSubmission.description,
            creator_name: editingSubmission.creator_name,
            creator_link: editingSubmission.creator_link || '',
            thumbnail_url: editingSubmission.thumbnail_url || null,
            hashtags: Array.isArray(editingSubmission.category) ? editingSubmission.category : [editingSubmission.category]
          }}
        />
      )}
    </div>
  )
}