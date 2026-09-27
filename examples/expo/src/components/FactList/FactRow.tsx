import type {
  FieldCapability,
  NetworkField,
  NetworkState,
} from "@priemskiyyy/reach";
import type React from "react";
import { StyleSheet, Text, View } from "react-native";

import {
  EVIDENCE_LABELS,
  FIELD_LABELS,
} from "example-shared/darkroom/network/constants/labels";
import { formatCapability } from "example-shared/formatting/formatCapability";
import { formatEvidence } from "example-shared/formatting/formatEvidence";
import { formatFactValue } from "example-shared/formatting/formatFactValue";
import { EVIDENCE_TONES } from "example-shared/ui/constants/tones";
import { Badge } from "src/components/Badge/Badge";
import { COLORS } from "src/utils/constants/colors";

type FactRowProps = {
  field: NetworkField;
  state: NetworkState;
  capability: FieldCapability | null;
};

export const FactRow: React.FunctionComponent<FactRowProps> = ({
  field,
  state,
  capability,
}) => {
  const evidence = state.evidence[field];

  return (
    <View accessibilityLabel={FIELD_LABELS[field]} style={styles.row}>
      <View style={styles.heading}>
        <Text style={styles.label}>{FIELD_LABELS[field]}</Text>
        <Text style={styles.value}>{formatFactValue(state, field)}</Text>
      </View>
      <View style={styles.evidence}>
        <Badge
          tone={EVIDENCE_TONES[evidence.status]}
          label={EVIDENCE_LABELS[evidence.status]}
        />
        <Text style={styles.detail}>{formatEvidence(evidence, field)}</Text>
      </View>
      <Text style={styles.capability}>{formatCapability(capability)}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  row: {
    gap: 6,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  heading: { flexDirection: "row", justifyContent: "space-between", gap: 8 },
  label: { fontSize: 14, color: COLORS.muted },
  value: { fontSize: 14, fontWeight: "600", color: COLORS.text },
  evidence: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: 8,
  },
  detail: { flexShrink: 1, fontSize: 13, color: COLORS.body },
  capability: { fontSize: 12, color: COLORS.muted },
});
