export const MAKERS = [
  "Toyota",
  "Honda",
  "Nissan",
  "Mazda",
  "Subaru",
  "Suzuki",
  "Mitsubishi",
  "Lexus",
  "BMW",
  "Mercedes-Benz",
  "Audi",
  "Volkswagen",
];

export const MODELS: Record<string, string[]> = {
  Toyota: ["Voxy", "86", "Supra", "GR Yaris", "Corolla", "Prius", "Land Cruiser"],
  Honda: ["Civic Type R", "S2000", "NSX", "Fit", "Vezel"],
  Nissan: ["GT-R", "Skyline", "Silvia", "Fairlady Z", "Note"],
  Mazda: ["RX-7", "Roadster (MX-5)", "CX-5", "Mazda3"],
  Subaru: ["WRX STI", "BRZ", "Forester", "Levorg"],
  Suzuki: ["Swift Sport", "Jimny", "Alto Works"],
  Mitsubishi: ["Lancer Evolution", "Eclipse Cross"],
  Lexus: ["LFA", "RC F", "IS", "LC"],
  BMW: ["M3", "M4", "M2", "3 Series"],
  "Mercedes-Benz": ["C-Class", "AMG GT", "E-Class"],
  Audi: ["RS4", "RS6", "R8", "A4"],
  Volkswagen: ["Golf GTI", "Golf R", "Polo"],
};

export const YEARS = Array.from({ length: 26 }, (_, i) => 2025 - i);
