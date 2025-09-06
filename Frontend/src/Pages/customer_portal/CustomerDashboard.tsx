

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  CalendarIcon,
  ClockIcon,
  DocumentTextIcon,
  CreditCardIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  PhoneIcon,
  EnvelopeIcon,
  MapPinIcon,
  BellIcon,
  Cog6ToothIcon,
  StarIcon,
  PlusIcon,
  EyeIcon,
  ChartBarIcon,
  WrenchScrewdriverIcon,
  ChatBubbleLeftRightIcon,
  XMarkIcon
} from '@heroicons/react/24/outline'
import { api } from '../../services/api'
import ChatbotWidget from '../../components/chatbot/ChatbotWidget'

// Modal Components
function ServiceRequestModal({ onClose }) {
  const [step, setStep] = useState(1)
  const [formData, setFormData] = useState({
    service_type: '',
    priority: 'medium',
    description: '',
    location: '',
    preferred_date: '',
    preferred_time: ''
  })

  const serviceTypes = [
    { value: 'hvac_repair', label: 'HVAC Repair', icon: '🔧' },
    { value: 'plumbing', label: 'Plumbing', icon: '🔧' },
    { value: 'electrical', label: 'Electrical', icon: '⚡' },
    { value: 'cleaning', label: 'Cleaning', icon: '🧹' },
    { value: 'other', label: 'Other', icon: '📋' }
  ]

  const handleSubmit = async () => {
    try {
      const response = await api.post('/customer-portal/service-requests', formData)
      alert('Service request submitted successfully!')
      onClose()
    } catch (error) {
      alert('Error submitting request')
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-gray-900">Request Service</h2>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
          <XMarkIcon className="h-6 w-6" />
        </button>
      </div>

      {step === 1 && (
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Service Type
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {serviceTypes.map((service) => (
                <label
                  key={service.value}
                  className={`flex items-center p-4 border rounded-lg cursor-pointer hover:bg-gray-50 ${
                    formData.service_type === service.value
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200'
                  }`}
                >
                  <input
                    type="radio"
                    name="service_type"
                    value={service.value}
                    checked={formData.service_type === service.value}
                    onChange={(e) => setFormData({...formData, service_type: e.target.value})}
                    className="sr-only"
                  />
                  <span className="text-2xl mr-3">{service.icon}</span>
                  <span className="text-sm font-medium">{service.label}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Priority
            </label>
            <select
              value={formData.priority}
              onChange={(e) => setFormData({...formData, priority: e.target.value})}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md"
            >
              <option value="low">Low Priority</option>
              <option value="medium">Medium Priority</option>
              <option value="high">High Priority</option>
              <option value="urgent">Urgent</option>
            </select>
          </div>

          <button
            onClick={() => setStep(2)}
            disabled={!formData.service_type}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              rows={4}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md"
              placeholder="Describe the issue or service needed..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Location
            </label>
            <input
              type="text"
              value={formData.location}
              onChange={(e) => setFormData({...formData, location: e.target.value})}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md"
              placeholder="e.g., Kitchen, Living room, Basement"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Preferred Date
              </label>
              <input
                type="date"
                value={formData.preferred_date}
                onChange={(e) => setFormData({...formData, preferred_date: e.target.value})}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Preferred Time
              </label>
              <select
                value={formData.preferred_time}
                onChange={(e) => setFormData({...formData, preferred_time: e.target.value})}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="">Any time</option>
                <option value="morning">Morning (8AM-12PM)</option>
                <option value="afternoon">Afternoon (12PM-6PM)</option>
                <option value="evening">Evening (6PM-8PM)</option>
              </select>
            </div>
          </div>

          <div className="flex space-x-4">
            <button
              onClick={() => setStep(1)}
              className="flex-1 bg-gray-100 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-200"
            >
              Back
            </button>
            <button
              onClick={handleSubmit}
              disabled={!formData.description || !formData.location}
              className="flex-1 bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 disabled:opacity-50"
            >
              Submit Request
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function JobTrackingModal({ jobId, onClose }) {
  const { data: jobData, isLoading } = useQuery({
    queryKey: ['job-tracking', jobId],
    queryFn: async () => {
      const response = await api.get(`/customer-portal/jobs/tracking/${jobId}`)
      return response.data
    },
    refetchInterval: 5000,
    enabled: !!jobId,
  })

  if (isLoading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-2 text-gray-600">Loading job details...</p>
      </div>
    )
  }

  if (!jobData) {
    return <div className="text-center py-8 text-gray-500">Job not found</div>
  }

  const { job, status_history } = jobData

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-gray-900">Job Tracking</h2>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
          <XMarkIcon className="h-6 w-6" />
        </button>
      </div>

      <div className="bg-blue-50 rounded-lg p-4 mb-6">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="font-medium text-blue-900">Job #{job.job_number}</h3>
            <p className="text-blue-700">{job.service_type}</p>
          </div>
          <span className="px-3 py-1 bg-blue-100 text-blue-800 text-sm font-medium rounded-full">
            {job.status.replace('_', ' ').toUpperCase()}
          </span>
        </div>
      </div>

      {job.technician && job.technician.name && (
        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <h4 className="font-medium text-gray-900 mb-2">Your Technician</h4>
          <div className="flex items-center">
            <div className="flex-1">
              <div className="font-medium">{job.technician.name}</div>
              {job.technician.phone && (
                <div className="text-sm text-gray-600">{job.technician.phone}</div>
              )}
            </div>
            {job.technician.phone && (
              <a
                href={`tel:${job.technician.phone}`}
                className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700"
              >
                Call
              </a>
            )}
          </div>
        </div>
      )}

      <div className="space-y-4">
        <h4 className="font-medium text-gray-900">Status History</h4>
        {status_history && status_history.length > 0 ? (
          <div className="space-y-3">
            {status_history.map((status, index) => (
              <div key={index} className="flex items-start space-x-3">
                <div className={`w-2 h-2 rounded-full mt-2 ${index === 0 ? 'bg-blue-500' : 'bg-gray-300'}`}></div>
                <div className="flex-1">
                  <div className="flex justify-between">
                    <div className="font-medium text-gray-900 capitalize">
                      {status.status.replace('_', ' ')}
                    </div>
                    <div className="text-sm text-gray-500">
                      {new Date(status.created_at).toLocaleTimeString()}
                    </div>
                  </div>
                  {status.message && (
                    <div className="text-sm text-gray-600">{status.message}</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-4 text-gray-500">
            No status updates yet
          </div>
        )}
      </div>
    </div>
  )
}

// Main Dashboard Component
export default function CustomerDashboard() {
  const [activeModal, setActiveModal] = useState(null)
  const [selectedJobId, setSelectedJobId] = useState(null)

  const { data: dashboardData, isLoading } = useQuery({
    queryKey: ['customer-dashboard'],
    queryFn: async () => {
      const response = await api.get('/customer-portal/dashboard')
      return response.data
    },
  })

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount)
  }

  const formatDate = (dateString) => {
    if (!dateString) return 'Not scheduled'
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    })
  }

  const formatTime = (timeString) => {
    if (!timeString) return ''
    return new Date(`2000-01-01T${timeString}`).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getStatusColor = (status) => {
    const colors = {
      confirmed: 'bg-green-100 text-green-800',
      pending: 'bg-yellow-100 text-yellow-800',
      scheduled: 'bg-blue-100 text-blue-800',
      in_progress: 'bg-purple-100 text-purple-800',
      completed: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800',
      overdue: 'bg-red-100 text-red-800',
      paid: 'bg-green-100 text-green-800',
      sent: 'bg-yellow-100 text-yellow-800'
    }
    return colors[status] || 'bg-gray-100 text-gray-800'
  }

  const renderStars = (rating) => {
    return Array.from({ length: 5 }, (_, i) => (
      <StarIcon
        key={i}
        className={`h-4 w-4 ${i < rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
      />
    ))
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 rounded w-1/3"></div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-32 bg-gray-200 rounded-lg"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  const customer = dashboardData?.customer || {}
  const stats = dashboardData?.stats || {}
  const upcomingAppointments = dashboardData?.upcoming_appointments || []
  const recentServices = dashboardData?.recent_services || []
  const outstandingInvoices = dashboardData?.outstanding_invoices || []
  const serviceRequests = dashboardData?.service_requests || []
  const recentMessages = dashboardData?.recent_messages || []

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Welcome back, {customer.first_name || 'Customer'}!
              </h1>
              <p className="text-sm text-gray-600">
                Customer since {customer.customer_since ? new Date(customer.customer_since).toLocaleDateString() : 'N/A'}
              </p>
            </div>
            
            <div className="flex items-center space-x-4">
              <button className="relative p-2 text-gray-600 hover:text-gray-900">
                <BellIcon className="h-6 w-6" />
                {stats.unread_messages > 0 && (
                  <span className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                    {stats.unread_messages}
                  </span>
                )}
              </button>
              
              <button className="p-2 text-gray-600 hover:text-gray-900">
                <Cog6ToothIcon className="h-6 w-6" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <CalendarIcon className="h-6 w-6 text-blue-600 flex-shrink-0" />
                <div className="ml-5 w-0 flex-1">
                  <dt className="text-sm font-medium text-gray-500 truncate">Next Appointment</dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {upcomingAppointments[0] ? 
                      formatDate(upcomingAppointments[0].scheduled_date) : 
                      'No upcoming'
                    }
                  </dd>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <CreditCardIcon className="h-6 w-6 text-green-600 flex-shrink-0" />
                <div className="ml-5 w-0 flex-1">
                  <dt className="text-sm font-medium text-gray-500 truncate">Outstanding Balance</dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {formatCurrency(stats.outstanding_balance || 0)}
                  </dd>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <ChartBarIcon className="h-6 w-6 text-purple-600 flex-shrink-0" />
                <div className="ml-5 w-0 flex-1">
                  <dt className="text-sm font-medium text-gray-500 truncate">Total Services</dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {stats.total_jobs || 0}
                  </dd>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <DocumentTextIcon className="h-6 w-6 text-orange-600 flex-shrink-0" />
                <div className="ml-5 w-0 flex-1">
                  <dt className="text-sm font-medium text-gray-500 truncate">Pending Requests</dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {stats.pending_requests || 0}
                  </dd>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white shadow rounded-lg mb-8">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">Quick Actions</h2>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <button
                onClick={() => setActiveModal('service-request')}
                className="flex items-center justify-center px-4 py-3 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                <PlusIcon className="h-5 w-5 mr-2" />
                Request Service
              </button>
              
              <button className="flex items-center justify-center px-4 py-3 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
                <ClockIcon className="h-5 w-5 mr-2" />
                View Service History
              </button>
              
              <button className="flex items-center justify-center px-4 py-3 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
                <ChatBubbleLeftRightIcon className="h-5 w-5 mr-2" />
                Send Message
              </button>
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - 2 cols */}
          <div className="lg:col-span-2 space-y-8">
            {/* Upcoming Appointments */}
            <div className="bg-white shadow rounded-lg">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Upcoming Appointments</h3>
              </div>
              <div className="p-6">
                {upcomingAppointments.length > 0 ? (
                  <div className="space-y-4">
                    {upcomingAppointments.slice(0, 3).map((appointment) => (
                      <div key={appointment.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-2">
                              <h4 className="text-sm font-medium text-gray-900">
                                {appointment.service_type}
                              </h4>
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(appointment.status)}`}>
                                {appointment.status}
                              </span>
                            </div>
                            <div className="space-y-1 text-sm text-gray-600">
                              <div className="flex items-center">
                                <CalendarIcon className="h-4 w-4 mr-2" />
                                {formatDate(appointment.scheduled_date)}
                              </div>
                              <div className="flex items-center">
                                <ClockIcon className="h-4 w-4 mr-2" />
                                {formatTime(appointment.start_time)} - {formatTime(appointment.end_time)}
                              </div>
                              {appointment.technician_name && (
                                <div className="flex items-center">
                                  <PhoneIcon className="h-4 w-4 mr-2" />
                                  {appointment.technician_name}
                                  {appointment.technician_phone && ` • ${appointment.technician_phone}`}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="mt-3 flex space-x-2">
                          <button
                            onClick={() => setSelectedJobId(appointment.id)}
                            className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded hover:bg-blue-200"
                          >
                            <EyeIcon className="h-3 w-3 inline mr-1" />
                            Track Job
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <CalendarIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">No upcoming appointments scheduled</p>
                    <button 
                      onClick={() => setActiveModal('service-request')}
                      className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
                    >
                      Schedule Service
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Recent Services */}
            <div className="bg-white shadow rounded-lg">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Recent Services</h3>
              </div>
              <div className="p-6">
                {recentServices.length > 0 ? (
                  <div className="space-y-4">
                    {recentServices.slice(0, 3).map((service) => (
                      <div key={service.id} className="flex items-start space-x-4">
                        <CheckCircleIcon className="h-6 w-6 text-green-500 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="text-sm font-medium text-gray-900">{service.service_type}</p>
                              <p className="text-sm text-gray-500">
                                {formatDate(service.completion_date)} • {service.technician_name}
                              </p>
                              {service.notes && (
                                <p className="mt-1 text-sm text-gray-600">{service.notes}</p>
                              )}
                            </div>
                            {service.rating && (
                              <div className="flex items-center ml-4">
                                {renderStars(service.rating)}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <WrenchScrewdriverIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">No recent services</p>
                  </div>
                )}
              </div>
            </div>

            {/* Recent Messages */}
            {recentMessages.length > 0 && (
              <div className="bg-white shadow rounded-lg">
                <div className="px-6 py-4 border-b border-gray-200">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-medium text-gray-900">Recent Messages</h3>
                    <button className="text-sm text-blue-600 hover:text-blue-800">
                      View All
                    </button>
                  </div>
                </div>
                <div className="p-6">
                  <div className="space-y-3">
                    {recentMessages.slice(0, 3).map((message) => (
                      <div key={message.id} className={`p-3 rounded-lg border ${
                        message.read ? 'bg-gray-50 border-gray-200' : 'bg-blue-50 border-blue-200'
                      }`}>
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <h4 className="text-sm font-medium text-gray-900">
                              {message.subject}
                            </h4>
                            <p className="text-sm text-gray-600 mt-1">
                              {message.preview}
                            </p>
                            <div className="flex items-center justify-between mt-2">
                              <span className="text-xs text-gray-500">
                                From: {message.from}
                              </span>
                              <span className="text-xs text-gray-500">
                                {formatDate(message.created_at)}
                              </span>
                            </div>
                          </div>
                          {!message.read && (
                            <div className="w-2 h-2 bg-blue-500 rounded-full ml-2 mt-2"></div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Service Requests */}
            {serviceRequests.length > 0 && (
              <div className="bg-white shadow rounded-lg">
                <div className="px-6 py-4 border-b border-gray-200">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-medium text-gray-900">Recent Service Requests</h3>
                    <button className="text-sm text-blue-600 hover:text-blue-800">
                      View All
                    </button>
                  </div>
                </div>
                <div className="p-6">
                  <div className="space-y-4">
                    {serviceRequests.map((request) => (
                      <div key={request.id} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-2">
                              <h4 className="text-sm font-medium text-gray-900">
                                {request.service_type.replace('_', ' ')}
                              </h4>
                              <div className="flex space-x-2">
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                  request.priority === 'urgent' ? 'bg-red-100 text-red-800' :
                                  request.priority === 'high' ? 'bg-orange-100 text-orange-800' :
                                  request.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                                  'bg-green-100 text-green-800'
                                }`}>
                                  {request.priority}
                                </span>
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(request.status)}`}>
                                  {request.status}
                                </span>
                              </div>
                            </div>
                            <p className="text-sm text-gray-600 mb-2">{request.description}</p>
                            <div className="text-xs text-gray-500">
                              Submitted {formatDate(request.created_at)}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {/* Customer Information */}
            <div className="bg-white shadow rounded-lg">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Your Information</h3>
              </div>
              <div className="p-6 space-y-4">
                <div className="flex items-center">
                  <EnvelopeIcon className="h-5 w-5 text-gray-400 mr-3" />
                  <span className="text-sm text-gray-900">{customer.email}</span>
                </div>
                <div className="flex items-center">
                  <PhoneIcon className="h-5 w-5 text-gray-400 mr-3" />
                  <span className="text-sm text-gray-900">{customer.phone}</span>
                </div>
                <div className="flex items-start">
                  <MapPinIcon className="h-5 w-5 text-gray-400 mr-3 mt-0.5" />
                  <div className="text-sm text-gray-900">
                    <div>{customer.address}</div>
                    <div>{customer.city}, {customer.state} {customer.zip_code}</div>
                  </div>
                </div>
                <button className="w-full mt-4 inline-flex justify-center items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">
                  Update Information
                </button>
              </div>
            </div>

            {/* Outstanding Invoices */}
            {outstandingInvoices.length > 0 && (
              <div className="bg-white shadow rounded-lg">
                <div className="px-6 py-4 border-b border-gray-200">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-medium text-gray-900">Outstanding Invoices</h3>
                    <button className="text-sm text-blue-600 hover:text-blue-800">
                      Pay Now
                    </button>
                  </div>
                </div>
                <div className="p-6">
                  <div className="space-y-3">
                    {outstandingInvoices.map((invoice) => (
                      <div key={invoice.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            Invoice #{invoice.invoice_number}
                          </p>
                          <p className="text-xs text-gray-500">
                            Due: {new Date(invoice.due_date).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium text-gray-900">
                            {formatCurrency(invoice.amount)}
                          </p>
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(invoice.status)}`}>
                            {invoice.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modals */}
      {activeModal === 'service-request' && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" onClick={() => setActiveModal(null)}>
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <ServiceRequestModal onClose={() => setActiveModal(null)} />
              </div>
            </div>
          </div>
        </div>
      )}

      {selectedJobId && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" onClick={() => setSelectedJobId(null)}>
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <JobTrackingModal jobId={selectedJobId} onClose={() => setSelectedJobId(null)} />
              </div>
            </div>
          </div>
        </div>
      )}
       {/* AI Chatbot Widget */}
      <ChatbotWidget 
        companyId="your-company-id" 
        position="bottom-right"
        theme="light"
      />
    </div>
  )
}