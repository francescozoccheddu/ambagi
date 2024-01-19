// eslint-disable-next-line import/no-named-as-default
import { err } from '@francescozoccheddu/ts-goodies/errors';
import { isUnd } from '@francescozoccheddu/ts-goodies/types';
import { Body, BodyCredit, BodyElementKind, BodyFootnote, BodyFootnoteLink, BodyImage, BodyMediaBox, BodyMediaSource, BodyMediaSourceInfo, BodyParagraph, BodyParagraphFormat, BodySpan, BodySpanFormat, BodyVideo } from 'ambagi/pipeline/body';
import { Element as XmlElement } from 'xml-js';

function toFloatOrNul(str: Str | Nul): Num | Nul {
  if (!str) {
    return null;
  }
  return Number.parseFloat(str);
}

function visitEl(el: XmlElement | Und): Unk {
  if (isUnd(el)) {
    return null;
  }
  const attrs = el.attributes ?? {};
  const els = el.elements?.filter(e => e.type !== 'comment') ?? [];
  switch (el.type) {
    case 'text':
      return <BodySpan>{
        format: BodySpanFormat.normal,
        kind: BodyElementKind.span,
        text: el.text!.toString() ?? '',
      };
    case 'element':
      switch (el.name) {
        case 'body':
          return <Body<true>>{
            main: visitEl(els.find(e => e.name === 'main')),
            footnotes: visitEl(els.find(e => e.name === 'footnotes')) ?? [],
            credits: visitEl(els.find(e => e.name === 'credits')) ?? [],
          };
        case 'credit':
          return <BodyCredit>{
            children: els.map(visitEl),
          };
        case 'credits':
        case 'main':
        case 'footnotes':
          return els.map(visitEl);
        case 'footnote':
          return <BodyFootnote<true>>{
            key: attrs['key']!.toString(),
            child: visitEl(els[0]),
          };
        case 'video':
          return <BodyVideo<true>>{
            kind: BodyElementKind.video,
            audio: attrs['audio'] === 'true',
            manual: attrs['manual'] === 'true',
            sources: els.filter(e => e.name === 'source').map(visitEl),
            caption: (visitEl(els.filter(e => e.name === 'caption')[0]) as BodyParagraph)?.children,
            thumbnails: attrs['thumbnail']?.toString() ?? null,
            alt: attrs['alt']?.toString() ?? null,
            thumbnailTime: toFloatOrNul(attrs['thumbnailTime']?.toString() ?? null),
          };
        case 'image':
          return <BodyImage<true>>{
            kind: BodyElementKind.image,
            sources: els.filter(e => e.name === 'source').map(visitEl)[0],
            caption: (visitEl(els.filter(e => e.name === 'caption')[0]) as BodyParagraph)?.children,
            alt: attrs['alt']?.toString() ?? null,
          };
        case 'caption':
        case 'text':
        case 'paragraph':
        case 'quote':
          return <BodyParagraph>{
            children: els.map(visitEl),
            format: el.name === 'quote' ? BodyParagraphFormat.quote : BodyParagraphFormat.normal,
            kind: BodyElementKind.paragraph,
          };
        case 'e':
          return <BodySpan>{
            format: BodySpanFormat.emphasized,
            kind: BodyElementKind.span,
            text: (visitEl(el.elements![0]) as BodySpan).text,
          };
        case 'inline':
          return <BodyMediaBox<true>>{
            kind: BodyElementKind.mediaBox,
            child: visitEl(els[0]),
            float: attrs['float'],
            offsetX: toFloatOrNul(attrs['offsetX']?.toString() ?? null) ?? 0.5,
            offsetY: toFloatOrNul(attrs['offsetY']?.toString() ?? null) ?? 0.5,
          };
        case 'fn':
          return <BodyFootnoteLink>{
            key: attrs['key']!.toString(),
            kind: BodyElementKind.footnoteLink,
          };
        case 'source': {
          return <BodyMediaSource<BodyMediaSourceInfo, true>>{
            uri: attrs['asset']?.toString() ?? '',
            info: undefined,
          };
        }
      }
  }
  err('Unknown element');
}

export function parseBodyXml(root: XmlElement): Body<true> {
  return visitEl(root.elements![0]) as Body<true>;
}