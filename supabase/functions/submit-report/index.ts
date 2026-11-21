import { adminClient, anonKey } from "../_shared/clients.ts";
import { bearerToken, getClientIp, jsonResponse, preflight, sha256 } from "../_shared/http.ts";
import { triage } from "../_shared/triage.ts";

const MAX_DESCRIPTION = 2000;
const MAX_PHOTO_BYTES = 5 * 1024 * 1024;
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const phonePattern = /^\+?[\d][\d\s-]{5,}$/;

type ReportBody = {
  description?: unknown;
  language?: unknown;
  location?: unknown;
  locality?: unknown;
  ward?: unknown;
  photoUrl?: unknown;
  reporterName?: unknown;
  reporterEmail?: unknown;
  reporterPhone?: unknown;
};

function text(value: unknown, maxLength: number): string {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}

function decodePhoto(dataUrl: unknown): { bytes: Uint8Array; contentType: string; extension: string } | null {
  if (dataUrl === undefined || dataUrl === null || dataUrl === "") return null;
  if (typeof dataUrl !== "string") throw new Error("The photo is invalid.");
  const match = /^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/=]+)$/.exec(dataUrl);
  if (!match) throw new Error("Use a JPG, PNG, or WebP image.");
  const contentType = match[1];
  const base64 = match[2];
  if (base64.length > Math.ceil(MAX_PHOTO_BYTES * 4 / 3) + 8) throw new Error("The photo must be 5 MB or smaller.");
  const binary = atob(base64);
  if (binary.length > MAX_PHOTO_BYTES) throw new Error("The photo must be 5 MB or smaller.");
  return {
    bytes: Uint8Array.from(binary, (char) => char.charCodeAt(0)),
    contentType,
    extension: contentType === "image/jpeg" ? "jpg" : contentType.split("/")[1],
  };
}

Deno.serve(async (request) => {
  const options = preflight(request);
  if (options) return options;
  if (request.method !== "POST") return jsonResponse(request, 405, { error: "Method not allowed." });

  try {
    let body: ReportBody;
    try {
      body = await request.json() as ReportBody;
    } catch {
      return jsonResponse(request, 400, { error: "Invalid request." });
    }

    const description = text(body.description, MAX_DESCRIPTION);
    const language = text(body.language, 40) || "Other";
    const location = text(body.location, 240);
    const locality = text(body.locality, 120);
    const ward = text(body.ward, 40);
    const reporterName = text(body.reporterName, 100);
    const reporterEmail = text(body.reporterEmail, 254).toLowerCase();
    const reporterPhone = text(body.reporterPhone, 40);

    if (description.length < 10 || location.length < 3 || locality.length < 2) {
      return jsonResponse(request, 400, { error: "Add a clear description, location, and neighbourhood." });
    }
    if (reporterEmail && !emailPattern.test(reporterEmail)) {
      return jsonResponse(request, 400, { error: "Enter a valid contact email." });
    }
    if (reporterPhone && !phonePattern.test(reporterPhone)) {
      return jsonResponse(request, 400, { error: "Enter a valid contact phone number." });
    }

    const token = bearerToken(request);
    let userId: string | null = null;
    // For anonymous requests, supabase-js sends the configured publishable key
    // as both `apikey` and the Bearer token. It is not the legacy anon JWT
    // available in the Edge Function environment, so compare both forms.
    const requestApiKey = request.headers.get("apikey");
    if (token && token !== anonKey && token !== requestApiKey) {
      const { data, error } = await adminClient.auth.getUser(token);
      if (error || !data.user) return jsonResponse(request, 401, { error: "Please sign in again." });
      userId = data.user.id;
      const { data: profile, error: profileError } = await adminClient
        .from("profiles")
        .select("role")
        .eq("user_id", userId)
        .maybeSingle();
      if (profileError || !profile) return jsonResponse(request, 403, { error: "Account access is not ready." });
      if (!["citizen", "official", "admin"].includes(profile.role)) {
        return jsonResponse(request, 403, { error: "This account cannot submit reports." });
      }
    }

    const rateKey = userId ? `user:${userId}` : `ip:${getClientIp(request)}`;
    const keyHash = await sha256(`${Deno.env.get("RATE_LIMIT_HASH_SECRET") ?? ""}:${rateKey}`);
    const { data: allowed, error: rateError } = await adminClient.rpc("consume_public_report_rate_limit", {
      p_key_hash: keyHash,
      p_max_requests: userId ? 12 : 5,
      p_window_seconds: 3600,
    });
    if (rateError) {
      console.error("Rate limit check failed.");
      return jsonResponse(request, 503, { error: "Report service is temporarily unavailable." });
    }
    if (!allowed) return jsonResponse(request, 429, { error: "Please wait before sending another report." });

    let photo: ReturnType<typeof decodePhoto>;
    try {
      photo = decodePhoto(body.photoUrl);
    } catch (cause) {
      return jsonResponse(request, 400, {
        error: cause instanceof Error ? cause.message : "The photo is invalid.",
      });
    }

    const ticketId = crypto.randomUUID();
    const photoPath = photo ? `${ticketId}/report.${photo.extension}` : null;
    if (photo && photoPath) {
      const { error } = await adminClient.storage.from("complaint-photos").upload(photoPath, photo.bytes, {
        contentType: photo.contentType,
        cacheControl: "3600",
        upsert: false,
      });
      if (error) {
        console.error("Photo upload failed.");
        return jsonResponse(request, 400, { error: "We could not save that photo. Please try again without it." });
      }
    }

    const recommendation = triage(description, language);
    const { data: inserted, error: insertError } = await adminClient
      .from("tickets")
      .insert({
        id: ticketId,
        owner_id: userId,
        description,
        language,
        photo_path: photoPath,
        location,
        locality,
        ward,
        ...recommendation,
      })
      .select("*")
      .single();

    if (insertError || !inserted) {
      if (photoPath) await adminClient.storage.from("complaint-photos").remove([photoPath]);
      console.error("Ticket insert failed.");
      return jsonResponse(request, 500, { error: "We could not save your report. Please try again." });
    }

    if (reporterName || reporterEmail || reporterPhone) {
      const { error } = await adminClient.from("ticket_private").insert({
        ticket_id: ticketId,
        reporter_name: reporterName || null,
        reporter_email: reporterEmail || null,
        reporter_phone: reporterPhone || null,
      });
      if (error) {
        await adminClient.from("tickets").delete().eq("id", ticketId);
        if (photoPath) await adminClient.storage.from("complaint-photos").remove([photoPath]);
        console.error("Private contact save failed.");
        return jsonResponse(request, 500, { error: "We could not save your report. Please try again." });
      }
    }

    let claimCode: string | undefined;
    if (!userId) {
      claimCode = `${crypto.randomUUID()}${crypto.randomUUID()}`;
      const { error } = await adminClient.from("ticket_claims_private").insert({
        ticket_id: ticketId,
        claim_token_hash: await sha256(claimCode),
      });
      if (error) {
        await adminClient.from("tickets").delete().eq("id", ticketId);
        if (photoPath) await adminClient.storage.from("complaint-photos").remove([photoPath]);
        console.error("Claim code creation failed.");
        return jsonResponse(request, 500, { error: "We could not save your report. Please try again." });
      }
    }

    let signedPhotoUrl: string | undefined;
    if (photoPath) {
      const { data } = await adminClient.storage.from("complaint-photos").createSignedUrl(photoPath, 1800);
      signedPhotoUrl = data?.signedUrl;
    }

    return jsonResponse(request, 201, {
      ticket: {
        id: inserted.ticket_code,
        databaseId: inserted.id,
        description: inserted.description,
        language: inserted.language,
        location: inserted.location,
        locality: inserted.locality,
        ward: inserted.ward,
        ...(signedPhotoUrl ? { photoUrl: signedPhotoUrl } : {}),
        category: inserted.category,
        severity: inserted.severity,
        severityReason: inserted.severity_reason,
        department: inserted.department,
        status: inserted.status,
        createdAt: inserted.created_at,
        needsReview: inserted.needs_review,
        ...(inserted.duplicate_group_id ? { duplicateGroupId: inserted.duplicate_group_id } : {}),
        duplicateCount: inserted.duplicate_group_id ? 2 : 1,
      },
      ...(claimCode ? { claimCode } : {}),
    });
  } catch {
    console.error("Unexpected report submission failure.");
    return jsonResponse(request, 500, { error: "Report service is temporarily unavailable." });
  }
});
