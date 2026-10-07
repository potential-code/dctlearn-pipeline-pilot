import { OpenAPIRegistry, OpenApiGeneratorV31 } from '@asteasolutions/zod-to-openapi'

/** Every route mounted through `route()` registers itself here; `/api/docs/openapi.json` renders it. */
export const registry = new OpenAPIRegistry()

registry.registerComponent('securitySchemes', 'cookieAuth', {
  type: 'apiKey',
  in: 'cookie',
  name: 'better-auth.session_token',
})

export function buildOpenApiDocument() {
  const generator = new OpenApiGeneratorV31(registry.definitions)
  return generator.generateDocument({
    openapi: '3.1.0',
    info: {
      title: 'DCT Learn API',
      version: '1.0.0',
      description:
        'Generated from the route definitions. Source of truth: docs/API-CONTRACT.md. Errors: `{ error: { code, message, fields? } }`.',
    },
    servers: [{ url: '/' }],
  })
}
