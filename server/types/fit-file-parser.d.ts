declare module 'fit-file-parser' {
  export default class FitParser {
    constructor(options?: {
      force?: boolean;
      speedUnit?: string;
      lengthUnit?: string;
      elapsedRecordField?: boolean;
    });

    parse(content: Buffer, callback: (error: Error | null, data: any) => void): void;
  }
}
