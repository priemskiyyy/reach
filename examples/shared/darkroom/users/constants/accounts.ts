import type { Account } from "example-shared/darkroom/users/types/Account";
import type { AccountId } from "example-shared/darkroom/users/types/AccountId";

/** The two photographers who share the phone, each with a library of their own. */
export const ACCOUNTS: Record<AccountId, Account> = {
  ines: { id: "ines", name: "Inês Duarte", initials: "ID" },
  kofi: { id: "kofi", name: "Kofi Mensah", initials: "KM" },
};

export const ACCOUNT_IDS: AccountId[] = ["ines", "kofi"];
