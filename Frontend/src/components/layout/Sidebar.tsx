// frontend/src/components/layout/Sidebar.tsx - UPDATED

import { useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import {
  HomeIcon, UsersIcon, CalendarIcon, ClipboardDocumentListIcon, CurrencyDollarIcon,
  RocketLaunchIcon, CogIcon, XMarkIcon, ChevronDownIcon, ChevronRightIcon,
  MapPinIcon, WrenchScrewdriverIcon, DevicePhoneMobileIcon, DocumentTextIcon,
  ChartBarIcon, FunnelIcon, BellIcon, BuildingOfficeIcon, CreditCardIcon,
  UserIcon, ChatBubbleLeftRightIcon, TruckIcon, SignalIcon, Squares2X2Icon
} from '@heroicons/react/24/outline'
import { useAuthStore } from '../../store/authStore'

type Role = 'admin' | 'technician' | 'customer'

interface NavigationItem {
  name: string
  href?: string
  icon: React.ComponentType<{ className?: string }>
  children?: NavigationItem[]
  badge?: string | number
  roles?: Role[]
}

interface SidebarProps {
  isOpen?: boolean
  onClose?: () => void
}

const STAFF: Role[] = ['admin', 'technician']

const navigation: NavigationItem[] = [
  // -------- Back-office (Admin + Technician) --------
  { name: 'Dashboard', href: '/dashboard', icon: HomeIcon, roles: ['admin'] },
  {
    name: 'CRM', icon: UsersIcon, roles: ['admin'],
    children: [
      { name: 'Contacts', href: '/crm/contacts', icon: UsersIcon },
      { name: 'Leads', href: '/crm/leads', icon: FunnelIcon },
      { 
        name: 'Service Requests', 
        href: '/crm/service-requests', 
        icon: ClipboardDocumentListIcon,
      },
      { name: 'AI Bookings', href: '/admin/ai-bookings', icon: ChatBubbleLeftRightIcon },
      { name: 'Pipeline', href: '/crm/pipeline', icon: ChartBarIcon },
    ]
  },
  // ✅ NEW: AI Service Management
  {
    name: 'AI Management', icon: RocketLaunchIcon, roles: ['admin'],
    children: [
      { 
        name: 'Service Builder', 
        href: '/admin/service-management', 
        icon: Squares2X2Icon,
        badge: 'Canvas'
      },
      { name: 'AI Automation', href: '/ai-automation/flows', icon: RocketLaunchIcon },
      { name: 'AI Analytics', href: '/admin/ai-analytics', icon: ChartBarIcon },
    ]
  },
  {
    name: 'Scheduling', icon: CalendarIcon, roles: ['admin'],
    children: [
      { name: 'Calendar', href: '/scheduling/calendar', icon: CalendarIcon },
      { name: 'Job Scheduler', href: '/scheduling/job-scheduler', icon: ClipboardDocumentListIcon },
      { name: 'Route Optimization', href: '/scheduling/route-optimization', icon: MapPinIcon },
    ]
  },
  {
    name: 'Field Service', icon: WrenchScrewdriverIcon, roles: ['admin'],
    children: [
      { name: 'Jobs', href: '/field-service/jobs', icon: ClipboardDocumentListIcon },
      { name: 'Technicians', href: '/field-service/technicians', icon: UsersIcon },
      { name: 'GPS Tracking', href: '/field-service/gps-tracking', icon: MapPinIcon },
      { name: 'Mobile Workflow', href: '/field-service/mobile-workflow', icon: DevicePhoneMobileIcon },
    ]
  },
  {
    name: 'Estimates & Invoicing', icon: CurrencyDollarIcon, roles: ['admin'],
    children: [
      { name: 'Estimates', href: '/estimates', icon: DocumentTextIcon },
      { name: 'Estimate Builder', href: '/estimates/new', icon: DocumentTextIcon },
      { name: 'Invoices', href: '/invoices', icon: CurrencyDollarIcon },
      { name: 'Invoice Generator', href: '/invoices/new', icon: CurrencyDollarIcon },
    ]
  },
  {
    name: 'Analytics', icon: ChartBarIcon, roles: ['admin'],
    children: [
      { name: 'Dashboard Analytics', href: '/analytics', icon: ChartBarIcon },
      { name: 'Reports', href: '/reports', icon: DocumentTextIcon },
    ]
  },
  {
    name: 'Settings', icon: CogIcon, roles: ['admin'],
    children: [
      { name: 'Profile', href: '/settings/profile', icon: UsersIcon },
      { name: 'Company', href: '/settings/company', icon: BuildingOfficeIcon },
      { name: 'Users', href: '/settings/users', icon: UsersIcon, roles: ['admin'] },
      { name: 'Integrations', href: '/settings/integrations', icon: RocketLaunchIcon },
      { name: 'Notifications', href: '/settings/notifications', icon: BellIcon },
    ]
  },

  // -------- Technician Portal (Technician only) --------
  { name: 'Dashboard', href: '/technician-portal/dashboard', icon: HomeIcon, roles: ['technician'] },
  { name: 'My Jobs', href: '/technician-portal/jobs', icon: ClipboardDocumentListIcon, roles: ['technician'] },
  { name: 'Route Optimization', href: '/technician-portal/route', icon: TruckIcon, roles: ['technician'] },
  { name: 'Performance Stats', href: '/technician-portal/stats', icon: ChartBarIcon, roles: ['technician'] },
  { name: 'Settings', href: '/technician-portal/settings', icon: CogIcon, roles: ['technician'] },

  // -------- Customer Portal (Customer only) --------
  {
    name: 'Customer Portal', icon: ChartBarIcon, roles: ['customer'],
    children: [
      { name: 'Dashboard', href: '/customer-portal/dashboard', icon: HomeIcon },
      { name: 'Service History', href: '/customer-portal/service-history', icon: ClipboardDocumentListIcon },
      { name: 'Documents', href: '/customer-portal/documents', icon: DocumentTextIcon },
      { name: 'Payments', href: '/customer-portal/payments', icon: CreditCardIcon },
      { name: 'Payment History', href: '/customer-portal/service-history', icon: CreditCardIcon },
    ]
  },
]

// Rest of the component remains the same...
export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const location = useLocation()
  const { user } = useAuthStore()
  const [expanded, setExpanded] = useState<string[]>(['CRM', 'AI Management', 'Field Service', 'Customer Portal'])

  const role = (user?.role || '') as Role
  const hasRole = (roles?: Role[]) => !roles?.length || roles.includes(role)

  const isCurrent = (href?: string) =>
    !!href && (location.pathname === href || location.pathname.startsWith(href + '/'))

  const isParentActive = (children?: NavigationItem[]) =>
    !!children?.some(c => isCurrent(c.href))

  const toggle = (name: string) =>
    setExpanded(prev => prev.includes(name) ? prev.filter(n => n !== name) : [...prev, name])

  const isOpenItem = (name: string) => expanded.includes(name)

  return (
    <>
      {/* Mobile overlay - enhanced with better animation and touch handling */}
      {isOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div 
            className="fixed inset-0 bg-gray-600/75 transition-opacity duration-300 ease-in-out" 
            onClick={onClose}
            style={{ touchAction: 'none' }} // Prevent scroll behind overlay
          />
          <div className="relative flex w-full max-w-xs sm:max-w-sm flex-col h-full animate-slide-in-left safe-area-inset-left" style={{ backgroundColor: '#0038FF' }}>
            <SidebarContent
              onClose={onClose}
              navigation={navigation}
              hasRole={hasRole}
              isCurrent={isCurrent}
              isParentActive={isParentActive}
              toggle={toggle}
              isOpenItem={isOpenItem}
            />
          </div>
        </div>
      )}

      {/* Desktop - responsive width and positioning */}
      <div className="hidden lg:flex lg:w-64 xl:w-72 2xl:w-80 lg:flex-col lg:fixed lg:inset-y-0 lg:z-40 transition-all duration-300 ease-in-out" style={{ backgroundColor: '#0038FF' }}>
        <SidebarContent
          navigation={navigation}
          hasRole={hasRole}
          isCurrent={isCurrent}
          isParentActive={isParentActive}
          toggle={toggle}
          isOpenItem={isOpenItem}
        />
      </div>
    </>
  )
}

function SidebarContent({
  onClose,
  navigation,
  hasRole,
  isCurrent,
  isParentActive,
  toggle,
  isOpenItem
}: {
  onClose?: () => void
  navigation: NavigationItem[]
  hasRole: (roles?: Role[]) => boolean
  isCurrent: (href?: string) => boolean
  isParentActive: (children?: NavigationItem[]) => boolean
  toggle: (name: string) => void
  isOpenItem: (name: string) => boolean
}) {
  const { user } = useAuthStore()

  return (
    <div className="flex flex-col flex-grow pt-3 sm:pt-5 pb-4 overflow-y-auto shadow-lg safe-area-inset-top safe-area-inset-bottom" style={{ backgroundColor: '#0038FF' }}>
      {/* Header - responsive sizing */}
      <div className="flex items-center justify-between px-3 sm:px-4">
        <div className="flex items-center min-w-0 flex-1">
          <img 
            src="/logo.png" 
            alt="Storm AI Logo" 
            className="h-12 w-12 sm:h-14 sm:w-14 lg:h-16 lg:w-16 rounded-lg flex-shrink-0"
          />
          <span className="ml-2 sm:ml-3 text-lg sm:text-xl font-bold tracking-tight text-white truncate">
            <span className="hidden sm:inline">Storm AI</span>
            <span className="sm:hidden">Storm</span>
          </span>
        </div>
        {onClose && (
          <button 
            onClick={onClose} 
            className="lg:hidden p-2 rounded-md hover:bg-blue-700 transition-colors duration-200 touch-friendly flex-shrink-0"
            aria-label="Close sidebar"
          >
            <XMarkIcon className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
          </button>
        )}
      </div>

      {/* User pill - responsive design */}
      <div className="mt-4 sm:mt-6 px-3 sm:px-4">
        <div className="bg-blue-800/30 rounded-lg p-2 sm:p-3">
          <div className="flex items-center min-w-0">
            <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
              <span className="text-white text-xs sm:text-sm font-medium">
                {(user?.name || user?.email || 'U')
                  .split(' ')
                  .map((n: string) => n[0])
                  .join('')
                  .toUpperCase()}
              </span>
            </div>
            <div className="ml-2 sm:ml-3 min-w-0 flex-1">
              <p className="text-xs sm:text-sm font-medium text-white truncate">{user?.name || user?.email}</p>
              <p className="text-xs text-blue-200 truncate capitalize">{user?.role}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation - responsive with touch-friendly targets */}
      <nav className="mt-6 sm:mt-8 flex-1 px-2 space-y-1 overflow-y-auto">
        {navigation.map((item) => {
          if (!hasRole(item.roles)) return null

          if (item.children) {
            const active = isParentActive(item.children)
            const open = isOpenItem(item.name)
            return (
              <div key={item.name}>
                <button
                  onClick={() => toggle(item.name)}
                  className={`group w-full flex items-center justify-between px-2 py-2.5 sm:py-2 text-xs sm:text-sm rounded-md transition-all duration-200 touch-friendly
                    ${active ? 'bg-white/10 text-white border-r-2 border-white'
                             : 'text-blue-100 hover:bg-white/5 hover:text-white active:bg-white/10'}`}
                >
                  <div className="flex items-center min-w-0 flex-1">
                    <item.icon className={`mr-2 sm:mr-3 h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0 ${active ? 'text-white' : 'text-blue-200'}`} />
                    <span className="truncate font-medium">{item.name}</span>
                  </div>
                  <div className="flex items-center space-x-2 flex-shrink-0">
                    {open ? <ChevronDownIcon className="h-3 w-3 sm:h-4 sm:w-4 text-blue-200" />
                          : <ChevronRightIcon className="h-3 w-3 sm:h-4 sm:w-4 text-blue-200" />}
                  </div>
                </button>

                {open && (
                  <div className="mt-1 space-y-1 animate-slide-in-down">
                    {item.children.map((child) => {
                      if (!hasRole(child.roles)) return null
                      return (
                        <NavLink
                          key={child.name}
                          to={child.href!}
                          onClick={onClose}
                          className={({ isActive }) =>
                            `group flex items-center justify-between pl-8 sm:pl-11 pr-2 py-2.5 sm:py-2 text-xs sm:text-sm rounded-md transition-all duration-200 touch-friendly ${
                              isActive
                                ? 'bg-white/20 text-white font-medium border-r-2 border-white'
                                : 'text-blue-100 hover:bg-white/5 hover:text-white active:bg-white/10'
                            }`
                          }
                        >
                          <div className="flex items-center min-w-0 flex-1">
                            <child.icon className="mr-2 sm:mr-3 h-3 w-3 sm:h-4 sm:w-4 text-blue-200 flex-shrink-0" />
                            <span className="truncate">{child.name}</span>
                          </div>
                          {child.badge && (
                            <span className="ml-auto bg-white/20 text-white text-xs font-medium px-1.5 py-0.5 sm:px-2 rounded-full flex-shrink-0">
                              {child.badge}
                            </span>
                          )}
                        </NavLink>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          }

          return (
            <NavLink
              key={item.name}
              to={item.href!}
              onClick={onClose}
              className={({ isActive }) =>
                `group flex items-center justify-between px-2 py-2.5 sm:py-2 text-xs sm:text-sm rounded-md transition-all duration-200 touch-friendly ${
                  isActive
                    ? 'bg-white/10 text-white border-r-2 border-white'
                    : 'text-blue-100 hover:bg-white/5 hover:text-white active:bg-white/10'
                }`
              }
            >
              <div className="flex items-center min-w-0 flex-1">
                <item.icon className="mr-2 sm:mr-3 h-4 w-4 sm:h-5 sm:w-5 text-blue-200 flex-shrink-0" />
                <span className="truncate font-medium">{item.name}</span>
              </div>
              {item.badge && (
                <span className="ml-auto bg-white/20 text-white text-xs font-medium px-1.5 py-0.5 sm:px-2 rounded-full flex-shrink-0">
                  {item.badge}
                </span>
              )}
            </NavLink>
          )
        })}
      </nav>

      {/* Footer - responsive */}
      <div className="px-3 sm:px-4 pb-2 text-center text-xs text-blue-200 safe-area-inset-bottom">
        <span className="hidden sm:inline">Storm AI v1.0.0</span>
        <span className="sm:hidden">v1.0.0</span>
      </div>
    </div>
  )
}


// // frontend/src/components/layout/Sidebar.tsx
// import { useState } from 'react'
// import { NavLink, useLocation } from 'react-router-dom'
// import {
//   HomeIcon, UsersIcon, CalendarIcon, ClipboardDocumentListIcon, CurrencyDollarIcon,
//   RocketLaunchIcon, CogIcon, XMarkIcon, ChevronDownIcon, ChevronRightIcon,
//   MapPinIcon, WrenchScrewdriverIcon, DevicePhoneMobileIcon, DocumentTextIcon,
//   ChartBarIcon, FunnelIcon, BellIcon, BuildingOfficeIcon, CreditCardIcon,
//   UserIcon, ChatBubbleLeftRightIcon, TruckIcon, SignalIcon
// } from '@heroicons/react/24/outline'
// import { useAuthStore } from '../../store/authStore'

// type Role = 'admin' | 'technician' | 'customer'

// interface NavigationItem {
//   name: string
//   href?: string
//   icon: React.ComponentType<{ className?: string }>
//   children?: NavigationItem[]
//   badge?: string | number
//   roles?: Role[]          // ← role gating
// }

// interface SidebarProps {
//   isOpen?: boolean
//   onClose?: () => void
// }

// const STAFF: Role[] = ['admin', 'technician']

// const navigation: NavigationItem[] = [
//   // -------- Back-office (Admin + Technician) --------
//   { name: 'Dashboard', href: '/dashboard', icon: HomeIcon, roles: ['admin'] },
//   {
//     name: 'CRM', icon: UsersIcon, roles: ['admin'],
//     children: [
//       { name: 'Contacts', href: '/crm/contacts', icon: UsersIcon },
//       { name: 'Leads', href: '/crm/leads', icon: FunnelIcon },
//       { 
//       name: 'Service Requests', 
//       href: '/crm/service-requests', 
//       icon: ClipboardDocumentListIcon,
//       // badge: pendingRequestsCount // You can add a badge showing pending count
//     },
//     { name: 'AI Bookings', href: '/admin/ai-bookings', icon: ChatBubbleLeftRightIcon }, // ADD THIS
//       { name: 'Pipeline', href: '/crm/pipeline', icon: ChartBarIcon },
//     ]
//   },
//   {
//     name: 'Scheduling', icon: CalendarIcon, roles: ['admin'],
//     children: [
//       { name: 'Calendar', href: '/scheduling/calendar', icon: CalendarIcon },
//       { name: 'Job Scheduler', href: '/scheduling/job-scheduler', icon: ClipboardDocumentListIcon },
//       { name: 'Route Optimization', href: '/scheduling/route-optimization', icon: MapPinIcon },
//     ]
//   },
//   {
//     name: 'Field Service', icon: WrenchScrewdriverIcon, roles: ['admin'],
//     children: [
//       { name: 'Jobs', href: '/field-service/jobs', icon: ClipboardDocumentListIcon },
//       { name: 'Technicians', href: '/field-service/technicians', icon: UsersIcon }, // visible to admin & tech
//       { name: 'GPS Tracking', href: '/field-service/gps-tracking', icon: MapPinIcon },
//       { name: 'Mobile Workflow', href: '/field-service/mobile-workflow', icon: DevicePhoneMobileIcon },
//     ]
//   },
//   {
//     name: 'Estimates & Invoicing', icon: CurrencyDollarIcon, roles: ['admin'],
//     children: [
//       { name: 'Estimates', href: '/estimates', icon: DocumentTextIcon },
//       { name: 'Estimate Builder', href: '/estimates/new', icon: DocumentTextIcon },
//       { name: 'Invoices', href: '/invoices', icon: CurrencyDollarIcon },
//       { name: 'Invoice Generator', href: '/invoices/new', icon: CurrencyDollarIcon },
//     ]
//   },
//   { name: 'AI Automation', href: '/ai-automation/flows', icon: RocketLaunchIcon, badge: 'New', roles: ['admin'] },
//   {
//     name: 'Analytics', icon: ChartBarIcon, roles: ['admin'],
//     children: [
//       { name: 'Dashboard Analytics', href: '/analytics', icon: ChartBarIcon },
//       { name: 'Reports', href: '/reports', icon: DocumentTextIcon },
//     ]
//   },
//   {
//     name: 'Settings', icon: CogIcon, roles: ['admin'],
//     children: [
//       { name: 'Profile', href: '/settings/profile', icon: UsersIcon },
//       { name: 'Company', href: '/settings/company', icon: BuildingOfficeIcon },
//       { name: 'Users', href: '/settings/users', icon: UsersIcon, roles: ['admin'] }, // admin-only
//       { name: 'Integrations', href: '/settings/integrations', icon: RocketLaunchIcon },
//       { name: 'Notifications', href: '/settings/notifications', icon: BellIcon },
//     ]
//   },

//   // -------- Technician Portal (Technician only) --------
//   { name: 'Dashboard', href: '/technician-portal/dashboard', icon: HomeIcon, roles: ['technician'] },
//   { name: 'My Jobs', href: '/technician-portal/jobs', icon: ClipboardDocumentListIcon, roles: ['technician'] },
//   { name: 'Route Optimization', href: '/technician-portal/route', icon: TruckIcon, roles: ['technician'] },
//   { name: 'Performance Stats', href: '/technician-portal/stats', icon: ChartBarIcon, roles: ['technician'] },
//   { name: 'Settings', href: '/technician-portal/settings', icon: CogIcon, roles: ['technician'] },

//   // -------- Customer Portal (Customer only) --------
//   {
//     name: 'Customer Portal', icon: ChartBarIcon, roles: ['customer'],
//     children: [
//       { name: 'Dashboard', href: '/customer-portal/dashboard', icon: HomeIcon },
//       { name: 'Service History', href: '/customer-portal/service-history', icon: ClipboardDocumentListIcon },
//       // { name: 'Service Requests', href: '/customer-portal/service-request', icon: WrenchScrewdriverIcon },
//       { name: 'Documents', href: '/customer-portal/documents', icon: DocumentTextIcon },
//       // { name: 'Job Tracking', href: '/customer-portal/job-tracking', icon: MapPinIcon },
//       // { name: 'Messages', href: '/customer-portal/messages', icon: ChatBubbleLeftRightIcon },
//        { name: 'Payments', href: '/customer-portal/payments', icon: CreditCardIcon },
//      { name: 'Payment History', href: '/customer-portal/service-history', icon: CreditCardIcon },
    
//       // { name: 'Profile', href: '/customer-portal/profile', icon: UserIcon }
//     ]
//   },
// ]

// export default function Sidebar({ isOpen, onClose }: SidebarProps) {
//   const location = useLocation()
//   const { user } = useAuthStore()
//   const [expanded, setExpanded] = useState<string[]>(['CRM', 'Field Service', 'Customer Portal'])

//   const role = (user?.role || '') as Role
//   const hasRole = (roles?: Role[]) => !roles?.length || roles.includes(role)

//   const isCurrent = (href?: string) =>
//     !!href && (location.pathname === href || location.pathname.startsWith(href + '/'))

//   const isParentActive = (children?: NavigationItem[]) =>
//     !!children?.some(c => isCurrent(c.href))

//   const toggle = (name: string) =>
//     setExpanded(prev => prev.includes(name) ? prev.filter(n => n !== name) : [...prev, name])

//   const isOpenItem = (name: string) => expanded.includes(name)

//   return (
//     <>
//       {/* Mobile overlay */}
//       {isOpen && (
//         <div className="fixed inset-0 z-50 lg:hidden">
//           <div className="fixed inset-0 bg-gray-600/75" onClick={onClose} />
//           <div className="relative flex w-full max-w-xs flex-col h-full" style={{ backgroundColor: '#0038FF' }}>
//             <SidebarContent
//               onClose={onClose}
//               navigation={navigation}
//               hasRole={hasRole}
//               isCurrent={isCurrent}
//               isParentActive={isParentActive}
//               toggle={toggle}
//               isOpenItem={isOpenItem}
//             />
//           </div>
//         </div>
//       )}

//       {/* Desktop */}
//       <div className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0 lg:z-40" style={{ backgroundColor: '#0038FF' }}>
//         <SidebarContent
//           navigation={navigation}
//           hasRole={hasRole}
//           isCurrent={isCurrent}
//           isParentActive={isParentActive}
//           toggle={toggle}
//           isOpenItem={isOpenItem}
//         />
//       </div>
//     </>
//   )
// }

// function SidebarContent({
//   onClose,
//   navigation,
//   hasRole,
//   isCurrent,
//   isParentActive,
//   toggle,
//   isOpenItem
// }: {
//   onClose?: () => void
//   navigation: NavigationItem[]
//   hasRole: (roles?: Role[]) => boolean
//   isCurrent: (href?: string) => boolean
//   isParentActive: (children?: NavigationItem[]) => boolean
//   toggle: (name: string) => void
//   isOpenItem: (name: string) => boolean
// }) {
//   const { user } = useAuthStore()

//   return (
//     <div className="flex flex-col flex-grow pt-5 pb-4 overflow-y-auto shadow-lg" style={{ backgroundColor: '#0038FF' }}>
//       {/* Header */}
//       <div className="flex items-center justify-between px-4">
//         <div className="flex items-center">
//           <img 
//             src="/logo.png" 
//             alt="Storm AI Logo" 
//             className="h-16 w-16 rounded-lg"
//           />
//           <span className="ml-3 text-xl font-bold tracking-tight text-white">Storm AI</span>
//         </div>
//         {onClose && (
//           <button onClick={onClose} className="lg:hidden p-2 rounded-md hover:bg-blue-700">
//             <XMarkIcon className="h-6 w-6 text-white" />
//           </button>
//         )}
//       </div>

//       {/* User pill */}
//       <div className="mt-6 px-4">
//         <div className="bg-blue-800/30 rounded-lg p-3">
//           <div className="flex items-center">
//             <div className="h-10 w-10 rounded-full bg-white/20 flex items-center justify-center">
//               <span className="text-white text-sm">
//                 {(user?.name || user?.email || 'U')
//                   .split(' ')
//                   .map((n: string) => n[0])
//                   .join('')
//                   .toUpperCase()}
//               </span>
//             </div>
//             <div className="ml-3 min-w-0">
//               <p className="text-sm font-medium text-white truncate">{user?.name || user?.email}</p>
//               <p className="text-xs text-blue-200 truncate capitalize">{user?.role}</p>
//             </div>
//           </div>
//         </div>
//       </div>

//       {/* Nav */}
//       <nav className="mt-8 flex-1 px-2 space-y-1">
//         {navigation.map((item) => {
//           if (!hasRole(item.roles)) return null

//           if (item.children) {
//             const active = isParentActive(item.children)
//             const open = isOpenItem(item.name)
//             return (
//               <div key={item.name}>
//                 <button
//                   onClick={() => toggle(item.name)}
//                   className={`group w-full flex items-center justify-between px-2 py-2 text-sm rounded-md
//                     ${active ? 'bg-white/10 text-white border-r-2 border-white'
//                              : 'text-blue-100 hover:bg-white/5 hover:text-white'}`}
//                 >
//                   <div className="flex items-center">
//                     <item.icon className={`mr-3 h-5 w-5 ${active ? 'text-white' : 'text-blue-200'}`} />
//                     {item.name}
//                   </div>
//                   <div className="flex items-center space-x-2">
//                     {open ? <ChevronDownIcon className="h-4 w-4 text-blue-200" />
//                           : <ChevronRightIcon className="h-4 w-4 text-blue-200" />}
//                   </div>
//                 </button>

//                 {open && (
//                   <div className="mt-1 space-y-1">
//                     {item.children.map((child) => {
//                       if (!hasRole(child.roles)) return null
//                       return (
//                         <NavLink
//                           key={child.name}
//                           to={child.href!}
//                           onClick={onClose}
//                           className={({ isActive }) =>
//                             `group flex items-center justify-between pl-11 pr-2 py-2 text-sm rounded-md ${
//                               isActive
//                                 ? 'bg-white/20 text-white font-medium border-r-2 border-white'
//                                 : 'text-blue-100 hover:bg-white/5 hover:text-white'
//                             }`
//                           }
//                         >
//                           <div className="flex items-center min-w-0">
//                             <child.icon className="mr-3 h-4 w-4 text-blue-200" />
//                             <span className="truncate">{child.name}</span>
//                           </div>
//                         </NavLink>
//                       )
//                     })}
//                   </div>
//                 )}
//               </div>
//             )
//           }

//           return (
//             <NavLink
//               key={item.name}
//               to={item.href!}
//               onClick={onClose}
//               className={({ isActive }) =>
//                 `group flex items-center justify-between px-2 py-2 text-sm rounded-md ${
//                   isActive
//                     ? 'bg-white/10 text-white border-r-2 border-white'
//                     : 'text-blue-100 hover:bg-white/5 hover:text-white'
//                 }`
//               }
//             >
//               <div className="flex items-center min-w-0">
//                 <item.icon className="mr-3 h-5 w-5 text-blue-200" />
//                 <span className="truncate">{item.name}</span>
//               </div>
//               {item.badge && (
//                 <span className="ml-auto bg-white/20 text-white text-xs font-medium px-2 py-0.5 rounded-full">
//                   {item.badge}
//                 </span>
//               )}
//             </NavLink>
//           )
//         })}
//       </nav>

//       <div className="px-4 pb-2 text-center text-xs text-blue-200">Storm AI v1.0.0</div>
//     </div>
//   )
// }



