declare module 'fit-file-parser' {
  interface FitParserOptions {
    force?: boolean;
    speedUnit?: string;
    lengthUnit?: string;
    elapsedRecordField?: boolean;
  }

  class FitParser {
    constructor(options?: FitParserOptions);
    parse(buffer: Buffer, callback: (error: Error | null, data: any) => void): void;
  }

  const FitParserModule: {
    FitParser: typeof FitParser;
    default?: {
      FitParser: typeof FitParser;
    };
  } & typeof FitParser;

  export = FitParserModule;
}