'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/components/AuthProvider'
import { isAdmin } from '@/lib/admin-utils'
import { createClient } from '@/lib/supabase-client'
import { Header } from '@/components/shared/Header'

interface Submission {
  id: string
  name: string
  email: string
  category: string
  url?: string
  description?: string
  message?: string
  organization?: string
  expertise?: string
  collaboration_type?: string
  status: string
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
      const supabase = createClient()
      const { data, error } = await supabase
        .from('submissions')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setSubmissions(data || [])
    } catch (err) {
      console.error('Error fetching submissions:', err)
      setError('Failed to fetch submissions')
    } finally {
      setLoading(false)
    }
  }

  const updateSubmissionStatus = async (id: string, newStatus: string) => {
    try {
      const supabase = createClient()
      const { error } = await supabase
        .from('submissions')
        .update({ status: newStatus })
        .eq('id', id)

      if (error) throw error
      
      setSubmissions(prev => 
        prev.map(sub => 
          sub.id === id ? { ...sub, status: newStatus } : sub
        )
      )
    } catch (err) {
      console.error('Error updating submission:', err)
      setError('Failed to update submission')
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
                      Contact
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
                          {submission.name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {submission.category}
                        </div>
                        {submission.url && (
                          <div className="text-sm text-blue-600 hover:text-blue-800">
                            <a href={submission.url} target="_blank" rel="noopener noreferrer">
                              {submission.url}
                            </a>
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{submission.email}</div>
                        {submission.organization && (
                          <div className="text-sm text-gray-500">{submission.organization}</div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900 max-w-xs truncate">
                          {submission.description}
                        </div>
                        {submission.expertise && (
                          <div className="text-sm text-gray-500">
                            Expertise: {submission.expertise}
                          </div>
                        )}
                        {submission.collaboration_type && (
                          <div className="text-sm text-gray-500">
                            Type: {submission.collaboration_type}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          submission.status === 'approved' 
                            ? 'bg-green-100 text-green-800'
                            : submission.status === 'rejected'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {submission.status}
                        </span>
                        <div className="text-xs text-gray-500 mt-1">
                          {new Date(submission.created_at).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => updateSubmissionStatus(submission.id, 'approved')}
                            disabled={submission.status === 'approved'}
                            className="text-green-600 hover:text-green-900 disabled:text-gray-400"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => updateSubmissionStatus(submission.id, 'rejected')}
                            disabled={submission.status === 'rejected'}
                            className="text-red-600 hover:text-red-900 disabled:text-gray-400"
                          >
                            Reject
                          </button>
                          <button
                            onClick={() => updateSubmissionStatus(submission.id, 'pending')}
                            disabled={submission.status === 'pending'}
                            className="text-yellow-600 hover:text-yellow-900 disabled:text-gray-400"
                          >
                            Pending
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