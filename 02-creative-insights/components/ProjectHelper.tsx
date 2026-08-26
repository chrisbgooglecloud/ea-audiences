import React, { useState, useEffect } from 'react';
import { brandConfig } from '../config';
import { Sparkles, Upload, ArrowRight, Loader2, RefreshCw, ArrowLeft, RotateCcw } from 'lucide-react';
import { generateImage, generateJson, fileToGenerativePart } from '../services/geminiService';

interface ProjectStep {
  step_number: number;
  step_title: string;
  step_description: string;
  tools_and_materials: {
    item_name: string;
    item_description: string;
    item_image_prompt: string;
    image_url?: string | null;
  }[];
  step_image_prompt: string;
  generated_image_url?: string | null;
}

interface GuideData {
  project_summary: string;
  project_guide: ProjectStep[];
}

export const ProjectHelper: React.FC = () => {
  const [stage, setStage] = useState<1 | 2 | 3 | 4 | 5>(1);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [projectTopic, setProjectTopic] = useState('');
  const [projectDetail, setProjectDetail] = useState('');
  const [finalProductImage, setFinalProductImage] = useState<string | null>(null);
  const [guideData, setGuideData] = useState<GuideData | null>(null);
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');

  // Auto-Save Effect
  useEffect(() => {
    // Skip auto-save if it's default data
    const isDefault = projectTopic === "Home Decor Refresh" &&
      projectDetail === "A project to refresh your living space with modern style, new lighting, and a cohesive color palette.";

    if (stage > 1 && (uploadedImage || projectTopic) && !isDefault) {
      const saveData = {
        stage,
        uploadedImage,
        projectTopic,
        projectDetail,
        guideData,
        finalProductImage
      };

      console.log("Auto-saving experience state...");
      setStatusMessage("Saving...");

      fetch('/api/save-run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          featureId: 'project_helper',
          data: saveData
        })
      })
        .then(res => {
          if (res.ok) {
            setStatusMessage("Saved");
            setTimeout(() => setStatusMessage(""), 2000);
          }
        })
        .catch(e => console.error("Auto-save failed", e));
    }
  }, [stage, uploadedImage, projectTopic, projectDetail, guideData, finalProductImage]);

  const handleLoadLast = async () => {
    setLoading(true);
    setStatusMessage("Loading...");
    try {
      const res = await fetch('/api/load-run/project_helper');
      if (!res.ok) {
        throw new Error("No saved project found");
      }
      const data = await res.json();

      if (data.uploadedImage) setUploadedImage(data.uploadedImage);
      if (data.projectTopic) setProjectTopic(data.projectTopic);
      if (data.projectDetail) setProjectDetail(data.projectDetail);
      if (data.guideData) setGuideData(data.guideData);
      if (data.finalProductImage) setFinalProductImage(data.finalProductImage);

      // Smart Recovery
      let targetStage = data.stage || 1;
      if (data.guideData && Object.keys(data.guideData).length > 0) {
          targetStage = 5;
      } else if (data.uploadedImage || data.projectTopic) {
          if (targetStage < 2) targetStage = 2;
      }
      
      setStage(targetStage as any);
      setStatusMessage("Experience Loaded!");
      setTimeout(() => setStatusMessage(""), 3000);

    } catch (error) {
      console.error("Load error:", error);
      alert("No saved experience found.");
      setStatusMessage("");
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const base64 = await fileToGenerativePart(file);
      setUploadedImage(base64);
      setStage(2);
    }
  };

  const handleGenerateGuide = async () => {
    if (!projectTopic) return;
    setStage(3);
    generateFinalImage();
  };

  const generateFinalImage = async () => {
    setLoading(true);
    setStatusMessage('Visualizing your experience...');
    try {
      const prompt = `A high-quality, photorealistic image of a perfect event: ${projectDetail}. The image should be vibrant, showing happy athletic people and ${brandConfig.companyName} branding in a professional, active setting.`;
      const imageBase64 = await generateImage(prompt);
      if (imageBase64) {
        setFinalProductImage(imageBase64);
        setStage(4);
        generateStepByStepGuide(imageBase64);
      } else {
        throw new Error("Failed to generate final image");
      }
    } catch (error) {
      console.error(error);
      setLoading(false);
      alert("Failed to generate visualization. Please try again.");
      setStage(2);
    }
  };

  const generateStepByStepGuide = async (finalImageBase64: string) => {
    setLoading(true);
    setStatusMessage('Planning the experience...');
    try {
       const schema = {
        type: "OBJECT",
        properties: {
          project_summary: { type: "STRING" },
          project_guide: {
            type: "ARRAY",
            items: {
              type: "OBJECT",
              properties: {
                step_number: { type: "INTEGER" },
                step_title: { type: "STRING" },
                step_description: { type: "STRING" },
                tools_and_materials: {
                  type: "ARRAY",
                  items: {
                    type: "OBJECT",
                    properties: {
                      item_name: { type: "STRING" },
                      item_description: { type: "STRING" },
                      item_image_prompt: { type: "STRING" }
                    }
                  }
                },
                step_image_prompt: { type: "STRING" }
              }
            }
          }
        }
      };

      const prompt = `
        You are an expert event planner for ${brandConfig.companyName}. Your task is to take a user's idea and create a detailed plan. The concept is: "${projectTopic} - ${projectDetail}".
        
        **Instructions:**
        1. **Summary:** Write a brief, exciting summary of the experience.
        2. **Guide:** Create 4-7 logical steps (e.g., Prep, Decor, Food Pairing, Serving).
        3. **For each step:**
           - Provide title, description, items needed (ingredients, decor), and a specific image prompt.
           - Items should have a name, description, and an image prompt.
        
        Return valid JSON.
      `;

      const jsonResponse = await generateJson(prompt, schema as any); // Type cast for now
      
      if (jsonResponse) {
         setGuideData(jsonResponse);
         setStatusMessage('Generating details...');
         
         const newGuide = { ...jsonResponse };
         
         const stepPromises = newGuide.project_guide.map(async (step: any) => {
           const stepImg = await generateImage(step.step_image_prompt + ` photorealistic, vibrant, ${brandConfig.companyName} style`);
             if (stepImg) step.generated_image_url = stepImg;
             
             const toolPromises = (step.tools_and_materials || []).map(async (tool: any) => {
                 const toolImg = await generateImage(tool.item_image_prompt + " isolated on white background, high quality product shot");
                 if (toolImg) tool.image_url = toolImg;
             });
             await Promise.all(toolPromises);
         });
         
         await Promise.all(stepPromises);
         setGuideData(newGuide);
         setStage(5);
         setLoading(false);
      } else {
          throw new Error("Failed to generate guide JSON");
      }

    } catch (error) {
      console.error(error);
      setLoading(false);
      alert("Failed to generate guide.");
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-8 mb-20">
      <div className="text-center mb-10">
        <h2 className="section-header justify-center mb-2 text-gray-900">
          <Sparkles size={32} className="text-[#0077C8]" /> {brandConfig.companyName} Experience Builder
        </h2>
        <p className="text-gray-400 max-w-2xl mx-auto">
          Upload a photo of your space or describe an event, and we'll plan the perfect ${brandConfig.companyName} experience.
        </p>

      </div>

      {stage === 1 && (
        <div className="content-card p-12 text-center border-2 border-dashed border-gray-800 hover:border-gray-600 transition-colors">
          <input
            type="file"
            id="image-upload"
            className="hidden"
            accept="image/*"
            onChange={handleImageUpload}
          />
          <label htmlFor="image-upload" className="cursor-pointer flex flex-col items-center">
            <div className="bg-[#0077C8]/10 p-6 rounded-full mb-4">
              <Upload size={48} className="text-[#0077C8]" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Upload Event Space / Context</h3>
            <p className="text-gray-400 mb-6">Or take a photo of where you want to host.</p>
            <span className="btn-primary px-6 py-3 rounded-lg font-semibold">
              Choose Image
            </span>
          </label>
           <button
            onClick={(e) => {
              e.preventDefault();
              handleLoadLast();
            }}
            className="mt-6 text-gray-600 hover:text-gray-900 flex items-center gap-1 text-sm font-medium mx-auto bg-gray-100 px-4 py-2 rounded-lg"
          >
            <RotateCcw size={16} /> Load Last Experience
          </button>
          
          <div className="mt-8 pt-8 border-t border-gray-800">
              <button 
                  onClick={() => {
                setProjectTopic("Home Decor Refresh");
                setProjectDetail("A project to refresh your living space with modern style, new lighting, and a cohesive color palette.");
                      setStage(2);
                  }}
              className="text-gray-500 hover:text-gray-300 text-sm font-medium"
              >
                  Skip upload and use template
              </button>
          </div>
        </div>
      )}

      {stage === 2 && (
        <div className="content-card p-8 max-w-2xl mx-auto">
          <div className="flex justify-between items-center mb-6">
            <button
              onClick={() => { setStage(1); setUploadedImage(null); }}
              className="text-gray-400 hover:text-white flex items-center gap-1 text-sm font-medium"
            >
              <ArrowLeft size={16} /> Back to Upload
            </button>
          </div>

          <div className="mb-6 flex justify-center">
            {uploadedImage && (
              <div className="relative w-full h-64 bg-gray-100 rounded-xl overflow-hidden shadow-inner border border-gray-200">
                <img src={uploadedImage} alt="Context" className="w-full h-full object-cover" />
                <div className="absolute bottom-2 right-2 bg-white/70 text-gray-900 text-xs px-2 py-1 rounded">
                  Reference Image
                </div>
              </div>
            )}
          </div>

          <div className="mb-6">
            <label className="form-label">Event / Theme</label>
            <input
              type="text"
              value={projectTopic}
              onChange={(e) => setProjectTopic(e.target.value)}
              className="input-field"
              placeholder="e.g. Summer BBQ"
            />
          </div>
          <div className="mb-6">
            <label className="form-label">Details & Vibe</label>
            <textarea
              value={projectDetail}
              onChange={(e) => setProjectDetail(e.target.value)}
              className="input-field h-32"
              placeholder="Describe the atmosphere, food, and guests..."
            />
          </div>
          <div className="flex gap-4">
            <button
              onClick={handleLoadLast}
              disabled={loading}
              className={`flex-1 btn-secondary py-3 rounded-lg font-bold flex items-center justify-center gap-2`}
            >
              <RotateCcw size={20} /> Load Last
            </button>
            <button
              onClick={handleGenerateGuide}
              disabled={loading}
              className={`flex-[2] btn-primary py-3 rounded-lg font-bold flex items-center justify-center gap-2`}
            >
              {loading ? <Loader2 className="animate-spin" /> : <><ArrowRight /> Plan Experience</>}
            </button>
          </div>
        </div>
      )}

      {loading && stage > 2 && (
        <div className="text-center py-20">
          <Loader2 size={48} className="animate-spin text-white mx-auto mb-4" />
          <h3 className="section-header justify-center">{statusMessage}</h3>
          <p className="text-gray-400">Creating your custom experience...</p>
        </div>
      )}

      {stage === 5 && guideData && (
        <div className="space-y-12 animate-fadeIn">
          {/* Header */}
          <div className="content-card p-8 flex flex-col md:flex-row gap-8 items-center">
             <div className="flex-1">
              <h2 className="section-header mb-4">{projectTopic}</h2>
              <p className="text-gray-300 text-lg">{guideData.project_summary}</p>
             </div>
             {finalProductImage && (
                 <div className="w-full md:w-1/3">
                <img src={finalProductImage} alt="Final" className="rounded-xl shadow-md w-full h-auto object-cover border border-gray-800" />
                <p className="text-center text-xs text-gray-500 mt-2">AI Generated Visualization</p>
                 </div>
             )}
          </div>

          {/* Steps */}
          <div className="space-y-8">
             {guideData.project_guide.map((step, idx) => (
               <div key={idx} className="content-card p-6 flex flex-col lg:flex-row gap-8">
                     <div className="lg:w-1/3">
                        {step.generated_image_url ? (
                     <img src={step.generated_image_url} alt={step.step_title} className="rounded-xl w-full h-64 object-cover border border-gray-800" />
                        ) : (
                       <div className="w-full h-64 bg-black/50 rounded-xl flex items-center justify-center text-gray-500 border border-gray-800">
                                <Loader2 className="animate-spin" />
                            </div>
                        )}
                     </div>
                     <div className="flex-1">
                         <div className="flex items-center gap-3 mb-4">
                     <span className="bg-white text-black w-8 h-8 rounded-full flex items-center justify-center font-bold">
                                 {step.step_number}
                             </span>
                     <h3 className="text-xl font-bold text-white">{step.step_title}</h3>
                         </div>
                   <p className="text-gray-300 mb-6 leading-relaxed">{step.step_description}</p>
                         
                         {step.tools_and_materials && step.tools_and_materials.length > 0 && (
                             <div>
                                 <h4 className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-3">Essentials</h4>
                                 <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                     {step.tools_and_materials.map((tool, tIdx) => (
                                       <div key={tIdx} className="bg-black/40 p-3 rounded-lg text-center border border-gray-800">
                                             {tool.image_url && (
                                           <img src={tool.image_url} alt={tool.item_name} className="w-16 h-16 mx-auto mb-2 object-contain" />
                                             )}
                                         <p className="font-semibold text-sm text-gray-200">{tool.item_name}</p>
                                             <p className="text-xs text-gray-500">{tool.item_description}</p>
                                         </div>
                                     ))}
                                 </div>
                             </div>
                         )}
                     </div>
                 </div>
             ))}
          </div>
          
          <div className="flex justify-center pt-8">
             <button
              onClick={() => {
                setStage(1);
                setUploadedImage(null);
                setProjectTopic("");
                setProjectDetail("");
                setGuideData(null);
                setFinalProductImage(null);
              }}
              className="flex items-center gap-2 text-gray-400 hover:text-white font-semibold"
             >
                <RefreshCw size={20} /> Start New Experience
             </button>
          </div>
        </div>
      )}
    </div>
  );
};
