import { createApp, reactive, type App as VueApp } from "vue";
import FloatingVue from "floating-vue";
import Vue3ColorPicker from "vue3-colorpicker";
import { vscodeSettings } from "@/stores/vscode-settings";
import { visualSettings } from "@/stores/visual-settings";
import { measureSettings } from "@/stores/measure-settings";
import { vscode } from "@/utils/vscode-api";
import { i18nMessages } from "@/stores/i18n";
import App from "@/App.vue";
import { vClampCenterX } from "@/directives/clampCenterX";
import { parseCSV } from "@/utils/csv-parser";
import { animationStore, loadCSVData } from "@/stores/animation-store";

let app: VueApp<Element> | null = null;

// LeRobot info state (shared with MappingConfig component)
export const lerobotInfoState = reactive({
    datasetDir: "",
    info: null as any,
    showMapping: false,
});

function assignDefined<T extends object>(
    target: T,
    source: Partial<T> | undefined
) {
    if (!source) {
        return;
    }

    Object.entries(source).forEach(([key, value]) => {
        if (value !== undefined) {
            (target as Record<string, unknown>)[key] = value;
        }
    });
}

// 重写 console.error
// 保存原始的 console.error
const originalConsoleError = console.error;
console.error = function (...args) {
    vscode.postMessage({
        type: "error",
        message: args.join(" "),
    });

    originalConsoleError.apply(console, args); // 继续调用原始的 console.error 输出到控制台
};

// 监听来自 vscode 的消息
window.addEventListener("message", (event) => {
    const message = event.data;

    if (message.type === "settings" || message.type === "init") {
        if (message.i18n !== undefined) {
            // 翻译信息
            Object.assign(i18nMessages, message.i18n);
        }

        assignDefined(vscodeSettings, message.vscodeSettings);
        assignDefined(visualSettings, message.visualSettings);
        assignDefined(measureSettings, message.measureSettings);

        // 兼容旧版消息格式
        assignDefined(vscodeSettings, {
            cacheMesh: message.cacheMesh,
            showTips: message.showTips,
            highlightJointWhenHover: message.highlightJointWhenHover,
            highlightLinkWhenHover: message.highlightLinkWhenHover,
        });
        assignDefined(visualSettings, {
            backgroundColor: message.backgroundColor,
            showInertiaWhenHover: message.showInertiaWhenHover,
        });
    }
    if (message.type === "urdf" || message.type === "init") {
        if (message.uriPrefix) {
            let uriPrefix: string = message.uriPrefix;
            // 去除末尾的 `/`
            if (message.uriPrefix.endsWith("/")) {
                uriPrefix = message.uriPrefix.slice(0, -1);
            }
            vscodeSettings.uriPrefix = "https://" + uriPrefix;
        }
        if (message.packages) {
            vscodeSettings.packages = message.packages;
        }
        if (message.workingPath) {
            if (message.workingPath.endsWith("/")) {
                vscodeSettings.workingPath = message.workingPath;
            } else {
                vscodeSettings.workingPath = message.workingPath + "/";
            }
        }
        if (message.filename) {
            vscodeSettings.filename = message.filename;
        }
        if (message.reset_camera && message.reset_camera === true) {
            vscodeSettings.requireResetCamera = true;
        }
        if (message.urdfText) {
            vscodeSettings.urdfText = message.urdfText;
        }
        if (message.initialJointValues) {
            vscodeSettings.initialJointValues = message.initialJointValues;
        }
    }
    if (message.type === "csvData") {
        if (message.csvText && typeof message.csvText === "string") {
            try {
                const parsed = parseCSV(message.csvText);
                loadCSVData(parsed);
            } catch (error) {
                console.error("Failed to parse CSV data:", error);
            }
        }
    }
    if (message.type === "lerobotInfo") {
        if (message.datasetDir && message.info && message.needsMapping) {
            lerobotInfoState.datasetDir = message.datasetDir;
            lerobotInfoState.info = message.info;
            lerobotInfoState.showMapping = true;
        }
    }
    if (message.type === "lerobotData") {
        if (message.frames && message.fps) {
            try {
                const frames = message.frames.map((f: any) => ({
                    timestamp: f.timestamp || f.t,
                    jointValues: f.jointValues,
                }));
                const parsed = {
                    frames,
                    jointNames: message.jointNames || [],
                    frameCount: message.frameCount || frames.length,
                    duration: message.duration || (frames.length > 0 ? frames[frames.length - 1].timestamp : 0),
                    fps: message.fps,
                };
                loadCSVData(parsed);
                lerobotInfoState.showMapping = false;
            } catch (error) {
                console.error("Failed to load LeRobot data:", error);
            }
        }
    }

    // 延迟创建 Vue 应用, 确保设置已应用
    if (message.type === "init") {
        if (app) return; // 避免重复初始化
        app = createApp(App);
        app.use(FloatingVue)
            .use(Vue3ColorPicker)
            .directive("clamp-center-x", vClampCenterX);
        app.mount("#app");
    }
});

// 通知 VSCode Webview 已准备好接收消息
vscode.postMessage({ type: "webviewReady" });
