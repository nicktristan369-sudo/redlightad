"use client";

import { useEffect, useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { createClient } from "@/lib/supabase";
import { FileText, Download, Loader2, Receipt, ExternalLink } from "lucide-react";

interface Invoice {
  id: string;
  invoice_number: string;
  description: string;
  amount: number;
  currency: string;
  status: "paid" | "pending" | "failed";
  created_at: string;
  paid_at: string | null;
}

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadInvoices = async () => {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();

      if (!session?.access_token) {
        setLoading(false);
        return;
      }

      const res = await fetch("/api/invoices", {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });

      if (res.ok) {
        const data = await res.json();
        setInvoices(data.invoices || []);
      }
      setLoading(false);
    };

    loadInvoices();
  }, []);

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency || "EUR",
    }).format(amount);
  };

  const openInvoicePdf = async (invoiceId: string) => {
    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) return;

    // Open in new tab for printing
    const url = `/api/invoices/${invoiceId}/pdf`;
    window.open(url + `?token=${session.access_token}`, "_blank");
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Receipt className="text-red-600" />
            Invoices & Receipts
          </h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
            View and download your payment history
          </p>
        </div>

        {/* Invoices List */}
        {invoices.length === 0 ? (
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-12 text-center">
            <FileText size={48} className="mx-auto text-gray-300 dark:text-gray-600 mb-4" />
            <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">
              No invoices yet
            </h3>
            <p className="text-gray-500 dark:text-gray-400">
              Your payment receipts will appear here
            </p>
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
            {/* Table Header */}
            <div className="hidden md:grid grid-cols-5 gap-4 px-6 py-3 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
              <div>Invoice</div>
              <div>Description</div>
              <div>Date</div>
              <div>Amount</div>
              <div>Status</div>
            </div>

            {/* Invoice Rows */}
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {invoices.map((invoice) => (
                <div
                  key={invoice.id}
                  className="px-6 py-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  {/* Mobile View */}
                  <div className="md:hidden space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-sm font-medium text-gray-900 dark:text-white">
                        #{invoice.invoice_number}
                      </span>
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                        invoice.status === "paid"
                          ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                          : invoice.status === "pending"
                          ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"
                          : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                      }`}>
                        {invoice.status}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-300">{invoice.description}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        {formatDate(invoice.created_at)}
                      </span>
                      <span className="font-semibold text-gray-900 dark:text-white">
                        {formatCurrency(invoice.amount, invoice.currency)}
                      </span>
                    </div>
                    <button
                      onClick={() => openInvoicePdf(invoice.id)}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors text-sm font-medium"
                    >
                      <Download size={16} />
                      Download PDF
                    </button>
                  </div>

                  {/* Desktop View */}
                  <div className="hidden md:grid grid-cols-5 gap-4 items-center">
                    <div className="flex items-center gap-3">
                      <FileText size={18} className="text-gray-400" />
                      <span className="font-mono text-sm font-medium text-gray-900 dark:text-white">
                        #{invoice.invoice_number}
                      </span>
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-300 truncate">
                      {invoice.description}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      {formatDate(invoice.created_at)}
                    </div>
                    <div className="font-semibold text-gray-900 dark:text-white">
                      {formatCurrency(invoice.amount, invoice.currency)}
                    </div>
                    <div className="flex items-center justify-between">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                        invoice.status === "paid"
                          ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                          : invoice.status === "pending"
                          ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"
                          : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                      }`}>
                        {invoice.status}
                      </span>
                      <button
                        onClick={() => openInvoicePdf(invoice.id)}
                        className="p-2 text-gray-400 hover:text-red-600 dark:hover:text-red-500 transition-colors"
                        title="Download PDF"
                      >
                        <Download size={18} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
