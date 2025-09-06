// // frontend/src/pages/field-service/Jobs.tsx
// import { useState } from 'react'
// import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
// import {
//   MagnifyingGlassIcon,
//   FunnelIcon,
//   MapPinIcon,
//   ClockIcon,
//   UserIcon,
//   PhoneIcon,
//   CheckCircleIcon,
//   ExclamationTriangleIcon,
//   XCircleIcon,
//   PlayIcon,
//   EyeIcon
// } from '@heroicons/react/24/outline'
// import toast from 'react-hot-toast'

// import { api } from '../../services/api'
// import Modal from '../../components/ui/Modal'

// interface Job {
//   id: string
//   job_number: string
//   customer_name: string
//   customer_phone: string
//   customer_email?: string
//   service_type: string
//   description: string
//   address: string
//   city: string
//   state: string
//   zip_code: string
//   scheduled_date: string
//   start_time: string
//   end_time: string
//   estimated_duration: number
//   actual_duration?: number
//   status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled' | 'on_hold'
//   priority: 'low' | 'medium' | 'high' | 'urgent'
//   technician_id?: string
//   technician_name?: string
//   technician_phone?: string
//   notes?: string
//   special_instructions?: string
//   equipment_needed: string[]
//   photos: string[]
//   customer_signature?: string
//   completion_notes?: string
//   created_at: string
//   updated_at: string
// }

// const statusColors = {
//   scheduled: 'bg-blue-100 text-blue-800',
//   in_progress: 'bg-yellow-100 text-yellow-800',
//   completed: 'bg-green-100 text-green-800',
//   cancelled: 'bg-red-100 text-red-800',
//   on_hold: 'bg-gray-100 text-gray-800'
// }

// const priorityColors = {
//   low: 'bg-gray-100 text-gray-800',
//   medium: 'bg-blue-100 text-blue-800',
//   high: 'bg-orange-100 text-orange-800',
//   urgent: 'bg-red-100 text-red-800'
// }

// export default function Jobs() {
//   const [searchTerm, setSearchTerm] = useState('')
//   const [statusFilter, setStatusFilter] = useState('all')
//   const [technicianFilter, setTechnicianFilter] = useState('all')
//   const [dateFilter, setDateFilter] = useState('today')
//   const [selectedJob, setSelectedJob] = useState<Job | null>(null)

//   const queryClient = useQueryClient()

//   // In Jobs.tsx, around line 87 where you build the query parameters:

// const { data: jobs, isLoading } = useQuery({
//   queryKey: ['field-jobs', searchTerm, statusFilter, technicianFilter, dateFilter],
//   queryFn: async () => {
//     const params = new URLSearchParams()
//     if (searchTerm) params.append('search', searchTerm)
//     if (statusFilter !== 'all') params.append('status', statusFilter)
//     if (technicianFilter !== 'all') params.append('technician_id', technicianFilter)
//     // 🔧 FIX: Change 'date_filter' to 'date'
//     if (dateFilter !== 'all') params.append('date', dateFilter)  // Changed from 'date_filter' to 'date'
    
//     const response = await api.get(`/jobs?${params.toString()}`)
//     return response.data
//   },
// })

//   const { data: technicians } = useQuery({
//     queryKey: ['technicians'],
//     queryFn: async () => {
//       const response = await api.get('/users?role=technician')
//       return response.data
//     },
//   })

//   const updateJobStatusMutation = useMutation({
//     mutationFn: async ({ jobId, status }: { jobId: string; status: string }) => {
//       const response = await api.patch(`/jobs/${jobId}`, { 
//         status,
//         ...(status === 'in_progress' && { actual_start_time: new Date().toISOString() }),
//         ...(status === 'completed' && { actual_end_time: new Date().toISOString() })
//       })
//       return response.data
//     },
//     onSuccess: () => {
//       queryClient.invalidateQueries({ queryKey: ['field-jobs'] })
//       toast.success('Job status updated!')
//     },
//     onError: (error: any) => {
//       toast.error(error.response?.data?.detail || 'Failed to update job')
//     },
//   })

//   const handleStatusChange = (jobId: string, status: string) => {
//     updateJobStatusMutation.mutate({ jobId, status })
//   }

//   const getStatusIcon = (status: string) => {
//     switch (status) {
//       case 'scheduled':
//         return <ClockIcon className="h-4 w-4" />
//       case 'in_progress':
//         return <PlayIcon className="h-4 w-4" />
//       case 'completed':
//         return <CheckCircleIcon className="h-4 w-4" />
//       case 'cancelled':
//         return <XCircleIcon className="h-4 w-4" />
//       case 'on_hold':
//         return <ExclamationTriangleIcon className="h-4 w-4" />
//       default:
//         return <ClockIcon className="h-4 w-4" />
//     }
//   }

//   const formatTime = (timeString: string) => {
//     return new Date(`2000-01-01T${timeString}`).toLocaleTimeString([], { 
//       hour: '2-digit', 
//       minute: '2-digit' 
//     })
//   }

//   const formatDate = (dateString: string) => {
//     return new Date(dateString).toLocaleDateString('en-US', {
//       weekday: 'short',
//       month: 'short',
//       day: 'numeric'
//     })
//   }

//   const getJobStats = () => {
//     if (!jobs) return { total: 0, scheduled: 0, inProgress: 0, completed: 0, cancelled: 0 }
    
//     return {
//       total: jobs.length,
//       scheduled: jobs.filter((job: Job) => job.status === 'scheduled').length,
//       inProgress: jobs.filter((job: Job) => job.status === 'in_progress').length,
//       completed: jobs.filter((job: Job) => job.status === 'completed').length,
//       cancelled: jobs.filter((job: Job) => job.status === 'cancelled').length
//     }
//   }

//   const stats = getJobStats()

//   return (
//     <div className="space-y-6">
//       {/* Header */}
//       <div className="flex justify-between items-center">
//         <div>
//           <h1 className="text-2xl font-bold text-gray-900">Field Service Jobs</h1>
//           <p className="mt-1 text-sm text-gray-500">
//             Manage and track all field service jobs and assignments
//           </p>
//         </div>
//       </div>

//       {/* Stats Cards */}
//       <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
//         <div className="bg-white overflow-hidden shadow rounded-lg">
//           <div className="p-5">
//             <div className="flex items-center">
//               <div className="flex-shrink-0">
//                 <div className="w-8 h-8 bg-gray-500 rounded-md flex items-center justify-center">
//                   <span className="text-white text-sm font-bold">{stats.total}</span>
//                 </div>
//               </div>
//               <div className="ml-5 w-0 flex-1">
//                 <dl>
//                   <dt className="text-sm font-medium text-gray-500 truncate">Total Jobs</dt>
//                   <dd className="text-lg font-medium text-gray-900">Today</dd>
//                 </dl>
//               </div>
//             </div>
//           </div>
//         </div>

//         <div className="bg-white overflow-hidden shadow rounded-lg">
//           <div className="p-5">
//             <div className="flex items-center">
//               <div className="flex-shrink-0">
//                 <div className="w-8 h-8 bg-blue-500 rounded-md flex items-center justify-center">
//                   <span className="text-white text-sm font-bold">{stats.scheduled}</span>
//                 </div>
//               </div>
//               <div className="ml-5 w-0 flex-1">
//                 <dl>
//                   <dt className="text-sm font-medium text-gray-500 truncate">Scheduled</dt>
//                   <dd className="text-lg font-medium text-gray-900">Pending</dd>
//                 </dl>
//               </div>
//             </div>
//           </div>
//         </div>

//         <div className="bg-white overflow-hidden shadow rounded-lg">
//           <div className="p-5">
//             <div className="flex items-center">
//               <div className="flex-shrink-0">
//                 <div className="w-8 h-8 bg-yellow-500 rounded-md flex items-center justify-center">
//                   <span className="text-white text-sm font-bold">{stats.inProgress}</span>
//                 </div>
//               </div>
//               <div className="ml-5 w-0 flex-1">
//                 <dl>
//                   <dt className="text-sm font-medium text-gray-500 truncate">In Progress</dt>
//                   <dd className="text-lg font-medium text-gray-900">Active</dd>
//                 </dl>
//               </div>
//             </div>
//           </div>
//         </div>

//         <div className="bg-white overflow-hidden shadow rounded-lg">
//           <div className="p-5">
//             <div className="flex items-center">
//               <div className="flex-shrink-0">
//                 <div className="w-8 h-8 bg-green-500 rounded-md flex items-center justify-center">
//                   <span className="text-white text-sm font-bold">{stats.completed}</span>
//                 </div>
//               </div>
//               <div className="ml-5 w-0 flex-1">
//                 <dl>
//                   <dt className="text-sm font-medium text-gray-500 truncate">Completed</dt>
//                   <dd className="text-lg font-medium text-gray-900">Done</dd>
//                 </dl>
//               </div>
//             </div>
//           </div>
//         </div>

//         <div className="bg-white overflow-hidden shadow rounded-lg">
//           <div className="p-5">
//             <div className="flex items-center">
//               <div className="flex-shrink-0">
//                 <div className="w-8 h-8 bg-red-500 rounded-md flex items-center justify-center">
//                   <span className="text-white text-sm font-bold">{stats.cancelled}</span>
//                 </div>
//               </div>
//               <div className="ml-5 w-0 flex-1">
//                 <dl>
//                   <dt className="text-sm font-medium text-gray-500 truncate">Cancelled</dt>
//                   <dd className="text-lg font-medium text-gray-900">Issues</dd>
//                 </dl>
//               </div>
//             </div>
//           </div>
//         </div>
//       </div>

//       {/* Filters */}
//       <div className="bg-white shadow rounded-lg p-6">
//         <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
//           <div className="relative">
//             <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
//               <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
//             </div>
//             <input
//               type="text"
//               placeholder="Search jobs..."
//               value={searchTerm}
//               onChange={(e) => setSearchTerm(e.target.value)}
//               className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
//             />
//           </div>

//           <select
//             value={statusFilter}
//             onChange={(e) => setStatusFilter(e.target.value)}
//             className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
//           >
//             <option value="all">All Statuses</option>
//             <option value="scheduled">Scheduled</option>
//             <option value="in_progress">In Progress</option>
//             <option value="completed">Completed</option>
//             <option value="cancelled">Cancelled</option>
//             <option value="on_hold">On Hold</option>
//           </select>

//           <select
//             value={technicianFilter}
//             onChange={(e) => setTechnicianFilter(e.target.value)}
//             className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
//           >
//             <option value="all">All Technicians</option>
//             {technicians?.map((tech: any) => (
//               <option key={tech.id} value={tech.id}>{tech.name}</option>
//             ))}
//           </select>

//           <select
//             value={dateFilter}
//             onChange={(e) => setDateFilter(e.target.value)}
//             className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
//           >
//             <option value="today">Today</option>
//             <option value="tomorrow">Tomorrow</option>
//             <option value="this_week">This Week</option>
//             <option value="next_week">Next Week</option>
//             <option value="all">All Dates</option>
//           </select>

//           <button className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
//             <FunnelIcon className="h-4 w-4 mr-2" />
//             More Filters
//           </button>
//         </div>
//       </div>

//       {/* Jobs List */}
//       <div className="bg-white shadow overflow-hidden sm:rounded-md">
//         {isLoading ? (
//           <div className="p-6">
//             <div className="animate-pulse space-y-4">
//               {[...Array(5)].map((_, i) => (
//                 <div key={i} className="h-24 bg-gray-200 rounded"></div>
//               ))}
//             </div>
//           </div>
//         ) : (
//           <ul className="divide-y divide-gray-200">
//             {jobs?.map((job: Job) => (
//               <li key={job.id}>
//                 <div className="px-4 py-4">
//                   <div className="flex items-center justify-between">
//                     <div className="flex items-center flex-1">
//                       <div className="flex-shrink-0">
//                         <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
//                           statusColors[job.status].replace('text-', 'text-white bg-').replace('bg-', 'bg-').replace('-100', '-500')
//                         }`}>
//                           {getStatusIcon(job.status)}
//                         </div>
//                       </div>
                      
//                       <div className="ml-4 flex-1">
//                         <div className="flex items-center justify-between">
//                           <div>
//                             <div className="flex items-center">
//                               <p className="text-sm font-medium text-gray-900">
//                                 #{job.job_number} - {job.customer_name}
//                               </p>
//                               <span className={`ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
//                                 statusColors[job.status]
//                               }`}>
//                                 {job.status.replace('_', ' ')}
//                               </span>
//                               <span className={`ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
//                                 priorityColors[job.priority]
//                               }`}>
//                                 {job.priority}
//                               </span>
//                             </div>
                            
//                             <div className="flex items-center mt-1 text-sm text-gray-500">
//                               <div className="flex items-center mr-4">
//                                 <ClockIcon className="h-4 w-4 mr-1" />
//                                 {formatDate(job.scheduled_date)} • {formatTime(job.start_time)} - {formatTime(job.end_time)}
//                               </div>
                              
//                               {job.technician_name && (
//                                 <div className="flex items-center mr-4">
//                                   <UserIcon className="h-4 w-4 mr-1" />
//                                   {job.technician_name}
//                                 </div>
//                               )}
                              
//                               <div className="flex items-center mr-4">
//                                 <MapPinIcon className="h-4 w-4 mr-1" />
//                                 {job.city}, {job.state}
//                               </div>
                              
//                               {job.customer_phone && (
//                                 <div className="flex items-center">
//                                   <PhoneIcon className="h-4 w-4 mr-1" />
//                                   {job.customer_phone}
//                                 </div>
//                               )}
//                             </div>
                            
//                             <div className="mt-1">
//                               <span className="text-sm text-gray-600">{job.service_type}</span>
//                               {job.description && (
//                                 <span className="ml-2 text-sm text-gray-500">• {job.description}</span>
//                               )}
//                             </div>
//                           </div>
                          
//                           <div className="flex items-center space-x-2">
//                             {job.status === 'scheduled' && (
//                               <button
//                                 onClick={() => handleStatusChange(job.id, 'in_progress')}
//                                 className="text-blue-600 hover:text-blue-900 text-sm font-medium"
//                               >
//                                 Start Job
//                               </button>
//                             )}
                            
//                             {job.status === 'in_progress' && (
//                               <button
//                                 onClick={() => handleStatusChange(job.id, 'completed')}
//                                 className="text-green-600 hover:text-green-900 text-sm font-medium"
//                               >
//                                 Complete
//                               </button>
//                             )}
                            
//                             <button
//                               onClick={() => setSelectedJob(job)}
//                               className="text-primary-600 hover:text-primary-900 text-sm font-medium"
//                             >
//                               <EyeIcon className="h-4 w-4" />
//                             </button>
//                           </div>
//                         </div>
                        
//                         {job.special_instructions && (
//                           <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-sm">
//                             <strong>Special Instructions:</strong> {job.special_instructions}
//                           </div>
//                         )}
                        
//                         {job.equipment_needed.length > 0 && (
//                           <div className="mt-2 flex flex-wrap gap-1">
//                             <span className="text-xs text-gray-500 mr-2">Equipment needed:</span>
//                             {job.equipment_needed.map((item) => (
//                               <span
//                                 key={item}
//                                 className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800"
//                               >
//                                 {item}
//                               </span>
//                             ))}
//                           </div>
//                         )}
//                       </div>
//                     </div>
//                   </div>
//                 </div>
//               </li>
//             ))}
//           </ul>
//         )}
//       </div>

//       {/* Job Details Modal */}
//       {selectedJob && (
//         <Modal
//           isOpen={!!selectedJob}
//           onClose={() => setSelectedJob(null)}
//           title={`Job #${selectedJob.job_number} - ${selectedJob.customer_name}`}
//           size="xl"
//         >
//           <div className="space-y-6">
//             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//               <div>
//                 <h4 className="text-sm font-medium text-gray-900 mb-3">Customer Information</h4>
//                 <div className="space-y-2 text-sm">
//                   <div className="flex items-center">
//                     <UserIcon className="h-4 w-4 text-gray-400 mr-2" />
//                     <span>{selectedJob.customer_name}</span>
//                   </div>
//                   {selectedJob.customer_phone && (
//                     <div className="flex items-center">
//                       <PhoneIcon className="h-4 w-4 text-gray-400 mr-2" />
//                       <a href={`tel:${selectedJob.customer_phone}`} className="text-primary-600 hover:text-primary-800">
//                         {selectedJob.customer_phone}
//                       </a>
//                     </div>
//                   )}
//                   {selectedJob.customer_email && (
//                     <div className="flex items-center">
//                       <span className="text-sm">📧 {selectedJob.customer_email}</span>
//                     </div>
//                   )}
//                   <div className="flex items-center">
//                     <MapPinIcon className="h-4 w-4 text-gray-400 mr-2" />
//                     <span>{selectedJob.address}, {selectedJob.city}, {selectedJob.state} {selectedJob.zip_code}</span>
//                   </div>
//                 </div>
//               </div>
              
//               <div>
//                 <h4 className="text-sm font-medium text-gray-900 mb-3">Job Details</h4>
//                 <div className="space-y-2 text-sm">
//                   <div>
//                     <span className="text-gray-500">Service:</span>
//                     <span className="ml-2">{selectedJob.service_type}</span>
//                   </div>
//                   <div>
//                     <span className="text-gray-500">Status:</span>
//                     <span className={`ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
//                       statusColors[selectedJob.status]
//                     }`}>
//                       {selectedJob.status.replace('_', ' ')}
//                     </span>
//                   </div>
//                   <div>
//                     <span className="text-gray-500">Priority:</span>
//                     <span className={`ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
//                       priorityColors[selectedJob.priority]
//                     }`}>
//                       {selectedJob.priority}
//                     </span>
//                   </div>
//                   <div>
//                     <span className="text-gray-500">Scheduled:</span>
//                     <span className="ml-2">{formatDate(selectedJob.scheduled_date)} {formatTime(selectedJob.start_time)} - {formatTime(selectedJob.end_time)}</span>
//                   </div>
//                   {selectedJob.technician_name && (
//                     <div>
//                       <span className="text-gray-500">Technician:</span>
//                       <span className="ml-2">{selectedJob.technician_name}</span>
//                     </div>
//                   )}
//                   <div>
//                     <span className="text-gray-500">Duration:</span>
//                     <span className="ml-2">{selectedJob.estimated_duration} minutes</span>
//                   </div>
//                 </div>
//               </div>
//             </div>
            
//             {selectedJob.description && (
//               <div>
//                 <h4 className="text-sm font-medium text-gray-900 mb-2">Description</h4>
//                 <p className="text-sm text-gray-600">{selectedJob.description}</p>
//               </div>
//             )}
            
//             {selectedJob.special_instructions && (
//               <div>
//                 <h4 className="text-sm font-medium text-gray-900 mb-2">Special Instructions</h4>
//                 <p className="text-sm text-gray-600 bg-yellow-50 p-3 rounded-md">{selectedJob.special_instructions}</p>
//               </div>
//             )}
            
//             {selectedJob.equipment_needed.length > 0 && (
//               <div>
//                 <h4 className="text-sm font-medium text-gray-900 mb-2">Equipment Needed</h4>
//                 <div className="flex flex-wrap gap-2">
//                   {selectedJob.equipment_needed.map((item) => (
//                     <span
//                       key={item}
//                       className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
//                     >
//                       {item}
//                     </span>
//                   ))}
//                 </div>
//               </div>
//             )}
            
//             {selectedJob.notes && (
//               <div>
//                 <h4 className="text-sm font-medium text-gray-900 mb-2">Notes</h4>
//                 <p className="text-sm text-gray-600">{selectedJob.notes}</p>
//               </div>
//             )}
            
//             <div className="flex justify-end space-x-3">
//               <button
//                 onClick={() => setSelectedJob(null)}
//                 className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50"
//               >
//                 Close
//               </button>
//               <button className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700">
//                 Edit Job
//               </button>
//             </div>
//           </div>
//         </Modal>
//       )}
//     </div>
//   )
// }




























// frontend/src/pages/field-service/Jobs.tsx - FIXED VERSION
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  MagnifyingGlassIcon,
  FunnelIcon,
  MapPinIcon,
  ClockIcon,
  UserIcon,
  PhoneIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  XCircleIcon,
  PlayIcon,
  EyeIcon
} from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'

import { api } from '../../services/api'
import Modal from '../../components/ui/Modal'

interface Job {
  id: string
  job_number: string
  customer_name: string
  customer_phone: string
  customer_email?: string
  service_type: string
  description: string
  address: string
  city: string
  state: string
  zip_code: string
  scheduled_date: string
  start_time: string
  end_time: string
  estimated_duration: number
  actual_duration?: number
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled' | 'on_hold'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  technician_id?: string
  technician_name?: string
  technician_phone?: string
  notes?: string
  special_instructions?: string
  equipment_needed: string[]
  photos: string[]
  customer_signature?: string
  completion_notes?: string
  created_at: string
  updated_at: string
}

interface JobsResponse {
  jobs: Job[]
  total: number
  page: number
  limit: number
  has_more?: boolean
}

const statusColors = {
  scheduled: 'bg-blue-100 text-blue-800',
  in_progress: 'bg-yellow-100 text-yellow-800',
  completed: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
  on_hold: 'bg-gray-100 text-gray-800'
}

const priorityColors = {
  low: 'bg-gray-100 text-gray-800',
  medium: 'bg-blue-100 text-blue-800',
  high: 'bg-orange-100 text-orange-800',
  urgent: 'bg-red-100 text-red-800'
}

export default function Jobs() {
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [technicianFilter, setTechnicianFilter] = useState('all')
  const [dateFilter, setDateFilter] = useState('today')
  const [selectedJob, setSelectedJob] = useState<Job | null>(null)

  const queryClient = useQueryClient()

  // ✅ FIXED: Updated query to handle the backend response format
  const { data: jobsResponse, isLoading, error } = useQuery<JobsResponse>({
    queryKey: ['field-jobs', searchTerm, statusFilter, technicianFilter, dateFilter],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (searchTerm) params.append('search', searchTerm)
      if (statusFilter !== 'all') params.append('status', statusFilter)
      if (technicianFilter !== 'all') params.append('technician_id', technicianFilter)
      if (dateFilter !== 'all') params.append('date', dateFilter)
      
      console.log('🔄 Making API request to:', `/jobs?${params.toString()}`)
      
      const response = await api.get(`/jobs`)
      console.log('✅ API Response:', response.data)
      
      return response.data as JobsResponse
    },
    retry: 2,
    onError: (error: any) => {
      console.error('❌ Jobs API Error:', error)
      toast.error(error.response?.data?.detail || 'Failed to fetch jobs')
    }
  })

  // Extract jobs array from response
  const jobs = jobsResponse?.jobs || []

  const { data: technicians } = useQuery({
    queryKey: ['technicians'],
    queryFn: async () => {
      const response = await api.get('/users/?role=technician')
      return response.data
    },
  })

  const updateJobStatusMutation = useMutation({
    mutationFn: async ({ jobId, status }: { jobId: string; status: string }) => {
      const response = await api.patch(`/jobs/${jobId}`, { 
        status,
        ...(status === 'in_progress' && { actual_start_time: new Date().toISOString() }),
        ...(status === 'completed' && { actual_end_time: new Date().toISOString() })
      })
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['field-jobs'] })
      toast.success('Job status updated!')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Failed to update job')
    },
  })

  const handleStatusChange = (jobId: string, status: string) => {
    updateJobStatusMutation.mutate({ jobId, status })
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'scheduled':
        return <ClockIcon className="h-4 w-4" />
      case 'in_progress':
        return <PlayIcon className="h-4 w-4" />
      case 'completed':
        return <CheckCircleIcon className="h-4 w-4" />
      case 'cancelled':
        return <XCircleIcon className="h-4 w-4" />
      case 'on_hold':
        return <ExclamationTriangleIcon className="h-4 w-4" />
      default:
        return <ClockIcon className="h-4 w-4" />
    }
  }

  const formatTime = (timeString: string) => {
    if (!timeString) return 'N/A'
    try {
      return new Date(`2000-01-01T${timeString}`).toLocaleTimeString([], { 
        hour: '2-digit', 
        minute: '2-digit' 
      })
    } catch {
      return timeString
    }
  }

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A'
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric'
      })
    } catch {
      return dateString
    }
  }

  const getJobStats = () => {
    if (!jobs || jobs.length === 0) {
      return { total: 0, scheduled: 0, inProgress: 0, completed: 0, cancelled: 0 }
    }
    
    return {
      total: jobs.length,
      scheduled: jobs.filter((job: Job) => job.status === 'scheduled').length,
      inProgress: jobs.filter((job: Job) => job.status === 'in_progress').length,
      completed: jobs.filter((job: Job) => job.status === 'completed').length,
      cancelled: jobs.filter((job: Job) => job.status === 'cancelled').length
    }
  }

  const stats = getJobStats()

  // Show loading state
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Field Service Jobs</h1>
            <p className="mt-1 text-sm text-gray-500">Loading jobs...</p>
          </div>
        </div>
        <div className="bg-white shadow rounded-lg p-6">
          <div className="animate-pulse space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  // Show error state
  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Field Service Jobs</h1>
            <p className="mt-1 text-sm text-red-500">Error loading jobs</p>
          </div>
        </div>
        <div className="bg-white shadow rounded-lg p-6">
          <div className="text-center">
            <XCircleIcon className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Unable to Load Jobs</h3>
            <p className="text-gray-500 mb-4">
              {(error as any)?.response?.data?.detail || 'An error occurred while loading jobs'}
            </p>
            <button
              onClick={() => queryClient.invalidateQueries({ queryKey: ['field-jobs'] })}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Field Service Jobs</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage and track all field service jobs and assignments ({jobs.length} jobs)
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-gray-500 rounded-md flex items-center justify-center">
                  <span className="text-white text-sm font-bold">{stats.total}</span>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Total Jobs</dt>
                  <dd className="text-lg font-medium text-gray-900">Today</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-blue-500 rounded-md flex items-center justify-center">
                  <span className="text-white text-sm font-bold">{stats.scheduled}</span>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Scheduled</dt>
                  <dd className="text-lg font-medium text-gray-900">Pending</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-yellow-500 rounded-md flex items-center justify-center">
                  <span className="text-white text-sm font-bold">{stats.inProgress}</span>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">In Progress</dt>
                  <dd className="text-lg font-medium text-gray-900">Active</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-green-500 rounded-md flex items-center justify-center">
                  <span className="text-white text-sm font-bold">{stats.completed}</span>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Completed</dt>
                  <dd className="text-lg font-medium text-gray-900">Done</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-red-500 rounded-md flex items-center justify-center">
                  <span className="text-white text-sm font-bold">{stats.cancelled}</span>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Cancelled</dt>
                  <dd className="text-lg font-medium text-gray-900">Issues</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search jobs..."
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
            <option value="scheduled">Scheduled</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
            <option value="on_hold">On Hold</option>
          </select>

          <select
            value={technicianFilter}
            onChange={(e) => setTechnicianFilter(e.target.value)}
            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
          >
            <option value="all">All Technicians</option>
            {technicians?.map((tech: any) => (
              <option key={tech.id} value={tech.id}>{tech.name}</option>
            ))}
          </select>

          <select
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
          >
            <option value="today">Today</option>
            <option value="tomorrow">Tomorrow</option>
            <option value="this_week">This Week</option>
            <option value="next_week">Next Week</option>
            <option value="all">All Dates</option>
          </select>

          <button className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
            <FunnelIcon className="h-4 w-4 mr-2" />
            More Filters
          </button>
        </div>
      </div>

      {/* Jobs List */}
      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        {jobs.length === 0 ? (
          <div className="p-6 text-center">
            <ClockIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Jobs Found</h3>
            <p className="text-gray-500">
              {searchTerm || statusFilter !== 'all' || technicianFilter !== 'all' || dateFilter !== 'all'
                ? 'Try adjusting your filters to see more jobs.'
                : 'There are no jobs scheduled for the selected time period.'}
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-gray-200">
            {jobs.map((job: Job) => (
              <li key={job.id}>
                <div className="px-4 py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center flex-1">
                      <div className="flex-shrink-0">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          statusColors[job.status].replace('text-', 'text-white bg-').replace('bg-', 'bg-').replace('-100', '-500')
                        }`}>
                          {getStatusIcon(job.status)}
                        </div>
                      </div>
                      
                      <div className="ml-4 flex-1">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="flex items-center">
                              <p className="text-sm font-medium text-gray-900">
                                #{job.job_number} - {job.customer_name}
                              </p>
                              <span className={`ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                statusColors[job.status]
                              }`}>
                                {job.status.replace('_', ' ')}
                              </span>
                              <span className={`ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                priorityColors[job.priority]
                              }`}>
                                {job.priority}
                              </span>
                            </div>
                            
                            <div className="flex items-center mt-1 text-sm text-gray-500">
                              <div className="flex items-center mr-4">
                                <ClockIcon className="h-4 w-4 mr-1" />
                                {formatDate(job.scheduled_date)} • {formatTime(job.start_time)} - {formatTime(job.end_time)}
                              </div>
                              
                              {job.technician_name && (
                                <div className="flex items-center mr-4">
                                  <UserIcon className="h-4 w-4 mr-1" />
                                  {job.technician_name}
                                </div>
                              )}
                              
                              <div className="flex items-center mr-4">
                                <MapPinIcon className="h-4 w-4 mr-1" />
                                {job.city && job.state ? `${job.city}, ${job.state}` : job.address}
                              </div>
                              
                              {job.customer_phone && (
                                <div className="flex items-center">
                                  <PhoneIcon className="h-4 w-4 mr-1" />
                                  {job.customer_phone}
                                </div>
                              )}
                            </div>
                            
                            <div className="mt-1">
                              <span className="text-sm text-gray-600">{job.service_type}</span>
                              {job.description && (
                                <span className="ml-2 text-sm text-gray-500">• {job.description}</span>
                              )}
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            {job.status === 'scheduled' && (
                              <button
                                onClick={() => handleStatusChange(job.id, 'in_progress')}
                                className="text-blue-600 hover:text-blue-900 text-sm font-medium"
                              >
                                Start Job
                              </button>
                            )}
                            
                            {job.status === 'in_progress' && (
                              <button
                                onClick={() => handleStatusChange(job.id, 'completed')}
                                className="text-green-600 hover:text-green-900 text-sm font-medium"
                              >
                                Complete
                              </button>
                            )}
                            
                            <button
                              onClick={() => setSelectedJob(job)}
                              className="text-primary-600 hover:text-primary-900 text-sm font-medium"
                            >
                              <EyeIcon className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                        
                        {job.special_instructions && (
                          <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-sm">
                            <strong>Special Instructions:</strong> {job.special_instructions}
                          </div>
                        )}
                        
                        {job.equipment_needed && job.equipment_needed.length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-1">
                            <span className="text-xs text-gray-500 mr-2">Equipment needed:</span>
                            {job.equipment_needed.map((item) => (
                              <span
                                key={item}
                                className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800"
                              >
                                {item}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Pagination */}
      {jobsResponse && jobsResponse.total > jobsResponse.limit && (
        <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
          <div className="flex-1 flex justify-between sm:hidden">
            <button className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">
              Previous
            </button>
            <button className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">
              Next
            </button>
          </div>
          <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-700">
                Showing <span className="font-medium">{(jobsResponse.page * jobsResponse.limit) + 1}</span> to{' '}
                <span className="font-medium">
                  {Math.min((jobsResponse.page + 1) * jobsResponse.limit, jobsResponse.total)}
                </span>{' '}
                of <span className="font-medium">{jobsResponse.total}</span> results
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Job Details Modal */}
      {selectedJob && (
        <Modal
          isOpen={!!selectedJob}
          onClose={() => setSelectedJob(null)}
          title={`Job #${selectedJob.job_number} - ${selectedJob.customer_name}`}
          size="xl"
        >
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-3">Customer Information</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center">
                    <UserIcon className="h-4 w-4 text-gray-400 mr-2" />
                    <span>{selectedJob.customer_name}</span>
                  </div>
                  {selectedJob.customer_phone && (
                    <div className="flex items-center">
                      <PhoneIcon className="h-4 w-4 text-gray-400 mr-2" />
                      <a href={`tel:${selectedJob.customer_phone}`} className="text-primary-600 hover:text-primary-800">
                        {selectedJob.customer_phone}
                      </a>
                    </div>
                  )}
                  {selectedJob.customer_email && (
                    <div className="flex items-center">
                      <span className="text-sm">📧 {selectedJob.customer_email}</span>
                    </div>
                  )}
                  <div className="flex items-center">
                    <MapPinIcon className="h-4 w-4 text-gray-400 mr-2" />
                    <span>{selectedJob.address}, {selectedJob.city}, {selectedJob.state} {selectedJob.zip_code}</span>
                  </div>
                </div>
              </div>
              
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-3">Job Details</h4>
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="text-gray-500">Service:</span>
                    <span className="ml-2">{selectedJob.service_type}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Status:</span>
                    <span className={`ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      statusColors[selectedJob.status]
                    }`}>
                      {selectedJob.status.replace('_', ' ')}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500">Priority:</span>
                    <span className={`ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      priorityColors[selectedJob.priority]
                    }`}>
                      {selectedJob.priority}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500">Scheduled:</span>
                    <span className="ml-2">{formatDate(selectedJob.scheduled_date)} {formatTime(selectedJob.start_time)} - {formatTime(selectedJob.end_time)}</span>
                  </div>
                  {selectedJob.technician_name && (
                    <div>
                      <span className="text-gray-500">Technician:</span>
                      <span className="ml-2">{selectedJob.technician_name}</span>
                    </div>
                  )}
                  <div>
                    <span className="text-gray-500">Duration:</span>
                    <span className="ml-2">{selectedJob.estimated_duration} minutes</span>
                  </div>
                </div>
              </div>
            </div>
            
            {selectedJob.description && (
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-2">Description</h4>
                <p className="text-sm text-gray-600">{selectedJob.description}</p>
              </div>
            )}
            
            {selectedJob.special_instructions && (
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-2">Special Instructions</h4>
                <p className="text-sm text-gray-600 bg-yellow-50 p-3 rounded-md">{selectedJob.special_instructions}</p>
              </div>
            )}
            
            {selectedJob.equipment_needed && selectedJob.equipment_needed.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-2">Equipment Needed</h4>
                <div className="flex flex-wrap gap-2">
                  {selectedJob.equipment_needed.map((item) => (
                    <span
                      key={item}
                      className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                    >
                      {item}
                    </span>
                  ))}
                </div>
              </div>
            )}
            
            {selectedJob.notes && (
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-2">Notes</h4>
                <p className="text-sm text-gray-600">{selectedJob.notes}</p>
              </div>
            )}
            
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setSelectedJob(null)}
                className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Close
              </button>
              <button className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700">
                Edit Job
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}