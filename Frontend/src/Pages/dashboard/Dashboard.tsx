// frontend/src/pages/dashboard/Dashboard.tsx - CLEAN REAL DATA VERSION
import { useQuery } from '@tanstack/react-query'
import { api } from '../../services/api'
import { 
  CurrencyDollarIcon, 
  UsersIcon, 
  ClipboardDocumentListIcon,
  PhoneIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  CalendarDaysIcon,
  DocumentTextIcon,
  UserGroupIcon,
  ChartBarIcon,
  BanknotesIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts'

interface DashboardStats {
  monthly_revenue: number
  revenue_change: number
  active_leads: number
  leads_change: number
  total_customers: number
  customers_change: number
  weekly_jobs: number
  jobs_change: number
  revenue_data: Array<{
    month: string
    revenue: number
  }>
}

interface RecentActivity {
  id: string
  description: string
  time: string
  type: string
}

interface QuickStats {
  today_jobs: number
  pending_invoices: number
  overdue_invoices: number
  technicians_on_duty: number
}

// StatsCard component
const StatsCard = ({ 
  title, 
  value, 
  change, 
  icon: Icon, 
  color,
  isLoading = false 
}: {
  title: string
  value: string | number
  change: number
  icon: React.ComponentType<{ className?: string }>
  color: string
  isLoading?: boolean
}) => {
  const isPositive = change >= 0
  
  const colorClasses = {
    green: 'text-green-600 bg-green-50 border-green-200',
    blue: 'text-blue-600 bg-blue-50 border-blue-200', 
    purple: 'text-purple-600 bg-purple-50 border-purple-200',
    orange: 'text-orange-600 bg-orange-50 border-orange-200'
  }
  
  if (isLoading) {
    return (
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm animate-pulse">
        <div className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="h-12 w-12 bg-gray-200 rounded-lg"></div>
              <div>
                <div className="h-4 bg-gray-200 rounded w-24 mb-2"></div>
                <div className="h-6 bg-gray-200 rounded w-16"></div>
              </div>
            </div>
            <div className="h-6 bg-gray-200 rounded w-12"></div>
          </div>
        </div>
      </div>
    )
  }
  
  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-all duration-200">
      <div className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className={`p-3 rounded-lg border ${colorClasses[color as keyof typeof colorClasses] || 'text-gray-600 bg-gray-50 border-gray-200'}`}>
              <Icon className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
              <p className="text-2xl font-bold text-gray-900">{value}</p>
            </div>
          </div>
          <div className={`flex items-center space-x-1 px-3 py-1 rounded-full text-sm font-medium ${
            isPositive 
              ? 'text-green-700 bg-green-100' 
              : 'text-red-700 bg-red-100'
          }`}>
            {isPositive ? (
              <ArrowTrendingUpIcon className="h-4 w-4" />
            ) : (
              <ArrowTrendingDownIcon className="h-4 w-4" />
            )}
            <span>{Math.abs(change).toFixed(1)}%</span>
          </div>
        </div>
      </div>
    </div>
  )
}

// Revenue Chart component
const RevenueChart = ({ 
  data, 
  isLoading = false 
}: { 
  data: Array<{ month: string; revenue: number }>
  isLoading?: boolean
}) => {
  if (isLoading) {
    return (
      <div className="h-80 animate-pulse bg-gray-100 rounded-lg flex items-center justify-center">
        <div className="text-gray-400">Loading chart data...</div>
      </div>
    )
  }

  if (!data || data.length === 0) {
    return (
      <div className="h-80 flex items-center justify-center text-gray-500">
        <div className="text-center">
          <ChartBarIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Revenue Data</h3>
          <p className="text-sm text-gray-500">Revenue data will appear here once you have invoices</p>
        </div>
      </div>
    )
  }

  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-medium text-gray-900">{`${label}`}</p>
          <p className="text-blue-600">
            Revenue: <span className="font-medium">${payload[0].value.toLocaleString()}</span>
          </p>
        </div>
      )
    }
    return null
  }

  return (
    <div className="h-80">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3}/>
              <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
          <XAxis 
            dataKey="month" 
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 12, fill: '#6B7280' }}
          />
          <YAxis 
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 12, fill: '#6B7280' }}
            tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
          />
          <Tooltip content={<CustomTooltip />} />
          <Area 
            type="monotone" 
            dataKey="revenue" 
            stroke="#3B82F6" 
            strokeWidth={3}
            fillOpacity={1} 
            fill="url(#colorRevenue)" 
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}

// Quick Stats component
const QuickStatsGrid = ({ 
  stats, 
  isLoading = false 
}: { 
  stats: QuickStats
  isLoading?: boolean
}) => {
  const quickStatsItems = [
    {
      title: "Today's Jobs",
      value: stats.today_jobs || 0,
      icon: CalendarDaysIcon,
      color: 'bg-blue-50 text-blue-600 border-blue-200'
    },
    {
      title: "Pending Invoices", 
      value: stats.pending_invoices || 0,
      icon: DocumentTextIcon,
      color: 'bg-orange-50 text-orange-600 border-orange-200'
    },
    {
      title: "Overdue Invoices",
      value: stats.overdue_invoices || 0,
      icon: ExclamationTriangleIcon,
      color: (stats.overdue_invoices || 0) > 0 ? 'bg-red-50 text-red-600 border-red-200' : 'bg-green-50 text-green-600 border-green-200'
    },
    {
      title: "Active Technicians",
      value: stats.technicians_on_duty || 0,
      icon: UserGroupIcon,
      color: 'bg-purple-50 text-purple-600 border-purple-200'
    }
  ]

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-white border border-gray-200 rounded-xl p-6 animate-pulse">
            <div className="flex items-center space-x-3">
              <div className="h-10 w-10 bg-gray-200 rounded-lg"></div>
              <div>
                <div className="h-4 bg-gray-200 rounded w-20 mb-2"></div>
                <div className="h-6 bg-gray-200 rounded w-8"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      {quickStatsItems.map((item, index) => (
        <div key={index} className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center space-x-3">
            <div className={`p-2.5 rounded-lg border ${item.color}`}>
              <item.icon className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">{item.title}</p>
              <p className="text-xl font-bold text-gray-900">{item.value}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

// Activity type icons and colors
const getActivityConfig = (type: string) => {
  const configs = {
    job_completed: { icon: CheckCircleIcon, color: 'bg-green-100 text-green-600' },
    job_scheduled: { icon: CalendarDaysIcon, color: 'bg-blue-100 text-blue-600' },
    job_started: { icon: ClipboardDocumentListIcon, color: 'bg-orange-100 text-orange-600' },
    job_created: { icon: ClipboardDocumentListIcon, color: 'bg-gray-100 text-gray-600' },
    lead: { icon: PhoneIcon, color: 'bg-purple-100 text-purple-600' },
    payment: { icon: BanknotesIcon, color: 'bg-green-100 text-green-600' },
    estimate_accepted: { icon: CheckCircleIcon, color: 'bg-blue-100 text-blue-600' },
    estimate_sent: { icon: DocumentTextIcon, color: 'bg-orange-100 text-orange-600' },
    estimate_created: { icon: DocumentTextIcon, color: 'bg-gray-100 text-gray-600' }
  }
  
  return configs[type as keyof typeof configs] || configs.job_created
}

export default function Dashboard() {
  const { data: stats, isLoading: statsLoading, error: statsError } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      const response = await api.get('/dashboard/stats')
      return response.data as DashboardStats
    },
    retry: 2,
    retryDelay: 1000
  })

  const { data: recentActivity, isLoading: activityLoading, error: activityError } = useQuery({
    queryKey: ['recent-activity'],
    queryFn: async () => {
      const response = await api.get('/dashboard/recent-activity')
      return response.data as RecentActivity[]
    },
    retry: 2,
    retryDelay: 1000
  })

  const { data: quickStats, isLoading: quickStatsLoading, error: quickStatsError } = useQuery({
    queryKey: ['quick-stats'],
    queryFn: async () => {
      const response = await api.get('/dashboard/quick-stats')
      return response.data as QuickStats
    },
    retry: 2,
    retryDelay: 1000
  })

  // Show loading state
  if (statsLoading && activityLoading && quickStatsLoading) {
    return (
      <div className="min-h-screen bg-gray-50 pb-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="space-y-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
              <p className="mt-2 text-sm text-gray-600">Unable to load dashboard data</p>
            </div>
            <div className="bg-red-50 border border-red-200 rounded-xl p-6">
              <div className="flex items-center">
                <ExclamationTriangleIcon className="h-5 w-5 text-red-600 mr-3" />
                <div className="text-sm">
                  <span className="font-semibold text-red-800">Connection Error</span>
                  <span className="text-red-700 ml-2">
                    Unable to connect to backend. Please check your server connection.
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-32">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
              <p className="mt-2 text-sm text-gray-600">
                Overview of your business performance and key metrics
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500">Last updated</p>
              <p className="text-sm font-medium text-gray-900">
                {new Date().toLocaleString()}
              </p>
            </div>
          </div>

          {/* Quick Stats Grid */}
          <QuickStatsGrid stats={quickStats || { today_jobs: 0, pending_invoices: 0, overdue_invoices: 0, technicians_on_duty: 0 }} isLoading={quickStatsLoading} />

          {/* Main Stats Grid */}
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <StatsCard
              title="Monthly Revenue"
              value={`${(stats?.monthly_revenue || 0).toLocaleString()}`}
              change={stats?.revenue_change || 0}
              icon={CurrencyDollarIcon}
              color="green"
              isLoading={statsLoading}
            />
            <StatsCard
              title="Active Leads"
              value={stats?.active_leads || 0}
              change={stats?.leads_change || 0}
              icon={PhoneIcon}
              color="blue"
              isLoading={statsLoading}
            />
            <StatsCard
              title="Total Customers"
              value={stats?.total_customers || 0}
              change={stats?.customers_change || 0}
              icon={UsersIcon}
              color="purple"
              isLoading={statsLoading}
            />
            <StatsCard
              title="Weekly Jobs"
              value={stats?.weekly_jobs || 0}
              change={stats?.jobs_change || 0}
              icon={ClipboardDocumentListIcon}
              color="orange"
              isLoading={statsLoading}
            />
          </div>

          {/* Charts and Recent Activity */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Revenue Chart */}
            <div className="lg:col-span-2 bg-white border border-gray-200 rounded-xl shadow-sm">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900">Revenue Trend</h3>
                  <div className="flex items-center space-x-2 text-sm text-gray-500">
                    <div className="w-3 h-3 bg-blue-500 rounded"></div>
                    <span>Monthly Revenue</span>
                  </div>
                </div>
              </div>
              <div className="p-6">
                <RevenueChart data={stats?.revenue_data || []} isLoading={statsLoading} />
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-white border border-gray-200 rounded-xl shadow-sm">
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">Recent Activity</h3>
              </div>
              <div className="p-6">
                {activityLoading ? (
                  <div className="space-y-4">
                    {[...Array(5)].map((_, i) => (
                      <div key={i} className="animate-pulse flex items-start space-x-3">
                        <div className="h-8 w-8 bg-gray-200 rounded-lg"></div>
                        <div className="flex-1">
                          <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                          <div className="h-3 bg-gray-200 rounded w-1/4"></div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-4 max-h-96 overflow-y-auto">
                    {recentActivity && recentActivity.length > 0 ? (
                      recentActivity.map((activity: RecentActivity, index: number) => {
                        const config = getActivityConfig(activity.type)
                        return (
                          <div key={activity.id || index} className="flex items-start space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                            <div className={`p-2 rounded-lg ${config.color}`}>
                              <config.icon className="h-4 w-4" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-medium text-gray-900 leading-5">
                                {activity.description}
                              </p>
                              <p className="text-xs text-gray-500 mt-1">{activity.time}</p>
                            </div>
                          </div>
                        )
                      })
                    ) : (
                      <div className="text-center py-12 text-gray-500">
                        <ClipboardDocumentListIcon className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                        <h4 className="text-sm font-medium text-gray-900 mb-2">No Recent Activity</h4>
                        <p className="text-xs text-gray-500">Activity will appear here as you use the system</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
          