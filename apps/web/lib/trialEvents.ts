export const TRIAL_EXTENDED_EVENT = "voicedna:trial-extended";

export function notifyTrialExtended() {
  window.dispatchEvent(new Event(TRIAL_EXTENDED_EVENT));
}
