/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_APP_VERSION: string;
  readonly VITE_SIGNALING_URL?: string;
  readonly VITE_TURN_SERVERS?: string;
  readonly VITE_TURN_USERNAME?: string;
  readonly VITE_TURN_CREDENTIAL?: string;
  readonly VITE_ROOM_SOLO_TIMEOUT_MINUTES?: string;
  readonly VITE_MESSAGE_DEFAULT_TTL_SECONDS?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

declare module "*.svg" {
  const content: string;
  export default content;
}

declare module "*.css" {
  const content: Record<string, string>;
  export default content;
}

