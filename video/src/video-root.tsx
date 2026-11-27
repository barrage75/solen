import { Composition } from "remotion";
import { PITCH_DURATION_FRAMES } from "./schedule";
import { SolenPitch } from "./solen-pitch";

export const VideoRoot = () => (
  <Composition
    id="SolenPitchFR"
    component={SolenPitch}
    width={1920}
    height={1080}
    fps={30}
    durationInFrames={PITCH_DURATION_FRAMES}
  />
);
