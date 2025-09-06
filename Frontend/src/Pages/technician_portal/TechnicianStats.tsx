// src/pages/technician_portal/TechnicianStats.tsx - COMPLETE FIXED VERSION
import React, { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  ChartBarIcon,
  CheckCircleIcon,
  ClockIcon,
  CurrencyDollarIcon,
  CalendarIcon,
  TruckIcon,
  ExclamationTriangleIcon,
  ArrowTrendingUpIcon,
  DocumentChartBarIcon
} from '@heroicons/react/24/outline'
import { api } from '../../services/api'

// Simple Chart component (placeholder - would use a real chart library in production)
const SimpleBarChart = ({ data, labels, height = 200, color = 'blue' }) => {
  if (!data || !labels || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-gray-500">
        No data available
      </div>
    )
  }

  const maxValue = Math.max(...data, 1) // Prevent division by zero
  
  return (
    <div className="relative" style={{ height: `${height}px` }}>
      <div className="flex items-end justify-between h-full">
        {data.map((value, index) => (
          <div key={index} className="flex flex-col items-center flex-1">
            <div 
              className={`w-full mx-1 bg-${color}-500`} 
              style={{ height: `${(value / maxValue) * (height - 30)}px` }}
            ></div>
            <div className="text-xs text-gray-600 mt-1">{labels[index]}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function TechnicianStats() {
  const [period, setPeriod] = useState('week')

  // Fetch technician stats
  const { data: statsData, isLoading, error, refetch } = useQuery({
    queryKey: ['technician-stats', period],
    queryFn: async () => {
      const response = await api.get(`/technician-portal/stats?period=${period}`)
      return response.data
    },
    retry: 1,
    refetchOnWindowFocus: false
  })

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading statistics...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <ExclamationTriangleIcon className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <p className="text-red-600 mb-4">Failed to load statistics</p>
          <p className="text-sm text-gray-500 mb-4">
            Error: {error?.response?.data?.detail || error?.message || 'Unknown error'}
          </p>
          <div className="space-x-2">
            <button 
              onClick={() => refetch()} 
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Retry
            </button>
            <button 
              onClick={() => window.location.reload()} 
              className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600"
            >
              Reload Page
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Safe data extraction with fallbacks
  const stats = statsData?.stats || {
    period: { type: 'week', days: 7, start_date: '', end_date: '' },
    jobs: { 
      total: 0, 
      completed: 0, 
      in_progress: 0, 
      cancelled: 0, 
      completion_rate: 0 
    },
    performance: { 
      avg_job_duration_hours: 0, 
      total_hours_worked: 0, 
      jobs_per_day: 0 
    }
  }

  const jobStats = stats.jobs || {}
  const performanceStats = stats.performance || {}
  const periodStats = stats.period || {}

  // Safe access to all properties with fallbacks
  const completedJobs = jobStats.completed || 0
  const totalJobs = jobStats.total || 0
  const inProgressJobs = jobStats.in_progress || 0
  const cancelledJobs = jobStats.cancelled || 0
  const completionRate = jobStats.completion_rate || 0

  const avgDuration = performanceStats.avg_job_duration_hours || 0
  const totalHours = performanceStats.total_hours_worked || 0
  const jobsPerDay = performanceStats.jobs_per_day || 0

  const periodType = periodStats.type || period
  const periodDays = periodStats.days || 7
  const startDate = periodStats.start_date || ''
  const endDate = periodStats.end_date || ''

  // Format dates for display
  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A'
    try {
      return new Date(dateStr).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      })
    } catch {
      return 'Invalid Date'
    }
  }

  // Chart data
  const jobStatusData = [completedJobs, inProgressJobs, cancelledJobs]
  const jobStatusLabels = ['Completed', 'In Progress', 'Cancelled']

  const performanceData = [avgDuration, totalHours, jobsPerDay]
  const performanceLabels = ['Avg Hours', 'Total Hours', 'Jobs/Day']

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Performance Statistics</h1>
              <p className="mt-1 text-sm text-gray-500">
                Your performance metrics for the selected period
              </p>
            </div>
            
            {/* Period Selector */}
            <div className="flex items-center space-x-2">
              <label className="text-sm font-medium text-gray-700">Period:</label>
              <select
                value={period}
                onChange={(e) => setPeriod(e.target.value)}
                className="border border-gray-300 rounded-md px-3 py-1 text-sm focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="week">This Week</option>
                <option value="month">This Month</option>
                <option value="year">This Year</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Period Information */}
        <div className="bg-white p-6 rounded-lg shadow mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-medium text-gray-900">
                {periodType.charAt(0).toUpperCase() + periodType.slice(1)} Overview
              </h3>
              <p className="text-sm text-gray-600">
                {formatDate(startDate)} to {formatDate(endDate)} ({periodDays} days)
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500">Last updated</p>
              <p className="text-sm font-medium text-gray-900">
                {new Date().toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        {/* Key Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          {/* Total Jobs */}
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <ChartBarIcon className="h-8 w-8 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Jobs</p>
                <p className="text-2xl font-bold text-gray-900">{totalJobs}</p>
                <p className="text-xs text-gray-400">in {periodDays} days</p>
              </div>
            </div>
          </div>

          {/* Completed */}
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <CheckCircleIcon className="h-8 w-8 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Completed</p>
                <p className="text-2xl font-bold text-gray-900">{completedJobs}</p>
                <p className="text-xs text-green-600">{completionRate}% completion rate</p>
              </div>
            </div>
          </div>

          {/* In Progress */}
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <ClockIcon className="h-8 w-8 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">In Progress</p>
                <p className="text-2xl font-bold text-gray-900">{inProgressJobs}</p>
                <p className="text-xs text-yellow-600">currently active</p>
              </div>
            </div>
          </div>

          {/* Cancelled */}
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <ArrowTrendingUpIcon className="h-8 w-8 text-red-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Cancelled</p>
                <p className="text-2xl font-bold text-gray-900">{cancelledJobs}</p>
                <p className="text-xs text-red-600">
                  {totalJobs > 0 ? ((cancelledJobs / totalJobs) * 100).toFixed(1) : 0}% cancelled
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Performance Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center mb-2">
              <ClockIcon className="h-5 w-5 text-blue-600 mr-2" />
              <h3 className="text-lg font-medium text-gray-900">Average Job Duration</h3>
            </div>
            <p className="text-3xl font-bold text-blue-600">{avgDuration.toFixed(1)}h</p>
            <p className="text-sm text-gray-500">per completed job</p>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center mb-2">
              <DocumentChartBarIcon className="h-5 w-5 text-green-600 mr-2" />
              <h3 className="text-lg font-medium text-gray-900">Total Hours Worked</h3>
            </div>
            <p className="text-3xl font-bold text-green-600">{totalHours.toFixed(1)}h</p>
            <p className="text-sm text-gray-500">in {periodDays} days</p>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center mb-2">
              <TruckIcon className="h-5 w-5 text-purple-600 mr-2" />
              <h3 className="text-lg font-medium text-gray-900">Jobs Per Day</h3>
            </div>
            <p className="text-3xl font-bold text-purple-600">{jobsPerDay.toFixed(1)}</p>
            <p className="text-sm text-gray-500">average daily jobs</p>
          </div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Job Status Chart */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Job Status Breakdown</h3>
            <SimpleBarChart 
              data={jobStatusData} 
              labels={jobStatusLabels} 
              height={200} 
              color="blue" 
            />
          </div>

          {/* Performance Chart */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Performance Metrics</h3>
            <SimpleBarChart 
              data={performanceData} 
              labels={performanceLabels} 
              height={200} 
              color="green" 
            />
          </div>
        </div>

        {/* Detailed Breakdown */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Detailed Breakdown</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Job Statistics */}
            <div>
              <h4 className="text-md font-medium text-gray-800 mb-3">Job Statistics</h4>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Total Jobs Assigned</span>
                  <span className="text-sm font-medium text-gray-900">{totalJobs}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Successfully Completed</span>
                  <span className="text-sm font-medium text-green-600">{completedJobs}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Currently In Progress</span>
                  <span className="text-sm font-medium text-yellow-600">{inProgressJobs}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Cancelled Jobs</span>
                  <span className="text-sm font-medium text-red-600">{cancelledJobs}</span>
                </div>
                <hr className="my-2" />
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-700">Completion Rate</span>
                  <span className="text-sm font-bold text-gray-900">{completionRate}%</span>
                </div>
              </div>
            </div>

            {/* Time & Efficiency */}
            <div>
              <h4 className="text-md font-medium text-gray-800 mb-3">Time & Efficiency</h4>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Average Job Duration</span>
                  <span className="text-sm font-medium text-gray-900">{avgDuration.toFixed(2)} hours</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Total Hours Worked</span>
                  <span className="text-sm font-medium text-gray-900">{totalHours.toFixed(2)} hours</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Jobs Per Day</span>
                  <span className="text-sm font-medium text-gray-900">{jobsPerDay.toFixed(2)} jobs</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Hours Per Day</span>
                  <span className="text-sm font-medium text-gray-900">
                    {periodDays > 0 ? (totalHours / periodDays).toFixed(2) : '0.00'} hours
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Debug Information (only in development) */}
        {process.env.NODE_ENV === 'development' && (
          <div className="bg-gray-100 p-4 rounded-lg mt-6">
            <details>
              <summary className="cursor-pointer text-sm font-medium text-gray-600">
                Debug Information (Development Only)
              </summary>
              <pre className="mt-2 text-xs text-gray-500 overflow-auto">
                {JSON.stringify({ statsData, period }, null, 2)}
              </pre>
            </details>
          </div>
        )}
      </div>
    </div>
  )
}