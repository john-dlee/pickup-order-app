import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const supabase = createSupabaseServerClient();

export async function POST(request: Request) {
  let body: {session_id?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status : 400 });
  }

  const sessionId = body.session_id?.trim();
  if (!sessionId) {
    return NextResponse.json({ error: "Missing session_id" }, { status: 400 });
  }

  const { data: checkout, error: findError } = await supabase
    .from("checkout_sessions")
    .select("id, paid_at")
    .eq("stripe_checkout_session_id", sessionId)
    .maybeSingle();

  if (findError) {
    console.error("mark-paid lookup failed", findError);
    return NextResponse.json({ error: "Lookup failed" }, { status: 500 });
  }

  if (!checkout) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (checkout.paid_at) {
    return NextResponse.json({ ok: true });
  }

  const { error: updateError } = await supabase
    .from("checkout_sessions")
    .update({ paid_at: new Date().toISOString() })
    .eq("id", checkout.id);

  if (updateError) {
    console.error("mark-paid update failed", updateError);
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}