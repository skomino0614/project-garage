import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { ArrowUp, ChevronRight } from "lucide-react";
import { GarageNav } from "../components/GarageNav";
import { consultChat } from "@/lib/consult.functions";
import {
  buildConsultationSummary,
  formatBudgetLabel,
  hasSummaryDetails,
  resolveConsultSlots,
  summaryPriorityLabels,
} from "@/lib/consult/build-summary";
import { formatConsultContent } from "@/lib/consult/format-content";
import type { ConsultationSummary } from "@/lib/consult/types";
import {
  categoryPrompt,
  formatVehicleLabel,
  generateMockConsultReply,
  type ConsultSearch,
} from "@/lib/consult-mock";

export const Route = createFileRoute("/consult")({
  head: () => ({ meta: [{ title: "車について相談 — Project Garage" }] }),
  validateSearch: (s: Record<string, unknown>): Required<ConsultSearch> => ({
    maker: typeof s.maker === "string" && s.maker ? s.maker : "Toyota",
    model: typeof s.model === "string" && s.model ? s.model : "Voxy",
    series: typeof s.series === "string" && s.series ? s.series : "90 Series",
  }),
  component: ConsultPage,
});

const CHIPS = ["ドラレコ", "ホイール", "タイヤ", "車高調", "コーティング", "リセール"];

const EXAMPLE_QUESTIONS = [
  "20万円以内でおすすめのホイールは？",
  "90系ヴォクシーにおすすめのドラレコは？",
  "乗り心地を落とさずローダウンしたい",
  "純正っぽくカスタムしたい",
];

const FOOTER_INSET_FALLBACK_PX = 160;
const SCROLL_NEAR_BOTTOM_PX = 120;
const FOOTER_SCROLL_BUFFER_PX = 24;

type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
};

function isOpenAiNotConfigured(error: unknown): boolean {
  const msg = error instanceof Error ? error.message : String(error);
  return msg.includes("OPENAI_NOT_CONFIGURED") || msg.includes("Missing OPENAI_API_KEY");
}

function CompactSummaryCard({
  summary,
  budgetLabel,
  priorityLabels,
}: {
  summary: ConsultationSummary;
  budgetLabel: string | null;
  priorityLabels: string[];
}) {
  const vehicle = formatVehicleLabel(summary.vehicle.maker, summary.vehicle.model, summary.vehicle.series);
  const lines: Array<{ label: string; value: string }> = [{ label: "車種", value: vehicle }];

  if (budgetLabel) lines.push({ label: "予算", value: budgetLabel });
  if (summary.category) lines.push({ label: "カテゴリ", value: summary.category });
  if (summary.usage) lines.push({ label: "用途", value: summary.usage });
  if (summary.stylePreference) lines.push({ label: "好み", value: summary.stylePreference });
  if (priorityLabels.length > 0) {
    lines.push({ label: "重視", value: priorityLabels.join(" / ") });
  }
  if (summary.direction) lines.push({ label: "方向性", value: summary.direction });

  return (
    <div className="animate-fade-in mb-3 rounded-2xl border border-border/80 bg-card/50 px-3.5 py-2.5 backdrop-blur">
      <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
        あなたのカスタム条件
      </p>
      <dl className="mt-1.5 space-y-0.5 text-xs leading-relaxed sm:text-[13px]">
        {lines.map(({ label, value }) => (
          <div key={label} className="flex gap-1.5">
            <dt className="shrink-0 text-muted-foreground">{label}:</dt>
            <dd className="min-w-0 text-foreground">{value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

function ConsultPage() {
  const { maker, model, series } = Route.useSearch();
  const vehicleLabel = formatVehicleLabel(maker, model, series);
  const consultChatFn = useServerFn(consultChat);

  const [input, setInput] = useState("");
  const [isReplying, setIsReplying] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [summary, setSummary] = useState<ConsultationSummary | null>(null);
  const [footerInset, setFooterInset] = useState(FOOTER_INSET_FALLBACK_PX);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      role: "assistant",
      content: "この車について、何でも相談してください。",
    },
  ]);

  const scrollRef = useRef<HTMLDivElement>(null);
  const footerRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const isNearBottomRef = useRef(true);
  const pendingAutoScrollRef = useRef(false);

  const showSummary = Boolean(summary && hasSummaryDetails(summary));

  const syncFooterInset = useCallback(() => {
    const footer = footerRef.current;
    if (!footer) return;
    setFooterInset(footer.offsetHeight);
  }, []);

  useEffect(() => {
    const footer = footerRef.current;
    if (!footer) return;

    syncFooterInset();
    const observer = new ResizeObserver(() => syncFooterInset());
    observer.observe(footer);

    const viewport = window.visualViewport;
    const onViewportChange = () => syncFooterInset();
    viewport?.addEventListener("resize", onViewportChange);
    viewport?.addEventListener("scroll", onViewportChange);

    return () => {
      observer.disconnect();
      viewport?.removeEventListener("resize", onViewportChange);
      viewport?.removeEventListener("scroll", onViewportChange);
    };
  }, [syncFooterInset, showSummary, errorMsg, isReplying, input]);

  const scrollToLatest = useCallback(() => {
    const anchor = messagesEndRef.current;
    if (anchor) {
      anchor.scrollIntoView({ block: "end", behavior: "smooth" });
      return;
    }
    const scrollEl = scrollRef.current;
    scrollEl?.scrollTo({ top: scrollEl.scrollHeight, behavior: "smooth" });
  }, []);

  useEffect(() => {
    if (!isNearBottomRef.current && !pendingAutoScrollRef.current) return;

    pendingAutoScrollRef.current = false;
    requestAnimationFrame(() => {
      requestAnimationFrame(scrollToLatest);
    });
  }, [messages, isReplying, footerInset, scrollToLatest]);

  useEffect(() => {
    const scrollEl = scrollRef.current;
    if (!scrollEl) return;

    const onScroll = () => {
      isNearBottomRef.current =
        scrollEl.scrollHeight - scrollEl.scrollTop - scrollEl.clientHeight <= SCROLL_NEAR_BOTTOM_PX;
    };

    onScroll();
    scrollEl.addEventListener("scroll", onScroll, { passive: true });
    return () => scrollEl.removeEventListener("scroll", onScroll);
  }, []);

  const sendMessage = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || isReplying) return;

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      content: trimmed,
    };

    const historyForApi = [...messages, userMessage].map(({ role, content }) => ({ role, content }));

    isNearBottomRef.current = true;
    pendingAutoScrollRef.current = true;
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsReplying(true);
    setErrorMsg(null);

    try {
      const result = await consultChatFn({
        data: {
          vehicle: { maker, model, series },
          messages: historyForApi,
        },
      });

      pendingAutoScrollRef.current = true;
      setMessages((prev) => [
        ...prev,
        {
          id: `assistant-${Date.now()}`,
          role: "assistant",
          content: formatConsultContent(result.content),
        },
      ]);
      setSummary(
        buildConsultationSummary(
          maker,
          model,
          series,
          resolveConsultSlots(result.slots, historyForApi),
        ),
      );
    } catch (error) {
      if (isOpenAiNotConfigured(error)) {
        console.warn("[consult] OpenAI not configured, using mock fallback");
        const reply = generateMockConsultReply(trimmed, maker, model, series);
        pendingAutoScrollRef.current = true;
        setMessages((prev) => [
          ...prev,
          {
            id: `assistant-${Date.now()}`,
            role: "assistant",
            content: formatConsultContent(reply),
          },
        ]);
        setSummary(
          buildConsultationSummary(
            maker,
            model,
            series,
            resolveConsultSlots(undefined, historyForApi),
          ),
        );
      } else {
        console.error("[consult] Failed to generate reply");
        setErrorMsg("回答の生成に失敗しました。もう一度お試しください。");
      }
    } finally {
      setIsReplying(false);
    }
  };

  const handleSubmit = () => sendMessage(input);

  const handleExampleClick = (example: string) => {
    setInput(example);
    inputRef.current?.focus();
  };

  const handleCategoryClick = (chip: string) => {
    const prompt = categoryPrompt(chip, maker, model, series);
    setInput(prompt);
    inputRef.current?.focus();
  };

  const showExamples = messages.length === 1 && !isReplying;
  const budgetLabel = summary ? formatBudgetLabel(summary) : null;
  const priorityLabels = summary ? summaryPriorityLabels(summary) : [];

  return (
    <div className="flex h-[100dvh] flex-col overflow-hidden bg-background">
      <GarageNav />

      <div className="pointer-events-none fixed inset-x-0 top-0 -z-0 h-[420px] overflow-hidden">
        <div className="absolute left-1/2 top-[-120px] h-[360px] w-[640px] -translate-x-1/2 rounded-full bg-primary/10 blur-[100px]" />
      </div>

      <main className="relative mx-auto flex min-h-0 w-full max-w-2xl flex-1 flex-col px-5 pt-6 sm:pt-8">
        <header className="animate-fade-in shrink-0">
          <Link
            to="/"
            className="group inline-flex items-center gap-1.5 rounded-full border border-border/70 bg-card/50 px-3.5 py-1.5 text-xs text-muted-foreground backdrop-blur transition-colors hover:border-primary/50 hover:text-foreground"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-primary" />
            <span className="font-medium text-foreground/90">Project Garage</span>
          </Link>

          <p className="mt-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            車両
          </p>
          <h1 className="mt-1 text-xl font-bold tracking-tight text-foreground sm:text-2xl">
            {vehicleLabel}
          </h1>
        </header>

        <div ref={scrollRef} className="mt-6 min-h-0 flex-1 overflow-y-auto overscroll-contain">
          <div
            className="flex flex-col gap-4"
            style={{ paddingBottom: footerInset + FOOTER_SCROLL_BUFFER_PX }}
          >
            {messages.map((message) => (
              <div
                key={message.id}
                className={`animate-fade-in flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[88%] rounded-2xl px-4 py-3 text-sm leading-relaxed sm:max-w-[85%] sm:text-[15px] ${
                    message.role === "user"
                      ? "rounded-br-md border border-primary/30 bg-primary/15 text-foreground"
                      : "rounded-bl-md border border-border/80 bg-card/60 text-foreground/95 backdrop-blur"
                  }`}
                >
                  {message.role === "assistant"
                    ? formatConsultContent(message.content)
                    : message.content}
                </div>
              </div>
            ))}

            {showExamples && (
              <div className="animate-fade-in space-y-2 pl-1">
                <p className="text-xs text-muted-foreground/70">例）</p>
                <ul className="space-y-2">
                  {EXAMPLE_QUESTIONS.map((example) => (
                    <li key={example}>
                      <button
                        type="button"
                        onClick={() => handleExampleClick(example)}
                        className="group flex w-full items-start gap-2 rounded-xl border border-border/60 bg-card/30 px-3 py-2.5 text-left text-sm text-muted-foreground transition-all hover:border-primary/40 hover:bg-card/50 hover:text-foreground"
                      >
                        <ChevronRight className="mt-0.5 h-3.5 w-3.5 shrink-0 opacity-40 transition-opacity group-hover:opacity-80" />
                        <span>{example}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {isReplying && (
              <div className="animate-fade-in flex justify-start">
                <div className="rounded-2xl rounded-bl-md border border-border/80 bg-card/60 px-4 py-3 backdrop-blur">
                  <div className="flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-primary/70" />
                    <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-primary/50 [animation-delay:150ms]" />
                    <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-primary/30 [animation-delay:300ms]" />
                  </div>
                </div>
              </div>
            )}
            <div
              ref={messagesEndRef}
              aria-hidden
              className="h-px w-full shrink-0"
              style={{ scrollMarginBottom: footerInset + FOOTER_SCROLL_BUFFER_PX }}
            />
          </div>
        </div>
      </main>

      <div
        ref={footerRef}
        className="fixed inset-x-0 bottom-0 z-30 border-t border-border/60 bg-background/85 pb-[max(0px,env(safe-area-inset-bottom))] backdrop-blur-xl"
      >
        <div className="mx-auto max-w-2xl px-5 py-3 sm:py-4">
          {errorMsg && <p className="mb-2 text-sm text-destructive">{errorMsg}</p>}
          {showSummary && summary && (
            <CompactSummaryCard
              summary={summary}
              budgetLabel={budgetLabel}
              priorityLabels={priorityLabels}
            />
          )}
          <div className="mb-3 flex flex-wrap gap-2">
            {CHIPS.map((chip) => (
              <button
                key={chip}
                type="button"
                onClick={() => handleCategoryClick(chip)}
                disabled={isReplying}
                className="rounded-full border border-border/70 bg-card/40 px-3.5 py-1.5 text-xs text-muted-foreground transition-all hover:border-primary/50 hover:bg-card/60 hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50 sm:text-sm"
              >
                {chip}
              </button>
            ))}
          </div>

          <div className="rounded-2xl border border-border/80 bg-card/60 p-2 backdrop-blur transition-all focus-within:border-primary/60 focus-within:glow-blue">
            <div className="flex items-end gap-2">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSubmit();
                  }
                }}
                placeholder="この車について質問してください"
                rows={1}
                disabled={isReplying}
                className="max-h-32 min-h-[44px] flex-1 resize-none bg-transparent px-3 py-2.5 text-sm leading-relaxed text-foreground placeholder:text-muted-foreground/60 outline-none disabled:opacity-50 sm:text-base"
              />
              <button
                type="button"
                onClick={handleSubmit}
                disabled={!input.trim() || isReplying}
                aria-label="送信"
                className="mb-0.5 inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground transition-all hover:bg-primary/90 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ArrowUp className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
