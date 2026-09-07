import { useEffect, useRef, useState } from "react";
import type { AmbientSoundId, WorkspaceState } from "../types";

type AmbientSoundsToolProps = {
  sound: WorkspaceState["sound"];
  onChange: (sound: WorkspaceState["sound"]) => void;
};

type AudioNodes = { context: AudioContext; source: AudioBufferSourceNode; gain: GainNode };

const sounds: Array<{ id: AmbientSoundId; label: string; icon: string; description: string }> = [
  { id: "rain", label: "Rain", icon: "☂", description: "Soft, airy rainfall" },
  { id: "cafe", label: "Café", icon: "☕", description: "Warm background hush" },
  { id: "fireplace", label: "Fireplace", icon: "♨", description: "Low, cozy crackle" },
];

export function AmbientSoundsTool({ sound, onChange }: AmbientSoundsToolProps) {
  const nodes = useRef<AudioNodes | null>(null);
  const [playing, setPlaying] = useState(false);

  function stop() {
    const active = nodes.current;
    nodes.current = null;
    if (active) {
      active.source.stop();
      void active.context.close();
    }
    setPlaying(false);
  }

  function play(id: AmbientSoundId) {
    stop();
    const context = new AudioContext();
    const buffer = context.createBuffer(1, context.sampleRate * 3, context.sampleRate);
    const data = buffer.getChannelData(0);
    let smoothed = 0;
    for (let index = 0; index < data.length; index += 1) {
      const white = Math.random() * 2 - 1;
      smoothed = smoothed * (id === "rain" ? 0.72 : id === "cafe" ? 0.94 : 0.985) + white * (id === "rain" ? 0.28 : id === "cafe" ? 0.06 : 0.015);
      data[index] = smoothed;
    }
    const source = context.createBufferSource();
    source.buffer = buffer;
    source.loop = true;
    const filter = context.createBiquadFilter();
    filter.type = id === "rain" ? "highpass" : "lowpass";
    filter.frequency.value = id === "rain" ? 700 : id === "cafe" ? 1100 : 420;
    const gain = context.createGain();
    gain.gain.value = sound.volume / 250;
    source.connect(filter).connect(gain).connect(context.destination);
    source.start();
    nodes.current = { context, source, gain };
    onChange({ ...sound, selected: id });
    setPlaying(true);
  }

  useEffect(() => {
    if (nodes.current) nodes.current.gain.gain.value = sound.volume / 250;
  }, [sound.volume]);

  useEffect(() => () => {
    const active = nodes.current;
    if (active) {
      active.source.stop();
      void active.context.close();
    }
  }, []);

  return (
    <div className="ambient-tool">
      <p className="tool-help">Generated locally in your browser. Audio never starts automatically.</p>
      <div className="sound-grid">
        {sounds.map((item) => (
          <button
            type="button"
            key={item.id}
            className={playing && sound.selected === item.id ? "is-active" : ""}
            aria-pressed={playing && sound.selected === item.id}
            onClick={() => playing && sound.selected === item.id ? stop() : play(item.id)}
          >
            <span aria-hidden="true">{item.icon}</span>
            <strong>{item.label}</strong>
            <small>{item.description}</small>
          </button>
        ))}
      </div>
      <label className="volume-control">Volume
        <input type="range" min="0" max="100" value={sound.volume} onChange={(event) => onChange({ ...sound, volume: Number(event.target.value) })} />
        <span>{sound.volume}%</span>
      </label>
      {playing && <button className="text-button" type="button" onClick={stop}>Stop sound</button>}
    </div>
  );
}
