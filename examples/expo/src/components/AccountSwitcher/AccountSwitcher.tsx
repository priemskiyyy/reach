import type React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import {
  ACCOUNT_IDS,
  ACCOUNTS,
} from "example-shared/darkroom/users/constants/accounts";
import type { AccountId } from "example-shared/darkroom/users/types/AccountId";
import { COLORS } from "src/utils/constants/colors";

type AccountSwitcherProps = {
  account: AccountId | null;
  onAccountSelect: (account: AccountId | null) => void;
};

const OPTIONS: { id: AccountId | null; label: string }[] = [
  ...ACCOUNT_IDS.map((id) => ({ id, label: ACCOUNTS[id].name })),
  { id: null, label: "Signed out" },
];

export const AccountSwitcher: React.FunctionComponent<AccountSwitcherProps> = ({
  account,
  onAccountSelect,
}) => (
  <View role="group" accessibilityLabel="Signed in as" style={styles.switcher}>
    {OPTIONS.map(({ id, label }) => {
      const selected = id === account;

      return (
        <Pressable
          key={label}
          accessibilityRole="button"
          accessibilityState={{ selected }}
          onPress={() => onAccountSelect(id)}
          style={[styles.option, selected && styles.selected]}
        >
          <Text style={[styles.label, selected && styles.selectedLabel]}>
            {label}
          </Text>
        </Pressable>
      );
    })}
  </View>
);

const styles = StyleSheet.create({
  switcher: {
    flexDirection: "row",
    padding: 4,
    borderRadius: 999,
    backgroundColor: COLORS.border,
  },
  option: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 8,
    borderRadius: 999,
  },
  selected: { backgroundColor: COLORS.surface },
  label: { fontSize: 13, fontWeight: "500", color: COLORS.muted },
  selectedLabel: { color: COLORS.text },
});
