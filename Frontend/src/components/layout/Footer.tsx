// frontend/src/components/layout/Footer.tsx
import { useState } from 'react'
import { 
  HeartIcon,
  GlobeAltIcon,
  PhoneIcon,
  EnvelopeIcon,
  ChatBubbleLeftRightIcon,
  QuestionMarkCircleIcon,
  DocumentTextIcon,
  ShieldCheckIcon,
  CogIcon
} from '@heroicons/react/24/outline'

export default function Footer() {
  const [showSupportModal, setShowSupportModal] = useState(false)
  const currentYear = new Date().getFullYear()

  const footerLinks = {
    product: [
      { name: 'Features', href: '#' },
      { name: 'Pricing', href: '#' },
      { name: 'API Documentation', href: '#' },
      { name: 'Integrations', href: '#' },
      { name: 'Mobile App', href: '#' },
    ],
    support: [
      { name: 'Help Center', href: '#' },
      { name: 'Contact Support', href: '#', action: () => setShowSupportModal(true) },
      { name: 'System Status', href: '#' },
      { name: 'Release Notes', href: '#' },
      { name: 'Training Videos', href: '#' },
    ],
    company: [
      { name: 'About Us', href: '#' },
      { name: 'Blog', href: '#' },
      { name: 'Careers', href: '#' },
      { name: 'Partners', href: '#' },
      { name: 'Press Kit', href: '#' },
    ],
    legal: [
      { name: 'Privacy Policy', href: '#' },
      { name: 'Terms of Service', href: '#' },
      { name: 'Cookie Policy', href: '#' },
      { name: 'Security', href: '#' },
      { name: 'GDPR', href: '#' },
    ]
  }

  const socialLinks = [
    { name: 'Twitter', href: '#', icon: '🐦' },
    { name: 'LinkedIn', href: '#', icon: '💼' },
    { name: 'Facebook', href: '#', icon: '📘' },
    { name: 'YouTube', href: '#', icon: '📺' },
  ]

  return (
    <>
      <footer className="bg-gray-50 border-t border-gray-200">
        {/* Main Footer Content */}
        <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {/* Product */}
            <div>
              <h3 className="text-sm font-semibold text-gray-900 tracking-wider uppercase mb-4">
                Product
              </h3>
              <ul className="space-y-3">
                {footerLinks.product.map((link) => (
                  <li key={link.name}>
                    <a
                      href={link.href}
                      className="text-sm text-gray-600 hover:text-primary-600 transition-colors duration-200"
                    >
                      {link.name}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Support */}
            <div>
              <h3 className="text-sm font-semibold text-gray-900 tracking-wider uppercase mb-4">
                Support
              </h3>
              <ul className="space-y-3">
                {footerLinks.support.map((link) => (
                  <li key={link.name}>
                    {link.action ? (
                      <button
                        onClick={link.action}
                        className="text-sm text-gray-600 hover:text-primary-600 transition-colors duration-200"
                      >
                        {link.name}
                      </button>
                    ) : (
                      <a
                        href={link.href}
                        className="text-sm text-gray-600 hover:text-primary-600 transition-colors duration-200"
                      >
                        {link.name}
                      </a>
                    )}
                  </li>
                ))}
              </ul>
            </div>

            {/* Company */}
            <div>
              <h3 className="text-sm font-semibold text-gray-900 tracking-wider uppercase mb-4">
                Company
              </h3>
              <ul className="space-y-3">
                {footerLinks.company.map((link) => (
                  <li key={link.name}>
                    <a
                      href={link.href}
                      className="text-sm text-gray-600 hover:text-primary-600 transition-colors duration-200"
                    >
                      {link.name}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Legal */}
            <div>
              <h3 className="text-sm font-semibold text-gray-900 tracking-wider uppercase mb-4">
                Legal
              </h3>
              <ul className="space-y-3">
                {footerLinks.legal.map((link) => (
                  <li key={link.name}>
                    <a
                      href={link.href}
                      className="text-sm text-gray-600 hover:text-primary-600 transition-colors duration-200"
                    >
                      {link.name}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Newsletter Signup */}
          <div className="mt-12 pt-8 border-t border-gray-200">
            <div className="md:flex md:items-center md:justify-between">
              <div className="md:flex-1">
                <h3 className="text-sm font-semibold text-gray-900 tracking-wider uppercase mb-2">
                  Stay Updated
                </h3>
                <p className="text-sm text-gray-600 mb-4 md:mb-0">
                  Get the latest features, tips, and insights delivered to your inbox.
                </p>
              </div>
              <div className="md:ml-8 md:flex-shrink-0">
                <div className="flex">
                  <input
                    type="email"
                    placeholder="Enter your email"
                    className="min-w-0 flex-1 px-4 py-2 border border-gray-300 rounded-l-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm"
                  />
                  <button className="px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-r-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors duration-200">
                    Subscribe
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Footer */}
        <div className="border-t border-gray-200 bg-white">
          <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
            <div className="md:flex md:items-center md:justify-between">
              {/* Logo and Copyright */}
              <div className="flex items-center space-x-4">
                <div className="flex items-center">
                  <div className="h-8 w-8 bg-primary-600 rounded-lg flex items-center justify-center">
                    <span className="text-white font-bold text-sm">S</span>
                  </div>
                  <span className="ml-2 text-lg font-bold text-gray-900">STORM AI</span>
                </div>
                <div className="hidden sm:block text-sm text-gray-500">
                  © {currentYear} STORM AI. All rights reserved.
                </div>
              </div>

              {/* Social Links and Status */}
              <div className="mt-4 md:mt-0 flex items-center space-x-6">
                {/* System Status Indicator */}
                <div className="flex items-center text-sm text-gray-600">
                  <div className="h-2 w-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
                  <span>All systems operational</span>
                </div>

                {/* Social Links */}
                <div className="flex items-center space-x-3">
                  {socialLinks.map((social) => (
                    <a
                      key={social.name}
                      href={social.href}
                      className="text-gray-400 hover:text-gray-500 transition-colors duration-200"
                      title={social.name}
                    >
                      <span className="text-lg">{social.icon}</span>
                    </a>
                  ))}
                </div>
              </div>
            </div>

            {/* Mobile Copyright */}
            <div className="sm:hidden mt-4 text-sm text-gray-500 text-center">
              © {currentYear} STORM AI. All rights reserved.
            </div>
          </div>
        </div>

        {/* Quick Access Toolbar */}
        <div className="fixed bottom-6 right-6 z-40">
          <div className="flex flex-col space-y-2">
            {/* Help Button */}
            <button
              onClick={() => setShowSupportModal(true)}
              className="h-12 w-12 bg-primary-600 text-white rounded-full shadow-lg hover:bg-primary-700 transition-all duration-200 hover:scale-110 flex items-center justify-center group"
              title="Need Help?"
            >
              <QuestionMarkCircleIcon className="h-6 w-6" />
            </button>

            {/* Feedback Button */}
            <button
              className="h-12 w-12 bg-gray-600 text-white rounded-full shadow-lg hover:bg-gray-700 transition-all duration-200 hover:scale-110 flex items-center justify-center group"
              title="Send Feedback"
            >
              <ChatBubbleLeftRightIcon className="h-6 w-6" />
            </button>
          </div>
        </div>
      </footer>

      {/* Support Modal */}
      {showSupportModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div 
                className="absolute inset-0 bg-gray-500 opacity-75" 
                onClick={() => setShowSupportModal(false)}
              ></div>
            </div>
            
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-primary-100 sm:mx-0 sm:h-10 sm:w-10">
                    <QuestionMarkCircleIcon className="h-6 w-6 text-primary-600" />
                  </div>
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left flex-1">
                    <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                      How can we help you?
                    </h3>
                    
                    <div className="space-y-3">
                      <button className="w-full flex items-center p-3 text-left text-sm text-gray-700 hover:bg-gray-50 rounded-md transition-colors">
                        <DocumentTextIcon className="h-5 w-5 text-gray-400 mr-3" />
                        Browse Help Center
                      </button>
                      
                      <button className="w-full flex items-center p-3 text-left text-sm text-gray-700 hover:bg-gray-50 rounded-md transition-colors">
                        <ChatBubbleLeftRightIcon className="h-5 w-5 text-gray-400 mr-3" />
                        Start Live Chat
                      </button>
                      
                      <button className="w-full flex items-center p-3 text-left text-sm text-gray-700 hover:bg-gray-50 rounded-md transition-colors">
                        <EnvelopeIcon className="h-5 w-5 text-gray-400 mr-3" />
                        Send Email Support
                      </button>
                      
                      <button className="w-full flex items-center p-3 text-left text-sm text-gray-700 hover:bg-gray-50 rounded-md transition-colors">
                        <PhoneIcon className="h-5 w-5 text-gray-400 mr-3" />
                        Schedule Phone Call
                      </button>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  onClick={() => setShowSupportModal(false)}
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 sm:mt-0 sm:w-auto sm:text-sm"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}