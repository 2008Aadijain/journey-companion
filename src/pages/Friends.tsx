import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Search, UserPlus, Users, Plus, Check, X, Flame, MessageCircle } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

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
}

const Friends = () => {
  const navigate = useNavigate();
  const { user, profile, loading } = useAuth();
  const [tab, setTab] = useState<Tab>("friends");
  const [searchQuery, setSearchQuery] = useState("");
  const [allUsers, setAllUsers] = useState<UserProfile[]>([]);
  const [friendRequests, setFriendRequests] = useState<FriendRequest[]>([]);
  const [friends, setFriends] = useState<UserProfile[]>([]);
  const [groups, setGroups] = useState<FriendGroup[]>([]);
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [groupName, setGroupName] = useState("");
  const [selectedFriends, setSelectedFriends] = useState<string[]>([]);
  const [showSearch, setShowSearch] = useState(false);

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
    loadData();
  };

  const acceptRequest = async (requestId: string) => {
    await supabase.from("friend_requests").update({ status: "accepted" }).eq("id", requestId);
    loadData();
  };

  const rejectRequest = async (requestId: string) => {
    await supabase.from("friend_requests").delete().eq("id", requestId);
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

  const Avatar = ({ u }: { u: UserProfile }) => u.avatar_url
    ? <img src={u.avatar_url} alt="" className="w-10 h-10 rounded-full object-cover" />
    : <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold"
        style={{ background: 'hsla(258, 80%, 50%, 0.2)' }}>{u.name.charAt(0).toUpperCase()}</div>;

  if (loading || !profile) return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-4xl animate-pulse">👥</div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background pb-24">
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
            { key: "requests" as Tab, label: "Requests", count: pendingReceived.length },
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
              </div>
            ))
          )
        )}

        {/* Requests Tab */}
        {tab === "requests" && (
          pendingReceived.length === 0 ? (
            <div className="text-center py-16">
              <UserPlus className="w-12 h-12 text-muted-foreground/40 mx-auto mb-3" />
              <p className="text-foreground font-semibold">No pending requests</p>
            </div>
          ) : (
            pendingReceived.map(req => {
              const senderProfile = allUsers.find(u => u.user_id === req.sender_id);
              return (
                <div key={req.id} className="glass-card p-4 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold"
                    style={{ background: 'hsla(258, 80%, 50%, 0.2)' }}>
                    {senderProfile?.name?.charAt(0).toUpperCase() || "?"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-foreground">{senderProfile?.name || "User"}</p>
                    <p className="text-xs text-muted-foreground">Wants to be friends</p>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => acceptRequest(req.id)}
                      className="p-2 rounded-full bg-primary/20"><Check className="w-4 h-4 text-primary" /></button>
                    <button onClick={() => rejectRequest(req.id)}
                      className="p-2 rounded-full bg-destructive/20"><X className="w-4 h-4 text-destructive" /></button>
                  </div>
                </div>
              );
            })
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
    </div>
  );
};

export default Friends;
