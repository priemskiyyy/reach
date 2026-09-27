import { ACCOUNTS } from "example-shared/darkroom/users/constants/accounts";
import type { AccountId } from "example-shared/darkroom/users/types/AccountId";

export const formatAccount = (account: AccountId | null) => {
  if (account === null) {
    return "Signed out";
  }

  return ACCOUNTS[account].name;
};
