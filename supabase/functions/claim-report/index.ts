import { adminClient, userClient } from "../_shared/clients.ts";
import { bearerToken, jsonResponse, preflight, sha256 } from "../_shared/http.ts";

Deno.serve(async (request) => {
  const options = preflight(request);
  if (options) return options;
  if (request.method !== "POST") return jsonResponse(request, 405, { error: "Method not allowed." });

  const token = bearerToken(request);
  if (!token) return jsonResponse(request, 401, { error: "Sign in before claiming a report." });

  const { data: authData, error: authError } = await userClient(token).auth.getUser(token);
  if (authError || !authData.user) return jsonResponse(request, 401, { error: "Please sign in again." });
  const { data: profile } = await adminClient
    .from("profiles")
    .select("role")
    .eq("user_id", authData.user.id)
    .maybeSingle();
  if (!profile || profile.role !== "citizen") {
    return jsonResponse(request, 403, { error: "Only citizen accounts can claim a report." });
  }

  let code: unknown;
  try {
    ({ claimCode: code } = await request.json());
  } catch {
    return jsonResponse(request, 400, { error: "Enter a valid claim code." });
  }
  if (typeof code !== "string" || code.length < 60 || code.length > 100) {
    return jsonResponse(request, 400, { error: "Enter a valid claim code." });
  }

  const tokenHash = await sha256(code);
  const { data: ticketCode, error } = await adminClient.rpc("claim_anonymous_ticket", {
    p_token_hash: tokenHash,
    p_user_id: authData.user.id,
  });
  if (error || typeof ticketCode !== "string") {
    return jsonResponse(request, 400, { error: "That claim code is invalid, expired, or already used." });
  }
  return jsonResponse(request, 200, { ticketCode });
});
