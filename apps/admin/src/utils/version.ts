declare const __CMS_VERSION__: string | undefined;

export const CMS_VERSION: string =
  typeof __CMS_VERSION__ !== 'undefined' && __CMS_VERSION__ ? __CMS_VERSION__ : '1.0.2';
