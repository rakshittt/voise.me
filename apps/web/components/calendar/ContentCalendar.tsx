"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";

/* ── Design tokens ───────────────────────────────────────────────────────── */
const C = {
  canvas:    "#ffffff",
  stone:     "#f5f4f0",
  stoneMid:  "#eeece7",
  ink:       "#17171c",
  text:      "#212121",
  sub:       "#6b6b7b",
  faint:     "#93939f",
  hair:      "#e2e0db",
  brand:     "#5856D6",
  brandDim:  "#f0effe",
  brandMid:  "#e4e3fc",
  green:     "#1a7a4a",
  greenDim:  "#edfce9",
  danger:    "#c0392b",
  dangerDim: "#fff1f0",
  weekend:   "#faf9f7",
  todayRing: "#5856D6",
} as const;

const FONT = {
  display: "var(--font-inter), Inter, sans-serif",
  body:    "var(--font-inter), Inter, sans-serif",
  mono:    "var(--font-inter), Inter, sans-serif",
} as const;

/* ── Types ───────────────────────────────────────────────────────────────── */
interface QueueItem {
  id: string;
  title: string | null;
  transcription: string;
  capture_method: string;
  status: string;
  planned_date: string | null;
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
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const startOffset = firstDay === 0 ? 6 : firstDay - 1;
  const cells: (Date | null)[] = Array(startOffset).fill(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month, d));
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

const MONTH_NAMES = ["January","February","March","April","May","June",
  "July","August","September","October","November","December"];
const DAY_LABELS = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];

/* ── IdeaChip ────────────────────────────────────────────────────────────── */
function IdeaChip({ item, onUnplan, onDelete }: {
  item: QueueItem;
  onUnplan: () => void;
  onDelete: () => void;
}) {
  const label = item.title ?? item.transcription.slice(0, 60);
  const writeUrl = `/dashboard/write?idea=${encodeURIComponent(label)}`;
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div style={{ position: "relative" }}>
      <div
        style={{
          backgroundColor: C.brandDim,
          border: `1px solid ${C.brandMid}`,
          borderLeft: `3px solid ${C.brand}`,
          borderRadius: 5,
          padding: "4px 6px 4px 8px",
          fontSize: 11,
          color: C.brand,
          display: "flex",
          alignItems: "center",
          gap: 4,
          cursor: "default",
          lineHeight: 1.35,
          fontFamily: FONT.body,
          fontWeight: 500,
        }}
      >
        <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {label}
        </span>
        <button
          type="button"
          onClick={() => setMenuOpen((v) => !v)}
          style={{
            background: "none", border: "none", cursor: "pointer",
            padding: "0 2px", color: C.brand, fontSize: 14, lineHeight: 1,
            flexShrink: 0, borderRadius: 3,
          }}
          title="Options"
        >
          ···
        </button>
      </div>
      {menuOpen && (
        <div
          style={{
            position: "absolute", top: "calc(100% + 4px)", right: 0, zIndex: 50,
            backgroundColor: C.canvas, border: `1px solid ${C.hair}`,
            borderRadius: 8, boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
            minWidth: 148, padding: 4, fontFamily: FONT.body,
          }}
          onMouseLeave={() => setMenuOpen(false)}
        >
          {[
            { label: "Write this →", href: writeUrl },
          ].map((opt) => (
            <Link
              key={opt.label}
              href={opt.href}
              style={{ display: "block", padding: "7px 10px", fontSize: 12, color: C.text, textDecoration: "none", borderRadius: 5, fontWeight: 500 }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = C.stone; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}
              onClick={() => setMenuOpen(false)}
            >
              {opt.label}
            </Link>
          ))}
          <button
            type="button"
            onClick={() => { setMenuOpen(false); onUnplan(); }}
            style={{ display: "block", width: "100%", textAlign: "left", padding: "7px 10px", fontSize: 12, color: C.text, background: "none", border: "none", cursor: "pointer", borderRadius: 5, fontWeight: 500, fontFamily: FONT.body }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = C.stone; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}
          >
            Remove from calendar
          </button>
          <div style={{ height: 1, backgroundColor: C.hair, margin: "3px 4px" }} />
          <button
            type="button"
            onClick={() => { setMenuOpen(false); onDelete(); }}
            style={{ display: "block", width: "100%", textAlign: "left", padding: "7px 10px", fontSize: 12, color: C.danger, background: "none", border: "none", cursor: "pointer", borderRadius: 5, fontFamily: FONT.body }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = C.dangerDim; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}
          >
            Delete idea
          </button>
        </div>
      )}
    </div>
  );
}

/* ── Inline add input ────────────────────────────────────────────────────── */
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
        className="add-idea-btn"
        title="Add idea"
        style={{
          background: "none", border: "none", cursor: "pointer",
          color: C.faint, fontSize: 15, padding: "0px 3px",
          borderRadius: 4, lineHeight: 1, opacity: 0,
          transition: "opacity 0.15s, background 0.1s",
        }}
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
        placeholder="Add idea…"
        maxLength={200}
        style={{
          width: "100%", boxSizing: "border-box",
          fontSize: 11, padding: "4px 7px",
          border: `1.5px solid ${C.brand}`,
          borderRadius: 5,
          background: C.canvas,
          color: C.text,
          outline: "none",
          fontFamily: FONT.body,
        }}
      />
      <div style={{ display: "flex", gap: 3 }}>
        <button
          type="button"
          onClick={submit}
          style={{
            flex: 1, fontSize: 10, padding: "3px 0",
            border: "none", borderRadius: 4,
            background: C.brand, color: "#ffffff",
            cursor: "pointer", fontFamily: FONT.body, fontWeight: 600,
          }}
        >
          Add
        </button>
        <button
          type="button"
          onClick={() => { setOpen(false); setValue(""); }}
          style={{
            flex: 1, fontSize: 10, padding: "3px 0",
            border: `1px solid ${C.hair}`, borderRadius: 4,
            background: "transparent", color: C.sub,
            cursor: "pointer", fontFamily: FONT.body,
          }}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

/* ── Unplanned sidebar panel ─────────────────────────────────────────────── */
function UnplannedPanel({ items, onPlan, onDelete, onAdd }: {
  items: QueueItem[];
  onPlan: (id: string, date: string) => void;
  onDelete: (id: string) => void;
  onAdd: (title: string) => void;
}) {
  const [newIdea, setNewIdea] = useState("");
  const [dateInputs, setDateInputs] = useState<Record<string, string>>({});
  const ready = newIdea.trim().length >= 2;

  function submitNew() {
    const trimmed = newIdea.trim();
    if (!ready || trimmed.length < 2) return;
    onAdd(trimmed);
    setNewIdea("");
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

      {/* Quick-add */}
      <div>
        <p style={{
          margin: "0 0 10px",
          fontSize: 10, fontWeight: 700, color: C.faint,
          textTransform: "uppercase", letterSpacing: "0.09em",
          fontFamily: FONT.mono,
        }}>
          New idea
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <input
            type="text"
            value={newIdea}
            onChange={(e) => setNewIdea(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") submitNew(); }}
            placeholder="What do you want to write about?"
            maxLength={200}
            style={{
              width: "100%", boxSizing: "border-box",
              fontSize: 13, padding: "9px 12px",
              border: `1.5px solid ${C.hair}`,
              borderRadius: 8,
              background: C.canvas, color: C.text, outline: "none",
              fontFamily: FONT.body,
              transition: "border-color 0.15s",
            }}
            onFocus={(e) => { e.currentTarget.style.borderColor = C.brand; }}
            onBlur={(e) => { e.currentTarget.style.borderColor = C.hair; }}
          />
          <button
            type="button"
            disabled={!ready}
            onClick={submitNew}
            style={{
              padding: "8px 14px", fontSize: 13, fontWeight: 600,
              border: "none", borderRadius: 8, cursor: ready ? "pointer" : "not-allowed",
              background: ready ? C.brand : C.stoneMid,
              color: ready ? "#ffffff" : C.faint,
              fontFamily: FONT.body,
              transition: "background 0.15s",
            }}
          >
            Add to idea bank
          </button>
        </div>
      </div>

      {/* List */}
      {items.length === 0 ? (
        <div style={{ textAlign: "center", padding: "32px 16px" }}>
          <div style={{ fontSize: 28, marginBottom: 8 }}>💡</div>
          <p style={{ margin: 0, fontSize: 13, color: C.faint, fontFamily: FONT.body, lineHeight: 1.5 }}>
            No unplanned ideas yet.<br />Add one above.
          </p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {items.map((item) => {
            const label = item.title ?? item.transcription.slice(0, 80);
            const writeUrl = `/dashboard/write?idea=${encodeURIComponent(label)}`;
            const dateVal = dateInputs[item.id] ?? "";
            return (
              <div
                key={item.id}
                style={{
                  backgroundColor: C.canvas,
                  border: `1px solid ${C.hair}`,
                  borderRadius: 8,
                  padding: "10px 12px",
                  display: "flex",
                  flexDirection: "column",
                  gap: 8,
                  transition: "border-color 0.15s",
                }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = C.brand; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = C.hair; }}
              >
                <div style={{ display: "flex", alignItems: "flex-start", gap: 6 }}>
                  <span style={{ fontSize: 13, marginTop: 1 }}>💡</span>
                  <p style={{ margin: 0, fontSize: 12, color: C.text, lineHeight: 1.45, fontFamily: FONT.body, flex: 1 }}>
                    {label}
                  </p>
                  <button
                    type="button"
                    onClick={() => onDelete(item.id)}
                    style={{
                      background: "none", border: "none", cursor: "pointer",
                      color: C.faint, fontSize: 12, padding: "1px 3px", flexShrink: 0,
                      borderRadius: 3,
                    }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = C.danger; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = C.faint; }}
                    title="Delete"
                  >
                    ✕
                  </button>
                </div>
                <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                  <input
                    type="date"
                    value={dateVal}
                    onChange={(e) => setDateInputs((prev) => ({ ...prev, [item.id]: e.target.value }))}
                    style={{
                      flex: 1, fontSize: 11, padding: "4px 8px",
                      border: `1px solid ${C.hair}`, borderRadius: 6,
                      background: C.stone, color: C.text,
                      cursor: "pointer", fontFamily: FONT.body,
                    }}
                  />
                  <button
                    type="button"
                    disabled={!dateVal}
                    onClick={() => {
                      if (dateVal) {
                        onPlan(item.id, dateVal);
                        setDateInputs((prev) => { const n = { ...prev }; delete n[item.id]; return n; });
                      }
                    }}
                    style={{
                      fontSize: 11, padding: "4px 10px", fontWeight: 600,
                      border: "none", borderRadius: 6,
                      background: dateVal ? C.brand : C.stoneMid,
                      color: dateVal ? "#ffffff" : C.faint,
                      cursor: dateVal ? "pointer" : "not-allowed",
                      fontFamily: FONT.body,
                    }}
                  >
                    Plan
                  </button>
                </div>
                <Link
                  href={writeUrl}
                  style={{
                    fontSize: 11, color: C.brand, textDecoration: "none",
                    fontWeight: 600, fontFamily: FONT.body,
                  }}
                >
                  Write now →
                </Link>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ── Loading skeleton ─────────────────────────────────────────────────────── */
function SkeletonCell() {
  return (
    <div style={{
      minHeight: 110,
      borderRight: `1px solid ${C.hair}`,
      borderBottom: `1px solid ${C.hair}`,
      padding: 8,
    }}>
      <div style={{ width: 22, height: 22, borderRadius: "50%", background: C.stoneMid, marginBottom: 6 }} />
      <div style={{ height: 22, borderRadius: 5, background: C.stone, marginBottom: 4, width: "80%" }} />
    </div>
  );
}

/* ── Main calendar ───────────────────────────────────────────────────────── */
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
  function goToday() {
    setYear(today.getFullYear());
    setMonth(today.getMonth());
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
  const plannedCount = calendarItems.length;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 28, fontFamily: FONT.body }}>

      {/* ── Page header ── */}
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 style={{
            margin: "0 0 4px",
            fontFamily: FONT.display,
            fontSize: "clamp(24px, 3vw, 32px)",
            fontWeight: 600,
            color: C.ink,
            letterSpacing: "-0.025em",
            lineHeight: 1.1,
          }}>
            Content Calendar
          </h1>
          <p style={{ margin: 0, fontSize: 14, color: C.sub, lineHeight: 1.5 }}>
            Plan what you&apos;ll write. Click any day to add an idea.
          </p>
        </div>
        {plannedCount > 0 && (
          <div style={{
            display: "flex", alignItems: "center", gap: 6,
            background: C.greenDim, border: `1px solid rgba(26,122,74,0.2)`,
            borderRadius: 24, padding: "5px 14px",
            fontSize: 12, fontWeight: 600, color: C.green,
            fontFamily: FONT.mono,
          }}>
            <span style={{ width: 7, height: 7, borderRadius: "50%", backgroundColor: C.green }} />
            {plannedCount} idea{plannedCount !== 1 ? "s" : ""} planned
          </div>
        )}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 292px", gap: 20, alignItems: "start" }}>

        {/* ── Calendar card ── */}
        <div style={{
          border: `1px solid ${C.hair}`,
          borderRadius: 14,
          overflow: "hidden",
          backgroundColor: C.canvas,
          boxShadow: "0 1px 4px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.04)",
        }}>

          {/* Month nav - dark band */}
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            padding: "14px 20px",
            background: C.ink,
          }}>
            <button
              type="button"
              onClick={prevMonth}
              style={{
                background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.15)",
                borderRadius: 7, cursor: "pointer", width: 30, height: 30,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 16, color: "rgba(255,255,255,0.85)",
                transition: "background 0.1s",
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.18)"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.10)"; }}
            >
              ‹
            </button>

            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <span style={{
                fontFamily: FONT.display,
                fontWeight: 600,
                fontSize: 18,
                color: "#ffffff",
                letterSpacing: "-0.02em",
              }}>
                {MONTH_NAMES[month]} {year}
              </span>
              <button
                type="button"
                onClick={goToday}
                style={{
                  fontSize: 11, fontWeight: 600, padding: "3px 10px",
                  border: "1px solid rgba(255,255,255,0.2)",
                  borderRadius: 20, background: "rgba(255,255,255,0.1)",
                  color: "rgba(255,255,255,0.75)", cursor: "pointer",
                  fontFamily: FONT.body, letterSpacing: "0.02em",
                  transition: "background 0.1s",
                }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.2)"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.1)"; }}
              >
                Today
              </button>
            </div>

            <button
              type="button"
              onClick={nextMonth}
              style={{
                background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.15)",
                borderRadius: 7, cursor: "pointer", width: 30, height: 30,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 16, color: "rgba(255,255,255,0.85)",
                transition: "background 0.1s",
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.18)"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.10)"; }}
            >
              ›
            </button>
          </div>

          {/* Day labels */}
          <div style={{
            display: "grid", gridTemplateColumns: "repeat(7, 1fr)",
            borderBottom: `1px solid ${C.hair}`,
            backgroundColor: C.stone,
          }}>
            {DAY_LABELS.map((d, i) => (
              <div
                key={d}
                style={{
                  padding: "8px 0",
                  textAlign: "center",
                  fontSize: 10,
                  fontWeight: 700,
                  color: i >= 5 ? C.brand : C.faint,
                  textTransform: "uppercase",
                  letterSpacing: "0.07em",
                  fontFamily: FONT.mono,
                }}
              >
                {d}
              </div>
            ))}
          </div>

          {/* Grid */}
          {loading ? (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)" }}>
              {Array.from({ length: 35 }).map((_, i) => <SkeletonCell key={i} />)}
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)" }}>
              {grid.map((day, i) => {
                const col = i % 7;
                const isWeekend = col >= 5;

                if (!day) {
                  return (
                    <div
                      key={`empty-${i}`}
                      style={{
                        minHeight: 110,
                        borderRight: col !== 6 ? `1px solid ${C.hair}` : "none",
                        borderBottom: `1px solid ${C.hair}`,
                        backgroundColor: isWeekend ? C.weekend : C.stone,
                        opacity: 0.5,
                      }}
                    />
                  );
                }

                const dateStr = isoDate(day);
                const isToday = dateStr === todayStr;
                const dayItems = itemsByDate[dateStr] ?? [];

                return (
                  <div
                    key={dateStr}
                    className="calendar-cell"
                    style={{
                      minHeight: 110,
                      borderRight: col !== 6 ? `1px solid ${C.hair}` : "none",
                      borderBottom: `1px solid ${C.hair}`,
                      padding: 8,
                      position: "relative",
                      backgroundColor: isWeekend ? C.weekend : C.canvas,
                      transition: "background 0.12s",
                    }}
                    onMouseEnter={(e) => {
                      if (!isWeekend) (e.currentTarget as HTMLElement).style.backgroundColor = C.stone;
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLElement).style.backgroundColor = isWeekend ? C.weekend : C.canvas;
                    }}
                  >
                    {/* Day number + add button */}
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 5 }}>
                      <span
                        style={{
                          display: "inline-flex", alignItems: "center", justifyContent: "center",
                          width: 24, height: 24, borderRadius: "50%",
                          fontSize: 12, lineHeight: 1,
                          fontWeight: isToday ? 700 : 500,
                          color: isToday ? "#ffffff" : isWeekend ? C.brand : C.sub,
                          backgroundColor: isToday ? C.todayRing : "transparent",
                          fontFamily: FONT.body,
                          flexShrink: 0,
                        }}
                      >
                        {day.getDate()}
                      </span>
                      <AddIdeaInput date={dateStr} onAdd={(title, d) => addIdea(title, d)} />
                    </div>

                    {/* Idea chips */}
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

        {/* ── Sidebar ── */}
        <div style={{
          border: `1px solid ${C.hair}`,
          borderRadius: 14,
          overflow: "hidden",
          backgroundColor: C.canvas,
          boxShadow: "0 1px 4px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.04)",
        }}>
          {/* Sidebar header */}
          <div style={{
            padding: "14px 18px",
            borderBottom: `1px solid ${C.hair}`,
            backgroundColor: C.stone,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}>
            <span style={{
              fontSize: 10, fontWeight: 700, color: C.faint,
              textTransform: "uppercase", letterSpacing: "0.09em",
              fontFamily: FONT.mono,
            }}>
              Idea bank
            </span>
            {unplannedItems.length > 0 && (
              <span style={{
                background: C.brandDim, color: C.brand,
                fontSize: 10, fontWeight: 700,
                borderRadius: 20, padding: "2px 8px",
                fontFamily: FONT.mono,
              }}>
                {unplannedItems.length}
              </span>
            )}
          </div>

          <div style={{ padding: 16, maxHeight: 600, overflowY: "auto" }}>
            <UnplannedPanel
              items={unplannedItems}
              onPlan={planItem}
              onDelete={deleteItem}
              onAdd={(title) => addIdea(title)}
            />
          </div>
        </div>

      </div>

      {/* CSS for hover-reveal add button */}
      <style>{`
        .calendar-cell:hover .add-idea-btn { opacity: 1 !important; }
        .add-idea-btn:focus-visible { opacity: 1 !important; outline: 2px solid ${C.brand}; }
        @keyframes pulse { 0%,100% { opacity: 0.4 } 50% { opacity: 1 } }
      `}</style>
    </div>
  );
}
