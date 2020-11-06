import { effect } from "./effect";

export function computed(fn) {
  // 特殊的effect
  const runner = effect(fn, { computed: true, lazy: true });
  return {
    effect: runner,
    get value() {
      return runner();
    },
  };
}
