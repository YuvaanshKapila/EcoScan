declare module 'react-native-tesseract-ocr' {
  interface TessOptions {
    whitelist?: string;
    blacklist?: string;
    [key: string]: any;
  }

  const RNTesseractOcr: {
    recognize: (imagePath: string, lang: string, options?: TessOptions) => Promise<string>;
  };

  export default RNTesseractOcr;
}
