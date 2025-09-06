import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  DocumentTextIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  ArrowDownTrayIcon,
  EyeIcon,
  CalendarIcon,
  DocumentIcon,
  PhotoIcon,
  FilmIcon,
  ArchiveBoxIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline'
import { api } from '../../services/api'

export default function CustomerDocuments() {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedType, setSelectedType] = useState('all')
  const [previewDocument, setPreviewDocument] = useState(null)

  const { data: documentsData, isLoading } = useQuery({
    queryKey: ['customer-documents', selectedType, searchTerm],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (selectedType !== 'all') params.append('document_type', selectedType)
      if (searchTerm) params.append('search', searchTerm)
      
      const response = await api.get(`/customer-portal/documents?${params.toString()}`)
      return response.data
    },
  })

  const documents = documentsData?.documents || []
  const documentTypes = documentsData?.document_types || []

  const getDocumentIcon = (mimeType, documentType) => {
    if (mimeType?.startsWith('image/')) return <PhotoIcon className="h-6 w-6 text-blue-500" />
    if (mimeType?.startsWith('video/')) return <FilmIcon className="h-6 w-6 text-purple-500" />
    if (mimeType?.includes('pdf')) return <DocumentIcon className="h-6 w-6 text-red-500" />
    
    switch (documentType) {
      case 'invoice':
        return <DocumentTextIcon className="h-6 w-6 text-green-500" />
      case 'receipt':
        return <DocumentIcon className="h-6 w-6 text-blue-500" />
      case 'warranty':
        return <ArchiveBoxIcon className="h-6 w-6 text-yellow-500" />
      case 'service_report':
        return <CheckCircleIcon className="h-6 w-6 text-purple-500" />
      default:
        return <DocumentTextIcon className="h-6 w-6 text-gray-500" />
    }
  }

  const getDocumentTypeLabel = (type) => {
    const labels = {
      invoice: 'Invoice',
      receipt: 'Receipt',
      warranty: 'Warranty',
      service_report: 'Service Report',
      photo: 'Photo',
      contract: 'Contract',
      certificate: 'Certificate'
    }
    return labels[type] || type.charAt(0).toUpperCase() + type.slice(1)
  }

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const handleDownload = (document) => {
    if (document.file_url) {
      const link = document.createElement('a')
      link.href = document.file_url
      link.download = document.file_name || `document_${document.id}`
      link.target = '_blank'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    }
  }

  const handlePreview = (document) => {
    if (document.mime_type?.startsWith('image/') || 
        document.mime_type?.includes('pdf') ||
        document.mime_type?.startsWith('text/')) {
      setPreviewDocument(document)
    } else {
      handleDownload(document)
    }
  }

  const isExpiringSoon = (expiresAt) => {
    if (!expiresAt) return false
    const expiry = new Date(expiresAt)
    const today = new Date()
    const diffDays = Math.ceil((expiry - today) / (1000 * 60 * 60 * 24))
    return diffDays <= 30 && diffDays >= 0
  }

  const isExpired = (expiresAt) => {
    if (!expiresAt) return false
    const expiry = new Date(expiresAt)
    const today = new Date()
    return expiry < today
  }

  const filteredDocuments = documents.filter(doc => {
    if (searchTerm && !doc.title.toLowerCase().includes(searchTerm.toLowerCase()) &&
        !doc.description.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false
    }
    return true
  })

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 rounded w-1/3"></div>
            <div className="h-12 bg-gray-200 rounded"></div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-48 bg-gray-200 rounded-lg"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">My Documents</h1>
          <p className="text-gray-600">
            Access your invoices, receipts, warranties, and service reports
          </p>
        </div>

        {/* Filters and Search */}
        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Search */}
            <div className="md:col-span-2">
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search documents..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            {/* Document Type Filter */}
            <div>
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Document Types</option>
                {documentTypes.map((type) => (
                  <option key={type} value={type}>
                    {getDocumentTypeLabel(type)}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Documents Grid */}
        {filteredDocuments.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredDocuments.map((document) => (
              <div key={document.id} className="bg-white shadow rounded-lg overflow-hidden hover:shadow-lg transition-shadow">
                {/* Document Header */}
                <div className="p-4 border-b border-gray-200">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center">
                      {getDocumentIcon(document.mime_type, document.document_type)}
                      <div className="ml-3">
                        <h3 className="text-sm font-medium text-gray-900 truncate">
                          {document.title}
                        </h3>
                        <div className="flex items-center space-x-2 mt-1">
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                            {getDocumentTypeLabel(document.document_type)}
                          </span>
                          {isExpired(document.expires_at) && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                              Expired
                            </span>
                          )}
                          {isExpiringSoon(document.expires_at) && !isExpired(document.expires_at) && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
                              Expiring Soon
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Document Preview */}
                <div className="p-4">
                  {document.mime_type?.startsWith('image/') ? (
                    <img
                      src={document.file_url}
                      alt={document.title}
                      className="w-full h-32 object-cover rounded cursor-pointer"
                      onClick={() => handlePreview(document)}
                    />
                  ) : (
                    <div 
                      className="w-full h-32 bg-gray-100 rounded flex items-center justify-center cursor-pointer hover:bg-gray-200"
                      onClick={() => handlePreview(document)}
                    >
                      {getDocumentIcon(document.mime_type, document.document_type)}
                    </div>
                  )}
                  
                  {document.description && (
                    <p className="mt-3 text-sm text-gray-600 line-clamp-2">
                      {document.description}
                    </p>
                  )}
                </div>

                {/* Document Info */}
                <div className="px-4 py-3 bg-gray-50 text-sm text-gray-600">
                  <div className="flex justify-between items-center mb-2">
                    <span>Size: {formatFileSize(document.file_size)}</span>
                    <span>{formatDate(document.created_at)}</span>
                  </div>
                  
                  {document.expires_at && (
                    <div className="flex items-center">
                      <CalendarIcon className="h-4 w-4 mr-1" />
                      <span className={`text-xs ${
                        isExpired(document.expires_at) ? 'text-red-600' :
                        isExpiringSoon(document.expires_at) ? 'text-yellow-600' : 'text-gray-600'
                      }`}>
                        {isExpired(document.expires_at) ? 'Expired' : 'Expires'}: {formatDate(document.expires_at)}
                      </span>
                    </div>
                  )}

                  {document.related_job_id && (
                    <div className="text-xs text-blue-600 mt-1">
                      Related to service job
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="px-4 py-3 bg-white border-t border-gray-200">
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handlePreview(document)}
                      className="flex-1 inline-flex items-center justify-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                    >
                      <EyeIcon className="h-4 w-4 mr-1" />
                      {document.mime_type?.startsWith('image/') || document.mime_type?.includes('pdf') ? 'Preview' : 'View'}
                    </button>
                    <button
                      onClick={() => handleDownload(document)}
                      className="flex-1 inline-flex items-center justify-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                    >
                      <ArrowDownTrayIcon className="h-4 w-4 mr-1" />
                      Download
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white shadow rounded-lg p-12 text-center">
            <DocumentTextIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Documents Found</h3>
            <p className="text-gray-600">
              {searchTerm || selectedType !== 'all' 
                ? "No documents match your current filters."
                : "Your documents will appear here once services are completed."}
            </p>
            {(searchTerm || selectedType !== 'all') && (
              <button
                onClick={() => {
                  setSearchTerm('')
                  setSelectedType('all')
                }}
                className="mt-4 text-blue-600 hover:text-blue-800 text-sm"
              >
                Clear filters
              </button>
            )}
          </div>
        )}

        {/* Document Stats */}
        {documents.length > 0 && (
          <div className="mt-8 bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Document Summary</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{documents.length}</div>
                <div className="text-sm text-gray-600">Total Documents</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {documents.filter(d => d.document_type === 'invoice').length}
                </div>
                <div className="text-sm text-gray-600">Invoices</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-600">
                  {documents.filter(d => d.document_type === 'warranty').length}
                </div>
                <div className="text-sm text-gray-600">Warranties</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {documents.filter(d => d.document_type === 'service_report').length}
                </div>
                <div className="text-sm text-gray-600">Service Reports</div>
              </div>
            </div>
          </div>
        )}

        {/* Expiring Documents Alert */}
        {documents.some(doc => isExpiringSoon(doc.expires_at)) && (
          <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-md p-4">
            <div className="flex">
              <ExclamationTriangleIcon className="h-5 w-5 text-yellow-400" />
              <div className="ml-3">
                <h3 className="text-sm font-medium text-yellow-800">
                  Documents Expiring Soon
                </h3>
                <div className="mt-2 text-sm text-yellow-700">
                  <p>
                    You have {documents.filter(doc => isExpiringSoon(doc.expires_at)).length} document(s) 
                    expiring within the next 30 days. Please review and renew if necessary.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Document Preview Modal */}
      {previewDocument && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div 
              className="fixed inset-0 transition-opacity" 
              onClick={() => setPreviewDocument(null)}
            >
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>
            
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-medium text-gray-900">
                    {previewDocument.title}
                  </h3>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleDownload(previewDocument)}
                      className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                    >
                      <ArrowDownTrayIcon className="h-4 w-4 mr-2" />
                      Download
                    </button>
                    <button
                      onClick={() => setPreviewDocument(null)}
                      className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-gray-600 hover:bg-gray-700"
                    >
                      Close
                    </button>
                  </div>
                </div>

                <div className="max-h-96 overflow-auto">
                  {previewDocument.mime_type?.startsWith('image/') ? (
                    <img
                      src={previewDocument.file_url}
                      alt={previewDocument.title}
                      className="w-full h-auto"
                    />
                  ) : previewDocument.mime_type?.includes('pdf') ? (
                    <iframe
                      src={previewDocument.file_url}
                      className="w-full h-96"
                      title={previewDocument.title}
                    />
                  ) : (
                    <div className="text-center py-8">
                      <DocumentIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600">
                        Preview not available for this file type. Click download to view the document.
                      </p>
                    </div>
                  )}
                </div>

                {previewDocument.description && (
                  <div className="mt-4 p-3 bg-gray-50 rounded">
                    <p className="text-sm text-gray-700">{previewDocument.description}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}