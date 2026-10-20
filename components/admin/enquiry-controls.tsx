"use client";

import { useState } from "react";
import { addEnquiryNote, updateEnquiryStatus } from "@/actions/enquiries";
import { NoticeBar, useAction } from "@/components/ui/feedback";
import { STATUS_LABEL } from "./status-badge";

export function EnquiryControls({ id, status }: { id: string; status: string }) {
  const { run, pending, notice } = useAction();
  const [note, setNote] = useState("");
  return (
    <section className="card space-y-4 p-5">
      <h2 className="text-2xl">Manage</h2>
      <div>
        <label htmlFor="status" className="label">Status</label>
        <select id="status" className="input" value={status} disabled={pending} onChange={(e) => run(() => updateEnquiryStatus({ id, status: e.target.value }))}>
          {Object.entries(STATUS_LABEL).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
      </div>
      <form onSubmit={(e) => { e.preventDefault(); run(() => addEnquiryNote({ id, body: note }), { onOk: () => setNote("") }); }}>
        <label htmlFor="note" className="label">Add internal note</label>
        <textarea id="note" rows={3} className="input" value={note} onChange={(e) => setNote(e.target.value)} />
        <button className="btn btn-primary btn-sm mt-2" disabled={pending || !note.trim()}>Add note</button>
      </form>
      <NoticeBar notice={notice} />
    </section>
  );
}
