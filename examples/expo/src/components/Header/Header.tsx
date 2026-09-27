import type React from "react";
import { StyleSheet, Text, View } from "react-native";

import { formatRuntimeStatus } from "example-shared/formatting/formatRuntimeStatus";
import { RUNTIME_TONES } from "example-shared/ui/constants/tones";
import { Badge } from "src/components/Badge/Badge";
import { useObservable } from "src/hooks/useObservable";
import { reach } from "src/network/reach";
import { COLORS } from "src/utils/constants/colors";

export const Header: React.FunctionComponent = () => {
  const status = useObservable(reach.status);

  return (
    <View style={styles.header}>
      <View style={styles.logo}>
        <Text style={styles.logoText}>D</Text>
      </View>
      <Text role="heading" style={styles.title}>
        Darkroom
      </Text>
      <View style={styles.status} accessibilityLiveRegion="polite">
        <Badge
          tone={RUNTIME_TONES[status.state]}
          label={formatRuntimeStatus(status)}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  header: { flexDirection: "row", alignItems: "center", gap: 10 },
  logo: {
    width: 34,
    height: 34,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 10,
    backgroundColor: COLORS.accent,
  },
  logoText: { fontSize: 17, fontWeight: "700", color: COLORS.onAccent },
  title: { fontSize: 24, fontWeight: "700", color: COLORS.text },
  status: { marginLeft: "auto" },
});
