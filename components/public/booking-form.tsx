"use client";

import { useEffect, useState } from "react";
import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { MessageCircle } from "lucide-react";
import { enquirySchema } from "@/lib/validation/schemas";
import { quoteAction, submitEnquiry, type EnquiryOutcome } from "@/actions/public";
import type { QuoteResult } from "@/lib/pricing/engine";
import { DateRangePicker } from "./date-range-picker";
import { QuoteSummary } from "./quote-summary";

interface FormValues {
  guestName: string; email: string; phone: string; checkIn: string; checkOut: string;
  guests: number; specialRequests?: string; website?: string;
}

export function BookingForm({
  today, maxGuests, whatsapp, propertyName, initial,
}: {
  today: string; maxGuests: number; whatsapp: string | null; propertyName: string;
  initial: { checkIn?: string; checkOut?: string; guests?: number };
}) {
  const { register, handleSubmit, setValue, watch, setError, formState: { errors, isSubmitting } } = useForm<FormValues>({
    resolver: zodResolver(enquirySchema) as unknown as Resolver<FormValues>,
    defaultValues: { checkIn: initial.checkIn ?? "", checkOut: initial.checkOut ?? "", guests: initial.guests ?? 2, website: "" },
  });
  const [serverError, setServerError] = useState<string | null>(null);
  const [done, setDone] = useState<EnquiryOutcome | null>(null);
  const [quote, setQuote] = useState<QuoteResult | null>(null);
  const [quoteError, setQuoteError] = useState<string | null>(null);

  const [checkIn, checkOut, guests] = watch(["checkIn", "checkOut", "guests"]);

  useEffect(() => {
    setQuote(null);
    setQuoteError(null);
    if (!checkIn || !checkOut) return;
    let alive = true;
    quoteAction({ checkIn, checkOut, guests: Number(guests) }).then((r) => {
      if (!alive) return;
      if (r.ok && r.data) setQuote(r.data);
      else if (!r.ok) setQuoteError(r.error);
    });
    return () => { alive = false; };
  }, [checkIn, checkOut, guests]);

  async function onSubmit(values: FormValues) {
    setServerError(null);
    const r = await submitEnquiry(values);
    if (r.ok && r.data) return setDone(r.data);
    if (!r.ok) {
      setServerError(r.error);
      for (const [k, msgs] of Object.entries(r.fieldErrors ?? {})) if (msgs?.[0]) setError(k as keyof FormValues, { message: msgs[0] });
    }
  }

  if (done) {
    const waText = `Hello! I just sent an enquiry (ref ${done.reference}) to ${propertyName} for ${checkIn} to ${checkOut}. Please let me know about availability.`;
    return (
      <div className="card p-6 sm:p-8" role="status" data-testid="enquiry-success">
        <p className="eyebrow">Enquiry received</p>
        <h2 className="mt-2 text-4xl">Thank you!</h2>
        <p className="mt-3">Your reference is <strong data-testid="enquiry-ref">{done.reference}</strong>. We will contact you about availability. <strong>Your dates are not reserved or confirmed yet.</strong></p>
        {done.emailSent && <p className="mt-2 text-sm text-espresso/70">A confirmation email is on its way.</p>}
        <div className="mt-6"><QuoteSummary quote={done.quote} /></div>
        {whatsapp && <a className="btn btn-outline mt-6" target="_blank" rel="noopener noreferrer" href={`https://wa.me/${whatsapp}?text=${encodeURIComponent(waText)}`}><MessageCircle className="h-4 w-4" aria-hidden />Message us on WhatsApp</a>}
      </div>
    );
  }

  const err = (k: keyof FormValues) => errors[k]?.message as string | undefined;

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="grid gap-8 lg:grid-cols-[1.05fr_1fr] lg:gap-12" aria-label="Booking enquiry">
      <div className="space-y-4">
        <h2 className="font-serif text-[1.6rem] leading-none"><span className="text-terracotta">1.</span> Choose your dates</h2>
        <DateRangePicker today={today} checkIn={checkIn} checkOut={checkOut} onChange={(v) => { setValue("checkIn", v.checkIn, { shouldValidate: !!v.checkIn }); setValue("checkOut", v.checkOut, { shouldValidate: !!v.checkOut }); }} />
        <input type="hidden" {...register("checkIn")} />
        <input type="hidden" {...register("checkOut")} />
        {(err("checkIn") || err("checkOut")) && <p role="alert" className="field-error">{err("checkIn") || err("checkOut")}</p>}
        <div aria-live="polite">
          {quoteError && <p role="alert" className="field-error">{quoteError}</p>}
          {quote && <QuoteSummary quote={quote} />}
        </div>
      </div>
      <div className="space-y-4 rounded-2xl border border-beige/80 bg-white/80 p-5 shadow-[0_14px_34px_-26px_rgba(36,33,31,.4)] sm:p-7 lg:self-start">
        <h2 className="font-serif text-[1.6rem] leading-none"><span className="text-terracotta">2.</span> Your details</h2>
        <div>
          <label className="label" htmlFor="guestName">Your name</label>
          <input id="guestName" className="input" autoComplete="name" aria-invalid={!!errors.guestName} {...register("guestName")} />
          {err("guestName") && <p role="alert" className="field-error">{err("guestName")}</p>}
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="email">Email</label>
            <input id="email" type="email" className="input" autoComplete="email" aria-invalid={!!errors.email} {...register("email")} />
            {err("email") && <p role="alert" className="field-error">{err("email")}</p>}
          </div>
          <div>
            <label className="label" htmlFor="phone">Phone</label>
            <input id="phone" type="tel" className="input" autoComplete="tel" aria-invalid={!!errors.phone} {...register("phone")} />
            {err("phone") && <p role="alert" className="field-error">{err("phone")}</p>}
          </div>
        </div>
        <div>
          <label className="label" htmlFor="guests">Guests</label>
          <select id="guests" className="input" {...register("guests", { valueAsNumber: true })}>
            {Array.from({ length: maxGuests }, (_, i) => i + 1).map((n) => <option key={n} value={n}>{n}</option>)}
          </select>
          {err("guests") && <p role="alert" className="field-error">{err("guests")}</p>}
        </div>
        <div>
          <label className="label" htmlFor="specialRequests">Special requests (optional)</label>
          <textarea id="specialRequests" rows={4} className="input" {...register("specialRequests")} />
        </div>
        {/* Honeypot — hidden from people and assistive tech */}
        <div className="absolute -left-[9999px]" aria-hidden="true">
          <label>Website<input tabIndex={-1} autoComplete="off" {...register("website")} /></label>
        </div>
        {serverError && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800">{serverError}</p>}
        <button type="submit" className="btn btn-primary w-full" disabled={isSubmitting}>{isSubmitting ? "Sending…" : "Send Enquiry"}</button>
        <p className="text-xs text-espresso/60">Sending an enquiry does not reserve dates. We will get back to you to confirm availability.</p>
      </div>
    </form>
  );
}
