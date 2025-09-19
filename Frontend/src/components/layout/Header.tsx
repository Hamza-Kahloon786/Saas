// // frontend/src/components/layout/Header.tsx - FINAL VERSION WITH WHITE AVATAR

// import { useState, useRef, useEffect } from 'react'
// import { useAuthStore } from '../../store/authStore'
// import { 
//   Bars3Icon, 
//   BellIcon, 
//   MagnifyingGlassIcon,
//   UserCircleIcon,
//   Cog6ToothIcon,
//   ArrowRightOnRectangleIcon,
//   ChevronDownIcon,
//   SunIcon,
//   MoonIcon
// } from '@heroicons/react/24/outline'
// import { useQuery } from '@tanstack/react-query'
// import { api } from '../../services/api'

// interface HeaderProps {
//   onMenuClick: () => void
// }

// interface Notification {
//   id: string
//   title: string
//   message: string
//   type: 'info' | 'warning' | 'success' | 'error'
//   created_at: string
//   read: boolean
// }

// export default function Header({ onMenuClick }: HeaderProps) {
//   const { user, logout } = useAuthStore()
//   const [showUserMenu, setShowUserMenu] = useState(false)
//   const [showNotifications, setShowNotifications] = useState(false)
//   const [showSearch, setShowSearch] = useState(false)
//   const [searchQuery, setSearchQuery] = useState('')
//   const [darkMode, setDarkMode] = useState(false)
  
//   const userMenuRef = useRef<HTMLDivElement>(null)
//   const notificationRef = useRef<HTMLDivElement>(null)
//   const searchRef = useRef<HTMLDivElement>(null)

//   // FIXED: Fetch notifications with proper loading state
//   const { data: notificationsData, isLoading: notificationsLoading } = useQuery({
//     queryKey: ['notifications'],
//     queryFn: async () => {
//       // Temporarily return empty data to prevent errors
//       return { notifications: [], unread_count: 0 }
//     },
//     enabled: false, // Disable the query for now
//     refetchInterval: 30000
//   })

//   // Extract notifications from the response
//   const notifications = notificationsData?.notifications || []

//   // Close dropdowns when clicking outside
//   useEffect(() => {
//     const handleClickOutside = (event: MouseEvent) => {
//       if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
//         setShowUserMenu(false)
//       }
//       if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
//         setShowNotifications(false)
//       }
//       if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
//         setShowSearch(false)
//       }
//     }

//     document.addEventListener('mousedown', handleClickOutside)
//     return () => {
//       document.removeEventListener('mousedown', handleClickOutside)
//     }
//   }, [])

//   // Handle search
//   const handleSearch = (query: string) => {
//     if (query.trim()) {
//       console.log('Searching for:', query)
//     }
//   }

//   // Handle keyboard shortcuts
//   useEffect(() => {
//     const handleKeyPress = (event: KeyboardEvent) => {
//       // Cmd/Ctrl + K for search
//       if ((event.metaKey || event.ctrlKey) && event.key === 'k') {
//         event.preventDefault()
//         setShowSearch(true)
//         searchRef.current?.querySelector('input')?.focus()
//       }
      
//       // Escape to close dropdowns
//       if (event.key === 'Escape') {
//         setShowUserMenu(false)
//         setShowNotifications(false)
//         setShowSearch(false)
//       }
//     }

//     document.addEventListener('keydown', handleKeyPress)
//     return () => {
//       document.removeEventListener('keydown', handleKeyPress)
//     }
//   }, [])

//   // FIXED: Calculate unread notifications safely
//   const unreadNotifications = Array.isArray(notifications) 
//     ? notifications.filter((n: Notification) => !n.read).length 
//     : 0

//   const getNotificationIcon = (type: string) => {
//     const iconClasses = "h-4 w-4 flex-shrink-0"
//     switch (type) {
//       case 'success':
//         return <div className={`${iconClasses} bg-green-500 rounded-full`} />
//       case 'warning':
//         return <div className={`${iconClasses} bg-yellow-500 rounded-full`} />
//       case 'error':
//         return <div className={`${iconClasses} bg-red-500 rounded-full`} />
//       default:
//         return <div className={`${iconClasses} bg-blue-500 rounded-full`} />
//     }
//   }

//   const formatNotificationTime = (dateString: string) => {
//     const now = new Date()
//     const notificationDate = new Date(dateString)
//     const diffInHours = Math.floor((now.getTime() - notificationDate.getTime()) / (1000 * 60 * 60))
    
//     if (diffInHours < 1) return 'Just now'
//     if (diffInHours < 24) return `${diffInHours}h ago`
//     return notificationDate.toLocaleDateString()
//   }

//   return (
//     <header className="bg-white shadow-sm border-b border-gray-200 relative z-10 safe-area-inset-top">
//       <div className="flex items-center justify-between px-3 sm:px-4 lg:px-6 py-3 sm:py-4">
//         {/* Left Section - responsive layout */}
//         <div className="flex items-center flex-1 min-w-0">
//           {/* Mobile menu button - touch-friendly */}
//           <button
//             onClick={onMenuClick}
//             className="lg:hidden p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary-500 transition-colors touch-friendly mr-2 flex-shrink-0"
//             aria-label="Open sidebar"
//           >
//             <Bars3Icon className="h-5 w-5 sm:h-6 sm:w-6" />
//           </button>

//           {/* Search - responsive with mobile/desktop variants */}
//           <div className="flex-1 flex items-center max-w-2xl" ref={searchRef}>
//             {/* Desktop Search */}
//             <div className="hidden sm:block w-full relative">
//               <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
//                 <MagnifyingGlassIcon className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
//               </div>
//               <input
//                 type="text"
//                 placeholder="Search contacts, jobs, estimates... (⌘K)"
//                 value={searchQuery}
//                 onChange={(e) => setSearchQuery(e.target.value)}
//                 onKeyPress={(e) => e.key === 'Enter' && handleSearch(searchQuery)}
//                 onFocus={() => setShowSearch(true)}
//                 className="form-input-responsive block w-full pl-8 sm:pl-10 pr-3 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-200"
//               />
              
//               {/* Search Dropdown - responsive */}
//               {showSearch && searchQuery && (
//                 <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-lg shadow-lg border border-gray-200 py-2 max-h-80 sm:max-h-96 overflow-y-auto z-50">
//                   <div className="px-3 sm:px-4 py-2 text-xs sm:text-sm text-gray-500">
//                     Search results for "{searchQuery}"
//                   </div>
//                   <div className="px-3 sm:px-4 py-6 sm:py-8 text-center text-gray-500">
//                     <MagnifyingGlassIcon className="h-6 w-6 sm:h-8 sm:w-8 mx-auto mb-2 text-gray-300" />
//                     <p className="text-sm">No results found</p>
//                     <p className="text-xs mt-1">Try a different search term</p>
//                   </div>
//                 </div>
//               )}
//             </div>

//             {/* Mobile Search Button */}
//             <button
//               onClick={() => setShowSearch(!showSearch)}
//               className="sm:hidden p-2 text-gray-400 hover:text-gray-500 hover:bg-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors touch-friendly"
//               aria-label="Search"
//             >
//               <MagnifyingGlassIcon className="h-5 w-5" />
//             </button>
//           </div>
//         </div>

//         {/* Right Section - responsive spacing and sizing */}
//         <div className="flex items-center space-x-1 sm:space-x-2 lg:space-x-4 flex-shrink-0">
//           {/* Dark Mode Toggle - hidden on small screens */}
//           <button
//             onClick={() => setDarkMode(!darkMode)}
//             className="hidden sm:flex p-2 text-gray-400 hover:text-gray-500 hover:bg-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors touch-friendly"
//             aria-label="Toggle dark mode"
//           >
//             {darkMode ? (
//               <SunIcon className="h-4 w-4 sm:h-5 sm:w-5" />
//             ) : (
//               <MoonIcon className="h-4 w-4 sm:h-5 sm:w-5" />
//             )}
//           </button>

//           {/* Notifications - responsive dropdown */}
//           <div className="relative" ref={notificationRef}>
//             <button
//               onClick={() => setShowNotifications(!showNotifications)}
//               className="p-2 text-gray-400 hover:text-gray-500 hover:bg-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors relative touch-friendly"
//               aria-label={`Notifications ${unreadNotifications > 0 ? `(${unreadNotifications} unread)` : ''}`}
//             >
//               <BellIcon className="h-4 w-4 sm:h-5 sm:w-5" />
//               {unreadNotifications > 0 && (
//                 <span className="absolute -top-0.5 -right-0.5 sm:-top-1 sm:-right-1 h-4 w-4 sm:h-5 sm:w-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-medium">
//                   {unreadNotifications > 9 ? '9+' : unreadNotifications}
//                 </span>
//               )}
//             </button>

//             {/* Notifications Dropdown - responsive */}
//             {showNotifications && (
//               <div className="absolute right-0 mt-2 w-72 sm:w-80 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50 max-h-96 overflow-hidden">
//                 <div className="px-3 sm:px-4 py-3 border-b border-gray-200">
//                   <div className="flex items-center justify-between">
//                     <h3 className="text-sm font-medium text-gray-900">Notifications</h3>
//                     {unreadNotifications > 0 && (
//                       <span className="text-xs text-primary-600 font-medium">
//                         {unreadNotifications} new
//                       </span>
//                     )}
//                   </div>
//                 </div>
                
//                 <div className="max-h-80 overflow-y-auto">
//                   {notificationsLoading ? (
//                     <div className="px-4 py-8 text-center">
//                       <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600 mx-auto"></div>
//                     </div>
//                   ) : Array.isArray(notifications) && notifications.length > 0 ? (
//                     notifications.slice(0, 10).map((notification: Notification) => (
//                       <div
//                         key={notification.id}
//                         className={`px-3 sm:px-4 py-3 hover:bg-gray-50 cursor-pointer transition-colors ${
//                           !notification.read ? 'bg-blue-50' : ''
//                         }`}
//                       >
//                         <div className="flex items-start space-x-2 sm:space-x-3">
//                           {getNotificationIcon(notification.type)}
//                           <div className="flex-1 min-w-0">
//                             <p className={`text-xs sm:text-sm ${!notification.read ? 'font-medium text-gray-900' : 'text-gray-700'}`}>
//                               {notification.title}
//                             </p>
//                             <p className="text-xs text-gray-500 mt-1 line-clamp-2">
//                               {notification.message}
//                             </p>
//                             <p className="text-xs text-gray-400 mt-1">
//                               {formatNotificationTime(notification.created_at)}
//                             </p>
//                           </div>
//                           {!notification.read && (
//                             <div className="h-2 w-2 bg-blue-600 rounded-full flex-shrink-0 mt-1"></div>
//                           )}
//                         </div>
//                       </div>
//                     ))
//                   ) : (
//                     <div className="px-4 py-8 text-center text-gray-500">
//                       <BellIcon className="h-6 w-6 sm:h-8 sm:w-8 mx-auto mb-2 text-gray-300" />
//                       <p className="text-sm">No notifications</p>
//                       <p className="text-xs mt-1">You're all caught up!</p>
//                     </div>
//                   )}
//                 </div>
                
//                 {Array.isArray(notifications) && notifications.length > 10 && (
//                   <div className="px-3 sm:px-4 py-3 border-t border-gray-200">
//                     <button className="text-sm text-primary-600 hover:text-primary-800 font-medium touch-friendly">
//                       View all notifications
//                     </button>
//                   </div>
//                 )}
//               </div>
//             )}
//           </div>

//           {/* User Menu - UPDATED WITH WHITE BACKGROUND */}
//           <div className="relative" ref={userMenuRef}>
//             <button
//               onClick={() => setShowUserMenu(!showUserMenu)}
//               className="flex items-center space-x-2 sm:space-x-3 text-sm rounded-lg p-1.5 sm:p-2 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors touch-friendly"
//               aria-label="User menu"
//             >
//               {/* WHITE AVATAR WITH BORDER */}
//               <div className="h-7 w-7 sm:h-8 sm:w-8 rounded-full bg-white border-2 border-gray-300 flex items-center justify-center flex-shrink-0 shadow-sm relative">
//                 <span className="text-gray-700 font-medium text-xs sm:text-sm">
//                   {user?.name?.split(' ').map(n => n[0]).join('').toUpperCase()}
//                 </span>
//                 {/* Green online status dot */}
//                 <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 bg-green-400 rounded-full ring-2 ring-white"></div>
//               </div>
//               <div className="hidden md:block text-left min-w-0">
//                 <p className="text-gray-700 font-medium text-sm truncate">{user?.name}</p>
//                 <p className="text-gray-500 text-xs truncate capitalize">{user?.role}</p>
//               </div>
//               <ChevronDownIcon className="h-3 w-3 sm:h-4 sm:w-4 text-gray-400 hidden md:block flex-shrink-0" />
//             </button>

//             {/* User Dropdown */}
//             {showUserMenu && (
//               <div className="absolute right-0 mt-2 w-52 sm:w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
//                 <div className="px-3 sm:px-4 py-3 border-b border-gray-200">
//                   <div className="flex items-center space-x-3">
//                     {/* WHITE AVATAR IN DROPDOWN TOO */}
//                     <div className="h-10 w-10 rounded-full bg-white border-2 border-gray-300 flex items-center justify-center shadow-sm">
//                       <span className="text-black font-medium text-base">
//                         {user?.name?.split(' ').map(n => n[0]).join('').toUpperCase()}
//                       </span>
//                     </div>
//                     <div className="flex-1 min-w-0">
//                       <p className="text-sm font-medium text-gray-900 truncate">{user?.name}</p>
//                       <p className="text-sm text-gray-500 truncate">{user?.email}</p>
//                       <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-primary-100 text-primary-800 mt-1 capitalize">
//                         {user?.role}
//                       </span>
//                     </div>
//                   </div>
//                 </div>
                
//                 <div className="py-1">
//                   <button
//                     onClick={() => {
//                       setShowUserMenu(false)
//                       // Navigate to profile
//                     }}
//                     className="flex items-center w-full px-3 sm:px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors touch-friendly"
//                   >
//                     <UserCircleIcon className="h-4 w-4 mr-3 text-gray-400 flex-shrink-0" />
//                     Your Profile
//                   </button>
                  
//                   <button
//                     onClick={() => {
//                       setShowUserMenu(false)
//                       // Navigate to settings
//                     }}
//                     className="flex items-center w-full px-3 sm:px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors touch-friendly"
//                   >
//                     <Cog6ToothIcon className="h-4 w-4 mr-3 text-gray-400 flex-shrink-0" />
//                     Settings
//                   </button>
//                 </div>
                
//                 <div className="border-t border-gray-200 py-1">
//                   <button
//                     onClick={() => {
//                       logout()
//                       setShowUserMenu(false)
//                     }}
//                     className="flex items-center w-full px-3 sm:px-4 py-2 text-sm text-red-700 hover:bg-red-50 transition-colors touch-friendly"
//                   >
//                     <ArrowRightOnRectangleIcon className="h-4 w-4 mr-3 text-red-400 flex-shrink-0" />
//                     Sign out
//                   </button>
//                 </div>
//               </div>
//             )}
//           </div>
//         </div>
//       </div>

//       {/* Mobile Search Bar - enhanced responsiveness */}
//       {showSearch && (
//         <div className="sm:hidden border-t border-gray-200 px-3 py-3 animate-slide-in-down">
//           <div className="relative">
//             <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
//               <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
//             </div>
//             <input
//               type="text"
//               placeholder="Search..."
//               value={searchQuery}
//               onChange={(e) => setSearchQuery(e.target.value)}
//               onKeyPress={(e) => e.key === 'Enter' && handleSearch(searchQuery)}
//               className="form-input-responsive block w-full pl-10 pr-3 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
//               autoFocus
//             />
//           </div>
          
//           {/* Mobile Search Results */}
//           {searchQuery && (
//             <div className="mt-2 bg-white rounded-lg shadow-lg border border-gray-200 py-2 max-h-64 overflow-y-auto">
//               <div className="px-3 py-2 text-xs text-gray-500">
//                 Search results for "{searchQuery}"
//               </div>
//               <div className="px-3 py-6 text-center text-gray-500">
//                 <MagnifyingGlassIcon className="h-6 w-6 mx-auto mb-2 text-gray-300" />
//                 <p className="text-sm">No results found</p>
//                 <p className="text-xs mt-1">Try a different search term</p>
//               </div>
//             </div>
//           )}
//         </div>
//       )}
//     </header>
//   )
// }
























































































// frontend/src/components/layout/Header.tsx - WITH PROFILE NAVIGATION
import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'
import { 
  Bars3Icon, 
  BellIcon, 
  MagnifyingGlassIcon,
  UserCircleIcon,
  Cog6ToothIcon,
  ArrowRightOnRectangleIcon,
  ChevronDownIcon,
  SunIcon,
  MoonIcon
} from '@heroicons/react/24/outline'
import { useQuery } from '@tanstack/react-query'
import { getStaticAssetUrl } from '../../services/api'

interface HeaderProps {
  onMenuClick: () => void
}

interface Notification {
  id: string
  title: string
  message: string
  type: 'info' | 'warning' | 'success' | 'error'
  created_at: string
  read: boolean
}

export default function Header({ onMenuClick }: HeaderProps) {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [showNotifications, setShowNotifications] = useState(false)
  const [showSearch, setShowSearch] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [darkMode, setDarkMode] = useState(false)
  
  const userMenuRef = useRef<HTMLDivElement>(null)
  const notificationRef = useRef<HTMLDivElement>(null)
  const searchRef = useRef<HTMLDivElement>(null)

  const { data: notificationsData, isLoading: notificationsLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: async () => {
      return { notifications: [], unread_count: 0 }
    },
    enabled: false,
    refetchInterval: 30000
  })

  const notifications = notificationsData?.notifications || []

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false)
      }
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setShowNotifications(false)
      }
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSearch(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  const handleSearch = (query: string) => {
    if (query.trim()) {
      console.log('Searching for:', query)
      // You can implement global search functionality here
    }
  }

  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key === 'k') {
        event.preventDefault()
        setShowSearch(true)
        searchRef.current?.querySelector('input')?.focus()
      }
      if (event.key === 'Escape') {
        setShowUserMenu(false)
        setShowNotifications(false)
        setShowSearch(false)
      }
    }
    document.addEventListener('keydown', handleKeyPress)
    return () => {
      document.removeEventListener('keydown', handleKeyPress)
    }
  }, [])

  // Navigation handlers
  const handleProfileClick = () => {
    setShowUserMenu(false)
    navigate('/settings/profile')
  }

  const handleSettingsClick = () => {
    setShowUserMenu(false)
    navigate('/settings/profile') // Can also navigate to a general settings page if you have one
  }

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const unreadNotifications = Array.isArray(notifications) 
    ? notifications.filter((n: Notification) => !n.read).length 
    : 0

  const getNotificationIcon = (type: string) => {
    const iconClasses = "h-4 w-4 flex-shrink-0"
    switch (type) {
      case 'success':
        return <div className={`${iconClasses} bg-green-500 rounded-full`} />
      case 'warning':
        return <div className={`${iconClasses} bg-yellow-500 rounded-full`} />
      case 'error':
        return <div className={`${iconClasses} bg-red-500 rounded-full`} />
      default:
        return <div className={`${iconClasses} bg-blue-500 rounded-full`} />
    }
  }

  const formatNotificationTime = (dateString: string) => {
    const now = new Date()
    const notificationDate = new Date(dateString)
    const diffInHours = Math.floor((now.getTime() - notificationDate.getTime()) / (1000 * 60 * 60))
    if (diffInHours < 1) return 'Just now'
    if (diffInHours < 24) return `${diffInHours}h ago`
    return notificationDate.toLocaleDateString()
  }

  // Generate user initials
  const getUserInitials = () => {
    if (user?.name) {
      return user.name
        .split(' ')
        .map((n: string) => n[0])
        .join('')
        .toUpperCase()
    }
    return user?.email?.[0]?.toUpperCase() || 'U'
  }

  return (
    <header className="bg-white shadow-sm border-b border-gray-200 relative z-10 safe-area-inset-top">
      <div className="flex items-center justify-between px-3 sm:px-4 lg:px-6 py-3 sm:py-4">
        {/* Left Section */}
        <div className="flex items-center flex-1 min-w-0">
          <button
            onClick={onMenuClick}
            className="lg:hidden p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:ring-2 focus:ring-inset focus:ring-blue-500 mr-2 transition-colors"
          >
            <Bars3Icon className="h-5 w-5 sm:h-6 sm:w-6" />
          </button>

          <div className="flex-1 flex items-center max-w-2xl" ref={searchRef}>
            <div className="hidden sm:block w-full relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <MagnifyingGlassIcon className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search contacts, jobs, estimates... (⌘K)"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch(searchQuery)}
                onFocus={() => setShowSearch(true)}
                className="block w-full pl-8 sm:pl-10 pr-3 py-2 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-sm"
              />
            </div>
            <button
              onClick={() => setShowSearch(!showSearch)}
              className="sm:hidden p-2 text-gray-400 hover:text-gray-500 hover:bg-gray-100 rounded-lg focus:ring-2 focus:ring-blue-500 transition-colors"
            >
              <MagnifyingGlassIcon className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Right Section */}
        <div className="flex items-center space-x-2 sm:space-x-3">
          {/* Dark Mode Toggle */}
          <button
            onClick={() => setDarkMode(!darkMode)}
            className="hidden sm:flex p-2 text-gray-400 hover:text-gray-500 hover:bg-gray-100 rounded-lg focus:ring-2 focus:ring-blue-500 transition-colors"
            title={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {darkMode ? <SunIcon className="h-4 w-4" /> : <MoonIcon className="h-4 w-4" />}
          </button>

          {/* Notifications */}
          <div className="relative" ref={notificationRef}>
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="p-2 text-gray-400 hover:text-gray-500 hover:bg-gray-100 rounded-lg relative transition-colors focus:ring-2 focus:ring-blue-500"
              title="Notifications"
            >
              <BellIcon className="h-4 w-4" />
              {unreadNotifications > 0 && (
                <span className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-medium">
                  {unreadNotifications > 9 ? '9+' : unreadNotifications}
                </span>
              )}
            </button>

            {/* Notifications Dropdown */}
            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-lg shadow-lg border py-2 z-50 max-h-96 overflow-y-auto">
                <div className="px-4 py-2 border-b">
                  <h3 className="text-sm font-semibold text-gray-900">Notifications</h3>
                  {unreadNotifications > 0 && (
                    <p className="text-xs text-gray-500">{unreadNotifications} unread</p>
                  )}
                </div>
                {notifications.length === 0 ? (
                  <div className="px-4 py-8 text-center">
                    <BellIcon className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                    <p className="text-sm text-gray-500">No notifications yet</p>
                  </div>
                ) : (
                  <div className="max-h-64 overflow-y-auto">
                    {notifications.map((notification: Notification) => (
                      <div
                        key={notification.id}
                        className={`px-4 py-3 hover:bg-gray-50 border-b border-gray-100 ${
                          !notification.read ? 'bg-blue-50' : ''
                        }`}
                      >
                        <div className="flex items-start space-x-3">
                          {getNotificationIcon(notification.type)}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900">
                              {notification.title}
                            </p>
                            <p className="text-sm text-gray-600 mt-1">
                              {notification.message}
                            </p>
                            <p className="text-xs text-gray-400 mt-2">
                              {formatNotificationTime(notification.created_at)}
                            </p>
                          </div>
                          {!notification.read && (
                            <div className="h-2 w-2 bg-blue-600 rounded-full"></div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* User Menu */}
          <div className="relative" ref={userMenuRef}>
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center space-x-2 text-sm rounded-lg p-1.5 hover:bg-gray-100 transition-colors focus:ring-2 focus:ring-blue-500"
              title="User menu"
            >
              <div className="h-7 w-7 sm:h-8 sm:w-8 rounded-full border-2 border-gray-300 flex items-center justify-center shadow-sm overflow-hidden bg-gradient-to-br from-blue-500 to-blue-600">
                {user?.avatar_url ? (
                  <img
                    src={getStaticAssetUrl(user.avatar_url)}
                    alt="User Avatar"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span className="text-white font-semibold text-xs sm:text-sm">
                    {getUserInitials()}
                  </span>
                )}
              </div>
              <div className="hidden md:block text-left">
                <p className="text-gray-700 font-medium text-sm truncate max-w-32">
                  {user?.name}
                </p>
                <p className="text-gray-500 text-xs capitalize">{user?.role}</p>
              </div>
              <ChevronDownIcon className="h-3 w-3 text-gray-400 hidden md:block" />
            </button>

            {/* User Dropdown Menu */}
            {showUserMenu && (
              <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border py-1 z-50">
                {/* User Info Section */}
                <div className="px-4 py-3 border-b border-gray-100">
                  <div className="flex items-center space-x-3">
                    <div className="h-10 w-10 rounded-full border-2 border-gray-300 flex items-center justify-center shadow-sm overflow-hidden bg-gradient-to-br from-blue-500 to-blue-600">
                      {user?.avatar_url ? (
                        <img
                          src={getStaticAssetUrl(user.avatar_url)}
                          alt="User Avatar"
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <span className="text-white font-semibold text-base">
                          {getUserInitials()}
                        </span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {user?.name}
                      </p>
                      <p className="text-sm text-gray-500 truncate">{user?.email}</p>
                      <p className="text-xs text-gray-400 capitalize">{user?.role}</p>
                    </div>
                  </div>
                </div>

                {/* Menu Items */}
                <div className="py-1">
                  <button 
                    onClick={handleProfileClick}
                    className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                  >
                    <UserCircleIcon className="h-4 w-4 mr-3 text-gray-400" />
                    Your Profile
                  </button>
                  <button 
                    onClick={handleSettingsClick}
                    className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                  >
                    <Cog6ToothIcon className="h-4 w-4 mr-3 text-gray-400" />
                    Settings
                  </button>
                </div>

                {/* Logout Section */}
                <div className="border-t border-gray-100 py-1">
                  <button
                    onClick={handleLogout}
                    className="flex items-center w-full px-4 py-2 text-sm text-red-700 hover:bg-red-50 transition-colors"
                  >
                    <ArrowRightOnRectangleIcon className="h-4 w-4 mr-3 text-red-400" />
                    Sign out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Search Overlay */}
      {showSearch && (
        <div className="sm:hidden absolute top-full left-0 right-0 bg-white border-b border-gray-200 p-4 z-40">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch(searchQuery)}
              className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base"
              autoFocus
            />
          </div>
        </div>
      )}
    </header>
  )
}