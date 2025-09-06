// frontend/src/pages/invoices/InvoiceGenerator.tsx
import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { PlusIcon, TrashIcon } from '@heroicons/react/24/outline'
import { api } from '../../services/api'

type Contact = {
  id: string
  first_name?: string
  last_name?: string
  email?: string
  company?: string
}

type LineItem = {
  description: string
  quantity: number
  unit_price: number
}

export default function InvoiceGenerator() {
  const [contactId, setContactId] = useState('')
  const navigate = useNavigate()
  const [title, setTitle] = useState('Service Invoice')
  const [description, setDescription] = useState('')
  const [taxRate, setTaxRate] = useState<number>(8.5)
  const [discount, setDiscount] = useState<number>(0)
  const [items, setItems] = useState<LineItem[]>([
    { description: '', quantity: 1, unit_price: 0 },
  ])
  const [terms, setTerms] = useState('')
  const [notes, setNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)

  // Load contacts (fallback if ?type=customer returns empty)
  const { data: contacts = [], isLoading: loadingContacts } = useQuery<Contact[]>({
    queryKey: ['contacts-for-invoice'],
    queryFn: async () => {
      // try with type=customer first
      const res1 = await api.get('/contacts/?type=customer')
      if (Array.isArray(res1.data) && res1.data.length > 0) return res1.data
      if (Array.isArray(res1.data?.contacts) && res1.data.contacts.length > 0) return res1.data.contacts
      // fallback: fetch all contacts
      const res2 = await api.get('/contacts/')
      if (Array.isArray(res2.data)) return res2.data
      return res2.data?.contacts ?? []
    },
    staleTime: 300_000,
  })

  // totals
  const { subtotal, taxAmount, total } = useMemo(() => {
    const st = items.reduce((sum, it) => sum + (Number(it.quantity || 0) * Number(it.unit_price || 0)), 0)
    const taxable = Math.max(0, st - Number(discount || 0))
    const tax = (taxable * Number(taxRate || 0)) / 100
    return {
      subtotal: st,
      taxAmount: tax,
      total: Math.max(0, taxable + tax)
    }
  }, [items, taxRate, discount])

  const addItem = () => {
    setItems(prev => [...prev, { description: '', quantity: 1, unit_price: 0 }])
  }

  const removeItem = (index: number) => {
    setItems(prev => prev.filter((_, i) => i !== index))
  }

  const updateItem = (index: number, key: keyof LineItem, value: string | number) => {
    setItems(prev => prev.map((it, i) => i === index ? { ...it, [key]: key === 'description' ? String(value) : Number(value) } : it))
  }

  const createInvoice = async () => {
    try {
      if (!contactId) {
        toast.error('Please select a customer')
        return
      }
      if (!items.length || !items[0].description) {
        toast.error('Please add at least one line item with a description')
        return
      }
      setSubmitting(true)

      const payload = {
        contact_id: contactId,
        title: title || 'Service Invoice',
        description: description || '',
        tax_rate: Number(taxRate || 0),
        discount_amount: Number(discount || 0),
        line_items: items.map(it => ({
          description: it.description,
          quantity: Number(it.quantity || 0),
          unit_price: Number(it.unit_price || 0),
        })),
        terms_and_conditions: terms || '',
        notes: notes || '',
        payment_terms_days: 30,
      }

      const res = await api.post('/invoices/', payload)
      // success UI
      toast.success(`Invoice created #${res.data?.invoice_number || res.data?.id || ''}`)
navigate('/invoices')
      // optionally clear form
      setItems([{ description: '', quantity: 1, unit_price: 0 }])
      setDiscount(0)
      setTaxRate(8.5)
      setDescription('')
      setTitle('Service Invoice')
      setTerms('')
      setNotes('')
    } catch (err: any) {
      const msg = err?.response?.data?.detail || err?.message || 'Failed to create invoice'
      toast.error(msg)
      console.error('Create invoice error:', err)
    } finally {
      setSubmitting(false)
    }
  }

  // optional: pick the first contact automatically when loaded
  useEffect(() => {
    if (!contactId && contacts.length > 0) {
      setContactId(contacts[0].id)
    }
  }, [contacts, contactId])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Create Invoice</h1>
        <p className="mt-1 text-sm text-gray-500">Generate an invoice and send to your customer.</p>
      </div>

      <div className="bg-white p-6 rounded-lg shadow space-y-6">
        {/* Customer */}
        <div>
          <label className="block text-sm font-medium text-gray-700">Customer *</label>
          <select
            value={contactId}
            onChange={(e) => setContactId(e.target.value)}
            disabled={loadingContacts || !contacts.length}
            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
          >
            <option value="">{loadingContacts ? 'Loading…' : 'Select customer'}</option>
            {contacts.map((c) => (
              <option key={c.id} value={c.id}>
                {`${c.first_name ?? ''} ${c.last_name ?? ''}`.trim() || c.email || c.id}
              </option>
            ))}
          </select>
        </div>

        {/* Title / Description */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Title</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
              placeholder="Service Invoice"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Tax Rate (%)</label>
            <input
              type="number"
              step="0.01"
              value={taxRate}
              onChange={(e) => setTaxRate(Number(e.target.value))}
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Description</label>
          <textarea
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
            placeholder="Optional description…"
          />
        </div>

        {/* Line items */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-sm font-medium text-gray-900">Line Items</h4>
            <button
              type="button"
              onClick={addItem}
              className="inline-flex items-center px-2 py-1 border border-transparent text-xs font-medium rounded text-primary-700 bg-primary-100 hover:bg-primary-200"
            >
              <PlusIcon className="h-4 w-4 mr-1" />
              Add Item
            </button>
          </div>

          <div className="space-y-3">
            {items.map((it, idx) => (
              <div key={idx} className="grid grid-cols-12 gap-2 items-start">
                <div className="col-span-6">
                  <input
                    value={it.description}
                    onChange={(e) => updateItem(idx, 'description', e.target.value)}
                    placeholder="Description"
                    className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                  />
                </div>
                <div className="col-span-2">
                  <input
                    type="number"
                    step="0.01"
                    value={it.quantity}
                    onChange={(e) => updateItem(idx, 'quantity', Number(e.target.value))}
                    placeholder="Qty"
                    className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                  />
                </div>
                <div className="col-span-2">
                  <input
                    type="number"
                    step="0.01"
                    value={it.unit_price}
                    onChange={(e) => updateItem(idx, 'unit_price', Number(e.target.value))}
                    placeholder="Unit Price"
                    className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                  />
                </div>
                <div className="col-span-1 flex items-center">
                  <div className="text-sm text-gray-900">
                    {(Number(it.quantity || 0) * Number(it.unit_price || 0)).toFixed(2)}
                  </div>
                </div>
                <div className="col-span-1 flex justify-center">
                  {items.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeItem(idx)}
                      className="text-red-600 hover:text-red-800"
                      title="Remove"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Discount / Totals */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Discount</label>
            <div className="mt-1 relative rounded-md shadow-sm">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span className="text-gray-500 sm:text-sm">$</span>
              </div>
              <input
                type="number"
                step="0.01"
                value={discount}
                onChange={(e) => setDiscount(Number(e.target.value))}
                className="pl-7 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
              />
            </div>
          </div>

          <div className="md:col-span-2 bg-gray-50 border rounded-md p-4">
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span>${subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Tax ({taxRate || 0}%):</span>
                <span>${taxAmount.toFixed(2)}</span>
              </div>
              <div className="border-t pt-2 flex justify-between font-semibold">
                <span>Total:</span>
                <span>${total.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Notes / Terms */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Terms & Conditions</label>
            <textarea
              rows={4}
              value={terms}
              onChange={(e) => setTerms(e.target.value)}
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Notes</label>
            <textarea
              rows={4}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
            />
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="button"
            disabled={submitting}
            onClick={createInvoice}
            className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 disabled:opacity-50"
          >
            {submitting ? 'Creating…' : 'Create Invoice'}
          </button>
        </div>
      </div>
    </div>
  )
}


















// // frontend/src/pages/estimates/InvoiceGenerator.tsx
// import { useState, useEffect } from 'react'
// import { useForm, useFieldArray } from 'react-hook-form'
// import { zodResolver } from '@hookform/resolvers/zod'
// import { z } from 'zod'
// import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
// import { useNavigate, useParams } from 'react-router-dom'
// import {
//   DocumentTextIcon,
//   PaperAirplaneIcon,
//   PrinterIcon,
//   CreditCardIcon,
//   ClockIcon,
//   CheckCircleIcon,
//   CalendarIcon,
//   BanknotesIcon
// } from '@heroicons/react/24/outline'
// import toast from 'react-hot-toast'

// import { api } from '../../services/api'

// const invoiceSchema = z.object({
//   estimate_id: z.string().optional(),
//   contact_id: z.string().min(1, 'Customer is required'),
//   invoice_number: z.string().optional(),
//   service_type: z.string().min(1, 'Service type is required'),
//   description: z.string().optional(),
//   line_items: z.array(z.object({
//     description: z.string().min(1, 'Description is required'),
//     quantity: z.number().min(0.1, 'Quantity must be greater than 0'),
//     unit_price: z.number().min(0, 'Unit price must be greater than or equal to 0'),
//   })).min(1, 'At least one line item is required'),
//   tax_rate: z.number().min(0).max(100),
//   discount_amount: z.number().min(0),
//   due_date: z.string().min(1, 'Due date is required'),
//   payment_terms: z.string().min(1, 'Payment terms are required'),
//   notes: z.string().optional(),
// })

// type InvoiceFormData = z.infer<typeof invoiceSchema>

// interface Invoice {
//   id: string
//   invoice_number: string
//   customer_name: string
//   customer_email: string
//   service_type: string
//   status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled'
//   subtotal: number
//   tax_amount: number
//   discount_amount: number
//   total_amount: number
//   due_date: string
//   created_at: string
//   line_items: Array<{
//     description: string
//     quantity: number
//     unit_price: number
//     total: number
//   }>
// }

// export default function InvoiceGenerator() {
//   const navigate = useNavigate()
//   const { estimateId } = useParams()
//   const queryClient = useQueryClient()

//   const [generatedInvoice, setGeneratedInvoice] = useState<Invoice | null>(null)
//   const [showPreview, setShowPreview] = useState(false)

//   const {
//     register,
//     control,
//     handleSubmit,
//     watch,
//     setValue,
//     formState: { errors },
//   } = useForm<InvoiceFormData>({
//     resolver: zodResolver(invoiceSchema),
//     defaultValues: {
//       line_items: [{ description: '', quantity: 1, unit_price: 0 }],
//       tax_rate: 8.25,
//       discount_amount: 0,
//       payment_terms: 'Net 30',
//       due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
//     },
//   })

//   const { fields, append, remove } = useFieldArray({
//     control,
//     name: 'line_items',
//   })

//   const watchedFields = watch()

//   // Fetch estimate data if converting from estimate

// // InvoiceGenerator.tsx - Line 108-115 FIXED

// // Fetch customers
// const { data: customers } = useQuery({
//   queryKey: ['customers'],
//   queryFn: async () => {
//     try {
//       // Try the contacts endpoint first
//       const response = await api.get('/contacts/')  // Added trailing slash
//       return response.data
//     } catch (error: any) {
//       if (error.response?.status === 405) {
//         // If 405, try alternative endpoint
//         console.log('Contacts endpoint not available, using fallback')
//         return []  // Return empty array as fallback
//       }
//       throw error
//     }
//   },
//   // Add error handling and fallback
//   retry: 1,
//   placeholderData: [], // Use empty array as placeholder
// })


//   const { data: estimateData } = useQuery({
//     queryKey: ['estimate', estimateId],
//     queryFn: async () => {
//       const response = await api.get(`/estimates/${estimateId}`)
//       return response.data
//     },
//     enabled: !!estimateId,
//   })

//   // Populate form from estimate data
//   useEffect(() => {
//     if (estimateData && estimateId) {
//       setValue('estimate_id', estimateId)
//       setValue('contact_id', estimateData.contact_id)
//       setValue('service_type', estimateData.service_type)
//       setValue('description', estimateData.description)
//       setValue('line_items', estimateData.line_items)
//       setValue('tax_rate', (estimateData.tax_amount / estimateData.subtotal) * 100)
//       setValue('discount_amount', estimateData.discount_amount)
//     }
//   }, [estimateData, estimateId, setValue])

//   // Create invoice mutation
//   const createInvoiceMutation = useMutation({
//     mutationFn: async (data: InvoiceFormData) => {
//       const payload = {
//         ...data,
//         line_items: data.line_items.map(item => ({
//           ...item,
//           total: item.quantity * item.unit_price
//         }))
//       }

//       const response = await api.post('/invoices', payload)
//       return response.data
//     },
//     onSuccess: (data) => {
//       queryClient.invalidateQueries({ queryKey: ['invoices'] })
//       setGeneratedInvoice(data)
//       toast.success('Invoice created successfully!')
//     },
//     onError: (error: any) => {
//       toast.error(error.response?.data?.detail || 'Failed to create invoice')
//     },
//   })

//   // Send invoice mutation
//   const sendInvoiceMutation = useMutation({
//     mutationFn: async (invoiceId: string) => {
//       const response = await api.post(`/invoices/${invoiceId}/send`)
//       return response.data
//     },
//     onSuccess: () => {
//       toast.success('Invoice sent successfully!')
//       navigate('/invoices')
//     },
//     onError: (error: any) => {
//       toast.error(error.response?.data?.detail || 'Failed to send invoice')
//     },
//   })

//   const onSubmit = (data: InvoiceFormData) => {
//     createInvoiceMutation.mutate(data)
//   }

//   const onCreateAndSend = async (data: InvoiceFormData) => {
//     try {
//       const invoice = await createInvoiceMutation.mutateAsync(data)
//       await sendInvoiceMutation.mutateAsync(invoice.id)
//     } catch (error) {
//       // Error handling is done in the mutations
//     }
//   }

//   // Calculate totals
//   const calculateTotals = () => {
//     const lineItems = watchedFields.line_items || []
//     const subtotal = lineItems.reduce((sum, item) => {
//       return sum + (item.quantity || 0) * (item.unit_price || 0)
//     }, 0)
    
//     const discountAmount = watchedFields.discount_amount || 0
//     const discountedSubtotal = subtotal - discountAmount
//     const taxAmount = (discountedSubtotal * (watchedFields.tax_rate || 0)) / 100
//     const total = discountedSubtotal + taxAmount

//     return {
//       subtotal,
//       discountAmount,
//       taxAmount,
//       total
//     }
//   }

//   const totals = calculateTotals()

//   const formatCurrency = (amount: number) => {
//     return new Intl.NumberFormat('en-US', {
//       style: 'currency',
//       currency: 'USD',
//     }).format(amount)
//   }

//   const serviceTypes = [
//     'Pest Control',
//     'Lawn Care',
//     'Tree Service',
//     'Roof Inspection',
//     'Roof Repair',
//     'Gutter Cleaning',
//     'HVAC Service',
//     'Plumbing',
//     'Electrical',
//     'General Maintenance',
//     'Custom Service'
//   ]

//   const paymentTermsOptions = [
//     'Due on Receipt',
//     'Net 15',
//     'Net 30',
//     'Net 60',
//     '2/10 Net 30',
//     'Custom Terms'
//   ]

//   return (
//     <div className="space-y-6">
//       {/* Header */}
//       <div className="flex justify-between items-center">
//         <div>
//           <h1 className="text-2xl font-bold text-gray-900">
//             {estimateId ? 'Convert Estimate to Invoice' : 'Create Invoice'}
//           </h1>
//           <p className="mt-1 text-sm text-gray-500">
//             Generate professional invoices with payment processing integration
//           </p>
//         </div>
        
//         {estimateId && (
//           <div className="text-sm text-blue-600 bg-blue-50 px-3 py-2 rounded-md">
//             Converting from Estimate #{estimateData?.estimate_number}
//           </div>
//         )}
//       </div>

//       {generatedInvoice ? (
//         /* Invoice Generated Success View */
//         <div className="bg-white shadow rounded-lg p-6">
//           <div className="text-center py-8">
//             <CheckCircleIcon className="h-16 w-16 text-green-500 mx-auto mb-4" />
//             <h3 className="text-lg font-medium text-gray-900 mb-2">
//               Invoice Created Successfully!
//             </h3>
//             <p className="text-gray-600 mb-6">
//               Invoice #{generatedInvoice.invoice_number} has been created for {generatedInvoice.customer_name}
//             </p>
            
//             <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-md mx-auto mb-8">
//               <div className="text-center">
//                 <div className="text-2xl font-bold text-gray-900">{formatCurrency(generatedInvoice.total_amount)}</div>
//                 <div className="text-sm text-gray-500">Total Amount</div>
//               </div>
//               <div className="text-center">
//                 <div className="text-2xl font-bold text-gray-900">
//                   {new Date(generatedInvoice.due_date).toLocaleDateString()}
//                 </div>
//                 <div className="text-sm text-gray-500">Due Date</div>
//               </div>
//               <div className="text-center">
//                 <div className={`text-2xl font-bold ${
//                   generatedInvoice.status === 'paid' ? 'text-green-600' :
//                   generatedInvoice.status === 'overdue' ? 'text-red-600' :
//                   'text-yellow-600'
//                 }`}>
//                   {generatedInvoice.status.toUpperCase()}
//                 </div>
//                 <div className="text-sm text-gray-500">Status</div>
//               </div>
//             </div>
            
//             <div className="flex flex-col sm:flex-row gap-3 justify-center">
//               <button
//                 onClick={() => sendInvoiceMutation.mutate(generatedInvoice.id)}
//                 disabled={sendInvoiceMutation.isPending}
//                 className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 disabled:opacity-50"
//               >
//                 <PaperAirplaneIcon className="h-4 w-4 mr-2" />
//                 {sendInvoiceMutation.isPending ? 'Sending...' : 'Send Invoice'}
//               </button>
              
//               <button
//                 onClick={() => window.print()}
//                 className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
//               >
//                 <PrinterIcon className="h-4 w-4 mr-2" />
//                 Print Invoice
//               </button>
              
//               <button
//                 onClick={() => navigate('/invoices')}
//                 className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
//               >
//                 View All Invoices
//               </button>
//             </div>
//           </div>
//         </div>
//       ) : (
//         /* Invoice Creation Form */
//         <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
//           <div className="lg:col-span-2">
//             <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
//               {/* Customer and Service Info */}
//               <div className="bg-white shadow rounded-lg p-6">
//                 <h3 className="text-lg font-medium text-gray-900 mb-4">Customer & Service Information</h3>
                
//                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//                   <div>
//                     <label className="block text-sm font-medium text-gray-700">
//                       Customer *
//                     </label>
//                     <select
//                       {...register('contact_id')}
//                       disabled={!!estimateId}
//                       className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 disabled:bg-gray-100"
//                     >
//                       <option value="">Select customer...</option>
//                       {customers?.map((customer: any) => (
//                         <option key={customer.id} value={customer.id}>
//                           {customer.first_name} {customer.last_name}
//                         </option>
//                       ))}
//                     </select>
//                     {errors.contact_id && (
//                       <p className="mt-1 text-sm text-red-600">{errors.contact_id.message}</p>
//                     )}
//                   </div>

//                   <div>
//                     <label className="block text-sm font-medium text-gray-700">
//                       Service Type *
//                     </label>
//                     <select
//                       {...register('service_type')}
//                       className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
//                     >
//                       <option value="">Select service...</option>
//                       {serviceTypes.map((service) => (
//                         <option key={service} value={service}>
//                           {service}
//                         </option>
//                       ))}
//                     </select>
//                     {errors.service_type && (
//                       <p className="mt-1 text-sm text-red-600">{errors.service_type.message}</p>
//                     )}
//                   </div>
//                 </div>

//                 <div className="mt-6">
//                   <label className="block text-sm font-medium text-gray-700">
//                     Description
//                   </label>
//                   <textarea
//                     {...register('description')}
//                     rows={3}
//                     className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
//                     placeholder="Description of completed work..."
//                   />
//                 </div>
//               </div>

//               {/* Line Items */}
//               <div className="bg-white shadow rounded-lg p-6">
//                 <h3 className="text-lg font-medium text-gray-900 mb-4">Invoice Items</h3>

//                 <div className="space-y-4">
//                   {fields.map((field, index) => (
//                     <div key={field.id} className="grid grid-cols-12 gap-4 items-start">
//                       <div className="col-span-5">
//                         <input
//                           {...register(`line_items.${index}.description`)}
//                           placeholder="Description of work or materials"
//                           className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 text-sm"
//                         />
//                         {errors.line_items?.[index]?.description && (
//                           <p className="mt-1 text-xs text-red-600">
//                             {errors.line_items[index]?.description?.message}
//                           </p>
//                         )}
//                       </div>
                      
//                       <div className="col-span-2">
//                         <input
//                           {...register(`line_items.${index}.quantity`, { valueAsNumber: true })}
//                           type="number"
//                           step="0.1"
//                           min="0"
//                           placeholder="Qty"
//                           className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 text-sm"
//                         />
//                       </div>
                      
//                       <div className="col-span-2">
//                         <input
//                           {...register(`line_items.${index}.unit_price`, { valueAsNumber: true })}
//                           type="number"
//                           step="0.01"
//                           min="0"
//                           placeholder="Unit Price"
//                           className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 text-sm"
//                         />
//                       </div>
                      
//                       <div className="col-span-2 text-sm text-gray-900 font-medium pt-2">
//                         {formatCurrency((watchedFields.line_items?.[index]?.quantity || 0) * (watchedFields.line_items?.[index]?.unit_price || 0))}
//                       </div>
                      
//                       <div className="col-span-1">
//                         {fields.length > 1 && (
//                           <button
//                             type="button"
//                             onClick={() => remove(index)}
//                             className="text-red-600 hover:text-red-800 p-1"
//                           >
//                             ×
//                           </button>
//                         )}
//                       </div>
//                     </div>
//                   ))}
//                 </div>

//                 <button
//                   type="button"
//                   onClick={() => append({ description: '', quantity: 1, unit_price: 0 })}
//                   className="mt-4 inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
//                 >
//                   Add Line Item
//                 </button>
//               </div>

//               {/* Payment Terms */}
//               <div className="bg-white shadow rounded-lg p-6">
//                 <h3 className="text-lg font-medium text-gray-900 mb-4">Payment & Terms</h3>
                
//                 <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
//                   <div>
//                     <label className="block text-sm font-medium text-gray-700">
//                       Tax Rate (%)
//                     </label>
//                     <input
//                       {...register('tax_rate', { valueAsNumber: true })}
//                       type="number"
//                       step="0.01"
//                       min="0"
//                       max="100"
//                       className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
//                     />
//                   </div>

//                   <div>
//                     <label className="block text-sm font-medium text-gray-700">
//                       Discount ($)
//                     </label>
//                     <input
//                       {...register('discount_amount', { valueAsNumber: true })}
//                       type="number"
//                       step="0.01"
//                       min="0"
//                       className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
//                     />
//                   </div>

//                   <div>
//                     <label className="block text-sm font-medium text-gray-700">
//                       Due Date *
//                     </label>
//                     <input
//                       {...register('due_date')}
//                       type="date"
//                       className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
//                     />
//                     {errors.due_date && (
//                       <p className="mt-1 text-sm text-red-600">{errors.due_date.message}</p>
//                     )}
//                   </div>

//                   <div>
//                     <label className="block text-sm font-medium text-gray-700">
//                       Payment Terms *
//                     </label>
//                     <select
//                       {...register('payment_terms')}
//                       className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
//                     >
//                       {paymentTermsOptions.map((term) => (
//                         <option key={term} value={term}>
//                           {term}
//                         </option>
//                       ))}
//                     </select>
//                     {errors.payment_terms && (
//                       <p className="mt-1 text-sm text-red-600">{errors.payment_terms.message}</p>
//                     )}
//                   </div>
//                 </div>

//                 <div className="mt-6">
//                   <label className="block text-sm font-medium text-gray-700">
//                     Invoice Notes
//                   </label>
//                   <textarea
//                     {...register('notes')}
//                     rows={3}
//                     className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
//                     placeholder="Additional notes or payment instructions..."
//                   />
//                 </div>
//               </div>

//               {/* Action Buttons */}
//               <div className="flex justify-end space-x-3">
//                 <button
//                   type="button"
//                   onClick={() => navigate(estimateId ? '/estimates' : '/invoices')}
//                   className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50"
//                 >
//                   Cancel
//                 </button>
                
//                 <button
//                   type="submit"
//                   disabled={createInvoiceMutation.isPending}
//                   className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 disabled:opacity-50"
//                 >
//                   <DocumentTextIcon className="h-4 w-4 mr-2" />
//                   {createInvoiceMutation.isPending ? 'Creating...' : 'Create Invoice'}
//                 </button>
                
//                 <button
//                   type="button"
//                   onClick={handleSubmit(onCreateAndSend)}
//                   disabled={createInvoiceMutation.isPending || sendInvoiceMutation.isPending}
//                   className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 disabled:opacity-50"
//                 >
//                   <PaperAirplaneIcon className="h-4 w-4 mr-2" />
//                   Create & Send
//                 </button>
//               </div>
//             </form>
//           </div>

//           {/* Invoice Preview/Summary */}
//           <div className="lg:col-span-1">
//             <div className="bg-white shadow rounded-lg p-6 sticky top-6">
//               <div className="flex items-center mb-4">
//                 <BanknotesIcon className="h-5 w-5 text-gray-400 mr-2" />
//                 <h3 className="text-lg font-medium text-gray-900">Invoice Summary</h3>
//               </div>
              
//               <div className="space-y-3">
//                 <div className="flex justify-between text-sm">
//                   <span className="text-gray-500">Subtotal:</span>
//                   <span className="text-gray-900">{formatCurrency(totals.subtotal)}</span>
//                 </div>
                
//                 {totals.discountAmount > 0 && (
//                   <div className="flex justify-between text-sm">
//                     <span className="text-gray-500">Discount:</span>
//                     <span className="text-red-600">-{formatCurrency(totals.discountAmount)}</span>
//                   </div>
//                 )}
                
//                 <div className="flex justify-between text-sm">
//                   <span className="text-gray-500">Tax ({watchedFields.tax_rate || 0}%):</span>
//                   <span className="text-gray-900">{formatCurrency(totals.taxAmount)}</span>
//                 </div>
                
//                 <div className="border-t pt-3">
//                   <div className="flex justify-between text-lg font-medium">
//                     <span className="text-gray-900">Total:</span>
//                     <span className="text-gray-900">{formatCurrency(totals.total)}</span>
//                   </div>
//                 </div>
//               </div>

//               {watchedFields.due_date && (
//                 <div className="mt-6 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
//                   <div className="flex items-center">
//                     <CalendarIcon className="h-4 w-4 text-yellow-600 mr-2" />
//                     <div className="text-sm">
//                       <div className="text-yellow-800 font-medium">Due Date</div>
//                       <div className="text-yellow-700">
//                         {new Date(watchedFields.due_date).toLocaleDateString()}
//                       </div>
//                     </div>
//                   </div>
//                 </div>
//               )}

//               <div className="mt-6 text-xs text-gray-500">
//                 <div className="flex items-center mb-2">
//                   <CreditCardIcon className="h-4 w-4 mr-1" />
//                   <span>Payment Methods Accepted:</span>
//                 </div>
//                 <ul className="list-disc list-inside space-y-1 ml-4">
//                   <li>Credit/Debit Cards</li>
//                   <li>Bank Transfer</li>
//                   <li>Check</li>
//                   <li>Online Payment Portal</li>
//                 </ul>
//               </div>
//             </div>
//           </div>
//         </div>
//       )}
//     </div>
//   )
// }