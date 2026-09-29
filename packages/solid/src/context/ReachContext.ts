import { createContext } from "solid-js";
import type { Accessor } from "solid-js";

import type { ReachNetwork } from "src/types/ReachNetwork";

export const ReachContext = createContext<Accessor<ReachNetwork>>();
