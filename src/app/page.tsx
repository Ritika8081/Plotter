
"use client";
import React, { useRef, useState } from "react";
import Plot from "../components/PlotlyChart";
import Papa from "papaparse";
// For SVG parsing
function parseSVGData(svgText: string): { t: number[]; ch: number[] } {
  // This function extracts points from <polyline> or <polygon> elements as an example
  const parser = new DOMParser();
  const doc = parser.parseFromString(svgText, "image/svg+xml");
  let points: string | null = null;
  // Try polyline first
  const polyline = doc.querySelector("polyline");
  if (polyline) points = polyline.getAttribute("points");
  // Fallback to polygon
  if (!points) {
    const polygon = doc.querySelector("polygon");
    if (polygon) points = polygon.getAttribute("points");
  }
  if (!points) return { t: [], ch: [] };
  // Parse points: "x1,y1 x2,y2 ..."
  const t: number[] = [];
  const ch: number[] = [];
  points.trim().split(/\s+/).forEach((pt, idx) => {
    const [x, y] = pt.split(",").map(Number);
    if (!isNaN(x) && !isNaN(y)) {
      t.push(x);
      ch.push(y);
    }
  });
  return { t, ch };
}

export default function Home() {
  const [fileName, setFileName] = useState<string>("No file chosen");
  const [timeData, setTimeData] = useState<number[]>([]);
  const [channelData, setChannelData] = useState<number[]>([]);
  const [windowSize, setWindowSize] = useState<number>(10);
  const [info, setInfo] = useState<{ totalSamples: number; duration: number } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const samplingRate = 500;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    if (file.name.endsWith('.svg')) {
      // SVG file: read as text and parse
      const reader = new FileReader();
      reader.onload = (ev) => {
        const svgText = ev.target?.result as string;
        const { t, ch } = parseSVGData(svgText);
        setTimeData(t);
        setChannelData(ch);
        setInfo({ totalSamples: ch.length, duration: ch.length });
      };
      reader.readAsText(file);
    } else {
      // CSV fallback
      Papa.parse(file, {
        complete: (results) => {
          const data = results.data as string[][];
          // Skip header
          const dataLines = data.slice(1);
          const t: number[] = [];
          const ch: number[] = [];
          dataLines.forEach((row, idx) => {
            if (row.length >= 2) {
              const val = parseFloat(row[1]?.trim());
              if (!isNaN(val)) {
                t.push(idx / samplingRate);
                ch.push(val);
              }
            }
          });
          setTimeData(t);
          setChannelData(ch);
          setInfo({ totalSamples: ch.length, duration: ch.length / samplingRate });
        },
        skipEmptyLines: true,
      });
    }
  };

  const handleWindowChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setWindowSize(Number(e.target.value));
  };

  const updateView = () => {
    // Plotly relayout handled by changing windowSize state
  };

  const resetView = () => {
    setWindowSize(10);
  };

  return (
    <div className="w-screen h-screen bg-gradient-to-br from-teal-400 to-cyan-500 p-0 font-sans flex flex-col items-center justify-center overflow-hidden">
      <div className="w-full h-full bg-white/90 rounded-xl p-2 sm:p-4 md:p-6 shadow-2xl flex flex-col gap-2">
        <div className="flex flex-row flex-wrap gap-2 sm:gap-3 mb-3 items-center justify-between w-full px-1">
          <div className="instructions bg-cyan-50 p-3 sm:p-4 rounded-lg border-l-4 border-teal-500 text-xs sm:text-sm min-w-[200px] max-w-sm flex-1 flex flex-col justify-center">
            <h3 className="text-teal-600 mb-2 font-semibold text-base">Instructions:</h3>
            <ul className="ml-5 text-gray-700 text-sm list-disc">
              <li><b>Zoom:</b> Scroll mouse wheel or pinch on touchpad</li>
              <li><b>Pan:</b> Click and drag on the plot</li>
              <li><b>Reset:</b> Double-click on the plot or click "Reset View" button</li>
              <li><b>Window Size:</b> Adjust to change how many seconds visible at once</li>
            </ul>
          </div>
          <div className="upload-section flex flex-col items-center justify-center min-w-[180px] max-w-xs flex-1">
            <div className="file-input-wrapper inline-block relative w-full max-w-xs">
              <input
                type="file"
                accept=".csv,.svg"
                id="csvFile"
                ref={fileInputRef}
                className="hidden"
                onChange={handleFileChange}
              />
              <label
                htmlFor="csvFile"
                className="file-label bg-gradient-to-br from-teal-400 to-cyan-500 text-white py-3 px-8 rounded-lg cursor-pointer text-base font-medium transition-transform duration-200 inline-block hover:shadow-lg hover:-translate-y-0.5"
                onClick={() => fileInputRef.current?.click()}
              >
                📁 Choose CSV or SVG File
              </label>
              <span className="file-name ml-2 text-gray-600 text-sm block truncate max-w-[180px] sm:inline" id="fileName">{fileName}</span>
            </div>
          </div>
          {info && (
            <div className="info-box bg-cyan-50 p-3 sm:p-4 rounded-lg flex flex-col sm:flex-row gap-2 sm:gap-3 justify-center items-center text-center text-xs sm:text-sm min-w-[180px] max-w-xs flex-1">
              <div className="info-item text-teal-700 text-xs sm:text-sm"><b>Total Samples:</b> {info.totalSamples.toLocaleString()}</div>
              <div className="info-item text-teal-700 text-xs sm:text-sm"><b>Duration:</b> {info.duration.toFixed(2)} seconds</div>
              <div className="info-item text-teal-700 text-xs sm:text-sm"><b>Sampling Rate:</b> 500 Hz</div>
            </div>
          )}
          <div className="controls flex flex-row items-center justify-center min-w-[180px] max-w-xs flex-1 gap-1">
            <div className="control-group flex items-center gap-1 w-auto justify-center">
              <label htmlFor="windowSize" className="font-medium text-teal-700 text-xs sm:text-sm">Window Size (s):</label>
              <input
                type="number"
                id="windowSize"
                value={windowSize}
                min={1}
                step={1}
                onChange={handleWindowChange}
                className="px-2 py-1 border-2 border-cyan-200 rounded-md text-xs w-16 focus:outline-none focus:border-teal-400"
              />
            </div>
            <div className="flex flex-row gap-1">
              <button
                className="bg-teal-500 text-white px-3 py-1.5 rounded-md font-medium hover:bg-teal-600 transition"
                onClick={updateView}
              >
                Apply
              </button>
              <button
                className="bg-teal-500 text-white px-3 py-1.5 rounded-md font-medium hover:bg-teal-600 transition"
                onClick={resetView}
              >
                Reset
              </button>
            </div>
          </div>
        </div>

        <div id="plotDiv" className="flex-1 w-full h-0 min-h-[350px] md:min-h-[500px] border-2 border-gray-200 rounded-lg mt-1 sm:mt-2 bg-white flex items-center justify-center">
          {timeData.length > 0 && (
            <Plot
              data={[
                {
                  x: timeData,
                  y: channelData,
                  type: "scattergl",
                  mode: "lines",
                  line: { color: "#667eea", width: 1.5 },
                  name: "Channel 1",
                },
              ]}
              layout={{
                title: {
                  text: "Channel 1 Data vs Time",
                  font: { size: 16, color: "#333" },
                },
                xaxis: {
                  title: { text: "Time (seconds)", font: { size: 13, color: "#555" } },
                  rangeslider: { visible: true, thickness: 0.05 },
                  range: [0, Math.min(windowSize, timeData[timeData.length - 1] ?? 0)],
                  showgrid: true,
                  gridcolor: "#e0e0e0",
                },
                yaxis: {
                  title: { text: "Channel 1 Amplitude", font: { size: 13, color: "#555" } },
                  showgrid: true,
                  gridcolor: "#e0e0e0",
                  autorange: true,
                },
                hovermode: "closest",
                showlegend: true,
                legend: {
                  x: 1,
                  y: 1,
                  xanchor: "right",
                  bgcolor: "rgba(255,255,255,0.8)",
                  bordercolor: "#ddd",
                  borderwidth: 1,
                  font: { size: 12 },
                },
                margin: { l: 40, r: 20, t: 40, b: 60 },
                autosize: true,
              }}
              config={{
                scrollZoom: true,
                displayModeBar: true,
                displaylogo: false,
                modeBarButtonsToRemove: ["lasso2d", "select2d"],
                responsive: true,
              }}
              style={{ width: "100%", height: "100%", minHeight: 200 }}
              useResizeHandler={true}
            />
          )}
        </div>
      </div>
    </div>
  );
}
