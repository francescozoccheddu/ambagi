import pug from 'pug';

export type LayoutBuilder<TLocals extends StrObj> = (locals: TLocals) => Str;

export function makeLayoutBuilder<TOptions extends StrObj>(templateFile: Str): LayoutBuilder<TOptions> {
  return pug.compileFile(templateFile);
}