'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/components/AuthProvider'
import { isAdmin, getSubmissionStatus } from '@/lib/admin-utils'
import { createClient } from '@/lib/supabase-client'
import { Header } from '@/components/shared/Header'

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
  reviewed: boolean
  approved: boolean
  created_at: string
}

export default function AdminPage() {
  const { user, status } = useAuth()
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

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
        <Header showAuthModal={() => {}} showCreateChannelModal={() => {}} />
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
        <Header showAuthModal={() => {}} showCreateChannelModal={() => {}} />
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
      <Header showAuthModal={() => {}} showCreateChannelModal={() => {}} />
      
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

        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">
              Tool Submissions ({submissions.length})
            </h2>
          </div>

          {submissions.length === 0 ? (
            <div className="p-6 text-center text-gray-500">
              No submissions yet.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Submission
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Creator
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Details
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {submissions.map((submission) => (
                    <tr key={submission.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {submission.title}
                        </div>
                        <div className="text-sm text-gray-500">
                          {submission.category}
                        </div>
                        {submission.claude_url && (
                          <div className="text-sm text-blue-600 hover:text-blue-800">
                            <a href={submission.claude_url} target="_blank" rel="noopener noreferrer">
                              {submission.claude_url}
                            </a>
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{submission.creator_name}</div>
                        {submission.creator_link && (
                          <div className="text-sm text-blue-600 hover:text-blue-800">
                            <a href={submission.creator_link} target="_blank" rel="noopener noreferrer">
                              Creator Link
                            </a>
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900 max-w-xs truncate">
                          {submission.description}
                        </div>
                        {submission.creator_background && (
                          <div className="text-sm text-gray-500">
                            Background: {submission.creator_background}
                          </div>
                        )}
                        {submission.thumbnail_url && (
                          <div className="text-sm text-gray-500">
                            📸 Has image
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getSubmissionStatus(submission.approved, submission.reviewed).colorClass}`}>
                          {getSubmissionStatus(submission.approved, submission.reviewed).label}
                        </span>
                        <div className="text-xs text-gray-500 mt-1">
                          {new Date(submission.created_at).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => approveSubmission(submission.id)}
                            disabled={submission.approved && submission.reviewed}
                            className="text-green-600 hover:text-green-900 disabled:text-gray-400"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => rejectSubmission(submission.id)}
                            disabled={submission.reviewed && !submission.approved}
                            className="text-red-600 hover:text-red-900 disabled:text-gray-400"
                          >
                            Reject
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}