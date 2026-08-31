'use client';

import React, { useState, useEffect, useCallback } from "react";
import GraphStage from "@/components/audiences/graph/GraphStage";
import GeoAudienceMap from "@/components/audiences/map/GeoAudienceMap";
import GraphControls from "@/components/audiences/graph/GraphControls";
import NLSearchBar from "@/components/audiences/search/NLSearchBar";
import EntityInspector from "@/components/audiences/sidebar/EntityInspector";
import DeepSonaModal from "@/components/audiences/deepsona/DeepSonaModal";
import CampaignBriefModal from "@/components/audiences/brief/CampaignBriefModal";
import A2ANegotiationFeed from "@/components/audiences/a2a/A2ANegotiationFeed";
import GeminiLandingStage from "@/components/audiences/landing/GeminiLandingStage";
import PlayerMarketingJourneySankey from "@/components/audiences/journey/PlayerMarketingJourneySankey";
import SpannerDataSourceToggle, { SpannerDataSource } from "@/components/audiences/common/SpannerDataSourceToggle";
import { GraphData, GraphNode, ContextualViewType, GameFranchise, DeepSonaResult, CampaignBrief } from "@/types";
import { useFranchise } from "@/context/FranchiseContext";
import { useCampaign } from "@/context/CampaignContext";
import { useA2AEventBus } from "@/context/A2AEventBusContext";
import { Radio, Users, Sparkles, ArrowLeft, Database, Search, Loader2, BarChart3 } from "lucide-react";

export default function AudiencesPage() {
  const { currentFranchise, setCurrentFranchise } = useFranchise();
  const { setActiveBrief, setActiveCohort } = useCampaign();
  const { publishMessage, setIsDrawerOpen } = useA2AEventBus();

  const [isLandingView, setIsLandingView] = useState<boolean>(false);
  const [dataSource, setDataSource] = useState<SpannerDataSource>("live_spanner");
  const [currentView, setCurrentView] = useState<ContextualViewType>("audience-cohorts");
  const [selectedGame, setSelectedGame] = useState<GameFranchise>(currentFranchise || "ALL");
  const [archetypeFilter, setArchetypeFilter] = useState<string>("ALL");
  const [is3D, setIs3D] = useState<boolean>(false);
  const [graphData, setGraphData] = useState<GraphData>({ nodes: [], links: [] });
  const [isSegmentedView, setIsSegmentedView] = useState<boolean>(false);
  const [cohortContext, setCohortContext] = useState<any>(null);
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [isNlLoading, setIsNlLoading] = useState<boolean>(false);
  const [isCohortDrawerOpen, setIsCohortDrawerOpen] = useState<boolean>(true);

  // DeepSona Preloading & Loading states
  const [isDeepSonaLoading, setIsDeepSonaLoading] = useState<boolean>(false);
  const [isGeneratingBrief, setIsGeneratingBrief] = useState<boolean>(false);
  const [deepSonaPreloadedResult, setDeepSonaPreloadedResult] = useState<DeepSonaResult | null>(null);
  const [preloadedCreativeTitle, setPreloadedCreativeTitle] = useState<string>("");
  const [preloadedFranchise, setPreloadedFranchise] = useState<string>("");

  // Modals & Panels state
  const [isDeepSonaOpen, setIsDeepSonaOpen] = useState<boolean>(false);
  const [isBriefOpen, setIsBriefOpen] = useState<boolean>(false);
  const [isA2ABusOpen, setIsA2ABusOpen] = useState<boolean>(false);
  const [currentBrief, setCurrentBrief] = useState<CampaignBrief | null>(null);

  // Sync with global franchise context
  useEffect(() => {
    if (currentFranchise && currentFranchise !== selectedGame) {
      setSelectedGame(currentFranchise);
    }
  }, [currentFranchise]);

  // Fetch Graph Data based on current view, franchise, and filters
  const fetchGraphView = useCallback(async () => {
    if (currentView === "geo-map" || isSegmentedView) return;
    try {
      const params = new URLSearchParams();
      params.set("view", currentView);
      params.set("game", selectedGame);
      if (archetypeFilter !== "ALL") params.set("archetype", archetypeFilter);
      if (selectedNode) params.set("playerId", selectedNode.id);

      const res = await fetch(`/api/graph/view?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setGraphData(data);
      }
    } catch (e) {
      console.error("Error loading graph view:", e);
    }
  }, [currentView, selectedGame, archetypeFilter, selectedNode, isSegmentedView]);

  useEffect(() => {
    fetchGraphView();
  }, [fetchGraphView]);

  const handleNodeClick = (node: GraphNode | null) => {
    setSelectedNode(node);
    setIsCohortDrawerOpen(true);
  };

  const handleSearchResults = (
    newData: GraphData,
    summary: string,
    gql: string,
    metrics: any,
    queryPrompt?: string,
    franchiseOverride?: GameFranchise
  ) => {
    const targetFranchise = franchiseOverride || selectedGame;
    setIsSegmentedView(true);
    setIsCohortDrawerOpen(true);
    setSelectedNode(null);
    setGraphData(newData);
    if (metrics) {
      const contextObj = {
        query: queryPrompt || "Segmented Cohort",
        franchise: targetFranchise,
        matchedCount: metrics.matched_count || (newData.nodes || []).filter((n) => n.type === "PLAYER").length || 0,
        estimatedTotal: metrics.estimated_total || ((newData.nodes || []).filter((n) => n.type === "PLAYER").length * 12) || 0,
        dominantArchetype: metrics.dominant_archetype || "COMPETITIVE_GRINDER",
        avgSpend: metrics.avg_spend_usd || 850,
        avgChurn: metrics.avg_churn_risk ?? 0.45,
        avgTilt: metrics.avg_tilt_sensitivity ?? 0.65,
      };
      setCohortContext(contextObj);
      setActiveCohort(contextObj);
    } else {
      const playerNodes = (newData.nodes || []).filter((n) => n.type === "PLAYER");
      const contextObj = {
        query: queryPrompt || "Segmented Cohort",
        franchise: targetFranchise,
        matchedCount: playerNodes.length,
        estimatedTotal: playerNodes.length * 12,
        dominantArchetype: "COMPETITIVE_GRINDER",
        avgSpend: 850,
        avgChurn: 0.45,
        avgTilt: 0.65,
      };
      setCohortContext(contextObj);
      setActiveCohort(contextObj);
    }
  };

  const handleLandingSearch = async (queryText: string, franchise: GameFranchise) => {
    setIsSegmentedView(true);
    setSelectedGame(franchise);
    setCurrentFranchise(franchise);
    setIsNlLoading(true);

    try {
      const res = await fetch("/api/audiences/nl-query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: queryText, game: franchise, dataSource }),
      });

      if (res.ok) {
        const data = await res.json();
        handleSearchResults(
          { nodes: data.nodes, links: data.links },
          data.natural_language_summary,
          data.generated_gql,
          data.aggregate_metrics,
          queryText,
          franchise
        );
        setIsLandingView(false);
      }
    } catch (e) {
      console.error("Landing query error:", e);
    } finally {
      setIsNlLoading(false);
    }
  };

  const handleLandingExploreFull = (franchise: GameFranchise) => {
    setIsSegmentedView(false);
    setSelectedGame(franchise);
    setCurrentFranchise(franchise);
    setArchetypeFilter("ALL");
    setCurrentView("audience-cohorts");
    setIsLandingView(false);
  };

  const handleLaunchDeepSona = async (node?: GraphNode) => {
    if (isDeepSonaLoading) return;
    const target = node || selectedNode;
    if (node) setSelectedNode(node);

    setIsDeepSonaLoading(true);

    const activeFranchiseName =
      selectedGame === "ALL"
        ? (cohortContext?.franchise && cohortContext.franchise !== "ALL" ? cohortContext.franchise : "EA Live Service")
        : selectedGame === "FC26"
        ? "EA SPORTS FC 26"
        : selectedGame === "APEX"
        ? "Apex Legends"
        : selectedGame === "MADDEN25"
        ? "Madden NFL 25"
        : selectedGame === "BATTLEFIELD"
        ? "Battlefield 2042"
        : "The Sims 4";

    let targetTitle = "Contextual Marketing & Retention Intervention";
    let spend = 120000;
    if (cohortContext?.query) {
      targetTitle = `${cohortContext.query} — Real-Time Intervention`;
    } else if (target) {
      targetTitle = `${target.name} • ${target.archetype || "Player"} Direct Contextual Offer`;
    } else if (selectedGame === "APEX") {
      targetTitle = "Apex Legends Battle Pass Ultimate+ & 1,000 Coins Starter ($4.99 - $19.99)";
      spend = 180000;
    } else if (selectedGame === "MADDEN25") {
      targetTitle = "Madden NFL 25 MUT Field Pass & 500 Points Starter ($4.99 - $9.99)";
      spend = 150000;
    } else if (selectedGame === "SIMS4") {
      targetTitle = "The Sims 4: Lovestruck & Riviera Creator Kits ($4.99 - $39.99)";
      spend = 140000;
    } else if (selectedGame === "BATTLEFIELD") {
      targetTitle = "Battlefield 2042 Elite Edition Upgrade & 500 BFC Starter ($4.99 - $39.99)";
      spend = 110000;
    } else {
      targetTitle = "EA SPORTS FC 26 Ultimate Edition & 500 FC Points Starter ($4.99 - $99.99)";
      spend = 120000;
    }

    setPreloadedCreativeTitle(targetTitle);
    setPreloadedFranchise(activeFranchiseName);

    const playerNodes = graphData.nodes.filter(
      (n) => n.type === "PLAYER" && (selectedGame === "ALL" || n.franchise === selectedGame || (n.franchise || "").includes(selectedGame === "FC26" ? "FC" : selectedGame))
    );
    let sampledPlayers: any[] = [];
    if (playerNodes.length > 0) {
      const sortedByTilt = [...playerNodes].sort(
        (a, b) => (b.tilt || 0) - (a.tilt || 0) || (b.loss_streak || 0) - (a.loss_streak || 0)
      );
      const sortedBySpend = [...playerNodes].sort((a, b) => (b.spend || 0) - (a.spend || 0));
      const socialCandidates = playerNodes.filter(
        (p) => (p.archetype || "").includes("SOCIAL") || (p.archetype || "").includes("RUSH") || (p.archetype || "").includes("SQUAD")
      );
      const casualCandidates = [...playerNodes].sort((a, b) => (a.spend || 0) - (b.spend || 0));

      const p1 = target?.type === "PLAYER" ? target : sortedByTilt[0] || playerNodes[0];
      const p2 = sortedBySpend.find((p) => p.id !== p1.id) || playerNodes[1 % playerNodes.length];
      const p3 = socialCandidates.find((p) => p.id !== p1.id && p.id !== p2.id) || playerNodes[2 % playerNodes.length];
      const p4 = casualCandidates.find((p) => p.id !== p1.id && p.id !== p2.id && p.id !== p3.id) || playerNodes[3 % playerNodes.length];

      sampledPlayers = [p1, p2, p3, p4];
    }

    try {
      const res = await fetch("/api/synthetic/deepsona", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          campaign_id: `camp-ea-${Date.now()}`,
          franchise: activeFranchiseName,
          creative_title: targetTitle,
          proposed_spend: spend,
          target_roas: 2.45,
          cohort_context: {
            ...cohortContext,
            franchise: selectedGame,
          },
          sampled_players: sampledPlayers,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setDeepSonaPreloadedResult(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsDeepSonaLoading(false);
      setIsDeepSonaOpen(true);
    }
  };

  const handleEmitA2A = async (node?: GraphNode) => {
    const target = node || selectedNode;
    try {
      await publishMessage({
        correlation_id: `corr-brief-${Date.now()}`,
        sender: "Jamie_DeepSonaAgent (Act 1)",
        recipient: "Curtis_CreativeStudioAgent (Act 2)",
        intent: "DISPATCH_AUDIENCE_BRIEF",
        payload: {
          player_id: target?.id || "cohort-aggregate",
          display_name: target?.name || cohortContext?.query || "Synthesized Audience Cohort",
          franchise: target?.franchise || selectedGame,
          archetype: target?.archetype || cohortContext?.dominantArchetype || "COMPETITIVE_GRINDER",
          churn_risk: target?.churn_risk || cohortContext?.avgChurn || 0.45,
          friction_point: "Situational Friction & Monetization Intent Trigger",
        },
      });
      setIsDrawerOpen(true);
    } catch (e) {
      console.error(e);
    }
  };

  const handleGenerateBrief = async (result: DeepSonaResult) => {
    if (isGeneratingBrief) return;
    setIsGeneratingBrief(true);
    try {
      const res = await fetch("/api/campaign/brief", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          franchise: result.franchise || (selectedGame === "ALL" ? "EA SPORTS FC 26" : selectedGame),
          segment: result.target_cohort_query || (cohortContext?.query ? cohortContext.query : "Segmented Audience Cohort"),
          creative_title: result.creative_title,
          predicted_conversion_lift: result.predicted_conversion_lift,
          audience_size: cohortContext?.estimatedTotal || 245000,
        }),
      });
      if (res.ok) {
        const brief = await res.json();
        setCurrentBrief(brief);
        setActiveBrief(brief);
        setIsDeepSonaOpen(false);
        setIsBriefOpen(true);
      }
    } catch (e) {
      console.error(e);
      setIsDeepSonaOpen(false);
    } finally {
      setIsGeneratingBrief(false);
    }
  };

  // If in Landing / Search Mode, render Gemini Enterprise inspired start page
  if (isLandingView) {
    return (
      <GeminiLandingStage
        onSearchQuery={handleLandingSearch}
        onExploreFullGraph={handleLandingExploreFull}
        onOpenA2A={() => setIsDrawerOpen(true)}
        onOpenGeoMap={() => {
          setCurrentView("geo-map");
          setIsLandingView(false);
        }}
        onOpenMarketingJourney={() => {
          setCurrentView("marketing-journey");
          setIsLandingView(false);
        }}
        isLoading={isNlLoading}
        dataSource={dataSource}
        onDataSourceChange={setDataSource}
      />
    );
  }

  // Interactive Graph Canvas View
  return (
    <div className="relative w-full h-[calc(100vh-84px)] overflow-hidden bg-[#080A0E] font-sans antialiased select-none">
      {/* Unified Apple Glass Floating Control Dock */}
      <div className="absolute top-4 left-6 right-6 z-20 flex flex-wrap items-center justify-between gap-3 px-4 py-2 bg-black/60 backdrop-blur-2xl rounded-2xl border border-white/10 shadow-2xl pointer-events-auto">
        {/* Left: View Switcher & Title/Cohort Selectors */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsLandingView(true)}
            className="apple-press flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/[0.08] hover:bg-white/[0.15] text-white text-xs font-semibold transition-all border border-white/10 shadow-sm"
            title="Return to Search & Start Page"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Search</span>
          </button>

          <GraphControls
            currentView={currentView}
            onViewChange={(v) => {
              setIsSegmentedView(false);
              setSelectedNode(null);
              setCurrentView(v);
            }}
            selectedGame={selectedGame}
            onGameChange={(g) => {
              setIsSegmentedView(false);
              setSelectedNode(null);
              setSelectedGame(g);
              setCurrentFranchise(g);
            }}
            archetypeFilter={archetypeFilter}
            onArchetypeChange={(a) => {
              setArchetypeFilter(a);
              setSelectedNode(null);
              if (a !== "ALL") {
                setIsSegmentedView(true);
                setIsCohortDrawerOpen(true);
                const matchedPlayers = graphData.nodes.filter((n) => n.type === "PLAYER" && n.archetype === a);
                const avgSpend =
                  matchedPlayers.length > 0
                    ? Math.round(matchedPlayers.reduce((s, p) => s + (p.spend || 0), 0) / matchedPlayers.length)
                    : 1250;
                const contextObj = {
                  query: a.replace(/_/g, " "),
                  franchise: selectedGame,
                  matchedCount: matchedPlayers.length || 44,
                  estimatedTotal: (matchedPlayers.length || 44) * 12,
                  dominantArchetype: a,
                  avgSpend,
                  avgChurn: 0.42,
                  avgTilt: 0.68,
                };
                setCohortContext(contextObj);
                setActiveCohort(contextObj);
              } else {
                setIsSegmentedView(false);
                setCohortContext(null);
              }
            }}
            is3D={is3D}
            onToggle3D={() => setIs3D(!is3D)}
            nodeCount={graphData.nodes.length}
            edgeCount={graphData.links.length}
          />
        </div>

        {/* Right Actions: Cohort Intel Toggle, Spanner Toggle & Synthetic Focus Group */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setIsCohortDrawerOpen(!isCohortDrawerOpen)}
            className={`apple-press flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
              isCohortDrawerOpen
                ? "bg-cyan-500/20 text-cyan-300 border-cyan-500/40 shadow-sm"
                : "bg-white/[0.06] hover:bg-white/[0.12] text-gray-300 border-white/10"
            }`}
            title="Toggle Cohort Intelligence Panel"
          >
            <BarChart3 className="w-3.5 h-3.5 text-cyan-400" />
            <span>Cohort Intel</span>
          </button>

          <SpannerDataSourceToggle
            dataSource={dataSource}
            onToggle={setDataSource}
          />

          <button
            onClick={() => handleLaunchDeepSona()}
            disabled={isDeepSonaLoading}
            className={`apple-press flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              isDeepSonaLoading
                ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm"
                : "bg-gradient-to-r from-[#0072BC] to-[#008BE6] hover:brightness-110 text-white shadow-md shadow-[#0072BC]/25 border border-white/15"
            }`}
          >
            {isDeepSonaLoading ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-400" />
                <span>Synthesizing...</span>
              </>
            ) : (
              <>
                <Users className="w-3.5 h-3.5 text-white" />
                <span>Synthetic Focus Group</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Main Interactive Stage */}
      <div className="w-full h-full">
        {currentView === "geo-map" ? (
          <GeoAudienceMap />
        ) : currentView === "marketing-journey" ? (
          <PlayerMarketingJourneySankey
            graphData={graphData}
            onSelectPlayer={(p) => setSelectedNode(p)}
            onLaunchDeepSona={(target, customTitle) => handleLaunchDeepSona(target)}
            onEmitA2A={(target) => handleEmitA2A(target)}
            onReturnToGraph={() => setCurrentView("audience-cohorts")}
          />
        ) : (
          <GraphStage
            data={graphData}
            is3D={is3D}
            selectedNode={selectedNode}
            onNodeClick={handleNodeClick}
          />
        )}
      </div>

      {/* Persistent Quick HUD Button to re-open Cohort Intel if closed */}
      {!isCohortDrawerOpen && currentView === "audience-cohorts" && (
        <button
          onClick={() => setIsCohortDrawerOpen(true)}
          className="apple-press absolute top-20 right-6 z-20 flex items-center gap-2.5 px-4 py-2 bg-black/75 backdrop-blur-2xl rounded-2xl border border-cyan-500/30 text-xs text-white shadow-2xl hover:border-cyan-500/60 transition-all group"
        >
          <div className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse" />
          <span className="font-semibold text-cyan-300">
            {cohortContext?.query || (archetypeFilter !== "ALL" ? archetypeFilter.replace(/_/g, " ") : "Audience Cohort")}
          </span>
          <span className="text-gray-400 text-[11px] font-mono">
            ({graphData.nodes.filter((n) => n.type === "PLAYER").length} Players)
          </span>
          <span className="text-xs text-cyan-400 font-bold ml-1 group-hover:translate-x-0.5 transition-transform">
            View Intel →
          </span>
        </button>
      )}

      {/* Natural Language Search Overlay */}
      {currentView !== "marketing-journey" && (
        <NLSearchBar
          selectedGame={selectedGame}
          onSearchResults={handleSearchResults}
          onLaunchDeepSona={() => handleLaunchDeepSona()}
          isLoading={isNlLoading}
          setIsLoading={setIsNlLoading}
          isDeepSonaLoading={isDeepSonaLoading}
          dataSource={dataSource}
          onResetToMacro={() => {
            setIsSegmentedView(false);
            setCohortContext(null);
            setSelectedNode(null);
            fetchGraphView();
          }}
        />
      )}

      {/* Right Drawer: Selected Entity & Cohort Telemetry Inspector */}
      {isCohortDrawerOpen && (
        <EntityInspector
          node={selectedNode}
          cohortContext={cohortContext}
          graphData={graphData}
          onSelectNode={(n) => setSelectedNode(n)}
          onClose={() => {
            if (selectedNode) {
              setSelectedNode(null);
            } else {
              setIsCohortDrawerOpen(false);
            }
          }}
          onLaunchDeepSona={handleLaunchDeepSona}
          onEmitA2A={handleEmitA2A}
          isDeepSonaLoading={isDeepSonaLoading}
        />
      )}

      {/* DeepSona Multi-Agent Synthetic Testing Modal */}
      <DeepSonaModal
        isOpen={isDeepSonaOpen}
        onClose={() => setIsDeepSonaOpen(false)}
        targetNode={selectedNode}
        cohortContext={cohortContext}
        selectedGame={selectedGame}
        graphData={graphData}
        initialResult={deepSonaPreloadedResult}
        initialCreativeTitle={preloadedCreativeTitle}
        initialFranchise={preloadedFranchise}
        isGeneratingBrief={isGeneratingBrief}
        onGenerateBrief={handleGenerateBrief}
      />

      {/* Campaign Brief Walkthrough Modal */}
      {currentBrief && (
        <CampaignBriefModal
          isOpen={isBriefOpen}
          onClose={() => setIsBriefOpen(false)}
          brief={currentBrief}
        />
      )}

      {/* A2A Agent-to-Agent Event Bus Feed */}
      <A2ANegotiationFeed
        isOpen={isA2ABusOpen}
        onClose={() => setIsA2ABusOpen(false)}
      />
    </div>
  );
}
