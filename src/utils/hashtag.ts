// #️⃣ Hashtag Parser Utility
// Extract hashtags from text

export function extractHashtags(text: string): string[] {
  const hashtagRegex = /#[\w\u0590-\u05ff]+/g;
  return text.match(hashtagRegex) || [];
}

export function parseHashtags(text: string): { text: string; isHashtag: boolean }[] {
  // TODO: Parse text and return array with hashtag segments
  return [];
}
