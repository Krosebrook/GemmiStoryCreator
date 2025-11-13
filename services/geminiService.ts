import { GoogleGenAI, Type } from "@google/genai";
import { StoryPage } from '../types';

if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const storyPageSchema = {
    type: Type.OBJECT,
    properties: {
        page_number: { type: Type.NUMBER },
        text: { type: Type.STRING },
        illustration_prompt: { type: Type.STRING },
        notes: { type: Type.STRING },
    },
    required: ["page_number", "text", "illustration_prompt", "notes"],
};

export const generateStoryAndImages = async (
    prompt: string,
    imageBase64: string | null,
    onStatusUpdate: (status: string) => void,
    onProgressUpdate: (progress: number) => void,
    onComplete: (pages: StoryPage[]) => void
): Promise<void> => {
    // Step 1: Generate the story structure as JSON
    onStatusUpdate("Crafting your story from the master prompt...");
    onProgressUpdate(5);
    
    const textPart = { text: prompt };
    const parts: ({ text: string } | { inlineData: { mimeType: string, data: string } })[] = [textPart];

    if (imageBase64) {
        const mimeTypeMatch = imageBase64.match(/^data:(.*);base64,/);
        if (!mimeTypeMatch) {
            throw new Error("Invalid image format. Could not determine MIME type.");
        }
        const mimeType = mimeTypeMatch[1];
        const data = imageBase64.split(',')[1];
        const imagePart = {
            inlineData: {
                mimeType,
                data,
            },
        };
        parts.unshift(imagePart); // Add image as the first part
    }

    let storyGenResponse;
    try {
        storyGenResponse = await ai.models.generateContent({
            model: 'gemini-2.5-pro',
            contents: { parts },
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.ARRAY,
                    items: storyPageSchema,
                },
            },
        });
    } catch(err) {
        if (err instanceof Error && err.message.includes('SAFETY')) {
            throw new Error("STORY_SAFETY_BLOCK: The AI blocked the response due to safety concerns. Please review your prompt for any potentially sensitive content and try again.");
        }
        throw new Error(`STORY_API_ERROR: ${err instanceof Error ? err.message : 'An unknown error occurred'}`);
    }


    let storyPages: StoryPage[];
    try {
        const jsonText = storyGenResponse.text.trim();
        storyPages = JSON.parse(jsonText);
    } catch (e) {
        console.error("Failed to parse story JSON:", storyGenResponse.text);
        throw new Error("STORY_JSON_PARSE_ERROR: The model did not return valid JSON for the story. This can be a temporary issue; please try again.");
    }
    
    if (!Array.isArray(storyPages) || storyPages.length === 0) {
        throw new Error("STORY_EMPTY_ERROR: The model returned an empty story. Your prompt might be too restrictive. Try adjusting the master prompt.");
    }

    onStatusUpdate(`Story crafted! Now illustrating ${storyPages.length} pages...`);
    onProgressUpdate(10);

    // Step 2: Generate an image for each page in parallel
    let completedImages = 0;
    const totalImages = storyPages.length;

    const imagePromises = storyPages.map(async (page) => {
        try {
            const imageGenResponse = await ai.models.generateImages({
                model: 'imagen-4.0-generate-001',
                prompt: page.illustration_prompt,
                config: {
                    numberOfImages: 1,
                    aspectRatio: "16:9",
                    outputMimeType: "image/jpeg",
                },
            });

            // Update progress after each image is generated
            completedImages++;
            const progress = 10 + (completedImages / totalImages) * 90;
            onProgressUpdate(progress);
            onStatusUpdate(`Painting page ${completedImages} of ${totalImages}...`);

            if (imageGenResponse.generatedImages && imageGenResponse.generatedImages.length > 0) {
                const base64ImageBytes = imageGenResponse.generatedImages[0].image.imageBytes;
                return {
                    ...page,
                    imageUrl: `data:image/jpeg;base64,${base64ImageBytes}`,
                };
            }
             // Return page without image if API returns no images
            return page;
        } catch (error) {
            console.error(`Failed to generate image for page ${page.page_number}:`, error);
            // Still update progress to not stall the progress bar
            completedImages++;
            const progress = 10 + (completedImages / totalImages) * 90;
            onProgressUpdate(progress);
            let reason = "an unknown error";
            if (error instanceof Error && error.message.includes('SAFETY')) {
                reason = "safety settings";
            }
            onStatusUpdate(`Image for page ${completedImages} failed due to ${reason}. You can regenerate it later.`);
            // Return the page without an image on error
            return page;
        }
    });

    const pagesWithImages = await Promise.all(imagePromises);

    onStatusUpdate("All illustrations complete!");
    onComplete(pagesWithImages);
};

export const generateSingleImage = async (illustrationPrompt: string): Promise<string> => {
    try {
        const imageGenResponse = await ai.models.generateImages({
            model: 'imagen-4.0-generate-001',
            prompt: illustrationPrompt,
            config: {
                numberOfImages: 1,
                aspectRatio: "16:9",
                outputMimeType: "image/jpeg",
            },
        });

        if (imageGenResponse.generatedImages && imageGenResponse.generatedImages.length > 0) {
            const base64ImageBytes = imageGenResponse.generatedImages[0].image.imageBytes;
            return `data:image/jpeg;base64,${base64ImageBytes}`;
        }
        
        throw new Error("IMAGE_NO_RESULT_ERROR: API returned no images for the provided prompt.");
    } catch (error) {
        console.error(`Failed to generate single image:`, error);
        if (error instanceof Error) {
            if (error.message.includes('SAFETY')) {
                throw new Error("IMAGE_SAFETY_BLOCK: The AI blocked this image due to safety settings. Please adjust your prompt and try again.");
            }
            if (error.message.startsWith("IMAGE_NO_RESULT_ERROR")) {
                throw error; // Re-throw the specific error
            }
        }
        throw new Error(`IMAGE_API_ERROR: Failed to generate a new image from the service. Details: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
};