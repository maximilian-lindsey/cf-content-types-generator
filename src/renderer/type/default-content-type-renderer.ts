import { ContentTypeField } from 'contentful';
import {
  OptionalKind,
  PropertySignatureStructure,
  SourceFile,
  TypeAliasDeclarationStructure,
} from 'ts-morph';
import { propertyImports } from '../../property-imports';
import { renderTypeGeneric } from '../generic';
import { CFContentType } from '../../types';
import { BaseContentTypeRenderer } from './base-content-type-renderer';
import { RenderContext } from './create-default-context';

export class DefaultContentTypeRenderer extends BaseContentTypeRenderer {
  public render(contentType: CFContentType, file: SourceFile): void {
    const context = this.createContext();

    this.addDefaultImports(context);
    this.renderFieldsInterface(contentType, file, context);

    file.addTypeAlias(this.renderEntry(contentType, context));

    for (const structure of context.imports) {
      file.addImportDeclaration(structure);
    }

    file.organizeImports({
      ensureNewLineAtEndOfFile: true,
    });
  }

  protected renderFieldsInterface(
    contentType: CFContentType,
    file: SourceFile,
    context: RenderContext,
  ): void {
    const fieldsInterfaceName = context.moduleFieldsName(contentType.sys.id);
    const interfaceDeclaration = file.addInterface({
      name: fieldsInterfaceName,
      isExported: true,
    });

    for (const field of contentType.fields) {
      interfaceDeclaration.addProperty(this.renderField(field, context));
      for (const pImport of propertyImports(field, context, file.getBaseNameWithoutExtension())) {
        context.imports.add(pImport);
      }
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars,@typescript-eslint/no-empty-function
  protected addDefaultImports(context: RenderContext): void {}

  protected renderField(
    field: ContentTypeField,
    context: RenderContext,
  ): OptionalKind<PropertySignatureStructure> {
    return {
      name: field.id,
      hasQuestionToken: field.omitted || !field.required,
      type: this.renderFieldType(field, context),
    };
  }

  protected renderFieldType(field: ContentTypeField, context: RenderContext): string {
    return context.getFieldRenderer(field.type)(field, context);
  }

  protected renderEntry(
    contentType: CFContentType,
    context: RenderContext,
  ): OptionalKind<TypeAliasDeclarationStructure> {
    return {
      name: context.moduleName(contentType.sys.id),
      isExported: true,
      type: this.renderEntryType(contentType, context),
    };
  }

  protected renderEntryType(contentType: CFContentType, context: RenderContext): string {
    context.imports.add({
      moduleSpecifier: 'contentful',
      namedImports: ['Entry'],
      isTypeOnly: true,
    });
    return renderTypeGeneric('Entry', context.moduleFieldsName(contentType.sys.id));
  }
}
