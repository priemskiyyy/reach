import type React from "react";
import { StyleSheet, Text, View } from "react-native";

import { useObservable } from "src/hooks/useObservable";
import { reach } from "src/network/reach";
import { COLORS } from "src/utils/constants/colors";

/** What Reach's diagnostics say about the session, which never carry an account. */
export const SessionFooter: React.FunctionComponent = () => {
  const snapshot = useObservable(reach.diagnostics);

  const monitors = snapshot.endpoints.reduce(
    (sum, endpoint) => sum + endpoint.monitors,
    0,
  );

  return (
    <View role="contentinfo" accessibilityLabel="Session" style={styles.footer}>
      <Text style={[styles.text, styles.label]}>{snapshot.adapter}</Text>
      <Text style={styles.text}>session #{snapshot.session ?? "none"}</Text>
      <Text style={styles.text}>generation {snapshot.networkGeneration}</Text>
      <Text style={styles.text}>monitors {monitors}</Text>
      <Text style={styles.text}>checks {snapshot.checks.outstanding}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  footer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    paddingHorizontal: 4,
  },
  text: { fontFamily: "Menlo", fontSize: 12, color: COLORS.muted },
  label: { fontWeight: "600", color: COLORS.body },
});
