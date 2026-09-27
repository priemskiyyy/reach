import type { ProbeContext } from "@priemskiyyy/reach";
import { z } from "zod";

import { ACCOUNT_HEADER } from "example-shared/backend/constants/headers";
import type { Health } from "example-shared/backend/types/Health";
import { API_URL } from "src/utils/constants/apiUrl";

const healthSchema = z.object({ status: z.enum(["ready", "degraded"]) });

/**
 * Darkroom's own client: real fetch with the check's signal, the account in
 * its header, an error status as a rejection, and the body parsed at the
 * boundary.
 */
export const readHealth = async ({
  signal,
  scope,
}: ProbeContext): Promise<Health> => {
  const response = await fetch(`${API_URL}/api/health`, {
    signal,
    headers: scope === null ? {} : { [ACCOUNT_HEADER]: scope },
  });

  if (!response.ok) {
    throw new Error(`The photos API answered ${response.status}.`);
  }

  return healthSchema.parse(await response.json());
};
