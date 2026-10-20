"use client";

import { useState } from "react";
import { saveSettings } from "@/actions/admin";
import { NoticeBar, useAction } from "@/components/ui/feedback";

export interface SettingsValues {
  propertyName: string; address: string; contactEmail: string; notifyEmail: string; phone: string; whatsappNumber: string; mapsUrl: string;
  latitude: string; longitude: string; instagramUrl: string; facebookUrl: string; checkInTime: string; checkOutTime: string; houseRules: string; maxGuests: string;
}

/** One form backs both /admin/location and /admin/contact-settings; each page shows its own fields but always saves the full record. */
export function SettingsForm({ initial, section }: { initial: SettingsValues; section: "contact" | "location" }) {
  const [v, setV] = useState(initial);
  const { run, pending, notice } = useAction();
  const f = (name: keyof SettingsValues, label: string, opts: { help?: string; type?: string; area?: boolean } = {}) => (
    <div className={opts.area ? "sm:col-span-2" : ""}>
      <label className="label" htmlFor={name}>{label}</label>
      {opts.area ? <textarea id={name} rows={4} className="input" value={v[name]} onChange={(e) => setV({ ...v, [name]: e.target.value })} />
        : <input id={name} type={opts.type ?? "text"} className="input" value={v[name]} onChange={(e) => setV({ ...v, [name]: e.target.value })} />}
      {opts.help && <p className="mt-1 text-xs text-espresso/60">{opts.help}</p>}
    </div>
  );
  return (
    <form className="card grid gap-4 p-5 sm:grid-cols-2" onSubmit={(e) => { e.preventDefault(); run(() => saveSettings(v)); }}>
      {section === "contact" ? (
        <>
          {f("propertyName", "Property name")}
          {f("contactEmail", "Public contact email", { type: "email" })}
          {f("notifyEmail", "Enquiry notification email", { type: "email", help: "New enquiries are emailed here (needs email integration)." })}
          {f("phone", "Public phone number")}
          {f("whatsappNumber", "WhatsApp number", { help: "Digits with country code, no + or spaces, e.g. 919876543210." })}
          {f("instagramUrl", "Instagram URL")}
          {f("facebookUrl", "Facebook URL")}
          {f("maxGuests", "Maximum guests", { type: "number" })}
          {f("checkInTime", "Check-in time", { help: "e.g. 2:00 PM" })}
          {f("checkOutTime", "Check-out time")}
          {f("houseRules", "House rules", { area: true })}
        </>
      ) : (
        <>
          {f("address", "Full address", { area: true })}
          {f("mapsUrl", "Google Maps link", { help: "Paste the share link from Google Maps." })}
          <div className="hidden sm:block" />
          {f("latitude", "Latitude (optional)", { help: "With longitude, shows an embedded map." })}
          {f("longitude", "Longitude (optional)")}
        </>
      )}
      <div className="sm:col-span-2"><button className="btn btn-primary" disabled={pending} data-testid="save-settings">Save</button></div>
      <div className="sm:col-span-2"><NoticeBar notice={notice} /></div>
    </form>
  );
}
