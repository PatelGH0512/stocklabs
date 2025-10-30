import { inngest } from "@/lib/inngest/client";
import { NEWS_SUMMARY_EMAIL_PROMPT, PERSONALIZED_WELCOME_EMAIL_PROMPT } from "@/lib/inngest/prompts";
import { sendNewsSummaryEmail, sendWelcomeEmail, sendStockAlertEmail } from "@/lib/nodemailer";
import { getAllUsersForNewsEmail } from "@/lib/actions/user.actions";
import { getWatchlistSymbolsByEmail } from "@/lib/actions/watchlist.actions";
import { getNews, getQuoteDetails } from "@/lib/actions/finnhub.actions";
import { getFormattedTodayDate } from "@/lib/utils";
import { connectToDatabase } from "@/database/mongoose";
import { Alert } from "@/database/models/alert.model";

export const sendSignUpEmail = inngest.createFunction(
  { id: "sign-up-email" },
  { event: "app/user.created" },
  async ({ event, step }) => {
    const userProfile = `
      - Country: ${(event as any).data.country}
      - Investment goals: ${(event as any).data.investmentGoals}
      - Risk tolerance: ${(event as any).data.riskTolerance}
      - Preferred industry: ${(event as any).data.preferredIndustry}
    `;

    const prompt = PERSONALIZED_WELCOME_EMAIL_PROMPT.replace("{{userProfile}}", userProfile);

    const response = await step.ai.infer("generate-welcome-intro", {
      model: step.ai.models.gemini({ model: "gemini-2.5-flash-lite" }),
      body: { contents: [{ role: "user", parts: [{ text: prompt }] }] },
    });

    await step.run("send-welcome-email", async () => {
      const part = response.candidates?.[0]?.content?.parts?.[0];
      const introText = (part && "text" in part ? (part as any).text : null) ||
        "Thanks for joining Signalist. You now have the tools to track markets and make smarter moves.";
      const {
        data: { email, name },
      } = event as any;
      return await sendWelcomeEmail({ email, name, intro: introText });
    });

    return { success: true, message: "Welcome email sent successfully" };
  }
);

export const sendDailyNewsSummary = inngest.createFunction(
  { id: "daily-news-summary" },
  [{ event: "app/send.daily.news" }, { cron: "0 12 * * *" }],
  async ({ step }) => {
    const users = await step.run("get-all-users", getAllUsersForNewsEmail);
    if (!users || (users as any[]).length === 0)
      return { success: false, message: "No users found for news email" };

    const results = await step.run("fetch-user-news", async () => {
      const perUser: any[] = [];
      for (const user of users as any[]) {
        try {
          const symbols = await getWatchlistSymbolsByEmail((user as any).email);
          let articles = await getNews(symbols);
          articles = (articles || []).slice(0, 6);
          if (!articles || articles.length === 0) {
            articles = await getNews();
            articles = (articles || []).slice(0, 6);
          }
          perUser.push({ user, articles });
        } catch (e) {
          console.error("daily-news: error preparing user news", (user as any)?.email, e);
          perUser.push({ user, articles: [] });
        }
      }
      return perUser;
    });

    const userNewsSummaries: any[] = [];
    for (const { user, articles } of results) {
      try {
        const prompt = NEWS_SUMMARY_EMAIL_PROMPT.replace(
          "{{newsData}}",
          JSON.stringify(articles, null, 2)
        );
        const response = await step.ai.infer(
          `summarize-news-${(user as any)?.email}`,
          {
            model: step.ai.models.gemini({ model: "gemini-2.5-flash-lite" }),
            body: { contents: [{ role: "user", parts: [{ text: prompt }] }] },
          }
        );
        const part = response.candidates?.[0]?.content?.parts?.[0];
        const newsContent =
          (part && "text" in part ? (part as any).text : null) || "No market news.";
        userNewsSummaries.push({ user, newsContent });
      } catch (e) {
        console.error("Failed to summarize news for : ", (user as any)?.email);
        userNewsSummaries.push({ user, newsContent: null });
      }
    }

    await step.run("send-news-emails", async () => {
      await Promise.all(
        userNewsSummaries.map(async ({ user, newsContent }: any) => {
          if (!newsContent) return false;
          return await sendNewsSummaryEmail({
            email: (user as any)?.email,
            date: getFormattedTodayDate(),
            newsContent,
          });
        })
      );
    });

    return { success: true, message: "Daily news summary emails sent successfully" };
  }
);

export const evaluateAlerts = inngest.createFunction(
  { id: "evaluate-alerts" },
  [{ event: "app/alert.created" }, { cron: "*/5 * * * *" }],
  async ({ event, step }) => {
    await step.run("connect-db", connectToDatabase);
    const alerts = await step.run("load-alerts", async () => {
      if ((event as any)?.name === "app/alert.created" && (event as any)?.data?.alertId) {
        const a = await Alert.findById((event as any).data.alertId).lean();
        return a ? [a] : [];
      }
      return await Alert.find({ active: true }).limit(200).lean();
    });

    if (!alerts || (alerts as any[]).length === 0)
      return { success: true, checked: 0, triggered: 0 };

    const symbols = Array.from(
      new Set((alerts as any[]).map((a: any) => String(a.symbol || "").toUpperCase()).filter(Boolean))
    );
    const quotesMap = await step.run("fetch-quotes", async () =>
      await getQuoteDetails(symbols)
    );

    let triggeredCount = 0;
    const now = new Date();
    const mongoose = await connectToDatabase();
    const db = mongoose.connection.db!;

    for (const a of alerts as any[]) {
      const q = (quotesMap as any)[a.symbol];
      if (!q || !Number.isFinite((q as any).current)) continue;

      const current = Number((q as any).current);
      const target = Number(a.value);
      const cond = String(a.condition);
      const freq = String(a.frequency || "daily");

      const approxEqual = Math.abs(current - target) <= 0.01;
      const isHit =
        cond === "above" ? current >= target : cond === "below" ? current <= target : approxEqual;
      if (!isHit) continue;

      const last = a.lastTriggered ? new Date(a.lastTriggered) : null;
      const sameDay = last && last.toDateString() === now.toDateString();
      const within15m = last && now.getTime() - last.getTime() < 15 * 60 * 1000;
      if (freq === "daily" && sameDay) continue;
      if (freq === "realtime" && within15m) continue;
      if (freq === "once" && a.triggered) continue;

      const user = await db
        .collection("user")
        .findOne({ id: a.userId }, { projection: { email: 1 } });
      const email = (user?.email as string | undefined) || undefined;
      if (!email) continue;

      const ts = now.toLocaleString("en-US", {
        year: "numeric",
        month: "numeric",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
      await step.run(`send-email-${a._id}`, async () => {
        await sendStockAlertEmail({
          email,
          condition: cond as any,
          symbol: a.symbol,
          company: a.company,
          targetPrice: target,
          currentPrice: current,
          timestamp: ts,
        });
      });

      triggeredCount++;
      const update: any = { $set: { lastTriggered: now } };
      if (freq === "once") {
        update.$set.active = false;
        update.$set.triggered = true;
      }
      await step.run(`update-alert-${a._id}`, async () => {
        await Alert.updateOne({ _id: a._id }, update);
      });
    }

    return { success: true, checked: (alerts as any[]).length, triggered: triggeredCount };
  }
);
