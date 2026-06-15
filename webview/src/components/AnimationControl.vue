<script setup lang="ts">
import { computed } from 'vue';
import { 
  animationStore, 
  play, 
  pause, 
  stop, 
  togglePlayPause, 
  stepForward, 
  stepBackward, 
  setPlaybackSpeed, 
  setLoop,
  seekToTime
} from '@/stores/animation-store';
import { vscode } from '@/utils/vscode-api';
import { lerobotInfoState } from '@/modules/vscode-message-listen';
import MappingConfig from '@/components/MappingConfig.vue';
import i18n from '@/stores/i18n';

const t = (key: string, fallback: string) => {
  const val = i18n(key);
  return val === key ? fallback : val;
};

const onLoadCSVClick = () => {
  vscode.postMessage({ type: "requestCSV" });
};

const onLoadLeRobotClick = () => {
  vscode.postMessage({ type: "requestLerobotDataset" });
};

const onProgressChange = (event: Event) => {
  const target = event.target as HTMLInputElement;
  const time = parseFloat(target.value);
  if (!isNaN(time)) {
    seekToTime(time);
  }
};

const onLoopChange = (event: Event) => {
  const target = event.target as HTMLInputElement;
  setLoop(target.checked);
};

const onMappingClose = () => {
  lerobotInfoState.showMapping = false;
};
</script>

<template>
  <div class="flex flex-col gap-1 p-2 pointer-events-auto bg-base-100/90 border border-base-300 rounded-lg shadow-sm backdrop-blur-sm w-full max-w-[calc(100vw-2.5rem)]">
    <div class="flex items-center gap-2 w-full min-w-0 flex-wrap">
      <button @click="onLoadCSVClick" class="du-btn du-btn-sm du-btn-primary shrink-0 px-3">
        {{ t("webview.animation.loadCSV", "Load CSV") }}
      </button>
      <button @click="onLoadLeRobotClick" class="du-btn du-btn-sm du-btn-secondary shrink-0 px-3">
        {{ t("webview.animation.loadLeRobot", "Load LeRobot") }}
      </button>

      <template v-if="animationStore.parsedCSV">
        <div class="flex items-center gap-0.5 shrink-0">
          <VTooltip :delay="0" :distance="8">
            <button @click="stepBackward" class="du-btn du-btn-sm du-btn-ghost px-2 text-lg">
              ⏮
            </button>
            <template #popper>
              <div class="text-xs">{{ t("webview.animation.stepBackward", "Step Backward") }}</div>
            </template>
          </VTooltip>
          
          <VTooltip :delay="0" :distance="8">
            <button @click="togglePlayPause" class="du-btn du-btn-sm du-btn-ghost px-2 text-lg">
              {{ animationStore.isPlaying ? '⏸' : '▶' }}
            </button>
            <template #popper>
              <div class="text-xs">
                {{ animationStore.isPlaying ? t("webview.animation.pause", "Pause") : t("webview.animation.play", "Play") }}
              </div>
            </template>
          </VTooltip>
          
          <VTooltip :delay="0" :distance="8">
            <button @click="stop" class="du-btn du-btn-sm du-btn-ghost px-2 text-lg">
              ⏹
            </button>
            <template #popper>
              <div class="text-xs">{{ t("webview.animation.stop", "Stop") }}</div>
            </template>
          </VTooltip>
          
          <VTooltip :delay="0" :distance="8">
            <button @click="stepForward" class="du-btn du-btn-sm du-btn-ghost px-2 text-lg">
              ⏭
            </button>
            <template #popper>
              <div class="text-xs">{{ t("webview.animation.stepForward", "Step Forward") }}</div>
            </template>
          </VTooltip>
        </div>

        <div class="flex-1 min-w-[80px] flex items-center">
          <input 
            type="range" 
            min="0" 
            :max="animationStore.duration" 
            step="0.001" 
            :value="animationStore.currentTime"
            @input="onProgressChange"
            class="du-range du-range-xs du-range-primary w-full cursor-pointer"
          />
        </div>

        <div class="flex items-center gap-2 shrink-0">
          <div class="flex items-center gap-0.5">
            <button 
              @click="setPlaybackSpeed(0.5)" 
              class="du-btn du-btn-xs" 
              :class="animationStore.playbackSpeed === 0.5 ? 'du-btn-primary' : 'du-btn-ghost'"
            >
              0.5x
            </button>
            <button 
              @click="setPlaybackSpeed(1)" 
              class="du-btn du-btn-xs" 
              :class="animationStore.playbackSpeed === 1 ? 'du-btn-primary' : 'du-btn-ghost'"
            >
              1x
            </button>
            <button 
              @click="setPlaybackSpeed(2)" 
              class="du-btn du-btn-xs" 
              :class="animationStore.playbackSpeed === 2 ? 'du-btn-primary' : 'du-btn-ghost'"
            >
              2x
            </button>
          </div>
          
          <VTooltip :delay="0" :distance="8">
            <label class="flex items-center gap-1 cursor-pointer shrink-0">
              <input 
                type="checkbox" 
                :checked="animationStore.loop" 
                @change="onLoopChange"
                class="du-checkbox du-checkbox-sm du-checkbox-primary"
              />
              <span class="text-xs">🔄</span>
            </label>
            <template #popper>
              <div class="text-xs">{{ t("webview.animation.loop", "Loop Animation") }}</div>
            </template>
          </VTooltip>
        </div>
      </template>
    </div>

    <div v-if="animationStore.parsedCSV" class="flex justify-between items-center px-1 text-[10px] text-base-content/70 font-mono select-none truncate">
      <span>Frame {{ animationStore.currentFrameIndex + 1 }}/{{ animationStore.frameCount }}</span>
      <span>{{ animationStore.currentTime.toFixed(2) }}s / {{ animationStore.duration.toFixed(2) }}s</span>
      <span>{{ animationStore.targetFPS }} FPS</span>
    </div>
  </div>

  <MappingConfig
    v-if="lerobotInfoState.showMapping && lerobotInfoState.info"
    :dataset-dir="lerobotInfoState.datasetDir"
    :info="lerobotInfoState.info"
    @close="onMappingClose"
  />
</template>

<style scoped>
@reference "tailwindcss";

.du-btn-xs {
  @apply h-6 min-h-6 px-2 text-xs;
}
</style>
