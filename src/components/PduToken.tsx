import { useEffect, useRef } from 'react';
import { motion, useAnimate } from 'framer-motion';
import type { PduSpec, Position } from '../types';
import { getNodeCenter } from '../topology';

interface Props {
  spec: PduSpec;
  positions: Record<string, Position>;
  segmentMs: number;
  onDone: () => void;
}

export function PduToken({ spec, positions, segmentMs, onDone }: Props) {
  const [scope, animate] = useAnimate();
  const finishedRef = useRef(false);

  const waypoints = spec.path.map(id => getNodeCenter(id, positions));
  const first = waypoints[0] ?? { x: 0, y: 0 };

  useEffect(() => {
    if (waypoints.length === 0) {
      onDone();
      return;
    }

    const segDur = segmentMs / 1000;

    const run = async () => {
      // Fade in at starting position
      await animate(scope.current, { opacity: 1, scale: 1 }, { duration: 0.28 });

      // Travel through each waypoint
      for (let i = 1; i < waypoints.length; i++) {
        if (finishedRef.current) return;
        await animate(
          scope.current,
          { x: waypoints[i].x, y: waypoints[i].y },
          { duration: segDur, ease: 'easeInOut' },
        );
      }

      // Fade out
      await animate(scope.current, { opacity: 0, scale: 0.85 }, { duration: 0.22 });

      if (!finishedRef.current) {
        finishedRef.current = true;
        onDone();
      }
    };

    run().catch(() => { /* cancelled on unmount */ });

    return () => {
      finishedRef.current = true;
    };
  }, []); // run once on mount — waypoints and positions are captured at mount time

  const hasFrame  = Boolean(spec.frame);
  const hasPacket = Boolean(spec.packet);

  // L3-only (before encapsulation) — show just the inner box standalone
  if (!hasFrame && hasPacket) {
    return (
      <motion.div
        ref={scope}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          x: first.x,
          y: first.y,
          opacity: 0,
          scale: 0.85,
          zIndex: 50,
          pointerEvents: 'none',
        }}
      >
        <div style={{ transform: 'translate(-50%, -50%)', width: 210 }}>
          <div className="pdu-outer pdu-outer--standalone">
            <div className="pdu-header pdu-header--l3">📦 L3 Packet</div>
            <div className="pdu-fields pdu-fields--l3">
              <span>src:{spec.packet!.srcIp}</span>
              <span>dst:{spec.packet!.dstIp}</span>
              {spec.packet!.note && <span className="pdu-note">{spec.packet!.note}</span>}
            </div>
          </div>
        </div>
      </motion.div>
    );
  }

  // L2 frame (with optional L3 packet inside)
  return (
    <motion.div
      ref={scope}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        x: first.x,
        y: first.y,
        opacity: 0,
        scale: 0.85,
        zIndex: 50,
        pointerEvents: 'none',
      }}
    >
      <div style={{ transform: 'translate(-50%, -50%)', width: 210 }}>
        <div className="pdu-outer">
          <div className="pdu-header">📦 L2 Frame</div>
          {spec.frame && (
            <div className="pdu-fields">
              <span>src:…{spec.frame.srcMac.slice(-5)}</span>
              <span>dst:…{spec.frame.dstMac.slice(-5)}</span>
              {spec.frame.note && <span className="pdu-note">{spec.frame.note}</span>}
            </div>
          )}

          {spec.packet && (
            <div className="pdu-inner">
              <div className="pdu-header pdu-header--l3">📦 L3 Packet</div>
              <div className="pdu-fields pdu-fields--l3">
                <span>src:{spec.packet.srcIp}</span>
                <span>dst:{spec.packet.dstIp}</span>
                {spec.packet.note && <span className="pdu-note">{spec.packet.note}</span>}
              </div>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
