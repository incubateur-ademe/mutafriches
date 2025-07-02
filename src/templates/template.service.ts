import { Injectable } from '@nestjs/common';
import { readFileSync } from 'fs';
import { join } from 'path';
import { Component } from './types';

@Injectable()
export class TemplateService {
  private loadTemplate(templateName: string): string {
    const templatePath = join(
      process.cwd(),
      'src',
      'templates',
      `${templateName}.html`,
    );
    return readFileSync(templatePath, 'utf8');
  }

  private loadComponent(componentName: string): string {
    const componentPath = join(
      process.cwd(),
      'src',
      'templates',
      'components',
      `${componentName}.html`,
    );
    return readFileSync(componentPath, 'utf8');
  }

  private renderComponent(
    componentName: string,
    data: Record<string, any>,
  ): string {
    let html = this.loadComponent(componentName);

    Object.keys(data).forEach((key) => {
      const regex = new RegExp(`{{${key}}}`, 'g');
      html = html.replace(regex, String(data[key] ?? ''));
    });

    return html;
  }

  renderIframePage(title: string, components: Component[]): string {
    let html = this.loadTemplate('iframe');

    const content = components
      .map((comp) => this.renderComponent(comp.name, comp.data))
      .join('\n');

    html = html.replace('{{title}}', title);
    html = html.replace('{{content}}', content);

    return html;
  }
}
