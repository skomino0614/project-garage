export type VehicleContext = {
  maker: string;
  model: string;
  series: string;
};

export type ConsultMessage = {
  role: "user" | "assistant";
  content: string;
};

export type ConsultChatRequest = {
  vehicle: VehicleContext;
  messages: ConsultMessage[];
};

export type PriorityLevel = "high" | "medium" | "low" | "unknown";

export type ConsultSlots = {
  budgetMaxYen: number | null;
  budgetNote: string | null;
  category: string | null;
  usage: string | null;
  stylePreference: string | null;
  priorities: {
    appearance: PriorityLevel;
    comfort: PriorityLevel;
    practicality: PriorityLevel;
    resale: PriorityLevel;
  };
};

export type ConsultPhase = "clarify" | "advise";

export type ConsultChatResponse = {
  content: string;
  phase: ConsultPhase;
  followUpQuestion: string | null;
  slots: ConsultSlots;
};

export type ConsultationSummary = {
  vehicle: VehicleContext;
  budget: {
    maxYen: number | null;
    note: string | null;
  };
  category: string | null;
  usage: string | null;
  stylePreference: string | null;
  priorities: ConsultSlots["priorities"];
  direction: string | null;
};
