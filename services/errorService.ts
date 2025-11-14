// services/errorService.ts

export const getFriendlyErrorMessage = (error: unknown): { title: string, message: string } => {
    const genericError = {
        title: "An Unexpected Error Occurred",
        message: "Something went wrong. Please check the console for technical details, and try again. If the problem persists, try refreshing the page."
    };

    if (!(error instanceof Error)) {
        return genericError;
    }

    const errorMessage = error.message;

    if (errorMessage.includes("API_KEY")) {
        return {
            title: "API Key Issue",
            message: "Could not connect to the AI service. Please ensure the API key is configured correctly and you have an active internet connection."
        };
    }
    if (errorMessage.includes("STORY_JSON_PARSE_ERROR")) {
        return {
            title: "Story Generation Hiccup",
            message: "The AI's response for the story was not in the expected format. This can be a temporary issue. Please try generating the story again."
        };
    }
    if (errorMessage.includes("STORY_EMPTY_ERROR")) {
        return {
            title: "Empty Story Returned",
            message: "The AI returned an empty story. Your master prompt might be too restrictive. Try adjusting it and generating again."
        };
    }
    if (errorMessage.includes("STORY_SAFETY_BLOCK")) {
        return {
            title: "Content Safety Block",
            message: "The AI blocked the story generation due to its safety settings. Please review your master prompt for any potentially sensitive content and try again."
        };
    }
    if (errorMessage.includes("IMAGE_SAFETY_BLOCK")) {
        return {
            title: "Content Safety Block",
            message: "The AI blocked an image from being generated due to its safety settings. Please review the illustration prompt for any potentially sensitive content and try regenerating."
        };
    }
    if (errorMessage.includes("IMAGE_NO_RESULT_ERROR")) {
        return {
            title: "No Image Generated",
            message: "The AI did not return an image for this prompt. This can sometimes happen. Please try regenerating the image, possibly with a slightly different prompt."
        };
    }
    if (errorMessage.includes("IMAGE_API_ERROR")) {
         return {
            title: "AI Service Error",
            message: "There was a problem communicating with the AI image service. Please check your internet connection and try again. The service may be temporarily unavailable."
        };
    }
    if (errorMessage.includes("STORY_API_ERROR")) {
         return {
            title: "AI Service Error",
            message: "There was a problem communicating with the AI story service. Please check your internet connection and try again. The service may be temporarily unavailable."
        };
    }
    return { ...genericError, message: `${genericError.message} (Details: ${errorMessage})`};
};