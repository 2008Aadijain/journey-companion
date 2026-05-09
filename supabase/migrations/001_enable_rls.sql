-- Enable Row Level Security on all tables
ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE check_in_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE check_ins ENABLE ROW LEVEL SECURITY;
ALTER TABLE direct_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE friend_group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE friend_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE friend_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

-- Profiles policies
-- Users can view all profiles (for public information)
CREATE POLICY "Profiles are viewable by everyone" ON profiles
  FOR SELECT USING (true);

-- Users can only update their own profile
CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = user_id);

-- Users can insert their own profile
CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- User preferences policies
-- Users can only view and manage their own preferences
CREATE POLICY "Users can view own preferences" ON user_preferences
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own preferences" ON user_preferences
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own preferences" ON user_preferences
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Friend requests policies
-- Users can view friend requests they sent or received
CREATE POLICY "Users can view own friend requests" ON friend_requests
  FOR SELECT USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

-- Users can create friend requests
CREATE POLICY "Users can create friend requests" ON friend_requests
  FOR INSERT WITH CHECK (auth.uid() = sender_id);

-- Users can update friend requests they received
CREATE POLICY "Users can update received friend requests" ON friend_requests
  FOR UPDATE USING (auth.uid() = receiver_id);

-- Matches policies
-- Users can view matches they are part of
CREATE POLICY "Users can view own matches" ON matches
  FOR SELECT USING (auth.uid() = user1_id OR auth.uid() = user2_id);

-- Only service role can create matches via application logic
CREATE POLICY "Service creates matches" ON matches
  FOR INSERT WITH CHECK (false);

-- Direct messages policies
-- Users can view messages in matches they are part of
CREATE POLICY "Users can view messages in own matches" ON direct_messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM matches
      WHERE matches.id = direct_messages.match_id
      AND (matches.user1_id = auth.uid() OR matches.user2_id = auth.uid())
    )
  );

-- Users can send messages in matches they are part of
CREATE POLICY "Users can send messages in own matches" ON direct_messages
  FOR INSERT WITH CHECK (
    auth.uid() = sender_id AND
    EXISTS (
      SELECT 1 FROM matches
      WHERE matches.id = direct_messages.match_id
      AND (matches.user1_id = auth.uid() OR matches.user2_id = auth.uid())
    )
  );

-- Recipients can mark messages as read (not senders)
CREATE POLICY "Recipients can update messages in own matches" ON direct_messages
  FOR UPDATE USING (
    auth.uid() != sender_id AND
    EXISTS (
      SELECT 1 FROM matches
      WHERE matches.id = direct_messages.match_id
      AND (matches.user1_id = auth.uid() OR matches.user2_id = auth.uid())
    )
  );

-- Friend groups policies
-- Users can view groups they created or are members of
CREATE POLICY "Users can view own groups" ON friend_groups
  FOR SELECT USING (
    auth.uid() = created_by OR
    EXISTS (
      SELECT 1 FROM friend_group_members
      WHERE friend_group_members.group_id = friend_groups.id
      AND friend_group_members.user_id = auth.uid()
    )
  );

-- Users can create groups
CREATE POLICY "Users can create groups" ON friend_groups
  FOR INSERT WITH CHECK (auth.uid() = created_by);

-- Friend group members policies
-- Users can view members of groups they are in
CREATE POLICY "Users can view members of own groups" ON friend_group_members
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM friend_groups
      WHERE friend_groups.id = friend_group_members.group_id
      AND (
        friend_groups.created_by = auth.uid() OR
        EXISTS (
          SELECT 1 FROM friend_group_members fgm
          WHERE fgm.group_id = friend_groups.id
          AND fgm.user_id = auth.uid()
        )
      )
    )
  );

-- Group creators can add members to their groups
CREATE POLICY "Group creators can add members" ON friend_group_members
  FOR INSERT WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (
      SELECT 1 FROM friend_groups
      WHERE friend_groups.id = friend_group_members.group_id
      AND friend_groups.created_by = auth.uid()
    )
  );

-- Group creators can manage members
CREATE POLICY "Group creators can manage members" ON friend_group_members
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM friend_groups
      WHERE friend_groups.id = friend_group_members.group_id
      AND friend_groups.created_by = auth.uid()
    )
  );

-- Group messages policies
-- Users can view messages in groups they are members of
CREATE POLICY "Users can view messages in own groups" ON group_messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM friend_group_members
      WHERE friend_group_members.group_id = group_messages.group_id
      AND friend_group_members.user_id = auth.uid()
    )
  );

-- Users can send messages to groups they are members of
CREATE POLICY "Users can send messages to own groups" ON group_messages
  FOR INSERT WITH CHECK (
    auth.uid() = sender_id AND
    EXISTS (
      SELECT 1 FROM friend_group_members
      WHERE friend_group_members.group_id = group_messages.group_id
      AND friend_group_members.user_id = auth.uid()
    )
  );

-- Check-ins policies
-- Users can view all check-ins (public feed)
CREATE POLICY "Check-ins are viewable by everyone" ON check_ins
  FOR SELECT USING (true);

-- Users can create their own check-ins
CREATE POLICY "Users can create own check-ins" ON check_ins
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own check-ins
CREATE POLICY "Users can update own check-ins" ON check_ins
  FOR UPDATE USING (auth.uid() = user_id);

-- Check-in reactions policies
-- Users can view all reactions
CREATE POLICY "Reactions are viewable by everyone" ON check_in_reactions
  FOR SELECT USING (true);

-- Users can create reactions on any check-in
CREATE POLICY "Users can create reactions" ON check_in_reactions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own reactions
CREATE POLICY "Users can update own reactions" ON check_in_reactions
  FOR UPDATE USING (auth.uid() = user_id);

-- Users can delete their own reactions
CREATE POLICY "Users can delete own reactions" ON check_in_reactions
  FOR DELETE USING (auth.uid() = user_id);

-- Achievements policies
-- Users can view all achievements (public)
CREATE POLICY "Achievements are viewable by everyone" ON achievements
  FOR SELECT USING (true);

-- Only system/service role can create achievements
CREATE POLICY "System creates achievements" ON achievements
  FOR INSERT WITH CHECK (false);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_preferences_user_id ON user_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_friend_requests_sender ON friend_requests(sender_id);
CREATE INDEX IF NOT EXISTS idx_friend_requests_receiver ON friend_requests(receiver_id);
CREATE INDEX IF NOT EXISTS idx_matches_users ON matches(user1_id, user2_id);
CREATE INDEX IF NOT EXISTS idx_direct_messages_match ON direct_messages(match_id);
CREATE INDEX IF NOT EXISTS idx_friend_groups_creator ON friend_groups(created_by);
CREATE INDEX IF NOT EXISTS idx_friend_group_members_group ON friend_group_members(group_id);
CREATE INDEX IF NOT EXISTS idx_check_ins_user ON check_ins(user_id);
CREATE INDEX IF NOT EXISTS idx_check_in_reactions_check_in ON check_in_reactions(check_in_id);
CREATE INDEX IF NOT EXISTS idx_achievements_user ON achievements(user_id);