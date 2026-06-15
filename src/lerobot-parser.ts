import * as fs from "fs";
import * as path from "path";
import { execFileSync } from "child_process";

export interface LerobotInfo {
    codebaseVersion: string;
    robotType: string;
    totalFrames: number;
    totalEpisodes: number;
    fps: number;
    totalChunks?: number;
    dataPath?: string;
    features: Record<string, { dtype: string; shape: number[] }>;
}

export interface JointMappingEntry {
    joint: string;
    offset?: number;
    scale?: number;
}

export function normalizeJointMappingEntry(
    entry: string | JointMappingEntry
): JointMappingEntry {
    if (typeof entry === "string") {
        return { joint: entry };
    }
    return entry;
}

export function normalizeJointMapping(
    mapping: Record<number, string | JointMappingEntry>
): Record<number, JointMappingEntry> {
    const result: Record<number, JointMappingEntry> = {};
    for (const [key, value] of Object.entries(mapping)) {
        result[Number(key)] = normalizeJointMappingEntry(value);
    }
    return result;
}

export interface LerobotMapping {
    dataSource: string;
    jointMapping: Record<number, string | JointMappingEntry>;
}

export interface LerobotFrame {
    timestamp: number;
    jointValues: Record<string, number>;
}

export interface LerobotParsedData {
    frames: LerobotFrame[];
    jointNames: string[];
    frameCount: number;
    duration: number;
    fps: number;
    dimensionCount: number;
}

export function readLerobotInfo(datasetDir: string): LerobotInfo {
    const infoPath = path.join(datasetDir, "meta", "info.json");
    if (!fs.existsSync(infoPath)) {
        throw new Error(`LeRobot info.json not found at: ${infoPath}`);
    }
    return JSON.parse(fs.readFileSync(infoPath, "utf-8"));
}

export function parseLerobotDataset(
    datasetDir: string,
    mapping: LerobotMapping
): LerobotParsedData {
    const info = readLerobotInfo(datasetDir);
    
    const allFrames: LerobotFrame[] = [];
    const totalChunks = info.totalChunks || 1;
    
    for (let chunkIdx = 0; chunkIdx < totalChunks; chunkIdx++) {
        const chunkDirName = `chunk-${String(chunkIdx).padStart(3, "0")}`;
        const chunkPath = path.join(datasetDir, "data", chunkDirName);
        
        if (!fs.existsSync(chunkPath)) continue;
        
        const files = fs.readdirSync(chunkPath)
            .filter(f => f.endsWith(".parquet"))
            .sort();
        
        for (const file of files) {
            const parquetPath = path.join(chunkPath, file);
            const frames = readParquetFrames(parquetPath, mapping);
            allFrames.push(...frames);
        }
    }
    
    if (allFrames.length === 0) {
        throw new Error("No frames extracted from LeRobot dataset");
    }
    
    const jointNames = Object.values(normalizeJointMapping(mapping.jointMapping))
        .map(e => e.joint)
        .filter((v, i, a) => a.indexOf(v) === i);
    const duration = allFrames[allFrames.length - 1].timestamp;
    
    return {
        frames: allFrames,
        jointNames,
        frameCount: allFrames.length,
        duration,
        fps: info.fps || 30,
        dimensionCount: Object.keys(mapping.jointMapping).length,
    };
}

function findPython(): string {
    try {
        execFileSync("python3", ["--version"], { stdio: "pipe" });
        return "python3";
    } catch {
        try {
            execFileSync("python", ["--version"], { stdio: "pipe" });
            return "python";
        } catch {
            throw new Error(
                "Python 3 is required to read LeRobot parquet files. Install pyarrow: pip install pyarrow"
            );
        }
    }
}

function readParquetFrames(
    parquetPath: string,
    mapping: LerobotMapping
): LerobotFrame[] {
    const pythonCmd = findPython();
    const scriptPath = path.resolve(__dirname, "..", "python", "read_parquet.py");
    
    const result = execFileSync(pythonCmd, [scriptPath, parquetPath, mapping.dataSource], {
        encoding: "utf-8",
        maxBuffer: 100 * 1024 * 1024,
        timeout: 30000,
    });
    
    const parsed = JSON.parse(result);
    if (parsed.error) {
        throw new Error(`Failed to read parquet: ${parsed.error}`);
    }
    
    const frames: LerobotFrame[] = [];
    for (const rawFrame of parsed.frames) {
        const jointValues: Record<string, number> = {};
        for (const [dimStr, entry] of Object.entries(
            normalizeJointMapping(mapping.jointMapping)
        )) {
            const dimIdx = Number(dimStr);
            if (dimIdx < rawFrame.v.length) {
                const rawVal = rawFrame.v[dimIdx];
                const scale = entry.scale ?? 1;
                const offset = entry.offset ?? 0;
                jointValues[entry.joint] = rawVal * scale + offset;
            }
        }
        frames.push({
            timestamp: rawFrame.t,
            jointValues,
        });
    }
    
    return frames;
}
