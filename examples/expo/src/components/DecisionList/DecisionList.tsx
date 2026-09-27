import { useCondition } from "@priemskiyyy/reach-react";
import type React from "react";
import { StyleSheet, Text, View } from "react-native";

import {
  AUTOMATIC_DECISIONS,
  MANUAL_DECISIONS,
} from "example-shared/darkroom/backup/constants/decisions";
import {
  AUTOMATIC_DECISION_LABELS,
  MANUAL_DECISION_LABELS,
} from "example-shared/darkroom/backup/constants/labels";
import { formatAutomaticBackup } from "example-shared/formatting/formatAutomaticBackup";
import {
  AUTOMATIC_DECISION_TONES,
  MANUAL_DECISION_TONES,
} from "example-shared/ui/constants/tones";
import { Badge } from "src/components/Badge/Badge";
import { Card } from "src/components/Card/Card";
import { conditions } from "src/network/reach";
import { COLORS } from "src/utils/constants/colors";

/** What each backup would do right now: automatic backup waits on unknown, Back up now tries. */
export const DecisionList: React.FunctionComponent = () => {
  const automatic = useCondition(conditions.automatic);
  const { status } = useCondition(conditions.api);
  const automaticDecision = AUTOMATIC_DECISIONS[automatic.status];
  const manualDecision = MANUAL_DECISIONS[status];

  return (
    <Card
      title="What Darkroom would do"
      description="Nobody asked for an automatic backup, so it waits on unknown. Somebody pressed Back up now, so it tries."
    >
      <View style={styles.row}>
        <View style={styles.heading}>
          <Text style={styles.title}>Automatic backup</Text>
          <Badge
            tone={AUTOMATIC_DECISION_TONES[automaticDecision]}
            label={AUTOMATIC_DECISION_LABELS[automaticDecision]}
          />
        </View>
        <Text style={styles.detail}>
          {formatAutomaticBackup(true, automatic)}
        </Text>
      </View>
      <View style={styles.row}>
        <View style={styles.heading}>
          <Text style={styles.title}>Back up now</Text>
          <Badge
            tone={MANUAL_DECISION_TONES[manualDecision]}
            label={MANUAL_DECISION_LABELS[manualDecision]}
          />
        </View>
      </View>
    </Card>
  );
};

const styles = StyleSheet.create({
  row: { gap: 4 },
  heading: { flexDirection: "row", alignItems: "center", gap: 8 },
  title: { fontSize: 15, fontWeight: "600", color: COLORS.text },
  detail: { fontSize: 13, color: COLORS.body },
});
