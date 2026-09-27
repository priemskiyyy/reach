import type React from "react";
import { View } from "react-native";

import { CONDITION_IDS } from "example-shared/darkroom/network/constants/labels";
import { Card } from "src/components/Card/Card";
import { ConditionRow } from "src/components/ConditionList/ConditionRow";
import { conditions } from "src/network/reach";

export const ConditionList: React.FunctionComponent = () => (
  <Card
    title="Conditions"
    description="Met, unmet or unknown, each with its reasons. Unknown is never read as offline."
  >
    <View>
      {CONDITION_IDS.map((id) => (
        <ConditionRow key={id} id={id} condition={conditions[id]} />
      ))}
    </View>
  </Card>
);
