declare module "sanitize-html" {
  interface SanitizeOptions {
    allowedTags?: string[] | boolean;
    allowedAttributes?: Record<string, string[]> | boolean;
    allowedStyles?: Record<string, Record<string, RegExp[]>>;
    selfClosing?: string[];
    allowedSchemes?: string[];
    allowedSchemesByTag?: Record<string, string[]>;
    allowProtocolRelative?: boolean;
    enforceHtmlBoundary?: boolean;
    parseStyleAttributes?: boolean;
    transformTags?: Record<
      string,
      | string
      | ((
          tagName: string,
          attribs: Record<string, string>,
        ) => { tagName: string; attribs: Record<string, string> })
    >;
    exclusiveFilter?: (frame: {
      tag: string;
      attribs: Record<string, string>;
      text: string;
      tagPosition: number;
    }) => boolean;
    nonTextTags?: string[];
    textFilter?: (text: string, tagName: string) => string;
    allowedClasses?: Record<string, string[] | boolean>;
    allowVulnerableTags?: boolean;
    disallowedTagsMode?: "discard" | "escape" | "recursiveEscape";
  }

  function sanitizeHtml(dirty: string, options?: SanitizeOptions): string;

  export = sanitizeHtml;
}
