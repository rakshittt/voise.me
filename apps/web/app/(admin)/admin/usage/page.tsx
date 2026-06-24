"use client";

import { useEffect, useState } from "react";

interface ActionRow { action: string; count: number; cost_usd: number; tokens: number }
interface ModelRow  { model: string; count: number; cost_usd: number }
interface DayRow    { date: string; cost_usd: number; calls: number }

interface UsageData {
  period_days: number;
  total_cost_usd: number;
  by_action: ActionRow[];
  by_model: ModelRow[];
  daily_trend: DayRow[];
}

const DAYS_OPTIONS = [7, 14, 30, 90];

function pct(val: number, total: number) {
  if (total === 0) return "0%";
  return `${((val / total) * 100).toFixed(1)}%`;
}

export default function AdminUsagePage() {
  const [days, setDays] = useState(30);
  const [data, setData] = useState<UsageData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/admin/usage?days=${days}`)
      .then((r) => r.json())
      .then(setData)
      .catch(() => null)
      .finally(() => setLoading(false));
  }, [days]);

  const maxDailyCost = data ? Math.max(...data.daily_trend.map((d) => d.cost_usd), 0.0001) : 1;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--ds-space-500)", maxWidth: 1000 }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "var(--ds-space-300)" }}>
        <div>
          <h1 style={{ margin: 0, fontSize: "var(--ds-font-size-500)", fontWeight: "var(--ds-font-weight-bold)", color: "var(--ds-text)", letterSpacing: "-0.02em" }}>API Usage</h1>
          <p style={{ margin: "var(--ds-space-075) 0 0", fontSize: "var(--ds-font-size-100)", color: "var(--ds-text-subtle)" }}>
            LLM cost breakdown by action and model.
          </p>
        </div>
        <div style={{ display: "flex", gap: "var(--ds-space-075)" }}>
          {DAYS_OPTIONS.map((d) => (
            <button
              key={d}
              onClick={() => setDays(d)}
              style={{
                padding: "5px 14px",
                borderRadius: 6,
                border: "1px solid",
                borderColor: days === d ? "var(--ds-border-brand)" : "var(--ds-border)",
                backgroundColor: days === d ? "var(--ds-background-brand-subtle)" : "var(--ds-surface)",
                color: days === d ? "var(--ds-text-brand)" : "var(--ds-text-subtle)",
                fontWeight: days === d ? "var(--ds-font-weight-semibold)" : "normal",
                fontSize: "var(--ds-font-size-075)",
                cursor: "pointer",
              }}
            >
              {d}d
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <p style={{ color: "var(--ds-text-subtlest)", fontSize: "var(--ds-font-size-100)" }}>Loading…</p>
      ) : !data ? (
        <p style={{ color: "var(--ds-text-danger)", fontSize: "var(--ds-font-size-100)" }}>Failed to load usage data.</p>
      ) : (
        <>
          {/* Summary */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "var(--ds-space-300)" }}>
            {[
              { label: `Total cost (${days}d)`, value: `$${data.total_cost_usd.toFixed(4)}` },
              { label: "Total LLM calls", value: data.by_action.reduce((s, r) => s + r.count, 0).toLocaleString() },
              { label: "Total tokens", value: data.by_action.reduce((s, r) => s + r.tokens, 0).toLocaleString() },
            ].map((s) => (
              <div key={s.label} style={{ backgroundColor: "var(--ds-surface)", border: "1px solid var(--ds-border)", borderRadius: "var(--ds-radius-200)", padding: "var(--ds-space-250) var(--ds-space-300)" }}>
                <p style={{ margin: 0, fontSize: "var(--ds-font-size-075)", fontWeight: "var(--ds-font-weight-semibold)", color: "var(--ds-text-subtlest)", textTransform: "uppercase", letterSpacing: "0.07em" }}>{s.label}</p>
                <p style={{ margin: "var(--ds-space-075) 0 0", fontSize: "var(--ds-font-size-400)", fontWeight: "var(--ds-font-weight-bold)", color: "var(--ds-text)", lineHeight: 1 }}>{s.value}</p>
              </div>
            ))}
          </div>

          {/* Daily trend (mini bar chart) */}
          {data.daily_trend.length > 0 && (
            <div style={{ backgroundColor: "var(--ds-surface)", border: "1px solid var(--ds-border)", borderRadius: "var(--ds-radius-200)", padding: "var(--ds-space-300)" }}>
              <p style={{ margin: "0 0 var(--ds-space-200)", fontSize: "var(--ds-font-size-100)", fontWeight: "var(--ds-font-weight-semibold)", color: "var(--ds-text)" }}>Daily cost trend</p>
              <div style={{ display: "flex", alignItems: "flex-end", gap: 3, height: 80 }}>
                {data.daily_trend.map((d) => {
                  const h = Math.max(4, (d.cost_usd / maxDailyCost) * 72);
                  return (
                    <div key={d.date} title={`${d.date}: $${d.cost_usd.toFixed(4)} (${d.calls} calls)`} style={{ flex: 1, height: h, backgroundColor: "var(--ds-background-brand-bold)", borderRadius: 2, opacity: 0.75, cursor: "default", minWidth: 4 }} />
                  );
                })}
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: "var(--ds-space-075)" }}>
                <span style={{ fontSize: "var(--ds-font-size-075)", color: "var(--ds-text-subtlest)" }}>{data.daily_trend[0]?.date}</span>
                <span style={{ fontSize: "var(--ds-font-size-075)", color: "var(--ds-text-subtlest)" }}>{data.daily_trend[data.daily_trend.length - 1]?.date}</span>
              </div>
            </div>
          )}

          {/* By action */}
          <div style={{ backgroundColor: "var(--ds-surface)", border: "1px solid var(--ds-border)", borderRadius: "var(--ds-radius-200)", overflow: "hidden" }}>
            <div style={{ padding: "var(--ds-space-200) var(--ds-space-300)", borderBottom: "1px solid var(--ds-border)" }}>
              <p style={{ margin: 0, fontSize: "var(--ds-font-size-100)", fontWeight: "var(--ds-font-weight-semibold)", color: "var(--ds-text)" }}>By action</p>
            </div>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ backgroundColor: "var(--ds-background-neutral-subtle)" }}>
                  {["Action", "Calls", "Tokens", "Cost", "% of total"].map((h) => (
                    <th key={h} style={{ padding: "var(--ds-space-150) var(--ds-space-200)", textAlign: "left", fontSize: "var(--ds-font-size-075)", fontWeight: "var(--ds-font-weight-semibold)", color: "var(--ds-text-subtlest)", textTransform: "uppercase", letterSpacing: "0.07em" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.by_action.map((r) => (
                  <tr key={r.action} style={{ borderTop: "1px solid var(--ds-border)" }}>
                    <td style={{ padding: "var(--ds-space-150) var(--ds-space-200)", fontSize: "var(--ds-font-size-100)", fontWeight: "var(--ds-font-weight-medium)", color: "var(--ds-text)" }}>{r.action}</td>
                    <td style={{ padding: "var(--ds-space-150) var(--ds-space-200)", fontSize: "var(--ds-font-size-100)", color: "var(--ds-text)", fontVariantNumeric: "tabular-nums" }}>{r.count.toLocaleString()}</td>
                    <td style={{ padding: "var(--ds-space-150) var(--ds-space-200)", fontSize: "var(--ds-font-size-100)", color: "var(--ds-text-subtle)", fontVariantNumeric: "tabular-nums" }}>{r.tokens.toLocaleString()}</td>
                    <td style={{ padding: "var(--ds-space-150) var(--ds-space-200)", fontSize: "var(--ds-font-size-100)", color: "var(--ds-text)", fontVariantNumeric: "tabular-nums" }}>${r.cost_usd.toFixed(4)}</td>
                    <td style={{ padding: "var(--ds-space-150) var(--ds-space-200)" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "var(--ds-space-100)" }}>
                        <div style={{ width: 60, height: 4, backgroundColor: "var(--ds-border)", borderRadius: 2, overflow: "hidden" }}>
                          <div style={{ height: "100%", width: pct(r.cost_usd, data.total_cost_usd), backgroundColor: "var(--ds-background-brand-bold)", borderRadius: 2 }} />
                        </div>
                        <span style={{ fontSize: "var(--ds-font-size-075)", color: "var(--ds-text-subtle)" }}>{pct(r.cost_usd, data.total_cost_usd)}</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* By model */}
          {data.by_model.length > 0 && (
            <div style={{ backgroundColor: "var(--ds-surface)", border: "1px solid var(--ds-border)", borderRadius: "var(--ds-radius-200)", overflow: "hidden" }}>
              <div style={{ padding: "var(--ds-space-200) var(--ds-space-300)", borderBottom: "1px solid var(--ds-border)" }}>
                <p style={{ margin: 0, fontSize: "var(--ds-font-size-100)", fontWeight: "var(--ds-font-weight-semibold)", color: "var(--ds-text)" }}>By model</p>
              </div>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ backgroundColor: "var(--ds-background-neutral-subtle)" }}>
                    {["Model", "Calls", "Cost", "% of total"].map((h) => (
                      <th key={h} style={{ padding: "var(--ds-space-150) var(--ds-space-200)", textAlign: "left", fontSize: "var(--ds-font-size-075)", fontWeight: "var(--ds-font-weight-semibold)", color: "var(--ds-text-subtlest)", textTransform: "uppercase", letterSpacing: "0.07em" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data.by_model.map((r) => (
                    <tr key={r.model} style={{ borderTop: "1px solid var(--ds-border)" }}>
                      <td style={{ padding: "var(--ds-space-150) var(--ds-space-200)", fontSize: "var(--ds-font-size-075)", fontFamily: "monospace", color: "var(--ds-text)" }}>{r.model}</td>
                      <td style={{ padding: "var(--ds-space-150) var(--ds-space-200)", fontSize: "var(--ds-font-size-100)", color: "var(--ds-text)", fontVariantNumeric: "tabular-nums" }}>{r.count.toLocaleString()}</td>
                      <td style={{ padding: "var(--ds-space-150) var(--ds-space-200)", fontSize: "var(--ds-font-size-100)", color: "var(--ds-text)", fontVariantNumeric: "tabular-nums" }}>${r.cost_usd.toFixed(4)}</td>
                      <td style={{ padding: "var(--ds-space-150) var(--ds-space-200)" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "var(--ds-space-100)" }}>
                          <div style={{ width: 60, height: 4, backgroundColor: "var(--ds-border)", borderRadius: 2, overflow: "hidden" }}>
                            <div style={{ height: "100%", width: pct(r.cost_usd, data.total_cost_usd), backgroundColor: "var(--ds-background-brand-bold)", borderRadius: 2 }} />
                          </div>
                          <span style={{ fontSize: "var(--ds-font-size-075)", color: "var(--ds-text-subtle)" }}>{pct(r.cost_usd, data.total_cost_usd)}</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
}
