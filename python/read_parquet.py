"""Read LeRobot V3.0 parquet files and output JSON trajectory data."""
import json
import math
import sys
import os

try:
    import pyarrow.parquet as pq
except ImportError:
    print(json.dumps({"error": "pyarrow not installed. Run: pip install pyarrow"}))
    sys.exit(1)


def main():
    if len(sys.argv) < 3:
        print(json.dumps({"error": "Usage: read_parquet.py <parquet_path> <source_column>"}))
        sys.exit(1)

    parquet_path = sys.argv[1]
    source_column = sys.argv[2]  # "action" or "observation.state"

    if not os.path.exists(parquet_path):
        print(json.dumps({"error": f"File not found: {parquet_path}"}))
        sys.exit(1)

    table = pq.read_table(parquet_path)
    rows = table.to_pydict()

    timestamps = rows.get("timestamp")
    values = rows.get(source_column)

    if timestamps is None:
        print(json.dumps({"error": "No 'timestamp' column found"}))
        sys.exit(1)
    if values is None:
        cols = list(rows.keys())
        print(json.dumps({"error": f"Column '{source_column}' not found. Available: {cols}"}))
        sys.exit(1)

    data = []
    nan_count = 0
    for i in range(len(timestamps)):
        vals = values[i]
        clean_vals = []
        for x in vals:
            if x is None or (isinstance(x, float) and math.isnan(x)):
                clean_vals.append(0.0)
                nan_count += 1
            else:
                clean_vals.append(float(x))
        data.append({
            "t": float(timestamps[i]),
            "v": clean_vals,
        })

    print(json.dumps({
        "dimensionCount": len(values[0]) if len(data) > 0 else 0,
        "frameCount": len(data),
        "frames": data,
        "nanCount": nan_count,
    }))


if __name__ == "__main__":
    main()
