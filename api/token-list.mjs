import { tokenListResponse } from "./token-metadata.mjs";

export async function GET() {
  return tokenListResponse();
}
