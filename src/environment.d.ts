declare global {
  namespace NodeJS {
    interface ProcessEnv {
      PAYLOAD_SECRET: string
      DATABASE_URL: string
      NEXT_PUBLIC_SERVER_URL: string
      VERCEL_PROJECT_PRODUCTION_URL: string
      NEXT_PUBLIC_BUGSINK_DSN?: string
      NEXT_PUBLIC_BUGSINK_ENVIRONMENT?: string
      NEXT_PUBLIC_SENTRY_RELEASE?: string
      BUGSINK_DSN?: string
      BUGSINK_AUTH_TOKEN?: string
      BUGSINK_URL?: string
      BUGSINK_ORG?: string
      BUGSINK_PROJECT?: string
    }
  }
}

// If this file has no import/export statements (i.e. is a script)
// convert it into a module by adding an empty export statement.
export {}
