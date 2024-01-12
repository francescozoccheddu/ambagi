// eslint-disable-next-line import/no-named-as-default
import { err } from '@francescozoccheddu/ts-goodies/errors';
import Ajv from 'ajv';
// eslint-disable-next-line import/no-named-as-default
import fs from 'fs';
import yaml from 'js-yaml';
import { parseXml as libxmlParseXml } from 'libxmljs';
import { Element as XmlElement, xml2js } from 'xml-js';

export type YamlLoader<TDef extends RJson> = (yamlFile: Str) => TDef;

export function makeYamlLoader<TDef extends RJson>(schemaFile: Str): YamlLoader<TDef> {
  const schema = JSON.parse(fs.readFileSync(schemaFile, 'utf8')) as RStrObj<RJson>;
  const ajv = new Ajv();
  const validate = ajv.compile(schema);
  return (sourceFile: Str) => {
    const def = yaml.load(fs.readFileSync(sourceFile, 'utf8'));
    if (!validate(def)) {
      err('Validation failed', {
        errors: validate.errors?.map(e => ({
          keyword: e.keyword,
          message: e.message,
          path: e.instancePath,
          property: e.propertyName,
        })),
        file: sourceFile,
      });
    }
    return def as TDef;
  };
}

export type XmlLoader<TDef> = (xmlFile: Str) => TDef;

export function makeXmlLoader<TDef>(schemaFile: Str, parse: (doc: XmlElement) => TDef): XmlLoader<TDef> {
  const schemaXml = fs.readFileSync(schemaFile, 'utf8');
  const schemaDoc = libxmlParseXml(schemaXml);
  return (sourceFile: Str) => {
    const sourceXml = fs.readFileSync(sourceFile, 'utf-8');
    if (schemaDoc) {
      const doc = libxmlParseXml(sourceXml);
      if (!doc.validate(schemaDoc)) {
        err('Validation failed', {
          errors: doc.validationErrors.map(e => ({
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
            message: e.message as Str,
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
            column: e.column as Num,
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
            line: e.line as Num,
          })),
          file: sourceFile,
        });
      }
    }
    return parse(xml2js(sourceXml) as XmlElement);
  };
}