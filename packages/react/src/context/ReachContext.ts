import { createContext } from "react";

import type { ReachNetwork } from "src/types/ReachNetwork";

export const ReachContext = createContext<ReachNetwork | undefined>(undefined);
