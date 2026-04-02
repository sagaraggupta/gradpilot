import { supabase } from './supabase';

export const logActivity = async (userId, actionType, description, prEarned = 0) => {
  if (!userId) return;
  
  await supabase.from('activity_logs').insert([{
    user_id: userId,
    action_type: actionType, // 'task_done', 'focus_session', 'streak_up'
    description: description,
    xp_earned: prEarned
  }]);
};