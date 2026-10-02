/** Lets every queued promise continuation run before the script goes on. */
export const flush = async () => {
  for (let turn = 0; turn < 30; turn += 1) {
    await Promise.resolve();
  }
};
