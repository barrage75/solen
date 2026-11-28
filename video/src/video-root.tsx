import { Composition } from "remotion";
import { getPitchSchedule } from "./schedule";
import { SolenPitch } from "./solen-pitch";

export const VideoRoot = () => (
  <>
    <Composition
      id="SolenPitchFR"
      component={SolenPitch}
      defaultProps={{lang: "fr"}}
      width={1920}
      height={1080}
      fps={30}
      durationInFrames={getPitchSchedule("fr").durationFrames}
    />
    <Composition
      id="SolenPitchEN"
      component={SolenPitch}
      defaultProps={{lang: "en"}}
      width={1920}
      height={1080}
      fps={30}
      durationInFrames={getPitchSchedule("en").durationFrames}
    />
  </>
);
