import type { EndpointEnvironment } from "src/types/internal/EndpointEnvironment";
import type { ResolvedEndpoint } from "src/types/internal/ResolvedEndpoint";
import type { MonitorTrigger } from "src/types/MonitorTrigger";
import type { EndpointRecord } from "src/utils/internal/endpoints/EndpointRecord";

// Monitoring is demand, not observation: it counts its owners, and only a
// running, foreground runtime with owners turns a trigger into a check. It
// never retries a failure and never catches up on missed ticks.
export class EndpointMonitor {
  #record: EndpointRecord;
  #definition: ResolvedEndpoint;
  #environment: EndpointEnvironment;
  #isForeground: () => boolean;
  #owners = 0;
  #cancelPending: (() => void) | null = null;
  #cancelInterval: (() => void) | null = null;

  constructor(
    record: EndpointRecord,
    definition: ResolvedEndpoint,
    environment: EndpointEnvironment,
    isForeground: () => boolean,
  ) {
    this.#record = record;
    this.#definition = definition;
    this.#environment = environment;
    this.#isForeground = isForeground;
    record.onSettle(() => this.#scheduleInterval());
  }

  owners = () => this.#owners;

  acquire = () => {
    // Only the first owner creates demand; later ones share it.
    const first = this.#owners === 0;

    this.#owners += 1;
    this.#environment.record("monitor-acquired", {
      endpoint: this.#definition.name,
    });

    if (first) {
      this.offer("start");
      this.armInterval();
    }

    let released = false;

    return () => {
      if (released) {
        return;
      }

      released = true;
      this.#release();
    };
  };

  offer = (trigger: MonitorTrigger | "interval") => {
    if (!this.#isEligible()) {
      return;
    }

    if (!this.#isTriggeredBy(trigger)) {
      return;
    }

    if (!this.#isForeground()) {
      this.#skip("background");

      return;
    }

    // A trigger during a check is satisfied by that check.
    if (this.#record.isChecking()) {
      this.#record.joinAutomatic();

      return;
    }

    const lastStart = this.#record.lastStart();
    const { clock, scheduler } = this.#environment;
    const { minInterval } = this.#definition.monitoring;

    // The first start is never held back, and a start now satisfies a later one.
    if (lastStart === null || clock.monotonic() >= lastStart + minInterval) {
      this.#cancelPendingStart();
      this.#run();

      return;
    }

    // Triggers inside the minimum interval coalesce into one later start.
    if (this.#cancelPending !== null) {
      return;
    }

    this.#cancelPending = scheduler.schedule(lastStart + minInterval, () => {
      this.#cancelPending = null;
      // Offered again, so a check that started meanwhile satisfies it or moves it later.
      this.offer(trigger);
    });
  };

  /** Drops every pending automatic start, as the background and a stop do. */
  pause = () => {
    this.#cancelTimers();
    this.#record.releaseAutomatic();
  };

  /** Arms the interval again after a return to the foreground, from its full delay. */
  resume = () => {
    this.#scheduleInterval();
  };

  /** Arms the interval as monitoring begins, unless a check already did. */
  armInterval = () => {
    if (this.#cancelInterval !== null) {
      return;
    }

    this.#scheduleInterval();
  };

  #isEligible() {
    if (!this.#environment.network.isRunning()) {
      return false;
    }

    return this.#owners > 0;
  }

  #isTriggeredBy(trigger: MonitorTrigger | "interval") {
    // The interval is the monitor's own schedule, never a configured trigger.
    if (trigger === "interval") {
      return true;
    }

    return this.#definition.monitoring.on.includes(trigger);
  }

  // Only a trusted native report of no path skips; a browser hint or unknown never does.
  #isSkippedOffline() {
    if (this.#definition.monitoring.whenOffline !== "skip") {
      return false;
    }

    const { internet, evidence } = this.#environment.network.getState();

    if (internet.status !== "offline") {
      return false;
    }

    return evidence["internet.status"].basis === "native-path";
  }

  #release() {
    this.#owners -= 1;
    this.#environment.record("monitor-released", {
      endpoint: this.#definition.name,
    });

    if (this.#owners > 0) {
      return;
    }

    this.pause();
  }

  // Admitted by `offer`: entering the background cancels a pending start, so it never runs there.
  #run() {
    if (!this.#isEligible()) {
      return;
    }

    if (this.#isSkippedOffline()) {
      this.#skip("offline");
      this.#scheduleInterval();

      return;
    }

    // Reconciling the scope runs listeners, which may end this demand before a check starts.
    const outcome = this.#record.startAutomatic(
      () => this.#isEligible() && this.#isForeground(),
    );

    if (outcome === "started") {
      return;
    }

    if (outcome === "joined") {
      return;
    }

    if (outcome === "overtaken") {
      return;
    }

    this.#skip(outcome);
    this.#scheduleInterval();
  }

  #skip(reason: string) {
    this.#environment.record("check-skipped", {
      endpoint: this.#definition.name,
      reason,
    });
  }

  #scheduleInterval() {
    const { interval, minInterval, jitter } = this.#definition.monitoring;

    if (interval === null) {
      return;
    }

    if (!this.#isEligible()) {
      return;
    }

    if (!this.#isForeground()) {
      return;
    }

    const { clock, scheduler } = this.#environment;
    const base = Math.max(interval, minInterval);
    const delay = base + clock.random() * base * jitter;

    this.#cancelInterval?.();
    this.#cancelInterval = scheduler.schedule(clock.monotonic() + delay, () => {
      this.#cancelInterval = null;
      this.offer("interval");
    });
  }

  #cancelPendingStart() {
    this.#cancelPending?.();
    this.#cancelPending = null;
  }

  #cancelTimers() {
    this.#cancelPendingStart();
    this.#cancelInterval?.();
    this.#cancelInterval = null;
  }
}
