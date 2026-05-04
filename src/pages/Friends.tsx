import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Search, UserPlus, Users, Plus, Check, X, Flame, MessageCircle, Sparkles, Clock, ArrowDownLeft, ArrowUpRight } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import BottomNav from "@/components/BottomNav";
import XpAnimation from "@/components/XpAnimation";
import { useToast } from "@/hooks/use-toast";

type Tab = "friends" | "requests" | "groups";

interface UserProfile {
  user_id: string;
  name: string;
  goal_label: string;
  goal_emoji: string;
  streak: number;
  avatar_url: string | null;
  goal_category: string;
}

interface FriendRequest {
  id: string;
  sender_id: string;
  receiver_id: string;
  status: string;
  created_at: string;
}

interface FriendGroup {
  id: string;
  name: string;
  invite_code: string;
  created_by: string;
  member_count?: number;
}

const Friends = () => {
  const navigate = useNavigate();
  const { user, profile, loading } = useAuth();
  const { toast } = useToast();
  const [tab, setTab] = useState<Tab>("friends");
  const [searchQuery, setSearchQuery] = useState("");
  const [allUsers, setAllUsers] = useState<UserProfile[]>([]);
  const [friendRequests, setFriendRequests] = useState<FriendRequest[]>([]);
  const [requestProfiles, setRequestProfiles] = useState<Record<string, UserProfile>>({});
  const [friends, setFriends] = useState<UserProfile[]>([]);
  const [groups, setGroups] = useState<FriendGroup[]>([]);
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [groupName, setGroupName] = useState("");
  const [selectedFriends, setSelectedFriends] = useState<string[]>([]);
  const [showSearch, setShowSearch] = useState(false);
  const [xpGain, setXpGain] = useState(0);
  const [showXp, setShowXp] = useState(false);

  useEffect(() => {
    if (!loading && !user) navigate("/goal-setup");
  }, [loading, user, navigate]);

  useEffect(() => {
    if (!user) return;
    loadData();
  }, [user]);

  const loadData = async () => {
    if (!user) return;

    // Load friend requests
    const { data: reqs } = await supabase
      .from("friend_requests")
      .select("*")
      .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`);
    if (reqs) setFriendRequests(reqs);

    // Get accepted friend IDs
    const acceptedReqs = (reqs || []).filter(r => r.status === "accepted");
    const friendIds = acceptedReqs.map(r => r.sender_id === user.id ? r.receiver_id : r.sender_id);

    if (friendIds.length > 0) {
      const { data: friendProfiles } = await supabase
        .from("profiles")
        .select("user_id, name, goal_label, goal_emoji, streak, avatar_url, goal_category")
        .in("user_id", friendIds);
      if (friendProfiles) setFriends(friendProfiles);
    } else {
      setFriends([]);
    }

    // Load profiles for ALL users in pending requests (incoming + outgoing)
    const pendingReqs = (reqs || []).filter(r => r.status === "pending");
    const otherIds = Array.from(new Set(pendingReqs.map(r => r.sender_id === user.id ? r.receiver_id : r.sender_id)));
    if (otherIds.length > 0) {
      const { data: profs } = await supabase
        .from("profiles")
        .select("user_id, name, goal_label, goal_emoji, streak, avatar_url, goal_category")
        .in("user_id", otherIds);
      if (profs) {
        const map: Record<string, UserProfile> = {};
        profs.forEach(p => { map[p.user_id] = p; });
        setRequestProfiles(map);
      }
    } else {
      setRequestProfiles({});
    }

    // Load groups
    const { data: grps } = await supabase.from("friend_groups").select("*");
    if (grps) setGroups(grps);
  };

  const searchUsers = async (query: string) => {
    if (!query.trim() || !user) { setAllUsers([]); return; }
    const { data } = await supabase
      .from("profiles")
      .select("user_id, name, goal_label, goal_emoji, streak, avatar_url, goal_category")
      .ilike("name", `%${query}%`)
      .neq("user_id", user.id)
      .limit(20);
    if (data) setAllUsers(data);
  };

  useEffect(() => {
    const timeout = setTimeout(() => searchUsers(searchQuery), 300);
    return () => clearTimeout(timeout);
  }, [searchQuery]);

  const sendRequest = async (receiverId: string) => {
    if (!user) return;
    await supabase.from("friend_requests").insert({ sender_id: user.id, receiver_id: receiverId });
    toast({ title: "Friend request sent! 🤝" });
    loadData();
  };

  const acceptRequest = async (requestId: string) => {
    await supabase.from("friend_requests").update({ status: "accepted" }).eq("id", requestId);
    if (user && profile) {
      await supabase.from("profiles").update({ xp: (profile.xp ?? 0) + 5 }).eq("user_id", user.id);
      setXpGain(5);
      setShowXp(true);
    }
    toast({ title: "You're now friends! 🎉" });
    loadData();
  };

  const cancelRequest = async (requestId: string) => {
    await supabase.from("friend_requests").delete().eq("id", requestId);
    toast({ title: "Request cancelled" });
    loadData();
  };

  const messageFriend = async (friendId: string) => {
    if (!user || !profile) return;
    // Find or create a match between the two
    const { data: existing } = await supabase
      .from("matches")
      .select("*")
      .or(`and(user1_id.eq.${user.id},user2_id.eq.${friendId}),and(user1_id.eq.${friendId},user2_id.eq.${user.id})`)
      .limit(1)
      .maybeSingle();
    if (existing) {
      navigate(`/chat/${existing.id}`);
      return;
    }
    const { data: created } = await supabase
      .from("matches")
      .insert({ user1_id: user.id, user2_id: friendId, goal_category: profile.goal_category })
      .select()
      .single();
    if (created) navigate(`/chat/${created.id}`);
  };

  const cheerFriend = async (friendId: string) => {
    if (!user || !profile) return;
    // Award +2 XP to both
    await supabase.from("profiles").update({ xp: (profile.xp ?? 0) + 2 }).eq("user_id", user.id);
    const { data: friendProfile } = await supabase.from("profiles").select("xp").eq("user_id", friendId).single();
    if (friendProfile) {
      await supabase.from("profiles").update({ xp: (friendProfile.xp ?? 0) + 2 }).eq("user_id", friendId);
    }
    setXpGain(2);
    setShowXp(true);
  };

  const rejectRequest = async (requestId: string) => {
    await supabase.from("friend_requests").delete().eq("id", requestId);
    toast({ title: "Request declined" });
    loadData();
  };

  const getRequestStatus = (userId: string): string | null => {
    const req = friendRequests.find(r =>
      (r.sender_id === user?.id && r.receiver_id === userId) ||
      (r.receiver_id === user?.id && r.sender_id === userId)
    );
    return req?.status ?? null;
  };

  const createGroup = async () => {
    if (!groupName.trim() || !user) return;
    const { data: group } = await supabase
      .from("friend_groups")
      .insert({ name: groupName, created_by: user.id })
      .select()
      .single();
    if (group) {
      // Add self
      await supabase.from("friend_group_members").insert({ group_id: group.id, user_id: user.id });
      // Add selected friends
      for (const fId of selectedFriends) {
        await supabase.from("friend_group_members").insert({ group_id: group.id, user_id: fId });
      }
      setShowCreateGroup(false);
      setGroupName("");
      setSelectedFriends([]);
      loadData();
    }
  };

  const pendingReceived = friendRequests.filter(r => r.receiver_id === user?.id && r.status === "pending");
  const pendingSent = friendRequests.filter(r => r.sender_id === user?.id && r.status === "pending");
  const totalPending = pendingReceived.length + pendingSent.length;

  const Avatar = ({ u }: { u: UserProfile }) => u.avatar_url
    ? <img src={u.avatar_url} alt="" className="w-10 h-10 rounded-full object-cover" />
    : <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold"
        style={{ background: 'hsla(258, 80%, 50%, 0.2)' }}>{u.name.charAt(0).toUpperCase()}</div>;

  if (loading || !profile) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-4xl animate-pulse">👥</div>
    </div>
  );

  return (
    <div className="min-h-screen pb-24">
      <XpAnimation amount={xpGain} show={showXp} onDone={() => setShowXp(false)} />
      <header className="sticky top-0 z-50 backdrop-blur-xl border-b border-border/50 bg-background/80">
        <div className="flex items-center justify-between px-4 py-3 max-w-lg mx-auto">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate("/dashboard")} className="p-2 rounded-full glass-card">
              <ArrowLeft className="w-4 h-4 text-foreground" />
            </button>
            <h1 className="text-lg font-bold text-foreground">Friends</h1>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setShowSearch(!showSearch)} className="p-2 rounded-full glass-card">
              <Search className="w-4 h-4 text-foreground" />
            </button>
            <button onClick={() => setShowCreateGroup(!showCreateGroup)} className="p-2 rounded-full glass-card">
              <Plus className="w-4 h-4 text-foreground" />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex max-w-lg mx-auto px-4 pb-2 gap-2">
          {([
            { key: "friends" as Tab, label: "Friends", count: friends.length },
            { key: "requests" as Tab, label: "Requests", count: totalPending },
            { key: "groups" as Tab, label: "Groups", count: groups.length },
          ]).map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={cn(
                "flex-1 py-2 rounded-full text-xs font-bold transition-all",
                tab === t.key
                  ? "text-primary-foreground"
                  : "text-muted-foreground glass-card"
              )}
              style={tab === t.key ? { background: 'linear-gradient(135deg, hsl(258 100% 62%), hsl(280 100% 55%))' } : undefined}
            >
              {t.label} {t.count > 0 && `(${t.count})`}
            </button>
          ))}
        </div>
      </header>

      <main className="px-4 py-4 max-w-lg mx-auto space-y-3">
        {/* Search */}
        {showSearch && (
          <div className="glass-card p-4">
            <input
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search users by name..."
              className="w-full bg-transparent border border-border/50 rounded-full px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
            {allUsers.length > 0 && (
              <div className="mt-3 space-y-2">
                {allUsers.map(u => {
                  const status = getRequestStatus(u.user_id);
                  return (
                    <div key={u.user_id} className="flex items-center gap-3 p-2">
                      <Avatar u={u} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-foreground">{u.name}</p>
                        <p className="text-xs text-muted-foreground">{u.goal_emoji} {u.goal_label}</p>
                      </div>
                      {status === "accepted" ? (
                        <span className="text-xs text-primary font-semibold">Friends</span>
                      ) : status === "pending" ? (
                        <span className="text-xs text-muted-foreground font-semibold">Pending</span>
                      ) : (
                        <button onClick={() => sendRequest(u.user_id)}
                          className="p-2 rounded-full" style={{ background: 'hsla(258, 80%, 50%, 0.2)' }}>
                          <UserPlus className="w-4 h-4 text-primary" />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Create Group Modal */}
        {showCreateGroup && (
          <div className="glass-card-glow p-5">
            <h3 className="text-sm font-bold text-foreground mb-3">Create a Group</h3>
            <input
              value={groupName}
              onChange={e => setGroupName(e.target.value)}
              placeholder="Group name..."
              className="w-full bg-transparent border border-border/50 rounded-full px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/50 mb-3"
            />
            {friends.length > 0 && (
              <>
                <p className="text-xs text-muted-foreground mb-2">Select friends to add:</p>
                <div className="space-y-2 mb-3 max-h-40 overflow-y-auto">
                  {friends.map(f => (
                    <button key={f.user_id}
                      onClick={() => setSelectedFriends(prev =>
                        prev.includes(f.user_id) ? prev.filter(id => id !== f.user_id) : [...prev, f.user_id]
                      )}
                      className={cn("w-full flex items-center gap-3 p-2 rounded-xl transition-all",
                        selectedFriends.includes(f.user_id) ? "bg-primary/10 border border-primary/30" : ""
                      )}
                    >
                      <Avatar u={f} />
                      <span className="text-sm font-semibold text-foreground flex-1 text-left">{f.name}</span>
                      {selectedFriends.includes(f.user_id) && <Check className="w-4 h-4 text-primary" />}
                    </button>
                  ))}
                </div>
              </>
            )}
            <button onClick={createGroup} disabled={!groupName.trim()}
              className="w-full py-2.5 rounded-full text-sm font-bold text-primary-foreground disabled:opacity-40"
              style={{ background: 'linear-gradient(135deg, hsl(258 100% 62%), hsl(280 100% 55%))' }}>
              Create Group
            </button>
          </div>
        )}

        {/* Friends Tab */}
        {tab === "friends" && (
          friends.length === 0 ? (
            <div className="text-center py-16">
              <Users className="w-12 h-12 text-muted-foreground/40 mx-auto mb-3" />
              <p className="text-foreground font-semibold">No friends yet</p>
              <p className="text-muted-foreground text-sm mt-1">Search for users and send friend requests!</p>
            </div>
          ) : (
            friends.map(f => (
              <div key={f.user_id} className="glass-card p-4 flex items-center gap-3">
                <Avatar u={f} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-foreground">{f.name}</p>
                  <p className="text-xs text-muted-foreground">{f.goal_emoji} {f.goal_label}</p>
                  <div className="flex items-center gap-1 mt-0.5">
                    <Flame className="w-3 h-3 text-secondary" />
                    <span className="text-xs text-secondary font-bold">{f.streak}</span>
                  </div>
                </div>
                <div className="flex flex-col gap-1.5">
                  <button onClick={() => messageFriend(f.user_id)}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold text-primary-foreground"
                    style={{ background: 'linear-gradient(135deg, hsl(258 100% 62%), hsl(280 100% 55%))' }}>
                    <MessageCircle className="w-3.5 h-3.5" />
                    Message
                  </button>
                  <button onClick={() => cheerFriend(f.user_id)}
                    className="flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-semibold transition-all glass-card text-muted-foreground hover:text-primary hover:bg-primary/10">
                    <Sparkles className="w-3 h-3" />
                    Cheer
                  </button>
                </div>
              </div>
            ))
          )
        )}

        {/* Requests Tab */}
        {tab === "requests" && (
          totalPending === 0 ? (
            <div className="text-center py-16">
              <UserPlus className="w-12 h-12 text-muted-foreground/40 mx-auto mb-3" />
              <p className="text-foreground font-semibold">No pending requests</p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* INCOMING */}
              {pendingReceived.length > 0 && (
                <div className="space-y-2">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70 px-1">
                    Incoming ({pendingReceived.length})
                  </p>
                  {pendingReceived.map(req => {
                    const p = requestProfiles[req.sender_id];
                    return (
                      <div key={req.id} className="glass-card p-4 flex items-center gap-3">
                        {p ? <Avatar u={p} /> : (
                          <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold"
                            style={{ background: 'hsla(258, 80%, 50%, 0.2)' }}>?</div>
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <p className="text-sm font-bold text-foreground truncate">{p?.name || "User"}</p>
                            <span className="px-1.5 py-0.5 rounded-full text-[9px] font-bold flex items-center gap-0.5"
                              style={{ background: 'hsla(145, 70%, 45%, 0.18)', color: 'hsl(145 70% 60%)' }}>
                              <ArrowDownLeft className="w-2.5 h-2.5" /> Incoming
                            </span>
                          </div>
                          {p && <p className="text-xs text-muted-foreground truncate">{p.goal_emoji} {p.goal_label}</p>}
                        </div>
                        <div className="flex gap-2 flex-shrink-0">
                          <button onClick={() => acceptRequest(req.id)}
                            className="flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold text-primary-foreground"
                            style={{ background: 'linear-gradient(135deg, hsl(145 70% 45%), hsl(145 70% 38%))' }}>
                            <Check className="w-3.5 h-3.5" /> Accept
                          </button>
                          <button onClick={() => rejectRequest(req.id)}
                            className="flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold border border-destructive/40 text-destructive hover:bg-destructive/10">
                            <X className="w-3.5 h-3.5" /> Decline
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* OUTGOING */}
              {pendingSent.length > 0 && (
                <div className="space-y-2">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70 px-1">
                    Outgoing ({pendingSent.length})
                  </p>
                  {pendingSent.map(req => {
                    const p = requestProfiles[req.receiver_id];
                    return (
                      <div key={req.id} className="glass-card p-4 flex items-center gap-3">
                        {p ? <Avatar u={p} /> : (
                          <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold"
                            style={{ background: 'hsla(258, 80%, 50%, 0.2)' }}>?</div>
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <p className="text-sm font-bold text-foreground truncate">{p?.name || "User"}</p>
                            <span className="px-1.5 py-0.5 rounded-full text-[9px] font-bold flex items-center gap-0.5"
                              style={{ background: 'hsla(25, 90%, 55%, 0.18)', color: 'hsl(25 90% 65%)' }}>
                              <ArrowUpRight className="w-2.5 h-2.5" /> Outgoing
                            </span>
                          </div>
                          {p && <p className="text-xs text-muted-foreground truncate">{p.goal_emoji} {p.goal_label}</p>}
                          <p className="text-[10px] text-muted-foreground/70 mt-0.5 flex items-center gap-1">
                            <Clock className="w-2.5 h-2.5" /> Pending...
                          </p>
                        </div>
                        <button onClick={() => cancelRequest(req.id)}
                          className="px-3 py-1.5 rounded-full text-xs font-semibold border border-border text-muted-foreground hover:bg-muted/30 flex-shrink-0">
                          Cancel
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )
        )}

        {/* Groups Tab */}
        {tab === "groups" && (
          groups.length === 0 ? (
            <div className="text-center py-16">
              <Users className="w-12 h-12 text-muted-foreground/40 mx-auto mb-3" />
              <p className="text-foreground font-semibold">No groups yet</p>
              <p className="text-muted-foreground text-sm mt-1">Create a group with your friends!</p>
            </div>
          ) : (
            groups.map(g => (
              <div key={g.id} className="glass-card p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center"
                    style={{ background: 'hsla(258, 80%, 50%, 0.15)' }}>
                    <Users className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-bold text-foreground">{g.name}</p>
                    <p className="text-xs text-muted-foreground">Code: {g.invite_code}</p>
                  </div>
                  <button onClick={() => navigate(`/group-chat?group=${g.id}`)}
                    className="p-2 rounded-full" style={{ background: 'hsla(258, 80%, 50%, 0.15)' }}>
                    <MessageCircle className="w-4 h-4 text-primary" />
                  </button>
                </div>
              </div>
            ))
          )
        )}
      </main>
      <BottomNav />
    </div>
  );
};

export default Friends;
