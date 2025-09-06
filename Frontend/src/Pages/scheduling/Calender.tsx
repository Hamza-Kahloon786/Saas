// // // / SCHEDULING PAGES
// // // ===============================

// // // frontend/src/pages/scheduling/Calendar.tsx
// // import { useState } from 'react'
// // import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
// // import { Calendar as BigCalendar, momentLocalizer, View } from 'react-big-calendar'
// // import moment from 'moment'
// // import {
// //   ChevronLeftIcon,
// //   ChevronRightIcon,
// //   PlusIcon,
// //   CalendarIcon,
// //   ClockIcon,
// //   UserIcon,
// //   MapPinIcon
// // } from '@heroicons/react/24/outline'
// // import toast from 'react-hot-toast'

// // import { api } from '../../services/api'
// // import Modal from '../../components/ui/Modal'
// // import 'react-big-calendar/lib/css/react-big-calendar.css'
// // import JobForm from '../../components/forms/JobForm'

// // const localizer = momentLocalizer(moment)

// // interface Job {
// //   id: string
// //   title: string
// //   customer_name: string
// //   customer_phone?: string
// //   address: string
// //   city: string
// //   state: string
// //   technician_id?: string
// //   technician_name?: string
// //   start_time: Date
// //   end_time: Date
// //   status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled'
// //   service_type: string
// //   notes?: string
// //   estimated_duration: number
// //   priority: 'low' | 'medium' | 'high' | 'urgent'
// // }

// // interface CalendarEvent {
// //   id: string
// //   title: string
// //   start: Date
// //   end: Date
// //   resource: Job
// // }

// // const statusColors = {
// //   scheduled: '#3B82F6',
// //   in_progress: '#F59E0B',
// //   completed: '#10B981',
// //   cancelled: '#EF4444'
// // }

// // const priorityColors = {
// //   low: '#6B7280',
// //   medium: '#3B82F6',
// //   high: '#F59E0B',
// //   urgent: '#EF4444'
// // }

// // export default function Calendar() {
// //   const [currentDate, setCurrentDate] = useState(new Date())
// //   const [currentView, setCurrentView] = useState<View>('week')
// //   const [selectedEvent, setSelectedEvent] = useState<Job | null>(null)
// //   const [showCreateModal, setShowCreateModal] = useState(false)
// //   const [selectedTechnician, setSelectedTechnician] = useState('all')

// //   const queryClient = useQueryClient()

// //   // Fetch jobs/events
// //   const { data: jobs, isLoading } = useQuery({
// //     queryKey: ['calendar-jobs', currentDate, selectedTechnician],
// //     queryFn: async () => {
// //       const startDate = moment(currentDate).startOf('month').format('YYYY-MM-DD')
// //       const endDate = moment(currentDate).endOf('month').format('YYYY-MM-DD')
      
// //       const params = new URLSearchParams({
// //         start_date: startDate,
// //         end_date: endDate,
// //       })
      
// //       if (selectedTechnician !== 'all') {
// //         params.append('technician_id', selectedTechnician)
// //       }
      
// //       const response = await api.get(`/jobs/calendar?${params.toString()}`)
// //       return response.data
// //     },
// //   })

// //   // Fetch technicians
// //   const { data: technicians } = useQuery({
// //     queryKey: ['technicians'],
// //     queryFn: async () => {
// //        const response = await api.get('/users/?role=technician')
// //       return response.data
// //     },

// //   })



// //  // Add this debug version to your createJobMutation in Calendar.tsx:

// // const createJobMutation = useMutation({
// //   mutationFn: async (jobData: any) => {
// //     console.log('🔍 Form data received:', jobData)
    
// //     // Ensure required fields
// //     if (!jobData.customer_id) throw new Error('Customer is required')
// //     if (!jobData.service_type) throw new Error('Service type is required')
// //     if (!jobData.address) throw new Error('Address is required')
// //     if (!jobData.city) throw new Error('City is required')
// //     if (!jobData.state) throw new Error('State is required')
// //     if (!jobData.zip_code) throw new Error('ZIP code is required')
// //     if (!jobData.scheduled_date) throw new Error('Date is required')
// //     if (!jobData.start_time) throw new Error('Start time is required')
    
// //     const apiData = {
// //       customer_id: jobData.customer_id,
// //       title: `${jobData.service_type} - Service Call`,
// //       service_type: jobData.service_type,
// //       address: {
// //         street: jobData.address,
// //         city: jobData.city,
// //         state: jobData.state,
// //         postal_code: jobData.zip_code,
// //       },
// //       time_tracking: {
// //         scheduled_start: `${jobData.scheduled_date}T${jobData.start_time}:00.000Z`,
// //         scheduled_end: calculateEndTime(jobData.scheduled_date, jobData.start_time, jobData.estimated_duration),
// //         scheduled_duration: jobData.estimated_duration,
// //       },
// //     }

// //     console.log('📤 API data being sent:', JSON.stringify(apiData, null, 2))
// //     const response = await api.post('/jobs/', apiData)
// //     return response.data
// //   },
// //   onSuccess: () => {
// //     queryClient.invalidateQueries({ queryKey: ['calendar-jobs'] })
// //     setShowCreateModal(false)
// //     toast.success('Job created successfully!')
// //   },
// //   // Replace your onError in createJobMutation with this:

// // onError: (error: any) => {
// //   console.error('❌ Job creation error:', error)
// //   console.error('❌ Error response:', error.response)
// //   console.error('❌ Error details full:', JSON.stringify(error.response?.data, null, 2))
  
// //   if (error.response?.data?.details?.errors) {
// //     console.error('🔍 Validation errors:', error.response.data.details.errors)
// //   }
  
// //   toast.error(error.response?.data?.message || 'Failed to create job')
// // },
// // })

// // const calculateEndTime = (date: string, startTime: string, duration: number) => {
// //   const startDateTime = new Date(`${date}T${startTime}:00`)
// //   const endDateTime = new Date(startDateTime.getTime() + duration * 60000)
// //   return endDateTime.toISOString()
// // }
// //   // Update job mutation
// //   const updateJobMutation = useMutation({
// //     mutationFn: async ({ jobId, updates }: { jobId: string; updates: any }) => {
// //       const response = await api.patch(`/jobs/${jobId}`, updates)
// //       return response.data
// //     },
// //     onSuccess: () => {
// //       queryClient.invalidateQueries({ queryKey: ['calendar-jobs'] })
// //       toast.success('Job updated successfully!')
// //     },
// //     onError: (error: any) => {
// //       toast.error(error.response?.data?.detail || 'Failed to update job')
// //     },
// //   })

// //   const events: CalendarEvent[] = jobs?.jobs?.map((job: any) => ({
// //   id: job.id,
// //   title: `${job.customer?.name || 'Unknown'} - ${job.service_type || 'Service'}`,
// //   start: new Date(job.scheduled_start || job.start_time),
// //   end: new Date(job.scheduled_end || job.end_time),
// //   resource: {
// //     id: job.id,
// //     title: job.title,
// //     customer_name: job.customer?.name || 'Unknown',
// //     customer_phone: job.customer?.phone,
// //     address: job.location?.street || '',
// //     city: job.location?.city || '',
// //     state: job.location?.state || '',
// //     technician_id: job.technician?.id,
// //     technician_name: job.technician?.name,
// //     start_time: new Date(job.scheduled_start || job.start_time),
// //     end_time: new Date(job.scheduled_end || job.end_time),
// //     status: job.status,
// //     service_type: job.job_type || 'Service',
// //     notes: job.description,
// //     estimated_duration: job.estimated_duration || 60,
// //     priority: job.priority || 'medium'
// //   }
// // })) || []

// //   // Custom event style
// //   const eventStyleGetter = (event: CalendarEvent) => {
// //     const job = event.resource
// //     const backgroundColor = statusColors[job.status]
// //     const borderColor = priorityColors[job.priority]
    
// //     return {
// //       style: {
// //         backgroundColor,
// //         borderLeft: `4px solid ${borderColor}`,
// //         color: 'white',
// //         border: 'none',
// //         borderRadius: '4px',
// //         padding: '2px 5px',
// //         fontSize: '12px'
// //       }
// //     }
// //   }

// //   // Handle event selection
// //   const handleSelectEvent = (event: CalendarEvent) => {
// //     setSelectedEvent(event.resource)
// //   }

// //   // Handle event drop (drag and drop rescheduling)
// //   const handleEventDrop = ({ event, start, end }: any) => {
// //     updateJobMutation.mutate({
// //       jobId: event.id,
// //       updates: {
// //         start_time: start.toISOString(),
// //         end_time: end.toISOString()
// //       }
// //     })
// //   }

// //   // Custom toolbar
// //   const CustomToolbar = ({ label, onNavigate, onView }: any) => (
// //     <div className="flex justify-between items-center mb-6 p-4 bg-white rounded-lg shadow">
// //       <div className="flex items-center space-x-4">
// //         <div className="flex items-center space-x-2">
// //           <button
// //             onClick={() => onNavigate('PREV')}
// //             className="p-2 rounded-md hover:bg-gray-100"
// //           >
// //             <ChevronLeftIcon className="h-5 w-5" />
// //           </button>
// //           <h2 className="text-lg font-semibold text-gray-900">{label}</h2>
// //           <button
// //             onClick={() => onNavigate('NEXT')}
// //             className="p-2 rounded-md hover:bg-gray-100"
// //           >
// //             <ChevronRightIcon className="h-5 w-5" />
// //           </button>
// //         </div>
// //         <button
// //           onClick={() => onNavigate('TODAY')}
// //           className="px-3 py-1 text-sm bg-primary-100 text-primary-700 rounded-md hover:bg-primary-200"
// //         >
// //           Today
// //         </button>
// //       </div>

// //       <div className="flex items-center space-x-4">
// //         <select
// //           value={selectedTechnician}
// //           onChange={(e) => setSelectedTechnician(e.target.value)}
// //           className="text-sm border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
// //         >
// //           <option value="all">All Technicians</option>
// //           {technicians?.map((tech: any) => (
// //             <option key={tech.id} value={tech.id}> {tech.first_name} {tech.last_name}</option>
// //           ))}
// //         </select>

// //         <div className="flex bg-gray-100 rounded-lg p-1">
// //           {['month', 'week', 'day'].map((view) => (
// //             <button
// //               key={view}
// //               onClick={() => onView(view)}
// //               className={`px-3 py-1 text-sm rounded-md transition-colors ${
// //                 currentView === view
// //                   ? 'bg-white text-primary-700 shadow-sm'
// //                   : 'text-gray-600 hover:text-gray-900'
// //               }`}
// //             >
// //               {view.charAt(0).toUpperCase() + view.slice(1)}
// //             </button>
// //           ))}
// //         </div>

// //         <button
// //           onClick={() => setShowCreateModal(true)}
// //           className="inline-flex bg-black items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700"
// //         >
// //           <PlusIcon className="h-4 w-4 mr-2" />
// //           Schedule Job
// //         </button>
// //       </div>
// //     </div>
// //   )

// //   if (isLoading) {
// //     return (
// //       <div className="space-y-6">
// //         <div className="animate-pulse">
// //           <div className="h-16 bg-gray-200 rounded-lg mb-4"></div>
// //           <div className="h-96 bg-gray-200 rounded-lg"></div>
// //         </div>
// //       </div>
// //     )
// //   }

// //   return (
// //     <div className="space-y-6">
// //       {/* Header */}
// //       <div>
// //         <h1 className="text-2xl font-bold text-gray-900">Job Calendar</h1>
// //         <p className="mt-1 text-sm text-gray-500">
// //           Schedule and manage field service appointments with drag-and-drop functionality
// //         </p>
// //       </div>

// //       {/* Legend */}
// //       <div className="bg-white p-4 rounded-lg shadow">
// //         <h3 className="text-sm font-medium text-gray-900 mb-3">Status Legend</h3>
// //         <div className="flex flex-wrap gap-4">
// //           {Object.entries(statusColors).map(([status, color]) => (
// //             <div key={status} className="flex items-center">
// //               <div
// //                 className="w-4 h-4 rounded mr-2"
// //                 style={{ backgroundColor: color }}
// //               ></div>
// //               <span className="text-sm text-gray-600 capitalize">{status.replace('_', ' ')}</span>
// //             </div>
// //           ))}
// //         </div>
// //         <div className="mt-3 pt-3 border-t border-gray-200">
// //           <h4 className="text-sm font-medium text-gray-900 mb-2">Priority (Border Color)</h4>
// //           <div className="flex flex-wrap gap-4">
// //             {Object.entries(priorityColors).map(([priority, color]) => (
// //               <div key={priority} className="flex items-center">
// //                 <div
// //                   className="w-4 h-4 rounded mr-2 border-2"
// //                   style={{ borderColor: color, backgroundColor: '#f3f4f6' }}
// //                 ></div>
// //                 <span className="text-sm text-gray-600 capitalize">{priority}</span>
// //               </div>
// //             ))}
// //           </div>
// //         </div>
// //       </div>

// //       {/* Calendar */}
// //       <div className="bg-white rounded-lg shadow overflow-hidden">
// //         <BigCalendar
// //           localizer={localizer}
// //           events={events}
// //           startAccessor="start"
// //           endAccessor="end"
// //           style={{ height: 600, padding: '20px' }}
// //           view={currentView}
// //           onView={setCurrentView}
// //           date={currentDate}
// //           onNavigate={setCurrentDate}
// //           onSelectEvent={handleSelectEvent}
// //           onEventDrop={handleEventDrop}
// //           eventPropGetter={eventStyleGetter}
// //           components={{
// //             toolbar: CustomToolbar,
// //           }}
// //           formats={{
// //             timeGutterFormat: 'h:mm A',
// //             eventTimeRangeFormat: ({ start, end }) =>
// //               `${moment(start).format('h:mm A')} - ${moment(end).format('h:mm A')}`,
// //           }}
// //           step={30}
// //           timeslots={1}
// //           min={new Date(0, 0, 0, 7, 0, 0)}
// //           max={new Date(0, 0, 0, 19, 0, 0)}
// //           scrollToTime={new Date(0, 0, 0, 8, 0, 0)}
// //           draggableAccessor={() => true}
// //         />
// //       </div>

// //       {/* Job Details Modal */}
// //       {selectedEvent && (
// //         <Modal
// //           isOpen={!!selectedEvent}
// //           onClose={() => setSelectedEvent(null)}
// //           title="Job Details"
// //           size="lg"
// //         >
// //           <div className="space-y-6">
// //             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
// //               <div>
// //                 <h4 className="text-sm font-medium text-gray-900 mb-3">Customer Information</h4>
// //                 <div className="space-y-2">
// //                   <div className="flex items-center">
// //                     <UserIcon className="h-4 w-4 text-gray-400 mr-2" />
// //                     <span className="text-sm">{selectedEvent.customer_name}</span>
// //                   </div>
// //                   {selectedEvent.customer_phone && (
// //                     <div className="flex items-center">
// //                       <span className="text-sm">📞 {selectedEvent.customer_phone}</span>
// //                     </div>
// //                   )}
// //                   <div className="flex items-center">
// //                     <MapPinIcon className="h-4 w-4 text-gray-400 mr-2" />
// //                     <span className="text-sm">{selectedEvent.address}, {selectedEvent.city}, {selectedEvent.state}</span>
// //                   </div>
// //                 </div>
// //               </div>

// //               <div>
// //                 <h4 className="text-sm font-medium text-gray-900 mb-3">Job Information</h4>
// //                 <div className="space-y-2">
// //                   <div className="flex items-center">
// //                     <CalendarIcon className="h-4 w-4 text-gray-400 mr-2" />
// //                     <span className="text-sm">
// //                       {moment(selectedEvent.start_time).format('MMM DD, YYYY')}
// //                     </span>
// //                   </div>
// //                   <div className="flex items-center">
// //                     <ClockIcon className="h-4 w-4 text-gray-400 mr-2" />
// //                     <span className="text-sm">
// //                       {moment(selectedEvent.start_time).format('h:mm A')} - {moment(selectedEvent.end_time).format('h:mm A')}
// //                     </span>
// //                   </div>
// //                   <div>
// //                     <span className="text-sm text-gray-500">Service:</span>
// //                     <span className="ml-2 text-sm">{selectedEvent.service_type}</span>
// //                   </div>
// //                   <div>
// //                     <span className="text-sm text-gray-500">Status:</span>
// //                     <span className={`ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium`}
// //                           style={{ backgroundColor: statusColors[selectedEvent.status], color: 'white' }}>
// //                       {selectedEvent.status.replace('_', ' ')}
// //                     </span>
// //                   </div>
// //                   <div>
// //                     <span className="text-sm text-gray-500">Priority:</span>
// //                     <span className={`ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium`}
// //                           style={{ backgroundColor: priorityColors[selectedEvent.priority], color: 'white' }}>
// //                       {selectedEvent.priority}
// //                     </span>
// //                   </div>
// //                   {selectedEvent.technician_name && (
// //                     <div>
// //                       <span className="text-sm text-gray-500">Technician:</span>
// //                       <span className="ml-2 text-sm">{selectedEvent.technician_name}</span>
// //                     </div>
// //                   )}
// //                 </div>
// //               </div>
// //             </div>

// //             {selectedEvent.notes && (
// //               <div>
// //                 <h4 className="text-sm font-medium text-gray-900 mb-2">Notes</h4>
// //                 <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-md">{selectedEvent.notes}</p>
// //               </div>
// //             )}

// //             <div className="flex justify-end space-x-3">
// //               <button
// //                 onClick={() => setSelectedEvent(null)}
// //                 className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50"
// //               >
// //                 Close
// //               </button>
// //               <button className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700">
// //                 Edit Job
// //               </button>
// //             </div>
// //           </div>
// //         </Modal>
        
// //       )}
// //       {/* Job Creation Modal */}
// // {showCreateModal && (
// //   <Modal
// //     isOpen={showCreateModal}
// //     onClose={() => setShowCreateModal(false)}
// //     title="Schedule New Job"
// //     size="xl"
// //   >
// //     <JobForm
// //       onSubmit={(data) => createJobMutation.mutate(data)}
// //       onCancel={() => setShowCreateModal(false)}
// //       isLoading={createJobMutation.isPending}
// //       mode="create"
// //     />
// //   </Modal>
// // )}
// //     </div>
// //   )
// // }



























































































// // frontend/src/pages/scheduling/Calendar.tsx - COMPLETE FIXED VERSION
// import { useState } from 'react'
// import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
// import { Calendar as BigCalendar, momentLocalizer, View } from 'react-big-calendar'
// import moment from 'moment'
// import {
//   ChevronLeftIcon,
//   ChevronRightIcon,
//   PlusIcon,
//   CalendarIcon,
//   ClockIcon,
//   UserIcon,
//   MapPinIcon,
//   PencilIcon,
//   TrashIcon,
//   UserPlusIcon
// } from '@heroicons/react/24/outline'
// import toast from 'react-hot-toast'

// import { api } from '../../services/api'
// import Modal from '../../components/ui/Modal'
// import JobForm from '../../components/forms/JobForm'
// import 'react-big-calendar/lib/css/react-big-calendar.css'

// const localizer = momentLocalizer(moment)

// interface Job {
//   id: string
//   title: string
//   customer_name: string
//   customer_phone?: string
//   address: string
//   city: string
//   state: string
//   zip_code?: string
//   technician_id?: string
//   technician_name?: string
//   start_time: Date
//   end_time: Date
//   status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled'
//   service_type: string
//   notes?: string
//   special_instructions?: string
//   estimated_duration: number
//   priority: 'low' | 'medium' | 'high' | 'urgent'
//   job_number?: string
//   customer_id?: string
//   equipment_needed?: string[]
//   quoted_price?: number
// }

// interface CalendarEvent {
//   id: string
//   title: string
//   start: Date
//   end: Date
//   resource: Job
// }

// const statusColors = {
//   scheduled: '#3B82F6',
//   in_progress: '#F59E0B',
//   completed: '#10B981',
//   cancelled: '#EF4444'
// }

// const priorityColors = {
//   low: '#6B7280',
//   medium: '#3B82F6',
//   high: '#F59E0B',
//   urgent: '#EF4444'
// }

// export default function Calendar() {
//   const [currentDate, setCurrentDate] = useState(new Date())
//   const [currentView, setCurrentView] = useState<View>('week')
//   const [selectedEvent, setSelectedEvent] = useState<Job | null>(null)
//   const [showCreateModal, setShowCreateModal] = useState(false)
//   const [showEditModal, setShowEditModal] = useState(false)
//   const [editingJob, setEditingJob] = useState<Job | null>(null)
//   const [showTechnicianAssign, setShowTechnicianAssign] = useState(false)
//   const [assigningJobId, setAssigningJobId] = useState<string | null>(null)
//   const [selectedTechnician, setSelectedTechnician] = useState('all')

//   const queryClient = useQueryClient()

//   // Debug function to test API payload
//   const debugJobCreation = async (jobData: any) => {
//     try {
//       console.log('🐛 Testing job creation with debug endpoint')
//       const response = await api.post('/jobs/debug', jobData)
//       console.log('🐛 Debug response:', response.data)
//       toast.success('Debug test successful! Check console for details.')
//     } catch (error: any) {
//       console.error('🐛 Debug test failed:', error)
//       toast.error('Debug test failed - check console')
//     }
//   }

//   // Fix corrupted job data
//   const fixJobData = async () => {
//     try {
//       console.log('🔧 Fixing corrupted job data...')
//       const response = await api.post('/jobs/fix-data', {})
//       console.log('🔧 Fix data response:', response.data)
//       toast.success(`Data migration completed! Fixed ${response.data.fixed_jobs} jobs.`)
//       // Refresh calendar after fixing data
//       refetch()
//     } catch (error: any) {
//       console.error('🔧 Fix data failed:', error)
//       toast.error('Data migration failed - check console')
//     }
//   }

//   // Fetch jobs/events with enhanced error handling and timezone awareness
//   const { data: jobs, isLoading, error, refetch } = useQuery({
//     queryKey: ['calendar-jobs', currentDate, selectedTechnician],
//     queryFn: async () => {
//       const startDate = moment(currentDate).startOf('month').format('YYYY-MM-DD')
//       const endDate = moment(currentDate).endOf('month').format('YYYY-MM-DD')
      
//       const params = new URLSearchParams({
//         start_date: startDate,
//         end_date: endDate,
//       })
      
//       if (selectedTechnician !== 'all') {
//         params.append('technician_id', selectedTechnician)
//       }
      
//       console.log('📅 Fetching calendar jobs:', {
//         startDate,
//         endDate,
//         selectedTechnician,
//         url: `/jobs/calendar?${params.toString()}`
//       })
      
//       const response = await api.get(`/jobs/calendar?${params.toString()}`)
//       console.log('📅 Calendar API response:', response.data)
//       return response.data
//     },
//     staleTime: 0, // Always fetch fresh data
//     cacheTime: 0, // Don't cache results
//     refetchOnWindowFocus: true,
//     refetchInterval: false, // Don't auto-refresh
//   })

//   // Fetch technicians
//   const { data: technicians } = useQuery({
//     queryKey: ['technicians'],
//     queryFn: async () => {
//       const response = await api.get('/users/?role=technician')
//       return response.data
//     },
//   })

//   // Calculate end time with Pakistan timezone consideration
//   const calculateEndTime = (date: string, startTime: string, duration: number) => {
//     // Parse duration properly - could be in hours or minutes
//     let durationInMinutes = duration
    
//     // If duration is a decimal (like 1.5 for 1.5 hours), convert to minutes
//     if (duration < 24 && duration % 1 !== 0) {
//       durationInMinutes = duration * 60 // Convert hours to minutes
//     }
    
//     // Use moment for consistent timezone handling (Pakistan is UTC+5)
//     const startMoment = moment(`${date} ${startTime}`, 'YYYY-MM-DD HH:mm')
//     const endMoment = startMoment.clone().add(durationInMinutes, 'minutes')
    
//     // Convert to ISO string but keep the local timezone context
//     const startISO = startMoment.format('YYYY-MM-DDTHH:mm:ss')
//     const endISO = endMoment.format('YYYY-MM-DDTHH:mm:ss')
    
//     console.log('⏰ Time calculation (Pakistan timezone):', {
//       inputDate: date,
//       inputTime: startTime,
//       originalDuration: duration,
//       durationInMinutes,
//       startLocal: startMoment.format('YYYY-MM-DD HH:mm:ss'),
//       endLocal: endMoment.format('YYYY-MM-DD HH:mm:ss'),
//       startISO,
//       endISO,
//       timezone: 'PKT (UTC+5)'
//     })
    
//     return endISO
//   }

//   // Create job mutation - enhanced error handling and validation
//   const createJobMutation = useMutation({
//     mutationFn: async (jobData: any) => {
//       console.log('🔨 Creating job with form data:', jobData)
      
//       // Validate required fields before sending
//       const requiredFields = ['customer_id', 'service_type', 'scheduled_date', 'start_time'];
//       const missingFields = requiredFields.filter(field => !jobData[field]);
//       if (missingFields.length > 0) {
//         throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
//       }
      
//       // Create precise datetime strings without timezone issues
//       const startDateTime = `${jobData.scheduled_date}T${jobData.start_time}:00`
//       const endDateTime = calculateEndTime(jobData.scheduled_date, jobData.start_time, jobData.estimated_duration || 60)
      
//       // Build API payload with careful validation
//       const apiData = {
//         customer_id: jobData.customer_id,
//         title: `${jobData.service_type} - Service Call`,
//         service_type: jobData.service_type,
//         job_type: jobData.service_type, // Backend might expect job_type
//         description: jobData.notes || jobData.special_instructions || `${jobData.service_type} service appointment`,
//         address: {
//           street: jobData.address || '',
//           city: jobData.city || '',
//           state: jobData.state || '',
//           postal_code: jobData.zip_code || '',
//         },
//         time_tracking: {
//           scheduled_start: startDateTime,
//           scheduled_end: endDateTime,
//           scheduled_duration: jobData.estimated_duration || 60,
//         },
//         technician_id: jobData.technician_id || null,
//         priority: jobData.priority || 'medium',
//         status: 'scheduled',
//         special_instructions: jobData.special_instructions || '',
//         equipment_needed: jobData.equipment_needed ? [jobData.equipment_needed] : [],
//         quoted_price: jobData.estimated_cost || null,
//         estimated_duration: jobData.estimated_duration || 60,
//       }

//       console.log('🚀 API payload being sent:', JSON.stringify(apiData, null, 2))
//       console.log('🚀 Datetime info:', {
//         startDateTime,
//         endDateTime,
//         timezone: 'PKT',
//         duration: jobData.estimated_duration || 60
//       })
      
//       try {
//         const response = await api.post('/jobs/', apiData)
//         console.log('✅ Job creation API response:', response.data)
//         return response.data
//       } catch (error: any) {
//         console.error('❌ Job creation API error details:', {
//           status: error.response?.status,
//           statusText: error.response?.statusText,
//           data: error.response?.data,
//           headers: error.response?.headers,
//           config: error.config
//         })
        
//         // Log the exact error for debugging
//         if (error.response?.data?.detail) {
//           console.error('❌ Validation errors:', error.response.data.detail)
//         }
        
//         throw error
//       }
//     },
//     onSuccess: (data) => {
//       console.log('✅ Job created successfully:', data)
//       // Force refresh calendar data
//       queryClient.invalidateQueries({ queryKey: ['calendar-jobs'] })
//       queryClient.refetchQueries({ queryKey: ['calendar-jobs'] })
//       refetch()
//       setShowCreateModal(false)
//       toast.success('Job created successfully!')
//     },
//     onError: (error: any) => {
//       console.error('❌ Job creation mutation error:', error)
      
//       let errorMessage = 'Failed to create job'
      
//       if (error.response?.data?.detail) {
//         if (Array.isArray(error.response.data.detail)) {
//           // Pydantic validation errors
//           const validationErrors = error.response.data.detail.map((err: any) => 
//             `${err.loc?.join('.')} - ${err.msg}`
//           ).join(', ')
//           errorMessage = `Validation errors: ${validationErrors}`
//         } else {
//           errorMessage = error.response.data.detail
//         }
//       } else if (error.message) {
//         errorMessage = error.message
//       }
      
//       toast.error(errorMessage)
//     },
//   })

//   // Update job mutation - aggressive cache refresh for Pakistan timezone
//   const updateJobMutation = useMutation({
//     mutationFn: async ({ jobId, updates }: { jobId: string; updates: any }) => {
//       console.log('🔧 Updating job:', jobId, 'with updates:', updates)
//       const response = await api.put(`/jobs/${jobId}`, updates)
//       console.log('✅ Update response:', response.data)
//       return response.data
//     },
//     onSuccess: async (data) => {
//       console.log('✅ Job updated successfully:', data)
      
//       try {
//         // 1. Clear all related cache entries
//         await queryClient.invalidateQueries({ queryKey: ['calendar-jobs'] })
//         await queryClient.invalidateQueries({ queryKey: ['jobs'] })
        
//         // 2. Remove specific cache entries
//         queryClient.removeQueries({ queryKey: ['calendar-jobs'] })
        
//         // 3. Force immediate refetch
//         await refetch()
        
//         // 4. Clear states
//         setShowEditModal(false)
//         setEditingJob(null)
//         setSelectedEvent(null)
        
//         // 5. Show success message
//         toast.success('Job updated successfully!')
        
//         // 6. Additional refresh after a short delay to ensure UI updates
//         setTimeout(async () => {
//           console.log('🔄 Delayed refresh after job update')
//           await refetch()
//         }, 1000)
        
//       } catch (error) {
//         console.error('❌ Error during cache refresh:', error)
//         // Force a hard refresh if cache operations fail
//         window.location.reload()
//       }
//     },
//     onError: (error: any) => {
//       console.error('❌ Job update error:', error)
//       toast.error(error.response?.data?.detail || 'Failed to update job')
//     },
//   })

//   // Reschedule job mutation (for drag and drop) - force refresh
//   const rescheduleMutation = useMutation({
//     mutationFn: async ({ jobId, newStart, newEnd }: { jobId: string; newStart: Date; newEnd: Date }) => {
//       const response = await api.patch(`/jobs/${jobId}/reschedule`, {
//         new_start: newStart.toISOString(),
//         new_end: newEnd.toISOString(),
//         reason: 'Rescheduled via drag and drop'
//       })
//       return response.data
//     },
//     onSuccess: () => {
//       // Force immediate refresh
//       queryClient.invalidateQueries({ queryKey: ['calendar-jobs'] })
//       queryClient.refetchQueries({ queryKey: ['calendar-jobs'] })
//       toast.success('Job rescheduled successfully!')
//     },
//     onError: (error: any) => {
//       toast.error(error.response?.data?.detail || 'Failed to reschedule job')
//     },
//   })

//   // Technician assignment mutation - force refresh
//   const assignTechnicianMutation = useMutation({
//     mutationFn: async ({ jobId, technicianId }: { jobId: string; technicianId: string }) => {
//       const response = await api.patch(`/jobs/${jobId}/assign-technician`, {
//         technician_id: technicianId
//       })
//       return response.data
//     },
//     onSuccess: () => {
//       // Force immediate refresh
//       queryClient.invalidateQueries({ queryKey: ['calendar-jobs'] })
//       queryClient.refetchQueries({ queryKey: ['calendar-jobs'] })
//       setShowTechnicianAssign(false)
//       setAssigningJobId(null)
//       setSelectedEvent(null)
//       toast.success('Technician assigned successfully!')
//     },
//     onError: (error: any) => {
//       toast.error(error.response?.data?.detail || 'Failed to assign technician')
//     },
//   })

//   // Delete job mutation - force refresh
//   const deleteJobMutation = useMutation({
//     mutationFn: async (jobId: string) => {
//       const response = await api.delete(`/jobs/${jobId}`)
//       return response.data
//     },
//     onSuccess: () => {
//       // Force immediate refresh
//       queryClient.invalidateQueries({ queryKey: ['calendar-jobs'] })
//       queryClient.refetchQueries({ queryKey: ['calendar-jobs'] })
//       setSelectedEvent(null)
//       toast.success('Job deleted successfully!')
//     },
//     onError: (error: any) => {
//       toast.error(error.response?.data?.detail || 'Failed to delete job')
//     },
//   })

//   // Convert events with Pakistan timezone handling
//   const events: CalendarEvent[] = jobs?.jobs?.map((job: any) => {
//     try {
//       // Parse dates with moment for consistent Pakistan timezone handling
//       let startTime, endTime
      
//       if (job.scheduled_start || job.start_time) {
//         const startStr = job.scheduled_start || job.start_time
//         startTime = moment(startStr).toDate()
//       } else {
//         console.warn('Job missing start time:', job.id)
//         startTime = new Date()
//       }
      
//       if (job.scheduled_end || job.end_time) {
//         const endStr = job.scheduled_end || job.end_time
//         endTime = moment(endStr).toDate()
//       } else {
//         // Calculate end time from duration
//         const duration = job.estimated_duration || job.time_tracking?.scheduled_duration || 60
//         endTime = moment(startTime).add(duration, 'minutes').toDate()
//       }
      
//       // Debug log for each job
//       console.log('📅 Processing job for calendar:', {
//         id: job.id,
//         title: job.title,
//         customer: job.customer?.name,
//         startStr: job.scheduled_start || job.start_time,
//         endStr: job.scheduled_end || job.end_time,
//         startTime: startTime.toLocaleString(),
//         endTime: endTime.toLocaleString(),
//         duration: job.estimated_duration,
//         status: job.status
//       })
      
//       return {
//         id: job.id,
//         title: `${job.customer?.name || 'Unknown'} - ${job.service_type || job.job_type || 'Service'}`,
//         start: startTime,
//         end: endTime,
//         resource: {
//           id: job.id,
//           title: job.title,
//           customer_name: job.customer?.name || 'Unknown',
//           customer_phone: job.customer?.phone,
//           customer_id: job.customer?.id,
//           address: job.location?.street || '',
//           city: job.location?.city || '',
//           state: job.location?.state || '',
//           zip_code: job.location?.postal_code || '',
//           technician_id: job.technician?.id,
//           technician_name: job.technician?.name,
//           start_time: startTime,
//           end_time: endTime,
//           status: job.status,
//           service_type: job.job_type || job.service_type || 'Service',
//           notes: job.description,
//           special_instructions: job.special_instructions,
//           estimated_duration: job.estimated_duration || 60,
//           priority: job.priority || 'medium',
//           job_number: job.job_number,
//           equipment_needed: job.equipment_needed,
//           quoted_price: job.quoted_price
//         }
//       }
//     } catch (error) {
//       console.error('❌ Error processing job for calendar:', job.id, error)
//       return null
//     }
//   }).filter(Boolean) || []

//   // Log final events for debugging
//   console.log('📅 Final calendar events:', events.length, events)

//   // Custom event style
//   const eventStyleGetter = (event: CalendarEvent) => {
//     const job = event.resource
//     const backgroundColor = statusColors[job.status]
//     const borderColor = priorityColors[job.priority]
    
//     return {
//       style: {
//         backgroundColor,
//         borderLeft: `4px solid ${borderColor}`,
//         color: 'white',
//         border: 'none',
//         borderRadius: '4px',
//         padding: '2px 5px',
//         fontSize: '12px'
//       }
//     }
//   }

//   // Handle event selection
//   const handleSelectEvent = (event: CalendarEvent) => {
//     setSelectedEvent(event.resource)
//   }

//   // Handle event drop (drag and drop rescheduling)
//   const handleEventDrop = ({ event, start, end }: any) => {
//     rescheduleMutation.mutate({
//       jobId: event.id,
//       newStart: start,
//       newEnd: end
//     })
//   }

//   // Handle event resize
//   const handleEventResize = ({ event, start, end }: any) => {
//     rescheduleMutation.mutate({
//       jobId: event.id,
//       newStart: start,
//       newEnd: end
//     })
//   }

//   // Handle event right click
//   const handleEventRightClick = (event: any, e: React.MouseEvent) => {
//     e.preventDefault()
//     setSelectedEvent(event.resource)
//   }

//   // Handle job creation
//   const handleCreateJob = (jobData: any) => {
//     createJobMutation.mutate(jobData)
//   }

//   // Handle edit job
//   const handleEditJob = (job: Job) => {
//     setEditingJob(job)
//     setShowEditModal(true)
//   }

//   // Handle job update - fix time precision in updates
//   const handleUpdateJob = (jobData: any) => {
//     if (!selectedEvent && !editingJob) return
    
//     const jobToUpdate = editingJob || selectedEvent
//     console.log('🔧 Updating job:', jobToUpdate.id, 'with form data:', jobData)
    
//     // Create precise datetime strings
//     const startDateTime = `${jobData.scheduled_date}T${jobData.start_time}:00`
//     const endDateTime = calculateEndTime(jobData.scheduled_date, jobData.start_time, jobData.estimated_duration)
    
//     const updates = {
//       title: `${jobData.service_type} - Service Call`,
//       service_type: jobData.service_type,
//       description: jobData.notes || jobData.special_instructions || '',
//       address: {
//         street: jobData.address,
//         city: jobData.city,
//         state: jobData.state,
//         postal_code: jobData.zip_code,
//       },
//       time_tracking: {
//         scheduled_start: startDateTime,
//         scheduled_end: endDateTime,
//         scheduled_duration: jobData.estimated_duration,
//       },
//       technician_id: jobData.technician_id || null,
//       priority: jobData.priority,
//       special_instructions: jobData.special_instructions,
//       estimated_duration: jobData.estimated_duration,
//     }

//     console.log('🚀 Sending update with precise times:', {
//       jobId: jobToUpdate.id,
//       startDateTime,
//       endDateTime,
//       updates
//     })
    
//     updateJobMutation.mutate({
//       jobId: jobToUpdate.id,
//       updates
//     })
//   }

//   // Handle assign technician
//   const handleAssignTechnician = (jobId: string) => {
//     setAssigningJobId(jobId)
//     setShowTechnicianAssign(true)
//   }

//   // Handle technician assignment
//   const handleTechnicianAssignment = (technicianId: string) => {
//     if (assigningJobId) {
//       assignTechnicianMutation.mutate({
//         jobId: assigningJobId,
//         technicianId
//       })
//     }
//   }

//   // Handle job deletion
//   const handleDeleteJob = () => {
//     if (!selectedEvent) return
    
//     if (window.confirm('Are you sure you want to delete this job?')) {
//       deleteJobMutation.mutate(selectedEvent.id)
//     }
//   }

//   // Convert job to form data for editing - fix customer_id issue
//   const jobToFormData = (job: Job) => {
//     console.log('🔄 Converting job to form data:', job)
    
//     return {
//       customer_id: job.customer_id || job.id, // Use proper customer ID
//       service_type: job.service_type,
//       scheduled_date: moment(job.start_time).format('YYYY-MM-DD'),
//       start_time: moment(job.start_time).format('HH:mm'),
//       estimated_duration: job.estimated_duration,
//       technician_id: job.technician_id || '',
//       priority: job.priority,
//       address: job.address,
//       city: job.city,
//       state: job.state,
//       zip_code: job.zip_code || '',
//       notes: job.notes || '',
//       special_instructions: job.special_instructions || '',
//     }
//   }

//   // Custom toolbar
//   const CustomToolbar = ({ label, onNavigate, onView }: any) => (
//     <div className="flex justify-between items-center mb-6 p-4 bg-white rounded-lg shadow">
//       <div className="flex items-center space-x-4">
//         <div className="flex items-center space-x-2">
//           <button
//             onClick={() => onNavigate('PREV')}
//             className="p-2 rounded-md hover:bg-gray-100"
//           >
//             <ChevronLeftIcon className="h-5 w-5" />
//           </button>
//           <h2 className="text-lg font-semibold text-gray-900">{label}</h2>
//           <button
//             onClick={() => onNavigate('NEXT')}
//             className="p-2 rounded-md hover:bg-gray-100"
//           >
//             <ChevronRightIcon className="h-5 w-5" />
//           </button>
//         </div>
//         <button
//           onClick={() => onNavigate('TODAY')}
//           className="px-3 py-1 text-sm bg-primary-100 text-primary-700 rounded-md hover:bg-primary-200"
//         >
//           Today
//         </button>
//       </div>

//       <div className="flex items-center space-x-4">
//         <select
//           value={selectedTechnician}
//           onChange={(e) => setSelectedTechnician(e.target.value)}
//           className="text-sm border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
//         >
//           <option value="all">All Technicians</option>
//           {technicians?.map((tech: any) => (
//             <option key={tech.id} value={tech.id}>{tech.first_name} {tech.last_name}</option>
//           ))}
//         </select>

//         <div className="flex bg-gray-100 rounded-lg p-1">
//           {['month', 'week', 'day'].map((view) => (
//             <button
//               key={view}
//               onClick={() => onView(view)}
//               className={`px-3 py-1 text-sm rounded-md transition-colors ${
//                 currentView === view
//                   ? 'bg-white text-primary-700 shadow-sm'
//                   : 'text-gray-600 hover:text-gray-900'
//               }`}
//             >
//               {view.charAt(0).toUpperCase() + view.slice(1)}
//             </button>
//           ))}
//         </div>

//         <button
//           onClick={() => setShowCreateModal(true)}
//           className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700"
//         >
//           <PlusIcon className="h-4 w-4 mr-2" />
//           Schedule Job
//         </button>
//       </div>
//     </div>
//   )

//   if (isLoading) {
//     return (
//       <div className="space-y-6">
//         <div className="animate-pulse">
//           <div className="h-16 bg-gray-200 rounded-lg mb-4"></div>
//           <div className="h-96 bg-gray-200 rounded-lg"></div>
//         </div>
//       </div>
//     )
//   }

//   if (error) {
//     console.error('Calendar loading error:', error)
//     return (
//       <div className="space-y-6">
//         <div className="bg-red-50 border border-red-200 rounded-md p-4">
//           <h3 className="text-red-800 font-medium">Error Loading Calendar</h3>
//           <p className="text-red-600 text-sm mt-1">
//             {error.message || 'Failed to load calendar data'}
//           </p>
//           <button
//             onClick={() => refetch()}
//             className="mt-2 px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700"
//           >
//             Retry
//           </button>
//         </div>
//       </div>
//     )
//   }

//   return (
//     <div className="space-y-6">
//       {/* Header with debug info */}
//       <div className="flex justify-between items-center">
//         <div>
//           <h1 className="text-2xl font-bold text-gray-900">Job Calendar</h1>
//           <p className="mt-1 text-sm text-gray-500">
//             Schedule and manage field service appointments with drag-and-drop functionality
//           </p>
//           <p className="text-xs text-gray-400 mt-1">
//             Jobs loaded: {events.length} | Last updated: {new Date().toLocaleTimeString()} (PKT)
//           </p>
//         </div>
//         <button
//           onClick={() => refetch()}
//           className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
//         >
//           Refresh Calendar
//         </button>
//       </div>

//       {/* Debug Panel - Remove this in production */}
//       {process.env.NODE_ENV === 'development' && (
//         <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
//           <h3 className="font-medium text-yellow-800 mb-2">Debug Info (Pakistan Time Zone)</h3>
//           <div className="text-sm text-yellow-700 space-y-1">
//             <div>Current time: {new Date().toLocaleString()} (Local)</div>
//             <div>Calendar jobs fetched: {jobs?.jobs?.length || 0}</div>
//             <div>Calendar events rendered: {events.length}</div>
//             <div>Selected technician: {selectedTechnician}</div>
//             <div>Current view: {currentView}</div>
//             <div>Date range: {moment(currentDate).startOf('month').format('YYYY-MM-DD')} to {moment(currentDate).endOf('month').format('YYYY-MM-DD')}</div>
//             {jobs?.jobs?.length > 0 && (
//               <div className="mt-2">
//                 <details>
//                   <summary className="cursor-pointer">Raw job data (first 3 jobs)</summary>
//                   <pre className="mt-2 text-xs bg-white p-2 rounded border overflow-auto max-h-32">
//                     {JSON.stringify(jobs.jobs.slice(0, 3), null, 2)}
//                   </pre>
//                 </details>
//               </div>
//             )}
//             <div className="mt-2 pt-2 border-t border-yellow-300 space-x-2">
//               <button
//                 onClick={fixJobData}
//                 className="px-2 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700"
//               >
//                 Fix Corrupted Jobs
//               </button>
//             </div>
//           </div>
//         </div>
//       )}

//       {/* Legend */}
//       <div className="bg-white p-4 rounded-lg shadow">
//         <h3 className="text-sm font-medium text-gray-900 mb-3">Status Legend</h3>
//         <div className="flex flex-wrap gap-4">
//           {Object.entries(statusColors).map(([status, color]) => (
//             <div key={status} className="flex items-center">
//               <div
//                 className="w-4 h-4 rounded mr-2"
//                 style={{ backgroundColor: color }}
//               ></div>
//               <span className="text-sm text-gray-600 capitalize">{status.replace('_', ' ')}</span>
//             </div>
//           ))}
//         </div>
//         <div className="mt-3 pt-3 border-t border-gray-200">
//           <h4 className="text-sm font-medium text-gray-900 mb-2">Priority (Border Color)</h4>
//           <div className="flex flex-wrap gap-4">
//             {Object.entries(priorityColors).map(([priority, color]) => (
//               <div key={priority} className="flex items-center">
//                 <div
//                   className="w-4 h-4 rounded mr-2 border-2"
//                   style={{ borderColor: color, backgroundColor: '#f3f4f6' }}
//                 ></div>
//                 <span className="text-sm text-gray-600 capitalize">{priority}</span>
//               </div>
//             ))}
//           </div>
//         </div>
//       </div>

//       {/* Calendar */}
//       <div className="bg-white rounded-lg shadow overflow-hidden">
//         <BigCalendar
//           localizer={localizer}
//           events={events}
//           startAccessor="start"
//           endAccessor="end"
//           style={{ height: 600, padding: '20px' }}
//           view={currentView}
//           onView={setCurrentView}
//           date={currentDate}
//           onNavigate={setCurrentDate}
//           selectable
//           resizable
//           onSelectEvent={handleSelectEvent}
//           onEventDrop={handleEventDrop}
//           onEventResize={handleEventResize}
//           eventPropGetter={eventStyleGetter}
//           components={{
//             toolbar: CustomToolbar,
//           }}
//           formats={{
//             timeGutterFormat: 'h:mm A',
//             eventTimeRangeFormat: ({ start, end }) =>
//               `${moment(start).format('h:mm A')} - ${moment(end).format('h:mm A')}`,
//           }}
//           step={30}
//           timeslots={1}
//           min={new Date(0, 0, 0, 7, 0, 0)}
//           max={new Date(0, 0, 0, 19, 0, 0)}
//           scrollToTime={new Date(0, 0, 0, 8, 0, 0)}
//           draggableAccessor={() => true}
//         />
//       </div>

//       {/* Job Creation Modal */}
//       {showCreateModal && (
//         <Modal
//           isOpen={showCreateModal}
//           onClose={() => setShowCreateModal(false)}
//           title="Schedule New Job"
//           size="xl"
//         >
//           <JobForm
//             onSubmit={handleCreateJob}
//             onCancel={() => setShowCreateModal(false)}
//             isLoading={createJobMutation.isPending}
//             mode="create"
//           />
//         </Modal>
//       )}

//       {/* Job Edit Modal */}
//       {showEditModal && editingJob && (
//         <Modal
//           isOpen={showEditModal}
//           onClose={() => {
//             setShowEditModal(false)
//             setEditingJob(null)
//           }}
//           title="Edit Job"
//           size="xl"
//         >
//           <JobForm
//             onSubmit={handleUpdateJob}
//             onCancel={() => {
//               setShowEditModal(false)
//               setEditingJob(null)
//             }}
//             isLoading={updateJobMutation.isPending}
//             mode="edit"
//             initialData={jobToFormData(editingJob)}
//           />
//         </Modal>
//       )}

//       {/* Technician Assignment Modal */}
//       {showTechnicianAssign && (
//         <Modal
//           isOpen={showTechnicianAssign}
//           onClose={() => {
//             setShowTechnicianAssign(false)
//             setAssigningJobId(null)
//           }}
//           title="Assign Technician"
//           size="md"
//         >
//           <div className="space-y-4">
//             <div>
//               <label className="block text-sm font-medium text-gray-700 mb-2">
//                 Select Technician
//               </label>
//               <select
//                 onChange={(e) => {
//                   if (e.target.value) {
//                     handleTechnicianAssignment(e.target.value)
//                   }
//                 }}
//                 className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
//                 defaultValue=""
//               >
//                 <option value="">Choose a technician...</option>
//                 {technicians?.map((tech: any) => (
//                   <option key={tech.id} value={tech.id}>
//                     {tech.first_name} {tech.last_name}
//                   </option>
//                 ))}
//               </select>
//             </div>
            
//             <div className="flex justify-end space-x-3 pt-4">
//               <button
//                 onClick={() => {
//                   setShowTechnicianAssign(false)
//                   setAssigningJobId(null)
//                 }}
//                 className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50"
//               >
//                 Cancel
//               </button>
//             </div>
//           </div>
//         </Modal>
//       )}

//       {/* Job Details Modal */}
//       {selectedEvent && !showEditModal && !showTechnicianAssign && (
//         <Modal
//           isOpen={!!selectedEvent}
//           onClose={() => setSelectedEvent(null)}
//           title={`Job #${selectedEvent.job_number || selectedEvent.id.slice(-6)}`}
//           size="lg"
//         >
//           <div className="space-y-6">
//             {/* Enhanced action buttons */}
//             <div className="flex justify-between items-center pt-6 border-t border-gray-200">
//               <div className="flex space-x-3">
//                 <button
//                   onClick={() => handleEditJob(selectedEvent)}
//                   className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
//                 >
//                   <PencilIcon className="h-4 w-4 mr-2" />
//                   Edit Job
//                 </button>
//                 <button
//                   onClick={() => handleAssignTechnician(selectedEvent.id)}
//                   className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
//                 >
//                   <UserIcon className="h-4 w-4 mr-2" />
//                   Assign Technician
//                 </button>
//                 <button
//                   onClick={handleDeleteJob}
//                   className="inline-flex items-center px-3 py-2 border border-red-300 shadow-sm text-sm leading-4 font-medium rounded-md text-red-700 bg-white hover:bg-red-50"
//                 >
//                   <TrashIcon className="h-4 w-4 mr-2" />
//                   Delete
//                 </button>
//               </div>
//               <div className="flex space-x-3">
//                 <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium`}
//                       style={{ backgroundColor: statusColors[selectedEvent.status], color: 'white' }}>
//                   {selectedEvent.status.replace('_', ' ')}
//                 </span>
//                 <button
//                   onClick={() => setSelectedEvent(null)}
//                   className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50"
//                 >
//                   Close
//                 </button>
//               </div>
//             </div>

//             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//               <div>
//                 <h4 className="text-sm font-medium text-gray-900 mb-3">Customer Information</h4>
//                 <div className="space-y-2">
//                   <div className="flex items-center">
//                     <UserIcon className="h-4 w-4 text-gray-400 mr-2" />
//                     <span className="text-sm">{selectedEvent.customer_name}</span>
//                   </div>
//                   {selectedEvent.customer_phone && (
//                     <div className="flex items-center">
//                       <span className="text-sm">📞 {selectedEvent.customer_phone}</span>
//                     </div>
//                   )}
//                   <div className="flex items-center">
//                     <MapPinIcon className="h-4 w-4 text-gray-400 mr-2" />
//                     <span className="text-sm">{selectedEvent.address}, {selectedEvent.city}, {selectedEvent.state}</span>
//                   </div>
//                 </div>
//               </div>

//               <div>
//                 <h4 className="text-sm font-medium text-gray-900 mb-3">Job Information</h4>
//                 <div className="space-y-2">
//                   <div className="flex items-center">
//                     <CalendarIcon className="h-4 w-4 text-gray-400 mr-2" />
//                     <span className="text-sm">
//                       {moment(selectedEvent.start_time).format('MMM DD, YYYY')}
//                     </span>
//                   </div>
//                   <div className="flex items-center">
//                     <ClockIcon className="h-4 w-4 text-gray-400 mr-2" />
//                     <span className="text-sm">
//                       {moment(selectedEvent.start_time).format('h:mm A')} - {moment(selectedEvent.end_time).format('h:mm A')}
//                     </span>
//                   </div>
//                   <div>
//                     <span className="text-sm text-gray-500">Service:</span>
//                     <span className="ml-2 text-sm">{selectedEvent.service_type}</span>
//                   </div>
//                   <div>
//                     <span className="text-sm text-gray-500">Priority:</span>
//                     <span className={`ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium`}
//                           style={{ backgroundColor: priorityColors[selectedEvent.priority], color: 'white' }}>
//                       {selectedEvent.priority}
//                     </span>
//                   </div>
//                   {selectedEvent.technician_name && (
//                     <div>
//                       <span className="text-sm text-gray-500">Technician:</span>
//                       <span className="ml-2 text-sm">{selectedEvent.technician_name}</span>
//                     </div>
//                   )}
//                 </div>
//               </div>
//             </div>

//             {selectedEvent.notes && (
//               <div>
//                 <h4 className="text-sm font-medium text-gray-900 mb-2">Notes</h4>
//                 <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-md">{selectedEvent.notes}</p>
//               </div>
//             )}

//             {selectedEvent.special_instructions && (
//               <div>
//                 <h4 className="text-sm font-medium text-gray-900 mb-2">Special Instructions</h4>
//                 <p className="text-sm text-gray-600 bg-yellow-50 p-3 rounded-md border border-yellow-200">{selectedEvent.special_instructions}</p>
//               </div>
//             )}
//           </div>
//         </Modal>
//       )}
//     </div>
//   )
// }
              











































// frontend/src/pages/scheduling/Calendar.tsx - UPDATED
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Calendar as BigCalendar, momentLocalizer, View } from 'react-big-calendar'
import moment from 'moment'
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  PlusIcon,
  CalendarIcon,
  ClockIcon,
  UserIcon,
  MapPinIcon,
  PencilIcon,
  TrashIcon,
} from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'

import { api } from '../../services/api'
import Modal from '../../components/ui/Modal'
import JobForm from '../../components/forms/JobForm'
import 'react-big-calendar/lib/css/react-big-calendar.css'

const localizer = momentLocalizer(moment)

interface Job {
  id: string
  title: string
  customer_name: string
  customer_phone?: string
  address: string
  city: string
  state: string
  zip_code?: string
  technician_id?: string
  technician_name?: string
  start_time: Date
  end_time: Date
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled'
  service_type: string
  notes?: string
  special_instructions?: string
  estimated_duration: number
  priority: 'low' | 'medium' | 'high' | 'urgent'
  job_number?: string
  customer_id?: string
  equipment_needed?: string[]
  quoted_price?: number
}

interface CalendarEvent {
  id: string
  title: string
  start: Date
  end: Date
  resource: Job
}

const statusColors = {
  scheduled: '#3B82F6',
  in_progress: '#F59E0B',
  completed: '#10B981',
  cancelled: '#EF4444'
}

const priorityColors = {
  low: '#6B7280',
  medium: '#3B82F6',
  high: '#F59E0B',
  urgent: '#EF4444'
}

export default function Calendar() {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [currentView, setCurrentView] = useState<View>('week')
  const [selectedEvent, setSelectedEvent] = useState<Job | null>(null)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingJob, setEditingJob] = useState<Job | null>(null)
  const [showTechnicianAssign, setShowTechnicianAssign] = useState(false)
  const [assigningJobId, setAssigningJobId] = useState<string | null>(null)
  const [selectedTechnician, setSelectedTechnician] = useState('all')

  const queryClient = useQueryClient()

  // Fetch jobs for calendar
  const { data: jobs, isLoading, error, refetch } = useQuery({
    queryKey: ['calendar-jobs', currentDate, selectedTechnician],
    queryFn: async () => {
      const startDate = moment(currentDate).startOf('month').format('YYYY-MM-DD')
      const endDate = moment(currentDate).endOf('month').format('YYYY-MM-DD')
      
      const params = new URLSearchParams({
        start_date: startDate,
        end_date: endDate,
      })
      
      if (selectedTechnician !== 'all') {
        params.append('technician_id', selectedTechnician)
      }
      
      const response = await api.get(`/jobs/calendar?${params.toString()}`)
      return response.data
    },
    staleTime: 0,
    cacheTime: 0,
    refetchOnWindowFocus: true,
    refetchInterval: false,
  })

  // ✅ Fetch technicians from an existing route
  // Fetch technicians (robust)
const { data: technicians } = useQuery({
  queryKey: ['technicians'],
  queryFn: async () => {
    try {
      const res = await api.get('/scheduling/technicians')
      return res.data?.results || res.data || []
    } catch (e: any) {
      try {
        const res = await api.get('/users/list')
        const list = res.data?.results || res.data || []
        return list.filter((u: any) => {
          const role = (u.role || u.user_role || '').toLowerCase()
          const groups = (u.groups || u.roles || []).map((g: any) =>
            (g?.name || g)?.toLowerCase()
          )
          return (
            role === 'technician' ||
            groups.includes('technician') ||
            (u.is_technician === true)
          )
        })
      } catch {
        const res = await api.get('/users/')
        const list = res.data?.results || res.data || []
        return list.filter((u: any) => {
          const role = (u.role || u.user_role || '').toLowerCase()
          const groups = (u.groups || u.roles || []).map((g: any) =>
            (g?.name || g)?.toLowerCase()
          )
          return (
            role === 'technician' ||
            groups.includes('technician') ||
            (u.is_technician === true)
          )
        })
      }
    }
  },
})


  // Calculate end time
  const calculateEndTime = (date: string, startTime: string, duration: number) => {
    let durationInMinutes = duration
    if (duration < 24 && duration % 1 !== 0) durationInMinutes = duration * 60
    const startMoment = moment(`${date} ${startTime}`, 'YYYY-MM-DD HH:mm')
    const endMoment = startMoment.clone().add(durationInMinutes, 'minutes')
    return endMoment.format('YYYY-MM-DDTHH:mm:ss')
  }

  // ✅ Create job uses existing /api/v1/jobs/ POST
  const createJobMutation = useMutation({
    mutationFn: async (jobData: any) => {
      const requiredFields = ['customer_id', 'service_type', 'scheduled_date', 'start_time']
      const missing = requiredFields.filter(f => !jobData[f])
      if (missing.length) throw new Error(`Missing required fields: ${missing.join(', ')}`)
      
      const startDateTime = `${jobData.scheduled_date}T${jobData.start_time}:00`
      const endDateTime = calculateEndTime(jobData.scheduled_date, jobData.start_time, jobData.estimated_duration || 60)

      const apiData = {
        customer_id: jobData.customer_id,
        title: `${jobData.service_type} - Service Call`,
        service_type: jobData.service_type,
        description: jobData.notes || jobData.special_instructions || `${jobData.service_type} service appointment`,
        address: {
          street: jobData.address || '',
          city: jobData.city || '',
          state: jobData.state || '',
          postal_code: jobData.zip_code || '',
        },
        time_tracking: {
          scheduled_start: startDateTime,
          scheduled_end: endDateTime,
          scheduled_duration: jobData.estimated_duration || 60,
        },
        technician_id: jobData.technician_id || null,
        priority: jobData.priority || 'medium',
        status: 'scheduled',
        special_instructions: jobData.special_instructions || '',
        equipment_needed: jobData.equipment_needed ? [jobData.equipment_needed] : [],
        quoted_price: jobData.estimated_cost || null,
        estimated_duration: jobData.estimated_duration || 60,
      }

      const response = await api.post('/jobs/', apiData)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calendar-jobs'] })
      refetch()
      setShowCreateModal(false)
      toast.success('Job created successfully!')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || error.message || 'Failed to create job')
    },
  })

  // ✅ Update job via existing PATCH /jobs/{id}
  const updateJobMutation = useMutation({
    mutationFn: async ({ jobId, updates }: { jobId: string; updates: any }) => {
      const response = await api.patch(`/jobs/${jobId}`, updates)
      return response.data
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['calendar-jobs'] })
      setShowEditModal(false)
      setEditingJob(null)
      setSelectedEvent(null)
      toast.success('Job updated successfully!')
      setTimeout(() => refetch(), 400)
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Failed to update job')
    },
  })

  // ✅ Reschedule uses existing POST /scheduling/reschedule/{job_id}
  const rescheduleMutation = useMutation({
    mutationFn: async ({ jobId, newStart, newEnd }: { jobId: string; newStart: Date; newEnd: Date }) => {
      const response = await api.post(`/scheduling/reschedule/${jobId}`, {
        new_start: newStart.toISOString(),
        new_end: newEnd.toISOString(),
        reason: 'Rescheduled via drag and drop',
      })
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calendar-jobs'] })
      toast.success('Job rescheduled successfully!')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Failed to reschedule job')
    },
  })

  // ✅ Assign technician via PATCH /jobs/{id} (no new route needed)
  const assignTechnicianMutation = useMutation({
    mutationFn: async ({ jobId, technicianId }: { jobId: string; technicianId: string }) => {
      const response = await api.patch(`/jobs/${jobId}`, { technician_id: technicianId })
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calendar-jobs'] })
      setShowTechnicianAssign(false)
      setAssigningJobId(null)
      setSelectedEvent(null)
      toast.success('Technician assigned successfully!')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Failed to assign technician')
    },
  })

  // ❗️No DELETE route exists; "Delete" will cancel the job (status=cancelled)
  const cancelJobMutation = useMutation({
    mutationFn: async (jobId: string) => {
      const response = await api.patch(`/jobs/${jobId}`, { status: 'cancelled' })
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calendar-jobs'] })
      setSelectedEvent(null)
      toast.success('Job cancelled.')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Failed to cancel job')
    },
  })

  // Convert API jobs to calendar events
  const events: CalendarEvent[] = jobs?.jobs?.map((job: any) => {
    try {
      const startStr = job.scheduled_start || job.start_time
      const endStr = job.scheduled_end || job.end_time

      const startTime = startStr ? moment(startStr).toDate() : new Date()
      const endTime = endStr
        ? moment(endStr).toDate()
        : moment(startTime).add(job.estimated_duration || job.time_tracking?.scheduled_duration || 60, 'minutes').toDate()

      return {
        id: job.id,
        title: `${job.customer?.name || 'Unknown'} - ${job.service_type || job.job_type || 'Service'}`,
        start: startTime,
        end: endTime,
        resource: {
          id: job.id,
          title: job.title,
          customer_name: job.customer?.name || 'Unknown',
          customer_phone: job.customer?.phone,
          customer_id: job.customer?.id,
          address: job.location?.street || '',
          city: job.location?.city || '',
          state: job.location?.state || '',
          zip_code: job.location?.postal_code || '',
          technician_id: job.technician?.id,
          technician_name: job.technician?.name,
          start_time: startTime,
          end_time: endTime,
          status: job.status,
          service_type: job.job_type || job.service_type || 'Service',
          notes: job.description,
          special_instructions: job.special_instructions,
          estimated_duration: job.estimated_duration || 60,
          priority: job.priority || 'medium',
          job_number: job.job_number,
          equipment_needed: job.equipment_needed,
          quoted_price: job.quoted_price
        }
      }
    } catch (e) {
      console.error('Error mapping calendar job:', e)
      return null as any
    }
  }).filter(Boolean) || []

  const eventStyleGetter = (event: CalendarEvent) => {
    const job = event.resource
    const backgroundColor = statusColors[job.status]
    const borderColor = priorityColors[job.priority]
    return {
      style: {
        backgroundColor,
        borderLeft: `4px solid ${borderColor}`,
        color: 'white',
        border: 'none',
        borderRadius: '4px',
        padding: '2px 5px',
        fontSize: '12px'
      }
    }
  }

  const handleSelectEvent = (event: CalendarEvent) => setSelectedEvent(event.resource)

  const handleEventDrop = ({ event, start, end }: any) => {
    rescheduleMutation.mutate({ jobId: event.id, newStart: start, newEnd: end })
  }

  const handleEventResize = ({ event, start, end }: any) => {
    rescheduleMutation.mutate({ jobId: event.id, newStart: start, newEnd: end })
  }

  const handleCreateJob = (jobData: any) => createJobMutation.mutate(jobData)

  const handleEditJob = (job: Job) => {
    setEditingJob(job)
    setShowEditModal(true)
  }

  const handleUpdateJob = (jobData: any) => {
    if (!selectedEvent && !editingJob) return
    const jobToUpdate = editingJob || selectedEvent

    const startDateTime = `${jobData.scheduled_date}T${jobData.start_time}:00`
    const endDateTime = calculateEndTime(jobData.scheduled_date, jobData.start_time, jobData.estimated_duration)

    const updates = {
      title: `${jobData.service_type} - Service Call`,
      service_type: jobData.service_type,
      description: jobData.notes || jobData.special_instructions || '',
      address: {
        street: jobData.address,
        city: jobData.city,
        state: jobData.state,
        postal_code: jobData.zip_code,
      },
      time_tracking: {
        scheduled_start: startDateTime,
        scheduled_end: endDateTime,
        scheduled_duration: jobData.estimated_duration,
      },
      technician_id: jobData.technician_id || null,
      priority: jobData.priority,
      special_instructions: jobData.special_instructions,
      estimated_duration: jobData.estimated_duration,
    }

    updateJobMutation.mutate({ jobId: jobToUpdate.id, updates })
  }

  const handleAssignTechnician = (jobId: string) => {
    setAssigningJobId(jobId)
    setShowTechnicianAssign(true)
  }

  const handleTechnicianAssignment = (technicianId: string) => {
    if (assigningJobId) {
      assignTechnicianMutation.mutate({ jobId: assigningJobId, technicianId })
    }
  }

  const handleCancelJob = () => {
    if (!selectedEvent) return
    if (window.confirm('Mark this job as cancelled?')) {
      cancelJobMutation.mutate(selectedEvent.id)
    }
  }

  const jobToFormData = (job: Job) => ({
    customer_id: job.customer_id || job.id,
    service_type: job.service_type,
    scheduled_date: moment(job.start_time).format('YYYY-MM-DD'),
    start_time: moment(job.start_time).format('HH:mm'),
    estimated_duration: job.estimated_duration,
    technician_id: job.technician_id || '',
    priority: job.priority,
    address: job.address,
    city: job.city,
    state: job.state,
    zip_code: job.zip_code || '',
    notes: job.notes || '',
    special_instructions: job.special_instructions || '',
  })

  const CustomToolbar = ({ label, onNavigate, onView }: any) => (
    <div className="flex justify-between items-center mb-6 p-4 bg-white rounded-lg shadow">
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-2">
          <button onClick={() => onNavigate('PREV')} className="p-2 rounded-md hover:bg-gray-100">
            <ChevronLeftIcon className="h-5 w-5" />
          </button>
          <h2 className="text-lg font-semibold text-gray-900">{label}</h2>
          <button onClick={() => onNavigate('NEXT')} className="p-2 rounded-md hover:bg-gray-100">
            <ChevronRightIcon className="h-5 w-5" />
          </button>
        </div>
        <button onClick={() => onNavigate('TODAY')} className="px-3 py-1 text-sm bg-primary-100 text-primary-700 rounded-md hover:bg-primary-200">
          Today
        </button>
      </div>

      <div className="flex items-center space-x-4">
        <select
          value={selectedTechnician}
          onChange={(e) => setSelectedTechnician(e.target.value)}
          className="text-sm border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
        >
          <option value="all">All Technicians</option>
          {technicians?.map((tech: any) => (
            <option key={tech.id || tech._id} value={tech.id || tech._id}>
              {tech.first_name && tech.last_name ? `${tech.first_name} ${tech.last_name}` : (tech.name || 'Technician')}
            </option>
          ))}
        </select>

        <div className="flex bg-gray-100 rounded-lg p-1">
          {['month', 'week', 'day'].map((view) => (
            <button
              key={view}
              onClick={() => onView(view)}
              className={`px-3 py-1 text-sm rounded-md transition-colors ${
                currentView === view ? 'bg-white text-primary-700 shadow-sm' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {view.charAt(0).toUpperCase() + view.slice(1)}
            </button>
          ))}
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="inline-flex items-center bg-black px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700"
        >
          <PlusIcon className="h-4 w-4 mr-2" />
          Schedule Job
        </button>
      </div>
    </div>
  )

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-16 bg-gray-200 rounded-lg mb-4"></div>
          <div className="h-96 bg-gray-200 rounded-lg"></div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <h3 className="text-red-800 font-medium">Error Loading Calendar</h3>
          <p className="text-red-600 text-sm mt-1">
            {(error as any).message || 'Failed to load calendar data'}
          </p>
          <button onClick={() => refetch()} className="mt-2 px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700">
            Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Job Calendar</h1>
          <p className="mt-1 text-sm text-gray-500">
            Schedule and manage field service appointments with drag-and-drop functionality
          </p>
          <p className="text-xs text-gray-400 mt-1">
            Jobs loaded: {events.length} | Last updated: {new Date().toLocaleTimeString()}
          </p>
        </div>
        <button onClick={() => refetch()} className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200">
          Refresh Calendar
        </button>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <BigCalendar
          localizer={localizer}
          events={events}
          startAccessor="start"
          endAccessor="end"
          style={{ height: 600, padding: '20px' }}
          view={currentView}
          onView={setCurrentView}
          date={currentDate}
          onNavigate={setCurrentDate}
          selectable
          resizable
          onSelectEvent={handleSelectEvent}
          onEventDrop={handleEventDrop}
          onEventResize={handleEventResize}
          eventPropGetter={eventStyleGetter}
          components={{ toolbar: CustomToolbar }}
          formats={{
            timeGutterFormat: 'h:mm A',
            eventTimeRangeFormat: ({ start, end }) =>
              `${moment(start).format('h:mm A')} - ${moment(end).format('h:mm A')}`,
          }}
          step={30}
          timeslots={1}
          min={new Date(0, 0, 0, 7, 0, 0)}
          max={new Date(0, 0, 0, 19, 0, 0)}
          scrollToTime={new Date(0, 0, 0, 8, 0, 0)}
          draggableAccessor={() => true}
        />
      </div>

      {/* Job Creation Modal */}
      {showCreateModal && (
        <Modal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} title="Schedule New Job" size="xl">
          <JobForm
            onSubmit={handleCreateJob}
            onCancel={() => setShowCreateModal(false)}
            isLoading={createJobMutation.isPending}
            mode="create"
          />
        </Modal>
      )}

      {/* Job Edit Modal */}
      {showEditModal && editingJob && (
        <Modal
          isOpen={showEditModal}
          onClose={() => { setShowEditModal(false); setEditingJob(null) }}
          title="Edit Job"
          size="xl"
        >
          <JobForm
            onSubmit={(data) => handleUpdateJob(data)}
            onCancel={() => { setShowEditModal(false); setEditingJob(null) }}
            isLoading={updateJobMutation.isPending}
            mode="edit"
            initialData={jobToFormData(editingJob)}
          />
        </Modal>
      )}

      {/* Technician Assignment Modal */}
      {showTechnicianAssign && (
        <Modal
          isOpen={showTechnicianAssign}
          onClose={() => { setShowTechnicianAssign(false); setAssigningJobId(null) }}
          title="Assign Technician"
          size="md"
        >
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Select Technician</label>
              <select
                onChange={(e) => { if (e.target.value) handleTechnicianAssignment(e.target.value) }}
                className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
                defaultValue=""
              >
                <option value="">Choose a technician...</option>
                {technicians?.map((tech: any) => (
                  <option key={tech.id || tech._id} value={tech.id || tech._id}>
                    {tech.first_name && tech.last_name ? `${tech.first_name} ${tech.last_name}` : (tech.name || 'Technician')}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="flex justify-end space-x-3 pt-4">
              <button
                onClick={() => { setShowTechnicianAssign(false); setAssigningJobId(null) }}
                className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Job Details Modal */}
      {selectedEvent && !showEditModal && !showTechnicianAssign && (
        <Modal
          isOpen={!!selectedEvent}
          onClose={() => setSelectedEvent(null)}
          title={`Job #${selectedEvent.job_number || selectedEvent.id.slice(-6)}`}
          size="lg"
        >
          <div className="space-y-6">
            <div className="flex justify-between items-center pt-6 border-t border-gray-200">
              <div className="flex space-x-3">
                <button
                  onClick={() => handleEditJob(selectedEvent)}
                  className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                >
                  <PencilIcon className="h-4 w-4 mr-2" />
                  Edit Job
                </button>
                <button
                  onClick={() => handleAssignTechnician(selectedEvent.id)}
                  className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                >
                  <UserIcon className="h-4 w-4 mr-2" />
                  Assign Technician
                </button>
                <button
                  onClick={handleCancelJob}
                  className="inline-flex items-center px-3 py-2 border border-red-300 shadow-sm text-sm leading-4 font-medium rounded-md text-red-700 bg-white hover:bg-red-50"
                >
                  <TrashIcon className="h-4 w-4 mr-2" />
                  Cancel
                </button>
              </div>
              <div className="flex space-x-3">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                      style={{ backgroundColor: statusColors[selectedEvent.status], color: 'white' }}>
                  {selectedEvent.status.replace('_', ' ')}
                </span>
                <button
                  onClick={() => setSelectedEvent(null)}
                  className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Close
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-3">Customer Information</h4>
                <div className="space-y-2">
                  <div className="flex items-center">
                    <UserIcon className="h-4 w-4 text-gray-400 mr-2" />
                    <span className="text-sm">{selectedEvent.customer_name}</span>
                  </div>
                  {selectedEvent.customer_phone && (
                    <div className="flex items-center">
                      <span className="text-sm">📞 {selectedEvent.customer_phone}</span>
                    </div>
                  )}
                  <div className="flex items-center">
                    <MapPinIcon className="h-4 w-4 text-gray-400 mr-2" />
                    <span className="text-sm">{selectedEvent.address}, {selectedEvent.city}, {selectedEvent.state}</span>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-3">Job Information</h4>
                <div className="space-y-2">
                  <div className="flex items-center">
                    <CalendarIcon className="h-4 w-4 text-gray-400 mr-2" />
                    <span className="text-sm">
                      {moment(selectedEvent.start_time).format('MMM DD, YYYY')}
                    </span>
                  </div>
                  <div className="flex items-center">
                    <ClockIcon className="h-4 w-4 text-gray-400 mr-2" />
                    <span className="text-sm">
                      {moment(selectedEvent.start_time).format('h:mm A')} - {moment(selectedEvent.end_time).format('h:mm A')}
                    </span>
                  </div>
                  <div>
                    <span className="text-sm text-gray-500">Service:</span>
                    <span className="ml-2 text-sm">{selectedEvent.service_type}</span>
                  </div>
                  <div>
                    <span className="text-sm text-gray-500">Priority:</span>
                    <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                          style={{ backgroundColor: priorityColors[selectedEvent.priority], color: 'white' }}>
                      {selectedEvent.priority}
                    </span>
                  </div>
                  {selectedEvent.technician_name && (
                    <div>
                      <span className="text-sm text-gray-500">Technician:</span>
                      <span className="ml-2 text-sm">{selectedEvent.technician_name}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {selectedEvent.notes && (
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-2">Notes</h4>
                <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-md">{selectedEvent.notes}</p>
              </div>
            )}

            {selectedEvent.special_instructions && (
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-2">Special Instructions</h4>
                <p className="text-sm text-gray-600 bg-yellow-50 p-3 rounded-md border border-yellow-200">{selectedEvent.special_instructions}</p>
              </div>
            )}
          </div>
        </Modal>
      )}
    </div>
  )
}








































