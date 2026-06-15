import { animationStore, getCurrentJointValues } from "@/stores/animation-store";
import { setJointValue, urdfStore } from "@/stores/urdf-store";

// Track last update time for delta calculation
let lastUpdateTime = 0;
let animationFrameId: number | null = null;

// Start the animation update loop
export function startAnimationLoop(): void {
    // Reset timing
    lastUpdateTime = performance.now();
    
    // Start the loop
    const loop = (currentTime: number) => {
        const deltaMs = currentTime - lastUpdateTime;
        lastUpdateTime = currentTime;
        
        // Only update if playing (not paused)
        if (animationStore.isPlaying && animationStore.parsedCSV) {
            const deltaSec = (deltaMs / 1000) * animationStore.playbackSpeed;
            updateAnimation(deltaSec);
        }
        
        animationFrameId = requestAnimationFrame(loop);
    };
    
    animationFrameId = requestAnimationFrame(loop);
}

// Alias to satisfy both startAnimationLoop and initAnimationLoop requirements
export const initAnimationLoop = startAnimationLoop;

// Stop the animation loop
export function stopAnimationLoop(): void {
    if (animationFrameId !== null) {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
    }
}

// Advance animation time and update all joint values
export function updateAnimation(deltaTime: number): void {
    if (!animationStore.parsedCSV) return;
    
    // Advance current time
    let newTime = animationStore.currentTime + deltaTime;
    
    // Handle reaching the end
    const duration = animationStore.duration;
    if (newTime >= duration) {
        if (animationStore.loop) {
            newTime = newTime % duration;
        } else {
            newTime = duration;
            // Stop playback at end
            animationStore.isPlaying = false;
            animationStore.isPaused = false;
        }
    }
    
    // Update animation time (this also updates currentFrameIndex via reactive getters)
    animationStore.currentTime = newTime;
    
    // Update frame index based on current time
    updateFrameIndexFromTime(newTime);
    
    // Get interpolated joint values and apply them
    const jointValues = getCurrentJointValues();
    if (jointValues) {
        applyJointValuesWithLimits(jointValues);
    }
}

// Find the frame index for a given time and update it
function updateFrameIndexFromTime(time: number): void {
    if (!animationStore.parsedCSV) return;
    const frames = animationStore.parsedCSV.frames;
    
    // Find the frame just before or at the current time
    let index = 0;
    for (let i = 0; i < frames.length; i++) {
        if (frames[i].timestamp <= time) {
            index = i;
        } else {
            break;
        }
    }
    animationStore.currentFrameIndex = index;
}

// Apply joint values while respecting joint limits
function applyJointValuesWithLimits(jointValues: Record<string, number>): void {
    for (const [jointName, value] of Object.entries(jointValues)) {
        // Clamp to joint limits if they exist
        let clampedValue = value;
        const min = urdfStore.jointLimitMin[jointName];
        const max = urdfStore.jointLimitMax[jointName];
        
        if (min !== undefined && !isNaN(min)) {
            clampedValue = Math.max(min, clampedValue);
        }
        if (max !== undefined && !isNaN(max)) {
            clampedValue = Math.min(max, clampedValue);
        }
        
        setJointValue(jointName, clampedValue);
    }
}
