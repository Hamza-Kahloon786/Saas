// ServiceHistory.tsx
import React, { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  CalendarIcon,
  ClockIcon,
  UserIcon,
  MapPinIcon,
  DocumentTextIcon,
  CreditCardIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  EyeIcon,
  PrinterIcon,
  ArrowDownTrayIcon,
  MagnifyingGlassIcon,
  FunnelIcon
} from '@heroicons/react/24/outline'
import { api } from '../../services/api'

// Import our fixed PaymentPortal component
const PaymentPortal = React.lazy(() => import('./PaymentPortal'))

export default function ServiceHistory() {
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [sortBy, setSortBy] = useState('newest')
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string | null>(null)

  // Fetch service history with invoices
  const { data: servicesData, isLoading, error } = useQuery({
  queryKey: ['customer-service-history'],
  queryFn: async () => {
  const response = await api.get('/customer-portal/service-history')
  console.log('Service History Response:', response.data)
  return response.data
}
})

  // Fetch invoices
  // ADD this corrected query:
const { data: invoicesData } = useQuery({
  queryKey: ['customer-invoices'],
  queryFn: async () => {
    const response = await api.get('/customer-portal/invoices')
    return response.data
  }
})

 const formatDate = (dateString: string) => {
    if (!dateString) return 'Invalid Date'
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const formatCurrency = (amount: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount || 0)
  }

  const getStatusColor = (status) => {
    const colors = {
      completed: 'bg-green-100 text-green-800',
      in_progress: 'bg-yellow-100 text-yellow-800',
      scheduled: 'bg-blue-100 text-blue-800',
      cancelled: 'bg-red-100 text-red-800'
    }
    return colors[status] || 'bg-gray-100 text-gray-800'
  }

  const getPaymentStatusColor = (status) => {
    const colors = {
      paid: 'bg-green-100 text-green-800',
      pending: 'bg-yellow-100 text-yellow-800',
      sent: 'bg-blue-100 text-blue-800',
      overdue: 'bg-red-100 text-red-800'
    }
    return colors[status] || 'bg-gray-100 text-gray-800'
  }

  // Find invoice for a service
// Find invoice for a service
// Find invoice for a service
const findInvoiceForService = (serviceId) => {
  if (!invoicesData?.invoices) return null
  
  // Try to find invoice linked to this service/job
  const linkedInvoice = invoicesData.invoices.find(invoice => {
    return invoice.job_id === serviceId || 
           invoice.service_id === serviceId ||
           invoice.id === serviceId
  })
  
  // Fallback to first available invoice for demo
  return linkedInvoice || invoicesData.invoices[0]
}

 const handlePayNow = (invoiceId: string) => {
    setSelectedInvoiceId(invoiceId)
    setShowPaymentModal(true)
  }

  const handlePaymentSuccess = () => {
    setShowPaymentModal(false)
    setSelectedInvoiceId(null)
    // Refresh data
    window.location.reload()
  }

  const handlePaymentClose = () => {
    setShowPaymentModal(false)
    setSelectedInvoiceId(null)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your service history...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <ExclamationTriangleIcon className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <p className="text-red-600">Failed to load service history</p>
          <button 
            onClick={() => window.location.reload()}
            className="mt-4 text-blue-600 hover:text-blue-800"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  const services = servicesData?.services || []

  // Filter and sort services
  let filteredServices = services.filter(service => {
    const matchesSearch = service.service_type?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         service.description?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || service.status === statusFilter
    return matchesSearch && matchesStatus
  })

  // Sort services
  filteredServices = filteredServices.sort((a, b) => {
    switch (sortBy) {
      case 'newest':
        return new Date(b.completed_date || b.created_at) - new Date(a.completed_date || a.created_at)
      case 'oldest':
        return new Date(a.completed_date || a.created_at) - new Date(b.completed_date || b.created_at)
      case 'service_type':
        return (a.service_type || '').localeCompare(b.service_type || '')
      default:
        return 0
    }
  })

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Payment Modal */}
      {showPaymentModal && selectedInvoiceId && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-10 mx-auto max-w-7xl">
            <React.Suspense fallback={
              <div className="bg-white rounded-lg shadow-lg p-8 mx-4">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="mt-2 text-gray-600">Loading payment form...</p>
                </div>
              </div>
            }>
              <PaymentPortal 
                invoiceId={selectedInvoiceId}
                onSuccess={handlePaymentSuccess}
                onBack={handlePaymentClose}
              />
            </React.Suspense>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Service History</h1>
          <p className="text-gray-600 mt-2">View all your completed services, photos, and invoices</p>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Search */}
            <div className="relative">
              <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-3 text-gray-400" />
              <input
                type="text"
                placeholder="Search services..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Status Filter */}
            <div className="relative">
              <FunnelIcon className="h-5 w-5 absolute left-3 top-3 text-gray-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="pl-10 pr-8 py-2 w-full border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none bg-white"
              >
                <option value="all">All Statuses</option>
                <option value="completed">Completed</option>
                <option value="in_progress">In Progress</option>
                <option value="scheduled">Scheduled</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>

            {/* Sort */}
            <div className="relative">
              <CalendarIcon className="h-5 w-5 absolute left-3 top-3 text-gray-400" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="pl-10 pr-8 py-2 w-full border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none bg-white"
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="service_type">Service Type</option>
              </select>
            </div>
          </div>
        </div>

        {/* Services List */}
        {filteredServices.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-8 text-center">
            <DocumentTextIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Services Found</h3>
            <p className="text-gray-600">
              {searchTerm || statusFilter !== 'all' 
                ? "Try adjusting your search or filters"
                : "Your completed services will appear here once available"
              }
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {filteredServices.map((service) => {
              const invoice = findInvoiceForService(service.id)
              
              return (
                <div key={service.id} className="bg-white rounded-lg shadow-sm overflow-hidden">
                  <div className="p-6">
                    {/* Service Header */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="text-lg font-semibold text-gray-900">
                            {service.service_type || 'Service Call'}
                          </h3>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(service.status)}`}>
                            {service.status?.replace('_', ' ').toUpperCase()}
                          </span>
                        </div>
                        
                        <div className="flex items-center space-x-4 text-sm text-gray-600">
                          <div className="flex items-center">
                            <CalendarIcon className="h-4 w-4 mr-1" />
                            {formatDate(service.completed_date || service.created_at)}
                          </div>
                          {service.technician && (
                            <div className="flex items-center">
                              <UserIcon className="h-4 w-4 mr-1" />
                              {service.technician}
                            </div>
                          )}
                          {service.duration && (
                            <div className="flex items-center">
                              <ClockIcon className="h-4 w-4 mr-1" />
                              {service.duration}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Invoice Status */}
                      {invoice && (
                        <div className="text-right">
                          <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPaymentStatusColor(invoice.status)}`}>
                            {invoice.status === 'paid' ? (
                              <>
                                <CheckCircleIcon className="h-3 w-3 mr-1" />
                                Paid
                              </>
                            ) : (
                              <>
                                <ExclamationTriangleIcon className="h-3 w-3 mr-1" />
                                {invoice.status === 'sent' ? 'Pending' : invoice.status}
                              </>
                            )}
                          </div>
                          <div className="text-sm text-gray-600 mt-1">
                            {formatCurrency(invoice.total_amount)}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Service Description */}
                    {service.description && (
                      <p className="text-gray-700 mb-4">{service.description}</p>
                    )}

                    {/* Service Details */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      {service.location && (
                        <div className="flex items-start space-x-2">
                          <MapPinIcon className="h-4 w-4 text-gray-400 mt-1 flex-shrink-0" />
                          <span className="text-sm text-gray-600">{service.location}</span>
                        </div>
                      )}
                      
                      {service.work_performed && (
                        <div className="flex items-start space-x-2">
                          <DocumentTextIcon className="h-4 w-4 text-gray-400 mt-1 flex-shrink-0" />
                          <div>
                            <p className="text-sm font-medium text-gray-700">Work Performed:</p>
                            <p className="text-sm text-gray-600">{service.work_performed}</p>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Photos */}
                    {service.photos && service.photos.length > 0 && (
                      <div className="mb-4">
                        <h4 className="text-sm font-medium text-gray-700 mb-2">Service Photos:</h4>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                          {service.photos.slice(0, 4).map((photo, index) => (
                            <div key={index} className="relative group">
                              <img
                                src={photo.url}
                                alt={photo.description || `Service photo ${index + 1}`}
                                className="w-full h-20 object-cover rounded-lg border border-gray-200"
                              />
                              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 rounded-lg transition-opacity flex items-center justify-center">
                                <EyeIcon className="h-5 w-5 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                              </div>
                            </div>
                          ))}
                          {service.photos.length > 4 && (
                            <div className="w-full h-20 bg-gray-100 rounded-lg border border-gray-200 flex items-center justify-center">
                              <span className="text-xs text-gray-500">
                                +{service.photos.length - 4} more
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                      <div className="flex space-x-3">
                        <button className="flex items-center px-3 py-1.5 text-sm font-medium text-blue-600 hover:text-blue-800">
                          <EyeIcon className="h-4 w-4 mr-1" />
                          View Details
                        </button>
                        
                        {service.photos && service.photos.length > 0 && (
                          <button className="flex items-center px-3 py-1.5 text-sm font-medium text-gray-600 hover:text-gray-800">
                            <ArrowDownTrayIcon className="h-4 w-4 mr-1" />
                            Download Photos
                          </button>
                        )}
                      </div>

                      {/* Invoice Actions */}
                      {invoice && (
                        <div className="flex space-x-3">
                          {(invoice.status === 'pending' || invoice.status === 'sent') && (
                            <button
                              onClick={() => handlePayNow(invoice.id)}
                              className="flex items-center px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-md hover:bg-green-700"
                            >
                              <CreditCardIcon className="h-4 w-4 mr-2" />
                              Pay Now
                            </button>
                          )}
                          
                          {/* <button className="flex items-center px-3 py-1.5 text-sm font-medium text-gray-600 hover:text-gray-800 border border-gray-300 rounded-md">
                            <DocumentTextIcon className="h-4 w-4 mr-1" />
                            View Invoice
                          </button> */}
                          
                          <button className="flex items-center px-3 py-1.5 text-sm font-medium text-gray-600 hover:text-gray-800 border border-gray-300 rounded-md">
                            <PrinterIcon className="h-4 w-4 mr-1" />
                            Print
                          </button>
                        </div>
                      )}

                      {/* Service without invoice */}
                     {/* Invoice Actions - FIXED */}
{/* Fixed Invoice Actions */}
{invoicesData?.invoices && invoicesData.invoices.length > 0 && (
  <div className="flex space-x-3">
    <button
      onClick={() => handlePayNow(invoicesData.invoices[0].id)}
      className="flex items-center px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-md hover:bg-green-700"
    >
      <CreditCardIcon className="h-4 w-4 mr-2" />
      Pay Invoice ${invoicesData.invoices[0].total_amount}
    </button>
    
    <button className="flex items-center px-3 py-1.5 text-sm font-medium text-gray-600 hover:text-gray-800 border border-gray-300 rounded-md">
      <DocumentTextIcon className="h-4 w-4 mr-1" />
      View Invoice
    </button>
  </div>
)}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Summary Stats */}
        {filteredServices.length > 0 && (
          <div className="mt-8 bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Summary</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{filteredServices.length}</div>
                <div className="text-sm text-gray-600">Total Services</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {filteredServices.filter(s => s.status === 'completed').length}
                </div>
                <div className="text-sm text-gray-600">Completed</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {invoicesData?.invoices?.filter(i => i.status === 'paid').length || 0}
                </div>
                <div className="text-sm text-gray-600">Invoices Paid</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">
                  {formatCurrency(
                    invoicesData?.invoices?.reduce((sum, invoice) => sum + (invoice.amount_paid || 0), 0) || 0
                  )}
                </div>
                <div className="text-sm text-gray-600">Total Paid</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}