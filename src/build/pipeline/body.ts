
type Kind<TKind> = R<{ kind: TKind }>

type Def<T, TIsDef, TDef = Und> = TIsDef extends true ? TDef : T;

export type BodyMediaSourceInfo = R<{
  type: Str;
  width: Num;
  height: Num;
  size: Num;
}>

export type BodyImageSourceInfo = BodyMediaSourceInfo;

export type BodyVideoSourceInfo = BodyMediaSourceInfo & R<{
  audio: Bool;
}>

export type BodyMediaSource<TInfo extends BodyMediaSourceInfo, TIsDef extends Bool = false> = R<{
  uri: Str;
  info: Def<TInfo, TIsDef>;
}>

export type BodyVideoSource<TIsDef extends Bool = false> = BodyMediaSource<BodyVideoSourceInfo, TIsDef>

export type BodyImageSource<TIsDef extends Bool = false> = BodyMediaSource<BodyImageSourceInfo, TIsDef>

export enum BodyElementKind {
  span = 'span',
  footnoteLink = 'footnoteLink',
  paragraph = 'paragraph',
  mediaBox = 'mediaBox',
  video = 'video',
  image = 'image',
}

export enum BodySpanFormat {
  normal = 'normal',
  emphasized = 'emphasized'
}

export type BodySpan = R<{
  text: Str;
  format: BodySpanFormat;
}> & Kind<BodyElementKind.span>

export type BodyFootnoteLink = R<{
  key: Str;
}> & Kind<BodyElementKind.footnoteLink>

export enum BodyParagraphFormat {
  normal = 'normal',
  quote = 'quote'
}

export type BodyParagraphChild =
  BodyFootnoteLink |
  BodySpan

export type BodyParagraph = R<{
  children: RArr<BodyParagraphChild>;
  format: BodyParagraphFormat;
}> & Kind<BodyElementKind.paragraph>

export enum BodyMediaBoxLocation {
  left = 'left',
  right = 'right'
}

export type BodyMediaBox<TIsDef extends Bool = false> = R<{
  child: BodyMedia<TIsDef>;
  location: BodyMediaBoxLocation;
}> & Kind<BodyElementKind.mediaBox>

export type BodyVideo<TIsDef extends Bool = false> = R<{
  sources: RArr<BodyVideoSource<TIsDef>>;
  caption: RArr<BodySpan> | Nul;
  manual: Bool;
  thumbnail: Def<Str, TIsDef, Str | Nul>;
}> & Kind<BodyElementKind.video>

export type BodyImage<TIsDef extends Bool = false> = R<{
  sources: Def<RArr<BodyImageSource<TIsDef>>, TIsDef, BodyImageSource<TIsDef>>;
  caption: RArr<BodySpan> | Nul;
}> & Kind<BodyElementKind.image>

export type BodyMedia<TIsDef extends Bool = false> =
  BodyImage<TIsDef> |
  BodyVideo<TIsDef>

export type BodyCredit = R<{
  children: RArr<BodySpan>;
}>

export type BodyFootnoteChild<TIsDef extends Bool = false> =
  BodyImage<TIsDef> |
  BodyVideo<TIsDef> |
  BodyParagraph

export type BodyFootnote<TIsDef extends Bool = false> = R<{
  key: Str;
  child: BodyFootnoteChild<TIsDef>;
}>

export type BodyFootnotes<TIsDef extends Bool = false> = RArr<BodyFootnote<TIsDef>>;

export type BodyElement<TIsDef extends Bool = false> =
  BodyImage<TIsDef> |
  BodyVideo<TIsDef> |
  BodyParagraph |
  BodyMediaBox<TIsDef>

export type Body<TIsDef extends Bool = false> = R<{
  main: RArr<BodyElement<TIsDef>>;
  footnotes: RArr<BodyFootnote<TIsDef>>;
  credits: RArr<BodyCredit>;
}>