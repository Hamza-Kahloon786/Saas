// frontend/src/pages/admin/AIBookings.tsx - SIMPLIFIED VERSION

import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { 
  CalendarIcon, 
  ClockIcon, 
  MapPinIcon, 
  CurrencyDollarIcon,
  UserIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'
import { api } from '../../services/api'

interface AIBooking {
  _id: string
  id?: string
  title: string
  customer_name: string
  customer_email: string
  customer_phone: string
  service_type: string
  location: string
  estimated_price: number
  scheduled_date: string | null
  scheduled_time: string
  frequency: string
  status: string
  priority: string
  created_at: string
  description: string
  ai_session_id: string
  notes: Array<{
    content: string
    created_at: string
    created_by: string
  }>
}

interface AIBookingsResponse {
  ai_bookings: AIBooking[]
  total: number
  page: number
  pages: number
}

export const AIBookings: React.FC = () => {
  const [selectedBooking, setSelectedBooking] = useState<AIBooking | null>(null)
  const [confirmationNotes, setConfirmationNotes] = useState('')
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const queryClient = useQueryClient()

  // Get AI bookings
  const { data: bookingsData, isLoading, error } = useQuery<AIBookingsResponse>({
    queryKey: ['ai-bookings'],
    queryFn: async () => {
      const response = await api.get('/jobs/ai-bookings')
      return response.data
    },
    refetchInterval: 30000
  })

  // Confirm booking mutation with customer notification feedback
  const confirmBookingMutation = useMutation({
    mutationFn: async ({ bookingId, notes }: { bookingId: string, notes: string }) => {
      const response = await api.patch(`/jobs/ai-bookings/${bookingId}/confirm?notes=${encodeURIComponent(notes)}`)
      return response.data
    },
    onSuccess: (data) => {
      if (data.email_sent) {
        toast.success(`Booking confirmed and customer notified via email!`, {
          duration: 4000,
        })
      } else {
        toast.success('Booking confirmed successfully!', {
          duration: 4000,
        })
        if (data.customer_email) {
          toast.error('Failed to send notification email to customer', {
            duration: 3000,
          })
        } else {
          toast('No customer email available for notification', {
            duration: 3000,
            icon: '⚠️'
          })
        }
      }
      queryClient.invalidateQueries(['ai-bookings'])
      setShowConfirmModal(false)
      setSelectedBooking(null)
      setConfirmationNotes('')
    },
    onError: (error: any) => {
      console.error('Confirm booking error:', error)
      toast.error('Failed to confirm booking')
    }
  })

  const handleConfirmBooking = (booking: AIBooking) => {
    setSelectedBooking(booking)
    setShowConfirmModal(true)
  }

  const submitConfirmation = () => {
    if (!selectedBooking) return
    
    const bookingId = selectedBooking._id || selectedBooking.id
    if (!bookingId) {
      toast.error('Invalid booking ID')
      return
    }

    confirmBookingMutation.mutate({
      bookingId,
      notes: confirmationNotes
    })
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-4">
        <div className="flex">
          <ExclamationTriangleIcon className="h-5 w-5 text-red-400" />
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">Error Loading AI Bookings</h3>
            <p className="mt-1 text-sm text-red-700">
              Unable to load AI chatbot bookings. Please try refreshing the page.
            </p>
          </div>
        </div>
      </div>
    )
  }

  const bookings = bookingsData?.ai_bookings || []

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-2xl font-semibold text-gray-900">AI Chatbot Bookings</h1>
          <p className="mt-2 text-sm text-gray-700">
            Bookings created automatically by the AI chatbot assistant. Review and confirm new bookings.
          </p>
        </div>
        <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
          <span className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white">
            🤖 Total AI Bookings: {bookingsData?.total || 0}
          </span>
        </div>
      </div>

      {/* Bookings List */}
      {bookings.length === 0 ? (
        <div className="text-center py-12">
          <CalendarIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No AI bookings yet</h3>
          <p className="mt-1 text-sm text-gray-500">
            When customers book through the AI chatbot, they'll appear here.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {bookings.map((booking) => {
            const bookingId = booking._id || booking.id
            return (
              <div
                key={bookingId}
                className={`bg-white shadow rounded-lg p-6 border-l-4 ${
                  booking.status === 'scheduled' 
                    ? 'border-l-yellow-400' 
                    : booking.status === 'confirmed'
                    ? 'border-l-green-400'
                    : 'border-l-blue-400'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    {/* Booking Header */}
                    <div className="flex items-center space-x-3">
                      <h3 className="text-lg font-medium text-gray-900">
                        {booking.service_type}
                      </h3>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        booking.status === 'scheduled' 
                          ? 'bg-yellow-100 text-yellow-800' 
                          : booking.status === 'confirmed'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}>
                        {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                      </span>
                      {booking.frequency !== 'one-time' && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                          {booking.frequency}
                        </span>
                      )}
                    </div>

                    {/* Customer Info */}
                    <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <div className="flex items-center text-sm text-gray-600">
                          <UserIcon className="h-4 w-4 mr-2" />
                          <span className="font-medium">{booking.customer_name || 'Name not provided'}</span>
                        </div>
                        {booking.customer_email && (
                          <div className="flex items-center text-sm text-gray-600">
                            <span className="ml-6">📧 {booking.customer_email}</span>
                          </div>
                        )}
                        {booking.customer_phone && (
                          <div className="flex items-center text-sm text-gray-600">
                            <span className="ml-6">📱 {booking.customer_phone}</span>
                          </div>
                        )}
                      </div>

                      <div className="space-y-2">
                        {booking.location && (
                          <div className="flex items-center text-sm text-gray-600">
                            <MapPinIcon className="h-4 w-4 mr-2" />
                            <span>{booking.location}</span>
                          </div>
                        )}
                        {booking.scheduled_time && (
                          <div className="flex items-center text-sm text-gray-600">
                            <ClockIcon className="h-4 w-4 mr-2" />
                            <span>{booking.scheduled_time}</span>
                          </div>
                        )}
                        {booking.estimated_price > 0 && (
                          <div className="flex items-center text-sm text-gray-600">
                            <CurrencyDollarIcon className="h-4 w-4 mr-2" />
                            <span>PKR {booking.estimated_price.toLocaleString()}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Description */}
                    {booking.description && (
                      <div className="mt-3">
                        <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded">
                          {booking.description}
                        </p>
                      </div>
                    )}

                    {/* Booking Details */}
                    <div className="mt-3 text-xs text-gray-500">
                      <span>Created: {new Date(booking.created_at).toLocaleString()}</span>
                      <span className="mx-2">•</span>
                      <span>Source: AI Chatbot</span>
                      <span className="mx-2">•</span>
                      <span>Session: {booking.ai_session_id.slice(-8)}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="ml-4 flex-shrink-0">
                    {booking.status === 'scheduled' && (
                      <button
                        onClick={() => handleConfirmBooking(booking)}
                        className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                      >
                        <CheckCircleIcon className="h-4 w-4 mr-1" />
                        Confirm
                      </button>
                    )}
                    {booking.status === 'confirmed' && (
                      <span className="inline-flex items-center px-3 py-2 text-sm font-medium text-green-700 bg-green-100 rounded-md">
                        <CheckCircleIcon className="h-4 w-4 mr-1" />
                        Confirmed
                      </span>
                    )}
                  </div>
                </div>

                {/* Notes */}
                {booking.notes && booking.notes.length > 0 && (
                  <div className="mt-4 border-t pt-4">
                    <h4 className="text-sm font-medium text-gray-900">Notes:</h4>
                    <div className="mt-2 space-y-1">
                      {booking.notes.map((note, index) => (
                        <div key={index} className="text-sm text-gray-600">
                          <span className="font-medium">{note.created_by}:</span> {note.content}
                          <span className="text-xs text-gray-400 ml-2">
                            ({new Date(note.created_at).toLocaleString()})
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Confirmation Modal */}
      {showConfirmModal && selectedBooking && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Confirm AI Booking
              </h3>
              
              <div className="mb-4 p-4 bg-gray-50 rounded">
                <h4 className="font-medium">{selectedBooking.service_type}</h4>
                <p className="text-sm text-gray-600">Customer: {selectedBooking.customer_name}</p>
                <p className="text-sm text-gray-600">Email: {selectedBooking.customer_email}</p>
                <p className="text-sm text-gray-600">Location: {selectedBooking.location}</p>
                <p className="text-sm text-gray-600">Time: {selectedBooking.scheduled_time}</p>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Confirmation Notes (Optional)
                </label>
                <textarea
                  value={confirmationNotes}
                  onChange={(e) => setConfirmationNotes(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Add any notes about this booking confirmation..."
                />
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setShowConfirmModal(false)
                    setSelectedBooking(null)
                    setConfirmationNotes('')
                  }}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
                >
                  Cancel
                </button>
                <button
                  onClick={submitConfirmation}
                  disabled={confirmBookingMutation.isLoading}
                  className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 disabled:opacity-50"
                >
                  {confirmBookingMutation.isLoading ? 'Confirming...' : 'Confirm Booking'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AIBookings