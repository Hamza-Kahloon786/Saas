// src/components/Navbar.tsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FiMenu, FiX } from "react-icons/fi";
import FreeTrialForm from "./FreeTrialForm";
import ContactForm from "./ContactForm";

interface NavbarProps {}

export default function Navbar({}: NavbarProps) {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [showForm, setShowForm] = useState<boolean>(false);
  const [showContactForm, setShowContactForm] = useState<boolean>(false);
  const navigate = useNavigate();

  const openForm = () => {
    navigate('/register');
    setIsOpen(false);
  };

  const closeForm = () => {
    setShowForm(false);
  };

  const openContactForm = () => {
    setShowContactForm(true);
    setIsOpen(false);
  };

  const closeContactForm = () => {
    setShowContactForm(false);
  };

  const handleLogin = () => {
    navigate('/login');
  };

  return (
    <>
      <nav className="bg-white fixed top-0 left-0 w-full z-50 shadow-sm border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <a href="/" className="flex items-center gap-2">
              <img src="/Storm AI Logo.png" alt="Logo" className="h-40 w-auto" />
            </a>

            <div className="hidden md:flex items-center gap-8">
              <a href="#features" className="text-[#0F1724] hover:text-[#0038FF] transition">
                Features
              </a>
              <a href="#industries" className="text-[#0F1724] hover:text-[#0038FF] transition">
                Industries
              </a>
              <a href="#pricing" className="text-[#0F1724] hover:text-[#0038FF] transition">
                Pricing
              </a>
              <button onClick={openContactForm} className="text-[#0F1724] hover:text-[#0038FF] transition">
                Contact Us
              </button>
              <button onClick={handleLogin} className="text-[#0F1724] hover:text-[#0038FF] transition font-medium">
                Login
              </button>
              <button onClick={openForm} className="bg-[#0038FF] text-white px-4 py-2 rounded-lg shadow hover:opacity-90 transition">
                Start Free Trial
              </button>
            </div>

            <div className="md:hidden">
              <button onClick={() => setIsOpen(!isOpen)} aria-label="Toggle menu">
                {isOpen ? (
                  <FiX size={24} className="text-[#0F1724]" />
                ) : (
                  <FiMenu size={24} className="text-[#0F1724]" />
                )}
              </button>
            </div>
          </div>
        </div>

        {isOpen && (
          <div className="md:hidden bg-white border-t border-gray-200 shadow-sm">
            <div className="px-4 py-4 space-y-3">
              <a href="#features" onClick={() => setIsOpen(false)} className="block text-[#0F1724] hover:text-[#0038FF] transition">
                Features
              </a>
              <a href="#industries" onClick={() => setIsOpen(false)} className="block text-[#0F1724] hover:text-[#0038FF] transition">
                Industries
              </a>
              <a href="#pricing" onClick={() => setIsOpen(false)} className="block text-[#0F1724] hover:text-[#0038FF] transition">
                Pricing
              </a>
              <button onClick={openContactForm} className="block text-[#0F1724] hover:text-[#0038FF] transition w-full text-left">
                Contact Us
              </button>
              <button onClick={handleLogin} className="block text-[#0F1724] hover:text-[#0038FF] transition font-medium w-full text-left">
                Login
              </button>
              <button onClick={openForm} className="block bg-[#0038FF] text-white px-4 py-2 rounded-lg text-center w-full hover:opacity-90 transition">
                Start Free Trial
              </button>
            </div>
          </div>
        )}
      </nav>

      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-lg w-full relative shadow-lg">
            <button onClick={closeForm} className="absolute top-3 right-3 text-gray-600 hover:text-gray-900 text-2xl font-bold" aria-label="Close modal">
              &times;
            </button>
            <FreeTrialForm />
          </div>
        </div>
      )}

      {showContactForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-lg w-full relative shadow-lg">
            <button onClick={closeContactForm} className="absolute top-3 right-3 text-gray-600 hover:text-gray-900 text-2xl font-bold" aria-label="Close modal">
              &times;
            </button>
            <ContactForm onClose={closeContactForm} />
          </div>
        </div>
      )}
    </>
  );
}