import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

const getClient = () =>
  createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

// Generate invoice PDF HTML (can be printed or converted to PDF)
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const authHeader = req.headers.get("authorization") ?? "";
  const token = authHeader.replace("Bearer ", "").trim();

  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = getClient();
  const { data: { user }, error: authErr } = await db.auth.getUser(token);

  if (authErr || !user) {
    return NextResponse.json({ error: "Invalid session" }, { status: 401 });
  }

  const { data: invoice, error } = await db
    .from("invoices")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (error || !invoice) {
    return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
  }

  const formatDate = (d: string) => new Date(d).toLocaleDateString("en-US", {
    year: "numeric", month: "long", day: "numeric"
  });

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency || "EUR",
    }).format(amount);
  };

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Invoice ${invoice.invoice_number}</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #111; background: #fff; padding: 40px; }
        .invoice { max-width: 800px; margin: 0 auto; }
        .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 40px; }
        .logo { font-size: 28px; font-weight: 800; color: #DC2626; }
        .invoice-info { text-align: right; }
        .invoice-number { font-size: 24px; font-weight: 700; color: #111; }
        .invoice-date { font-size: 14px; color: #666; margin-top: 4px; }
        .status { display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; margin-top: 8px; }
        .status.paid { background: #D1FAE5; color: #065F46; }
        .status.pending { background: #FEF3C7; color: #92400E; }
        .parties { display: flex; gap: 60px; margin-bottom: 40px; }
        .party { flex: 1; }
        .party-label { font-size: 12px; color: #999; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 8px; }
        .party-name { font-size: 16px; font-weight: 600; color: #111; }
        .party-detail { font-size: 14px; color: #555; margin-top: 4px; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
        th { text-align: left; padding: 12px; background: #F9FAFB; border-bottom: 2px solid #E5E7EB; font-size: 12px; color: #666; text-transform: uppercase; letter-spacing: 0.5px; }
        td { padding: 16px 12px; border-bottom: 1px solid #E5E7EB; font-size: 14px; }
        .text-right { text-align: right; }
        .total-row td { font-weight: 700; font-size: 16px; border-bottom: none; padding-top: 20px; }
        .footer { margin-top: 60px; padding-top: 20px; border-top: 1px solid #E5E7EB; font-size: 12px; color: #999; text-align: center; }
        @media print { body { padding: 20px; } .invoice { max-width: 100%; } }
      </style>
    </head>
    <body>
      <div class="invoice">
        <div class="header">
          <div class="logo">RedLightAD</div>
          <div class="invoice-info">
            <div class="invoice-number">Invoice #${invoice.invoice_number}</div>
            <div class="invoice-date">${formatDate(invoice.created_at)}</div>
            <div class="status ${invoice.status}">${invoice.status.toUpperCase()}</div>
          </div>
        </div>

        <div class="parties">
          <div class="party">
            <div class="party-label">From</div>
            <div class="party-name">RedLightAD</div>
            <div class="party-detail">Digital Services</div>
            <div class="party-detail">support@redlightad.com</div>
          </div>
          <div class="party">
            <div class="party-label">Bill To</div>
            <div class="party-name">${invoice.customer_name || invoice.customer_email}</div>
            ${invoice.customer_email ? `<div class="party-detail">${invoice.customer_email}</div>` : ""}
            ${invoice.customer_address ? `<div class="party-detail">${invoice.customer_address}</div>` : ""}
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th>Description</th>
              <th class="text-right">Amount</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>${invoice.description}</td>
              <td class="text-right">${formatCurrency(invoice.amount, invoice.currency)}</td>
            </tr>
            ${invoice.tax_amount ? `
              <tr>
                <td>Tax (${invoice.tax_rate || 0}%)</td>
                <td class="text-right">${formatCurrency(invoice.tax_amount, invoice.currency)}</td>
              </tr>
            ` : ""}
            <tr class="total-row">
              <td>Total</td>
              <td class="text-right">${formatCurrency(invoice.total_amount || invoice.amount, invoice.currency)}</td>
            </tr>
          </tbody>
        </table>

        ${invoice.payment_method ? `
          <p style="font-size: 14px; color: #666; margin-bottom: 8px;">
            <strong>Payment Method:</strong> ${invoice.payment_method}
          </p>
        ` : ""}

        ${invoice.paid_at ? `
          <p style="font-size: 14px; color: #065F46;">
            <strong>Paid on:</strong> ${formatDate(invoice.paid_at)}
          </p>
        ` : ""}

        <div class="footer">
          <p>Thank you for your business!</p>
          <p style="margin-top: 8px;">RedLightAD — www.redlightad.com</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return new NextResponse(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
    },
  });
}
