import * as Sentry from "@sentry/react";

export const init = () => {
Sentry.init({
   dsn: "https://70b2bfd14a2c87bfee2b3bdc0ec16062@o1333667.ingest.us.sentry.io/4509345097646080",
  // Setting this option to true will send default PII data to Sentry.
  // For example, automatic IP address collection on events
  sendDefaultPii: true
})
}

export const log = (error) => {
    Sentry.captureException(error)
}