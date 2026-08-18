import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { ArrowUp, ChevronRight } from "lucide-react";
import { GarageNav } from "../components/GarageNav";
import { consultChat } from "@/lib/consult.functions";
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

type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
};

function isOpenAiNotConfigured(error: unknown): boolean {
  const msg = error instanceof Error ? error.message : String(error);
  return msg.includes("OPENAI_NOT_CONFIGURED") || msg.includes("Missing OPENAI_API_KEY");
}

function ConsultPage() {
  const { maker, model, series } = Route.useSearch();
  const vehicleLabel = formatVehicleLabel(maker, model, series);
  const consultChatFn = useServerFn(consultChat);

  const [input, setInput] = useState("");
  const [isReplying, setIsReplying] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      role: "assistant",
      content: "この車について、何でも相談してください。",
    },
  ]);

  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, isReplying]);

  const sendMessage = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || isReplying) return;

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      content: trimmed,
    };

    const historyForApi = [...messages, userMessage].map(({ role, content }) => ({ role, content }));

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

      setMessages((prev) => [
        ...prev,
        { id: `assistant-${Date.now()}`, role: "assistant", content: result.content },
      ]);
    } catch (error) {
      if (isOpenAiNotConfigured(error)) {
        console.warn("[consult] OpenAI not configured, using mock fallback");
        const reply = generateMockConsultReply(trimmed, maker, model, series);
        setMessages((prev) => [
          ...prev,
          { id: `assistant-${Date.now()}`, role: "assistant", content: reply },
        ]);
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

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <GarageNav />

      <div className="pointer-events-none fixed inset-x-0 top-0 -z-0 h-[420px] overflow-hidden">
        <div className="absolute left-1/2 top-[-120px] h-[360px] w-[640px] -translate-x-1/2 rounded-full bg-primary/10 blur-[100px]" />
      </div>

      <main className="relative mx-auto flex w-full max-w-2xl flex-1 flex-col px-5 pb-36 pt-6 sm:pt-8">
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

        <div
          ref={scrollRef}
          className="mt-6 flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto pb-4"
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
                {message.content}
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
        </div>
      </main>

      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-border/60 bg-background/85 backdrop-blur-xl">
        <div className="mx-auto max-w-2xl px-5 py-4">
          {errorMsg && (
            <p className="mb-3 text-sm text-destructive">{errorMsg}</p>
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
