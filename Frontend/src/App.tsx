// frontend/src/App.tsx - UPDATED VERSION
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { useEffect } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'react-hot-toast'
import { useAuthStore } from './store/authStore'
import DashboardLayout from './components/layout/DashboardLayout'
import AuthLayout from './components/layout/AuthLayout'

// Add this import at the top with other imports
import AIBookings from './Pages/admin/AIBookings'

// ===== Auth Pages =====
import Login from './Pages/auth/Login'
import Register from './Pages/auth/Register'
import ForgotPassword from './Pages/auth/ForgotPassword'

// ===== Dashboard =====
import Dashboard from './Pages/dashboard/Dashboard'
import Analytics from './Pages/dashboard/Analytics'
import Reports from './Pages/dashboard/Reports'

// ===== CRM =====
import Contacts from './Pages/crm/Contacts'
import Leads from './Pages/crm/Leads'
import Pipeline from './Pages/crm/Pipeline'
import ServiceRequests from './Pages/crm/ServiceRequests'

// ===== Scheduling =====
import Calendar from './Pages/scheduling/Calender'
import JobScheduler from './Pages/scheduling/JobSchedular'
import RouteOptimization from './Pages/scheduling/RouteOptimization'

// ===== Field Service =====
import Jobs from './Pages/field_service/Jobs'
import Technicians from './Pages/field_service/Technicians'
import GPSTracking from './Pages/field_service/Gps_Tracking'
import MobileWorkflow from './Pages/field_service/MobileWorkflow'

// ===== Estimates / Invoices =====
import EstimateList from './Pages/estimates/EstimateList'
import EstimateBuilder from './Pages/estimates/EstimateBuilder'
import InvoiceGenerator from './Pages/estimates/InvoiceGenerator'
import InvoiceList from './Pages/estimates/InvoiceList'

// ===== AI Automation =====
// import AIFlows from './Pages/ai_automation/AIFlows'
import SMSCampaigns from './Pages/ai_automation/SMSCampaigns'
import LeadScoring from './Pages/ai_automation/LeadScoring'
import AutomationBuilder from './Pages/ai_automation/AutomationBuilder'

// ===== Customer Portal =====
import CustomerDashboard from './Pages/customer_portal/CustomerDashboard'
import ServiceHistory from './Pages/customer_portal/ServiceHistory'
import CustomerDocuments from './Pages/customer_portal/CustomerDocuments'
import JobTracking from './Pages/customer_portal/JobTracking'
import PaymentPortal from './Pages/customer_portal/PaymentPortal'
import PaymentsDashboard from './Pages/customer_portal/PaymentsDashboard'

// ===== Technician Portal =====
import TechnicianDashboard from './Pages/technician_portal/TechnicianDashboard'
import JobsList from './Pages/technician_portal/JobsList'
import JobDetail from './Pages/technician_portal/JobDetail'
import TechRouteOptimization from './Pages/technician_portal/RouteOptimization'
import TechnicianSchedule from './Pages/technician_portal/TechnicianSchedule'
import TechnicianStats from './Pages/technician_portal/TechnicianStats'
import TechnicianSettings from './Pages/technician_portal/TechnicianSettings'

// ===== Settings =====
import Profile from './Pages/settings/Profile'
import Company from './Pages/settings/Company'
import Users from './Pages/settings/Users'
import Integrations from './Pages/settings/Integration'

import ServiceManagement from './Pages/admin/ServiceManagement'
// import AIAnalytics from './Pages/admin/AIAnalytics'

// Create QueryClient for React Query
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
})

function App() {
  const { user, isAuthenticated, login } = useAuthStore()
  const skipAuth = import.meta.env.VITE_SKIP_AUTH === 'true'

  // Dev bypass for easier development
  useEffect(() => {
    if (skipAuth && !isAuthenticated) {
      login(
        {
          id: 'dev-user-1',
          email: 'dev@servicecrm.com',
          name: 'Development User',
          role: 'admin',
          company_id: 'dev-company-1',
          avatar_url: '',
          phone: '',
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          last_login: new Date().toISOString(),
          permissions: ['*'],
          preferences: {
            theme: 'light',
            timezone: 'UTC',
            language: 'en',
            notifications: {
              email: true,
              sms: true,
              push: true,
              job_updates: true,
              payment_updates: true,
            },
            dashboard_layout: {},
          },
        },
        'dev-token-123'
      )
    }
  }, [skipAuth, isAuthenticated, login])

  const effectivelyAuthenticated = skipAuth || isAuthenticated

  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <div className="min-h-screen bg-gray-50">
          <Routes>
            {!effectivelyAuthenticated ? (
              // ===== UNAUTHENTICATED ROUTES =====
              <>
                <Route path="/" element={<AuthLayout />}>
                  <Route index element={<Navigate to="/login" replace />} />
                  <Route path="login" element={<Login />} />
                  <Route path="register" element={<Register />} />
                  <Route path="forgot-password" element={<ForgotPassword />} />
                </Route>

                {/* Public Customer Portal */}
                <Route path="/customer-portal" element={<AuthLayout />}>
                  <Route index element={<Navigate to="dashboard" replace />} />
                  <Route path="dashboard" element={<CustomerDashboard />} />
                  <Route path="service-history" element={<ServiceHistory />} />
                  <Route path="payment" element={<PaymentPortal />} />
                </Route>

                {/* Catch all - redirect to login */}
                <Route path="*" element={<Navigate to="/login" replace />} />
              </>
            ) : (
              // ===== AUTHENTICATED ROUTES =====
              <>
                <Route path="/" element={<DashboardLayout />}>
                  {/* Dashboard Routes */}
                  <Route index element={<Navigate to="/dashboard" replace />} />
                  <Route path="dashboard" element={<Dashboard />} />
                  <Route path="analytics" element={<Analytics />} />
                  <Route path="reports" element={<Reports />} />

                  {/* ADD THIS NEW ROUTE */}
                  <Route path="admin/ai-bookings" element={<AIBookings />} />
                  <Route path="/admin/service-management" element={<ServiceManagement />} />
                  {/* <Route path="/admin/ai-analytics" element={<AIAnalytics />} /> */}

                  {/* CRM Routes */}
                  <Route path="crm/contacts" element={<Contacts />} />
                  <Route path="crm/leads" element={<Leads />} />
                  <Route path="crm/pipeline" element={<Pipeline />} />
                   <Route path="crm/service-requests" element={<ServiceRequests />} />  {/* 🆕 NEW ROUTE */}
                  <Route path="crm" element={<Navigate to="/crm/contacts" replace />} />

                  {/* Scheduling Routes */}
                  <Route path="scheduling/calendar" element={<Calendar />} />
                  <Route path="scheduling/job-scheduler" element={<JobScheduler />} />
                  <Route path="scheduling/route-optimization" element={<RouteOptimization />} />
                  <Route path="scheduling" element={<Navigate to="/scheduling/calendar" replace />} />

                  {/* Field Service Routes */}
                  <Route path="field-service/jobs" element={<Jobs />} />
                  <Route path="field-service/technicians" element={<Technicians />} />
                  <Route path="field-service/gps-tracking" element={<GPSTracking />} />
                  <Route path="field-service/mobile-workflow" element={<MobileWorkflow />} />
                  <Route path="field-service" element={<Navigate to="/field-service/jobs" replace />} />

                  {/* Estimates & Invoices Routes */}
                  <Route path="estimates" element={<EstimateList />} />
                  <Route path="/estimates/new" element={<EstimateBuilder />} />
                  <Route path="estimates/:id/edit" element={<EstimateBuilder />} />
                  <Route path="estimates/:estimateId/invoice" element={<InvoiceGenerator />} />
                  
                  {/* Separate Invoice Routes */}
                  <Route path="invoices" element={<InvoiceList />} />
                  <Route path="invoices/new" element={<InvoiceGenerator />} />
                  <Route path="invoices/:id/edit" element={<InvoiceGenerator />} />

                  {/* AI Automation Routes */}
                  {/* <Route path="ai-automation/flows" element={<AIFlows />} /> */}
                  <Route path="ai-automation/sms-campaigns" element={<SMSCampaigns />} />
                  <Route path="ai-automation/lead-scoring" element={<LeadScoring />} />
                  <Route path="ai-automation/automation-builder" element={<AutomationBuilder />} />
                  {/* <Route path="ai-automation" element={<Navigate to="/ai-automation/flows" replace />} /> */}

                  {/* Settings Routes */}
                  <Route path="settings/profile" element={<Profile />} />
                  <Route path="settings/company" element={<Company />} />
                  <Route path="settings/users" element={<Users />} />
                  <Route path="settings/integrations" element={<Integrations />} />
                  <Route path="settings" element={<Navigate to="/settings/profile" replace />} />

                  {/* Customer Portal for authenticated customers
                  {(user?.role === 'customer' || skipAuth) && (
                    <>
                      <Route path="customer-portal/dashboard" element={<CustomerDashboard />} />
                      <Route path="customer-portal/service-history" element={<ServiceHistory />} />
                      <Route path="customer-portal/documents" element={<CustomerDocuments />} />
                      <Route path="customer-portal/job-tracking" element={< JobTracking />} />
                      <Route path="customer-portal/job-tracking/:jobId" element={<JobTracking />} />
                      {/* // Remove the conflicting routes and use this clean setup: */}
                      {/* <Route path="customer-portal/payment" element={<PaymentPortal />} />
                      <Route path="customer-portal/payments/:invoiceId" element={<PaymentPortal />} /> */}
                      {/* <Route path="customer-portal/payment" element={<PaymentPortal />} />
                      <Route path="customer-portal/payment/:invoiceId" element={<PaymentPortal />} />
                      {/* // Make sure you have this route in your router */}
                      {/* <Route path="/customer-portal/payments/:invoiceId" element={<PaymentPortal />} /> */}
                      {/* // Add this route to your router */}
                      {/* <Route path="/customer-portal/payments/:invoiceId" element={<PaymentPortal />} /> */}
                      {/* <Route path="customer-portal" element={<Navigate to="/customer-portal/dashboard" replace />} /> */}
                    {/* </> */}
              
{(user?.role === 'customer' || skipAuth) && (
  <>
    <Route path="customer-portal/dashboard" element={<CustomerDashboard />} />
    <Route path="customer-portal/service-history" element={<ServiceHistory />} />
    <Route path="customer-portal/documents" element={<CustomerDocuments />} />
    <Route path="customer-portal/job-tracking" element={<JobTracking />} />
    <Route path="customer-portal/job-tracking/:jobId" element={<JobTracking />} />
    {/* <Route path="customer-portal/payments/:invoiceId" element={<PaymentPortal />} /> */}
    <Route path="customer-portal/payments" element={<PaymentsDashboard />} />
    <Route path="customer-portal/payments/:invoiceId" element={<PaymentPortal />} />
    <Route path="customer-portal" element={<Navigate to="/customer-portal/dashboard" replace />} />
  </>
)}
                  {/* Technician Portal for technicians */}
                  {(user?.role === 'technician' || skipAuth) && (
                    <>
                      <Route path="technician-portal/dashboard" element={<TechnicianDashboard />} />
                      <Route path="technician-portal/jobs" element={<JobsList />} />
                      <Route path="technician-portal/jobs/:jobId" element={<JobDetail />} />
                      <Route path="technician-portal/route" element={<TechRouteOptimization />} />
                      <Route path="technician-portal/schedule" element={<TechnicianSchedule />} />
                      <Route path="technician-portal/stats" element={<TechnicianStats />} />
                      <Route path="technician-portal/settings" element={<TechnicianSettings />} />
                      <Route path="technician-portal" element={<Navigate to="/technician-portal/dashboard" replace />} />
                    </>
                  )}

                  {/* Development routes when auth is bypassed */}
                  {skipAuth && (
                    <>
                      <Route path="dev-login" element={<Login />} />
                      <Route path="dev-register" element={<Register />} />
                      <Route path="dev-forgot-password" element={<ForgotPassword />} />
                    </>
                  )}

                  {/* Redirect based on role */}
                  {user?.role === 'customer' ? (
                    <Route path="*" element={<Navigate to="/customer-portal/dashboard" replace />} />
                  ) : user?.role === 'technician' ? (
                    <Route path="*" element={<Navigate to="/technician-portal/dashboard" replace />} />
                  ) : (
                    <Route path="*" element={<Navigate to="/dashboard" replace />} />
                  )}
                </Route>
              </>
            )}
          </Routes>

          {/* Global Toast Notifications */}
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#363636',
                color: '#fff',
                maxWidth: '500px',
              },
              success: {
                style: {
                  background: '#10b981',
                },
              },
              error: {
                style: {
                  background: '#ef4444',
                },
              },
            }}
          />
        </div>
      </Router>
    </QueryClientProvider>
  )
}

export default App


























// // import CustomerDashboard from './Pages/customer_portal/CustomerDashboard';
// // import ServiceHistory from './Pages/customer_portal/ServiceHistory';
// // import ServiceRequestForm from './Pages/customer_portal/ServiceRequestForm';
// import CustomerDocuments from './Pages/customer_portal/CustomerDocuments';
// import JobTracking from './Pages/customer_portal/JobTracking';
// // import CustomerMessages from './Pages/customer_portal/CustomerMessages';
// // import PaymentPortal from './Pages/customer_portal/PaymentPortal';
// // import CustomerProfile from './Pages/customer_portal/CustomerProfile';


// import TechnicianPortalRouter from './Pages/technician_portal/TechnicianPortalRouter';
// import TechnicianDashboard from './Pages/technician_portal/TechnicianDashboard';
// import JobsList from './Pages/technician_portal/JobsList';
// import JobDetail from './Pages/technician_portal/JobDetail';
// import RouteOptimization from './Pages/technician_portal/RouteOptimization';
// import TechnicianStats from './Pages/technician_portal/TechnicianStats';
// import TechnicianSettings from './Pages/technician_portal/TechnicianSettings;














// // frontend/src/App.tsx - FIXED VERSION
// import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
// import { useEffect } from 'react'
// import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
// import { Toaster } from 'react-hot-toast'
// import { useAuthStore } from './store/authStore'
// import DashboardLayout from './components/layout/DashboardLayout'
// import AuthLayout from './components/layout/AuthLayout'

// // ===== Auth Pages =====
// import Login from './Pages/auth/Login'
// import Register from './Pages/auth/Register'
// import ForgotPassword from './Pages/auth/ForgotPassword'

// // ===== Dashboard =====
// import Dashboard from './Pages/dashboard/Dashboard'
// import Analytics from './Pages/dashboard/Analytics'
// import Reports from './Pages/dashboard/Reports'

// // ===== CRM =====
// import Contacts from './Pages/crm/Contacts'
// import Leads from './Pages/crm/Leads'
// import Pipeline from './Pages/crm/Pipeline'

// // ===== Scheduling =====
// import Calendar from './Pages/scheduling/Calender'
// import JobScheduler from './Pages/scheduling/JobSchedular'
// import RouteOptimization from './Pages/scheduling/RouteOptimization'

// // ===== Field Service =====
// import Jobs from './Pages/field_service/Jobs'
// import Technicians from './Pages/field_service/Technicians'
// import GPSTracking from './Pages/field_service/Gps_Tracking'
// import MobileWorkflow from './Pages/field_service/MobileWorkflow'

// // ===== Estimates / Invoices =====
// import EstimateList from './Pages/estimates/EstimateList'
// import EstimateBuilder from './Pages/estimates/EstimateBuilder'
// import InvoiceGenerator from './Pages/estimates/InvoiceGenerator'
// import InvoiceList from './Pages/estimates/InvoiceList'

// // ===== AI Automation =====
// import AIFlows from './Pages/ai_automation/AIFlows'
// import SMSCampaigns from './Pages/ai_automation/SMSCampaigns'
// import LeadScoring from './Pages/ai_automation/LeadScoring'
// import AutomationBuilder from './Pages/ai_automation/AutomationBuilder'

// // ===== Customer Portal =====
// import CustomerDashboard from './Pages/customer_portal/CustomerDashboard'
// import ServiceHistory from './Pages/customer_portal/ServiceHistory'
// import PaymentPortal from './Pages/customer_portal/PaymentPortal'

// // ===== Settings =====
// import Profile from './Pages/settings/Profile'
// import Company from './Pages/settings/Company'
// import Users from './Pages/settings/Users'
// import Integrations from './Pages/settings/Integration'

// // Create QueryClient for React Query
// const queryClient = new QueryClient({
//   defaultOptions: {
//     queries: {
//       staleTime: 5 * 60 * 1000, // 5 minutes
//       retry: 1,
//       refetchOnWindowFocus: false,
//     },
//   },
// })

// function App() {
//   const { user, isAuthenticated, login } = useAuthStore()
//   const skipAuth = import.meta.env.VITE_SKIP_AUTH === 'true'

//   // Dev bypass for easier development
//   useEffect(() => {
//     if (skipAuth && !isAuthenticated) {
//       login(
//         {
//           id: 'dev-user-1',
//           email: 'dev@servicecrm.com',
//           name: 'Development User',
//           role: 'admin',
//           company_id: 'dev-company-1',
//           avatar_url: '',
//           phone: '',
//           is_active: true,
//           created_at: new Date().toISOString(),
//           updated_at: new Date().toISOString(),
//           last_login: new Date().toISOString(),
//           permissions: ['*'],
//           preferences: {
//             theme: 'light',
//             timezone: 'UTC',
//             language: 'en',
//             notifications: {
//               email: true,
//               sms: true,
//               push: true,
//               job_updates: true,
//               payment_updates: true,
//             },
//             dashboard_layout: {},
//           },
//         },
//         'dev-token-123'
//       )
//     }
//   }, [skipAuth, isAuthenticated, login])

//   const effectivelyAuthenticated = skipAuth || isAuthenticated

//   return (
//     <QueryClientProvider client={queryClient}>
//       <Router>
//         <div className="min-h-screen bg-gray-50">
//           <Routes>
//             {!effectivelyAuthenticated ? (
//               // ===== UNAUTHENTICATED ROUTES =====
//               <>
//                 <Route path="/" element={<AuthLayout />}>
//                   <Route index element={<Navigate to="/login" replace />} />
//                   <Route path="login" element={<Login />} />
//                   <Route path="register" element={<Register />} />
//                   <Route path="forgot-password" element={<ForgotPassword />} />
//                 </Route>

//                 {/* Public Customer Portal */}
//                 <Route path="/customer-portal" element={<AuthLayout />}>
//                   <Route index element={<Navigate to="dashboard" replace />} />
//                   <Route path="dashboard" element={<CustomerDashboard />} />
//                   <Route path="service-history" element={<ServiceHistory />} />
//                   <Route path="payment" element={<PaymentPortal />} />
//                 </Route>

//                 {/* Catch all - redirect to login */}
//                 <Route path="*" element={<Navigate to="/login" replace />} />
//               </>
//             ) : (
//               // ===== AUTHENTICATED ROUTES =====
//               <>
//                 <Route path="/" element={<DashboardLayout />}>
//                   {/* Dashboard Routes - FIXED */}
//                   <Route index element={<Navigate to="/dashboard" replace />} />
//                   <Route path="dashboard" element={<Dashboard />} />
//                   <Route path="analytics" element={<Analytics />} />
//                   <Route path="reports" element={<Reports />} />

//                   {/* CRM Routes - FIXED */}
//                   <Route path="crm/contacts" element={<Contacts />} />
//                   <Route path="crm/leads" element={<Leads />} />
//                   <Route path="crm/pipeline" element={<Pipeline />} />
//                   <Route path="crm" element={<Navigate to="/crm/contacts" replace />} />

//                   {/* Scheduling Routes - FIXED */}
//                   <Route path="scheduling/calendar" element={<Calendar />} />
//                   <Route path="scheduling/job-scheduler" element={<JobScheduler />} />
//                   <Route path="scheduling/route-optimization" element={<RouteOptimization />} />
//                   <Route path="scheduling" element={<Navigate to="/scheduling/calendar" replace />} />

//                   {/* Field Service Routes - FIXED */}
//                   <Route path="field-service/jobs" element={<Jobs />} />
//                   <Route path="field-service/technicians" element={<Technicians />} />
//                   <Route path="field-service/gps-tracking" element={<GPSTracking />} />
//                   <Route path="field-service/mobile-workflow" element={<MobileWorkflow />} />
//                   <Route path="field-service" element={<Navigate to="/field-service/jobs" replace />} />

//                   {/* Estimates & Invoices Routes - FIXED */}
//                   <Route path="estimates" element={<EstimateList />} />
//                   {/* <Route path="estimates/new" element={<EstimateBuilder />} /> */}
                 
//                   <Route path="/estimates/new" element={<EstimateBuilder />} />

//                   <Route path="estimates/:id/edit" element={<EstimateBuilder />} />
//                   <Route path="estimates/:estimateId/invoice" element={<InvoiceGenerator />} />
                  
//                   {/* Separate Invoice Routes */}
//                   {/* <Route path="/invoices" element={<InvoiceList />} /> */}
//                   <Route path="invoices" element={<InvoiceList />} />
//                   <Route path="invoices/new" element={<InvoiceGenerator />} />
//                   <Route path="invoices/:id/edit" element={<InvoiceGenerator />} />

//                   {/* AI Automation Routes - FIXED */}
//                   <Route path="ai-automation/flows" element={<AIFlows />} />
//                   <Route path="ai-automation/sms-campaigns" element={<SMSCampaigns />} />
//                   <Route path="ai-automation/lead-scoring" element={<LeadScoring />} />
//                   <Route path="ai-automation/automation-builder" element={<AutomationBuilder />} />
//                   <Route path="ai-automation" element={<Navigate to="/ai-automation/flows" replace />} />

//                   {/* Settings Routes - FIXED */}
//                   <Route path="settings/profile" element={<Profile />} />
//                   <Route path="settings/company" element={<Company />} />
//                   <Route path="settings/users" element={<Users />} />
//                   <Route path="settings/integrations" element={<Integrations />} />
//                   <Route path="settings" element={<Navigate to="/settings/profile" replace />} />

//                   {/* Customer Portal for authenticated customers - FIXED */}
//                   {(user?.role === 'customer' || skipAuth) && (
//                     <>
//                       <Route path="customer-portal/dashboard" element={<CustomerDashboard />} />
//                       <Route path="customer-portal/service-history" element={<ServiceHistory />} />
//                       <Route path="customer-portal/payment" element={<PaymentPortal />} />
//                        <Route path="/customer-portal/documents" element={<CustomerDocuments />} />
//                       <Route path="/customer-portal/job-tracking" element={<JobTracking />} />
//                       <Route path="customer-portal" element={<Navigate to="/customer-portal/dashboard" replace />} />
//                     </>
//                   )}


                  

//                   {/* Development routes when auth is bypassed */}
//                   {skipAuth && (
//                     <>
//                       <Route path="dev-login" element={<Login />} />
//                       <Route path="dev-register" element={<Register />} />
//                       <Route path="dev-forgot-password" element={<ForgotPassword />} />
//                     </>
//                   )}

//                   {/* Catch all authenticated users */}
//                   <Route path="*" element={<Navigate to="/dashboard" replace />} />
//                 </Route>
//               </>
//             )}
//           </Routes>

//           {/* Global Toast Notifications */}
//           <Toaster
//             position="top-right"
//             toastOptions={{
//               duration: 4000,
//               style: {
//                 background: '#363636',
//                 color: '#fff',
//                 maxWidth: '500px',
//               },
//               success: {
//                 style: {
//                   background: '#10b981',
//                 },
//               },
//               error: {
//                 style: {
//                   background: '#ef4444',
//                 },
//               },
//             }}
//           />
//         </div>
//       </Router>
//     </QueryClientProvider>
//   )
// }

// export default App

