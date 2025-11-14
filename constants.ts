import { CustomizationState } from "./types";

export const DEFAULT_STORY_TITLE = "Kinsley & Amelia: The Midnight Flight";
export const DEFAULT_BOOK_2_TITLE = "The Forest of Whispers";

export const MASTER_PROMPT = `
You are StoryWeaver-Gemini, a multimodal generative agent that creates illustrated children’s books.
Your task is to generate ONLY the JSON array for a [PAGE_COUNT]-page illustrated children’s book titled "[STORY_TITLE]".
Use the provided reference photo of Kinsley (7) and Amelia (5) as reference for their likeness and expressions.
The story is for ages 4–7, told in rhyme and short sentences.
The story should incorporate the following themes: [STORY_THEMES].
The tone should be magical, friendly-spooky, and whimsical.
[ART_STYLE_DESCRIPTION]
Each page object in the JSON array must have "page_number", "text", "illustration_prompt", and "notes".
Do not output any markdown, explanations, or any text other than the JSON array itself.

Instead of a fixed page-by-page outline, follow this flexible STORY ARC. You must adapt the story's pacing and detail to perfectly fit the requested [PAGE_COUNT] pages. Ensure each page has a corresponding illustration prompt that describes the scene, characters, and actions based on the character descriptions provided below.

STORY ARC:
1.  **Introduction:** Introduce Kinsley ([KINSLEY_DESCRIPTION]) and Amelia ([AMELIA_DESCRIPTION]) in their whimsical, spooky-cute home, Pumpkin Hollow, on a magical candy night. They are excited and ready for an adventure.
2.  **Inciting Incident:** The sisters encounter a friendly ghost who gives them a single piece of magical glowing candy with a mysterious instruction: "Eat it under the moon."
3.  **Rising Action:** After eating the candy, their brooms come to life and lift them into the sky. They experience the joy and wonder of flying through the clouds high above their town.
4.  **New Discovery:** While flying, their magical plush cat points them toward a mysterious, glowing forest they've never seen before. A strange, beautiful light calls to them from the trees.
5.  **Cliffhanger Ending:** Drawn by the mysterious light, the sisters fly towards the forest and vanish into a magical fog, setting up the sequel, "[BOOK_2_TITLE]".
`;

export const artStyles = {
    "Stop-Motion": `The visual art style is a 3-dimensional, hyper-realistic stop-motion look inspired by "Nightmare Before Christmas" — featuring stitched fabrics, glowing pumpkins, crooked rooftops, warm moonlight, shadowed purples, and teal accents.`,
    "Watercolor": `The visual art style is a gentle, soft-focus watercolor painting, with bleeding colors and delicate linework. Think classic children's book illustrations with a dreamy, ethereal quality.`,
    "Crayon Drawing": `The visual art style is a charming and naive crayon drawing, as if drawn by a child. It features thick, waxy lines, vibrant primary colors, and a sense of playful imperfection.`,
    "Pixel Art": `The visual art style is 16-bit pixel art, reminiscent of classic adventure video games. The characters and environment are blocky but expressive, with a limited but vibrant color palette.`
};

export const customizationOptions = {
    hairColor: ["Teal", "Purple", "Auburn", "Black", "Platinum"],
    cloakStyle: ["Classic", "Hooded", "Frayed", "Star-Patterned"],
    cloakColor: ["Indigo", "Maroon", "Forest Green", "Charcoal"],
    broomDesign: ["Gnarled Oak", "Twisted Willow", "Sleek Ebony", "Stardust"],
    outfit: ["Witchy Dress", "Overalls & Striped Shirt", "Cozy Pajamas", "Tattered Robes"],
    hatStyle: ["Classic Pointy", "No Hat", "Starry Beanie", "Crooked Hat"],
    magicalAccessory: ["Glowing Locket", "Tiny Spellbook", "Potion Pouch", "Crystal Wand"],
    expression: ["Curious", "Mischievous", "Joyful", "Determined", "Slightly Spooked", "Surprised", "Excited", "Thoughtful"],
};

export const storyThemes = ["Adventure", "Friendship", "Mystery", "Magic", "Courage", "Family"];

export const defaultCustomizations: CustomizationState = {
    kinsley: {
        hairColor: "Teal",
        cloakStyle: "Star-Patterned",
        cloakColor: "Indigo",
        broomDesign: "Stardust",
        outfit: "Witchy Dress",
        hatStyle: "Classic Pointy",
        magicalAccessory: "Tiny Spellbook",
        expression: "Excited",
        description: "Kinsley is 7 years old with teal hair and an excited expression. She is wearing a classic pointy hat, and an indigo star-patterned cloak over her witchy dress. She holds a stardust broom and carries a tiny spellbook.",
    },
    amelia: {
        hairColor: "Platinum",
        cloakStyle: "Hooded",
        cloakColor: "Maroon",
        broomDesign: "Twisted Willow",
        outfit: "Overalls & Striped Shirt",
        hatStyle: "Starry Beanie",
        magicalAccessory: "Glowing Locket",
        expression: "Thoughtful",
        description: "Amelia is 5 years old with platinum hair and a thoughtful expression. She is wearing a starry beanie hat, and a maroon hooded cloak over her overalls & striped shirt. She holds a twisted willow broom and carries a glowing locket.",
    },
};