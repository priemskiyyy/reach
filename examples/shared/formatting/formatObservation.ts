import type { EndpointObservation } from "@priemskiyyy/reach";

import { VERDICT_PHRASES } from "example-shared/darkroom/network/constants/labels";
import { formatCheckReason } from "example-shared/formatting/formatCheckReason";

/** One check and its verdict, with the reason a failure gave. */
export const formatObservation = ({
  check,
  verdict,
  reason,
}: EndpointObservation) => {
  const said = `Check #${check} ${VERDICT_PHRASES[verdict]}`;

  if (reason === null) {
    return said;
  }

  return `${said}: ${formatCheckReason(reason)}`;
};
