import { clearConsultState } from "./consult-state-storage";
import { shouldClearConsultStateOnLeave } from "./consult-session-navigation";

/** Persist consult snapshot, then clear storage when the session ends. */
export function handleConsultLeave(toPathname: string, persist: () => void): void {
  persist();
  if (shouldClearConsultStateOnLeave(toPathname)) {
    clearConsultState();
  }
}
