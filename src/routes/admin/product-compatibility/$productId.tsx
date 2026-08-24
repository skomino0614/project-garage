import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";

import { GarageNav } from "@/components/GarageNav";
import {
  getAdminProductCompatibility,
  saveAdminProductCompatibility,
} from "@/lib/product/admin-product-compatibility.functions";

type Compatibility = {
  id: string;
  maker: string;
  model: string;
  series: string | null;
  fitmentType: string | null;
  note: string | null;
};

export const Route = createFileRoute("/admin/product-compatibility/$productId")({
  head: () => ({ meta: [{ title: "適合車種登録 — Project Garage" }] }),
  beforeLoad: ({ context }) => {
    if (!context.user) {
      throw redirect({ to: "/login" });
    }
  },
  component: AdminProductCompatibilityPage,
});

function AdminProductCompatibilityPage() {
  const { productId } = Route.useParams();
  const getCompatibilityFn = useServerFn(getAdminProductCompatibility);
  const saveCompatibilityFn = useServerFn(saveAdminProductCompatibility);

  const [product, setProduct] = useState<{
    id: string;
    name: string;
    brand: string;
    category: string;
  } | null>(null);
  const [compatibilities, setCompatibilities] = useState<Compatibility[]>([]);
  const [maker, setMaker] = useState("Toyota");
  const [model, setModel] = useState("Voxy");
  const [series, setSeries] = useState("90 Series");
  const [fitmentType, setFitmentType] = useState<"reference" | "confirmed">("reference");
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setErrorMsg(null);

    try {
      const result = await getCompatibilityFn({ data: { productId } });
      setProduct(result.product);
      setCompatibilities(result.compatibilities);
    } catch (error) {
      console.error(error);
      setErrorMsg(error instanceof Error ? error.message : "適合情報の取得に失敗しました。");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, [productId]);

  const handleSave = async () => {
    setSaving(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const result = await saveCompatibilityFn({
        data: {
          productId,
          maker,
          model,
          series: series || null,
          fitmentType,
          note: note || null,
        },
      });

      setSuccessMsg(result.updated ? "適合情報を更新しました。" : "適合情報を登録しました。");
      await load();
    } catch (error) {
      console.error(error);
      setErrorMsg(error instanceof Error ? error.message : "適合情報の登録に失敗しました。");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <GarageNav />
      <main className="mx-auto max-w-3xl px-5 py-10">
        <div className="mb-6">
          <Link to="/admin/product-import" className="text-sm text-primary hover:underline">
            ← 商品登録へ戻る
          </Link>
          <h1 className="mt-3 text-2xl font-semibold tracking-tight">適合車種を登録</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            商品ごとに車種適合情報を登録します。根拠がメーカー公式なら「確定適合」、販売店等の参考適合なら「参考適合」を選択してください。
          </p>
        </div>

        {loading ? <p className="text-sm text-muted-foreground">読み込み中…</p> : null}
        {errorMsg ? <p className="mb-4 text-sm text-destructive">{errorMsg}</p> : null}
        {successMsg ? <p className="mb-4 text-sm text-primary">{successMsg}</p> : null}

        {product ? (
          <>
            <section className="rounded-2xl border border-border/80 bg-card/50 p-5">
              <p className="text-xs text-muted-foreground">商品</p>
              <h2 className="mt-1 text-lg font-semibold">{product.name}</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {product.brand} / {product.category}
              </p>

              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <label className="space-y-1 text-sm">
                  <span className="font-medium">メーカー</span>
                  <input
                    value={maker}
                    onChange={(event) => setMaker(event.target.value)}
                    className="w-full rounded-xl border border-border bg-background px-3 py-2"
                  />
                </label>

                <label className="space-y-1 text-sm">
                  <span className="font-medium">車種</span>
                  <input
                    value={model}
                    onChange={(event) => setModel(event.target.value)}
                    className="w-full rounded-xl border border-border bg-background px-3 py-2"
                  />
                </label>

                <label className="space-y-1 text-sm">
                  <span className="font-medium">シリーズ</span>
                  <input
                    value={series}
                    onChange={(event) => setSeries(event.target.value)}
                    placeholder="例：90 Series"
                    className="w-full rounded-xl border border-border bg-background px-3 py-2"
                  />
                </label>

                <label className="space-y-1 text-sm">
                  <span className="font-medium">適合種別</span>
                  <select
                    value={fitmentType}
                    onChange={(event) => setFitmentType(event.target.value as "reference" | "confirmed")}
                    className="w-full rounded-xl border border-border bg-background px-3 py-2"
                  >
                    <option value="reference">参考適合</option>
                    <option value="confirmed">確定適合</option>
                  </select>
                </label>
              </div>

              <label className="mt-4 block space-y-1 text-sm">
                <span className="font-medium">適合メモ</span>
                <textarea
                  value={note}
                  onChange={(event) => setNote(event.target.value)}
                  rows={6}
                  placeholder="例：2WD（MZRA90W / ZWR90W）。18×7.5J、5H-114.3、インセット+45。"
                  className="w-full rounded-xl border border-border bg-background px-3 py-2"
                />
              </label>

              <button
                type="button"
                onClick={handleSave}
                disabled={saving || !maker.trim() || !model.trim()}
                className="mt-4 rounded-xl bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground disabled:opacity-50"
              >
                {saving ? "登録中…" : "適合情報を登録"}
              </button>
            </section>

            <section className="mt-6 rounded-2xl border border-border/80 bg-card/40 p-5">
              <h2 className="text-lg font-semibold">登録済みの適合情報</h2>
              {compatibilities.length === 0 ? (
                <p className="mt-3 text-sm text-muted-foreground">まだ登録されていません。</p>
              ) : (
                <div className="mt-4 space-y-3">
                  {compatibilities.map((compatibility) => (
                    <article key={compatibility.id} className="rounded-xl border border-border/70 p-4">
                      <div className="flex flex-wrap items-center gap-2 text-sm">
                        <strong>
                          {compatibility.maker} {compatibility.model}
                          {compatibility.series ? ` / ${compatibility.series}` : ""}
                        </strong>
                        <span className="rounded-full border border-border px-2 py-0.5 text-xs">
                          {compatibility.fitmentType === "confirmed" ? "確定適合" : compatibility.fitmentType === "reference" ? "参考適合" : "未分類"}
                        </span>
                      </div>
                      {compatibility.note ? (
                        <p className="mt-2 whitespace-pre-wrap text-xs leading-relaxed text-muted-foreground">
                          {compatibility.note}
                        </p>
                      ) : null}
                    </article>
                  ))}
                </div>
              )}
            </section>
          </>
        ) : null}
      </main>
    </div>
  );
}
