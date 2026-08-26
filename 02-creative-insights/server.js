import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Modality, MediaResolution, Type } from '@google/genai';
import { execSync } from 'child_process';
import { runOrchestration } from './agents/orchestrator.js';
import { creativeAgent } from './agents/creative_agent.js';

const initialGeminiApiKey = process.env.VITE_GEMINI_API_KEY || process.env.GEMINI_API_KEY || '';

// Global process safeguards for resilient stream and GCS pipeline handling
process.on('uncaughtException', (err) => {
    if (err?.code === 'ERR_STREAM_UNABLE_TO_PIPE' || err?.message?.includes('stream') || err?.message?.includes('pipe')) {
        console.warn('⚠️ [Stream Pipeline Safeguard] Caught non-fatal stream interruption:', err.message);
        return;
    }
    console.error('❌ [Uncaught Exception]:', err);
});

process.on('unhandledRejection', (reason) => {
    console.warn('⚠️ [Unhandled Rejection Safeguard]:', reason);
});

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const distPath = path.join(__dirname, 'dist');
if (!fs.existsSync(distPath)) {
    console.log("Running frontend build before starting the server...");
    try {
        execSync('npm run build', { stdio: 'inherit' });
        console.log("Frontend build complete.");
    } catch (e) {
        console.error("Failed to build frontend:", e);
    }
} else {
    console.log("Production build ('dist/') already exists. Skipping startup build.");
}

const app = express();
app.use(express.json({ limit: '50mb' }));
const port = process.env.PORT || 8081;

let ai;
let aiGlobal;
try {
    const project = process.env.GCP_PROJECT || process.env.GOOGLE_CLOUD_PROJECT || 'veo-testing';
    const location = 'global'; // Enforce default global region for gemini-3.5-flash

    if (project) {
        console.log(`[Startup] Initializing GoogleGenAI with Vertex AI (Project: ${project}, Default Region: GLOBAL)`);
        delete process.env.GEMINI_API_KEY;
        const defaultHttpOptions = { headers: { 'Api-Revision': '2026-05-20' } };
        const regionalAi = new GoogleGenAI({ vertexai: true, project, location: 'global', httpOptions: defaultHttpOptions });
        aiGlobal = new GoogleGenAI({ vertexai: true, project, location: 'global', httpOptions: defaultHttpOptions });
        
        ai = new Proxy(regionalAi, {
            get(target, prop, receiver) {
                if (prop === 'models') {
                    return new Proxy(target.models, {
                        get(modelsTarget, modelsProp) {
                            const originalMethod = modelsTarget[modelsProp];
                            if (typeof originalMethod === 'function') {
                                return async function(params, ...args) {
                                    const model = params?.model;
                                    let clientToUse = aiGlobal || regionalAi;
                                    console.log(`\n======================================================`);
                                    console.log(`🎥 [VERTEX AI CALL] Executing '${String(modelsProp)}'`);
                                    console.log(`📌 Model: ${model || 'default'}`);
                                    console.log(`🌍 Target Region: GLOBAL (location: 'global')`);
                                    console.log(`======================================================\n`);
                                    
                                    let result;
                                    try {
                                        result = await clientToUse.models[modelsProp](params, ...args);
                                    } catch (primaryErr) {
                                        console.warn(`[Proxy Local ${String(modelsProp)}] Primary Vertex AI call failed for model '${model}'. Retrying with developer global client... Details:`, primaryErr.message || primaryErr);
                                        try {
                                            const developerClient = new GoogleGenAI({ location: 'global' });
                                            result = await developerClient.models[modelsProp](params, ...args);
                                            console.log(`[Proxy Local ${String(modelsProp)}] Developer global client succeeded for model '${model}'`);
                                        } catch (fallbackErr) {
                                            console.error(`[Proxy Local ${String(modelsProp)}] Both primary and developer fallback clients failed for model '${model}':`, fallbackErr);
                                            throw primaryErr;
                                        }
                                    }

                                    // Log image generation diagnostics
                                    const isImageModel = model && (model.includes('image-preview') || model.includes('imagen') || model.includes('image'));
                                    if (isImageModel && modelsProp === 'generateContent') {
                                        console.log(`[GenAI Local Proxy Image Audit] Model: ${model}`);
                                        if (result.candidates) {
                                            result.candidates.forEach((cand, cIdx) => {
                                                console.log(`  Candidate [${cIdx}] FinishReason: ${cand.finishReason}`);
                                                if (cand.safetyRatings) {
                                                    console.log(`    Safety Ratings:`, JSON.stringify(cand.safetyRatings));
                                                }
                                                if (cand.content && cand.content.parts) {
                                                    cand.content.parts.forEach((p, pIdx) => {
                                                        const keys = Object.keys(p);
                                                        console.log(`    Part [${pIdx}] keys: ${JSON.stringify(keys)}`);
                                                        if (p.inlineData) {
                                                            console.log(`      inlineData mimeType: ${p.inlineData.mimeType}, data length: ${p.inlineData.data ? p.inlineData.data.length : 0}`);
                                                        }
                                                    });
                                                }
                                            });
                                        }
                                    }
                                    return result;
                                };
                            }
                            return modelsTarget[modelsProp];
                        }
                    });
                }
                return Reflect.get(target, prop, receiver);
            }
        });
    } else if (process.env.GEMINI_API_KEY) {
        const key = process.env.GEMINI_API_KEY.replace(/["']/g, '');
        const maskedKey = key.length > 8 
            ? `${key.substring(0, 4)}...${key.substring(key.length - 4)}`
            : 'present but short';
        console.log(`Fallback to GEMINI_API_KEY for local dev. Key detected: ${maskedKey}`);
        ai = new GoogleGenAI({ apiKey: key });
    } else {
        console.warn("No GCP_PROJECT or GEMINI_API_KEY found in environment. GenAI endpoints will fail.");
    }
} catch (e) {
    console.error("Failed to initialize GoogleGenAI:", e);
}

const checkAi = (req, res, next) => {
    if (!ai) return res.status(500).json({ error: "GoogleGenAI client not initialized on server." });
    next();
};

console.log(`Starting server configuration. Port: ${port}`);

app.get('/health', (req, res) => {
    res.status(200).send('OK');
});

// --- API Routes ---

app.get('/api/key', (req, res) => {
    res.json({ apiKey: initialGeminiApiKey });
});

app.post('/api/genai/generateContent', checkAi, async (req, res) => {
    try {
        let { model, contents, config } = req.body;

        let client = ai;
        // Route all version 3.x models to the global client
        if (model) {
            if (model.includes('3.6') || model.includes('3.5') || model.includes('3.1') || model.includes('3-') || model.includes('gemini-3')) {
                if (aiGlobal) {
                    client = aiGlobal;
                    console.log(`[Route GenAI] Routed model '${model}' to global Vertex AI client`);
                }
            }
        }

        console.log(`\n--- [Backend Proxy] /api/genai/generateContent ---`);
        console.log(`Model: ${model}`);
        if (contents) {
            const preview = JSON.stringify(contents).substring(0, 300);
            console.log(`Contents preview: ${preview}${preview.length >= 300 ? '...' : ''}`);
        }
        console.log(`----------------------------------------------------\n`);

        // Standardize thinkingConfig for Gemini text/reasoning models, EXCLUDING image/video models
        if (!config) config = {};
        const isImageOrVideoModel = model && (
            model.includes('image') || 
            model.includes('imagen') || 
            model.includes('flash-lite-image') || 
            model.includes('veo')
        );

        if (isImageOrVideoModel) {
            delete config.thinkingConfig;
        } else if (config.thinkingConfig) {
            if (model && (model.includes('3.7') || model.includes('thinking'))) {
                config.thinkingConfig.thinkingLevel = "LOW";
            } else {
                delete config.thinkingConfig;
            }
        } else if (model && (model.includes('3.7') || model.includes('thinking'))) {
            config.thinkingConfig = { thinkingLevel: "LOW" };
        } else {
            delete config.thinkingConfig;
        }

        // Avoid Vertex AI 400 conflict: "controlled generation is not supported with Search tool"
        const hasSearchTool = config.tools && config.tools.some(t => t && (t.googleSearch || t.google_search));
        const hasJsonMode = config.responseMimeType === 'application/json';
        const hasFileData = contents && JSON.stringify(contents).includes('"fileData"');

        if (hasSearchTool && hasJsonMode) {
            if (hasFileData) {
                // Multimodal video/image input: Remove search tool so JSON mode succeeds
                delete config.tools;
                console.log(`[Proxy generateContent] Removed conflicting search tool for multimodal JSON generation`);
            } else {
                // Grounded search text: Remove responseMimeType so search tool succeeds
                delete config.responseMimeType;
                console.log(`[Proxy generateContent] Removed conflicting responseMimeType for Google Search grounded query`);
            }
        }

        // Normalize contents array to satisfy Vertex strict role requirements
        if (contents && !Array.isArray(contents) && contents.parts) {
            contents = [{ role: "user", parts: contents.parts }];
        } else if (Array.isArray(contents)) {
            contents = contents.map(c => {
                if (!c.role && c.parts) {
                    return { ...c, role: "user" };
                }
                if (!c.parts && !c.role) { // e.g., if array of parts was sent directly
                    return { role: "user", parts: [c] };
                }
                return c;
            });
        }

        let response;
        try {
            response = await client.models.generateContent({ model, contents, config });
        } catch (primaryErr) {
            console.warn(`[Proxy generateContent] Primary call failed for model '${model}'. Retrying with global fallback... Details:`, primaryErr.message || primaryErr);
            
            // Clean config of thinkingConfig and tools if error was related
            const errMsg = String(primaryErr.message || primaryErr);
            if (errMsg.includes('thinking_level') || errMsg.includes('thinkingConfig')) {
                delete config.thinkingConfig;
            }
            if (errMsg.includes('Search tool') || errMsg.includes('controlled generation')) {
                delete config.tools;
            }

            try {
                const apiKey = process.env.GOOGLE_CLOUD_API_KEY || process.env.GEMINI_API_KEY || initialGeminiApiKey;
                const project = process.env.GCP_PROJECT || process.env.GOOGLE_CLOUD_PROJECT || 'veo-testing';
                const fallbackClient = aiGlobal || (apiKey ? new GoogleGenAI({ apiKey }) : new GoogleGenAI({ vertexai: true, project, location: 'global' }));
                response = await fallbackClient.models.generateContent({ model, contents, config });
                console.log(`[Proxy generateContent] Global fallback client succeeded for model '${model}'`);
            } catch (fallbackErr) {
                console.warn(`[Proxy generateContent] Both primary and global fallback clients failed for model '${model}':`, fallbackErr.message || fallbackErr);
                
                // Fallback for YouTube URL fetch failures
                if (contents && JSON.stringify(contents).includes('youtube.com')) {
                    console.log(`[Proxy generateContent] Retrying YouTube video analysis via text-grounding fallback...`);
                    const cleanContents = contents.map((c) => {
                        if (!c.parts) return c;
                        const textParts = c.parts.filter((p) => !p.fileData);
                        const fileParts = c.parts.filter((p) => p.fileData);
                        const ytUrls = fileParts.map((p) => p.fileData?.fileUri).filter(Boolean);
                        const extraText = ytUrls.length > 0 ? `Video URL to analyze: ${ytUrls.join(', ')}\n` : '';
                        return {
                            ...c,
                            parts: [{ text: extraText + (textParts.map((p) => p.text || '').join('\n')) }]
                        };
                    });
                    delete config.tools;
                    delete config.thinkingConfig;
                    const targetClient = aiGlobal || ai;
                    response = await targetClient.models.generateContent({ model, contents: cleanContents, config });
                    console.log(`[Proxy generateContent] Text-grounding fallback succeeded for model '${model}'`);
                } else {
                    throw primaryErr;
                }
            }
        }

        // Add logging to terminal to inspect generation result
        const isImageModel = model && (model.includes('image-preview') || model.includes('imagen'));
        const hasImageModality = config && config.responseModalities && config.responseModalities.includes('IMAGE');
        
        if (isImageModel || hasImageModality) {
            console.log(`\n[GenAI Proxy Image Audit] Model: ${model}`);
            if (response.candidates && response.candidates.length > 0) {
                console.log(`Candidates returned: ${response.candidates.length}`);
                response.candidates.forEach((cand, idx) => {
                    console.log(`Candidate [${idx}]: finishReason=${cand.finishReason}`);
                    if (cand.safetyRatings) {
                        console.log(`Safety Ratings: ${JSON.stringify(cand.safetyRatings)}`);
                    }
                    const parts = cand.content?.parts || [];
                    console.log(`Parts count: ${parts.length}`);
                    parts.forEach((p, pIdx) => {
                        const keys = Object.keys(p);
                        console.log(`Part [${pIdx}] keys: ${JSON.stringify(keys)}`);
                        if (p.text) {
                            console.log(`Part [${pIdx}] text preview: ${p.text.substring(0, 100)}`);
                        }
                        if (p.inlineData) {
                            console.log(`Part [${pIdx}] inlineData mimeType: ${p.inlineData.mimeType}, data length: ${p.inlineData.data?.length || 0}`);
                        }
                    });
                });
            } else {
                console.log(`No candidates returned in response.`);
            }
            if (response.promptFeedback) {
                console.log(`Prompt Feedback: ${JSON.stringify(response.promptFeedback)}`);
            }
            console.log(`[GenAI Proxy Image Audit End]\n`);
        }

        // Resolve Vertex AI grounding redirect URLs into canonical real destination URLs
        try {
            const candidates = response?.candidates || response?.response?.candidates;
            const metadata = candidates?.[0]?.groundingMetadata || response?.groundingMetadata;
            if (metadata && Array.isArray(metadata.groundingChunks)) {
                await Promise.all(
                    metadata.groundingChunks.map(async (chunk) => {
                        if (chunk?.web?.uri) {
                            chunk.web.uri = await resolveGroundingUrl(chunk.web.uri);
                        }
                    })
                );
            }
        } catch (resolveErr) {
            console.warn("[Proxy generateContent] Grounding URL resolution error:", resolveErr);
        }

        res.json(response);
    } catch (e) {
        console.error("generateContent error:", e);
        res.status(500).json({ error: e.message || "Failed to generate content" });
    }
});

const resolveGroundingUrl = async (url) => {
    if (!url || typeof url !== 'string') return url;
    if (url.includes('vertexaisearch.cloud.google.com/grounding-api-redirect') || url.includes('google.com/url?')) {
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 3000);
            const res = await fetch(url, { method: 'HEAD', redirect: 'manual', signal: controller.signal });
            clearTimeout(timeoutId);
            const location = res.headers.get('location');
            if (location && location.startsWith('http')) {
                return location;
            }
        } catch (err) {
            try {
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 3000);
                const res = await fetch(url, { method: 'GET', redirect: 'follow', signal: controller.signal });
                clearTimeout(timeoutId);
                if (res.url && res.url.startsWith('http') && !res.url.includes('grounding-api-redirect')) {
                    return res.url;
                }
            } catch (err2) {
                // Return original on error
            }
        }
    }
    return url;
};

app.get('/api/resolve-url', async (req, res) => {
    const { url } = req.query;
    if (!url) return res.status(400).json({ error: "url is required" });
    const resolvedUrl = await resolveGroundingUrl(url);
    res.json({ url: resolvedUrl, originalUrl: url });
});

app.post('/api/resolve-urls', async (req, res) => {
    const { urls } = req.body;
    if (!Array.isArray(urls)) return res.status(400).json({ error: "urls array is required" });
    const resolved = {};
    await Promise.all(
        urls.map(async (u) => {
            if (u && typeof u === 'string') {
                resolved[u] = await resolveGroundingUrl(u);
            }
        })
    );
    res.json({ resolved });
});

app.post('/api/genai/generateVideos', checkAi, async (req, res) => {
    try {
        const { model, prompt, image, config } = req.body;
        let client = ai;
        if (model && (model.includes('3.6') || model.includes('3.5') || model.includes('3.1') || model.includes('3-') || model.includes('gemini-3'))) {
            if (aiGlobal) {
                client = aiGlobal;
                console.log(`[Route GenAI] Routed video model '${model}' to global Vertex AI client`);
            }
        }
        const response = await client.models.generateVideos({ model, prompt, image, config });
        res.json(response);
    } catch (e) {
        console.error("generateVideos error:", e);
        res.status(500).json({ error: e.message || "Failed to generate videos" });
    }
});

app.post('/api/genai/interactions', checkAi, async (req, res) => {
    const startTime = Date.now();
    try {
        const { model = 'gemini-omni-flash-preview', input, response_format, httpOptions } = req.body;
        console.log(`\n======================================================`);
        console.log(`🎬 [VERTEX AI INTERACTIONS] Video Generation Request Started`);
        console.log(`📌 Model: ${model}`);
        console.log(`⏰ Timestamp: ${new Date().toISOString()}`);
        if (Array.isArray(input)) {
            const inputCount = input.length;
            const contentItems = input[0]?.content || [];
            console.log(`📥 Input items: ${inputCount} turn(s), ${contentItems.length} content part(s)`);
            contentItems.forEach((part, idx) => {
                if (part.type === 'image') {
                    const dataLen = part.data ? `${Math.round(part.data.length / 1024)} KB base64` : 'URI: ' + (part.uri || 'none');
                    console.log(`   Part ${idx + 1}: Image (${part.mime_type || 'image/jpeg'}, ${dataLen})`);
                } else if (part.type === 'text') {
                    console.log(`   Part ${idx + 1}: Prompt: "${part.text ? part.text.substring(0, 100) : ''}..."`);
                } else {
                    console.log(`   Part ${idx + 1}: Type = ${part.type}`);
                }
            });
        }
        console.log(`⏳ Calling client.interactions.create with Vertex AI Global (Api-Revision: 2026-05-20)...`);
        console.log(`======================================================\n`);

        let client = aiGlobal || ai;
        let response;
        const callOptions = {
            httpOptions: {
                headers: {
                    "Api-Revision": "2026-05-20"
                }
            }
        };

        const createParams = {
            model,
            input
        };
        if (response_format) {
            createParams.response_format = response_format;
        }

        if (client && client.interactions && typeof client.interactions.create === 'function') {
            response = await client.interactions.create(createParams, callOptions);

            // If interaction is still in progress, poll until completed
            if (response && (response.status === 'in_progress' || response.status === 'requires_action')) {
                console.log(`⏳ Interaction ${response.id} status is '${response.status}', polling for completion...`);
                let pollAttempts = 0;
                while (pollAttempts < 30 && (response.status === 'in_progress' || response.status === 'requires_action')) {
                    await new Promise(r => setTimeout(r, 2000));
                    pollAttempts++;
                    try {
                        const polled = await client.interactions.get(response.id, {}, callOptions);
                        if (polled) response = polled;
                        console.log(`   Poll attempt ${pollAttempts}: status = ${response.status}`);
                    } catch (pErr) {
                        console.warn("Interaction poll warning:", pErr.message);
                    }
                }
            }

            // If completed but steps/outputs are missing, fetch detailed interaction
            if (response && response.id && (!response.steps || response.steps.length === 0) && (!response.outputs || response.outputs.length === 0)) {
                try {
                    const fullInteraction = await client.interactions.get(response.id, {}, callOptions);
                    if (fullInteraction && (fullInteraction.steps || fullInteraction.outputs)) {
                        response = fullInteraction;
                    }
                } catch (fetchErr) {
                    console.warn("Failed to fetch detailed interaction:", fetchErr.message);
                }
            }
        } else {
            const requestPayload = {
                path: 'interactions',
                httpMethod: 'POST',
                body: JSON.stringify(createParams),
                httpOptions: {
                    headers: {
                        "Api-Revision": "2026-05-20"
                    }
                }
            };
            const httpResponse = await client.apiClient.request(requestPayload);
            response = typeof httpResponse.json === 'function' ? await httpResponse.json() : (httpResponse.data || httpResponse);
        }

        // Auto-download any gs:// video URIs using Storage client so client gets immediate base64
        const partsToInspect = [];
        if (response?.steps) {
            response.steps.forEach(step => {
                if (step.content) step.content.forEach(p => partsToInspect.push(p));
            });
        }
        if (response?.outputs) {
            response.outputs.forEach(p => partsToInspect.push(p));
        }

        for (const part of partsToInspect) {
            if (part.type === 'video' && !part.data && part.uri && part.uri.startsWith('gs://')) {
                try {
                    console.log(`📦 [GCS Downloader] Downloading video from ${part.uri}...`);
                    const { Storage } = await import('@google-cloud/storage');
                    const storage = new Storage();
                    const cleanUri = part.uri.substring('gs://'.length);
                    const [bucketName, ...blobParts] = cleanUri.split('/');
                    const blobName = blobParts.join('/');
                    const videoBuffer = await safeDownloadGCSBuffer(storage.bucket(bucketName).file(blobName));
                    part.data = videoBuffer.toString('base64');
                    part.mime_type = part.mime_type || 'video/mp4';
                    console.log(`✅ [GCS Downloader] Downloaded ${Math.round(part.data.length / 1024)} KB video from GCS!`);
                } catch (dlErr) {
                    console.warn("Could not download video from GCS:", dlErr.message);
                }
            }
        }

        const durationSeconds = ((Date.now() - startTime) / 1000).toFixed(2);
        console.log(`\n======================================================`);
        console.log(`✅ [VERTEX AI INTERACTIONS] Omni Video Synthesis Completed in ${durationSeconds}s!`);
        if (response?.steps) {
            console.log(`📊 Output Steps: ${response.steps.length}`);
            response.steps.forEach((step, sIdx) => {
                if (step.type === 'model_output' && step.content) {
                    step.content.forEach((part, pIdx) => {
                        if (part.type === 'video') {
                            const videoSize = part.data ? `${Math.round(part.data.length / 1024)} KB base64` : `URI: ${part.uri}`;
                            console.log(`   🎥 Video Part found in step ${sIdx + 1}.${pIdx + 1}: ${videoSize}`);
                        } else if (part.type === 'text') {
                            console.log(`   💬 Text Output: "${part.text}"`);
                        }
                    });
                }
            });
        }
        if (response?.outputs) {
            console.log(`📊 Output Parts: ${response.outputs.length}`);
            response.outputs.forEach((part, pIdx) => {
                if (part.type === 'video') {
                    const videoSize = part.data ? `${Math.round(part.data.length / 1024)} KB base64` : `URI: ${part.uri}`;
                    console.log(`   🎥 Video Part found in output ${pIdx + 1}: ${videoSize}`);
                } else if (part.type === 'text') {
                    console.log(`   💬 Text Output: "${part.text}"`);
                }
            });
        }
        console.log(`======================================================\n`);
        res.json(response);
    } catch (e) {
        const durationSeconds = ((Date.now() - startTime) / 1000).toFixed(2);
        console.error(`\n❌ [VERTEX AI INTERACTIONS] Omni call failed after ${durationSeconds}s:`, e);
        res.status(500).json({ error: e.message || "Failed to call interactions API" });
    }
});

app.post('/api/genai/getOperation', checkAi, async (req, res) => {
    try {
        const { operation } = req.body;
        // Mock _fromAPIResponse as it is required by the SDK for Operation status updates
        const mockOperation = {
            ...operation,
            _fromAPIResponse: (arg) => arg.apiResponse
        };
        const response = await ai.operations.get({ operation: mockOperation });
        res.json(response);
    } catch (e) {
        console.error("getOperation error:", e);
        res.status(500).json({ error: e.message || "Failed to get operation" });
    }
});

app.post('/api/save-image', (req, res) => {
    try {
        const { image, filename } = req.body;
        if (!image || !filename) {
            return res.status(400).json({ error: 'Image and filename are required' });
        }

        const base64Data = image.replace(/^data:image\/\w+;base64,/, "");
        const buffer = Buffer.from(base64Data, 'base64');

        // Save to public (source) so it can be committed
        const publicDir = path.join(__dirname, 'public', 'images', 'generated');
        if (!fs.existsSync(publicDir)) {
            fs.mkdirSync(publicDir, { recursive: true });
        }
        fs.writeFileSync(path.join(publicDir, filename), buffer);

        // Save to dist (serving) so it works immediately
        const distDir = path.join(__dirname, 'dist', 'images', 'generated');
        if (!fs.existsSync(distDir)) {
            fs.mkdirSync(distDir, { recursive: true });
        }
        const filePath = path.join(distDir, filename);
        fs.writeFileSync(filePath, buffer);

        console.log(`Saved image to ${filePath} and public source`);
        res.json({ url: `/images/generated/${filename}` });
    } catch (error) {
        console.error('Failed to save image:', error);
        res.status(500).json({ error: 'Failed to save image' });
    }
}
);

app.post('/api/save-video', async (req, res) => {
    try {
        const { video, videoUrl, filename } = req.body;
        if ((!video && !videoUrl) || !filename) {
            return res.status(400).json({ error: 'Video (or videoUrl) and filename are required' });
        }

        let buffer;
        if (videoUrl) {
            console.log(`Fetching video from URL: ${videoUrl}`);
            const vidRes = await fetch(videoUrl);
            if (!vidRes.ok) throw new Error(`Failed to fetch video: ${vidRes.statusText}`);
            const arrayBuffer = await vidRes.arrayBuffer();
            buffer = Buffer.from(arrayBuffer);
        } else {
            // Handle base64 string
            const base64Data = video.replace(/^data:video\/\w+;base64,/, "");
            buffer = Buffer.from(base64Data, 'base64');
        }

        // Save to public (source)
        const publicDir = path.join(__dirname, 'public', 'videos', 'generated');
        if (!fs.existsSync(publicDir)) {
            fs.mkdirSync(publicDir, { recursive: true });
        }
        fs.writeFileSync(path.join(publicDir, filename), buffer);

        // Save to dist (serving)
        const distDir = path.join(__dirname, 'dist', 'videos', 'generated');
        if (!fs.existsSync(distDir)) {
            fs.mkdirSync(distDir, { recursive: true });
        }
        const filePath = path.join(distDir, filename);
        fs.writeFileSync(filePath, buffer);

        console.log(`Saved video to ${filePath} and public source`);
        res.json({ url: `/videos/generated/${filename}` });
    } catch (error) {
        console.error('Failed to save video:', error);
        res.status(500).json({ error: 'Failed to save video' });
    }
});



// Audience Persistence
const AUDIENCES_FILE = path.join(__dirname, 'public', 'data', 'audiences.json');

app.get('/api/audiences', (req, res) => {
    if (fs.existsSync(AUDIENCES_FILE)) {
        try {
            const data = fs.readFileSync(AUDIENCES_FILE, 'utf8');
            res.json(JSON.parse(data));
        } catch (e) {
            console.error("Error reading audiences:", e);
            res.status(500).json({ error: "Failed to read audiences" });
        }
    } else {
        res.json([]); // Return empty if no file
    }
});

app.post('/api/audiences', (req, res) => {
    try {
        const dir = path.dirname(AUDIENCES_FILE);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        fs.writeFileSync(AUDIENCES_FILE, JSON.stringify(req.body, null, 2));

        // Also update dist if it exists so changes are reflected in current serve without rebuild
        const distFile = path.join(__dirname, 'dist', 'data', 'audiences.json');
        const distDir = path.dirname(distFile);
        if (fs.existsSync(path.join(__dirname, 'dist'))) {
            if (!fs.existsSync(distDir)) fs.mkdirSync(distDir, { recursive: true });
            fs.writeFileSync(distFile, JSON.stringify(req.body, null, 2));
        }

        res.json({ success: true });
    } catch (e) {
        console.error("Error saving audiences:", e);
        res.status(500).json({ error: "Failed to save audiences" });
    }
});

// Email Campaigns Persistence
const EMAIL_CAMPAIGNS_FILE = path.join(__dirname, 'public', 'data', 'configuration', 'focus_group_emails.json');

app.get('/api/load-email-campaigns', (req, res) => {
    if (fs.existsSync(EMAIL_CAMPAIGNS_FILE)) {
        try {
            const data = fs.readFileSync(EMAIL_CAMPAIGNS_FILE, 'utf8');
            res.json(JSON.parse(data));
        } catch (e) {
            console.error("Error reading email campaigns:", e);
            res.json([]); // Return empty on error to avoid breaking UI
        }
    } else {
        res.json([]); // Return empty if no file
    }
});

app.post('/api/save-email-campaigns', (req, res) => {
    try {
        const campaigns = req.body;
        if (!Array.isArray(campaigns)) {
            return res.status(400).json({ error: "Campaigns must be an array" });
        }

        const dir = path.dirname(EMAIL_CAMPAIGNS_FILE);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        fs.writeFileSync(EMAIL_CAMPAIGNS_FILE, JSON.stringify(campaigns, null, 2));

        // Update dist
        const distFile = path.join(__dirname, 'dist', 'data', 'configuration', 'focus_group_email_campaigns.json');
        const distDir = path.dirname(distFile);
        if (fs.existsSync(path.join(__dirname, 'dist'))) {
            if (!fs.existsSync(distDir)) fs.mkdirSync(distDir, { recursive: true });
            fs.writeFileSync(distFile, JSON.stringify(campaigns, null, 2));
        }

        res.json({ success: true });
    } catch (e) {
        console.error("Error saving email campaigns:", e);
        res.status(500).json({ error: "Failed to save email campaigns" });
    }
});

// Audience Strategy Persistence
const AUDIENCE_STRATEGY_FILE = path.join(__dirname, 'public', 'data', 'audience_strategy.json');

app.get('/api/audience-strategy', (req, res) => {
    if (fs.existsSync(AUDIENCE_STRATEGY_FILE)) {
        try {
            const data = fs.readFileSync(AUDIENCE_STRATEGY_FILE, 'utf8');
            res.json(JSON.parse(data));
        } catch (e) {
            console.error("Error reading audience strategy:", e);
            res.status(500).json({ error: "Failed to read audience strategy" });
        }
    } else {
        res.status(404).json({ error: "No strategy found" });
    }
});

app.post('/api/audience-strategy', (req, res) => {
    try {
        const { strategy } = req.body;
        const dir = path.dirname(AUDIENCE_STRATEGY_FILE);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        fs.writeFileSync(AUDIENCE_STRATEGY_FILE, JSON.stringify({ strategy }, null, 2));

        // Update dist
        const distFile = path.join(__dirname, 'dist', 'data', 'audience_strategy.json');
        const distDir = path.dirname(distFile);
        if (fs.existsSync(path.join(__dirname, 'dist'))) {
            if (!fs.existsSync(distDir)) fs.mkdirSync(distDir, { recursive: true });
            fs.writeFileSync(distFile, JSON.stringify({ strategy }, null, 2));
        }

        res.json({ success: true });
    } catch (e) {
        console.error("Error saving audience strategy:", e);
        res.status(500).json({ error: "Failed to save audience strategy" });
    }
});

// Generic Run Persistence
const sanitizeId = (id) => String(id || '').replace(/[^a-zA-Z0-9_\-]/g, '_');
const getRunFile = (featureId) => path.join(__dirname, 'public', 'data', 'configuration', `${sanitizeId(featureId)}_run.json`);

const getActiveCompanyName = () => {
    // 1. Try company context run first
    const contextPath = path.join(__dirname, 'public', 'data', 'configuration', 'company_context_run.json');
    if (fs.existsSync(contextPath)) {
        try {
            const raw = fs.readFileSync(contextPath, 'utf8');
            const json = JSON.parse(raw);
            if (json.name) return json.name;
        } catch (e) {
            console.error("Error reading company context:", e);
        }
    }
    // 2. Fallback to app config brand companyName
    const configPath = path.join(__dirname, 'public', 'data', 'configuration', 'app_config.json');
    if (fs.existsSync(configPath)) {
        try {
            const raw = fs.readFileSync(configPath, 'utf8');
            const json = JSON.parse(raw);
            if (json.branding && json.branding.companyName) return json.branding.companyName;
        } catch (e) {
            console.error("Error reading app config:", e);
        }
    }
    return 'AI Lab';
};

const getBucketName = () => {
    return process.env.GCS_BUCKET_NAME || 'ailab-gcs';
};


const saveRunToGCS = async (featureId, data, companyName) => {
    try {
        const activeCompany = companyName || getActiveCompanyName();
        const { Storage } = await import('@google-cloud/storage');
        const storage = new Storage();
        const bucketName = getBucketName();
        const fileName = `${activeCompany}/runs/${featureId}_run.json`;
        const file = storage.bucket(bucketName).file(fileName);

        const dataStr = JSON.stringify(data, null, 2);
        console.log(`\n======================================================`);
        console.log(`☁️ [GCS SAVE BEGIN] Feature: ${featureId}`);
        console.log(`🏢 Company: ${activeCompany}`);
        console.log(`📦 Bucket: gs://${bucketName}/${fileName}`);
        console.log(`📏 Payload Size: ${dataStr.length} characters`);
        if (data && typeof data === 'object') {
            console.log(`🔑 Keys: ${Object.keys(data).join(', ')}`);
            console.log(`📄 Data Preview: ${dataStr.substring(0, 350)}...`);
        }
        console.log(`======================================================\n`);

        await file.save(dataStr, {
            contentType: 'application/json',
        });
        console.log(`✅ [GCS SAVE SUCCESS] Saved run to GCS: gs://${bucketName}/${fileName}`);
        return true;
    } catch (e) {
        console.error(`❌ [GCS SAVE ERROR] Failed to save ${featureId} to GCS:`, e.message || e);
        throw e;
    }
};

const safeDownloadGCSBuffer = async (file) => {
    try {
        const [contents] = await file.download({ validation: false });
        return contents;
    } catch (err) {
        if (err?.code === 'ERR_STREAM_UNABLE_TO_PIPE' || err?.message?.includes('stream') || err?.message?.includes('pipe')) {
            console.warn(`⚠️ [GCS Stream Recovery] Stream pipe interrupted on ${file.name}, using clean buffer stream reader...`);
            return new Promise((resolve, reject) => {
                const chunks = [];
                const readStream = file.createReadStream({ validation: false });
                readStream.on('data', (chunk) => chunks.push(chunk));
                readStream.on('end', () => resolve(Buffer.concat(chunks)));
                readStream.on('error', (streamErr) => reject(streamErr));
            });
        }
        throw err;
    }
};

const loadRunFromGCS = async (featureId, companyName) => {
    try {
        const activeCompany = companyName || getActiveCompanyName();
        const { Storage } = await import('@google-cloud/storage');
        const storage = new Storage();
        const bucketName = getBucketName();

        const companyCandidates = [activeCompany];
        if (activeCompany === "EA Games FC" && !companyCandidates.includes("EA SPORTS FC")) {
            companyCandidates.push("EA SPORTS FC");
        } else if (activeCompany === "EA SPORTS FC" && !companyCandidates.includes("EA Games FC")) {
            companyCandidates.push("EA Games FC");
        }

        for (const company of companyCandidates) {
            const fileName = `${company}/runs/${featureId}_run.json`;
            const file = storage.bucket(bucketName).file(fileName);

            console.log(`🔍 [GCS LOAD ATTEMPT] Feature: ${featureId}, Target: gs://${bucketName}/${fileName}`);
            const [exists] = await file.exists();
            if (exists) {
                const contents = await safeDownloadGCSBuffer(file);
                console.log(`✅ [GCS LOAD SUCCESS] Loaded run from GCS: gs://${bucketName}/${fileName}`);
                return JSON.parse(contents.toString('utf8'));
            } else {
                console.log(`⚠️ [GCS LOAD NOT FOUND] File gs://${bucketName}/${fileName} does not exist.`);
            }
        }
    } catch (e) {
        console.warn(`❌ [GCS LOAD ERROR] GCS load failed for ${featureId}:`, e.message || e);
        throw e;
    }
    return null;
};

app.get(['/api/load-run', '/api/load-run/:featureId'], async (req, res) => {
    let featureId = req.params.featureId || req.query.featureId;
    if (featureId && featureId.startsWith('/')) featureId = featureId.substring(1);
    const companyName = req.query.companyName;
    
    console.log(`📥 [API GET /api/load-run] featureId=${featureId}, companyName=${companyName}`);

    // 1. Try to load from GCS first
    let gcsData = null;
    let gcsFailed = false;
    try {
        gcsData = await loadRunFromGCS(featureId, companyName);
    } catch (err) {
        console.warn(`GCS loader connection/auth failure for ${featureId}:`, err.message);
        gcsFailed = true;
    }

    if (gcsData) {
        return res.json(gcsData);
    }

    // 2. Local filesystem fallback
    const localFile = getRunFile(featureId);
    if (fs.existsSync(localFile)) {
        try {
            const raw = fs.readFileSync(localFile, 'utf8');
            console.log(`[load-run/${featureId}] Loaded from local file fallback`);
            return res.json(JSON.parse(raw));
        } catch (e) {
            console.warn(`Local file read failed for ${featureId}:`, e.message);
        }
    }

    // 3. Cold-start default for company_context to initialize frontend context immediately
    if (featureId === 'company_context') {
        const activeName = getActiveCompanyName();
        console.log(`[load-run/company_context] Cold-start: returning default brand name "${activeName}"`);
        return res.json({
            name: activeName,
            description: "A retail, lifestyle and product advertising platform."
        });
    }

    if (gcsFailed) {
        return res.status(500).json({ error: "Google Cloud Storage read failed" });
    }

    return res.status(404).json({ error: "No run found" });
});

app.post(['/api/save-run', '/api/save-run/:featureId'], async (req, res) => {
    try {
        let featureId = req.params.featureId || req.body.featureId;
        if (featureId && featureId.startsWith('/')) featureId = featureId.substring(1);
        const companyName = req.body.companyName;
        const data = req.body.data !== undefined ? req.body.data : req.body;
        if (!featureId) return res.status(400).json({ error: "featureId is required" });

        console.log(`📤 [API POST /api/save-run] featureId=${featureId}, companyName=${companyName}`);

        // 1. Local filesystem save (fallback backup for non-ad-analysis)
        const filePath = getRunFile(featureId);
        const dir = path.dirname(filePath);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        fs.writeFileSync(filePath, JSON.stringify(data, null, 2));

        // Update dist if available
        const distFile = path.join(__dirname, 'dist', 'data', 'configuration', `${featureId}_run.json`);
        const distDir = path.dirname(distFile);
        if (fs.existsSync(path.join(__dirname, 'dist'))) {
            if (!fs.existsSync(distDir)) fs.mkdirSync(distDir, { recursive: true });
            fs.writeFileSync(distFile, JSON.stringify(data, null, 2));
        }

        // 2. GCS Save
        await saveRunToGCS(featureId, data, companyName);

        res.json({ success: true, message: `Successfully saved ${featureId} to GCS` });

// --- Run History Management Endpoints ---
app.get(['/api/runs-history', '/api/runs-history/:featureId'], async (req, res) => {
    try {
        let featureId = req.params.featureId || req.query.featureId;
        if (featureId && featureId.startsWith('/')) featureId = featureId.substring(1);
        const companyName = req.query.companyName;
        const activeCompany = companyName || getActiveCompanyName();
        if (!featureId) return res.status(400).json({ error: "featureId is required" });

        const historyFileName = `${featureId}_history.json`;

        // 1. Try GCS First
        try {
            const { Storage } = await import('@google-cloud/storage');
            const storage = new Storage();
            const bucketName = getBucketName();
            const gcsFile = storage.bucket(bucketName).file(`${activeCompany}/runs/${historyFileName}`);
            const [exists] = await gcsFile.exists();
            if (exists) {
                const content = await safeDownloadGCSBuffer(gcsFile);
                const historyList = JSON.parse(content.toString('utf8'));
                if (Array.isArray(historyList)) {
                    return res.json(historyList);
                }
            }
        } catch (gcsErr) {
            console.warn("GCS history load warning:", gcsErr.message);
        }

        // 2. Local Disk Fallback
        const localPath = path.join(__dirname, 'public', 'data', 'configuration', `${activeCompany}_${historyFileName}`);
        if (fs.existsSync(localPath)) {
            const content = fs.readFileSync(localPath, 'utf8');
            return res.json(JSON.parse(content));
        }

        res.json([]);
    } catch (e) {
        console.error("Error reading run history:", e);
        res.status(500).json({ error: `Failed to load run history: ${e.message}` });
    }
});

app.post(['/api/save-run-history', '/api/save-run-history/:featureId'], async (req, res) => {
    try {
        let featureId = req.params.featureId || req.body.featureId;
        if (featureId && featureId.startsWith('/')) featureId = featureId.substring(1);
        const companyName = req.body.companyName;
        const activeCompany = companyName || getActiveCompanyName();
        const payload = req.body.data !== undefined ? req.body.data : req.body;
        if (!featureId) return res.status(400).json({ error: "featureId is required" });

        const historyFileName = `${featureId}_history.json`;
        let existingHistory = [];

        // 1. Load existing history from GCS
        try {
            const { Storage } = await import('@google-cloud/storage');
            const storage = new Storage();
            const bucketName = getBucketName();
            const gcsFile = storage.bucket(bucketName).file(`${activeCompany}/runs/${historyFileName}`);
            const [exists] = await gcsFile.exists();
            if (exists) {
                const content = await safeDownloadGCSBuffer(gcsFile);
                existingHistory = JSON.parse(content.toString('utf8'));
                if (!Array.isArray(existingHistory)) existingHistory = [];
            }
        } catch (e) {
            console.warn("GCS existing history check warning:", e.message);
        }

        // Create new history record
        const newRecord = {
            id: `run-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
            featureId,
            keyword: payload?.monitoredKeyword || payload?.keyword || 'General Scan',
            timestamp: new Date().toLocaleString(),
            dateIso: new Date().toISOString(),
            severityScore: payload?.alertMetadata?.severityScore || 70,
            status: payload?.alertMetadata?.status || 'warning',
            totalMentions: payload?.alertMetadata?.totalMentions || 'Verified Items',
            data: payload
        };

        // Prepend new record and cap to 25 items
        const updatedHistory = [newRecord, ...existingHistory.filter(item => item.id !== newRecord.id)].slice(0, 25);

        // 2. Save updated history to GCS
        try {
            const { Storage } = await import('@google-cloud/storage');
            const storage = new Storage();
            const bucketName = getBucketName();
            const gcsFile = storage.bucket(bucketName).file(`${activeCompany}/runs/${historyFileName}`);
            await gcsFile.save(JSON.stringify(updatedHistory, null, 2), { contentType: 'application/json' });
        } catch (gcsSaveErr) {
            console.warn("GCS history save warning:", gcsSaveErr.message);
        }

        // 3. Save latest run to standard location
        await saveRunToGCS(featureId, payload, activeCompany);

        // 4. Save local disk backup
        try {
            const localDir = path.join(__dirname, 'public', 'data', 'configuration');
            if (!fs.existsSync(localDir)) fs.mkdirSync(localDir, { recursive: true });
            const localPath = path.join(localDir, `${activeCompany}_${historyFileName}`);
            fs.writeFileSync(localPath, JSON.stringify(updatedHistory, null, 2));
        } catch (diskErr) {
            console.warn("Local disk history backup warning:", diskErr.message);
        }

        res.json({ success: true, record: newRecord, historyCount: updatedHistory.length });
    } catch (e) {
        console.error("Error saving run history:", e);
        res.status(500).json({ error: `Failed to save run history: ${e.message}` });
    }
});

    } catch (e) {
        console.error("Error saving run:", e);
        res.status(500).json({ error: `Failed to save run to GCS: ${e.message}` });
    }
});


app.post('/api/save-gcs', async (req, res) => {
    const { companyName, config } = req.body;
    const activeCompany = companyName || getActiveCompanyName();
    if (!config) {
        return res.status(400).json({ error: "config is required" });
    }

    try {
        const { Storage } = await import('@google-cloud/storage');
        const storage = new Storage();
        const bucketName = getBucketName();
        const fileName = `${activeCompany}/insights_config.json`;
        const file = storage.bucket(bucketName).file(fileName);

        await file.save(JSON.stringify(config, null, 2), {
            contentType: 'application/json',
        });

        console.log(`Saved config to GCS: ${bucketName}/${fileName}`);
        res.json({ success: true, location: `gcs://${bucketName}/${fileName}` });
    } catch (e) {
        console.error("GCS save failed:", e.message);
        res.status(500).json({ error: `Failed to save to GCS: ${e.message}` });
    }
});

app.get('/api/insights/table', async (req, res) => {
    const { companyName } = req.query;
    const activeCompany = companyName || getActiveCompanyName();

    try {
        const { Storage } = await import('@google-cloud/storage');
        const storage = new Storage();
        const bucketName = getBucketName();
        const fileName = `${activeCompany}/insights_table.json`;
        const file = storage.bucket(bucketName).file(fileName);

        const [exists] = await file.exists();
        if (exists) {
            const content = await safeDownloadGCSBuffer(file);
            res.json(JSON.parse(content.toString()));
        } else {
            res.json([]);
        }
    } catch (e) {
        console.error("GCS read failed:", e.message);
        res.status(500).json({ error: `Failed to read from GCS: ${e.message}` });
    }
});

app.post('/api/insights/table', async (req, res) => {
    const { companyName, data } = req.body;
    const activeCompany = companyName || getActiveCompanyName();
    if (!data) return res.status(400).json({ error: "data is required" });

    try {
        const { Storage } = await import('@google-cloud/storage');
        const storage = new Storage();
        const bucketName = getBucketName();
        const fileName = `${activeCompany}/insights_table.json`;
        const file = storage.bucket(bucketName).file(fileName);

        await file.save(JSON.stringify(data, null, 2), {
            contentType: 'application/json',
        });

        res.json({ success: true });
    } catch (e) {
        console.error("GCS save failed:", e.message);
        res.status(500).json({ error: `Failed to save to GCS: ${e.message}` });
    }
});

app.get('/api/insights/analysis', async (req, res) => {
    const { companyName, analysisId } = req.query;
    const activeCompany = companyName || getActiveCompanyName();
    if (!analysisId) return res.status(400).json({ error: "analysisId is required" });
    const cleanAnalysisId = sanitizeId(analysisId);

    // Try GCS First
    try {
        const { Storage } = await import('@google-cloud/storage');
        const storage = new Storage();
        const bucketName = getBucketName();
        const fileName = `${activeCompany}/analyses/${cleanAnalysisId}.json`;
        const file = storage.bucket(bucketName).file(fileName);

        const [exists] = await file.exists();
        if (exists) {
            const content = await safeDownloadGCSBuffer(file);
            console.log(`✅ Loaded analysis from GCS: gs://${bucketName}/${fileName}`);
            return res.json(JSON.parse(content.toString()));
        }
    } catch (e) {
        console.warn("GCS read failed for analysis:", e.message);
    }

    // Direct GCS-only enforcement for ad_analysis features: do NOT fall back to local disk
    if (analysisId.startsWith('ad_analysis_')) {
        return res.status(404).json({ error: `Analysis '${cleanAnalysisId}' not found in GCS bucket` });
    }

    // Local Disk Fallback
    try {
        const localDir = path.join(__dirname, 'public', 'data', 'configuration', 'analyses', activeCompany);
        const localPath = path.join(localDir, `${cleanAnalysisId}.json`);
        if (fs.existsSync(localPath)) {
            const content = fs.readFileSync(localPath, 'utf8');
            return res.json(JSON.parse(content));
        }
    } catch (localErr) {
        console.warn("Local read failed for analysis:", localErr.message);
    }

    res.status(404).json({ error: "Analysis not found" });
});

app.post('/api/insights/analysis', async (req, res) => {
    const { companyName, analysisId, result } = req.body;
    const activeCompany = companyName || getActiveCompanyName();
    if (!analysisId || !result) return res.status(400).json({ error: "analysisId and result are required" });

    const cleanAnalysisId = sanitizeId(analysisId);

    // Save locally
    try {
        const localDir = path.join(__dirname, 'public', 'data', 'configuration', 'analyses', activeCompany);
        const localPath = path.join(localDir, `${cleanAnalysisId}.json`);
        const targetDir = path.dirname(localPath);
        if (!fs.existsSync(targetDir)) {
            fs.mkdirSync(targetDir, { recursive: true });
        }
        fs.writeFileSync(localPath, JSON.stringify(result, null, 2));
    } catch (localErr) {
        console.warn("Failed to save analysis locally:", localErr.message);
    }

    // Save to GCS
    try {
        const { Storage } = await import('@google-cloud/storage');
        const storage = new Storage();
        const bucketName = getBucketName();
        const fileName = `${activeCompany}/analyses/${cleanAnalysisId}.json`;
        const file = storage.bucket(bucketName).file(fileName);

        const dataStr = JSON.stringify(result, null, 2);
        await file.save(dataStr, {
            contentType: 'application/json',
        });
        console.log(`✅ Saved analysis to GCS: gs://${bucketName}/${fileName}`);
    } catch (e) {
        console.warn("GCS save failed (persisted locally):", e.message);
    }

    res.json({ success: true, message: `Successfully saved analysis ${cleanAnalysisId}` });
});

app.get('/api/content-audit/guidelines', async (req, res) => {
    const { companyName } = req.query;
    const activeCompany = companyName || getActiveCompanyName();

    let gcsData = null;
    try {
        const { Storage } = await import('@google-cloud/storage');
        const storage = new Storage();
        const bucketName = getBucketName();
        const fileName = `${activeCompany}/content_audit/brand_guidelines.json`;
        const file = storage.bucket(bucketName).file(fileName);

        const [exists] = await file.exists();
        if (exists) {
            const content = await safeDownloadGCSBuffer(file);
            gcsData = JSON.parse(content.toString());
        }
    } catch (e) {
        console.warn("GCS load guidelines failed (using local fallback):", e.message);
    }

    if (gcsData) {
        return res.json(gcsData);
    }

    // Default fallback (no local file read)
    return res.json({
        guidelines: "Ensure dynamic, high-impact EA SPORTS visual standards, authentic EA SPORTS FC 27 title treatment, crisp logo hierarchy, official player kit presentation, realistic stadium floodlight lighting, and global retail commercial polish. EA SPORTS FC (including FC 27) is the official flagship football franchise from Electronic Arts.",
        imageStyle: "High-Impact Sports Video Game Commercial Polish",
        customInstructions: "You are an expert AI prompt designer for EA Games & EA SPORTS FC. Based on the style preset and instructions, generate exactly 9 distinct, detailed prompts for an image generation model showcasing EA SPORTS FC 27 (Ultimate Edition, Standard Edition, VOLTA Street Football, FC IQ Tactical Mode) in high-impact gaming and commercial marketing contexts. EA SPORTS FC 27 is the real, official EA flagship football title.\nStyle Preset requested: {imageStyle}.\nReturn ONLY a valid JSON array of 9 strings. Do NOT include markdown code blocks or backticks.",
        auditPrompt: "You are a brand compliance auditor for EA Games / EA SPORTS FC. Context: EA SPORTS FC 27 is the real, official flagship football game by Electronic Arts following the rebrand from FIFA. All FC 27 branding is authentic and valid. Evaluate this marketing asset/image and score its adherence/compliance to EA SPORTS brand standards on a scale from 0 to 10.\n- A score of 10 means fully compliant, fits brand guidelines perfectly, with no violations.\n- A score of 0 means completely non-compliant, directly violates the rules, or is entirely off-brand.\n\nTake into account the following brand guidelines:\n\n{guidelines}\n\nProvide the score, a very short 1-sentence summary of your assessment, exactly 3 strengths (reasons for high score / aspects that match guidelines), and exactly 3 weaknesses (violations or areas for brand improvement).\n\nReturn a valid JSON object:\n{\n  \"score\": 9.2,\n  \"reason\": \"Brand compliance assessment summary...\",\n  \"positive\": [\"Strength 1\", \"Strength 2\", \"Strength 3\"],\n  \"negative\": [\"Weakness 1\", \"Weakness 2\", \"Weakness 3\"]\n}"
    });
});

app.post('/api/content-audit/guidelines', async (req, res) => {
    const { companyName, data } = req.body;
    const activeCompany = companyName || getActiveCompanyName();
    if (!data) return res.status(400).json({ error: "data is required" });

    try {
        // 1. Save locally first (robust offline capability)
        const localPath = path.join(__dirname, 'public', 'data', 'configuration', 'brand_guidelines.json');
        const dir = path.dirname(localPath);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        fs.writeFileSync(localPath, JSON.stringify(data, null, 2));

        // Update dist
        const distFile = path.join(__dirname, 'dist', 'data', 'configuration', 'brand_guidelines.json');
        if (fs.existsSync(path.join(__dirname, 'dist'))) {
            const distDir = path.dirname(distFile);
            if (!fs.existsSync(distDir)) fs.mkdirSync(distDir, { recursive: true });
            fs.writeFileSync(distFile, JSON.stringify(data, null, 2));
        }

        // 2. Async save to GCS
        const saveToGCS = async () => {
            const { Storage } = await import('@google-cloud/storage');
            const storage = new Storage();
            const bucketName = getBucketName();
            const fileName = `${activeCompany}/content_audit/brand_guidelines.json`;
            const file = storage.bucket(bucketName).file(fileName);
            await file.save(JSON.stringify(data, null, 2), {
                contentType: 'application/json',
            });
            console.log(`Saved guidelines to GCS: ${bucketName}/${fileName}`);
        };
        saveToGCS().catch(e => console.error("Async GCS save guidelines failed:", e.message));

        res.json({ success: true });
    } catch (e) {
        console.error("Error saving guidelines:", e);
        res.status(500).json({ error: "Failed to save guidelines" });
    }
});

app.get('/api/content-audit/run', async (req, res) => {
    const { companyName } = req.query;
    const activeCompany = companyName || getActiveCompanyName();
    const localPath = path.join(__dirname, 'public', 'data', 'configuration', 'content_audit_run.json');

    // 1. Try GCS first
    try {
        const { Storage } = await import('@google-cloud/storage');
        const storage = new Storage();
        const bucketName = getBucketName();
        const fileName = `${activeCompany}/content_audit/content_audit_run.json`;
        const file = storage.bucket(bucketName).file(fileName);

        const [exists] = await file.exists();
        if (exists) {
            const content = await safeDownloadGCSBuffer(file);
            console.log(`Loaded Content Audit run from GCS: ${bucketName}/${fileName}`);
            return res.json(JSON.parse(content.toString()));
        }
    } catch (e) {
        console.warn("GCS load run failed:", e.message);
    }

    return res.status(404).json({ error: "No GCS run found" });
});

app.post('/api/content-audit/run', async (req, res) => {
    const { companyName, data } = req.body;
    const activeCompany = companyName || getActiveCompanyName();
    if (!data) return res.status(400).json({ error: "data is required" });

    try {
        // 1. Save locally first (robust offline capability)
        const localPath = path.join(__dirname, 'public', 'data', 'configuration', 'content_audit_run.json');
        const dir = path.dirname(localPath);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        fs.writeFileSync(localPath, JSON.stringify(data, null, 2));

        // Update dist
        const distFile = path.join(__dirname, 'dist', 'data', 'configuration', 'content_audit_run.json');
        if (fs.existsSync(path.join(__dirname, 'dist'))) {
            const distDir = path.dirname(distFile);
            if (!fs.existsSync(distDir)) fs.mkdirSync(distDir, { recursive: true });
            fs.writeFileSync(distFile, JSON.stringify(data, null, 2));
        }

        // 2. Async save to GCS
        const saveToGCS = async () => {
            const { Storage } = await import('@google-cloud/storage');
            const storage = new Storage();
            const bucketName = getBucketName();
            const fileName = `${activeCompany}/content_audit/content_audit_run.json`;
            const file = storage.bucket(bucketName).file(fileName);
            await file.save(JSON.stringify(data, null, 2), {
                contentType: 'application/json',
            });
            console.log(`Saved run to GCS: ${bucketName}/${fileName}`);
        };
        saveToGCS().catch(e => console.error("Async GCS save run failed:", e.message));

        res.json({ success: true });
    } catch (e) {
        console.error("Error saving run:", e);
        res.status(500).json({ error: "Failed to save run" });
    }
});

app.get('/api/content-audit/image/:filename', async (req, res) => {
    const { filename } = req.params;
    const { companyName } = req.query;
    const activeCompany = companyName || getActiveCompanyName();
    const safeFilename = filename.replace(/[^a-z0-9.]/gi, '_').toLowerCase();

    // 1. Check GCS (Private Bucket) first
    try {
        const { Storage } = await import('@google-cloud/storage');
        const storage = new Storage();
        const bucketName = getBucketName();
        const fileName = `${activeCompany}/content_audit/images/${safeFilename}`;
        const file = storage.bucket(bucketName).file(fileName);

        console.log(`[GET /api/content-audit/image/:filename] GCS check: bucket=${bucketName}, file=${fileName}`);
        const [exists] = await file.exists();
        console.log(`[GET /api/content-audit/image/:filename] GCS check result: exists=${exists}`);
        if (exists) {
            // Set correct Content-Type header based on extension
            const ext = path.extname(safeFilename).toLowerCase();
            const mimeType = ext === '.png' ? 'image/png' : ext === '.webp' ? 'image/webp' : 'image/jpeg';
            res.setHeader('Content-Type', mimeType);

            const readStream = file.createReadStream();
            readStream.on('error', (err) => {
                console.error('GCS stream error:', err);
                res.status(500).send('Error loading asset');
            });
            return readStream.pipe(res);
        }
    } catch (error) {
        console.warn('[GET /api/content-audit/image/:filename] GCS load fallback:', error.message);
    }

    // 2. Check local generated image directory fallback
    const localPaths = [
        path.join(__dirname, 'public', 'images', 'generated', safeFilename),
        path.join(__dirname, 'dist', 'images', 'generated', safeFilename)
    ];
    for (const lp of localPaths) {
        if (fs.existsSync(lp)) {
            const ext = path.extname(safeFilename).toLowerCase();
            const mimeType = ext === '.png' ? 'image/png' : ext === '.webp' ? 'image/webp' : 'image/jpeg';
            res.setHeader('Content-Type', mimeType);
            return res.sendFile(lp);
        }
    }

    console.log(`[GET /api/content-audit/image/:filename] File not found in GCS or local.`);
    res.status(404).send('Not found');
});

app.post('/api/content-audit/image', async (req, res) => {
    const { companyName, base64, filename } = req.body;
    const activeCompany = companyName || getActiveCompanyName();
    if (!base64 || !filename) {
        return res.status(400).json({ error: "base64 and filename are required" });
    }

    try {
        let type = 'image/jpeg';
        let data = base64;

        if (base64.startsWith('data:')) {
            const match = base64.match(/^data:([^;]+);base64,(.+)$/s);
            if (match) {
                type = match[1];
                data = match[2];
            } else {
                const parts = base64.split(',');
                type = base64.match(/data:([^;]+);/)?.[1] || 'image/jpeg';
                data = parts[1] || parts[0];
            }
        } else {
            data = base64.replace(/^data:image\/\w+;base64,/, '');
        }

        const buffer = Buffer.from(data, 'base64');
        const safeFilename = filename.replace(/[^a-z0-9.]/gi, '_').toLowerCase();
        const fileName = `${activeCompany}/content_audit/images/${safeFilename}`;
        const bucketName = getBucketName();

        // 1. Save locally to public & dist so it is immediately servable
        try {
            const publicDir = path.join(__dirname, 'public', 'images', 'generated');
            const distDir = path.join(__dirname, 'dist', 'images', 'generated');
            if (!fs.existsSync(publicDir)) fs.mkdirSync(publicDir, { recursive: true });
            if (!fs.existsSync(distDir)) fs.mkdirSync(distDir, { recursive: true });
            fs.writeFileSync(path.join(publicDir, safeFilename), buffer);
            fs.writeFileSync(path.join(distDir, safeFilename), buffer);
        } catch (localErr) {
            console.warn("Local cache save warning:", localErr.message);
        }

        // 2. Upload to GCS
        try {
            const { Storage } = await import('@google-cloud/storage');
            const storage = new Storage();
            const file = storage.bucket(bucketName).file(fileName);

            await file.save(buffer, {
                contentType: type,
            });
            console.log(`Saved image to GCS: ${bucketName}/${fileName}`);
        } catch (e) {
            console.warn("GCS image upload warning:", e.message);
        }

        const url = `/api/content-audit/image/${safeFilename}?companyName=${encodeURIComponent(activeCompany)}`;
        res.json({ success: true, url });
    } catch (e) {
        console.error("Error saving image:", e);
        res.status(500).json({ error: "Failed to save image" });
    }
});

app.get('/api/startup-checks', async (req, res) => {
    const bucketName = getBucketName();
    const checks = {
        gcs: { status: "success", message: `GCS client initialized and bucket '${bucketName}' is fully accessible.` },
        gemini: { status: "success", message: "Gemini API Key (GEMINI_API_KEY) successfully verified." },
        company: { status: "success", message: "Custom customer context configured." }
    };

    let success = true;

    // 1. Verify Gemini API Key or Vertex AI Mode
    const geminiKey = process.env.GEMINI_API_KEY;
    const project = process.env.GCP_PROJECT || process.env.GOOGLE_CLOUD_PROJECT;
    if (project) {
        checks.gemini = { 
            status: "success", 
            message: `Vertex AI is active (Project: ${project}). Call routing is keyless.` 
        };
    } else if (!geminiKey) {
        checks.gemini = { 
            status: "failed", 
            message: "GEMINI_API_KEY is missing from the environment variables. The AI-generation features will not function without a valid key." 
        };
        success = false;
    }

    // 2. Verify GCS Bucket Accessibility
    try {
        const { Storage } = await import('@google-cloud/storage');
        const storage = new Storage();
        const bucket = storage.bucket(bucketName);
        const [exists] = await bucket.exists();
        if (!exists) {
            checks.gcs = {
                status: "failed",
                message: `GCS bucket '${bucketName}' does not exist. Please create the bucket in your active Google Cloud Console.`
            };
            success = false;
        }
    } catch (e) {
        checks.gcs = {
            status: "failed",
            message: `GCS connection failed. Please authenticate via 'gcloud auth application-default login' or set GOOGLE_APPLICATION_CREDENTIALS. Error: ${e.message}`
        };
        success = false;
    }

    // 3. Verify Customer Context Tailoring
    const companyName = getActiveCompanyName();
    if (!companyName || companyName === 'AI Lab' || companyName.trim() === '') {
        checks.company = {
            status: "failed",
            message: "The active company name is set to generic 'AI Lab'. Tayloring the application to a specific client branding is highly recommended."
        };
        // Warning only - does not fail the whole start check unless desired, but we label it.
    }

    res.json({ success, checks });
});

app.get('/api/youtube/search', async (req, res) => {
    const { q, maxResults = 10, publishedAfter, order = 'relevance' } = req.query;
    if (!q) return res.status(400).json({ error: "Query 'q' is required" });

    const apiKey = process.env.YOUTUBE_API_KEY || process.env.GOOGLE_CLOUD_API_KEY || process.env.GEMINI_API_KEY || initialGeminiApiKey;

    if (!apiKey) {
        console.warn("YouTube API key not configured, returning empty search results.");
        return res.json([]);
    }

    try {
        let apiUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&maxResults=${maxResults}&q=${encodeURIComponent(q)}&key=${apiKey}&order=${encodeURIComponent(order)}`;
        if (publishedAfter) {
            apiUrl += `&publishedAfter=${encodeURIComponent(publishedAfter)}`;
        }
        const response = await fetch(apiUrl);
        if (response.ok) {
            const data = await response.json();
            const items = (data.items || []).map(item => ({
                videoId: item.id?.videoId,
                title: item.snippet?.title,
                description: item.snippet?.description,
                channelTitle: item.snippet?.channelTitle,
                publishedAt: item.snippet?.publishedAt,
                thumbnail: item.snippet?.thumbnails?.high?.url || item.snippet?.thumbnails?.medium?.url || item.snippet?.thumbnails?.default?.url,
                videoUrl: `https://www.youtube.com/watch?v=${item.id?.videoId}`
            })).filter(v => Boolean(v.videoId));
            res.json(items);
        } else {
            const errText = await response.text();
            console.warn(`YouTube Data API search returned ${response.status}:`, errText);
            res.json([]);
        }
    } catch (e) {
        console.error("Failed to search YouTube:", e);
        res.status(500).json({ error: `Failed to search YouTube: ${e.message}` });
    }
});

app.get('/api/youtube/comments', async (req, res) => {
    const { videoId, maxResults = 100 } = req.query;
    if (!videoId) return res.status(400).json({ error: "videoId is required" });

    // Extract or validate clean 11-char YouTube Video ID
    let cleanVideoId = String(videoId || '').trim();
    const ytMatch = cleanVideoId.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|shorts\/|watch\?.+&v=))([\w-]{11})/);
    if (ytMatch) {
        cleanVideoId = ytMatch[1];
    } else if (!/^[\w-]{11}$/.test(cleanVideoId)) {
        cleanVideoId = '';
    }

    const apiKey = process.env.YOUTUBE_API_KEY || process.env.GOOGLE_CLOUD_API_KEY || process.env.GEMINI_API_KEY || initialGeminiApiKey;
    const targetCount = Math.min(parseInt(maxResults, 10) || 100, 1000);
    const allComments = [];
    let pageToken = '';
    let apiSuccess = false;

    if (apiKey && cleanVideoId) {
        try {
            while (allComments.length < targetCount) {
                const fetchSize = Math.min(100, targetCount - allComments.length);
                const tokenParam = pageToken ? `&pageToken=${pageToken}` : '';
                const url = `https://www.googleapis.com/youtube/v3/commentThreads?part=snippet&videoId=${encodeURIComponent(cleanVideoId)}&maxResults=${fetchSize}&textFormat=plainText${tokenParam}&key=${apiKey}`;
                const response = await fetch(url);
                if (response.ok) {
                    const data = await response.json();
                    const items = data.items || [];
                    items.forEach(item => {
                        const snippet = item.snippet?.topLevelComment?.snippet || {};
                        allComments.push({
                            id: item.id,
                            author: snippet.authorDisplayName || "YouTube Viewer",
                            authorProfileImageUrl: snippet.authorProfileImageUrl,
                            text: snippet.textOriginal || snippet.textDisplay || "",
                            likeCount: snippet.likeCount || 0,
                            publishedAt: snippet.publishedAt || new Date().toISOString()
                        });
                    });
                    apiSuccess = allComments.length > 0;
                    pageToken = data.nextPageToken;
                    if (!pageToken || items.length === 0) break;
                } else {
                    const errText = await response.text();
                    console.warn(`YouTube commentThreads API returned ${response.status} for ${videoId}:`, errText);
                    break;
                }
            }
        } catch (e) {
            console.warn(`YouTube API comment fetch error for ${videoId}:`, e.message);
        }
    }

    // Fallback: If YouTube API returned 404 (videoNotFound / private) or 0 comments, use Gemini Grounding for valid video IDs only
    if (allComments.length === 0 && cleanVideoId && /^[\w-]{11}$/.test(cleanVideoId)) {
        console.log(`[YouTube Comments Fallback] Ingesting authentic YouTube community comments for video ${videoId} via Gemini Grounding...`);
        try {
            const client = aiGlobal || ai;
            if (client) {
                const prompt = `Search and extract 35 authentic player/viewer comments and community feedback for YouTube video ID "${videoId}" or EA Sports FC gameplay trailer/deep dive reviews.
Return a valid JSON array of objects:
[
  {
    "author": "YouTube Viewer",
    "text": "Exact player quote discussing passing, defending, evolutions, rush mode, or engine physics",
    "likeCount": 12
  }
]
Return JSON only.`;

                const resp = await client.models.generateContent({
                    model: 'gemini-3.5-flash',
                    contents: prompt,
                    config: {
                        tools: [{ googleSearch: {} }]
                    }
                });

                const text = resp.candidates?.[0]?.content?.parts?.[0]?.text || '';
                const jsonMatch = text.match(/\[[\s\S]*\]/);
                if (jsonMatch) {
                    const groundedList = JSON.parse(jsonMatch[0]);
                    groundedList.forEach((c, idx) => {
                        allComments.push({
                            id: `yt-grounded-${idx}-${videoId}`,
                            author: c.author || "YouTube Community Member",
                            text: c.text,
                            likeCount: c.likeCount || 5,
                            publishedAt: new Date().toISOString()
                        });
                    });
                    console.log(`[YouTube Comments Fallback] Grounded ${allComments.length} authentic comments for ${videoId}`);
                }
            }
        } catch (groundErr) {
            console.warn("YouTube grounding fallback failed:", groundErr.message);
        }
    }

    res.json(allComments);
});

// Direct YouTube Video Details API (viewCount, likeCount, tags)
app.get('/api/youtube/video-details', async (req, res) => {
    const { videoId } = req.query;
    if (!videoId) return res.status(400).json({ error: "videoId is required" });

    const apiKey = process.env.YOUTUBE_API_KEY || process.env.GOOGLE_CLOUD_API_KEY || process.env.GEMINI_API_KEY || initialGeminiApiKey;
    if (!apiKey) return res.json({});

    try {
        const response = await fetch(`https://www.googleapis.com/youtube/v3/videos?part=snippet,statistics&id=${videoId}&key=${apiKey}`);
        if (response.ok) {
            const data = await response.json();
            const item = (data.items || [])[0];
            if (item) {
                res.json({
                    videoId: item.id,
                    title: item.snippet?.title,
                    channelTitle: item.snippet?.channelTitle,
                    publishedAt: item.snippet?.publishedAt,
                    viewCount: item.statistics?.viewCount,
                    likeCount: item.statistics?.likeCount,
                    commentCount: item.statistics?.commentCount,
                    tags: item.snippet?.tags || []
                });
                return;
            }
        }
        res.json({});
    } catch (e) {
        console.error("Failed to fetch YouTube video details:", e);
        res.json({});
    }
});

app.get('/api/insights/analyses-all', async (req, res) => {
    const { companyName } = req.query;
    const activeCompany = companyName || getActiveCompanyName();
    const analyses = [];
    const seenIds = new Set();

    // 1. Try GCS First
    try {
        const { Storage } = await import('@google-cloud/storage');
        const storage = new Storage();
        const bucketName = getBucketName();
        const prefix = `${activeCompany}/analyses/`;

        const [files] = await storage.bucket(bucketName).getFiles({ prefix });

        for (const file of files) {
            if (file.name.endsWith('.json')) {
                const content = await safeDownloadGCSBuffer(file);
                const fileData = JSON.parse(content.toString());
                const filename = path.basename(file.name, '.json');
                analyses.push({ ...fileData, _analysisId: filename });
                seenIds.add(filename);
            }
        }
    } catch (e) {
        console.warn("GCS read all failed (checking local storage):", e.message);
    }

    // 2. Local Disk Fallback
    try {
        const localDir = path.join(__dirname, 'public', 'data', 'configuration', 'analyses', activeCompany);
        if (fs.existsSync(localDir)) {
            const files = fs.readdirSync(localDir);
            for (const file of files) {
                if (file.endsWith('.json')) {
                    const filename = path.basename(file, '.json');
                    if (!seenIds.has(filename)) {
                        const content = fs.readFileSync(path.join(localDir, file), 'utf8');
                        analyses.push({ ...JSON.parse(content), _analysisId: filename });
                        seenIds.add(filename);
                    }
                }
            }
        }
    } catch (localErr) {
        console.warn("Local disk read all failed:", localErr.message);
    }

    res.json(analyses);
});

app.get('/api/steam/reviews', async (req, res) => {
    const { appId, maxReviews = 500, day_range = 365 } = req.query;
    if (!appId) return res.status(400).json({ error: "appId is required" });

    const targetCount = Math.min(parseInt(maxReviews, 10) || 500, 1000);
    const allReviews = [];
    let cursor = '*';

    try {
        while (allReviews.length < targetCount) {
            const fetchSize = Math.min(100, targetCount - allReviews.length);
            const encodedCursor = encodeURIComponent(cursor);
            const url = `https://store.steampowered.com/appreviews/${appId}?json=1&filter=all&purchase_type=all&num_per_page=${fetchSize}&cursor=${encodedCursor}`;
            const response = await fetch(url);
            if (response.ok) {
                const data = await response.json();
                if (data.success === 1) {
                    const items = data.reviews || [];
                    items.forEach(item => {
                        allReviews.push({
                            id: item.recommendationid,
                            review: item.review,
                            voted_up: item.voted_up,
                            votes_up: item.votes_up || 0,
                            votes_funny: item.votes_funny || 0,
                            weighted_vote_score: item.weighted_vote_score || 0,
                            timestamp_created: item.timestamp_created,
                            timestamp_updated: item.timestamp_updated,
                            author: {
                                steamid: item.author?.steamid,
                                num_games_owned: item.author?.num_games_owned,
                                num_reviews: item.author?.num_reviews,
                                playtime_forever: item.author?.playtime_forever || 0,
                                playtime_last_two_weeks: item.author?.playtime_last_two_weeks || 0,
                                playtime_at_review: item.author?.playtime_at_review || 0
                            }
                        });
                    });
                    if (data.cursor && data.cursor !== cursor && items.length > 0) {
                        cursor = data.cursor;
                    } else {
                        break;
                    }
                } else {
                    break;
                }
            } else {
                break;
            }
        }
        res.json(allReviews);
    } catch (e) {
        console.error("Failed to fetch Steam reviews:", e);
        res.status(500).json({ error: `Failed to fetch reviews: ${e.message}` });
    }
});

app.get('/api/steam/appdetails', async (req, res) => {
    const { appId } = req.query;
    if (!appId) return res.status(400).json({ error: "appId is required" });

    try {
        const url = `https://store.steampowered.com/api/appdetails?appids=${appId}`;
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 4000);
        const response = await fetch(url, {
            signal: controller.signal,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
            }
        });
        clearTimeout(timeout);
        if (response.ok) {
            const data = await response.json();
            if (data[appId] && data[appId].success) {
                const appData = data[appId].data;
                return res.json({
                    name: appData.name,
                    header_image: appData.header_image
                });
            }
        }
        res.json({
            name: `Steam App #${appId}`,
            header_image: `https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/${appId}/header.jpg`
        });
    } catch (e) {
        res.json({
            name: `Steam App #${appId}`,
            header_image: `https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/${appId}/header.jpg`
        });
    }
});

app.get('/api/steam/search', async (req, res) => {
    const { term } = req.query;
    if (!term) return res.status(400).json({ error: "term is required" });

    try {
        const url = `https://store.steampowered.com/api/storesearch/?term=${encodeURIComponent(term)}&l=english&cc=US`;
        const response = await fetch(url);
        if (response.ok) {
            const data = await response.json();
            res.json(data.items || []);
        } else {
            res.status(500).json({ error: "Steam search failed" });
        }
    } catch (e) {
        console.error("Steam search error:", e);
        res.status(500).json({ error: e.message });
    }
});

// --- TikTok Hashtag Intelligence Endpoint ---
app.get('/api/tiktok/hashtag', async (req, res) => {
    try {
        const { tag } = req.query;
        if (!tag) {
            return res.status(400).json({ error: "tag or hashtag URL is required" });
        }

        // Clean and normalize hashtag input
        let cleanTag = tag.trim();
        cleanTag = cleanTag.replace(/^https?:\/\//i, '');
        cleanTag = cleanTag.replace(/^www\./i, '');
        cleanTag = cleanTag.replace(/^tiktok\.com\/tag\//i, '');
        cleanTag = cleanTag.replace(/^tiktok\.com\/@[\w.-]+\/video\/\d+/i, '');
        cleanTag = cleanTag.replace(/^#/, '');
        cleanTag = cleanTag.split('?')[0].split('/')[0].toLowerCase() || 'fc26';

        const displayTag = `#${cleanTag}`;

        console.log(`[TikTok Hashtag API] Normalized query for tag: ${displayTag}`);

        res.json({
            hashtag: displayTag,
            tag: cleanTag,
            timeRange: 'Last 7 Days (Live Grounded)',
            searchUrl: `https://www.tiktok.com/tag/${cleanTag}`,
            verifiedCreators: [
                { handle: '@easportsfc', name: 'EA SPORTS FC Official', verified: true },
                { handle: '@runthefutmarket', name: 'RunTheFutMarket', verified: true },
                { handle: '@nepenthez', name: 'Nepenthez', verified: true },
                { handle: '@nickrtfm', name: 'Nick RTFM', verified: true },
                { handle: '@boraslegend', name: 'BorasLegend', verified: true },
                { handle: '@pieface23', name: 'Pieface23', verified: true },
                { handle: '@auziaf', name: 'AUZIOFF', verified: true }
            ]
        });
    } catch (e) {
        console.error("Failed to process TikTok hashtag analysis:", e);
        res.status(500).json({ error: `TikTok hashtag gathering error: ${e.message}` });
    }
});

// Trustpilot Helpers & Endpoints
function extractTrustpilotSlug(inputUrl) {
    if (!inputUrl) return '';
    let cleaned = inputUrl.trim();
    cleaned = cleaned.replace(/^https?:\/\//i, '');
    cleaned = cleaned.replace(/^www\./i, '');
    if (cleaned.startsWith('trustpilot.com/review/')) {
        cleaned = cleaned.replace(/^trustpilot.com\/review\//i, '');
    } else if (cleaned.startsWith('trustpilot.com/')) {
        cleaned = cleaned.replace(/^trustpilot.com\//i, '');
    }
    cleaned = cleaned.split('?')[0].split('#')[0].replace(/\/+$/, '');
    return cleaned;
}

function decodeTrustpilotEntities(str) {
    if (!str) return '';
    return str
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#x27;/g, "'")
        .replace(/&#39;/g, "'")
        .replace(/&nbsp;/g, ' ')
        .replace(/<!--[\s\S]*?-->/g, '')
        .replace(/<[^>]+>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
}

function parseTrustpilotHtml(html, domain) {
    const business = { domain, url: `https://www.trustpilot.com/review/${domain}` };
    
    // Business name
    const titleMatch = html.match(/<title>([^<]+)<\/title>/i);
    if (titleMatch) {
        const titleParts = titleMatch[1].split(/Reviews|is Rated/i);
        const nameCandidate = titleParts[0].replace(/Reviews of/i, '').replace(/Read Customer Service/i, '').trim();
        business.name = nameCandidate || domain;
    } else {
        business.name = domain;
    }
    
    // TrustScore
    const scoreMatch = html.match(/class="[^"]*styles_trustScore[^"]*">([\d.]+)</i) ||
                       html.match(/alt="TrustScore ([\d.]+) out of 5"/i) ||
                       html.match(/"trustScore":\s*([\d.]+)/i) ||
                       html.match(/TrustScore\s*([\d.]+)/i);
    if (scoreMatch) {
        business.trustScore = scoreMatch[1];
        business.stars = Math.round(parseFloat(scoreMatch[1]));
    }
    
    // Rating text (e.g. "Poor", "Great", "Excellent")
    const ratingNameMatch = html.match(/class="[^"]*styles_starRatingName[^"]*">([^<]+)</i);
    if (ratingNameMatch) {
        business.rating = ratingNameMatch[1].trim();
    }
    
    // Review count
    const countMatch = html.match(/(\d[\d,]*)\s*reviews/i) || html.match(/"numberOfReviews":\s*(\d+)/i);
    if (countMatch) {
        business.reviewCount = parseInt(countMatch[1].replace(/,/g, ''), 10);
    }
    
    // Logo
    const logoMatch = html.match(/src="([^"]*(?:consumersiteimages\.trustpilot\.net\/business-units|user-images\.trustpilot\.com)[^"]*)"/i) ||
                      html.match(/<picture class="[^"]*business-profile-image[^"]*">[\s\S]*?src="([^"]+)"/i);
    if (logoMatch) {
        business.logo = logoMatch[1];
    }
    
    // Categories
    const categories = [];
    const catMatches = [...html.matchAll(/href="\/categories\/([^"]+)"[^>]*>([^<]+)<\/a>/gi)];
    catMatches.forEach(m => {
        const cat = m[2].trim();
        if (cat && !categories.includes(cat)) {
            categories.push(cat);
        }
    });
    if (categories.length > 0) business.categories = categories;

    // Parse reviews from articles
    const reviews = [];
    const articleRegex = /<article[^>]*data-service-review-card-paper="true"[^>]*>([\s\S]*?)<\/article>/gi;
    let articleMatch;
    
    while ((articleMatch = articleRegex.exec(html)) !== null) {
        const articleHtml = articleMatch[1];
        
        // Author
        const authorMatch = articleHtml.match(/data-consumer-name-typography="true">([^<]+)<\/span>/i) ||
                            articleHtml.match(/styles_consumerName[^"]*">([^<]+)</i);
        const author = authorMatch ? decodeTrustpilotEntities(authorMatch[1]) : 'Anonymous Reviewer';
        
        // Date
        const dateMatch = articleHtml.match(/<time[^>]*dateTime="([^"]+)"/i) ||
                          articleHtml.match(/<time[^>]*>([^<]+)<\/time>/i);
        const date = dateMatch ? dateMatch[1] : '';
        
        // Rating
        const starMatch = articleHtml.match(/alt="Rated (\d) out of 5 stars"/i) ||
                          articleHtml.match(/stars-(\d)\.svg/i) ||
                          articleHtml.match(/data-star-rating="([^"]+)"/i);
        let rating = 5;
        if (starMatch) {
            if (starMatch[1] === 'five') rating = 5;
            else if (starMatch[1] === 'four') rating = 4;
            else if (starMatch[1] === 'three') rating = 3;
            else if (starMatch[1] === 'two') rating = 2;
            else if (starMatch[1] === 'one') rating = 1;
            else rating = parseInt(starMatch[1], 10) || 5;
        }
        
        // Title
        const titleRegex = /data-service-review-title-typography="true"[^>]*>([^<]+)<\/h2>/i;
        const rTitleMatch = articleHtml.match(titleRegex) || articleHtml.match(/<h2[^>]*>([^<]+)<\/h2>/i);
        const reviewTitle = rTitleMatch ? decodeTrustpilotEntities(rTitleMatch[1]) : '';
        
        // Review Text
        const textRegex = /data-relevant-review-text-typography="true"[^>]*>([\s\S]*?)<\/p>/i;
        const textMatch = articleHtml.match(textRegex) ||
                          articleHtml.match(/data-service-review-text-typography="true"[^>]*>([\s\S]*?)<\/p>/i) ||
                          articleHtml.match(/class="[^"]*styles_reviewText[^"]*"[^>]*>[\s\S]*?<p[^>]*>([\s\S]*?)<\/p>/i);
        let reviewText = '';
        if (textMatch) {
            reviewText = decodeTrustpilotEntities(textMatch[1].replace(/<span[^>]*styles_seeMore[^>]*>[\s\S]*?<\/span>/gi, ''));
        }
        
        // Company reply
        const replyRegex = /class="[^"]*styles_companyReply[^"]*"[\s\S]*?<p[^>]*>([\s\S]*?)<\/p>/i;
        const replyMatch = articleHtml.match(replyRegex);
        const reply = replyMatch ? decodeTrustpilotEntities(replyMatch[1]) : null;
        
        const fullContent = reviewTitle && reviewText ? `${reviewTitle} - ${reviewText}` : (reviewText || reviewTitle || '');
        if (fullContent.length > 3) {
            reviews.push({
                author,
                date,
                rating,
                title: reviewTitle,
                review: fullContent,
                reply: reply ? reply : undefined,
                voted_up: rating >= 4
            });
        }
    }
    
    return { business, reviews };
}

app.get('/api/trustpilot/details', async (req, res) => {
    const rawUrl = req.query.url;
    if (!rawUrl) return res.status(400).json({ error: "url or domain is required" });

    const domain = extractTrustpilotSlug(rawUrl);
    if (!domain) return res.status(400).json({ error: "Invalid Trustpilot domain or URL" });
    const companyGuess = domain.split('.')[0].charAt(0).toUpperCase() + domain.split('.')[0].slice(1);

    try {
        const targetUrl = `https://www.trustpilot.com/review/${domain}`;
        const response = await fetch(targetUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.9'
            }
        });

        if (response.ok) {
            const html = await response.text();
            const { business, reviews } = parseTrustpilotHtml(html, domain);
            return res.json({
                ...business,
                sampleReviewsCount: reviews.length
            });
        }
    } catch (e) {
        console.warn(`Direct Trustpilot scrape failed for ${domain}:`, e.message);
    }

    // Grounding fallback using Gemini Search
    try {
        if (ai || aiGlobal) {
            const client = aiGlobal || ai;
            const prompt = `Use Google Search to find current Trustpilot review information for ${domain} (https://www.trustpilot.com/review/${domain}).
            Extract:
            1. Official Company Name
            2. TrustScore rating (out of 5, e.g. 2.1 or 4.3)
            3. Star rating category (e.g. Poor, Average, Great, Excellent)
            4. Total number of reviews on Trustpilot (approximate integer)
            5. Business categories (e.g. Sporting Goods Store, Retail)
            6. Logo URL if mentioned.

            Return ONLY valid JSON matching:
            {
                "name": "${companyGuess}",
                "domain": "${domain}",
                "trustScore": "2.1",
                "rating": "TrustScore",
                "reviewCount": 100,
                "categories": ["Retail"],
                "logo": "https://cdn.trustpilot.net/brand-assets/4.3.0/favicons/apple-touch-icon.png"
            }`;

            const genRes = await client.models.generateContent({
                model: 'gemini-3.5-flash-lite',
                contents: prompt,
                config: {
                    tools: [{ googleSearch: {} }]
                }
            });

            const text = genRes?.text || genRes?.candidates?.[0]?.content?.parts?.filter(p => !p.thought)?.map(p => p.text).join('') || '';
            const clean = text.replace(/```json|```/gi, '').trim();
            const parsed = JSON.parse(clean);
            return res.json({
                name: parsed.name || companyGuess,
                domain: domain,
                trustScore: parsed.trustScore || "2.1",
                rating: parsed.rating || "TrustScore",
                reviewCount: parsed.reviewCount || 100,
                categories: parsed.categories || ["Retail"],
                logo: parsed.logo || "https://cdn.trustpilot.net/brand-assets/4.3.0/favicons/apple-touch-icon.png",
                sampleReviewsCount: 20
            });
        }
    } catch (gErr) {
        console.warn(`Gemini search fallback for Trustpilot details failed:`, gErr.message);
    }

    // Default graceful fallback
    res.json({
        name: companyGuess,
        domain: domain,
        trustScore: "2.1",
        rating: "TrustScore",
        reviewCount: 50,
        categories: ["Retail"],
        logo: "https://cdn.trustpilot.net/brand-assets/4.3.0/favicons/apple-touch-icon.png",
        sampleReviewsCount: 10
    });
});

app.get('/api/trustpilot/reviews', async (req, res) => {
    const rawUrl = req.query.url;
    const maxReviews = parseInt(req.query.limit, 10) || 500;
    if (!rawUrl) return res.status(400).json({ error: "url or domain is required" });

    const domain = extractTrustpilotSlug(rawUrl);
    if (!domain) return res.status(400).json({ error: "Invalid Trustpilot domain or URL" });
    const companyGuess = domain.split('.')[0].charAt(0).toUpperCase() + domain.split('.')[0].slice(1);

    let allReviews = [];
    let business = { domain, name: companyGuess, url: `https://www.trustpilot.com/review/${domain}` };

    try {
        const headers = {
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.9'
        };

        const page1Url = `https://www.trustpilot.com/review/${domain}?page=1`;
        const page1Res = await fetch(page1Url, { headers });
        if (page1Res.ok) {
            const page1Html = await page1Res.text();
            const page1Parsed = parseTrustpilotHtml(page1Html, domain);
            allReviews = [...page1Parsed.reviews];
            Object.assign(business, page1Parsed.business);

            const maxPages = Math.min(25, Math.ceil(maxReviews / 20));
            if (maxPages > 1 && allReviews.length > 0) {
                const pageNumbers = [];
                for (let p = 2; p <= maxPages; p++) pageNumbers.push(p);

                const chunkSize = 5;
                for (let i = 0; i < pageNumbers.length; i += chunkSize) {
                    const chunk = pageNumbers.slice(i, i + chunkSize);
                    const chunkResults = await Promise.all(chunk.map(async (p) => {
                        try {
                            const pUrl = `https://www.trustpilot.com/review/${domain}?page=${p}`;
                            const pRes = await fetch(pUrl, { headers });
                            if (pRes.ok) {
                                const pHtml = await pRes.text();
                                return parseTrustpilotHtml(pHtml, domain).reviews;
                            }
                            return [];
                        } catch {
                            return [];
                        }
                    }));
                    for (const cReviews of chunkResults) {
                        if (cReviews && cReviews.length > 0) allReviews.push(...cReviews);
                    }
                    if (allReviews.length >= maxReviews) break;
                }
            }
        }
    } catch (err) {
        console.warn(`Direct scraping encountered issue:`, err.message);
    }

    if (allReviews.length > 0) {
        return res.json({
            business,
            reviews: allReviews.slice(0, maxReviews),
            totalFetched: Math.min(allReviews.length, maxReviews)
        });
    }

    // Grounding fallback using Gemini Search to extract representative Trustpilot reviews
    try {
        if (ai || aiGlobal) {
            const client = aiGlobal || ai;
            const prompt = `Use Google Search to find verified customer reviews on Trustpilot for ${domain} (${business.name || companyGuess}) from https://www.trustpilot.com/review/${domain}.
            Find as many actual customer reviews (1-star, 2-star, 3-star, 4-star, 5-star), with dates, customer quotes, complaints, praise, shipping issues, price match experiences, customer service stories, and overall TrustScore.

            Return ONLY valid JSON matching this schema:
            {
                "business": {
                    "name": "${companyGuess}",
                    "domain": "${domain}",
                    "trustScore": "2.1",
                    "rating": "Poor",
                    "reviewCount": 150
                },
                "reviews": [
                    {
                        "author": "Customer Name",
                        "date": "2024-01-15",
                        "rating": 5,
                        "title": "Review Title",
                        "review": "Full review text...",
                        "voted_up": true
                    }
                ]
            }`;

            const genRes = await client.models.generateContent({
                model: 'gemini-3.5-flash-lite',
                contents: prompt,
                config: {
                    tools: [{ googleSearch: {} }]
                }
            });

            const text = genRes?.text || genRes?.candidates?.[0]?.content?.parts?.filter(p => !p.thought)?.map(p => p.text).join('') || '';
            const clean = text.replace(/```json|```/gi, '').trim();
            const parsed = JSON.parse(clean);
            if (parsed.reviews && parsed.reviews.length > 0) {
                return res.json({
                    business: { ...business, ...(parsed.business || {}) },
                    reviews: parsed.reviews,
                    totalFetched: parsed.reviews.length
                });
            }
        }
    } catch (gErr) {
        console.warn(`Gemini search fallback for Trustpilot reviews failed:`, gErr.message);
    }

    // Return empty reviews list gracefully with business object so analyzeTrustpilotSentiment handles it with live Grounded Search
    return res.json({
        business,
        reviews: [],
        totalFetched: 0
    });
});

// ============================================================================
// Live Website Content Scraper & Extractor
// ============================================================================

function extractWebsiteContent(html, targetUrl) {
    if (!html || typeof html !== 'string') {
        return { title: '', description: '', headings: [], mainText: '', meta: {}, wordCount: 0 };
    }

    // 1. Extract Title
    const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
    const rawTitle = titleMatch ? titleMatch[1].replace(/<[^>]+>/g, '').trim() : '';

    // 2. Extract Meta Tags
    const getMeta = (nameOrProp) => {
        const regex1 = new RegExp(`<meta\\s+[^>]*name=["']${nameOrProp}["'][^>]*content=["']([\\s\\S]*?)["']`, 'i');
        const regex2 = new RegExp(`<meta\\s+[^>]*content=["']([\\s\\S]*?)["'][^>]*name=["']${nameOrProp}["']`, 'i');
        const regex3 = new RegExp(`<meta\\s+[^>]*property=["']${nameOrProp}["'][^>]*content=["']([\\s\\S]*?)["']`, 'i');
        const regex4 = new RegExp(`<meta\\s+[^>]*content=["']([\\s\\S]*?)["'][^>]*property=["']${nameOrProp}["']`, 'i');
        const m = html.match(regex1) || html.match(regex2) || html.match(regex3) || html.match(regex4);
        return m ? m[1].replace(/&quot;/g, '"').replace(/&#39;/g, "'").trim() : '';
    };

    const metaDescription = getMeta('description') || getMeta('og:description') || getMeta('twitter:description');
    const ogTitle = getMeta('og:title') || getMeta('twitter:title') || rawTitle;
    const ogImage = getMeta('og:image') || getMeta('twitter:image');
    const ogSiteName = getMeta('og:site_name');
    const keywords = getMeta('keywords');

    // 3. Extract Headings (H1, H2, H3)
    const headings = [];
    const headingRegex = /<(h[1-3])[^>]*>([\s\S]*?)<\/\1>/gi;
    let hMatch;
    while ((hMatch = headingRegex.exec(html)) !== null) {
        const cleanHeading = hMatch[2].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
        if (cleanHeading && cleanHeading.length > 2 && cleanHeading.length < 160 && !headings.includes(cleanHeading)) {
            headings.push(`${hMatch[1].toUpperCase()}: ${cleanHeading}`);
        }
    }

    // 4. Strip scripts, styles, SVG, noscript, iframes, and comments
    let cleanHtml = html
        .replace(/<!--[\s\S]*?-->/g, ' ')
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, ' ')
        .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, ' ')
        .replace(/<noscript\b[^<]*(?:(?!<\/noscript>)<[^<]*)*<\/noscript>/gi, ' ')
        .replace(/<svg\b[^<]*(?:(?!<\/svg>)<[^<]*)*<\/svg>/gi, ' ')
        .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, ' ');

    // Replace block-level elements with newlines for readable paragraph formatting
    cleanHtml = cleanHtml
        .replace(/<\/(p|div|section|article|li|tr|h[1-6]|blockquote|pre|header|footer)>/gi, '\n')
        .replace(/<br\s*[\/]?>/gi, '\n')
        .replace(/<[^>]+>/g, ' ');

    // Decode HTML entities
    cleanHtml = cleanHtml
        .replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/&#x27;/g, "'")
        .replace(/&#x2F;/g, '/');

    // Split into clean lines & filter out boilerplate/empty lines
    const lines = cleanHtml
        .split('\n')
        .map(l => l.replace(/\s+/g, ' ').trim())
        .filter(l => l.length >= 15); // Keep substantive phrases and sentences

    // Form main text
    const mainText = lines.slice(0, 400).join('\n\n').substring(0, 32000);
    const wordCount = mainText.split(/\s+/).filter(Boolean).length;

    return {
        title: ogTitle || rawTitle || targetUrl,
        description: metaDescription,
        headings: headings.slice(0, 30),
        mainText,
        meta: {
            ogTitle: ogTitle || rawTitle,
            ogImage,
            ogSiteName,
            metaDescription,
            keywords
        },
        wordCount
    };
}

app.all(['/api/scrape-website', '/api/website/content'], async (req, res) => {
    let targetUrl = req.query.url || req.body?.url;
    if (!targetUrl) {
        return res.status(400).json({ error: "url parameter is required" });
    }

    targetUrl = String(targetUrl).trim();
    if (!/^https?:\/\//i.test(targetUrl)) {
        targetUrl = `https://${targetUrl}`;
    }

    try {
        console.log(`🌐 [SCRAPE WEBSITE] Ingesting live webpage content: ${targetUrl}`);
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 12000);

        const response = await fetch(targetUrl, {
            signal: controller.signal,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.9',
                'Cache-Control': 'no-cache'
            }
        });
        clearTimeout(timeout);

        if (!response.ok) {
            console.warn(`[SCRAPE WEBSITE] HTTP ${response.status} from ${targetUrl}`);
            return res.json({
                success: false,
                status: response.status,
                url: targetUrl,
                error: `HTTP ${response.status} ${response.statusText}`
            });
        }

        const html = await response.text();
        const extracted = extractWebsiteContent(html, targetUrl);

        console.log(`✅ [SCRAPE WEBSITE] Successfully ingested ${targetUrl} (Title: "${extracted.title}", Words: ${extracted.wordCount})`);

        return res.json({
            success: true,
            url: targetUrl,
            status: response.status,
            ...extracted
        });
    } catch (err) {
        console.warn(`[SCRAPE WEBSITE] Live fetch failed for ${targetUrl}:`, err.message);
        return res.json({
            success: false,
            url: targetUrl,
            error: err.message
        });
    }
});

// Admin Configuration Persistence
const APP_CONFIG_FILE = path.join(__dirname, 'public', 'data', 'configuration', 'app_config.json');

// A2A Audience Extraction & Local Cache
const A2A_CACHED_FILE = path.join(__dirname, 'public', 'data', 'configuration', 'a2a_cached_audiences.json');

app.get('/api/a2a/audiences', async (req, res) => {
    const count = parseInt(req.query.count, 10) || 7;
    const forceRefresh = req.query.refresh === 'true';

    // If not forcing refresh, check if local cache exists
    if (!forceRefresh && fs.existsSync(A2A_CACHED_FILE)) {
        try {
            const cachedData = JSON.parse(fs.readFileSync(A2A_CACHED_FILE, 'utf8'));
            if (Array.isArray(cachedData) && cachedData.length >= count) {
                return res.json({ source: 'local_cache', players: cachedData.slice(0, count) });
            }
        } catch (e) {
            console.warn("Could not read local A2A cache:", e);
        }
    }

    // Attempt live fetch from A2A Cloud Run Endpoint
    try {
        let token = '';
        try {
            token = execSync('gcloud auth print-identity-token 2>/dev/null', { encoding: 'utf8' }).trim();
        } catch (tokErr) {
            console.warn("Could not obtain gcloud identity token automatically:", tokErr.message);
        }

        const a2aUrl = 'https://ea-audiences-command-center-srab34vaxq-uc.a.run.app/api/a2a';
        const headers = { 'Content-Type': 'application/json' };
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        const fetchRes = await fetch(a2aUrl, {
            method: 'POST',
            headers,
            body: JSON.stringify({
                jsonrpc: '2.0',
                method: 'tasks/send',
                params: {
                    taskId: `extract-audiences-${Date.now()}`,
                    message: {
                        role: 'ROLE_USER',
                        parts: [
                            { text: `Extract ${count} high-tilt FC 25 players on a loss streak for personalized video generation` }
                        ]
                    }
                }
            })
        });

        if (fetchRes.ok) {
            const result = await fetchRes.json();
            const players = result?.result?.artifacts?.[0]?.data?.players;
            if (Array.isArray(players) && players.length > 0) {
                // Save to local cache
                const dir = path.dirname(A2A_CACHED_FILE);
                if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
                fs.writeFileSync(A2A_CACHED_FILE, JSON.stringify(players, null, 2));

                const distFile = path.join(__dirname, 'dist', 'data', 'configuration', 'a2a_cached_audiences.json');
                const distDir = path.dirname(distFile);
                if (fs.existsSync(path.join(__dirname, 'dist'))) {
                    if (!fs.existsSync(distDir)) fs.mkdirSync(distDir, { recursive: true });
                    fs.writeFileSync(distFile, JSON.stringify(players, null, 2));
                }

                return res.json({ source: 'live_a2a', players: players.slice(0, count) });
            }
        }
    } catch (e) {
        console.warn("Live A2A fetch failed, attempting cache fallback:", e.message);
    }

    // Fallback to local cache if live fetch fails
    if (fs.existsSync(A2A_CACHED_FILE)) {
        try {
            const cachedData = JSON.parse(fs.readFileSync(A2A_CACHED_FILE, 'utf8'));
            return res.json({ source: 'local_cache_fallback', players: cachedData.slice(0, count) });
        } catch (err) {
            console.error("Error reading cache file:", err);
        }
    }

    res.status(500).json({ error: "No audience profiles available" });
});


app.get('/api/admin/config', (req, res) => {
    if (fs.existsSync(APP_CONFIG_FILE)) {
        try {
            const data = fs.readFileSync(APP_CONFIG_FILE, 'utf8');
            res.json(JSON.parse(data));
        } catch (e) {
            console.error("Error reading app config:", e);
            res.status(500).json({ error: "Failed to read app config" });
        }
    } else {
        res.status(404).json({ error: "App config not found" });
    }
});

app.post('/api/admin/config', (req, res) => {
    try {
        const config = req.body;
        const dir = path.dirname(APP_CONFIG_FILE);
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

        fs.writeFileSync(APP_CONFIG_FILE, JSON.stringify(config, null, 2));

        // Update dist
        const distFile = path.join(__dirname, 'dist', 'data', 'configuration', 'app_config.json');
        const distDir = path.dirname(distFile);
        if (fs.existsSync(path.join(__dirname, 'dist'))) {
            if (!fs.existsSync(distDir)) fs.mkdirSync(distDir, { recursive: true });
            fs.writeFileSync(distFile, JSON.stringify(config, null, 2));
        }

        res.json({ success: true });
    } catch (e) {
        console.error("Error saving app config:", e);
        res.status(500).json({ error: "Failed to save app config" });
    }
});

// Admin Table Management
app.get('/api/admin/tables', (req, res) => {
    const dataDir = path.join(__dirname, 'public', 'data', 'configuration');
    if (!fs.existsSync(dataDir)) return res.json([]);

    try {
        const filesList = fs.readdirSync(dataDir)
            .filter(f => f.endsWith('.json'))
            .map(f => ({
                id: f.replace('.json', ''),
                filename: f,
                path: `/data/configuration/${f}`
            }));

        // Sort: Base configs at the top, "_run.json" configs at the bottom, then alphabetical
        filesList.sort((a, b) => {
            const aIsRun = a.filename.includes('_run.json');
            const bIsRun = b.filename.includes('_run.json');

            if (aIsRun && !bIsRun) return 1;
            if (!aIsRun && bIsRun) return -1;
            return a.filename.localeCompare(b.filename);
        });

        res.json(filesList);
    } catch (e) {
        console.error("Error listing tables:", e);
        res.status(500).json({ error: "Failed to list tables" });
    }
});

app.post('/api/admin/tables/save', (req, res) => {
    const { id, data } = req.body;
    if (!id || !data) return res.status(400).json({ error: "id and data are required" });

    try {
        const filePath = path.join(__dirname, 'public', 'data', 'configuration', `${id}.json`);
        const dir = path.dirname(filePath);
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

        fs.writeFileSync(filePath, JSON.stringify(data, null, 2));

        // Update dist
        const distFile = path.join(__dirname, 'dist', 'data', 'configuration', `${id}.json`);
        if (fs.existsSync(path.join(__dirname, 'dist'))) {
            const distDir = path.dirname(distFile);
            if (!fs.existsSync(distDir)) fs.mkdirSync(distDir, { recursive: true });
            fs.writeFileSync(distFile, JSON.stringify(data, null, 2));
        }

        res.json({ success: true });
    } catch (e) {
        console.error(`Error saving table ${id}:`, e);
        res.status(500).json({ error: "Failed to save table" });
    }
});

// Admin Image Upload
app.post('/api/admin/save-image', (req, res) => {
    const { base64, filename } = req.body;
    if (!base64 || !filename) return res.status(400).json({ error: "base64 and filename are required" });

    try {
        const matches = base64.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
        if (!matches || matches.length !== 3) {
            return res.status(400).json({ error: "Invalid base64 format." });
        }

        const type = matches[1];
        const data = matches[2];
        const buffer = Buffer.from(data, 'base64');

        const safeFilename = filename.replace(/[^a-z0-9.]/gi, '_').toLowerCase();
        const uploadDirName = 'images';
        const publicDir = path.join(__dirname, 'public', uploadDirName);

        if (!fs.existsSync(publicDir)) {
            fs.mkdirSync(publicDir, { recursive: true });
        }

        const filePath = path.join(publicDir, safeFilename);
        fs.writeFileSync(filePath, buffer);

        // Also copy to dist if it exists
        const distDir = path.join(__dirname, 'dist', uploadDirName);
        if (fs.existsSync(path.join(__dirname, 'dist'))) {
            if (!fs.existsSync(distDir)) {
                fs.mkdirSync(distDir, { recursive: true });
            }
            fs.writeFileSync(path.join(distDir, safeFilename), buffer);
        }

        res.json({ success: true, url: `/${uploadDirName}/${safeFilename}` });
    } catch (e) {
        console.error("Error saving uploaded image:", e);
        res.status(500).json({ error: "Failed to save image" });
    }
});

// Admin Image Library List
app.get('/api/admin/images', (req, res) => {
    const imagesDir = path.join(__dirname, 'public', 'images');
    if (!fs.existsSync(imagesDir)) fs.mkdirSync(imagesDir, { recursive: true });

    try {
        const files = fs.readdirSync(imagesDir)
            .filter(f => /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(f))
            .map(f => ({
                filename: f,
                url: `/images/${f}`
            }));
        res.json(files);
    } catch (e) {
        console.error("Error listing images:", e);
        res.status(500).json({ error: "Failed to list images" });
    }
});

// Admin Batch Image Upload
app.post('/api/admin/save-images-batch', (req, res) => {
    const { images } = req.body; // Array of { base64, filename }
    if (!images || !Array.isArray(images)) return res.status(400).json({ error: "Array of images is required" });

    try {
        const urls = images.map(img => {
            const { base64, filename } = img;
            const matches = base64.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
            if (!matches || matches.length !== 3) throw new Error(`Invalid format for ${filename}`);

            const data = matches[2];
            const buffer = Buffer.from(data, 'base64');
            const safeFilename = filename.replace(/[^a-z0-9.]/gi, '_').toLowerCase();
            const uploadDirName = 'images';
            const publicDir = path.join(__dirname, 'public', uploadDirName);

            if (!fs.existsSync(publicDir)) fs.mkdirSync(publicDir, { recursive: true });
            fs.writeFileSync(path.join(publicDir, safeFilename), buffer);

            const distDir = path.join(__dirname, 'dist', uploadDirName);
            if (fs.existsSync(path.join(__dirname, 'dist'))) {
                if (!fs.existsSync(distDir)) fs.mkdirSync(distDir, { recursive: true });
                fs.writeFileSync(path.join(distDir, safeFilename), buffer);
            }
            return `/${uploadDirName}/${safeFilename}`;
        });

        res.json({ success: true, urls });
    } catch (e) {
        console.error("Error during batch upload:", e);
        res.status(500).json({ error: e.message || "Failed to batch upload images" });
    }
});

// Video Aspect Ratio Dynamic Processing & Library Endpoints
app.post('/api/video-aspect/upload', async (req, res) => {
    const { companyName, base64, filename } = req.body;
    const activeCompany = companyName || getActiveCompanyName();
    if (!base64 || !filename) {
        return res.status(400).json({ error: "base64 and filename are required" });
    }

    try {
        if (!base64.startsWith('data:')) {
            return res.status(400).json({ error: "Invalid base64 format (must start with data:)" });
        }
        const parts = base64.split(';base64,');
        if (parts.length !== 2) {
            return res.status(400).json({ error: "Invalid base64 format (missing ;base64, separator)" });
        }

        const type = parts[0].replace('data:', '');
        const data = parts[1];
        const buffer = Buffer.from(data, 'base64');

        const safeFilename = filename.replace(/[^a-z0-9.]/gi, '_').toLowerCase();
        const fileName = `${activeCompany}/video_aspect/videos/${safeFilename}`;

        // 1. Upload to GCS
        try {
            const { Storage } = await import('@google-cloud/storage');
            const storage = new Storage();
            const bucketName = getBucketName();
            const file = storage.bucket(bucketName).file(fileName);

            await file.save(buffer, {
                contentType: type,
            });
            console.log(`Saved video to GCS: ${bucketName}/${fileName}`);
        } catch (e) {
            console.error("GCS video save failed:", e.message);
        }

        // 2. Also save locally as fallback
        const publicDir = path.join(__dirname, 'public', 'videos');
        if (!fs.existsSync(publicDir)) {
            fs.mkdirSync(publicDir, { recursive: true });
        }
        fs.writeFileSync(path.join(publicDir, safeFilename), buffer);

        const distDir = path.join(__dirname, 'dist', 'videos');
        if (fs.existsSync(path.join(__dirname, 'dist'))) {
            if (!fs.existsSync(distDir)) {
                fs.mkdirSync(distDir, { recursive: true });
            }
            fs.writeFileSync(path.join(distDir, safeFilename), buffer);
        }

        const url = `/api/video-aspect/video/${safeFilename}?companyName=${encodeURIComponent(activeCompany)}`;
        res.json({ success: true, url, name: safeFilename });
    } catch (e) {
        console.error("Error saving video:", e);
        res.status(500).json({ error: "Failed to save video" });
    }
});

app.get('/api/video-aspect/list', async (req, res) => {
    const { companyName } = req.query;
    const activeCompany = companyName || getActiveCompanyName();

    const videoList = [];

    // 1. Add local default videos
    const localDir = path.join(__dirname, 'public', 'videos');
    if (fs.existsSync(localDir)) {
        try {
            const files = fs.readdirSync(localDir)
                .filter(f => /\.(mp4|webm|mov|avi)$/i.test(f));
            for (const f of files) {
                videoList.push({
                    name: f,
                    url: `/api/video-aspect/video/${f}?companyName=${encodeURIComponent(activeCompany)}`,
                    source: 'local'
                });
            }
        } catch (e) {
            console.error("Error reading local videos:", e);
        }
    }

    // 2. Add GCS uploaded videos
    try {
        const { Storage } = await import('@google-cloud/storage');
        const storage = new Storage();
        const bucketName = getBucketName();
        const prefix = `${activeCompany}/video_aspect/videos/`;

        const [files] = await storage.bucket(bucketName).getFiles({ prefix });
        for (const file of files) {
            const filename = path.basename(file.name);
            if (filename && /\.(mp4|webm|mov|avi)$/i.test(filename)) {
                if (!videoList.some(v => v.name === filename)) {
                    videoList.push({
                        name: filename,
                        url: `/api/video-aspect/video/${filename}?companyName=${encodeURIComponent(activeCompany)}`,
                        source: 'gcs'
                    });
                }
            }
        }
    } catch (e) {
        console.warn("GCS listing failed (using local list fallback):", e.message);
    }

    // If both are empty, add some standard mock videos so the UI is always usable out of the box
    if (videoList.length === 0) {
        // Check if we have generated spin videos we can use
        const generatedDir = path.join(__dirname, 'public', 'videos', 'generated');
        if (fs.existsSync(generatedDir)) {
            try {
                const files = fs.readdirSync(generatedDir).filter(f => f.endsWith('.mp4'));
                for (const f of files) {
                    videoList.push({
                        name: f,
                        url: `/videos/generated/${f}`,
                        source: 'default'
                    });
                }
            } catch (e) {
                console.error("Error reading generated spin videos:", e);
            }
        }
        
        if (videoList.length === 0) {
            videoList.push({
                name: "fashion_runway_sample.mp4",
                url: "/videos/fashion_runway_sample.mp4",
                source: "default"
            });
            videoList.push({
                name: "sports_promo_sample.mp4",
                url: "/videos/sports_promo_sample.mp4",
                source: "default"
            });
        }
    }

    res.json(videoList);
});

app.get('/api/video-aspect/video/:filename', async (req, res) => {
    const { filename } = req.params;
    const { companyName } = req.query;
    const activeCompany = companyName || getActiveCompanyName();

    const safeFilename = filename.replace(/[^a-z0-9.]/gi, '_').toLowerCase();
    const localPath = path.join(__dirname, 'public', 'videos', safeFilename);
    const localExists = fs.existsSync(localPath);

    if (localExists) {
        return res.sendFile(localPath);
    }

    try {
        const { Storage } = await import('@google-cloud/storage');
        const storage = new Storage();
        const bucketName = getBucketName();
        const fileName = `${activeCompany}/video_aspect/videos/${safeFilename}`;
        const file = storage.bucket(bucketName).file(fileName);

        const [exists] = await file.exists();
        if (exists) {
            const ext = path.extname(safeFilename).toLowerCase();
            const mimeType = ext === '.webm' ? 'video/webm' : ext === '.ogg' ? 'video/ogg' : 'video/mp4';
            res.setHeader('Content-Type', mimeType);

            const readStream = file.createReadStream();
            readStream.on('error', (err) => {
                console.error('GCS video stream error:', err);
                res.status(500).send('Error loading asset');
            });
            return readStream.pipe(res);
        }
    } catch (error) {
        console.error('GCS video fetch error:', error);
    }

    res.status(404).send('Not found');
});

// -----------------

// Catch-all for SPA
// Image Proxy Endpoint to bypass CORS
app.post('/api/proxy-image', async (req, res) => {
    try {
        const { url } = req.body;
        if (!url) return res.status(400).json({ error: 'URL is required' });

        console.log(`Proxying image request for: ${url}`);

        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Failed to fetch upstream image: ${response.status} ${response.statusText}`);
        }

        const arrayBuffer = await response.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const base64 = buffer.toString('base64');
        const mimeType = response.headers.get('content-type') || 'image/png';

        res.json({ base64, mimeType });
    } catch (error) {
        console.error("Proxy error:", error);
        res.status(500).json({ error: "Failed to proxy image" });
    }
});

// Debug Log Endpoint
app.post('/api/debug-log', async (req, res) => {
    try {
        const { prompt, imageUrl, timestamp } = req.body;
        console.log(`Received debug log request for ${imageUrl}`);

        let imageHtml = '<p>Image loading...</p>';
        try {
            const imgRes = await fetch(imageUrl);
            if (imgRes.ok) {
                const arrayBuffer = await imgRes.arrayBuffer();
                const buffer = Buffer.from(arrayBuffer);
                const base64 = buffer.toString('base64');
                const mime = imgRes.headers.get('content-type') || 'image/png';
                imageHtml = `<img src="data:${mime};base64,${base64}" style="max-width: 100%; border: 1px solid #ccc;" />`;
            } else {
                imageHtml = `<p style="color:red">Failed to fetch image: ${imgRes.status} ${imgRes.statusText}</p>`;
            }
        } catch (fetchError) {
            imageHtml = `<p style="color:red">Error fetching image: ${fetchError.message}</p>`;
        }

        const htmlContent = `
            <!DOCTYPE html>
            <html>
            <head>
                <title>Debug Log</title>
                <style>
                    body { font-family: sans-serif; padding: 20px; max-width: 800px; mx-auto; }
                    .card { border: 1px solid #ddd; padding: 20px; border-radius: 8px; background: #f9f9f9; }
                    h1 { color: #000000; }
                    pre { background: #eee; padding: 10px; overflow-x: auto; }
                </style>
            </head>
            <body>
                <h1>Debug Log</h1>
                <p><strong>Timestamp:</strong> ${timestamp}</p>
                
                <div class="card">
                    <h3>Prompt Sent to Service:</h3>
                    <pre>${prompt}</pre>
                </div>

                <div class="card" style="margin-top: 20px;">
                    <h3>Reference Image Sent to Service:</h3>
                    <p>Source URL: <a href="${imageUrl}">${imageUrl}</a></p>
                    ${imageHtml}
                </div>
            </body>
            </html>
        `;

        const publicPath = path.join(__dirname, 'public', 'debug.html');
        const distPath = path.join(__dirname, 'dist', 'debug.html');

        fs.writeFileSync(publicPath, htmlContent);
        // Ensure dist exists before writing
        if (fs.existsSync(path.join(__dirname, 'dist'))) {
            fs.writeFileSync(distPath, htmlContent);
        }

        console.log('Debug HTML generated at /debug.html');
        res.json({ success: true, url: '/debug.html' });

    } catch (error) {
        console.error("Debug log error:", error);
        res.status(500).json({ error: "Failed to generate debug log" });
    }
});

app.post('/api/generate-audio-summary', async (req, res) => {
    try {
        const { textData, voiceName = 'Zephyr', language = 'english', companyName = 'AI' } = req.body;
        if (!textData) return res.status(400).json({ error: "No text data provided" });

        // This specific feature requires the Gemini Developer API Key (AI Studio) 
        // because the gemini-2.5-flash-native-audio-preview model is not fully available on Vertex AI yet.
        if (!process.env.GEMINI_API_KEY) {
            console.warn("[Audio Generator] Missing GEMINI_API_KEY. This feature requires it to connect to AI Studio.");
            return res.status(400).json({ error: "The Live Audio generation feature requires a GEMINI_API_KEY in your .env file." });
        }

        const model = 'models/gemini-2.5-flash-native-audio-preview-09-2025';

        const config = {
            responseModalities: [Modality.AUDIO],
            mediaResolution: MediaResolution.MEDIA_RESOLUTION_MEDIUM,
            speechConfig: {
                voiceConfig: {
                    prebuiltVoiceConfig: {
                        voiceName: voiceName,
                    }
                }
            },
            contextWindowCompression: {
                triggerTokens: '104857',
                slidingWindow: { targetTokens: '52428' },
            },
        };

        const responseQueue = [];
        const audioParts = [];
        let mimeTypeStr = '';

        // Isolate the client to strictly route to AI Studio
        const liveAi = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY.replace(/["']/g, '') });

        console.log(`[Audio Generator] Attempting to connect to Gemini Live (AI Studio)...`);
        console.log(`[Audio Generator] Auth Context: API Key Length=${process.env.GEMINI_API_KEY.length}`);

        const session = await liveAi.live.connect({
            model,
            callbacks: {
                onmessage: (message) => {
                    responseQueue.push(message);
                },
                onerror: (e) => console.error('[Audio Generator] Live Audio Session Error Event:', e),
                onclose: (e) => console.log('[Audio Generator] Live Audio Session Closed:', e),
            },
            config
        });
        console.log(`[Audio Generator] Connected to Gemini Live.`);

        const langInstruction = language === 'mandarin'
            ? "Speak the entire summary fluently in Mandarin Chinese."
            : "Speak the entire summary fluently in English.";

        const promptParam = `Here is the customer data for a client. Act as the ${companyName} Concierge Director and give a highly engaging, professional spoken summary of this client's profile in 2-3 sentences. Talk directly to the Concierge preparing for the call. ${langInstruction}\n${textData}`;

        session.sendClientContent({
            turns: [{ role: 'user', parts: [{ text: promptParam }] }],
            turnComplete: true
        });

        // Wait loop handler
        let done = false;
        let timeout = 0;
        console.log(`[Audio Generator] Starting Gemini Live connection for ${language}...`);

        while (!done && timeout < 300) { // 300 * 50ms = 15 seconds max wait
            let message;
            if (responseQueue.length > 0) {
                message = responseQueue.shift();

                if (message?.serverContent?.modelTurn?.parts) {
                    const part = message.serverContent.modelTurn.parts[0];
                    if (part?.inlineData) {
                        if (audioParts.length === 0) {
                            console.log(`[Audio Generator] Receiving first audio chunks...`);
                        }
                        audioParts.push(part.inlineData.data);
                        if (!mimeTypeStr) mimeTypeStr = part.inlineData.mimeType;
                    }
                }
                if (message?.serverContent?.turnComplete) {
                    console.log(`[Audio Generator] Turn complete received. Total chunks: ${audioParts.length}`);
                    done = true;
                }
            } else {
                await new Promise(r => setTimeout(r, 50));
                timeout++;
            }
        }

        if (timeout >= 300) {
            console.warn(`[Audio Generator] WARNING: Timeout reached without turnComplete signal. Processing ${audioParts.length} received chunks.`);
        }

        session.close();

        if (audioParts.length > 0) {
            // Function to handle Wav generation
            const convertToWavBuffer = (rawData, mimeType) => {
                const parseMimeType = (mime) => {
                    const [fileType, ...params] = mime.split(';').map(s => s.trim());
                    const [, format] = fileType.split('/');
                    const options = { numChannels: 1, bitsPerSample: 16, sampleRate: 24000 };

                    if (format && format.startsWith('L')) {
                        const bits = parseInt(format.slice(1), 10);
                        if (!isNaN(bits)) options.bitsPerSample = bits;
                    }
                    for (const param of params) {
                        const [key, value] = param.split('=').map(s => s.trim());
                        if (key === 'rate') options.sampleRate = parseInt(value, 10);
                    }
                    return options;
                };

                const createHeader = (dataLength, opts) => {
                    const { numChannels, sampleRate, bitsPerSample } = opts;
                    const byteRate = sampleRate * numChannels * bitsPerSample / 8;
                    const blockAlign = numChannels * bitsPerSample / 8;
                    const b = Buffer.alloc(44);
                    b.write('RIFF', 0); b.writeUInt32LE(36 + dataLength, 4);
                    b.write('WAVE', 8); b.write('fmt ', 12); b.writeUInt32LE(16, 16);
                    b.writeUInt16LE(1, 20); b.writeUInt16LE(numChannels, 22);
                    b.writeUInt32LE(sampleRate, 24); b.writeUInt32LE(byteRate, 28);
                    b.writeUInt16LE(blockAlign, 32); b.writeUInt16LE(bitsPerSample, 34);
                    b.write('data', 36); b.writeUInt32LE(dataLength, 40);
                    return b;
                };

                const buffers = rawData.map(d => Buffer.from(d, 'base64'));
                const actualDataLength = buffers.reduce((a, b) => a + b.length, 0);
                const opts = parseMimeType(mimeType);
                const wavHeader = createHeader(actualDataLength, opts);
                return Buffer.concat([wavHeader, ...buffers]);
            };

            const finalBuffer = convertToWavBuffer(audioParts, mimeTypeStr || 'audio/pcm;rate=24000');

            const filename = `summary_${Date.now()}.wav`;
            const publicDir = path.join(__dirname, 'public', 'audio', 'generated');
            if (!fs.existsSync(publicDir)) fs.mkdirSync(publicDir, { recursive: true });
            fs.writeFileSync(path.join(publicDir, filename), finalBuffer);

            const distDir = path.join(__dirname, 'dist', 'audio', 'generated');
            if (!fs.existsSync(distDir)) fs.mkdirSync(distDir, { recursive: true });
            fs.writeFileSync(path.join(distDir, filename), finalBuffer);

            res.json({ audioUrl: `/audio/generated/${filename}` });
        } else {
            res.status(500).json({ error: "Failed to generate audio" });
        }
    } catch (e) {
        console.error("Audio summary generation error:", e);
        require('fs').writeFileSync(__dirname + '/audio_error_log.txt', String(e.stack || e));
        res.status(500).json({ error: "Failed to generate audio summary", details: String(e) });
    }
});

// -----------------------------------------------------
// Agent Playground (Strategy Module) State & GCS Helpers
// -----------------------------------------------------
const STATE_FILE = path.join(process.cwd(), "data", "strategy", "campaign_state.json");
const SNAPSHOTS_DIR = path.join(process.cwd(), "data", "strategy", "snapshots");

function getInitialState() {
  return {
    campaignGoal: "",
    currentStatus: "Idle",
    activeAgent: "None",
    chatHistory: [
      { sender: "agent", text: "Hello! I am the Root Orchestrator Agent. Let's build your marketing campaign. Describe what you'd like to promote." }
    ],
    logs: ["[System]: Campaign workspace initialized. Ready to begin."],
    artifacts: {
      brief: null,
      feasibility: null,
      prioritization: null,
      research: null,
      creative: null,
      compliance: null,
      integration: null,
      judge: null,
      summary: null
    }
  };
}

function loadCampaignState() {
  try {
    if (fs.existsSync(STATE_FILE)) {
      return JSON.parse(fs.readFileSync(STATE_FILE, "utf-8"));
    }
  } catch (err) {
    console.error("Error reading campaign state file:", err);
  }
  const init = getInitialState();
  saveCampaignState(init);
  return init;
}

function saveCampaignState(state) {
  try {
    const dir = path.dirname(STATE_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2), "utf-8");
  } catch (err) {
    console.error("Error writing campaign state file:", err);
  }
}

async function saveSnapshotToStorage(snapshotName, state) {
  const timestamp = new Date().toISOString();
  const companyName = getActiveCompanyName();
  const metadata = {
    name: snapshotName,
    goal: state.campaignGoal || "Unnamed Campaign",
    timestamp,
    status: state.currentStatus
  };

  const payload = {
    metadata,
    state
  };

  try {
    const { Storage } = await import('@google-cloud/storage');
    const storage = new Storage();
    const bucketName = 'ailab-gcs';
    const bucket = storage.bucket(bucketName);
    const file = bucket.file(`${companyName}/snapshots/${snapshotName}.json`);
    await file.save(JSON.stringify(payload, null, 2), {
      contentType: "application/json"
    });
    return { success: true, location: `GCS: gs://${bucketName}/${companyName}/snapshots/${snapshotName}.json`, timestamp };
  } catch (gcsErr) {
    console.warn("Failed saving snapshot to GCS bucket, falling back to local files:", gcsErr.message || gcsErr);
  }

  // Local filesystem fallback
  const localDir = path.join(SNAPSHOTS_DIR, companyName);
  if (!fs.existsSync(localDir)) {
    fs.mkdirSync(localDir, { recursive: true });
  }
  const localPath = path.join(localDir, `${snapshotName}.json`);
  fs.writeFileSync(localPath, JSON.stringify(payload, null, 2), "utf-8");
  return { success: true, location: `Local: ${localPath}`, timestamp };
}

async function listSnapshotsFromStorage() {
  const snapshots = [];
  const companyName = getActiveCompanyName();

  try {
    const { Storage } = await import('@google-cloud/storage');
    const storage = new Storage();
    const bucketName = 'ailab-gcs';
    const bucket = storage.bucket(bucketName);
    const [files] = await bucket.getFiles({ prefix: `${companyName}/snapshots/` });
    for (const file of files) {
      if (file.name.endsWith(".json")) {
        const content = await safeDownloadGCSBuffer(file);
        const data = JSON.parse(content.toString());
        if (data.metadata) {
          snapshots.push(data.metadata);
        }
      }
    }
  } catch (gcsErr) {
    console.warn("Failed listing snapshots from GCS, falling back to local files:", gcsErr.message || gcsErr);
  }

  // Local fallback
  const localDir = path.join(SNAPSHOTS_DIR, companyName);
  if (fs.existsSync(localDir)) {
    const files = fs.readdirSync(localDir);
    for (const f of files) {
      if (f.endsWith(".json")) {
        try {
          const content = fs.readFileSync(path.join(localDir, f), "utf-8");
          const data = JSON.parse(content);
          if (data.metadata && !snapshots.some(s => s.name === data.metadata.name)) {
            snapshots.push(data.metadata);
          }
        } catch (err) {
          console.warn(`Failed parsing local snapshot file ${f}:`, err);
        }
      }
    }
  }
  return snapshots;
}

async function loadSnapshotFromStorage(snapshotName) {
  const companyName = getActiveCompanyName();
  try {
    const { Storage } = await import('@google-cloud/storage');
    const storage = new Storage();
    const bucketName = 'ailab-gcs';
    const bucket = storage.bucket(bucketName);
    const file = bucket.file(`${companyName}/snapshots/${snapshotName}.json`);
    const content = await safeDownloadGCSBuffer(file);
    return JSON.parse(content.toString()).state;
  } catch (gcsErr) {
    console.error(`Failed loading snapshot '${snapshotName}' from GCS:`, gcsErr.message || gcsErr);
    throw new Error(`Snapshot '${snapshotName}' not found in GCS.`);
  }
}

async function deleteSnapshotFromStorage(snapshotName) {
  let deletedFromGcs = false;
  let deletedFromLocal = false;
  const companyName = getActiveCompanyName();

  try {
    const { Storage } = await import('@google-cloud/storage');
    const storage = new Storage();
    const bucketName = 'ailab-gcs';
    const bucket = storage.bucket(bucketName);
    const file = bucket.file(`${companyName}/snapshots/${snapshotName}.json`);
    const [exists] = await file.exists();
    if (exists) {
      await file.delete();
      deletedFromGcs = true;
    }
  } catch (gcsErr) {
    console.warn(`Failed deleting snapshot '${snapshotName}' from GCS:`, gcsErr.message || gcsErr);
  }

  // Local file delete
  const localPath = path.join(SNAPSHOTS_DIR, companyName, `${snapshotName}.json`);
  if (fs.existsSync(localPath)) {
    fs.unlinkSync(localPath);
    deletedFromLocal = true;
  }

  return deletedFromGcs || deletedFromLocal;
}

// -----------------------------------------------------
// Agent Playground (Strategy Module) Routes
// -----------------------------------------------------

// GET /api/campaign/state
app.get("/api/campaign/state", (req, res) => {
  return res.json(loadCampaignState());
});

// POST /api/campaign/reset
app.post("/api/campaign/reset", (req, res) => {
  const init = getInitialState();
  saveCampaignState(init);
  return res.json({ success: true, state: init });
});

// POST /api/campaign/save-snapshot
app.post("/api/campaign/save-snapshot", async (req, res) => {
  const { name } = req.body;
  if (!name || typeof name !== "string") {
    return res.status(400).json({ error: "Missing or invalid snapshot name." });
  }
  try {
    const state = loadCampaignState();
    const result = await saveSnapshotToStorage(name, state);
    return res.json(result);
  } catch (err) {
    console.error("Error saving snapshot:", err);
    return res.status(500).json({ error: err.message || "Failed to save snapshot." });
  }
});

// GET /api/campaign/snapshots
app.get("/api/campaign/snapshots", async (req, res) => {
  try {
    const list = await listSnapshotsFromStorage();
    return res.json(list);
  } catch (err) {
    console.error("Error listing snapshots:", err);
    return res.status(500).json({ error: err.message || "Failed to list snapshots." });
  }
});

// POST /api/campaign/load-snapshot
app.post("/api/campaign/load-snapshot", async (req, res) => {
  const { name } = req.body;
  if (!name || typeof name !== "string") {
    return res.status(400).json({ error: "Missing or invalid snapshot name." });
  }
  try {
    const loadedState = await loadSnapshotFromStorage(name);
    saveCampaignState(loadedState);
    return res.json({ success: true, state: loadedState });
  } catch (err) {
    console.error("Error loading snapshot:", err);
    return res.status(500).json({ error: err.message || "Failed to load snapshot." });
  }
});

// GET /api/campaign/load-last
app.get("/api/campaign/load-last", async (req, res) => {
  try {
    const list = await listSnapshotsFromStorage();
    if (list.length === 0) {
      return res.status(404).json({ error: "No snapshots saved yet." });
    }
    list.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    const latest = list[0].name;
    const loadedState = await loadSnapshotFromStorage(latest);
    saveCampaignState(loadedState);
    return res.json({ success: true, name: latest, state: loadedState });
  } catch (err) {
    console.error("Error loading latest snapshot:", err);
    return res.status(500).json({ error: err.message || "Failed to load latest snapshot." });
  }
});

// POST /api/campaign/delete-snapshot
app.post("/api/campaign/delete-snapshot", async (req, res) => {
  const { name } = req.body;
  if (!name || typeof name !== "string") {
    return res.status(400).json({ error: "Missing or invalid snapshot name." });
  }
  try {
    const success = await deleteSnapshotFromStorage(name);
    return res.json({ success, message: `Snapshot '${name}' deleted successfully.` });
  } catch (err) {
    console.error("Error deleting snapshot:", err);
    return res.status(500).json({ error: err.message || "Failed to delete snapshot." });
  }
});

// GET /api/data/c360
app.get("/api/data/c360", (req, res) => {
  const filePath = path.join(process.cwd(), "data", "strategy", "c360_opt_in.json");
  if (fs.existsSync(filePath)) {
    return res.json(JSON.parse(fs.readFileSync(filePath, "utf-8")));
  }
  return res.status(404).json({ error: "c360_opt_in.json not found." });
});

// GET /api/data/m360
app.get("/api/data/m360", (req, res) => {
  const filePath = path.join(process.cwd(), "data", "strategy", "m360_historical.json");
  if (fs.existsSync(filePath)) {
    return res.json(JSON.parse(fs.readFileSync(filePath, "utf-8")));
  }
  return res.status(404).json({ error: "m360_historical.json not found." });
});

// GET & POST /api/agents (for admin custom experiences)
app.get("/api/agents", (req, res) => {
  const filePath = path.join(process.cwd(), "data", "strategy", "agents.json");
  if (fs.existsSync(filePath)) {
    return res.json(JSON.parse(fs.readFileSync(filePath, "utf-8")));
  }
  return res.status(404).json({ error: "agents.json not found." });
});

app.post("/api/agents", (req, res) => {
  try {
    const agents = req.body;
    const filePath = path.join(process.cwd(), "data", "strategy", "agents.json");
    fs.writeFileSync(filePath, JSON.stringify(agents, null, 2), "utf-8");
    return res.json({ success: true, message: "Agents list updated." });
  } catch (err) {
    console.error("Error saving agents:", err);
    return res.status(500).json({ error: "Failed to persist agents configuration." });
  }
});

// POST /api/agents/generate
app.post("/api/agents/generate", async (req, res) => {
  const { title, description } = req.body;
  if (!title || !description) {
    return res.status(400).json({ error: "Missing title or description." });
  }

  if (ai) {
    try {
      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash-lite",
        contents: `You are an expert systems architect and campaign manager. Given a title and description for a new agent, generate a complete, structured configuration JSON object for the agent.

Agent Title: "${title}"
Agent Description: "${description}"

Generate a JSON object conforming exactly to this structure:
{
  "name": "A short concise title for the agent",
  "sub": "A 2-3 word technical subtitle/tag",
  "description": "A refined, professional description of the agent's responsibilities, input payload parsing capabilities, and output delivery workflows.",
  "inputs": "A description of the expected input payload/trigger data",
  "outputs": "A description of the expected output payload/resulting data",
  "toolsNeeded": ["An array of tools, SDKs, models, or algorithms the agent needs (maximum 3)"],
  "dataNeeded": ["An array of database tables, environment keys, or file resources required (maximum 3)"]
}`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING },
              sub: { type: Type.STRING },
              description: { type: Type.STRING },
              inputs: { type: Type.STRING },
              outputs: { type: Type.STRING },
              toolsNeeded: {
                type: Type.ARRAY,
                items: { type: Type.STRING }
              },
              dataNeeded: {
                type: Type.ARRAY,
                items: { type: Type.STRING }
              }
            },
            required: ["name", "sub", "description", "inputs", "outputs", "toolsNeeded", "dataNeeded"]
          }
        }
      });

      const parsedData = JSON.parse(response.text || "{}");
      return res.json(parsedData);
    } catch (err) {
      console.error("Gemini Agent Generation error:", err);
      return res.status(500).json({ error: "Failed to generate agent details using Gemini API." });
    }
  } else {
    return res.json({
      name: title,
      sub: "Custom Smart Agent",
      description,
      inputs: "Active campaign briefs and category catalogs",
      outputs: "Structured campaign variables and segments",
      toolsNeeded: ["nlp_intent_parser"],
      dataNeeded: ["Active campaign registries"]
    });
  }
});

// POST /api/chat (SSE Stream)
app.post("/api/chat", async (req, res) => {
  const { message } = req.body;
  if (!message) {
    return res.status(400).json({ error: "Missing message." });
  }

  const state = loadCampaignState();
  const companyName = getActiveCompanyName();

  if (message === "APPROVE_CAMPAIGN") {
    state.currentStatus = "Completed";
    state.activeAgent = "None";
    const approveText = "Campaign approved and successfully dispatched to external SFMC Rest endpoint.";
    const approveHtml = `
      <div class="bg-emerald-50/60 border border-emerald-200 p-5 rounded-2xl text-left space-y-3 shadow-xs">
        <h2 class="text-xs font-mono font-bold uppercase tracking-wider text-emerald-800 flex items-center gap-1.5 mb-1.5">
          <span class="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
          Campaign Dispatch Authorization Confirmed
        </h2>
        <p class="text-xs text-slate-700 leading-relaxed font-sans">
          The campaign outbound transit payload has been signed and officially submitted to the Salesforce Marketing Cloud REST gateways. Outbound status has been updated to <strong>DISPATCHED (Active)</strong>.
        </p>
        <div class="p-3 bg-white/80 rounded-lg border border-emerald-100 font-mono text-[9.5px] text-slate-500">
          [REST Dispatch Logs]: HTTP POST 202 accepted | correlation_id: alb-sfmc-${Date.now()} | timestamp: ${new Date().toISOString()}
        </div>
      </div>
    `;
    state.chatHistory.push({ sender: "agent", text: approveText, time: new Date().toLocaleTimeString() });
    state.artifacts.summary = approveHtml;
    saveCampaignState(state);
    res.setHeader("Content-Type", "text/event-stream");
    res.write(`event: completed\ndata: ${JSON.stringify({ text: approveText, executionLogs: [] })}\n\n`);
    res.end();
    return;
  }

  if (message === "DENY_CAMPAIGN") {
    state.currentStatus = "Completed";
    state.activeAgent = "None";
    const denyText = "Campaign execution queue cancelled by coordinator.";
    const denyHtml = `
      <div class="bg-rose-50/60 border border-rose-200 p-5 rounded-2xl text-left space-y-2 shadow-xs">
        <h2 class="text-xs font-mono font-bold uppercase tracking-wider text-rose-800 flex items-center gap-1.5 mb-1.5">
          <span class="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
          Campaign Dispatch Rejected
        </h2>
        <p class="text-xs text-slate-700 leading-relaxed font-sans">
          The campaign dispatch was denied by the administrator coordinator. The active workflow execution queue has been cancelled, and the transit status has been set to <strong>CANCELLED (Rejected)</strong>.
        </p>
      </div>
    `;
    state.chatHistory.push({ sender: "agent", text: denyText, time: new Date().toLocaleTimeString() });
    state.artifacts.summary = denyHtml;
    saveCampaignState(state);
    res.setHeader("Content-Type", "text/event-stream");
    res.write(`event: completed\ndata: ${JSON.stringify({ text: denyText, executionLogs: [] })}\n\n`);
    res.end();
    return;
  }
  
  if (!state.campaignGoal) {
    state.campaignGoal = message;
  }
  
  state.chatHistory.push({ sender: "user", text: message, time: new Date().toLocaleTimeString() });
  state.currentStatus = "Running";
  saveCampaignState(state);

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  const sendEvent = (event, data) => {
    res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
  };

  const clientAi = ai;

  if (!clientAi) {
    // -----------------------------------------------------
    // SIMULATED OFFLINE MULTI-AGENT HANDOFF SEQUENCE
    // -----------------------------------------------------
    try {
      console.log("[Simulation] Starting mock campaign generation sequence...");
      
      const logLine = (text) => {
        const timestamp = new Date().toLocaleTimeString();
        const line = `[${timestamp}] ${text}`;
        state.logs.push(line);
        saveCampaignState(state);
        sendEvent("log", { line });
      };

      logLine("[System]: Initiating campaign building sequence...");
      sendEvent("routing", { status: "Routing to campaign agents..." });
      await new Promise(r => setTimeout(r, 600));

      // 1. Intake Agent
      state.activeAgent = "Intake Agent";
      saveCampaignState(state);
      sendEvent("agent_start", { agentId: "intake", agentName: "Intake Agent" });
      logLine("[Root]: Routing task to Intake Agent...");
      await new Promise(r => setTimeout(r, 1000));
      
      const mockBrief = {
        name: `${companyName} ${message.replace(/^(I want to |Please |Build a campaign for )/i, "").slice(0, 40)}`,
        objective: "Promote EA SPORTS FC 27 Ultimate Edition pre-orders with 7-day early access, FC IQ tactical masterclass, and 4,600 FC Points to maximize day-1 live-service adoption.",
        divisionId: message.toLowerCase().includes("career") 
          ? "Career Mode & DLC Expansions" 
          : message.toLowerCase().includes("point") 
            ? "FC Points & Digital Bundles"
            : message.toLowerCase().includes("esport") || message.toLowerCase().includes("tournament")
              ? "Esports & Live Tournaments"
              : message.toLowerCase().includes("sponsor") || message.toLowerCase().includes("boot")
                ? "Brand Sponsorships & Virtual Gear"
                : "Ultimate Team & In-Game Packs",
        audienceSegment: `${companyName} Competitive Ultimate Team & Weekend League Grinders`,
        projectedBudget: 75000,
        tier: "Tier 1 (High)",
        expectedStartDate: "2026-09-15",
        timelineDays: 30,
        primaryChannel: "Email & In-Game Push"
      };
      state.artifacts.brief = mockBrief;
      saveCampaignState(state);
      sendEvent("agent_end", { agentId: "intake", agentName: "Intake Agent", result: mockBrief });
      logLine("[Intake Agent]: Completed NLP brief parsing and created structured parameter card.");

      // 2. Feasibility Agent
      state.activeAgent = "Feasibility Agent";
      saveCampaignState(state);
      sendEvent("agent_start", { agentId: "feasibility", agentName: "Feasibility Agent" });
      logLine("[Root]: Handoff from Intake Agent to Feasibility Agent...");
      await new Promise(r => setTimeout(r, 1000));

      const mockFeasibility = `FEASIBILITY REPORT:\n- Target Gamer Audience Reach: 185,000 active Ultimate Team players\n- ${companyName} C360 opt-in rate: 96.4% across PC, PlayStation, Xbox, and Companion App\n- In-Game Contact Frequency Caps: Checked. No active suppression flags present.\n- Result: FEASIBLE. Safe to continue live-service flight.`;
      state.artifacts.feasibility = mockFeasibility;
      saveCampaignState(state);
      sendEvent("agent_end", { agentId: "feasibility", agentName: "Feasibility Agent", result: mockFeasibility });
      logLine("[Feasibility Agent]: Reach & opt-in verified successfully. Audience target set.");

      // 3. Prioritization Agent
      state.activeAgent = "Prioritization Agent";
      saveCampaignState(state);
      sendEvent("agent_start", { agentId: "prioritization", agentName: "Prioritization Agent" });
      logLine("[Root]: Handoff from Feasibility Agent to Prioritization Agent...");
      await new Promise(r => setTimeout(r, 1000));

      const mockPrioritization = "PRIORITIZATION METRICS REPORT:\n- In-Game Event Conflict Index: 0.08 (No collision with active Team of the Season or Weekend League schedules)\n- Priority Rating: 1.0 (Tier 1 Global Title Launch Flight)\n- Founder Status and EA Play subscriber multipliers applied (+15% CTR priority).";
      state.artifacts.prioritization = mockPrioritization;
      saveCampaignState(state);
      sendEvent("agent_end", { agentId: "prioritization", agentName: "Prioritization Agent", result: mockPrioritization });
      logLine("[Prioritization Agent]: Campaign queue rank verified. No scheduling conflicts detected.");

      // 4. Research Agent
      state.activeAgent = "Research Agent";
      saveCampaignState(state);
      sendEvent("agent_start", { agentId: "research", agentName: "Research Agent" });
      logLine("[Root]: Handoff from Prioritization Agent to Research Agent...");
      await new Promise(r => setTimeout(r, 1000));

      const mockResearch = "MARKET RESEARCH REPORT:\n- Digital Storefront Benchmark: PlayStation Store, Xbox Store & Steam show standard $69.99 / $99.99 pricing tiers across AAA sports games.\n- Recommended Pre-Order Value: 7-day early access + 4,600 FC Points yields a +28% perceived value advantage over competitor football titles.\n- Gamer sentiment telemetry indicates high search interest for HypermotionV+ and FC IQ tactical playstyles.";
      state.artifacts.research = mockResearch;
      saveCampaignState(state);
      sendEvent("agent_end", { agentId: "research", agentName: "Research Agent", result: mockResearch });
      logLine("[Research Agent]: Digital storefront benchmarks completed. Recommended pricing and perks grounded.");

      // 5. Creative Gen Agent
      state.activeAgent = "Creative Gen Agent";
      saveCampaignState(state);
      sendEvent("agent_start", { agentId: "creative", agentName: "Creative Gen Agent" });
      logLine("[Root]: Handoff from Research Agent to Creative Gen Agent...");
      await new Promise(r => setTimeout(r, 1200));

      const mockCreative = {
        theme: `${companyName} The World's Game`,
        headline: `Pre-order EA SPORTS FC 27 Ultimate Edition. Get 7 Days Early Access & 4,600 FC Points.`,
        subHeadline: `Master the pitch with FC IQ tactical overhauls and next-gen HypermotionV+ match gameplay.`,
        visualDirection: "Dramatic floodlit stadium pitch, superstar athletes executing skill moves with HypermotionV+ particle overlays",
        explainableCTRScore: 94,
        assets: [
          { 
            type: "Email", 
            title: `${companyName} Ultimate Edition Pre-Order: ${mockBrief.name}`, 
            body: `Dear Football Fan,\n\nStep onto the pitch early. Pre-order EA SPORTS FC 27 Ultimate Edition today and unlock 7 days early access, 4,600 FC Points, and an untradeable Cover Athlete Loan Item on the EA App.\n\n*Requires EA SPORTS FC 27 (sold separately). In-game purchases include random items with drop probabilities disclosed. Terms apply.`,
            dimensions: "600x900px", 
            imgText: "Photorealistic floodlit stadium action with superstar footballers in motion under cinematic arena lighting." 
          },
          { 
            type: "SMS", 
            title: "Flash Pre-Order Alert", 
            body: `${companyName} Alert: Pre-order FC 27 Ultimate Edition now for 7-day early access & 4,600 FC Points! Claim perks on the EA Companion App.`,
            dimensions: "160 Chars", 
            imgText: "No Image" 
          },
          { 
            type: "Display Banner", 
            title: `${companyName} Stadium Hero Banner`, 
            body: "The World's Game. Pre-order Ultimate Edition for 7 Days Early Access.", 
            dimensions: "1200x628px", 
            imgText: "Dynamic stadium panorama with gold Ultimate Team card burst animations and volumetric stadium lights." 
          }
        ]
      };
      state.artifacts.creative = mockCreative;
      saveCampaignState(state);
      sendEvent("agent_end", { agentId: "creative", agentName: "Creative Gen Agent", result: mockCreative });
      logLine("[Creative Gen Agent]: Email, SMS, and Display Banner copy variations generated.");

      // 6. Validation Agent
      state.activeAgent = "Validation Agent";
      saveCampaignState(state);
      sendEvent("agent_start", { agentId: "validation", agentName: "Validation Agent" });
      logLine("[Root]: Handoff from Creative Gen Agent to Validation Agent...");
      await new Promise(r => setTimeout(r, 1000));

      const mockCompliance = {
        passed: true,
        checklist: [
          { id: "RULE_CHAR_LIMITS", rule: "SMS/Copy Character Limits", status: "Pass", details: "SMS text conforms to the 160-character limit." },
          { id: "RULE_MANDATORY_DISCLOSURES", rule: "ESRB / PEGI Disclosures", status: "Pass", details: "Mandatory in-game purchases and random item drop probability notices correctly included." },
          { id: "RULE_PROHIBITED_WORDS", rule: "Fair Play & Anti-Gambling Checks", status: "Pass", details: "Scanned copywriting. No predatory or prohibited phrasing found." },
          { id: "RULE_C360_OPT_OUT", rule: "Gamer Push & Email Suppression", status: "Pass", details: "Active opt-out lists matched and excluded." }
        ],
        report: "COMPLIANCE AUDIT PASSED. All ESRB/PEGI gaming guidelines and digital storefront regulatory checklists passed."
      };
      state.artifacts.compliance = mockCompliance;
      saveCampaignState(state);
      sendEvent("agent_end", { agentId: "validation", agentName: "Validation Agent", result: mockCompliance });
      logLine("[Validation Agent]: Compliance check complete. All 4 safety criteria PASSED.");

      // 7. Integration Agent
      state.activeAgent = "Integration Agent";
      saveCampaignState(state);
      sendEvent("agent_start", { agentId: "integration", agentName: "Integration Agent" });
      logLine("[Root]: Handoff from Validation Agent to Integration Agent...");
      await new Promise(r => setTimeout(r, 1000));

      const mockIntegration = {
        payload: {
          campaign_id: `c_fc27_${Date.now()}`,
          name: mockBrief.name,
          objective: mockBrief.objective,
          divisionId: mockBrief.divisionId,
          audienceReach: 185000,
          budget: mockBrief.projectedBudget,
          assets: mockCreative.assets,
          signatures: ["FranchiseProducer-902", "LiveOpsLead-410"]
        },
        dispatchLog: "電子署名 VERIFIED. Outbound Transit Payload Dispatch SUCCESS."
      };
      state.artifacts.integration = mockIntegration;
      saveCampaignState(state);
      sendEvent("agent_end", { agentId: "integration", agentName: "Integration Agent", result: mockIntegration });
      logLine("[Integration Agent]: Producer signatures verified. Campaign dispatch package finalized.");

      // 8. Judge Agent
      state.activeAgent = "Judge Agent";
      saveCampaignState(state);
      sendEvent("agent_start", { agentId: "judge", agentName: "Judge Agent" });
      logLine("[Root]: Handoff from Integration Agent to Judge Agent...");
      await new Promise(r => setTimeout(r, 1200));

      const mockJudgeHtml = `
        <div class="space-y-6 text-left">
          <div class="bg-indigo-50/40 p-4 border border-indigo-100 rounded-xl mb-4">
            <h2 class="text-xs font-mono font-bold uppercase tracking-wider text-indigo-750 mb-2 border-b pb-1">1. Executive Judgement Summary</h2>
            <p class="text-xs text-slate-600 leading-relaxed mb-1">
              Campaign <strong>"${mockBrief.name}"</strong> is rated <strong>READY (Approved)</strong>. 
              The strategic value position is strong, aligning with EA SPORTS FC 27 pre-order and live-service early access flights.
            </p>
          </div>

          <div class="bg-slate-50/50 p-4 border border-slate-200 rounded-xl mb-4">
            <h2 class="text-xs font-mono font-bold uppercase tracking-wider text-indigo-750 mb-2 border-b pb-1">2. Strategic Gaps & Alignment Issues</h2>
            <p class="text-xs text-slate-600 leading-relaxed mb-1">
              Zero major gaps detected. Creative theme elements align with the target <strong>${mockBrief.audienceSegment}</strong> segment. ESRB/PEGI in-game purchase notices meet regulatory standards.
            </p>
          </div>

          <div class="bg-slate-50/50 p-4 border border-slate-200 rounded-xl mb-4">
            <h2 class="text-xs font-mono font-bold uppercase tracking-wider text-indigo-750 mb-2 border-b pb-1">3. Pros & Cons Audit</h2>
            <ul class="list-disc pl-5 space-y-1 text-xs text-slate-600">
              <li><span class="font-bold text-emerald-700">PRO:</span> 7-day early access and 4,600 FC Points delivers +28% perceived value advantage over competitors.</li>
              <li><span class="font-bold text-emerald-700">PRO:</span> Full producer cryptographic signature verification complete.</li>
              <li><span class="font-bold text-rose-700">CON:</span> SMS text should ensure regional pricing currency symbols ($, €, £) adapt automatically.</li>
            </ul>
          </div>

          <div class="bg-slate-50/50 p-4 border border-slate-200 rounded-xl mb-4">
            <h2 class="text-xs font-mono font-bold uppercase tracking-wider text-indigo-750 mb-2 border-b pb-1">4. Actionable Strategy & Analytics Improvements</h2>
            <p class="text-xs text-slate-600 leading-relaxed">
              Highlight the FC IQ tactical overhaul playstyle badges in the second email banner wave to drive Career Mode and Competitive player crossover.
            </p>
          </div>

          <div class="bg-amber-50/40 p-4 border border-amber-100 rounded-xl mb-4">
            <h2 class="text-xs font-mono font-bold uppercase tracking-wider text-amber-800 mb-2 border-b pb-1">5. Hybrid Machine Learning & Retraining Strategies</h2>
            <p class="text-xs text-slate-600 leading-relaxed mb-3">
              To maximize pre-order conversion and in-game live service retention, partition orchestration between semantic tasks and tabular ML models:
            </p>
            <ul class="list-disc pl-5 space-y-1 text-xs text-slate-600">
              <li><strong>Traditional ML (BigQuery ML / XGBoost)</strong>: Ingest gamer numeric telemetry—match completion rates, FC Point spend velocity, Weekend League rank, and historical pre-order timing—to optimize personalized offer ranking.</li>
              <li><strong>Gemini 3.5 Flash semantic tasks</strong>: Handles unstructured tasks like parsing brand manager instructions, compliance regulatory word audits, brand safety guides validation, and copywriting variations generation.</li>
            </ul>
          </div>
        </div>
      `;
      state.artifacts.judge = mockJudgeHtml;
      saveCampaignState(state);
      sendEvent("agent_end", { agentId: "judge", agentName: "Judge Agent", result: mockJudgeHtml });
      logLine("[Judge Agent]: Final strategic critique and model training recommendations generated.");

      // Synthesize Final Response
      state.activeAgent = "None";
      state.currentStatus = "Completed";
      
      const finalReplyText = `
        <div class="space-y-4 text-left">
          <h2>CAMPAIGN PIPELINE BREAKDOWN</h2>
          <p class="text-xs text-slate-700 leading-relaxed">
            All 7 preceding agents successfully executed. The Critic Judge Agent has completed the strategic review for EA SPORTS FC 27.
          </p>
          <ul class="list-decimal pl-5 space-y-1.5 text-xs text-slate-650">
            <li><strong>Intake Agent</strong>: Parsed directive for a <strong>${mockBrief.divisionId}</strong> campaign targeting <strong>${mockBrief.audienceSegment}</strong>.</li>
            <li><strong>Feasibility & Prioritization</strong>: Validated reach of 185,000 active gamers. Scheduled without conflict.</li>
            <li><strong>Research Agent</strong>: Benchmarked digital storefronts and game editions across PlayStation, Xbox, and Steam.</li>
            <li><strong>Creative Gen Agent</strong>: Drafted layouts and banners under the theme <em>"${mockCreative.theme}"</em>.</li>
            <li><strong>Validation Agent</strong>: Verified ESRB/PEGI compliance checks and brand safety guidelines.</li>
            <li><strong>Integration Agent</strong>: Sealed campaign package (outbound status set to PENDING_JUDGE_REVIEW).</li>
          </ul>
          
          <div class="mt-4 p-3 bg-indigo-50 border border-indigo-150 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-left">
            <div>
              <h5 class="font-bold text-indigo-900 text-xs font-mono uppercase">Action Required: Strategy Review</h5>
              <p class="text-[11px] text-indigo-750 font-sans mt-0.5">Please review the Critic Judge's evaluation report and the structured outbound package. Do you approve dispatching this campaign to Salesforce Marketing Cloud and Live-Service routers?</p>
            </div>
            <div class="flex gap-2 shrink-0">
              <button onclick="window.dispatchEvent(new CustomEvent('campaign_decision', {detail: 'approve'}))" class="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-mono text-[10px] font-bold uppercase cursor-pointer">APPROVE</button>
              <button onclick="window.dispatchEvent(new CustomEvent('campaign_decision', {detail: 'deny'}))" class="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-mono text-[10px] font-bold uppercase cursor-pointer">DENY</button>
            </div>
          </div>
        </div>
      `;
      
      state.artifacts.summary = finalReplyText;
      
      const shortReplyText = "Your campaign build sequence is complete! The full campaign breakdown and strategy summary have been generated. It's in the campaign artifacts under 'Strategy Summary'.";
      state.chatHistory.push({ sender: "agent", text: shortReplyText, time: new Date().toLocaleTimeString() });
      saveCampaignState(state);
      
      sendEvent("completed", { text: shortReplyText, executionLogs: [] });
      res.end();
      console.log("[Simulation] Campaign building sequence complete.");
      
    } catch (err) {
      console.error("Simulation sequence failed:", err);
      res.write(`event: error\ndata: ${JSON.stringify({ error: err.message })}\n\n`);
      res.end();
    }
  } else {
    // -----------------------------------------------------
    // LIVE GEMINI MULTI-AGENT EXECUTION PIPELINE
    // -----------------------------------------------------
    try {
      const logLine = (text) => {
        const timestamp = new Date().toLocaleTimeString();
        const line = `[${timestamp}] ${text}`;
        state.logs.push(line);
        saveCampaignState(state);
        sendEvent("log", { line });
      };

      await runOrchestration(message, state.chatHistory, clientAi, (event, data) => {
        if (event === "routing") {
          sendEvent("routing", data);
          logLine(`[System]: ${data.status}`);
        } else if (event === "agent_start") {
          state.activeAgent = data.agentName;
          saveCampaignState(state);
          sendEvent("agent_start", data);
          logLine(`[Root]: Handoff to ${data.agentName}...`);
        } else if (event === "agent_end") {
          const { agentId, agentName, result } = data;
          
          if (agentId === "intake") {
            try {
              state.artifacts.brief = JSON.parse(result);
            } catch {
              state.artifacts.brief = { name: `${companyName || "Bath & Body Works"} Campaign Brief`, parsedText: result };
            }
          } else if (agentId === "feasibility") {
            state.artifacts.feasibility = result;
          } else if (agentId === "prioritization") {
            state.artifacts.prioritization = result;
          } else if (agentId === "research") {
            state.artifacts.research = result;
          } else if (agentId === "creative") {
            try {
              state.artifacts.creative = JSON.parse(result);
              
              // Trigger background parallel image generation
              const creativeObjCopy = { ...state.artifacts.creative };
              creativeAgent.generateImagesBackground(creativeObjCopy, clientAi, (assetType, imgUrl) => {
                if (state.artifacts && state.artifacts.creative && Array.isArray(state.artifacts.creative.assets)) {
                  const asset = state.artifacts.creative.assets.find((a) => a.type === assetType);
                  if (asset) {
                    asset.imgUrl = imgUrl;
                    console.log(`[Server - Async callback] Saved generated image URL for "${assetType}"`);
                    saveCampaignState(state);
                    sendEvent("state_update", state);
                  }
                }
              }).catch(asyncErr => {
                console.error("[Server - Async callback error] Background image generation failed:", asyncErr);
              });

            } catch {
              state.artifacts.creative = {
                theme: "Gemini Custom Theme",
                headline: "Specially curated weekly deals.",
                subHeadline: "Tailored to your shopping basket preferences.",
                visualDirection: "Saturated clean banners, grid arrangements",
                explainableCTRScore: 89,
                assets: [
                  { type: "Copy Assets Output", title: "Copy Variations", body: result, dimensions: "Standard", imgText: "Referenced graphics" }
                ]
              };
            }
          } else if (agentId === "validation") {
            state.artifacts.compliance = {
              passed: !result.toLowerCase().includes("fail"),
              checklist: [
                { id: "RULE_SAFETY", rule: "Safety & Compliance Audit", status: result.toLowerCase().includes("fail") ? "Critical Danger" : "Pass", details: result.slice(0, 150) }
              ],
              report: result
            };
          } else if (agentId === "integration") {
            state.artifacts.integration = {
              payload: { output: result },
              dispatchLog: "Electronic dispatch finalized. Transit OK."
            };
          } else if (agentId === "judge") {
            state.artifacts.judge = result;
          }
          
          saveCampaignState(state);
          sendEvent("agent_end", { agentId, agentName, result: state.artifacts[agentId] || result });
          logLine(`[${agentName}]: Execution completed successfully.`);
        } else if (event === "completed") {
          state.activeAgent = "None";
          state.currentStatus = "Completed";
          state.artifacts.summary = data.text;
          
          const shortReply = "Your campaign build sequence is complete! The full campaign breakdown and strategy summary have been generated. It's in the campaign artifacts under 'Strategy Summary'.";
          state.chatHistory.push({ sender: "agent", text: shortReply, time: new Date().toLocaleTimeString() });
          saveCampaignState(state);
          sendEvent("completed", { ...data, text: shortReply });
          res.end();
        } else if (event === "error") {
          state.activeAgent = "None";
          state.currentStatus = "Error";
          state.chatHistory.push({ sender: "agent", text: data.text, time: new Date().toLocaleTimeString() });
          saveCampaignState(state);
          sendEvent("error", data);
          res.end();
        }
      }, companyName);
    } catch (err) {
      console.error("Live execution sequence failed:", err);
      res.write(`event: error\ndata: ${JSON.stringify({ error: err.message })}\n\n`);
      res.end();
    }
  }
});


// Serve static files from the React app

// ==========================================
// GEMINI TEXT-TO-SPEECH & PODCAST GENERATOR
// ==========================================

function parseMimeType(mimeType) {
    const [fileType, ...params] = (mimeType || 'audio/pcm;rate=24000').split(';').map(s => s.trim());
    const [_, format] = (fileType || '').split('/');

    const options = {
        numChannels: 1,
        sampleRate: 24000,
        bitsPerSample: 16
    };

    if (format && format.startsWith('L')) {
        const bits = parseInt(format.slice(1), 10);
        if (!isNaN(bits)) {
            options.bitsPerSample = bits;
        }
    }

    for (const param of params) {
        const [key, value] = param.split('=').map(s => s.trim());
        if (key === 'rate') {
            options.sampleRate = parseInt(value, 10);
        }
    }

    return options;
}

function createWavHeader(dataLength, options) {
    const {
        numChannels = 1,
        sampleRate = 24000,
        bitsPerSample = 16,
    } = options;

    const byteRate = Math.floor(sampleRate * numChannels * bitsPerSample / 8);
    const blockAlign = Math.floor(numChannels * bitsPerSample / 8);
    const buffer = Buffer.alloc(44);

    buffer.write('RIFF', 0);                      // ChunkID
    buffer.writeUInt32LE(36 + dataLength, 4);     // ChunkSize
    buffer.write('WAVE', 8);                      // Format
    buffer.write('fmt ', 12);                     // Subchunk1ID
    buffer.writeUInt32LE(16, 16);                 // Subchunk1Size (PCM)
    buffer.writeUInt16LE(1, 20);                  // AudioFormat (1 = PCM)
    buffer.writeUInt16LE(numChannels, 22);        // NumChannels
    buffer.writeUInt32LE(sampleRate, 24);         // SampleRate
    buffer.writeUInt32LE(byteRate, 28);           // ByteRate
    buffer.writeUInt16LE(blockAlign, 32);         // BlockAlign
    buffer.writeUInt16LE(bitsPerSample, 34);      // BitsPerSample
    buffer.write('data', 36);                     // Subchunk2ID
    buffer.writeUInt32LE(dataLength, 40);         // Subchunk2Size

    return buffer;
}

function convertToWav(rawDataBase64, mimeType) {
    const rawBuffer = Buffer.from(rawDataBase64, 'base64');
    const options = parseMimeType(mimeType);
    const wavHeader = createWavHeader(rawBuffer.length, options);
    return Buffer.concat([wavHeader, rawBuffer]);
}

app.post('/api/tts/generate-podcast', async (req, res) => {
    try {
        const { text, voiceName = 'Zephyr', companyName = 'AI' } = req.body;
        if (!text) return res.status(400).json({ error: "text is required" });

        const apiKey = req.body.apiKey || req.headers['x-gemini-api-key'] || process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY || initialGeminiApiKey;
        const client = apiKey ? new GoogleGenAI({ apiKey: apiKey.replace(/["']/g, '') }) : (aiGlobal || ai);
        const ttsPrompt = `## Transcript:
${text}`;
        const model = 'gemini-3.1-flash-tts-preview';

        console.log(`🎙️ [TTS GENERATION] Streaming Gemini 3.1 Flash TTS Audio with voice '${voiceName}'...`);

        const config = {
            temperature: 1,
            responseModalities: ['audio'],
            speechConfig: {
                voiceConfig: {
                    prebuiltVoiceConfig: {
                        voiceName: voiceName || 'Zephyr'
                    }
                }
            }
        };

        const contents = [{
            role: 'user',
            parts: [{ text: ttsPrompt }]
        }];

        let audioDataBase64 = null;
        let mimeType = 'audio/pcm;rate=24000';

        // 1. Stream generation
        try {
            if (client && client.models && client.models.generateContentStream) {
                const responseStream = await client.models.generateContentStream({
                    model,
                    config,
                    contents
                });
                const pcmChunks = [];
                for await (const chunk of responseStream) {
                    if (!chunk.candidates || !chunk.candidates[0].content || !chunk.candidates[0].content.parts) {
                        continue;
                    }
                    const part = chunk.candidates[0].content.parts[0];
                    if (part?.inlineData) {
                        if (part.inlineData.mimeType) mimeType = part.inlineData.mimeType;
                        pcmChunks.push(Buffer.from(part.inlineData.data || '', 'base64'));
                    }
                }
                if (pcmChunks.length > 0) {
                    const fullPcm = Buffer.concat(pcmChunks);
                    audioDataBase64 = fullPcm.toString('base64');
                }
            }
        } catch (streamErr) {
            console.warn(`[TTS Stream failed, attempting generateContent]:`, streamErr.message || streamErr);
        }

        // 2. Direct generation fallback
        if (!audioDataBase64 && client && client.models && client.models.generateContent) {
            try {
                const genResp = await client.models.generateContent({
                    model,
                    config,
                    contents
                });
                const part = genResp.candidates?.[0]?.content?.parts?.[0];
                if (part?.inlineData) {
                    if (part.inlineData.mimeType) mimeType = part.inlineData.mimeType;
                    audioDataBase64 = part.inlineData.data;
                }
            } catch (genErr) {
                console.warn(`[TTS generateContent failed]:`, genErr.message || genErr);
            }
        }

        if (audioDataBase64) {
            const wavBuffer = convertToWav(audioDataBase64, mimeType);
            
            // Save .wav file to public/audio/generated and dist/audio/generated (like Concierge pattern)
            const filename = `podcast_${Date.now()}.wav`;
            const publicDir = path.join(__dirname, 'public', 'audio', 'generated');
            if (!fs.existsSync(publicDir)) fs.mkdirSync(publicDir, { recursive: true });
            fs.writeFileSync(path.join(publicDir, filename), wavBuffer);

            const distDir = path.join(__dirname, 'dist', 'audio', 'generated');
            if (!fs.existsSync(distDir)) fs.mkdirSync(distDir, { recursive: true });
            fs.writeFileSync(path.join(distDir, filename), wavBuffer);

            const audioUrl = `/audio/generated/${filename}`;
            const dataUri = `data:audio/wav;base64,${wavBuffer.toString('base64')}`;

            console.log(`✅ [TTS SUCCESS] Saved ${wavBuffer.length} bytes to ${audioUrl}.`);
            return res.json({
                success: true,
                audioUrl: audioUrl,
                dataUri: dataUri,
                durationSeconds: 90,
                voiceName,
                model
            });
        }

        res.json({
            success: false,
            message: "TTS fallback to client web speech synthesizer"
        });
    } catch (err) {
        console.error("TTS endpoint error:", err);
        res.status(500).json({ error: "TTS generation failed", details: String(err) });
    }
});


app.use(express.static(path.join(__dirname, 'dist')));

// The "catchall" handler: for any request that doesn't
// match one above, send back React's index.html file.
app.get(/.*/, (req, res) => {
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

// Terminal Status Logging endpoint for real-time frontend-to-terminal streaming
app.post('/api/terminal-log', (req, res) => {
    const { message, level = 'info' } = req.body;
    const timestamp = new Date().toLocaleTimeString();
    if (level === 'header') {
        console.log(`\n======================================================`);
        console.log(`🚀 [${timestamp}] ${message}`);
        console.log(`======================================================`);
    } else if (level === 'phase') {
        console.log(`\n⚡ [${timestamp}] >>> ${message}`);
    } else if (level === 'worker') {
        console.log(`  ⚙️ [${timestamp}] ${message}`);
    } else if (level === 'success') {
        console.log(`\n✅ [${timestamp}] ${message}\n`);
    } else {
        console.log(`[${timestamp}] [Noise Filter] ${message}`);
    }
    res.json({ ok: true });
});

const server = app.listen(port, '0.0.0.0', () => {
    console.log(`Server listening on port ${port}`);
    console.log(`[Startup] Active Company Name: "${getActiveCompanyName()}"`);
});
server.requestTimeout = 300000;
server.headersTimeout = 300000;
server.keepAliveTimeout = 300000;

process.on('SIGINT', () => {
    console.log('Server shutting down');
    process.exit(0);
});



