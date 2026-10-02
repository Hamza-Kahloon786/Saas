// src/components/ContactForm.tsx
import React, { useState } from "react";

interface ContactFormProps {
  onClose: () => void;
}

interface FormData {
  name: string;
  businessName: string;
  phone: string;
  email: string;
  inquiry: string;
}

export default function ContactForm({ onClose }: ContactFormProps) {
  const [formData, setFormData] = useState<FormData>({
    name: "",
    businessName: "",
    phone: "",
    email: "",
    inquiry: "",
  });
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submitStatus, setSubmitStatus] = useState<"idle" | "success" | "error">("idle");

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus("idle");

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || "http://localhost:8000"}/api/v1/contact`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setSubmitStatus("success");
        setFormData({
          name: "",
          businessName: "",
          phone: "",
          email: "",
          inquiry: "",
        });
        setTimeout(() => {
          onClose();
        }, 2000);
      } else {
        setSubmitStatus("error");
      }
    } catch (error) {
      console.error("Error submitting contact form:", error);
      setSubmitStatus("error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full max-h-[85vh] overflow-y-auto">
      <h2 className="text-2xl font-bold text-[#0F1724] mb-2">Contact Us</h2>
      <p className="text-[#6B7280] mb-4">
        Have questions? We'd love to hear from you. Fill out the form below and we'll get back to you soon.
      </p>

      <form onSubmit={handleSubmit} className="space-y-3">
        {/* Name */}
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-[#0F1724] mb-1">
            Name *
          </label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0038FF] focus:border-transparent"
            placeholder="John Doe"
          />
        </div>

        {/* Business Name */}
        <div>
          <label htmlFor="businessName" className="block text-sm font-medium text-[#0F1724] mb-1">
            Business Name *
          </label>
          <input
            type="text"
            id="businessName"
            name="businessName"
            value={formData.businessName}
            onChange={handleChange}
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0038FF] focus:border-transparent"
            placeholder="Your Company LLC"
          />
        </div>

        {/* Phone Number */}
        <div>
          <label htmlFor="phone" className="block text-sm font-medium text-[#0F1724] mb-1">
            Phone Number *
          </label>
          <input
            type="tel"
            id="phone"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0038FF] focus:border-transparent"
            placeholder="(555) 123-4567"
          />
        </div>

        {/* Email Address */}
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-[#0F1724] mb-1">
            Email Address *
          </label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0038FF] focus:border-transparent"
            placeholder="john@example.com"
          />
        </div>

        {/* Inquiry */}
        <div>
          <label htmlFor="inquiry" className="block text-sm font-medium text-[#0F1724] mb-1">
            Your Inquiry *
          </label>
          <textarea
            id="inquiry"
            name="inquiry"
            value={formData.inquiry}
            onChange={handleChange}
            required
            rows={4}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0038FF] focus:border-transparent resize-none"
            placeholder="Tell us how we can help you..."
          />
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-[#0038FF] text-white px-6 py-3 rounded-lg shadow hover:opacity-90 transition font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? "Sending..." : "Send Message"}
        </button>

        {/* Status Messages */}
        {submitStatus === "success" && (
          <p className="text-green-600 text-sm text-center">
            ✓ Message sent successfully! We'll be in touch soon.
          </p>
        )}
        {submitStatus === "error" && (
          <p className="text-red-600 text-sm text-center">
            ✗ Something went wrong. Please try again or email us directly at Renato@stormai.net
          </p>
        )}
      </form>
    </div>
  );
}