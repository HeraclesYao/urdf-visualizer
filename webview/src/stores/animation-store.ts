import { reactive } from "vue";
import type { ParsedCSV } from "@/utils/csv-parser";

export interface AnimationState {
    // Data
    parsedCSV: ParsedCSV | null;
    
    // Playback state
    isPlaying: boolean;
    isPaused: boolean;
    currentFrameIndex: number;
    currentTime: number;        // elapsed playback time in seconds
    playbackSpeed: number;      // 1.0 = normal speed
    
    // Settings
    targetFPS: number;          // default 30
    loop: boolean;              // default false
    interpolate: boolean;       // linear interpolation between frames, default true
    
    // Info (readonly computed)
    readonly frameCount: number;
    readonly duration: number;
    readonly progress: number;  // 0.0 - 1.0
}

export type AnimationStore = AnimationState;

export const animationStore = reactive<AnimationState>({
    parsedCSV: null,
    isPlaying: false,
    isPaused: false,
    currentFrameIndex: 0,
    currentTime: 0,
    playbackSpeed: 1.0,
    targetFPS: 30,
    loop: false,
    interpolate: true,

    get frameCount(): number {
        return this.parsedCSV ? this.parsedCSV.frameCount : 0;
    },

    get duration(): number {
        return this.parsedCSV ? this.parsedCSV.duration : 0;
    },

    get progress(): number {
        const dur = this.duration;
        return dur > 0 ? this.currentTime / dur : 0;
    }
}) as AnimationStore;

export function loadCSVData(parsed: ParsedCSV): void {
    animationStore.parsedCSV = parsed;
    animationStore.isPlaying = false;
    animationStore.isPaused = false;
    animationStore.currentFrameIndex = 0;
    animationStore.currentTime = 0;
    animationStore.playbackSpeed = 1.0;
    animationStore.targetFPS = parsed.fps || 30;
    animationStore.loop = false;
    animationStore.interpolate = true;
    stop();
}

export function play(): void {
    animationStore.isPlaying = true;
    animationStore.isPaused = false;
}

export function pause(): void {
    animationStore.isPaused = true;
    animationStore.isPlaying = false;
}

export function stop(): void {
    animationStore.isPlaying = false;
    animationStore.isPaused = false;
    animationStore.currentFrameIndex = 0;
    animationStore.currentTime = 0;
}

export function togglePlayPause(): void {
    if (animationStore.isPlaying) {
        pause();
    } else {
        play();
    }
}

export function seekToFrame(index: number): void {
    if (!animationStore.parsedCSV) return;
    const frameCount = animationStore.frameCount;
    if (frameCount === 0) return;
    const clampedIndex = Math.max(0, Math.min(index, frameCount - 1));
    animationStore.currentFrameIndex = clampedIndex;
    animationStore.currentTime = animationStore.parsedCSV.frames[clampedIndex].timestamp;
}

export function seekToTime(time: number): void {
    if (!animationStore.parsedCSV) return;
    const duration = animationStore.duration;
    const clampedTime = Math.max(0, Math.min(time, duration));
    animationStore.currentTime = clampedTime;
    
    const frames = animationStore.parsedCSV.frames;
    if (frames.length === 0) return;
    
    let nearestIndex = 0;
    let minDiff = Infinity;
    for (let i = 0; i < frames.length; i++) {
        const diff = Math.abs(frames[i].timestamp - clampedTime);
        if (diff < minDiff) {
            minDiff = diff;
            nearestIndex = i;
        }
    }
    animationStore.currentFrameIndex = nearestIndex;
}

export function stepForward(): void {
    if (!animationStore.parsedCSV) return;
    let nextIndex = animationStore.currentFrameIndex + 1;
    if (nextIndex >= animationStore.frameCount) {
        nextIndex = animationStore.loop ? 0 : animationStore.frameCount - 1;
    }
    seekToFrame(nextIndex);
}

export function stepBackward(): void {
    if (!animationStore.parsedCSV) return;
    let prevIndex = animationStore.currentFrameIndex - 1;
    if (prevIndex < 0) {
        prevIndex = animationStore.loop ? animationStore.frameCount - 1 : 0;
    }
    seekToFrame(prevIndex);
}

export function setPlaybackSpeed(speed: number): void {
    animationStore.playbackSpeed = Math.max(0.1, Math.min(speed, 10.0));
}

export function setLoop(loop: boolean): void {
    animationStore.loop = loop;
}

export function getCurrentJointValues(): Record<string, number> | null {
    if (!animationStore.parsedCSV || animationStore.parsedCSV.frames.length === 0) {
        return null;
    }
    const frames = animationStore.parsedCSV.frames;
    if (frames.length === 1) {
        return { ...frames[0].jointValues };
    }
    if (!animationStore.interpolate) {
        const index = Math.max(0, Math.min(animationStore.currentFrameIndex, frames.length - 1));
        return { ...frames[index].jointValues };
    }
    
    const t = animationStore.currentTime;
    if (t <= frames[0].timestamp) {
        return { ...frames[0].jointValues };
    }
    if (t >= frames[frames.length - 1].timestamp) {
        return { ...frames[frames.length - 1].jointValues };
    }
    
    let i = 0;
    for (let j = 0; j < frames.length - 1; j++) {
        if (frames[j].timestamp <= t && t <= frames[j + 1].timestamp) {
            i = j;
            break;
        }
    }
    
    const f0 = frames[i];
    const f1 = frames[i + 1];
    const t0 = f0.timestamp;
    const t1 = f1.timestamp;
    const diff = t1 - t0;
    const alpha = diff > 0 ? (t - t0) / diff : 0;
    
    const result: Record<string, number> = {};
    for (const name of animationStore.parsedCSV.jointNames) {
        const v0 = f0.jointValues[name] ?? 0;
        const v1 = f1.jointValues[name] ?? 0;
        result[name] = v0 + alpha * (v1 - v0);
    }
    return result;
}
