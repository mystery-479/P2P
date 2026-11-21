import { adminClient, userClient } from "../_shared/clients.ts";
import { bearerToken, jsonResponse, preflight } from "../_shared/http.ts";

type AdminAction = "list" | "invite-official" | "set-role" | "deactivate" | "activate";

Deno.serve(async (request) => {
  const options = preflight(request);
  if (options) return options;
  if (request.method !== "POST") return jsonResponse(request, 405, { error: "Method not allowed." });

  const token = bearerToken(request);
  if (!token) return jsonResponse(request, 401, { error: "Sign in as an administrator." });
  const { data: authData, error: authError } = await userClient(token).auth.getUser(token);
  if (authError || !authData.user) return jsonResponse(request, 401, { error: "Please sign in again." });

  const { data: callerProfile } = await adminClient
    .from("profiles")
    .select("role")
    .eq("user_id", authData.user.id)
    .maybeSingle();
  if (!callerProfile || callerProfile.role !== "admin") {
    return jsonResponse(request, 403, { error: "Administrator access is required." });
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return jsonResponse(request, 400, { error: "Invalid request." });
  }
  const action = body.action as AdminAction;

  try {
    if (action === "list") {
      const { data, error } = await adminClient.auth.admin.listUsers({ page: 1, perPage: 100 });
      if (error) throw error;
      const ids = data.users.map((item) => item.id);
      const { data: profiles, error: profileError } = await adminClient
        .from("profiles")
        .select("user_id, display_name, role")
        .in("user_id", ids);
      if (profileError) throw profileError;
      const profileById = new Map((profiles ?? []).map((item) => [item.user_id, item]));
      return jsonResponse(request, 200, {
        accounts: data.users.map((item) => {
          const profile = profileById.get(item.id);
          return {
            id: item.id,
            email: item.email ?? "",
            displayName: profile?.display_name ?? "",
            role: profile?.role ?? "citizen",
            disabled: Boolean(item.banned_until && new Date(item.banned_until) > new Date()),
          };
        }),
      });
    }

    if (action === "invite-official") {
      const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
      const displayName = typeof body.displayName === "string" ? body.displayName.trim().slice(0, 100) : "";
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !displayName) {
        return jsonResponse(request, 400, { error: "Enter a valid email and official name." });
      }
      const redirectTo = Deno.env.get("AUTH_REDIRECT_URL") || "http://localhost:5173/login";
      const { data, error } = await adminClient.auth.admin.inviteUserByEmail(email, {
        data: { display_name: displayName },
        redirectTo,
      });
      if (error || !data.user) throw error ?? new Error("Invite could not be created.");
      const { error: profileError } = await adminClient
        .from("profiles")
        .upsert({ user_id: data.user.id, display_name: displayName, role: "official" });
      if (profileError) {
        await adminClient.auth.admin.deleteUser(data.user.id);
        throw profileError;
      }
      return jsonResponse(request, 201, { ok: true, email });
    }

    if (action === "set-role") {
      const userId = typeof body.userId === "string" ? body.userId : "";
      const role = body.role;
      if (!userId || (role !== "citizen" && role !== "official")) {
        return jsonResponse(request, 400, { error: "Invalid account role change." });
      }
      if (userId === authData.user.id) {
        return jsonResponse(request, 400, { error: "You cannot change your own administrator role." });
      }
      const { data: targetProfile, error: targetError } = await adminClient
        .from("profiles")
        .select("role")
        .eq("user_id", userId)
        .maybeSingle();
      if (targetError || !targetProfile || targetProfile.role === "admin") {
        return jsonResponse(request, 400, { error: "Administrator roles cannot be changed here." });
      }
      const { error } = await adminClient.from("profiles").update({ role }).eq("user_id", userId);
      if (error) throw error;
      return jsonResponse(request, 200, { ok: true });
    }

    if (action === "deactivate" || action === "activate") {
      const userId = typeof body.userId === "string" ? body.userId : "";
      if (!userId || userId === authData.user.id) {
        return jsonResponse(request, 400, { error: "Invalid account selection." });
      }
      const { data: targetProfile } = await adminClient
        .from("profiles")
        .select("role")
        .eq("user_id", userId)
        .maybeSingle();
      if (!targetProfile || targetProfile.role !== "official") {
        return jsonResponse(request, 400, { error: "Only official accounts can be suspended here." });
      }
      const { error } = await adminClient.auth.admin.updateUserById(userId, {
        ban_duration: action === "deactivate" ? "876000h" : "none",
      });
      if (error) throw error;
      return jsonResponse(request, 200, { ok: true });
    }

    return jsonResponse(request, 400, { error: "Unknown account action." });
  } catch (cause) {
    console.error("Admin user operation failed.", cause);
    return jsonResponse(request, 500, { error: "Account operation failed. Check account setup and mail settings." });
  }
});
