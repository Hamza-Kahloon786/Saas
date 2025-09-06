// frontend/src/pages/dashboard/Dashboard.tsx
import { useQuery } from '@tanstack/react-query'
import { api } from '../../services/api'
import { 
  CurrencyDollarIcon, 
  UsersIcon, 
  ClipboardDocumentListIcon,
  PhoneIcon,
  ExclamationTriangleIcon,
  WifiIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon
} from '@heroicons/react/24/outline'

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
    target?: number
  }>
}

interface RecentActivity {
  id: string
  description: string
  time: string
  type?: string
}

// Mock data as fallback
const FALLBACK_STATS: DashboardStats = {
  monthly_revenue: 47500,
  revenue_change: 12.5,
  active_leads: 23,
  leads_change: 8.2,
  total_customers: 340,
  customers_change: 5.1,
  weekly_jobs: 12,
  jobs_change: -2.3,
  revenue_data: [
    { month: 'Jan', revenue: 35000, target: 45000 },
    { month: 'Feb', revenue: 42000, target: 45000 },
    { month: 'Mar', revenue: 38000, target: 45000 },
    { month: 'Apr', revenue: 47500, target: 45000 },
  ]
}

const FALLBACK_ACTIVITY: RecentActivity[] = [
  {
    id: '1',
    description: 'New lead from website contact form',
    time: '2 minutes ago',
    type: 'lead'
  },
  {
    id: '2',
    description: 'Job completed for John Smith - AC Repair',
    time: '15 minutes ago',
    type: 'job'
  },
  {
    id: '3',
    description: 'Payment received for Invoice #1234',
    time: '1 hour ago',
    type: 'payment'
  },
  {
    id: '4',
    description: 'New appointment scheduled for tomorrow',
    time: '2 hours ago',
    type: 'appointment'
  }
]

// Simple StatsCard component
const StatsCard = ({ title, value, change, icon: Icon, color }: {
  title: string
  value: string | number
  change: number
  icon: React.ComponentType<{ className?: string }>
  color: string
}) => {
  const isPositive = change >= 0
  
  const colorClasses = {
    green: 'text-green-600',
    blue: 'text-blue-600', 
    purple: 'text-purple-600',
    orange: 'text-orange-600'
  }
  
  return (
    <div className="bg-white overflow-hidden shadow rounded-lg">
      <div className="p-5">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <Icon className={`h-6 w-6 ${colorClasses[color as keyof typeof colorClasses] || 'text-gray-600'}`} />
          </div>
          <div className="ml-5 w-0 flex-1">
            <dl>
              <dt className="text-sm font-medium text-gray-500 truncate">{title}</dt>
              <dd className="flex items-baseline">
                <div className="text-2xl font-semibold text-gray-900">{value}</div>
                <div className={`ml-2 flex items-baseline text-sm font-semibold ${
                  isPositive ? 'text-green-600' : 'text-red-600'
                }`}>
                  {isPositive ? (
                    <ArrowTrendingUpIcon className="self-center flex-shrink-0 h-4 w-4" />
                  ) : (
                    <ArrowTrendingDownIcon className="self-center flex-shrink-0 h-4 w-4" />
                  )}
                  {Math.abs(change)}%
                </div>
              </dd>
            </dl>
          </div>
        </div>
      </div>
    </div>
  )
}

// Simple Chart component
const Chart = ({ data }: { data: Array<{ month: string; revenue: number; target?: number }> }) => (
  <div className="h-64">
    <div className="flex items-end justify-between h-full px-4 pb-4">
      {data.map((item, index) => (
        <div key={index} className="flex flex-col items-center space-y-2">
          <div className="text-xs text-gray-500">${(item.revenue / 1000).toFixed(0)}k</div>
          <div 
            className="bg-blue-500 rounded-t w-8 transition-all duration-500 hover:bg-blue-600"
            style={{ height: `${(item.revenue / 50000) * 200}px` }}
          ></div>
          <div className="text-xs text-gray-600">{item.month}</div>
        </div>
      ))}
    </div>
  </div>
)

export default function Dashboard() {
  const { data: stats, isLoading: statsLoading, error: statsError } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      const response = await api.get('/dashboard/stats')
      return response.data as DashboardStats
    },
    retry: 1,
    retryDelay: 1000,
    // Use fallback data if API fails
    placeholderData: FALLBACK_STATS
  })

  const { data: recentActivity, isLoading: activityLoading, error: activityError } = useQuery({
    queryKey: ['recent-activity'],
    queryFn: async () => {
      const response = await api.get('/dashboard/recent-activity')
      return response.data as RecentActivity[]
    },
    retry: 1,
    retryDelay: 1000,
    // Use fallback data if API fails
    placeholderData: FALLBACK_ACTIVITY
  })

  // Use fallback data if there are errors
  const finalStats = stats || FALLBACK_STATS
  const finalActivity = recentActivity || FALLBACK_ACTIVITY
  const hasBackendError = statsError || activityError

  // Show minimal loading state only on first load
  if ((statsLoading || activityLoading) && !finalStats && !finalActivity) {
    return (
      <div className="min-h-screen bg-gray-50 pb-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
              <p className="mt-1 text-sm text-gray-500">Loading dashboard data...</p>
            </div>
            <div className="animate-pulse">
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-8">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="bg-gray-200 h-32 rounded-lg"></div>
                ))}
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {[...Array(2)].map((_, i) => (
                  <div key={i} className="bg-gray-200 h-64 rounded-lg"></div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Main dashboard content with proper spacing
  return (
    <div className="min-h-screen bg-gray-50 pb-32">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
            <p className="mt-1 text-sm text-gray-500">
              Welcome back! Here's what's happening with your business today.
            </p>
          </div>

          {/* Show backend error warning if there's an issue */}
          {hasBackendError && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-center">
                <ExclamationTriangleIcon className="h-5 w-5 text-yellow-600 mr-2" />
                <div className="text-sm">
                  <span className="font-medium text-yellow-800">Using Demo Data</span>
                  <span className="text-yellow-700 ml-2">
                    Backend connection failed. Showing sample data for demonstration.
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Stats Grid */}
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <StatsCard
              title="Monthly Revenue"
              value={`$${finalStats.monthly_revenue?.toLocaleString() || 0}`}
              change={finalStats.revenue_change || 0}
              icon={CurrencyDollarIcon}
              color="green"
            />
            <StatsCard
              title="Active Leads"
              value={finalStats.active_leads || 0}
              change={finalStats.leads_change || 0}
              icon={PhoneIcon}
              color="blue"
            />
            <StatsCard
              title="Total Customers"
              value={finalStats.total_customers || 0}
              change={finalStats.customers_change || 0}
              icon={UsersIcon}
              color="purple"
            />
            <StatsCard
              title="Jobs This Week"
              value={finalStats.weekly_jobs || 0}
              change={finalStats.jobs_change || 0}
              icon={ClipboardDocumentListIcon}
              color="orange"
            />
          </div>

          {/* Charts and Recent Activity */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Revenue Overview</h3>
              {finalStats.revenue_data && finalStats.revenue_data.length > 0 ? (
                <Chart data={finalStats.revenue_data} />
              ) : (
                <div className="h-64 flex items-center justify-center text-gray-500">
                  <div className="text-center">
                    <div className="text-4xl mb-2">📊</div>
                    <div>No revenue data available</div>
                  </div>
                </div>
              )}
            </div>

            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Activity</h3>
              <div className="space-y-4 max-h-64 overflow-y-auto">
                {finalActivity && Array.isArray(finalActivity) && finalActivity.length > 0 ? (
                  finalActivity.map((activity: RecentActivity, index: number) => (
                    <div key={activity.id || index} className="flex items-start space-x-3">
                      <div className="flex-shrink-0">
                        <div className={`h-2 w-2 rounded-full mt-2 ${
                          activity.type === 'job' ? 'bg-green-500' :
                          activity.type === 'lead' ? 'bg-blue-500' :
                          activity.type === 'payment' ? 'bg-green-500' :
                          activity.type === 'appointment' ? 'bg-yellow-500' :
                          activity.type === 'feedback' ? 'bg-purple-500' :
                          'bg-gray-500'
                        }`}></div>
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm text-gray-900">{activity.description}</p>
                        <p className="text-xs text-gray-500">{activity.time}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <div className="text-4xl mb-2">📋</div>
                    <div>No recent activity</div>
                    <div className="text-sm mt-2">Activity will appear here as you use the system</div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Backend Connection Status */}
          {!hasBackendError ? (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center">
                <WifiIcon className="h-5 w-5 text-green-600 mr-2" />
                <div className="text-sm">
                  <span className="font-medium text-green-800">Backend Connected</span>
                  <span className="text-green-700 ml-2">
                    API: {import.meta.env.VITE_API_URL || 'http://localhost:8000'}/{import.meta.env.VITE_API_PREFIX || 'api/v1'}
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <h3 className="text-lg font-medium text-blue-800 mb-2">Backend Setup Instructions</h3>
              <p className="text-sm text-blue-700 mb-3">
                To connect to your backend and see real data:
              </p>
              <ol className="list-decimal list-inside text-sm text-blue-700 space-y-1 mb-4">
                <li>Make sure your backend server is running on <code className="bg-blue-100 px-1 rounded">http://localhost:8000</code></li>
                <li>Ensure these endpoints are implemented:
                  <ul className="list-disc list-inside ml-4 mt-1">
                    <li><code className="bg-blue-100 px-1 rounded">GET /api/v1/dashboard/stats</code></li>
                    <li><code className="bg-blue-100 px-1 rounded">GET /api/v1/dashboard/recent-activity</code></li>
                  </ul>
                </li>
                <li>Configure CORS to allow requests from <code className="bg-blue-100 px-1 rounded">http://localhost:5173</code></li>
                <li>Run the demo setup script to create sample data</li>
              </ol>
              
              <div className="bg-blue-100 p-3 rounded mb-4">
                <p className="text-sm font-medium text-blue-800 mb-2">Demo Accounts (once backend is set up):</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-blue-700">
                  <div>• admin@demo.com / demo123</div>
                  <div>• manager@demo.com / demo123</div>
                  <div>• tech@demo.com / demo123</div>
                  <div>• sales@demo.com / demo123</div>
                </div>
              </div>

              <button
                onClick={() => window.location.reload()}
                className="inline-flex items-center px-3 py-2 border border-blue-300 shadow-sm text-sm leading-4 font-medium rounded-md text-blue-700 bg-blue-50 hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <WifiIcon className="h-4 w-4 mr-2" />
                Test Connection
              </button>
            </div>
          )}

          {/* Development Info */}
          {import.meta.env.DEV && (
            <div className="bg-gray-100 p-4 rounded-lg">
              <h4 className="font-medium text-gray-900 mb-2">Development Info:</h4>
              <div className="text-xs text-gray-600 space-y-1">
                <div>Stats loaded: {finalStats ? '✅' : '❌'}</div>
                <div>Recent activity loaded: {finalActivity ? '✅' : '❌'}</div>
                <div>Activity count: {Array.isArray(finalActivity) ? finalActivity.length : 'N/A'}</div>
                <div>Backend error: {hasBackendError ? '❌' : '✅'}</div>
                <div>Mock mode: {import.meta.env.VITE_API_MOCK === 'true' ? 'Enabled' : 'Disabled'}</div>
                <div>API URL: {import.meta.env.VITE_API_URL || 'http://localhost:8000'}</div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}