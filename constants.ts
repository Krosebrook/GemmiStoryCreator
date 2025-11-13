import { CustomizationState } from "./types";

export const DEFAULT_STORY_TITLE = "Kinsley & Amelia: The Midnight Flight";
export const DEFAULT_BOOK_2_TITLE = "The Forest of Whispers";

export const MASTER_PROMPT = `
You are StoryWeaver-Gemini, a multimodal generative agent that creates illustrated children’s books.
Your task is to generate ONLY the JSON array for a 10-page illustrated children’s book titled "[STORY_TITLE]".
Use the provided reference photo of Kinsley (7) and Amelia (5) as reference for their likeness and expressions.
The story is for ages 4–7, told in rhyme and short sentences.
The story should incorporate the following themes: [STORY_THEMES].
The tone should be magical, friendly-spooky, and whimsical.
The visual art style is a 3-dimensional, hyper-realistic stop-motion look inspired by "Nightmare Before Christmas" — featuring stitched fabrics, glowing pumpkins, crooked rooftops, warm moonlight, shadowed purples, and teal accents.
Each page object in the JSON array must have "page_number", "text", "illustration_prompt", and "notes".
Do not output any markdown, explanations, or any text other than the JSON array itself.

Here is the story outline to follow:

Page 1
Text: Under a whispering moon in Pumpkin Hollow, two tiny witches zipped their cloaks tight — tonight was candy night!
Illustration Prompt: On a crooked, moonlit porch lit by glowing jack-o-lanterns, two young witches, Kinsley and Amelia, based on the reference photo, hold candy buckets. [KINSLEY_DESCRIPTION]. [AMELIA_DESCRIPTION]. The style is 3D stop-motion with stitched-cloth textures and teal/purple accents.
Notes: Establish the cozy, spooky-cute setting.

Page 2
Text: Amelia twirled her wand; sparkles danced on her cat’s nose.
Illustration Prompt: Amelia (styled after reference photo) twirls her wand, creating floating sparkles that dance on her plush cat's nose. Cozy lighting in a Nightmare Before Christmas-style neighborhood.
Notes: focus on magical lighting, soft sparkle effects.

Page 3
Text: Kinsley grinned, broom humming like a bee.
Illustration Prompt: Close-up on Kinsley (from reference photo) grinning, her broom humming with a teal glow. Soft fog is behind her. Cinematic moonlight casts long shadows.
Notes: build anticipation, focus on Kinsley.

Page 4
Text: At the lane’s end, a crooked house offered a single glowing candy.
Illustration Prompt: A silvery, friendly ghost emerges from a crooked house, offering a single, brightly glowing piece of candy. Kinsley and Amelia (from reference photo) look on with curiosity amidst swirling mist.
Notes: introduce mystery and a friendly magical being.

Page 5
Text: “Eat it under the moon,” whispered the ghost.
Illustration Prompt: Dramatic close-up on the glowing candy held by the two girls. It shines brightly, with orange and violet reflections on their faces.
Notes: highlight the magical object and the ghost's instruction.

Page 6
Text: The sweets shimmered — then brooms began to rise!
Illustration Prompt: A moment of surprise and lift-off. Kinsley and Amelia (from photo) are slightly lifted off the ground, with shocked, happy smiles. Their brooms glow intensely. Floating candy wrappers surround them.
Notes: show weightlessness and magical activation.

Page 7
Text: They looped through clouds, laughter trailing glitter dust.
Illustration Prompt: Dynamic aerial scene. The girls (from photo) fly on their brooms, looping through clouds high above the crooked rooftops of Pumpkin Hollow. Their laughter trails glitter dust in the wide night sky.
Notes: action, joy, and a sense of freedom.

Page 8
Text: The plush cat blinked — its paw pointed toward the forest.
Illustration Prompt: View from behind the girls as they fly. Below is Pumpkin Hollow. Amelia's plush cat, now animated and glowing faintly, blinks and points a paw toward a mysterious green forest in the distance.
Notes: sense of scale and new direction.

Page 9
Text: A spiral of green light called from the trees below.
Illustration Prompt: A beautiful but spooky forest clearing. A spiral of green light twists up from between ancient trees. Faint, glowing runes are visible on the tree bark. The girls look on from a distance.
Notes: tone shift to wonder and deeper mystery.

Page 10
Text: Their brooms tilted — pulled toward the forest fog … and they vanished!
Illustration Prompt: The girls' silhouettes on their brooms are pulled into a swirling green fog that has formed a doorway. The fog has subtle star shapes within it. The final caption reads: “To be continued in Book 2: [BOOK_2_TITLE].”
Notes: End with a cliffhanger.
`;

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
    },
};