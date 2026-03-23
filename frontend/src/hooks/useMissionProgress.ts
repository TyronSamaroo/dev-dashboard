import { useEffect, useRef, useState } from "react";

export interface MissionDefinition {
  id: string;
  xp: number;
}

export function useMissionProgress(missions: readonly MissionDefinition[]) {
  const [visited, setVisited] = useState<Record<string, boolean>>({});
  const [lastUnlocked, setLastUnlocked] = useState<string | null>(null);
  const unlockedRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (typeof window === "undefined" || !("IntersectionObserver" in window)) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting || entry.intersectionRatio < 0.45) {
            continue;
          }

          const id = (entry.target as HTMLElement).id;
          if (!id || unlockedRef.current.has(id)) {
            continue;
          }

          unlockedRef.current.add(id);
          setVisited((current) => (current[id] ? current : { ...current, [id]: true }));
          setLastUnlocked(id);
        }
      },
      { threshold: [0.2, 0.45, 0.7] }
    );

    for (const mission of missions) {
      const element = document.getElementById(mission.id);
      if (element) {
        observer.observe(element);
      }
    }

    return () => observer.disconnect();
  }, [missions]);

  const completedCount = missions.filter((mission) => visited[mission.id]).length;
  const xp = missions.reduce((sum, mission) => sum + (visited[mission.id] ? mission.xp : 0), 0);
  const completion = missions.length > 0 ? completedCount / missions.length : 0;
  const level = completedCount + 1;

  return {
    completion,
    completedCount,
    lastUnlocked,
    level,
    visited,
    xp,
  };
}
