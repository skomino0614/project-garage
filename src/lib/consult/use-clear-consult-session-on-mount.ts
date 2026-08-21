import { useEffect } from "react";

import { clearConsultState } from "./consult-state-storage";

/** End the consult session when entering TOP / select / ask. */
export function useClearConsultSessionOnMount(): void {
  useEffect(() => {
    clearConsultState();
  }, []);
}
