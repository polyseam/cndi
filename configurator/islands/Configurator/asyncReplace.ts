/**
 * Asynchronously replace parts of 'str' that match 'regex'
 * using the async function 'replacerFn'. The replacerFn must
 * return a Promise<string>.
 */
export async function asyncReplace(
  str: string,
  regex: RegExp,
  replacerFn: (fullMatch: string, ...captures: string[]) => Promise<string>,
): Promise<string> {
  let result = "";
  let lastIndex = 0;

  // Collect all matches via matchAll, which returns an iterator
  // of match objects. Each match object has indices and the full match text.
  const allMatches = [...str.matchAll(regex)];

  for (const match of allMatches) {
    // `match.index` gives the start position of the match
    const matchStart = match.index;

    // Add the text before this match
    result += str.slice(lastIndex, matchStart);

    // Prepare arguments for the replacer function:
    // typically match[0] is the full match, match[1], match[2], etc. are capturing groups
    const [fullMatch, ...captures] = match;

    // Call the async replacerFn and await the string
    const replacement = await replacerFn(fullMatch, ...captures);

    // Add the replacement text
    result += replacement;

    // Update the lastIndex to after this match
    lastIndex = matchStart + fullMatch.length;
  }

  // Add any remaining text after the last match
  result += str.slice(lastIndex);

  return result;
}
