import type { DarkroomReach } from "example-shared/darkroom/network/types/DarkroomReach";
import type { RefreshOutcome } from "example-shared/darkroom/network/types/RefreshOutcome";

/** Asks the source to read the network again, and keeps a refusal as an answer of its own. */
export const refreshNetwork = async (
  reach: DarkroomReach,
): Promise<RefreshOutcome> => {
  try {
    const { status } = await reach.refresh();

    return { status };
  } catch (error) {
    return { status: "failed", error };
  }
};
