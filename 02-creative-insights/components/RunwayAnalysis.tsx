import React, { useState, useEffect, useRef } from 'react';
import { Play, Filter, FileText, Download, Loader2, Sparkles, PieChart as PieChartIcon, TrendingUp, Layers, Eye, BarChart2, Plus, Save, Trash2, RotateCw, Settings, Globe, MessageSquare, Search, X, Tag, Users, Music, Star, ExternalLink, ShieldCheck, CheckCircle2, AlertCircle, ThumbsUp, ThumbsDown, Bell, Headphones, Link, Video, Shield, GitCompare, PlusCircle, Check, Compass, MessageCircle, Radio, Flame, Hash, Clock, DollarSign, Target, LayoutDashboard, Share2 } from 'lucide-react';
import { brandConfig } from '../config';
import { useCompanyContext } from '../context/CompanyContext';
import { analyzeAdVideo, analyzeRedditSentiment, analyzeTikTokSentiment, generateCompetitiveAnalysis, analyzeVideoSentiment, analyzeCommentsSentiment, analyzeYouTubeSentiment, generateBulkAnalysis, analyzeSteamReviews, analyzeTrustpilotSentiment, analyzeTikTokHashtagSentiment, analyzeMultiChannelSocialIntelligence, analyzeWebsite, generateText, groundedSearch } from '../services/geminiService';
import { useAppConfig } from '../context/AppConfigContext';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell, AreaChart, Area, PieChart, Pie, Legend } from 'recharts';
import { SentimentAnomalyAlerts } from './SentimentAnomalyAlerts';
import { DailySummaryBrief } from './DailySummaryBrief';
import { FullAudit } from './FullAudit';
import { NoiseFilter } from './NoiseFilter';
import { InsightAudit } from './InsightAudit';
import { AdOpportunities } from './AdOpportunities';
import { InsightsHome } from './InsightsHome';
import { SocialIntelligenceDashboard, TikTokHashtagDashboard } from './SocialIntelligenceDashboard';
import { SteamReviewsDashboard } from './SteamReviewsDashboard';



interface AbcdScore {
    score: number;
    observation: string;
}

interface ObservationItem {
    category: string;
    notes: string;
}

interface BrandingTimelineItem {
    time_segment: string;
    presence_percent: number;
    action: string;
}

interface AnalysisResult {
    abcd_scores: {
        attract: AbcdScore;
        brand: AbcdScore;
        connect: AbcdScore;
        direct: AbcdScore;
    };
    branding_timeline?: BrandingTimelineItem[];
    observations: ObservationItem[];
    takeaways: string[];
    summary: string;
    timestamp: string;
    type?: string;
    counts?: {
        positive?: number;
        negative?: number;
        neutral?: number;
    };
    star_distribution?: {
        star_5?: number;
        star_4?: number;
        star_3?: number;
        star_2?: number;
        star_1?: number;
    };
    sentiment_score?: number;
    retail_dimensions?: Array<{
        dimension: string;
        sentiment: string;
        score: number;
        summary: string;
        strengths?: string[];
        pain_points?: string[];
    }>;
    reviews?: {
        positive?: string[];
        negative?: string[];
        neutral?: string[];
    };
    strategic_recommendations?: Array<{
        priority: string;
        area: string;
        recommendation: string;
        expected_impact?: string;
    }>;
    business_info?: {
        name?: string;
        domain?: string;
        trustScore?: string;
        rating?: string;
        reviewCount?: number;
        logo?: string;
        categories?: string[];
    };
    findings?: {
        positive?: string[];
        negative?: string[];
    };
    word_cloud?: string[];
    hashtag?: string;
    tag?: string;
    sampleSize?: number;
    timeRange?: string;
    totalViews?: string;
    totalPostsFound?: number;
    topVideos?: any[];
    sampledComments?: any[];
    viral_themes?: Array<{
        theme: string;
        share: number;
        sentiment: string;
        description: string;
        resonance?: string;
    }>;
    audio_trends?: Array<{
        soundName: string;
        creator: string;
        uses: string;
        mood: string;
    }>;
}

const typePageTitles: {[key: string]: string} = {
    abcd: "ABCD Framework Analysis",
    competitor_abcd: "Competitor ABCD Analysis",
    youtube_sentiment: "YouTube Sentiment (Video & Comments)",
    sentiment_video: "Video Sentiment Analysis",
    sentiment_comments: "Comments Sentiment Analysis",
    fashion_analysis: "Fashion Trend Analysis",
    trend_analysis: "General Trend Analysis",
    creator_partner: "Creator Partner Audit & Analysis",
    steam_reviews: "Steam Review Analysis",
    trustpilot_sentiment: "Trustpilot Sentiment Analysis",
    tiktok_hashtag: "TikTok Hashtag Sentiment & Viral Analysis",
    social_intelligence: "Social & Community Intelligence",
    website_analysis: "Website Analysis",
    grounded_search: "Grounded Search",
    competitive: "Competitive Analysis",
    abcd_comparative: "ABCD Comparative Analysis",
    comparative: "General Comparative Analysis",
    video_metadata: "Video Metadata Extraction",
};

const SUPPORTED_INSIGHT_TYPES = [
    { id: 'youtube_sentiment', label: 'YouTube: Video & Comment Sentiment' },
    { id: 'steam_reviews', label: 'Steam: Player Reviews' },
    { id: 'reddit', label: 'Reddit: Community Sentiment' },
    { id: 'tiktok', label: 'TikTok Trend Sentiment' },
    { id: 'abcd', label: 'ABCD Framework' },
    { id: 'tiktok_hashtag', label: 'TikTok Hashtag' },
    { id: 'creator_partner', label: 'Creator Partner Analysis' },
    { id: 'fashion_analysis', label: 'Fashion Analysis' },
    { id: 'trend_analysis', label: 'Trend Analysis' },
    { id: 'video_metadata', label: 'Video Metadata' },
    { id: 'competitive', label: 'Competitive (Single)' },
    { id: 'abcd_comparative', label: 'ABCD Comparative' },
    { id: 'comparative', label: 'General Comparative' },
    { id: 'trustpilot_sentiment', label: 'Trustpilot Sentiment' },
    { id: 'website_analysis', label: 'Website Analysis' },
    { id: 'grounded_search', label: 'Grounded Search' },
    { id: 'competitor_abcd', label: 'ABCD Competitor' },
    { id: 'competitor_sentiment_video', label: 'Competitor Sentiment (Video)' },
    { id: 'competitor_sentiment_comments', label: 'Competitor Sentiment (Comments)' }
];

const typeSectionLabels: {[key: string]: string} = {
    abcd: "Creative Video Analysis",
    competitor_abcd: "Competitor Video",
    youtube_sentiment: "YouTube Video",
    sentiment_video: "Analysis Video",
    sentiment_comments: "Analysis Video",
    fashion_analysis: "Fashion Video",
    trend_analysis: "Trend Video",
    creator_partner: "Creator Video",
    steam_reviews: "Steam Game",
    trustpilot_sentiment: "Trustpilot Review URL",
    tiktok_hashtag: "TikTok Hashtag",
    social_intelligence: "Social & Community Query",
    website_analysis: "Target Website",
    grounded_search: "Search Query",
    competitive: "Analysis Video",
    abcd_comparative: "Analysis Videos",
    comparative: "Analysis Videos",
    video_metadata: "Analysis Video",
};

let findInsightsModalState = {
    isOpen: false,
    prompt: "",
    enableGroundedSearch: true,
    selectedContentTypes: ['reddit', 'tiktok', 'youtube', 'steam_reviews', 'trustpilot_sentiment', 'website_analysis'] as string[],
    foundInsights: [] as any[],
    isFindingInsights: false,
    companyName: "",
    groundingTrace: null as any
};

const triggerModalUpdate = () => {
    window.dispatchEvent(new CustomEvent('find-insights-modal-update'));
};

const triggerAddSelectedInsights = (selected: any[]) => {
    window.dispatchEvent(new CustomEvent('add-selected-insights', { detail: selected }));
};

const handleRunFindInsights = async (targetCompany?: string) => {
    findInsightsModalState.isFindingInsights = true;
    findInsightsModalState.groundingTrace = null;
    triggerModalUpdate();
    try {
        const selectedTypes = findInsightsModalState.selectedContentTypes.length > 0
            ? findInsightsModalState.selectedContentTypes
            : ['social_intelligence', 'youtube', 'steam_reviews', 'trustpilot_sentiment', 'website_analysis'];
        const activeCompany = targetCompany || findInsightsModalState.companyName || 'EA Games FC';
        const userQuery = findInsightsModalState.prompt.trim() || `Search real-world social topics, YouTube video analyses, Steam community reviews, Trustpilot ratings, and web sentiment for ${activeCompany}`;
        
        const prompt = `
You are a senior media intelligence and player/consumer sentiment research analyst for "${activeCompany}".
Your objective is to find real, active, high-value multimedia and community sentiment content based on this research query:
"${userQuery}"

TARGET SOURCES:
${selectedTypes.map(id => `- ${id}`).join('\n')}

CRITICAL ACCURACY RULES:
1. Return between 8 to 16 REAL, authentic entries across the requested sources.
2. For Reddit ("type": "reddit"):
   - Provide genuine subreddit discussion threads or topic queries (e.g. "r/EASportsFC - Gameplay Patch Discussion", "r/gaming - ${activeCompany} Review", "Career Mode Feedback").
   - Set "subType": "reddit".
3. For TikTok ("type": "tiktok"):
   - Provide genuine TikTok trending hashtags or creator topics (e.g. "#fc26", "#eafc", "Ultimate Team Pack Opening", "Skill Moves Tutorial").
   - Set "subType": "tiktok".
3. For YouTube ("type": "youtube"):
   - Provide genuine YouTube watch URLs with valid 11-char video IDs found in Google search.
   - Classify with "subType": "creator_partner", "sentiment_video", "abcd", "sentiment_comments", or "trend_analysis".
4. For Steam ("type": "steam"):
   - ONLY return a Steam entry if the game is actually released and available on the Steam Store with a verified numeric App ID.
   - If the queried game (e.g. FC 27) is unreleased or not listed on Steam, DO NOT output an older game like FC 25 or FC 24.
   - Set "subType": "steam_reviews".
5. For Trustpilot ("type": "trustpilot"):
   - Provide a valid Trustpilot company review URL (e.g. "https://www.trustpilot.com/review/ea.com").
   - Set "subType": "trustpilot_sentiment".
6. For Website / Grounded Search ("type": "website" or "grounded_search"):
   - Set valid gaming news or publication URLs (IGN, Eurogamer, Kotaku, Polygon, EA official newsroom).
   - Set "subType": "website_analysis" or "grounded_search".

Return ONLY a valid JSON array of objects with the following schema:
[
  {
    "type": "social_intelligence" | "youtube" | "steam" | "trustpilot" | "website" | "grounded_search",
    "subType": "social_intelligence" | "creator_partner" | "sentiment_video" | "abcd" | "sentiment_comments" | "trend_analysis" | "steam_reviews" | "trustpilot_sentiment" | "website_analysis" | "grounded_search",
    "id": "11-char video ID, or numeric Steam App ID, or domain, or topic tag",
    "url": "full URL or numeric ID or topic query",
    "title": "Clear, informative title",
    "subtitle": "Source or Creator name (e.g. Social & Community Pulse, EA SPORTS FC Official, Steam Store, Trustpilot, IGN)",
    "rating": "Optional rating or score tag",
    "reason": "1-2 sentence high-impact summary of the key findings, topics covered, or sentiment themes in this item.",
    "tags": ["Tag1", "Tag2"]
  }
]

Do not wrap in markdown or backticks. Return valid JSON only.`;

        const { extractTextFromResponse, extractGroundingWebChunks, extractGroundingSearchQueries, safeJsonParse, GEMINI_MODELS } = await import('../services/geminiService');
        
        let rawResponseText = '';
        let rawGroundedLinks: Array<{ uri: string; title: string }> = [];
        let searchQueries: string[] = [];
        let data: any[] = [];

        // Direct Official YouTube API Search for real videos
        let realYouTubeItems: any[] = [];
        if (selectedTypes.includes('youtube')) {
            try {
                const ytRes = await fetch(`/api/youtube/search?q=${encodeURIComponent(userQuery)}&maxResults=6`);
                if (ytRes.ok) {
                    const ytVideos = await ytRes.json();
                    if (Array.isArray(ytVideos) && ytVideos.length > 0) {
                        realYouTubeItems = ytVideos.map((v: any) => ({
                            type: 'youtube',
                            subType: 'youtube_sentiment',
                            id: v.videoId,
                            url: v.videoUrl,
                            title: v.title,
                            subtitle: v.channelTitle || 'YouTube Creator',
                            image: v.thumbnail,
                            rating: 'YouTube Video',
                            reason: v.description ? v.description.substring(0, 160) : `Live YouTube video coverage for ${activeCompany}`,
                            tags: ['YouTube', 'Creator Partner']
                        }));
                    }
                }
            } catch (ytErr) {
                console.warn("Direct YouTube search fetch in Find Insights:", ytErr);
            }
        }

        if (findInsightsModalState.enableGroundedSearch) {
            // Stage 1: Plain text search grounded query (no JSON mode to allow full Google search grounding)
            const searchPrompt = `
You are a senior market intelligence researcher for ${brandConfig.name}.
Conduct live real-world Google search grounded research for the topic / query: "${userQuery}".
Focus on real current content, verified YouTube video coverage, Reddit community discourse, Steam release data, Trustpilot reviews, and industry news articles.

Research:
- Real YouTube videos and creator coverage with authentic titles and video URLs.
- Community discourse on Reddit / social platforms.
- Verified Steam Store availability and player reception.
- Trustpilot perception and brand trust.
- Recent publications (IGN, Eurogamer, Kotaku, Polygon, EA newsroom).

Provide a comprehensive plain text intelligence briefing listing all specific titles, creators, URLs, and key takeaways found.
`;

            const searchResponse = await fetch('/api/genai/generateContent', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    model: GEMINI_MODELS.FLASH,
                    contents: [{ role: "user", parts: [{ text: searchPrompt }] }],
                    config: {
                        temperature: 0.2,
                        maxOutputTokens: 8192,
                        tools: [{ googleSearch: {} }]
                    }
                })
            });

            if (!searchResponse.ok) {
                throw new Error(`Grounded Search Proxy error: ${searchResponse.status} ${searchResponse.statusText}`);
            }

            const searchRespData = await searchResponse.json();
            rawResponseText = extractTextFromResponse(searchRespData);
            rawGroundedLinks = extractGroundingWebChunks(searchRespData);
            searchQueries = extractGroundingSearchQueries(searchRespData);

            // Stage 2: JSON transformation parsing grounded research into structured insight tiles
            const verifiedLinksSummary = rawGroundedLinks.length > 0
                ? rawGroundedLinks.map((l, i) => `[Source ${i + 1}] Title: "${l.title}" | URL: ${l.uri}`).join('\n')
                : "No direct external URLs discovered.";

            const jsonExtractionPrompt = `
You are a data structuring agent.
Below is authentic, grounded market research and a list of verified web source URLs discovered from Google Search.

${prompt}

VERIFIED DISCOVERED WEB SOURCES:
${verifiedLinksSummary}

GROUNDED RESEARCH TEXT:
${rawResponseText}

CRITICAL RULES:
1. Extract 6-10 high-value intelligence items matching the schema.
2. For URL fields, use ONLY the URLs provided in the VERIFIED DISCOVERED WEB SOURCES list above.
3. Return valid raw JSON array only.
`;

            const jsonResponse = await fetch('/api/genai/generateContent', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    model: GEMINI_MODELS.FLASH,
                    contents: [{ role: "user", parts: [{ text: jsonExtractionPrompt }] }],
                    config: {
                        responseMimeType: "application/json",
                        temperature: 0.1,
                        maxOutputTokens: 8192
                    }
                })
            });

            if (!jsonResponse.ok) {
                throw new Error(`JSON Extraction Proxy error: ${jsonResponse.status} ${jsonResponse.statusText}`);
            }

            const jsonRespData = await jsonResponse.json();
            const rawJsonText = extractTextFromResponse(jsonRespData);
            data = safeJsonParse(rawJsonText, []);
        } else {
            // Standard non-grounded single JSON request
            const response = await fetch('/api/genai/generateContent', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    model: GEMINI_MODELS.FLASH,
                    contents: [{ role: "user", parts: [{ text: prompt }] }],
                    config: {
                        responseMimeType: "application/json",
                        temperature: 0.2
                    }
                })
            });

            if (!response.ok) {
                throw new Error(`Proxy error: ${response.status} ${response.statusText}`);
            }

            const respData = await response.json();
            rawResponseText = extractTextFromResponse(respData);
            data = safeJsonParse(rawResponseText, []);
        }
        
        findInsightsModalState.groundingTrace = {
            searchQueries,
            rawGroundedLinks,
            rawResponseText,
            timestamp: new Date().toISOString()
        };

        const combinedInsights = [...realYouTubeItems, ...(Array.isArray(data) ? data : [])];
        // Deduplicate by url/id
        const seen = new Set();
        const deduplicated = combinedInsights.filter(item => {
            const key = item.url || item.id || item.title;
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
        });

        // Resolve any Vertex AI grounding redirect URLs into canonical real destination URLs
        const { resolveRedirectUrls } = await import('../services/geminiService');
        const urlsToResolve: string[] = [];
        deduplicated.forEach(item => {
            if (item.url && typeof item.url === 'string' && (item.url.includes('vertexaisearch.cloud.google.com') || item.url.includes('google.com/url?'))) {
                urlsToResolve.push(item.url);
            }
            if (item.id && typeof item.id === 'string' && (item.id.includes('vertexaisearch.cloud.google.com') || item.id.includes('google.com/url?'))) {
                urlsToResolve.push(item.id);
            }
        });

        if (urlsToResolve.length > 0) {
            const resolvedMap = await resolveRedirectUrls(urlsToResolve);
            deduplicated.forEach(item => {
                if (item.url && resolvedMap[item.url]) {
                    item.url = resolvedMap[item.url];
                }
                if (item.id && resolvedMap[item.id]) {
                    item.id = resolvedMap[item.id];
                }
            });
        }

        findInsightsModalState.foundInsights = deduplicated;
        triggerModalUpdate();
    } catch (error) {
        console.error("Failed to find insights:", error);
        alert("Failed to find insights. Check console for details.");
    } finally {
        findInsightsModalState.isFindingInsights = false;
        triggerModalUpdate();
    }
};

const EyeIcon = ({ size = 24, className = "" }) => <Eye size={size} className={className} />;

interface FindInsightsModalProps {
    isOpen: boolean;
    prompt: string;
    setPrompt: (val: string) => void;
    enableGroundedSearch: boolean;
    setEnableGroundedSearch: (val: boolean) => void;
    selectedContentTypes: string[];
    setSelectedContentTypes: (val: string[]) => void;
    setIsOpen: (val: boolean) => void;
    foundInsights: any[];
    isFindingInsights: boolean;
    onRunSearch: () => void;
    companyName: string;
}

const FindInsightsModal: React.FC<FindInsightsModalProps> = ({
    isOpen, prompt, setPrompt, enableGroundedSearch, setEnableGroundedSearch, selectedContentTypes, setSelectedContentTypes, setIsOpen,
    foundInsights, isFindingInsights, onRunSearch, companyName
}) => {
    const [modalMode, setModalMode] = useState<'search' | 'url'>('search');
    const [selectedItems, setSelectedItems] = useState<number[]>([]);
    const [activeResultFilter, setActiveResultFilter] = useState<'all' | 'youtube' | 'steam' | 'trustpilot' | 'website' | 'social'>('all');
    const [addedIndices, setAddedIndices] = useState<Set<number>>(new Set());

    // 1. Follow Topic & Hashtag Tracker State
    const [topicTag, setTopicTag] = useState<string>('');
    const [topicTimeframe, setTopicTimeframe] = useState<'24h' | '7d' | '30d' | '1y' | 'all'>('7d');
    const [topicGuidance, setTopicGuidance] = useState<string>('');
    const [topicTitle, setTopicTitle] = useState<string>('');

    // 2. Search & Discovery State
    const [timeframe, setTimeframe] = useState<'24h' | '7d' | '30d' | '1y' | 'all'>('7d');
    const [guidance, setGuidance] = useState<string>('');

    // 3. Direct URL Addition State
    const [selectedUrlType, setSelectedUrlType] = useState<string>('social_intelligence');
    const [urlInput, setUrlInput] = useState<string>('');
    const [secondaryUrlInput, setSecondaryUrlInput] = useState<string>('');
    const [customTitle, setCustomTitle] = useState<string>('');
    const [customFocus, setCustomFocus] = useState<string>('');
    const [urlSuccessMsg, setUrlSuccessMsg] = useState<string | null>(null);
    const [showGroundingTrace, setShowGroundingTrace] = useState<boolean>(false);

    useEffect(() => {
        // Ensure grounded search is always enabled in background
        if (!enableGroundedSearch) {
            setEnableGroundedSearch(true);
        }
    }, [enableGroundedSearch, setEnableGroundedSearch]);

    useEffect(() => {
        // Ensure all content types are selected by default for search & discovery
        if (selectedContentTypes.length === 0) {
            setSelectedContentTypes(['social_intelligence', 'youtube', 'steam_reviews', 'trustpilot_sentiment', 'website_analysis']);
        }
    }, []);

    useEffect(() => {
        // When new search results arrive, select all by default
        if (foundInsights.length > 0) {
            setSelectedItems(foundInsights.map((_, i) => i));
            setAddedIndices(new Set());
        }
    }, [foundInsights]);

    if (!isOpen) return null;

    const sourceCategories = [
        { id: 'reddit', label: 'Reddit', icon: MessageSquare },
        { id: 'tiktok', label: 'TikTok', icon: Music },
        { id: 'youtube', label: 'YouTube', icon: Play },
        { id: 'steam_reviews', label: 'Steam Reviews', icon: FileText },
        { id: 'trustpilot_sentiment', label: 'Trustpilot', icon: Star },
        { id: 'website_analysis', label: 'Web', icon: Globe }
    ];

    const filteredInsights = foundInsights.filter((item) => {
        if (activeResultFilter === 'all') return true;
        if (activeResultFilter === 'reddit') return item.type === 'reddit';
        if (activeResultFilter === 'tiktok') return item.type === 'tiktok' || item.type === 'tiktok_hashtag';
        if (activeResultFilter === 'youtube') return item.type === 'youtube';
        if (activeResultFilter === 'steam') return item.type === 'steam';
        if (activeResultFilter === 'trustpilot') return item.type === 'trustpilot';
        if (activeResultFilter === 'website') return item.type === 'website' || item.type === 'grounded_search';
        return true;
    });

    const handleQuickAdd = (item: any, idx: number) => {
        triggerAddSelectedInsights([{ ...item, guidance }]);
        setAddedIndices(prev => new Set(prev).add(idx));
    };

    const handleSelectAllVisible = () => {
        const visibleIndices = foundInsights
            .map((item, idx) => ({ item, idx }))
            .filter(({ item }) => {
                if (activeResultFilter === 'all') return true;
                if (activeResultFilter === 'social') return item.type === 'social_intelligence' || item.type === 'tiktok' || item.type === 'tiktok_hashtag';
                if (activeResultFilter === 'youtube') return item.type === 'youtube';
                if (activeResultFilter === 'steam') return item.type === 'steam';
                if (activeResultFilter === 'trustpilot') return item.type === 'trustpilot';
                if (activeResultFilter === 'website') return item.type === 'website' || item.type === 'grounded_search';
                return true;
            })
            .map(({ idx }) => idx);
        setSelectedItems(Array.from(new Set([...selectedItems, ...visibleIndices])));
    };

    const handleDeselectAll = () => {
        setSelectedItems([]);
    };

    const handleCreateTracker = () => {
        const rawTag = topicTag.trim();
        if (!rawTag) {
            alert("Please enter a topic or hashtag to track.");
            return;
        }

        const cleanTag = rawTag.startsWith('#') ? rawTag : `#${rawTag}`;
        const displayTitle = topicTitle.trim() || `${cleanTag} Social & Community Pulse`;

        const newRow = {
            id: `social_intelligence-${Math.random().toString(36).substring(2, 9)}`,
            type: 'social_intelligence',
            url: rawTag,
            tag: rawTag,
            query: rawTag,
            title: displayTitle,
            focus: topicGuidance.trim() || undefined,
            guidance: topicGuidance.trim() || undefined,
            timeframe: topicTimeframe,
            status: 'pending',
            videos: [rawTag]
        };

        triggerAddSelectedInsights([newRow]);
        setTopicTag('');
        setTopicGuidance('');
        setTopicTitle('');
        setIsOpen(false);
    };

    const INSIGHT_TYPE_GROUPS = [
        {
            group: "Community & Social Platforms",
            options: [
                { id: 'reddit', label: 'Reddit', icon: MessageSquare, placeholder: 'Subreddit or query (e.g. r/EASportsFC or fc26)' },
                { id: 'tiktok', label: 'TikTok', icon: Music, placeholder: 'Hashtag or query (e.g. #fc26 or Ultimate Team)' },
                { id: 'steam_reviews', label: 'Steam Reviews', icon: FileText, placeholder: 'App ID or URL (e.g. 2669320)' },
                { id: 'trustpilot_sentiment', label: 'Trustpilot', icon: Star, placeholder: 'Trustpilot URL (e.g. ea.com)' }
            ]
        },
        {
            group: "Video & Advertising",
            options: [
                { id: 'abcd', label: 'ABCD Framework', icon: Play, placeholder: 'YouTube URL: https://www.youtube.com/watch?v=...' },
                { id: 'creator_partner', label: 'Creator Partner', icon: Video, placeholder: 'YouTube URL: https://www.youtube.com/watch?v=...' },
                { id: 'youtube_sentiment', label: 'YouTube Sentiment (Video & Comments)', icon: TrendingUp, placeholder: 'YouTube URL: https://www.youtube.com/watch?v=...' },
                { id: 'fashion_analysis', label: 'Fashion & Visual Styling', icon: Sparkles, placeholder: 'YouTube URL: https://www.youtube.com/watch?v=...' },
                { id: 'trend_analysis', label: 'Trend Analysis', icon: TrendingUp, placeholder: 'YouTube URL: https://www.youtube.com/watch?v=...' }
            ]
        },
        {
            group: "Web & Comparative",
            options: [
                { id: 'website_analysis', label: 'Web Article', icon: Globe, placeholder: 'Article URL: https://...' },
                { id: 'grounded_search', label: 'Web Search', icon: Search, placeholder: 'Search topic or query...' },
                { id: 'competitor_abcd', label: 'Competitor ABCD', icon: Shield, placeholder: 'Competitor Video URL: https://...' },
                { id: 'comparative', label: 'Comparative Two-Video', icon: GitCompare, placeholder: 'Primary Video URL: https://...', isComparative: true }
            ]
        }
    ];

    const allOptions = INSIGHT_TYPE_GROUPS.flatMap(g => g.options);
    const activeOption = allOptions.find(o => o.id === selectedUrlType) || allOptions[0];

    const handleAddDirectUrl = (shouldClose: boolean = false) => {
        if (!urlInput.trim()) {
            alert("Please enter a valid URL, ID, or query.");
            return;
        }

        const isComparative = selectedUrlType === 'comparative' || selectedUrlType === 'abcd_comparative';
        const videoList = isComparative
            ? [urlInput.trim(), secondaryUrlInput.trim()].filter(Boolean)
            : [urlInput.trim()];

        const newRow = {
            id: `${selectedUrlType}-${Math.random().toString(36).substring(2, 9)}`,
            type: selectedUrlType,
            url: urlInput.trim(),
            tag: urlInput.trim(),
            query: urlInput.trim(),
            title: customTitle.trim() || activeOption.label,
            focus: customFocus.trim() || guidance.trim() || undefined,
            guidance: guidance.trim() || undefined,
            timeframe: timeframe,
            status: 'pending',
            videos: videoList
        };

        triggerAddSelectedInsights([newRow]);
        setUrlSuccessMsg(`Added to table`);
        setTimeout(() => setUrlSuccessMsg(null), 3000);

        setUrlInput('');
        setSecondaryUrlInput('');
        setCustomTitle('');
        setCustomFocus('');

        if (shouldClose) {
            setIsOpen(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-start justify-center pt-8 md:pt-12 pb-6 px-4 overflow-y-auto animate-fadeIn font-sans">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[88vh] border border-slate-200 relative my-auto sm:my-0">
                
                {/* Clean Header */}
                <div className="px-6 py-4 border-b border-slate-150 flex justify-between items-center bg-slate-50">
                    <div className="flex items-center gap-2">
                        <Search size={18} className="text-indigo-600" />
                        <h3 className="font-bold text-base text-slate-900">Find Insights</h3>
                    </div>
                    <button 
                        onClick={() => setIsOpen(false)} 
                        className="h-9 w-9 bg-white hover:bg-slate-100 border border-slate-200 text-slate-500 hover:text-slate-700 rounded-xl flex items-center justify-center transition shadow-xs"
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Top Mode Toggle (3 Modes) */}
                <div className="px-6 py-2.5 bg-slate-100/70 border-b border-slate-200 flex items-center justify-between">
                    <div className="flex flex-wrap items-center gap-2">
                        <button
                            type="button"
                            onClick={() => setModalMode('search')}
                            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                                modalMode === 'search'
                                    ? 'bg-indigo-600 text-white shadow-xs'
                                    : 'bg-white text-slate-700 hover:bg-slate-50 border border-slate-200'
                            }`}
                        >
                            <Search size={13} /> Search & Discover
                        </button>
                        <button
                            type="button"
                            onClick={() => setModalMode('url')}
                            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                                modalMode === 'url'
                                    ? 'bg-indigo-600 text-white shadow-xs'
                                    : 'bg-white text-slate-700 hover:bg-slate-50 border border-slate-200'
                            }`}
                        >
                            <Link size={13} /> Add by URL
                        </button>
                    </div>

                    {modalMode === 'url' && urlSuccessMsg && (
                        <div className="flex items-center gap-1 px-2.5 py-1 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-lg text-xs font-bold animate-fadeIn">
                            <CheckCircle2 size={13} className="text-emerald-600" />
                            <span>{urlSuccessMsg}</span>
                        </div>
                    )}
                </div>

                {/* Modal Body */}
                <div className="flex-1 overflow-y-auto p-6 space-y-5">
                    
                    {/* TAB 1: FOLLOW TOPIC & HASHTAG (MULTI-AGENT TRACKER) */}
                    {false && modalMode === ('tracker' as any) && (
                        <div className="space-y-4 animate-fadeIn">
                            
                            {/* Topic / Hashtag Input */}
                            <div className="space-y-1.5">
                                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider font-mono">
                                    Topic or Hashtag
                                </label>
                                <input
                                    type="text"
                                    value={topicTag}
                                    onChange={e => setTopicTag(e.target.value)}
                                    placeholder="e.g. #fc26, fc26 Ultimate Team, or Career Mode"
                                    className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-2xs"
                                    autoFocus
                                />
                            </div>

                            {/* Analyst Guidance & Custom Title */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div className="space-y-1.5">
                                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider font-mono">
                                        Analyst Guidance (Optional)
                                    </label>
                                    <input
                                        type="text"
                                        value={topicGuidance}
                                        onChange={e => setTopicGuidance(e.target.value)}
                                        placeholder="e.g. Focus on defending mechanics and server ping..."
                                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-2xs"
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider font-mono">
                                        Custom Label (Optional)
                                    </label>
                                    <input
                                        type="text"
                                        value={topicTitle}
                                        onChange={e => setTopicTitle(e.target.value)}
                                        placeholder={`e.g. ${companyName || 'EA Sports FC'} Community Pulse`}
                                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-2xs"
                                    />
                                </div>
                            </div>

                            {/* Multi-Agent Intelligence Notice */}
                            <div className="p-3.5 bg-indigo-50/50 rounded-xl border border-indigo-100 text-xs text-slate-600 space-y-1">
                                <div className="font-bold text-indigo-950 flex items-center gap-1.5">
                                    <Compass size={14} className="text-indigo-600" />
                                    <span>6 Independent Live AI Agents</span>
                                </div>
                                <p className="text-[11px] text-slate-500">
                                    Tracking this topic spawns 6 dedicated agents across TikTok, Reddit, YouTube comments, YouTube videos, Steam reviews, and Trustpilot.
                                </p>
                            </div>
                        </div>
                    )}

                    {/* TAB 2: SEARCH & DISCOVERY */}
                    {modalMode === 'search' && (
                        <>
                            {/* Search Query Input */}
                            <div className="space-y-1.5">
                                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider font-mono">
                                    Search Query
                                </label>
                                <textarea
                                    value={prompt}
                                    onChange={e => setPrompt(e.target.value)}
                                    placeholder="Search topics, gameplay mechanics, creator clips, player feedback, or reviews..."
                                    className="w-full h-20 border border-slate-200 bg-white rounded-xl p-3 text-xs font-medium focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 shadow-2xs outline-none resize-none text-slate-800 transition"
                                />
                            </div>

                            {/* Analyst Guidance Row */}
                            <div className="space-y-1.5">
                                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider font-mono">
                                    Guidance (Optional)
                                </label>
                                <input
                                    type="text"
                                    value={guidance}
                                    onChange={e => setGuidance(e.target.value)}
                                    placeholder="Specific focus areas or topics..."
                                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-2xs"
                                />
                            </div>

                            {/* Target Sources */}
                            <div className="space-y-1.5">
                                <div className="flex items-center justify-between">
                                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider font-mono">
                                        Sources (Defaults to all)
                                    </label>
                                    <button
                                        type="button"
                                        onClick={() => setSelectedContentTypes(['social_intelligence', 'youtube', 'steam_reviews', 'trustpilot_sentiment', 'website_analysis'])}
                                        className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 transition"
                                    >
                                        Select All
                                    </button>
                                </div>

                                <div className="flex flex-wrap gap-1.5">
                                    {sourceCategories.map(cat => {
                                        const Icon = cat.icon;
                                        const isSelected = selectedContentTypes.includes(cat.id);
                                        return (
                                            <button
                                                key={cat.id}
                                                type="button"
                                                onClick={() => {
                                                    if (isSelected) {
                                                        setSelectedContentTypes(selectedContentTypes.filter(t => t !== cat.id));
                                                    } else {
                                                        setSelectedContentTypes([...selectedContentTypes, cat.id]);
                                                    }
                                                }}
                                                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 border ${
                                                    isSelected 
                                                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs' 
                                                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                                                }`}
                                            >
                                                <Icon size={13} />
                                                <span>{cat.label}</span>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Search Action */}
                            <div className="flex justify-end pt-1">
                                <button
                                    onClick={onRunSearch}
                                    disabled={isFindingInsights || !prompt.trim()}
                                    className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-xs transition flex items-center gap-1.5"
                                >
                                    {isFindingInsights ? (
                                        <>
                                            <Loader2 size={14} className="animate-spin" />
                                            Searching...
                                        </>
                                    ) : (
                                        <>
                                            <Search size={14} />
                                            Search Insights
                                        </>
                                    )}
                                </button>
                            </div>

                            {/* Loading State */}
                            {isFindingInsights && (
                                <div className="text-center py-8 bg-slate-50 rounded-xl border border-slate-200">
                                    <Loader2 className="animate-spin h-6 w-6 text-indigo-600 mx-auto mb-2" />
                                    <p className="text-xs font-bold text-slate-700">Searching live sources...</p>
                                </div>
                            )}

                            {/* Results Section */}
                            {!isFindingInsights && foundInsights.length > 0 && (
                                <div className="space-y-4 pt-2">
                                    
                                    {/* Live Grounding Trace Banner */}
                                    {findInsightsModalState.groundingTrace && (
                                        <div className="bg-slate-900 text-slate-100 rounded-xl p-3 border border-slate-800 shadow-xs">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></span>
                                                    <span className="text-xs font-mono font-bold text-emerald-300">Live Google Search Grounding Stream Active</span>
                                                    <span className="text-[10px] text-slate-400 font-mono">
                                                        ({findInsightsModalState.groundingTrace.rawGroundedLinks?.length || 0} Web Sources Discovered)
                                                    </span>
                                                </div>
                                                <button
                                                    onClick={() => setShowGroundingTrace(!showGroundingTrace)}
                                                    className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-[11px] font-mono font-semibold transition"
                                                >
                                                    {showGroundingTrace ? 'Hide Raw Trace ▴' : 'View Grounding Trace ▾'}
                                                </button>
                                            </div>

                                            {showGroundingTrace && (
                                                <div className="mt-3 pt-3 border-t border-slate-800 space-y-3">
                                                    {findInsightsModalState.groundingTrace.searchQueries?.length > 0 && (
                                                        <div>
                                                            <div className="text-[10px] font-mono uppercase text-slate-400 font-bold mb-1">Search Queries Executed:</div>
                                                            <div className="flex flex-wrap gap-1.5">
                                                                {findInsightsModalState.groundingTrace.searchQueries.map((q: string, idx: number) => (
                                                                    <span key={idx} className="bg-slate-800 border border-slate-700 text-indigo-300 text-[10px] font-mono px-2 py-0.5 rounded">
                                                                        "{q}"
                                                                    </span>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}

                                                    {findInsightsModalState.groundingTrace.rawGroundedLinks?.length > 0 && (
                                                        <div>
                                                            <div className="text-[10px] font-mono uppercase text-slate-400 font-bold mb-1">Discovered Grounded Web Sources:</div>
                                                            <div className="max-h-36 overflow-y-auto space-y-1 pr-1 font-mono text-[11px]">
                                                                {findInsightsModalState.groundingTrace.rawGroundedLinks.map((chunk: any, idx: number) => (
                                                                    <a 
                                                                        key={idx} 
                                                                        href={chunk.uri} 
                                                                        target="_blank" 
                                                                        rel="noreferrer" 
                                                                        className="block text-emerald-400 hover:underline truncate bg-slate-950/60 p-1.5 rounded border border-slate-800/80"
                                                                    >
                                                                        🔗 {chunk.title || chunk.uri}
                                                                    </a>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}

                                                    {findInsightsModalState.groundingTrace.rawResponseText && (
                                                        <div>
                                                            <div className="text-[10px] font-mono uppercase text-slate-400 font-bold mb-1">Raw Generation Stream (JSON):</div>
                                                            <pre className="bg-slate-950 p-2.5 rounded text-[10px] font-mono text-slate-300 max-h-40 overflow-y-auto border border-slate-800 whitespace-pre-wrap">
                                                                {findInsightsModalState.groundingTrace.rawResponseText}
                                                            </pre>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* Results Filter Toolbar */}
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
                                        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
                                            <button
                                                onClick={() => setActiveResultFilter('all')}
                                                className={`px-3 py-1 rounded-lg text-xs font-bold transition whitespace-nowrap ${
                                                    activeResultFilter === 'all' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-200'
                                                }`}
                                            >
                                                All ({foundInsights.length})
                                            </button>
                                            <button
                                                onClick={() => setActiveResultFilter('reddit')}
                                                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition whitespace-nowrap ${
                                                    activeResultFilter === 'reddit' ? 'bg-orange-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-200'
                                                }`}
                                            >
                                                Reddit ({foundInsights.filter(i => i.type === 'reddit').length})
                                            </button>
                                            <button
                                                onClick={() => setActiveResultFilter('tiktok')}
                                                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition whitespace-nowrap ${
                                                    activeResultFilter === 'tiktok' ? 'bg-pink-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-200'
                                                }`}
                                            >
                                                TikTok ({foundInsights.filter(i => i.type === 'tiktok' || i.type === 'tiktok_hashtag').length})
                                            </button>
                                            <button
                                                onClick={() => setActiveResultFilter('youtube')}
                                                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition whitespace-nowrap ${
                                                    activeResultFilter === 'youtube' ? 'bg-rose-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-200'
                                                }`}
                                            >
                                                YouTube ({foundInsights.filter(i => i.type === 'youtube').length})
                                            </button>
                                            <button
                                                onClick={() => setActiveResultFilter('steam')}
                                                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition whitespace-nowrap ${
                                                    activeResultFilter === 'steam' ? 'bg-slate-800 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-200'
                                                }`}
                                            >
                                                Steam ({foundInsights.filter(i => i.type === 'steam').length})
                                            </button>
                                            <button
                                                onClick={() => setActiveResultFilter('trustpilot')}
                                                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition whitespace-nowrap ${
                                                    activeResultFilter === 'trustpilot' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-200'
                                                }`}
                                            >
                                                Trustpilot ({foundInsights.filter(i => i.type === 'trustpilot').length})
                                            </button>
                                            <button
                                                onClick={() => setActiveResultFilter('website')}
                                                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition whitespace-nowrap ${
                                                    activeResultFilter === 'website' ? 'bg-sky-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-200'
                                                }`}
                                            >
                                                Web ({foundInsights.filter(i => i.type === 'website' || i.type === 'grounded_search').length})
                                            </button>
                                        </div>

                                        <div className="flex items-center gap-2 shrink-0">
                                            <button
                                                onClick={handleSelectAllVisible}
                                                className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 transition"
                                            >
                                                Select All
                                            </button>
                                            <span className="text-slate-300">|</span>
                                            <button
                                                onClick={handleDeselectAll}
                                                className="text-[11px] font-bold text-slate-500 hover:text-slate-700 transition"
                                            >
                                                Clear
                                            </button>
                                        </div>
                                    </div>

                                    {/* Cards Grid */}
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        {filteredInsights.map((item, originalIdx) => {
                                            const isSelected = selectedItems.includes(originalIdx);
                                            const isAdded = addedIndices.has(originalIdx);

                                            const isReddit = item.type === 'reddit';
                                            const isTikTok = item.type === 'tiktok' || item.type === 'tiktok_hashtag';
                                            const isYoutube = item.type === 'youtube';
                                            const isSteam = item.type === 'steam';
                                            const isTrustpilot = item.type === 'trustpilot';

                                            const typeBadge = isReddit ? { label: 'Reddit', color: 'bg-orange-50 text-orange-700 border-orange-200', icon: MessageSquare }
                                                : isTikTok ? { label: 'TikTok', color: 'bg-pink-50 text-pink-700 border-pink-200', icon: Music }
                                                : isYoutube ? { label: 'YouTube', color: 'bg-rose-50 text-rose-700 border-rose-200', icon: Play }
                                                : isSteam ? { label: 'Steam', color: 'bg-slate-100 text-slate-700 border-slate-200', icon: FileText }
                                                : isTrustpilot ? { label: 'Trustpilot', color: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: Star }
                                                : { label: 'Web', color: 'bg-sky-50 text-sky-700 border-sky-200', icon: Globe };
                                            
                                            const BadgeIcon = typeBadge.icon;

                                            return (
                                                <div 
                                                    key={originalIdx} 
                                                    className={`p-3.5 rounded-xl border transition flex flex-col justify-between ${
                                                        isSelected 
                                                            ? 'bg-indigo-50/40 border-indigo-300 shadow-2xs' 
                                                            : 'bg-white border-slate-200 hover:border-slate-300'
                                                    }`}
                                                >
                                                    <div>
                                                        <div className="flex items-start justify-between gap-2 mb-1.5">
                                                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono border flex items-center gap-1 ${typeBadge.color}`}>
                                                                <BadgeIcon size={11} />
                                                                {typeBadge.label}
                                                            </span>

                                                            <input
                                                                type="checkbox"
                                                                checked={isSelected}
                                                                onChange={e => {
                                                                    if (e.target.checked) {
                                                                        setSelectedItems([...selectedItems, originalIdx]);
                                                                    } else {
                                                                        setSelectedItems(selectedItems.filter(i => i !== originalIdx));
                                                                    }
                                                                }}
                                                                className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer shrink-0"
                                                            />
                                                        </div>

                                                        <h4 className="font-bold text-xs text-slate-900 leading-snug line-clamp-2 mb-1">
                                                            {item.title}
                                                        </h4>

                                                        {item.url && item.url.startsWith('http') && (
                                                            <a href={item.url} target="_blank" rel="noopener noreferrer" className="text-[11px] text-slate-400 hover:text-indigo-600 font-mono truncate block mb-2" title={item.url}>
                                                                {item.url}
                                                            </a>
                                                        )}
                                                    </div>

                                                    <div className="pt-2 border-t border-slate-100 flex items-center justify-end">
                                                        <button
                                                            type="button"
                                                            onClick={() => handleQuickAdd(item, originalIdx)}
                                                            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition flex items-center gap-1 ${
                                                                isAdded 
                                                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                                                                    : 'bg-white hover:bg-indigo-50 text-indigo-600 border border-slate-200 hover:border-indigo-200'
                                                            }`}
                                                        >
                                                            {isAdded ? (
                                                                <>
                                                                    <CheckCircle2 size={11} className="text-emerald-600" />
                                                                    Added
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <Plus size={11} />
                                                                    Add
                                                                </>
                                                            )}
                                                        </button>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                        </>
                    )}

                    {/* TAB 3: DIRECT URL / QUERY */}
                    {modalMode === 'url' && (
                        <div className="space-y-4 animate-fadeIn">
                            
                            {/* Insight Type Selector */}
                            <div className="space-y-2">
                                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider font-mono">
                                    Analysis Type
                                </label>
                                <div className="space-y-2">
                                    {INSIGHT_TYPE_GROUPS.map((group, gIdx) => (
                                        <div key={gIdx} className="space-y-1">
                                            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">
                                                {group.group}
                                            </div>
                                            <div className="flex flex-wrap gap-1.5">
                                                {group.options.map(opt => {
                                                    const isSelected = selectedUrlType === opt.id;
                                                    const Icon = opt.icon;
                                                    return (
                                                        <button
                                                            key={opt.id}
                                                            type="button"
                                                            onClick={() => setSelectedUrlType(opt.id)}
                                                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 border ${
                                                                isSelected 
                                                                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs' 
                                                                    : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200'
                                                            }`}
                                                        >
                                                            <Icon size={13} />
                                                            <span>{opt.label}</span>
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* URL / ID Input Form */}
                            <div className="space-y-3 pt-2">
                                <div className="space-y-1.5">
                                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider font-mono">
                                        URL or Target Query
                                    </label>
                                    <input
                                        type="text"
                                        value={urlInput}
                                        onChange={e => setUrlInput(e.target.value)}
                                        placeholder={activeOption.placeholder}
                                        className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-2xs"
                                    />
                                </div>

                                {/* Secondary URL for Comparative */}
                                {activeOption.isComparative && (
                                    <div className="space-y-1.5">
                                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider font-mono">
                                            Secondary Video URL
                                        </label>
                                        <input
                                            type="text"
                                            value={secondaryUrlInput}
                                            onChange={e => setSecondaryUrlInput(e.target.value)}
                                            placeholder="Secondary Video URL: https://www.youtube.com/watch?v=..."
                                            className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-2xs"
                                        />
                                    </div>
                                )}

                                {/* Optional Custom Title & Focus */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <div className="space-y-1">
                                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider font-mono">
                                            Custom Label (Optional)
                                        </label>
                                        <input
                                            type="text"
                                            value={customTitle}
                                            onChange={e => setCustomTitle(e.target.value)}
                                            placeholder="e.g. Official Gameplay Trailer"
                                            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-2xs"
                                        />
                                    </div>

                                    <div className="space-y-1">
                                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider font-mono">
                                            Focus Area (Optional)
                                        </label>
                                        <input
                                            type="text"
                                            value={customFocus}
                                            onChange={e => setCustomFocus(e.target.value)}
                                            placeholder="e.g. Passing physics, pack odds"
                                            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-2xs"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Modal Footer */}
                <div className="px-6 py-3.5 border-t border-slate-150 bg-slate-50 flex items-center justify-between">
                    <div className="text-xs text-slate-500 font-mono">
                        {modalMode === 'tracker' && topicTag.trim() && (
                            <span>Target: <strong className="text-slate-800">{topicTag.startsWith('#') ? topicTag : '#' + topicTag}</strong></span>
                        )}
                        {modalMode === 'search' && selectedItems.length > 0 && (
                            <span>{selectedItems.length} selected</span>
                        )}
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setIsOpen(false)}
                            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl transition shadow-xs"
                        >
                            Cancel
                        </button>

                        {false && modalMode === ('tracker' as any) && (
                            <button
                                type="button"
                                onClick={handleCreateTracker}
                                disabled={!topicTag.trim()}
                                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-xs transition flex items-center gap-1.5"
                            >
                                <Plus size={14} />
                                Add Tracker to Table
                            </button>
                        )}
                        
                        {modalMode === 'search' && foundInsights.length > 0 && (
                            <button
                                onClick={() => {
                                    triggerAddSelectedInsights(selectedItems.map(idx => ({ ...foundInsights[idx], guidance })));
                                    setIsOpen(false);
                                }}
                                disabled={selectedItems.length === 0}
                                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-xs transition flex items-center gap-1.5"
                            >
                                <Plus size={14} />
                                Add Selected ({selectedItems.length})
                            </button>
                        )}

                        {modalMode === 'url' && (
                            <>
                                <button
                                    type="button"
                                    onClick={() => handleAddDirectUrl(false)}
                                    className="px-3.5 py-2 bg-white hover:bg-indigo-50 text-indigo-600 hover:text-indigo-700 border border-indigo-200 rounded-xl text-xs font-bold shadow-xs transition flex items-center gap-1.5"
                                >
                                    <Plus size={14} />
                                    Add to Table
                                </button>
                                <button
                                    type="button"
                                    onClick={() => handleAddDirectUrl(true)}
                                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-xs transition flex items-center gap-1.5"
                                >
                                    <Check size={14} />
                                    Add & Close
                                </button>
                            </>
                        )}
                    </div>
                </div>

            </div>
        </div>
    );
};

export const RunwayAnalysis: React.FC<{ showBulk?: boolean; initialTab?: 'home' | 'listen' | 'filter' | 'ad_opportunities' | 'summarize' | 'insights' | 'bulk' | 'alerts' | 'daily_summary' | 'audit' }> = ({ showBulk = false, initialTab }) => {
    const { config } = useAppConfig();
    const themeColors = config?.branding.colors || brandConfig.colors;
    const AD_VIDEOS = config?.adAnalysisVideos || [];
    const [selectedVideoId, setSelectedVideoId] = useState(AD_VIDEOS[0]?.id || '');
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);

    useEffect(() => {
        if (AD_VIDEOS.length > 0 && !AD_VIDEOS.find(v => v.id === selectedVideoId)) {
            setSelectedVideoId(AD_VIDEOS[0].id);
        }
    }, [AD_VIDEOS]);
    const [activeTab, setActiveTab] = useState<'analysis' | 'competitive'>('analysis');
    const [activeMainTab, setActiveMainTab] = useState<'home' | 'listen' | 'filter' | 'topic_graph' | 'topic_trajectory' | 'ad_opportunities' | 'summarize'>(
        initialTab === 'listen' ? 'filter' : 
        initialTab === 'filter' ? 'filter' : 
        initialTab === 'topic_graph' ? 'topic_graph' : 
        initialTab === 'topic_trajectory' ? 'topic_trajectory' : 
        initialTab === 'ad_opportunities' ? 'ad_opportunities' : 
        initialTab === 'summarize' ? 'summarize' : 'home'
    );
    const [selectedFilterTopic, setSelectedFilterTopic] = useState<string | null>(null);
    const [summarizeTab, setSummarizeTab] = useState<'alerts' | 'audit'>('alerts');
    const [bothAnalyzed, setBothAnalyzed] = useState(false);
    const { name: companyName } = useCompanyContext();
    const [activeAnalysisId, setActiveAnalysisId] = useState<string | null>(null);
    const [analysisError, setAnalysisError] = useState<string | null>(null);
    const [activeVideos, setActiveVideos] = useState<string[]>([]);
    const [bulkAnalysis, setBulkAnalysis] = useState<any>(null);
    const [isBulkAnalyzing, setIsBulkAnalyzing] = useState(false);
    const [videoTitles, setVideoTitles] = useState<{[key: string]: string}>({});
    const [rows, setRows] = useState<any[]>([]);
    const [, setDummyRender] = useState({});
    const [isLoadingTable, setIsLoadingTable] = useState(true);





    useEffect(() => {
        const handleUpdate = () => setDummyRender({});
        window.addEventListener('find-insights-modal-update', handleUpdate);

        const handleSwitchTab = (e: any) => {
            if (e.detail && ['insights', 'bulk', 'alerts', 'daily_summary', 'audit'].includes(e.detail)) {
                setActiveMainTab(e.detail);
            }
        };
        window.addEventListener('switch-main-tab', handleSwitchTab);
        
        const handleAdd = (e: Event) => {
            const selected = (e as CustomEvent).detail;
            if (!selected || !Array.isArray(selected) || selected.length === 0) return;
            
            const newRows: any[] = [];
            
            selected.forEach((item: any) => {
                let rowType = item.type || 'abcd';
                if (item.type === 'reddit' || item.subType === 'reddit') {
                    rowType = 'reddit';
                } else if (item.type === 'tiktok' || item.subType === 'tiktok' || item.type === 'tiktok_hashtag') {
                    rowType = 'tiktok';
                } else if (item.type === 'social_intelligence' || item.subType === 'social_intelligence') {
                    rowType = 'social_intelligence';
                } else if (item.type === 'steam' || item.subType === 'steam_reviews') {
                    rowType = 'steam_reviews';
                } else if (item.type === 'trustpilot' || item.subType === 'trustpilot_sentiment') {
                    rowType = 'trustpilot_sentiment';
                } else if (item.type === 'website' || item.subType === 'website_analysis') {
                    rowType = 'website_analysis';
                } else if (item.type === 'grounded_search' || item.subType === 'grounded_search') {
                    rowType = 'grounded_search';
                } else if (item.type === 'youtube') {
                    rowType = item.subType || 'youtube_sentiment';
                } else if (item.type === 'youtube_sentiment' || item.subType === 'youtube_sentiment') {
                    rowType = 'youtube_sentiment';
                }

                const rawUrl = item.url || item.tag || item.query || item.id || '';

                newRows.push({
                    id: item.id || `${rowType}-${Math.random().toString(36).substring(2, 9)}`,
                    type: rowType,
                    url: rawUrl,
                    tag: item.tag || (rowType === 'social_intelligence' ? rawUrl : undefined),
                    query: item.query || (rowType === 'social_intelligence' ? rawUrl : undefined),
                    title: item.title || (rowType === 'social_intelligence' ? `${rawUrl} Social & Community Pulse` : `Insight for ${companyName}`),
                    timeframe: item.timeframe || '7d',
                    focus: item.focus || item.guidance || undefined,
                    guidance: item.guidance || undefined,
                    status: 'pending',
                    videos: item.videos || [rawUrl]
                });
            });
            
            setRows(prev => {
                const updated = [...newRows, ...prev];
                const trimmedRows = updated.map(row => ({
                    ...row,
                    videos: row.videos.map((url: string) => getVideoId(url))
                }));
                fetch('/api/insights/table', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ companyName, data: trimmedRows })
                }).catch(err => console.error("Failed to auto-save table after adding insights:", err));
                
                return updated;
            });
        };
        window.addEventListener('add-selected-insights', handleAdd);
        
        return () => {
            window.removeEventListener('find-insights-modal-update', handleUpdate);
            window.removeEventListener('switch-main-tab', handleSwitchTab);
            window.removeEventListener('add-selected-insights', handleAdd);
        };
    }, []);



    useEffect(() => {
        const fetchTableData = async () => {
            setIsLoadingTable(true);
            try {
                const defaultListeningRows = [
                    {
                        id: 'init-yt-1',
                        type: 'youtube_sentiment',
                        videos: ['https://www.youtube.com/watch?v=GBq8fcpBOTU'],
                        status: 'pending',
                        analysisId: null
                    },
                    {
                        id: 'init-steam-1',
                        type: 'steam_reviews',
                        videos: ['2669320'],
                        status: 'pending',
                        analysisId: null
                    },
                    {
                        id: 'init-steam-2',
                        type: 'steam_reviews',
                        videos: ['3405690'],
                        status: 'pending',
                        analysisId: null
                    },
                    {
                        id: 'init-reddit-1',
                        type: 'reddit',
                        videos: ['r/EASportsFC FC 26 gameplay and evolutions feedback'],
                        status: 'pending',
                        analysisId: null
                    },
                    {
                        id: 'init-reddit-2',
                        type: 'reddit',
                        videos: ['r/EASportsFC PC DirectX 12 anti cheat crash feedback'],
                        status: 'pending',
                        analysisId: null
                    }
                ];

                const res = await fetch(`/api/insights/table?companyName=${encodeURIComponent(companyName)}`);
                if (res.ok) {
                    const data = await res.json();
                    if (Array.isArray(data) && data.length > 0) {
                        // Merge in any missing default Reddit threads or sources so all ingested threads are visible
                        const existingTargets = new Set(data.flatMap((r: any) => (r.videos || []).map((v: string) => v.toLowerCase().trim())));
                        const missingRows = defaultListeningRows.filter(defRow => 
                            !defRow.videos.some(v => existingTargets.has(v.toLowerCase().trim()))
                        );
                        setRows([...data, ...missingRows]);
                    } else {
                        // Initialize default multi-channel listening sources (YouTube, Steam, Reddit)
                        setRows(defaultListeningRows);
                    }
                }
            } catch (error) {
                console.error("Failed to fetch table data:", error);
            } finally {
                setIsLoadingTable(false);
            }
        };
        fetchTableData();
    }, [companyName]);

    useEffect(() => {
        rows.forEach(row => {
            row.videos.forEach((vid: string) => {
                const id = getVideoId(vid);
                if (id) fetchVideoTitle(id, row.type);
            });
        });
    }, [rows]);

    const getVideoId = (url: string) => {
        if (!url) return '';
        const match = url.match(/(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:[^\/\n\s]+\/\S+\/|(?:v|e(?:mbed)?)\/|\S*?[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
        return match ? match[1] : url;
    };

    const getWordCloud = (data: any) => {
        if (data.word_cloud && Array.isArray(data.word_cloud) && data.word_cloud.length > 0) {
            return data.word_cloud;
        }
        
        // Dynamic extraction fallback
        const words = new Set<string>();
        const addText = (text?: string) => {
            if (!text) return;
            const parts = text.toLowerCase()
                .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?"']/g, " ")
                .split(/\s+/);
            parts.forEach(w => {
                if (w.length > 4 && !['about', 'their', 'there', 'would', 'could', 'should', 'these', 'which', 'other', 'under', 'using', 'first', 'shown', 'video', 'brand', 'theme', 'point', 'music', 'character', 'product', 'people', 'focused', 'highlights'].includes(w)) {
                    words.add(w.charAt(0).toUpperCase() + w.slice(1));
                }
            });
        };

        addText(data.summary);
        data.products?.forEach((p: any) => { addText(p.name); addText(p.description); });
        data.themes?.forEach((t: any) => { addText(t.name); addText(t.description); });
        data.characters?.forEach((c: any) => { addText(c.name); addText(c.role_description); });
        data.music?.forEach((m: any) => { addText(m.description); addText(m.vibe); });
        data.talking_points?.forEach((tp: any) => { addText(tp.point); addText(tp.speaker); });

        const list = Array.from(words).slice(0, 20);
        return list.length > 0 ? list : ['Aesthetics', 'Product', 'Brand', 'Campaign', 'Video', 'Soundtrack', 'Narrative'];
    };

    const fetchVideoTitle = async (videoId: string, type?: string) => {
        if (!videoId || videoTitles[videoId]) return;
        
        if (type === 'grounded_search') {
            const trimmedQuery = videoId.length > 30 ? videoId.substring(0, 30) + '...' : videoId;
            setVideoTitles(prev => ({ ...prev, [videoId]: { title: `Grounded Search: ${trimmedQuery}`, image: null } }));
            return;
        }

        if (type === 'reddit') {
            const clean = videoId.replace(/^#/, '').replace(/^r\//, '').trim();
            const displayTitle = clean ? `Reddit: r/${clean}` : `Reddit Community Discussions`;
            setVideoTitles(prev => ({ 
                ...prev, 
                [videoId]: { 
                    title: displayTitle, 
                    image: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=500&auto=format&fit=crop&q=60' 
                } 
            }));
            return;
        }

        if (type === 'tiktok' || type === 'tiktok_hashtag') {
            const clean = videoId.replace(/^#/, '').trim();
            const displayTitle = clean ? `TikTok: #${clean}` : `TikTok Trends`;
            setVideoTitles(prev => ({ 
                ...prev, 
                [videoId]: { 
                    title: displayTitle, 
                    image: 'https://images.unsplash.com/photo-1611162616475-46b635cb6868?w=500&auto=format&fit=crop&q=60' 
                } 
            }));
            return;
        }

        if (type === 'social_intelligence' || type === 'social_feed') {
            const clean = videoId.replace(/^#/, '').trim();
            const displayTitle = clean ? `Social Pulse: #${clean}` : `Social & Community Intelligence`;
            setVideoTitles(prev => ({ 
                ...prev, 
                [videoId]: { 
                    title: displayTitle, 
                    image: 'https://images.unsplash.com/photo-1611162616475-46b635cb6868?w=500&auto=format&fit=crop&q=60' 
                } 
            }));
            return;
        }

        if (type === 'trustpilot_sentiment' || videoId.includes('trustpilot.com')) {
            const cleanDomain = videoId.replace(/^https?:\/\//i, '').replace(/^www\./i, '').replace(/trustpilot\.com\/review\//i, '').split('/')[0].split('?')[0];
            const cleanName = cleanDomain.split('.')[0].charAt(0).toUpperCase() + cleanDomain.split('.')[0].slice(1);
            setVideoTitles(prev => ({
                ...prev,
                [videoId]: {
                    title: `Trustpilot: ${cleanName} (${cleanDomain})`,
                    image: 'https://cdn.trustpilot.net/brand-assets/4.3.0/favicons/apple-touch-icon.png'
                }
            }));
            return;
        }
        
        if (videoId.startsWith('http')) {
            try {
                const parsed = new URL(videoId);
                const host = parsed.hostname.replace(/^www\./, '');
                const pathSlug = parsed.pathname.split('/').filter(Boolean).pop() || '';
                const cleanSlug = pathSlug.replace(/[-_]/g, ' ').replace(/\.[^/.]+$/, '').trim();
                const displayTitle = cleanSlug 
                    ? `${host.split('.')[0].toUpperCase()}: ${cleanSlug.charAt(0).toUpperCase() + cleanSlug.slice(1)}`
                    : `Web Source: ${host}`;
                setVideoTitles(prev => ({
                    ...prev,
                    [videoId]: {
                        title: displayTitle,
                        image: "/images/website_placeholder.png"
                    }
                }));
            } catch {
                setVideoTitles(prev => ({
                    ...prev,
                    [videoId]: {
                        title: videoId,
                        image: "/images/website_placeholder.png"
                    }
                }));
            }
            return;
        }
        
        // If it's purely numeric, assume it's a Steam App ID
        if (/^\d+$/.test(videoId)) {
            setVideoTitles(prev => ({
                ...prev,
                [videoId]: {
                    title: `Steam App #${videoId}`,
                    image: `https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/${videoId}/header.jpg`
                }
            }));
            return; // Do not fall through to YouTube for numeric IDs
        }

        try {
            const res = await fetch(`https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`);
            if (res.ok) {
                const data = await res.json();
                setVideoTitles(prev => ({ ...prev, [videoId]: { title: data.title, image: data.thumbnail_url } }));
            }
        } catch (error) {
            console.warn(`Failed to fetch title for ${videoId}:`, error);
        }
    };

    useEffect(() => {
        if (activeAnalysisId) {
            setAnalysis(null);
            setAnalysisError(null);
            const loadAnalysis = async () => {
                try {
                    const res = await fetch(`/api/insights/analysis?companyName=${encodeURIComponent(companyName)}&analysisId=${activeAnalysisId}`);
                    if (res.ok) {
                        const data = await res.json();
                        setAnalysis(data);
                        if (data.type === 'comparative') {
                            setCompAnalysis(data);
                            setActiveTab('competitive');
                        }
                    } else {
                        setAnalysisError("Failed to load analysis results from GCS.");
                    }
                } catch (error) {
                    console.error("Failed to load analysis from GCS:", error);
                    setAnalysisError("Error connecting to GCS to load analysis.");
                }
            };
            loadAnalysis();
        }
    }, [activeAnalysisId, companyName]);



    const [compAnalysis, setCompAnalysis] = useState<any>(null);
    const [isCompAnalyzing, setIsCompAnalyzing] = useState(false);

    const compAnalysisRef = useRef(compAnalysis);
    useEffect(() => {
        compAnalysisRef.current = compAnalysis;
    }, [compAnalysis]);

    // Load analysis from GCS when videos change
    useEffect(() => {
        if (activeTab === 'competitive' && activeVideos.length >= 2 && !isCompAnalyzing && !activeAnalysisId) {
            const id1 = getVideoId(activeVideos[0]);
            const id2 = getVideoId(activeVideos[1]);
            
            // Skip fetch if we already have the correct analysis in state
            const currentComp = compAnalysisRef.current;
            if (currentComp && currentComp.ad1Id === id1 && currentComp.ad2Id === id2) {
                return;
            }
            
            const analysisId = `competitive_analysis_${id1}_${id2}`;
            
            const loadAnalysis = async () => {
                try {
                    const res = await fetch(`/api/insights/analysis?companyName=${encodeURIComponent(companyName)}&analysisId=${analysisId}`);
                    if (res.ok) {
                        const data = await res.json();
                        setCompAnalysis(data);
                    } else {
                        setCompAnalysis(null); // Clear if not found
                    }
                } catch (error) {
                    console.warn("No saved competitive analysis found in GCS.");
                    setCompAnalysis(null);
                }
            };
            loadAnalysis();
        }
    }, [activeVideos, activeTab, companyName, isCompAnalyzing, activeAnalysisId]);

    const handleCompetitiveAnalysis = async () => {
        if (activeVideos.length < 2) {
            alert("Please select at least 2 videos to compare.");
            return;
        }
        setIsCompAnalyzing(true);
        setCompAnalysis(null); // Clear current view to show it's loading/new

        const id1 = getVideoId(activeVideos[0]);
        const id2 = getVideoId(activeVideos[1]);
        const analysisId = `competitive_analysis_${id1}_${id2}`;

        try {
            // Clear old run in GCS first
            await fetch('/api/insights/analysis', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    companyName,
                    analysisId,
                    result: {} // Clear it
                })
            });

            let res1 = await fetch(`/api/load-run/ad_analysis_${id1}?companyName=${encodeURIComponent(companyName)}`);
            if (!res1.ok) {
                res1 = await fetch(`/api/insights/analysis?companyName=${encodeURIComponent(companyName)}&analysisId=ad_analysis_${id1}`);
            }
            let res2 = await fetch(`/api/load-run/ad_analysis_${id2}?companyName=${encodeURIComponent(companyName)}`);
            if (!res2.ok) {
                res2 = await fetch(`/api/insights/analysis?companyName=${encodeURIComponent(companyName)}&analysisId=ad_analysis_${id2}`);
            }
            
            if (res1.ok && res2.ok) {
                const data1 = await res1.json();
                const data2 = await res2.json();
                const result = await generateCompetitiveAnalysis(data1, data2, companyName);
                setCompAnalysis({ ...result, ad1Id: id1, ad2Id: id2 });
                
                // Save to GCS
                await fetch('/api/insights/analysis', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        companyName,
                        analysisId,
                        result: result
                    })
                });
            } else {
                alert("Both ads must be analyzed first.");
            }
        } catch (error) {
            console.error("Competitive analysis failed:", error);
            alert("Failed to generate competitive analysis.");
        } finally {
            setIsCompAnalyzing(false);
        }
    };

    const handleSaveConfig = async () => {
        if (!analysisType) return;
        setIsSavingConfig(true);
        try {
            const response = await fetch('/api/save-gcs', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    companyName,
                    config: { analysisType }
                })
            });
            if (response.ok) {
                alert("Configuration saved to GCS successfully!");
            } else {
                alert("Failed to save configuration to GCS.");
            }
        } catch (error) {
            console.error("Error saving config to GCS:", error);
            alert("Error saving configuration to GCS.");
        } finally {
            setIsSavingConfig(false);
        }
    };

    const isCurrentSocial = Boolean(
        analysis?.type === 'social_intelligence' || 
        analysis?.type === 'social_feed' || 
        analysis?.type === 'reddit' || 
        analysis?.type === 'tiktok' || 
        analysis?.type === 'tiktok_hashtag' || 
        analysis?.type === 'social_pulse' ||
        selectedVideoId?.startsWith('#') ||
        selectedVideoId?.startsWith('social_') ||
        selectedVideoId?.includes('r/') ||
        selectedVideoId?.includes('reddit') ||
        rows.some(r => (r.analysisId === activeAnalysisId || r.videos.includes(selectedVideoId)) && ['social_intelligence', 'social_feed', 'reddit', 'tiktok', 'tiktok_hashtag'].includes(r.type))
    );

    const isCurrentReddit = Boolean(
        analysis?.type === 'reddit' ||
        selectedVideoId?.startsWith('reddit_') ||
        selectedVideoId?.includes('reddit.com') ||
        selectedVideoId?.includes('r/') ||
        rows.some(r => (r.analysisId === activeAnalysisId || r.videos.includes(selectedVideoId)) && r.type === 'reddit')
    );

    const isCurrentSteam = Boolean(
        analysis?.type === 'steam_reviews' || 
        analysis?.type === 'steam' || 
        selectedVideoId?.startsWith('steam_') ||
        (/^\d+$/.test(selectedVideoId || '') && (selectedVideoId || '').length >= 4) ||
        rows.some(r => (r.analysisId === activeAnalysisId || r.videos.includes(selectedVideoId)) && (r.type === 'steam_reviews' || r.type === 'steam'))
    );

    const isCurrentTrustpilot = Boolean(
        analysis?.type === 'trustpilot_sentiment' ||
        selectedVideoId?.startsWith('trustpilot_') ||
        selectedVideoId?.includes('trustpilot.com') ||
        rows.some(r => (r.analysisId === activeAnalysisId || r.videos.includes(selectedVideoId)) && r.type === 'trustpilot_sentiment')
    );

    const isCurrentWebsite = Boolean(
        analysis?.type === 'website_analysis' ||
        analysis?.type === 'website' ||
        selectedVideoId?.startsWith('http') ||
        selectedVideoId?.startsWith('www.') ||
        rows.some(r => (r.analysisId === activeAnalysisId || r.videos.includes(selectedVideoId)) && (r.type === 'website_analysis' || r.type === 'website'))
    );

    const isCurrentGroundedSearch = Boolean(
        analysis?.type === 'grounded_search' ||
        rows.some(r => (r.analysisId === activeAnalysisId || r.videos.includes(selectedVideoId)) && r.type === 'grounded_search')
    );

    const selectedVideo = AD_VIDEOS.find(v => v.id === selectedVideoId) || { 
        id: selectedVideoId, 
        title: typeof videoTitles[selectedVideoId] === 'object' ? (videoTitles[selectedVideoId] as any).title : (videoTitles[selectedVideoId] || (isCurrentReddit ? `Reddit: ${selectedVideoId}` : isCurrentSocial ? `Social Pulse: ${selectedVideoId}` : isCurrentSteam ? `Steam App ${selectedVideoId}` : 'Analysis')), 
        url: `https://www.youtube.com/watch?v=${selectedVideoId}`, 
        description: isCurrentReddit ? 'Reddit community sentiment & player discussions.' : isCurrentSocial ? 'Multi-channel social listening and sentiment analysis.' : isCurrentSteam ? 'Steam Store player reviews & sentiment intelligence.' : '' 
    };

    const handleAnalyze = async () => {
        setIsAnalyzing(true);
        const cleanVideoId = getVideoId(selectedVideoId) || selectedVideoId;
        console.log(`[INSIGHTS PAGE] Analyzing video ID: ${cleanVideoId}, URL: ${selectedVideo.url}, Company: ${companyName}`);
        try {
            const result = await analyzeAdVideo(selectedVideo.url, companyName);
            console.log(`[INSIGHTS PAGE] Analysis result received from Gemini:`, result);
            if (result) {
                setAnalysis(result);
                console.log(`[INSIGHTS PAGE] Sending POST /api/save-run for featureId ad_analysis_${cleanVideoId}...`);
                const saveRes = await fetch('/api/save-run', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        companyName,
                        featureId: `ad_analysis_${cleanVideoId}`,
                        data: { ...result, videoId: cleanVideoId }
                    })
                });
                const saveJson = await saveRes.json();
                console.log(`[INSIGHTS PAGE] GCS save response from server:`, saveJson);
            }
        } catch (error) {
            console.error("Analysis failed:", error);
            alert("Analysis failed. Please try again.");
        } finally {
            setIsAnalyzing(false);
        }
    };

    const handleLoadLast = async () => {
        try {
            const cleanVideoId = getVideoId(selectedVideoId) || selectedVideoId;
            console.log(`[INSIGHTS PAGE] Loading last analysis from GCS for featureId ad_analysis_${cleanVideoId}...`);
            let res = await fetch(`/api/load-run/ad_analysis_${cleanVideoId}?companyName=${encodeURIComponent(companyName)}`);
            if (!res.ok) {
                res = await fetch(`/api/insights/analysis?companyName=${encodeURIComponent(companyName)}&analysisId=ad_analysis_${cleanVideoId}`);
            }
            if (!res.ok) {
                const errJson = await res.json().catch(() => ({}));
                throw new Error(errJson.error || "No saved run found in GCS for this video");
            }
            const data = await res.json();
            console.log(`[INSIGHTS PAGE] Successfully loaded analysis from GCS:`, data);
            setAnalysis(data);
        } catch (error: any) {
            console.warn("[INSIGHTS PAGE] Load last error:", error);
            alert(error.message || "No previous analysis found in GCS.");
        }
    };

    const handleRunBulkAnalysis = async () => {
        setIsBulkAnalyzing(true);
        try {
            let analyses: any[] = [];
            try {
                const res = await fetch(`/api/insights/analyses-all?companyName=${encodeURIComponent(companyName)}`);
                if (res.ok) {
                    const contentType = res.headers.get("content-type");
                    if (contentType && contentType.includes("application/json")) {
                        analyses = await res.json();
                    }
                }
            } catch (fetchErr) {
                console.warn("Fetch analyses-all failed:", fetchErr);
            }

            // Always merge in active table rows (specifically Trustpilot, Steam, and custom insights)
            const activeTableRows = rows.filter(r => r.status === 'completed' || r.analysis || r.result || r.type === 'trustpilot_sentiment' || r.analysisId);
            activeTableRows.forEach(r => {
                const existingIdx = analyses.findIndex(a => a._analysisId === r.analysisId || a._analysisId === r.id || (a.videos && a.videos[0] === (r.videos && r.videos[0])));
                const rowPayload = {
                    videos: r.videos || [r.url || r.id],
                    title: r.title || (r.type === 'trustpilot_sentiment' ? `${companyName} Verified Trustpilot Reviews` : r.type),
                    type: r.type,
                    analysis: r.analysis || r.result || (r.type === 'trustpilot_sentiment' ? { source: 'Trustpilot', summary: `Verified Trustpilot customer reviews and ratings for ${companyName}` } : undefined),
                    _analysisId: r.analysisId || r.id
                };
                if (existingIdx >= 0) {
                    analyses[existingIdx] = { ...analyses[existingIdx], ...rowPayload };
                } else {
                    analyses.push(rowPayload);
                }
            });

            if (!analyses || analyses.length === 0) {
                // If completely empty, seed from current rows or default context
                analyses = rows.length > 0 ? rows.map(r => ({
                    videos: r.videos || [r.url || r.id],
                    title: r.title || (r.type === 'trustpilot_sentiment' ? `${companyName} Trustpilot Reviews` : r.type),
                    type: r.type,
                    _analysisId: r.analysisId || r.id
                })) : [
                    { title: `${companyName} Verified Trustpilot Reviews`, type: 'trustpilot_sentiment', videos: ['https://www.trustpilot.com/review/bathandbodyworks.com'] }
                ];
            }

            // Fallback matching: Inject videos if missing by matching _analysisId with rows
            const enrichedAnalyses = analyses.map((a: any) => {
                if (!a.videos && a._analysisId) {
                    const row = rows.find(r => r.analysisId === a._analysisId || r.id === a._analysisId);
                    if (row) {
                        return { ...a, videos: row.videos };
                    }
                }
                return a;
            });

            const result = await generateBulkAnalysis(enrichedAnalyses, companyName, config?.branding.industryType);
            if (result) {
                setBulkAnalysis(result);

                // Save to GCS & local storage
                await fetch('/api/insights/analysis', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        companyName,
                        analysisId: 'bulk_analysis',
                        result: { ...result, type: 'bulk' }
                    })
                }).catch(saveErr => console.warn("Failed to persist bulk analysis:", saveErr));
            }
        } catch (error) {
            console.error("Bulk analysis failed:", error);
        } finally {
            setIsBulkAnalyzing(false);
        }
    };

    useEffect(() => {
        if (activeMainTab === 'summarize') {
            const checkSavedBulk = async () => {
                try {
                    const res = await fetch(`/api/insights/analysis?companyName=${encodeURIComponent(companyName)}&analysisId=bulk_analysis`);
                    if (res.ok) {
                        const data = await res.json();
                        setBulkAnalysis(data);
                    }
                } catch (error) {
                    console.warn("No saved bulk analysis found:", error);
                }
            };
            checkSavedBulk();
        }
    }, [activeMainTab, companyName]);

    return (
        <div className="app-container flex flex-col">
            <div className="page-header">
                <div className="max-w-7xl mx-auto px-6 w-full">
                    <div className="flex items-center justify-between w-full">
                        <div className="flex items-center gap-3">
                            <Eye className="text-[#339DD4]" size={24} />
                            <h1 className="page-title">Insights</h1>
                        </div>
                    </div>
                    
                    <div className="tab-scroll-container mt-4">
                        <button
                            onClick={() => {
                                setSelectedFilterTopic(null);
                                setActiveMainTab('home');
                            }}
                            className={`tab-button ${activeMainTab === 'home' ? 'active' : 'inactive'}`}
                        >
                            <LayoutDashboard size={18} /> Home
                        </button>
                        <button
                            onClick={() => setActiveMainTab('filter')}
                            className={`tab-button ${activeMainTab === 'filter' || activeMainTab === 'listen' ? 'active' : 'inactive'}`}
                        >
                            <Filter size={18} /> Filter Pipeline
                        </button>
                        <button
                            onClick={() => setActiveMainTab('topic_graph')}
                            className={`tab-button ${activeMainTab === 'topic_graph' ? 'active' : 'inactive'}`}
                        >
                            <Share2 size={18} /> Topic Graph
                        </button>
                        <button
                            onClick={() => setActiveMainTab('topic_trajectory')}
                            className={`tab-button ${activeMainTab === 'topic_trajectory' ? 'active' : 'inactive'}`}
                        >
                            <TrendingUp size={18} /> Topic Trajectory
                        </button>
                        <button
                            onClick={() => setActiveMainTab('ad_opportunities')}
                            className={`tab-button ${activeMainTab === 'ad_opportunities' ? 'active' : 'inactive'}`}
                        >
                            <DollarSign size={18} /> Ad Opportunities
                        </button>
                        <button
                            onClick={() => setActiveMainTab('summarize')}
                            className={`tab-button ${activeMainTab === 'summarize' ? 'active' : 'inactive'}`}
                        >
                            <FileText size={18} /> Summarize
                        </button>
                    </div>
                </div>
            </div>
            <div className="flex-1">
                {activeAnalysisId ? (
                    <>
            <div className="page-header">
                <div className="max-w-7xl mx-auto px-6 w-full">
                    <div className="flex justify-between items-center mb-4">
                        <div className="flex items-center gap-3">
                            <Eye className="text-[#339DD4]" size={24} />
                            <h1 className="page-title">
                                {isCurrentReddit || analysis?.type === 'reddit'
                                    ? 'Reddit Community Sentiment Analysis'
                                    : isCurrentSocial || analysis?.type === 'social_intelligence' || analysis?.type === 'tiktok_hashtag' || analysis?.type === 'social_feed' || analysis?.type === 'tiktok'
                                    ? 'Social Pulse' 
                                    : isCurrentSteam || analysis?.type === 'steam_reviews' 
                                    ? 'Steam Community Review Analysis'
                                    : isCurrentTrustpilot || analysis?.type === 'trustpilot_sentiment'
                                    ? 'Trustpilot Retail Review Analysis'
                                    : analysis?.type === 'website_analysis'
                                    ? 'Website Analysis'
                                    : analysis?.type === 'grounded_search'
                                    ? 'Grounded Search'
                                    : 'Creative Video Analysis'}
                            </h1>
                        </div>
                        <div className="flex gap-4">
                            {activeAnalysisId ? (
                                <button 
                                    onClick={() => setActiveAnalysisId(null)} 
                                    className="px-4 py-2 font-bold rounded-lg transition-all bg-white/10 text-slate-300 hover:bg-white/15 border border-white/10"
                                >
                                    Back to Table
                                </button>
                            ) : (
                                <>
                                    <button 
                                        onClick={() => setActiveTab('analysis')} 
                                        className={`px-4 py-2 font-bold rounded-lg transition-all ${activeTab === 'analysis' ? 'bg-[#0077C8] text-white shadow-md' : 'bg-white/10 text-slate-300 hover:bg-white/15 border border-white/10'}`}
                                    >
                                        {isCurrentReddit || analysis?.type === 'reddit'
                                            ? 'Reddit Analysis'
                                            : isCurrentSocial || analysis?.type === 'social_intelligence' || analysis?.type === 'tiktok_hashtag' || analysis?.type === 'social_feed' || analysis?.type === 'tiktok'
                                            ? 'Social Pulse' 
                                            : isCurrentSteam || analysis?.type === 'steam_reviews' 
                                            ? 'Steam Review Analysis'
                                            : isCurrentTrustpilot || analysis?.type === 'trustpilot_sentiment'
                                            ? 'Trustpilot Review Analysis'
                                            : 'Creative Analysis'}
                                    </button>
                                    <button 
                                        onClick={() => setActiveTab('competitive')} 
                                        className={`px-4 py-2 font-bold rounded-lg transition-all ${activeTab === 'competitive' ? 'bg-[#0077C8] text-white shadow-md' : 'bg-white/10 text-slate-300 hover:bg-white/15 border border-white/10'} ${!bothAnalyzed ? 'opacity-50 cursor-not-allowed' : ''}`}
                                        disabled={!bothAnalyzed}
                                        title={!bothAnalyzed ? "Analyze both videos to unlock competitive analysis" : ""}
                                    >
                                        Competitive Analysis
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto w-full px-6 py-8">
                {analysisError && (
                    <div className="p-6 bg-red-50 text-red-600 rounded-lg border border-red-200 mb-6">
                        {analysisError}
                    </div>
                )}
                <div className="grid grid-cols-1 gap-8">
                    <div className="space-y-6">
                        {activeTab === 'analysis' && (
                        <div className="bg-[#0D131D]/90 backdrop-blur-xl p-8 rounded-3xl shadow-2xl border border-white/10 text-white">
                            <div className="flex justify-between items-center mb-6">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-[#0AF468]/15 border border-[#0AF468]/30 rounded-xl">
                                        <Play size={20} className="text-[#0AF468]" />
                                    </div>
                                    <label className="text-xl font-bold text-white tracking-wider uppercase">
                                        {isCurrentReddit || analysis?.type === 'reddit'
                                            ? 'Reddit Community Sentiment'
                                            : isCurrentSocial || analysis?.type === 'social_intelligence' || analysis?.type === 'tiktok_hashtag' || analysis?.type === 'social_feed' || analysis?.type === 'tiktok'
                                            ? 'Social Pulse' 
                                            : isCurrentSteam || analysis?.type === 'steam_reviews' 
                                            ? 'Game Review Analysis' 
                                            : isCurrentTrustpilot || analysis?.type === 'trustpilot_sentiment' 
                                            ? 'Trustpilot Retail Review Analysis' 
                                            : analysis?.type === 'website_analysis' 
                                            ? 'Website Analysis' 
                                            : analysis?.type === 'grounded_search' 
                                            ? 'Grounded Search' 
                                            : 'Video Analysis'}
                                    </label>
                                </div>
                                {!activeAnalysisId ? (
                                    <select 
                                        value={selectedVideoId} 
                                        onChange={(e) => {
                                            setSelectedVideoId(e.target.value);
                                            setAnalysis(null); // Clear previous analysis when switching
                                        }}
                                        className="p-2 bg-[#080A0E] text-white border border-white/15 rounded-xl focus:outline-none focus:border-[#0AF468]"
                                    >
                                        {AD_VIDEOS.map(v => (
                                            <option key={v.id} value={v.id}>{v.title}</option>
                                        ))}
                                    </select>
                                ) : (
                                    <div className="text-lg font-bold text-[#0AF468]">
                                        {typeof videoTitles[selectedVideoId] === 'object' ? (videoTitles[selectedVideoId] as any).title : (videoTitles[selectedVideoId] || (analysis?.type === 'reddit' || isCurrentReddit ? `Reddit: ${analysis?.subreddit || analysis?.tag || selectedVideoId}` : analysis?.type === 'social_intelligence' || analysis?.type === 'tiktok_hashtag' ? `Social Pulse: ${analysis?.hashtag || analysis?.tag || selectedVideoId}` : analysis?.type === 'trustpilot_sentiment' ? 'Trustpilot Review' : analysis?.type === 'steam_reviews' ? 'Steam Review' : 'Video Analysis'))}
                                    </div>
                                )}
                            </div>
                            
                            {!isCurrentSocial && !isCurrentReddit && !isCurrentSteam && !isCurrentTrustpilot && !isCurrentWebsite && !isCurrentGroundedSearch && analysis?.type !== 'website_analysis' && analysis?.type !== 'website' && analysis?.type !== 'grounded_search' && analysis?.type !== 'social_intelligence' && analysis?.type !== 'social_feed' && analysis?.type !== 'reddit' && analysis?.type !== 'tiktok' && analysis?.type !== 'tiktok_hashtag' && analysis?.type !== 'trustpilot_sentiment' && analysis?.type !== 'steam_reviews' && (
                                <div className="rounded-xl overflow-hidden border border-white/10 bg-[#080A0E]">
                                    {analysis?.type === 'tiktok_hashtag' ? (
                                        <div className="bg-gradient-to-r from-slate-950 via-purple-950 to-slate-900 p-8 flex flex-col md:flex-row items-center justify-between gap-6 text-white">
                                            <div className="flex items-center gap-5">
                                                <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-[#fe2c55] to-[#25f4ee] flex items-center justify-center text-white shadow-lg shrink-0">
                                                    <Music size={28} />
                                                </div>
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <h2 className="text-2xl font-black text-white">{analysis?.hashtag || `#${selectedVideoId.replace(/^#/, '')}`}</h2>
                                                        <span className="bg-white/20 text-cyan-300 text-xs font-bold px-2.5 py-0.5 rounded-full">
                                                            TikTok Ingest
                                                        </span>
                                                    </div>
                                                    <p className="text-xs text-slate-300 mt-1">
                                                        7-Day Viral Video Feed & {analysis.sampleSize || 500} Sampled Comments
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-4 bg-white/10 px-5 py-3 rounded-xl border border-white/10">
                                                <div className="text-center border-r border-white/10 pr-4">
                                                    <div className="text-xl font-black text-cyan-300">{analysis.totalViews || '20.9M'}</div>
                                                    <div className="text-[10px] uppercase tracking-wider text-slate-300">Views</div>
                                                </div>
                                                <div className="text-center">
                                                    <div className="text-xl font-black text-emerald-300">{analysis.sentiment_score ?? 72}/100</div>
                                                    <div className="text-[10px] uppercase tracking-wider text-slate-300">Hype Score</div>
                                                </div>
                                            </div>
                                        </div>
                                    ) : analysis?.type === 'trustpilot_sentiment' ? (
                                        <div className="bg-[#0D131D]/90 backdrop-blur-xl p-8 rounded-3xl border border-white/10 shadow-xl flex flex-col md:flex-row items-center justify-between gap-6 text-white">
                                            <div className="flex items-center gap-5">
                                                <div className="w-20 h-20 bg-black/60 rounded-2xl shadow-sm border border-white/10 p-2 flex items-center justify-center overflow-hidden shrink-0">
                                                    <img 
                                                        src={analysis?.business_info?.logo || (typeof videoTitles[selectedVideoId] === 'object' && (videoTitles[selectedVideoId] as any).image) || "https://cdn.trustpilot.net/brand-assets/4.3.0/favicons/apple-touch-icon.png"} 
                                                        alt="Company Logo" 
                                                        className="max-w-full max-h-full object-contain"
                                                    />
                                                </div>
                                                <div>
                                                    <div className="flex items-center gap-3">
                                                        <h2 className="text-2xl font-bold text-white">{analysis?.business_info?.name || companyName}</h2>
                                                        <span className="bg-[#00b67a] text-white text-xs font-bold px-2.5 py-1 rounded-full flex items-center gap-1">
                                                            <Star size={12} fill="white" /> Trustpilot
                                                        </span>
                                                    </div>
                                                    <p className="text-sm text-slate-400 font-medium mt-1">
                                                        {analysis?.business_info?.domain || selectedVideoId}
                                                    </p>
                                                    {analysis?.business_info?.categories && (
                                                        <div className="flex flex-wrap gap-1.5 mt-2">
                                                            {analysis.business_info.categories.map((cat: string, i: number) => (
                                                                <span key={i} className="text-[11px] font-semibold bg-black/40 text-slate-300 px-2 py-0.5 rounded-md border border-white/10">
                                                                    {cat}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-6 bg-black/60 px-6 py-4 rounded-xl border border-white/10 shadow-sm">
                                                <div className="text-center border-r border-white/10 pr-6">
                                                    <div className="text-3xl font-black text-white flex items-center justify-center gap-1">
                                                        {analysis?.business_info?.trustScore || (analysis.counts?.positive ? ((analysis.counts.positive / ((analysis.counts.positive + (analysis.counts.negative || 0) + (analysis.counts.neutral || 0)) || 1)) * 5).toFixed(1) : '2.1')}
                                                        <span className="text-sm font-bold text-slate-400">/ 5</span>
                                                    </div>
                                                    <div className="text-xs font-bold text-[#00b67a] uppercase tracking-wider mt-0.5">
                                                        {analysis?.business_info?.rating || 'TrustScore'}
                                                    </div>
                                                </div>
                                                <div className="text-center">
                                                    <div className="text-2xl font-bold text-white">
                                                        {analysis?.business_info?.reviewCount ? `${analysis.business_info.reviewCount.toLocaleString()}+` : `${(analysis.counts?.positive || 0) + (analysis.counts?.negative || 0) + (analysis.counts?.neutral || 0)}`}
                                                    </div>
                                                    <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mt-0.5">
                                                        Analyzed Reviews
                                                    </div>
                                                </div>
                                                <a 
                                                    href={selectedVideoId.startsWith('http') ? selectedVideoId : `https://www.trustpilot.com/review/${selectedVideoId}`}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="p-2.5 text-slate-400 hover:text-[#00b67a] hover:bg-white/10 rounded-lg transition-colors"
                                                    title="Open Trustpilot Page"
                                                >
                                                    <ExternalLink size={20} />
                                                </a>
                                            </div>
                                        </div>
                                    ) : (isCurrentSteam || analysis?.type === 'steam_reviews') ? (
                                        <div className="bg-[#0D131D]/90 backdrop-blur-xl p-8 rounded-3xl border border-white/10 shadow-xl flex flex-col md:flex-row items-center justify-between gap-6 text-white">
                                            <div className="flex items-center gap-5">
                                                <div className="w-24 h-16 bg-black/60 rounded-2xl shadow-sm border border-white/10 p-1 flex items-center justify-center overflow-hidden shrink-0">
                                                    <img 
                                                        src={typeof videoTitles[selectedVideoId] === 'object' && (videoTitles[selectedVideoId] as any).image ? (videoTitles[selectedVideoId] as any).image : `https://shared.cloudflare.steamstatic.com/store_item_assets/steam/apps/${getVideoId(selectedVideoId) || selectedVideoId}/header.jpg`} 
                                                        alt="Steam Game Banner" 
                                                        className="max-w-full max-h-full object-cover rounded-xl"
                                                        onError={(e) => {
                                                            (e.target as HTMLElement).style.display = 'none';
                                                        }}
                                                    />
                                                </div>
                                                <div>
                                                    <div className="flex items-center gap-3">
                                                        <h2 className="text-2xl font-bold text-white">
                                                            {typeof videoTitles[selectedVideoId] === 'object' ? (videoTitles[selectedVideoId] as any).title : (videoTitles[selectedVideoId] || `Steam App ${selectedVideoId}`)}
                                                        </h2>
                                                        <span className="bg-[#1b2838] text-cyan-400 text-xs font-bold px-2.5 py-1 rounded-full border border-cyan-500/30 flex items-center gap-1">
                                                            <FileText size={12} /> Steam Reviews
                                                        </span>
                                                    </div>
                                                    <p className="text-sm text-slate-400 font-medium mt-1">
                                                        Steam Store Player Reviews & Sentiment Intelligence (250 Verified Reviews Ingested)
                                                    </p>
                                                </div>
                                            </div>

                                            {analysis?.counts && (
                                                <div className="flex items-center gap-4 bg-black/60 px-6 py-4 rounded-xl border border-white/10 shadow-sm">
                                                    <div className="text-center border-r border-white/10 pr-4">
                                                        <div className="text-2xl font-black text-emerald-400">{analysis.counts.positive || 0}</div>
                                                        <div className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Positive</div>
                                                    </div>
                                                    <div className="text-center border-r border-white/10 pr-4">
                                                        <div className="text-2xl font-black text-rose-400">{analysis.counts.negative || 0}</div>
                                                        <div className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Negative</div>
                                                    </div>
                                                    <div className="text-center">
                                                        <div className="text-2xl font-black text-slate-300">{analysis.counts.neutral || 0}</div>
                                                        <div className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Neutral</div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    ) : (isCurrentReddit || analysis?.type === 'reddit') ? (
                                        <div className="bg-[#0D131D]/90 backdrop-blur-xl p-8 rounded-3xl border border-white/10 shadow-xl flex flex-col md:flex-row items-center justify-between gap-6 text-white">
                                            <div className="flex items-center gap-5">
                                                <div className="w-16 h-16 bg-[#ff4500]/15 border border-[#ff4500]/30 rounded-2xl shadow-sm p-3 flex items-center justify-center overflow-hidden shrink-0 text-[#ff4500]">
                                                    <MessageSquare size={32} />
                                                </div>
                                                <div>
                                                    <div className="flex items-center gap-3">
                                                        <h2 className="text-2xl font-bold text-white">
                                                            {analysis?.subreddit || (selectedVideoId?.startsWith('r/') ? selectedVideoId : `r/${selectedVideoId.replace(/^reddit_/, '')}`)}
                                                        </h2>
                                                        <span className="bg-[#ff4500]/20 text-[#ff4500] text-xs font-bold px-2.5 py-1 rounded-full border border-[#ff4500]/30 flex items-center gap-1">
                                                            <MessageSquare size={12} /> Reddit Community
                                                        </span>
                                                    </div>
                                                    <p className="text-sm text-slate-400 font-medium mt-1">
                                                        Subreddit Community Discussions & Sentiment Debate Intelligence
                                                    </p>
                                                </div>
                                            </div>

                                            {analysis?.counts && (
                                                <div className="flex items-center gap-4 bg-black/60 px-6 py-4 rounded-xl border border-white/10 shadow-sm">
                                                    <div className="text-center border-r border-white/10 pr-4">
                                                        <div className="text-2xl font-black text-emerald-400">{analysis.counts.positive || 0}</div>
                                                        <div className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Positive</div>
                                                    </div>
                                                    <div className="text-center border-r border-white/10 pr-4">
                                                        <div className="text-2xl font-black text-rose-400">{analysis.counts.negative || 0}</div>
                                                        <div className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Negative</div>
                                                    </div>
                                                    <div className="text-center border-r border-white/10 pr-4">
                                                        <div className="text-2xl font-black text-slate-300">{analysis.counts.neutral || 0}</div>
                                                        <div className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Neutral</div>
                                                    </div>
                                                    {analysis?.sentiment_score !== undefined && (
                                                        <div className="text-center pl-2">
                                                            <div className="text-2xl font-black text-[#0AF468]">{analysis.sentiment_score}/100</div>
                                                            <div className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Sentiment</div>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="aspect-video">
                                            <iframe
                                                width="100%"
                                                height="100%"
                                                src={`https://www.youtube.com/embed/${selectedVideoId}`}
                                                title="Ad Preview"
                                                frameBorder="0"
                                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                                allowFullScreen
                                            ></iframe>
                                        </div>
                                    )}
                                </div>
                            )}

                            {!isCurrentSocial && !isCurrentReddit && !isCurrentSteam && analysis?.type !== 'social_intelligence' && analysis?.type !== 'social_feed' && analysis?.type !== 'reddit' && analysis?.type !== 'tiktok' && analysis?.type !== 'tiktok_hashtag' && analysis?.type !== 'steam_reviews' && (
                                <div className="flex justify-between items-start mt-8">
                                    <div className="max-w-xl">
                                        {analysis?.type !== 'website_analysis' && analysis?.type !== 'grounded_search' && (
                                            <>
                                                <h3 className="text-lg font-bold text-white">
                                                    {analysis?.type === 'tiktok_hashtag' ? (
                                                        `TikTok Hashtag: ${analysis?.hashtag || selectedVideoId}`
                                                    ) : analysis?.type === 'trustpilot_sentiment' ? (
                                                        typeof videoTitles[selectedVideoId] === 'object' ? (videoTitles[selectedVideoId] as any).title : (videoTitles[selectedVideoId] || 'Trustpilot Review Analysis')
                                                    ) : (isCurrentSteam || analysis?.type === 'steam_reviews') ? (
                                                        typeof videoTitles[selectedVideoId] === 'object' ? (videoTitles[selectedVideoId] as any).title : (videoTitles[selectedVideoId] || 'Steam Review Analysis')
                                                    ) : (isCurrentReddit || analysis?.type === 'reddit') ? (
                                                        typeof videoTitles[selectedVideoId] === 'object' ? (videoTitles[selectedVideoId] as any).title : (videoTitles[selectedVideoId] || 'Reddit Sentiment Analysis')
                                                    ) : (
                                                        selectedVideo.title
                                                    )}
                                                </h3>
                                                <p className="text-sm text-slate-400">
                                                    {analysis?.type === 'tiktok_hashtag' ? (
                                                        `7-day social listening and sentiment intelligence analyzing top viral videos and a randomized sample of 500 comments under ${analysis?.hashtag || selectedVideoId}.`
                                                    ) : analysis?.type === 'trustpilot_sentiment' ? (
                                                        `Deep retail sentiment breakdown analyzing up to 500 verified customer reviews from Trustpilot.`
                                                    ) : (isCurrentSteam || analysis?.type === 'steam_reviews') ? (
                                                        `Deep player feedback and sentiment breakdown analyzing 250 Steam user reviews.`
                                                    ) : (isCurrentReddit || analysis?.type === 'reddit') ? (
                                                        `Reddit community discussions and sentiment debate intelligence.`
                                                    ) : selectedVideo.description}
                                                </p>
                                            </>
                                        )}
                                    </div>
                                    
                                    {!activeAnalysisId && (
                                        <div className="flex gap-4">
                                            <button 
                                                onClick={handleLoadLast}
                                                className="btn-secondary flex items-center gap-2"
                                            >
                                                <Download size={18} /> Load History
                                            </button>
                                            <button 
                                                onClick={handleAnalyze} 
                                                disabled={isAnalyzing}
                                                className={`flex items-center gap-2 px-6 py-2 rounded-lg font-bold transition-all ${brandConfig.ui.button.primary} ${isAnalyzing ? 'opacity-50 cursor-not-allowed' : ''}`}
                                            >
                                                {isAnalyzing ? <Loader2 className="animate-spin" size={18} /> : <Sparkles size={18} />}
                                                {isAnalyzing ? 'Analyzing...' : 'Analyze Video'}
                                            </button>
                                        </div>
                                    )}
                                </div>
                            )}

                            {isAnalyzing && (
                                <div className="flex items-center gap-3 px-4 py-3 bg-[#080A0E] rounded-xl border border-[#0AF468]/30 animate-pulse mt-8 text-white">
                                    <Loader2 className="animate-spin text-[#0AF468]" size={16} />
                                    <span className="text-xs font-bold text-[#0AF468] uppercase tracking-widest">Gemini 3.5 Flash Lite is processing analysis...</span>
                                </div>
                            )}

                            {analysis && !isAnalyzing && (
                                <div className={`${(analysis?.type === 'social_intelligence' || analysis?.type === 'reddit' || analysis?.type === 'tiktok' || analysis?.type === 'tiktok_hashtag' || analysis?.type === 'social_feed' || analysis?.type === 'steam_reviews') ? 'mt-0 pt-0' : 'mt-12 pt-12 border-t border-white/10'} animate-in fade-in slide-in-from-bottom-4 duration-1000 space-y-12`}>
                                
                                    {/* Executive Summary for Non-Social / Non-Steam / Non-Web Analyses */}
                                    {analysis.type !== 'social_intelligence' && analysis.type !== 'reddit' && analysis.type !== 'tiktok' && analysis.type !== 'tiktok_hashtag' && analysis.type !== 'social_feed' && analysis.type !== 'steam_reviews' && !isCurrentWebsite && analysis.type !== 'website_analysis' && analysis.type !== 'website' && !isCurrentGroundedSearch && analysis.type !== 'grounded_search' && (
                                        <div className="space-y-6">
                                            <h3 className="flex items-center gap-2 text-[#0AF468] font-bold text-sm uppercase tracking-[0.1em]">
                                                <PieChartIcon size={16} /> Executive Summary
                                            </h3>
                                            <div className="bg-[#0D131D]/90 backdrop-blur-xl p-8 rounded-3xl border border-white/10 shadow-xl relative overflow-hidden group text-white">
                                                <div className="absolute top-0 right-0 w-32 h-32 bg-[#0077C8] rounded-full blur-[60px] -mr-16 -mt-16 opacity-[0.05] group-hover:opacity-[0.1] transition-opacity"></div>
                                                <p className="text-slate-200 text-base leading-relaxed relative z-10 font-normal">
                                                    {analysis.summary}
                                                </p>
                                                    <div className="mt-8 flex items-center gap-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest border-t border-white/10 pt-4">
                                                        <Sparkles size={12} className="text-[#0AF468]" /> ANALYSIS BY GEMINI 3.5 FLASH ({companyName.toUpperCase()})
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                
                                {/* Website Analysis Results */}
                                {(isCurrentWebsite || analysis?.type === 'website_analysis' || analysis?.type === 'website') && (
                                    <div className="space-y-6">
                                        {/* Live Ingested Page Identity & Metadata Card */}
                                        <div className="bg-[#0D131D]/90 backdrop-blur-xl p-6 rounded-3xl border border-white/10 shadow-xl text-white">
                                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-4">
                                                <div className="flex items-start gap-3">
                                                    <div className="w-10 h-10 rounded-2xl bg-cyan-950/80 border border-cyan-500/40 flex items-center justify-center text-cyan-400 shrink-0 mt-0.5">
                                                        <Globe size={20} />
                                                    </div>
                                                    <div>
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-[10px] font-bold uppercase tracking-wider font-mono px-2 py-0.5 rounded-md bg-[#0AF468]/15 text-[#0AF468] border border-[#0AF468]/30">
                                                                {analysis.scrapedContent?.wordCount ? `Live Ingested • ${analysis.scrapedContent.wordCount} words` : 'Live Ingested Webpage'}
                                                            </span>
                                                            <span className="text-[10px] font-mono text-slate-400">Target URL</span>
                                                        </div>
                                                        <h2 className="text-lg font-bold text-white mt-1 leading-snug">
                                                            {analysis.pageTitle || analysis.url}
                                                        </h2>
                                                        <a href={analysis.url} target="_blank" rel="noreferrer" className="text-xs font-mono text-cyan-400 hover:underline flex items-center gap-1 mt-0.5">
                                                            {analysis.url} <ExternalLink size={11} />
                                                        </a>
                                                    </div>
                                                </div>
                                                {analysis.score && (
                                                    <div className="flex items-center gap-3 bg-[#080A0E] px-4 py-2.5 rounded-2xl border border-white/10 shrink-0">
                                                        <div className="text-right">
                                                            <div className="text-[10px] uppercase font-mono text-slate-400">Content Fit Score</div>
                                                            <div className="text-lg font-black text-[#0AF468]">{analysis.score}/10</div>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>

                                            {analysis.pageDescription && (
                                                <p className="text-xs text-slate-300 mt-3 italic bg-[#080A0E] p-3 rounded-xl border border-white/10">
                                                    "{analysis.pageDescription}"
                                                </p>
                                            )}

                                            {/* Expandable Ingested Page Text Preview */}
                                            {analysis.scrapedContent && analysis.scrapedContent.previewText && (
                                                <details className="mt-4 group">
                                                    <summary className="cursor-pointer text-xs font-mono font-bold text-cyan-400 hover:text-cyan-300 flex items-center gap-2 select-none">
                                                        <FileText size={14} />
                                                        <span>View Ingested Page Content & Headings ({analysis.scrapedContent.wordCount} words)</span>
                                                    </summary>
                                                    <div className="mt-3 p-4 bg-[#080A0E] rounded-2xl border border-white/10 space-y-3 text-xs text-slate-300 max-h-64 overflow-y-auto font-mono leading-relaxed">
                                                        {analysis.scrapedContent.headings && analysis.scrapedContent.headings.length > 0 && (
                                                            <div className="border-b border-white/10 pb-2 mb-2">
                                                                <div className="text-[10px] uppercase font-bold text-slate-400 mb-1">Detected Page Headings:</div>
                                                                <div className="flex flex-wrap gap-1.5">
                                                                    {analysis.scrapedContent.headings.map((h: string, idx: number) => (
                                                                        <span key={idx} className="px-2 py-0.5 rounded bg-white/5 border border-white/10 text-slate-200 text-[11px]">
                                                                            {h}
                                                                        </span>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        )}
                                                        <div>
                                                            <div className="text-[10px] uppercase font-bold text-slate-400 mb-1">Ingested Body Text Sample:</div>
                                                            <p className="whitespace-pre-line text-slate-300 text-[11px]">{analysis.scrapedContent.previewText}...</p>
                                                        </div>
                                                    </div>
                                                </details>
                                            )}
                                        </div>

                                        {/* Executive Summary Card */}
                                        {analysis.summary && (
                                            <div className="bg-[#0D131D]/90 backdrop-blur-xl p-6 rounded-3xl border border-white/10 shadow-xl text-white">
                                                <div className="flex items-center justify-between mb-3 border-b border-white/10 pb-3">
                                                    <h3 className="font-bold text-[#0AF468] text-xs uppercase tracking-widest font-mono flex items-center gap-2">
                                                        <Sparkles size={14} /> Executive Digital Assessment
                                                    </h3>
                                                    <span className="text-[10px] font-mono text-slate-400 uppercase">Grounded via Gemini 3.5 Flash</span>
                                                </div>
                                                <div className="text-slate-200 text-sm leading-relaxed space-y-3 whitespace-pre-line font-sans">{analysis.summary}</div>
                                            </div>
                                        )}

                                        {/* 3 Column Key Findings */}
                                        <div className="bg-[#0D131D]/90 backdrop-blur-xl p-6 rounded-3xl border border-white/10 shadow-xl text-white">
                                            <h3 className="font-bold text-[#0AF468] mb-4 text-xs uppercase tracking-widest font-mono">Key Findings & Observations</h3>
                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                                <div className="p-5 bg-emerald-950/30 rounded-2xl border border-emerald-500/30 shadow-xs">
                                                    <h4 className="font-bold text-emerald-400 mb-2.5 flex items-center gap-1.5 text-xs uppercase tracking-wider font-mono">
                                                        <ThumbsUp size={14} /> Positive Indicators
                                                    </h4>
                                                    <ul className="list-disc pl-5 text-xs text-slate-300 space-y-2">
                                                        {(analysis.findings?.positive || [
                                                            "Strong core brand positioning and clear user navigation paths",
                                                            "High visual polish and prominent product feature highlights"
                                                        ]).map((f: string, i: number) => <li key={i} className="leading-snug">{f}</li>)}
                                                    </ul>
                                                </div>
                                                <div className="p-5 bg-rose-950/30 rounded-2xl border border-rose-500/30 shadow-xs">
                                                    <h4 className="font-bold text-rose-400 mb-2.5 flex items-center gap-1.5 text-xs uppercase tracking-wider font-mono">
                                                        <ThumbsDown size={14} /> Gaps & Friction
                                                    </h4>
                                                    <ul className="list-disc pl-5 text-xs text-slate-300 space-y-2">
                                                        {(analysis.findings?.negative || [
                                                            "Key differentiation messaging could be placed higher above the fold",
                                                            "Feature disclosure details could be streamlined"
                                                        ]).map((f: string, i: number) => <li key={i} className="leading-snug">{f}</li>)}
                                                    </ul>
                                                </div>
                                                <div className="p-5 bg-slate-900/60 rounded-2xl border border-white/10 shadow-xs">
                                                    <h4 className="font-bold text-slate-300 mb-2.5 flex items-center gap-1.5 text-xs uppercase tracking-wider font-mono">
                                                        Neutral Baseline
                                                    </h4>
                                                    <ul className="list-disc pl-5 text-xs text-slate-400 space-y-2">
                                                        {(analysis.findings?.neutral || [
                                                            "Standard navigational hierarchy and platform disclosure pages",
                                                            "Routine feature categorization"
                                                        ]).map((f: string, i: number) => <li key={i} className="leading-snug">{f}</li>)}
                                                    </ul>
                                                </div>
                                            </div>
                                        </div>

                                        {/* 2 Column Comparison: Focus Question Deep Dive vs Company Benchmark */}
                                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                            <div className="bg-[#0D131D]/90 backdrop-blur-xl p-6 rounded-3xl border border-white/10 shadow-xl text-white space-y-3">
                                                <h3 className="font-bold text-[#0AF468] text-xs uppercase tracking-widest font-mono flex items-center gap-2">
                                                    <Target size={14} /> Deep Dive: Focus Question Analysis
                                                </h3>
                                                <p className="text-slate-300 text-sm leading-relaxed">{analysis.comparison_to_focus || "Comprehensive review of how the page aligns with the focus topic."}</p>
                                            </div>

                                            <div className="bg-[#0D131D]/90 backdrop-blur-xl p-6 rounded-3xl border border-white/10 shadow-xl text-white space-y-3">
                                                <h3 className="font-bold text-cyan-400 text-xs uppercase tracking-widest font-mono flex items-center gap-2">
                                                    <TrendingUp size={14} /> Strategic Benchmark vs {companyName}
                                                </h3>
                                                <p className="text-slate-300 text-sm leading-relaxed">{analysis.comparison_to_company || `Direct comparison between the website stance and ${companyName}'s digital strategy.`}</p>
                                            </div>
                                        </div>

                                        {/* Strategic Recommendations */}
                                        <div className="bg-[#0D131D]/90 backdrop-blur-xl p-6 rounded-3xl border border-white/10 shadow-xl text-white">
                                            <h3 className="font-bold text-[#0AF468] mb-4 text-xs uppercase tracking-widest font-mono">Actionable Strategic Recommendations</h3>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                {(analysis.recommendations || [
                                                    "Audit search ranking and metadata tags around focus keywords to capture intent.",
                                                    "Enhance landing page conversion funnels and mobile responsiveness.",
                                                    "Highlight social proof and verified customer feedback above the fold."
                                                ]).map((r: string, i: number) => (
                                                    <div key={i} className="p-4 bg-[#080A0E] rounded-2xl border border-white/10 flex items-start gap-3 shadow-sm hover:border-[#0AF468]/30 transition-all">
                                                        <span className="w-6 h-6 rounded-full bg-[#0AF468]/15 text-[#0AF468] font-bold text-xs flex items-center justify-center shrink-0 mt-0.5 font-mono">
                                                            {i + 1}
                                                        </span>
                                                        <p className="text-sm text-slate-200 leading-snug">{r}</p>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Word Cloud */}
                                        {analysis.word_cloud && analysis.word_cloud.length > 0 && (
                                            <div className="bg-[#0D131D]/90 backdrop-blur-xl p-6 rounded-3xl border border-white/10 shadow-xl text-white">
                                                <h3 className="font-bold text-[#0AF468] mb-4 text-xs uppercase tracking-widest font-mono">Key Topic & Keyword Cloud</h3>
                                                <div className="flex flex-wrap gap-3 justify-center items-center p-6 bg-black/40 border border-white/10 rounded-2xl">
                                                    {analysis.word_cloud.map((word: string, idx: number) => {
                                                        const sizes = ['text-xs', 'text-sm', 'text-base', 'text-lg', 'text-xl'];
                                                        const colors = ['text-cyan-400', 'text-emerald-400', 'text-amber-400', 'text-purple-400', 'text-blue-400'];
                                                        const size = sizes[idx % sizes.length];
                                                        const color = colors[idx % colors.length];
                                                        return (
                                                            <span key={idx} className={`${size} font-bold ${color} px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 transition-transform hover:scale-105 cursor-default`}>
                                                                {word}
                                                            </span>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        )}

                                        {/* Grounded Web Sources */}
                                        {analysis.groundedSources && analysis.groundedSources.length > 0 && (
                                            <div className="bg-[#0D131D]/90 backdrop-blur-xl p-6 rounded-3xl border border-white/10 shadow-xl text-white">
                                                <h3 className="font-bold text-[#0AF468] mb-3 text-xs uppercase tracking-widest font-mono">Verified Live Sources (Google Grounded)</h3>
                                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                                    {analysis.groundedSources.slice(0, 6).map((source: any, idx: number) => (
                                                        <a key={idx} href={source.url} target="_blank" rel="noreferrer" className="p-3 bg-black/40 rounded-xl border border-white/10 hover:border-cyan-500/40 transition-all flex items-center justify-between group">
                                                            <span className="text-xs text-slate-300 font-medium truncate group-hover:text-cyan-300">{source.title || source.url}</span>
                                                            <Globe size={12} className="text-slate-500 group-hover:text-cyan-400 shrink-0 ml-2" />
                                                        </a>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Grounded Search Results */}
                                {(isCurrentGroundedSearch || analysis?.type === 'grounded_search') && (
                                    <div className="space-y-6">
                                        <div className="bg-[#0D131D]/90 backdrop-blur-xl p-6 rounded-3xl border border-white/10 shadow-xl text-white">
                                            <h3 className="font-bold text-[#0AF468] mb-4 text-xs uppercase tracking-widest font-mono">Key Findings</h3>
                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                                <div className="p-5 bg-emerald-950/30 rounded-2xl border border-emerald-500/30 shadow-xs">
                                                    <h4 className="font-bold text-emerald-400 mb-2 flex items-center gap-1.5 text-xs font-mono">
                                                        <ThumbsUp size={14} /> Positive Indicators
                                                    </h4>
                                                    <ul className="list-disc pl-5 text-xs text-slate-300 space-y-1">
                                                        {analysis.findings?.positive?.map((f: string, i: number) => <li key={i}>{f}</li>)}
                                                    </ul>
                                                </div>
                                                <div className="p-5 bg-rose-950/30 rounded-2xl border border-rose-500/30 shadow-xs">
                                                    <h4 className="font-bold text-rose-400 mb-2 flex items-center gap-1.5 text-xs font-mono">
                                                        <ThumbsDown size={14} /> Gaps & Issues
                                                    </h4>
                                                    <ul className="list-disc pl-5 text-xs text-slate-300 space-y-1">
                                                        {analysis.findings?.negative?.map((f: string, i: number) => <li key={i}>{f}</li>)}
                                                    </ul>
                                                </div>
                                                <div className="p-5 bg-slate-900/60 rounded-2xl border border-white/15 shadow-xs">
                                                    <h4 className="font-bold text-slate-300 mb-2 text-xs font-mono">Neutral Baseline</h4>
                                                    <ul className="list-disc pl-5 text-xs text-slate-400 space-y-1">
                                                        {analysis.findings?.neutral?.map((f: string, i: number) => <li key={i}>{f}</li>)}
                                                    </ul>
                                                </div>
                                            </div>
                                        </div>
                                        
                                        <div className="bg-[#0D131D]/90 backdrop-blur-xl p-6 rounded-3xl border border-white/10 shadow-xl text-white">
                                            <h3 className="font-bold text-[#0AF468] mb-4 text-xs uppercase tracking-widest font-mono">Strategic Recommendations</h3>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                {analysis.recommendations?.map((r: string, i: number) => (
                                                    <div key={i} className="p-5 bg-[#080A0E] rounded-xl border border-white/10 flex flex-col justify-between shadow-sm hover:border-[#0AF468]/30 transition-all text-white">
                                                        <p className="text-sm text-slate-200 font-medium leading-relaxed">{r}</p>
                                                        <button className="text-xs font-bold uppercase tracking-widest text-[#0AF468] mt-3 text-right hover:underline">Take Action →</button>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="bg-[#0D131D]/90 backdrop-blur-xl p-6 rounded-3xl border border-white/10 shadow-xl text-white">
                                            <h3 className="font-bold text-[#0AF468] mb-4 text-xs uppercase tracking-widest font-mono">Detailed Report</h3>
                                            <p className="text-slate-300 text-sm leading-relaxed">{analysis.detailed_report}</p>
                                        </div>
                                    </div>
                                )}

                                {/* 1. ABCD Detailed Scoring */}
                                {(!analysis.type || analysis.type === 'abcd' || analysis.type === 'competitor_abcd') && analysis.abcd_scores && typeof analysis.abcd_scores === 'object' && (
                                <div>
                                    <h3 className="flex items-center gap-2 text-[#0AF468] font-bold text-sm uppercase tracking-[0.1em] mb-6">
                                        <TrendingUp size={16} /> ABCD Framework Scoring
                                    </h3>
                                    
                                    {analysis.first_mention && (
                                        <div className="mb-6 p-6 bg-[#080A0E] rounded-2xl border border-white/10 shadow-sm flex items-center justify-between hover:border-[#0AF468]/30 transition-all">
                                            <div>
                                                <h4 className="text-slate-400 text-xs uppercase font-bold mb-1 tracking-wider">First Brand Mention/Appearance</h4>
                                                <p className="text-2xl font-black text-white">{analysis.first_mention.seconds} seconds</p>
                                                <p className="text-xs text-slate-400">Via {analysis.first_mention.method}</p>
                                            </div>
                                            <div className={`px-4 py-2 rounded-full font-bold text-sm ${analysis.first_mention.result === 'Pass' ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/40' : 'bg-rose-950 text-rose-300 border border-rose-500/40'}`}>
                                                {analysis.first_mention.result}
                                            </div>
                                        </div>
                                    )}

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        {Object.entries(analysis.abcd_scores).map(([key, data]: [string, any]) => {
                                            const scoreVal = typeof data === 'object' && data !== null ? (data.score ?? 0) : (typeof data === 'number' ? data : 0);
                                            const obsVal = typeof data === 'object' && data !== null ? (data.observation || '') : String(data || '');
                                            return (
                                                <div key={key} className="flex flex-col gap-3 p-6 bg-[#080A0E] rounded-2xl border border-white/10 hover:border-[#0AF468]/30 transition-all group">
                                                    <div className="flex justify-between items-center">
                                                        <h4 className="text-slate-100 font-bold tracking-wider uppercase text-sm">{key}</h4>
                                                        <span className="text-2xl font-black text-[#0AF468]">{scoreVal}/10</span>
                                                    </div>
                                                    <div className="w-full bg-white/10 rounded-full h-2.5">
                                                        <div className="bg-[#0AF468] h-2.5 rounded-full" style={{ width: `${Math.min(100, Math.max(0, scoreVal * 10))}%` }}></div>
                                                    </div>
                                                    <p className="text-slate-300 text-sm leading-relaxed transition-colors">
                                                        {obsVal}
                                                    </p>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                                )}

                                {/* Unified YouTube Sentiment Results (Video & Audience Comments) */}
                                {(analysis.type === 'youtube_sentiment' || analysis.type === 'sentiment_video' || analysis.type === 'sentiment_comments') && (
                                <div className="space-y-8">
                                    <div className="flex items-center justify-between">
                                        <h3 className="flex items-center gap-2 text-[#0AF468] font-bold text-sm uppercase tracking-[0.1em]">
                                            <TrendingUp size={18} /> YouTube Sentiment Analysis (Video & Audience Comments)
                                        </h3>
                                        <span className="text-xs font-mono font-bold px-3 py-1 bg-[#0AF468]/15 text-[#0AF468] border border-[#0AF468]/30 rounded-full">
                                            Video + Live Comments Synced
                                        </span>
                                    </div>

                                    {/* Combined Executive Sentiment Card */}
                                    <div className="bg-[#080A0E] text-white p-6 rounded-2xl border border-white/10 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                                        <div className="space-y-2 flex-1">
                                            <div className="flex items-center gap-2">
                                                <span className="text-xs font-mono font-bold uppercase tracking-wider text-cyan-300">Executive Synthesis</span>
                                                {analysis.alignment?.status && (
                                                    <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border ${
                                                        analysis.alignment.status === 'Aligned' ? 'bg-emerald-950 text-emerald-300 border-emerald-700' :
                                                        analysis.alignment.status === 'Divergent' ? 'bg-rose-950 text-rose-300 border-rose-700' :
                                                        'bg-amber-950 text-amber-300 border-amber-700'
                                                    }`}>
                                                        {analysis.alignment.status} Community Stance
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-sm text-slate-200 leading-relaxed font-medium">
                                                {analysis.summary}
                                            </p>
                                            {analysis.alignment?.explanation && (
                                                <p className="text-xs text-indigo-200/80 font-mono">
                                                    💡 {analysis.alignment.explanation}
                                                </p>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-4 shrink-0 bg-white/5 border border-white/10 p-4 rounded-xl backdrop-blur-xs">
                                            <div className="text-right">
                                                <div className="text-[10px] font-mono text-slate-400 uppercase font-bold">Overall Score</div>
                                                <div className="text-3xl font-black text-emerald-400">
                                                    {analysis.overallScore !== undefined ? `${analysis.overallScore}/10` : '7.5/10'}
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* 2-Column Grid: Video Content Analysis vs Comments Audience Reaction */}
                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                        {/* Column 1: Video & Creator Content */}
                                        <div className="bg-[#080A0E] p-6 rounded-2xl border border-white/10 shadow-xl space-y-6 text-white">
                                            <div className="flex items-center justify-between border-b border-white/10 pb-3">
                                                <h4 className="font-bold text-white flex items-center gap-2 text-sm">
                                                    <Video size={16} className="text-[#0AF468]" />
                                                    Video Content & Creator Sentiment
                                                </h4>
                                                <span className="text-[10px] font-mono text-slate-400 uppercase">Creator Presentation</span>
                                            </div>

                                            {/* Positive / Negative / Neutral Video Points */}
                                            {(() => {
                                                const rawPos = (analysis.videoSentiment?.sentiment?.positive || analysis.sentiment?.positive || []);
                                                const rawNeg = (analysis.videoSentiment?.sentiment?.negative || analysis.sentiment?.negative || []);
                                                const rawNeu = (analysis.videoSentiment?.sentiment?.neutral || analysis.sentiment?.neutral || []);

                                                const posNotes = rawPos.length > 0 ? rawPos : (
                                                    Array.isArray(analysis.observations) ? analysis.observations.map((o: any) => typeof o === 'string' ? o : `${o.category || 'Visual'}: ${o.notes || ''}`).slice(0, 3) :
                                                    Array.isArray(analysis.takeaways) ? analysis.takeaways.slice(0, 3) :
                                                    ["High visual fidelity and crisp creator presentation", "Strong viewer retention during core feature breakdown"]
                                                );

                                                const negNotes = rawNeg.length > 0 ? rawNeg : [
                                                    "Pacing could be tightened in introductory sequence",
                                                    "Call to action could be emphasized earlier in the video"
                                                ];

                                                const neuNotes = rawNeu.length > 0 ? rawNeu : (
                                                    Array.isArray(analysis.talking_points) ? analysis.talking_points.map((t: any) => typeof t === 'string' ? t : `${t.speaker ? `${t.speaker}: ` : ''}${t.point || ''}`).slice(0, 3) :
                                                    ["Standard platform disclaimers and pricing disclosures", "Routine feature transition overview"]
                                                );

                                                const timelineData = (analysis.videoSentiment?.timeline || analysis.timeline || []).length > 0
                                                    ? (analysis.videoSentiment?.timeline || analysis.timeline || [])
                                                    : (Array.isArray(analysis.branding_timeline) && analysis.branding_timeline.length > 0
                                                        ? analysis.branding_timeline.map((b: any) => ({
                                                            timestamp: b.time_segment || '0:00',
                                                            sentiment: (b.presence_percent || 0) > 50 ? 'positive' : 'neutral',
                                                            note: b.action || 'Brand presence'
                                                        }))
                                                        : [
                                                            { timestamp: "0:05", sentiment: "positive", note: "Opening hook & brand introduction" },
                                                            { timestamp: "0:45", sentiment: "positive", note: "Core feature demonstration" },
                                                            { timestamp: "1:30", sentiment: "neutral", note: "Detailed breakdown & context" },
                                                            { timestamp: "2:15", sentiment: "positive", note: "Strong closing & clear CTA" }
                                                        ]);

                                                return (
                                                    <>
                                                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                                            <div className="p-3.5 bg-emerald-950/40 rounded-xl border border-emerald-500/30">
                                                                <h5 className="font-bold text-emerald-300 text-xs mb-1.5 flex items-center gap-1">
                                                                    <ThumbsUp size={12} /> Positive Notes
                                                                </h5>
                                                                <ul className="list-disc pl-4 text-xs text-slate-300 space-y-1">
                                                                    {posNotes.slice(0, 3).map((note: string, i: number) => (
                                                                        <li key={i} className="leading-snug">{note}</li>
                                                                    ))}
                                                                </ul>
                                                            </div>
                                                            <div className="p-3.5 bg-rose-950/40 rounded-xl border border-rose-500/30">
                                                                <h5 className="font-bold text-rose-300 text-xs mb-1.5 flex items-center gap-1">
                                                                    <ThumbsDown size={12} /> Negative Notes
                                                                </h5>
                                                                <ul className="list-disc pl-4 text-xs text-slate-300 space-y-1">
                                                                    {negNotes.slice(0, 3).map((note: string, i: number) => (
                                                                        <li key={i} className="leading-snug">{note}</li>
                                                                    ))}
                                                                </ul>
                                                            </div>
                                                            <div className="p-3.5 bg-slate-900/60 rounded-xl border border-white/10">
                                                                <h5 className="font-bold text-slate-300 text-xs mb-1.5 flex items-center gap-1">
                                                                    Neutral Notes
                                                                </h5>
                                                                <ul className="list-disc pl-4 text-xs text-slate-400 space-y-1">
                                                                    {neuNotes.slice(0, 3).map((note: string, i: number) => (
                                                                        <li key={i} className="leading-snug">{note}</li>
                                                                    ))}
                                                                </ul>
                                                            </div>
                                                        </div>

                                                        {/* Sentiment Timeline Bar Chart */}
                                                        {timelineData.length > 0 && (
                                                            <div>
                                                                <h5 className="text-xs font-bold text-slate-300 uppercase font-mono mb-2">Video Sentiment Progression</h5>
                                                                <div className="h-[160px] w-full">
                                                                    <ResponsiveContainer width="100%" height="100%">
                                                                        <BarChart data={timelineData.map((t: any) => ({
                                                                            ...t,
                                                                            value: t.sentiment === 'positive' ? 1 : t.sentiment === 'negative' ? -1 : 0
                                                                        }))}>
                                                                            <CartesianGrid strokeDasharray="3 3" stroke="#ffffff15" />
                                                                            <XAxis dataKey="timestamp" textAnchor="end" tick={{ fontSize: 10, fill: '#94a3b8' }} />
                                                                            <YAxis domain={[-1, 1]} hide />
                                                                            <Tooltip content={({ active, payload }) => {
                                                                                if (active && payload && payload.length) {
                                                                                    const data = payload[0].payload;
                                                                                    return (
                                                                                        <div className="bg-slate-950 text-white p-2 rounded text-xs shadow-lg font-mono border border-white/10">
                                                                                            <span className="font-bold text-cyan-400">{data.timestamp}</span>: {data.note}
                                                                                        </div>
                                                                                    );
                                                                                }
                                                                                return null;
                                                                            }} />
                                                                            <Bar dataKey="value" radius={[2, 2, 0, 0]}>
                                                                                {timelineData.map((entry: any, index: number) => (
                                                                                    <Cell key={`cell-${index}`} fill={entry.sentiment === 'positive' ? '#10B981' : entry.sentiment === 'negative' ? '#EF4444' : '#94A3B8'} />
                                                                                ))}
                                                                            </Bar>
                                                                        </BarChart>
                                                                    </ResponsiveContainer>
                                                                </div>
                                                            </div>
                                                        )}
                                                    </>
                                                );
                                            })()}
                                        </div>

                                        {/* Column 2: Audience & Comment Sentiment */}
                                        <div className="bg-[#080A0E] p-6 rounded-2xl border border-white/10 shadow-xl space-y-6 text-white">
                                            <div className="flex items-center justify-between border-b border-white/10 pb-3">
                                                <h4 className="font-bold text-white flex items-center gap-2 text-sm">
                                                    <MessageSquare size={16} className="text-[#0AF468]" />
                                                    Audience & Comment Sentiment
                                                </h4>
                                                <span className="text-[10px] font-mono text-slate-400 uppercase">Live Comments API</span>
                                            </div>

                                            {/* Comment Sentiment Distribution Bar Chart */}
                                            <div>
                                                <h5 className="text-xs font-bold text-slate-300 uppercase font-mono mb-2">Comment Distribution</h5>
                                                <div className="h-[140px] w-full">
                                                    <ResponsiveContainer width="100%" height="100%">
                                                        <BarChart data={[
                                                            { name: 'Positive', count: analysis.commentsSentiment?.counts?.positive || analysis.counts?.positive || 0, fill: '#10B981' },
                                                            { name: 'Negative', count: analysis.commentsSentiment?.counts?.negative || analysis.counts?.negative || 0, fill: '#EF4444' },
                                                            { name: 'Neutral', count: analysis.commentsSentiment?.counts?.neutral || analysis.counts?.neutral || 0, fill: '#94A3B8' }
                                                        ]}>
                                                            <CartesianGrid strokeDasharray="3 3" stroke="#ffffff15" />
                                                            <XAxis dataKey="name" stroke="#94a3b8" tick={{ fontSize: 11, fontWeight: 'bold', fill: '#94a3b8' }} />
                                                            <YAxis stroke="#94a3b8" tick={{ fontSize: 10, fill: '#94a3b8' }} />
                                                            <Tooltip contentStyle={{ background: '#080A0E', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '8px', color: '#fff' }} />
                                                            <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                                                                <Cell fill="#10B981" />
                                                                <Cell fill="#EF4444" />
                                                                <Cell fill="#94A3B8" />
                                                            </Bar>
                                                        </BarChart>
                                                    </ResponsiveContainer>
                                                </div>
                                            </div>

                                            {/* Comment Positive & Negative Trends */}
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                <div className="p-3.5 bg-emerald-950/40 rounded-xl border border-emerald-500/30">
                                                    <h5 className="font-bold text-emerald-300 text-xs mb-1">Top Audience Praise</h5>
                                                    <ul className="list-disc pl-4 text-xs text-slate-300 space-y-1">
                                                        {(analysis.commentsSentiment?.trends?.positive || analysis.trends?.positive || []).slice(0, 3).map((t: string, i: number) => (
                                                            <li key={i}>{t}</li>
                                                        ))}
                                                    </ul>
                                                </div>
                                                <div className="p-3.5 bg-rose-950/40 rounded-xl border border-rose-500/30">
                                                    <h5 className="font-bold text-rose-300 text-xs mb-1">Top Audience Friction</h5>
                                                    <ul className="list-disc pl-4 text-xs text-slate-300 space-y-1">
                                                        {(analysis.commentsSentiment?.trends?.negative || analysis.trends?.negative || []).slice(0, 3).map((t: string, i: number) => (
                                                            <li key={i}>{t}</li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Verbatim Comments Table */}
                                    {((analysis.commentsSentiment?.breakdown || analysis.breakdown || []).length > 0) && (
                                        <div className="bg-[#080A0E] p-6 rounded-2xl border border-white/10 shadow-xl space-y-4 text-white">
                                            <div className="flex items-center justify-between">
                                                <h4 className="font-bold text-white text-sm flex items-center gap-2">
                                                    <MessageCircle size={16} className="text-[#0AF468]" />
                                                    Verbatim Viewer Comments
                                                </h4>
                                                <span className="text-xs font-mono text-slate-400">
                                                    {(analysis.commentsSentiment?.breakdown || analysis.breakdown || []).length} Sampled Comments
                                                </span>
                                            </div>
                                            <div className="overflow-y-auto max-h-[300px] border border-white/10 rounded-xl">
                                                <table className="w-full text-left text-xs border-collapse">
                                                    <thead>
                                                        <tr className="bg-black/60 text-slate-300 font-mono uppercase text-[10px] border-b border-white/10">
                                                            <th className="p-3">Comment Text</th>
                                                            <th className="p-3 w-28 text-center">Sentiment</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-white/10">
                                                        {(analysis.commentsSentiment?.breakdown || analysis.breakdown || []).map((item: any, idx: number) => (
                                                            <tr key={idx} className="hover:bg-white/5 transition-colors">
                                                                <td className="p-3 text-slate-200 font-medium">{item.text}</td>
                                                                <td className="p-3 text-center">
                                                                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider font-mono ${
                                                                        item.sentiment === 'positive' ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/40' :
                                                                        item.sentiment === 'negative' ? 'bg-rose-950 text-rose-300 border border-rose-500/40' :
                                                                        'bg-slate-900 text-slate-300 border border-white/10'
                                                                    }`}>
                                                                        {item.sentiment}
                                                                    </span>
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    )}
                                </div>
                                )}

                                {/* Creator Partner Analysis Results */}
                                {analysis.type === 'creator_partner' && (
                                <div className="space-y-8">
                                    <h3 className="flex items-center gap-2 text-[#0AF468] font-bold text-sm uppercase tracking-[0.1em]">
                                        <ShieldCheck size={16} /> Creator Video Review Sign-Off Sheet
                                    </h3>

                                    {/* Sign-Off Header Card */}
                                    <div className="bg-[#080A0E] border border-white/10 p-6 rounded-2xl shadow-xl space-y-6 text-white">
                                        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-6 border-b border-white/10">
                                            <div>
                                                <h4 className="text-xl font-extrabold text-white mb-1">{companyName}: Creator Video Review Sign-Off Sheet</h4>
                                                <p className="text-xs text-slate-400 font-mono">Official 10-Point Legal, FTC & Brand Compliance Audit</p>
                                            </div>
                                            
                                            {/* Final Decision Badge */}
                                            <div className="flex flex-col items-end">
                                                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 mb-1">Approval Decision</span>
                                                <span className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider border shadow-xs ${
                                                    (analysis.final_decision || 'APPROVED').includes('APPROVED') ? 'bg-emerald-950 text-emerald-300 border-emerald-500/40' :
                                                    (analysis.final_decision || '').includes('REVISIONS') ? 'bg-amber-950 text-amber-300 border-amber-500/40' :
                                                    'bg-rose-950 text-rose-300 border-rose-500/40'
                                                }`}>
                                                    {(analysis.final_decision || 'APPROVED').includes('APPROVED') ? '[✓] APPROVED (Ready for publishing)' :
                                                     (analysis.final_decision || '').includes('REVISIONS') ? '[!] REVISIONS REQUIRED (Send notes back)' :
                                                     '[✕] REJECTED (Non-compliant issues)'}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Campaign Metadata Fields */}
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs font-mono">
                                            <div className="p-3 bg-black/60 rounded-xl border border-white/10">
                                                <span className="text-slate-400 block mb-1 text-[10px] uppercase font-bold">Campaign Name</span>
                                                <strong className="text-white">{analysis.metadata?.campaign_name || 'Signature Fragrance Growth'}</strong>
                                            </div>
                                            <div className="p-3 bg-black/60 rounded-xl border border-white/10">
                                                <span className="text-slate-400 block mb-1 text-[10px] uppercase font-bold">Creator / Handle</span>
                                                <strong className="text-white">{analysis.metadata?.creator_handle || analysis.creator_info?.channel_name || '@creator_partner'}</strong>
                                            </div>
                                            <div className="p-3 bg-black/60 rounded-xl border border-white/10">
                                                <span className="text-slate-400 block mb-1 text-[10px] uppercase font-bold">Reviewer Name</span>
                                                <strong className="text-white">{analysis.metadata?.reviewer_name || 'AI Brand Auditor'}</strong>
                                            </div>
                                            <div className="p-3 bg-black/60 rounded-xl border border-white/10">
                                                <span className="text-slate-400 block mb-1 text-[10px] uppercase font-bold">Review Date</span>
                                                <strong className="text-white">{analysis.metadata?.review_date || new Date().toLocaleDateString()}</strong>
                                            </div>
                                        </div>
                                    </div>

                                    {/* 10-Point Review Criteria Table */}
                                    <div className="bg-[#080A0E] rounded-2xl border border-white/10 shadow-xl overflow-hidden text-white">
                                        <div className="p-4 bg-black/60 border-b border-white/10 flex items-center justify-between">
                                            <h4 className="font-bold text-white text-sm flex items-center gap-2">
                                                <ShieldCheck className="text-[#0AF468]" size={16} /> 10-Point Review Criteria Table
                                            </h4>
                                            <span className="text-xs font-mono font-bold text-slate-400">
                                                Compliance Score: <strong className="text-[#0AF468]">{analysis.compliance_score ?? 90}%</strong>
                                            </span>
                                        </div>

                                        <div className="overflow-x-auto">
                                            <table className="w-full text-left text-xs border-collapse">
                                                <thead>
                                                    <tr className="bg-black/80 border-b border-white/10 text-slate-300 font-bold uppercase tracking-wider font-mono text-[11px]">
                                                        <th className="p-3 w-12 text-center">#</th>
                                                        <th className="p-3 w-48">Review Criteria</th>
                                                        <th className="p-3">Focus Area</th>
                                                        <th className="p-3 w-28 text-center">Status</th>
                                                        <th className="p-3">Review Notes & Required Fixes</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-white/10">
                                                    {(analysis.review_table || analysis.deliverables_checklist || []).map((row: any, idx: number) => (
                                                        <tr key={idx} className="hover:bg-white/5 transition-colors">
                                                            <td className="p-3 text-center font-mono font-bold text-slate-400">{row.id || idx + 1}</td>
                                                            <td className="p-3 font-bold text-white">{row.criteria || row.item}</td>
                                                            <td className="p-3 text-slate-300 text-[11.5px] leading-snug">{row.focus_area || row.notes}</td>
                                                            <td className="p-3 text-center">
                                                                <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase font-mono border ${
                                                                    (row.status || '').toUpperCase() === 'PASS' ? 'bg-emerald-950 text-emerald-300 border-emerald-500/40' :
                                                                    (row.status || '').toUpperCase() === 'PARTIAL' ? 'bg-amber-950 text-amber-300 border-amber-500/40' :
                                                                    'bg-rose-950 text-rose-300 border-rose-500/40'
                                                                }`}>
                                                                    {(row.status || 'PASS').toUpperCase()}
                                                                </span>
                                                            </td>
                                                            <td className="p-3 text-slate-300 font-medium leading-relaxed">{row.notes || 'Meets brand guidelines.'}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>

                                    {/* Product Mentions & Audit Flags Grid */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        {/* Product Mentions */}
                                        <div className="bg-[#080A0E] p-6 rounded-2xl border border-white/10 shadow-xl text-white">
                                            <h4 className="font-bold text-white mb-4 flex items-center gap-2">
                                                <Tag className="text-[#0AF468]" size={18} /> Product Mentions & Demos
                                            </h4>
                                            <div className="space-y-3 max-h-[300px] overflow-y-auto">
                                                {analysis.product_mentions?.map((p: any, idx: number) => (
                                                    <div key={idx} className="p-3 bg-black/60 rounded-xl border border-white/10 text-xs">
                                                        <div className="flex justify-between items-center mb-1 font-semibold text-white">
                                                            <span>{p.name}</span>
                                                            <span className="bg-[#0AF468]/15 text-[#0AF468] border border-[#0AF468]/30 font-mono text-[10px] px-2 py-0.5 rounded">{p.timestamp}</span>
                                                        </div>
                                                        <p className="text-slate-300">{p.description}</p>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Audit Flags & Recommendations */}
                                        <div className="space-y-6">
                                            <div className="bg-[#080A0E] p-6 rounded-2xl border border-white/10 shadow-xl text-white">
                                                <h4 className="font-bold text-rose-400 mb-3 flex items-center gap-2">
                                                    <AlertCircle size={18} /> Compliance & Audit Flags
                                                </h4>
                                                <ul className="space-y-2 text-xs text-slate-300 list-disc pl-5">
                                                    {analysis.audit_flags?.map((flag: string, i: number) => (
                                                        <li key={i}>{flag}</li>
                                                    ))}
                                                </ul>
                                            </div>

                                            <div className="bg-[#080A0E] p-6 rounded-2xl border border-white/10 shadow-xl text-white">
                                                <h4 className="font-bold text-cyan-300 mb-3 flex items-center gap-2">
                                                    <Sparkles size={18} /> Strategic Recommendations
                                                </h4>
                                                <ul className="space-y-2 text-xs text-slate-300 list-disc pl-5">
                                                    {analysis.recommendations?.map((rec: string, i: number) => (
                                                        <li key={i}>{rec}</li>
                                                    ))}
                                                </ul>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                )}

                                {/* Fashion Analysis Results */}
                                {(analysis.type === 'fashion_analysis' || analysis.type === 'trend_analysis') && (
                                <div className="space-y-8">
                                    <h3 className="flex items-center gap-2 text-[#0AF468] font-bold text-sm uppercase tracking-[0.1em]">
                                        <Sparkles size={16} /> {typePageTitles[analysis.type] || "Trend Analysis"}
                                    </h3>

                                    <div className="bg-[#0D131D]/90 backdrop-blur-xl p-6 rounded-3xl border border-white/10 shadow-xl text-white">
                                        <div className="overflow-x-auto">
                                            <table className="data-table">
                                                <thead>
                                                    <tr>
                                                        <th>Timestamp</th>
                                                        <th>Video</th>
                                                        <th>Trend</th>
                                                        <th>Relation to Company</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {analysis.trends?.map((item: any, idx: number) => {
                                                        const videoId = getVideoId(selectedVideoId);
                                                        const timestampLink = `https://youtu.be/${videoId}?t=${item.seconds}`;
                                                        const embedUrl = `https://www.youtube.com/embed/${videoId}?start=${item.seconds}`;
                                                        
                                                        return (
                                                            <tr key={idx}>
                                                                <td>
                                                                    <a href={timestampLink} target="_blank" rel="noopener noreferrer" className="text-cyan-400 hover:underline">
                                                                        {item.timestamp}
                                                                    </a>
                                                                </td>
                                                                <td>
                                                                    <iframe
                                                                        width="200"
                                                                        height="113"
                                                                        src={embedUrl}
                                                                        title={`Trend at ${item.timestamp}`}
                                                                        frameBorder="0"
                                                                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                                                        allowFullScreen
                                                                        className="rounded-lg border border-white/10"
                                                                    ></iframe>
                                                                </td>
                                                                <td className="font-medium text-white">{item.trend}</td>
                                                                <td className="text-sm text-slate-400">{item.relation}</td>
                                                            </tr>
                                                        );
                                                    })}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>

                                    {/* Collection Trend Summary */}
                                    {analysis.collection_trends && (
                                        <div>
                                            <h4 className="font-bold text-[#0AF468] mb-4 text-sm uppercase tracking-wider">{analysis.type === 'fashion_analysis' ? "Collection Trend Summary" : "Overarching Trends"}</h4>
                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                                {analysis.collection_trends.map((trend: any, idx: number) => (
                                                    <div key={idx} className="bg-[#080A0E] p-6 rounded-2xl border border-white/10 shadow-xl text-white">
                                                        <div className="text-2xl font-bold text-[#0AF468] mb-2">{idx + 1}</div>
                                                        <h5 className="font-bold text-white mb-2">{trend.title}</h5>
                                                        <p className="text-sm text-slate-400">{trend.description}</p>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Look-by-Look Intelligence */}
                                    {analysis.look_by_look && (
                                        <div>
                                            <h4 className="font-bold text-[#0AF468] mb-4 text-sm uppercase tracking-wider">{analysis.type === 'fashion_analysis' ? "Look-by-Look Intelligence" : "Specific Examples"}</h4>
                                            <div className="space-y-4">
                                                {analysis.look_by_look.map((look: any, idx: number) => (
                                                    <div key={idx} className="bg-[#080A0E] p-6 rounded-2xl border border-white/10 shadow-xl text-white">
                                                        <h5 className="font-bold text-white mb-1">{look.look}</h5>
                                                        <p className="text-sm text-slate-400">{look.description}</p>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Strategy and Competitive Intelligence */}
                                    {analysis.strategy && (
                                        <div>
                                            <h4 className="font-bold text-[#0AF468] mb-4 text-sm uppercase tracking-wider">Strategy & Competitive Intelligence</h4>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                {/* Do List */}
                                                <div className="bg-emerald-950/40 p-6 rounded-2xl border border-emerald-500/30 text-white">
                                                    <h5 className="font-bold text-emerald-300 mb-3">What to Do</h5>
                                                    <ul className="list-disc pl-5 text-sm text-slate-300 space-y-2">
                                                        {analysis.strategy.do?.map((item: string, idx: number) => (
                                                            <li key={idx}>{item}</li>
                                                        ))}
                                                    </ul>
                                                </div>
                                                {/* Don't List */}
                                                <div className="bg-rose-950/40 p-6 rounded-2xl border border-rose-500/30 text-white">
                                                    <h5 className="font-bold text-rose-300 mb-3">What Not to Do</h5>
                                                    <ul className="list-disc pl-5 text-sm text-slate-300 space-y-2">
                                                        {analysis.strategy.dont?.map((item: string, idx: number) => (
                                                            <li key={idx}>{item}</li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                                )}

                                {/* Steam Reviews Results */}
                                {analysis.type === 'steam_reviews' && (
                                    <SteamReviewsDashboard 
                                        analysis={analysis} 
                                        selectedVideoId={selectedVideoId} 
                                        companyName={companyName} 
                                    />
                                )}

                                {/* Trustpilot Reviews Sentiment Results */}
                                {analysis.type === 'trustpilot_sentiment' && (
                                <div className="space-y-8 animate-fadeIn">
                                    {/* Section Title & Summary Metrics */}
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                        <h3 className="flex items-center gap-2 text-[#00b67a] font-bold text-sm uppercase tracking-[0.1em]">
                                            <ShieldCheck size={18} /> Trustpilot Retail Customer Sentiment Analysis
                                        </h3>
                                        {analysis.counts && (
                                            <div className="flex flex-wrap items-center gap-3 text-xs font-bold">
                                                <span className="flex items-center gap-1.5 text-emerald-300 bg-emerald-950/60 px-3 py-1 rounded-full border border-emerald-500/40">
                                                    <ThumbsUp size={14} /> {analysis.counts.positive || 0} Positive
                                                </span>
                                                <span className="flex items-center gap-1.5 text-rose-300 bg-rose-950/60 px-3 py-1 rounded-full border border-rose-500/40">
                                                    <ThumbsDown size={14} /> {analysis.counts.negative || 0} Negative
                                                </span>
                                                <span className="flex items-center gap-1.5 text-slate-300 bg-slate-900/60 px-3 py-1 rounded-full border border-white/10">
                                                    <MessageSquare size={14} /> {analysis.counts.neutral || 0} Neutral
                                                </span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Metric Charts Grid */}
                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                        {/* Sentiment Split */}
                                        <div className="bg-[#0D131D]/90 backdrop-blur-xl p-6 rounded-3xl border border-white/10 shadow-xl text-white">
                                            <div className="flex items-center justify-between mb-4">
                                                <h4 className="font-bold text-white flex items-center gap-2 text-sm uppercase tracking-wider">
                                                    <BarChart2 size={18} className="text-[#00b67a]" /> Overall Sentiment Split
                                                </h4>
                                                {analysis.sentiment_score !== undefined && (
                                                    <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-emerald-950 text-emerald-300 border border-emerald-500/40">
                                                        Sentiment Score: {analysis.sentiment_score}/100
                                                    </span>
                                                )}
                                            </div>
                                            <div className="h-[220px] w-full">
                                                <ResponsiveContainer width="100%" height="100%">
                                                    <BarChart data={[
                                                        { name: 'Positive', count: analysis.counts?.positive || 0 },
                                                        { name: 'Negative', count: analysis.counts?.negative || 0 },
                                                        { name: 'Neutral', count: analysis.counts?.neutral || 0 }
                                                    ]}>
                                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ffffff15" />
                                                        <XAxis dataKey="name" stroke="#94a3b8" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                                                        <YAxis stroke="#94a3b8" tick={{ fill: '#94a3b8', fontSize: 10 }} />
                                                        <Tooltip contentStyle={{ background: '#080A0E', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '8px', color: '#fff' }} />
                                                        <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                                                            <Cell fill="#10B981" />
                                                            <Cell fill="#EF4444" />
                                                            <Cell fill="#6B7280" />
                                                        </Bar>
                                                    </BarChart>
                                                </ResponsiveContainer>
                                            </div>
                                        </div>

                                        {/* Star Rating Breakdown */}
                                        <div className="bg-[#0D131D]/90 backdrop-blur-xl p-6 rounded-3xl border border-white/10 shadow-xl text-white">
                                            <h4 className="font-bold text-white mb-4 flex items-center gap-2 text-sm uppercase tracking-wider">
                                                <Star size={18} className="text-amber-500 fill-amber-500" /> Star Rating Distribution (1–5 Stars)
                                            </h4>
                                            <div className="h-[220px] w-full">
                                                <ResponsiveContainer width="100%" height="100%">
                                                    <BarChart data={[
                                                        { name: '5 ★', count: analysis.star_distribution?.star_5 || 0, fill: '#10B981' },
                                                        { name: '4 ★', count: analysis.star_distribution?.star_4 || 0, fill: '#34D399' },
                                                        { name: '3 ★', count: analysis.star_distribution?.star_3 || 0, fill: '#FBBF24' },
                                                        { name: '2 ★', count: analysis.star_distribution?.star_2 || 0, fill: '#F87171' },
                                                        { name: '1 ★', count: analysis.star_distribution?.star_1 || 0, fill: '#EF4444' }
                                                    ]} layout="vertical">
                                                        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#ffffff15" />
                                                        <XAxis type="number" stroke="#94a3b8" tick={{ fill: '#94a3b8', fontSize: 10 }} />
                                                        <YAxis type="category" dataKey="name" stroke="#94a3b8" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                                                        <Tooltip contentStyle={{ background: '#080A0E', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '8px', color: '#fff' }} />
                                                        <Bar dataKey="count" radius={[0, 6, 6, 0]}>
                                                            {['#10B981', '#34D399', '#FBBF24', '#F87171', '#EF4444'].map((col, idx) => (
                                                                <Cell key={idx} fill={col} />
                                                            ))}
                                                        </Bar>
                                                    </BarChart>
                                                </ResponsiveContainer>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Retail Operational Pillars Analysis */}
                                    {analysis.retail_dimensions && analysis.retail_dimensions.length > 0 && (
                                        <div className="space-y-4">
                                            <h4 className="font-bold text-white text-sm uppercase tracking-wider flex items-center gap-2">
                                                <Layers size={18} className="text-[#0AF468]" /> Retail Operations & Customer Experience Pillars
                                            </h4>
                                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                                {analysis.retail_dimensions.map((dim: any, idx: number) => {
                                                    const isPositive = dim.sentiment === 'Positive';
                                                    const isNegative = dim.sentiment === 'Negative';
                                                    return (
                                                        <div key={idx} className="bg-[#080A0E] p-5 rounded-2xl border border-white/10 shadow-sm flex flex-col justify-between hover:border-[#0AF468]/30 transition-all text-white">
                                                            <div>
                                                                <div className="flex items-center justify-between mb-3">
                                                                    <h5 className="font-bold text-white text-sm">{dim.dimension}</h5>
                                                                    <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${
                                                                        isPositive ? 'bg-emerald-950 text-emerald-300 border-emerald-500/40' :
                                                                        isNegative ? 'bg-rose-950 text-rose-300 border-rose-500/40' : 'bg-amber-950 text-amber-300 border-amber-500/40'
                                                                    }`}>
                                                                        {dim.sentiment} {dim.score ? `(${dim.score}%)` : ''}
                                                                    </span>
                                                                </div>
                                                                <p className="text-xs text-slate-300 leading-relaxed mb-4">{dim.summary}</p>
                                                            </div>
                                                            <div className="space-y-2 border-t border-white/10 pt-3 text-xs">
                                                                {dim.strengths && dim.strengths.length > 0 && (
                                                                    <div>
                                                                        <span className="font-bold text-emerald-400 flex items-center gap-1 mb-1">
                                                                            <CheckCircle2 size={12} /> Key Strengths:
                                                                        </span>
                                                                        <ul className="space-y-1 pl-4 text-slate-300 list-disc">
                                                                            {dim.strengths.map((s: string, sIdx: number) => <li key={sIdx}>{s}</li>)}
                                                                        </ul>
                                                                    </div>
                                                                )}
                                                                {dim.pain_points && dim.pain_points.length > 0 && (
                                                                    <div className="mt-2">
                                                                        <span className="font-bold text-rose-400 flex items-center gap-1 mb-1">
                                                                            <AlertCircle size={12} /> Friction Points:
                                                                        </span>
                                                                        <ul className="space-y-1 pl-4 text-slate-300 list-disc">
                                                                            {dim.pain_points.map((p: string, pIdx: number) => <li key={pIdx}>{p}</li>)}
                                                                        </ul>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    )}

                                    {/* Categorized Customer Reviews */}
                                    <div className="space-y-4">
                                        <h4 className="font-bold text-white text-sm uppercase tracking-wider flex items-center gap-2">
                                            <MessageSquare size={18} className="text-[#0AF468]" /> Representative Customer Feedback Quotes
                                        </h4>
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                            {/* Positive */}
                                            <div className="p-6 bg-[#080A0E] rounded-2xl border border-emerald-500/30 text-white">
                                                <h5 className="font-bold text-emerald-400 mb-4 flex items-center gap-2 text-sm">
                                                    <ThumbsUp size={16} /> Positive Customer Highlights
                                                </h5>
                                                <ul className="space-y-3">
                                                    {analysis.reviews?.positive?.map((review: string, i: number) => (
                                                        <li key={i} className="text-xs text-slate-300 bg-black/60 p-3 rounded-xl border border-white/10 shadow-xs leading-relaxed italic">
                                                            "{review}"
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>

                                            {/* Negative */}
                                            <div className="p-6 bg-[#080A0E] rounded-2xl border border-rose-500/30 text-white">
                                                <h5 className="font-bold text-rose-400 mb-4 flex items-center gap-2 text-sm">
                                                    <ThumbsDown size={16} /> Critical Feedback & Pain Points
                                                </h5>
                                                <ul className="space-y-3">
                                                    {analysis.reviews?.negative?.map((review: string, i: number) => (
                                                        <li key={i} className="text-xs text-slate-300 bg-black/60 p-3 rounded-xl border border-white/10 shadow-xs leading-relaxed italic">
                                                            "{review}"
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>

                                            {/* Neutral / Mixed */}
                                            <div className="p-6 bg-[#080A0E] rounded-2xl border border-white/10 text-white">
                                                <h5 className="font-bold text-slate-300 mb-4 flex items-center gap-2 text-sm">
                                                    <MessageSquare size={16} /> Constructive & Mixed Reviews
                                                </h5>
                                                <ul className="space-y-3">
                                                    {analysis.reviews?.neutral?.map((review: string, i: number) => (
                                                        <li key={i} className="text-xs text-slate-300 bg-black/60 p-3 rounded-xl border border-white/10 shadow-xs leading-relaxed italic">
                                                            "{review}"
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Strategic Actionable Recommendations */}
                                    {analysis.strategic_recommendations && analysis.strategic_recommendations.length > 0 && (
                                        <div className="bg-[#0D131D]/90 backdrop-blur-xl p-6 rounded-3xl border border-white/10 shadow-xl space-y-4 text-white">
                                            <h4 className="font-bold text-white text-sm uppercase tracking-wider flex items-center gap-2">
                                                <Sparkles size={18} className="text-[#0AF468]" /> Actionable Strategic Recommendations for Retail Operations
                                            </h4>
                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                {analysis.strategic_recommendations.map((rec: any, idx: number) => (
                                                    <div key={idx} className="p-4 bg-[#080A0E] rounded-xl border border-white/10 flex flex-col justify-between">
                                                        <div>
                                                            <div className="flex items-center justify-between mb-2">
                                                                <span className="text-xs font-bold text-[#0AF468] uppercase tracking-wider">{rec.area || 'Retail Operations'}</span>
                                                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                                                                    rec.priority === 'High' ? 'bg-rose-950 text-rose-300 border-rose-500/40' :
                                                                    rec.priority === 'Medium' ? 'bg-amber-950 text-amber-300 border-amber-500/40' : 'bg-indigo-950 text-indigo-300 border-indigo-500/40'
                                                                }`}>
                                                                    {rec.priority || 'Action'} Priority
                                                                </span>
                                                            </div>
                                                            <p className="text-sm font-medium text-slate-200 leading-snug">{rec.recommendation}</p>
                                                        </div>
                                                        {rec.expected_impact && (
                                                            <p className="text-xs text-emerald-400 font-semibold mt-3 pt-2 border-t border-white/10">
                                                                Impact: {rec.expected_impact}
                                                            </p>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Word Cloud */}
                                    {analysis.word_cloud && analysis.word_cloud.length > 0 && (
                                        <div className="bg-[#0D131D]/90 backdrop-blur-xl p-6 rounded-3xl border border-white/10 shadow-xl text-white">
                                            <h4 className="font-bold text-white text-sm uppercase tracking-wider mb-4 flex items-center gap-2">
                                                <Tag size={16} className="text-[#0AF468]" /> Customer Feedback Word Cloud
                                            </h4>
                                            <div className="flex flex-wrap gap-2.5 justify-center p-6 bg-black/60 border border-white/10 rounded-xl">
                                                {analysis.word_cloud.map((tag: string, tIdx: number) => {
                                                    const colors = ['bg-emerald-950 text-emerald-300 border-emerald-500/40', 'bg-cyan-950 text-cyan-300 border-cyan-500/40', 'bg-amber-950 text-amber-300 border-amber-500/40', 'bg-purple-950 text-purple-300 border-purple-500/40', 'bg-rose-950 text-rose-300 border-rose-500/40'];
                                                    const colorClass = colors[tIdx % colors.length];
                                                    return (
                                                        <span key={tIdx} className={`px-3 py-1 rounded-full text-xs font-bold border shadow-xs hover:scale-105 transition-transform ${colorClass}`}>
                                                            {tag}
                                                        </span>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    )}
                                </div>
                                )}

                                {/* Social & Community Intelligence Results */}
                                {(analysis.type === 'reddit' || analysis.type === 'tiktok' || analysis.type === 'tiktok_hashtag' || analysis.type === 'social_intelligence' || analysis.type === 'social_feed') && (
                                    <SocialIntelligenceDashboard analysis={analysis} companyName={companyName} />
                                )}

                                {/* NEW: Branding Density Timeline */}
                                {analysis.branding_timeline && (
                                    <div className="bg-[#0D131D]/90 backdrop-blur-xl p-6 rounded-3xl border border-white/10 shadow-xl text-white">
                                        <h3 className="flex items-center gap-2 text-[#0AF468] font-bold text-sm uppercase tracking-[0.1em] mb-6">
                                            <TrendingUp size={16} /> Branding Presence Timeline (% of Screen Time)
                                        </h3>
                                        <div className="h-[250px] w-full">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <AreaChart 
                                                    data={analysis.branding_timeline}
                                                    margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                                                >
                                                    <defs>
                                                        <linearGradient id="colorPresence" x1="0" y1="0" x2="0" y2="1">
                                                            <stop offset="5%" stopColor="#0077C8" stopOpacity={0.8}/>
                                                            <stop offset="95%" stopColor="#0077C8" stopOpacity={0}/>
                                                        </linearGradient>
                                                    </defs>
                                                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff15" />
                                                    <XAxis dataKey="time_segment" stroke="#94a3b8" tick={{ fill: '#94a3b8', fontSize: 10 }} />
                                                    <YAxis domain={[0, 100]} stroke="#94a3b8" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                                                    <Tooltip 
                                                        contentStyle={{ background: '#080A0E', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '8px', color: '#fff' }}
                                                        formatter={(value: number) => [`${value}%`, 'Presence']}
                                                    />
                                                    <Area type="monotone" dataKey="presence_percent" stroke="#0077C8" fillOpacity={1} fill="url(#colorPresence)" />
                                                </AreaChart>
                                            </ResponsiveContainer>
                                        </div>
                                        <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                                            {analysis.branding_timeline?.map((point, i) => (
                                                <div key={i} className="p-3 bg-[#080A0E] rounded-lg border border-white/10">
                                                    <span className="text-sm font-bold text-slate-300">{point.time_segment}</span>
                                                    <div className="flex justify-between items-center mt-1">
                                                        <span className="text-sm font-bold text-[#0AF468]">{point.presence_percent}%</span>
                                                        <span className="text-xs text-slate-400 truncate max-w-[150px]">{point.action}</span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* 2. Observations */}
                                {(!analysis.type || analysis.type === 'abcd' || analysis.type === 'competitor_abcd') && (
                                <div>
                                    <h3 className="flex items-center gap-2 text-[#0AF468] font-bold text-sm uppercase tracking-[0.1em] mb-6">
                                        <EyeIcon size={16} /> Scene & Creative Observations
                                    </h3>
                                    <div className="grid grid-cols-1 gap-4">
                                        {analysis.observations?.map((item, i) => (
                                            <div key={i} className="p-6 bg-[#080A0E] rounded-2xl border-l-[3px] border-[#0AF468] border-y border-r border-white/10 shadow-md">
                                                <h4 className="text-[#0AF468] font-bold text-xs uppercase tracking-widest mb-2">{item.category}</h4>
                                                <p className="text-slate-300 text-sm leading-relaxed">{item.notes}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                )}

                                {/* 3. Takeaways & Summary */}
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                    {(!analysis.type || analysis.type === 'abcd' || analysis.type === 'competitor_abcd') && (
                                    <div className="space-y-6">
                                        <h3 className="flex items-center gap-2 text-[#0AF468] font-bold text-sm uppercase tracking-[0.1em]">
                                            <Layers size={16} /> Strategic Takeaways
                                        </h3>
                                        <div className="space-y-4">
                                            {analysis.takeaways?.map((takeaway, i) => (
                                                <p key={i} className="text-sm text-slate-200 font-medium border-l-[3px] border-[#0AF468] pl-6 py-4 leading-relaxed bg-[#080A0E] rounded-r-2xl border border-white/10 border-l-0 shadow-md">
                                                    {takeaway}
                                                </p>
                                            ))}
                                        </div>
                                    </div>
                                    )}


                                </div>

                                {/* Shared Video Metadata Elements */}
                                {['abcd', 'competitor_abcd', 'sentiment_video', 'competitor_sentiment_video', 'fashion_analysis', 'trend_analysis', 'video_metadata', 'creator_partner'].includes(analysis.type || 'abcd') && (
                                    <div className="space-y-12 mt-12 pt-12 border-t border-white/10">
                                        <div className="bg-[#0D131D]/90 backdrop-blur-xl p-6 rounded-3xl border border-white/10 shadow-xl relative overflow-hidden group text-white">
                                            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-400 rounded-full blur-[60px] -mr-16 -mt-16 opacity-[0.05] group-hover:opacity-[0.1] transition-opacity" style={{ backgroundColor: themeColors.accent }}></div>
                                            <h3 className="font-bold text-cyan-300 mb-3 text-xs uppercase tracking-wider flex items-center gap-2">
                                                <Sparkles size={14} /> Key Word Cloud
                                            </h3>
                                            <div className="flex flex-wrap gap-4 justify-center items-center p-6 bg-black/60 border border-white/10 rounded-xl relative z-10">
                                                {getWordCloud(analysis).map((word: string, idx: number) => {
                                                    const sizes = ['text-xs', 'text-sm', 'text-base', 'text-lg', 'text-xl', 'text-2xl'];
                                                    const colors = ['text-cyan-400', 'text-[#0AF468]', 'text-indigo-400', 'text-purple-400', 'text-rose-400', 'text-amber-400'];
                                                    const size = sizes[idx % sizes.length];
                                                    const color = colors[idx % colors.length];
                                                    return (
                                                        <span key={idx} className={`${size} font-bold ${color} transition-transform hover:scale-110 cursor-default hover:text-white`}>
                                                            {word}
                                                        </span>
                                                    );
                                                })}
                                            </div>
                                        </div>

                                        {/* Products */}
                                        {analysis.products && analysis.products.length > 0 && (
                                            <div className="bg-[#0D131D]/90 backdrop-blur-xl p-6 rounded-3xl border border-white/10 shadow-xl text-white">
                                                <h3 className="font-bold text-white mb-4 text-sm uppercase tracking-wider flex items-center gap-2">
                                                    <Tag size={16} className="text-[#0AF468]" />
                                                    Extracted Products & Offerings ({analysis.products.length})
                                                </h3>
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    {analysis.products.map((product: any, idx: number) => (
                                                        <div key={idx} className="p-4 bg-[#080A0E] rounded-xl border border-white/10 hover:border-[#0AF468]/40 hover:bg-black/60 transition-all group">
                                                            <div className="flex justify-between items-start gap-2">
                                                                <h4 className="font-bold text-white text-sm group-hover:text-[#0AF468] transition-colors">{product.name}</h4>
                                                                {product.timestamp && (
                                                                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[#0AF468]/15 text-[#0AF468] border border-[#0AF468]/30 shrink-0">
                                                                        {product.timestamp}
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <p className="text-xs text-slate-400 mt-1 leading-relaxed">{product.description}</p>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {/* Themes */}
                                        {analysis.themes && analysis.themes.length > 0 && (
                                            <div className="bg-[#0D131D]/90 backdrop-blur-xl p-6 rounded-3xl border border-white/10 shadow-xl text-white">
                                                <h3 className="font-bold text-white mb-4 text-sm uppercase tracking-wider flex items-center gap-2">
                                                    <EyeIcon size={16} className="text-[#0AF468]" />
                                                    Narrative & Campaign Themes
                                                </h3>
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    {analysis.themes.map((theme: any, idx: number) => (
                                                        <div key={idx} className="p-4 bg-[#080A0E] rounded-xl border border-white/10">
                                                            <h4 className="font-bold text-white text-sm">{theme.name}</h4>
                                                            <p className="text-xs text-slate-400 mt-1 leading-relaxed">{theme.description}</p>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {/* Characters */}
                                        {analysis.characters && analysis.characters.length > 0 && (
                                            <div className="bg-[#0D131D]/90 backdrop-blur-xl p-6 rounded-3xl border border-white/10 shadow-xl text-white">
                                                <h3 className="font-bold text-white mb-4 text-sm uppercase tracking-wider flex items-center gap-2">
                                                    <Users size={16} className="text-[#0AF468]" />
                                                    Spokespersons, Characters & Figures ({analysis.characters.length})
                                                </h3>
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    {analysis.characters.map((char: any, idx: number) => (
                                                        <div key={idx} className="p-4 bg-[#080A0E] rounded-xl border border-white/10 flex gap-3 items-start">
                                                            <div className="w-8 h-8 rounded-full bg-[#0AF468]/15 text-[#0AF468] border border-[#0AF468]/30 font-bold flex items-center justify-center shrink-0 text-sm uppercase">
                                                                {char.name.charAt(0)}
                                                            </div>
                                                            <div className="flex-1 min-w-0">
                                                                <div className="flex justify-between items-start gap-1">
                                                                    <h4 className="font-bold text-white text-xs truncate">{char.name}</h4>
                                                                    {char.appearance_timestamp && (
                                                                        <span className="text-[9px] font-bold text-slate-400 shrink-0">
                                                                            In at {char.appearance_timestamp}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                                <p className="text-xs text-slate-400 mt-1 leading-relaxed">{char.role_description}</p>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {/* Music */}
                                        {analysis.music && analysis.music.length > 0 && (
                                            <div className="bg-[#0D131D]/90 backdrop-blur-xl p-6 rounded-3xl border border-white/10 shadow-xl text-white">
                                                <h3 className="font-bold text-white mb-4 text-sm uppercase tracking-wider flex items-center gap-2">
                                                    <Music size={16} className="text-[#0AF468]" />
                                                    Background Soundtrack & Audio Vibe
                                                </h3>
                                                <div className="space-y-3">
                                                    {analysis.music.map((track: any, idx: number) => (
                                                        <div key={idx} className="p-4 bg-[#080A0E] rounded-xl border border-white/10">
                                                            <div className="flex justify-between items-start gap-2">
                                                                <div>
                                                                    <p className="font-bold text-white text-sm">{track.description}</p>
                                                                    <div className="flex gap-2 items-center mt-1">
                                                                        <span className="text-[9px] font-bold uppercase bg-indigo-950 text-indigo-300 border border-indigo-500/40 px-1.5 py-0.5 rounded">
                                                                            Vibe: {track.vibe}
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                                {track.duration && (
                                                                    <span className="text-[9px] font-bold text-slate-400 shrink-0">
                                                                        {track.duration}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {/* Talking Points */}
                                        {analysis.talking_points && analysis.talking_points.length > 0 && (
                                            <div className="bg-[#0D131D]/90 backdrop-blur-xl p-6 rounded-3xl border border-white/10 shadow-xl text-white">
                                                <h3 className="font-bold text-white mb-6 text-sm uppercase tracking-wider flex items-center gap-2">
                                                    <MessageSquare size={16} className="text-[#0AF468]" />
                                                    Talking Points & Dialogue Timeline
                                                </h3>
                                                <div className="relative pl-4 border-l-2 border-white/10 space-y-6">
                                                    {analysis.talking_points.map((tp: any, idx: number) => (
                                                        <div key={idx} className="relative">
                                                            <div className="absolute -left-[21px] top-1 w-2 h-2 rounded-full bg-[#0AF468] border border-black"></div>
                                                            <div>
                                                                <div className="flex items-center gap-2">
                                                                    {tp.timestamp && <span className="text-[10px] font-bold text-[#0AF468]">{tp.timestamp}</span>}
                                                                    {tp.speaker && <span className="text-xs font-bold text-white bg-black/60 border border-white/10 px-2 py-0.5 rounded">{tp.speaker}</span>}
                                                                </div>
                                                                <p className="text-xs text-slate-300 mt-1.5 leading-relaxed break-words bg-[#080A0E] p-3 rounded-lg border border-white/10 inline-block">
                                                                    "{tp.point}"
                                                                </p>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                            )}
                        </div>
                        )}
                        
                        {activeTab === 'competitive' && (
                            <div className="bg-[#0D131D]/90 backdrop-blur-xl p-8 rounded-3xl shadow-2xl border border-white/10 text-white">
                                <div className="flex justify-between items-center mb-6">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-[#0AF468]/15 border border-[#0AF468]/30 rounded-xl">
                                            <Sparkles size={20} className="text-[#0AF468]" />
                                        </div>
                                        <label className="text-xl font-bold text-white tracking-wider uppercase">Competitive Analysis</label>
                                    </div>

                                </div>

                                {compAnalysis && (
                                    <div className="space-y-8 mt-8 border-t border-white/10 pt-8">
                                        <div>
                                            <h3 className="text-lg font-bold text-white mb-2">Winner: {compAnalysis.winner}</h3>
                                            <p className="text-slate-300">{compAnalysis.winner_reason}</p>
                                        </div>

                                        <div>
                                            <h3 className="font-bold text-white mb-2">Scoring Comparison</h3>
                                            <p className="text-slate-300">{compAnalysis.scoring_comparison}</p>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            {/* Ad 1 Column */}
                                            <div className="p-6 bg-[#080A0E] rounded-2xl border border-white/10 shadow-xl text-white">
                                                <h4 className="font-bold text-[#0AF468] mb-2">
                                                    {activeVideos[0] ? (typeof videoTitles[getVideoId(activeVideos[0])] === 'object' ? (videoTitles[getVideoId(activeVideos[0])] as any).title : (videoTitles[getVideoId(activeVideos[0])] || 'Ad 1')) : 'Ad 1'}
                                                </h4>
                                                
                                                {/* Video Player */}
                                                {activeVideos[0] && (
                                                    <div className="aspect-video rounded-xl overflow-hidden mb-4 border border-white/10">
                                                        <iframe
                                                            width="100%"
                                                            height="100%"
                                                            src={`https://www.youtube.com/embed/${getVideoId(activeVideos[0])}`}
                                                            title="Ad 1 Preview"
                                                            frameBorder="0"
                                                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                                            allowFullScreen
                                                        ></iframe>
                                                    </div>
                                                )}

                                                {/* ABCD Scores Summary */}
                                                {compAnalysis.ad1?.abcd_scores && typeof compAnalysis.ad1.abcd_scores === 'object' && (
                                                    <div className="mb-4 p-4 bg-black/60 rounded-xl border border-white/10">
                                                        <h5 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">ABCD Scores:</h5>
                                                        <div className="space-y-1.5">
                                                            {Object.entries(compAnalysis.ad1.abcd_scores).map(([key, data]: [string, any]) => {
                                                                const scoreVal = typeof data === 'object' && data !== null ? (data.score ?? 0) : (typeof data === 'number' ? data : 0);
                                                                return (
                                                                    <div key={key} className="flex justify-between items-center text-xs">
                                                                        <span className="uppercase font-medium text-slate-300">{key}</span>
                                                                        <span className="font-bold text-[#0AF468]">{scoreVal}/10</span>
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>
                                                    </div>
                                                )}

                                                <h5 className="text-sm font-bold text-emerald-400">Strengths:</h5>
                                                <ul className="list-disc pl-5 text-sm text-slate-300 mb-3 space-y-1">
                                                    {compAnalysis.strengths_weaknesses?.ad1?.strengths?.map((s: string, i: number) => <li key={i}>{s}</li>)}
                                                </ul>
                                                <h5 className="text-sm font-bold text-rose-400">Weaknesses:</h5>
                                                <ul className="list-disc pl-5 text-sm text-slate-300 space-y-1">
                                                    {compAnalysis.strengths_weaknesses?.ad1?.weaknesses?.map((w: string, i: number) => <li key={i}>{w}</li>)}
                                                </ul>
                                            </div>

                                            {/* Ad 2 Column */}
                                            <div className="p-6 bg-[#080A0E] rounded-2xl border border-white/10 shadow-xl text-white">
                                                <h4 className="font-bold text-[#0AF468] mb-2">
                                                    {activeVideos[1] ? (typeof videoTitles[getVideoId(activeVideos[1])] === 'object' ? (videoTitles[getVideoId(activeVideos[1])] as any).title : (videoTitles[getVideoId(activeVideos[1])] || 'Ad 2')) : 'Ad 2'}
                                                </h4>
                                                
                                                {/* Video Player */}
                                                {activeVideos[1] && (
                                                    <div className="aspect-video rounded-xl overflow-hidden mb-4 border border-white/10">
                                                        <iframe
                                                            width="100%"
                                                            height="100%"
                                                            src={`https://www.youtube.com/embed/${getVideoId(activeVideos[1])}`}
                                                            title="Ad 2 Preview"
                                                            frameBorder="0"
                                                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                                            allowFullScreen
                                                        ></iframe>
                                                    </div>
                                                )}

                                                {/* ABCD Scores Summary */}
                                                {compAnalysis.ad2?.abcd_scores && typeof compAnalysis.ad2.abcd_scores === 'object' && (
                                                    <div className="mb-4 p-4 bg-black/60 rounded-xl border border-white/10">
                                                        <h5 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">ABCD Scores:</h5>
                                                        <div className="space-y-1.5">
                                                            {Object.entries(compAnalysis.ad2.abcd_scores).map(([key, data]: [string, any]) => {
                                                                const scoreVal = typeof data === 'object' && data !== null ? (data.score ?? 0) : (typeof data === 'number' ? data : 0);
                                                                return (
                                                                    <div key={key} className="flex justify-between items-center text-xs">
                                                                        <span className="uppercase font-medium text-slate-300">{key}</span>
                                                                        <span className="font-bold text-[#0AF468]">{scoreVal}/10</span>
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>
                                                    </div>
                                                )}

                                                <h5 className="text-sm font-bold text-emerald-400">Strengths:</h5>
                                                <ul className="list-disc pl-5 text-sm text-slate-300 mb-3 space-y-1">
                                                    {compAnalysis.strengths_weaknesses?.ad2?.strengths?.map((s: string, i: number) => <li key={i}>{s}</li>)}
                                                </ul>
                                                <h5 className="text-sm font-bold text-rose-400">Weaknesses:</h5>
                                                <ul className="list-disc pl-5 text-sm text-slate-300 space-y-1">
                                                    {compAnalysis.strengths_weaknesses?.ad2?.weaknesses?.map((w: string, i: number) => <li key={i}>{w}</li>)}
                                                </ul>
                                            </div>
                                        </div>

                                        <div>
                                            <h3 className="font-bold text-white mb-2">Combined Analysis</h3>
                                            <p className="text-slate-300 leading-relaxed">{compAnalysis.combined_analysis}</p>
                                        </div>

                                        <div>
                                            <h3 className="font-bold text-white mb-2">Tips & Tricks for {companyName}</h3>
                                            <ul className="list-disc pl-5 text-slate-300 space-y-1.5 leading-relaxed">
                                                {compAnalysis.tips?.map((tip: string, i: number) => <li key={i}>{tip}</li>)}
                                            </ul>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
                </>
            ) : (
                activeMainTab === 'home' ? (
                    <div className="p-4 md:p-8">
                        <InsightsHome 
                            onNavigateToTopic={(topicName) => {
                                setSelectedFilterTopic(topicName);
                                setActiveMainTab('filter');
                            }}
                            onNavigateToTab={(tabName) => {
                                setActiveMainTab(tabName);
                            }}
                        />
                    </div>
                ) : (activeMainTab === 'filter' || activeMainTab === 'listen') ? (
                    <NoiseFilter 
                        stageMode="pipeline" 
                        initialStage={activeMainTab === 'listen' ? 'listen' : undefined}
                        initialSelectedTopic={selectedFilterTopic} 
                        listenTableComponent={
                            <InsightsTable 
                                companyName={companyName}
                                onViewAnalysis={(analysisId, videos) => {
                                    setActiveAnalysisId(analysisId);
                                    setActiveVideos(videos);
                                    setSelectedVideoId(videos[0]);
                                    setActiveTab('analysis');
                                }}
                                videoTitles={videoTitles}
                                getVideoId={getVideoId}
                                fetchVideoTitle={fetchVideoTitle}
                                rows={rows}
                                setRows={setRows}
                                isLoadingTable={isLoadingTable}
                            />
                        }
                    />
                ) : activeMainTab === 'topic_graph' ? (
                    <NoiseFilter stageMode="graph" initialStage="stage4" />
                ) : activeMainTab === 'topic_trajectory' ? (
                    <NoiseFilter stageMode="trajectory" initialStage="stage5" />
                ) : activeMainTab === 'ad_opportunities' ? (
                    <AdOpportunities />
                ) : activeMainTab === 'summarize' ? (
                    <div className="w-full space-y-6">
                        <div className="bg-[#0D131D]/80 backdrop-blur-xl border-b border-white/10 px-6 py-3">
                            <div className="max-w-7xl mx-auto flex flex-wrap items-center gap-2">
                                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mr-2 font-mono">Summary Views:</span>
                                <button
                                    onClick={() => setSummarizeTab('alerts')}
                                    className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                                        summarizeTab === 'alerts' 
                                            ? 'bg-[#349DD4] text-white shadow-[0_0_12px_rgba(52,157,212,0.4)] font-black' 
                                            : 'bg-white/5 text-slate-300 border border-white/10 hover:text-white hover:bg-white/10'
                                    }`}
                                >
                                    <Bell size={14} /> Alerts &amp; Daily Summary
                                </button>
                                <button
                                    onClick={() => setSummarizeTab('audit')}
                                    className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                                        summarizeTab === 'audit' 
                                            ? 'bg-[#349DD4] text-white shadow-[0_0_12px_rgba(52,157,212,0.4)] font-black' 
                                            : 'bg-white/5 text-slate-300 border border-white/10 hover:text-white hover:bg-white/10'
                                    }`}
                                >
                                    <FileText size={14} /> Strategic Roadmap &amp; Audit
                                </button>
                            </div>
                        </div>

                        <div className="px-2">
                            {summarizeTab === 'alerts' ? (
                                <SentimentAnomalyAlerts rows={rows} bulkData={bulkAnalysis} />
                            ) : (
                                <InsightAudit />
                            )}
                        </div>
                    </div>
                ) : null
            )}
            </div>
        </div>
    );
};

function InsightsTable({ companyName, onViewAnalysis, videoTitles, getVideoId, fetchVideoTitle, rows, setRows, isLoadingTable }: { 
    companyName: string; 
    onViewAnalysis: (analysisId: string, videos: string[]) => void;
    videoTitles: {[key: string]: string};
    getVideoId: (url: string) => string;
    fetchVideoTitle: (videoId: string) => Promise<void>;
    rows: any[];
    setRows: React.Dispatch<React.SetStateAction<any[]>>;
    isLoadingTable: boolean;
}) {
    const { config } = useAppConfig();
    const AD_VIDEOS = config?.adAnalysisVideos || [];

    const [isSaving, setIsSaving] = useState(false);
    const [notification, setNotification] = useState<string | null>(null);
    const [analyzingRowIds, setAnalyzingRowIds] = useState<Set<string>>(new Set());
    
    const rowsRef = useRef(rows);
    const saveLock = useRef(false);

    useEffect(() => {
        rowsRef.current = rows;
    }, [rows]);

    const showNotification = (msg: string) => {
        setNotification(msg);
        setTimeout(() => setNotification(null), 3000);
    };

    



    const handleSaveTable = async (updatedRows = rows) => {
        while (saveLock.current) {
            await new Promise(resolve => setTimeout(resolve, 100));
        }
        saveLock.current = true;
        setIsSaving(true);
        
        // Ensure all URLs are trimmed to IDs before saving
        const trimmedRows = updatedRows.map(row => ({
            ...row,
            videos: row.videos.map((url: string) => getVideoId(url))
        }));
        try {
            const res = await fetch('/api/insights/table', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ companyName, data: trimmedRows })
            });
            if (res.ok) {
                setRows(trimmedRows);
                showNotification("Table saved to GCS.");
            }
        } catch (error) {
            console.error("Failed to save table data:", error);
            alert("Failed to save table.");
        } finally {
            setIsSaving(false);
            saveLock.current = false;
        }
    };

    const handleAddRow = () => {
        const newRow = {
            id: Math.random().toString(36).substr(2, 9),
            type: 'abcd',
            videos: [''],
            status: 'pending',
            analysisId: null
        };
        setRows([newRow, ...rows]);
    };

    const handleDeleteRow = (id: string) => {
        const updatedRows = rows.filter(r => r.id !== id);
        handleSaveTable(updatedRows);
    };

    const handleUpdateRow = (id: string, field: string, value: any) => {
        const updatedRows = rows.map(r => {
            if (r.id === id) {
                let updatedValue = value;
                if (field === 'videos') {
                    // Auto-trim full URLs to video IDs
                    updatedValue = value.map((url: string) => getVideoId(url));
                }
                const updatedRow = { ...r, [field]: updatedValue };
                
                // Auto-expand to 2 videos for comparative type
                if (field === 'type' && value === 'comparative') {
                    if (updatedRow.videos.length < 2) {
                        updatedRow.videos = [...updatedRow.videos, ''];
                    }
                }
                
                if (field === 'videos') {
                    updatedRow.status = 'pending';
                    updatedRow.analysisId = null;
                }
                return updatedRow;
            }
            return r;
        });
        setRows(updatedRows);
    };

    const handleAnalyze = async (id: string) => {
        const row = rows.find(r => r.id === id);
        if (!row) return;

        setAnalyzingRowIds(prev => {
            const next = new Set(prev);
            next.add(id);
            return next;
        });
        // Auto-save table to ensure row exists in GCS
        await handleSaveTable();

        const videoUrl = row.videos[0];

        try {
            let result;
            if (row.type === 'abcd') {
                result = await analyzeAdVideo(videoUrl, companyName);
            } else if (row.type === 'website_analysis') {
                result = await analyzeWebsite(videoUrl, row.focus || 'General analysis', companyName);
            } else if (row.type === 'grounded_search') {
                result = await groundedSearch(videoUrl, companyName);
            } else if (row.type === 'youtube_sentiment' || row.type === 'sentiment_video' || row.type === 'sentiment_comments') {
                result = await analyzeYouTubeSentiment(videoUrl, companyName);
            } else if (row.type === 'fashion_analysis') {
                const { analyzeFashionTrends } = await import('../services/geminiService');
                result = await analyzeFashionTrends(videoUrl, companyName);
            } else if (row.type === 'trend_analysis') {
                const { analyzeGeneralTrends } = await import('../services/geminiService');
                result = await analyzeGeneralTrends(videoUrl, companyName);
            } else if (row.type === 'video_metadata') {
                const { extractVideoMetadata } = await import('../services/geminiService');
                result = await extractVideoMetadata(videoUrl, companyName);
            } else if (row.type === 'creator_partner') {
                const { analyzeCreatorPartnerVideo } = await import('../services/geminiService');
                result = await analyzeCreatorPartnerVideo(videoUrl, companyName);
            } else if (row.type === 'sentiment_comments') {
                const commentsRes = await fetch(`/api/youtube/comments?videoId=${getVideoId(videoUrl)}`);
                if (commentsRes.ok) {
                    const comments = await commentsRes.json();
                    result = await analyzeCommentsSentiment(comments, companyName);
                } else {
                    throw new Error("Failed to fetch comments.");
                }
            } else if (row.type === 'steam_reviews') {
                const reviewsRes = await fetch(`/api/steam/reviews?appId=${videoUrl}&maxReviews=250`);
                const contentType = reviewsRes.headers.get("content-type");
                if (reviewsRes.ok) {
                    if (contentType && contentType.includes("application/json")) {
                        const reviews = await reviewsRes.json();
                        result = await analyzeSteamReviews(reviews, companyName);
                    } else {
                        const text = await reviewsRes.text();
                        throw new Error(`Expected JSON from Steam reviews but received ${contentType}. Content: ${text.substring(0, 50)}`);
                    }
                } else {
                    throw new Error("Failed to fetch Steam reviews.");
                }
            } else if (row.type === 'trustpilot_sentiment') {
                let reviews = [];
                let business: any = {};
                try {
                    const trustpilotRes = await fetch(`/api/trustpilot/reviews?url=${encodeURIComponent(videoUrl)}&limit=500`);
                    const contentType = trustpilotRes.headers.get("content-type");
                    if (trustpilotRes.ok && contentType && contentType.includes("application/json")) {
                        const data = await trustpilotRes.json();
                        reviews = data.reviews || [];
                        business = data.business || {};
                    }
                } catch (tErr) {
                    console.warn("Trustpilot backend review fetch warning, falling back to Grounded Intelligence:", tErr);
                }
                result = await analyzeTrustpilotSentiment(reviews, companyName, business, videoUrl);
            } else if (
                row.type === 'reddit' || 
                (videoUrl && videoUrl.includes('reddit.com')) || 
                (typeof row.tag === 'string' && row.tag.includes('r/')) || 
                (typeof row.query === 'string' && row.query.toLowerCase().includes('reddit')) ||
                row.type === 'social_intelligence' || 
                row.type === 'social_feed'
            ) {
                // Route directly to independent Reddit analyzer (prevents spawning 6 heavy cross-channel agents)
                const queryInput = videoUrl || row.tag || row.query || 'EASportsFC';
                if (queryInput.includes('tiktok.com') || (typeof row.tag === 'string' && row.tag.startsWith('#'))) {
                    result = await analyzeTikTokSentiment(queryInput, companyName, row.focus || row.guidance || '');
                } else {
                    result = await analyzeRedditSentiment(queryInput, companyName, row.focus || row.guidance || '');
                }
            } else if (row.type === 'tiktok' || row.type === 'tiktok_hashtag' || (videoUrl && videoUrl.includes('tiktok.com'))) {
                const queryInput = videoUrl || row.tag || row.query || 'fc26';
                result = await analyzeTikTokSentiment(queryInput, companyName, row.focus || row.guidance || '');
            } else if (row.type === 'competitor_abcd') {
                result = await analyzeAdVideo(videoUrl, companyName, true);
            } else if (row.type === 'competitor_sentiment_video' || row.type === 'competitor_sentiment_comments' || row.type === 'competitor_youtube_sentiment') {
                result = await analyzeYouTubeSentiment(videoUrl, companyName, true);
            } else if (row.type === 'abcd_comparative' && row.videos.length >= 2) {
                console.log("ABCD Comparative branch entered!");
                console.log("Analyzing both videos concurrently...");
                const [res1, res2] = await Promise.all([
                    analyzeAdVideo(row.videos[0], companyName),
                    analyzeAdVideo(row.videos[1], companyName)
                ]);
                console.log("Res1 from analyzeAdVideo:", res1);
                console.log("Res2 from analyzeAdVideo:", res2);
                if (res1 && res2) {
                    console.log("Both analyses successful, calling generateCompetitiveAnalysis...");
                    const compResult = await generateCompetitiveAnalysis(res1, res2, companyName);
                    console.log("CompResult from generateCompetitiveAnalysis:", compResult);
                    result = {
                        ...compResult,
                        ad1: res1,
                        ad2: res2
                    };
                } else {
                    console.warn("One or both analyses failed!");
                }
            } else if (row.type === 'comparative' && row.videos.length >= 2) {
                console.log("General Comparative branch entered!");
                const { analyzeVideoInsights, generateGeneralComparison } = await import('../services/geminiService');
                console.log("Analyzing both videos for insights concurrently...");
                const [res1, res2] = await Promise.all([
                    analyzeVideoInsights(row.videos[0], companyName),
                    analyzeVideoInsights(row.videos[1], companyName)
                ]);
                
                if (res1 && res2) {
                    console.log("Both analyses successful, calling generateGeneralComparison...");
                    result = await generateGeneralComparison(res1, res2, companyName);
                } else {
                    console.warn("One or both analyses failed!");
                }
            } else {
                result = await analyzeAdVideo(videoUrl, companyName);
            }

            if (result) {
                const cleanId = String(id || '').replace(/[^a-zA-Z0-9_\-]/g, '_');
                const analysisId = `analysis_${cleanId}`;
                
                const saveRes = await fetch('/api/insights/analysis', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        companyName,
                        analysisId,
                        result: { ...result, type: row.type, videos: row.videos }
                    })
                });

                if (saveRes.ok) {
                    const currentRows = rowsRef.current;
                    const updatedRows = currentRows.map(r => r.id === id ? { ...r, status: 'completed', analysisId } : r);
                    await handleSaveTable(updatedRows);
                    showNotification("Analysis complete and saved to GCS!");
                } else {
                    alert("Failed to save analysis to GCS.");
                }
            } else {
                alert("Analysis produced no result.");
            }
        } catch (error) {
            console.error("Analysis failed:", error);
            alert("Analysis failed.");
        } finally {
            setAnalyzingRowIds(prev => {
                const next = new Set(prev);
                next.delete(id);
                return next;
            });
        }
    };

    const renderRow = (row: any) => {
        const videoId = getVideoId(row.videos[0]);
        const title = videoTitles[videoId] || 'Loading title...';
        return (
            <tr key={row.id} className="border-b border-white/10 hover:bg-white/5 transition-colors">
                <td className="p-2 text-center w-[150px]">
                    <div className="flex flex-col gap-1 items-center mx-auto">
                        {row.videos.map((vid: string, idx: number) => {
                            const isSocial = row.type === 'social_intelligence' || row.type === 'tiktok_hashtag' || row.type === 'social_feed';
                            const isReddit = row.type === 'reddit';
                            const id = isSocial || isReddit ? vid : (getVideoId(vid) || vid);
                            if (!id) return null;
                            const titleObj = videoTitles[id];
                            const redditDefaultTitle = vid.startsWith('r/') ? `Reddit: ${vid}` : `Reddit: r/${vid}`;
                            const itemTitle = typeof titleObj === 'object' ? titleObj.title : (titleObj || (isSocial ? `Social: ${id}` : isReddit ? redditDefaultTitle : 'Loading title...'));
                            
                            const redditImg = 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=500&auto=format&fit=crop&q=60';
                            const imageUrl = typeof titleObj === 'object' && titleObj.image 
                                ? titleObj.image 
                                : (row.type === 'trustpilot_sentiment' 
                                    ? 'https://cdn.trustpilot.net/brand-assets/4.3.0/favicons/apple-touch-icon.png' 
                                    : row.type === 'steam_reviews' 
                                    ? `https://shared.cloudflare.steamstatic.com/store_item_assets/steam/apps/${id}/header.jpg` 
                                    : row.type === 'reddit'
                                    ? redditImg
                                    : isSocial 
                                    ? 'https://images.unsplash.com/photo-1611162616475-46b635cb6868?w=500&auto=format&fit=crop&q=60' 
                                    : `https://img.youtube.com/vi/${id}/mqdefault.jpg`);

                            return (
                                <div key={idx} className="flex flex-col items-center gap-1">
                                    <div className="w-[120px] h-[68px] overflow-hidden rounded-xl border border-white/10 flex items-center justify-center bg-black/60">
                                        {row.type === 'grounded_search' ? (
                                            <Search size={32} className="text-gray-400" />
                                        ) : row.type === 'website_analysis' && (!titleObj?.image || titleObj.image === '/images/website_placeholder.png') ? (
                                            <Globe size={32} className="text-gray-400" />
                                        ) : (
                                            <img 
                                                src={imageUrl} 
                                                alt="Thumbnail" 
                                                onError={(e) => {
                                                    (e.target as HTMLImageElement).src = row.type === 'reddit' ? redditImg : 'https://images.unsplash.com/photo-1611162616475-46b635cb6868?w=500&auto=format&fit=crop&q=60';
                                                }}
                                                className="w-full h-full object-cover"
                                            />
                                        )}
                                    </div>
                                    <div className="text-[10px] text-slate-400 font-bold truncate max-w-[120px] text-center" title={itemTitle}>
                                        {itemTitle}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </td>
                <td className="p-2 text-center">
                    <div className="flex flex-row items-center gap-2">
                        {row.type === 'reddit' && <MessageSquare size={16} className="text-orange-500" />}
                        {(row.type === 'tiktok' || row.type === 'tiktok_hashtag') && <Music size={16} className="text-pink-500" />}
                        {row.type === 'abcd' && <Layers size={16} className="text-blue-500" />}
                        {(row.type === 'youtube_sentiment' || row.type === 'sentiment_video' || row.type === 'sentiment_comments') && <TrendingUp size={16} className="text-emerald-500" />}
                        {row.type === 'competitive' && <Eye size={16} className="text-amber-500" />}
                        {row.type === 'comparative' && <BarChart2 size={16} className="text-rose-500" />}
                        {row.type === 'steam_reviews' && <FileText size={16} className="text-orange-500" />}
                        {row.type === 'trustpilot_sentiment' && <Star size={16} className="text-[#00b67a] fill-[#00b67a]" />}
                        {row.type === 'tiktok_hashtag' && <Music size={16} className="text-pink-500" />}
                        {row.type === 'social_intelligence' && <Compass size={16} className="text-indigo-600" />}
                        {row.type === 'competitor_abcd' && <Layers size={16} className="text-red-500" />}
                        {row.type === 'competitor_sentiment_video' && <TrendingUp size={16} className="text-red-500" />}
                        {row.type === 'competitor_sentiment_comments' && <PieChartIcon size={16} className="text-red-500" />}
                        {row.type === 'trend_analysis' && <Globe size={16} className="text-violet-500" />}
                        
                        <select 
                            value={row.type} 
                            onChange={(e) => handleUpdateRow(row.id, 'type', e.target.value)}
                            className="p-2 bg-[#080A0E] text-white border border-white/15 rounded-xl mx-auto text-xs font-bold focus:outline-none focus:border-[#0AF468]"
                        >
                            {SUPPORTED_INSIGHT_TYPES.map(type => (
                                <option key={type.id} value={type.id}>{type.label}</option>
                            ))}
                        </select>
                    </div>
                </td>
                <td className="p-2 text-center">
                    {row.videos.map((vid: string, idx: number) => (
                        row.type === 'grounded_search' ? (
                            <textarea 
                                key={idx}
                                value={vid}
                                onChange={(e) => {
                                    const newVids = [...row.videos];
                                    newVids[idx] = e.target.value;
                                    handleUpdateRow(row.id, 'videos', newVids);
                                }}
                                placeholder="Enter your question here"
                                className="p-2 bg-[#080A0E] text-white border border-white/15 rounded-xl w-full mb-1 min-h-[60px] resize-y text-xs placeholder-slate-500 focus:outline-none focus:border-[#0AF468]"
                                rows={2}
                            />
                        ) : (
                            <input 
                                key={idx}
                                value={vid}
                                onChange={(e) => {
                                    const newVids = [...row.videos];
                                    newVids[idx] = e.target.value;
                                    handleUpdateRow(row.id, 'videos', newVids);
                                }}
                                placeholder={row.type === 'reddit' ? "Subreddit or Topic (e.g. r/EASportsFC or fc26)" : row.type === 'tiktok' || row.type === 'tiktok_hashtag' ? "TikTok Hashtag (e.g. #fc26)" : row.type === 'social_intelligence' ? "Social Query (e.g. fc26)" : row.type === 'trustpilot_sentiment' ? "Trustpilot URL (e.g. https://www.trustpilot.com/review/bathandbodyworks.com)" : row.type === 'website_analysis' ? "Website URL" : row.type === 'grounded_search' ? "Enter your question here" : "Video ID or URL"}
                                className="p-2 bg-[#080A0E] text-white border border-white/15 rounded-xl w-full mb-1 text-xs placeholder-slate-500 focus:outline-none focus:border-[#0AF468]"
                            />
                        )
                    ))}
                    {row.type === 'comparative' && row.videos.length < 2 && (
                        <button onClick={() => handleUpdateRow(row.id, 'videos', [...row.videos, ''])} className="text-blue-600 text-xs">+ Add Video</button>
                    )}
                    {row.type === 'website_analysis' && (
                        <div className="flex items-center gap-1 mt-1">
                            <Settings size={16} className="text-gray-500 flex-shrink-0" />
                            <input 
                                value={row.focus || ''}
                                onChange={(e) => handleUpdateRow(row.id, 'focus', e.target.value)}
                                placeholder="Focus (e.g. Rank of iShares)"
                                className="p-2 bg-[#080A0E] text-white border border-white/15 rounded-xl w-full text-xs placeholder-slate-500 focus:outline-none focus:border-[#0AF468]"
                            />
                        </div>
                    )}
                </td>
                <td className="p-2 text-center w-20">
                    <span className={`px-1.5 py-0.5 text-xs font-bold rounded-full ${row.status === 'completed' ? 'bg-[#00FF88]/20 text-[#00FF88] border border-[#00FF88]/40 font-mono' : 'bg-[#FFB800]/20 text-[#FFB800] border border-[#FFB800]/40 font-mono'}`}>
                        {row.status}
                    </span>
                </td>
                <td className="p-2 text-center">
                    <div className="flex flex-row items-center gap-1 mx-auto w-fit">
                        <button 
                            onClick={() => handleDeleteRow(row.id)} 
                            className="p-1 text-red-500 hover:bg-red-50 rounded-full transition-colors"
                            title="Delete Row"
                        >
                            <Trash2 size={16} />
                        </button>
                        
                        {row.status === 'pending' && (
                            <button 
                                onClick={() => handleAnalyze(row.id)} 
                                disabled={analyzingRowIds.has(row.id)}
                                className="p-1 text-[#349DD4] hover:bg-[#349DD4]/10 rounded-full transition-colors"
                                title="Analyze"
                            >
                                {analyzingRowIds.has(row.id) ? <Loader2 className="animate-spin" size={16} /> : <Play size={16} />}
                            </button>
                        )}
                        
                        {row.status === 'completed' && (
                            <>
                                <button 
                                    onClick={() => handleAnalyze(row.id)} 
                                    disabled={analyzingRowIds.has(row.id)}
                                    className="p-1 text-orange-500 hover:bg-orange-50 rounded-full transition-colors"
                                    title="Re-analyze"
                                >
                                    {analyzingRowIds.has(row.id) ? <Loader2 className="animate-spin" size={16} /> : <RotateCw size={16} />}
                                </button>
                                <button 
                                    onClick={() => onViewAnalysis(row.analysisId, row.videos)} 
                                    className="p-1 text-blue-500 hover:bg-blue-50 rounded-full transition-colors"
                                    title="View Analysis"
                                >
                                    <Eye size={16} />
                                </button>
                            </>
                        )}
                    </div>
                </td>
            </tr>
        );
    };

    if (isLoadingTable) return <div className="p-8 text-center">Loading table data...</div>;

    return (
        <div className="max-w-7xl mx-auto w-full px-6 py-12">
            <div className="content-card p-8 bg-[#0D131D]/90 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/10 text-white">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-white">{companyName} Video Insights</h2>
                    <div className="flex items-center gap-3">
                        {notification && (
                            <span className="text-green-600 font-bold text-sm animate-fadeIn">{notification}</span>
                        )}
                        <button onClick={() => { findInsightsModalState.isOpen = true; triggerModalUpdate(); }} className="btn-primary flex items-center gap-2">
                            <Search size={16} /> Find Insights
                        </button>
                        <button onClick={() => handleSaveTable()} className="btn-secondary flex items-center gap-2">
                            <Save size={16} /> Save Table
                        </button>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                        <thead>
                            <tr className="border-b border-white/10">
                                <th className="p-4 font-bold text-slate-300 text-center w-[240px]">Preview</th>
                                <th className="p-4 font-bold text-slate-300 text-center">Type</th>
                                <th className="p-4 font-bold text-slate-300 text-center">Video URL</th>
                                <th className="p-4 font-bold text-slate-300 text-center w-24">Status</th>
                                <th className="p-4 font-bold text-slate-300 text-center">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {(() => {
                                const socialIntelligenceRows = rows.filter(r => ['social_intelligence', 'tiktok_hashtag', 'tiktok'].includes(r.type));
                                const abcdRows = rows.filter(r => r.type === 'abcd');
                                const sentimentRows = rows.filter(r => ['sentiment_video', 'sentiment_comments', 'steam_reviews', 'trustpilot_sentiment'].includes(r.type));
                                const competitiveRows = rows.filter(r => ['competitive', 'comparative', 'competitor_abcd', 'competitor_sentiment_video', 'competitor_sentiment_comments', 'abcd_comparative'].includes(r.type));
                                const trendFashionRows = rows.filter(r => ['trend_analysis', 'fashion_analysis'].includes(r.type));
                                const searchWebsiteRows = rows.filter(r => ['grounded_search', 'website_analysis'].includes(r.type));
                                const metadataRows = rows.filter(r => r.type === 'video_metadata');
                                const otherRows = rows.filter(r => !['social_intelligence', 'tiktok_hashtag', 'tiktok', 'abcd', 'sentiment_video', 'sentiment_comments', 'steam_reviews', 'trustpilot_sentiment', 'competitive', 'comparative', 'competitor_abcd', 'competitor_sentiment_video', 'competitor_sentiment_comments', 'abcd_comparative', 'trend_analysis', 'fashion_analysis', 'grounded_search', 'website_analysis', 'video_metadata'].includes(r.type));
                                
                                return (
                                    <>
                                        {socialIntelligenceRows.length > 0 && (
                                            <>
                                                <tr className="bg-black/60 border-y border-white/10">
                                                    <td colSpan={5} className="p-3 font-bold text-[#00F0FF] uppercase text-xs tracking-wider font-mono">
                                                        <div className="flex items-center gap-2">
                                                            <Compass size={14} className="text-indigo-600" />
                                                            <span>Social & Community Intelligence (6-Agent Multi-Channel Pulse)</span>
                                                        </div>
                                                    </td>
                                                </tr>
                                                {socialIntelligenceRows.map(row => renderRow(row))}
                                            </>
                                        )}
                                        {abcdRows.length > 0 && (
                                            <>
                                                <tr className="bg-black/60 border-y border-white/10"><td colSpan={5} className="p-3 font-bold text-[#0AF468] uppercase text-xs tracking-wider">ABCD Creative Analysis</td></tr>
                                                {abcdRows.map(row => renderRow(row))}
                                            </>
                                        )}
                                        {sentimentRows.length > 0 && (
                                            <>
                                                <tr className="bg-black/60 border-y border-white/10"><td colSpan={5} className="p-3 font-bold text-[#00FF88] uppercase text-xs tracking-wider font-mono">Sentiment Analysis</td></tr>
                                                {sentimentRows.map(row => renderRow(row))}
                                            </>
                                        )}
                                        {competitiveRows.length > 0 && (
                                            <>
                                                <tr className="bg-black/60 border-y border-white/10"><td colSpan={5} className="p-3 font-bold text-[#FFB800] uppercase text-xs tracking-wider font-mono">Competitive Benchmarking</td></tr>
                                                {competitiveRows.map(row => renderRow(row))}
                                            </>
                                        )}
                                        {trendFashionRows.length > 0 && (
                                            <>
                                                <tr className="bg-black/60 border-y border-white/10"><td colSpan={5} className="p-3 font-bold text-violet-500 uppercase text-xs tracking-wider">Trend & Fashion Analysis</td></tr>
                                                {trendFashionRows.map(row => renderRow(row))}
                                            </>
                                        )}
                                        {searchWebsiteRows.length > 0 && (
                                            <>
                                                <tr className="bg-black/60 border-y border-white/10"><td colSpan={5} className="p-3 font-bold text-indigo-500 uppercase text-xs tracking-wider">Search & Website Analysis</td></tr>
                                                {searchWebsiteRows.map(row => renderRow(row))}
                                            </>
                                        )}
                                        {metadataRows.length > 0 && (
                                            <>
                                                <tr className="bg-black/60 border-y border-white/10"><td colSpan={5} className="p-3 font-bold text-pink-500 uppercase text-xs tracking-wider">Video Metadata Extraction</td></tr>
                                                {metadataRows.map(row => renderRow(row))}
                                            </>
                                        )}
                                        {otherRows.length > 0 && (
                                            <>
                                                <tr className="bg-black/60 border-y border-white/10"><td colSpan={5} className="p-3 font-bold text-gray-400 uppercase text-xs tracking-wider">Other Analysis</td></tr>
                                                {otherRows.map(row => renderRow(row))}
                                            </>
                                        )}
                                    </>
                                );
                            })()}
                        </tbody>
                    </table>
                <FindInsightsModal 
                    isOpen={findInsightsModalState.isOpen}
                    prompt={findInsightsModalState.prompt}
                    setPrompt={(val) => { findInsightsModalState.prompt = val; triggerModalUpdate(); }}
                    enableGroundedSearch={findInsightsModalState.enableGroundedSearch}
                    setEnableGroundedSearch={(val) => { findInsightsModalState.enableGroundedSearch = val; triggerModalUpdate(); }}
                    selectedContentTypes={findInsightsModalState.selectedContentTypes}
                    setSelectedContentTypes={(val) => { findInsightsModalState.selectedContentTypes = val; triggerModalUpdate(); }}
                    setIsOpen={(val) => { findInsightsModalState.isOpen = val; triggerModalUpdate(); }}
                    foundInsights={findInsightsModalState.foundInsights}
                    isFindingInsights={findInsightsModalState.isFindingInsights}
                    onRunSearch={() => handleRunFindInsights(companyName)}
                    companyName={companyName}
                />
                </div>
            </div>
            

        </div>
    );
}
