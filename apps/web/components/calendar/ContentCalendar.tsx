"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";

/* ── Types ───────────────────────────────────────────────────────────────── */

interface QueueItem {
  id: string;
  title: string | null;
  transcription: string;
  capture_method: string;
  status: string;
  planned_date: string | null; // YYYY-MM-DD
}

/* ── Helpers ─────────────────────────────────────────────────────────────── */

function isoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function monthRange(year: number, month: number): { from: string; to: string } {
  const from = new Date(year, month, 1);
  const to = new Date(year, month + 1, 0);
  return { from: isoDate(from), to: isoDate(to) };
}

function buildCalendarGrid(year: number, month: number): (Date | null)[] {
  const firstDay = new Date(year, month, 1).getDay(); // 0=Sun
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const startOffset = firstDay === 0 ? 6 : firstDay - 1; // shift to Mon-start
  const cells: (Date | null)[] = Array(startOffset).fill(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month, d));
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

const MONTH_NAMES = ["January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"];
const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

/* ── Idea chip inside a calendar cell ───────────────────────────────────── */

function IdeaChip({ item, onUnplan, onDelete }: {
  item: QueueItem;
  onUnplan: () => void;
  onDelete: () => void;
}) {
  const label = item.title ?? item.transcription.slice(0, 60);
  const writeUrl = `/dashboard/write?idea=${encodeURIComponent(label)}`;
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div
      style={{
        position: "relative",
        backgroundColor: "var(--ds-background-brand-subtle)",
        border: "1px solid var(--ds-border-brand)",
        borderRadius: "var(--ds-radius-050)",
        padding: "3px 6px",
        fontSize: 11,
        color: "var(--ds-text-brand)",
        display: "flex",
        alignItems: "center",
        gap: 4,
        cursor: "default",
        lineHeight: 1.35,
      }}
    >
      <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 120 }}>
        {label}
      </span>
      <button
        type="button"
        onClick={() => setMenuOpen((v) => !v)}
        style={{ background: "none", border: "none", cursor: "pointer", padding: 0, color: "var(--ds-text-brand)", fontSize: 13, lineHeight: 1 }}
        title="Options"
      >
        ⋯
      </button>
      {menuOpen && (
        <div
          style={{
            position: "absolute", top: "100%", right: 0, zIndex: 50,
            backgroundColor: "var(--ds-surface)", border: "1px solid var(--ds-border)",
            borderRadius: "var(--ds-radius-100)", boxShadow: "var(--ds-shadow-overlay)",
            minWidth: 140, padding: "var(--ds-space-050)",
          }}
          onMouseLeave={() => setMenuOpen(false)}
        >
          <Link
            href={writeUrl}
            style={{ display: "block", padding: "6px 10px", fontSize: 12, color: "var(--ds-text)", textDecoration: "none", borderRadius: "var(--ds-radius-050)" }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "var(--ds-background-neutral-hovered)"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}
            onClick={() => setMenuOpen(false)}
          >
            Write this →
          </Link>
          <button
            type="button"
            onClick={() => { setMenuOpen(false); onUnplan(); }}
            style={{ display: "block", width: "100%", textAlign: "left", padding: "6px 10px", fontSize: 12, color: "var(--ds-text)", background: "none", border: "none", cursor: "pointer", borderRadius: "var(--ds-radius-050)" }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "var(--ds-background-neutral-hovered)"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}
          >
            Remove from calendar
          </button>
          <button
            type="button"
            onClick={() => { setMenuOpen(false); onDelete(); }}
            style={{ display: "block", width: "100%", textAlign: "left", padding: "6px 10px", fontSize: 12, color: "var(--ds-text-danger)", background: "none", border: "none", cursor: "pointer", borderRadius: "var(--ds-radius-050)" }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "var(--ds-background-danger-subtle)"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}
          >
            Delete idea
          </button>
        </div>
      )}
    </div>
  );
}

/* ── "Add idea" inline input for a cell ─────────────────────────────────── */

function AddIdeaInput({ date, onAdd }: { date: string; onAdd: (title: string, date: string) => void }) {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState("");

  function submit() {
    const trimmed = value.trim();
    if (trimmed.length < 2) return;
    onAdd(trimmed, date);
    setValue("");
    setOpen(false);
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        style={{
          background: "none", border: "none", cursor: "pointer",
          color: "var(--ds-text-subtlest)", fontSize: 14, padding: "2px 4px",
          borderRadius: "var(--ds-radius-050)", lineHeight: 1,
          opacity: 0,
        }}
        className="add-idea-btn"
        title="Add idea"
      >
        +
      </button>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4, marginTop: 4 }}>
      <input
        autoFocus
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") submit();
          if (e.key === "Escape") { setOpen(false); setValue(""); }
        }}
        placeholder="Idea…"
        maxLength={200}
        style={{
          width: "100%", boxSizing: "border-box",
          fontSize: 11, padding: "3px 5px",
          border: "1px solid var(--ds-border-brand)",
          borderRadius: "var(--ds-radius-050)",
          background: "var(--ds-surface)",
          color: "var(--ds-text)",
          outline: "none",
        }}
      />
      <div style={{ display: "flex", gap: 3 }}>
        <button type="button" onClick={submit} style={{ flex: 1, fontSize: 10, padding: "2px 0", border: "1px solid var(--ds-border-brand)", borderRadius: "var(--ds-radius-050)", background: "var(--ds-background-brand-bold)", color: "var(--ds-text-inverse)", cursor: "pointer" }}>
          Add
        </button>
        <button type="button" onClick={() => { setOpen(false); setValue(""); }} style={{ flex: 1, fontSize: 10, padding: "2px 0", border: "1px solid var(--ds-border)", borderRadius: "var(--ds-radius-050)", background: "transparent", color: "var(--ds-text-subtle)", cursor: "pointer" }}>
          Cancel
        </button>
      </div>
    </div>
  );
}

/* ── Unplanned ideas panel ───────────────────────────────────────────────── */

function UnplannedPanel({ items, onPlan, onDelete, onAdd }: {
  items: QueueItem[];
  onPlan: (id: string, date: string) => void;
  onDelete: (id: string) => void;
  onAdd: (title: string) => void;
}) {
  const [newIdea, setNewIdea] = useState("");
  const [dateInputs, setDateInputs] = useState<Record<string, string>>({});

  function submitNew() {
    const trimmed = newIdea.trim();
    if (trimmed.length < 2) return;
    onAdd(trimmed);
    setNewIdea("");
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--ds-space-200)" }}>

      {/* Quick-add */}
      <div>
        <p style={{ margin: "0 0 var(--ds-space-075)", fontSize: "var(--ds-font-size-075)", fontWeight: "var(--ds-font-weight-semibold)", color: "var(--ds-text-subtle)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
          New idea
        </p>
        <div style={{ display: "flex", gap: "var(--ds-space-075)" }}>
          <input
            type="text"
            value={newIdea}
            onChange={(e) => setNewIdea(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") submitNew(); }}
            placeholder="Type an idea…"
            maxLength={200}
            style={{
              flex: 1, fontSize: "var(--ds-font-size-075)", padding: "6px 10px",
              border: "1.5px solid var(--ds-border)", borderRadius: "var(--ds-radius-100)",
              background: "var(--ds-surface)", color: "var(--ds-text)", outline: "none",
            }}
            onFocus={(e) => { e.currentTarget.style.borderColor = "var(--ds-border-brand)"; }}
            onBlur={(e) => { e.currentTarget.style.borderColor = "var(--ds-border)"; }}
          />
          <button
            type="button"
            disabled={newIdea.trim().length < 2}
            onClick={submitNew}
            style={{
              padding: "6px 12px", fontSize: "var(--ds-font-size-075)", fontWeight: "var(--ds-font-weight-semibold)",
              border: "none", borderRadius: "var(--ds-radius-100)", cursor: newIdea.trim().length >= 2 ? "pointer" : "not-allowed",
              background: newIdea.trim().length >= 2 ? "var(--ds-background-brand-bold)" : "var(--ds-background-neutral)",
              color: newIdea.trim().length >= 2 ? "var(--ds-text-inverse)" : "var(--ds-text-subtlest)",
            }}
          >
            Add
          </button>
        </div>
      </div>

      {/* List */}
      {items.length === 0 ? (
        <p style={{ margin: 0, fontSize: "var(--ds-font-size-075)", color: "var(--ds-text-subtlest)", textAlign: "center", padding: "var(--ds-space-200) 0" }}>
          No unplanned ideas yet.
        </p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--ds-space-100)" }}>
          {items.map((item) => {
            const label = item.title ?? item.transcription.slice(0, 80);
            const writeUrl = `/dashboard/write?idea=${encodeURIComponent(label)}`;
            return (
              <div
                key={item.id}
                style={{
                  backgroundColor: "var(--ds-surface)",
                  border: "1px solid var(--ds-border)",
                  borderRadius: "var(--ds-radius-100)",
                  padding: "var(--ds-space-125) var(--ds-space-150)",
                  display: "flex",
                  flexDirection: "column",
                  gap: "var(--ds-space-075)",
                }}
              >
                <p style={{ margin: 0, fontSize: "var(--ds-font-size-075)", color: "var(--ds-text)", lineHeight: 1.4 }}>
                  {label}
                </p>
                <div style={{ display: "flex", gap: "var(--ds-space-075)", alignItems: "center", flexWrap: "wrap" }}>
                  <input
                    type="date"
                    value={dateInputs[item.id] ?? ""}
                    onChange={(e) => setDateInputs((prev) => ({ ...prev, [item.id]: e.target.value }))}
                    style={{
                      fontSize: 11, padding: "2px 6px",
                      border: "1px solid var(--ds-border)", borderRadius: "var(--ds-radius-050)",
                      background: "var(--ds-surface)", color: "var(--ds-text)", cursor: "pointer",
                    }}
                  />
                  <button
                    type="button"
                    disabled={!dateInputs[item.id]}
                    onClick={() => { if (dateInputs[item.id]) { onPlan(item.id, dateInputs[item.id]); setDateInputs((prev) => { const n = { ...prev }; delete n[item.id]; return n; }); } }}
                    style={{
                      fontSize: 11, padding: "2px 8px",
                      border: "1px solid var(--ds-border-brand)", borderRadius: "var(--ds-radius-050)",
                      background: dateInputs[item.id] ? "var(--ds-background-brand-subtle)" : "transparent",
                      color: dateInputs[item.id] ? "var(--ds-text-brand)" : "var(--ds-text-subtlest)",
                      cursor: dateInputs[item.id] ? "pointer" : "not-allowed",
                    }}
                  >
                    Plan
                  </button>
                  <Link href={writeUrl} style={{ fontSize: 11, color: "var(--ds-link)", textDecoration: "none" }}>
                    Write →
                  </Link>
                  <button
                    type="button"
                    onClick={() => onDelete(item.id)}
                    style={{ marginLeft: "auto", fontSize: 11, padding: "2px 6px", border: "none", background: "none", cursor: "pointer", color: "var(--ds-text-subtlest)" }}
                    title="Delete"
                  >
                    ✕
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ── Main calendar component ─────────────────────────────────────────────── */

export function ContentCalendar() {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [calendarItems, setCalendarItems] = useState<QueueItem[]>([]);
  const [unplannedItems, setUnplannedItems] = useState<QueueItem[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async (y: number, m: number) => {
    setLoading(true);
    const { from, to } = monthRange(y, m);
    const [calRes, unplanRes] = await Promise.all([
      fetch(`/api/queue/calendar?from=${from}&to=${to}`),
      fetch("/api/queue?unplanned_only=true"),
    ]);
    if (calRes.ok) {
      const d = await calRes.json() as { items: QueueItem[] };
      setCalendarItems(d.items);
    }
    if (unplanRes.ok) {
      const d = await unplanRes.json() as { items: QueueItem[] };
      setUnplannedItems(d.items);
    }
    setLoading(false);
  }, []);

  useEffect(() => { void loadData(year, month); }, [year, month, loadData]);

  function prevMonth() {
    if (month === 0) { setYear(y => y - 1); setMonth(11); }
    else setMonth(m => m - 1);
  }
  function nextMonth() {
    if (month === 11) { setYear(y => y + 1); setMonth(0); }
    else setMonth(m => m + 1);
  }

  async function addIdea(title: string, plannedDate?: string) {
    const res = await fetch("/api/queue", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title }),
    });
    if (!res.ok) return;
    const item = await res.json() as QueueItem;
    if (plannedDate) {
      const planRes = await fetch(`/api/queue/${item.id}/plan`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planned_date: plannedDate }),
      });
      if (planRes.ok) {
        const planned = await planRes.json() as QueueItem;
        setCalendarItems(prev => [...prev, planned]);
      }
    } else {
      setUnplannedItems(prev => [item, ...prev]);
    }
  }

  async function planItem(id: string, plannedDate: string) {
    const res = await fetch(`/api/queue/${id}/plan`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ planned_date: plannedDate }),
    });
    if (!res.ok) return;
    const updated = await res.json() as QueueItem;
    setUnplannedItems(prev => prev.filter(i => i.id !== id));
    const { from, to } = monthRange(year, month);
    if (plannedDate >= from && plannedDate <= to) {
      setCalendarItems(prev => [...prev.filter(i => i.id !== id), updated]);
    }
  }

  async function unplanItem(id: string) {
    const res = await fetch(`/api/queue/${id}/plan`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ planned_date: null }),
    });
    if (!res.ok) return;
    const updated = await res.json() as QueueItem;
    setCalendarItems(prev => prev.filter(i => i.id !== id));
    setUnplannedItems(prev => [updated, ...prev]);
  }

  async function deleteItem(id: string) {
    const res = await fetch(`/api/queue/${id}`, { method: "DELETE" });
    if (!res.ok) return;
    setCalendarItems(prev => prev.filter(i => i.id !== id));
    setUnplannedItems(prev => prev.filter(i => i.id !== id));
  }

  const itemsByDate = calendarItems.reduce<Record<string, QueueItem[]>>((acc, item) => {
    if (item.planned_date) {
      acc[item.planned_date] = [...(acc[item.planned_date] ?? []), item];
    }
    return acc;
  }, {});

  const todayStr = isoDate(today);
  const grid = buildCalendarGrid(year, month);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--ds-space-400)" }}>

      {/* Header */}
      <div>
        <h1 style={{ margin: 0, fontSize: "var(--ds-font-size-500)", fontWeight: "var(--ds-font-weight-bold)", color: "var(--ds-text)", letterSpacing: "-0.02em" }}>
          Content Calendar
        </h1>
        <p style={{ margin: "var(--ds-space-075) 0 0", fontSize: "var(--ds-font-size-100)", color: "var(--ds-text-subtle)" }}>
          Plan what you'll write. Click a day to add an idea, or assign dates to ideas in the panel below.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-6" style={{ alignItems: "start" }}>

        {/* ── Calendar grid ── */}
        <div style={{ border: "1px solid var(--ds-border)", borderRadius: "var(--ds-radius-200)", overflow: "hidden", backgroundColor: "var(--ds-surface)" }}>

          {/* Month nav */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "var(--ds-space-150) var(--ds-space-200)", borderBottom: "1px solid var(--ds-border)", backgroundColor: "var(--ds-surface-sunken)" }}>
            <button type="button" onClick={prevMonth} style={{ background: "none", border: "1px solid var(--ds-border)", borderRadius: "var(--ds-radius-100)", cursor: "pointer", width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, color: "var(--ds-text-subtle)" }}>
              ‹
            </button>
            <span style={{ fontWeight: "var(--ds-font-weight-semibold)", fontSize: "var(--ds-font-size-200)", color: "var(--ds-text)" }}>
              {MONTH_NAMES[month]} {year}
            </span>
            <button type="button" onClick={nextMonth} style={{ background: "none", border: "1px solid var(--ds-border)", borderRadius: "var(--ds-radius-100)", cursor: "pointer", width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, color: "var(--ds-text-subtle)" }}>
              ›
            </button>
          </div>

          {/* Day labels */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", borderBottom: "1px solid var(--ds-border)" }}>
            {DAY_LABELS.map((d) => (
              <div key={d} style={{ padding: "var(--ds-space-075) var(--ds-space-100)", textAlign: "center", fontSize: 11, fontWeight: "var(--ds-font-weight-semibold)", color: "var(--ds-text-subtlest)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                {d}
              </div>
            ))}
          </div>

          {/* Grid */}
          {loading ? (
            <div style={{ padding: "var(--ds-space-600)", textAlign: "center", color: "var(--ds-text-subtlest)", fontSize: "var(--ds-font-size-075)" }}>
              Loading…
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)" }}>
              {grid.map((day, i) => {
                if (!day) {
                  return <div key={`empty-${i}`} style={{ minHeight: 90, borderRight: i % 7 !== 6 ? "1px solid var(--ds-border)" : "none", borderBottom: "1px solid var(--ds-border)", backgroundColor: "var(--ds-background-neutral-subtle)", opacity: 0.4 }} />;
                }
                const dateStr = isoDate(day);
                const isToday = dateStr === todayStr;
                const dayItems = itemsByDate[dateStr] ?? [];

                return (
                  <div
                    key={dateStr}
                    style={{
                      minHeight: 90,
                      borderRight: i % 7 !== 6 ? "1px solid var(--ds-border)" : "none",
                      borderBottom: "1px solid var(--ds-border)",
                      padding: "var(--ds-space-075)",
                      verticalAlign: "top",
                      position: "relative",
                    }}
                    className="calendar-cell"
                  >
                    {/* Day number */}
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
                      <span
                        style={{
                          display: "inline-flex", alignItems: "center", justifyContent: "center",
                          width: 22, height: 22, borderRadius: "50%",
                          fontSize: 12,
                          fontWeight: isToday ? "var(--ds-font-weight-bold)" : "var(--ds-font-weight-regular)",
                          color: isToday ? "var(--ds-text-inverse)" : "var(--ds-text-subtle)",
                          backgroundColor: isToday ? "var(--ds-background-brand-bold)" : "transparent",
                        }}
                      >
                        {day.getDate()}
                      </span>
                      <AddIdeaInput date={dateStr} onAdd={(title, d) => addIdea(title, d)} />
                    </div>

                    {/* Ideas on this day */}
                    <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                      {dayItems.map((item) => (
                        <IdeaChip
                          key={item.id}
                          item={item}
                          onUnplan={() => unplanItem(item.id)}
                          onDelete={() => deleteItem(item.id)}
                        />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ── Unplanned panel ── */}
        <div style={{ border: "1px solid var(--ds-border)", borderRadius: "var(--ds-radius-200)", overflow: "hidden", backgroundColor: "var(--ds-surface)" }}>
          <div style={{ padding: "var(--ds-space-125) var(--ds-space-200)", borderBottom: "1px solid var(--ds-border)", backgroundColor: "var(--ds-surface-sunken)" }}>
            <span style={{ fontSize: 11, fontWeight: "var(--ds-font-weight-semibold)", color: "var(--ds-text-subtle)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
              Unplanned ideas {unplannedItems.length > 0 && `(${unplannedItems.length})`}
            </span>
          </div>
          <div style={{ padding: "var(--ds-space-200)", maxHeight: 600, overflowY: "auto" }}>
            <UnplannedPanel
              items={unplannedItems}
              onPlan={planItem}
              onDelete={deleteItem}
              onAdd={(title) => addIdea(title)}
            />
          </div>
        </div>

      </div>

      {/* CSS for hover reveal on add button */}
      <style>{`
        .calendar-cell:hover .add-idea-btn { opacity: 1 !important; }
        .add-idea-btn:focus { opacity: 1 !important; }
      `}</style>
    </div>
  );
}
