export const openApiSpec = {
  openapi: "3.0.3",
  info: {
    title: "Financial Goals Tracker API",
    version: "1.0.0",
    description: "Backend API surface for health and GraphQL access.",
  },
  servers: [
    {
      url: "http://localhost:4000",
    },
  ],
  paths: {
    "/health": {
      get: {
        summary: "Liveness probe",
        description: "Returns process-level liveness and Mongo connection state.",
        responses: {
          "200": {
            description: "Service is alive",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/HealthResponse",
                },
              },
            },
          },
        },
      },
    },
    "/healthcheck": {
      get: {
        summary: "Readiness probe",
        description: "Returns ready=true only when MongoDB ping succeeds.",
        responses: {
          "200": {
            description: "Service is ready",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/ReadinessResponse",
                },
              },
            },
          },
          "503": {
            description: "Dependency not ready",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/ReadinessResponse",
                },
              },
            },
          },
        },
      },
    },
    "/graphql": {
      post: {
        summary: "GraphQL endpoint",
        description: "Send GraphQL operations. JWT token should be passed in Authorization header.",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  query: { type: "string", example: "query { me { id email } }" },
                  variables: { type: "object", additionalProperties: true },
                  operationName: { type: "string" },
                },
                required: ["query"],
              },
            },
          },
        },
        responses: {
          "200": {
            description: "GraphQL execution result",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/GraphQLResponse",
                },
              },
            },
          },
        },
      },
    },
  },
  components: {
    securitySchemes: {
      bearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
      },
    },
    schemas: {
      HealthResponse: {
        type: "object",
        properties: {
          status: { type: "string", example: "ok" },
          uptimeSec: { type: "number", example: 123.45 },
          timestamp: { type: "string", format: "date-time" },
          mongoConnected: { type: "boolean", example: true },
        },
        required: ["status", "uptimeSec", "timestamp", "mongoConnected"],
      },
      ReadinessResponse: {
        type: "object",
        properties: {
          ready: { type: "boolean", example: true },
          timestamp: { type: "string", format: "date-time" },
          checks: {
            type: "object",
            properties: {
              mongoPing: { type: "boolean", example: true },
            },
            required: ["mongoPing"],
          },
        },
        required: ["ready", "timestamp", "checks"],
      },
      GraphQLResponse: {
        type: "object",
        properties: {
          data: { type: "object", additionalProperties: true },
          errors: {
            type: "array",
            items: {
              type: "object",
              properties: {
                message: { type: "string" },
              },
            },
          },
        },
      },
    },
  },
} as const;

export const swaggerHtml = `
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Financial Goals Tracker API Docs</title>
    <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5/swagger-ui.css" />
  </head>
  <body>
    <div id="swagger-ui"></div>
    <script src="https://unpkg.com/swagger-ui-dist@5/swagger-ui-bundle.js"></script>
    <script>
      window.ui = SwaggerUIBundle({
        url: "/openapi.json",
        dom_id: "#swagger-ui"
      });
    </script>
  </body>
</html>
`;
