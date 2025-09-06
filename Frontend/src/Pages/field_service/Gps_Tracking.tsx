// frontend/src/pages/field-service/GPS-Tracking.tsx
import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  MapPinIcon,
  ClockIcon,
  TruckIcon,
  SignalIcon,
  ExclamationTriangleIcon,
  PlayIcon,
  PauseIcon,
  CheckCircleIcon,
  ArrowPathIcon,
  UserIcon,
  PhoneIcon,
  CalendarIcon
} from '@heroicons/react/24/outline'

import { api } from '../../services/api'

interface TechnicianLocation {
  id: string
  name: string
  phone: string
  employee_id: string
  current_location: {
    lat: number
    lng: number
    address: string
    accuracy: number
    last_updated: string
    speed: number
    heading: number
    altitude?: number
  }
  status: 'online' | 'offline' | 'idle' | 'driving' | 'on_job'
  current_job?: {
    id: string
    customer_name: string
    address: string
    scheduled_start: string
    estimated_arrival: string
    status: string
    service_type: string
    priority: 'low' | 'medium' | 'high' | 'urgent'
  }
  todays_route: Array<{
    id: string
    customer_name: string
    address: string
    lat: number
    lng: number
    scheduled_time: string
    status: 'pending' | 'en_route' | 'arrived' | 'completed'
    estimated_duration: number
    service_type: string
    distance_from_previous?: number
  }>
  performance: {
    jobs_completed: number
    miles_driven: number
    hours_worked: number
    on_time_percentage: number
    avg_speed: number
    fuel_efficiency?: number
  }
  vehicle_info?: {
    make: string
    model: string
    year: number
    license_plate: string
    fuel_level?: number
  }
  emergency_contact?: {
    name: string
    phone: string
    relationship: string
  }
}

const statusColors = {
  online: 'bg-green-100 text-green-800',
  offline: 'bg-red-100 text-red-800',
  idle: 'bg-yellow-100 text-yellow-800',
  driving: 'bg-blue-100 text-blue-800',
  on_job: 'bg-purple-100 text-purple-800'
}

const statusIcons = {
  online: SignalIcon,
  offline: ExclamationTriangleIcon,
  idle: PauseIcon,
  driving: TruckIcon,
  on_job: PlayIcon
}

const priorityColors = {
  low: 'bg-gray-100 text-gray-800',
  medium: 'bg-blue-100 text-blue-800',
  high: 'bg-orange-100 text-orange-800',
  urgent: 'bg-red-100 text-red-800'
}

export default function GPSTracking() {
  const [selectedTechnician, setSelectedTechnician] = useState<string | null>(null)
  const [mapCenter, setMapCenter] = useState({ lat: 40.7128, lng: -74.0060 }) // Default to NYC
  const [autoRefresh, setAutoRefresh] = useState(true)
  const [refreshInterval, setRefreshInterval] = useState(30) // seconds
  const [mapZoom, setMapZoom] = useState(10)
  const [showOfflineTechnicians, setShowOfflineTechnicians] = useState(false)

  const { data: technicianLocations, isLoading, refetch, dataUpdatedAt } = useQuery({
    queryKey: ['technician-locations'],
    queryFn: async () => {
      const response = await api.get('/users/locations/')
      return response.data as TechnicianLocation[]
    },
    refetchInterval: autoRefresh ? refreshInterval * 1000 : false,
    refetchIntervalInBackground: true,
  })

  // Auto-refresh countdown
  const [countdown, setCountdown] = useState(refreshInterval)

  useEffect(() => {
    if (!autoRefresh) return

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          return refreshInterval
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [autoRefresh, refreshInterval])

  // Reset countdown when data updates
  useEffect(() => {
    setCountdown(refreshInterval)
  }, [dataUpdatedAt, refreshInterval])

  const getStatusIcon = (status: string) => {
    const IconComponent = statusIcons[status as keyof typeof statusIcons] || SignalIcon
    return <IconComponent className="h-4 w-4" />
  }

  const formatLastUpdate = (timestamp: string) => {
    const now = new Date()
    const updated = new Date(timestamp)
    const diffMinutes = Math.floor((now.getTime() - updated.getTime()) / (1000 * 60))
    
    if (diffMinutes < 1) return 'Just now'
    if (diffMinutes < 60) return `${diffMinutes}m ago`
    const diffHours = Math.floor(diffMinutes / 60)
    if (diffHours < 24) return `${diffHours}h ${diffMinutes % 60}m ago`
    return `${Math.floor(diffHours / 24)}d ago`
  }

  const getLocationAccuracy = (accuracy: number) => {
    if (accuracy <= 10) return { text: 'High', color: 'text-green-600', bg: 'bg-green-100' }
    if (accuracy <= 50) return { text: 'Medium', color: 'text-yellow-600', bg: 'bg-yellow-100' }
    return { text: 'Low', color: 'text-red-600', bg: 'bg-red-100' }
  }

  const calculateETA = (scheduledTime: string, currentTime: string = new Date().toISOString()) => {
    const scheduled = new Date(scheduledTime)
    const current = new Date(currentTime)
    const diffMinutes = Math.floor((scheduled.getTime() - current.getTime()) / (1000 * 60))
    
    if (diffMinutes < 0) return { text: 'Overdue', color: 'text-red-600' }
    if (diffMinutes < 60) return { text: `${diffMinutes}m`, color: 'text-green-600' }
    const hours = Math.floor(diffMinutes / 60)
    const minutes = diffMinutes % 60
    return { text: `${hours}h ${minutes}m`, color: 'text-blue-600' }
  }

  const getOverallStats = () => {
    if (!technicianLocations) return { 
      online: 0, 
      driving: 0, 
      onJob: 0, 
      totalMiles: 0, 
      avgSpeed: 0,
      completedJobs: 0
    }
    
    const onlineTechnicians = technicianLocations.filter(tech => tech.status !== 'offline')
    
    return {
      online: onlineTechnicians.length,
      driving: technicianLocations.filter(tech => tech.status === 'driving').length,
      onJob: technicianLocations.filter(tech => tech.status === 'on_job').length,
      totalMiles: technicianLocations.reduce((sum, tech) => sum + tech.performance.miles_driven, 0),
      avgSpeed: onlineTechnicians.length > 0 
        ? onlineTechnicians.reduce((sum, tech) => sum + tech.performance.avg_speed, 0) / onlineTechnicians.length
        : 0,
      completedJobs: technicianLocations.reduce((sum, tech) => sum + tech.performance.jobs_completed, 0)
    }
  }

  const stats = getOverallStats()

  const filteredTechnicians = technicianLocations?.filter(tech => 
    showOfflineTechnicians || tech.status !== 'offline'
  ) || []

  const selectedTechnicianData = selectedTechnician 
    ? technicianLocations?.find(tech => tech.id === selectedTechnician)
    : null

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">GPS Tracking</h1>
          <p className="mt-1 text-sm text-gray-500">
            Real-time location tracking and route monitoring for field technicians
          </p>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="auto-refresh"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
            />
            <label htmlFor="auto-refresh" className="text-sm text-gray-700">
              Auto-refresh
            </label>
            {autoRefresh && (
              <span className="text-xs text-gray-500">({countdown}s)</span>
            )}
          </div>

          <select
            value={refreshInterval}
            onChange={(e) => setRefreshInterval(Number(e.target.value))}
            disabled={!autoRefresh}
            className="text-sm border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500 disabled:bg-gray-100"
          >
            <option value={10}>10s</option>
            <option value={30}>30s</option>
            <option value={60}>1m</option>
            <option value={300}>5m</option>
          </select>
          
          <button
            onClick={() => refetch()}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            <ArrowPathIcon className="h-4 w-4 mr-2" />
            Refresh Now
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <SignalIcon className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Online</dt>
                  <dd className="text-2xl font-semibold text-gray-900">{stats.online}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <TruckIcon className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Driving</dt>
                  <dd className="text-2xl font-semibold text-gray-900">{stats.driving}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <PlayIcon className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">On Job</dt>
                  <dd className="text-2xl font-semibold text-gray-900">{stats.onJob}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <MapPinIcon className="h-6 w-6 text-orange-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Miles Today</dt>
                  <dd className="text-2xl font-semibold text-gray-900">{stats.totalMiles.toFixed(1)}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <TruckIcon className="h-6 w-6 text-indigo-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Avg Speed</dt>
                  <dd className="text-2xl font-semibold text-gray-900">{stats.avgSpeed.toFixed(0)} mph</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <CheckCircleIcon className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Jobs Done</dt>
                  <dd className="text-2xl font-semibold text-gray-900">{stats.completedJobs}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Technician List */}
        <div className="lg:col-span-1">
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">Technicians</h3>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="show-offline"
                    checked={showOfflineTechnicians}
                    onChange={(e) => setShowOfflineTechnicians(e.target.checked)}
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                  />
                  <label htmlFor="show-offline" className="ml-2 text-sm text-gray-700">
                    Show offline
                  </label>
                </div>
              </div>
              
              {isLoading ? (
                <div className="animate-pulse space-y-4">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="h-20 bg-gray-200 rounded"></div>
                  ))}
                </div>
              ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {filteredTechnicians.map((technician) => {
                    const accuracy = getLocationAccuracy(technician.current_location.accuracy)
                    
                    return (
                      <div
                        key={technician.id}
                        className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                          selectedTechnician === technician.id
                            ? 'border-primary-500 bg-primary-50'
                            : 'border-gray-200 hover:bg-gray-50'
                        }`}
                        onClick={() => setSelectedTechnician(
                          selectedTechnician === technician.id ? null : technician.id
                        )}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <div className={`p-1 rounded-full ${
                              statusColors[technician.status].replace('text-', 'text-white bg-').replace('bg-', 'bg-').replace('-100', '-500')
                            }`}>
                              {getStatusIcon(technician.status)}
                            </div>
                            <div className="ml-3">
                              <p className="text-sm font-medium text-gray-900">{technician.name}</p>
                              <p className="text-xs text-gray-500">ID: {technician.employee_id}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                              statusColors[technician.status]
                            }`}>
                              {technician.status.replace('_', ' ')}
                            </span>
                            {technician.status !== 'offline' && (
                              <div className={`text-xs mt-1 px-1 py-0.5 rounded ${accuracy.bg} ${accuracy.color}`}>
                                {accuracy.text}
                              </div>
                            )}
                          </div>
                        </div>
                        
                        <div className="mt-2 text-xs text-gray-500">
                          <div className="flex items-center">
                            <MapPinIcon className="h-3 w-3 mr-1" />
                            <span className="truncate">{technician.current_location.address}</span>
                          </div>
                          <div className="flex items-center justify-between mt-1">
                            <div className="flex items-center">
                              <ClockIcon className="h-3 w-3 mr-1" />
                              <span>Updated {formatLastUpdate(technician.current_location.last_updated)}</span>
                            </div>
                            {technician.current_location.speed > 0 && (
                              <span className="text-blue-600">{technician.current_location.speed} mph</span>
                            )}
                          </div>
                        </div>

                        {technician.current_job && (
                          <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded text-xs">
                            <div className="flex items-center justify-between">
                              <div className="font-medium text-blue-900">Current Job</div>
                              <span className={`px-1 py-0.5 rounded text-xs ${
                                priorityColors[technician.current_job.priority]
                              }`}>
                                {technician.current_job.priority}
                              </span>
                            </div>
                            <div className="text-blue-700">{technician.current_job.customer_name}</div>
                            <div className="text-blue-600">
                              {technician.current_job.service_type}
                            </div>
                            <div className="flex items-center justify-between mt-1">
                              <span className="text-blue-600">
                                ETA: {calculateETA(technician.current_job.estimated_arrival).text}
                              </span>
                              <span className="text-blue-500">
                                {new Date(technician.current_job.scheduled_start).toLocaleTimeString([], { 
                                  hour: '2-digit', 
                                  minute: '2-digit' 
                                })}
                              </span>
                            </div>
                          </div>
                        )}

                        {/* Performance Summary */}
                        <div className="mt-2 grid grid-cols-3 gap-2 text-xs">
                          <div className="text-center">
                            <div className="font-medium text-gray-900">{technician.performance.jobs_completed}</div>
                            <div className="text-gray-500">Jobs</div>
                          </div>
                          <div className="text-center">
                            <div className="font-medium text-gray-900">{technician.performance.miles_driven.toFixed(1)}</div>
                            <div className="text-gray-500">Miles</div>
                          </div>
                          <div className="text-center">
                            <div className="font-medium text-gray-900">{technician.performance.on_time_percentage}%</div>
                            <div className="text-gray-500">On-time</div>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Map and Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Interactive Map Placeholder */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">Live Map</h3>
                <div className="flex items-center space-x-2">
                  <select
                    value={mapZoom}
                    onChange={(e) => setMapZoom(Number(e.target.value))}
                    className="text-sm border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                  >
                    <option value={8}>City View</option>
                    <option value={10}>Area View</option>
                    <option value={12}>Neighborhood</option>
                    <option value={15}>Street Level</option>
                  </select>
                  <button
                    onClick={() => {
                      // Center map on all technicians
                      console.log('Center map on all technicians')
                    }}
                    className="text-sm text-primary-600 hover:text-primary-800"
                  >
                    Fit All
                  </button>
                </div>
              </div>
              
              <div className="bg-gradient-to-br from-blue-50 to-indigo-100 rounded-lg h-80 flex items-center justify-center border-2 border-dashed border-gray-300">
                <div className="text-center">
                  <MapPinIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 font-medium mb-2">Interactive Map Integration</p>
                  <p className="text-sm text-gray-500 mb-4">
                    Real-time technician locations with route visualization
                  </p>
                  <div className="space-y-2 text-xs text-gray-500">
                    <p>• Google Maps / Mapbox integration</p>
                    <p>• Real-time marker updates</p>
                    <p>• Route optimization display</p>
                    <p>• Geofencing alerts</p>
                    <p>• Traffic condition overlay</p>
                  </div>
                </div>
              </div>

              {/* Map Legend */}
              <div className="mt-4 flex flex-wrap gap-4 text-xs">
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                  <span>Online</span>
                </div>
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-blue-500 rounded-full mr-2"></div>
                  <span>Driving</span>
                </div>
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-purple-500 rounded-full mr-2"></div>
                  <span>On Job</span>
                </div>
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-yellow-500 rounded-full mr-2"></div>
                  <span>Idle</span>
                </div>
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-red-500 rounded-full mr-2"></div>
                  <span>Offline</span>
                </div>
              </div>
            </div>
          </div>

          {/* Selected Technician Details */}
          {selectedTechnicianData && (
            <div className="bg-white shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-medium text-gray-900">
                    {selectedTechnicianData.name} - Details
                  </h3>
                  <div className="flex items-center space-x-2">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      statusColors[selectedTechnicianData.status]
                    }`}>
                      {selectedTechnicianData.status.replace('_', ' ')}
                    </span>
                    {selectedTechnicianData.vehicle_info && (
                      <span className="text-xs text-gray-500">
                        {selectedTechnicianData.vehicle_info.make} {selectedTechnicianData.vehicle_info.model}
                      </span>
                    )}
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="text-sm font-medium text-gray-900 mb-3">Current Location</h4>
                    <div className="space-y-2 text-sm">
                      <div>
                        <span className="text-gray-500">Address:</span>
                        <span className="ml-2">{selectedTechnicianData.current_location.address}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Coordinates:</span>
                        <span className="ml-2 font-mono text-xs">
                          {selectedTechnicianData.current_location.lat.toFixed(6)}, {selectedTechnicianData.current_location.lng.toFixed(6)}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-500">Accuracy:</span>
                        <span className={`ml-2 ${getLocationAccuracy(selectedTechnicianData.current_location.accuracy).color}`}>
                          {getLocationAccuracy(selectedTechnicianData.current_location.accuracy).text} (±{selectedTechnicianData.current_location.accuracy}m)
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-500">Speed:</span>
                        <span className="ml-2">{selectedTechnicianData.current_location.speed} mph</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Heading:</span>
                        <span className="ml-2">{selectedTechnicianData.current_location.heading}°</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Last Updated:</span>
                        <span className="ml-2">{formatLastUpdate(selectedTechnicianData.current_location.last_updated)}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="text-sm font-medium text-gray-900 mb-3">Today's Performance</h4>
                    <div className="space-y-2 text-sm">
                      <div>
                        <span className="text-gray-500">Jobs Completed:</span>
                        <span className="ml-2">{selectedTechnicianData.performance.jobs_completed}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Miles Driven:</span>
                        <span className="ml-2">{selectedTechnicianData.performance.miles_driven.toFixed(1)} mi</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Hours Worked:</span>
                        <span className="ml-2">{selectedTechnicianData.performance.hours_worked.toFixed(1)} hrs</span>
                      </div>
                      <div>
                        <span className="text-gray-500">On-Time Rate:</span>
                        <span className="ml-2">{selectedTechnicianData.performance.on_time_percentage}%</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Average Speed:</span>
                        <span className="ml-2">{selectedTechnicianData.performance.avg_speed.toFixed(1)} mph</span>
                      </div>
                      {selectedTechnicianData.performance.fuel_efficiency && (
                        <div>
                          <span className="text-gray-500">Fuel Efficiency:</span>
                          <span className="ml-2">{selectedTechnicianData.performance.fuel_efficiency.toFixed(1)} mpg</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Contact Information */}
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <h4 className="text-sm font-medium text-gray-900 mb-3">Contact Information</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center text-sm">
                      <PhoneIcon className="h-4 w-4 text-gray-400 mr-2" />
                      <a href={`tel:${selectedTechnicianData.phone}`} className="text-primary-600 hover:text-primary-800">
                        {selectedTechnicianData.phone}
                      </a>
                    </div>
                    {selectedTechnicianData.emergency_contact && (
                      <div className="text-sm">
                        <span className="text-gray-500">Emergency Contact:</span>
                        <div className="ml-2">
                          <div>{selectedTechnicianData.emergency_contact.name} ({selectedTechnicianData.emergency_contact.relationship})</div>
                          <a href={`tel:${selectedTechnicianData.emergency_contact.phone}`} className="text-primary-600 hover:text-primary-800">
                            {selectedTechnicianData.emergency_contact.phone}
                          </a>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Vehicle Information */}
                {selectedTechnicianData.vehicle_info && (
                  <div className="mt-6 pt-6 border-t border-gray-200">
                    <h4 className="text-sm font-medium text-gray-900 mb-3">Vehicle Information</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="text-gray-500">Vehicle:</span>
                        <div className="font-medium">
                          {selectedTechnicianData.vehicle_info.year} {selectedTechnicianData.vehicle_info.make} {selectedTechnicianData.vehicle_info.model}
                        </div>
                      </div>
                      <div>
                        <span className="text-gray-500">License Plate:</span>
                        <div className="font-medium">{selectedTechnicianData.vehicle_info.license_plate}</div>
                      </div>
                      {selectedTechnicianData.vehicle_info.fuel_level && (
                        <div>
                          <span className="text-gray-500">Fuel Level:</span>
                          <div className="flex items-center">
                            <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                              <div
                                className={`h-2 rounded-full ${
                                  selectedTechnicianData.vehicle_info.fuel_level > 25 ? 'bg-green-500' :
                                  selectedTechnicianData.vehicle_info.fuel_level > 10 ? 'bg-yellow-500' : 'bg-red-500'
                                }`}
                                style={{ width: `${selectedTechnicianData.vehicle_info.fuel_level}%` }}
                              ></div>
                            </div>
                            <span className="text-sm">{selectedTechnicianData.vehicle_info.fuel_level}%</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Today's Route */}
                {selectedTechnicianData.todays_route.length > 0 && (
                  <div className="mt-6 pt-6 border-t border-gray-200">
                    <h4 className="text-sm font-medium text-gray-900 mb-3">Today's Route</h4>
                    <div className="space-y-3 max-h-64 overflow-y-auto">
                      {selectedTechnicianData.todays_route.map((stop, index) => {
                        const eta = calculateETA(stop.scheduled_time)
                        
                        return (
                          <div key={stop.id} className="flex items-start p-3 bg-gray-50 rounded-lg">
                            <div className="flex-shrink-0 mr-3">
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                                stop.status === 'completed' 
                                  ? 'bg-green-500 text-white'
                                  : stop.status === 'arrived'
                                  ? 'bg-blue-500 text-white'
                                  : stop.status === 'en_route'
                                  ? 'bg-yellow-500 text-white'
                                  : 'bg-gray-300 text-gray-700'
                              }`}>
                                {stop.status === 'completed' ? '✓' : index + 1}
                              </div>
                            </div>
                            
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between">
                                <div>
                                  <p className="text-sm font-medium text-gray-900">{stop.customer_name}</p>
                                  <p className="text-sm text-gray-500">{stop.address}</p>
                                  <p className="text-xs text-gray-400">{stop.service_type}</p>
                                </div>
                                <div className="text-right text-xs">
                                  <div className="font-medium">
                                    {new Date(stop.scheduled_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                  </div>
                                  <div className="text-gray-500">
                                    {stop.estimated_duration} min
                                  </div>
                                  {stop.distance_from_previous && (
                                    <div className="text-gray-400">
                                      {stop.distance_from_previous.toFixed(1)} mi
                                    </div>
                                  )}
                                </div>
                              </div>
                              
                              <div className="mt-2 flex items-center justify-between">
                                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                                  stop.status === 'completed' 
                                    ? 'bg-green-100 text-green-800'
                                    : stop.status === 'arrived'
                                    ? 'bg-blue-100 text-blue-800'
                                    : stop.status === 'en_route'
                                    ? 'bg-yellow-100 text-yellow-800'
                                    : 'bg-gray-100 text-gray-800'
                                }`}>
                                  {stop.status.replace('_', ' ')}
                                </span>
                                
                                {stop.status === 'pending' && (
                                  <span className={`text-xs font-medium ${eta.color}`}>
                                    ETA: {eta.text}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>

                    {/* Route Summary */}
                    <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
                      <div className="grid grid-cols-3 gap-4 text-center text-sm">
                        <div>
                          <div className="font-medium text-blue-900">
                            {selectedTechnicianData.todays_route.filter(stop => stop.status === 'completed').length}
                          </div>
                          <div className="text-blue-700">Completed</div>
                        </div>
                        <div>
                          <div className="font-medium text-blue-900">
                            {selectedTechnicianData.todays_route.filter(stop => stop.status === 'pending').length}
                          </div>
                          <div className="text-blue-700">Remaining</div>
                        </div>
                        <div>
                          <div className="font-medium text-blue-900">
                            {selectedTechnicianData.todays_route.reduce((sum, stop) => sum + (stop.distance_from_previous || 0), 0).toFixed(1)} mi
                          </div>
                          <div className="text-blue-700">Total Distance</div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Alerts and Notifications */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Real-time Alerts</h3>
              
              <div className="space-y-3">
                {/* Speed Alerts */}
                {technicianLocations?.filter(tech => tech.current_location.speed > 75).map(tech => (
                  <div key={`speed-${tech.id}`} className="flex items-center p-3 bg-red-50 border border-red-200 rounded-md">
                    <ExclamationTriangleIcon className="h-5 w-5 text-red-600 mr-3" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-red-800">Speed Alert</p>
                      <p className="text-sm text-red-700">
                        {tech.name} is driving at {tech.current_location.speed} mph
                      </p>
                    </div>
                    <div className="text-xs text-red-600">
                      {formatLastUpdate(tech.current_location.last_updated)}
                    </div>
                  </div>
                ))}

                {/* Low Accuracy Alerts */}
                {technicianLocations?.filter(tech => tech.current_location.accuracy > 100 && tech.status !== 'offline').map(tech => (
                  <div key={`accuracy-${tech.id}`} className="flex items-center p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                    <SignalIcon className="h-5 w-5 text-yellow-600 mr-3" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-yellow-800">Poor GPS Signal</p>
                      <p className="text-sm text-yellow-700">
                        {tech.name} has low GPS accuracy (±{tech.current_location.accuracy}m)
                      </p>
                    </div>
                  </div>
                ))}

                {/* Overdue Jobs */}
                {technicianLocations?.filter(tech => 
                  tech.current_job && new Date(tech.current_job.estimated_arrival) < new Date()
                ).map(tech => (
                  <div key={`overdue-${tech.id}`} className="flex items-center p-3 bg-orange-50 border border-orange-200 rounded-md">
                    <ClockIcon className="h-5 w-5 text-orange-600 mr-3" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-orange-800">Job Overdue</p>
                      <p className="text-sm text-orange-700">
                        {tech.name} is late for {tech.current_job?.customer_name}
                      </p>
                    </div>
                  </div>
                ))}

                {/* No Alerts */}
                {(!technicianLocations?.some(tech => 
                  tech.current_location.speed > 75 || 
                  (tech.current_location.accuracy > 100 && tech.status !== 'offline') ||
                  (tech.current_job && new Date(tech.current_job.estimated_arrival) < new Date())
                )) && (
                  <div className="text-center py-8">
                    <CheckCircleIcon className="h-12 w-12 text-green-500 mx-auto mb-2" />
                    <p className="text-sm text-gray-500">No active alerts</p>
                    <p className="text-xs text-gray-400">All technicians are operating normally</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Emergency Actions */}
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <ExclamationTriangleIcon className="h-5 w-5 text-red-600 mr-2" />
            <div>
              <h4 className="text-sm font-medium text-red-800">Emergency Actions</h4>
              <p className="text-sm text-red-700">Use these features only in emergency situations</p>
            </div>
          </div>
          <div className="flex space-x-2">
            <button className="px-3 py-1 bg-red-600 text-white text-sm rounded-md hover:bg-red-700">
              Panic Alert All
            </button>
            <button className="px-3 py-1 bg-red-600 text-white text-sm rounded-md hover:bg-red-700">
              Emergency Broadcast
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}