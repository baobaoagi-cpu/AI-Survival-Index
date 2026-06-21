import { Hono } from "hono";
import type { ArchetypeKey } from "@ai-survival/shared";
import { ARCHETYPE_BY_KEY } from "@ai-survival/shared";
import { createSupabaseAdmin } from "../services/supabase-admin.js";
import {
  createShareInvite,
  linkReferral,
  markInviteAccepted,
  markInviteOpened,
  QuizPersistenceError,
  resolveInviteOwnerProfileId,
  upsertProfile,
} from "../services/quiz-session-service.js";

type ProfileRow = {
  id: string;
  line_user_id: string | null;
  display_name: string | null;
  picture_url: string | null;
  created_at?: string;
};

type ResultRow = {
  profile_id: string | null;
  primary_type: ArchetypeKey | null;
  secondary_type: ArchetypeKey | null;
  evolution_type: ArchetypeKey | null;
  created_at: string;
};

type FriendLinkRow = {
  id: string;
  owner_profile_id: string;
  friend_profile_id: string;
  source: string | null;
  created_at: string;
};

type FriendLinkView = FriendLinkRow & {
  direction: "outgoing" | "incoming";
  friend_profile_id: string;
};

export const friendsRoute = new Hono();

friendsRoute.post("/invite", async (c) => {
  const lineUserId = c.req.header("x-line-user-id")?.trim();
  if (!lineUserId) {
    return c.json({ error: "x-line-user-id is required" }, 400);
  }

  const body = (await c.req.json().catch(() => null)) as { source?: string; metadata?: Record<string, unknown> } | null;
  const supabase = createSupabaseAdmin();
  if (!supabase) {
    return c.json({ persisted: false, reason: "supabase is not configured" }, 202);
  }

  try {
    const invite = await createShareInvite(supabase, {
      lineUserId,
      ...(c.req.header("x-line-display-name") ? { displayName: c.req.header("x-line-display-name") as string } : {}),
      ...(c.req.header("x-line-picture-url") ? { pictureUrl: c.req.header("x-line-picture-url") as string } : {}),
      source: body?.source || "share_button",
      metadata: body?.metadata || {},
    });

    return c.json({ persisted: true, ...invite });
  } catch (error) {
    if (error instanceof QuizPersistenceError) {
      console.warn(error.message, error.cause);
      return c.json({ persisted: false, reason: error.message }, 202);
    }
    throw error;
  }
});

friendsRoute.post("/invite/open", async (c) => {
  const body = (await c.req.json().catch(() => null)) as { inviteCode?: string } | null;
  const inviteCode = body?.inviteCode?.trim();
  if (!inviteCode) {
    return c.json({ error: "inviteCode is required" }, 400);
  }

  const supabase = createSupabaseAdmin();
  if (!supabase) {
    return c.json({ persisted: false, reason: "supabase is not configured" }, 202);
  }

  try {
    await markInviteOpened(supabase, inviteCode);
    return c.json({ persisted: true });
  } catch (error) {
    if (error instanceof QuizPersistenceError) {
      console.warn(error.message, error.cause);
      return c.json({ persisted: false, reason: error.message }, 202);
    }
    throw error;
  }
});

friendsRoute.post("/referral", async (c) => {
  const body = (await c.req.json().catch(() => null)) as { referrerProfileId?: string; inviteCode?: string; source?: string } | null;
  const referrerProfileId = body?.referrerProfileId?.trim();
  const inviteCode = body?.inviteCode?.trim();
  const lineUserId = c.req.header("x-line-user-id")?.trim();

  if (!referrerProfileId && !inviteCode) {
    return c.json({ error: "referrerProfileId or inviteCode is required" }, 400);
  }
  if (!lineUserId) {
    return c.json({ error: "x-line-user-id is required" }, 400);
  }

  const supabase = createSupabaseAdmin();
  if (!supabase) {
    return c.json({ persisted: false, reason: "supabase is not configured" }, 202);
  }

  try {
    const inviteOwnerProfileId = inviteCode ? await resolveInviteOwnerProfileId(supabase, inviteCode) : null;
    const ownerProfileId = inviteOwnerProfileId || referrerProfileId;
    if (!ownerProfileId) {
      return c.json({ error: "inviteCode is invalid or expired" }, 400);
    }

    const friendProfileId = await upsertProfile(supabase, {
      lineUserId,
      ...(c.req.header("x-line-display-name") ? { displayName: c.req.header("x-line-display-name") as string } : {}),
      ...(c.req.header("x-line-picture-url") ? { pictureUrl: c.req.header("x-line-picture-url") as string } : {}),
    });
    await linkReferral(supabase, ownerProfileId, friendProfileId, inviteOwnerProfileId ? "line_liff_invite" : body?.source || "line_liff_login");
    if (inviteCode) await markInviteAccepted(supabase, inviteCode);
    return c.json({ persisted: true, profileId: friendProfileId, ownerProfileId, inviteCode: inviteCode || null });
  } catch (error) {
    if (error instanceof QuizPersistenceError) {
      console.warn(error.message, error.cause);
      return c.json({ persisted: false, reason: error.message }, 202);
    }
    throw error;
  }
});

friendsRoute.get("/wall", async (c) => {
  const supabase = createSupabaseAdmin();
  if (!supabase) {
    return c.json({ persisted: false, owner: null, friends: [], distribution: [], totals: emptyTotals() }, 202);
  }

  const owner = await resolveOwnerProfile(c, supabase);
  if (!owner) {
    return c.json({ persisted: true, owner: null, friends: [], distribution: [], totals: emptyTotals() });
  }

  const { data: links, error: linksError } = await supabase
    .from("friend_links")
    .select("id,owner_profile_id,friend_profile_id,source,created_at")
    .or(`owner_profile_id.eq.${owner.id},friend_profile_id.eq.${owner.id}`)
    .order("created_at", { ascending: false })
    .limit(400);

  if (linksError) {
    console.warn("Failed to load friend links", linksError);
    return c.json({ persisted: false, reason: linksError.message, owner, friends: [], distribution: [], totals: emptyTotals() }, 202);
  }

  const friendLinks = normalizeFriendLinks(owner.id, (links ?? []) as FriendLinkRow[]);
  const friendIds = [...new Set(friendLinks.map((link) => link.friend_profile_id).filter(Boolean))];
  const [profiles, results, events, memberships, invites] = await Promise.all([
    friendIds.length
      ? supabase.from("profiles").select("id,line_user_id,display_name,picture_url,created_at").in("id", friendIds)
      : Promise.resolve({ data: [], error: null }),
    friendIds.length
      ? supabase
          .from("archetype_results")
          .select("profile_id,primary_type,secondary_type,evolution_type,created_at")
          .in("profile_id", friendIds)
          .order("created_at", { ascending: false })
      : Promise.resolve({ data: [], error: null }),
    friendIds.length
      ? supabase
          .from("user_events")
          .select("profile_id,event_name,occurred_at")
          .in("profile_id", friendIds)
          .in("event_name", ["clicked_shallow_report_unlock", "clicked_deep_report_intent"])
          .order("occurred_at", { ascending: false })
      : Promise.resolve({ data: [], error: null }),
    friendIds.length
      ? supabase.from("memberships").select("profile_id,status").in("profile_id", friendIds)
      : Promise.resolve({ data: [], error: null }),
    supabase
      .from("share_invites")
      .select("invite_code,source,open_count,accept_count,completed_count,created_at,last_opened_at,last_accepted_at,last_completed_at")
      .eq("owner_profile_id", owner.id)
      .order("created_at", { ascending: false })
      .limit(20),
  ]);

  const profilesById = new Map(((profiles.data ?? []) as ProfileRow[]).map((profile) => [profile.id, profile]));
  const latestResultByProfile = latestByProfile((results.data ?? []) as ResultRow[]);
  const eventProfileIds = new Set((events.data ?? []).map((event: any) => event.profile_id).filter(Boolean));
  const paidProfileIds = new Set(
    (memberships.data ?? [])
      .filter((membership: any) => ["trial", "active"].includes(String(membership.status)))
      .map((membership: any) => membership.profile_id),
  );

  const friends = friendLinks
    .map((link) => {
      const profile = profilesById.get(link.friend_profile_id);
      if (!profile) return null;
      const result = latestResultByProfile.get(profile.id) ?? null;
      const primaryType = result?.primary_type ?? null;
      return {
        profileId: profile.id,
        displayName: profile.display_name,
        pictureUrl: profile.picture_url,
        primaryType,
        primaryName: primaryType ? ARCHETYPE_BY_KEY[primaryType]?.name ?? primaryType : null,
        secondaryType: result?.secondary_type ?? null,
        evolutionType: result?.evolution_type ?? null,
        status: deriveStatus(profile.id, primaryType, paidProfileIds, eventProfileIds),
        source: link.source,
        relationshipDirection: link.direction,
        linkedAt: link.created_at,
      };
    })
    .filter(Boolean);

  return c.json({
    persisted: true,
    owner,
    friends,
    distribution: buildDistribution(friends),
    totals: buildTotals(friends),
    invites: invites.data ?? [],
  });
});

function normalizeFriendLinks(ownerProfileId: string, links: FriendLinkRow[]): FriendLinkView[] {
  const byFriendId = new Map<string, FriendLinkView>();
  for (const link of links) {
    const isOutgoing = link.owner_profile_id === ownerProfileId;
    const friendProfileId = isOutgoing ? link.friend_profile_id : link.owner_profile_id;
    if (!friendProfileId || friendProfileId === ownerProfileId || byFriendId.has(friendProfileId)) continue;
    byFriendId.set(friendProfileId, {
      ...link,
      friend_profile_id: friendProfileId,
      direction: isOutgoing ? "outgoing" : "incoming",
    });
  }
  return [...byFriendId.values()];
}

async function resolveOwnerProfile(c: any, supabase: any): Promise<ProfileRow | null> {
  const profileId = c.req.query("profileId")?.trim();
  if (profileId) {
    const { data } = await supabase
      .from("profiles")
      .select("id,line_user_id,display_name,picture_url,created_at")
      .eq("id", profileId)
      .maybeSingle();
    return (data as ProfileRow | null) ?? null;
  }

  const lineUserId = c.req.header("x-line-user-id")?.trim() || c.req.query("lineUserId")?.trim();
  if (!lineUserId) return null;

  const ownerProfileId = await upsertProfile(supabase, {
    lineUserId,
    ...(c.req.header("x-line-display-name") ? { displayName: c.req.header("x-line-display-name") as string } : {}),
    ...(c.req.header("x-line-picture-url") ? { pictureUrl: c.req.header("x-line-picture-url") as string } : {}),
  });
  const { data } = await supabase
    .from("profiles")
    .select("id,line_user_id,display_name,picture_url,created_at")
    .eq("id", ownerProfileId)
    .single();
  return (data as ProfileRow | null) ?? null;
}

function latestByProfile(rows: ResultRow[]): Map<string, ResultRow> {
  const map = new Map<string, ResultRow>();
  for (const row of rows) {
    if (!row.profile_id || map.has(row.profile_id)) continue;
    map.set(row.profile_id, row);
  }
  return map;
}

function deriveStatus(
  profileId: string,
  primaryType: ArchetypeKey | null,
  paidProfileIds: Set<string>,
  eventProfileIds: Set<string>,
) {
  if (paidProfileIds.has(profileId)) return "compass";
  if (eventProfileIds.has(profileId)) return "oriented";
  if (primaryType) return "archetyped";
  return "unknown";
}

function buildDistribution(friends: any[]) {
  const counts = new Map<ArchetypeKey, number>();
  for (const friend of friends) {
    if (!friend.primaryType) continue;
    counts.set(friend.primaryType, (counts.get(friend.primaryType) ?? 0) + 1);
  }
  return [...counts.entries()]
    .map(([key, count]) => ({
      key,
      name: ARCHETYPE_BY_KEY[key]?.name ?? key,
      count,
    }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name, "zh-Hant"));
}

function buildTotals(friends: any[]) {
  const totals = emptyTotals();
  totals.friends = friends.length;
  for (const friend of friends) {
    if (friend.primaryType) totals.withResult += 1;
    if (friend.status === "compass") totals.compass += 1;
    if (friend.status === "oriented") totals.oriented += 1;
    if (friend.status === "archetyped") totals.archetyped += 1;
    if (friend.status === "unknown") totals.unknown += 1;
  }
  return totals;
}

function emptyTotals() {
  return {
    friends: 0,
    withResult: 0,
    compass: 0,
    oriented: 0,
    archetyped: 0,
    unknown: 0,
  };
}
