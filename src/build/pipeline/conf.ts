export type PageConf = R<{
  url: Str;
  title: Str;
  keywords?: RArr<Str>;
  date?: Str | Nul;
  priority?: Num | Nul;
  description?: Str | Nul;
  subtitle?: Str | Nul;
  indexSubtitle?: Str | Nul;
  allowRobots?: Bool;
}>

export type SiteResourcesConf = R<{
  fonts: RStrObj<Str>;
  icons: RStrObj<Str>;
  styles: RStrObj<Str>;
  scripts: RStrObj<Str>;
  favicon: Str;
}>

export type SiteConfImageResolution = R<{
  width: Num;
  height: Num;
}>

export type SiteConf = R<{
  url: Str;
  title: Str;
  keywords?: RArr<Str>;
  description?: Str | Nul;
  language: Str;
  author: Str;
  allowRobots?: Bool;
  resources: SiteResourcesConf;
  maxImageSize?: SiteConfImageResolution;
}>