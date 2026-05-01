import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

const getClient = () =>
  createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

async function verifyAdmin(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) return null;
  
  const token = authHeader.slice(7);
  const supabase = getClient();
  
  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) return null;
  
  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .single();
  
  return profile?.is_admin ? user : null;
}

// Fetch NOWPayments account balance
async function fetchNOWPaymentsBalance() {
  const apiKey = process.env.NOWPAYMENTS_API_KEY;
  if (!apiKey) return [];
  
  try {
    const res = await fetch("https://api.nowpayments.io/v1/balance", {
      headers: {
        "x-api-key": apiKey,
        "Content-Type": "application/json",
      },
    });
    
    if (!res.ok) return [];
    
    const data = await res.json();
    // NOWPayments returns balance as array or object depending on account type
    const balances: { currency: string; balance: number; usd_value: number }[] = [];
    
    if (data.balance) {
      // Sandbox/simple account
      balances.push({
        currency: "USD",
        balance: parseFloat(data.balance) || 0,
        usd_value: parseFloat(data.balance) || 0,
      });
    }
    
    return balances;
  } catch (err) {
    console.error("NOWPayments balance error:", err);
    return [];
  }
}

// Fetch payment list from NOWPayments
async function fetchNOWPaymentsHistory() {
  const apiKey = process.env.NOWPAYMENTS_API_KEY;
  if (!apiKey) return [];
  
  try {
    const res = await fetch("https://api.nowpayments.io/v1/payment/?limit=100&page=0&sortBy=created_at&orderBy=desc", {
      headers: {
        "x-api-key": apiKey,
        "Content-Type": "application/json",
      },
    });
    
    if (!res.ok) return [];
    
    const data = await res.json();
    return data.data || [];
  } catch (err) {
    console.error("NOWPayments history error:", err);
    return [];
  }
}

export async function GET(req: NextRequest) {
  try {
    const admin = await verifyAdmin(req);
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = getClient();

    // Fetch crypto payments from our database
    const { data: dbPayments } = await supabase
      .from("crypto_payments")
      .select(`
        *,
        listings (
          display_name,
          profile_image
        )
      `)
      .order("created_at", { ascending: false })
      .limit(100);

    // Also check plan_purchases for crypto payments
    const { data: planPurchases } = await supabase
      .from("plan_purchases")
      .select(`
        *,
        listings (
          display_name,
          profile_image
        )
      `)
      .eq("payment_provider", "nowpayments")
      .order("created_at", { ascending: false })
      .limit(100);

    // Fetch balances and history from NOWPayments API
    const [balances, nowPaymentsHistory] = await Promise.all([
      fetchNOWPaymentsBalance(),
      fetchNOWPaymentsHistory(),
    ]);

    // Merge database records with NOWPayments data
    const payments: any[] = [];
    
    // Add database crypto_payments
    if (dbPayments) {
      for (const p of dbPayments) {
        payments.push({
          id: p.id,
          payment_id: p.payment_id || p.id,
          order_id: p.order_id,
          payment_status: p.status || "unknown",
          pay_amount: p.pay_amount || 0,
          pay_currency: p.pay_currency || "BTC",
          price_amount: p.price_amount || 0,
          price_currency: p.price_currency || "USD",
          actually_paid: p.actually_paid || 0,
          outcome_amount: p.outcome_amount || 0,
          outcome_currency: p.outcome_currency || "USD",
          created_at: p.created_at,
          updated_at: p.updated_at,
          user_id: p.user_id,
          listing_id: p.listing_id,
          listing_name: p.listings?.display_name,
          profile_image: p.listings?.profile_image,
          payment_type: p.payment_type || "unknown",
        });
      }
    }

    // Add plan_purchases with nowpayments provider
    if (planPurchases) {
      for (const p of planPurchases) {
        // Skip if already in payments (by payment_id)
        if (payments.some(pay => pay.payment_id === p.payment_id)) continue;
        
        payments.push({
          id: p.id,
          payment_id: p.payment_id || p.id,
          order_id: `plan_${p.plan_id}_${p.user_id}`,
          payment_status: p.status || "completed",
          pay_amount: 0,
          pay_currency: "crypto",
          price_amount: p.plan_id === "featured" ? 42 : 21,
          price_currency: "USD",
          actually_paid: 0,
          outcome_amount: 0,
          outcome_currency: "USD",
          created_at: p.created_at,
          updated_at: p.created_at,
          user_id: p.user_id,
          listing_id: p.listing_id,
          listing_name: p.listings?.display_name,
          profile_image: p.listings?.profile_image,
          payment_type: "plan",
        });
      }
    }

    // If we have NOWPayments API history, enrich our data
    if (nowPaymentsHistory.length > 0) {
      for (const np of nowPaymentsHistory) {
        // Find matching payment in our DB
        const existing = payments.find(p => p.payment_id === np.payment_id?.toString());
        if (existing) {
          // Update with fresh NOWPayments data
          existing.payment_status = np.payment_status;
          existing.pay_amount = np.pay_amount;
          existing.pay_currency = np.pay_currency;
          existing.actually_paid = np.actually_paid;
          existing.outcome_amount = np.outcome_amount;
          existing.outcome_currency = np.outcome_currency;
        } else {
          // Add payment from NOWPayments that we don't have
          payments.push({
            id: `np_${np.payment_id}`,
            payment_id: np.payment_id?.toString(),
            order_id: np.order_id,
            payment_status: np.payment_status,
            pay_amount: np.pay_amount || 0,
            pay_currency: np.pay_currency || "BTC",
            price_amount: np.price_amount || 0,
            price_currency: np.price_currency || "USD",
            actually_paid: np.actually_paid || 0,
            outcome_amount: np.outcome_amount || 0,
            outcome_currency: np.outcome_currency || "USD",
            created_at: np.created_at,
            updated_at: np.updated_at,
            user_id: null,
            listing_id: null,
            listing_name: null,
            profile_image: null,
            payment_type: np.order_id?.startsWith("plan_") ? "plan" : 
                         np.order_id?.startsWith("coins_") ? "coins" : 
                         np.order_id?.startsWith("push_") ? "push" : "unknown",
          });
        }
      }
    }

    // Sort by date
    payments.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    // Calculate stats
    const now = new Date();
    const thisMonth = payments.filter(p => {
      const d = new Date(p.created_at);
      return d.getMonth() === now.getMonth() && 
             d.getFullYear() === now.getFullYear() &&
             ["finished", "confirmed"].includes(p.payment_status);
    });

    const stats = {
      total_received: payments
        .filter(p => ["finished", "confirmed"].includes(p.payment_status))
        .reduce((sum, p) => sum + (p.price_amount || 0), 0),
      total_transactions: payments.length,
      pending_transactions: payments.filter(p => 
        ["waiting", "sending", "partially_paid"].includes(p.payment_status)
      ).length,
      completed_this_month: thisMonth.reduce((sum, p) => sum + (p.price_amount || 0), 0),
    };

    return NextResponse.json({
      payments,
      balances,
      stats,
    });
  } catch (err) {
    console.error("Admin crypto API error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
