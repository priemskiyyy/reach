import type React from "react";
import { useState } from "react";
import { ScrollView, StyleSheet } from "react-native";

import { requestChecks } from "example-shared/darkroom/network/requestChecks";
import type { CheckRequest } from "example-shared/darkroom/network/types/CheckRequest";
import type { AccountId } from "example-shared/darkroom/users/types/AccountId";
import { AccountSwitcher } from "src/components/AccountSwitcher/AccountSwitcher";
import { ApiCard } from "src/components/ApiCard/ApiCard";
import { ConditionList } from "src/components/ConditionList/ConditionList";
import { DecisionList } from "src/components/DecisionList/DecisionList";
import { FactList } from "src/components/FactList/FactList";
import { Header } from "src/components/Header/Header";
import { SessionFooter } from "src/components/SessionFooter/SessionFooter";
import { useObservable } from "src/hooks/useObservable";
import { account, api } from "src/network/reach";
import { COLORS } from "src/utils/constants/colors";

export const Application: React.FunctionComponent = () => {
  const signedIn = useObservable(account);
  const [request, setRequest] = useState<CheckRequest | null>(null);

  const handleAccountSelect = (next: AccountId | null) => {
    account.set(next);
    setRequest(null);
  };

  const handleCheckPress = async () => {
    setRequest({ state: "running", callers: 1 });
    setRequest(await requestChecks(api, 1));
  };

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Header />
      <AccountSwitcher
        account={signedIn}
        onAccountSelect={handleAccountSelect}
      />
      <ApiCard request={request} onCheckPress={handleCheckPress} />
      <DecisionList />
      <ConditionList />
      <FactList />
      <SessionFooter />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: COLORS.background },
  content: { gap: 16, padding: 16, paddingTop: 64, paddingBottom: 40 },
});
