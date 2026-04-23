export { };

declare module "11ty.ts" {
  interface EleventySuppliedData {
    // Mising from the types package.
    data: Record<string, unknown>;
  }

  interface EleventyConfig {
    // The type of parserOrOptions in the types package is completely wrong.
    addDataExtension(
      fileExtension: string | string[],
      parserOrOptions: EleventDataExtension["parser"] | EleventDataExtension
    ): void;
  }
}
