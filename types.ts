export interface StoryPage {
  page_number: number;
  text: string;
  illustration_prompt: string;
  notes: string;
  imageUrl?: string;
}

export interface CharacterOptions {
  hairColor: string;
  cloakStyle: string;
  cloakColor: string;
  broomDesign: string;
  outfit: string;
  hatStyle: string;
  magicalAccessory: string;
  expression: string;
}

export interface CustomizationState {
  kinsley: CharacterOptions;
  amelia: CharacterOptions;
}
