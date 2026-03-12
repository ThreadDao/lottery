import type { IRandomProvider } from "../domain/randomStrategy";
import { randomInt } from "crypto";

export const cryptoRandom: IRandomProvider = {
  nextInt(max: number): number {
    if (max <= 0) return 0;
    return randomInt(max);
  },
};
