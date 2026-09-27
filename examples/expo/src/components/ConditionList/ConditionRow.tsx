import type { Condition } from "@priemskiyyy/reach";
import { useCondition } from "@priemskiyyy/reach-react";
import type React from "react";
import { StyleSheet, Text, View } from "react-native";

import {
  CONDITION_LABELS,
  CONDITIONS,
} from "example-shared/darkroom/network/constants/labels";
import type { ConditionId } from "example-shared/darkroom/network/types/ConditionId";
import { formatReasons } from "example-shared/formatting/formatReasons";
import { formatSentence } from "example-shared/formatting/formatSentence";
import { CONDITION_TONES } from "example-shared/ui/constants/tones";
import { Badge } from "src/components/Badge/Badge";
import { COLORS } from "src/utils/constants/colors";

type ConditionRowProps = { id: ConditionId; condition: Condition };

export const ConditionRow: React.FunctionComponent<ConditionRowProps> = ({
  id,
  condition,
}) => {
  const { status, reasons } = useCondition(condition);
  const { title, code } = CONDITIONS[id];

  return (
    <View accessibilityLabel={title} style={styles.row}>
      <View style={styles.heading}>
        <Text style={styles.title}>{title}</Text>
        <Badge
          tone={CONDITION_TONES[status]}
          label={CONDITION_LABELS[status]}
        />
      </View>
      <Text style={styles.code}>{code}</Text>
      {reasons.length === 0 ? null : (
        <Text style={styles.reasons}>
          {formatSentence(formatReasons(reasons))}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  row: {
    gap: 4,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  heading: { flexDirection: "row", alignItems: "center", gap: 8 },
  title: { fontSize: 15, fontWeight: "600", color: COLORS.text },
  code: { fontFamily: "Menlo", fontSize: 11, color: COLORS.muted },
  reasons: { fontSize: 13, color: COLORS.body },
});
