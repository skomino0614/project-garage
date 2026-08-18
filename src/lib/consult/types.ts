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

export type ConsultChatResponse = {
  content: string;
  phase: "advise";
};
