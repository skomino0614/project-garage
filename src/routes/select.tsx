import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowRight, Car } from "lucide-react";
import { GarageNav } from "../components/GarageNav";
import { useClearConsultSessionOnMount } from "@/lib/consult/use-clear-consult-session-on-mount";
import { MAKERS, MODELS, YEARS } from "@/lib/car-data";

export const Route = createFileRoute("/select")({
  head: () => ({ meta: [{ title: "車を選ぶ — Project Garage" }] }),
  component: SelectCar,
});

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs font-medium uppercase tracking-wider text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}

function SelectCar() {
  useClearConsultSessionOnMount();
  const navigate = useNavigate();
  const [maker, setMaker] = useState("");
  const [model, setModel] = useState("");
  const [year, setYear] = useState("");

  const canContinue = maker && model && year;
  const models = maker ? MODELS[maker] ?? [] : [];

  const inputCls =
    "w-full appearance-none rounded-xl border border-border bg-input px-4 py-3.5 text-sm text-foreground outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/30";

  return (
    <div className="min-h-screen bg-background">
      <GarageNav />
      <main className="mx-auto max-w-xl px-5 py-16 sm:py-24">
        <div className="animate-fade-in">
          <div className="mb-6 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Car className="h-5 w-5" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">あなたの車を教えてください</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            より精度の高い提案のために、車両情報を選択してください。
          </p>
        </div>

        <div className="animate-fade-in mt-10 space-y-5 rounded-2xl border border-border bg-card/40 p-6 backdrop-blur">
          <Field label="メーカー">
            <select className={inputCls} value={maker} onChange={(e) => { setMaker(e.target.value); setModel(""); }}>
              <option value="">選択してください</option>
              {MAKERS.map((m) => <option key={m} value={m}>{m}</option>)}
            </select>
          </Field>

          <Field label="モデル">
            <select className={inputCls} value={model} onChange={(e) => setModel(e.target.value)} disabled={!maker}>
              <option value="">{maker ? "選択してください" : "先にメーカーを選択"}</option>
              {models.map((m) => <option key={m} value={m}>{m}</option>)}
            </select>
          </Field>

          <Field label="年式">
            <select className={inputCls} value={year} onChange={(e) => setYear(e.target.value)}>
              <option value="">選択してください</option>
              {YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
            </select>
          </Field>

          <button
            disabled={!canContinue}
            onClick={() => navigate({ to: "/ask", search: { maker, model, year } as never })}
            className="glow-blue group mt-2 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3.5 text-sm font-semibold text-primary-foreground transition-all hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none"
          >
            次へ
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </button>
        </div>
      </main>
    </div>
  );
}
