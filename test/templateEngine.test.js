import { describe, expect, it } from 'vitest';
import { extractTemplateVariables, renderLocalTemplate } from '../main/services/templateEngine.js';

describe('templateEngine', () => {
  it('extracts variables from subject and body', () => {
    const variables = extractTemplateVariables(
      'Ola {{name}}',
      '<p>{{coupon_code}}</p><p>{{store.city}}</p>'
    );

    expect(variables).toEqual(['coupon_code', 'name', 'store.city']);
  });

  it('escapes HTML when rendering local content', () => {
    const result = renderLocalTemplate({
      template: {
        html: '<img src="{{brand_logo_url}}" alt="{{brand_name}}" /><p>{{name}}</p>',
        text: '',
        subject: 'Cupom {{name}}'
      },
      contact: {
        email: 'user@example.com',
        name: '<script>alert(1)</script>',
        variables: {}
      },
      campaignConfig: {
        subject: 'Fallback',
        brandName: 'Rakuten Advertising',
        brandLogoUrl: 'https://cdn.example.com/logo.png'
      }
    });

    expect(result.subject).toBe('Cupom <script>alert(1)</script>');
    expect(result.html).toContain('https://cdn.example.com/logo.png');
    expect(result.html).toContain('Rakuten Advertising');
    expect(result.html).toContain('&lt;script&gt;alert(1)&lt;/script&gt;');
    expect(result.html).not.toContain('<script>');
    expect(result.text).toContain('<script>alert(1)</script>');
  });
});
