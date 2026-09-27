import { useEndpoint, useNetwork } from "@priemskiyyy/reach-react";
import type React from "react";
import { StyleSheet, Text, View } from "react-native";

import {
  ENDPOINT_STATUS_LABELS,
  FRESHNESS_LABELS,
} from "example-shared/darkroom/network/constants/labels";
import type { CheckRequest } from "example-shared/darkroom/network/types/CheckRequest";
import { formatCheckRequest } from "example-shared/formatting/formatCheckRequest";
import { formatEndpointSummary } from "example-shared/formatting/formatEndpointSummary";
import {
  ENDPOINT_STATUS_TONES,
  FRESHNESS_TONES,
} from "example-shared/ui/constants/tones";
import { Badge } from "src/components/Badge/Badge";
import { Button } from "src/components/Button/Button";
import { Card } from "src/components/Card/Card";
import { useNow } from "src/hooks/useNow";
import { api, reach } from "src/network/reach";
import { COLORS } from "src/utils/constants/colors";

type ApiCardProps = {
  request: CheckRequest | null;
  onCheckPress: () => void;
};

/** The API's last answer for the signed-in account, and whether it still counts. */
export const ApiCard: React.FunctionComponent<ApiCardProps> = ({
  request,
  onCheckPress,
}) => {
  const state = useEndpoint(api);
  const generation = useNetwork(reach, (network) => network.generation);
  const now = useNow(1_000);

  return (
    <Card
      title="Your API"
      description="The fixture server's health, checked over real HTTP for whoever is signed in."
    >
      <View style={styles.badges}>
        <Badge
          tone={ENDPOINT_STATUS_TONES[state.status]}
          label={ENDPOINT_STATUS_LABELS[state.status]}
        />
        <Badge
          tone={FRESHNESS_TONES[state.freshness]}
          label={FRESHNESS_LABELS[state.freshness]}
        />
        {state.checking ? <Badge tone="info" label="Checking" /> : null}
      </View>
      <Text style={styles.summary}>
        {formatEndpointSummary(state, { generation, now })}
      </Text>
      <View style={styles.actions}>
        <Button label="Check API" variant="primary" onPress={onCheckPress} />
        <Text accessibilityLiveRegion="polite" style={styles.result}>
          {request === null ? "" : formatCheckRequest(request)}
        </Text>
      </View>
    </Card>
  );
};

const styles = StyleSheet.create({
  badges: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  summary: { fontSize: 15, lineHeight: 21, color: COLORS.text },
  actions: { gap: 8 },
  result: { fontSize: 13, color: COLORS.body },
});
