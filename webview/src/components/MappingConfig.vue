<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { urdfStore } from '@/stores/urdf-store';
import { vscode } from '@/utils/vscode-api';
import i18n from '@/stores/i18n';

const t = (key: string, fallback: string) => {
  const val = i18n(key);
  return val === key ? fallback : val;
};

const props = defineProps<{
  datasetDir: string;
  info: {
    features: Record<string, { dtype: string; shape: number[] }>;
    fps: number;
    totalFrames: number;
  };
}>();

const emit = defineEmits<{
  (e: 'close'): void;
}>();

const dataSource = ref<string>("action");

const availableSources = computed(() => {
  return Object.keys(props.info.features).filter(k => {
    const f = props.info.features[k];
    return f.dtype === "float32" && Array.isArray(f.shape) && f.shape[0] > 1;
  });
});

const dimensionCount = computed(() => {
  const src = props.info.features[dataSource.value];
  return src ? src.shape[0] : 0;
});

const jointNames = computed(() => {
  return Object.keys(urdfStore.jointTypes).filter(name => {
    const jt = urdfStore.jointTypes[name];
    return jt !== "fixed" && jt !== undefined;
  });
});

interface MappingRow {
  joint: string;
  offset: number;
  scale: number;
}

const mapping = ref<Record<number, MappingRow>>({});

function initMapping() {
  const m: Record<number, MappingRow> = {};
  for (let i = 0; i < dimensionCount.value; i++) {
    m[i] = mapping.value[i] || { joint: "", offset: 0, scale: 1 };
  }
  mapping.value = m;
}

watch(dimensionCount, () => initMapping(), { immediate: true });

function onSave() {
  const jointMapping: Record<number, { joint: string; offset?: number; scale?: number }> = {};
  for (const [dimStr, row] of Object.entries(mapping.value)) {
    if (row.joint && row.joint.trim()) {
      jointMapping[Number(dimStr)] = {
        joint: row.joint.trim(),
        offset: row.offset,
        scale: row.scale,
      };
    }
  }
  
  vscode.postMessage({
    type: "saveLerobotMapping",
    datasetDir: props.datasetDir,
    mapping: {
      dataSource: dataSource.value,
      jointMapping,
    },
  });
  
  emit('close');
}

function onCancel() {
  emit('close');
}

const dimIndices = computed(() => {
  const arr: number[] = [];
  for (let i = 0; i < dimensionCount.value; i++) arr.push(i);
  return arr;
});
</script>

<template>
  <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" @click.self="onCancel">
    <div class="bg-base-100 rounded-xl shadow-2xl border border-base-300 p-6 max-w-lg w-full max-h-[85vh] overflow-y-auto mx-4">
      <h2 class="text-lg font-bold mb-4">{{ t("webview.lerobot.mapping", "Joint Mapping Configuration") }}</h2>
      
      <div class="mb-4">
        <label class="text-sm font-medium mb-1 block">{{ t("webview.lerobot.dataSource", "Data Source") }}</label>
        <select v-model="dataSource" class="du-select du-select-bordered du-select-sm w-full">
          <option v-for="src in availableSources" :key="src" :value="src">{{ src }}</option>
        </select>
      </div>
      
      <div class="text-sm text-base-content/70 mb-4">
        {{ dimensionCount }} dimensions | {{ props.info.totalFrames }} frames | {{ props.info.fps }} FPS
      </div>
      
      <div class="space-y-1.5 mb-4 max-h-[50vh] overflow-y-auto">
        <div v-for="dimIdx in dimIndices" :key="dimIdx" class="flex items-center gap-2">
          <span class="text-xs font-mono w-8 text-right text-base-content/50 shrink-0">{{ dimIdx }}</span>
          <select v-model="mapping[dimIdx].joint" class="du-select du-select-bordered du-select-xs flex-1 min-w-0">
            <option value="">{{ t("webview.lerobot.unmapped", "-- unmapped --") }}</option>
            <option v-for="jname in jointNames" :key="jname" :value="jname">{{ jname }}</option>
          </select>
          <label class="flex items-center gap-0.5 shrink-0">
            <span class="text-xs text-base-content/50">off:</span>
            <input v-model.number="mapping[dimIdx].offset" type="number" step="any" class="du-input du-input-bordered du-input-xs w-16 text-xs" />
          </label>
          <label class="flex items-center gap-0.5 shrink-0">
            <span class="text-xs text-base-content/50">scl:</span>
            <input v-model.number="mapping[dimIdx].scale" type="number" step="any" class="du-input du-input-bordered du-input-xs w-16 text-xs" />
          </label>
        </div>
      </div>
      
      <div class="flex justify-end gap-2">
        <button @click="onCancel" class="du-btn du-btn-sm du-btn-ghost">
          {{ t("webview.lerobot.cancel", "Cancel") }}
        </button>
        <button @click="onSave" class="du-btn du-btn-sm du-btn-primary">
          {{ t("webview.lerobot.saveAndLoad", "Save & Load") }}
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
@reference "tailwindcss";
</style>
