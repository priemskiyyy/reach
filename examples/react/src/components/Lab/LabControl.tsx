import type { Icon } from "@phosphor-icons/react";
import type React from "react";
import { useId } from "react";

import { buttonStyles } from "example-shared/ui/styles/buttonStyles";

type LabControlProps = {
  icon: Icon;
  label: string;
  description: string;
  pressed: boolean;
  onPress: () => void;
};

export const LabControl: React.FunctionComponent<LabControlProps> = ({
  icon: ControlIcon,
  label,
  description,
  pressed,
  onPress,
}) => {
  const descriptionId = useId();

  return (
    <li className="flex flex-col gap-2 rounded-xl border border-slate-200 p-3 dark:border-slate-800">
      <button
        type="button"
        aria-pressed={pressed}
        aria-describedby={descriptionId}
        onClick={onPress}
        className={buttonStyles({ pressed })}
      >
        <ControlIcon aria-hidden="true" size={16} weight="bold" />
        {label}
      </button>
      <p
        id={descriptionId}
        className="text-sm leading-relaxed text-slate-600 dark:text-slate-400"
      >
        {description}
      </p>
    </li>
  );
};
