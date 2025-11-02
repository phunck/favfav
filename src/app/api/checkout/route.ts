// /src/app/api/checkout/route.ts
import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;
if (!STRIPE_SECRET_KEY) {
  throw new Error("Missing STRIPE_SECRET_KEY in environment variables (.env.local).");
}

// Kein apiVersion-Parameter -> vermeidet Literaltyp-Konflikte
const stripe = new Stripe(STRIPE_SECRET_KEY);

function getBaseUrl(req: NextRequest): string {
  const origin = req.headers.get("origin");
  if (origin) return origin;
  if (process.env.NEXT_PUBLIC_SITE_URL) {
    return process.env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, "");
  }
  return "http://localhost:3000";
}

type CheckoutBody =
  | { mode?: "support" | "pro"; amount?: number } // amount in cents (EUR)
  | undefined;

export async function POST(req: NextRequest) {
  try {
    const baseUrl = getBaseUrl(req);

    let body: CheckoutBody = undefined;
    try {
      body = await req.json();
    } catch {
      // body optional
    }

    const mode = body?.mode ?? "support";

    const { name, unit_amount } =
      mode === "pro"
        ? { name: "Pro Upgrade", unit_amount: body?.amount ?? 1200 } // €12.00
        : { name: "Support .favfav", unit_amount: body?.amount ?? 500 }; // €5.00

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: [
        {
          price_data: {
            currency: "eur",
            product_data: { name },
            unit_amount,
          },
          quantity: 1,
        },
      ],
      success_url: `${baseUrl}/?checkout=success`,
      cancel_url: `${baseUrl}/?checkout=cancel`,
      billing_address_collection: "auto",
      payment_method_types: ["card"],
      metadata: {
        app: "favfav",
        plan: mode,
      },
    });

    return NextResponse.json({ url: session.url }, { status: 200 });
  } catch (err: any) {
    console.error("Stripe Checkout error:", err);
    return NextResponse.json(
      { error: err?.message ?? "Failed to create Stripe Checkout Session" },
      { status: 500 }
    );
  }
}
