import { supabase } from './supabaseClient';
import { format, subDays } from 'date-fns';

export const mcp = {
  call: async (functionName, data = {}) => {
    try {
      switch (functionName) {
        // --- AUTH ---
        case 'signUp': {
          const { email, password, name, role = 'user' } = data;
          const { data: authData, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
              data: { name, role },
            },
          });
          if (error) throw error;
          
          // Also insert into users table with role
          if (authData?.user) {
            const { error: userError } = await supabase
              .from('users')
              .upsert({
                user_id: authData.user.id,
                email: email.toLowerCase(),
                name: name,
                role: role,
              });
          }
          
          // If admin signup, add to admins table
          if (role === 'admin') {
            const normalizedEmail = email.toLowerCase();
            
            await supabase
              .from('admins')
              .insert([{ email: normalizedEmail }]);
          }
          
          return authData;
        }

        case 'signIn': {
          const { email, password } = data;
          const { data: authData, error } = await supabase.auth.signInWithPassword({
            email,
            password,
          });
          if (error) throw error;
          return authData;
        }

        case 'signOut': {
          const { error } = await supabase.auth.signOut();
          if (error) throw error;
          return true;
        }

        case 'getProfile': {
          const { data: { user } } = await supabase.auth.getUser();
          if (!user) return null;
          
          const normalizedEmail = user.email.toLowerCase();
          
          // Check admins table
          let isAdmin = false;
          try {
            const { data: adminCheck } = await supabase
              .from('admins')
              .select('email')
              .eq('email', normalizedEmail)
              .maybeSingle();
            
            isAdmin = adminCheck !== null;
          } catch (err) {
            // Silently handle error
          }
          
          // Get profile from users table
          const { data: profile, error } = await supabase
            .from('users')
            .select('*')
            .eq('user_id', user.id)
            .single();
          
          const profileIsAdmin = profile?.role === 'admin';
          
          return { 
            ...user, 
            profile: { 
              ...profile, 
              role: (isAdmin || profileIsAdmin) ? 'admin' : 'user' 
            } 
          };
        }

        // --- HABITS ---
        case 'getUserHabits': {
          const { data: { user } } = await supabase.auth.getUser();
          if (!user) return [];
          
          const { data: habits, error } = await supabase
            .from('habits')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false });
          if (error) throw error;
          return habits || [];
        }

        case 'createHabit': {
          const { title, daily_goal } = data;
          const { data: { user } } = await supabase.auth.getUser();
          if (!user) throw new Error('Not authenticated');
          
          const { data: newHabit, error } = await supabase
            .from('habits')
            .insert([{ 
              user_id: user.id, 
              title, 
              daily_goal: daily_goal || 1 
            }])
            .select()
            .single();
            
          if (error) throw error;
          return newHabit;
        }

        case 'deleteHabit': {
          const { habit_id } = data;
          const { error } = await supabase
            .from('habits')
            .delete()
            .eq('habit_id', habit_id);
          if (error) throw error;
          return true;
        }

        case 'updateHabit': {
          const { habit_id, title, daily_goal } = data;
          const { data: updatedHabit, error } = await supabase
            .from('habits')
            .update({ title, daily_goal: parseInt(daily_goal) || 1 })
            .eq('habit_id', habit_id)
            .select()
            .single();
             
          if (error) throw error;
          return updatedHabit;
        }

        // --- TRACKING ---
        case 'getTracking': {
          const { data: { user } } = await supabase.auth.getUser();
          if (!user) return [];
          
          const { date } = data;
          const { data: habits } = await supabase
            .from('habits')
            .select('habit_id')
            .eq('user_id', user.id);
            
          const habitIds = (habits || []).map(h => h.habit_id);
          if (habitIds.length === 0) return [];
          
          const { data: tracking, error } = await supabase
            .from('tracking')
            .select('*')
            .in('habit_id', habitIds)
            .eq('date', date);
          if (error) throw error;
          return tracking || [];
        }

        case 'trackHabit': {
          const { habit_id, date, status, notes } = data;
          
          const { data: existing } = await supabase
            .from('tracking')
            .select('tracking_id')
            .eq('habit_id', habit_id)
            .eq('date', date)
            .maybeSingle();

          if (existing) {
            const { data: updated, error } = await supabase
              .from('tracking')
              .update({ status: status || false, notes: notes || '' })
              .eq('tracking_id', existing.tracking_id)
              .select()
              .single();
            if (error) throw error;
            return updated;
          } else {
            const { data: inserted, error } = await supabase
              .from('tracking')
              .insert([{ 
                habit_id, 
                date, 
                status: status || false, 
                notes: notes || '' 
              }])
              .select()
              .single();
            if (error) throw error;
            return inserted;
          }
        }

        // --- GOALS ---
        case 'getUserGoals': {
          const { data: { user } } = await supabase.auth.getUser();
          if (!user) return [];
          
          const { data: goals, error } = await supabase
            .from('goals')
            .select('*')
            .eq('user_id', user.id)
            .order('deadline', { ascending: true });
          if (error) throw error;
          return goals || [];
        }

        case 'createGoal': {
          const { title, deadline } = data;
          const { data: { user } } = await supabase.auth.getUser();
          if (!user) throw new Error('Not authenticated');
          
          let formattedDeadline = null;
          if (deadline) {
            try {
              formattedDeadline = format(new Date(deadline), 'yyyy-MM-dd');
            } catch (e) {
              formattedDeadline = deadline;
            }
          }
          
          const { data: newGoal, error } = await supabase
            .from('goals')
            .insert([{ 
              user_id: user.id, 
              goal_title: title, 
              deadline: formattedDeadline 
            }])
            .select()
            .single();
            
          if (error) throw error;
          return newGoal;
        }

        case 'updateGoal': {
          const { goal_id, title, deadline } = data;
          let formattedDeadline = null;
          if (deadline) {
            try {
              formattedDeadline = format(new Date(deadline), 'yyyy-MM-dd');
            } catch (e) {
              formattedDeadline = deadline;
            }
          }
          
          const { data: updatedGoal, error } = await supabase
            .from('goals')
            .update({ goal_title: title, deadline: formattedDeadline })
            .eq('goal_id', goal_id)
            .select()
            .single();
             
          if (error) throw error;
          return updatedGoal;
        }

        case 'deleteGoal': {
          const { goal_id } = data;
          const { error } = await supabase
            .from('goals')
            .delete()
            .eq('goal_id', goal_id);
          if (error) throw error;
          return true;
        }

        // --- REPORTS ---
        case 'generateReport': {
          const { data: { user } } = await supabase.auth.getUser();
          if (!user) throw new Error('Not authenticated');
          
          const { data: habits } = await supabase.from('habits').select('habit_id').eq('user_id', user.id);
          const habitIds = (habits || []).map(h => h.habit_id);
          
          let totalDays = 30;
          let totalCompleted = 0;
          let totalEntries = 0;
          
          if (habitIds.length > 0) {
            const { data: allTracking } = await supabase
              .from('tracking')
              .select('status')
              .in('habit_id', habitIds);
            
            totalEntries = (allTracking || []).length;
            totalCompleted = (allTracking || []).filter(t => t.status === true).length;
          }
          
          const completion_rate = totalEntries > 0 
            ? Math.min(Math.round((totalCompleted / totalEntries) * 100), 100)
            : 0;
          
          const periodStart = format(subDays(new Date(), 30), 'yyyy-MM-dd');
          const periodEnd = format(new Date(), 'yyyy-MM-dd');
          const summary = JSON.stringify({
            completion_rate,
            total_entries: totalEntries,
            total_completed: totalCompleted,
            period: `Last 30 days`
          });
          
          const { data: newReport, error } = await supabase
            .from('reports')
            .insert([{
              user_id: user.id,
              summary,
            }])
            .select()
            .single();
            
          if (error) throw error;
          return newReport;
        }
        
        case 'getSavedReports': {
          const { data: { user } } = await supabase.auth.getUser();
          if (!user) return [];
          
          const { data: reports, error } = await supabase
            .from('reports')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false });
          if (error) throw error;
          return reports || [];
        }

        case 'getAnalyticsData': {
          const { data: { user } } = await supabase.auth.getUser();
          if (!user) return { trend: [], breakdown: [], overallStats: { totalTracked: 0, completionRate: 0, bestHabit: 'N/A' } };
          
          const { timeRange = 30 } = data;
          const today = new Date();
          const startDate = format(subDays(today, timeRange), 'yyyy-MM-dd');
          
          const { data: habits } = await supabase
            .from('habits')
            .select('habit_id, title, created_at')
            .eq('user_id', user.id);

          const allHabits = habits || [];
          const habitIds = allHabits.map(h => h.habit_id);
          
          const { data: allTracking } = habitIds.length > 0
            ? await supabase
                .from('tracking')
                .select('*')
                .in('habit_id', habitIds)
                .gte('date', startDate)
            : { data: [] };

          const trackingData = allTracking || [];
          
          const dailyMap = {};
          for (let i = timeRange - 1; i >= 0; i--) {
            const d = subDays(today, i);
            const dateStr = format(d, 'yyyy-MM-dd');
            dailyMap[dateStr] = { date: format(d, 'MMM d'), completed: 0 };
          }

          let totalDaysActive = 0;
          let totalDaysWithCompletion = new Set();

          // Find the earliest tracking date for this user
          const allTrackedDates = [...new Set(trackingData.map(t => t.date))].sort();
          const earliestDate = allTrackedDates.length > 0 ? allTrackedDates[0] : null;
          
          // Count ALL days from earliest tracking date (within time range)
          if (earliestDate) {
            let currentDate = new Date(earliestDate);
            const todayStr = format(today, 'yyyy-MM-dd');
            while (format(currentDate, 'yyyy-MM-dd') <= todayStr && dailyMap[format(currentDate, 'yyyy-MM-dd')]) {
              totalDaysActive++;
              currentDate = new Date(currentDate.getTime() + 24 * 60 * 60 * 1000);
            }
          }

          trackingData.forEach((t) => {
            if (dailyMap[t.date]) {
              if (t.status === true) {
                totalDaysWithCompletion.add(t.date);
                dailyMap[t.date].completed++;
              }
            }
          });

          const breakdown = allHabits.map((h) => {
            const habitTracking = trackingData.filter(t => t.habit_id === h.habit_id);
            
            // Count UNIQUE completed dates for this habit within time range
            const completedDatesSet = new Set(
              habitTracking.filter(t => t.status === true).map(t => t.date)
            );
            // Cap completed days at timeRange (can't complete more than days in range)
            const completedDays = Math.min(completedDatesSet.size, timeRange);
            
            // Total days = the time range constant (7, 14, 30, etc.)
            const totalDays = timeRange;
            
            const rate = totalDays > 0 
              ? Math.round((completedDays / totalDays) * 100)
              : 0;

            return {
              name: h.title.length > 15 ? h.title.slice(0, 15) + '...' : h.title,
              fullName: h.title,
              completed: completedDays,
              total: totalDays,
              rate: Math.min(rate, 100),
            };
          });
          
          // Calculate overall completion rate
          let totalPossible = allHabits.length * timeRange;
          
          // Count unique completed entries per habit
          const completedByHabit = {};
          trackingData.forEach(t => {
            if (t.status === true) {
              if (!completedByHabit[t.habit_id]) {
                completedByHabit[t.habit_id] = new Set();
              }
              completedByHabit[t.habit_id].add(t.date);
            }
          });
          
          let totalCompleted = 0;
          Object.values(completedByHabit).forEach(dates => {
            totalCompleted += dates.size;
          });
          
          const overallCompletionRate = totalPossible > 0 
            ? Math.round((totalCompleted / totalPossible) * 100) 
            : 0;

          const trend = Object.values(dailyMap).map((d) => {
            return {
              ...d,
              total: allHabits.length,
              rate: allHabits.length > 0 ? Math.round((d.completed / allHabits.length) * 100) : 0,
            };
          });

          const bestHabit = breakdown.length > 0 ? breakdown.sort((a, b) => b.rate - a.rate)[0] : null;

          return {
            trend,
            breakdown: breakdown.sort((a, b) => b.rate - a.rate),
            overallStats: {
              totalTracked: totalDaysWithCompletion.size,
              completionRate: overallCompletionRate,
              bestHabit: bestHabit?.fullName || 'N/A',
            }
          };
        }

        // --- DASHBOARD ---
        case 'getDashboardData': {
          const { data: { user } } = await supabase.auth.getUser();
          if (!user) return { 
            totalHabits: 0, completedToday: 0, streak: 0, 
            activeGoals: 0, weekData: [], todayRemaining: [], 
            heatmapData: [], quote: '' 
          };
          
          const { heatmapDays = 30 } = data;
          const today = format(new Date(), 'yyyy-MM-dd');
          
          const { data: habits } = await supabase
            .from('habits')
            .select('habit_id, title, daily_goal, created_at, tracking(*)')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false });

          const allHabits = habits || [];
          
          const todayTracking = allHabits.map((h) => {
            const todayEntry = (h.tracking || []).find((t) => t.date === today);
            return { 
              habit_id: h.habit_id, 
              title: h.title, 
              daily_goal: h.daily_goal,
              todayStatus: todayEntry?.status === true, 
              trackingId: todayEntry?.tracking_id 
            };
          });

          const completedToday = todayTracking.filter((h) => h.todayStatus).length;
          const todayRemaining = todayTracking.filter((h) => !h.todayStatus);

          // Calculate streak
          let streak = 0;
          if (allHabits.length > 0) {
            for (let i = 0; i < 365; i++) {
              const checkDate = format(subDays(new Date(), i), 'yyyy-MM-dd');
              const allCompleted = allHabits.every((h) =>
                (h.tracking || []).some((t) => t.date === checkDate && t.status === true)
              );
              if (allCompleted) streak++;
              else break;
            }
          }

          // Weekly data
          const weekData = [];
          for (let i = 6; i >= 0; i--) {
            const d = subDays(new Date(), i);
            const dateStr = format(d, 'yyyy-MM-dd');
            const dayLabel = format(d, 'EEE');
            let completed = 0;
            allHabits.forEach((h) => {
              if ((h.tracking || []).some((t) => t.date === dateStr && t.status === true)) {
                completed++;
              }
            });
            weekData.push({ day: dayLabel, completed, total: allHabits.length });
          }

          // Heatmap data (configurable days)
          const heatmapData = [];
          for (let i = heatmapDays - 1; i >= 0; i--) {
            const d = subDays(new Date(), i);
            const dateStr = format(d, 'yyyy-MM-dd');
            let completed = 0;
            allHabits.forEach((h) => {
              if ((h.tracking || []).some((t) => t.date === dateStr && t.status === true)) {
                completed++;
              }
            });
            const intensity = allHabits.length > 0 
              ? Math.min(Math.round((completed / allHabits.length) * 100), 100) 
              : 0;
            heatmapData.push({ date: dateStr, completed, intensity });
          }

          const { data: goals } = await supabase.from('goals').select('*').eq('user_id', user.id);

          // Static quotes
          const quotes = [
            { text: "The secret of getting ahead is getting started.", author: "Mark Twain" },
            { text: "Focus on being productive instead of busy.", author: "Tim Ferriss" },
            { text: "Small daily improvements are the key to staggering results.", author: "Robin Sharma" },
            { text: "The only way to do great work is to love what you do.", author: "Steve Jobs" },
            { text: "Success is the sum of small efforts repeated day in and day out.", author: "Robert Collier" },
          ];
          const randomQuote = quotes[Math.floor(Math.random() * quotes.length)];

          return {
            totalHabits: allHabits.length,
            completedToday,
            streak,
            activeGoals: (goals || []).length,
            weekData,
            todayRemaining,
            heatmapData,
            quote: randomQuote,
          };
        }

        // --- ADMIN ---
        case 'getAdminData': {
          const [usersRes, habitsRes, trackingRes, goalsRes] = await Promise.all([
            supabase.from('users').select('*').order('created_at', { ascending: false }),
            supabase.from('habits').select('*'),
            supabase.from('tracking').select('*'),
            supabase.from('goals').select('*')
          ]);

          const allHabits = habitsRes.data || [];
          const allTracking = trackingRes.data || [];
          const allGoals = goalsRes.data || [];

          const userActivity = (usersRes.data || []).map((u) => {
            const userHabits = allHabits.filter((h) => h.user_id === u.user_id);
            const userHabitIds = userHabits.map((h) => h.habit_id);
            const userTracking = allTracking.filter((t) => userHabitIds.includes(t.habit_id));
            const completed = userTracking.filter((t) => t.status === true).length;
            return {
              name: (u.name || u.email || 'Unknown').slice(0, 10),
              habits: userHabits.length,
              completed,
            };
          }).slice(0, 10);
          
          return {
            users: usersRes.data || [],
            totalUsers: usersRes.data?.length || 0,
            totalHabits: allHabits.length,
            totalTracking: allTracking.length,
            totalGoals: allGoals.length,
            userActivity,
          };
        }

        default:
          throw new Error(`Unknown MCP function: ${functionName}`);
      }
    } catch (err) {
      console.error(`MCP Error [${functionName}]:`, err.message);
      throw err;
    }
  }
};
