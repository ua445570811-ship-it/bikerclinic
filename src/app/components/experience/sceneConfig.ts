export interface SceneFrameRange {
  id: string;
  name: string;
  section: string;
  startFrame: number;
  endFrame: number;
  totalFrames: number;
}

export const TOTAL_FRAMES = 208;

export const SCENE_FRAME_RANGES: SceneFrameRange[] = [
  {
    id: "scene-1",
    name: "Scene 1",
    section: "HeroSection",
    startFrame: 1,
    endFrame: 25,
    totalFrames: 25,
  },
  {
    id: "scene-2",
    name: "Scene 2",
    section: "OrbitSection",
    startFrame: 26,
    endFrame: 50,
    totalFrames: 25,
  },
  {
    id: "scene-3",
    name: "scene 3",
    section: "AeroSection",
    startFrame: 51,
    endFrame: 75,
    totalFrames: 25,
  },
  {
    id: "scene-4",
    name: "scene 4",
    section: "EngineSection",
    startFrame: 76,
    endFrame: 100,
    totalFrames: 25,
  },
  {
    id: "scene-5",
    name: "scene 5",
    section: "HotspotsSection",
    startFrame: 101,
    endFrame: 117,
    totalFrames: 17,
  },
  {
    id: "scene-6",
    name: "scene 6",
    section: "DiagnosticsSection",
    startFrame: 118,
    endFrame: 142,
    totalFrames: 25,
  },
  {
    id: "scene-7",
    name: "scene 7",
    section: "WorkshopSection",
    startFrame: 143,
    endFrame: 167,
    totalFrames: 25,
  },
  {
    id: "scene-8",
    name: "scene 8",
    section: "ComparisonSection",
    startFrame: 168,
    endFrame: 183,
    totalFrames: 16,
  },
  {
    id: "scene-9",
    name: "scene 9",
    section: "LaunchSection",
    startFrame: 184,
    endFrame: 208,
    totalFrames: 25,
  },
];

export const getFramePath = (frameNumber: number): string =>
  `/frames/frame_${String(frameNumber).padStart(3, "0")}.jpg`;
