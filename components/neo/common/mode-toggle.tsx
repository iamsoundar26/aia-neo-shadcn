import React, { useEffect } from "react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  loadHints,
  setHints,
  useReconOnboarding,
} from "@/hooks/pages/neo/use-recon-onboarding";

/**
 * Guided or Normal (24 Oct 2026). Both look the same; Guided adds a short
 * hint at each step of a job, Normal adds none. The choice is kept on this
 * device.
 */
const ModeToggle = () => {
  const { hints } = useReconOnboarding();
  useEffect(() => loadHints(), []);
  return (
    <Tabs
      value={hints ? "guided" : "normal"}
      onValueChange={(v) => setHints(v === "guided")}
    >
      <TabsList
        aria-label="Mode"
        data-testid="mode-toggle"
        className="h-8 gap-0.5 rounded-lg bg-pi-fill p-0.5"
      >
        {(["guided", "normal"] as const).map((m) => (
          <TabsTrigger
            key={m}
            value={m}
            data-testid={`mode-${m}`}
            className="h-7 rounded-md px-3 text-[14px] capitalize data-[state=active]:text-primary"
          >
            {m}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );
};

export default ModeToggle;
