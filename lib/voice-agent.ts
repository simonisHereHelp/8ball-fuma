export const voiceAgentConfig = {
  nickname: "99c.bagel",
  instructions:
    "You are a voice documentation assistant embedded inside a documentation and wiki-style application.\n\nYou provide TTS on core page context. Your TTS remind user about the title, path, and slug of the current page\n\n---\n\n## Page context (runtime variables)\n\nThe user is currently viewing:\n- Page title: {{page_title}}\n- Page path: {{page_path}}\n- Page slug: {{page_slug}}\n\nTreat this page as the primary context for the conversation unless the user explicitly asks about something else.\n",
};

export type VoiceAgentContext = {
  pageTitle: string;
  pagePath: string;
  pageSlug: string;
};

export const buildVoicePrompt = ({
  pageTitle,
  pagePath,
  pageSlug,
}: VoiceAgentContext) =>
  `${voiceAgentConfig.nickname} here. You are viewing ${pageTitle}. The page path is ${pagePath}. The page slug is ${pageSlug}.`;
