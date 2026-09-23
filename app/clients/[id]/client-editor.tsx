"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

type ClientHeader = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
};

type Parq = {
  id?: string;
  client_id: string;
  q1_heart_condition: boolean;
  q2_chest_pain_activity: boolean;
  q3_chest_pain_rest: boolean;
  q4_dizziness_balance: boolean;
  q5_bone_joint_problem: boolean;
  q6_bp_or_heart_drugs: boolean;
  q7_other_reason: boolean;
  notes: string | null;
  assessed_at: string;
  cleared?: boolean;
} | null;

type MovementScreen = {
  id?: string;
  client_id: string;
  years_training: string;
  current_goal: string;
  injury_notes: string;
  assessed_at: string;
} | null;

type ClientMetric = {
  id: string | null;
  name: string;
  value: string;
  unit: string;
  recorded_at: string;
};

type MovementFinding = { id: string; label: string; restricted: boolean };

const DEFAULT_STRENGTH_MOVEMENTS: { name: string; unit: string }[] = [
  { name: "Push-ups", unit: "reps" },
  { name: "Pull-ups", unit: "reps" },
  { name: "Dips", unit: "reps" },
  { name: "L-sit", unit: "seconds" },
  { name: "Chin-ups", unit: "reps" },
  { name: "Cardio (optional)", unit: "minutes" },
];

const DEFAULT_MOBILITY_CHECKS = ["Ankle", "Wrist", "Hip", "Shoulders"];

const PARQ_QUESTIONS: { key: keyof NonNullable<Parq>; label: string }[] = [
  {
    key: "q1_heart_condition",
    label:
      "Has a doctor ever said this person has a heart condition and should only do physical activity recommended by a doctor?",
  },
  {
    key: "q2_chest_pain_activity",
    label: "Do they feel pain in their chest when they do physical activity?",
  },
  {
    key: "q3_chest_pain_rest",
    label:
      "In the past month, have they had chest pain when not doing physical activity?",
  },
  {
    key: "q4_dizziness_balance",
    label:
      "Do they lose their balance because of dizziness, or ever lose consciousness?",
  },
  {
    key: "q5_bone_joint_problem",
    label:
      "Do they have a bone or joint problem that could be made worse by a change in physical activity?",
  },
  {
    key: "q6_bp_or_heart_drugs",
    label:
      "Is a doctor currently prescribing drugs for their blood pressure or a heart condition?",
  },
  {
    key: "q7_other_reason",
    label:
      "Do they know of any other reason they should not do physical activity?",
  },
];

type MovementScreenInput = {
  id: string;
  client_id: string;
  years_training: number | null;
  current_goal: string | null;
  injury_notes: string | null;
  assessed_at: string;
} | null;

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function emptyParq(clientId: string): Parq {
  return {
    client_id: clientId,
    q1_heart_condition: false,
    q2_chest_pain_activity: false,
    q3_chest_pain_rest: false,
    q4_dizziness_balance: false,
    q5_bone_joint_problem: false,
    q6_bp_or_heart_drugs: false,
    q7_other_reason: false,
    notes: null,
    assessed_at: todayISO(),
  };
}

function emptyMovementScreen(clientId: string): MovementScreen {
  return {
    client_id: clientId,
    years_training: "",
    current_goal: "",
    injury_notes: "",
    assessed_at: todayISO(),
  };
}

function toMovementScreenState(input: MovementScreenInput): MovementScreen {
  if (!input) return null;
  return {
    id: input.id,
    client_id: input.client_id,
    years_training: input.years_training?.toString() ?? "",
    current_goal: input.current_goal ?? "",
    injury_notes: input.injury_notes ?? "",
    assessed_at: input.assessed_at,
  };
}

export default function ClientEditor({
  client,
  parq: initialParq,
  movementScreen: initialMovementScreen,
  movementFindings,
  clientMetrics,
}: {
  client: ClientHeader;
  parq: Parq;
  movementScreen: MovementScreenInput;
  movementFindings: MovementFinding[];
  clientMetrics: ClientMetric[];
}) {
  const [name, setName] = useState(client.name);
  const [email, setEmail] = useState(client.email ?? "");
  const [phone, setPhone] = useState(client.phone ?? "");
  const [parq, setParq] = useState<Parq>(initialParq ?? emptyParq(client.id));
  const [screen, setScreen] = useState<MovementScreen>(
    toMovementScreenState(initialMovementScreen) ??
      emptyMovementScreen(client.id),
  );
  const [findings, setFindings] = useState<MovementFinding[]>(movementFindings);
  const [newFinding, setNewFinding] = useState("");
  const [newFindingRestricted, setNewFindingRestricted] = useState(false);
  const [metrics, setMetrics] = useState<ClientMetric[]>(
    clientMetrics.length > 0
      ? clientMetrics.map((m) => ({ ...m, value: String(m.value) }))
      : DEFAULT_STRENGTH_MOVEMENTS.map((d) => ({
          id: null,
          name: d.name,
          value: "",
          unit: d.unit,
          recorded_at: todayISO(),
        })),
  );

  async function saveHeader() {
    const supabase = createClient();
    await supabase
      .from("clients")
      .update({ name, email: email || null, phone: phone || null })
      .eq("id", client.id);
  }

  function updateParqField<K extends keyof NonNullable<Parq>>(
    field: K,
    value: NonNullable<Parq>[K],
  ) {
    setParq((prev) => (prev ? { ...prev, [field]: value } : prev));
  }

  async function saveParq() {
    if (!parq) return;
    const supabase = createClient();
    const { data } = await supabase
      .from("parq_answers")
      .upsert(
        {
          client_id: client.id,
          q1_heart_condition: parq.q1_heart_condition,
          q2_chest_pain_activity: parq.q2_chest_pain_activity,
          q3_chest_pain_rest: parq.q3_chest_pain_rest,
          q4_dizziness_balance: parq.q4_dizziness_balance,
          q5_bone_joint_problem: parq.q5_bone_joint_problem,
          q6_bp_or_heart_drugs: parq.q6_bp_or_heart_drugs,
          q7_other_reason: parq.q7_other_reason,
          notes: parq.notes,
          assessed_at: parq.assessed_at,
        },
        { onConflict: "client_id" },
      )
      .select()
      .single();
    if (data) setParq(data);
  }

  function updateScreenField<K extends keyof NonNullable<MovementScreen>>(
    field: K,
    value: NonNullable<MovementScreen>[K],
  ) {
    setScreen((prev) => (prev ? { ...prev, [field]: value } : prev));
  }

  async function saveScreen() {
    if (!screen) return;
    const supabase = createClient();
    const toNumOrNull = (v: string) => (v === "" ? null : Number(v));
    const { data } = await supabase
      .from("movement_screens")
      .upsert(
        {
          client_id: client.id,
          years_training: toNumOrNull(screen.years_training),
          current_goal: screen.current_goal || null,
          injury_notes: screen.injury_notes || null,
          assessed_at: screen.assessed_at,
        },
        { onConflict: "client_id" },
      )
      .select()
      .single();
    if (data) setScreen(toMovementScreenState(data));
  }

  async function insertFinding(label: string, restricted: boolean) {
    const supabase = createClient();
    const { data } = await supabase
      .from("movement_findings")
      .insert({ client_id: client.id, label, restricted })
      .select()
      .single();
    if (data) setFindings((prev) => [...prev, data]);
  }

  async function addFinding(e: React.FormEvent) {
    e.preventDefault();
    if (!newFinding.trim()) return;
    await insertFinding(newFinding.trim(), newFindingRestricted);
    setNewFinding("");
    setNewFindingRestricted(false);
  }

  async function toggleFindingRestricted(id: string, restricted: boolean) {
    setFindings((prev) =>
      prev.map((f) => (f.id === id ? { ...f, restricted: !restricted } : f)),
    );
    const supabase = createClient();
    await supabase
      .from("movement_findings")
      .update({ restricted: !restricted })
      .eq("id", id);
  }

  async function deleteFinding(id: string) {
    const supabase = createClient();
    await supabase.from("movement_findings").delete().eq("id", id);
    setFindings((prev) => prev.filter((f) => f.id !== id));
  }

  function addMetricRow() {
    setMetrics((prev) => [
      ...prev,
      { id: null, name: "", value: "", unit: "level", recorded_at: todayISO() },
    ]);
  }

  function updateMetricField(
    index: number,
    field: keyof ClientMetric,
    value: string,
  ) {
    setMetrics((prev) =>
      prev.map((m, i) => (i === index ? { ...m, [field]: value } : m)),
    );
  }

  async function saveMetric(index: number) {
    const metric = metrics[index];
    if (!metric.name || !metric.value) return;

    const supabase = createClient();
    if (metric.id) {
      await supabase
        .from("client_metrics")
        .update({
          name: metric.name,
          value: Number(metric.value),
          unit: metric.unit,
          recorded_at: metric.recorded_at,
        })
        .eq("id", metric.id);
    } else {
      const { data } = await supabase
        .from("client_metrics")
        .insert({
          client_id: client.id,
          name: metric.name,
          value: Number(metric.value),
          unit: metric.unit,
          recorded_at: metric.recorded_at,
        })
        .select()
        .single();
      if (data) {
        setMetrics((prev) =>
          prev.map((m, i) => (i === index ? { ...m, id: data.id } : m)),
        );
      }
    }
  }

  async function deleteMetric(index: number) {
    const metric = metrics[index];
    if (metric.id) {
      const supabase = createClient();
      await supabase.from("client_metrics").delete().eq("id", metric.id);
    }
    setMetrics((prev) => prev.filter((_, i) => i !== index));
  }

  return (
    <div className="mt-3">
      <div className="mb-6 space-y-2">
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onBlur={saveHeader}
          className="block w-full bg-transparent text-2xl font-semibold outline-none"
        />
        <div className="flex gap-2">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onBlur={saveHeader}
            placeholder="Email"
            className="flex-1 rounded-md bg-neutral-900 border border-neutral-800 px-3 py-2 text-sm"
          />
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            onBlur={saveHeader}
            placeholder="Phone"
            className="flex-1 rounded-md bg-neutral-900 border border-neutral-800 px-3 py-2 text-sm"
          />
        </div>
      </div>

      <div className="mb-6 rounded-lg border border-neutral-800 bg-neutral-900 p-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-medium text-neutral-200">
            PAR-Q (Physical Activity Readiness Questionnaire)
          </h2>
          {parq && (
            <span
              className={`text-xs rounded-full px-2 py-0.5 ${
                (parq.cleared ?? true)
                  ? "bg-green-900/40 text-green-300"
                  : "bg-amber-900/40 text-amber-300"
              }`}
            >
              {(parq.cleared ?? true) ? "Cleared" : "Consult physician"}
            </span>
          )}
        </div>

        <div className="space-y-3 mb-3">
          {PARQ_QUESTIONS.map((q) => (
            <label key={q.key} className="flex items-start gap-2 text-sm">
              <input
                type="checkbox"
                checked={Boolean(parq?.[q.key])}
                onChange={(e) => {
                  updateParqField(
                    q.key,
                    e.target.checked as NonNullable<Parq>[typeof q.key],
                  );
                }}
                onBlur={saveParq}
                className="rounded border-neutral-700 bg-neutral-950 mt-1"
              />
              <span className="text-neutral-300">{q.label}</span>
            </label>
          ))}
        </div>

        <textarea
          value={parq?.notes ?? ""}
          onChange={(e) => updateParqField("notes", e.target.value)}
          onBlur={saveParq}
          placeholder="Additional notes..."
          rows={2}
          className="w-full rounded-md bg-neutral-950 border border-neutral-800 px-3 py-2 text-sm mb-2 resize-none"
        />

        <div className="flex items-center gap-2 text-xs text-neutral-500">
          <span>Assessed on</span>
          <input
            type="date"
            value={parq?.assessed_at ?? todayISO()}
            onChange={(e) => updateParqField("assessed_at", e.target.value)}
            onBlur={saveParq}
            className="rounded-md bg-neutral-950 border border-neutral-800 px-2 py-1 text-xs"
          />
        </div>
      </div>

      <div className="mb-6 rounded-lg border border-neutral-800 bg-neutral-900 p-4">
        <h2 className="text-sm font-medium text-neutral-200 mb-1">
          Movement screen
        </h2>
        <p className="text-xs text-neutral-500 mb-3">
          Log baseline strength (pull-ups, push-ups, etc.) as a dated entry in
          Progression below.
        </p>

        <div className="mb-4">
          <label className="block text-xs text-neutral-500 mb-1">
            Movement checks
          </label>
          {findings.length > 0 && (
            <div className="space-y-1.5 mb-2">
              {findings.map((f) => (
                <div
                  key={f.id}
                  className="flex items-center gap-2 text-sm rounded-md bg-neutral-950 border border-neutral-800 px-3 py-1.5"
                >
                  <input
                    type="checkbox"
                    checked={f.restricted}
                    onChange={() => toggleFindingRestricted(f.id, f.restricted)}
                    className="rounded border-neutral-700 bg-neutral-900"
                  />
                  <span
                    className={`flex-1 ${f.restricted ? "text-amber-300" : "text-neutral-300"}`}
                  >
                    {f.label}
                  </span>
                  <button
                    type="button"
                    onClick={() => deleteFinding(f.id)}
                    className="text-neutral-600 hover:text-red-400 transition text-xs"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
          {(() => {
            const existingLabels = findings.map((f) => f.label.toLowerCase());
            const suggestions = DEFAULT_MOBILITY_CHECKS.filter(
              (m) => !existingLabels.includes(m.toLowerCase()),
            );
            return suggestions.length > 0 ? (
              <div className="flex flex-wrap gap-1.5 mb-2">
                {suggestions.map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => insertFinding(m, false)}
                    className="text-xs rounded-full bg-neutral-800 text-neutral-300 hover:bg-neutral-700 px-2 py-1 transition"
                  >
                    + {m}
                  </button>
                ))}
              </div>
            ) : null;
          })()}
          <form onSubmit={addFinding} className="flex items-center gap-2">
            <input
              type="text"
              value={newFinding}
              onChange={(e) => setNewFinding(e.target.value)}
              placeholder="e.g. shoulder overhead mobility"
              className="flex-1 rounded-md bg-neutral-950 border border-neutral-800 px-3 py-2 text-sm"
            />
            <label className="flex items-center gap-1.5 text-xs text-neutral-400 whitespace-nowrap">
              <input
                type="checkbox"
                checked={newFindingRestricted}
                onChange={(e) => setNewFindingRestricted(e.target.checked)}
                className="rounded border-neutral-700 bg-neutral-950"
              />
              Restricted
            </label>
            <button
              type="submit"
              className="rounded-md bg-neutral-800 text-neutral-200 px-3 py-2 text-sm font-medium hover:bg-neutral-700 transition"
            >
              Add
            </button>
          </form>
        </div>

        <div className="flex gap-2 mb-3">
          <div className="flex-1">
            <label className="block text-xs text-neutral-500 mb-1">
              Years training
            </label>
            <input
              type="number"
              step="0.5"
              value={screen?.years_training ?? ""}
              onChange={(e) =>
                updateScreenField("years_training", e.target.value)
              }
              onBlur={saveScreen}
              className="w-full rounded-md bg-neutral-950 border border-neutral-800 px-2 py-1.5 text-sm"
            />
          </div>
          <div className="flex-[2]">
            <label className="block text-xs text-neutral-500 mb-1">
              Current goal
            </label>
            <input
              type="text"
              value={screen?.current_goal ?? ""}
              onChange={(e) =>
                updateScreenField("current_goal", e.target.value)
              }
              onBlur={saveScreen}
              placeholder="e.g. front lever"
              className="w-full rounded-md bg-neutral-950 border border-neutral-800 px-2 py-1.5 text-sm"
            />
          </div>
        </div>

        <label className="block text-xs text-neutral-500 mb-1">
          Prior injuries / areas to avoid loading
        </label>
        <textarea
          value={screen?.injury_notes ?? ""}
          onChange={(e) => updateScreenField("injury_notes", e.target.value)}
          onBlur={saveScreen}
          rows={2}
          className="w-full rounded-md bg-neutral-950 border border-neutral-800 px-3 py-2 text-sm mb-2 resize-none"
        />

        <div className="flex items-center gap-2 text-xs text-neutral-500">
          <span>Assessed on</span>
          <input
            type="date"
            value={screen?.assessed_at ?? todayISO()}
            onChange={(e) => updateScreenField("assessed_at", e.target.value)}
            onBlur={saveScreen}
            className="rounded-md bg-neutral-950 border border-neutral-800 px-2 py-1 text-xs"
          />
        </div>
      </div>

      <div className="mb-6">
        <h2 className="text-sm font-medium text-neutral-400 mb-2">
          Progression
        </h2>
        <div className="space-y-2 mb-2">
          {metrics.map((m, i) => (
            <div key={m.id ?? `new-${i}`} className="flex gap-2">
              <input
                type="text"
                placeholder="e.g. tuck planche"
                value={m.name}
                onChange={(e) => updateMetricField(i, "name", e.target.value)}
                onBlur={() => saveMetric(i)}
                className="flex-1 rounded-md bg-neutral-900 border border-neutral-800 px-3 py-2 text-sm"
              />
              <input
                type="number"
                placeholder="value"
                value={m.value}
                onChange={(e) => updateMetricField(i, "value", e.target.value)}
                onBlur={() => saveMetric(i)}
                className="w-20 rounded-md bg-neutral-900 border border-neutral-800 px-3 py-2 text-sm"
              />
              <select
                value={m.unit}
                onChange={(e) => {
                  updateMetricField(i, "unit", e.target.value);
                  saveMetric(i);
                }}
                className="rounded-md bg-neutral-900 border border-neutral-800 px-2 py-2 text-sm"
              >
                <option value="level">level</option>
                <option value="reps">reps</option>
                <option value="seconds">seconds</option>
              </select>
              <input
                type="date"
                value={m.recorded_at}
                onChange={(e) =>
                  updateMetricField(i, "recorded_at", e.target.value)
                }
                onBlur={() => saveMetric(i)}
                className="rounded-md bg-neutral-900 border border-neutral-800 px-2 py-2 text-sm"
              />
              <button
                type="button"
                onClick={() => deleteMetric(i)}
                className="text-neutral-500 hover:text-red-400 transition px-1"
              >
                ×
              </button>
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={addMetricRow}
          className="text-xs text-neutral-400 hover:text-neutral-200 transition"
        >
          + Add progression entry
        </button>
      </div>
    </div>
  );
}
