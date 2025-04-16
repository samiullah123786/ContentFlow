"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { DollarSign, CheckCircle2, Trash2, Clock, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

type FinanceSummaryProps = {
  showViewAll?: boolean;
};

export default function FinanceSummary({ showViewAll = true }: FinanceSummaryProps) {
  const [loading, setLoading] = useState(true);
  const [totalInvoices, setTotalInvoices] = useState(0);
  const [totalPayments, setTotalPayments] = useState(0);
  const [totalExpenses, setTotalExpenses] = useState(0);
  const [pendingInvoices, setPendingInvoices] = useState(0);

  useEffect(() => {
    fetchFinanceData();
  }, []);

  async function fetchFinanceData() {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("finances")
        .select(`
          *,
          clients (
            name
          )
        `);

      if (error) throw error;

      // Calculate finance summary metrics
      let invoicesTotal = 0;
      let paymentsTotal = 0;
      let expensesTotal = 0;
      let pendingInvoicesTotal = 0;

      (data || []).forEach(item => {
        const amount = Number(item.amount || 0);

        if (item.type === 'invoice') {
          invoicesTotal += amount;
          if (item.status === 'pending') {
            pendingInvoicesTotal += amount;
          }
        } else if (item.type === 'payment') {
          paymentsTotal += amount;
        } else if (item.type === 'expense') {
          expensesTotal += amount;
        }
      });

      // Update the finance summary state
      setTotalInvoices(invoicesTotal);
      setTotalPayments(paymentsTotal);
      setTotalExpenses(expensesTotal);
      setPendingInvoices(pendingInvoicesTotal);

      console.log('Finance summary calculated:', {
        invoicesTotal,
        paymentsTotal,
        expensesTotal,
        pendingInvoicesTotal
      });
    } catch (error) {
      console.error("Error fetching finance data:", error);
    } finally {
      setLoading(false);
    }
  }

  // Helper function to format currency
  function formatCurrency(amount: number) {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(amount);
  }

  return (
    <Card className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-semibold flex items-center">
          <DollarSign className="h-5 w-5 mr-2 text-green-500" />
          Finance Summary
        </h3>
        {showViewAll && (
          <Link href="/finance">
            <Button variant="ghost" size="sm" className="text-xs">
              View Finance <ArrowRight className="h-3 w-3 ml-1" />
            </Button>
          </Link>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="border border-border bg-card p-4 rounded-lg shadow-sm">
          <p className="text-sm text-muted-foreground">Total Invoiced</p>
          <div className="flex items-center mt-1">
            <p className="text-2xl font-bold text-card-foreground">
              {loading ? "..." : formatCurrency(totalInvoices)}
            </p>
            <div className="ml-2 p-1 rounded-full bg-blue-100 dark:bg-blue-900">
              <DollarSign className="h-4 w-4 text-blue-500" />
            </div>
          </div>
        </div>

        <div className="border border-border bg-card p-4 rounded-lg shadow-sm">
          <p className="text-sm text-muted-foreground">Total Payments</p>
          <div className="flex items-center mt-1">
            <p className="text-2xl font-bold text-card-foreground">
              {loading ? "..." : formatCurrency(totalPayments)}
            </p>
            <div className="ml-2 p-1 rounded-full bg-green-100 dark:bg-green-900">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
            </div>
          </div>
        </div>

        <div className="border border-border bg-card p-4 rounded-lg shadow-sm">
          <p className="text-sm text-muted-foreground">Total Expenses</p>
          <div className="flex items-center mt-1">
            <p className="text-2xl font-bold text-card-foreground">
              {loading ? "..." : formatCurrency(totalExpenses)}
            </p>
            <div className="ml-2 p-1 rounded-full bg-red-100 dark:bg-red-900">
              <Trash2 className="h-4 w-4 text-red-500" />
            </div>
          </div>
        </div>

        <div className="border border-border bg-card p-4 rounded-lg shadow-sm">
          <p className="text-sm text-muted-foreground">Pending Invoices</p>
          <div className="flex items-center mt-1">
            <p className="text-2xl font-bold text-card-foreground">
              {loading ? "..." : formatCurrency(pendingInvoices)}
            </p>
            <div className="ml-2 p-1 rounded-full bg-amber-100 dark:bg-amber-900">
              <Clock className="h-4 w-4 text-amber-500" />
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}
