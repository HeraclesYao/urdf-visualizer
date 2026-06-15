// A single frame of joint data
export interface CSVFrame {
    timestamp: number;        // time in seconds
    jointValues: Record<string, number>;  // joint_name -> value
}

// Parsed CSV result
export interface ParsedCSV {
    frames: CSVFrame[];
    jointNames: string[];     // all joint column names (excluding timestamp)
    frameCount: number;
    duration: number;         // total duration in seconds (last timestamp)
    fps: number;              // estimated FPS from timestamp intervals
}

// Parse CSV text into structured data
export function parseCSV(csvText: string): ParsedCSV {
    // Strip BOM if present
    if (csvText.startsWith("\uFEFF")) {
        csvText = csvText.slice(1);
    }

    // Split into lines and trim
    const lines = csvText
        .split(/\r?\n/)
        .map(line => line.trim());

    if (lines.length === 0) {
        throw new Error("CSV is empty");
    }

    // Find the first non-empty line for headers
    let headerLineIndex = 0;
    while (headerLineIndex < lines.length && lines[headerLineIndex].length === 0) {
        headerLineIndex++;
    }

    if (headerLineIndex >= lines.length) {
        throw new Error("CSV does not contain any data");
    }

    // Parse header
    const headers = lines[headerLineIndex].split(",").map(h => h.trim());
    if (headers.length === 0 || headers[0] === "") {
        throw new Error("CSV header is empty");
    }

    const firstCol = headers[0].toLowerCase();
    if (firstCol !== "timestamp" && firstCol !== "time") {
        throw new Error(`Missing timestamp or time column in the first position, found: "${headers[0]}"`);
    }

    const jointNames = headers.slice(1);

    const frames: CSVFrame[] = [];
    for (let i = headerLineIndex + 1; i < lines.length; i++) {
        const row = lines[i];
        if (row.length === 0) continue; // Skip empty lines, preserves accurate line numbers
        
        const cells = row.split(",").map(c => c.trim());
        if (cells.length !== headers.length) {
            throw new Error(`Inconsistent column count at line ${i + 1}: expected ${headers.length} columns, found ${cells.length}`);
        }

        const timestamp = Number(cells[0]);
        if (cells[0] === "" || isNaN(timestamp)) {
            throw new Error(`Non-numeric value for timestamp at line ${i + 1}: "${cells[0]}"`);
        }

        const jointValues: Record<string, number> = {};
        for (let j = 1; j < cells.length; j++) {
            const val = Number(cells[j]);
            if (cells[j] === "" || isNaN(val)) {
                throw new Error(`Non-numeric value for joint "${headers[j]}" at line ${i + 1}: "${cells[j]}"`);
            }
            jointValues[headers[j]] = val;
        }

        frames.push({ timestamp, jointValues });
    }

    if (frames.length === 0) {
        throw new Error("CSV does not contain any data rows");
    }

    const frameCount = frames.length;
    const duration = frames[frameCount - 1].timestamp;

    // Calculate FPS as 1.0 / average(delta between consecutive timestamps).
    // If only 1 frame, default to 30.
    let fps = 30;
    if (frameCount > 1) {
        const totalDelta = frames[frameCount - 1].timestamp - frames[0].timestamp;
        const avgDelta = totalDelta / (frameCount - 1);
        if (avgDelta > 0) {
            fps = 1.0 / avgDelta;
        }
    }

    return {
        frames,
        jointNames,
        frameCount,
        duration,
        fps,
    };
}

// Validate that CSV joint names match the robot's actual joints
export function validateCSVJointNames(
    parsed: ParsedCSV,
    robotJointNames: string[]
): { valid: boolean; missingInCSV: string[]; missingInRobot: string[]; extraInCSV: string[] } {
    const csvJointSet = new Set(parsed.jointNames);
    const robotJointSet = new Set(robotJointNames);

    const missingInCSV: string[] = [];
    const missingInRobot: string[] = [];
    const extraInCSV: string[] = [];

    // missingInCSV: present in robotJointNames but not in CSV
    for (const name of robotJointNames) {
        if (!csvJointSet.has(name)) {
            missingInCSV.push(name);
        }
    }

    // missingInRobot & extraInCSV: present in CSV but not in robotJointNames
    for (const name of parsed.jointNames) {
        if (!robotJointSet.has(name)) {
            missingInRobot.push(name);
            extraInCSV.push(name);
        }
    }

    const valid = missingInCSV.length === 0 && missingInRobot.length === 0;

    return {
        valid,
        missingInCSV,
        missingInRobot,
        extraInCSV,
    };
}
