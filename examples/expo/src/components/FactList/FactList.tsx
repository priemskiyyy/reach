import { useNetwork } from "@priemskiyyy/reach-react";
import type React from "react";
import { View } from "react-native";

import { FIELD_ORDER } from "example-shared/darkroom/network/constants/labels";
import { Card } from "src/components/Card/Card";
import { FactRow } from "src/components/FactList/FactRow";
import { useObservable } from "src/hooks/useObservable";
import { reach } from "src/network/reach";

export const FactList: React.FunctionComponent = () => {
  const state = useNetwork();
  const capabilities = useObservable(reach.capabilities);

  return (
    <Card
      title="Facts from NetInfo"
      description="Each fact with the evidence it rests on. A fact NetInfo cannot report is unsupported, and on the web every fact is, because NetInfo is not a native source there."
    >
      <View>
        {FIELD_ORDER.map((field) => (
          <FactRow
            key={field}
            field={field}
            state={state}
            capability={capabilities === null ? null : capabilities[field]}
          />
        ))}
      </View>
    </Card>
  );
};
