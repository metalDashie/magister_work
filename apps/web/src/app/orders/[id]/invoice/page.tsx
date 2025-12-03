'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAuthStore } from '@/lib/store/authStore'
import { api } from '@/lib/api'
import { formatPrice } from '@fullmag/common'

interface Invoice {
  invoiceNumber: string
  orderNumber: string
  date: string
  status: string
  paymentMethod: string
  customer: {
    name: string
    email: string
    phone: string
  }
  delivery: {
    type: string
    city: string
    warehouse?: string
    address?: string
  }
  items: Array<{
    name: string
    sku?: string
    quantity: number
    price: number
    total: number
  }>
  subtotal: number
  shipping: number
  total: number
  company: {
    name: string
    address: string
    phone: string
    email: string
  }
}

export default function InvoicePage() {
  const params = useParams()
  const router = useRouter()
  const { isAuthenticated, isLoading: authLoading } = useAuthStore()
  const [invoice, setInvoice] = useState<Invoice | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      console.log('[REDIRECT] orders/[id]/invoice/page.tsx -> /auth/login', {
        authLoading,
        isAuthenticated,
      })
      // router.push('/auth/login')
    }
  }, [isAuthenticated, authLoading, router])

  useEffect(() => {
    if (isAuthenticated && params.id) {
      fetchInvoice()
    }
  }, [isAuthenticated, params.id])

  const fetchInvoice = async () => {
    try {
      setLoading(true)
      const res = await api.get(`/orders/${params.id}/invoice`)
      setInvoice(res.data)
    } catch (error) {
      console.error('Failed to fetch invoice:', error)
    } finally {
      setLoading(false)
    }
  }

  const handlePrint = () => {
    window.print()
  }

  if (authLoading || loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-xl">Loading invoice...</div>
      </div>
    )
  }

  if (!invoice) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="text-center text-gray-500">Invoice not found</div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Print Button - Hide on print */}
      <div className="print:hidden mb-6 flex justify-end gap-4">
        <button
          onClick={() => router.back()}
          className="px-4 py-2 text-gray-600 hover:text-gray-800"
        >
          Back
        </button>
        <button
          onClick={handlePrint}
          className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
        >
          Print Invoice
        </button>
      </div>

      {/* Invoice Content */}
      <div className="bg-white rounded-lg shadow-lg p-8 print:shadow-none">
        {/* Header */}
        <div className="flex justify-between items-start mb-8">
          <div>
            <h1 className="text-3xl font-bold text-primary-600">
              {invoice.company.name}
            </h1>
            <p className="text-gray-500 mt-1">{invoice.company.address}</p>
            <p className="text-gray-500">{invoice.company.phone}</p>
            <p className="text-gray-500">{invoice.company.email}</p>
          </div>
          <div className="text-right">
            <h2 className="text-2xl font-bold text-gray-800">INVOICE</h2>
            <p className="text-gray-600 mt-1">{invoice.invoiceNumber}</p>
            <p className="text-gray-500 text-sm">
              Date: {new Date(invoice.date).toLocaleDateString()}
            </p>
          </div>
        </div>

        {/* Customer & Delivery Info */}
        <div className="grid grid-cols-2 gap-8 mb-8">
          <div>
            <h3 className="text-sm font-semibold text-gray-500 uppercase mb-2">
              Bill To
            </h3>
            <p className="font-semibold">{invoice.customer.name}</p>
            <p className="text-gray-600">{invoice.customer.email}</p>
            <p className="text-gray-600">{invoice.customer.phone}</p>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-500 uppercase mb-2">
              Ship To
            </h3>
            <p className="font-semibold">{invoice.delivery.city}</p>
            {invoice.delivery.warehouse && (
              <p className="text-gray-600">{invoice.delivery.warehouse}</p>
            )}
            {invoice.delivery.address && (
              <p className="text-gray-600">{invoice.delivery.address}</p>
            )}
          </div>
        </div>

        {/* Order Info */}
        <div className="mb-8 p-4 bg-gray-50 rounded-lg">
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <span className="text-gray-500">Order Number:</span>
              <span className="ml-2 font-semibold">{invoice.orderNumber}</span>
            </div>
            <div>
              <span className="text-gray-500">Status:</span>
              <span className="ml-2 font-semibold capitalize">
                {invoice.status.toLowerCase()}
              </span>
            </div>
            <div>
              <span className="text-gray-500">Payment:</span>
              <span className="ml-2 font-semibold">
                {invoice.paymentMethod === 'CASH_ON_DELIVERY'
                  ? 'Cash on Delivery'
                  : 'Online Payment'}
              </span>
            </div>
          </div>
        </div>

        {/* Items Table */}
        <table className="w-full mb-8">
          <thead>
            <tr className="border-b-2 border-gray-200">
              <th className="text-left py-3 text-gray-600">Item</th>
              <th className="text-center py-3 text-gray-600">Qty</th>
              <th className="text-right py-3 text-gray-600">Price</th>
              <th className="text-right py-3 text-gray-600">Total</th>
            </tr>
          </thead>
          <tbody>
            {invoice.items.map((item, index) => (
              <tr key={index} className="border-b border-gray-100">
                <td className="py-3">
                  <div className="font-medium">{item.name}</div>
                  {item.sku && (
                    <div className="text-sm text-gray-500">SKU: {item.sku}</div>
                  )}
                </td>
                <td className="py-3 text-center">{item.quantity}</td>
                <td className="py-3 text-right">
                  {formatPrice(item.price, 'UAH')}
                </td>
                <td className="py-3 text-right font-medium">
                  {formatPrice(item.total, 'UAH')}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Totals */}
        <div className="flex justify-end">
          <div className="w-64">
            <div className="flex justify-between py-2">
              <span className="text-gray-600">Subtotal:</span>
              <span>{formatPrice(invoice.subtotal, 'UAH')}</span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-gray-600">Shipping:</span>
              <span>
                {invoice.shipping === 0
                  ? 'Free'
                  : formatPrice(invoice.shipping, 'UAH')}
              </span>
            </div>
            <div className="flex justify-between py-3 border-t-2 border-gray-200 font-bold text-lg">
              <span>Total:</span>
              <span className="text-primary-600">
                {formatPrice(invoice.total, 'UAH')}
              </span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-12 pt-8 border-t text-center text-gray-500 text-sm">
          <p>Thank you for your order!</p>
          <p className="mt-1">
            If you have any questions, please contact us at{' '}
            {invoice.company.email}
          </p>
        </div>
      </div>

      {/* Print Styles */}
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .max-w-4xl,
          .max-w-4xl * {
            visibility: visible;
          }
          .max-w-4xl {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            padding: 20px;
          }
        }
      `}</style>
    </div>
  )
}
