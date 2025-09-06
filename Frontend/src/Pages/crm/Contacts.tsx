// frontend/src/pages/crm/Contacts.tsx - COMPLETE VERSION

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { PlusIcon, MagnifyingGlassIcon, FunnelIcon } from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'

import { api } from '../../services/api'
import Modal from '../../components/ui/Modal'
import ContactForm from '../../components/forms/ContactForm'

// Updated interface to match backend
interface Contact {
  id: string
  first_name: string
  last_name: string
  email?: string
  phone?: string
  secondary_phone?: string
  contact_type: 'residential' | 'commercial'
  status: 'active' | 'inactive' | 'prospect'
  address?: string
  city?: string
  state?: string
  zip_code?: string
  notes?: string
  tags: string[]
  company_id: string
  created_by: string
  created_at: string
  updated_at: string
}

interface ContactCreateData {
  first_name: string
  last_name: string
  email?: string
  phone?: string
  secondary_phone?: string
  contact_type: 'residential' | 'commercial'
  status: 'active' | 'inactive' | 'prospect'
  address?: string
  city?: string
  state?: string
  zip_code?: string
  notes?: string
  tags: string[]
}

export default function Contacts() {
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [typeFilter, setTypeFilter] = useState('all')

  const queryClient = useQueryClient()

  // Get contacts with proper error handling
  const { data: contacts, isLoading, error } = useQuery({
    queryKey: ['contacts', searchTerm, statusFilter, typeFilter],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (searchTerm) params.append('search', searchTerm)
      if (statusFilter !== 'all') params.append('status', statusFilter)
      if (typeFilter !== 'all') params.append('contact_type', typeFilter)
      
      console.log('🔍 Fetching contacts with params:', params.toString())
      const response = await api.get(`/contacts/?${params.toString()}`)
      console.log('📞 Got contacts:', response.data)
      return response.data as Contact[]
    },
    retry: 1
  })

  // Get contact statistics
  const { data: stats } = useQuery({
    queryKey: ['contact-stats'],
    queryFn: async () => {
      const response = await api.get('/contacts/stats')
      return response.data
    }
  })

  // Create contact mutation
  const createContactMutation = useMutation({
    mutationFn: async (contactData: ContactCreateData) => {
      console.log('📝 Creating contact:', contactData)
      const response = await api.post('/contacts/', contactData)
      console.log('✅ Contact created:', response.data)
      return response.data
    },
    onSuccess: (newContact) => {
      queryClient.invalidateQueries({ queryKey: ['contacts'] })
      queryClient.invalidateQueries({ queryKey: ['contact-stats'] })
      setShowCreateModal(false)
      toast.success(`Contact ${newContact.first_name} ${newContact.last_name} created successfully!`)
    },
    onError: (error: any) => {
      console.error('❌ Error creating contact:', error)
      toast.error(error.response?.data?.detail || 'Failed to create contact')
    },
  })

  // Delete contact mutation
  const deleteContactMutation = useMutation({
    mutationFn: async (contactId: string) => {
      console.log('🗑️ Deleting contact:', contactId)
      await api.delete(`/contacts/${contactId}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contacts'] })
      queryClient.invalidateQueries({ queryKey: ['contact-stats'] })
      toast.success('Contact deleted successfully!')
    },
    onError: (error: any) => {
      console.error('❌ Error deleting contact:', error)
      toast.error(error.response?.data?.detail || 'Failed to delete contact')
    },
  })

  const handleCreateContact = (contactData: ContactCreateData) => {
    createContactMutation.mutate(contactData)
  }

  const handleDeleteContact = (contactId: string) => {
    if (window.confirm('Are you sure you want to delete this contact?')) {
      deleteContactMutation.mutate(contactId)
    }
  }

  // Show error state
  if (error) {
    return (
      <div className="space-y-6">
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex">
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">
                Error loading contacts
              </h3>
              <div className="mt-2 text-sm text-red-700">
                <p>Unable to load contacts. Please check your connection and try again.</p>
                <pre className="mt-2 text-xs bg-red-100 p-2 rounded">
                  {error instanceof Error ? error.message : 'Unknown error'}
                </pre>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header with Stats */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Contacts</h1>
          <div className="mt-1 flex items-center space-x-4 text-sm text-gray-500">
            <span>Manage your customer database and contact information.</span>
            {stats && (
              <div className="flex space-x-4">
                <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs">
                  Total: {stats.total_contacts}
                </span>
                <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs">
                  Active: {stats.active_contacts}
                </span>
                <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-xs">
                  Prospects: {stats.prospects}
                </span>
              </div>
            )}
          </div>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="inline-flex items-center bg-black px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
        >
          <PlusIcon className="h-4 w-4 mr-2" />
          Add Contact
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search contacts..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
          >
            <option value="all">All Statuses</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="prospect">Prospect</option>
          </select>

          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
          >
            <option value="all">All Types</option>
            <option value="residential">Residential</option>
            <option value="commercial">Commercial</option>
          </select>

          <button className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500">
            <FunnelIcon className="h-4 w-4 mr-2" />
            More Filters
          </button>
        </div>
      </div>

      {/* Contacts Table */}
      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        {isLoading ? (
          <div className="p-6">
            <div className="animate-pulse space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-16 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        ) : contacts && contacts.length > 0 ? (
          <ul className="divide-y divide-gray-200">
            {contacts.map((contact: Contact) => (
              <li key={contact.id}>
                <div className="px-4 py-4 flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-10 w-10">
                      <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center">
                        <span className="text-sm font-medium text-primary-700">
                          {contact.first_name?.[0]?.toUpperCase() || '?'}{contact.last_name?.[0]?.toUpperCase() || '?'}
                        </span>
                      </div>
                    </div>
                    <div className="ml-4">
                      <div className="flex items-center">
                        <p className="text-sm font-medium text-gray-900">
                          {contact.first_name} {contact.last_name}
                        </p>
                        <span className={`ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          contact.status === 'active' 
                            ? 'bg-green-100 text-green-800'
                            : contact.status === 'inactive'
                            ? 'bg-gray-100 text-gray-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}>
                          {contact.status}
                        </span>
                        <span className={`ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                          contact.contact_type === 'residential'
                            ? 'bg-purple-100 text-purple-800'
                            : 'bg-orange-100 text-orange-800'
                        }`}>
                          {contact.contact_type}
                        </span>
                      </div>
                      <div className="flex items-center mt-1 space-x-4">
                        {contact.email && (
                          <p className="text-sm text-gray-500">{contact.email}</p>
                        )}
                        {contact.phone && (
                          <p className="text-sm text-gray-500">{contact.phone}</p>
                        )}
                        {contact.city && contact.state && (
                          <p className="text-sm text-gray-500">{contact.city}, {contact.state}</p>
                        )}
                      </div>
                      {contact.tags && contact.tags.length > 0 && (
                        <div className="flex items-center mt-1 space-x-1">
                          {contact.tags.slice(0, 3).map((tag, index) => (
                            <span key={index} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                              {tag}
                            </span>
                          ))}
                          {contact.tags.length > 3 && (
                            <span className="text-xs text-gray-500">+{contact.tags.length - 3} more</span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setSelectedContact(contact)}
                      className="text-primary-600 hover:text-primary-900 text-sm font-medium"
                    >
                      View
                    </button>
                    <button
                      onClick={() => handleDeleteContact(contact.id)}
                      disabled={deleteContactMutation.isPending}
                      className="text-red-600 hover:text-red-900 text-sm font-medium disabled:opacity-50"
                    >
                      {deleteContactMutation.isPending ? 'Deleting...' : 'Delete'}
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          // Empty state
          <div className="text-center py-12">
            <div className="mx-auto h-12 w-12 text-gray-400">
              <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No contacts found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchTerm || statusFilter !== 'all' || typeFilter !== 'all'
                ? 'Try adjusting your filters or search term.'
                : 'Get started by creating a new contact.'}
            </p>
            {!searchTerm && statusFilter === 'all' && typeFilter === 'all' && (
              <div className="mt-6">
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700"
                >
                  <PlusIcon className="h-4 w-4 mr-2" />
                  Add Contact
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Create Contact Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Create New Contact"
        size="lg"
      >
        <ContactForm
          onSubmit={handleCreateContact}
          onCancel={() => setShowCreateModal(false)}
          isLoading={createContactMutation.isPending}
        />
      </Modal>

      {/* View Contact Modal */}
      {selectedContact && (
        <Modal
          isOpen={!!selectedContact}
          onClose={() => setSelectedContact(null)}
          title={`${selectedContact.first_name} ${selectedContact.last_name}`}
          size="lg"
        >
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Name</label>
                <p className="mt-1 text-sm text-gray-900">{selectedContact.first_name} {selectedContact.last_name}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Status</label>
                <span className={`mt-1 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  selectedContact.status === 'active' 
                    ? 'bg-green-100 text-green-800'
                    : selectedContact.status === 'inactive'
                    ? 'bg-gray-100 text-gray-800'
                    : 'bg-blue-100 text-blue-800'
                }`}>
                  {selectedContact.status}
                </span>
              </div>
              {selectedContact.email && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">Email</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedContact.email}</p>
                </div>
              )}
              {selectedContact.phone && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">Phone</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedContact.phone}</p>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700">Type</label>
                <p className="mt-1 text-sm text-gray-900 capitalize">{selectedContact.contact_type}</p>
              </div>
              {selectedContact.address && (
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700">Address</label>
                  <p className="mt-1 text-sm text-gray-900">
                    {selectedContact.address}
                    {selectedContact.city && `, ${selectedContact.city}`}
                    {selectedContact.state && `, ${selectedContact.state}`}
                    {selectedContact.zip_code && ` ${selectedContact.zip_code}`}
                  </p>
                </div>
              )}
              {selectedContact.notes && (
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700">Notes</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedContact.notes}</p>
                </div>
              )}
              {selectedContact.tags && selectedContact.tags.length > 0 && (
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700">Tags</label>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {selectedContact.tags.map((tag, index) => (
                      <span key={index} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <div className="text-xs text-gray-500">
              Created: {new Date(selectedContact.created_at).toLocaleDateString()}
              {selectedContact.updated_at !== selectedContact.created_at && (
                <> • Updated: {new Date(selectedContact.updated_at).toLocaleDateString()}</>
              )}
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}