// frontend/src/pages/estimates/EstimateBuilder.tsx
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline'
import { api } from '../../services/api'
import EstimateForm from '../../components/forms/EstimateForm'

type Contact = {
  id: string
  first_name?: string
  last_name?: string
  email?: string
}

export default function EstimateBuilder() {
  const [showPreview, setShowPreview] = useState(true)
  const qc = useQueryClient()
  const navigate = useNavigate()

  // Load customers (proves auth + API are working)
  const { data: customers = [], isLoading: customersLoading } = useQuery<Contact[]>({
    queryKey: ['customers'],
    queryFn: async () => {
      const res = await api.get('/contacts/')
      const d = res?.data
      // backend may return array or {contacts:[...]}
      return Array.isArray(d) ? d : (d?.contacts ?? [])
    },
    staleTime: 300_000,
  })

  // Create estimate mutation
  const createEstimate = useMutation({
    mutationFn: async (payload: any) => {
      const res = await api.post('/estimates/', payload)
      return res.data
    },
    onSuccess: (data: any) => {
      // Try to print something friendly from backend
      const label = data?.estimate_number || data?.id || 'Estimate'
      toast.success(`${label} created successfully`)
      // refresh lists / details that depend on estimates
      qc.invalidateQueries({ queryKey: ['estimates'] })
      // navigate to list (adjust route to your app, if different)
      navigate('/estimates')
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.detail || 'Failed to create estimate'
      toast.error(msg)
      // keep console for dev
      console.error('Create estimate error:', err)
    },
  })

  // Map form values -> backend payload
  const handleCreate = (values: any) => {
    const line_items = (values.items || []).map((it: any) => ({
      description: it.description,
      quantity: Number(it.quantity || 0),
      unit_price: Number(it.unit_price || 0),
    }))

    // Compute valid_days from valid_until (if provided)
    let valid_days = 30
    if (values.valid_until) {
      const today = new Date()
      const until = new Date(values.valid_until)
      const ms = until.getTime() - new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime()
      valid_days = Math.max(1, Math.ceil(ms / (1000 * 60 * 60 * 24)))
    }

    const payload = {
      contact_id: values.customer_id, // backend expects contact_id
      service_type: values.service_type || 'Service',
      description: values.description || '',
      line_items,
      tax_rate: Number(values.tax_rate || 0),
      discount_amount: Number(values.discount_amount || 0),
      terms_and_conditions: values.terms_and_conditions || '',
      notes: values.notes || '',
      valid_days,
    }

    createEstimate.mutate(payload)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Create Estimate</h1>
          <p className="mt-1 text-sm text-gray-500">
            Build professional estimates with detailed line items and automatic calculations
          </p>
        </div>
        <button
          onClick={() => setShowPreview(v => !v)}
          className="inline-flex items-center px-3 py-2 rounded-md border text-sm bg-white hover:bg-gray-50"
        >
          {showPreview ? (
            <>
              <EyeSlashIcon className="h-4 w-4 mr-2" /> Hide Preview
            </>
          ) : (
            <>
              <EyeIcon className="h-4 w-4 mr-2" /> Show Preview
            </>
          )}
        </button>
      </div>

      {/* Quick customer check (optional helper) */}
      <div className="p-4 border rounded-lg bg-white shadow">
        <div className="mb-2 text-sm text-gray-600">
          Customers loaded: <strong>{customers.length}</strong>
        </div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Quick Customer Check</label>
        <select className="block w-full border-gray-300 rounded-md" disabled={!customers.length}>
          <option value="">{customersLoading ? 'Loading…' : 'Select customer'}</option>
          {customers.map(c => (
            <option key={c.id} value={c.id}>
              {`${c.first_name ?? ''} ${c.last_name ?? ''}`.trim() || c.email || c.id}
            </option>
          ))}
        </select>
      </div>

      {/* Full form */}
      <div className="bg-white rounded-lg shadow p-6">
        <EstimateForm
          mode="create"
          onSubmit={handleCreate}
          onCancel={() => navigate('/estimates')}
          isLoading={createEstimate.isPending}
        />
      </div>
    </div>
  )
}








// // frontend/src/pages/estimates/EstimateBuilder.tsx
// import { useMemo, useState } from 'react'
// import { useForm, useFieldArray, Controller } from 'react-hook-form'
// import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
// import toast from 'react-hot-toast'
// import { api } from '../../services/api'
// import {
//   PlusIcon,
//   TrashIcon,
//   EyeIcon,
//   EyeSlashIcon,
// } from '@heroicons/react/24/outline'
// console.log('[EstimateBuilder] mounted');

// type Contact = {
//   id: string
//   first_name?: string
//   last_name?: string
//   email?: string
//   phone?: string
// }

// type LineItem = {
//   name: string
//   description?: string
//   quantity: number
//   unit_price: number
//   tax_rate?: number // percent (e.g., 10 for 10%)
// }

// type EstimateForm = {
//   contact_id: string
//   service_type?: string
//   description?: string
//   issue_date: string
//   valid_until?: string
//   discount_amount?: number // currency amount
//   notes?: string
//   terms?: string
//   items: LineItem[]
// }

// const currency = (n: number) =>
//   (isFinite(n) ? n : 0).toLocaleString(undefined, { style: 'currency', currency: 'USD' })

// export default function EstimateBuilder() {
//   const queryClient = useQueryClient()
//   const [showPreview, setShowPreview] = useState(true)

//   // ---- load customers (array) ----
//   const { data: customers = [], isLoading: loadingCustomers } = useQuery<Contact[]>({
//     queryKey: ['customers'],
//     queryFn: async () => {
//       const res = await api.get('/contacts/')
//       const d = res?.data
//       // Your API (per logs) returns an array already
//       return Array.isArray(d) ? d : (d?.contacts ?? [])
//     },
//     staleTime: 5 * 60 * 1000,
//   })

//   const {
//     register,
//     control,
//     handleSubmit,
//     formState: { errors, isSubmitting },
//     watch,
//     setValue,
//     reset,
//   } = useForm<EstimateForm>({
//     defaultValues: {
//       contact_id: '',
//       service_type: '',
//       description: '',
//       issue_date: new Date().toISOString().slice(0, 10),
//       valid_until: '',
//       discount_amount: 0,
//       notes: '',
//       terms: '',
//       items: [
//         { name: '', description: '', quantity: 1, unit_price: 0, tax_rate: 0 },
//       ],
//     },
//   })

//   const { fields, append, remove } = useFieldArray({
//     control,
//     name: 'items',
//   })

//   // ---- totals ----
//   const items = watch('items')
//   const discountAmount = Number(watch('discount_amount') || 0)

//   const { subtotal, taxTotal, grandTotal } = useMemo(() => {
//     const subtotalCalc = (items || []).reduce((sum, it) => {
//       const qty = Number(it.quantity || 0)
//       const price = Number(it.unit_price || 0)
//       return sum + qty * price
//     }, 0)

//     const taxCalc = (items || []).reduce((sum, it) => {
//       const qty = Number(it.quantity || 0)
//       const price = Number(it.unit_price || 0)
//       const rate = Number(it.tax_rate || 0) / 100
//       return sum + qty * price * rate
//     }, 0)

//     const total = Math.max(0, subtotalCalc + taxCalc - Math.max(0, discountAmount))
//     return { subtotal: subtotalCalc, taxTotal: taxCalc, grandTotal: total }
//   }, [items, discountAmount])

//   // ---- create estimate ----
//   const createEstimate = useMutation({
//     mutationFn: async (payload: any) => {
//       // Use trailing slash to match many FastAPI include_router setups
//       const res = await api.post('/estimates/', payload)
//       return res.data
//     },
//     onSuccess: (data) => {
//       toast.success('Estimate created')
//       queryClient.invalidateQueries({ queryKey: ['estimates'] })
//       // Optionally navigate or reset form
//       reset()
//     },
//     onError: (err: any) => {
//       const msg = err?.response?.data?.detail || 'Failed to create estimate'
//       toast.error(msg)
//     },
//   })

//   const onSubmit = (values: EstimateForm) => {
//     const payload = {
//       contact_id: values.contact_id,
//       service_type: values.service_type,
//       description: values.description,
//       issue_date: values.issue_date ? new Date(values.issue_date).toISOString() : undefined,
//       valid_until: values.valid_until ? new Date(values.valid_until).toISOString() : undefined,
//       discount_amount: Number(values.discount_amount || 0),
//       items: (values.items || []).map((it) => ({
//         name: it.name,
//         description: it.description,
//         quantity: Number(it.quantity || 0),
//         unit_price: Number(it.unit_price || 0),
//         tax_rate: Number(it.tax_rate || 0),
//       })),
//       totals: {
//         subtotal,
//         tax: taxTotal,
//         discount: Number(values.discount_amount || 0),
//         total: grandTotal,
//       },
//       notes: values.notes,
//       terms: values.terms,
//       status: 'draft',
//     }
//     createEstimate.mutate(payload)
//   }

//   return (
//     <div className="space-y-6">
//       <div className="flex items-center justify-between">
//         <div>
//           <h1 className="text-2xl font-bold text-gray-900">Create Estimate</h1>
//           <p className="mt-1 text-sm text-gray-500">
//             Build professional estimates with detailed line items and automatic calculations
//           </p>
//         </div>

//         <button
//           onClick={() => setShowPreview((v) => !v)}
//           className="inline-flex items-center px-3 py-2 rounded-md border text-sm bg-white hover:bg-gray-50"
//         >
//           {showPreview ? (
//             <>
//               <EyeSlashIcon className="h-4 w-4 mr-2" /> Hide Preview
//             </>
//           ) : (
//             <>
//               <EyeIcon className="h-4 w-4 mr-2" /> Show Preview
//             </>
//           )}
//         </button>
//       </div>
        
//            {/* Loader that never hides the whole page */}
// {loadingCustomers && (
//   <div className="p-2 text-xs text-blue-600">ESTIMATE FORM LOADING…</div>
// )}

// {/* The form should ALWAYS render, even if customers are still loading */}
// <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
//   {/* LEFT: form */}
//   <div className="lg:col-span-2 space-y-6">
//     {/* Customer & meta */}
//     <div className="bg-white rounded-lg shadow p-6 space-y-4">
//       <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//         <div>
//           <label className="block text-sm font-medium text-gray-700">Customer *</label>
//           <select
//             {...register('contact_id', { required: 'Customer is required' })}
//             className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
//             disabled={loadingCustomers}
//           >
//             <option value="">
//               {loadingCustomers ? 'Loading customers…' : 'Select customer'}
//             </option>
//             {(customers || []).map((c: any) => (
//               <option key={c.id} value={c.id}>
//                 {`${c.first_name ?? ''} ${c.last_name ?? ''}`.trim() || c.email || c.id}
//               </option>
//             ))}
//           </select>
//           {errors.contact_id && (
//             <p className="mt-1 text-sm text-red-600">{errors.contact_id.message}</p>
//           )}
//         </div>

//               <div>
//                 <label className="block text-sm font-medium text-gray-700">Service Type</label>
//                 <input
//                   type="text"
//                   placeholder="e.g., Remodeling, HVAC Service"
//                   {...register('service_type')}
//                   className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
//                 />
//               </div>

//               <div>
//                 <label className="block text-sm font-medium text-gray-700">Issue Date</label>
//                 <input
//                   type="date"
//                   {...register('issue_date')}
//                   className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
//                 />
//               </div>

//               <div>
//                 <label className="block text-sm font-medium text-gray-700">Valid Until</label>
//                 <input
//                   type="date"
//                   {...register('valid_until')}
//                   className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
//                 />
//               </div>
//             </div>

//             <div>
//               <label className="block text-sm font-medium text-gray-700">Description</label>
//               <textarea
//                 rows={3}
//                 placeholder="Short description of the work"
//                 {...register('description')}
//                 className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
//               />
//             </div>
//           </div>

//           {/* Line items */}
//           <div className="bg-white rounded-lg shadow p-6">
//             <div className="flex items-center justify-between mb-4">
//               <h3 className="text-lg font-medium text-gray-900">Line Items</h3>
//               <button
//                 type="button"
//                 onClick={() =>
//                   append({ name: '', description: '', quantity: 1, unit_price: 0, tax_rate: 0 })
//                 }
//                 className="inline-flex items-center px-3 py-2 rounded-md border text-sm bg-white hover:bg-gray-50"
//               >
//                 <PlusIcon className="h-4 w-4 mr-2" />
//                 Add Item
//               </button>
//             </div>

//             <div className="space-y-4">
//               {fields.map((field, idx) => (
//                 <div key={field.id} className="grid grid-cols-1 md:grid-cols-12 gap-3 items-start">
//                   <div className="md:col-span-3">
//                     <label className="block text-xs font-medium text-gray-600">Item Name *</label>
//                     <input
//                       {...register(`items.${idx}.name` as const, { required: 'Required' })}
//                       className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
//                       placeholder="e.g., Service Call"
//                     />
//                   </div>
//                   <div className="md:col-span-4">
//                     <label className="block text-xs font-medium text-gray-600">Description</label>
//                     <input
//                       {...register(`items.${idx}.description` as const)}
//                       className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
//                       placeholder="Optional details"
//                     />
//                   </div>
//                   <div className="md:col-span-2">
//                     <label className="block text-xs font-medium text-gray-600">Qty *</label>
//                     <input
//                       type="number"
//                       step="1"
//                       min="0"
//                       {...register(`items.${idx}.quantity` as const, {
//                         required: 'Required',
//                         valueAsNumber: true,
//                       })}
//                       className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
//                     />
//                   </div>
//                   <div className="md:col-span-2">
//                     <label className="block text-xs font-medium text-gray-600">Unit Price *</label>
//                     <input
//                       type="number"
//                       step="0.01"
//                       min="0"
//                       {...register(`items.${idx}.unit_price` as const, {
//                         required: 'Required',
//                         valueAsNumber: true,
//                       })}
//                       className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
//                     />
//                   </div>
//                   <div className="md:col-span-1">
//                     <label className="block text-xs font-medium text-gray-600">Tax %</label>
//                     <input
//                       type="number"
//                       step="0.01"
//                       min="0"
//                       {...register(`items.${idx}.tax_rate` as const, { valueAsNumber: true })}
//                       className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
//                     />
//                   </div>

//                   <div className="md:col-span-12 flex justify-end">
//                     <button
//                       type="button"
//                       onClick={() => remove(idx)}
//                       className="inline-flex items-center px-2 py-1 rounded-md border text-xs bg-white hover:bg-gray-50"
//                     >
//                       <TrashIcon className="h-4 w-4 mr-1" /> Remove
//                     </button>
//                   </div>
//                 </div>
//               ))}
//             </div>
//           </div>

//           {/* Notes / Terms */}
//           <div className="bg-white rounded-lg shadow p-6 space-y-4">
//             <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
//               <div className="md:col-span-1">
//                 <label className="block text-sm font-medium text-gray-700">Discount (amount)</label>
//                 <input
//                   type="number"
//                   step="0.01"
//                   min="0"
//                   {...register('discount_amount', { valueAsNumber: true })}
//                   className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
//                 />
//               </div>
//             </div>

//             <div>
//               <label className="block text-sm font-medium text-gray-700">Notes</label>
//               <textarea
//                 rows={3}
//                 {...register('notes')}
//                 className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
//               />
//             </div>

//             <div>
//               <label className="block text-sm font-medium text-gray-700">Terms</label>
//               <textarea
//                 rows={3}
//                 {...register('terms')}
//                 className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
//               />
//             </div>

//             <div className="flex items-center gap-3">
//               <button
//                 type="submit"
//                 disabled={isSubmitting || createEstimate.isPending}
//                 className="inline-flex items-center px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60"
//               >
//                 Save Draft
//               </button>
//               {/* If you later add "Save & Send", post with status 'sent' */}
//             </div>
//           </div>
//         </div>

//         {/* Right: preview */}
//         {showPreview && (
//           <div className="lg:col-span-1">
//             <div className="bg-white rounded-lg shadow p-6 space-y-4 sticky top-4">
//               <h3 className="text-lg font-medium text-gray-900">Preview</h3>

//               <div className="text-sm text-gray-600">
//                 <div className="flex justify-between">
//                   <span>Subtotal</span>
//                   <span className="font-medium">{currency(subtotal)}</span>
//                 </div>
//                 <div className="flex justify-between">
//                   <span>Tax</span>
//                   <span className="font-medium">{currency(taxTotal)}</span>
//                 </div>
//                 <div className="flex justify-between">
//                   <span>Discount</span>
//                   <span className="font-medium">-{currency(discountAmount || 0)}</span>
//                 </div>
//                 <div className="border-t my-2" />
//                 <div className="flex justify-between text-base">
//                   <span className="font-semibold">Total</span>
//                   <span className="font-semibold">{currency(grandTotal)}</span>
//                 </div>
//               </div>

//               <div>
//                 <h4 className="text-sm font-medium text-gray-900 mb-2">Items</h4>
//                 <div className="space-y-2">
//                   {(items || []).map((it, i) => {
//                     const line = Number(it.quantity || 0) * Number(it.unit_price || 0)
//                     const tax = line * (Number(it.tax_rate || 0) / 100)
//                     return (
//                       <div key={i} className="text-sm">
//                         <div className="flex justify-between">
//                           <span className="font-medium">{it.name || 'Item'}</span>
//                           <span>{currency(line + tax)}</span>
//                         </div>
//                         {it.description && (
//                           <div className="text-gray-500">{it.description}</div>
//                         )}
//                         <div className="text-gray-500">
//                           {it.quantity} × {currency(Number(it.unit_price || 0))}{' '}
//                           {Number(it.tax_rate || 0) > 0 && `(+${it.tax_rate}% tax)`}
//                         </div>
//                       </div>
//                     )
//                   })}
//                 </div>
//               </div>
//             </div>
//           </div>
//         )}
     
//       </form>
//     </div>
//   )
// }

























// // // frontend/src/pages/estimates/EstimateBuilder.tsx
// // import { useState, useEffect } from 'react'
// // import { useForm, useFieldArray } from 'react-hook-form'
// // import { zodResolver } from '@hookform/resolvers/zod'
// // import { z } from 'zod'
// // import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
// // import { useNavigate, useParams } from 'react-router-dom'
// // import {
// //   PlusIcon,
// //   TrashIcon,
// //   DocumentTextIcon,
// //   CalculatorIcon,
// //   EyeIcon,
// //   PaperAirplaneIcon
// // } from '@heroicons/react/24/outline'
// // import toast from 'react-hot-toast'

// // import { api } from '../../services/api'

// // const lineItemSchema = z.object({
// //   description: z.string().min(1, 'Description is required'),
// //   quantity: z.number().min(0.1, 'Quantity must be greater than 0'),
// //   unit_price: z.number().min(0, 'Unit price must be greater than or equal to 0'),
// // })

// // const estimateSchema = z.object({
// //   contact_id: z.string().min(1, 'Customer is required'),
// //   service_type: z.string().min(1, 'Service type is required'),
// //   description: z.string().optional(),
// //   line_items: z.array(lineItemSchema).min(1, 'At least one line item is required'),
// //   tax_rate: z.number().min(0).max(100),
// //   discount_amount: z.number().min(0),
// //   valid_days: z.number().min(1, 'Valid days must be at least 1'),
// //   terms_and_conditions: z.string().optional(),
// //   notes: z.string().optional(),
// // })

// // type EstimateFormData = z.infer<typeof estimateSchema>

// // export default function EstimateBuilder() {
// //   const navigate = useNavigate()
// //   const { id } = useParams()
// //   const isEditing = !!id
// //   const queryClient = useQueryClient()

// //   const [showPreview, setShowPreview] = useState(false)

// //   const {
// //     register,
// //     control,
// //     handleSubmit,
// //     watch,
// //     setValue,
// //     formState: { errors },
// //   } = useForm<EstimateFormData>({
// //     resolver: zodResolver(estimateSchema),
// //     defaultValues: {
// //       line_items: [{ description: '', quantity: 1, unit_price: 0 }],
// //       tax_rate: 8.25,
// //       discount_amount: 0,
// //       valid_days: 30,
// //       terms_and_conditions: 'Payment is due within 30 days of acceptance. Work will commence upon signed agreement and deposit if required.',
// //     },
// //   })

// //   const { fields, append, remove } = useFieldArray({
// //     control,
// //     name: 'line_items',
// //   })

// //   const watchedFields = watch()

// //   // Fetch customers
// //  // Find your existing code that looks like this:
// // const { data: customers } = useQuery({
// //   queryKey: ['customers'],
// //   queryFn: async () => {
// //     const response = await api.get('/contacts/')
// //     console.log('API response:', response)
// //     return response.data
// //   },
// //   // ADD these new options to your existing useQuery:
// //   staleTime: 5 * 60 * 1000,
// //   cacheTime: 10 * 60 * 1000,
// //   refetchOnWindowFocus: false,
// //   refetchOnMount: false,
// //   refetchOnReconnect: false,
// // })

// // // Add this after line 78 where you log the API response


// // // Add this debug log ONCE


// //   // Fetch estimate data if editing
// //   const { data: estimateData } = useQuery({
// //     queryKey: ['estimate', id],
// //     queryFn: async () => {
// //       const response = await api.get(`/estimates/${id}`)
// //       return response.data
// //     },
// //     enabled: isEditing,
// //   })

// //   // Populate form when editing
// //   useEffect(() => {
// //     if (estimateData && isEditing) {
// //       setValue('contact_id', estimateData.contact_id)
// //       setValue('service_type', estimateData.service_type)
// //       setValue('description', estimateData.description)
// //       setValue('line_items', estimateData.line_items)
// //       setValue('tax_rate', (estimateData.tax_amount / estimateData.subtotal) * 100)
// //       setValue('discount_amount', estimateData.discount_amount)
// //       setValue('terms_and_conditions', estimateData.terms_and_conditions)
// //       setValue('notes', estimateData.notes)
// //     }
// //   }, [estimateData, isEditing, setValue])

// //   // Create/Update estimate mutation
// //   const saveEstimateMutation = useMutation({
// //     mutationFn: async (data: EstimateFormData) => {
// //       const payload = {
// //         ...data,
// //         line_items: data.line_items.map(item => ({
// //           ...item,
// //           total: item.quantity * item.unit_price
// //         }))
// //       }

// //       if (isEditing) {
// //         const response = await api.put(`/estimates/${id}`, payload)
// //         return response.data
// //       } else {
// //         const response = await api.post('/estimates', payload)
// //         return response.data
// //       }
// //     },
// //     onSuccess: (data) => {
// //       queryClient.invalidateQueries({ queryKey: ['estimates'] })
// //       toast.success(isEditing ? 'Estimate updated successfully!' : 'Estimate created successfully!')
// //       navigate('/estimates')
// //     },
// //     onError: (error: any) => {
// //       toast.error(error.response?.data?.detail || 'Failed to save estimate')
// //     },
// //   })

// //   // Send estimate mutation
// //   const sendEstimateMutation = useMutation({
// //     mutationFn: async (estimateId: string) => {
// //       const response = await api.post(`/estimates/${estimateId}/send`)
// //       return response.data
// //     },
// //     onSuccess: () => {
// //       toast.success('Estimate sent successfully!')
// //       navigate('/estimates')
// //     },
// //     onError: (error: any) => {
// //       toast.error(error.response?.data?.detail || 'Failed to send estimate')
// //     },
// //   })

// //   const onSubmit = (data: EstimateFormData) => {
// //     saveEstimateMutation.mutate(data)
// //   }

// //   const onSaveAndSend = async (data: EstimateFormData) => {
// //     try {
// //       const estimate = await saveEstimateMutation.mutateAsync(data)
// //       await sendEstimateMutation.mutateAsync(estimate.id)
// //     } catch (error) {
// //       // Error handling is done in the mutations
// //     }
// //   }

// //   // Calculate totals
// //   const calculateTotals = () => {
// //     const lineItems = watchedFields.line_items || []
// //     const subtotal = lineItems.reduce((sum, item) => {
// //       return sum + (item.quantity || 0) * (item.unit_price || 0)
// //     }, 0)
    
// //     const discountAmount = watchedFields.discount_amount || 0
// //     const discountedSubtotal = subtotal - discountAmount
// //     const taxAmount = (discountedSubtotal * (watchedFields.tax_rate || 0)) / 100
// //     const total = discountedSubtotal + taxAmount

// //     return {
// //       subtotal,
// //       discountAmount,
// //       taxAmount,
// //       total
// //     }
// //   }

// //   const totals = calculateTotals()

// //   const formatCurrency = (amount: number) => {
// //     return new Intl.NumberFormat('en-US', {
// //       style: 'currency',
// //       currency: 'USD',
// //     }).format(amount)
// //   }

// //   const serviceTypes = [
// //     'Pest Control',
// //     'Lawn Care',
// //     'Tree Service',
// //     'Roof Inspection',
// //     'Roof Repair',
// //     'Gutter Cleaning',
// //     'HVAC Service',
// //     'Plumbing',
// //     'Electrical',
// //     'General Maintenance',
// //     'Custom Service'
// //   ]

// //   return (
// //     <div className="space-y-6">
// //       {/* Header */}
// //       <div className="flex justify-between items-center">
// //         <div>
// //           <h1 className="text-2xl font-bold text-gray-900">
// //             {isEditing ? 'Edit Estimate' : 'Create Estimate'}
// //           </h1>
// //           <p className="mt-1 text-sm text-gray-500">
// //             Build professional estimates with detailed line items and automatic calculations
// //           </p>
// //         </div>
        
// //         <div className="flex items-center space-x-3">
// //           <button
// //             onClick={() => setShowPreview(!showPreview)}
// //             className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
// //           >
// //             <EyeIcon className="h-4 w-4 mr-2" />
// //             {showPreview ? 'Hide Preview' : 'Preview'}
// //           </button>
// //         </div>
// //       </div>

// //       <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
// //         {/* Form */}
// //         <div className={`${showPreview ? 'lg:col-span-2' : 'lg:col-span-3'}`}>
// //           <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
// //             {/* Customer and Service Info */}
// //             <div className="bg-white shadow rounded-lg p-6">
// //               <h3 className="text-lg font-medium text-gray-900 mb-4">Customer & Service Information</h3>
              
// //               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
// //                 <div>
// //                   <label className="block text-sm font-medium text-gray-700">
// //                     Customer *
// //                   </label>
// // console.log('Customers data:', customers)
// // console.log('Customers length:', customers?.length)
// // console.log('First customer:', customers?.[0])

// // <select
// //   {...register('contact_id')}
// //   className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
// // >
// //   style={{ backgroundColor: 'white', color: 'black' }}
// //   <option value="">Select customer...</option>
// //   {customers?.map((customer: any) => {
// //     return (
// //       <option key={customer.id} value={customer.id}>
// //         {customer.first_name} {customer.last_name}
// //       </option>
// //     )
// //   })}
// // </select>
// //                   {errors.contact_id && (
// //                     <p className="mt-1 text-sm text-red-600">{errors.contact_id.message}</p>
// //                   )}
// //                 </div>

// //                 <div>
// //                   <label className="block text-sm font-medium text-gray-700">
// //                     Service Type *
// //                   </label>
// //                   <select
// //                     {...register('service_type')}
// //                     className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
// //                   >
// //                     <option value="">Select service...</option>
// //                     {serviceTypes.map((service) => (
// //                       <option key={service} value={service}>
// //                         {service}
// //                       </option>
// //                     ))}
// //                   </select>
// //                   {errors.service_type && (
// //                     <p className="mt-1 text-sm text-red-600">{errors.service_type.message}</p>
// //                   )}
// //                 </div>
// //               </div>

// //               <div className="mt-6">
// //                 <label className="block text-sm font-medium text-gray-700">
// //                   Description
// //                 </label>
// //                 <textarea
// //                   {...register('description')}
// //                   rows={3}
// //                   className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
// //                   placeholder="Brief description of the work to be performed..."
// //                 />
// //               </div>
// //             </div>

// //             {/* Line Items */}
// //             <div className="bg-white shadow rounded-lg p-6">
// //               <div className="flex justify-between items-center mb-4">
// //                 <h3 className="text-lg font-medium text-gray-900">Line Items</h3>
// //                 <button
// //                   type="button"
// //                   onClick={() => append({ description: '', quantity: 1, unit_price: 0 })}
// //                   className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-primary-700 bg-primary-100 hover:bg-primary-200"
// //                 >
// //                   <PlusIcon className="h-4 w-4 mr-1" />
// //                   Add Item
// //                 </button>
// //               </div>

// //               <div className="space-y-4">
// //                 {fields.map((field, index) => (
// //                   <div key={field.id} className="grid grid-cols-12 gap-4 items-start">
// //                     <div className="col-span-5">
// //                       <input
// //                         {...register(`line_items.${index}.description`)}
// //                         placeholder="Description of work or materials"
// //                         className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 text-sm"
// //                       />
// //                       {errors.line_items?.[index]?.description && (
// //                         <p className="mt-1 text-xs text-red-600">
// //                           {errors.line_items[index]?.description?.message}
// //                         </p>
// //                       )}
// //                     </div>
                    
// //                     <div className="col-span-2">
// //                       <input
// //                         {...register(`line_items.${index}.quantity`, { valueAsNumber: true })}
// //                         type="number"
// //                         step="0.1"
// //                         min="0"
// //                         placeholder="Qty"
// //                         className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 text-sm"
// //                       />
// //                     </div>
                    
// //                     <div className="col-span-2">
// //                       <input
// //                         {...register(`line_items.${index}.unit_price`, { valueAsNumber: true })}
// //                         type="number"
// //                         step="0.01"
// //                         min="0"
// //                         placeholder="Unit Price"
// //                         className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 text-sm"
// //                       />
// //                     </div>
                    
// //                     <div className="col-span-2 text-sm text-gray-900 font-medium pt-2">
// //                       {formatCurrency((watchedFields.line_items?.[index]?.quantity || 0) * (watchedFields.line_items?.[index]?.unit_price || 0))}
// //                     </div>
                    
// //                     <div className="col-span-1">
// //                       {fields.length > 1 && (
// //                         <button
// //                           type="button"
// //                           onClick={() => remove(index)}
// //                           className="text-red-600 hover:text-red-800 p-1"
// //                         >
// //                           <TrashIcon className="h-4 w-4" />
// //                         </button>
// //                       )}
// //                     </div>
// //                   </div>
// //                 ))}
// //               </div>
// //             </div>

// //             {/* Pricing & Terms */}
// //             <div className="bg-white shadow rounded-lg p-6">
// //               <h3 className="text-lg font-medium text-gray-900 mb-4">Pricing & Terms</h3>
              
// //               <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
// //                 <div>
// //                   <label className="block text-sm font-medium text-gray-700">
// //                     Tax Rate (%)
// //                   </label>
// //                   <input
// //                     {...register('tax_rate', { valueAsNumber: true })}
// //                     type="number"
// //                     step="0.01"
// //                     min="0"
// //                     max="100"
// //                     className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
// //                   />
// //                 </div>

// //                 <div>
// //                   <label className="block text-sm font-medium text-gray-700">
// //                     Discount Amount ($)
// //                   </label>
// //                   <input
// //                     {...register('discount_amount', { valueAsNumber: true })}
// //                     type="number"
// //                     step="0.01"
// //                     min="0"
// //                     className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
// //                   />
// //                 </div>

// //                 <div>
// //                   <label className="block text-sm font-medium text-gray-700">
// //                     Valid for (days)
// //                   </label>
// //                   <input
// //                     {...register('valid_days', { valueAsNumber: true })}
// //                     type="number"
// //                     min="1"
// //                     className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
// //                   />
// //                 </div>
// //               </div>

// //               <div className="mt-6">
// //                 <label className="block text-sm font-medium text-gray-700">
// //                   Terms and Conditions
// //                 </label>
// //                 <textarea
// //                   {...register('terms_and_conditions')}
// //                   rows={4}
// //                   className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
// //                 />
// //               </div>

// //               <div className="mt-6">
// //                 <label className="block text-sm font-medium text-gray-700">
// //                   Internal Notes
// //                 </label>
// //                 <textarea
// //                   {...register('notes')}
// //                   rows={3}
// //                   className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
// //                   placeholder="Internal notes (not visible to customer)"
// //                 />
// //               </div>
// //             </div>

// //             {/* Action Buttons */}
// //             <div className="flex justify-end space-x-3">
// //               <button
// //                 type="button"
// //                 onClick={() => navigate('/estimates')}
// //                 className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50"
// //               >
// //                 Cancel
// //               </button>
              
// //               <button
// //                 type="submit"
// //                 disabled={saveEstimateMutation.isPending}
// //                 className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 disabled:opacity-50"
// //               >
// //                 <DocumentTextIcon className="h-4 w-4 mr-2" />
// //                 {saveEstimateMutation.isPending ? 'Saving...' : isEditing ? 'Update Estimate' : 'Save Draft'}
// //               </button>
              
// //               {!isEditing && (
// //                 <button
// //                   type="button"
// //                   onClick={handleSubmit(onSaveAndSend)}
// //                   disabled={saveEstimateMutation.isPending || sendEstimateMutation.isPending}
// //                   className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 disabled:opacity-50"
// //                 >
// //                   <PaperAirplaneIcon className="h-4 w-4 mr-2" />
// //                   Save & Send
// //                 </button>
// //               )}
// //             </div>
// //           </form>
// //         </div>

// //         {/* Preview */}
// //         {showPreview && (
// //           <div className="lg:col-span-1">
// //             <div className="bg-white shadow rounded-lg p-6 sticky top-6">
// //               <div className="flex items-center mb-4">
// //                 <CalculatorIcon className="h-5 w-5 text-gray-400 mr-2" />
// //                 <h3 className="text-lg font-medium text-gray-900">Estimate Total</h3>
// //               </div>
              
// //               <div className="space-y-3">
// //                 <div className="flex justify-between text-sm">
// //                   <span className="text-gray-500">Subtotal:</span>
// //                   <span className="text-gray-900">{formatCurrency(totals.subtotal)}</span>
// //                 </div>
                
// //                 {totals.discountAmount > 0 && (
// //                   <div className="flex justify-between text-sm">
// //                     <span className="text-gray-500">Discount:</span>
// //                     <span className="text-red-600">-{formatCurrency(totals.discountAmount)}</span>
// //                   </div>
// //                 )}
                
// //                 <div className="flex justify-between text-sm">
// //                   <span className="text-gray-500">Tax ({watchedFields.tax_rate || 0}%):</span>
// //                   <span className="text-gray-900">{formatCurrency(totals.taxAmount)}</span>
// //                 </div>
                
// //                 <div className="border-t pt-3">
// //                   <div className="flex justify-between text-lg font-medium">
// //                     <span className="text-gray-900">Total:</span>
// //                     <span className="text-gray-900">{formatCurrency(totals.total)}</span>
// //                   </div>
// //                 </div>
// //               </div>

// //               {watchedFields.line_items && watchedFields.line_items.length > 0 && (
// //                 <div className="mt-6">
// //                   <h4 className="text-sm font-medium text-gray-900 mb-3">Items Summary</h4>
// //                   <div className="space-y-2">
// //                     {watchedFields.line_items.map((item, index) => (
// //                       item.description && (
// //                         <div key={index} className="text-xs">
// //                           <div className="flex justify-between">
// //                             <span className="text-gray-600 truncate">{item.description}</span>
// //                             <span className="text-gray-900 ml-2">
// //                               {formatCurrency((item.quantity || 0) * (item.unit_price || 0))}
// //                             </span>
// //                           </div>
// //                           <div className="text-gray-400">
// //                             {item.quantity || 0} × {formatCurrency(item.unit_price || 0)}
// //                           </div>
// //                         </div>
// //                       )
// //                     ))}
// //                   </div>
// //                 </div>
// //               )}
// //             </div>
// //           </div>
// //         )}
// //       </div>
// //     </div>
// //   )
// // }