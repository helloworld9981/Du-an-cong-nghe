import {
  MilestoneType,
  ProgressStatus,
} from "../models/contest-progress-reminder.model";

interface NotificationMessage {
  title: string;
  message: string;
}

type MessageConfig = Record<
  MilestoneType,
  Record<ProgressStatus, NotificationMessage>
>;

export const CONTEST_NOTIFICATION_MESSAGES: Record<string, any> = {
  25: {
    behind: {
      title: "📊 Progress Reminder",
      message:
        "You’ve only run {current}km/{target}km in the contest '{contest}'. You need {expected}km to stay on track! 💪",
    },
    on_track: {
      title: "👍 On the Right Track",
      message:
        "Great job! You’ve run {current}km/{target}km in '{contest}'. Keep it up!",
    },
    completed: {
      title: "🎉 Outstanding Completion!",
      message:
        "Amazing! You’ve completed {current}km, exceeding the {target}km goal in just 25% of the time! 🏆",
    },
  },
  50: {
    behind: {
      title: "⚠️ Progress Warning",
      message:
        "Half of the contest '{contest}' has passed! You’ve only completed {current}km/{target}km. Time to speed up! 🏃",
    },
    on_track: {
      title: "🎯 Halfway There!",
      message:
        "Halfway done! You’re doing great with {current}km/{target}km in '{contest}'!",
    },
    completed: {
      title: "🚀 Finished Ahead of Schedule!",
      message:
        "Excellent! You’ve completed the {target}km goal with only half the contest time used! 🌟",
    },
  },
  75: {
    behind: {
      title: "🔥 Almost Time’s Up!",
      message:
        "Only 25% of the contest time left for '{contest}'! You need {remaining}km more to reach your goal!",
    },
    on_track: {
      title: "🏁 Almost There!",
      message:
        "So close! Just {remaining}km left to reach the {target}km goal in '{contest}'!",
    },
    completed: {
      title: "🏆 Congratulations!",
      message:
        "You’ve successfully completed the {target}km goal in the contest '{contest}'! Outstanding! 🎊",
    },
  },
  DEFAULT: {
    behind: {
      title: "📊 Contest Update: {milestone}% Time Elapsed",
      message:
        "{milestone}% of the time has passed for '{contest}'. You have completed {current}km/{target}km. You need to pick up the pace to reach {expected}km! 🏃",
    },
    on_track: {
      title: "👍 On Track: {milestone}% Time Elapsed",
      message:
        "Great work! {milestone}% of the time has passed and you are on track with {current}km/{target}km in '{contest}'. Keep going!",
    },
    completed: {
      title: "🎉 Goal Reached!",
      message:
        "Fantastic! You have already completed the {target}km goal for '{contest}' with only {milestone}% of the time elapsed! 🏆",
    },
  },
};

interface MessageData {
  contest: string;
  current: number;
  target: number;
  expected: number;
  remaining: number;
  milestone: number;
}

export function formatNotificationMessage(
  template: NotificationMessage,
  data: MessageData,
): NotificationMessage {
  const format = (text: string) =>
    text
      .replace(/{contest}/g, data.contest)
      .replace(/{current}/g, data.current.toFixed(1))
      .replace(/{target}/g, data.target.toFixed(1))
      .replace(/{expected}/g, data.expected.toFixed(1))
      .replace(/{remaining}/g, Math.max(0, data.remaining).toFixed(1))
      .replace(/{milestone}/g, data.milestone.toString());

  return {
    title: format(template.title),
    message: format(template.message),
  };
}
